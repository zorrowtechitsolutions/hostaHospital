// src/components/Requests/RequestTable.jsx - With Server-Side Pagination & Optimistic Updates
import React, { useState, useMemo, useEffect } from "react";
import {
  Check,
  X,
  Calendar,
  Stethoscope,
  Filter,
  RefreshCcw,
  Download,
  Users as UsersIcon,
  Phone
} from "lucide-react";
import {
  Pagination,
  SearchBar
} from "../ui";
import ApproveRequestModal from "./ApproveRequestModel";
import RejectRequestModal from "./RejectRequestModel";
import { showSuccessToast, showErrorToast, showAddToast } from "../ui/Toast";
import {
  useGetBookingsQuery,
  useApproveBookingMutation,
  useRejectBookingMutation
} from "../../../app/service/request";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getS3ImageUrl } from "../../../app/service/S3";

import { registerBookingEvents } from '../../socket/bookingEvents';

// Import the export function
import { exportToExcel } from "../../utils/excelExport";

// Constants
const TOAST_DURATION = 3000;
const SUCCESS_DURATION = 4000;

const ICON_BUTTON_CLASS = "p-2 border border-gray-200 rounded-md bg-white transition-colors";
const CENTERED_FLEX_CLASS = "flex items-center justify-center gap-2";

// Helper functions
const calculateAge = (dob) => {
  if (!dob) return "N/A";
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// ✅ Transform bookings data - Explicit separation of IDs
const transformBookingsData = (bookingList) => {
  if (!bookingList || !Array.isArray(bookingList)) return [];

  return bookingList.map((booking, index) => {
    const databaseId = booking.id || booking._id;
    const patientImageKey = booking.patient_image || booking.patientImage || booking.avatar || null;

    const rawDate = booking.booking_date || booking.appointmentDate || "N/A";
    const rawTime = booking.open || booking.consulting_time || "N/A";

    return {
      id: databaseId,
      bookingNumber: booking.bookingNumber,
      formattedId: booking.bookingNumber
        ? `#BK${String(booking.bookingNumber).padStart(5, '0')}`
        : '#BK00000',
      patientId: `PT${String(booking.userId || index).padStart(4, "0")}`,
      patientName: booking.patient_name || booking.patientName || "N/A",
      age: calculateAge(booking.patient_dob || booking.dob),
      contact: booking.patient_phone || booking.contact || "N/A",
      doctorId: booking.doctorId,
      doctorName: booking.doctor_name || booking.doctorName || "N/A",
      department: booking.doctor_department || booking.department || "N/A",
      appointmentDate: rawDate === "N/A" ? "N/A" : rawDate.split("T")[0],
      consulting_time: rawTime,
      status: booking.status || "pending",
      patientImageKey: patientImageKey,
      reason: booking.reason || booking.notes || "N/A",
    };
  });
};

const resetFilters = (setters) => {
  setters.setSearchTerm('');
  setters.setDepartmentFilter('');
  setters.setDateFilter('');
  setters.setStatusFilter('');
  setters.setCurrentPage(1);
};

const matchesDoctor = (item, doctorId, doctorName) => {
  return item.doctorId === doctorId || item.doctorName === doctorName;
};

// Skeleton Loader Component
const SkeletonLoader = () => (
  <div className="flex-1 p-6 bg-[#F8F9FA] min-h-screen w-full overflow-x-hidden font-sans">
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <div className="h-7 w-32 bg-gray-200 rounded animate-pulse mt-2"></div>
    </div>

    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
      <div className="flex-1 max-w-md">
        <div className="h-10 w-full bg-gray-200 rounded-md animate-pulse"></div>
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="w-10 h-10 bg-gray-200 rounded-md animate-pulse"></div>
        ))}
      </div>
    </div>

    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
        <div className="h-5 w-40 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100">
            <tr>
              {[...Array(8)].map((_, i) => (
                <th key={i} className="px-6 py-3">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="border-b border-gray-100">
                {[...Array(8)].map((_, j) => (
                  <td key={j} className="px-6 py-4">
                    <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-4 border-t bg-gray-50">
        <div className="flex justify-between items-center">
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="flex gap-2">
            <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const RequestTable = ({ doctorId = null, doctorName = null }) => {
  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showAllData, setShowAllData] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal States
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Loading states
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  // ❌ REMOVED: const [eventsRegistered, setEventsRegistered] = useState(false);

  // ✅ Optimistic update state - track removed booking numbers
  const [removedRequestNumbers, setRemovedRequestNumbers] = useState(new Set());

  const removeFromPendingList = (bookingNumber) => {
    setRemovedRequestNumbers((prev) => {
      const next = new Set(prev);
      next.add(Number(bookingNumber));
      return next;
    });
  };

  // ✅ API Hooks - Server-side pagination with status fixed to "pending"
  const {
    data: bookingsResponse,
    isLoading: loading,
    refetch,
    isFetching
  } = useGetBookingsQuery({
    page: currentPage,
    limit: itemsPerPage,
    status: "pending",
    ...(searchTerm && searchTerm.trim().length >= 2 && { search_query: searchTerm }),
    ...(departmentFilter && { department: departmentFilter }),
    ...(dateFilter && { date: dateFilter }),
  });

  const [approveBooking] = useApproveBookingMutation();
  const [rejectBooking] = useRejectBookingMutation();

  // ✅ SINGLE socket registration effect (removed the duplicate)
  useEffect(() => {
    const cleanup = registerBookingEvents({
      onBookingRegistered: async () => {
        showSuccessToast("New booking registered!", 3000);
        await refetch();
      },
      onBookingUpdated: async () => {
        console.log("🔥 RequestTable BOOKING_UPDATED");
        showSuccessToast("Booking updated!", 3000);
        await refetch();
      },
      onBookingCancelled: async () => {
        showSuccessToast("Booking cancelled!", 3000);
        await refetch();
      },
      onBookingAccepted: async () => {
        showSuccessToast("Booking accepted!", 3000);
        await refetch();
      },
      onBookingCompleted: async () => {
        showSuccessToast("Booking completed!", 3000);
        await refetch();
      },
    });

    return cleanup;
  }, [refetch]);

  // ✅ Transform API response with DESCENDING sorting
  const safeData = useMemo(() => {
    const transformed = transformBookingsData(bookingsResponse?.data || []);

    const pendingOnly = transformed.filter(item =>
      item.status === "pending" ||
      item.status === "Pending" ||
      !item.status ||
      item.status?.toLowerCase() === "pending"
    );

    return [...pendingOnly].sort((a, b) => (b.bookingNumber || 0) - (a.bookingNumber || 0));
  }, [bookingsResponse]);

  const filteredBySearch = useMemo(() => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      return safeData;
    }

    const searchLower = searchTerm.toLowerCase().trim();

    return safeData.filter(item => {
      const searchFields = [
        item.formattedId?.toLowerCase() || '',
        item.patientName?.toLowerCase() || '',
        item.patientId?.toLowerCase() || '',
        item.contact?.toString() || '',
        item.doctorName?.toLowerCase() || '',
        item.department?.toLowerCase() || '',
        item.appointmentDate?.toString() || '',
        item.consulting_time?.toString() || ''
      ];

      return searchFields.some(field => field.includes(searchLower));
    });
  }, [safeData, searchTerm]);

  const filteredByDoctor = useMemo(() => {
    if (doctorId && !showAllData) {
      return filteredBySearch.filter(item =>
        matchesDoctor(item, doctorId, doctorName)
      );
    }
    return filteredBySearch;
  }, [filteredBySearch, doctorId, doctorName, showAllData]);

  const filteredByDepartmentAndDate = useMemo(() => {
    let result = filteredByDoctor;

    if (departmentFilter) {
      result = result.filter(item =>
        item.department?.toLowerCase() === departmentFilter.toLowerCase()
      );
    }

    if (dateFilter) {
      result = result.filter(item =>
        item.appointmentDate === dateFilter
      );
    }

    return result;
  }, [filteredByDoctor, departmentFilter, dateFilter]);

  const filteredRequests = useMemo(() => {
    return filteredByDepartmentAndDate.filter(
      (item) => !removedRequestNumbers.has(Number(item.bookingNumber))
    );
  }, [filteredByDepartmentAndDate, removedRequestNumbers]);

  const totalItems = bookingsResponse?.pagination?.totalItems ?? 0;
  const totalPages = bookingsResponse?.pagination?.totalPages ?? 0;

  const paginatedRequests = filteredRequests;

  const departments = useMemo(() => {
    let sourceData;
    if (doctorId && !showAllData) {
      sourceData = safeData.filter(item => matchesDoctor(item, doctorId, doctorName));
    } else {
      sourceData = safeData;
    }
    return [...new Set(sourceData.map(r => r.department).filter(Boolean))].sort();
  }, [safeData, doctorId, doctorName, showAllData]);

  const activeFilterCount = [departmentFilter, dateFilter, statusFilter, searchTerm].filter(Boolean).length;
  const hasSearchTerm = searchTerm && searchTerm.trim().length >= 2;
  const hasActiveFilters = departmentFilter !== '' || dateFilter !== '' || statusFilter !== '';

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, departmentFilter, dateFilter, showAllData]);

  useEffect(() => {
    setRemovedRequestNumbers(new Set());
  }, [bookingsResponse?.pagination?.currentPage, searchTerm, departmentFilter, dateFilter]);

  // Handlers
  const handleRefresh = () => {
    resetFilters({
      setSearchTerm,
      setDepartmentFilter,
      setDateFilter,
      setStatusFilter,
      setCurrentPage
    });
    setRemovedRequestNumbers(new Set());
    refetch();
    showSuccessToast("Refreshed requests", TOAST_DURATION);
  };

  const clearAllFilters = () => {
    resetFilters({
      setSearchTerm,
      setDepartmentFilter,
      setDateFilter,
      setStatusFilter,
      setCurrentPage
    });
    setRemovedRequestNumbers(new Set());
    showSuccessToast("All filters cleared", TOAST_DURATION);
  };

  const handleExport = () => {
    if (filteredRequests.length === 0) {
      showErrorToast("No data available to export", TOAST_DURATION);
      return;
    }

    try {
      const exportData = filteredRequests.map(req => ({
        'Request ID': req.formattedId,
        'Patient ID': req.patientId,
        'Patient Name': req.patientName,
        'Age': req.age,
        'Contact Number': req.contact,
        'Doctor Name': req.doctorName,
        'Department': req.department,
        'Appointment Date': req.appointmentDate !== "N/A" ? req.appointmentDate : "",
        'Consulting Time': req.consulting_time && req.consulting_time !== "N/A" ? req.consulting_time : "",
        'Status': req.status || "pending",
        'Reason/Notes': req.reason || "N/A"
      }));

      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `requests_export_${dateStr}`;

      exportToExcel({
        data: exportData,
        fileName: fileName,
        sheetName: "Pending Requests",
        columnWidth: 20
      });

      showSuccessToast(
        `Successfully exported ${exportData.length} requests to Excel!`,
        SUCCESS_DURATION
      );
    } catch (error) {
      console.error("Export error:", error);
      showErrorToast("Failed to export data. Please try again.", TOAST_DURATION);
    }
  };

  const handleApproveClick = (request) => {
    if (!request.bookingNumber) {
      showErrorToast("Invalid request: Missing booking number. Please refresh and try again.", TOAST_DURATION);
      return;
    }
    setSelectedRequest(request);
    setShowApproveModal(true);
  };

  const handleConfirmApprove = async (appointmentData) => {
    if (!selectedRequest) {
      showErrorToast("No request selected", TOAST_DURATION);
      return;
    }

    const bookingNumber = Number(selectedRequest.bookingNumber);

    if (!bookingNumber) {
      showErrorToast("Booking number is missing. Cannot approve.", TOAST_DURATION);
      closeApproveModal();
      return;
    }

    setIsApproving(true);

    try {
      console.log("✅ Approving booking:", {
        bookingNumber,
        formattedId: selectedRequest.formattedId,
        appointmentData,
      });

      await approveBooking({
        bookingNumber,
        data: {
          date: appointmentData.booking_date,
          consulting_time: appointmentData.consulting_time,
          token: appointmentData.token?.trim() || null,
          notes: appointmentData.notes || "",
        },
      }).unwrap();

      removeFromPendingList(bookingNumber);
      await refetch();

      const tokenDisplay = appointmentData.token?.trim() ? `#${appointmentData.token}` : 'Automatic';

      showSuccessToast(
        `Request ${selectedRequest.formattedId} approved successfully!`,
        SUCCESS_DURATION,
        {
          'Patient': selectedRequest.patientName,
          'Date': appointmentData.booking_date,
          'Time': appointmentData.consulting_time,
          'Token': tokenDisplay
        }
      );

      closeApproveModal();

    } catch (error) {
      console.error("❌ Approve error:", error);

      setRemovedRequestNumbers((prev) => {
        const next = new Set(prev);
        next.delete(bookingNumber);
        return next;
      });

      showErrorToast(
        error?.data?.message ||
        error?.message ||
        "Failed to approve request",
        TOAST_DURATION
      );
    } finally {
      setIsApproving(false);
    }
  };

  const handleRejectClick = (request) => {
    setSelectedRequest(request);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedRequest) {
      showErrorToast("No request selected", TOAST_DURATION);
      return;
    }

    const bookingNumber = Number(selectedRequest.bookingNumber);

    if (!bookingNumber) {
      showErrorToast("Booking number is missing. Cannot reject.", TOAST_DURATION);
      closeRejectModal();
      return;
    }

    setIsRejecting(true);

    try {
      console.log("❌ Rejecting booking:", {
        bookingNumber,
        formattedId: selectedRequest.formattedId,
        reason: rejectReason,
      });

      await rejectBooking({
        bookingNumber,
        data: {
          reason: rejectReason.trim(),
        },
      }).unwrap();

      removeFromPendingList(bookingNumber);
      await refetch();

      showSuccessToast(
        `Request ${selectedRequest.formattedId} rejected successfully!`,
        SUCCESS_DURATION,
        {
          'Patient': selectedRequest.patientName,
          'Doctor': selectedRequest.doctorName,
          'Reason': rejectReason.trim() || "No reason provided"
        }
      );

      closeRejectModal();

    } catch (error) {
      console.error("❌ Reject error:", error);

      setRemovedRequestNumbers((prev) => {
        const next = new Set(prev);
        next.delete(bookingNumber);
        return next;
      });

      showErrorToast(
        error?.data?.message ||
        error?.message ||
        "Failed to reject request",
        TOAST_DURATION
      );
    } finally {
      setIsRejecting(false);
    }
  };

  const toggleShowAllData = () => {
    setShowAllData(prev => !prev);
    setCurrentPage(1);
    setRemovedRequestNumbers(new Set());
    resetFilters({
      setSearchTerm,
      setDepartmentFilter,
      setDateFilter,
      setStatusFilter,
      setCurrentPage
    });
    if (!showAllData) {
      showSuccessToast(`Now showing all doctors' requests`, TOAST_DURATION);
    } else {
      showSuccessToast(`Now showing requests for ${doctorName}`, TOAST_DURATION);
    }
  };

  const closeApproveModal = () => {
    setShowApproveModal(false);
    setSelectedRequest(null);
  };

  const closeRejectModal = () => {
    setShowRejectModal(false);
    setSelectedRequest(null);
    setRejectReason('');
  };

  const showDoctorBanner = doctorId && !showAllData;

  if (loading) {
    return <SkeletonLoader />;
  }

  return (
    <div className="flex-1 p-6 bg-[#F8F9FA] min-h-screen w-full overflow-x-hidden font-sans">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-800">Requests</h1>
        <p className="text-sm text-gray-500">Home / Requests</p>
      </div>

      {/* Doctor Banner */}
      {showDoctorBanner && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm font-medium text-blue-800">
                Showing requests for: <span className="font-semibold">{doctorName}</span>
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Total requests: {totalItems}
              </p>
            </div>
            <button
              onClick={toggleShowAllData}
              className="px-3 py-1.5 text-sm bg-white border border-blue-300 text-blue-700 rounded-md hover:bg-blue-50 transition-colors"
            >
              Show All Doctors' Requests
            </button>
          </div>
        </div>
      )}

      {doctorId && showAllData && (
        <div className="mb-4 p-3 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Showing all doctors' requests</span>
              <span className="text-gray-500 ml-2">Total: {totalItems} requests</span>
            </p>
          </div>
          <button
            onClick={toggleShowAllData}
            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            ← Back to {doctorName}'s Requests
          </button>
        </div>
      )}

      {/* Search and Actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 w-full">
        <div className="flex-1 w-full lg:max-w-md">
          <SearchBar
            placeholder="Search by Patient ID, Name, or Contact..."
            value={searchTerm}
            onChange={setSearchTerm}
            onClear={() => setSearchTerm('')}
          />
          {searchTerm && searchTerm.length > 0 && searchTerm.length < 2 && (
            <span className="text-xs text-yellow-500 ml-2">Type at least 2 characters</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
          <button
            onClick={handleRefresh}
            className={ICON_BUTTON_CLASS}
            title="Refresh"
            disabled={isFetching}
          >
            <RefreshCcw size={16} className={isFetching ? "animate-spin" : ""} />
          </button>
          <button
            onClick={handleExport}
            className={ICON_BUTTON_CLASS}
            title="Export to Excel"
          >
            <Download size={16} />
          </button>
          <button
            onClick={() => setShowFilters(prev => !prev)}
            className={`relative ${ICON_BUTTON_CLASS} ${
              showFilters || activeFilterCount > 0 ? 'text-[#1C62A0] border-[#1C62A0]' : 'text-gray-500'
            }`}
            title="Toggle Filters"
          >
            <Filter size={16} />
            {activeFilterCount > 0 && !showFilters && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
              {activeFilterCount > 0 && (
                <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-md">
                  {activeFilterCount} Active Filter{activeFilterCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <button onClick={clearAllFilters} className="text-sm text-red-600 hover:text-red-700 font-medium">
              Clear All Filters
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full border border-gray-300 text-sm rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Appointment Date</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full border border-gray-300 text-sm rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 text-sm rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="cancel">Cancelled</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Request Table */}
      {filteredRequests.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {hasSearchTerm || hasActiveFilters ? 'No requests found' : 'No pending requests'}
          </h3>
          <p className="text-gray-500 mb-4">
            {hasSearchTerm
              ? `No results found for "${searchTerm}". Try adjusting your search.`
              : hasActiveFilters
              ? 'No requests match the selected filters. Try adjusting your filters.'
              : 'All requests have been processed.'}
          </p>
          {(hasSearchTerm || hasActiveFilters) && (
            <button
              onClick={clearAllFilters}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="w-full overflow-hidden">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
              <h2 className="text-sm font-semibold text-gray-700">
                Total Pending Requests
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded ml-2">
                  {filteredRequests.length}
                </span>
                {(hasSearchTerm || hasActiveFilters) && totalItems > 0 && (
                  <span className="text-xs text-gray-400 ml-2">
                    (Filtered)
                  </span>
                )}
              </h2>
            </div>

            <div className="flex flex-col min-h-[500px]">
              <div className="overflow-x-auto flex-1">
                <table className="min-w-[1200px] w-full text-sm text-left">
                  <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
                    <tr>
                      <th className="px-6 py-3">Request ID</th>
                      <th className="px-6 py-3">Patient Name</th>
                      <th className="px-6 py-3">Age</th>
                      <th className="px-6 py-3">Contact</th>
                      <th className="px-6 py-3">Doctor Name</th>
                      <th className="px-6 py-3">Department</th>
                      <th className="px-6 py-3">Appointment Date</th>
                      <th className="px-6 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedRequests.map((item, index) => (
                      <tr key={item.id || index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-[#1C62A0] font-medium">{item.formattedId}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage
                                src={getS3ImageUrl(item.patientImageKey)}
                                alt={item.patientName}
                                className="object-cover"
                              />
                              <AvatarFallback className="bg-gray-200 text-gray-600 text-sm font-medium">
                                {item.patientName?.charAt(0)?.toUpperCase() || "P"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-gray-800">{item.patientName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-gray-700">{item.age} yrs</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={CENTERED_FLEX_CLASS}>
                            <Phone size={14} className="text-gray-400" />
                            <span className="text-gray-700">{item.contact}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={CENTERED_FLEX_CLASS}>
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                              <Stethoscope size={12} className="text-blue-600" />
                            </div>
                            <span className="text-gray-700">{item.doctorName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">{item.department}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Calendar size={14} className="text-gray-400" />
                            {item.appointmentDate} {item.consulting_time && item.consulting_time !== "N/A" && item.consulting_time !== "--:--" && (
                              <>at {item.consulting_time}</>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={() => handleApproveClick(item)}
                              className="w-9 h-9 flex items-center justify-center rounded-lg border border-green-200 text-green-500 hover:bg-green-50 hover:border-green-300 transition-all"
                              title="Approve Request"
                            >
                              <Check size={18} />
                            </button>
                            <button
                              onClick={() => handleRejectClick(item)}
                              className="w-9 h-9 flex items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 transition-all"
                              title="Reject Request"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 0 && (
                <div className="mt-auto px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    itemLabel="pending requests"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && selectedRequest && (
        <ApproveRequestModal
          bookingId={selectedRequest.bookingNumber}
          requestData={selectedRequest}
          onClose={closeApproveModal}
          onConfirm={handleConfirmApprove}
          initialDate={selectedRequest.appointmentDate !== "N/A" ? selectedRequest.appointmentDate : ""}
          initialTime={selectedRequest.consulting_time && selectedRequest.consulting_time !== "N/A" ? selectedRequest.consulting_time : ""}
          initialToken=""
          isLoading={isApproving}
        />
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <RejectRequestModal
          bookingId={selectedRequest.bookingNumber}
          requestData={selectedRequest}
          onClose={closeRejectModal}
          onConfirm={handleConfirmReject}
          reason={rejectReason}
          setReason={setRejectReason}
          isLoading={isRejecting}
        />
      )}
    </div>
  );
};

export default RequestTable;