// src/components/patients/Patients.jsx - With Deleted/Blacklisted Support and Recover Functionality
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
  Filter,
  Search,
  RotateCcw
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
import { 
  useGetPatientsQuery, 
  useDeletePatientMutation,
  useRecoverPatientMutation 
} from '../../../app/service/patients';
import { useCreateBookingMutation } from '../../../app/service/request';
import { getAuthUser } from '../../utils/auth';
import { showSuccessToast, showErrorToast } from '../ui/Toast';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getS3ImageUrl } from '../../../app/service/S3';

// ✅ Import socket
import { socket } from '../../socket/socket';
// ✅ Import socket event listeners
import { registerPatientEvents, unregisterPatientEvents } from '../../socket/patientEvents';

const Patients = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [appointmentPatient, setAppointmentPatient] = useState(null);
  const [patientType, setPatientType] = useState('outpatient');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  // Track if showing deleted patients
  const [showDeleted, setShowDeleted] = useState(false);
  
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

  // ✅ Track if events are registered
  const [eventsRegistered, setEventsRegistered] = useState(false);

  // Get hospitalId from auth
  const authUser = getAuthUser();
  const hospitalId = authUser?.id;

  // API hooks WITH QUERY PARAMETERS - using server-side pagination
  const { 
    data: patientsResponse, 
    isLoading: isLoadingPatients,
    refetch: refetchPatients,
    isFetching
  } = useGetPatientsQuery({
    hospitalId: hospitalId,
    search_query: searchTerm?.trim() || undefined,
    page: currentPage,
    limit: itemsPerPage,
    ...(genderFilter && { gender: genderFilter }),
    includeDeleted: showDeleted // ✅ Include deleted patients when showDeleted is true
  });

  const [deletePatient] = useDeletePatientMutation();
  const [recoverPatient] = useRecoverPatientMutation(); // ✅ Add recover mutation
  const [createBooking, { isLoading: isCreatingBooking }] = useCreateBookingMutation();

  // ✅ Register socket event listeners
  useEffect(() => {
    console.log("🔄 Registering patient event listeners...");
    console.log("📡 Socket connected:", socket.connected);
    
    registerPatientEvents({
      onPatientRegistered: async (data) => {
        console.log("👤 NEW PATIENT REGISTERED:", data);
        showSuccessToast(`New patient registered!`, 3000);
        const result = await refetchPatients();
        console.log("📊 REFETCH RESULT (REGISTERED):", result);
      },

      onPatientUpdated: async (data) => {
        console.log("✏️ PATIENT UPDATED:", data);
        showSuccessToast(`Patient updated!`, 3000);
        const result = await refetchPatients();
        console.log("📊 REFETCH RESULT (UPDATED):", result);
      },

      onPatientDeleted: async (data) => {
        console.log("🗑️ PATIENT DELETED:", data);
        showSuccessToast(`Patient deleted!`, 3000);
        const result = await refetchPatients();
        console.log("📊 REFETCH RESULT (DELETED):", result);
        console.log("📊 NEW DATA:", result?.data);
      },

      // ✅ Handle PATIENT_RECOVERED event
      onPatientRecovered: async (data) => {
        console.log("♻️ PATIENT RECOVERED:", data);
        showSuccessToast(`Patient recovered successfully!`, 3000);
        const result = await refetchPatients();
        console.log("📊 REFETCH RESULT (RECOVERED):", result);
      }
    });

    setEventsRegistered(true);

    // ✅ Cleanup: Unregister events when component unmounts
    return () => {
      console.log("🧹 Unregistering patient events...");
      unregisterPatientEvents();
      setEventsRegistered(false);
    };
  }, []); // ✅ Run once on mount

  // ✅ Listen for socket connection/disconnection
  useEffect(() => {
    const handleConnect = () => {
      console.log("✅ Socket CONNECTED - Patient events will work!");
      // Re-register events on reconnect if not registered
      if (!eventsRegistered) {
        registerPatientEvents({
          onPatientRegistered: async (data) => {
            console.log("👤 NEW PATIENT REGISTERED (reconnect):", data);
            showSuccessToast(`New patient registered!`, 3000);
            await refetchPatients();
          },
          onPatientUpdated: async (data) => {
            console.log("✏️ PATIENT UPDATED (reconnect):", data);
            showSuccessToast(`Patient updated!`, 3000);
            await refetchPatients();
          },
          onPatientDeleted: async (data) => {
            console.log("🗑️ PATIENT DELETED (reconnect):", data);
            showSuccessToast(`Patient deleted!`, 3000);
            await refetchPatients();
          },
          // ✅ Handle PATIENT_RECOVERED on reconnect
          onPatientRecovered: async (data) => {
            console.log("♻️ PATIENT RECOVERED (reconnect):", data);
            showSuccessToast(`Patient recovered successfully!`, 3000);
            await refetchPatients();
          }
        });
        setEventsRegistered(true);
      }
    };

    const handleDisconnect = () => {
      console.log("❌ Socket DISCONNECTED - Patient events won't work!");
      setEventsRegistered(false);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [refetchPatients, eventsRegistered]);

  // ✅ Log all socket events for debugging
  useEffect(() => {
    const handleAnyEvent = (event, ...args) => {
      console.log(`📡 ALL SOCKET EVENTS - PATIENT: ${event}:`, args);
    };

    socket.onAny(handleAnyEvent);

    return () => {
      socket.offAny(handleAnyEvent);
    };
  }, []);

  // Get patients array and pagination info from response
  const allPatients = patientsResponse?.data || [];
  const totalItems = patientsResponse?.pagination?.totalItems || 0;
  const totalPages = patientsResponse?.pagination?.totalPages || 1;

  // ✅ Transform patient data to include isDelete and isActive flags
  const transformPatientData = (patients) => {
    if (!patients || !Array.isArray(patients)) return [];
    
    return patients.map((patient) => {
      // Determine status based on isDelete flag
      let status = 'Active';
      if (patient.isDelete) {
        status = 'Blacklisted';
      } else if (patient.isActive === false) {
        status = 'Inactive';
      }
      
      return {
        ...patient,
        // Ensure these flags exist
        isDelete: patient.isDelete || false,
        isActive: patient.isActive !== undefined ? patient.isActive : true,
        displayStatus: status
      };
    });
  };

  const transformedPatients = transformPatientData(allPatients);

  // Separate patients into outpatient and inpatient based on patientType
  const outpatientPatients = transformedPatients.filter(p => p.patientType === 'Outpatient' || !p.patientType);
  const inpatientPatients = transformedPatients.filter(p => p.patientType === 'Inpatient');

  // Get active patients based on tab (client-side filtering for tabs)
  const getActivePatients = () => {
    if (activeTab === 'outpatient') return outpatientPatients;
    if (activeTab === 'inpatient') return inpatientPatients;
    return transformedPatients;
  };

  const activePatients = getActivePatients();

  // Apply local filters for gender and department (client-side filtering)
  const filteredPatients = activePatients.filter(p => {
    if (genderFilter && p.gender !== genderFilter) return false;
    if (departmentFilter && p.department !== departmentFilter) return false;
    return true;
  });

  // Use server-side totalPages for pagination
  const totalFilteredItems = totalItems;
  const totalFilteredPages = totalPages;

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, genderFilter, departmentFilter, activeTab, showDeleted]);

  // Navigation handlers
  const handleViewDetails = (patient) => {
    // ✅ Don't allow viewing details of blacklisted patients
    if (patient.isDelete) {
      showErrorToast('Cannot view details of blacklisted patient', 3000);
      return;
    }
    navigate(`/patients/${patient.id || patient._id}`, { state: { patient } });
  };

  const handleAddPatient = () => {
    navigate('/add-patient');
  };

  const handleEditPatient = (patient) => {
    // ✅ Don't allow editing of blacklisted patients
    if (patient.isDelete) {
      showErrorToast('Cannot edit blacklisted patient', 3000);
      return;
    }
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
        await refetchPatients();
        setShowDeleteModal(false);
        setPatientToDelete(null);
        showSuccessToast(`${patientToDelete.name} has been deleted successfully!`, 2000);
      } catch (error) {
        console.error('Error deleting patient:', error);
        showErrorToast('Failed to delete patient. Please try again.', 3000);
      }
    }
  };

  // ✅ Recover handler
  const handleRecoverPatient = async (patient) => {
    try {
      await recoverPatient(patient.id || patient._id).unwrap();
      showSuccessToast(`${patient.name} recovered successfully!`, 2000);
      refetchPatients();
    } catch (error) {
      console.error('Recover error:', error);
      showErrorToast(error?.data?.message || 'Failed to recover patient', 3000);
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
    showSuccessToast("Refreshed patients", 2000);
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
      'Status': patient.isDelete ? 'Blacklisted' : (patient.isActive ? 'Active' : 'Inactive'),
      'Created At': patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : ''
    }));
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `patients_export_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    showSuccessToast(`Exported ${exportData.length} patients`, 2000);
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        showSuccessToast(`Import functionality requires bulk create endpoint. Found ${importedData.length} records.`, 4000);
        refetchPatients();
      } catch (error) {
        showErrorToast('Error parsing JSON file. Please make sure it\'s a valid JSON file.', 3000);
      }
    };
    
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleAddAppointmentModal = (patient) => {
    // ✅ Don't allow appointments for blacklisted patients
    if (patient.isDelete) {
      showErrorToast('Cannot create appointment for blacklisted patient', 3000);
      return;
    }
    setAppointmentPatient(patient);
    setShowAppointmentModal(true);
  };

  const handleProceedApprove = (data) => {
    const patientId = appointmentPatient?.id || appointmentPatient?._id;
    
    const updatedData = {
      ...data,
      patientId: patientId ? `#PT00${String(patientId)}` : null,
    };

    setBookingData(updatedData);
    setShowAppointmentModal(false);
    setShowApproveModal(true);
  };

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const calculateAge = (dob) => {
    if (!dob) return 0;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    if (today.getMonth() < birth.getMonth() || 
        (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleConfirmAppointment = async (approveData) => {
    try {
      const payload = {
        patientId: bookingData?.patientId ? Number(bookingData.patientId.replace("#PT00", "")) : null,
        userId: Number(bookingData?.userId),
        patient_name: bookingData?.patient_name,
        patient_dob: formatDate(bookingData?.patient_dob),
        patient_place: bookingData?.patient_place,
        patient_phone: bookingData?.patient_phone,
        patient_age: calculateAge(bookingData?.patient_dob),
        patient_gender: bookingData?.patient_gender || appointmentPatient?.gender,
        hospitalId: Number(bookingData?.hospitalId),
        doctorId: Number(bookingData?.doctorId),
        booking_date: formatDate(approveData?.booking_date),
        department: bookingData?.department,
        displayName: bookingData?.displayName,
        consulting_time: approveData?.consulting_time,
        token: approveData?.token ? parseInt(approveData.token) : null,
        status: "accepted",
        booking_status: "hospital booking"
      };

      const response = await createBooking(payload).unwrap();

      showSuccessToast(
        "Appointment confirmed successfully!",
        4000,
        {
          Patient: payload.patient_name,
          Doctor: bookingData?.displayName,
          Date: approveData.booking_date,
          Time: approveData.consulting_time,
          Token: response?.data?.token || payload.token
        }
      );

      setShowApproveModal(false);
      setBookingData(null);
      setAppointmentPatient(null);
      navigate("/appointments");
    } catch (err) {
      console.log("BOOKING ERROR:", err);
      showErrorToast(err?.data?.message || "Failed to confirm appointment", 3000);
    }
  };

  const clearAllFilters = () => {
    setStatusFilter('all');
    setDateFilter('');
    setDepartmentFilter('');
    setGenderFilter('');
    setSearchTerm('');
    setActiveTab('all');
    setCurrentPage(1);
    showSuccessToast("All filters cleared", 2000);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (statusFilter !== 'all') count++;
    if (dateFilter) count++;
    if (departmentFilter) count++;
    if (genderFilter) count++;
    if (searchTerm) count++;
    if (activeTab !== 'all') count++;
    if (showDeleted) count++;
    return count;
  };

  // Get unique departments for filter dropdown
  const getAllDepartments = () => {
    const departments = [...new Set(transformedPatients.map(p => p.department).filter(Boolean))];
    return departments.sort();
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ✅ Updated RowActionMenu Component - Shows Recover for Blacklisted patients
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
      <div className="relative inline-block" ref={menuRef}>
        <button onClick={() => setShowMenu(!showMenu)} className="p-2 rounded hover:bg-gray-100 transition-colors">
          <MoreVertical size={18} />
        </button>
        {showMenu && (
          <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            {/* ✅ View Details - Only for Active/Inactive patients */}
            {!patient.isDelete && (
              <button 
                onClick={() => { handleViewDetails(patient); setShowMenu(false); }} 
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg"
              >
                <Eye size={16} /> View Details
              </button>
            )}
            
            {/* ✅ Edit - Only for Active/Inactive patients */}
            {!patient.isDelete && (
              <button 
                onClick={() => { handleEditPatient(patient); setShowMenu(false); }} 
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Edit size={16} /> Edit
              </button>
            )}
            
            {/* ✅ Appointment - Only for Active/Inactive patients */}
            {!patient.isDelete && (
              <button 
                onClick={() => { handleAddAppointmentModal(patient); setShowMenu(false); }} 
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-green-700 hover:bg-gray-100"
              >
                <Calendar size={16} /> Appointment
              </button>
            )}
            
            {/* Show divider only if there are items above */}
            {!patient.isDelete && <div className="border-t border-gray-100 my-1"></div>}
            
            {/* ✅ Show Delete or Recover based on isDelete status */}
            {patient.isDelete ? (
              <button 
                onClick={() => { handleRecoverPatient(patient); setShowMenu(false); }} 
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-green-600 hover:bg-gray-100 rounded-lg"
              >
                <RotateCcw size={16} /> Recover Patient
              </button>
            ) : (
              <button 
                onClick={() => { handleDeleteClick(patient); setShowMenu(false); }} 
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 rounded-b-lg"
              >
                <Trash2 size={16} /> Delete
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const activeFilterCount = getActiveFilterCount();

  // Centered loader
  if (isLoadingPatients && !transformedPatients.length) {
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
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-200 rounded transition-colors">
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
          All Patients ({totalItems})
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
        <div className="flex flex-1 gap-3 w-full lg:w-auto">
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Search by name, mobile..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1C62A0]"
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
            <button className="absolute right-2 top-1.5 bg-gradient-to-r from-green-600 to-emerald-600 p-1 rounded">
              <Search className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <div className="flex border border-gray-200 rounded-md bg-white mr-2">
            <button 
              onClick={() => setViewMode('grid')} 
              className={`p-2 rounded-l-md transition-colors ${viewMode === 'grid' ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white' : 'text-gray-400 hover:bg-gray-50'}`}
            >
              <LayoutGrid size={16} />
            </button>
            <button 
              onClick={() => setViewMode('list')} 
              className={`p-2 rounded-r-md transition-colors ${viewMode === 'list' ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white' : 'text-gray-400 hover:bg-gray-50'}`}
            >
              <List size={16} />
            </button>
          </div>

          <button 
            onClick={handleRefresh} 
            className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50 transition-colors" 
            title="Refresh" 
            disabled={isFetching}
          >
            <RefreshCcw size={16} className={isFetching ? "animate-spin" : ""} />
          </button>

          <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" id="import-file" />
          <label htmlFor="import-file" className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50 cursor-pointer" title="Import Patients">
            <Upload size={16} />
          </label>

          <button 
            onClick={handleExport} 
            className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50 transition-colors" 
            title="Export Patients"
          >
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

          <Button 
            onClick={handleAddPatient} 
            className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
          >
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <select
              value={genderFilter}
              onChange={(e) => {
                setGenderFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-12 px-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1C62A0] bg-white"
            >
              <option value="">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>

            <select
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
                setCurrentPage(1);
              }}
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
          <p className="text-sm text-gray-500">
            {showDeleted ? "No deleted patients found" : "Try adjusting your search or filters"}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredPatients.map((patient) => {
              const isBlacklisted = patient.isDelete;
              return (
                <div 
                  key={patient.id || patient._id} 
                  className={`bg-white rounded-xl border ${isBlacklisted ? 'border-gray-300 bg-gray-50' : 'border-gray-200'} shadow-sm hover:shadow-md transition-shadow overflow-hidden ${!isBlacklisted ? 'cursor-pointer' : ''}`}
                  onClick={() => !isBlacklisted && handleViewDetails(patient)}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar className={`w-12 h-12 ${isBlacklisted ? 'opacity-60' : ''}`}>
                          <AvatarImage 
                            src={getS3ImageUrl(patient.imageKey)} 
                            alt={patient.name}
                            className="object-cover"
                          />
                          <AvatarFallback className={`${isBlacklisted ? 'bg-gray-300 text-gray-500' : 'bg-blue-100 text-blue-600'} text-base font-medium`}>
                            {patient.name?.charAt(0)?.toUpperCase() || "P"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="default" className="text-xs font-mono">
                              #PT00{patient.id || patient._id?.slice(-6)}
                            </Badge>
                            {isBlacklisted ? (
                              <Badge variant="secondary" className="text-xs">
                                Blacklisted
                              </Badge>
                            ) : (
                              <Badge variant={patient.patientType === 'Inpatient' ? 'danger' : 'success'} className="text-xs">
                                {patient.patientType || 'Outpatient'}
                              </Badge>
                            )}
                          </div>
                          <h3 className={`font-semibold text-lg mt-1 ${isBlacklisted ? 'text-gray-500' : 'text-gray-900'}`}>
                            {patient.name}
                          </h3>
                          <p className={`text-xs ${isBlacklisted ? 'text-gray-400' : 'text-gray-500'}`}>
                            {patient.age || 'N/A'} years • {patient.gender || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span>Mobile</span>
                        </div>
                        <span className={`font-medium ${isBlacklisted ? 'text-gray-400' : 'text-gray-900'} truncate max-w-[150px]`}>
                          {patient.mobileNumber}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="w-4 h-4" />
                          <span>Email</span>
                        </div>
                        <span className={`font-medium ${isBlacklisted ? 'text-gray-400' : 'text-gray-900'} truncate max-w-[150px]`}>
                          {patient.email || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Activity className="w-4 h-4" />
                          <span>Blood Group</span>
                        </div>
                        <span className={`font-medium ${isBlacklisted ? 'text-gray-400' : 'text-gray-900'}`}>
                          {patient.bloodGroup || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>Created</span>
                        </div>
                        <span className={`font-medium ${isBlacklisted ? 'text-gray-400' : 'text-gray-900'}`}>
                          {formatDisplayDate(patient.createdAt)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Action buttons - Show Recover for blacklisted, Appointment for active */}
                    <div className="flex gap-2 border-t border-gray-100 pt-4">
                      {isBlacklisted ? (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRecoverPatient(patient);
                          }} 
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                        >
                          <RotateCcw className="w-4 h-4" /> 
                          Recover
                        </button>
                      ) : (
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
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination for Grid View - Using server-side totalPages */}
          {totalFilteredPages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalFilteredPages}
                onPageChange={handlePageChange}
                totalItems={totalFilteredItems}
                itemsPerPage={itemsPerPage}
                itemLabel="patients"
                variant="centered"
              />
            </div>
          )}
        </>
      ) : (
        /* LIST VIEW - WITH STICKY PAGINATION using server-side totalPages */
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">
              {showDeleted ? "Deleted Patients" : "Total Patients"}
              <span className={`text-white text-xs px-2 py-0.5 rounded ml-2 ${
                showDeleted ? 'bg-gray-500' : 'bg-red-500'
              }`}>
                {totalFilteredItems}
              </span>
            </h2>
          </div>

          {/* Flex container that expands to fill available space */}
          <div className="flex flex-col min-h-[500px]">
            {/* Table area - grows to take available space */}
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
                  <tr>
                    <th className="px-6 py-3">Patient ID</th>
                    <th className="px-6 py-3">Patient Name</th>
                    <th className="px-6 py-3">Gender</th>
                    <th className="px-6 py-3">Mobile Number</th>
                    <th className="px-6 py-3">Blood Group</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right w-16">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((patient) => {
                    const isBlacklisted = patient.isDelete;
                    return (
                      <tr 
                        key={patient.id || patient._id} 
                        className={`hover:bg-gray-50 border-b border-gray-100 ${isBlacklisted ? 'bg-gray-50' : ''}`}
                      >
                        <td className={`px-6 py-4 font-medium ${isBlacklisted ? 'text-gray-500' : 'text-[#1C62A0]'}`}>
                          #PT00{patient.id || patient._id?.slice(-6)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className={`w-8 h-8 ${isBlacklisted ? 'opacity-60' : ''}`}>
                              <AvatarImage 
                                src={getS3ImageUrl(patient.imageKey)} 
                                alt={patient.name}
                                className="object-cover"
                              />
                              <AvatarFallback className={`${isBlacklisted ? 'bg-gray-200 text-gray-500' : 'bg-gray-200 text-gray-600'} text-xs font-medium`}>
                                {patient.name?.charAt(0)?.toUpperCase() || "P"}
                              </AvatarFallback>
                            </Avatar>
                            <span 
                              onClick={() => !isBlacklisted && handleViewDetails(patient)} 
                              className={`font-medium ${isBlacklisted ? 'text-gray-500 cursor-default' : 'text-gray-800 cursor-pointer hover:text-[#1C62A0]'}`}
                            >
                              {patient.name}
                            </span>
                          </div>
                        </td>
                        <td className={`px-6 py-4 ${isBlacklisted ? 'text-gray-400' : 'text-gray-600'}`}>
                          {patient.gender || 'N/A'}
                        </td>
                        <td className={`px-6 py-4 ${isBlacklisted ? 'text-gray-400' : 'text-gray-600'}`}>
                          {patient.mobileNumber}
                        </td>
                        <td className={`px-6 py-4 ${isBlacklisted ? 'text-gray-400' : 'text-gray-600'}`}>
                          {patient.bloodGroup || 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          {isBlacklisted ? (
                            <Badge variant="secondary" className="text-xs">
                              Blacklisted
                            </Badge>
                          ) : (
                            <Badge variant={patient.patientType === 'Inpatient' ? 'warning' : 'info'} className="text-xs">
                              {patient.patientType || 'Outpatient'}
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant={
                              isBlacklisted
                                ? 'secondary'
                                : patient.isActive
                                ? 'success'
                                : 'danger'
                            }
                            className="text-xs"
                          >
                            {isBlacklisted
                              ? 'Blacklisted'
                              : patient.isActive
                              ? 'Active'
                              : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end">
                            <RowActionMenu patient={patient} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination - Sticks to bottom using mt-auto with server-side totalPages */}
            <div className="mt-auto px-6 py-4 bg-gray-50 border-t border-gray-200">
              <Pagination
                currentPage={currentPage}
                totalPages={totalFilteredPages}
                onPageChange={handlePageChange}
                totalItems={totalFilteredItems}
                itemsPerPage={itemsPerPage}
                itemLabel="patients"
              />
            </div>
          </div>
        </div>
      )}

      {/* Add Appointment Modal */}
      {showAppointmentModal && (
        <AddAppointmentModal
          isOpen={showAppointmentModal}
          patient={appointmentPatient}
          onClose={() => {
            setShowAppointmentModal(false);
          }}
          onProceedApprove={handleProceedApprove}
        />
      )}

      {/* Approve Request Modal */}
      {showApproveModal && bookingData && (
        <ApproveRequestModal
          requestData={bookingData}
          initialDate={bookingData?.booking_date}
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