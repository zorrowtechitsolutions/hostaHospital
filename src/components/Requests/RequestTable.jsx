import React, { useState } from "react";
import { 
  Check, 
  X, 
  Search,
  Calendar,
  Stethoscope,
  Filter,
  RefreshCcw,
  Download,
  Upload,
  ChevronRight,
  Users as UsersIcon
} from "lucide-react";
import ApproveRequestModal from "./ApproveRequestModel";
import RejectRequestModal from "./RejectRequestModel";

// Dummy data for requests
const dummyRequests = [
  {
    id: "REQ003",
    patientId: "PT0025",
    patientName: "James Carter",
    doctorName: "Dr. Michael Brown",
    doctorSpecialty: "Neurologist",
    department: "Neurology",
    appointmentDate: "2025-01-25",
    time: "11:00 AM",
    reason: "Migraine follow-up",
    status: "pending",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    email: "james.carter@example.com"
  },
  {
    id: "REQ004",
    patientId: "PT0026",
    patientName: "Emily Rodriguez",
    doctorName: "Dr. Emily Wilson",
    doctorSpecialty: "Orthopedic",
    department: "Orthopedics",
    appointmentDate: "2025-01-28",
    time: "09:15 AM",
    reason: "Knee pain assessment",
    status: "pending",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    email: "emily.r@example.com"
  },
  {
    id: "REQ005",
    patientId: "PT0027",
    patientName: "Michael Chen",
    doctorName: "Dr. Robert Taylor",
    doctorSpecialty: "Ophthalmologist",
    department: "Ophthalmology",
    appointmentDate: "2025-01-30",
    time: "03:45 PM",
    reason: "Vision checkup",
    status: "pending",
    avatar: "https://randomuser.me/api/portraits/men/45.jpg",
    email: "michael.chen@example.com"
  },
  {
    id: "REQ006",
    patientId: "PT0028",
    patientName: "Lisa Wong",
    doctorName: "Dr. Lisa Anderson",
    doctorSpecialty: "Pediatrician",
    department: "Pediatrics",
    appointmentDate: "2025-02-01",
    time: "01:00 PM",
    reason: "Child vaccination",
    status: "approved",
    avatar: "https://randomuser.me/api/portraits/women/55.jpg",
    email: "lisa.wong@example.com"
  },
  {
    id: "REQ007",
    patientId: "PT0029",
    patientName: "Sophia Martinez",
    doctorName: "Dr. David Martinez",
    doctorSpecialty: "ENT Specialist",
    department: "ENT",
    appointmentDate: "2025-02-03",
    time: "11:30 AM",
    reason: "Ear infection treatment",
    status: "rejected",
    avatar: "https://randomuser.me/api/portraits/women/68.jpg",
    email: "sophia.m@example.com"
  },
  {
    id: "REQ008",
    patientId: "PT0030",
    patientName: "David Thompson",
    doctorName: "Dr. James Wilson",
    doctorSpecialty: "Cardiologist",
    department: "Cardiology",
    appointmentDate: "2025-02-05",
    time: "10:00 AM",
    reason: "Heart checkup",
    status: "pending",
    avatar: "https://randomuser.me/api/portraits/men/28.jpg",
    email: "david.t@example.com"
  }
];

const RequestTable = ({ data = dummyRequests, onApprove, onReject }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // State for Approve Modal
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  // State for Reject Modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Ensure data is an array
  const safeData = Array.isArray(data) ? data : [];

  // Get unique departments for filter dropdown
  const getAllDepartments = () => {
    const departments = [...new Set(safeData.map(r => r.department))];
    return departments.sort();
  };

  // Filter data
  const getFilteredRequests = () => {
    let filtered = [...safeData];
    
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (departmentFilter) {
      filtered = filtered.filter(item => item.department === departmentFilter);
    }
    
    if (dateFilter) {
      filtered = filtered.filter(item => item.appointmentDate === dateFilter);
    }
    
    return filtered;
  };

  const filteredRequests = getFilteredRequests();
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRequests = filteredRequests.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleRefresh = () => {
    setSearchTerm("");
    setDepartmentFilter("");
    setDateFilter("");
    setCurrentPage(1);
  };

  const handleExport = () => {
    const filtered = getFilteredRequests();
    const exportData = filtered.map(req => ({
      'Request ID': req.id,
      'Patient ID': req.patientId,
      'Patient Name': req.patientName,
      'Doctor Name': req.doctorName,
      'Department': req.department,
      'Appointment Date': `${req.appointmentDate} at ${req.time}`,
      'Status': req.status,
      'Reason': req.reason
    }));
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `requests_export_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        alert(`Successfully imported ${importedData.length} requests!`);
        console.log('Imported data:', importedData);
      } catch (error) {
        alert('Error parsing JSON file. Please make sure it\'s a valid JSON file.');
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

  const getActiveFilterCount = () => {
    let count = 0;
    if (departmentFilter) count++;
    if (dateFilter) count++;
    if (searchTerm) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  // Handle Approve Request - Open Approve Modal
  const handleApproveClick = (request) => {
    setSelectedRequest(request);
    setShowApproveModal(true);
  };

  // Handle Confirm Approve
  const handleConfirmApprove = (appointmentData) => {
    if (selectedRequest) {
      if (onApprove) {
        onApprove(selectedRequest, appointmentData);
      } else {
        alert(`Request ${selectedRequest.id} approved successfully!\nDate: ${appointmentData.date}\nTime: ${appointmentData.time}`);
      }
    }
    setShowApproveModal(false);
    setSelectedRequest(null);
  };

  // Handle Reject Request - Open Reject Modal
  const handleRejectClick = (request) => {
    setSelectedRequest(request);
    setRejectReason("");
    setShowRejectModal(true);
  };

  // Handle Confirm Reject
  const handleConfirmReject = () => {
    if (selectedRequest) {
      if (onReject) {
        onReject(selectedRequest, rejectReason);
      } else {
        alert(`Request ${selectedRequest.id} rejected successfully!\nReason: ${rejectReason || "No reason provided"}`);
      }
    }
    setShowRejectModal(false);
    setSelectedRequest(null);
    setRejectReason("");
  };

  if (safeData.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">
            Total Requests
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded ml-2">0</span>
          </h2>
        </div>
        <div className="p-12 text-center">
          <div className="flex flex-col items-center justify-center text-gray-400">
            <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-sm font-medium">No requests found</p>
            <p className="text-xs mt-1">Requests will appear here once available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-800">Requests</h1>
          <p className="text-sm text-gray-500">Home / Requests</p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          {/* Header with Search and Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">
              Total Requests
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded ml-2">
                {filteredRequests.length}
              </span>
            </h2>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by Patient ID, Name or Doctor..."
                  className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-[#1C62A0]"
                />
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`relative p-2 rounded-lg transition-all duration-200 ${
                  showFilters || activeFilterCount > 0
                    ? "bg-[#1C62A0] text-white shadow-md"
                    : "border border-gray-200 text-gray-600 hover:bg-gray-100"
                }`}
                title="Toggle Filters"
              >
                <Filter size={16} />
                {activeFilterCount > 0 && !showFilters && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <button
                onClick={handleRefresh}
                className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-all duration-200"
                title="Refresh"
              >
                <RefreshCcw size={16} />
              </button>

              <label className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-all duration-200 cursor-pointer">
                <Upload size={16} />
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>

              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-all duration-200 text-sm"
              >
                <Download size={16} />
              </button>
            </div>
          </div>

          {/* Collapsible Filter Section */}
          {showFilters && (
            <div className="border-b border-gray-200 bg-gray-50">
              <div className="px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Filter className="w-5 h-5 text-gray-500" />
                    <h2 className="text-sm font-semibold text-gray-700">Filters</h2>
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
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
                    <select
                      value={departmentFilter}
                      onChange={(e) => setDepartmentFilter(e.target.value)}
                      className="w-full border border-gray-200 text-sm rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#1C62A0]"
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
                      className="w-full border border-gray-200 text-sm rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#1C62A0]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Requests Table */}
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria</p>
              <button
                onClick={clearAllFilters}
                className="mt-4 px-4 py-2 bg-[#1C62A0] text-white rounded-lg hover:bg-[#154A7D] transition-colors text-sm"
              >
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
                          <span className="font-mono text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
                            {item.patientId}
                          </span>
                         </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img 
                              src={item.avatar} 
                              alt={item.patientName} 
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <span className="font-medium text-gray-900">{item.patientName}</span>
                          </div>
                         </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                              <Stethoscope size={12} className="text-blue-600" />
                            </div>
                            <span className="text-gray-700">{item.doctorName}</span>
                          </div>
                         </td>
                        <td className="px-6 py-4 text-gray-600">{item.department}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Calendar size={14} className="text-gray-400" />
                            {item.appointmentDate} at {item.time}
                          </div>
                         </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-3">
                            {/* Approve Button */}
                            <button
                              onClick={() => handleApproveClick(item)}
                              className="w-9 h-9 flex items-center justify-center rounded-lg border border-green-200 text-green-500 hover:bg-green-50 hover:border-green-300 transition-all"
                              title="Approve Request"
                            >
                              <Check size={18} />
                            </button>
                            
                            {/* Reject Button */}
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
              
              {/* Pagination */}
              {filteredRequests.length > 0 && (
                <div className="px-6 py-3 border-t bg-gray-50 flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to{" "}
                    {Math.min(currentPage * itemsPerPage, filteredRequests.length)} of {filteredRequests.length} requests
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
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
                      onClick={() => handlePageChange(currentPage + 1)}
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
            </>
          )}
        </div>
      </div>

      {/* Approve Request Modal */}
      {showApproveModal && (
        <ApproveRequestModal
          onClose={() => {
            setShowApproveModal(false);
            setSelectedRequest(null);
          }}
          onConfirm={handleConfirmApprove}
        />
      )}

      {/* Reject Request Modal */}
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
    </>
  );
};

export default RequestTable;