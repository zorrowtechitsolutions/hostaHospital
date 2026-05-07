import React, { useState } from "react";
import { 
  Check, X, Search, Calendar, Stethoscope, Filter, 
  RefreshCcw, Download, Upload, Users as UsersIcon, Phone, Clock
} from "lucide-react";
import { 
  Button, Card, Pagination, SearchBar
} from "../ui";
import ApproveRequestModal from "./ApproveRequestModel";
import RejectRequestModal from "./RejectRequestModel";
import AutoDeclineModal from "./AutoDeclineModal";
import { showSuccessToast, showWarningToast, showErrorToast, showAddToast } from "../ui/Toast";

// Configuration
const DEFAULT_AUTO_DECLINE_MINUTES = 5;

// Updated dummy data with patient ages and contact numbers - ONLY PENDING STATUS
const dummyRequests = [
  { 
    id: "REQ003", patientId: "PT0025", patientName: "James Carter", 
    age: 34, contact: "+1 123 456 7890", gender: "Male",
    doctorName: "Dr. Michael Brown", doctorSpecialty: "Neurologist", 
    department: "Neurology", appointmentDate: "2025-01-25", time: "11:00 AM", 
    reason: "Migraine follow-up", status: "pending", 
    avatar: "https://randomuser.me/api/portraits/men/32.jpg", 
    email: "james.carter@example.com" 
  },
  { 
    id: "REQ004", patientId: "PT0026", patientName: "Emily Rodriguez", 
    age: 28, contact: "+1 234 567 8901", gender: "Female",
    doctorName: "Dr. Emily Wilson", doctorSpecialty: "Orthopedic", 
    department: "Orthopedics", appointmentDate: "2025-01-28", time: "09:15 AM", 
    reason: "Knee pain assessment", status: "pending", 
    avatar: "https://randomuser.me/api/portraits/women/44.jpg", 
    email: "emily.r@example.com" 
  },
  { 
    id: "REQ005", patientId: "PT0027", patientName: "Michael Chen", 
    age: 45, contact: "+1 345 678 9012", gender: "Male",
    doctorName: "Dr. Robert Taylor", doctorSpecialty: "Ophthalmologist", 
    department: "Ophthalmology", appointmentDate: "2025-01-30", time: "03:45 PM", 
    reason: "Vision checkup", status: "pending", 
    avatar: "https://randomuser.me/api/portraits/men/45.jpg", 
    email: "michael.chen@example.com" 
  },
  { 
    id: "REQ008", patientId: "PT0030", patientName: "David Thompson", 
    age: 41, contact: "+1 678 901 2345", gender: "Male",
    doctorName: "Dr. James Wilson", doctorSpecialty: "Cardiologist", 
    department: "Cardiology", appointmentDate: "2025-02-05", time: "10:00 AM", 
    reason: "Heart checkup", status: "pending", 
    avatar: "https://randomuser.me/api/portraits/men/28.jpg", 
    email: "david.t@example.com" 
  }
];

const RequestTable = ({ data = dummyRequests, doctorId = null, doctorName = null, onApprove, onReject }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [showAllData, setShowAllData] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  
  // Auto Decline Modal State
  const [showAutoDeclineModal, setShowAutoDeclineModal] = useState(false);
  const [autoDeclineMinutes, setAutoDeclineMinutes] = useState(DEFAULT_AUTO_DECLINE_MINUTES);

  // Filter to ONLY show pending requests
  const safeData = Array.isArray(data) ? data.filter(item => item.status === "pending") : [];

  const getAllDepartments = () => {
    let sourceData;
    if (doctorId && !showAllData) {
      sourceData = safeData.filter(item => item.doctorId === doctorId || item.doctorName === doctorName);
    } else {
      sourceData = safeData;
    }
    return [...new Set(sourceData.map(r => r.department))].sort();
  };

  const getFilteredRequests = () => {
    let filtered;
    
    if (doctorId && !showAllData) {
      filtered = safeData.filter(item => 
        item.doctorId === doctorId || item.doctorName === doctorName
      );
    } else {
      filtered = [...safeData];
    }
    
    if (searchTerm) {
      filtered = filtered.filter(item => 
        (item.id && item.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.patientId && item.patientId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.patientName && item.patientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.doctorName && item.doctorName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.department && item.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.contact && item.contact.includes(searchTerm))
      );
    }
    if (departmentFilter) filtered = filtered.filter(item => item.department === departmentFilter);
    if (dateFilter) filtered = filtered.filter(item => item.appointmentDate === dateFilter);
    
    return filtered;
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      pending: "bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs",
      approved: "bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs",
      rejected: "bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs"
    };
    return classes[status] || classes.pending;
  };

  const filteredRequests = getFilteredRequests();
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRequests = filteredRequests.slice(startIndex, startIndex + itemsPerPage);

  const handleRefresh = () => { 
    setSearchTerm(""); 
    setDepartmentFilter(""); 
    setDateFilter(""); 
    setCurrentPage(1); 
  };
  
  const handleExport = () => {
    const exportData = getFilteredRequests().map(req => ({ 
      'Request ID': req.id, 
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
  };

  const activeFilterCount = (departmentFilter ? 1 : 0) + (dateFilter ? 1 : 0) + (searchTerm ? 1 : 0);

  const handleApproveClick = (request) => { 
    setSelectedRequest(request); 
    setShowApproveModal(true); 
  };
  
  const handleConfirmApprove = (appointmentData) => {
    if (selectedRequest) {
      if (onApprove) onApprove(selectedRequest, appointmentData);
      else {
        showSuccessToast(
          `Request ${selectedRequest.id} approved successfully!`,
          4000,
          {
            'Patient': selectedRequest.patientName,
            'Date': appointmentData.date,
            'Time': appointmentData.time,
            'Token': `#${appointmentData.token}`
          }
        );
      }
    }
    setShowApproveModal(false);
    setSelectedRequest(null);
  };
  
  const handleRejectClick = (request) => { 
    setSelectedRequest(request); 
    setRejectReason(""); 
    setShowRejectModal(true); 
  };
  
  const handleConfirmReject = () => {
    if (selectedRequest) {
      if (onReject) onReject(selectedRequest, rejectReason);
      else {
        showErrorToast(
          `Request ${selectedRequest.id} rejected successfully!`,
          4000,
          {
            'Patient': selectedRequest.patientName,
            'Doctor': selectedRequest.doctorName,
            'Reason': rejectReason || "No reason provided"
          }
        );
      }
    }
    setShowRejectModal(false);
    setSelectedRequest(null);
    setRejectReason("");
  };

  const handleSaveAutoDecline = (minutes) => {
    setAutoDeclineMinutes(minutes);
    localStorage.setItem('autoDeclineMinutes', minutes);
    showSuccessToast(`Auto decline time has been set to ${minutes} minutes.`, 3000);
  };

  const toggleShowAllData = () => {
    setShowAllData(!showAllData);
    setCurrentPage(1);
    setDepartmentFilter('');
    setDateFilter('');
    setSearchTerm('');
    if (!showAllData) {
      showSuccessToast(`Now showing all doctors' requests`, 2000);
    } else {
      showSuccessToast(`Now showing requests for ${doctorName}`, 2000);
    }
  };

  const showDoctorBanner = doctorId && !showAllData;

  if (safeData.length === 0) {
    return (
      <Card>
        <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">
            Total Pending Requests 
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded ml-2">0</span>
          </h2>
        </div>
        <div className="p-12 text-center">
          <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-sm font-medium text-gray-500">No pending requests found</p>
          <p className="text-xs text-gray-400 mt-1">Pending requests will appear here once available</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-800">Requests</h1>
        <p className="text-sm text-gray-500">Home / Requests</p>
      </div>

      {/* Auto-Decline Banner with Change Button */}
      <div className="mb-4 w-full bg-blue-50 border border-blue-200 rounded-lg px-6 py-3 overflow-hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Clock size={16} className="text-blue-600 flex-shrink-0" />
            <span className="text-sm text-blue-800">
              <strong>Auto-Decline: {autoDeclineMinutes} minutes</strong> — Pending bookings will be automatically declined after {autoDeclineMinutes} minutes if not approved by staff.
            </span>
          </div>
          <button
            onClick={() => setShowAutoDeclineModal(true)}
            className="px-3 py-1.5 text-sm bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1"
          >
            <Clock size={14} />
            Change
          </button>
        </div>
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
          <button onClick={handleRefresh} className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50" title="Refresh">
            <RefreshCcw size={16} />
          </button>
          <input type="file" onChange={handleImport} accept=".json" className="hidden" id="import-file" />
          <label htmlFor="import-file" className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50 cursor-pointer" title="Import Requests">
            <Upload size={16} />
          </label>
          <button onClick={handleExport} className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50" title="Export Pending Requests">
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
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">No pending requests found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your search or filter criteria</p>
            <button onClick={clearAllFilters} className="px-4 py-2 bg-[#1C62A0] text-white rounded-lg hover:bg-[#154A7D] transition-colors text-sm">
              Clear All Filters
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
                  <tr>
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
                        <span className="text-[#1C62A0] font-medium">#{item.patientId}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={item.avatar} 
                            alt={item.patientName} 
                            className="w-8 h-8 rounded-full object-cover"
                            onError={(e) => {
                              e.target.src = `https://randomuser.me/api/portraits/${item.gender === 'Male' ? 'men' : 'women'}/1.jpg`;
                            }}
                          />
                          <span className="font-medium text-gray-800">{item.patientName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-gray-700">{item.age || 'N/A'} yrs</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Phone size={14} className="text-gray-400" />
                          <span className="text-gray-700">{item.contact || 'N/A'}</span>
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
            <Pagination 
              currentPage={currentPage} 
              totalPages={totalPages} 
              onPageChange={setCurrentPage} 
              totalItems={filteredRequests.length} 
              itemsPerPage={itemsPerPage} 
            />
          </>
        )}
      </Card>

      {showApproveModal && (
        <ApproveRequestModal 
          onClose={() => { 
            setShowApproveModal(false); 
            setSelectedRequest(null); 
          }} 
          onConfirm={handleConfirmApprove} 
        />
      )}
      
      {showRejectModal && (
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

      {/* Auto Decline Modal */}
      <AutoDeclineModal
        isOpen={showAutoDeclineModal}
        onClose={() => setShowAutoDeclineModal(false)}
        currentMinutes={autoDeclineMinutes}
        onSave={handleSaveAutoDecline}
      />
    </div>
  );
};

export default RequestTable;