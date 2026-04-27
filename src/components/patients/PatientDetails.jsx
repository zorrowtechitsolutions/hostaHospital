import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, User, Calendar, Heart, Clock, Microscope, Pill, ClipboardList, FileText, ShieldIcon } from "lucide-react";
import EditAppointmentModal from "./EditAppointmentModal";
import EditVisitHistory from "./EditVisitHistoryModal";
import DeleteModal from "./DeleteModel";

// Import Tab Components
import ProfileTab from "./tabs/ProfileTab";
import AppointmentsTab from "./tabs/AppointmentsTab";
import VitalsTab from "./tabs/VitalsTab";
import VisitHistoryTab from "./tabs/VisitHistoryTab";
import LabResultsTab from "./tabs/LabResultsTab";
import PrescriptionTab from "./tabs/PrescriptionTab";
import MedicalHistoryTab from "./tabs/MedicalHistoryTab";
import DocumentsTab from "./tabs/DocumentsTab";
import InsuranceTab from "./tabs/InsuranceTab";

// Import Modals
import AppointmentDetailsModal from "./modals/AppointmentDetailsModal";
import VitalDetailsModal from "./modals/VitalDetailsModal";
import VisitDetailsModal from "./modals/VisitDetailsModal";
import MedicalDetailsModal from "./modals/MedicalDetailsModal";
import LaboratoryReportModal from "./modals/LaboratoryReportModal";
import AddAppointmentModal from "./AddAppointmentModal";
import PrescriptionReportModal from "./modals/PrecriptionReportModal";

const PatientDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const passedPatient = location.state?.patient;

  const [tab, setTab] = useState("profile");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  
  // View Modals States
  const [showAppointmentDetailsModal, setShowAppointmentDetailsModal] = useState(false);
  const [showVisitDetailsModal, setShowVisitDetailsModal] = useState(false);
  const [showMedicalDetailsModal, setShowMedicalDetailsModal] = useState(false);
  const [showVitalModal, setShowVitalModal] = useState(false);
  const [showLaboratoryModal, setShowLaboratoryModal] = useState(false);
  const [selectedLabResult, setSelectedLabResult] = useState(null);
  
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

  const [patient, setPatient] = useState({
    id: passedPatient?.id || "PT0025",
    name: passedPatient?.name || "James Carter",
    image: passedPatient?.imageUrl || "https://randomuser.me/api/portraits/men/32.jpg",
    gender: passedPatient?.gender || "Male",
    phone: passedPatient?.phone || "+1 123 456 7890",
    email: passedPatient?.email || "james.carter@example.com",
    department: passedPatient?.department || "Cardiology",
    lastVisit: passedPatient?.lastVisitDisplay || "21 Dec 2024",
    addedOn: "24 May 2024",
    dob: "10 Jan 1991",
    age: 34,
    maritalStatus: "Married",
    blood: "O+ve",
    address: "2557 Tanglewood Road, Jackson, MS 39213",
    referredBy: "Dr Antonio",
    totalBookings: 12,
    heartRate: 89,
    respiratoryRate: 24,
    spo2: 98,
    weight: 100,
    temperature: 98.6,
    bloodPressure: "128/84",
    
    appointmentsList: [
      { id: "APT001", doctorName: "Dr. Andrew Clark", department: "Anaesthesiology", appointmentDate: "17 Jun 2025", startTime: "09:00 AM", endTime: "10:00 AM", status: "Upcoming", fee: "$500", duration: "1 hour", reason: "Fever, Stomach pain, Drowsiness", notes: "Provide detailed instructions on how to use prescribed medications.", paymentMethod: "Card", patientName: "James Carter", avatar: "https://randomuser.me/api/portraits/men/32.jpg" },
      { id: "APT002", doctorName: "Dr. Katherine Brooks", department: "Dental Surgery", appointmentDate: "10 Jun 2025", startTime: "10:30 AM", endTime: "11:30 AM", status: "Upcoming", fee: "$350", duration: "1 hour", reason: "Tooth pain, Gum swelling", notes: "X-ray recommended before procedure", paymentMethod: "Cash", patientName: "James Carter", avatar: "https://randomuser.me/api/portraits/men/32.jpg" },
      { id: "APT003", doctorName: "Dr. Benjamin Harris", department: "Dermatology", appointmentDate: "22 May 2025", startTime: "01:15 PM", endTime: "02:15 PM", status: "Completed", fee: "$400", duration: "1 hour", reason: "Skin rash, Itching", notes: "Avoid using scented products", paymentMethod: "Insurance", patientName: "James Carter", avatar: "https://randomuser.me/api/portraits/men/32.jpg" },
      { id: "APT004", doctorName: "Dr. Laura Mitchell", department: "ENT Surgery", appointmentDate: "15 May 2025", startTime: "11:30 AM", endTime: "12:30 PM", status: "Inprogress", fee: "$450", duration: "1 hour", reason: "Ear infection, Sore throat", notes: "Antibiotics prescribed for 7 days", paymentMethod: "Card", patientName: "James Carter", avatar: "https://randomuser.me/api/portraits/men/32.jpg" },
      { id: "APT005", doctorName: "Dr. Christopher Lewis", department: "General Medicine", appointmentDate: "30 Apr 2025", startTime: "12:20 PM", endTime: "01:20 PM", status: "Completed", fee: "$300", duration: "1 hour", reason: "Chest pain, Shortness of breath", notes: "ECG done. Follow up in 2 weeks", paymentMethod: "Insurance", patientName: "James Carter", avatar: "https://randomuser.me/api/portraits/men/32.jpg" }
    ],
    
    vitalsList: [
      { id: 1, doctorName: "Dr. Andrew Clark", department: "Cardiology", date: "17 Jun 2025", bloodPressure: "128/84", heartRate: "89", temperature: "98.6", spo2: "98", respiratoryRate: "24", weight: "100" },
      { id: 2, doctorName: "Dr. Katherine Brooks", department: "Dental Surgery", date: "10 Jun 2025", bloodPressure: "118/76", heartRate: "72", temperature: "98.4", spo2: "99", respiratoryRate: "18", weight: "65" },
      { id: 3, doctorName: "Dr. Benjamin Harris", department: "Dermatology", date: "22 May 2025", bloodPressure: "135/88", heartRate: "94", temperature: "99.1", spo2: "97", respiratoryRate: "22", weight: "80" },
      { id: 4, doctorName: "Dr. Laura Mitchell", department: "ENT Surgery", date: "15 May 2025", bloodPressure: "142/90", heartRate: "78", temperature: "100.2", spo2: "96", respiratoryRate: "26", weight: "72" },
      { id: 5, doctorName: "Dr. Christopher Lewis", department: "General Medicine", date: "30 Apr 2025", bloodPressure: "125/82", heartRate: "85", temperature: "98.7", spo2: "98", respiratoryRate: "20", weight: "85" }
    ],
    
    visitHistoryList: [
      { id: "VIS001", visitId: "VIS001", doctorName: "Dr. Samuel Turner", department: "Cardiology", visitDate: "21 Dec 2024", startTime: "07:00 AM", endTime: "08:00 AM", status: "Completed", reason: "Chest pain and shortness of breath", diagnosis: "Mild hypertension", prescription: "Metoprolol 25mg", notes: "Follow-up in 2 weeks", followUpDate: "After 15 Days" },
      { id: "VIS002", visitId: "VIS002", doctorName: "Dr. Natalie Foster", department: "Neurology", visitDate: "08 Jan 2024", startTime: "09:55 AM", endTime: "10:55 AM", status: "Completed", reason: "Severe headaches", diagnosis: "Chronic migraines", prescription: "Sumatriptan 50mg", notes: "Avoid stress and lack of sleep", followUpDate: "After 12 Days" }
    ],
    
    labResultsList: [
      { id: "#TE0025", appointmentDate: "17 Jun 2025", referredBy: "Dr. Andrew Clark", testName: "Blood Test", status: "Received", reportedOn: "17 Jun 2025, 02:00 PM" },
      { id: "#TE0024", appointmentDate: "10 Jun 2025", referredBy: "Dr. Katherine Brooks", testName: "Urinalysis", status: "In Progress" },
      { id: "#TE0023", appointmentDate: "22 May 2025", referredBy: "Dr. Benjamin Harris", testName: "Throat Culture", status: "Pending" },
      { id: "#TE0022", appointmentDate: "15 May 2025", referredBy: "Dr. Laura Mitchell", testName: "Iron Panel", status: "Received", reportedOn: "16 May 2025, 10:30 AM" },
      { id: "#TE0021", appointmentDate: "30 Apr 2025", referredBy: "Dr. Christopher Lewis", testName: "Vitamin D Test", status: "In Progress" }
    ],
    
    prescriptionsList: [
      { 
        id: 1, 
        type: "Tablet", 
        quantity: "30", 
        date: "17 Jun 2025", 
        prescribedBy: "Dr. Andrew Clark", 
        amount: "$50", 
        paymentMethod: "Insurance", 
        status: "Active",
        medicines: [
          { name: "Metoprolol", dosage: "25mg", duration: "30 days", frequency: "1x/day", timing: "Morning" },
          { name: "Lisinopril", dosage: "10mg", duration: "30 days", frequency: "1x/day", timing: "Evening" }
        ]
      },
      { 
        id: 2, 
        type: "Syrup", 
        quantity: "1 Bottle", 
        date: "10 Jun 2025", 
        prescribedBy: "Dr. Katherine Brooks", 
        amount: "$25", 
        paymentMethod: "Cash", 
        status: "Active",
        medicines: [
          { name: "Cough Syrup", dosage: "10ml", duration: "5 days", frequency: "3x/day", timing: "After meals" }
        ]
      },
      { 
        id: 3, 
        type: "Capsule", 
        quantity: "20", 
        date: "22 May 2025", 
        prescribedBy: "Dr. Benjamin Harris", 
        amount: "$40", 
        paymentMethod: "Card", 
        status: "Completed",
        medicines: [
          { name: "Amoxicillin", dosage: "500mg", duration: "7 days", frequency: "2x/day", timing: "After food" }
        ]
      },
      { 
        id: 4, 
        type: "Injection", 
        quantity: "2", 
        date: "15 May 2025", 
        prescribedBy: "Dr. Laura Mitchell", 
        amount: "$100", 
        paymentMethod: "Insurance", 
        status: "Completed",
        medicines: [
          { name: "Vitamin B12", dosage: "1000mcg", duration: "2 days", frequency: "1x/day", timing: "As directed" }
        ]
      },
      { 
        id: 5, 
        type: "Tablet", 
        quantity: "15", 
        date: "30 Apr 2025", 
        prescribedBy: "Dr. Christopher Lewis", 
        amount: "$35", 
        paymentMethod: "Cash", 
        status: "Expired",
        medicines: [
          { name: "Ibuprofen", dosage: "400mg", duration: "5 days", frequency: "2x/day", timing: "After meals" }
        ]
      }
    ],
    
    medicalHistoryList: [
      { id: 1, illnessName: "Hypertension", illnessDate: "15 Mar 2020", yearsAgo: "5 years ago", assessment: ["Blood pressure consistently elevated", "Started on Lisinopril 10mg", "Lifestyle modifications recommended"], notes: "Patient has been managing well with medication." },
      { id: 2, illnessName: "Migraine", illnessDate: "22 Jul 2019", yearsAgo: "6 years ago", assessment: ["Recurring headaches with aura", "Triggers identified: stress, lack of sleep", "Sumatriptan prescribed for acute attacks"], notes: "Preventive medication taken daily." },
      { id: 3, illnessName: "Diabetes Type 2", illnessDate: "10 Jan 2021", yearsAgo: "4 years ago", assessment: ["HbA1c elevated at diagnosis", "Metformin prescribed", "Diet and exercise plan created"], notes: "Blood sugar levels well controlled." }
    ],
    
    documentsList: [
      { id: 1, documentName: "Blood Report.pdf", date: "17 Jun 2025", fileSize: "2.5 MB", type: "PDF" },
      { id: 2, documentName: "X-Ray Report.pdf", date: "10 Jun 2025", fileSize: "1.8 MB", type: "PDF" },
      { id: 3, documentName: "Prescription.pdf", date: "22 May 2025", fileSize: "0.5 MB", type: "PDF" }
    ],
    
    insuranceList: [
      { id: 1, policyNo: "MED-INS-87452", provider: "United Healthcare", planType: "Gold Plan", coverageAmount: "$150,000", startDate: "01 Jan 2025", expiryDate: "31 Dec 2025", status: "Active" },
      { id: 2, policyNo: "MED-INS-96541", provider: "Cigna", planType: "Silver Plan", coverageAmount: "$100,000", startDate: "15 Feb 2025", expiryDate: "20 Oct 2025", status: "Expired" }
    ],
    
    appointments: [
      { id: 1, department: "Cardiology", doctor: "Dr. Andrew Clark", date: "21 Dec 2024", time: "07:00 AM", bookedOn: "20 Dec 2024", status: "completed" },
      { id: 2, department: "Radiology", doctor: "Dr. Laura Mitchell", date: "15 Jan 2025", time: "10:35 AM", bookedOn: "13 Jan 2025", status: "upcoming" }
    ]
  });

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
    let filtered = [...patient.appointmentsList];
    if (searchTerm) {
      filtered = filtered.filter(apt => 
        apt.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(apt => apt.status.toLowerCase() === statusFilter.toLowerCase());
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
      'upcoming': 'bg-purple-100 text-purple-700',
      'inprogress': 'bg-blue-100 text-blue-700',
      'completed': 'bg-green-100 text-green-700',
      'active': 'bg-green-100 text-green-700',
      'expired': 'bg-red-100 text-red-700',
      'received': 'bg-green-100 text-green-700',
      'in progress': 'bg-blue-100 text-blue-700',
      'pending': 'bg-yellow-100 text-yellow-600'
    };
    return `px-2 py-1 rounded-full text-xs font-medium ${statusMap[status.toLowerCase()] || 'bg-gray-100 text-gray-700'}`;
  };

  // ========== VIEW MODAL HANDLERS ==========
  const handleBackToPatients = () => navigate(-1);
  
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

  const handleViewLaboratoryReport = (labResult) => {
    setSelectedLabResult(labResult);
    setShowLaboratoryModal(true);
    setOpenMenu(null);
  };

  // ========== PRESCRIPTION HANDLERS ==========
  // Handle view prescription details
  const handleViewPrescriptionDetails = (prescription) => {
    setSelectedPrescription(prescription);
    setShowPrescriptionModal(true);
    setOpenMenu(null);
  };

  // Handle save prescription (for viewing only - no add/edit)
  const handleSavePrescription = (prescriptionData) => {
    // This function is kept for modal functionality but won't be used for adding
    setShowPrescriptionModal(false);
    setSelectedPrescription(null);
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
    alert("Visit history updated successfully!");
  };

  const handleSaveEditedAppointment = (updatedData) => {
    const updatedList = patient.appointmentsList.map(apt => 
      apt.id === appointmentToEdit.id 
        ? { ...apt, department: updatedData.department, doctorName: updatedData.doctor, appointmentDate: updatedData.date, startTime: updatedData.startTime, endTime: updatedData.endTime, reason: updatedData.reason, notes: updatedData.notes, paymentMethod: updatedData.paymentMethod }
        : apt
    );
    setPatient({...patient, appointmentsList: updatedList});
    setShowEditAppointmentModal(false);
    setAppointmentToEdit(null);
    alert("Appointment updated successfully!");
  };

  // ========== DELETE HANDLERS ==========
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
        alert("Appointment deleted successfully!");
        break;
      case 'vital':
        const updatedVitals = patient.vitalsList.filter((_, i) => i !== index);
        setPatient({...patient, vitalsList: updatedVitals});
        alert("Vital record deleted successfully!");
        break;
      case 'visit':
        const updatedVisits = patient.visitHistoryList.filter((_, i) => i !== index);
        setPatient({...patient, visitHistoryList: updatedVisits});
        alert("Visit history deleted successfully!");
        break;
      case 'lab':
        const updatedLabResults = patient.labResultsList.filter((_, i) => i !== index);
        setPatient({...patient, labResultsList: updatedLabResults});
        alert("Lab result deleted successfully!");
        break;
      case 'prescription':
        const updatedPrescriptions = patient.prescriptionsList.filter((_, i) => i !== index);
        setPatient({...patient, prescriptionsList: updatedPrescriptions});
        alert("Prescription deleted successfully!");
        break;
      case 'medical':
        const updatedMedicalHistory = patient.medicalHistoryList.filter((_, i) => i !== index);
        setPatient({...patient, medicalHistoryList: updatedMedicalHistory});
        alert("Medical history deleted successfully!");
        break;
      case 'document':
        const updatedDocuments = patient.documentsList.filter((_, i) => i !== index);
        setPatient({...patient, documentsList: updatedDocuments});
        alert("Document deleted successfully!");
        break;
      case 'insurance':
        const updatedInsurance = patient.insuranceList.filter(item => item.id !== id);
        setPatient({...patient, insuranceList: updatedInsurance});
        alert("Insurance policy deleted successfully!");
        break;
      default:
        break;
    }
    setShowDeleteModal(false);
    setDeleteConfig({ type: '', id: null, index: null, name: '' });
  };

  const handleDownloadDocument = (item) => {
    alert(`Downloading ${item.documentName}...`);
  };

  const handleEditPatient = () => setShowEditModal(true);
  const handleAddAppointment = () => setShowAppointmentModal(true);

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "appointments", label: "Appointments", icon: Calendar },
    { id: "vitals", label: "Vitals", icon: Heart },
    { id: "visits", label: "Visit History", icon: Clock },
    { id: "lab", label: "Lab Results", icon: Microscope },
    { id: "prescription", label: "Prescription", icon: Pill },
    { id: "medical", label: "Medical History", icon: ClipboardList },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "insurance", label: "Insurance", icon: ShieldIcon }
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
      paginatedAppointments,
      filteredAppointments,
      handlePageChange,
      getStatusBadge,
      handleViewAppointmentDetails,
      handleViewVisitDetails,
      handleViewMedicalDetails,
      handleViewVitalDetails,
      handleViewLaboratoryReport,
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
        return <VisitHistoryTab patient={patient} handleViewVisitDetails={handleViewVisitDetails} handleEditVisitClick={handleEditVisitClick} handleDeleteClick={handleDeleteClick} openMenu={openMenu} setOpenMenu={setOpenMenu} getStatusBadge={getStatusBadge} />;
      case "lab": 
        return <LabResultsTab patient={patient} handleViewLaboratoryReport={handleViewLaboratoryReport} handleDeleteClick={handleDeleteClick} openMenu={openMenu} setOpenMenu={setOpenMenu} getStatusBadge={getStatusBadge} />;
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
      case "insurance": 
        return <InsuranceTab patient={patient} handleDeleteClick={handleDeleteClick} getStatusBadge={getStatusBadge} />;
      default: 
        return <ProfileTab patient={patient} handleEditPatient={handleEditPatient} handleAddAppointment={handleAddAppointment} handleViewAppointmentDetails={handleViewAppointmentDetails} handleViewVisitDetails={handleViewVisitDetails} handleViewVitalDetails={handleViewVitalDetails} setTab={setTab} getStatusBadge={getStatusBadge} />;
    }
  };

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
        <VisitDetailsModal data={selectedVisit} patientName={patient.name} onClose={() => setShowVisitDetailsModal(false)} />
      )}
      
      {showMedicalDetailsModal && selectedMedical && (
        <MedicalDetailsModal data={selectedMedical} onClose={() => setShowMedicalDetailsModal(false)} />
      )}
      
      {showLaboratoryModal && selectedLabResult && (
        <LaboratoryReportModal data={selectedLabResult} patient={patient} onClose={() => setShowLaboratoryModal(false)} />
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
      
      {showEditAppointmentModal && (
        <EditAppointmentModal 
          isOpen={showEditAppointmentModal} 
          onClose={() => setShowEditAppointmentModal(false)} 
          appointment={appointmentToEdit} 
          patient={patient} 
          onSave={handleSaveEditedAppointment} 
        />
      )}
      
      {showEditVisitHistoryModal && (
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

export default PatientDetails;