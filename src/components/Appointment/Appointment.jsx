import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Filter, Download, MoreVertical, Eye, 
  Edit, Users as UsersIcon, RefreshCcw, Search, Trash2,
  PlayCircle, Check, X
} from 'lucide-react';
import { 
  Button, Pagination, SearchBar
} from '../ui';
import DeleteModal from '../patients/DeleteModel';
import EditAppointmentModal from '../patients/EditAppointmentModal';
import ApproveRequestModal from "../Requests/ApproveRequestModel";
import RejectRequestModal from "../Requests/RejectRequestModel";
import PermissionDeniedModal from '../ui/PermissionDeniedModal';
import { 
  useGetBookingsQuery,
  useApproveBookingMutation,
  useRejectBookingMutation,
  useDeleteBookingMutation
} from '../../../app/service/request';
import { showSuccessToast, showErrorToast, showWarningToast } from '../ui/Toast';
import { Avatar as ShadcnAvatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getS3ImageUrl } from '../../../app/service/S3';

import { socket } from '../../socket/socket';
import { registerBookingEvents, unregisterBookingEvents } from '../../socket/bookingEvents';

// Import the export function
import { exportToExcel } from "../../utils/excelExport";

// Import hasPermission for permission checks
import { hasPermission } from "../../utils/permission";

// Permission IDs for Booking module (33-36)
const PERMISSIONS = {
  CREATE: 33,
  VIEW: 34,
  EDIT: 35,
  DELETE: 36
};

const DEFAULT_PROFILE_IMAGE = (index) =>
  `https://randomuser.me/api/portraits/lego/${index}.jpg`;

// Helper function to safely convert to string for search
const safeToString = (value) => {
  if (value === null || value === undefined) return '';
  return String(value);
};

// Helper function to convert 24-hour time to 12-hour format with AM/PM
const convertTo12Hour = (time24h) => {
  if (!time24h || time24h === "N/A") return "";
  
  // If already in 12-hour format, return as is
  if (time24h.includes("AM") || time24h.includes("PM")) {
    return time24h;
  }
  
  const [hours, minutes] = time24h.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour === 0 ? 12 : (hour > 12 ? hour - 12 : hour);
  return `${hour12}:${minutes} ${ampm}`;
};

// ✅ FIXED: Calculate age from DOB with support for DD/MM/YYYY format
const calculateAge = (dob) => {
  if (!dob) return "N/A";

  let birthDate;

  // Check if DOB is in DD/MM/YYYY format (contains '/')
  if (typeof dob === "string" && dob.includes("/")) {
    const parts = dob.split("/");
    // Check if it's DD/MM/YYYY (day first)
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      
      // Validate the parts
      if (!day || !month || !year || isNaN(day) || isNaN(month) || isNaN(year)) {
        return "N/A";
      }
      
      // Create date with year, month-1 (0-indexed), day
      birthDate = new Date(year, month - 1, day);
    } else {
      birthDate = new Date(dob);
    }
  } else {
    birthDate = new Date(dob);
  }

  // Invalid date protection
  if (isNaN(birthDate.getTime())) {
    return "N/A";
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  // Ensure age is positive
  if (age < 0) return "N/A";
  
  return age;
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
        {[1, 2, 3, 4, 5].map((i) => (
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
              <th className="px-6 py-3"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div></th>
              <th className="px-6 py-3"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div></th>
              <th className="px-6 py-3"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div></th>
              <th className="px-6 py-3"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div></th>
              <th className="px-6 py-3"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div></th>
              <th className="px-6 py-3"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div></th>
              <th className="px-6 py-3"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div></th>
              <th className="px-6 py-3"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div></th>
              <th className="px-6 py-3"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div></th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="px-6 py-4"><div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div></td>
                <td className="px-6 py-4"><div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div></td>
                <td className="px-6 py-4"><div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div></td>
                <td className="px-6 py-4"><div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div></td>
                <td className="px-6 py-4"><div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div></td>
                <td className="px-6 py-4"><div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div></td>
                <td className="px-6 py-4"><div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div></td>
                <td className="px-6 py-4"><div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div></td>
                <td className="px-6 py-4"><div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div></td>
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

const Appointments = ({ doctorId = null, doctorName = null }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [appointmentToEdit, setAppointmentToEdit] = useState(null);
  const [appointmentToDelete, setAppointmentToDelete] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAllData, setShowAllData] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const itemsPerPage = 10;

  // Permission Denied Modal State
  const [showPermissionDenied, setShowPermissionDenied] = useState(false);
  const [permissionDeniedAction, setPermissionDeniedAction] = useState('');
  const [permissionDeniedPermissionId, setPermissionDeniedPermissionId] = useState(null);

  // API Hooks - Server-side pagination
  const { 
    data: bookingsResponse, 
    isLoading: loading, 
    refetch,
    isFetching
  } = useGetBookingsQuery({
    ...(statusFilter !== 'all' && { status: statusFilter.toLowerCase() }),
    ...(searchTerm && searchTerm.trim().length >= 2 && { search_query: searchTerm }),
    ...(departmentFilter && { department: departmentFilter }),
    ...(dateFilter && { date: dateFilter }),
    page: currentPage,
    limit: itemsPerPage
  });

  const [approveBooking] = useApproveBookingMutation();
  const [rejectBooking] = useRejectBookingMutation();
  const [deleteBooking] = useDeleteBookingMutation();

  // Register socket event listeners
  useEffect(() => {
    registerBookingEvents({
      onBookingRegistered: () => {
        showSuccessToast(`New booking received!`, 3000);
        refetch();
      },
      onBookingUpdated: () => {
        showSuccessToast(`Booking updated!`, 3000);
        refetch();
      },
      onBookingCancelled: () => {
        showWarningToast(`Booking cancelled!`, 3000);
        refetch();
      },
      onBookingAccepted: () => {
        showSuccessToast(`Booking accepted!`, 3000);
        refetch();
      },
      onBookingCompleted: () => {
        showSuccessToast(`Booking completed!`, 3000);
        refetch();
      }
    });

    return () => {
      unregisterBookingEvents();
    };
  }, [refetch]);

  // Helper functions
  const formatAppointmentId = (id) => {
    if (!id) return '#APT00000';
    let numericId;
    if (typeof id === 'string') {
      const match = id.match(/\d+/);
      numericId = match ? parseInt(match[0]) : parseInt(id) || 0;
    } else {
      numericId = parseInt(id) || 0;
    }
    return `#APT${String(numericId).padStart(4, '0')}`;
  };

  const mapStatus = (status) => {
    switch(status?.toLowerCase()) {
      case 'accepted':
        return 'Accepted';
      case 'pending':
        return 'Pending';
      case 'declined':
      case 'rejected':
      case 'cancel':
        return 'Cancelled';
      case 'completed':
        return 'Completed';
      default:
        return 'Pending';
    }
  };

  const getStatusBadgeClass = (displayStatus) => {
    const classes = {
      Accepted: "bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium",
      Pending: "bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-medium",
      Cancelled: "bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium",
      Completed: "bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium"
    };
    return classes[displayStatus] || classes.Pending;
  };

  const getBookingStatusBadgeClass = (bookingStatus) => {
    const classes = {
      "hospital booking": "bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium",
      "clinic booking": "bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs font-medium",
      "online booking": "bg-cyan-100 text-cyan-700 px-2 py-1 rounded-full text-xs font-medium"
    };
    return classes[bookingStatus?.toLowerCase()] || "bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium";
  };

  // Helper function to extract gender from multiple sources
  const extractGender = (booking) => {
    const gender = 
      booking?.patient_gender ||
      booking?.patient?.gender ||
      booking?.gender ||
      booking?.patientGender ||
      booking?.genderDisplay ||
      null;
    
    if (gender) {
      const normalized = gender.toLowerCase();
      if (normalized === 'male') return 'Male';
      if (normalized === 'female') return 'Female';
      if (normalized === 'other') return 'Other';
      return gender;
    }
    
    return null;
  };

  // ⭐ TRANSFORM BOOKINGS DATA - UPDATED WITH booking_date AND token
  const transformBookingsData = (bookingList) => {
    if (!bookingList || !Array.isArray(bookingList)) return [];

    return bookingList.map((booking, index) => {
      const formatDate = (dateString) => {
        if (!dateString || dateString === "N/A") return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
      };

      const displayStatus = mapStatus(booking.status);
      const patientImageKey = booking.patient_image || booking.patientImage || booking.avatar || null;
      
      // Get raw date from various possible sources
      const rawDate = booking.booking_date || booking.appointmentDate || booking.date || "";
      const actualPatientId = booking.patientId ||
        booking.patient?.id ||
        booking.patient?._id ||
        booking.patient_id ||
        booking.patientID;

      const extractedGender = extractGender(booking);
      const finalGender = extractedGender || "N/A";

      // ⭐ Get token from various possible sources
      const token = booking.token || booking.token_number || booking.tokenNumber || "";

      // ✅ FIXED: Use patient_age from API if available, otherwise calculate from DOB
      const calculatedAge = calculateAge(booking.patient_dob || booking.dob);
      const age = booking.patient_age ?? calculatedAge;

      return {
        id: booking.id || booking._id,
        formattedId: formatAppointmentId(booking.id || booking._id),
        
        patientId: actualPatientId,
        patientDisplayId: `#PT${String(actualPatientId || index + 1).padStart(4, '0')}`,
        patientName: booking.patient_name || booking.patientName || "N/A",
        bookingStatus: booking.booking_status || booking.bookingStatus || "N/A",
        age: age, // ✅ Now using patient_age from API with fallback
        contact: booking.patient_phone || booking.contact || "N/A",
        gender: finalGender,
        
        doctorId: booking.doctorId || booking.doctor?.id || booking.doctor_id || null,
        doctorName: booking.doctor_name || booking.doctorName || "N/A",
        department: booking.doctor_department || booking.department || "N/A",
        
        // ⭐ CRITICAL FIX: Keep RAW values for editing
        booking_date: rawDate,
        token: token,
        
        // Existing display fields
        appointmentDateDisplay: formatDate(rawDate),
        consulting_time: booking.consulting_time || booking.time || "N/A",
        
        status: displayStatus,
        statusClass: getStatusBadgeClass(displayStatus),
        reason: booking.reason || "",
        notes: booking.notes || "",
        
        patientImageKey: patientImageKey,
        originalStatus: booking.status || booking.booking_status || booking.bookingStatus || null,
        userId: booking.userId || booking.user_id || null,
        
        rawGender: booking.gender,
        patientGender: booking.patient_gender,
        patientGenderNested: booking.patient?.gender
      };
    });
  };

  // Get data from API response - ALL DATA (not just current page)
  // We need to fetch all data for frontend filtering
  const { 
    data: allBookingsResponse, 
    isLoading: allLoading
  } = useGetBookingsQuery({
    ...(statusFilter !== 'all' && { status: statusFilter.toLowerCase() }),
    ...(departmentFilter && { department: departmentFilter }),
    ...(dateFilter && { date: dateFilter }),
    page: 1,
    limit: 1000 // Get all data for filtering
  });

  const allBookingList = allBookingsResponse?.data || [];
  const allAppointmentsData = transformBookingsData(allBookingList);

  // ✅ FRONTEND SEARCH FILTERING - FALLBACK when API doesn't filter properly
  const filteredBySearch = useMemo(() => {
    // If no search term or search term is too short, return all data
    if (!searchTerm || searchTerm.trim().length < 2) {
      return allAppointmentsData;
    }

    const searchLower = searchTerm.toLowerCase().trim();
    
    return allAppointmentsData.filter(item => {
      const searchFields = [
        safeToString(item.formattedId).toLowerCase(),
        safeToString(item.patientName).toLowerCase(),
        safeToString(item.patientId).toLowerCase(),
        safeToString(item.contact).toLowerCase(),
        safeToString(item.doctorName).toLowerCase(),
        safeToString(item.department).toLowerCase(),
        safeToString(item.bookingStatus).toLowerCase(),
        safeToString(item.status).toLowerCase()
      ];

      return searchFields.some(field => field.includes(searchLower));
    });
  }, [allAppointmentsData, searchTerm]);

  // ✅ Apply department and date filters (frontend fallback)
  const filteredAppointments = useMemo(() => {
    let result = filteredBySearch;

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(item => 
        safeToString(item.status).toLowerCase() === statusFilter.toLowerCase() ||
        safeToString(item.originalStatus).toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Apply department filter
    if (departmentFilter) {
      result = result.filter(item => 
        safeToString(item.department).toLowerCase() === departmentFilter.toLowerCase()
      );
    }

    // Apply date filter
    if (dateFilter) {
      result = result.filter(item => {
        const visitDate = item.appointmentDateDisplay ? new Date(item.appointmentDateDisplay).toISOString().split('T')[0] : '';
        return visitDate === dateFilter;
      });
    }

    // Apply doctor filter
    if (doctorId && !showAllData) {
      result = result.filter(apt => 
        apt.doctorId === doctorId || apt.doctorName === doctorName
      );
    }

    return result;
  }, [filteredBySearch, statusFilter, departmentFilter, dateFilter, doctorId, doctorName, showAllData]);

  // ✅ Get total items from filtered results
  const totalFilteredItems = filteredAppointments.length;
  const totalFilteredPages = Math.ceil(totalFilteredItems / itemsPerPage);

  // ✅ Paginate the filtered results
  const paginatedAppointments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAppointments.slice(startIndex, endIndex);
  }, [filteredAppointments, currentPage, itemsPerPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, departmentFilter, dateFilter, showAllData]);

  // Get unique departments from API data
  const getAllDepartments = () => {
    const departments = [...new Set(allAppointmentsData.map(a => a.department).filter(Boolean))];
    return departments.sort();
  };

  // Check if any filters are active
  const hasSearchTerm = searchTerm && searchTerm.trim().length >= 2;
  const hasActiveFilters = statusFilter !== 'all' || departmentFilter !== '' || dateFilter !== '';

  // ✅ Search handler for SearchBar - receives value directly
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // ✅ Clear search handler
  const handleClearSearch = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Permission check helper with modal
  const checkPermission = (permissionId, actionName) => {
    if (!hasPermission(permissionId)) {
      setPermissionDeniedAction(actionName);
      setPermissionDeniedPermissionId(permissionId);
      setShowPermissionDenied(true);
      return false;
    }
    return true;
  };

  // Handlers
  const handleRefresh = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDepartmentFilter("");
    setDateFilter("");
    setCurrentPage(1);
    refetch();
    showSuccessToast("Refreshed appointments", 2000);
  };

  // Updated Export handler with Excel functionality
  const handleExport = () => {
    if (filteredAppointments.length === 0) {
      showErrorToast("No data available to export", 3000);
      return;
    }

    try {
      // Transform data for Excel export
      const exportData = filteredAppointments.map(apt => ({
        'Appointment ID': apt.formattedId,
        'Patient ID': apt.patientDisplayId || apt.patientId,
        'Patient Name': apt.patientName,
        'Contact': apt.contact,
        'Age': apt.age,
        'Gender': apt.gender,
        'Doctor Name': apt.doctorName,
        'Department': apt.department,
        'Appointment Date': apt.appointmentDateDisplay,
        'Consulting Time': convertTo12Hour(apt.consulting_time),
        'Booking Status': apt.bookingStatus,
        'Status': apt.status,
        'Original Status': apt.originalStatus || apt.status,
        'Reason': apt.reason || "N/A",
        'Notes': apt.notes || "N/A"
      }));

      // Generate filename with date
      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `appointments_export_${dateStr}`;

      // Export to Excel with column width
      exportToExcel({
        data: exportData,
        fileName: fileName,
        sheetName: "Appointments",
        columnWidth: 20
      });

      showSuccessToast(
        `Successfully exported ${exportData.length} appointments to Excel!`,
        3000
      );
    } catch (error) {
      console.error("Export error:", error);
      showErrorToast("Failed to export data. Please try again.", 3000);
    }
  };

  const handleStartConsultation = (appointment) => {
    // Check VIEW permission for consultation
    if (!checkPermission(PERMISSIONS.VIEW, 'start consultation')) {
      return;
    }
    navigate('/appointments/consultation', {
      state: {
        appointment,
        patientId: appointment.patientId || null,
        userId: appointment.userId || null,
        patientName: appointment.patientName,
        doctorName: appointment.doctorName,
        department: appointment.department,
        appointmentDate: appointment.appointmentDateDisplay,
        reason: appointment.reason,
        notes: appointment.notes,
        gender: appointment.gender,
        patient_gender: appointment.gender
      }
    });
  };

  const handleViewDetails = (appointment) => {
    // Check VIEW permission
    if (!checkPermission(PERMISSIONS.VIEW, 'view appointment details')) {
      return;
    }
    setSelectedRequest(appointment);
    setShowDetailsModal(true);
  };

  // ✅ UPDATED: Edit handler with status validation
  const handleEditClick = (appointment) => {
    // Edit is allowed only for accepted appointments
    if (appointment?.originalStatus?.toLowerCase() !== 'accepted') {
      showWarningToast(
        'Only accepted appointments can be edited.',
        3000
      );
      return;
    }

    // Check EDIT permission
    if (!checkPermission(PERMISSIONS.EDIT, 'edit appointment')) {
      return;
    }

    console.log("📝 [handleEditClick] Appointment data:", appointment);
    console.log("📝 [handleEditClick] booking_date:", appointment.booking_date);
    console.log("📝 [handleEditClick] token:", appointment.token);

    setAppointmentToEdit(appointment);
    setShowEditModal(true);
  };

  const handleApproveClick = (appointment) => {
    // Check EDIT permission (approving is an edit action)
    if (!checkPermission(PERMISSIONS.EDIT, 'approve appointment')) {
      return;
    }
    setSelectedRequest(appointment);
    setShowApproveModal(true);
  };

  const handleConfirmApprove = async (appointmentData) => {
    if (!selectedRequest) return;
    
    setIsApproving(true);
    
    try {
      let consultingTime = appointmentData.consulting_time;
      
      if (consultingTime.includes("AM") || consultingTime.includes("PM")) {
        const [time, modifier] = consultingTime.split(" ");
        let [hours, minutes] = time.split(":");
        
        if (hours === "12" && modifier === "AM") {
          hours = "00";
        } else if (hours === "12" && modifier === "PM") {
          hours = "12";
        } else if (modifier === "PM") {
          hours = String(parseInt(hours, 10) + 12);
        }
        consultingTime = `${hours.padStart(2, "0")}:${minutes}`;
      }
      
      await approveBooking({
        id: selectedRequest.id,
        data: {
          date: appointmentData.booking_date,
          consulting_time: consultingTime,
          token: appointmentData.token,
          notes: appointmentData.notes
        }
      }).unwrap();
      
      socket.emit("booking_event", {
        event: "BOOKING_ACCEPTED",
        data: {
          bookingId: selectedRequest.id,
          patientName: selectedRequest.patientName,
          doctorName: selectedRequest.doctorName,
          date: appointmentData.booking_date,
          consulting_time: appointmentData.consulting_time,
          token: appointmentData.token,
          timestamp: new Date().toISOString()
        }
      });
      
      showSuccessToast(
        `Appointment ${selectedRequest.formattedId} approved successfully!`,
        4000
      );
      
      await refetch();
    } catch (error) {
      showErrorToast(error?.data?.message || 'Failed to approve appointment', 3000);
    } finally {
      setIsApproving(false);
      setShowApproveModal(false);
      setSelectedRequest(null);
    }
  };

  const handleRejectClick = (appointment) => {
    // Check EDIT permission (rejecting is an edit action)
    if (!checkPermission(PERMISSIONS.EDIT, 'reject appointment')) {
      return;
    }
    setSelectedRequest(appointment);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedRequest) return;
    
    setIsRejecting(true);
    
    try {
      await rejectBooking({
        id: selectedRequest.id,
        data: { reason: rejectReason }
      }).unwrap();
      
      socket.emit("booking_event", {
        event: "BOOKING_CANCELLED",
        data: {
          bookingId: selectedRequest.id,
          patientName: selectedRequest.patientName,
          doctorName: selectedRequest.doctorName,
          reason: rejectReason,
          timestamp: new Date().toISOString()
        }
      });
      
      showErrorToast(
        `Appointment ${selectedRequest.formattedId} rejected successfully!`,
        4000
      );
      
      refetch();
    } catch (error) {
      showErrorToast(error?.data?.message || 'Failed to reject appointment', 3000);
    } finally {
      setIsRejecting(false);
      setShowRejectModal(false);
      setSelectedRequest(null);
      setRejectReason("");
    }
  };

  const handleSaveEdit = (updatedData) => {
    if (appointmentToEdit) {
      socket.emit("booking_event", {
        event: "BOOKING_UPDATED",
        data: {
          bookingId: appointmentToEdit.id,
          patientName: appointmentToEdit.patientName,
          doctorName: appointmentToEdit.doctorName,
          updatedData: updatedData,
          timestamp: new Date().toISOString()
        }
      });
    }
    setShowEditModal(false);
    setAppointmentToEdit(null);
    refetch();
  };

  const handleDeleteClick = (appointment) => {
    // Check DELETE permission
    if (!checkPermission(PERMISSIONS.DELETE, 'delete appointment')) {
      return;
    }
    setAppointmentToDelete(appointment);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!appointmentToDelete) return;
    
    setIsDeleting(true);
    
    try {
      await deleteBooking(appointmentToDelete.id).unwrap();
      
      socket.emit("booking_event", {
        event: "BOOKING_DELETED",
        data: {
          bookingId: appointmentToDelete.id,
          patientName: appointmentToDelete.patientName,
          doctorName: appointmentToDelete.doctorName,
          timestamp: new Date().toISOString()
        }
      });
      
      showErrorToast(
        `Appointment ${appointmentToDelete.formattedId} deleted successfully!`,
        4000
      );
      
      setShowDeleteModal(false);
      setAppointmentToDelete(null);
      refetch();
      
    } catch (error) {
      showErrorToast(error?.data?.message || 'Failed to delete appointment. Please try again.', 4000);
      setShowDeleteModal(false);
      setAppointmentToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const clearAllFilters = () => {
    setStatusFilter('all');
    setDepartmentFilter('');
    setDateFilter('');
    setSearchTerm('');
    setCurrentPage(1);
    refetch();
    showSuccessToast("All filters cleared", 2000);
  };

  const getActiveFilterCount = () => {
    return (statusFilter !== 'all' ? 1 : 0) + (departmentFilter ? 1 : 0) + (dateFilter ? 1 : 0) + (searchTerm ? 1 : 0);
  };

  const toggleShowAllData = () => {
    setShowAllData(!showAllData);
    setCurrentPage(1);
    setStatusFilter('all');
    setDepartmentFilter('');
    setSearchTerm('');
  };

  const showDoctorBanner = doctorId && !showAllData;
  const activeFilterCount = getActiveFilterCount();

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // AppointmentDetailsModal Component
  const AppointmentDetailsModal = ({ appointment, onClose }) => {
    if (!appointment) return null;
    
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white w-[520px] rounded-xl shadow-lg">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="text-lg font-semibold">Appointment Details</h2>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShadcnAvatar className="w-10 h-10">
                  <AvatarImage 
                    src={getS3ImageUrl(appointment.patientImageKey)} 
                    alt={appointment.patientName}
                  />
                  <AvatarFallback className="bg-gray-200 text-gray-600 text-sm font-medium">
                    {appointment.patientName?.charAt(0)?.toUpperCase() || "P"}
                  </AvatarFallback>
                </ShadcnAvatar>
                <div>
                  <p className="font-medium">{appointment.patientName}</p>
                  <p className="text-sm text-gray-500">Patient</p>
                </div>
              </div>
              <span className={appointment.statusClass}>{appointment.status}</span>
            </div>
            
            <div>
              <p className="font-medium text-sm mb-1">Date & Time</p>
              <p className="text-sm text-gray-500">{appointment.appointmentDateDisplay}, {convertTo12Hour(appointment.consulting_time)}</p>
            </div>
            
            <div>
              <p className="font-medium text-sm mb-1">Contact</p>
              <p className="text-sm text-gray-800">{appointment.contact}</p>
            </div>

            <div>
              <p className="font-medium text-sm mb-1">Gender</p>
              <p className="text-sm text-gray-800">{appointment.gender}</p>
            </div>
            
            <div>
              <p className="font-medium text-sm mb-1">Consultation With</p>
              <p className="text-sm font-medium">{appointment.doctorName}</p>
              <p className="text-sm text-gray-500">{appointment.department}</p>
            </div>
            
            <div>
              <p className="font-medium text-sm mb-1">Reason</p>
              <p className="text-sm text-gray-600">{appointment.reason || "No reason provided"}</p>
            </div>
          </div>
          <div className="flex justify-end gap-3 px-5 py-4 border-t">
            <button onClick={onClose} className="px-4 py-2 border rounded-md text-sm">Close</button>
            {appointment.originalStatus === 'pending' && (
              <>
                <button 
                  onClick={() => {
                    handleApproveClick(appointment);
                    onClose();
                  }} 
                  className="px-4 py-2 bg-green-600 text-white rounded-md text-sm"
                >
                  Approve
                </button>
                <button 
                  onClick={() => {
                    handleRejectClick(appointment);
                    onClose();
                  }} 
                  className="px-4 py-2 bg-red-600 text-white rounded-md text-sm"
                >
                  Reject
                </button>
              </>
            )}
            {appointment.originalStatus === 'accepted' && (
              <button 
                onClick={() => {
                  handleStartConsultation(appointment);
                  onClose();
                }} 
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-md shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Start Consultation
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ✅ UPDATED: RowActionMenu Component - Edit button only shows for accepted appointments
  const RowActionMenu = ({ appointment }) => {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);
    
    useEffect(() => {
      const handleClickOutside = (e) => {
        if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    
    return (
      <div className="relative inline-block" ref={menuRef}>
        <Button variant="ghost" size="sm" onClick={() => setShowMenu(!showMenu)} className="p-2">
          <MoreVertical size={18} />
        </Button>
        {showMenu && (
          <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <button 
              onClick={() => { handleViewDetails(appointment); setShowMenu(false); }} 
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg"
            >
              <Eye size={16} /> View Details
            </button>
            {appointment.originalStatus === 'accepted' && (
              <button 
                onClick={() => { handleStartConsultation(appointment); setShowMenu(false); }} 
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-green-600 hover:bg-gray-100"
              >
                <PlayCircle size={16} /> Start Consultation
              </button>
            )}
            {appointment.originalStatus === 'pending' && (
              <>
                <button 
                  onClick={() => { handleApproveClick(appointment); setShowMenu(false); }} 
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-green-600 hover:bg-gray-100"
                >
                  <Check size={16} /> Approve
                </button>
                <button 
                  onClick={() => { handleRejectClick(appointment); setShowMenu(false); }} 
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  <X size={16} /> Reject
                </button>
              </>
            )}
            <div className="border-t border-gray-100 my-1"></div>
            {/* ✅ Edit button only shows for accepted appointments */}
            {appointment.originalStatus === 'accepted' && (
              <button 
                onClick={() => { handleEditClick(appointment); setShowMenu(false); }} 
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-blue-600 hover:bg-gray-100"
              >
                <Edit size={16} /> Edit
              </button>
            )}
            <button 
              onClick={() => { handleDeleteClick(appointment); setShowMenu(false); }} 
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 rounded-b-lg"
            >
              <Trash2 size={16} /> Delete
            </button>
          </div>
        )}
      </div>
    );
  };

  // Loading state
  if (loading || allLoading) {
    return <SkeletonLoader />;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 font-sans">
      {/* Breadcrumb */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-200 rounded transition-colors">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="text-xs text-gray-500">
            <span className="text-gray-700">Appointments</span>
            <span className="mx-1 text-gray-400">»</span>
            <span>Home</span>
            <span className="mx-1 text-gray-400">»</span>
            <span>Appointments</span>
          </div>
        </div>
        <h1 className="text-xl font-bold text-gray-800">Appointments</h1>
        <p className="text-sm text-gray-500 mt-1">
          View and manage all appointments
        </p>
      </div>

      {/* Doctor Banner */}
      {showDoctorBanner && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm font-medium text-blue-800">
                Showing appointments for: <span className="font-semibold">{doctorName}</span>
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Total appointments: {filteredAppointments.length}
              </p>
            </div>
            <button
              onClick={toggleShowAllData}
              className="px-3 py-1.5 text-sm bg-white border border-blue-300 text-blue-700 rounded-md hover:bg-blue-50 transition-colors"
            >
              Show All Doctors' Appointments
            </button>
          </div>
        </div>
      )}

      {doctorId && showAllData && (
        <div className="mb-4 p-3 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Showing all doctors' appointments</span>
              <span className="text-gray-500 ml-2">Total: {filteredAppointments.length} appointments</span>
            </p>
          </div>
          <button
            onClick={toggleShowAllData}
            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            ← Back to {doctorName}'s Appointments
          </button>
        </div>
      )}

      {/* Search and Actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="flex flex-1 gap-3 w-full lg:w-auto">
          {/* ✅ SearchBar with proper handlers */}
          <SearchBar
            placeholder="Search by Appointment ID, Patient Name, Contact..."
            value={searchTerm}
            onChange={handleSearchChange}
            onClear={handleClearSearch}
            className="flex-1 max-w-sm"
          />
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <button 
            onClick={handleRefresh} 
            className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50"
            disabled={isFetching}
          >
            <RefreshCcw size={16} className={isFetching ? "animate-spin" : ""} />
          </button>
          <button onClick={handleExport} className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50" title="Export to Excel">
            <Download size={16} />
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`relative p-2 border border-gray-200 rounded-md bg-white ${
              showFilters || activeFilterCount > 0 ? 'text-[#1C62A0]' : 'text-gray-500'
            } hover:bg-gray-50`}
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
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center bg-gray-50">
                <Filter size={18} className="text-[#1C62A0]" />
              </div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-semibold text-gray-800">Filters</h2>
                {activeFilterCount > 0 && (
                  <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-md">
                    {activeFilterCount} Active Filter{activeFilterCount !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
            <button onClick={clearAllFilters} className="text-sm font-medium text-red-500 hover:text-red-600">
              Clear All Filters
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-12 px-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1C62A0] bg-white"
            >
              <option value="all">All Status</option>
              <option value="accepted">Accepted</option>
              <option value="pending">Pending</option>
              <option value="declined">Declined</option>
              <option value="completed">Completed</option>
              <option value="cancel">Cancelled</option>
            </select>

            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="h-12 px-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1C62A0] bg-white"
            >
              <option value="">All Departments</option>
              {getAllDepartments().map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="h-12 px-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1C62A0]"
            />
          </div>
        </div>
      )}

      {/* Appointments Table - WITH FRONTEND FILTERING */}
      {filteredAppointments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {hasSearchTerm || hasActiveFilters ? 'No appointments found' : 'No appointments available'}
          </h3>
          <p className="text-gray-500 mb-4">
            {hasSearchTerm 
              ? `No results found for "${searchTerm}". Try adjusting your search.`
              : hasActiveFilters
              ? 'No appointments match the selected filters. Try adjusting your filters.'
              : 'No appointments have been scheduled yet.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">
              Total Appointments 
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded ml-2">{totalFilteredItems}</span>
              {(hasSearchTerm || hasActiveFilters) && totalFilteredItems > 0 && (
                <span className="text-xs text-gray-400 ml-2">(Filtered)</span>
              )}
            </h2>
          </div>
          
          <div className="flex flex-col min-h-[500px]">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
                  <tr>
                    <th className="px-6 py-3">Appointment ID</th>
                    <th className="px-6 py-3">Patient Name</th>
                    <th className="px-6 py-3">Contact</th>
                    <th className="px-6 py-3">Doctor Name</th>
                    <th className="px-6 py-3">Department</th>
                    <th className="px-6 py-3">Appointment Date</th>
                    <th className="px-6 py-3">Booking Status</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right w-16">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAppointments.map((apt, index) => (
                    <tr key={apt.id || index} className="hover:bg-gray-50 border-b border-gray-100">
                      <td className="px-6 py-4 text-[#1C62A0] font-medium">{apt.formattedId}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <ShadcnAvatar className="w-8 h-8">
                            <AvatarImage 
                              src={getS3ImageUrl(apt.patientImageKey)} 
                              alt={apt.patientName}
                              className="object-cover"
                            />
                            <AvatarFallback className="bg-gray-200 text-gray-600 text-xs font-medium">
                              {apt.patientName?.charAt(0)?.toUpperCase() || "P"}
                            </AvatarFallback>
                          </ShadcnAvatar>
                          <span className="font-medium text-gray-800">{apt.patientName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{apt.contact}</td>
                      <td className="px-6 py-4 font-medium text-gray-800">{apt.doctorName}</td>
                      <td className="px-6 py-4 text-gray-600">{apt.department}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {apt.appointmentDateDisplay}
                        <br />
                        <span className="text-xs text-gray-400">{convertTo12Hour(apt.consulting_time)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getBookingStatusBadgeClass(apt.bookingStatus)}>
                          {apt.bookingStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={apt.statusClass}>{apt.status}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end">
                          <RowActionMenu appointment={apt} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalFilteredPages > 1 && (
              <div className="mt-auto px-6 py-4 bg-gray-50 border-t border-gray-200">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalFilteredPages}
                  onPageChange={handlePageChange}
                  totalItems={totalFilteredItems}
                  itemsPerPage={itemsPerPage}
                  itemLabel="appointments"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {showDetailsModal && selectedRequest && (
        <AppointmentDetailsModal 
          appointment={selectedRequest} 
          onClose={() => setShowDetailsModal(false)} 
        />
      )}

      {showApproveModal && selectedRequest && (
        <ApproveRequestModal 
          bookingId={selectedRequest.id}
          requestData={selectedRequest}
          onClose={() => { 
            setShowApproveModal(false); 
            setSelectedRequest(null); 
          }} 
          onConfirm={handleConfirmApprove}
          initialDate={selectedRequest.appointmentDateDisplay !== "N/A" ? selectedRequest.appointmentDateDisplay : ""}
          initialTime={selectedRequest.consulting_time !== "N/A" ? convertTo12Hour(selectedRequest.consulting_time) : ""}
          initialToken=""
          isLoading={isApproving}
        />
      )}
      
      {showRejectModal && selectedRequest && (
        <RejectRequestModal 
          onClose={() => { 
            setShowRejectModal(false); 
            setSelectedRequest(null); 
            setRejectReason(""); 
          }} 
          onConfirm={handleConfirmReject} 
          reason={rejectReason} 
          setReason={setRejectReason}
          isLoading={isRejecting}
        />
      )}

      <EditAppointmentModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setAppointmentToEdit(null);
        }}
        appointment={appointmentToEdit}
        patient={null}
        onSave={handleSaveEdit}
        allPatients={[]}
      />

      <DeleteModal 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
        onConfirm={handleConfirmDelete} 
        title="Delete Appointment" 
        message="Are you sure you want to delete this appointment? This action cannot be undone." 
        itemName={appointmentToDelete?.formattedId} 
        isDeleting={isDeleting}
      />

      {/* Permission Denied Modal */}
      <PermissionDeniedModal
        isOpen={showPermissionDenied}
        onClose={() => setShowPermissionDenied(false)}
        action={permissionDeniedAction}
        permissionId={permissionDeniedPermissionId}
      />
    </div>
  );
};

export default Appointments;