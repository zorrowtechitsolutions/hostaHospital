// src/components/patients/PatientDetails.jsx - With Lab Results Tab
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, User, Calendar, Heart, Clock, Pill, ClipboardList, FileText, ShieldIcon, Beaker } from "lucide-react";
import EditAppointmentModal from "./EditAppointmentModal";
import EditVisitHistory from "./EditVisitHistoryModal";
import DeleteModal from "./DeleteModel";

// Import Tab Components
import ProfileTab from "./tabs/ProfileTab";
import AppointmentsTab from "./tabs/AppointmentsTab";
import VitalsTab from "./tabs/VitalsTab";
import VisitHistoryTab from "./tabs/VisitHistoryTab";
import PrescriptionTab from "./tabs/PrescriptionTab";
import MedicalHistoryTab from "./tabs/MedicalHistoryTab";
import DocumentsTab from "./tabs/DocumentsTab";
import LabResultsTab from "./tabs/LabResultsTab";

// Import Modals
import AppointmentDetailsModal from "./modals/AppointmentDetailsModal";
import VitalDetailsModal from "./modals/VitalDetailsModal";
import VisitDetailsModal from "./modals/VisitDetailsModal";
import MedicalDetailsModal from "./modals/MedicalDetailsModal";
import AddAppointmentModal from "./AddAppointmentModal";
import PrescriptionReportModal from "./modals/PrecriptionReportModal";

// Import API hooks
import { useGetPatientByIdQuery } from "../../../app/service/patients";
import { useGetBookingsQuery } from "../../../app/service/request";
import { Loader } from "../ui";

const PatientDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const passedPatient = location.state?.patient;

  const [tab, setTab] = useState("profile");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  
  // View Modals States
  const [showAppointmentDetailsModal, setShowAppointmentDetailsModal] = useState(false);
  const [showVisitDetailsModal, setShowVisitDetailsModal] = useState(false);
  const [showMedicalDetailsModal, setShowMedicalDetailsModal] = useState(false);
  const [showVitalModal, setShowVitalModal] = useState(false);
  
  // Prescription Modal States
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  
  const [showEditAppointmentModal, setShowEditAppointmentModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [selectedMedical, setSelectedMedical] = useState(null);
  const [selectedVital, setSelectedVital] = useState(null);
  const [appointmentToEdit, setAppointmentToEdit] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [openMenu, setOpenMenu] = useState(null);
  
  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfig, setDeleteConfig] = useState({
    type: '',
    id: null,
    index: null,
    name: ''
  });
  
  // State for Edit Visit History Modal
  const [showEditVisitHistoryModal, setShowEditVisitHistoryModal] = useState(false);
  const [visitToEdit, setVisitToEdit] = useState(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Get patient ID from URL params or passed state
  const patientId = id || passedPatient?.id || passedPatient?._id;

  // Fetch patient data from API
  const { 
    data: patientResponse, 
    isLoading: isLoadingPatient,
    refetch: refetchPatient 
  } = useGetPatientByIdQuery(patientId, {
    skip: !patientId
  });
  
  // Fetch all bookings for appointments and visits
  const {
    data: bookingResponse,
    refetch: refetchBookings,
    isLoading: isLoadingBookings
  } = useGetBookingsQuery({});

  const patientData = patientResponse?.data || patientResponse || passedPatient;
  
  // Filter appointments for current patient
  const patientAppointments = React.useMemo(() => {
    const bookingList = Array.isArray(bookingResponse) 
      ? bookingResponse 
      : bookingResponse?.data || bookingResponse?.bookings || bookingResponse?.result || [];
    
    return bookingList
      .filter((booking) => {
        const bookingPatientName = booking.patient_name || booking.patientName;
        const currentPatientName = patientData?.name;
        return String(bookingPatientName || '').toLowerCase() === String(currentPatientName || '').toLowerCase();
      })
      .map((booking, index) => ({
        id: booking.id || booking._id || index,
        doctorName: booking.displayName || booking.doctor_name || "N/A",
        doctor: booking.displayName || booking.doctor_name || "N/A",
        department: booking.department || booking.doctor_department || "N/A",
        appointmentDate: booking.booking_date,
        date: booking.booking_date ? new Date(booking.booking_date).toLocaleDateString() : "N/A",
        time: booking.consulting_time || "N/A",
        bookedOn: booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : "Today",
        consulting_time: booking.consulting_time,
        status: booking.status || "pending",
        reason: booking.reason || '',
        notes: booking.notes || '',
        token: booking.token,
        consultingTime: booking.consulting_time || 'N/A',
        originalStatus: booking.status
      }));
  }, [bookingResponse, patientData]);

  // Filter visits (accepted/completed appointments) for current patient
  const patientVisits = React.useMemo(() => {
    const bookingList = Array.isArray(bookingResponse) 
      ? bookingResponse 
      : bookingResponse?.data || bookingResponse?.bookings || bookingResponse?.result || [];
    
    // Filter by patient name AND status (accepted or completed)
    return bookingList
      .filter((booking) => {
        const bookingPatientName = booking.patient_name || booking.patientName;
        const currentPatientName = patientData?.name;
        const isAcceptedOrCompleted = booking.status === "accepted" || booking.status === "completed";
        return String(bookingPatientName || '').toLowerCase() === String(currentPatientName || '').toLowerCase() && isAcceptedOrCompleted;
      })
      .map((booking, index) => {
        // Get patient image key
        const patientImageKey = booking.patient_image || booking.patientImage || booking.avatar || null;
        
        return {
          id: booking.id || booking._id || index,
          visitId: `#VIS${String(index + 1).padStart(4, "0")}`,
          patientName: booking.patient_name || booking.patientName || patientData?.name || "N/A",
          patientId: `#PT${String(booking.userId || index + 1).padStart(4, "0")}`,
          doctorName: booking.doctor_name || booking.displayName || booking.doctorName || "Doctor",
          department: booking.doctor_department || booking.department || "General",
          visitDate: booking.booking_date || "",
          startTime: booking.consulting_time || "",
          token: booking.token || "N/A",
          status: booking.status === "completed" ? "Completed" : "In Progress",
          patientImageKey: patientImageKey,
          patientAvatar: patientImageKey || null,
          reason: booking.reason || "",
          notes: booking.notes || "",
          originalBooking: booking
        };
      });
  }, [bookingResponse, patientData]);

  // Combined patient state - initialized with empty values
  const [patient, setPatient] = useState({
    id: '',
    hospitalId: '',  // ✅ ADDED - FIXES THE S3 UPLOAD ISSUE
    userId: '',      // ✅ ADDED - FIXES THE S3 UPLOAD ISSUE
    name: '',
    gender: '',
    phone: '',
    email: '',
    department: '',
    lastVisit: '',
    addedOn: '',
    dob: '',
    age: '',
    maritalStatus: '',
    blood: '',
    address: '',
    referredBy: '',
    totalBookings: 0,
    heartRate: '',
    respiratoryRate: '',
    spo2: '',
    weight: '',
    temperature: '',
    bloodPressure: '',
    appointmentsList: [],
    vitalsList: [],
    visitHistoryList: [],
    prescriptionsList: [],
    medicalHistoryList: [],
    documentsList: [],
    labResultsList: [],   // ✅ ADDED
    insuranceList: [],
    appointments: [],
    visits: []
  });

  // Update patient state when API data loads - FIXED!
  useEffect(() => {
    if (patientData) {
      setPatient({
        id: patientData.id || patientData._id,
        hospitalId: patientData.hospitalId || patientData.hospital?.id || '',  // ✅ ADDED
        userId: patientData.userId || patientData.user?.id || '',              // ✅ ADDED
        name: patientData.name || '',
        gender: patientData.gender || '',
        phone: patientData.mobileNumber || patientData.phone || '',
        email: patientData.email || '',
        department: patientData.department || '',
        lastVisit: patientData.lastVisit || '',
        addedOn: patientData.createdAt ? new Date(patientData.createdAt).toLocaleDateString() : '',
        dob: patientData.dob || '',
        age: patientData.age || '',
        maritalStatus: patientData.maritalStatus || '',
        blood: patientData.bloodGroup || '',
        address: patientData.addressLine || patientData.address || '',
        referredBy: patientData.referredBy || '',
        totalBookings: patientData.totalBookings || 0,
        heartRate: patientData.heartRate || '',
        respiratoryRate: patientData.respiratoryRate || '',
        spo2: patientData.spo2 || '',
        weight: patientData.weight || '',
        temperature: patientData.temperature || '',
        bloodPressure: patientData.bloodPressure || '',
        appointmentsList: patientAppointments,
        visitHistoryList: patientVisits,
        vitalsList: patientData.vitals || [],
        prescriptionsList: patientData.prescriptions || [],
        medicalHistoryList: patientData.medicalHistory || [],
        documentsList: patientData.documents || [],
        labResultsList: patientData.labResults || patientData.lab_results || [],  // ✅ ADDED
        insuranceList: patientData.insurance || [],
        appointments: patientAppointments,
        visits: patientVisits
      });
    }
  }, [patientData, patientAppointments, patientVisits]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenu !== null) {
        const target = event.target;
        if (!target.closest('.action-menu-container')) {
          setOpenMenu(null);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenu]);

  const getFilteredAppointments = () => {
    let filtered = [...patientAppointments];
    if (searchTerm) {
      filtered = filtered.filter(apt => 
        apt.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.doctorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.department?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(apt => apt.status?.toLowerCase() === statusFilter.toLowerCase());
    }
    return filtered;
  };

  const filteredAppointments = getFilteredAppointments();
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAppointments = filteredAppointments.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const getStatusBadge = (status) => {
    const statusMap = {
      'accepted': 'bg-green-100 text-green-700',
      'pending': 'bg-yellow-100 text-yellow-600',
      'declined': 'bg-red-100 text-red-700',
      'rejected': 'bg-red-100 text-red-700',
      'completed': 'bg-blue-100 text-blue-700',
      'cancel': 'bg-gray-100 text-gray-700',
      'upcoming': 'bg-purple-100 text-purple-700',
      'inprogress': 'bg-blue-100 text-blue-700',
      'in progress': 'bg-blue-100 text-blue-700',
      'active': 'bg-green-100 text-green-700',
      'expired': 'bg-red-100 text-red-700',
      'received': 'bg-green-100 text-green-700',
      'In Progress': 'bg-blue-100 text-blue-700',
      'Completed': 'bg-green-100 text-green-700'
    };
    return `px-2 py-1 rounded-full text-xs font-medium ${statusMap[status] || 'bg-gray-100 text-gray-700'}`;
  };

  const handleBackToPatients = () => navigate('/patients');
  
  const handleViewAppointmentDetails = (appointment) => {
    setSelectedAppointment(appointment);
    setShowAppointmentDetailsModal(true);
    setOpenMenu(null);
  };

  const handleViewVisitDetails = (visit) => {
    setSelectedVisit(visit);
    setShowVisitDetailsModal(true);
    setOpenMenu(null);
  };

  const handleViewMedicalDetails = (medical) => {
    setSelectedMedical(medical);
    setShowMedicalDetailsModal(true);
    setOpenMenu(null);
  };

  const handleViewVitalDetails = (vital) => {
    setSelectedVital(vital);
    setShowVitalModal(true);
    setOpenMenu(null);
  };

  const handleViewPrescriptionDetails = (prescription) => {
    setSelectedPrescription(prescription);
    setShowPrescriptionModal(true);
    setOpenMenu(null);
  };

  const handleSavePrescription = (prescriptionData) => {
    setShowPrescriptionModal(false);
    setSelectedPrescription(null);
    refetchPatient();
  };

  const handleEditAppointmentClick = (appointment) => {
    setAppointmentToEdit(appointment);
    setShowEditAppointmentModal(true);
    setOpenMenu(null);
  };

  const handleEditVisitClick = (visit) => {
    setVisitToEdit(visit);
    setShowEditVisitHistoryModal(true);
    setOpenMenu(null);
  };

  const handleSaveEditedVisit = (updatedVisitData) => {
    const updatedList = patient.visitHistoryList.map(visit => 
      visit.id === updatedVisitData.id ? { ...visit, ...updatedVisitData } : visit
    );
    setPatient({...patient, visitHistoryList: updatedList});
    setShowEditVisitHistoryModal(false);
    setVisitToEdit(null);
  };

  const handleSaveEditedAppointment = (updatedData) => {
    const updatedList = patient.appointmentsList.map(apt => 
      apt.id === appointmentToEdit.id 
        ? { ...apt, ...updatedData }
        : apt
    );
    setPatient({...patient, appointmentsList: updatedList});
    setShowEditAppointmentModal(false);
    setAppointmentToEdit(null);
  };

  const handleDeleteClick = (type, id, index, name) => {
    setDeleteConfig({
      type,
      id,
      index,
      name: name || `${type} item`
    });
    setShowDeleteModal(true);
    setOpenMenu(null);
  };

  const handleConfirmDelete = () => {
    const { type, index, id } = deleteConfig;
    
    switch(type) {
      case 'appointment':
        const updatedAppointments = patient.appointmentsList.filter((_, i) => i !== index);
        setPatient({...patient, appointmentsList: updatedAppointments});
        break;
      case 'vital':
        const updatedVitals = patient.vitalsList.filter((_, i) => i !== index);
        setPatient({...patient, vitalsList: updatedVitals});
        break;
      case 'visit':
        const updatedVisits = patient.visitHistoryList.filter((_, i) => i !== index);
        setPatient({...patient, visitHistoryList: updatedVisits});
        break;
      case 'prescription':
        const updatedPrescriptions = patient.prescriptionsList.filter((_, i) => i !== index);
        setPatient({...patient, prescriptionsList: updatedPrescriptions});
        break;
      case 'medical':
        const updatedMedicalHistory = patient.medicalHistoryList.filter((_, i) => i !== index);
        setPatient({...patient, medicalHistoryList: updatedMedicalHistory});
        break;
      case 'document':
        const updatedDocuments = patient.documentsList.filter((_, i) => i !== index);
        setPatient({...patient, documentsList: updatedDocuments});
        break;
      case 'labResult':
        const updatedLabResults = patient.labResultsList.filter((_, i) => i !== index);
        setPatient({...patient, labResultsList: updatedLabResults});
        break;
      case 'insurance':
        const updatedInsurance = patient.insuranceList.filter(item => item.id !== id);
        setPatient({...patient, insuranceList: updatedInsurance});
        break;
      default:
        break;
    }
    setShowDeleteModal(false);
    setDeleteConfig({ type: '', id: null, index: null, name: '' });
  };

  const handleDownloadDocument = (item) => {
    if (item.fileUrl) {
      window.open(item.fileUrl, '_blank');
    }
  };

  const handleEditPatient = () => setShowEditModal(true);
  const handleAddAppointment = () => setShowAppointmentModal(true);

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "appointments", label: "Appointments", icon: Calendar },
    { id: "vitals", label: "Vitals", icon: Heart },
    { id: "visits", label: "Visit History", icon: Clock },
    { id: "prescription", label: "Prescription", icon: Pill },
    { id: "medical", label: "Medical History", icon: ClipboardList },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "lab-results", label: "Lab Results", icon: Beaker },
    // { id: "insurance", label: "Insurance", icon: ShieldIcon }
  ];

  const renderTabContent = () => {
    const tabProps = {
      patient,
      setPatient,
      searchTerm,
      setSearchTerm,
      statusFilter,
      setStatusFilter,
      currentPage,
      setCurrentPage,
      itemsPerPage,
      totalPages,
      startIndex,
      paginatedAppointments: patientAppointments,
      filteredAppointments: patientAppointments,
      paginatedVisits: patientVisits,
      filteredVisits: patientVisits,
      handlePageChange,
      getStatusBadge,
      handleViewAppointmentDetails,
      handleViewVisitDetails,
      handleViewMedicalDetails,
      handleViewVitalDetails,
      handleEditAppointmentClick,
      handleEditVisitClick,
      handleDeleteClick,
      handleDownloadDocument,
      handleAddAppointment,
      openMenu,
      setOpenMenu
    };

    switch(tab) {
      case "profile": 
        return <ProfileTab patient={patient} handleEditPatient={handleEditPatient} handleAddAppointment={handleAddAppointment} handleViewAppointmentDetails={handleViewAppointmentDetails} handleViewVisitDetails={handleViewVisitDetails} handleViewVitalDetails={handleViewVitalDetails} setTab={setTab} getStatusBadge={getStatusBadge} />;
      case "appointments": 
        return <AppointmentsTab {...tabProps} />;
      case "vitals": 
        return <VitalsTab patient={patient} handleViewVitalDetails={handleViewVitalDetails} handleDeleteClick={handleDeleteClick} openMenu={openMenu} setOpenMenu={setOpenMenu} getStatusBadge={getStatusBadge} />;
      case "visits": 
        return <VisitHistoryTab {...tabProps} />;
      case "prescription": 
        return (
          <PrescriptionTab 
            patient={patient} 
            handleDeleteClick={handleDeleteClick}
            handleViewDetails={handleViewPrescriptionDetails}
            openMenu={openMenu} 
            setOpenMenu={setOpenMenu} 
            getStatusBadge={getStatusBadge} 
          />
        );
      case "medical": 
        return <MedicalHistoryTab patient={patient} handleViewMedicalDetails={handleViewMedicalDetails} handleDeleteClick={handleDeleteClick} openMenu={openMenu} setOpenMenu={setOpenMenu} getStatusBadge={getStatusBadge} />;
      case "documents": 
        return <DocumentsTab patient={patient} handleDownloadDocument={handleDownloadDocument} handleDeleteClick={handleDeleteClick} />;
      case "lab-results": 
        return <LabResultsTab patient={patient} handleDeleteClick={handleDeleteClick} />;
      case "insurance": 
        return <InsuranceTab patient={patient} handleDeleteClick={handleDeleteClick} getStatusBadge={getStatusBadge} />;
      default: 
        return <ProfileTab patient={patient} handleEditPatient={handleEditPatient} handleAddAppointment={handleAddAppointment} handleViewAppointmentDetails={handleViewAppointmentDetails} handleViewVisitDetails={handleViewVisitDetails} handleViewVitalDetails={handleViewVitalDetails} setTab={setTab} getStatusBadge={getStatusBadge} />;
    }
  };

  // Loading state
  if (isLoadingPatient && !patientData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader centered text="Loading patient details..." />
      </div>
    );
  }

  // Patient not found state
  if (!patientData && !isLoadingPatient) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <User size={48} className="text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Patient not found</h2>
          <p className="text-gray-500 mb-6">The patient you're looking for doesn't exist or has been removed.</p>
          <button 
            onClick={handleBackToPatients} 
            className="px-6 py-2.5 bg-[#1C62A0] text-white rounded-lg hover:bg-[#154f7a] transition-colors"
          >
            Back to Patients
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Patient Details</h2>
          <p className="text-sm text-gray-500">Home » Patient Details</p>
        </div>
        <button onClick={handleBackToPatients} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-all shadow-sm">
          <ArrowLeft size={16} /> Back to Patients
        </button>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((t) => (
          <button 
            key={t.id} 
            onClick={() => setTab(t.id)} 
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id 
                ? "bg-[#1C62A0] text-white shadow-md" 
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300"
            }`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>
      
      {renderTabContent()}
      
      {/* ========== ALL MODALS ========== */}
      {showAppointmentDetailsModal && selectedAppointment && (
        <AppointmentDetailsModal data={selectedAppointment} onClose={() => setShowAppointmentDetailsModal(false)} />
      )}
      
      {showVitalModal && selectedVital && (
        <VitalDetailsModal data={selectedVital} onClose={() => setShowVitalModal(false)} />
      )}
      
      {showVisitDetailsModal && selectedVisit && (
        <VisitDetailsModal 
          data={selectedVisit} 
          patientName={patient.name} 
          onClose={() => setShowVisitDetailsModal(false)} 
        />
      )}
      
      {showMedicalDetailsModal && selectedMedical && (
        <MedicalDetailsModal data={selectedMedical} onClose={() => setShowMedicalDetailsModal(false)} />
      )}
      
      {showPrescriptionModal && (
        <PrescriptionReportModal
          isOpen={showPrescriptionModal}
          onClose={() => {
            setShowPrescriptionModal(false);
            setSelectedPrescription(null);
          }}
          onSave={handleSavePrescription}
          patient={patient}
          existingPrescription={selectedPrescription}
        />
      )}
      
      {showEditModal && (
        <EditPatientModal patient={patient} setPatient={setPatient} onClose={() => setShowEditModal(false)} />
      )}
      
      {showAppointmentModal && (
        <AddAppointmentModal patient={patient} setPatient={setPatient} onClose={() => setShowAppointmentModal(false)} />
      )}
      
      {showEditAppointmentModal && appointmentToEdit && (
        <EditAppointmentModal 
          isOpen={showEditAppointmentModal} 
          onClose={() => setShowEditAppointmentModal(false)} 
          appointment={appointmentToEdit} 
          patient={patient} 
          onSave={handleSaveEditedAppointment} 
        />
      )}
      
      {showEditVisitHistoryModal && visitToEdit && (
        <EditVisitHistory 
          isOpen={showEditVisitHistoryModal} 
          onClose={() => { 
            setShowEditVisitHistoryModal(false); 
            setVisitToEdit(null); 
          }} 
          initialVisit={visitToEdit} 
          patient={patient} 
          onSave={handleSaveEditedVisit} 
          allPatients={[patient]} 
        />
      )}
      
      <DeleteModal 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
        onConfirm={handleConfirmDelete} 
        title="Delete Item" 
        message={`Are you sure you want to delete this ${deleteConfig.type}? This action cannot be undone.`} 
        itemName={deleteConfig.name} 
      />
    </div>
  );
};

// EditPatientModal component
const EditPatientModal = ({ patient, setPatient, onClose }) => {
  const navigate = useNavigate();
  
  const handleEdit = () => {
    navigate(`/edit-patient/${patient.id}`, { state: { patient } });
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <h3 className="text-xl font-semibold mb-4">Edit Patient</h3>
        <p className="text-gray-600 mb-6">You are about to edit {patient.name}'s profile.</p>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleEdit} className="px-4 py-2 bg-[#1C62A0] text-white rounded-lg hover:bg-[#154f7a]">
            Continue to Edit
          </button>
        </div>
      </div>
    </div>
  );
};

// InsuranceTab component
const InsuranceTab = ({ patient, handleDeleteClick, getStatusBadge }) => {
  if (!patient.insuranceList || patient.insuranceList.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 text-center">
        <p className="text-gray-500">No insurance records found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
            <tr>
              <th className="px-6 py-3">Policy No</th>
              <th className="px-6 py-3">Provider</th>
              <th className="px-6 py-3">Plan Type</th>
              <th className="px-6 py-3">Coverage</th>
              <th className="px-6 py-3">Start Date</th>
              <th className="px-6 py-3">Expiry Date</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {patient.insuranceList.map((item, idx) => (
              <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{item.policyNo}</td>
                <td className="px-6 py-4">{item.provider}</td>
                <td className="px-6 py-4">{item.planType}</td>
                <td className="px-6 py-4">{item.coverageAmount}</td>
                <td className="px-6 py-4">{item.startDate}</td>
                <td className="px-6 py-4">{item.expiryDate}</td>
                <td className="px-6 py-4">
                  <span className={getStatusBadge(item.status)}>{item.status}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleDeleteClick('insurance', item.id, idx, item.policyNo)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PatientDetails;