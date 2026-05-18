import React, { useState, useMemo } from "react";
import { 
  Check, X, Search, Calendar, Stethoscope, Filter, 
  RefreshCcw, Download, Upload, Users as UsersIcon, Phone, Clock
} from "lucide-react";
import { 
  Button, Card, Pagination, SearchBar
} from "../ui";
import ApproveRequestModal from "./ApproveRequestModel";
import RejectRequestModal from "./RejectRequestModel";
import { showSuccessToast, showWarningToast, showErrorToast, showAddToast } from "../ui/Toast";
import { useAuth } from "../../context/AuthContext";
import { 
  useGetBookingsQuery,
  useApproveBookingMutation,
  useRejectBookingMutation
} from "../../../app/service/request";

const RequestTable = ({ doctorId = null, doctorName = null }) => {
  const { user } = useAuth();
  
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

  // API Hooks
  const { 
    data: bookingsResponse, 
    isLoading: loading, 
    refetch,
    isFetching 
  } = useGetBookingsQuery(
    { 
      hospitalId: user?.id,
      status: "pending"
    },
    { skip: !user?.id }
  );

  const [approveBooking, { isLoading: isApproving }] = useApproveBookingMutation();
  const [rejectBooking, { isLoading: isRejecting }] = useRejectBookingMutation();

  // Helper function to format ID for display
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

  // Transform API response
  const transformBookingsData = (bookingList) => {
    if (!bookingList || !Array.isArray(bookingList)) return [];

    return bookingList.map((booking, index) => {
      const DEFAULT_PROFILE_IMAGE = `https://randomuser.me/api/portraits/lego/${(index % 10) + 1}.jpg`;
      
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

      // Get the ID properly (handle both id and _id)
      const bookingId = booking.id || booking._id;
      
      console.log(`Transforming booking ${index}:`, {
        originalId: booking.id,
        originalUnderscoreId: booking._id,
        finalId: bookingId
      });

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
        appointmentDate: booking.booking_date || booking.appointmentDate
          ? (booking.booking_date || booking.appointmentDate).split("T")[0]
          : "N/A",
        time: booking.consulting_time || booking.time || "N/A",
        reason: booking.reason || "",
        status: booking.status || "pending",
        avatar: booking.avatar || DEFAULT_PROFILE_IMAGE,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
      };
    });
  };

  const safeData = useMemo(() => {
    const data = transformBookingsData(bookingsResponse?.data || []);
    console.log("Transformed data count:", data.length);
    console.log("Sample transformed item:", data[0]);
    return data;
  }, [bookingsResponse]);

  // Get all unique departments
  const getAllDepartments = () => {
    let sourceData;
    if (doctorId && !showAllData) {
      sourceData = safeData.filter(item => item.doctorId === doctorId || item.doctorName === doctorName);
    } else {
      sourceData = safeData;
    }
    return [...new Set(sourceData.map(r => r.department).filter(Boolean))].sort();
  };

  // Filter requests based on all criteria
  const getFilteredRequests = () => {
    let filtered;
    
    // Apply doctor filter
    if (doctorId && !showAllData) {
      filtered = safeData.filter(item => 
        item.doctorId === doctorId || item.doctorName === doctorName
      );
    } else {
      filtered = [...safeData];
    }
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item => 
        (item.formattedId && item.formattedId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.patientId && item.patientId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.patientName && item.patientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.doctorName && item.doctorName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.department && item.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
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
  };

  const filteredRequests = getFilteredRequests();
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRequests = filteredRequests.slice(startIndex, startIndex + itemsPerPage);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, departmentFilter, dateFilter, statusFilter, showAllData]);

  // Handlers
  const handleRefresh = () => { 
    setSearchTerm(""); 
    setDepartmentFilter(""); 
    setDateFilter(""); 
    setStatusFilter("");
    setCurrentPage(1); 
    refetch();
    showSuccessToast("Refreshed requests", 2000);
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
      'Appointment Date': `${req.appointmentDate} at ${req.time}`, 
      'Status': req.status, 
      'Reason': req.reason 
    }));
    
    const link = document.createElement('a');
    link.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    link.download = `requests_export_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    showSuccessToast(`Exported ${exportData.length} pending requests`, 3000);
  };
  
  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try { 
        const importedData = JSON.parse(e.target.result);
        const pendingImports = importedData.filter(item => item.status === "pending");
        showAddToast(`Successfully imported ${pendingImports.length} pending requests!`, 4000, {
          'Total': importedData.length,
          'Pending': pendingImports.length,
          'Other': importedData.length - pendingImports.length
        });
      } 
      catch (error) { 
        showErrorToast('Error parsing JSON file. Please check file format.', 3000);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };
 
  const clearAllFilters = () => { 
    setDepartmentFilter(''); 
    setDateFilter(''); 
    setSearchTerm('');
    setStatusFilter('');
    showSuccessToast("All filters cleared", 2000);
  };

  const activeFilterCount = (departmentFilter ? 1 : 0) + (dateFilter ? 1 : 0) + (searchTerm ? 1 : 0) + (statusFilter ? 1 : 0);

  const handleApproveClick = (request) => { 
    console.log("=== Opening Approve Modal ===");
    console.log("Selected request:", request);
    console.log("Request ID being passed:", request.id);
    
    if (!request.id) {
      console.error("❌ Cannot approve: Request ID is missing!");
      showErrorToast("Invalid request: Missing ID. Please refresh and try again.", 3000);
      return;
    }
    
    console.log("✅ Setting selected request with ID:", request.id);
    setSelectedRequest(request); 
    setShowApproveModal(true); 
  };
  
  const handleConfirmApprove = async (appointmentData) => {
    console.log("=== Confirm Approve Called ===");
    console.log("Selected request:", selectedRequest);
    console.log("Appointment data:", appointmentData);
    
    if (!selectedRequest) {
      console.error("❌ No request selected");
      showErrorToast("No request selected", 3000);
      return;
    }

    if (!selectedRequest.id) {
      console.error("❌ Selected request has no ID!");
      showErrorToast("Request ID is missing. Cannot approve.", 3000);
      setShowApproveModal(false);
      setSelectedRequest(null);
      return;
    }

    console.log("✅ Approving with ID:", selectedRequest.id);
    console.log("✅ Approval data:", {
      id: selectedRequest.id,
      data: appointmentData
    });

    try {
      const result = await approveBooking({
        id: selectedRequest.id,
        data: {
          date: appointmentData.date,
          time: appointmentData.time,
          token: appointmentData.token,
          notes: appointmentData.notes || ""
        }
      }).unwrap();
      
      console.log("✅ Approval successful:", result);
      
      showSuccessToast(
        `Request ${selectedRequest.formattedId} approved successfully!`,
        4000,
        {
          'Patient': selectedRequest.patientName,
          'Date': appointmentData.date,
          'Time': appointmentData.time,
          'Token': `#${appointmentData.token}`
        }
      );
      
      await refetch();
      setShowApproveModal(false);
      setSelectedRequest(null);
      
    } catch (error) {
      console.error("❌ Approve error:", error);
      showErrorToast(error?.data?.message || 'Failed to approve request', 3000);
    }
  };
  
  const handleRejectClick = (request) => { 
    console.log("Opening reject modal for:", request);
    setSelectedRequest(request); 
    setRejectReason(""); 
    setShowRejectModal(true); 
  };
  
  const handleConfirmReject = async () => {
    if (!selectedRequest) {
      showErrorToast("No request selected", 3000);
      return;
    }

    if (!selectedRequest.id) {
      showErrorToast("Request ID is missing. Cannot reject.", 3000);
      setShowRejectModal(false);
      setSelectedRequest(null);
      return;
    }

    try {
      await rejectBooking({
        id: selectedRequest.id,
        data: { reason: rejectReason }
      }).unwrap();
      
      showErrorToast(
        `Request ${selectedRequest.formattedId} rejected successfully!`,
        4000,
        {
          'Patient': selectedRequest.patientName,
          'Doctor': selectedRequest.doctorName,
          'Reason': rejectReason || "No reason provided"
        }
      );
      
      await refetch();
      setShowRejectModal(false);
      setSelectedRequest(null);
      setRejectReason("");
      
    } catch (error) {
      console.error('Reject error:', error);
      showErrorToast(error?.data?.message || 'Failed to reject request', 3000);
    }
  };

  const toggleShowAllData = () => {
    setShowAllData(!showAllData);
    setCurrentPage(1);
    setDepartmentFilter('');
    setDateFilter('');
    setSearchTerm('');
    setStatusFilter('');
    if (!showAllData) {
      showSuccessToast(`Now showing all doctors' requests`, 2000);
    } else {
      showSuccessToast(`Now showing requests for ${doctorName}`, 2000);
    }
  };

  const showDoctorBanner = doctorId && !showAllData;

  // Skeleton Loading Component
  const SkeletonLoader = () => (
    <div className="min-h-screen bg-[#F8F9FA] p-6 font-sans">
      {/* Breadcrumb Skeleton */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="h-7 w-32 bg-gray-200 rounded animate-pulse mt-2"></div>
      </div>

      {/* Search and Filters Skeleton */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="flex-1 max-w-md">
          <div className="h-10 w-full bg-gray-200 rounded-md animate-pulse"></div>
        </div>
        <div className="flex gap-2">
          <div className="w-10 h-10 bg-gray-200 rounded-md animate-pulse"></div>
          <div className="w-10 h-10 bg-gray-200 rounded-md animate-pulse"></div>
          <div className="w-10 h-10 bg-gray-200 rounded-md animate-pulse"></div>
          <div className="w-10 h-10 bg-gray-200 rounded-md animate-pulse"></div>
        </div>
      </div>

      {/* Table Skeleton */}
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
        {/* Pagination Skeleton */}
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

  // Loading state with skeleton
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

      {/* Search and Action Buttons Row */}
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
            className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50 transition-colors" 
            title="Refresh"
            disabled={isFetching}
          >
            <RefreshCcw size={16} className={isFetching ? "animate-spin" : ""} />
          </button>
          <input type="file" onChange={handleImport} accept=".json" className="hidden" id="import-file" />
          <label htmlFor="import-file" className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50 cursor-pointer transition-colors" title="Import Requests">
            <Upload size={16} />
          </label>
          <button 
            onClick={handleExport} 
            className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50 transition-colors" 
            title="Export Pending Requests"
          >
            <Download size={16} />
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`relative p-2 border border-gray-200 rounded-md bg-white transition-colors ${
              showFilters || activeFilterCount > 0 ? 'text-[#1C62A0] border-[#1C62A0]' : 'text-gray-500'
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

      {/* Collapsible Filter Section */}
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
                {getAllDepartments().map(dept => (
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
          {filteredRequests.length > 0 && (
            <p className="text-xs text-gray-500">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredRequests.length)} of {filteredRequests.length} requests
            </p>
          )}
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
                          <img
                            src={item.avatar}
                            alt={item.patientName}
                            className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "https://randomuser.me/api/portraits/lego/1.jpg";
                            }}
                          />
                          <span className="font-medium text-gray-800">{item.patientName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-gray-700">{item.age} yrs</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Phone size={14} className="text-gray-400" />
                          <span className="text-gray-700">{item.contact}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
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
                          {item.appointmentDate} at {item.time}
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
            
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t">
                <Pagination 
                  currentPage={currentPage} 
                  totalPages={totalPages} 
                  onPageChange={setCurrentPage} 
                  totalItems={filteredRequests.length} 
                  itemsPerPage={itemsPerPage} 
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
          onClose={() => { 
            setShowApproveModal(false); 
            setSelectedRequest(null); 
          }} 
          onConfirm={handleConfirmApprove}
          initialDate={selectedRequest.appointmentDate !== "N/A" ? selectedRequest.appointmentDate : ""}
          initialTime={selectedRequest.time !== "N/A" ? selectedRequest.time : ""}
          initialToken=""
        />
      )}
      
      {/* Reject Modal */}
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
        />
      )}
    </div>
  );
};

export default RequestTable;