// src/components/patients/Patients.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Calendar, 
  Activity,
  Plus,
  Download,
  Mail,
  Phone,
  MoreVertical,
  Eye,
  Edit,
  Users as UsersIcon,
  LayoutGrid,
  List,
  RefreshCcw,
  Upload,
  Trash2,
  Filter
} from 'lucide-react';
import AddAppointmentModal from './AddAppointmentModal';
import DeleteModal from './DeleteModel';
import ApproveRequestModal from '../Requests/ApproveRequestModel';
import { 
  Button, 
  Badge, 
  Loader, 
  Pagination, 
  SearchBar,
  Card
} from '../ui';
import { useGetPatientsQuery, useDeletePatientMutation } from '../../../app/service/patients';
import { useCreateBookingMutation } from '../../../app/service/request';
import { getAuthUser } from '../../utils/auth';

const Patients = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
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
  
  // Approve Modal State
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Get hospitalId from auth
  const authUser = getAuthUser();
  const hospitalId = authUser?.id;

  // API hooks
  const { 
    data: patientsResponse, 
    isLoading: isLoadingPatients,
    refetch: refetchPatients
  } = useGetPatientsQuery({
    hospitalId: hospitalId,
    search: searchTerm || undefined,
    page: currentPage,
    limit: itemsPerPage
  });

  const [deletePatient] = useDeletePatientMutation();
  const [createBooking, { isLoading: isCreatingBooking }] = useCreateBookingMutation();

  // Get patients array from response
  const allPatients = patientsResponse?.data?.patients || patientsResponse?.data || [];
  const totalPatients = patientsResponse?.data?.total || allPatients.length;
  const totalPages = patientsResponse?.data?.totalPages || Math.ceil(totalPatients / itemsPerPage);

  // Separate patients into outpatient and inpatient based on patientType
  const outpatientPatients = allPatients.filter(p => p.patientType === 'Outpatient' || !p.patientType);
  const inpatientPatients = allPatients.filter(p => p.patientType === 'Inpatient');

  // Get active patients based on tab
  const getActivePatients = () => {
    if (activeTab === 'outpatient') return outpatientPatients;
    if (activeTab === 'inpatient') return inpatientPatients;
    return allPatients;
  };

  const activePatients = getActivePatients();

  // Filter by gender and department
  const getFilteredPatients = () => {
    let patients = [...activePatients];
    
    if (genderFilter) {
      patients = patients.filter(patient => 
        patient.gender === genderFilter
      );
    }
    
    if (departmentFilter) {
      patients = patients.filter(patient => 
        patient.department === departmentFilter
      );
    }
    
    return patients;
  };

  const filteredPatients = getFilteredPatients();
  const paginatedPatients = filteredPatients.slice(0, itemsPerPage);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, departmentFilter, dateFilter, genderFilter, activeTab]);

  // Navigation handlers
  const handleViewDetails = (patient) => {
    navigate(`/patients/${patient.id || patient._id}`, { state: { patient } });
  };

  const handleAddPatient = () => {
    navigate('/add-patient');
  };

  const handleEditPatient = (patient) => {
    navigate(`/edit-patient/${patient.id || patient._id}`, { state: { patient } });
  };

  const handleDeleteClick = (patient) => {
    setPatientToDelete(patient);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (patientToDelete) {
      try {
        await deletePatient(patientToDelete.id || patientToDelete._id).unwrap();
        refetchPatients();
        setShowDeleteModal(false);
        setPatientToDelete(null);
      } catch (error) {
        console.error('Error deleting patient:', error);
        alert('Failed to delete patient. Please try again.');
      }
    }
  };

  const handleRefresh = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDepartmentFilter("");
    setDateFilter("");
    setGenderFilter("");
    setCurrentPage(1);
    refetchPatients();
  };

  const handleExport = () => {
    const exportData = filteredPatients.map(patient => ({
      'ID': patient.id || patient._id,
      'Name': patient.name,
      'Gender': patient.gender,
      'Age': patient.age,
      'Phone': patient.mobileNumber,
      'Email': patient.email || '',
      'Blood Group': patient.bloodGroup,
      'Patient Type': patient.patientType || 'Outpatient',
      'Created At': patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : ''
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
        alert(`Import functionality requires bulk create endpoint. Found ${importedData.length} records.`);
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

  // Handle proceed from AddAppointmentModal
  const handleProceedApprove = (data) => {
    setBookingData(data);
    setShowAppointmentModal(false);
    setShowApproveModal(true);
  };

  // Handle confirm appointment - FINAL VERSION with correct payload (no userId/hospitalId)
 // Handle confirm appointment - ALTERNATIVE PAYLOAD VERSION
const handleConfirmAppointment = async (approveData) => {
  try {
    const payload = {
      userId: bookingData?.userId,
      patient_name: bookingData?.patient_name,
      patient_dob: bookingData?.patient_dob,
      patient_place: bookingData?.patient_place,
      patient_phone: bookingData?.patient_phone,
      hospitalId: bookingData?.hospitalId,
      doctorId: bookingData?.doctorId,
      booking_date: approveData?.booking_date,
      department: bookingData?.department,
      displayName: bookingData?.displayName,
      status: "accepted"
    };

    console.log("CREATE APPOINTMENT", payload);

    await createBooking(payload).unwrap();

    setShowApproveModal(false);
    setBookingData(null);

    navigate("/appointments");
  } catch (error) {
    console.log("BOOKING ERROR", error);
  }
};

  const clearAllFilters = () => {
    setStatusFilter('all');
    setDateFilter('');
    setDepartmentFilter('');
    setGenderFilter('');
    setSearchTerm('');
    setActiveTab('all');
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (statusFilter !== 'all') count++;
    if (dateFilter) count++;
    if (departmentFilter) count++;
    if (genderFilter) count++;
    if (searchTerm) count++;
    if (activeTab !== 'all') count++;
    return count;
  };

  // Get unique departments for filter dropdown
  const getAllDepartments = () => {
    const departments = [...new Set(allPatients.map(p => p.department).filter(Boolean))];
    return departments.sort();
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
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
        <button onClick={() => setShowMenu(!showMenu)} className="p-2 rounded hover:bg-gray-100 transition-colors">
          <MoreVertical size={18} />
        </button>
        {showMenu && (
          <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <button onClick={() => { handleViewDetails(patient); setShowMenu(false); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg">
              <Eye size={16} /> View Details
            </button>
            <button onClick={() => { handleEditPatient(patient); setShowMenu(false); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              <Edit size={16} /> Edit
            </button>
            <button onClick={() => { handleAddAppointmentModal(patient); setShowMenu(false); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-green-700 hover:bg-gray-100">
              <Calendar size={16} /> Appointment
            </button>
            <div className="border-t border-gray-100 my-1"></div>
            <button onClick={() => { handleDeleteClick(patient); setShowMenu(false); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 rounded-b-lg">
              <Trash2 size={16} /> Delete
            </button>
          </div>
        )}
      </div>
    );
  };

  // Patient Card Component for Grid View
  const PatientCard = ({ patient }) => {
    return (
      <Card hover className="overflow-hidden cursor-pointer" onClick={() => handleViewDetails(patient)}>
        <div className="p-5" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flexShrink: 0 }}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="default" className="text-xs font-mono">
                      #PT00{patient.id || patient._id?.slice(-6)}
                    </Badge>
                    <Badge variant={patient.patientType === 'Inpatient' ? 'danger' : 'success'} className="text-xs">
                      {patient.patientType || 'Outpatient'}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg mt-1">{patient.name}</h3>
                  <p className="text-xs text-gray-500">{patient.age || 'N/A'} years • {patient.gender || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }} className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4" />
                <span>Mobile</span>
              </div>
              <span className="font-medium text-gray-900 truncate max-w-[150px]">{patient.mobileNumber}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4" />
                <span>Email</span>
              </div>
              <span className="font-medium text-gray-900 truncate max-w-[150px]">{patient.email || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Activity className="w-4 h-4" />
                <span>Blood Group</span>
              </div>
              <span className="font-medium text-gray-900">{patient.bloodGroup || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Created</span>
              </div>
              <span className="font-medium text-gray-900">{formatDate(patient.createdAt)}</span>
            </div>
          </div>
          
          <div style={{ flexShrink: 0, marginTop: 'auto', paddingTop: '1rem' }}>
            <div className="flex gap-2 border-t border-gray-100 pt-4">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddAppointmentModal(patient);
                }} 
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
              >
                <Calendar className="w-4 h-4" /> 
                Add Appointment
              </button>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  const activeFilterCount = getActiveFilterCount();

  // Centered loader
  if (isLoadingPatients && !allPatients.length) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <Loader />
      </div>
    );
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
            <span className="text-gray-700">Patients</span>
            <span className="mx-1 text-gray-400">»</span>
            <span>Home</span>
            <span className="mx-1 text-gray-400">»</span>
            <span>Patients</span>
          </div>
        </div>
        <h1 className="text-xl font-bold text-gray-800">Patients</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'all' 
              ? 'text-[#1C62A0] border-b-2 border-[#1C62A0]' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          All Patients ({allPatients.length})
        </button>
        <button
          onClick={() => setActiveTab('outpatient')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'outpatient' 
              ? 'text-[#1C62A0] border-b-2 border-[#1C62A0]' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Outpatients ({outpatientPatients.length})
        </button>
        <button
          onClick={() => setActiveTab('inpatient')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'inpatient' 
              ? 'text-[#1C62A0] border-b-2 border-[#1C62A0]' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Inpatients ({inpatientPatients.length})
        </button>
      </div>

      {/* Search and Action Buttons Row */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="flex-1 max-w-md">
          <SearchBar 
            placeholder="Search by name, mobile..." 
            value={searchTerm} 
            onChange={setSearchTerm} 
            onClear={() => setSearchTerm('')} 
          />
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

          <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" id="import-file" />
          <label htmlFor="import-file" className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50 cursor-pointer" title="Import Patients">
            <Upload size={16} />
          </label>

          <button onClick={handleExport} className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50" title="Export Patients">
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

          <Button onClick={handleAddPatient} className="flex items-center gap-2">
            <Plus size={16} /> New Patient
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
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="h-12 px-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1C62A0] bg-white"
            >
              <option value="">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>

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
          </div>
        </div>
      )}

      {/* Patients View */}
      {filteredPatients.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
          <p className="text-gray-500">Try adjusting your search or filter criteria</p>
        </div>
      ) : viewMode === 'grid' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {paginatedPatients.map((patient) => (
              <PatientCard key={patient.id || patient._id} patient={patient} />
            ))}
          </div>
          
          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={totalPatients}
                itemsPerPage={itemsPerPage}
                itemLabel="patients"
                variant="centered"
              />
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">
              Total Patients
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded ml-2">{filteredPatients.length}</span>
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="px-6 py-3">Patient ID</th>
                  <th className="px-6 py-3">Patient Name</th>
                  <th className="px-6 py-3">Gender</th>
                  <th className="px-6 py-3">Mobile Number</th>
                  <th className="px-6 py-3">Blood Group</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPatients.map((patient) => (
                  <tr key={patient.id || patient._id} className="hover:bg-gray-50 border-b border-gray-100">
                    <td className="px-6 py-4 text-[#1C62A0] font-medium">
                      #PT00{patient.id || patient._id?.slice(-6)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <span 
                          onClick={() => handleViewDetails(patient)} 
                          className="font-medium text-gray-800 cursor-pointer hover:text-[#1C62A0]"
                        >
                          {patient.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{patient.gender || 'N/A'}</td>
                    <td className="px-6 py-4 text-gray-600">{patient.mobileNumber}</td>
                    <td className="px-6 py-4 text-gray-600">{patient.bloodGroup || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <Badge variant={patient.patientType === 'Inpatient' ? 'warning' : 'info'} className="text-xs">
                        {patient.patientType || 'Outpatient'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <RowActionMenu patient={patient} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPatients.length > 0 && totalPages > 1 && (
            <div className="px-6 py-3 bg-gray-50 rounded-b-xl border-t border-gray-200">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={totalPatients}
                itemsPerPage={itemsPerPage}
                itemLabel="patients"
              />
            </div>
          )}
        </div>
      )}

      {/* Add Appointment Modal */}
      {showAppointmentModal && (
        <AddAppointmentModal
          isOpen={showAppointmentModal}
          patient={appointmentPatient}
          onClose={() => {
            setShowAppointmentModal(false);
            setAppointmentPatient(null);
          }}
          onProceedApprove={handleProceedApprove}
        />
      )}

      {/* Approve Request Modal - No bookingId prop needed */}
      {showApproveModal && bookingData && (
        <ApproveRequestModal
          requestData={bookingData}
          onClose={() => {
            setShowApproveModal(false);
            setBookingData(null);
          }}
          onConfirm={handleConfirmAppointment}
          isLoading={isCreatingBooking}
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