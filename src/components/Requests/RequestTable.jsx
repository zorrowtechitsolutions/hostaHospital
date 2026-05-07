// src/components/Requests/RequestTable.jsx
import React, { useState } from "react";
import { 
  Check, X, Search, Calendar, Stethoscope, Filter, 
  RefreshCcw, Download, Upload, Users as UsersIcon
} from "lucide-react";
import { 
  Button, Input, Select, Card, 
  SearchBar, FilterBar, Pagination, Avatar 
} from "../ui";
import ApproveRequestModal from "./ApproveRequestModel";
import RejectRequestModal from "./RejectRequestModel";

const dummyRequests = [
  { id: "REQ003", patientId: "PT0025", patientName: "James Carter", doctorId: 2, doctorName: "Dr. Michael Brown", doctorSpecialty: "Neurologist", department: "Neurology", appointmentDate: "2025-01-25", time: "11:00 AM", reason: "Migraine follow-up", status: "pending", avatar: "https://randomuser.me/api/portraits/men/32.jpg", email: "james.carter@example.com" },
  { id: "REQ004", patientId: "PT0026", patientName: "Emily Rodriguez", doctorId: 3, doctorName: "Dr. Emily Wilson", doctorSpecialty: "Orthopedic", department: "Orthopedics", appointmentDate: "2025-01-28", time: "09:15 AM", reason: "Knee pain assessment", status: "pending", avatar: "https://randomuser.me/api/portraits/women/44.jpg", email: "emily.r@example.com" },
  { id: "REQ005", patientId: "PT0027", patientName: "Michael Chen", doctorId: 4, doctorName: "Dr. Robert Taylor", doctorSpecialty: "Ophthalmologist", department: "Ophthalmology", appointmentDate: "2025-01-30", time: "03:45 PM", reason: "Vision checkup", status: "pending", avatar: "https://randomuser.me/api/portraits/men/45.jpg", email: "michael.chen@example.com" },
  { id: "REQ006", patientId: "PT0028", patientName: "Lisa Wong", doctorId: 5, doctorName: "Dr. Lisa Anderson", doctorSpecialty: "Pediatrician", department: "Pediatrics", appointmentDate: "2025-02-01", time: "01:00 PM", reason: "Child vaccination", status: "approved", avatar: "https://randomuser.me/api/portraits/women/55.jpg", email: "lisa.wong@example.com" },
  { id: "REQ007", patientId: "PT0029", patientName: "Sophia Martinez", doctorId: 6, doctorName: "Dr. David Martinez", doctorSpecialty: "ENT Specialist", department: "ENT", appointmentDate: "2025-02-03", time: "11:30 AM", reason: "Ear infection treatment", status: "rejected", avatar: "https://randomuser.me/api/portraits/women/68.jpg", email: "sophia.m@example.com" },
  { id: "REQ008", patientId: "PT0030", patientName: "David Thompson", doctorId: 7, doctorName: "Dr. James Wilson", doctorSpecialty: "Cardiologist", department: "Cardiology", appointmentDate: "2025-02-05", time: "10:00 AM", reason: "Heart checkup", status: "pending", avatar: "https://randomuser.me/api/portraits/men/28.jpg", email: "david.t@example.com" }
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

  const safeData = Array.isArray(data) ? data : [];

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
        (item.department && item.department.toLowerCase().includes(searchTerm.toLowerCase()))
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

  const handleRefresh = () => { setSearchTerm(""); setDepartmentFilter(""); setDateFilter(""); setCurrentPage(1); };
  
  const handleExport = () => {
    const exportData = getFilteredRequests().map(req => ({ 
      'Request ID': req.id, 
      'Patient ID': req.patientId, 
      'Patient Name': req.patientName, 
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
  };
  
  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try { const importedData = JSON.parse(e.target.result); alert(`Successfully imported ${importedData.length} requests!`); } 
      catch (error) { alert('Error parsing JSON file.'); }
    };
    reader.readAsText(file);
    event.target.value = '';
  };
  
  const clearAllFilters = () => { setDepartmentFilter(''); setDateFilter(''); setSearchTerm(''); };
  const activeFilterCount = (departmentFilter ? 1 : 0) + (dateFilter ? 1 : 0) + (searchTerm ? 1 : 0);

  const handleApproveClick = (request) => { setSelectedRequest(request); setShowApproveModal(true); };
  
  const handleConfirmApprove = (appointmentData) => {
    if (selectedRequest) {
      if (onApprove) onApprove(selectedRequest, appointmentData);
      else alert(`Request ${selectedRequest.id} approved successfully!\nDate: ${appointmentData.date}\nTime: ${appointmentData.time}`);
    }
    setShowApproveModal(false);
    setSelectedRequest(null);
  };
  
  const handleRejectClick = (request) => { setSelectedRequest(request); setRejectReason(""); setShowRejectModal(true); };
  
  const handleConfirmReject = () => {
    if (selectedRequest) {
      if (onReject) onReject(selectedRequest, rejectReason);
      else alert(`Request ${selectedRequest.id} rejected successfully!\nReason: ${rejectReason || "No reason provided"}`);
    }
    setShowRejectModal(false);
    setSelectedRequest(null);
    setRejectReason("");
  };

  const toggleShowAllData = () => {
    setShowAllData(!showAllData);
    setCurrentPage(1);
    setDepartmentFilter('');
    setDateFilter('');
    setSearchTerm('');
  };

  const showDoctorBanner = doctorId && !showAllData;

  if (safeData.length === 0) {
    return (
      <Card>
        <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">
            Total Requests 
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded ml-2">0</span>
          </h2>
        </div>
        <div className="p-12 text-center">
          <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-sm font-medium text-gray-500">No requests found</p>
          <p className="text-xs text-gray-400 mt-1">Requests will appear here once available</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="bg-gray-50">
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

      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-800">Requests</h1>
          <p className="text-sm text-gray-500">Home / Requests</p>
        </div>

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">
              Total Requests 
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded ml-2">
                {filteredRequests.length}
              </span>
            </h2>
            <div className="flex items-center gap-2">
              <SearchBar placeholder="Search by Patient ID, Name or Doctor..." value={searchTerm} onChange={setSearchTerm} className="w-64" />
              <FilterBar isOpen={showFilters} onToggle={() => setShowFilters(!showFilters)} activeFilterCount={activeFilterCount} onClearAll={clearAllFilters}>
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
              </FilterBar>
              <button onClick={handleRefresh} className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-all duration-200">
                <RefreshCcw size={16} />
              </button>
              <label className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 cursor-pointer">
                <Upload size={16} />
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>
              <button onClick={handleExport} className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-all duration-200">
                <Download size={16} />
              </button>
            </div>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
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
      </div>
    </div>
  );
};

export default RequestTable;