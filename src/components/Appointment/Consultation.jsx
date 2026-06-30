import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ViewMedicalHistory from "./ViewMedicalHistory";
import { Button, Card, Badge } from "../ui";
import { showSuccessToast, showWarningToast, showErrorToast } from "../ui/Toast";
import { useCreatePrescriptionMutation } from "../../../app/service/prescription";
import { useCreateVitalMutation } from "../../../app/service/vitals";
import { getHospitalId } from "../../utils/auth";
import { useCompleteBookingMutation } from "../../../app/service/request";
import { useUpdateBookingMutation } from "../../../app/service/request";
import { useGetPrescriptionTemplatesQuery } from "../../../app/service/prescriptionTemplate";

// ✅ Import socket
import { socket } from '../../socket/socket';
// ✅ Import socket event listeners
import { registerPrescriptionEvents, unregisterPrescriptionEvents } from '../../socket/prescriptionEvents';

// Vital Input Component
const VitalInput = ({ label, type = "text", unit, value, onChange, isEditing, onBlur }) => {
  return (
    <div>
      <label className="block text-[10px] font-medium text-gray-600 mb-0.5">
        {label} <span className="text-gray-400">({unit})</span>
      </label>
      {isEditing ? (
        <input
          type={type}
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder="Enter value"
        />
      ) : (
        <div className="px-2 py-1 text-xs text-gray-800 bg-gray-50 rounded border border-gray-100">
          {value || "—"}
        </div>
      )}
    </div>
  );
};

// Medication Row Component
const MedicationRow = ({ medication, onUpdate, onDelete, errors }) => {
  const frequencies = ["Once Daily", "Twice Daily", "Three Times Daily", "Four Times Daily", "Every 6 Hours", "Every 8 Hours", "As Needed"];
  const timings = ["Before Meal", "After Meal", "With Meal", "At Bedtime", "Morning", "Evening"];

  return (
    <div className="border border-gray-200 rounded-lg p-3 mb-3 bg-white">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Medicine Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className={`w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
            placeholder="Enter medicine name"
            value={medication.name}
            onChange={(e) => onUpdate(medication.id, "name", e.target.value)}
          />
          {errors.name && <p className="text-red-500 text-[10px] mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Dosage <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className={`w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.dosage ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
            placeholder="e.g., 500mg, 10ml"
            value={medication.dosage}
            onChange={(e) => onUpdate(medication.id, "dosage", e.target.value)}
          />
          {errors.dosage && <p className="text-red-500 text-[10px] mt-1">{errors.dosage}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Duration <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className={`w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.duration ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
            placeholder="e.g., 5 days, 2 weeks"
            value={medication.duration}
            onChange={(e) => onUpdate(medication.id, "duration", e.target.value)}
          />
          {errors.duration && <p className="text-red-500 text-[10px] mt-1">{errors.duration}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Frequency <span className="text-red-500">*</span>
          </label>
          <select
            className={`w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.frequency ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
            value={medication.frequency}
            onChange={(e) => onUpdate(medication.id, "frequency", e.target.value)}
          >
            <option value="">Select</option>
            {frequencies.map(freq => <option key={freq} value={freq}>{freq}</option>)}
          </select>
          {errors.frequency && <p className="text-red-500 text-[10px] mt-1">{errors.frequency}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Timing <span className="text-red-500">*</span>
          </label>
          <select
            className={`w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.timing ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
            value={medication.timing}
            onChange={(e) => onUpdate(medication.id, "timing", e.target.value)}
          >
            <option value="">Select</option>
            {timings.map(time => <option key={time} value={time}>{time}</option>)}
          </select>
          {errors.timing && <p className="text-red-500 text-[10px] mt-1">{errors.timing}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Special Instructions</label>
          <input
            type="text"
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Additional instructions"
            value={medication.instructions}
            onChange={(e) => onUpdate(medication.id, "instructions", e.target.value)}
          />
        </div>
      </div>
      <div className="flex justify-end">
        <button
          onClick={() => onDelete(medication.id)}
          className="text-xs text-red-500 hover:text-red-700 transition-colors"
        >
          Remove Medication
        </button>
      </div>
    </div>
  );
};

const Consultation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const appointmentData = location.state?.appointment || location.state || {};
  
  const [createPrescription, { isLoading: isCreateLoading }] = useCreatePrescriptionMutation();
  const [createVital, { isLoading: isVitalLoading }] = useCreateVitalMutation();
  const [updateBooking] = useUpdateBookingMutation();
  
  // Fetch prescription templates
  const { data: existingTemplates, isLoading: isTemplatesLoading } = useGetPrescriptionTemplatesQuery({});

  const [medications, setMedications] = useState([
    { id: 1, name: "", dosage: "", duration: "", frequency: "", timing: "", instructions: "" }
  ]);
  const [medicationErrors, setMedicationErrors] = useState({});
  const [investigations, setInvestigations] = useState([]);
  const [newInvestigation, setNewInvestigation] = useState("");
  const [complaint, setComplaint] = useState("");
  const [complaintError, setComplaintError] = useState("");
  const [advice, setAdvice] = useState("");
  const [vitals, setVitals] = useState({
    temperature: "", pulse: "", respiratoryRate: "", spo2: "",
    height: "", weight: "", bmi: "", waist: "", bsa: ""
  });
  const [isEditingVitals, setIsEditingVitals] = useState(false);
  const [nextConsultationDate, setNextConsultationDate] = useState("");
  const [emptyStomach, setEmptyStomach] = useState("");
  const [showMedicalHistory, setShowMedicalHistory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ Register socket event listeners
  useEffect(() => {
    console.log("🔄 Registering prescription event listeners...");
    console.log("📡 Socket connected:", socket.connected);
    
    registerPrescriptionEvents({
      onPrescriptionCreated: async (data) => {
        console.log("📋 NEW PRESCRIPTION CREATED:", data);
        showSuccessToast(`New prescription created!`, 3000);
      },
      onPrescriptionUpdated: async (data) => {
        console.log("✏️ PRESCRIPTION UPDATED:", data);
        showSuccessToast(`Prescription updated!`, 3000);
      },
      onPrescriptionDeleted: async (data) => {
        console.log("🗑️ PRESCRIPTION DELETED:", data);
        showSuccessToast(`Prescription deleted!`, 3000);
      }
    });

    return () => {
      console.log("🧹 Unregistering prescription events...");
      unregisterPrescriptionEvents();
    };
  }, []);

  // ✅ Listen for socket connection
  useEffect(() => {
    const handleConnect = () => {
      console.log("✅ Socket CONNECTED - Prescription events will work!");
    };

    const handleDisconnect = () => {
      console.log("❌ Socket DISCONNECTED - Prescription events won't work!");
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, []);

  // ✅ Log all socket events for debugging
  useEffect(() => {
    const handleAnyEvent = (event, ...args) => {
      console.log(`📡 ALL SOCKET EVENTS - PRESCRIPTION: ${event}:`, args);
    };

    socket.onAny(handleAnyEvent);

    return () => {
      socket.offAny(handleAnyEvent);
    };
  }, []);

  useEffect(() => {
    console.log("=== CONSULTATION PAGE DEBUG ===");
    console.log("Appointment Data received:", appointmentData);
    console.log("Doctor Name:", appointmentData.doctor?.name || appointmentData.doctorName);
    console.log("Doctor Specialization:", appointmentData.doctor?.specialization || appointmentData.department);
    console.log("Booking ID:", appointmentData.id);
    console.log("==============================");
  }, [appointmentData]);

  // Debug template data
  useEffect(() => {
    console.log("=== PRESCRIPTION TEMPLATE DEBUG ===");
    console.log("Existing Templates:", existingTemplates);
    console.log("Templates Data:", existingTemplates?.data);
    console.log("First Template:", existingTemplates?.data?.[0]);
    if (existingTemplates?.data?.[0]) {
      console.log("Template Type:", existingTemplates?.data?.[0]?.templateType);
      console.log("Canvas BG:", existingTemplates?.data?.[0]?.canvasBg);
      console.log("Design:", existingTemplates?.data?.[0]?.design);
    }
    console.log("================================");
  }, [existingTemplates]);

  const validateMedication = (med) => {
    const errors = {};
    if (!med.name.trim()) errors.name = "Medicine name is required";
    if (!med.dosage.trim()) errors.dosage = "Dosage is required";
    if (!med.duration.trim()) errors.duration = "Duration is required";
    if (!med.frequency) errors.frequency = "Frequency is required";
    if (!med.timing) errors.timing = "Timing is required";
    return errors;
  };

  const validateComplaint = () => {
    if (!complaint.trim()) {
      setComplaintError("Complaint is required");
      return false;
    }
    setComplaintError("");
    return true;
  };

  const validateAllMedications = () => {
    const allErrors = {};
    medications.forEach(med => {
      const errors = validateMedication(med);
      if (Object.keys(errors).length > 0) allErrors[med.id] = errors;
    });
    setMedicationErrors(allErrors);
    return Object.keys(allErrors).length === 0;
  };

  const validateAppointmentData = () => {
    const missingData = [];
    
    if (!appointmentData.id && !appointmentData.bookingId) {
      missingData.push("Booking ID");
    }
    
    const patientId = appointmentData.patientId || appointmentData.patient?.id || appointmentData.patient?.patientId || null;
    const userId = appointmentData.userId || appointmentData.patient?.userId || null;
    
    if (!patientId && !userId) {
      missingData.push("Patient ID or User ID");
    }
    
    const doctorId = appointmentData.doctorId || appointmentData.doctor?.id;
    if (!doctorId) {
      missingData.push("Doctor ID");
    }
    
    const hospitalId = getHospitalId() || appointmentData.hospitalId;
    if (!hospitalId) {
      missingData.push("Hospital ID");
    }
    
    if (missingData.length > 0) {
      showErrorToast(`Missing required data: ${missingData.join(", ")}. Please go back and select a valid appointment.`);
      return false;
    }
    return true;
  };

  const addMedicationRow = () => {
    const newId = medications.length > 0 ? Math.max(...medications.map(m => m.id)) + 1 : 1;
    setMedications([...medications, { id: newId, name: "", dosage: "", duration: "", frequency: "", timing: "", instructions: "" }]);
    showSuccessToast("New medication row added", 2000);
  };

  const updateMedication = (id, field, value) => {
    setMedications(medications.map(med => med.id === id ? { ...med, [field]: value } : med));
    if (medicationErrors[id] && medicationErrors[id][field]) {
      setMedicationErrors(prev => ({ ...prev, [id]: { ...prev[id], [field]: undefined } }));
    }
  };

  const deleteMedicationRow = (id) => {
    if (medications.length === 1) {
      showWarningToast("At least one medication is required", 3000);
      return;
    }
    setMedications(medications.filter(med => med.id !== id));
    const newErrors = { ...medicationErrors };
    delete newErrors[id];
    setMedicationErrors(newErrors);
    showSuccessToast("Medication removed", 2000);
  };

  const addInvestigation = () => {
    if (newInvestigation.trim() !== "") {
      setInvestigations([...investigations, newInvestigation.trim()]);
      setNewInvestigation("");
      showSuccessToast("Investigation added", 2000);
    } else {
      showWarningToast("Please enter an investigation", 3000);
    }
  };

  const deleteInvestigation = (index) => {
    setInvestigations(investigations.filter((_, i) => i !== index));
    showSuccessToast("Investigation removed", 2000);
  };

  const updateVital = (field, value) => setVitals({ ...vitals, [field]: value });
  
  const calculateBMI = () => {
    if (vitals.height && vitals.weight) {
      const heightInMeters = vitals.height / 100;
      const bmiValue = (vitals.weight / (heightInMeters * heightInMeters)).toFixed(1);
      setVitals(prev => ({ ...prev, bmi: bmiValue }));
      showSuccessToast("BMI calculated: " + bmiValue, 2000);
    }
  };
  
  const saveVitals = () => {
    setIsEditingVitals(false);
    showSuccessToast("Vital signs saved locally", 3000);
  };
  
  const cancelVitalsEdit = () => setIsEditingVitals(false);

  const handleBackToAppointments = () => {
    navigate("/appointments");
  };

  // Helper function to extract numeric ID from string
  const extractNumericId = (id) => {
    if (!id) return null;
    if (typeof id === 'number') return id;
    if (typeof id === 'string') {
      // Remove any non-numeric characters (like #PT0001 -> 1)
      const numericMatch = id.match(/\d+/);
      return numericMatch ? parseInt(numericMatch[0]) : null;
    }
    return null;
  };

  // ✅ UPDATED: This is the fixed handleEndConsultation function
  const handleEndConsultation = async () => {
    if (!validateAppointmentData()) return;
    
    const isComplaintValid = validateComplaint();
    const isMedicationsValid = validateAllMedications();

    if (!isComplaintValid || !isMedicationsValid) return;

    setIsSubmitting(true);

    try {
      const bookingId = appointmentData.id || appointmentData.bookingId;
      
      // Extract numeric IDs from potentially string values
      const extractedPatientId = extractNumericId(
        appointmentData.patientId || 
        appointmentData.patient?.id || 
        appointmentData.patient?.patientId || 
        null
      );
      
      const extractedUserId = extractNumericId(
        appointmentData.userId || 
        appointmentData.patient?.userId || 
        null
      );
      
      const extractedDoctorId = extractNumericId(
        appointmentData.doctorId || 
        appointmentData.doctor?.id || 
        appointmentData.doctor?.doctorId
      );
      
      const extractedHospitalId = extractNumericId(
        getHospitalId() || 
        appointmentData.hospitalId || 
        appointmentData.hospital?.id
      );
      
      const extractedDoctorName = appointmentData.doctor?.name || appointmentData.doctorName || appointmentData.displayName || appointmentData.doctor?.displayName || null;
      const extractedDoctorSpecialization = appointmentData.doctor?.specialization || appointmentData.doctor?.department || appointmentData.department || appointmentData.specialization || null;
      
      console.log("Doctor Name:", extractedDoctorName);
      
      if (!bookingId) throw new Error("Missing Booking ID");
      if (!extractedDoctorId) throw new Error("Missing Doctor ID");
      if (!extractedHospitalId) throw new Error("Missing Hospital ID");
      if (!extractedPatientId && !extractedUserId) throw new Error("Missing both Patient ID and User ID");
      
      // Map medication fields to match API expectations
      const formattedMedications = medications.map(({ id, ...med }) => ({
        medicineName: med.name,
        dosage: med.dosage,
        duration: med.duration,
        frequency: med.frequency,
        timing: med.timing,
        instructions: med.instructions || "",
      }));
      
      const validMedications = formattedMedications.filter(med => med.medicineName?.trim() !== "");

      // Get the selected template (first one from the list or null)
      const selectedTemplate = existingTemplates?.data?.[0] || null;
      
      console.log("Selected Template for prescription:", selectedTemplate);

      // ✅ FIXED: Create prescription data with prescribedBy field
      const prescriptionData = {
        bookingId: Number(bookingId),
        hospitalId: extractedHospitalId,
        doctorId: extractedDoctorId,
        
        // ✅ IMPORTANT: Send prescribedBy instead of doctorName for backend
        prescribedBy: extractedDoctorName,      // Backend expects this field
        doctorName: extractedDoctorName,        // Keep for frontend display
        doctorSpecialization: extractedDoctorSpecialization,
        
        patientId: extractedPatientId || undefined,
        userId: extractedUserId || undefined,
        complaint: complaint.trim(),
        medications: validMedications,
        investigations: investigations.filter(i => i.trim() !== ""),
        advice: advice.trim() || "",
        next_consultation: nextConsultationDate || null,
        empty_stomach: emptyStomach === "yes",
        
        // Template fields - use fetched template or defaults
        templateType: selectedTemplate?.templateType || "demo",
        canvasBg: selectedTemplate?.canvasBg || "#ffffff",
        design: selectedTemplate?.design || [],
        
        // Vital signs
        temperature: Number(vitals.temperature) || 0,
        pulse: Number(vitals.pulse) || 0,
        respiratoryRate: Number(vitals.respiratoryRate) || 0,
        spo2: Number(vitals.spo2) || 0,
        height: Number(vitals.height) || 0,
        weight: Number(vitals.weight) || 0,
        bmi: Number(vitals.bmi) || 0,
        waist: Number(vitals.waist) || 0,
        bsa: Number(vitals.bsa) || 0,
      };

      console.log("=== PRESCRIPTION DATA ===");
      console.log(prescriptionData);
      console.log("nextConsultationDate:", nextConsultationDate);
      console.log("========================");

      const result = await createPrescription(prescriptionData).unwrap();

      // ✅ Emit socket event for prescription created
      if (socket && socket.connected) {
        socket.emit('PRESCRIPTION_CREATED', {
          prescriptionId: result?.data?.id || result?.data?._id,
          patientId: extractedPatientId || result?.patientId,
          doctorId: extractedDoctorId,
          hospitalId: extractedHospitalId,
          bookingId: bookingId,
        });
        console.log("📤 Emitted PRESCRIPTION_CREATED event");
      }

      await updateBooking({
        id: bookingId,
        data: {
          status: "completed"
        }
      }).unwrap();

      console.log("✅ Prescription response:", result);
      
      showSuccessToast("Consultation completed successfully");
      navigate("/visits", {
        state: {
          completedPatientId: extractedPatientId || result?.patientId,
          showSuccess: true
        },
      });

    } catch (error) {
      console.error("❌ Error:", error);
      showErrorToast(error?.data?.message || "Failed to complete consultation");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={handleBackToAppointments}
              className="flex items-center gap-1 text-gray-600 transition-colors group"
            >
              <svg className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="text-sm font-medium">Back to Appointments</span>
            </button>
          </div>
          <h1 className="text-xl font-semibold text-gray-800">Consultation</h1>
          <p className="text-xs text-gray-500 mt-0.5">Home / Appointments / Consultation</p>
        </div>

        {/* Basic Information Card */}
        <Card className="mb-4 overflow-hidden">
          <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-800">Basic Information</h3>
            <button onClick={() => setShowMedicalHistory(true)} className="text-[#1C62A0] text-xs cursor-pointer hover:underline">
              View Medical History →
            </button>
          </div>
          <div className="p-4 flex flex-wrap justify-between items-center gap-3">
            <div className="flex items-center gap-3">
              {/* Avatar with first letter fallback */}
              <div className="w-10 h-10 rounded-lg bg-[#1C62A0] flex items-center justify-center text-white font-semibold text-sm">
                {(appointmentData.patientName || appointmentData.patient?.name || "P")
                  .charAt(0)
                  .toUpperCase()}
              </div>
              <div>
                <Badge variant="info" className="text-[10px]">{appointmentData.patientType || "Out Patient"}</Badge>
                <p className="font-semibold text-gray-800 text-sm mt-1">{appointmentData.patientName || appointmentData.patient?.name || "Patient"}</p>
                <p className="text-xs text-gray-500">Consultation ID : #{appointmentData.id || appointmentData.bookingId || "N/A"}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-xs bg-gray-50 px-3 py-2 rounded-lg">
              <div><p className="text-gray-500 text-[10px]">Age / Gender</p><p className="font-medium text-gray-800 text-xs">{appointmentData.age || "28"} Years / {appointmentData.gender || "Male"}</p></div>
              <div><p className="text-gray-500 text-[10px]">Department</p><p className="font-medium text-gray-800 text-xs">{appointmentData.department || "Cardiology"}</p></div>
              <div><p className="text-gray-500 text-[10px]">Date</p><p className="font-medium text-gray-800 text-xs">{appointmentData.appointmentDateDisplay || "25 Jan 2025, 07:00 PM"}</p></div>
            </div>
          </div>
        </Card>

        {/* Vital Signs Card */}
        <Card className="mb-4 overflow-hidden">
          <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-800">Vital Signs</h3>
            <div className="flex gap-2">
              {!isEditingVitals ? (
                <button onClick={() => setIsEditingVitals(true)} className="text-xs text-[#1C62A0] font-medium">✎ Edit</button>
              ) : (
                <>
                  <button onClick={cancelVitalsEdit} className="text-xs text-gray-500 font-medium">Cancel</button>
                  <button onClick={saveVitals} className="text-xs text-green-600 font-medium">✓ Save</button>
                </>
              )}
            </div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              <VitalInput label="Temperature" type="number" unit="°F" value={vitals.temperature} onChange={(val) => updateVital("temperature", val)} isEditing={isEditingVitals} />
              <VitalInput label="Pulse" type="number" unit="bpm" value={vitals.pulse} onChange={(val) => updateVital("pulse", val)} isEditing={isEditingVitals} />
              <VitalInput label="Respiratory Rate" type="number" unit="rpm" value={vitals.respiratoryRate} onChange={(val) => updateVital("respiratoryRate", val)} isEditing={isEditingVitals} />
              <VitalInput label="SPO2" type="number" unit="%" value={vitals.spo2} onChange={(val) => updateVital("spo2", val)} isEditing={isEditingVitals} />
              <VitalInput label="Height" type="number" unit="cm" value={vitals.height} onChange={(val) => updateVital("height", val)} onBlur={calculateBMI} isEditing={isEditingVitals} />
              <VitalInput label="Weight" type="number" unit="kg" value={vitals.weight} onChange={(val) => updateVital("weight", val)} onBlur={calculateBMI} isEditing={isEditingVitals} />
              <VitalInput label="BMI" type="number" unit="kg/m²" value={vitals.bmi} onChange={(val) => updateVital("bmi", val)} isEditing={isEditingVitals} />
              <VitalInput label="Waist" type="number" unit="cm" value={vitals.waist} onChange={(val) => updateVital("waist", val)} isEditing={isEditingVitals} />
              <VitalInput label="BSA" type="number" unit="m²" value={vitals.bsa} onChange={(val) => updateVital("bsa", val)} isEditing={isEditingVitals} />
            </div>
            <p className="text-[10px] text-gray-400 mt-2">💡 Vital signs will be saved with the prescription and appear in the patient's Vitals tab</p>
          </div>
        </Card>

        {/* Complaint Card */}
        <Card className="mb-4 overflow-hidden">
          <div className="px-4 py-2 border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-800">Complaint <span className="text-red-500">*</span></h3>
          </div>
          <div className="p-4">
            <input className={`w-full px-3 py-1.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C62A0] text-sm ${complaintError ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} placeholder="Enter value separated by comma" value={complaint} onChange={(e) => { setComplaint(e.target.value); if (complaintError && e.target.value.trim()) setComplaintError(""); }} />
            <p className="text-[10px] text-gray-400 mt-1">Example: Fever, Headache, Cough</p>
            {complaintError && <p className="text-red-500 text-[10px] mt-1">{complaintError}</p>}
          </div>
        </Card>

        {/* Medications Card */}
        <Card className="mb-4 overflow-hidden">
          <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-800">Medications <span className="text-red-500">*</span></h3>
            <button onClick={addMedicationRow} className="text-xs text-[#1C62A0] font-medium hover:underline">+ Add Another</button>
          </div>
          <div className="p-4">
            {medications.map((medication) => (
              <MedicationRow key={medication.id} medication={medication} onUpdate={updateMedication} onDelete={deleteMedicationRow} errors={medicationErrors[medication.id] || {}} />
            ))}
          </div>
        </Card>

        {/* Investigations Card */}
        <Card className="mb-4 overflow-hidden">
          <div className="px-4 py-2 border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-800">Investigations & Procedure</h3>
          </div>
          <div className="p-4">
            <div className="flex gap-2 mb-3">
              <input className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C62A0] text-sm" placeholder="Enter investigation" value={newInvestigation} onChange={(e) => setNewInvestigation(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addInvestigation()} />
              <button onClick={addInvestigation} className="px-3 py-1.5 text-[#1C62A0] hover:text-[#6da0ca] rounded-lg transition-colors text-sm font-medium">+ Add</button>
            </div>
            {investigations.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-medium text-gray-500">Added Items:</p>
                <div className="flex flex-wrap gap-2">
                  {investigations.map((item, index) => (
                    <div key={index} className="flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1">
                      <span className="text-sm text-gray-700">{item}</span>
                      <button onClick={() => deleteInvestigation(index)} className="text-gray-400 hover:text-red-500 transition-colors">✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Advice Card */}
        <Card className="mb-4 overflow-hidden">
          <div className="px-4 py-2 border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-800">Advice</h3>
          </div>
          <div className="p-4">
            <textarea className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C62A0] text-sm" rows={2} placeholder="Write advice for the patient..." value={advice} onChange={(e) => setAdvice(e.target.value)} />
          </div>
        </Card>

        {/* Follow Up Card */}
        <Card className="mb-4 overflow-hidden">
          <div className="px-4 py-2 border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-800">Follow Up</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Next Consultation</label>
                <input type="date" className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C62A0] text-sm" value={nextConsultationDate} onChange={(e) => setNextConsultationDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Empty Stomach Required?</label>
                <select className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C62A0] text-sm bg-white" value={emptyStomach} onChange={(e) => setEmptyStomach(e.target.value)}>
                  <option value="">Select</option>
                  <option value="yes">Yes, come on empty stomach</option>
                  <option value="no">No, can have food</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-gray-100">
              <Button variant="outline" size="sm" onClick={handleBackToAppointments}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={handleEndConsultation} disabled={isSubmitting || isCreateLoading || isVitalLoading || isTemplatesLoading} loading={isSubmitting || isCreateLoading || isVitalLoading}>
                {isSubmitting || isCreateLoading || isVitalLoading ? "Processing..." : "End Consultation"}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <ViewMedicalHistory
        isOpen={showMedicalHistory}
        onClose={() => setShowMedicalHistory(false)}
        patientId={
          appointmentData.patientId ||
          appointmentData.patient?.id ||
          appointmentData.patient?.patientId
        }
        department={
          appointmentData.department ||
          appointmentData.doctorDepartment ||
          appointmentData.departmentName
        }
        doctorName={
          appointmentData.doctor?.name ||
          appointmentData.doctorName ||
          appointmentData.displayName
        }
      />
    </div>
  );
};

export default Consultation;
