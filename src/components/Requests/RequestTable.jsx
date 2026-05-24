import React, { useState, useMemo, useEffect } from "react";
import {
  Check,
  X,
  Calendar,
  Stethoscope,
  Filter,
  RefreshCcw,
  Download,
  Upload,
  Users as UsersIcon,
  Phone
} from "lucide-react";
import {
  Card,
  Pagination,
  SearchBar
} from "../ui";
import ApproveRequestModal from "./ApproveRequestModel";
import RejectRequestModal from "./RejectRequestModel";
import { showSuccessToast, showWarningToast, showErrorToast, showAddToast } from "../ui/Toast";
import {
  useGetBookingsQuery,
  useApproveBookingMutation,
  useRejectBookingMutation
} from "../../../app/service/request";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getS3ImageUrl } from "../../../app/service/S3";

// Constants
const TOAST_DURATION = 3000;
const SUCCESS_DURATION = 4000;
const DEFAULT_AVATAR = "https://randomuser.me/api/portraits/lego/1.jpg";

const ICON_BUTTON_CLASS = "p-2 border border-gray-200 rounded-md bg-white transition-colors";
const CENTERED_FLEX_CLASS = "flex items-center justify-center gap-2";

// Helper functions
const formatRequestId = (id) => {
  if (!id) return '#REQ0000';
  let numericId;
  if (typeof id === 'string') {
    const match = id.match(/\d+/);
    numericId = match ? parseInt(match[0]) : parseInt(id) || 0;
  } else {
    numericId = parseInt(id) || 0;
  }
  return `#REQ${String(numericId).padStart(4, '0')}`;
};

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

// FIXED: Proper operator precedence for date and time extraction
// IMPORTANT: Keep field name as "time" (not consulting_time) to match display logic
const transformBookingsData = (bookingList) => {
  if (!bookingList || !Array.isArray(bookingList)) return [];

  return bookingList.map((booking, index) => {
    const DEFAULT_PROFILE_IMAGE = `https://randomuser.me/api/portraits/lego/${(index % 10) + 1}.jpg`;
    const bookingId = booking.id || booking._id;
    
    // Get patient image - check multiple possible fields
    const patientImageKey = booking.patient_image || booking.patientImage || booking.avatar || null;

    // Extract raw values first to avoid operator precedence issues
    const rawDate = booking.booking_date || booking.appointmentDate || "N/A";
const rawTime = booking.open || booking.consulting_time || booking.consulting_time || "N/A";

    return {
      id: bookingId,
      formattedId: formatRequestId(bookingId),
      patientId: `PT${String(booking.userId || index).padStart(4, "0")}`,
      patientName: booking.patient_name || booking.patientName || "N/A",
      age: calculateAge(booking.patient_dob || booking.dob),
      contact: booking.patient_phone || booking.contact || "N/A",
      gender: booking.gender || "Male",
      doctorId: booking.doctorId,
      doctorName: booking.doctor_name || booking.doctorName || "N/A",
      department: booking.doctor_department || booking.department || "N/A",
      appointmentDate: rawDate === "N/A" ? "N/A" : rawDate.split("T")[0],
      // IMPORTANT: Keep as "time" (not consulting_time) to match display logic
      consulting_time: rawTime,
      reason: booking.reason || "",
      status: booking.status || "pending",
      patientImageKey: patientImageKey,
      avatar: patientImageKey || DEFAULT_PROFILE_IMAGE,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
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
  <div className="min-h-screen bg-[#F8F9FA] p-6 font-sans">
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
        <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100">
            <tr>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                <th key={i} className="px-6 py-3">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="border-b border-gray-100">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((j) => (
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

  
  // Loading states for mutations
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  // API Hooks
  const {
    data: bookingsResponse,
    isLoading: loading,
    refetch,
    isFetching
  } = useGetBookingsQuery({
    status: "pending"
  });

  const [approveBooking] = useApproveBookingMutation();
  const [rejectBooking] = useRejectBookingMutation();

  // Modal close helpers
  const closeApproveModal = () => {
    setShowApproveModal(false);
    setSelectedRequest(null);
  };

  const closeRejectModal = () => {
    setShowRejectModal(false);
    setSelectedRequest(null);
    setRejectReason('');
  };

  // Transform API response with useMemo
  const safeData = useMemo(() => {
    return transformBookingsData(bookingsResponse?.data || []);
  }, [bookingsResponse]);

  // Get all unique departments
  const departments = useMemo(() => {
    let sourceData;
    if (doctorId && !showAllData) {
      sourceData = safeData.filter(item => matchesDoctor(item, doctorId, doctorName));
    } else {
      sourceData = safeData;
    }
    return [...new Set(sourceData.map(r => r.department).filter(Boolean))].sort();
  }, [safeData, doctorId, doctorName, showAllData]);

  // Filter requests based on all criteria
  const filteredRequests = useMemo(() => {
    let filtered;

    // Apply doctor filter
    if (doctorId && !showAllData) {
      filtered = safeData.filter(item => matchesDoctor(item, doctorId, doctorName));
    } else {
      filtered = [...safeData];
    }

    const normalizedSearch = searchTerm.toLowerCase();

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        (item.formattedId && item.formattedId.toLowerCase().includes(normalizedSearch)) ||
        (item.patientId && item.patientId.toLowerCase().includes(normalizedSearch)) ||
        (item.patientName && item.patientName.toLowerCase().includes(normalizedSearch)) ||
        (item.doctorName && item.doctorName.toLowerCase().includes(normalizedSearch)) ||
        (item.department && item.department.toLowerCase().includes(normalizedSearch)) ||
        (item.contact && item.contact.includes(searchTerm))
      );
    }

    // Apply department filter
    if (departmentFilter) {
      filtered = filtered.filter(item => item.department === departmentFilter);
    }

    // Apply date filter
    if (dateFilter) {
      filtered = filtered.filter(item => item.appointmentDate === dateFilter);
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    return filtered;
  }, [safeData, doctorId, doctorName, showAllData, searchTerm, departmentFilter, dateFilter, statusFilter]);

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRequests = filteredRequests.slice(startIndex, startIndex + itemsPerPage);

  const activeFilterCount = [departmentFilter, dateFilter, searchTerm, statusFilter].filter(Boolean).length;

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, departmentFilter, dateFilter, statusFilter, showAllData]);

  // Handlers
  const handleRefresh = () => {
    resetFilters({
      setSearchTerm,
      setDepartmentFilter,
      setDateFilter,
      setStatusFilter,
      setCurrentPage
    });
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
    showSuccessToast("All filters cleared", TOAST_DURATION);
  };

  const handleExport = () => {
    const exportData = filteredRequests.map(req => ({
      'Request ID': req.formattedId,
      'Patient ID': req.patientId,
      'Patient Name': req.patientName,
      'Age': req.age,
      'Contact Number': req.contact,
      'Doctor Name': req.doctorName,
      'Department': req.department,
      'Appointment Date': `${req.appointmentDate} at ${req.consulting_time}`,
      'Status': req.status,
      'Reason': req.reason
    }));

    const link = document.createElement('a');
    link.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    link.download = `requests_export_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    showSuccessToast(`Exported ${exportData.length} pending requests`, TOAST_DURATION);
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        const pendingImports = importedData.filter(item => item.status === "pending");
        showAddToast(`Successfully imported ${pendingImports.length} pending requests!`, SUCCESS_DURATION, {
          'Total': importedData.length,
          'Pending': pendingImports.length,
          'Other': importedData.length - pendingImports.length
        });
      } catch (error) {
        showErrorToast('Error parsing JSON file. Please check file format.', TOAST_DURATION);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleApproveClick = (request) => {
    if (!request.id) {
      showErrorToast("Invalid request: Missing ID. Please refresh and try again.", TOAST_DURATION);
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

    if (!selectedRequest.id) {
      showErrorToast("Request ID is missing. Cannot approve.", TOAST_DURATION);
      closeApproveModal();
      return;
    }

    setIsApproving(true);

    try {
      await approveBooking({
        id: selectedRequest.id,
        data: {
          date: appointmentData.date,
          consulting_time: appointmentData.consulting_time,
          token: appointmentData.token,
          notes: appointmentData.notes || ""
        }
      }).unwrap();

      showSuccessToast(
        `Request ${selectedRequest.formattedId} approved successfully!`,
        SUCCESS_DURATION,
        {
          'Patient': selectedRequest.patientName,
          'Date': appointmentData.date,
          'consulting_time': appointmentData.consulting_time,
          'Token': `#${appointmentData.token}`
        }
      );

      refetch();
      closeApproveModal();

    } catch (error) {
      showErrorToast(error?.data?.message || 'Failed to approve request', TOAST_DURATION);
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

    if (!selectedRequest.id) {
      showErrorToast("Request ID is missing. Cannot reject.", TOAST_DURATION);
      closeRejectModal();
      return;
    }

    setIsRejecting(true);

    try {
      await rejectBooking({
        id: selectedRequest.id,
        data: { reason: rejectReason }
      }).unwrap();

      showErrorToast(
        `Request ${selectedRequest.formattedId} rejected successfully!`,
        SUCCESS_DURATION,
        {
          'Patient': selectedRequest.patientName,
          'Doctor': selectedRequest.doctorName,
          'Reason': rejectReason || "No reason provided"
        }
      );

      refetch();
      closeRejectModal();

    } catch (error) {
      showErrorToast(error?.data?.message || 'Failed to reject request', TOAST_DURATION);
    } finally {
      setIsRejecting(false);
    }
  };

  const toggleShowAllData = () => {
    setShowAllData(prev => !prev);
    setCurrentPage(1);
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

  const showDoctorBanner = doctorId && !showAllData;

  if (loading) {
    return <SkeletonLoader />;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-800">Requests</h1>
        <p className="text-sm text-gray-500">Home / Requests</p>
      </div>

      {showDoctorBanner && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm font-medium text-blue-800">
                Showing requests for: <span className="font-semibold">{doctorName}</span>
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Total requests: {filteredRequests.length}
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
              <span className="text-gray-500 ml-2">Total: {filteredRequests.length} requests</span>
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

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="flex-1 max-w-md">
          <SearchBar
            placeholder="Search by Patient ID, Name, or Contact..."
            value={searchTerm}
            onChange={setSearchTerm}
            onClear={() => setSearchTerm('')}
          />
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <button
            onClick={handleRefresh}
            className={ICON_BUTTON_CLASS}
            title="Refresh"
            disabled={isFetching}
          >
            <RefreshCcw size={16} className={isFetching ? "animate-spin" : ""} />
          </button>
          <input type="file" onChange={handleImport} accept=".json" className="hidden" id="import-file" />
          <label htmlFor="import-file" className={`${ICON_BUTTON_CLASS} cursor-pointer`} title="Import Requests">
            <Upload size={16} />
          </label>
          <button
            onClick={handleExport}
            className={ICON_BUTTON_CLASS}
            title="Export Pending Requests"
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

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">
            Total Pending Requests
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded ml-2">
              {filteredRequests.length}
            </span>
          </h2>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your search or filter criteria</p>
            {activeFilterCount > 0 && (
              <button onClick={clearAllFilters} className="text-blue-600 hover:text-blue-700 text-sm">
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
                  <tr>
                    <th className="px-6 py-3">Request ID</th>
                    <th className="px-6 py-3">Patient ID</th>
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
                        <span className="text-gray-600">#{item.patientId}</span>
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
                          {/* FIXED: Uses item.consulting_time (not item.time) */}
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

            {/* REPLACED INLINE PAGINATION WITH REUSABLE COMPONENT */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={filteredRequests.length}
                  itemsPerPage={itemsPerPage}
                  itemLabel="pending requests"
                />
              </div>
            )}
          </>
        )}
      </Card>

      {/* Approve Modal */}
      {showApproveModal && selectedRequest && (
        <ApproveRequestModal
          bookingId={selectedRequest.id}
          requestData={selectedRequest}
          onClose={closeApproveModal}
          onConfirm={handleConfirmApprove}
          initialDate={selectedRequest.appointmentDate !== "N/A" ? selectedRequest.appointmentDate : ""}
          // FIXED: Uses item.consulting_time (not item.time)
          initialTime={selectedRequest.consulting_time && selectedRequest.consulting_time !== "N/A" ? selectedRequest.consulting_time : ""}          
          initialToken=""
          isLoading={isApproving}
        />
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <RejectRequestModal
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