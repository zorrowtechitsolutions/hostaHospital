import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, User, Calendar, Heart, Clock, Pill, ClipboardList, FileText } from "lucide-react";
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
import { useGetPrescriptionsQuery, useDeletePrescriptionMutation } from "../../../app/service/prescription";
import { useGetVitalsByPatientIdQuery, useDeleteVitalMutation } from "../../../app/service/vitals";
import { Loader } from "../ui";
import { showSuccessToast, showErrorToast } from "../ui/Toast";

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

  // Fetch prescriptions for this patient
  const {
    data: prescriptionsResponse,
    isLoading: isLoadingPrescriptions,
    refetch: refetchPrescriptions
  } = useGetPrescriptionsQuery(
    { patientId: patientId },
    { skip: !patientId }
  );

  const prescriptionId = prescriptionsResponse?.data?.[0]?.id;

  console.log("PATIENT ID", patientId);
  console.log("PRESCRIPTION ID", prescriptionId);

  // Fetch vitals for this patient
  const {
    data: vitalsResponse,
    isLoading: isLoadingVitals,
    refetch: refetchVitals
  } = useGetVitalsByPatientIdQuery(
    {
      patientId,
      prescriptionId,
    },
    {
      skip: !patientId || !prescriptionId,
    }
  );

  // Delete prescription mutation
  const [deletePrescription] = useDeletePrescriptionMutation();
  
  // Delete vital mutation
  const [deleteVital] = useDeleteVitalMutation();

  const patientData = patientResponse?.data || patientResponse || passedPatient;

  console.log("PATIENT API DATA", patientData);
  console.log("VITALS RESPONSE", vitalsResponse);
  console.log("PRESCRIPTIONS RESPONSE", prescriptionsResponse);
  
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
        department: booking.department || "N/A",
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
    
    return bookingList
      .filter((booking) => {
        const bookingPatientName = booking.patient_name || booking.patientName;
        const currentPatientName = patientData?.name;
        const isAcceptedOrCompleted = booking.status === "accepted" || booking.status === "completed";
        return String(bookingPatientName || '').toLowerCase() === String(currentPatientName || '').toLowerCase() && isAcceptedOrCompleted;
      })
      .map((booking, index) => {
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

  // Transform prescriptions from API with proper doctor info extraction
  const formattedPrescriptions = React.useMemo(() => {
    const apiPrescriptions = prescriptionsResponse?.data || [];
    
    return apiPrescriptions.map((prescription, index) => {
      const bookingList = Array.isArray(bookingResponse)
        ? bookingResponse
        : bookingResponse?.data || bookingResponse?.bookings || [];

      let booking = null;
      
      if (prescription.bookingId) {
        booking = bookingList.find(
          (b) => Number(b.id) === Number(prescription.bookingId) ||
                 String(b.id) === String(prescription.bookingId) ||
                 Number(b.bookingId) === Number(prescription.bookingId)
        );
      }
      
      let doctorName = null;
      
      if (booking) {
        if (booking.doctor_name) doctorName = booking.doctor_name;
        else if (booking.displayName) doctorName = booking.displayName;
        else if (booking.doctorName) doctorName = booking.doctorName;
        else if (booking.doctor?.name) doctorName = booking.doctor?.name;
      }
      
      if (!doctorName || doctorName === "null" || doctorName === "undefined") {
        if (prescription.doctorName && prescription.doctorName !== "null" && prescription.doctorName !== "undefined") {
          doctorName = prescription.doctorName;
        } else if (prescription.prescribedBy && prescription.prescribedBy !== "Doctor" && prescription.prescribedBy !== "null") {
          doctorName = prescription.prescribedBy;
        } else if (prescription.doctor?.name) {
          doctorName = prescription.doctor.name;
        }
      }
      
      let doctorSpecialization = null;
      
      if (booking) {
        if (booking.department) doctorSpecialization = booking.department;
        else if (booking.specialization) doctorSpecialization = booking.specialization;
        else if (booking.doctor_department) doctorSpecialization = booking.doctor_department;
      }
      
      if (!doctorSpecialization || doctorSpecialization === "null" || doctorSpecialization === "undefined") {
        if (prescription.doctorSpecialization && prescription.doctorSpecialization !== "null" && prescription.doctorSpecialization !== "undefined") {
          doctorSpecialization = prescription.doctorSpecialization;
        } else if (prescription.specialization) {
          doctorSpecialization = prescription.specialization;
        } else if (prescription.doctor?.specialization) {
          doctorSpecialization = prescription.doctor.specialization;
        } else if (prescription.doctor?.department) {
          doctorSpecialization = prescription.doctor.department;
        }
      }
      
      if (!doctorName || doctorName === "null" || doctorName === "undefined") {
        doctorName = `Dr. ${prescription.doctorId || "Unknown"}`;
      }
      
      if (!doctorSpecialization || doctorSpecialization === "null" || doctorSpecialization === "undefined") {
        doctorSpecialization = "General Medicine";
      }
      
      return {
        id: prescription.id || prescription._id || index,
        type: prescription.medications?.[0]?.name || "Prescription",
        quantity: prescription.medications?.length || 0,
        date: prescription.createdAt ? new Date(prescription.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
        prescribedBy: doctorName,
        doctorName: doctorName,
        doctorSpecialization: doctorSpecialization,
        amount: prescription.amount || "N/A",
        paymentMethod: prescription.paymentMethod || "Insurance",
        status: "Completed",
        fullData: prescription,
        complaint: prescription.complaint,
        advice: prescription.advice,
        investigations: prescription.investigations,
        vitals: prescription.vitals,
        medications: prescription.medications,
        next_consultation: prescription.next_consultation
      };
    });
  }, [prescriptionsResponse, bookingResponse]);

  // Transform vitals from API AND extract from prescriptions
  const formattedVitals = React.useMemo(() => {
    // FIX: Safely handle vitalsResponse.data - ensure it's an array
    let apiVitals = [];
    const vitalsData = vitalsResponse?.data;
    
    if (Array.isArray(vitalsData)) {
      apiVitals = vitalsData;
    } else if (vitalsData && typeof vitalsData === 'object') {
      // Check if it's a single vital object
      if (vitalsData.id || vitalsData._id || vitalsData.temperature || vitalsData.heartRate) {
        apiVitals = [vitalsData];
      }
      // Check for nested array properties
      else if (Array.isArray(vitalsData.data)) {
        apiVitals = vitalsData.data;
      }
      else if (Array.isArray(vitalsData.results)) {
        apiVitals = vitalsData.results;
      }
      else if (Array.isArray(vitalsData.items)) {
        apiVitals = vitalsData.items;
      }
    }
    
    const prescriptions = prescriptionsResponse?.data || [];
    
    // Extract vitals from prescriptions that have vitals data
    const vitalsFromPrescriptions = prescriptions
      .filter(p => p.vitals && Object.keys(p.vitals).length > 0 && 
             (p.vitals.temperature || p.vitals.pulse || p.vitals.spo2 || p.vitals.bloodPressure || p.vitals.heartRate))
      .map((prescription, index) => {
        const bookingList = Array.isArray(bookingResponse)
          ? bookingResponse
          : bookingResponse?.data || bookingResponse?.bookings || [];
        
        let booking = null;
        if (prescription.bookingId) {
          booking = bookingList.find(b => Number(b.id) === Number(prescription.bookingId));
        }
        
        let doctorName = prescription.doctorName;
        if (!doctorName && booking) {
          doctorName = booking.doctor_name || booking.displayName || booking.doctorName;
        }
        if (!doctorName) {
          doctorName = prescription.prescribedBy || "Dr. Unknown";
        }
        
        let doctorSpecialization = prescription.doctorSpecialization;
        if (!doctorSpecialization && booking) {
          doctorSpecialization = booking.department || booking.specialization || booking.doctor_department;
        }
        if (!doctorSpecialization) {
          doctorSpecialization = "General Medicine";
        }
        
        return {
          id: `vital-from-prescription-${prescription.id || index}`,
          patientId: prescription.patientId,
          doctorId: prescription.doctorId,
          bookingId: prescription.bookingId,
          temperature: prescription.vitals?.temperature,
          pulse: prescription.vitals?.pulse,
          heartRate: prescription.vitals?.heartRate || prescription.vitals?.pulse,
          respiratoryRate: prescription.vitals?.respiratoryRate,
          spo2: prescription.vitals?.spo2,
          bloodPressure: prescription.vitals?.bloodPressure,
          bloodPressureSystolic: prescription.vitals?.bloodPressureSystolic,
          bloodPressureDiastolic: prescription.vitals?.bloodPressureDiastolic,
          height: prescription.vitals?.height,
          weight: prescription.vitals?.weight,
          bmi: prescription.vitals?.bmi,
          waist: prescription.vitals?.waist,
          bsa: prescription.vitals?.bsa,
          notes: `Vitals from consultation on ${prescription.createdAt ? new Date(prescription.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}`,
          date: prescription.createdAt ? new Date(prescription.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
          time: prescription.createdAt ? new Date(prescription.createdAt).toLocaleTimeString() : "",
          createdAt: prescription.createdAt,
          doctorName: doctorName,
          doctorSpecialization: doctorSpecialization,
          department: doctorSpecialization,
          source: "from_prescription"
        };
      });
    
    // Format API vitals
    const formattedApiVitals = apiVitals.map((vital, index) => {
      const bookingList = Array.isArray(bookingResponse)
        ? bookingResponse
        : bookingResponse?.data || bookingResponse?.bookings || [];
      
      let booking = null;
      if (vital.bookingId) {
        booking = bookingList.find(b => Number(b.id) === Number(vital.bookingId));
      }
      
      let doctorName = vital.doctorName || vital.doctor?.name;
      if (!doctorName && booking) {
        doctorName = booking.doctor_name || booking.displayName || booking.doctorName;
      }
      
      let doctorSpecialization = vital.doctorSpecialization || vital.specialization || vital.department;
      if (!doctorSpecialization && booking) {
        doctorSpecialization = booking.department || booking.specialization || booking.doctor_department;
      }
      
      return {
        id: vital.id || vital._id || index,
        patientId: vital.patientId,
        doctorId: vital.doctorId,
        bookingId: vital.bookingId,
        temperature: vital.temperature,
        heartRate: vital.heartRate || vital.pulse,
        pulse: vital.pulse,
        respiratoryRate: vital.respiratoryRate,
        spo2: vital.spo2,
        bloodPressure: vital.bloodPressure,
        bloodPressureSystolic: vital.bloodPressureSystolic,
        bloodPressureDiastolic: vital.bloodPressureDiastolic,
        height: vital.height,
        weight: vital.weight,
        bmi: vital.bmi,
        waist: vital.waist,
        bsa: vital.bsa,
        notes: vital.notes,
        date: vital.createdAt ? new Date(vital.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
        time: vital.createdAt ? new Date(vital.createdAt).toLocaleTimeString() : "",
        createdAt: vital.createdAt,
        doctorName: doctorName || "Dr. Unknown",
        doctorSpecialization: doctorSpecialization || "General Medicine",
        department: doctorSpecialization || booking?.department || "General Medicine",
        fullData: vital,
        source: "from_api"
      };
    });
    
    // Combine both sources
    const allVitals = [...formattedApiVitals, ...vitalsFromPrescriptions];
    
    // Remove duplicates (same date and doctor)
    const uniqueVitals = allVitals.reduce((unique, current) => {
      const isDuplicate = unique.some(item => 
        item.date === current.date && 
        item.doctorName === current.doctorName
      );
      if (!isDuplicate) {
        unique.push(current);
      }
      return unique;
    }, []);
    
    // Sort by date (newest first)
    return uniqueVitals.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.date);
      const dateB = new Date(b.createdAt || b.date);
      return dateB - dateA;
    });
    
  }, [vitalsResponse, prescriptionsResponse, bookingResponse]);

  // Combined patient state
  const [patient, setPatient] = useState({
    id: '',
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
    insuranceList: [],
    appointments: [],
    visits: []
  });

  // Update patient state when API data loads
  useEffect(() => {
    if (patientData) {
      setPatient({
        id: patientData.id || patientData._id,
        patientId: patientData.patientId || "",
        name: patientData.name || "",
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
        vitalsList: formattedVitals,
        prescriptionsList: formattedPrescriptions,
        medicalHistoryList: patientData.medicalHistory || [],
        documentsList: patientData.documents || [],
        insuranceList: patientData.insurance || [],
        appointments: patientAppointments,
        visits: patientVisits
      });
    }
  }, [patientData, patientAppointments, patientVisits, formattedPrescriptions, formattedVitals]);

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
const formattedPrescription = {
  ...prescription.fullData,

  id: prescription.id,
  prescribedBy: prescription.prescribedBy,
  doctorName: prescription.doctorName,
  doctorSpecialization: prescription.doctorSpecialization,

  medications:
    prescription.medications ||
    prescription.fullData?.medications ||
    [],

  complaint:
    prescription.complaint ||
    prescription.fullData?.complaint,

  advice:
    prescription.advice ||
    prescription.fullData?.advice,

  design:
    prescription.fullData?.design || [],

  canvasBg:
    prescription.fullData?.canvasBg || "#ffffff"
};


    console.log(
  "FULL PRESCRIPTION",
  prescription.fullData
);

console.log(
  "Prescription Design:",
  prescription.fullData?.design
);

console.log(
  "Canvas Bg:",
  prescription.fullData?.canvasBg
);
    
    setSelectedPrescription(formattedPrescription);
    setShowPrescriptionModal(true);
    setOpenMenu(null);
  };

  const handleSavePrescription = (prescriptionData) => {
    setShowPrescriptionModal(false);
    setSelectedPrescription(null);
    refetchPatient();
    refetchPrescriptions();
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

  const handleConfirmDelete = async () => {
    const { type, id, index } = deleteConfig;
    
    try {
      if (type === 'prescription') {
        await deletePrescription(id).unwrap();
        showSuccessToast("Prescription deleted successfully");
        await refetchPrescriptions();
      } else if (type === 'vital') {
        await deleteVital(id).unwrap();
        showSuccessToast("Vital record deleted successfully");
        await refetchVitals();
      } else if (type === 'appointment') {
        const updatedAppointments = patient.appointmentsList.filter((_, i) => i !== index);
        setPatient({...patient, appointmentsList: updatedAppointments});
        showSuccessToast("Appointment deleted successfully");
      } else if (type === 'visit') {
        const updatedVisits = patient.visitHistoryList.filter((_, i) => i !== index);
        setPatient({...patient, visitHistoryList: updatedVisits});
        showSuccessToast("Visit record deleted successfully");
      } else if (type === 'medical') {
        const updatedMedicalHistory = patient.medicalHistoryList.filter((_, i) => i !== index);
        setPatient({...patient, medicalHistoryList: updatedMedicalHistory});
        showSuccessToast("Medical history deleted successfully");
      } else if (type === 'document') {
        const updatedDocuments = patient.documentsList.filter((_, i) => i !== index);
        setPatient({...patient, documentsList: updatedDocuments});
        showSuccessToast("Document deleted successfully");
      } else if (type === 'insurance') {
        const updatedInsurance = patient.insuranceList.filter(item => item.id !== id);
        setPatient({...patient, insuranceList: updatedInsurance});
        showSuccessToast("Insurance record deleted successfully");
      }
    } catch (error) {
      console.error("Delete error:", error);
      showErrorToast(`Failed to delete ${type}: ${error?.data?.message || error.message}`);
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
      default: 
        return <ProfileTab patient={patient} handleEditPatient={handleEditPatient} handleAddAppointment={handleAddAppointment} handleViewAppointmentDetails={handleViewAppointmentDetails} handleViewVisitDetails={handleViewVisitDetails} handleViewVitalDetails={handleViewVitalDetails} setTab={setTab} getStatusBadge={getStatusBadge} />;
    }
  };

  if (isLoadingPatient && !patientData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader centered text="Loading patient details..." />
      </div>
    );
  }

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
  patient={patient}
  existingPrescription={selectedPrescription}
  templateDesign={selectedPrescription?.design || []}
  templateBgColor={selectedPrescription?.canvasBg || "#ffffff"}
  doctor={{
    displayName: selectedPrescription?.doctorName,
    department: selectedPrescription?.doctorSpecialization,
    specialist: selectedPrescription?.doctorSpecialization,
  }}
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

export default PatientDetails;