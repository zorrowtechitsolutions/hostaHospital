// src/components/Appointment/Consultation.jsx - Refactored (Partial - Key sections)
import React, { useState } from "react";
import ViewMedicalHistory from "./ViewMedicalHistory";
import { Button, Card, Input, Select, Textarea, Badge, Alert } from "../ui";

// Vital Input Component
const VitalInput = ({ label, type = "text", unit, value, onChange, isEditing }) => {
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

const Consultation = () => {
  const [medications, setMedications] = useState([
    { id: 1, name: "", dosage: "", duration: "", frequency: "", timing: "", instructions: "" }
  ]);
  const [medicationErrors, setMedicationErrors] = useState({});
  const [investigations, setInvestigations] = useState([]);
  const [newInvestigation, setNewInvestigation] = useState("");
  const [complaint, setComplaint] = useState("");
  const [complaintError, setComplaintError] = useState("");
  const [vitals, setVitals] = useState({
    temperature: "", pulse: "", respiratoryRate: "", spo2: "",
    height: "", weight: "", bmi: "", waist: "", bsa: ""
  });
  const [isEditingVitals, setIsEditingVitals] = useState(false);
  const [nextConsultationDate, setNextConsultationDate] = useState("");
  const [showMedicalHistory, setShowMedicalHistory] = useState(false);

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

  const addMedicationRow = () => {
    const newId = medications.length > 0 ? Math.max(...medications.map(m => m.id)) + 1 : 1;
    setMedications([...medications, { id: newId, name: "", dosage: "", duration: "", frequency: "", timing: "", instructions: "" }]);
  };

  const updateMedication = (id, field, value) => {
    setMedications(medications.map(med => med.id === id ? { ...med, [field]: value } : med));
    if (medicationErrors[id] && medicationErrors[id][field]) {
      setMedicationErrors(prev => ({ ...prev, [id]: { ...prev[id], [field]: undefined } }));
    }
  };

  const deleteMedicationRow = (id) => {
    setMedications(medications.filter(med => med.id !== id));
    const newErrors = { ...medicationErrors };
    delete newErrors[id];
    setMedicationErrors(newErrors);
  };

  const addInvestigation = () => {
    if (newInvestigation.trim() !== "") {
      setInvestigations([...investigations, newInvestigation.trim()]);
      setNewInvestigation("");
    }
  };

  const deleteInvestigation = (index) => {
    setInvestigations(investigations.filter((_, i) => i !== index));
  };

  const updateVital = (field, value) => setVitals({ ...vitals, [field]: value });
  const saveVitals = () => setIsEditingVitals(false);
  const cancelVitalsEdit = () => setIsEditingVitals(false);

  const handleEndConsultation = () => {
    const isComplaintValid = validateComplaint();
    const isMedicationsValid = validateAllMedications();
    if (isComplaintValid && isMedicationsValid) {
      alert("Consultation ended successfully!");
    } else {
      let errorMessage = "Please fix the following issues:\n";
      if (!isComplaintValid) errorMessage += "- Complaint is required\n";
      if (!isMedicationsValid) errorMessage += "- Please fill in all required medication fields (marked with *)\n";
      alert(errorMessage);
    }
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen font-sans" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      <style>{`.p-4::-webkit-scrollbar { display: none; }`}</style>
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="mb-4">
          <h1 className="text-xl font-semibold text-gray-800">Consultation</h1>
          <p className="text-xs text-gray-500 mt-0.5">Home / Appointments / Consultation</p>
        </div>

        {/* BASIC INFO CARD */}
        <Card className="mb-4 overflow-hidden">
          <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-800">Basic Information</h3>
            <button onClick={() => setShowMedicalHistory(true)} className="text-[#1C62A0] text-xs cursor-pointer hover:underline">
              View Medical History →
            </button>
          </div>
          <div className="p-4 flex flex-wrap justify-between items-center gap-3">
            <div className="flex items-center gap-3">
              <img src="https://randomuser.me/api/portraits/men/32.jpg" className="w-10 h-10 rounded-lg object-cover" alt="patient" />
              <div>
                <Badge variant="info" className="text-[10px]">Out Patient</Badge>
                <p className="font-semibold text-gray-800 text-sm mt-1">Reyan Verol</p>
                <p className="text-xs text-gray-500">Consultation ID : #C243546</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-xs bg-gray-50 px-3 py-2 rounded-lg">
              <div><p className="text-gray-500 text-[10px]">Age / Gender</p><p className="font-medium text-gray-800 text-xs">28 Years / Male</p></div>
              <div><p className="text-gray-500 text-[10px]">Department</p><p className="font-medium text-gray-800 text-xs">Cardiology</p></div>
              <div><p className="text-gray-500 text-[10px]">Date</p><p className="font-medium text-gray-800 text-xs">25 Jan 2025, 07:00 PM</p></div>
            </div>
          </div>
        </Card>

        {/* VITALS CARD */}
        <Card className="mb-4 overflow-hidden">
          <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-800">Vital Signs</h3>
            <div className="flex gap-2">
              {!isEditingVitals ? (
                <button onClick={() => setIsEditingVitals(true)} className="text-xs text-[#1C62A0] font-medium">✎ Edit</button>
              ) : (
                <>
                  <button onClick={cancelVitalsEdit} className="text-xs text-[#1C62A0] font-medium">Cancel</button>
                  <button onClick={saveVitals} className="text-xs text-[#1C62A0] font-medium">✓ Save</button>
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
              <VitalInput label="Height" type="number" unit="cm" value={vitals.height} onChange={(val) => updateVital("height", val)} isEditing={isEditingVitals} />
              <VitalInput label="Weight" type="number" unit="kg" value={vitals.weight} onChange={(val) => updateVital("weight", val)} isEditing={isEditingVitals} />
              <VitalInput label="BMI" type="number" unit="kg/m²" value={vitals.bmi} onChange={(val) => updateVital("bmi", val)} isEditing={isEditingVitals} />
              <VitalInput label="Waist" type="number" unit="cm" value={vitals.waist} onChange={(val) => updateVital("waist", val)} isEditing={isEditingVitals} />
              <VitalInput label="BSA" type="number" unit="m²" value={vitals.bsa} onChange={(val) => updateVital("bsa", val)} isEditing={isEditingVitals} />
            </div>
          </div>
        </Card>

        {/* COMPLAINT CARD */}
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

        {/* MEDICATIONS CARD - Keep as is due to complex table structure */}
        {/* ... existing medications table code remains the same ... */}

        {/* INVESTIGATIONS CARD */}
        <Card className="mb-4 overflow-hidden">
          <div className="px-4 py-2 border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-800">Investigations & Procedure</h3>
          </div>
          <div className="p-4">
            <div className="flex gap-2 mb-3">
              <input className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C62A0] text-sm" placeholder="Enter investigation or procedure" value={newInvestigation} onChange={(e) => setNewInvestigation(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addInvestigation()} />
              <button onClick={addInvestigation} className="px-3 py-1.5 text-[#1C62A0] hover:text-[#6da0ca] rounded-lg transition-colors text-sm font-medium">+ Add</button>
            </div>
            {investigations.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-medium text-gray-500">Added Items:</p>
                <div className="flex flex-wrap gap-2">
                  {investigations.map((item, index) => (
                    <div key={index} className="flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1">
                      <span className="text-sm text-gray-700">{item}</span>
                      <button onClick={() => deleteInvestigation(index)} className="text-gray-400 hover:text-[#1C62A0] transition-colors">✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* ADVICE CARD */}
        <Card className="mb-4 overflow-hidden">
          <div className="px-4 py-2 border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-800">Advice</h3>
          </div>
          <div className="p-4">
            <textarea className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C62A0] text-sm" rows={2} placeholder="Write advice for the patient..." />
          </div>
        </Card>

        {/* FOLLOW UP CARD */}
        <Card className="mb-4 overflow-hidden">
          <div className="px-4 py-2 border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-800">Follow Up</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Next Consultation</label>
                <input type="date" className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C62A0] text-sm" value={nextConsultationDate} onChange={(e) => setNextConsultationDate(e.target.value)} />
                <p className="text-[10px] text-gray-400 mt-1">Select date for follow-up</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Empty Stomach Required?</label>
                <select className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C62A0] text-sm bg-white">
                  <option value="">Select</option>
                  <option value="yes">Yes, come on empty stomach</option>
                  <option value="no">No, can have food</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-gray-100">
              <Button variant="secondary" size="sm">Cancel</Button>
              <Button variant="primary" size="sm" onClick={handleEndConsultation}>End Consultation</Button>
            </div>
          </div>
        </Card>
      </div>

      <ViewMedicalHistory isOpen={showMedicalHistory} onClose={() => setShowMedicalHistory(false)} />
    </div>
  );
};

export default Consultation;