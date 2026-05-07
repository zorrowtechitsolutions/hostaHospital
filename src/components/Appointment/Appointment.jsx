// src/components/Appointments/Appointments.jsx - With same filter UI
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronRight, Plus, Filter, Download, MoreVertical, Eye, 
  Edit, Users as UsersIcon, RefreshCcw, Upload, Search, Trash2,
  PlayCircle
} from 'lucide-react';
import { 
  Button, Card, Table, TableHead, TableBody, TableRow, 
  TableHeader, TableCell, Avatar, SearchBar, 
  Pagination, Loader 
} from '../ui';
import DeleteModal from '../patients/DeleteModel';
import EditAppointmentModal from '../patients/EditAppointmentModal';
import AddAppointmentModal from './AddAppointmentModal';

const Appointments = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [appointmentToEdit, setAppointmentToEdit] = useState(null);
  const [appointmentToDelete, setAppointmentToDelete] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [appointmentsData, setAppointmentsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const itemsPerPage = 10;

  const defaultAppointmentsData = [
    { 
      id: 'APT001', 
      patientId: 'PT0025',
      patientName: 'James Carter', 
      doctorName: 'Dr. Andrew Clark', 
      department: 'Cardiology',
      appointmentDate: '2025-06-17',
      appointmentDateDisplay: '17 Jun 2025',
      startTime: '09:00 AM',
      endTime: '10:00 AM',
      status: 'Upcoming',
      fee: '$500',
      duration: '1 hour',
      reason: 'Chest pain and shortness of breath',
      notes: 'ECG recommended',
      paymentMethod: 'Insurance',
      patientAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      patientType: 'Out Patient',
      preferredMode: 'In-person',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
    },
    { 
      id: 'APT002', 
      patientId: 'PT0026',
      patientName: 'Emily Rodriguez', 
      doctorName: 'Dr. Katherine Brooks', 
      department: 'Dental Surgery',
      appointmentDate: '2025-06-10',
      appointmentDateDisplay: '10 Jun 2025',
      startTime: '10:30 AM',
      endTime: '11:30 AM',
      status: 'Completed',
      fee: '$350',
      duration: '1 hour',
      reason: 'Tooth pain, Gum swelling',
      notes: 'X-ray recommended before procedure',
      paymentMethod: 'Cash',
      patientAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      patientType: 'Out Patient',
      preferredMode: 'In-person',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg'
    },
    { 
      id: 'APT003', 
      patientId: 'PT0027',
      patientName: 'Michael Chen', 
      doctorName: 'Dr. Benjamin Harris', 
      department: 'Dermatology',
      appointmentDate: '2025-05-22',
      appointmentDateDisplay: '22 May 2025',
      startTime: '01:15 PM',
      endTime: '02:15 PM',
      status: 'Completed',
      fee: '$400',
      duration: '1 hour',
      reason: 'Skin rash, Itching',
      notes: 'Avoid using scented products',
      paymentMethod: 'Insurance',
      patientAvatar: 'https://randomuser.me/api/portraits/men/45.jpg',
      patientType: 'Out Patient',
      preferredMode: 'Video Call',
      avatar: 'https://randomuser.me/api/portraits/men/45.jpg'
    },
    { 
      id: 'APT004', 
      patientId: 'PT0028',
      patientName: 'Lisa Wong', 
      doctorName: 'Dr. Laura Mitchell', 
      department: 'ENT Surgery',
      appointmentDate: '2025-05-15',
      appointmentDateDisplay: '15 May 2025',
      startTime: '11:30 AM',
      endTime: '12:30 PM',
      status: 'Inprogress',
      fee: '$450',
      duration: '1 hour',
      reason: 'Ear infection, Sore throat',
      notes: 'Antibiotics prescribed for 7 days',
      paymentMethod: 'Card',
      patientAvatar: 'https://randomuser.me/api/portraits/women/55.jpg',
      patientType: 'Out Patient',
      preferredMode: 'In-person',
      avatar: 'https://randomuser.me/api/portraits/women/55.jpg'
    },
    { 
      id: 'APT005', 
      patientId: 'PT0029',
      patientName: 'Sophia Martinez', 
      doctorName: 'Dr. Christopher Lewis', 
      department: 'General Medicine',
      appointmentDate: '2025-04-30',
      appointmentDateDisplay: '30 Apr 2025',
      startTime: '12:20 PM',
      endTime: '01:20 PM',
      status: 'Cancelled',
      fee: '$300',
      duration: '1 hour',
      reason: 'Chest pain, Shortness of breath',
      notes: 'ECG done. Follow up in 2 weeks',
      paymentMethod: 'Insurance',
      patientAvatar: 'https://randomuser.me/api/portraits/women/68.jpg',
      patientType: 'In Patient',
      preferredMode: 'Phone Call',
      avatar: 'https://randomuser.me/api/portraits/women/68.jpg'
    }
  ];

  useEffect(() => {
    loadAppointmentsFromStorage();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, departmentFilter, dateFilter]);

  const loadAppointmentsFromStorage = () => {
    setLoading(true);
    const storedAppointments = localStorage.getItem('appointments');
    if (storedAppointments) {
      setAppointmentsData(JSON.parse(storedAppointments));
    } else {
      setAppointmentsData(defaultAppointmentsData);
      localStorage.setItem('appointments', JSON.stringify(defaultAppointmentsData));
    }
    setLoading(false);
  };

  const getAllDepartments = () => {
    const departments = [...new Set(appointmentsData.map(a => a.department).filter(Boolean))];
    return departments.sort();
  };

  const getAllStatuses = () => {
    return ['Upcoming', 'Completed', 'Inprogress', 'Cancelled'];
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      Upcoming: "bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs",
      Completed: "bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs",
      Inprogress: "bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs",
      Cancelled: "bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs"
    };
    return classes[status] || classes.Upcoming;
  };

  const getFilteredAppointments = () => {
    let filtered = [...appointmentsData];
    if (searchTerm) {
      filtered = filtered.filter(apt => 
        apt.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.patientId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.doctorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.department?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }
    if (departmentFilter) {
      filtered = filtered.filter(apt => apt.department === departmentFilter);
    }
    if (dateFilter) {
      filtered = filtered.filter(apt => apt.appointmentDate === dateFilter);
    }
    return filtered;
  };

  const filteredAppointments = getFilteredAppointments();
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAppointments = filteredAppointments.slice(startIndex, startIndex + itemsPerPage);

  const handleRefresh = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDepartmentFilter("");
    setDateFilter("");
    setCurrentPage(1);
    loadAppointmentsFromStorage();
  };

  const handleExport = () => {
    const exportData = getFilteredAppointments().map(apt => ({
      'Appointment ID': apt.id,
      'Patient ID': apt.patientId,
      'Patient Name': apt.patientName,
      'Doctor Name': apt.doctorName,
      'Department': apt.department,
      'Appointment Date': apt.appointmentDateDisplay,
      'Status': apt.status
    }));
    const link = document.createElement('a');
    link.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    link.download = `appointments_export_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        const existingAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
        const uniqueAppointments = [...existingAppointments, ...importedData].filter((apt, index, self) => 
          index === self.findIndex(a => a.id === apt.id)
        );
        localStorage.setItem('appointments', JSON.stringify(uniqueAppointments));
        setAppointmentsData(uniqueAppointments);
        alert(`Successfully imported ${importedData.length} appointments!`);
      } catch (error) {
        alert('Error parsing JSON file. Please make sure it\'s a valid JSON file.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // Navigate to Consultation page
  const handleStartConsultation = (appointment) => {
    navigate('/appointments/consultation', { 
      state: { 
        appointment: appointment,
        patientName: appointment.patientName,
        patientId: appointment.patientId,
        doctorName: appointment.doctorName,
        department: appointment.department,
        appointmentDate: appointment.appointmentDateDisplay,
        reason: appointment.reason,
        notes: appointment.notes
      } 
    });
  };

  const handleViewDetails = (appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailsModal(true);
  };

  const handleEditClick = (appointment) => {
    setAppointmentToEdit(appointment);
    setShowEditModal(true);
  };

  const handleSaveEdit = (updatedData) => {
    const updatedAppointments = appointmentsData.map(apt => 
      apt.id === appointmentToEdit.id 
        ? { 
            ...apt, 
            department: updatedData.department, 
            doctorName: updatedData.doctor, 
            appointmentDate: updatedData.date,
            appointmentDateDisplay: updatedData.date ? new Date(updatedData.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : apt.appointmentDateDisplay,
            startTime: updatedData.startTime, 
            endTime: updatedData.endTime, 
            reason: updatedData.reason, 
            notes: updatedData.notes, 
            paymentMethod: updatedData.paymentMethod,
            patientType: updatedData.patientType,
            preferredMode: updatedData.consultationMode
          } 
        : apt
    );
    setAppointmentsData(updatedAppointments);
    localStorage.setItem('appointments', JSON.stringify(updatedAppointments));
    setShowEditModal(false);
    setAppointmentToEdit(null);
  };

  const handleAddAppointment = (newAppointment) => {
    const updatedAppointments = [...appointmentsData, newAppointment];
    setAppointmentsData(updatedAppointments);
    localStorage.setItem('appointments', JSON.stringify(updatedAppointments));
    setShowAddModal(false);
  };

  const handleDeleteClick = (appointment) => {
    setAppointmentToDelete(appointment);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (appointmentToDelete) {
      const updatedAppointments = appointmentsData.filter(a => a.id !== appointmentToDelete.id);
      localStorage.setItem('appointments', JSON.stringify(updatedAppointments));
      setAppointmentsData(updatedAppointments);
      setShowDeleteModal(false);
      setAppointmentToDelete(null);
    }
  };

  const clearAllFilters = () => {
    setStatusFilter('all');
    setDepartmentFilter('');
    setDateFilter('');
    setSearchTerm('');
  };

  const getActiveFilterCount = () => {
    return (statusFilter !== 'all' ? 1 : 0) + (departmentFilter ? 1 : 0) + (dateFilter ? 1 : 0) + (searchTerm ? 1 : 0);
  };

  // Appointment Details Modal
  const AppointmentDetailsModal = ({ appointment, onClose }) => {
    if (!appointment) return null;
    
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white w-[520px] rounded-xl shadow-lg">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="text-lg font-semibold">Appointment Details</h2>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={appointment.avatar || appointment.patientAvatar} alt="" className="w-10 h-10 rounded-full" />
                <div>
                  <p className="font-medium">{appointment.patientName}</p>
                  <p className="text-sm text-gray-500">Patient</p>
                </div>
              </div>
              <span className={getStatusBadgeClass(appointment.status)}>{appointment.status}</span>
            </div>
            
            <div>
              <p className="font-medium text-sm mb-1">Date & Time</p>
              <p className="text-sm text-gray-800">{appointment.fee} / {appointment.duration || "1 hour"}</p>
              <p className="text-sm text-gray-500">{appointment.appointmentDateDisplay}, {appointment.startTime}</p>
            </div>
            
            <div>
              <p className="font-medium text-sm mb-1">Consultation With</p>
              <p className="text-sm font-medium">{appointment.doctorName}</p>
              <p className="text-sm text-gray-500">{appointment.department}</p>
            </div>
            
            <div>
              <p className="font-medium text-sm mb-1">Reason</p>
              <p className="text-sm text-gray-600">{appointment.reason}</p>
            </div>
            
            <div>
              <p className="font-medium text-sm mb-1">Notes</p>
              <p className="text-sm text-gray-600">{appointment.notes}</p>
            </div>
          </div>
          <div className="flex justify-end gap-3 px-5 py-4 border-t">
            <button onClick={onClose} className="px-4 py-2 border rounded-md text-sm">Cancel</button>
            <button 
              onClick={() => {
                handleStartConsultation(appointment);
                onClose();
              }} 
              className="px-4 py-2 bg-[#1C62A0] text-white rounded-md text-sm"
            >
              Start Consultation
            </button>
          </div>
        </div>
      </div>
    );
  };

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
      <div className="relative" ref={menuRef}>
        <Button variant="ghost" size="sm" onClick={() => setShowMenu(!showMenu)} className="p-2">
          <MoreVertical size={18} />
        </Button>
        {showMenu && (
          <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <button onClick={() => { handleViewDetails(appointment); setShowMenu(false); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg">
              <Eye size={16} /> View Details
            </button>
            <button onClick={() => { handleStartConsultation(appointment); setShowMenu(false); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-green-600 hover:bg-gray-100">
              <PlayCircle size={16} /> Start Consultation
            </button>
            <button onClick={() => { handleEditClick(appointment); setShowMenu(false); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              <Edit size={16} /> Edit
            </button>
            <div className="border-t border-gray-100 my-1"></div>
            <button onClick={() => { handleDeleteClick(appointment); setShowMenu(false); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 rounded-b-lg">
              <Trash2 size={16} /> Delete
            </button>
          </div>
        )}
      </div>
    );
  };

  const activeFilterCount = getActiveFilterCount();

  if (loading) return <Loader centered />;

  return (
    <>
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
              <span className="text-gray-700">Appointments</span>
              <span className="mx-1 text-gray-400">»</span>
              <span>Home</span>
              <span className="mx-1 text-gray-400">»</span>
              <span>Appointments</span>
            </div>
          </div>
          <h1 className="text-xl font-bold text-gray-800">Appointments</h1>
        </div>

        {/* Search and Action Buttons Row */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="flex-1 max-w-md">
            <SearchBar 
              placeholder="Search by Appointment ID, Patient ID, Patient Name, Doctor..." 
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
              <Plus size={16} /> New Appointment
            </Button>
          </div>
        </div>

        {/* FILTER SECTION - Same as Patients and RequestTable */}
        {showFilters && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6 p-6">
            
            {/* HEADER */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center bg-gray-50">
                  <Filter size={18} className="text-[#1C62A0]" />
                </div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-semibold text-gray-800">
                    Filters
                  </h2>
                  {activeFilterCount > 0 && (
                    <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-md">
                      {activeFilterCount} Active Filter{activeFilterCount !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={clearAllFilters}
                className="text-sm font-medium text-red-500 hover:text-red-600"
              >
                Clear All Filters
              </button>
            </div>

            {/* FILTER GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

              {/* STATUS */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-12 px-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1C62A0] bg-white"
              >
                <option value="all">All Status</option>
                {getAllStatuses().map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              {/* DEPARTMENT */}
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="h-12 px-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1C62A0] bg-white"
              >
                <option value="">All Departments</option>
                {getAllDepartments().map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>

              {/* DATE */}
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="h-12 px-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1C62A0]"
              />
            </div>
          </div>
        )}

        {/* Appointments Table */}
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
            <Button onClick={clearAllFilters}>Clear All Filters</Button>
          </div>
        ) : (
          <Card>
            <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
              <h2 className="text-sm font-semibold text-gray-700">
                Total Appointments 
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded ml-2">{filteredAppointments.length}</span>
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
                  <tr>
                    <th className="px-6 py-3">Patient ID</th>
                    <th className="px-6 py-3">Patient Name</th>
                    <th className="px-6 py-3">Doctor Name</th>
                    <th className="px-6 py-3">Department</th>
                    <th className="px-6 py-3">Appointment Date</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right w-16">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAppointments.map((apt, index) => (
                    <tr key={apt.id || index} className="hover:bg-gray-50 border-b border-gray-100">
                      <td className="px-6 py-4 text-[#1C62A0] font-medium">#{apt.patientId}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={apt.patientAvatar || 'https://randomuser.me/api/portraits/lego/1.jpg'} alt={apt.patientName} className="w-8 h-8 rounded-full object-cover" />
                          <span className="font-medium text-gray-800">{apt.patientName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-800">{apt.doctorName}</td>
                      <td className="px-6 py-4 text-gray-600">{apt.department}</td>
                      <td className="px-6 py-4 text-gray-600">{apt.appointmentDateDisplay}</td>
                      <td className="px-6 py-4">
                        <span className={getStatusBadgeClass(apt.status)}>{apt.status}</span>
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
            <div className="px-6 py-3 bg-gray-50 rounded-b-xl border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredAppointments.length)} of {filteredAppointments.length} appointments
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
      </div>

      {/* Appointment Details Modal */}
      {showDetailsModal && selectedAppointment && (
        <AppointmentDetailsModal 
          appointment={selectedAppointment} 
          onClose={() => setShowDetailsModal(false)} 
        />
      )}

      {/* Edit Appointment Modal - Data is auto-populated from appointment prop */}
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

      {/* Add Appointment Modal */}
      <AddAppointmentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddAppointment}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
        onConfirm={handleConfirmDelete} 
        title="Delete Appointment" 
        message="Are you sure you want to delete this appointment? This action cannot be undone." 
        itemName={appointmentToDelete?.id} 
      />
    </>
  );
};

export default Appointments;