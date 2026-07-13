// src/components/visits/Visits.jsx - With Green Gradient Buttons & Socket Integration
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronRight, Plus, Filter, Download, MoreVertical, Eye, Edit, 
  Trash2, RefreshCcw, Search, Users as UsersIcon, PlayCircle
} from 'lucide-react';
import { 
  Button, Card, Table, TableHead, TableBody, TableRow, 
  TableHeader, TableCell, Badge, Avatar, SearchBar, 
  Pagination, Modal, Loader 
} from '../ui';
import DeleteModal from '../patients/DeleteModel';
import EditVisitModal from './EditVisitModal';
import AddVisitModal from './AddVisitModal';
import { useGetBookingsQuery, useDeleteBookingMutation } from '../../../app/service/request';
import { showSuccessToast, showErrorToast, showWarningToast } from '../ui/Toast';
import { Avatar as ShadcnAvatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getS3ImageUrl } from '../../../app/service/S3';
import { socket } from '../../socket/socket';
import { registerBookingEvents, unregisterBookingEvents } from '../../socket/bookingEvents';

// Import the export function
import { exportToExcel } from "../../utils/excelExport";

// Helper functions for date formatting
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  } catch (error) {
    return "N/A";
  }
};

const formatDateTime = (date, time) => {
  if (!date) return "N/A";
  
  try {
    const formattedDate = new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
    
    return `${formattedDate} ${time || ""}`.trim();
  } catch (error) {
    return "N/A";
  }
};

const Visits = () => {
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [visitToDelete, setVisitToDelete] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingVisit, setEditingVisit] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);
  const itemsPerPage = 10;

  const [eventsRegistered, setEventsRegistered] = useState(false);

  const { 
    data: bookingsResponse, 
    isLoading: loading, 
    refetch,
    isFetching 
  } = useGetBookingsQuery({
    status: "accepted",
    page: currentPage,
    limit: itemsPerPage,
    ...(searchTerm && { search_query: searchTerm }),
    ...(departmentFilter && { department: departmentFilter }),
    ...(dateFilter && { date: dateFilter })
  });

  const [deleteBooking] = useDeleteBookingMutation();

  // Register socket event listeners
  useEffect(() => {
    registerBookingEvents({
      onBookingRegistered: (data) => {
        showSuccessToast(`New booking received!`, 3000);
        refetch();
      },
      onBookingUpdated: (data) => {
        showSuccessToast(`Booking updated!`, 3000);
        refetch();
      },
      onBookingCancelled: (data) => {
        showWarningToast(`Booking cancelled!`, 3000);
        refetch();
      },
      onBookingAccepted: (data) => {
        showSuccessToast(`New visit added: ${data.patientName || 'Patient'}`, 3000);
        refetch();
      },
      onBookingCompleted: (data) => {
        showSuccessToast(`Visit completed!`, 3000);
        refetch();
      }
    });

    setEventsRegistered(true);

    return () => {
      unregisterBookingEvents();
      setEventsRegistered(false);
    };
  }, [refetch]);

  // Listen for socket connection
  useEffect(() => {
    const handleConnect = () => {
      if (!eventsRegistered) {
        registerBookingEvents({
          onBookingRegistered: (data) => {
            showSuccessToast(`New booking received!`, 3000);
            refetch();
          },
          onBookingUpdated: (data) => {
            showSuccessToast(`Booking updated!`, 3000);
            refetch();
          },
          onBookingCancelled: (data) => {
            showWarningToast(`Booking cancelled!`, 3000);
            refetch();
          },
          onBookingAccepted: (data) => {
            showSuccessToast(`New visit added!`, 3000);
            refetch();
          },
          onBookingCompleted: (data) => {
            showSuccessToast(`Visit completed!`, 3000);
            refetch();
          }
        });
        setEventsRegistered(true);
      }
    };

    socket.on("connect", handleConnect);

    return () => {
      socket.off("connect", handleConnect);
    };
  }, [refetch, eventsRegistered]);

  const totalItems = bookingsResponse?.pagination?.totalItems || 0;
  const totalPages = bookingsResponse?.pagination?.totalPages || 1;

  const allVisitsData = useMemo(() => {
    const bookingList =
      Array.isArray(bookingsResponse)
        ? bookingsResponse
        : bookingsResponse?.data ||
          bookingsResponse?.bookings ||
          bookingsResponse?.result ||
          [];

    const acceptedBookings = bookingList;

    return acceptedBookings.map((booking, index) => {
      const patientImageKey = booking.patient_image || booking.patientImage || booking.avatar || null;
      
      const tokenValue = 
        booking.token ||
        booking.appointment_token ||
        booking.booking_token ||
        booking.appointmentToken ||
        booking.approveData?.token ||
        "N/A";
      
      let actualPatientId = booking.patientId || booking.userId || index + 1;
      
      if (typeof actualPatientId === 'string' && actualPatientId.startsWith('#PT')) {
        const match = actualPatientId.match(/\d+/);
        actualPatientId = match ? parseInt(match[0]) : actualPatientId;
      }
      
      return {
        id: booking.id || booking._id,
        visitId: `#VIS${String(index + 1).padStart(4, "0")}`,
        patientName: booking.patient_name || booking.patientName || "N/A",
        patientId: actualPatientId,
        patientIdDisplay: `PT${String(actualPatientId).padStart(4, '0')}`,
        doctorName: booking.doctor_name || booking.displayName || booking.doctorName || "Doctor",
        department: booking.doctor_department || booking.department || "General",
        visitDate: booking.booking_date || booking.date || "",
        startTime: booking.consulting_time || booking.time || "",
        token: Number(tokenValue || ""),
        patientImageKey: patientImageKey,
        patientAvatar: patientImageKey || `https://randomuser.me/api/portraits/lego/${(index % 10) + 1}.jpg`,
        originalBooking: booking,
        status: booking.status || "accepted"
      };
    });
  }, [bookingsResponse]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, departmentFilter, dateFilter]);

  const handleRefresh = () => { 
    setSearchTerm(""); 
    setDepartmentFilter(""); 
    setDateFilter("");
    setCurrentPage(1); 
    refetch(); 
    showSuccessToast("Refreshed visits", 2000);
  };
  
  // Updated Export handler with Excel functionality (exactly like Appointments)
  const handleExport = () => {
    if (allVisitsData.length === 0) {
      showErrorToast("No data available to export", 3000);
      return;
    }

    try {
      // Transform data for Excel export
      const exportData = allVisitsData.map(visit => ({
        'Visit ID': visit.visitId,
        'Patient ID': visit.patientIdDisplay || visit.patientId,
        'Patient Name': visit.patientName,
        'Doctor Name': visit.doctorName,
        'Department': visit.department,
        'Visit Date': formatDate(visit.visitDate),
        'Start Time': visit.startTime || "N/A",
        'Token': visit.token || "N/A"
      }));

      // Generate filename with date
      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `visits_export_${dateStr}`;

      // Export to Excel with column width
      exportToExcel({
        data: exportData,
        fileName: fileName,
        sheetName: "Visits",
        columnWidth: 20
      });

      showSuccessToast(
        `Successfully exported ${exportData.length} visits to Excel!`,
        3000
      );
    } catch (error) {
      console.error("Export error:", error);
      showErrorToast("Failed to export data. Please try again.", 3000);
    }
  };
  
  // ✅ REMOVED: handleImport function
  
  const clearAllFilters = () => { 
    setDepartmentFilter(''); 
    setDateFilter('');
    setSearchTerm('');
    setCurrentPage(1);
    showSuccessToast("All filters cleared", 2000);
  };
  
  const getActiveFilterCount = () => {
    return (departmentFilter ? 1 : 0) + (dateFilter ? 1 : 0) + (searchTerm ? 1 : 0);
  };

  const handleViewDetails = (visit) => { 
    setSelectedVisit(visit); 
    setShowDetailsModal(true); 
  };
  
  const handleStartVisit = (visit) => {
    navigate('/appointments/consultation', { 
      state: { 
        visit, 
        patientName: visit.patientName, 
        patientId: visit.patientId, 
        doctorName: visit.doctorName, 
        department: visit.department, 
        visitDate: visit.visitDate,
        startTime: visit.startTime,
        token: visit.token
      } 
    });
  };
  
  const handleEditClick = (visit) => { 
    setEditingVisit(visit); 
    setShowEditModal(true); 
  };
  
  const handleSaveEdit = (updatedData) => {
    if (editingVisit) {
      socket.emit("booking_event", {
        event: "BOOKING_UPDATED",
        data: {
          bookingId: editingVisit.id,
          patientName: editingVisit.patientName,
          doctorName: editingVisit.doctorName,
          updatedData: updatedData,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    setShowEditModal(false);
    setEditingVisit(null);
    refetch();
    showSuccessToast("Visit updated successfully", 2000);
  };
  
  const handleAddVisit = (newVisit) => { 
    setShowAddModal(false); 
    refetch();
    showSuccessToast("Visit added successfully", 2000);
  };
  
  const handleDeleteClick = (visit) => { 
    setVisitToDelete(visit); 
    setShowDeleteModal(true); 
  };
  
  const handleConfirmDelete = async () => {
    if (!visitToDelete) return;
    
    setIsDeleting(true);
    
    try {
      await deleteBooking(visitToDelete.id).unwrap();
      
      socket.emit("booking_event", {
        event: "BOOKING_DELETED",
        data: {
          bookingId: visitToDelete.id,
          patientName: visitToDelete.patientName,
          doctorName: visitToDelete.doctorName,
          timestamp: new Date().toISOString()
        }
      });
      
      showErrorToast(
        `Visit ${visitToDelete.visitId} deleted successfully!`,
        4000,
        {
          'Patient': visitToDelete.patientName,
          'Doctor': visitToDelete.doctorName,
          'Date': visitToDelete.visitDate
        }
      );
      
      setShowDeleteModal(false);
      setVisitToDelete(null);
      refetch();
      
    } catch (error) {
      showErrorToast(error?.data?.message || 'Failed to delete visit. Please try again.', 4000);
      setShowDeleteModal(false);
      setVisitToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const VisitDetailsModal = ({ visit, onClose }) => {
    if (!visit) return null;
    return (
      <Modal isOpen={showDetailsModal} onClose={onClose} title="Approved Visit Details" size="lg">
        <div className="flex items-center gap-4 mb-6">
          <ShadcnAvatar className="w-12 h-12">
            <AvatarImage 
              src={getS3ImageUrl(visit.patientImageKey)} 
              alt={visit.patientName}
              className="object-cover"
            />
            <AvatarFallback className="bg-gray-200 text-gray-600 text-base font-medium">
              {visit.patientName?.charAt(0)?.toUpperCase() || "P"}
            </AvatarFallback>
          </ShadcnAvatar>
          <div>
            <h3 className="font-semibold text-gray-800 text-lg">{visit.patientName}</h3>
            <p className="text-sm text-gray-500">{visit.visitId}</p>
            <p className="text-xs text-gray-400">ID: {visit.patientId}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500">Doctor Name</label>
            <p className="text-sm text-gray-800">{visit.doctorName}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Department</label>
            <p className="text-sm text-gray-800">{visit.department}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Approved Date & Time</label>
            <p className="text-sm text-gray-800">{formatDateTime(visit.visitDate, visit.startTime)}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Token Number</label>
            <p className="text-sm font-mono font-bold text-blue-600">#{visit.token || 'N/A'}</p>
          </div>
        </div>
        <div className="flex gap-2 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose} fullWidth>Close</Button>
          <Button 
            variant="success" 
            onClick={() => { handleStartVisit(visit); onClose(); }} 
            fullWidth 
            icon={PlayCircle}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Start Visit
          </Button>
        </div>
      </Modal>
    );
  };

  const RowActionMenu = ({ visit }) => {
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
              onClick={() => { handleStartVisit(visit); setShowMenu(false); }} 
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-green-600 hover:bg-gray-100 rounded-t-lg"
            >
              <PlayCircle size={16} /> Start Visit
            </button>
            <button 
              onClick={() => { handleViewDetails(visit); setShowMenu(false); }} 
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Eye size={16} /> View Details
            </button>
            <div className="border-t border-gray-100 my-1"></div>
            <button 
              onClick={() => { handleDeleteClick(visit); setShowMenu(false); }} 
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 rounded-b-lg"
            >
              <Trash2 size={16} /> Delete
            </button>
          </div>
        )}
      </div>
    );
  };

  const activeFilterCount = getActiveFilterCount();

  const recentVisits = useMemo(() => {
    return allVisitsData.slice(0, 3).map(visit => ({
      id: visit.id,
      patientName: visit.patientName,
      patientId: visit.patientId,
      patientIdDisplay: visit.patientIdDisplay,
      patientImageKey: visit.patientImageKey,
      patientAvatar: visit.patientAvatar,
      visitDate: visit.visitDate,
      startTime: visit.startTime,
      doctorName: visit.doctorName,
      department: visit.department,
      token: visit.token
    }));
  }, [allVisitsData]);

  const getAllDepartments = () => {
    return [...new Set(allVisitsData.map(v => v.department).filter(Boolean))].sort();
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

      <div className="mb-8">
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="space-y-3 mb-4">
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="h-12 bg-gray-100"></div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 border-b border-gray-100">
            <div className="flex items-center px-6 py-4">
              <div className="flex-1"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div></div>
              <div className="flex-1"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div></div>
              <div className="flex-1"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div></div>
              <div className="flex-1"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div></div>
              <div className="flex-1"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div></div>
              <div className="flex-1"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div></div>
              <div className="flex-1"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return <SkeletonLoader />;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 font-sans">
      {/* Breadcrumb Navigation */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-200 rounded transition-colors">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="text-xs text-gray-500">
            <span className="text-gray-700">Visits</span>
            <span className="mx-1 text-gray-400">»</span>
            <span>Home</span>
            <span className="mx-1 text-gray-400">»</span>
            <span>Visits</span>
          </div>
        </div>
        <h1 className="text-xl font-bold text-gray-800">Visits</h1>
        <p className="text-sm text-gray-500 mt-1">
          Showing appointments that are ready for consultation
        </p>
      </div>

      {/* Search and Action Buttons Row */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="flex flex-1 gap-3 w-full lg:w-auto">
          {/* ✅ Replaced custom search input with SearchBar component */}
          <SearchBar
            placeholder="Search by Visit ID, Patient Name, Doctor, Token..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            onClear={() => {
              setSearchTerm('');
              setCurrentPage(1);
            }}
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
          {/* ✅ IMPORT BUTTON REMOVED */}
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

      {/* FILTER SECTION */}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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

      {/* Recent Visits Cards */}
      {recentVisits.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Visits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentVisits.map((visit) => (
              <div key={visit.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
                    <ShadcnAvatar className="w-12 h-12">
                      <AvatarImage 
                        src={getS3ImageUrl(visit.patientImageKey)} 
                        alt={visit.patientName}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-gray-200 text-gray-600 text-base font-medium">
                        {visit.patientName?.charAt(0)?.toUpperCase() || "P"}
                      </AvatarFallback>
                    </ShadcnAvatar>
                    <div>
                      <div className="font-semibold text-gray-900">{visit.patientName}</div>
                      <div className="text-xs text-gray-500">ID: {visit.patientId}</div>
                      <div className="text-xs text-gray-500">Token: #{visit.token || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Doctor</span>
                      <span className="text-sm font-medium text-gray-800">{visit.doctorName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Date & Time</span>
                      <span className="text-sm font-medium text-gray-800">
                        {formatDateTime(visit.visitDate, visit.startTime)}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <span className="text-sm font-medium text-gray-600">{visit.department}</span>
                    <button 
                      onClick={() => {
                        const fullVisit = allVisitsData.find(v => v.id === visit.id);
                        if (fullVisit) handleStartVisit(fullVisit);
                      }} 
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Start Visit →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visits Table */}
      {allVisitsData.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No visits found</h3>
          <p className="text-gray-500">No approved appointments yet. Approved requests will appear here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">
              Visits 
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded ml-2">{totalItems}</span>
            </h2>
          </div>

          <div className="flex flex-col min-h-[500px]">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
                  <tr>
                    <th className="px-6 py-3">Visit ID</th>
                    <th className="px-6 py-3">Patient</th>
                    <th className="px-6 py-3">Doctor</th>
                    <th className="px-6 py-3">Department</th>
                    <th className="px-6 py-3">Date & Time</th>
                    <th className="px-6 py-3">Token</th>
                    <th className="px-6 py-3 text-right w-16">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allVisitsData.map((visit, index) => (
                    <tr key={visit.id || index} className="hover:bg-gray-50 border-b border-gray-100">
                      <td className="px-6 py-4 text-[#1C62A0] font-medium">{visit.visitId}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <ShadcnAvatar className="w-8 h-8">
                            <AvatarImage 
                              src={getS3ImageUrl(visit.patientImageKey)} 
                              alt={visit.patientName}
                              className="object-cover"
                            />
                            <AvatarFallback className="bg-gray-200 text-gray-600 text-xs font-medium">
                              {visit.patientName?.charAt(0)?.toUpperCase() || "P"}
                            </AvatarFallback>
                          </ShadcnAvatar>
                          <div>
                            <span className="font-medium text-gray-800">{visit.patientName}</span>
                            <p className="text-xs text-gray-400">ID: {visit.patientId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{visit.doctorName}</td>
                      <td className="px-6 py-4 text-gray-600">{visit.department}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {formatDateTime(visit.visitDate, visit.startTime)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-mono font-bold bg-blue-100 text-blue-700">
                          #{visit.token || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <RowActionMenu visit={visit} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="px-6 py-3 bg-gray-50 rounded-b-xl border-t border-gray-200">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.max(1, totalPages)}
              onPageChange={handlePageChange}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              itemLabel="approved visits"
            />
          </div>
        </div>
      )}

      {/* Modals */}
      {showDetailsModal && selectedVisit && (
        <VisitDetailsModal visit={selectedVisit} onClose={() => setShowDetailsModal(false)} />
      )}
      
      <DeleteModal 
        isOpen={showDeleteModal} 
        onClose={() => { setShowDeleteModal(false); setVisitToDelete(null); }} 
        onConfirm={handleConfirmDelete} 
        title="Delete Visit" 
        message="Are you sure you want to delete this approved visit? This action cannot be undone." 
        itemName={visitToDelete?.visitId} 
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default Visits;