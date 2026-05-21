// src/components/visits/Visits.jsx - Added Status Filter
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronRight, Plus, Filter, Download, MoreVertical, Eye, Edit, 
  Trash2, RefreshCcw, Upload, Search, Users as UsersIcon, PlayCircle
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
import { showSuccessToast, showErrorToast } from '../ui/Toast';

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
  const [statusFilter, setStatusFilter] = useState(''); // NEW: Status filter state
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);
  const itemsPerPage = 10;

  // API Hooks - hospitalId is automatically injected by the API service
  const { 
    data: bookingsResponse, 
    isLoading: loading, 
    refetch,
    isFetching 
  } = useGetBookingsQuery({
    status: "accepted" // Only fetch approved appointments
  });

  // Delete booking mutation
  const [deleteBooking] = useDeleteBookingMutation();

  // Clean mapping - ONLY approved fields with proper API response handling
  const visitsData = useMemo(() => {
    // FIX: Properly extract booking list from response
    const bookingList =
      Array.isArray(bookingsResponse)
        ? bookingsResponse
        : bookingsResponse?.data ||
          bookingsResponse?.bookings ||
          bookingsResponse?.result ||
          [];

    console.log("BOOKINGS RESPONSE:", bookingsResponse);
    console.log("BOOKING LIST:", bookingList);

    // Filter only accepted bookings (already filtered by API, but double-check)
    const acceptedBookings = bookingList.filter(
      (booking) => booking.status?.toLowerCase() === "accepted"
    );

    console.log("ACCEPTED BOOKINGS:", acceptedBookings);

    return acceptedBookings.map((booking, index) => ({
      id: booking.id || booking._id,
      visitId: `#VIS${String(index + 1).padStart(4, "0")}`,
      patientName: booking.patient_name || booking.patientName || "N/A",
      patientId: booking.patientId || `#PT${String(booking.userId || index + 1).padStart(4, "0")}`,
      doctorName: booking.doctor_name || booking.displayName || booking.doctorName || "Doctor",
      department: booking.doctor_department || booking.department || "General",
      
      // FIX: Correct field mapping for approved data
      visitDate: booking.booking_date || booking.date || "",
      startTime: booking.consulting_time || booking.time || "",
      token: booking.token ?? booking.appointment_token ?? "N/A",
      
      status: booking.consultation_status === "completed"
        ? "Complete"
        : booking.consultation_status === "ongoing"
        ? "In Progress"
        : "Pending",
      patientAvatar: booking.avatar || `https://randomuser.me/api/portraits/lego/${(index % 10) + 1}.jpg`,
      originalBooking: booking
    }));
  }, [bookingsResponse]);

  // Recent approved visits (first 3 from the list)
  const recentVisits = useMemo(() => {
    return visitsData.slice(0, 3).map(visit => ({
      id: visit.id,
      patientName: visit.patientName,
      patientId: visit.patientId,
      patientAvatar: visit.patientAvatar,
      visitDate: visit.visitDate,
      startTime: visit.startTime,
      doctorName: visit.doctorName,
      department: visit.department,
      token: visit.token,
      status: visit.status
    }));
  }, [visitsData]);

  // Get unique departments from visits data
  const getAllDepartments = () => {
    return [...new Set(visitsData.map(v => v.department).filter(Boolean))].sort();
  };

  // NEW: Get unique statuses from visits data
  const getAllStatuses = () => {
    return [...new Set(visitsData.map(v => v.status).filter(Boolean))].sort();
  };

  const getFilteredVisits = () => {
    let filtered = [...visitsData];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(visit => 
        visit.visitId?.toLowerCase().includes(term) ||
        visit.patientId?.toLowerCase().includes(term) ||
        visit.patientName?.toLowerCase().includes(term) ||
        visit.doctorName?.toLowerCase().includes(term) ||
        visit.department?.toLowerCase().includes(term) ||
        visit.token?.toLowerCase().includes(term)
      );
    }
    
    if (departmentFilter) {
      filtered = filtered.filter(visit => visit.department === departmentFilter);
    }
    
    // NEW: Status filter
    if (statusFilter) {
      filtered = filtered.filter(visit => visit.status === statusFilter);
    }
    
    if (dateFilter) {
      filtered = filtered.filter(visit => visit.visitDate === dateFilter);
    }
    
    return filtered;
  };

  const filteredVisits = getFilteredVisits();
  const totalPages = Math.ceil(filteredVisits.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedVisits = filteredVisits.slice(startIndex, startIndex + itemsPerPage);

  // Reset page when filters change (UPDATED: added statusFilter)
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, departmentFilter, statusFilter, dateFilter]);

  const handleRefresh = () => { 
    setSearchTerm(""); 
    setDepartmentFilter(""); 
    setStatusFilter(""); // NEW: Reset status filter
    setDateFilter("");
    setCurrentPage(1); 
    refetch(); 
    showSuccessToast("Refreshed visits", 2000);
  };
  
  const handleExport = () => {
    const exportData = getFilteredVisits().map(visit => ({ 
      'Visit ID': visit.visitId,
      'Patient ID': visit.patientId,
      'Patient Name': visit.patientName,
      'Doctor Name': visit.doctorName,
      'Department': visit.department,
      'Date': formatDate(visit.visitDate),
      'Time': visit.startTime,
      'Token': visit.token,
      'Status': visit.status
    }));
    
    const link = document.createElement('a');
    link.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    link.download = `approved_visits_export_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    showSuccessToast(`Exported ${exportData.length} visits`, 2000);
  };
  
  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        showSuccessToast(`Successfully imported ${importedData.length} visits!`, 3000);
        refetch();
      } catch (error) { 
        showErrorToast('Error parsing JSON file. Please make sure it\'s a valid JSON file.', 3000);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };
  
  const clearAllFilters = () => { 
    setDepartmentFilter(''); 
    setStatusFilter(''); // NEW: Clear status filter
    setDateFilter('');
    setSearchTerm('');
    showSuccessToast("All filters cleared", 2000);
  };
  
  const getActiveFilterCount = () => {
    return (departmentFilter ? 1 : 0) + (statusFilter ? 1 : 0) + (dateFilter ? 1 : 0) + (searchTerm ? 1 : 0);
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
  
  // FIXED: Delete handler with RED toast on success
  const handleConfirmDelete = async () => {
    if (!visitToDelete) return;
    
    setIsDeleting(true);
    
    try {
      // Call the delete booking API
      await deleteBooking(visitToDelete.id).unwrap();
      
      // Show RED toast on success (using showErrorToast)
      showErrorToast(
        `Visit ${visitToDelete.visitId} deleted successfully!`,
        4000,
        {
          'Patient': visitToDelete.patientName,
          'Doctor': visitToDelete.doctorName,
          'Date': visitToDelete.visitDate
        }
      );
      
      // Close modal and clear state
      setShowDeleteModal(false);
      setVisitToDelete(null);
      
      // Auto-refresh via RTK Query (invalidatesTags handles it)
      
    } catch (error) {
      console.error('Delete error:', error);
      // Show RED toast on failure too
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
          <img 
            src={visit.patientAvatar || 'https://randomuser.me/api/portraits/lego/1.jpg'} 
            alt={visit.patientName} 
            className="w-12 h-12 rounded-full object-cover" 
          />
          <div>
            <h3 className="font-semibold text-gray-800 text-lg">{visit.patientName}</h3>
            <p className="text-sm text-gray-500">{visit.visitId}</p>
            <p className="text-xs text-gray-400">Patient ID: {visit.patientId}</p>
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
          <div>
            <label className="block text-xs font-medium text-gray-500">Status</label>
            <Badge variant="success">{visit.status}</Badge>
          </div>
        </div>
        <div className="flex gap-2 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose} fullWidth>Close</Button>
          <Button variant="success" onClick={() => { handleStartVisit(visit); onClose(); }} fullWidth icon={PlayCircle}>Start Visit</Button>
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
      <div className="relative" ref={menuRef}>
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
              {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                <div key={j} className="flex-1">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
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
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="p-1">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Button>
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
        <div className="flex-1 max-w-md">
          <SearchBar 
            placeholder="Search by Visit ID, Patient ID, Patient Name, Doctor, Token..." 
            value={searchTerm} 
            onChange={setSearchTerm} 
            onClear={() => setSearchTerm('')} 
          />
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <Button variant="outline" size="sm" onClick={handleRefresh} title="Refresh" disabled={isFetching}>
            <RefreshCcw size={16} className={isFetching ? "animate-spin" : ""} />
          </Button>
          <input type="file" onChange={handleImport} accept=".json" className="hidden" id="import-file" />
          <label htmlFor="import-file" className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50 cursor-pointer" title="Import">
            <Upload size={16} />
          </label>
          <Button variant="outline" size="sm" onClick={handleExport} title="Export">
            <Download size={16} />
          </Button>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Department Filter */}
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

            {/* NEW: Status Filter */}
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)} 
              className="h-12 px-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1C62A0] bg-white"
            >
              <option value="">All Status</option>
              {getAllStatuses().map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>

            {/* Date Filter */}
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
              <Card key={visit.id} hover className="overflow-hidden">
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
                    <img 
                      src={visit.patientAvatar} 
                      alt={visit.patientName} 
                      className="w-12 h-12 rounded-full object-cover" 
                    />
                    <div>
                      <div className="font-semibold text-gray-900">{visit.patientName}</div>
                      <div className="text-xs text-gray-500">Patient ID: {visit.patientId}</div>
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
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Status</span>
                      <Badge variant="success">{visit.status}</Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <span className="text-sm font-medium text-gray-600">{visit.department}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        const fullVisit = visitsData.find(v => v.id === visit.id);
                        if (fullVisit) handleStartVisit(fullVisit);
                      }} 
                      className="text-sm text-blue-600"
                    >
                      Start Visit →
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Visits Table */}
      {filteredVisits.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No visits found</h3>
          <p className="text-gray-500 mb-4">
            {visitsData.length === 0 
              ? "No approved appointments yet. Approved requests will appear here." 
              : "Try adjusting your search or filter criteria"}
          </p>
          {(activeFilterCount > 0 || searchTerm) && (
            <Button onClick={clearAllFilters}>Clear All Filters</Button>
          )}
        </div>
      ) : (
        <Card>
          <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">
              Visits 
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded ml-2">{filteredVisits.length}</span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="px-6 py-3">Visit ID</th>
                  <th className="px-6 py-3">Patient</th>
                  <th className="px-6 py-3">Doctor</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3">Date & Time</th>
                  <th className="px-6 py-3">Token</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedVisits.map((visit, index) => (
                  <tr key={visit.id || index} className="hover:bg-gray-50 border-b border-gray-100">
                    <td className="px-6 py-4 text-[#1C62A0] font-medium">{visit.visitId}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={visit.patientAvatar || 'https://randomuser.me/api/portraits/lego/1.jpg'} 
                          alt={visit.patientName} 
                          className="w-8 h-8 rounded-full object-cover" 
                        />
                        <div>
                          <span className="font-medium text-gray-800">{visit.patientName}</span>
                          <p className="text-xs text-gray-400">{visit.patientId}</p>
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
                    <td className="px-6 py-4">
                      <Badge variant="success">{visit.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <RowActionMenu visit={visit} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div className="px-6 py-3 bg-gray-50 rounded-b-xl border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredVisits.length)} of {filteredVisits.length} approved visits
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 border rounded-md text-sm transition-all ${
                    currentPage === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-600 hover:bg-gray-50 border-gray-300"
                  }`}
                >
                  Previous
                </button>
                <span className="px-3 py-1 bg-[#1C62A0] text-white rounded-md text-sm">
                  {currentPage}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className={`px-3 py-1 border rounded-md text-sm transition-all ${
                    currentPage === totalPages || totalPages === 0
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-600 hover:bg-gray-50 border-gray-300"
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </Card>
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