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
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Patient data state
  const [patientsData, setPatientsData] = useState({
    outpatient: [],
    inpatient: []
  });

  // Load patients from localStorage on component mount
  useEffect(() => {
    loadPatientsFromStorage();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, departmentFilter, dateFilter, genderFilter]);

  const loadPatientsFromStorage = () => {
    setLoading(true);
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
    setLoading(false);
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

  const filteredPatients = getFilteredPatients();
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPatients = filteredPatients.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleRefresh = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDepartmentFilter("");
    setDateFilter("");
    setGenderFilter("");
    setCurrentPage(1);
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

  // PatientCard for Grid View with FIXED button positioning (buttons align at bottom)
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300 overflow-hidden h-full flex flex-col">
        <div className="p-5 flex flex-col h-full">
          {/* Header section - This stays at top */}
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
          
          {/* Info rows - This grows to push button down */}
          <div className="flex-grow space-y-3 mb-4">
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
          
          {/* Button section - This sticks to bottom of card */}
          <div className="flex gap-2 pt-3 border-t border-gray-100 mt-auto">
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

  const activeFilterCount = getActiveFilterCount();

  return (
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
            <span className="text-gray-700">Patients</span>
            <span className="mx-1 text-gray-400">»</span>
            <span>Home</span>
            <span className="mx-1 text-gray-400">»</span>
            <span>Patients</span>
          </div>
        </div>
        <h1 className="text-xl font-bold text-gray-800">Patients</h1>
      </div>

      {/* Search Bar and Action Buttons */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="flex flex-1 gap-3 w-full lg:w-auto">
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Search by name, ID..."
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
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-600 bg-white"
          >
            <option value="all">All Status</option>
            <option value="outpatient">Out Patient</option>
            <option value="inpatient">In Patient</option>
          </select>
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <div className="flex border border-gray-200 rounded-md bg-white mr-2">
            <button onClick={() => setViewMode('grid')} className={`p-2 ${viewMode === 'grid' ? 'bg-[#1C62A0] text-white' : 'text-gray-400'}`}>
              <LayoutGrid size={16} />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-2 ${viewMode === 'list' ? 'bg-[#1C62A0] text-white' : 'text-gray-400'}`}>
              <List size={16} />
            </button>
          </div>

          <button onClick={handleRefresh} className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50" title="Refresh">
            <RefreshCcw size={16} />
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current.click()}
            className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50"
            title="Import Patients"
          >
            <Upload size={16} />
          </button>

          <button onClick={handleExport} className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50" title="Export Patients">
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
            onClick={handleAddPatient}
            className="px-4 py-2 text-sm font-medium text-white bg-[#1C62A0] rounded-md flex items-center gap-2"
          >
            <Plus size={16} /> New Patient
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
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Last Visit Date</label>
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

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1C62A0]"></div>
        </div>
      )}

      {/* Patients View */}
      {!loading && filteredPatients.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
          <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          <button
            onClick={clearAllFilters}
            className="mt-4 px-4 py-2 bg-[#1C62A0] text-white rounded-md hover:bg-blue-700"
          >
            Clear All Filters
          </button>
        </div>
      ) : !loading && viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredPatients.map((patient, index) => {
            const isOutpatient = patientsData.outpatient.some(p => p.id === patient.id);
            return <PatientCard key={patient.id || index} patient={patient} type={isOutpatient ? 'outpatient' : 'inpatient'} />;
          })}
        </div>
      ) : !loading && viewMode === 'list' ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">
              Total Patients
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded ml-2">
                {filteredPatients.length}
              </span>
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="px-6 py-3">Patient ID</th>
                  <th className="px-6 py-3">Patient Name</th>
                  <th className="px-6 py-3">Gender</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3">Doctor Name</th>
                  <th className="px-6 py-3">Last Visit</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPatients.map((patient, index) => {
                  const isInPatient = patient.roomNumber ? true : false;
                  return (
                    <tr key={patient.id || index} className="hover:bg-gray-50 border-b border-gray-100">
                      <td className="px-6 py-4 text-[#1C62A0] font-medium">#{patient.id}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={patient.imageUrl || `https://randomuser.me/api/portraits/${patient.gender === 'Male' ? 'men' : 'women'}/1.jpg`} 
                            alt={patient.name} 
                            className="w-8 h-8 rounded-full object-cover"
                            onError={(e) => {
                              e.target.src = `https://randomuser.me/api/portraits/${patient.gender === 'Male' ? 'men' : 'women'}/1.jpg`;
                            }}
                          />
                          <span
                            onClick={() => handleViewDetails(patient)}
                            className="font-medium text-gray-800 cursor-pointer hover:text-[#1C62A0]"
                          >
                            {patient.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{patient.gender}</td>
                      <td className="px-6 py-4 text-gray-600">{patient.department || 'General'}</td>
                      <td className="px-6 py-4 text-gray-600">{patient.doctor || 'Not Assigned'}</td>
                      <td className="px-6 py-4 text-gray-600">{patient.lastVisitDisplay || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${isInPatient ? "bg-purple-100 text-purple-600" : "bg-orange-100 text-orange-600"}`}>
                          {isInPatient ? "In Patient" : "Out Patient"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <RowActionMenu patient={patient} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredPatients.length > 0 && (
            <div className="px-6 py-3 bg-gray-50 rounded-b-xl border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredPatients.length)} of {filteredPatients.length} patients
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
      ) : null}

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