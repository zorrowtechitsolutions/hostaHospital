// Patients.jsx - With DeleteModal integration
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Calendar, 
  MapPin, 
  Activity,
  ChevronRight,
  Plus,
  Filter,
  Download,
  Mail,
  Phone,
  MoreVertical,
  Eye,
  Edit,
  X,
  Users as UsersIcon,
  BedDouble,
  Stethoscope,
  LayoutGrid,
  List,
  RefreshCcw,
  Upload,
  Search,
  Clock,
  FileText,
  Video,
  MessageSquare,
  ChevronUp,
  ChevronDown,
  Trash2
} from 'lucide-react';
import AddAppointmentModal from './AddAppointmentModal';
import DeleteModal from './DeleteModel';

const Patients = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [appointmentPatient, setAppointmentPatient] = useState(null);
  const [patientType, setPatientType] = useState('outpatient');
  const [viewMode, setViewMode] = useState('list');
  const [showFilters, setShowFilters] = useState(false);
  
  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState(null);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');

  // Patient data state
  const [patientsData, setPatientsData] = useState({
    outpatient: [],
    inpatient: []
  });

  // Load patients from localStorage on component mount
  useEffect(() => {
    loadPatientsFromStorage();
  }, []);

  const loadPatientsFromStorage = () => {
    const storedPatients = localStorage.getItem('patients');
    if (storedPatients) {
      const parsedPatients = JSON.parse(storedPatients);
      const newOutpatient = [];
      const newInpatient = [];
      parsedPatients.forEach(patient => {
        if (patient.roomNumber) {
          newInpatient.push(patient);
        } else {
          newOutpatient.push(patient);
        }
      });
      setPatientsData({
        outpatient: newOutpatient,
        inpatient: newInpatient
      });
    } else {
      // Load default mock data if no patients in storage
      const defaultPatients = {
        outpatient: [
          {
            id: 'PT0025',
            name: 'James Carter',
            firstName: 'James',
            lastName: 'Carter',
            lastVisit: '2025-06-17',
            lastVisitDisplay: '17 Jun 2025',
            gender: 'Male',
            location: 'California',
            age: 45,
            phone: '+1 (555) 123-4567',
            email: 'james.carter@email.com',
            bloodType: 'O+',
            condition: 'Hypertension',
            doctor: 'Dr. Sarah Wilson',
            nextAppointment: '15 Jul 2025',
            imageUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
            status: 'Stable',
            insurance: 'Blue Cross',
            lastPrescription: 'Lisinopril 10mg',
            department: 'Cardiology'
          },
          {
            id: 'PT0026',
            name: 'Emily Rodriguez',
            firstName: 'Emily',
            lastName: 'Rodriguez',
            lastVisit: '2025-06-15',
            lastVisitDisplay: '15 Jun 2025',
            gender: 'Female',
            location: 'New York',
            age: 32,
            phone: '+1 (555) 234-5678',
            email: 'emily.r@email.com',
            bloodType: 'A-',
            condition: 'Migraine',
            doctor: 'Dr. Michael Lee',
            nextAppointment: '20 Jul 2025',
            imageUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
            status: 'Improving',
            insurance: 'Aetna',
            lastPrescription: 'Sumatriptan 50mg',
            department: 'Neurology'
          },
          {
            id: 'PT0029',
            name: 'Sophia Martinez',
            firstName: 'Sophia',
            lastName: 'Martinez',
            lastVisit: '2025-06-10',
            lastVisitDisplay: '10 Jun 2025',
            gender: 'Female',
            location: 'Texas',
            age: 28,
            phone: '+1 (555) 567-8901',
            email: 'sophia.m@email.com',
            bloodType: 'B+',
            condition: 'Asthma',
            doctor: 'Dr. Emily Chen',
            nextAppointment: '25 Jul 2025',
            imageUrl: 'https://randomuser.me/api/portraits/women/68.jpg',
            status: 'Controlled',
            insurance: 'UnitedHealth',
            lastPrescription: 'Albuterol Inhaler',
            department: 'Pulmonology'
          }
        ],
        inpatient: [
          {
            id: 'PT0027',
            name: 'Michael Chen',
            firstName: 'Michael',
            lastName: 'Chen',
            lastVisit: '2025-06-18',
            lastVisitDisplay: '18 Jun 2025',
            gender: 'Male',
            location: 'Florida',
            age: 58,
            phone: '+1 (555) 345-6789',
            email: 'michael.chen@email.com',
            bloodType: 'AB+',
            condition: 'Post-Surgery Recovery',
            doctor: 'Dr. Robert Johnson',
            nextAppointment: '22 Jun 2025',
            imageUrl: 'https://randomuser.me/api/portraits/men/45.jpg',
            status: 'Critical',
            insurance: 'Medicare',
            roomNumber: '304-A',
            admissionDate: '10 Jun 2025',
            dischargeDate: '25 Jun 2025',
            department: 'Surgery'
          },
          {
            id: 'PT0028',
            name: 'Lisa Wong',
            firstName: 'Lisa',
            lastName: 'Wong',
            lastVisit: '2025-06-16',
            lastVisitDisplay: '16 Jun 2025',
            gender: 'Female',
            location: 'Washington',
            age: 42,
            phone: '+1 (555) 456-7890',
            email: 'lisa.wong@email.com',
            bloodType: 'O-',
            condition: 'Pneumonia',
            doctor: 'Dr. Maria Garcia',
            nextAppointment: '24 Jun 2025',
            imageUrl: 'https://randomuser.me/api/portraits/women/55.jpg',
            status: 'Stable',
            insurance: 'Kaiser Permanente',
            roomNumber: '412-B',
            admissionDate: '14 Jun 2025',
            dischargeDate: '28 Jun 2025',
            department: 'Pulmonology'
          }
        ]
      };
      setPatientsData(defaultPatients);
      localStorage.setItem('patients', JSON.stringify([...defaultPatients.outpatient, ...defaultPatients.inpatient]));
    }
  };

  // Navigation handler for View Details
  const handleViewDetails = (patient) => {
    navigate(`/patients/${patient.id}`, { state: { patient } });
  };

  // Navigation handler for Add Patient
  const handleAddPatient = () => {
    navigate('/add-patient');
  };

  // Navigation handler for Edit Patient - Navigate to edit page
  const handleEditPatient = (patient) => {
    navigate(`/edit-patient/${patient.id}`, { state: { patient } });
  };

  // Updated delete handler to use modal
  const handleDeleteClick = (patient) => {
    setPatientToDelete(patient);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (patientToDelete) {
      const existingPatients = JSON.parse(localStorage.getItem('patients') || '[]');
      const updatedPatients = existingPatients.filter(p => p.id !== patientToDelete.id);
      localStorage.setItem('patients', JSON.stringify(updatedPatients));
      loadPatientsFromStorage();
      
      // Close modal and clear selection
      setShowDeleteModal(false);
      setPatientToDelete(null);
    }
  };

  // Get unique departments for filter dropdown
  const getAllDepartments = () => {
    const allPatients = [...patientsData.outpatient, ...patientsData.inpatient];
    const departments = [...new Set(allPatients.map(p => p.department).filter(Boolean))];
    return departments.sort();
  };

  const getFilteredPatients = () => {
    let patients = [...patientsData.outpatient, ...patientsData.inpatient];
    
    if (searchTerm) {
      patients = patients.filter(patient => 
        patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (patient.location && patient.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (patient.firstName && patient.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (patient.lastName && patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (statusFilter !== 'all') {
      patients = patients.filter(patient => {
        const isInPatient = patient.roomNumber ? true : false;
        if (statusFilter === 'inpatient') return isInPatient === true;
        if (statusFilter === 'outpatient') return isInPatient === false;
        return true;
      });
    }
    
    if (dateFilter) {
      patients = patients.filter(patient => 
        patient.lastVisit === dateFilter
      );
    }
    
    if (departmentFilter) {
      patients = patients.filter(patient => 
        patient.department === departmentFilter
      );
    }
    
    if (genderFilter) {
      patients = patients.filter(patient => 
        patient.gender === genderFilter
      );
    }
    
    return patients;
  };

  const handleRefresh = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDepartmentFilter("");
    setDateFilter("");
    setGenderFilter("");
    loadPatientsFromStorage();
  };

  const handleExport = () => {
    const filteredPatients = getFilteredPatients();
    const exportData = filteredPatients.map(patient => ({
      'ID': patient.id,
      'Name': patient.name,
      'Gender': patient.gender,
      'Age': patient.age,
      'Location': patient.location || patient.city || '',
      'Phone': patient.phone,
      'Email': patient.email || '',
      'Condition': patient.condition,
      'Status': patient.status,
      'Blood Group': patient.bloodType || patient.bloodGroup,
      'Last Visit': patient.lastVisitDisplay,
      'Next Appointment': patient.nextAppointment || 'N/A'
    }));
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `patients_export_${new Date().toISOString().split('T')[0]}.json`;
    
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
        const existingPatients = JSON.parse(localStorage.getItem('patients') || '[]');
        const updatedPatients = [...existingPatients, ...importedData];
        localStorage.setItem('patients', JSON.stringify(updatedPatients));
        loadPatientsFromStorage();
        alert(`Successfully imported ${importedData.length} patients!`);
      } catch (error) {
        alert('Error parsing JSON file. Please make sure it\'s a valid JSON file.');
      }
    };
    
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleAddAppointmentModal = (patient) => {
    setAppointmentPatient(patient);
    setShowAppointmentModal(true);
  };

  const clearAllFilters = () => {
    setStatusFilter('all');
    setDateFilter('');
    setDepartmentFilter('');
    setGenderFilter('');
    setSearchTerm('');
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (statusFilter !== 'all') count++;
    if (dateFilter) count++;
    if (departmentFilter) count++;
    if (genderFilter) count++;
    if (searchTerm) count++;
    return count;
  };

  // PatientCard for Grid View with dropdown menu
  const PatientCard = ({ patient, type }) => {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);
    const isOutpatient = type === 'outpatient';
    const statusColors = {
      'Stable': 'bg-green-100 text-green-700',
      'Improving': 'bg-blue-100 text-blue-700',
      'Controlled': 'bg-green-100 text-green-700',
      'Critical': 'bg-red-100 text-red-700',
      'Serious': 'bg-orange-100 text-orange-700',
      'Active': 'bg-green-100 text-green-700'
    };

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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300 overflow-hidden">
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <img 
                src={patient.imageUrl || `https://randomuser.me/api/portraits/${patient.gender === 'Male' ? 'men' : 'women'}/1.jpg`} 
                alt={patient.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-blue-100"
                onError={(e) => {
                  e.target.src = `https://randomuser.me/api/portraits/${patient.gender === 'Male' ? 'men' : 'women'}/1.jpg`;
                }}
              />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    {patient.id}
                  </span>
                  {!isOutpatient && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                      Room {patient.roomNumber}
                    </span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[patient.status] || 'bg-gray-100 text-gray-700'}`}>
                    {patient.status || 'Active'}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 text-lg mt-1">{patient.name}</h3>
                <p className="text-xs text-gray-500">{patient.age} years • {patient.gender}</p>
              </div>
            </div>
            
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MoreVertical className="w-4 h-4 text-gray-500" />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <button
                    onClick={() => {
                      handleViewDetails(patient);
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg"
                  >
                    <Eye size={16} />
                    View Details
                  </button>
                  <button
                    onClick={() => {
                      handleEditPatient(patient);
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Edit size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      handleAddAppointmentModal(patient);
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-green-700 hover:bg-gray-100"
                  >
                    <Calendar size={16} />
                    Appointment
                  </button>
                  <button
                    onClick={() => {
                      handleDeleteClick(patient);
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
          </div>
          
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Stethoscope className="w-4 h-4" />
                <span>Department</span>
              </div>
              <span className="font-medium text-gray-900">{patient.department || 'General'}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <User className="w-4 h-4" />
                <span>Doctor</span>
              </div>
              <span className="font-medium text-gray-900">{patient.doctor || 'Not Assigned'}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Last Visit</span>
              </div>
              <span className="font-medium text-gray-900">{patient.lastVisitDisplay || 'N/A'}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4" />
                <span>Phone</span>
              </div>
              <span className="font-medium text-gray-900">{patient.phone || patient.mobileNumber}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Activity className="w-4 h-4" />
                <span>Blood Type</span>
              </div>
              <span className="font-medium text-gray-900">{patient.bloodType || patient.bloodGroup || 'N/A'}</span>
            </div>
          </div>
          
          <div className="flex gap-2 pt-3 border-t border-gray-100">
            <button 
              onClick={() => handleAddAppointmentModal(patient)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
            >
              <Calendar className="w-4 h-4" />
              Add Appointment
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Row Action Menu Component for List View
  const RowActionMenu = ({ patient }) => {
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
                handleViewDetails(patient);
                setShowMenu(false);
              }}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg"
            >
              <Eye size={16} />
              View Details
            </button>
            <button
              onClick={() => {
                handleEditPatient(patient);
                setShowMenu(false);
              }}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Edit size={16} />
              Edit
            </button>
            <button
              onClick={() => {
                handleAddAppointmentModal(patient);
                setShowMenu(false);
              }}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-green-700 hover:bg-gray-100"
            >
              <Calendar size={16} />
              Appointment
            </button>
            <div className="border-t border-gray-100 my-1"></div>
            <button
              onClick={() => {
                handleDeleteClick(patient);
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

  const filteredPatients = getFilteredPatients();
  const activeFilterCount = getActiveFilterCount();

  return (
    <div className="min-h-screen bg-gray-50 overflow-y-auto">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">
          Patients
        </h1>
        <div className="text-sm text-gray-500 flex items-center gap-2">
          <span>Home</span>
          <ChevronRight size={14} />
          <span className="text-gray-700 font-medium">Patients</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Search Bar and Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by patient name or ID..."
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`relative p-2.5 rounded-lg transition-all duration-200 ${
                showFilters || activeFilterCount > 0
                  ? "bg-blue-600 text-white shadow-md"
                  : "border border-gray-300 text-gray-600 hover:bg-gray-100"
              }`}
              title="Toggle Filters"
            >
              <Filter size={18} />
              {activeFilterCount > 0 && !showFilters && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setViewMode("grid")}
              className={`p-2.5 rounded-lg transition-all duration-200 ${
                viewMode === "grid"
                  ? "bg-blue-600 text-white shadow-md"
                  : "border border-gray-300 text-gray-600 hover:bg-gray-100"
              }`}
              title="Grid View"
            >
              <LayoutGrid size={18} />
            </button>

            <button
              onClick={() => setViewMode("list")}
              className={`p-2.5 rounded-lg transition-all duration-200 ${
                viewMode === "list"
                  ? "bg-blue-600 text-white shadow-md"
                  : "border border-gray-300 text-gray-600 hover:bg-gray-100"
              }`}
              title="List View"
            >
              <List size={18} />
            </button>

            <button
              onClick={handleRefresh}
              className="p-2.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-all duration-200"
              title="Refresh"
            >
              <RefreshCcw size={18} />
            </button>

            <label className="p-2.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-all duration-200 cursor-pointer">
              <Upload size={18} />
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>

            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-all duration-200"
            >
              <Download size={18} />
              <span className="hidden sm:inline">Export</span>
            </button>

            <button
              onClick={handleAddPatient}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#1C62A0] text-white rounded-lg hover:bg-[#154a7d] transition-all duration-200 shadow-sm"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">New Patient</span>
            </button>
          </div>
        </div>

        {/* Collapsible Filter Section */}
        {showFilters && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
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
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full border border-gray-300 text-sm rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Patients</option>
                    <option value="outpatient">Out Patient</option>
                    <option value="inpatient">In Patient</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Last Visit Date</label>
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full border border-gray-300 text-sm rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
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

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Gender</label>
                  <select
                    value={genderFilter}
                    onChange={(e) => setGenderFilter(e.target.value)}
                    className="w-full border border-gray-300 text-sm rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Genders</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>
            </div>
            </div>
        )}

        {/* Patients View */}
        {filteredPatients.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
            <button
              onClick={clearAllFilters}
              className="mt-4 px-4 py-2 bg-[#1C62A0] text-white rounded-lg hover:bg-[#154a7d] transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPatients.map((patient, index) => {
              const isOutpatient = patientsData.outpatient.some(p => p.id === patient.id);
              return <PatientCard key={patient.id || index} patient={patient} type={isOutpatient ? 'outpatient' : 'inpatient'} />;
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-visible">
            <div 
              className="overflow-x-auto overflow-visible" 
              style={{ 
                scrollbarWidth: 'none', 
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              <table className="w-full text-sm text-left overflow-visible">
                <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3">Patient ID</th>
                    <th className="px-6 py-3">Patient Name</th>
                    <th className="px-6 py-3">Gender</th>
                    <th className="px-6 py-3">Department</th>
                    <th className="px-6 py-3">Doctor Name</th>
                    <th className="px-6 py-3">Last Visit</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPatients.map((patient, index) => {
                    const isInPatient = patient.roomNumber ? true : false;
                    return (
                      <tr key={patient.id || index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-700">#{patient.id}</td>
                        <td className="px-6 py-4 flex items-center gap-3">
                          <img 
                            src={patient.imageUrl || `https://randomuser.me/api/portraits/${patient.gender === 'Male' ? 'men' : 'women'}/1.jpg`} 
                            alt={patient.name} 
                            className="w-8 h-8 rounded-full object-cover"
                            onError={(e) => {
                              e.target.src = `https://randomuser.me/api/portraits/${patient.gender === 'Male' ? 'men' : 'women'}/1.jpg`;
                            }}
                          />
                          <span className="font-medium text-gray-900">{patient.name}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{patient.gender}</td>
                        <td className="px-6 py-4 text-gray-600">{patient.department || 'General'}</td>
                        <td className="px-6 py-4 flex items-center gap-2">
                          <span className="text-gray-700">{patient.doctor || 'Not Assigned'}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{patient.lastVisitDisplay || 'N/A'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 text-xs rounded-full ${isInPatient ? "bg-purple-100 text-purple-600" : "bg-orange-100 text-orange-600"}`}>
                            {isInPatient ? "In Patient" : "Out Patient"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <RowActionMenu patient={patient} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 bg-gray-50 rounded-b-xl border-t border-gray-200 text-xs text-gray-500">
              Showing {filteredPatients.length} of {patientsData.outpatient.length + patientsData.inpatient.length} patients
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAppointmentModal && (
        <AddAppointmentModal
          isOpen={showAppointmentModal}
          onClose={() => setShowAppointmentModal(false)}
          patient={appointmentPatient}
          onSave={(appointmentData) => {
            console.log('Appointment saved:', appointmentData);
            alert(`Appointment scheduled for ${appointmentPatient?.name} on ${appointmentData.appointmentDate} at ${appointmentData.startTime}`);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setPatientToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Patient"
        message="Are you sure you want to delete this patient? This action cannot be undone."
        itemName={patientToDelete?.name}
      />
    </div>
  );
};

export default Patients;