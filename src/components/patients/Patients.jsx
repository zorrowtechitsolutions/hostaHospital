// src/components/patients/Patients.jsx - With Enhanced Address Handling, Skeleton Loader & Filter Box - Card UI aligned with Doctors
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  Trash2,
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

// ✅ Import Excel Export Button
import ExcelExportButton from '../ui/ExcelExportButton';

// ✅ Import socket
import { socket } from '../../socket/socket';
// ✅ Import socket event listeners
import { registerPatientEvents, unregisterPatientEvents } from '../../socket/patientEvents';

// S3 Base URL for images
const S3_BASE_URL = "https://hostahealthcare.s3.eu-north-1.amazonaws.com";

// getS3ImageUrl with cache-busting
const getS3ImageUrlWithCache = (imageKey) => {
  if (!imageKey) return "";
  if (imageKey.startsWith("http")) {
    return `${imageKey}?t=${Date.now()}`;
  }
  return `${S3_BASE_URL}/${encodeURIComponent(imageKey)}?t=${Date.now()}`;
};

// ✅ Enhanced Helper function to format address - tries multiple address formats
const formatAddress = (address) => {
  if (!address) return '';
  
  // If address is a string, return it
  if (typeof address === 'string') {
    return address;
  }
  
  // If address is an object, extract fields
  if (typeof address === 'object') {
    const parts = [];
    
    // Common address field names
    const fieldNames = [
      'place', 'district', 'state', 'country', 'pincode'
    ];
    
    // Check each field and add if it has a value
    fieldNames.forEach(field => {
      if (address[field] && typeof address[field] === 'string' && address[field].trim()) {
        parts.push(address[field].trim());
      }
    });
    
    // If we have parts, join them
    if (parts.length > 0) {
      return parts.join(', ');
    }
    
    // If no fields found but address object exists, try to get values
    const values = Object.values(address).filter(v => v && typeof v === 'string' && v.trim());
    if (values.length > 0) {
      return values.join(', ');
    }
  }
  
  return '';
};

// ✅ Function to extract address from patient object - tries multiple sources
const extractAddress = (patient) => {
  if (!patient) return '';
  
  // Try multiple possible address locations
  const addressSources = [
    patient.address,
    patient.patientAddress,
    patient.patient_address,
    patient.addressLine,
  ];
  
  // Find the first valid address source
  let addressData = null;
  for (const source of addressSources) {
    if (source) {
      addressData = source;
      break;
    }
  }
  
  // If no address found, try to build from individual fields
  if (!addressData) {
    const parts = [];
    const individualFields = ['place', 'district', 'state', 'country', 'pincode', 'city', 'street'];
    individualFields.forEach(field => {
      if (patient[field]) {
        parts.push(patient[field]);
      }
    });
    if (parts.length > 0) {
      return parts.join(', ');
    }
  }
  
  // Format the address data
  return formatAddress(addressData);
};

// Helper functions
const getPatientName = (patient) => patient.name || 'Patient';
const getPatientId = (id) => id ? `#PT${String(id).padStart(4, '0')}` : '#PT0000';
const getPatientType = (patient) => patient.patientType || 'Outpatient';
const getPatientStatus = (patient) => {
  if (patient.isDelete) return 'Blacklisted';
  return patient.isActive ? 'Active' : 'Inactive';
};

// ✅ Patient Action Menu Component (Matches DoctorActionMenu style)
const PatientActionMenu = React.memo(({ patient, activeMenu, onView, onEdit, onDelete, onAppointment, onRecover }) => {
  if (activeMenu !== patient.id) return null;
  
  return (
    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1">
      {!patient.isDelete && (
        <button 
          onClick={() => onView(patient)} 
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <Eye className="w-4 h-4" />
          View Details
        </button>
      )}
      {!patient.isDelete && (
        <button 
          onClick={() => onEdit(patient)} 
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <Edit className="w-4 h-4" />
          Edit
        </button>
      )}
      {!patient.isDelete && (
        <button 
          onClick={() => onAppointment(patient)} 
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <Calendar className="w-4 h-4" />
          Appointment
        </button>
      )}
      {!patient.isDelete && <div className="border-t border-gray-100 my-1"></div>}
      
      {patient.isDelete ? (
        <button
          onClick={() => onRecover(patient)}
          className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-gray-50 flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Recover Patient
        </button>
      ) : (
        <button 
          onClick={() => onDelete(patient)} 
          className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50 flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      )}
    </div>
  );
});

// ✅ Skeleton Loader Component (Matches Doctors Skeleton style)
const PatientSkeletonLoader = ({ viewMode = 'grid', itemsPerPage = 10 }) => {
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-100 p-5 relative flex flex-col items-center shadow-sm">
            <div className="w-full flex justify-between items-start mb-4">
              <div className="h-5 w-16 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-7 h-7 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
            <div className="relative mb-3">
              <div className="w-16 h-16 rounded-full bg-gray-200 animate-pulse"></div>
            </div>
            <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="grid grid-cols-2 gap-4 w-full border-t border-gray-50 pt-4 mb-4">
              <div className="text-center">
                <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mx-auto mb-1"></div>
                <div className="h-4 w-12 bg-gray-200 rounded animate-pulse mx-auto"></div>
              </div>
              <div className="text-center">
                <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mx-auto mb-1"></div>
                <div className="h-4 w-12 bg-gray-200 rounded animate-pulse mx-auto"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
        <div className="h-5 w-40 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100">
            <tr>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <th key={i} className="px-6 py-3">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(itemsPerPage)].map((_, i) => (
              <tr key={i} className="border-b border-gray-100">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((j) => (
                  <td key={j} className="px-6 py-4">
                    <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-4 border-t bg-gray-50">
        <div className="flex justify-between items-center">
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="flex gap-2">
            <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Patients = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewMode, setViewMode] = useState('grid');
  const [activeMenu, setActiveMenu] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState(null);

  // Approve Modal State
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [bookingData, setBookingData] = useState(null);

  // Appointment Modal State
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [appointmentPatient, setAppointmentPatient] = useState(null);

  // ✅ Track if events are registered
  const [eventsRegistered, setEventsRegistered] = useState(false);

  // 🔥 FIX: Get hospitalId from auth.hospitalId, NOT auth.id
  const authUser = getAuthUser();
  const isDoctor = authUser?.role === 'doctor' || authUser?.roleId === 46;
  const isHospitalAdmin = authUser?.role === 'hospital' || authUser?.roleId === 2;
  
  // 🔥 FIX: Use hospitalId, NOT auth.id
  const hospitalId = isDoctor ? authUser?.hospitalId : authUser?.id;

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
    ...(genderFilter !== 'All' && { gender: genderFilter }),
    ...(statusFilter !== 'All' && { status: statusFilter === 'Active' ? true : false }),
  });

  const [deletePatient] = useDeletePatientMutation();
  const [recoverPatient] = useRecoverPatientMutation();
  const [createBooking, { isLoading: isCreatingBooking }] = useCreateBookingMutation();

  // ✅ Register socket event listeners
  useEffect(() => {
    registerPatientEvents({
      onPatientRegistered: async (data) => {
        showSuccessToast(`New patient registered!`, 3000);
        await refetchPatients();
      },
      onPatientUpdated: async (data) => {
        showSuccessToast(`Patient updated!`, 3000);
        await refetchPatients();
      },
      onPatientDeleted: async (data) => {
        showSuccessToast(`Patient deleted!`, 3000);
        await refetchPatients();
      },
      onPatientRecovered: async (data) => {
        showSuccessToast(`Patient recovered successfully!`, 3000);
        await refetchPatients();
      }
    });

    setEventsRegistered(true);

    return () => {
      unregisterPatientEvents();
      setEventsRegistered(false);
    };
  }, []);

  // ✅ Listen for socket connection/disconnection
  useEffect(() => {
    const handleConnect = () => {
      if (!eventsRegistered) {
        registerPatientEvents({
          onPatientRegistered: async (data) => {
            showSuccessToast(`New patient registered!`, 3000);
            await refetchPatients();
          },
          onPatientUpdated: async (data) => {
            showSuccessToast(`Patient updated!`, 3000);
            await refetchPatients();
          },
          onPatientDeleted: async (data) => {
            showSuccessToast(`Patient deleted!`, 3000);
            await refetchPatients();
          },
          onPatientRecovered: async (data) => {
            showSuccessToast(`Patient recovered successfully!`, 3000);
            await refetchPatients();
          }
        });
        setEventsRegistered(true);
      }
    };

    const handleDisconnect = () => {
      setEventsRegistered(false);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [refetchPatients, eventsRegistered]);

  // Save view mode to localStorage
  useEffect(() => {
    localStorage.setItem('patientViewMode', viewMode);
  }, [viewMode]);

  // Get patients array and pagination info from response
  const allPatients = patientsResponse?.data || [];
  const totalItems = patientsResponse?.pagination?.totalItems || 0;
  const totalPages = patientsResponse?.pagination?.totalPages || 1;

  // ✅ Transform patient data with enhanced address handling
  const transformPatientData = (patients) => {
    if (!patients || !Array.isArray(patients)) return [];
    
    return patients.map((patient, index) => {
      let status = 'Active';
      if (patient.isDelete) {
        status = 'Blacklisted';
      } else if (patient.isActive === false) {
        status = 'Inactive';
      }
      
      // ✅ Extract and format address using enhanced function
      const formattedAddress = extractAddress(patient);
      
      return {
        ...patient,
        isDelete: patient.isDelete || false,
        isActive: patient.isActive !== undefined ? patient.isActive : true,
        displayStatus: status,
        formattedAddress: formattedAddress || 'N/A'
      };
    });
  };

  const transformedPatients = transformPatientData(allPatients);

  // ✅ Get unique genders from patients for filter options
  const genderOptions = useMemo(() => {
    const genders = new Set();
    transformedPatients.forEach(p => {
      if (p.gender) genders.add(p.gender);
    });
    return ['All', ...Array.from(genders)];
  }, [transformedPatients]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, genderFilter, statusFilter]);

  // Handle click outside for menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeMenu !== null && !event.target.closest('.menu-container')) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeMenu]);

  const handlePageChange = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [totalPages]);

  // Navigation handlers
  const handleViewDetails = useCallback((patient) => {
    if (patient.isDelete) {
      showErrorToast('Cannot view details of blacklisted patient', 3000);
      return;
    }
    navigate(`/patients/${patient.id || patient._id}`, { state: { patient } });
    setActiveMenu(null);
  }, [navigate]);

  const handleAddPatient = useCallback(() => {
    navigate('/add-patient');
  }, [navigate]);

  const handleEditPatient = useCallback((patient) => {
    if (patient.isDelete) {
      showErrorToast('Cannot edit blacklisted patient', 3000);
      return;
    }
    navigate(`/edit-patient/${patient.id || patient._id}`, { state: { patient } });
    setActiveMenu(null);
  }, [navigate]);

  const handleDeleteClick = useCallback((patient) => {
    setPatientToDelete(patient);
    setShowDeleteModal(true);
    setActiveMenu(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
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
  }, [patientToDelete, deletePatient, refetchPatients]);

  const handleRecoverPatient = useCallback(async (patient) => {
    try {
      await recoverPatient(patient.id || patient._id).unwrap();
      showSuccessToast(`${patient.name} recovered successfully!`, 2000);
      refetchPatients();
      setActiveMenu(null);
    } catch (error) {
      console.error('Recover error:', error);
      showErrorToast(error?.data?.message || 'Failed to recover patient', 3000);
    }
  }, [recoverPatient, refetchPatients]);

  const handleRefresh = useCallback(() => {
    setSearchTerm("");
    setGenderFilter("All");
    setStatusFilter("All");
    setCurrentPage(1);
    setActiveMenu(null);
    refetchPatients();
    showSuccessToast("Refreshed patients", 2000);
  }, [refetchPatients]);

  const clearGenderFilter = useCallback(() => {
    setGenderFilter('All');
  }, []);

  const clearStatusFilter = useCallback(() => {
    setStatusFilter('All');
  }, []);

  const handleAddAppointmentModal = useCallback((patient) => {
    if (patient.isDelete) {
      showErrorToast('Cannot create appointment for blacklisted patient', 3000);
      return;
    }
    setAppointmentPatient(patient);
    setShowAppointmentModal(true);
    setActiveMenu(null);
  }, []);

  const handleProceedApprove = useCallback((data) => {
    const patientId = appointmentPatient?.id || appointmentPatient?._id;
    
    const updatedData = {
      ...data,
      patientId: patientId ? `#PT00${String(patientId)}` : null,
    };

    setBookingData(updatedData);
    setShowAppointmentModal(false);
    setShowApproveModal(true);
  }, [appointmentPatient]);

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

  const handleConfirmAppointment = useCallback(async (approveData) => {
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
      showErrorToast(err?.data?.message || "Failed to confirm appointment", 3000);
    }
  }, [bookingData, appointmentPatient, createBooking, navigate]);

  const formatDisplayDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const toggleMenu = useCallback((id, e) => {
    e.stopPropagation();
    setActiveMenu(prevActive => prevActive === id ? null : id);
  }, []);

  // ✅ Prepare export data for Excel with formatted address
  const getExportData = useCallback(() => {
    const patientsToExport = transformedPatients;
    
    return patientsToExport.map((patient) => {
      const address = patient.formattedAddress || 'N/A';
      
      return {
        'Patient ID': patient.id || patient._id || 'N/A',
        'Name': patient.name || 'N/A',
        'Gender': patient.gender || 'N/A',
        'Age': patient.age || 'N/A',
        'Mobile Number': patient.mobileNumber || 'N/A',
        'Email': patient.email || 'N/A',
        'Blood Group': patient.bloodGroup || 'N/A',
        'Patient Type': patient.patientType || 'Outpatient',
        'Status': patient.isDelete ? 'Blacklisted' : (patient.isActive ? 'Active' : 'Inactive'),
        'Created Date': patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : 'N/A',
        'Address': address,
        'Emergency Contact': patient.emergencyContact || 'N/A'
      };
    });
  }, [transformedPatients]);

  // ✅ Loading state with Skeleton Loader (matches Doctors style)
  if (isLoadingPatients && !transformedPatients.length) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-6 font-sans">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-7 w-32 bg-gray-200 rounded animate-pulse mt-2"></div>
        </div>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="flex flex-1 gap-3 w-full lg:w-auto">
            <div className="relative flex-1 max-w-sm">
              <div className="h-10 w-full bg-gray-200 rounded-md animate-pulse"></div>
            </div>
            <div className="h-10 w-40 bg-gray-200 rounded-md animate-pulse"></div>
            <div className="h-10 w-40 bg-gray-200 rounded-md animate-pulse"></div>
          </div>
          <div className="flex gap-2">
            <div className="w-10 h-10 bg-gray-200 rounded-md animate-pulse"></div>
            <div className="w-10 h-10 bg-gray-200 rounded-md animate-pulse"></div>
            <div className="w-10 h-10 bg-gray-200 rounded-md animate-pulse"></div>
            <div className="w-24 h-10 bg-gray-200 rounded-md animate-pulse"></div>
          </div>
        </div>

        <PatientSkeletonLoader viewMode={viewMode} itemsPerPage={itemsPerPage} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 font-sans">
      {/* Breadcrumb Navigation */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <button 
            onClick={() => navigate(-1)} 
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            aria-label="Go back"
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
        {isDoctor && (
          <span className="text-xs text-green-600 ml-2">
            🔒 Filtered by hospital
          </span>
        )}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="flex flex-1 gap-3 w-full lg:w-auto">
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Search by name, mobile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1C62A0]"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
            <button className="absolute right-2 top-1.5 bg-gradient-to-r from-green-600 to-emerald-600 p-1 rounded" aria-label="Search">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>

          {/* ✅ Gender Filter */}
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-600 bg-white focus:outline-none focus:ring-1 focus:ring-[#1C62A0]"
            aria-label="Filter by gender"
          >
            {genderOptions.map(gender => (
              <option key={gender} value={gender}>
                {gender === 'All' ? 'All Genders' : gender}
              </option>
            ))}
          </select>

          {/* ✅ Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-600 bg-white focus:outline-none focus:ring-1 focus:ring-[#1C62A0]"
            aria-label="Filter by status"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Blacklisted">Blacklisted</option>
          </select>
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <div className="flex border border-gray-200 rounded-md bg-white mr-2">
            <button 
              onClick={() => setViewMode('grid')} 
              className={`p-2 rounded-l-md transition-colors ${viewMode === 'grid' ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white' : 'text-gray-400 hover:bg-gray-50'}`}
              aria-label="Grid view"
            >
              <LayoutGrid size={16} />
            </button>
            <button 
              onClick={() => setViewMode('list')} 
              className={`p-2 rounded-r-md transition-colors ${viewMode === 'list' ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white' : 'text-gray-400 hover:bg-gray-50'}`}
              aria-label="List view"
            >
              <List size={16} />
            </button>
          </div>

          <button 
            onClick={handleRefresh} 
            className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50 transition-colors"
            disabled={isFetching}
            aria-label="Refresh"
          >
            <RefreshCcw size={16} className={isFetching ? "animate-spin" : ""} />
          </button>

          <ExcelExportButton
            data={getExportData()}
            fileName={`patients_${new Date().toISOString().split("T")[0]}`}
            sheetName="Patients"
            className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50 transition-colors"
          />

          <Button 
            onClick={handleAddPatient} 
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-md flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Plus size={16} /> New Patient
          </Button>
        </div>
      </div>

      {/* ✅ Show fetching indicator */}
      {isFetching && transformedPatients.length > 0 && (
        <div className="fixed top-4 right-4 z-50 bg-white shadow-lg rounded-md px-4 py-2 flex items-center gap-2 animate-in slide-in-from-top-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1C62A0]"></div>
          <span className="text-sm text-gray-600">Updating...</span>
        </div>
      )}

      {/* Empty State */}
      {transformedPatients.length === 0 && !isLoadingPatients && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
          <p className="text-sm text-gray-500">
            {isDoctor ? 'No patients found for your hospital' : 'Try adjusting your search or filters'}
          </p>
        </div>
      )}

      {/* GRID VIEW - Matching Doctors Card UI */}
      {viewMode === 'grid' && transformedPatients.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {transformedPatients.map((patient) => {
              const isBlacklisted = patient.isDelete;
              const patientStatus = getPatientStatus(patient);
              
              return (
                <div 
                  key={patient.id || patient._id} 
                  className="bg-white rounded-lg border border-gray-100 p-5 relative flex flex-col items-center shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-full flex justify-between items-start mb-4">
                    <Badge variant="info" className="text-[10px]">
                      {getPatientId(patient.id || patient._id)}
                    </Badge>
                    <div className="relative menu-container">
                      <button 
                        onClick={(e) => toggleMenu(patient.id || patient._id, e)} 
                        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 text-xl font-bold transition-colors"
                        aria-label="Actions menu"
                      >
                        ⋮
                      </button>
                      <PatientActionMenu
                        patient={patient}
                        activeMenu={activeMenu}
                        onView={handleViewDetails}
                        onEdit={handleEditPatient}
                        onDelete={handleDeleteClick}
                        onAppointment={handleAddAppointmentModal}
                        onRecover={handleRecoverPatient}
                      />
                    </div>
                  </div>
                  
                  <div className="relative mb-3">
                    <Avatar className="w-16 h-16">
                      <AvatarImage
                        src={getS3ImageUrl(patient.imageKey)}
                        alt={getPatientName(patient)}
                      />
                      <AvatarFallback>
                        {(patient.name?.[0] || "P").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`absolute bottom-0.5 right-0.5 w-3 h-3 border-2 border-white rounded-full ${
                        isBlacklisted
                          ? "bg-black"
                          : patient.isActive
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    />
                  </div>
                  
                  <h3 
                    onClick={() => !isBlacklisted && handleViewDetails(patient)} 
                    className={`text-[14px] font-bold text-gray-800 ${!isBlacklisted ? 'cursor-pointer hover:text-[#1C62A0] transition-colors' : ''}`}
                  >
                    {getPatientName(patient)}
                  </h3>
                  <p className="text-[11px] text-gray-500 mb-4">
                    {patient.age || 'N/A'} years • {patient.gender || 'N/A'}
                  </p>
                  
                  {/* ✅ Stats Grid - Now shows Type and Gender instead of Type and Status */}
                  <div className="grid grid-cols-2 gap-4 w-full border-t border-gray-50 pt-4 mb-4">
                    <div className="text-center">
                      <p className="text-[9px] text-gray-400 uppercase font-bold">Type</p>
                      <p className="text-xs font-bold text-gray-700">
                        {getPatientType(patient)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] text-gray-400 uppercase font-bold">Gender</p>
                      <p className="text-xs font-bold text-gray-700">
                        {patient.gender || 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Quick Action Button */}
                  {isBlacklisted ? (
                    <button 
                      onClick={() => handleRecoverPatient(patient)} 
                      className="w-full py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" /> Recover
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleAddAppointmentModal(patient)} 
                      className="w-full py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <Calendar className="w-4 h-4" /> Appointment
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination for Grid View */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                itemLabel="patients"
                variant="centered"
              />
            </div>
          )}
        </>
      )}

      {/* LIST VIEW - Matching Doctors List style */}
      {viewMode === 'list' && transformedPatients.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">
              Total Patients
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded ml-2">
                {totalItems}
              </span>
              {isDoctor && (
                <span className="text-xs text-green-600 ml-2">
                  🔒 Filtered by hospital
                </span>
              )}
            </h2>
          </div>

          <div className="flex flex-col min-h-[500px]">
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
                  {transformedPatients.map((patient) => {
                    const isBlacklisted = patient.isDelete;
                    const patientStatus = getPatientStatus(patient);
                    
                    return (
                      <tr key={patient.id || patient._id} className="hover:bg-gray-50 border-b border-gray-100">
                        <td className="px-6 py-4 text-[#1C62A0] font-medium">
                          {getPatientId(patient.id || patient._id)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage
                                src={getS3ImageUrl(patient.imageKey)}
                                alt={getPatientName(patient)}
                              />
                              <AvatarFallback>
                                {(patient.name?.[0] || "P").toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span 
                              onClick={() => !isBlacklisted && handleViewDetails(patient)} 
                              className={`font-medium text-gray-800 ${!isBlacklisted ? 'cursor-pointer hover:text-[#1C62A0] transition-colors' : ''}`}
                            >
                              {getPatientName(patient)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{patient.gender || 'N/A'}</td>
                        <td className="px-6 py-4 text-gray-600">{patient.mobileNumber}</td>
                        <td className="px-6 py-4 text-gray-600">{patient.bloodGroup || 'N/A'}</td>
                        <td className="px-6 py-4">
                          <Badge variant={getPatientType(patient) === 'Inpatient' ? 'warning' : 'info'} className="text-xs">
                            {getPatientType(patient)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant={
                              isBlacklisted
                                ? "dark"
                                : patient.isActive
                                ? "success"
                                : "danger"
                            }
                            className="text-xs"
                          >
                            {patientStatus}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right relative menu-container">
                          <div className="flex justify-end">
                            <button 
                              onClick={(e) => toggleMenu(patient.id || patient._id, e)} 
                              className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 text-xl font-bold transition-colors"
                              aria-label="Actions menu"
                            >
                              ⋮
                            </button>
                            <PatientActionMenu
                              patient={patient}
                              activeMenu={activeMenu}
                              onView={handleViewDetails}
                              onEdit={handleEditPatient}
                              onDelete={handleDeleteClick}
                              onAppointment={handleAddAppointmentModal}
                              onRecover={handleRecoverPatient}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination - Sticks to bottom */}
            <div className="mt-auto px-6 py-4 bg-gray-50 border-t border-gray-200">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={totalItems}
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