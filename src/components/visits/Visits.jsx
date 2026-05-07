// src/components/visits/Visits.jsx - With visitDate in YYYY-MM-DD format
import React, { useState, useRef, useEffect } from 'react';
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
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [visitsData, setVisitsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const itemsPerPage = 10;

  const recentVisits = [
    { id: 1, patientName: 'James Carter', patientAvatar: 'https://i.pravatar.cc/45?img=11', lastVisit: '20 Feb 2025', doctorName: 'Dr. Andrew Clark', treatment: 'Electromyography', department: 'Neurology' },
    { id: 2, patientName: 'Olivia Miller', patientAvatar: 'https://i.pravatar.cc/45?img=32', lastVisit: '12 Mar 2025', doctorName: 'Dr. Laura Mitchell', treatment: 'Angiography', department: 'Cardiology' },
    { id: 3, patientName: 'William Brown', patientAvatar: 'https://i.pravatar.cc/45?img=14', lastVisit: '25 Apr 2025', doctorName: 'Dr. Andrew Clark', treatment: 'Fever Management', department: 'General Medicine' }
  ];

  const defaultVisitsData = [
    { id: 'VIS001', visitId: 'VIS001', patientName: 'James Carter', patientId: 'PT0025', patientType: 'Out Patient', department: 'Cardiology', doctorName: 'Dr. Andrew Clark', visitDate: '2024-12-21', startTime: '07:00 AM', endTime: '08:00 AM', status: 'Completed', reason: 'Chest pain and shortness of breath', diagnosis: 'Mild hypertension', prescription: 'Metoprolol 25mg', notes: 'Follow-up in 2 weeks', followUpDate: 'After 15 Days', paymentMethod: 'Insurance', patientAvatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
    { id: 'VIS002', visitId: 'VIS002', patientName: 'Emily Rodriguez', patientId: 'PT0026', patientType: 'Out Patient', department: 'Neurology', doctorName: 'Dr. Natalie Foster', visitDate: '2024-01-08', startTime: '09:55 AM', endTime: '10:55 AM', status: 'Inprogress', reason: 'Severe headaches', diagnosis: 'Chronic migraines', prescription: 'Sumatriptan 50mg', notes: 'Avoid stress and lack of sleep', followUpDate: 'After 12 Days', paymentMethod: 'Cash', patientAvatar: 'https://randomuser.me/api/portraits/women/44.jpg' },
    { id: 'VIS003', visitId: 'VIS003', patientName: 'Michael Chen', patientId: 'PT0027', patientType: 'In Patient', department: 'Surgery', doctorName: 'Dr. Robert Johnson', visitDate: '2024-01-15', startTime: '10:30 AM', endTime: '11:30 AM', status: 'Pending', reason: 'Post-surgery follow-up', diagnosis: 'Recovery in progress', prescription: 'Pain medication', notes: 'Physical therapy recommended', followUpDate: 'After 20 Days', paymentMethod: 'Insurance', patientAvatar: 'https://randomuser.me/api/portraits/men/45.jpg' },
    { id: 'VIS004', visitId: 'VIS004', patientName: 'Lisa Wong', patientId: 'PT0028', patientType: 'Out Patient', department: 'Pulmonology', doctorName: 'Dr. Maria Garcia', visitDate: '2024-01-20', startTime: '02:00 PM', endTime: '03:00 PM', status: 'Completed', reason: 'Pneumonia follow-up', diagnosis: 'Recovering well', prescription: 'Antibiotics course completed', notes: 'Continue monitoring', followUpDate: 'After 30 Days', paymentMethod: 'Card', patientAvatar: 'https://randomuser.me/api/portraits/women/55.jpg' },
    { id: 'VIS005', visitId: 'VIS005', patientName: 'Sophia Martinez', patientId: 'PT0029', patientType: 'Out Patient', department: 'Pulmonology', doctorName: 'Dr. Emily Chen', visitDate: '2024-01-25', startTime: '11:00 AM', endTime: '12:00 PM', status: 'Inprogress', reason: 'Asthma attack', diagnosis: 'Acute asthma', prescription: 'Inhaler prescribed', notes: 'Avoid allergens', followUpDate: 'After 10 Days', paymentMethod: 'Cash', patientAvatar: 'https://randomuser.me/api/portraits/women/68.jpg' }
  ];

  useEffect(() => {
    loadVisitsFromStorage();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, departmentFilter, dateFilter]);

  const loadVisitsFromStorage = () => {
    setLoading(true);
    const storedVisits = localStorage.getItem('visits');
    if (storedVisits) {
      const parsedVisits = JSON.parse(storedVisits);
      setVisitsData(parsedVisits);
    } else {
      setVisitsData(defaultVisitsData);
      localStorage.setItem('visits', JSON.stringify(defaultVisitsData));
    }
    setLoading(false);
  };

  const getAllDepartments = () => [...new Set(visitsData.map(v => v.department).filter(Boolean))].sort();
  const getAllStatuses = () => ['Completed', 'Inprogress', 'Pending'];

  const getStatusBadge = (status) => {
    const variants = { Completed: 'success', Inprogress: 'info', Pending: 'warning' };
    return variants[status] || 'warning';
  };

  const getFilteredVisits = () => {
    let filtered = [...visitsData];
    if (searchTerm) {
      filtered = filtered.filter(visit => 
        visit.visitId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visit.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visit.doctorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visit.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visit.patientId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== 'all') filtered = filtered.filter(visit => visit.status === statusFilter);
    if (departmentFilter) filtered = filtered.filter(visit => visit.department === departmentFilter);
    if (dateFilter) filtered = filtered.filter(visit => visit.visitDate === dateFilter);
    return filtered;
  };

  const filteredVisits = getFilteredVisits();
  const totalPages = Math.ceil(filteredVisits.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedVisits = filteredVisits.slice(startIndex, startIndex + itemsPerPage);

  const handleRefresh = () => { 
    setSearchTerm(""); 
    setStatusFilter("all"); 
    setDepartmentFilter(""); 
    setDateFilter("");
    setCurrentPage(1); 
    loadVisitsFromStorage(); 
  };
  
  const handleExport = () => {
    const exportData = getFilteredVisits().map(visit => ({ 
      'Visit ID': visit.visitId, 
      'Patient Name': visit.patientName, 
      'Department': visit.department, 
      'Doctor Name': visit.doctorName, 
      'Visit Date': visit.visitDate, 
      'Status': visit.status, 
      'Reason': visit.reason, 
      'Diagnosis': visit.diagnosis 
    }));
    const link = document.createElement('a');
    link.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    link.download = `visits_export_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };
  
  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        const existingVisits = JSON.parse(localStorage.getItem('visits') || '[]');
        const uniqueVisits = [...existingVisits, ...importedData].filter((visit, index, self) => index === self.findIndex(v => v.id === visit.id));
        localStorage.setItem('visits', JSON.stringify(uniqueVisits));
        setVisitsData(uniqueVisits);
        alert(`Successfully imported ${importedData.length} visits!`);
      } catch (error) { alert('Error parsing JSON file.'); }
    };
    reader.readAsText(file);
    event.target.value = '';
  };
  
  const clearAllFilters = () => { 
    setStatusFilter('all'); 
    setDepartmentFilter(''); 
    setDateFilter('');
    setSearchTerm(''); 
  };
  
  const getActiveFilterCount = () => (statusFilter !== 'all' ? 1 : 0) + (departmentFilter ? 1 : 0) + (dateFilter ? 1 : 0) + (searchTerm ? 1 : 0);

  const handleViewDetails = (visit) => { setSelectedVisit(visit); setShowDetailsModal(true); };
  const handleStartVisit = (visit) => navigate('/appointments/consultation', { state: { visit, patientName: visit.patientName, patientId: visit.patientId, doctorName: visit.doctorName, department: visit.department, visitDate: visit.visitDate } });
  const handleEditClick = (visit) => { setEditingVisit(visit); setShowEditModal(true); };
  const handleSaveEdit = (updatedData) => {
    const updatedVisits = visitsData.map(visit => visit.id === editingVisit.id ? { 
      ...visit, 
      patientName: updatedData.patientName, 
      patientType: updatedData.patientType, 
      department: updatedData.department, 
      doctorName: updatedData.doctorName, 
      visitDate: updatedData.visitDate, 
      startTime: updatedData.time?.split(' - ')[0] || '', 
      endTime: updatedData.time?.split(' - ')[1] || '', 
      reason: updatedData.reason, 
      paymentMethod: updatedData.paymentMethod 
    } : visit);
    setVisitsData(updatedVisits);
    localStorage.setItem('visits', JSON.stringify(updatedVisits));
    setShowEditModal(false);
    setEditingVisit(null);
  };
  const handleAddVisit = (newVisit) => { 
    setVisitsData([...visitsData, newVisit]); 
    localStorage.setItem('visits', JSON.stringify([...visitsData, newVisit])); 
    setShowAddModal(false); 
  };
  const handleDeleteClick = (visit) => { setVisitToDelete(visit); setShowDeleteModal(true); };
  const handleConfirmDelete = () => {
    if (visitToDelete) {
      const updatedVisits = visitsData.filter(v => v.id !== visitToDelete.id);
      localStorage.setItem('visits', JSON.stringify(updatedVisits));
      setVisitsData(updatedVisits);
      setShowDeleteModal(false);
      setVisitToDelete(null);
    }
  };

  const VisitDetailsModal = ({ visit, onClose }) => {
    if (!visit) return null;
    return (
      <Modal isOpen={showDetailsModal} onClose={onClose} title="Visit Details" size="lg">
        <div className="flex items-center gap-4 mb-6">
          <img src={visit.patientAvatar || 'https://randomuser.me/api/portraits/lego/1.jpg'} alt={visit.patientName} className="w-12 h-12 rounded-full object-cover" />
          <div><h3 className="font-semibold text-gray-800 text-lg">{visit.patientName}</h3><p className="text-sm text-gray-500">{visit.visitId}</p></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-gray-500">Doctor Name</label><p className="text-sm text-gray-800">{visit.doctorName}</p></div>
          <div><label className="block text-xs font-medium text-gray-500">Department</label><p className="text-sm text-gray-800">{visit.department}</p></div>
          <div><label className="block text-xs font-medium text-gray-500">Visit Date</label><p className="text-sm text-gray-800">{visit.visitDate}</p></div>
          <div><label className="block text-xs font-medium text-gray-500">Time</label><p className="text-sm text-gray-800">{visit.startTime} - {visit.endTime}</p></div>
          <div><label className="block text-xs font-medium text-gray-500">Status</label><Badge variant={getStatusBadge(visit.status)}>{visit.status}</Badge></div>
          <div><label className="block text-xs font-medium text-gray-500">Follow-up Date</label><p className="text-sm text-gray-800">{visit.followUpDate || 'N/A'}</p></div>
          <div className="col-span-2"><label className="block text-xs font-medium text-gray-500">Reason</label><p className="text-sm text-gray-800">{visit.reason}</p></div>
          <div className="col-span-2"><label className="block text-xs font-medium text-gray-500">Diagnosis</label><p className="text-sm text-gray-800">{visit.diagnosis}</p></div>
          <div className="col-span-2"><label className="block text-xs font-medium text-gray-500">Notes</label><p className="text-sm text-gray-800">{visit.notes}</p></div>
        </div>
        <div className="flex gap-2 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose} fullWidth>Close</Button>
          <Button variant="success" onClick={() => { handleStartVisit(visit); onClose(); }} fullWidth icon={PlayCircle}>Start Visit</Button>
          <Button variant="primary" onClick={() => { handleEditClick(visit); onClose(); }} fullWidth>Edit Visit</Button>
        </div>
      </Modal>
    );
  };

  const RowActionMenu = ({ visit }) => {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);
    useEffect(() => {
      const handleClickOutside = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false); };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    return (
      <div className="relative" ref={menuRef}>
        <Button variant="ghost" size="sm" onClick={() => setShowMenu(!showMenu)} className="p-2"><MoreVertical size={18} /></Button>
        {showMenu && (
          <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <button onClick={() => { handleStartVisit(visit); setShowMenu(false); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-green-600 hover:bg-gray-100 rounded-t-lg"><PlayCircle size={16} /> Start Visit</button>
            <button onClick={() => { handleEditClick(visit); setShowMenu(false); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><Edit size={16} /> Edit</button>
            <div className="border-t border-gray-100 my-1"></div>
            <button onClick={() => { handleDeleteClick(visit); setShowMenu(false); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 rounded-b-lg"><Trash2 size={16} /> Delete</button>
          </div>
        )}
      </div>
    );
  };

  const activeFilterCount = getActiveFilterCount();
  if (loading) return <Loader centered />;

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 font-sans">
      {/* Breadcrumb Navigation */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="p-1">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </Button>
          <div className="text-xs text-gray-500"><span className="text-gray-700">Visits</span><span className="mx-1 text-gray-400">»</span><span>Home</span><span className="mx-1 text-gray-400">»</span><span>Visits</span></div>
        </div>
        <h1 className="text-xl font-bold text-gray-800">Visits</h1>
      </div>

      {/* Search and Action Buttons Row */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="flex-1 max-w-md">
          <SearchBar 
            placeholder="Search by Visit ID, Patient Name, Doctor..." 
            value={searchTerm} 
            onChange={setSearchTerm} 
            onClear={() => setSearchTerm('')} 
          />
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <Button variant="outline" size="sm" onClick={handleRefresh} title="Refresh">
            <RefreshCcw size={16} />
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
          <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
            <Plus size={16} /> New Visit
          </Button>
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
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-12 px-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1C62A0] bg-white">
              <option value="all">All Status</option>
              {getAllStatuses().map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>

            <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="h-12 px-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1C62A0] bg-white">
              <option value="">All Departments</option>
              {getAllDepartments().map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

            <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="h-12 px-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1C62A0]" />
          </div>
        </div>
      )}

      {/* Recent Visits Cards */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Visits</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentVisits.map((visit) => (
            <Card key={visit.id} hover className="overflow-hidden">
              <div className="p-5">
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
                  <img src={visit.patientAvatar} alt={visit.patientName} className="w-12 h-12 rounded-full object-cover" />
                  <div><div className="font-semibold text-gray-900">{visit.patientName}</div><div className="text-xs text-gray-500">Last Visit: {visit.lastVisit}</div></div>
                </div>
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center"><span className="text-sm text-gray-500">Doctor</span><span className="text-sm font-medium text-gray-800">{visit.doctorName}</span></div>
                  <div className="flex justify-between items-center"><span className="text-sm text-gray-500">Treatment</span><span className="text-sm font-medium text-gray-800">{visit.treatment}</span></div>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  <span className="text-sm font-medium text-gray-600">{visit.department}</span>
                  <Button variant="ghost" size="sm" onClick={() => handleStartVisit(visit)} className="text-sm text-blue-600">Start Visit →</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Visits Table */}
      {filteredVisits.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No visits found</h3>
          <Button onClick={clearAllFilters}>Clear All Filters</Button>
        </div>
      ) : (
        <Card>
          <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">
              All Visits 
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded ml-2">{filteredVisits.length}</span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="px-6 py-3">Visit ID</th>
                  <th className="px-6 py-3">Patient Name</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3">Doctor Name</th>
                  <th className="px-6 py-3">Visit Date</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedVisits.map((visit, index) => (
                  <tr key={visit.id || index} className="hover:bg-gray-50 border-b border-gray-100">
                    <td className="px-6 py-4 text-[#1C62A0] font-medium">{visit.visitId || visit.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={visit.patientAvatar || 'https://randomuser.me/api/portraits/lego/1.jpg'} alt={visit.patientName} className="w-8 h-8 rounded-full object-cover" />
                        <span className="font-medium text-gray-800">{visit.patientName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{visit.department}</td>
                    <td className="px-6 py-4 text-gray-600">{visit.doctorName}</td>
                    <td className="px-6 py-4 text-gray-600">{visit.visitDate || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <Badge variant={getStatusBadge(visit.status)}>{visit.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <RowActionMenu visit={visit} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 bg-gray-50 rounded-b-xl border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, filteredVisits.length)} of {filteredVisits.length} visits
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
        </Card>
      )}

      {/* Modals */}
      {showDetailsModal && selectedVisit && <VisitDetailsModal visit={selectedVisit} onClose={() => setShowDetailsModal(false)} />}
      {showEditModal && <EditVisitModal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setEditingVisit(null); }} visit={editingVisit} onSave={handleSaveEdit} />}
      {showAddModal && <AddVisitModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSave={handleAddVisit} />}
      <DeleteModal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setVisitToDelete(null); }} onConfirm={handleConfirmDelete} title="Delete Visit" message="Are you sure you want to delete this visit? This action cannot be undone." itemName={visitToDelete?.visitId} />
    </div>
  );
};

export default Visits;