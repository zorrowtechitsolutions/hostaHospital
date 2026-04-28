// Visits.jsx - Updated with status filter moved inside filters section
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronRight,
  Plus,
  Filter,
  Download,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  RefreshCcw,
  Upload,
  Search,
  Users as UsersIcon,
  PlayCircle,
  Calendar,
  User,
  Stethoscope
} from 'lucide-react';
import DeleteModal from '../patients/DeleteModel';
import EditVisitModal from './EditVisitModal';
import AddVisitModal from './AddVisitModal';

const Visits = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [visitToDelete, setVisitToDelete] = useState(null);
  
  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingVisit, setEditingVisit] = useState(null);
  
  // Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Visits data state
  const [visitsData, setVisitsData] = useState([]);

  // Recent visits for cards
  const recentVisits = [
    {
      id: 1,
      patientName: 'James Carter',
      patientAvatar: 'https://i.pravatar.cc/45?img=11',
      lastVisit: '20 Feb 2025',
      doctorName: 'Dr. Andrew Clark',
      treatment: 'Electromyography',
      department: 'Neurology'
    },
    {
      id: 2,
      patientName: 'Olivia Miller',
      patientAvatar: 'https://i.pravatar.cc/45?img=32',
      lastVisit: '12 Mar 2025',
      doctorName: 'Dr. Laura Mitchell',
      treatment: 'Angiography',
      department: 'Cardiology'
    },
    {
      id: 3,
      patientName: 'William Brown',
      patientAvatar: 'https://i.pravatar.cc/45?img=14',
      lastVisit: '25 Apr 2025',
      doctorName: 'Dr. Andrew Clark',
      treatment: 'Fever Management',
      department: 'General Medicine'
    }
  ];

  // Load visits from localStorage on component mount
  useEffect(() => {
    loadVisitsFromStorage();
  }, []);

  // Reset page when search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, departmentFilter]);

  // Default visits data
  const defaultVisitsData = [
    {
      id: 'VIS001',
      visitId: 'VIS001',
      patientName: 'James Carter',
      patientId: 'PT0025',
      patientType: 'Out Patient',
      department: 'Cardiology',
      doctorName: 'Dr. Andrew Clark',
      visitDate: '2024-12-21',
      visitDateDisplay: '21 Dec 2024',
      startTime: '07:00 AM',
      endTime: '08:00 AM',
      status: 'Completed',
      reason: 'Chest pain and shortness of breath',
      diagnosis: 'Mild hypertension',
      prescription: 'Metoprolol 25mg',
      notes: 'Follow-up in 2 weeks',
      followUpDate: 'After 15 Days',
      paymentMethod: 'Insurance',
      patientAvatar: 'https://randomuser.me/api/portraits/men/32.jpg'
    },
    {
      id: 'VIS002',
      visitId: 'VIS002',
      patientName: 'Emily Rodriguez',
      patientId: 'PT0026',
      patientType: 'Out Patient',
      department: 'Neurology',
      doctorName: 'Dr. Natalie Foster',
      visitDate: '2024-01-08',
      visitDateDisplay: '08 Jan 2024',
      startTime: '09:55 AM',
      endTime: '10:55 AM',
      status: 'Inprogress',
      reason: 'Severe headaches',
      diagnosis: 'Chronic migraines',
      prescription: 'Sumatriptan 50mg',
      notes: 'Avoid stress and lack of sleep',
      followUpDate: 'After 12 Days',
      paymentMethod: 'Cash',
      patientAvatar: 'https://randomuser.me/api/portraits/women/44.jpg'
    },
    {
      id: 'VIS003',
      visitId: 'VIS003',
      patientName: 'Michael Chen',
      patientId: 'PT0027',
      patientType: 'In Patient',
      department: 'Surgery',
      doctorName: 'Dr. Robert Johnson',
      visitDate: '2024-01-15',
      visitDateDisplay: '15 Jan 2024',
      startTime: '10:30 AM',
      endTime: '11:30 AM',
      status: 'Pending',
      reason: 'Post-surgery follow-up',
      diagnosis: 'Recovery in progress',
      prescription: 'Pain medication',
      notes: 'Physical therapy recommended',
      followUpDate: 'After 20 Days',
      paymentMethod: 'Insurance',
      patientAvatar: 'https://randomuser.me/api/portraits/men/45.jpg'
    },
    {
      id: 'VIS004',
      visitId: 'VIS004',
      patientName: 'Lisa Wong',
      patientId: 'PT0028',
      patientType: 'Out Patient',
      department: 'Pulmonology',
      doctorName: 'Dr. Maria Garcia',
      visitDate: '2024-01-20',
      visitDateDisplay: '20 Jan 2024',
      startTime: '02:00 PM',
      endTime: '03:00 PM',
      status: 'Completed',
      reason: 'Pneumonia follow-up',
      diagnosis: 'Recovering well',
      prescription: 'Antibiotics course completed',
      notes: 'Continue monitoring',
      followUpDate: 'After 30 Days',
      paymentMethod: 'Card',
      patientAvatar: 'https://randomuser.me/api/portraits/women/55.jpg'
    },
    {
      id: 'VIS005',
      visitId: 'VIS005',
      patientName: 'Sophia Martinez',
      patientId: 'PT0029',
      patientType: 'Out Patient',
      department: 'Pulmonology',
      doctorName: 'Dr. Emily Chen',
      visitDate: '2024-01-25',
      visitDateDisplay: '25 Jan 2024',
      startTime: '11:00 AM',
      endTime: '12:00 PM',
      status: 'Inprogress',
      reason: 'Asthma attack',
      diagnosis: 'Acute asthma',
      prescription: 'Inhaler prescribed',
      notes: 'Avoid allergens',
      followUpDate: 'After 10 Days',
      paymentMethod: 'Cash',
      patientAvatar: 'https://randomuser.me/api/portraits/women/68.jpg'
    }
  ];

  const loadVisitsFromStorage = () => {
    const storedVisits = localStorage.getItem('visits');
    if (storedVisits) {
      setVisitsData(JSON.parse(storedVisits));
    } else {
      setVisitsData(defaultVisitsData);
      localStorage.setItem('visits', JSON.stringify(defaultVisitsData));
    }
  };

  const getAllDepartments = () => {
    const departments = [...new Set(visitsData.map(v => v.department).filter(Boolean))];
    return departments.sort();
  };

  const getAllStatuses = () => {
    const statuses = ['Completed', 'Inprogress', 'Pending'];
    return statuses;
  };

  const getStatusBadge = (status) => {
    const styles = {
      Completed: "bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs",
      Inprogress: "bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs",
      Pending: "bg-yellow-100 text-yellow-600 px-2 py-1 rounded-full text-xs"
    };
    return styles[status] || styles.Pending;
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
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(visit => visit.status === statusFilter);
    }
    
    if (departmentFilter) {
      filtered = filtered.filter(visit => visit.department === departmentFilter);
    }
    
    return filtered;
  };

  const filteredVisits = getFilteredVisits();
  const totalPages = Math.ceil(filteredVisits.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedVisits = filteredVisits.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleRefresh = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDepartmentFilter("");
    setCurrentPage(1);
    loadVisitsFromStorage();
  };

  const handleExport = () => {
    const filtered = getFilteredVisits();
    const exportData = filtered.map(visit => ({
      'Visit ID': visit.visitId,
      'Patient Name': visit.patientName,
      'Department': visit.department,
      'Doctor Name': visit.doctorName,
      'Visit Date': visit.visitDateDisplay,
      'Status': visit.status,
      'Reason': visit.reason,
      'Diagnosis': visit.diagnosis
    }));
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `visits_export_${new Date().toISOString().split('T')[0]}.json`;
    
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
        const existingVisits = JSON.parse(localStorage.getItem('visits') || '[]');
        const updatedVisits = [...existingVisits, ...importedData];
        const uniqueVisits = updatedVisits.filter((visit, index, self) => 
          index === self.findIndex(v => v.id === visit.id)
        );
        localStorage.setItem('visits', JSON.stringify(uniqueVisits));
        setVisitsData(uniqueVisits);
        alert(`Successfully imported ${importedData.length} visits!`);
      } catch (error) {
        alert('Error parsing JSON file. Please make sure it\'s a valid JSON file.');
      }
    };
    
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleViewDetails = (visit) => {
    setSelectedVisit(visit);
    setShowDetailsModal(true);
  };

  const handleStartVisit = (visit) => {
    navigate('/appointments/consultation', { 
      state: { 
        visit: visit,
        patientName: visit.patientName,
        patientId: visit.patientId,
        doctorName: visit.doctorName,
        department: visit.department,
        visitDate: visit.visitDateDisplay
      } 
    });
  };

  const handleEditClick = (visit) => {
    setEditingVisit(visit);
    setShowEditModal(true);
  };

  const handleSaveEdit = (updatedData) => {
    const updatedVisits = visitsData.map(visit => 
      visit.id === editingVisit.id 
        ? { 
            ...visit, 
            patientName: updatedData.patientName,
            patientType: updatedData.patientType,
            department: updatedData.department,
            doctorName: updatedData.doctorName,
            visitDate: updatedData.visitDate,
            visitDateDisplay: new Date(updatedData.visitDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
            startTime: updatedData.time.split(' - ')[0] || '',
            endTime: updatedData.time.split(' - ')[1] || '',
            reason: updatedData.reason,
            paymentMethod: updatedData.paymentMethod
          } 
        : visit
    );
    
    setVisitsData(updatedVisits);
    localStorage.setItem('visits', JSON.stringify(updatedVisits));
    setShowEditModal(false);
    setEditingVisit(null);
  };

  const handleAddVisit = (newVisit) => {
    const updatedVisits = [...visitsData, newVisit];
    setVisitsData(updatedVisits);
    localStorage.setItem('visits', JSON.stringify(updatedVisits));
    setShowAddModal(false);
  };

  const handleDeleteClick = (visit) => {
    setVisitToDelete(visit);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (visitToDelete) {
      const existingVisits = JSON.parse(localStorage.getItem('visits') || '[]');
      const updatedVisits = existingVisits.filter(v => v.id !== visitToDelete.id);
      localStorage.setItem('visits', JSON.stringify(updatedVisits));
      setVisitsData(updatedVisits);
      setShowDeleteModal(false);
      setVisitToDelete(null);
    }
  };

  const clearAllFilters = () => {
    setStatusFilter('all');
    setDepartmentFilter('');
    setSearchTerm('');
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (statusFilter !== 'all') count++;
    if (departmentFilter) count++;
    return count;
  };

  // Visit Details Modal Component
  const VisitDetailsModal = ({ visit, onClose }) => {
    if (!visit) return null;

    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999]">
        <div className="bg-white w-[600px] rounded-xl shadow-xl">
          <div className="flex justify-between items-center px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-800">Visit Details</h2>
            <button 
              onClick={onClose} 
              className="bg-gray-800 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-gray-700"
            >
              ×
            </button>
          </div>
          
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <img 
                src={visit.patientAvatar || 'https://randomuser.me/api/portraits/lego/1.jpg'} 
                alt={visit.patientName}
                className="w-16 h-16 rounded-full object-cover"
              />
              <div>
                <h3 className="font-semibold text-gray-800 text-lg">{visit.patientName}</h3>
                <p className="text-sm text-gray-500">{visit.visitId}</p>
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
                <label className="block text-xs font-medium text-gray-500">Visit Date</label>
                <p className="text-sm text-gray-800">{visit.visitDateDisplay}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">Time</label>
                <p className="text-sm text-gray-800">{visit.startTime} - {visit.endTime}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">Status</label>
                <span className={getStatusBadge(visit.status)}>{visit.status}</span>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">Follow-up Date</label>
                <p className="text-sm text-gray-800">{visit.followUpDate || 'N/A'}</p>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-500">Reason</label>
                <p className="text-sm text-gray-800">{visit.reason}</p>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-500">Diagnosis</label>
                <p className="text-sm text-gray-800">{visit.diagnosis}</p>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-500">Notes</label>
                <p className="text-sm text-gray-800">{visit.notes}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 p-4 border-t">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
            <button
              onClick={() => {
                handleStartVisit(visit);
                onClose();
              }}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center gap-2"
            >
              <PlayCircle size={16} /> Start Visit
            </button>
            <button
              onClick={() => {
                handleEditClick(visit);
                onClose();
              }}
              className="flex-1 px-4 py-2 bg-[#1C62A0] text-white rounded-md hover:bg-[#154a7d]"
            >
              Edit Visit
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Row Action Menu Component
  const RowActionMenu = ({ visit }) => {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
      const handleClickOutside = (e) => {
        if (menuRef.current && !menuRef.current.contains(e.target)) {
          setShowMenu(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 rounded hover:bg-gray-100 transition-colors"
        >
          <MoreVertical size={18} />
        </button>
        
        {showMenu && (
          <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <button
              onClick={() => {
                handleStartVisit(visit);
                setShowMenu(false);
              }}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-green-600 hover:bg-gray-100 rounded-t-lg"
            >
              <PlayCircle size={16} />
              Start Visit
            </button>
            <button
              onClick={() => {
                handleEditClick(visit);
                setShowMenu(false);
              }}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Edit size={16} />
              Edit
            </button>
            <div className="border-t border-gray-100 my-1"></div>
            <button
              onClick={() => {
                handleDeleteClick(visit);
                setShowMenu(false);
              }}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 rounded-b-lg"
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        )}
      </div>
    );
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <>
      <div className="min-h-screen bg-[#F8F9FA] p-6 font-sans">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <button
              onClick={() => navigate(-1)}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              title="Go back"
            >
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
        </div>

        {/* Search Bar and Action Buttons - Status filter removed from here */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by Visit ID, Patient Name, Doctor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
              <button className="absolute right-2 top-1.5 bg-[#1C62A0] p-1 rounded">
                <Search size={14} className="text-white" />
              </button>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap items-center">
            <button onClick={handleRefresh} className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50" title="Refresh">
              <RefreshCcw size={16} />
            </button>

            <input
              type="file"
              onChange={handleImport}
              accept=".json"
              className="hidden"
              id="import-file"
            />
            <label
              htmlFor="import-file"
              className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50 cursor-pointer"
              title="Import Visits"
            >
              <Upload size={16} />
            </label>

            <button onClick={handleExport} className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50" title="Export Visits">
              <Download size={16} />
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`relative p-2 border border-gray-200 rounded-md bg-white ${
                showFilters || activeFilterCount > 0 ? 'text-blue-600' : 'text-gray-500'
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

            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-[#1C62A0] rounded-md flex items-center gap-2"
            >
              <Plus size={16} /> New Visit
            </button>
          </div>
        </div>

        {/* Collapsible Filter Section - Status filter moved here */}
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
                <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full border border-gray-300 text-sm rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  {getAllStatuses().map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

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
            </div>
          </div>
        )}

        {/* Recent Visits Cards */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Visits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentVisits.map((visit) => (
              <div key={visit.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300">
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
                    <img 
                      src={visit.patientAvatar} 
                      alt={visit.patientName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-semibold text-gray-900">{visit.patientName}</div>
                      <div className="text-xs text-gray-500">Last Visit: {visit.lastVisit}</div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Doctor</span>
                      <span className="text-sm font-medium text-gray-800">{visit.doctorName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Treatment</span>
                      <span className="text-sm font-medium text-gray-800">{visit.treatment}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <span className="text-sm font-medium text-gray-600">{visit.department}</span>
                    <button
                      onClick={() => handleStartVisit(visit)}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                    >
                      Start Visit →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Visits Table */}
        {filteredVisits.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No visits found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
            <button
              onClick={clearAllFilters}
              className="mt-4 px-4 py-2 bg-[#1C62A0] text-white rounded-md hover:bg-blue-700"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
              <h2 className="text-sm font-semibold text-gray-700">
                All Visits
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded ml-2">
                  {filteredVisits.length}
                </span>
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
                      <td className="px-6 py-4 text-[#1C62A0] font-medium">#{visit.visitId}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={visit.patientAvatar || 'https://randomuser.me/api/portraits/lego/1.jpg'} 
                            alt={visit.patientName} 
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <span className="font-medium text-gray-800">{visit.patientName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{visit.department}</td>
                      <td className="px-6 py-4 text-gray-600">{visit.doctorName}</td>
                      <td className="px-6 py-4 text-gray-600">{visit.visitDateDisplay}</td>
                      <td className="px-6 py-4">
                        <span className={getStatusBadge(visit.status)}>{visit.status}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <RowActionMenu visit={visit} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredVisits.length > 0 && (
              <div className="px-6 py-3 bg-gray-50 rounded-b-xl border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, filteredVisits.length)} of {filteredVisits.length} visits
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 border rounded-md text-sm transition-all ${
                      currentPage === 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-600 hover:bg-gray-50"
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
                        : "bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Visit Details Modal */}
      {showDetailsModal && selectedVisit && (
        <VisitDetailsModal visit={selectedVisit} onClose={() => setShowDetailsModal(false)} />
      )}

      {/* Edit Visit Modal */}
      <EditVisitModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingVisit(null);
        }}
        visit={editingVisit}
        onSave={handleSaveEdit}
      />

      {/* Add Visit Modal */}
      <AddVisitModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddVisit}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setVisitToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Visit"
        message="Are you sure you want to delete this visit? This action cannot be undone."
        itemName={visitToDelete?.visitId}
      />
    </>
  );
};

export default Visits;