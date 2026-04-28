// Consultation.jsx
import React, { useState } from "react";
import ViewMedicalHistory from "./ViewMedicalHistory";

const Consultation = () => {
  // State for medications - each medication is an object with fields
  const [medications, setMedications] = useState([
    { id: 1, name: "", dosage: "", duration: "", frequency: "", timing: "", instructions: "" }
  ]);

  // State for medication validation errors
  const [medicationErrors, setMedicationErrors] = useState({});

  // State for investigations - START WITH EMPTY ARRAY
  const [investigations, setInvestigations] = useState([]);

  // State for new investigation input
  const [newInvestigation, setNewInvestigation] = useState("");

  // State for complaint
  const [complaint, setComplaint] = useState("");
  
  // State for complaint validation error
  const [complaintError, setComplaintError] = useState("");

  // State for vitals with proper data types
  const [vitals, setVitals] = useState({
    temperature: "",
    pulse: "",
    respiratoryRate: "",
    spo2: "",
    height: "",
    weight: "",
    bmi: "",
    waist: "",
    bsa: ""
  });

  // State for edit mode in vitals
  const [isEditingVitals, setIsEditingVitals] = useState(false);

  // State for next consultation date
  const [nextConsultationDate, setNextConsultationDate] = useState("");

  // State for medical history modal
  const [showMedicalHistory, setShowMedicalHistory] = useState(false);

  // Validate a single medication
  const validateMedication = (med) => {
    const errors = {};
    if (!med.name.trim()) errors.name = "Medicine name is required";
    if (!med.dosage.trim()) errors.dosage = "Dosage is required";
    if (!med.duration.trim()) errors.duration = "Duration is required";
    if (!med.frequency) errors.frequency = "Frequency is required";
    if (!med.timing) errors.timing = "Timing is required";
    return errors;
  };

  // Validate complaint
  const validateComplaint = () => {
    if (!complaint.trim()) {
      setComplaintError("Complaint is required");
      return false;
    }
    setComplaintError("");
    return true;
  };

  // Validate all medications
  const validateAllMedications = () => {
    const allErrors = {};
    medications.forEach(med => {
      const errors = validateMedication(med);
      if (Object.keys(errors).length > 0) {
        allErrors[med.id] = errors;
      }
    });
    setMedicationErrors(allErrors);
    return Object.keys(allErrors).length === 0;
  };

  // Add new medication row
  const addMedicationRow = () => {
    const newId = medications.length > 0 ? Math.max(...medications.map(m => m.id)) + 1 : 1;
    setMedications([...medications, { id: newId, name: "", dosage: "", duration: "", frequency: "", timing: "", instructions: "" }]);
  };

  // Update medication field with validation
  const updateMedication = (id, field, value) => {
    setMedications(medications.map(med => 
      med.id === id ? { ...med, [field]: value } : med
    ));
    
    // Clear error for this field when user starts typing
    if (medicationErrors[id] && medicationErrors[id][field]) {
      setMedicationErrors(prev => ({
        ...prev,
        [id]: { ...prev[id], [field]: undefined }
      }));
    }
  };

  // Delete medication row
  const deleteMedicationRow = (id) => {
    setMedications(medications.filter(med => med.id !== id));
    // Remove errors for deleted medication
    const newErrors = { ...medicationErrors };
    delete newErrors[id];
    setMedicationErrors(newErrors);
  };

  // Add new investigation
  const addInvestigation = () => {
    if (newInvestigation.trim() !== "") {
      setInvestigations([...investigations, newInvestigation.trim()]);
      setNewInvestigation("");
    }
  };

  // Delete investigation
  const deleteInvestigation = (index) => {
    setInvestigations(investigations.filter((_, i) => i !== index));
  };

  // Update vital sign
  const updateVital = (field, value) => {
    setVitals({ ...vitals, [field]: value });
  };

  // Save vitals edit
  const saveVitals = () => {
    setIsEditingVitals(false);
  };

  // Cancel vitals edit
  const cancelVitalsEdit = () => {
    setIsEditingVitals(false);
  };

  // Handle complaint change
  const handleComplaintChange = (value) => {
    setComplaint(value);
    if (complaintError && value.trim()) {
      setComplaintError("");
    }
  };

  // End Consultation handler with validation
  const handleEndConsultation = () => {
    const isComplaintValid = validateComplaint();
    const isMedicationsValid = validateAllMedications();
    
    if (isComplaintValid && isMedicationsValid) {
      alert("Consultation ended successfully!");
      // Add your submission logic here
    } else {
      let errorMessage = "Please fix the following issues:\n";
      if (!isComplaintValid) errorMessage += "- Complaint is required\n";
      if (!isMedicationsValid) errorMessage += "- Please fill in all required medication fields (marked with *)\n";
      alert(errorMessage);
    }
  };

  return (
    <>
      <style>
        {`
          /* Hide scrollbars globally for this component */
          .consultation-container,
          .consultation-container * {
            -ms-overflow-style: none !important;
            scrollbar-width: none !important;
          }
          
          .consultation-container::-webkit-scrollbar,
          .consultation-container *::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
          }
          
          /* Allow scrolling on specific elements but hide scrollbar */
          .scrollable-content {
            overflow-y: auto;
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          
          .scrollable-content::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>
      
      <div className="consultation-container p-4 bg-gray-50 min-h-screen font-sans">
        <div className="max-w-6xl mx-auto">
          {/* HEADER */}
          <div className="mb-4">
            <h1 className="text-xl font-semibold text-gray-800">Consultation</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Home / Appointments / Consultation
            </p>
          </div>

          {/* BASIC INFO CARD - COMPACT SIZE */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-4 overflow-hidden">
            <div className="px-4 py-2 border-b border-gray-100 bg-white flex justify-between items-center">
              <h3 className="text-sm font-medium text-gray-800">Basic Information</h3>
              <button 
                onClick={() => setShowMedicalHistory(true)}
                className="text-[#1C62A0] text-xs cursor-pointer hover:underline"
              >
                View Medical History →
              </button>
            </div>

            <div className="p-4 flex flex-wrap justify-between items-center gap-3">
              <div className="flex items-center gap-3">
                <img
                  src="https://randomuser.me/api/portraits/men/32.jpg"
                  className="w-10 h-10 rounded-lg object-cover"
                  alt="patient"
                />
                <div>
                  <span className="text-[10px] bg-blue-50 text-[#1C62A0] px-2 py-0.5 rounded-full font-medium">
                    Out Patient
                  </span>
                  <p className="font-semibold text-gray-800 text-sm mt-1">Reyan Verol</p>
                  <p className="text-xs text-gray-500">
                    Consultation ID : #C243546
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-xs bg-gray-50 px-3 py-2 rounded-lg">
                <div>
                  <p className="text-gray-500 text-[10px]">Age / Gender</p>
                  <p className="font-medium text-gray-800 text-xs">28 Years / Male</p>
                </div>
                <div>
                  <p className="text-gray-500 text-[10px]">Department</p>
                  <p className="font-medium text-gray-800 text-xs">Cardiology</p>
                </div>
                <div>
                  <p className="text-gray-500 text-[10px]">Date</p>
                  <p className="font-medium text-gray-800 text-xs">25 Jan 2025, 07:00 PM</p>
                </div>
              </div>
            </div>
          </div>

          {/* VITALS CARD - COMPACT SIZE */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-4 overflow-hidden">
            <div className="px-4 py-2 border-b border-gray-100 bg-white flex justify-between items-center">
              <h3 className="text-sm font-medium text-gray-800">Vital Signs</h3>
              <div className="flex gap-2">
                {!isEditingVitals ? (
                  <button
                    onClick={() => setIsEditingVitals(true)}
                    className="text-xs text-[#1C62A0] hover:text-[#1C62A0] font-medium"
                  >
                    ✎ Edit
                  </button>
                ) : (
                  <>
                    <button
                      onClick={cancelVitalsEdit}
                      className="text-xs text-[#1C62A0] hover:text-[#b6c9da] font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveVitals}
                      className="text-xs text-[#1C62A0] hover:text-[#5d9dd5] font-medium"
                    >
                      ✓ Save
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                <VitalInput
                  label="Temperature"
                  type="number"
                  unit="°F"
                  value={vitals.temperature}
                  onChange={(val) => updateVital("temperature", val)}
                  isEditing={isEditingVitals}
                />
                <VitalInput
                  label="Pulse"
                  type="number"
                  unit="bpm"
                  value={vitals.pulse}
                  onChange={(val) => updateVital("pulse", val)}
                  isEditing={isEditingVitals}
                />
                <VitalInput
                  label="Respiratory Rate"
                  type="number"
                  unit="rpm"
                  value={vitals.respiratoryRate}
                  onChange={(val) => updateVital("respiratoryRate", val)}
                  isEditing={isEditingVitals}
                />
                <VitalInput
                  label="SPO2"
                  type="number"
                  unit="%"
                  value={vitals.spo2}
                  onChange={(val) => updateVital("spo2", val)}
                  isEditing={isEditingVitals}
                />
                <VitalInput
                  label="Height"
                  type="number"
                  unit="cm"
                  value={vitals.height}
                  onChange={(val) => updateVital("height", val)}
                  isEditing={isEditingVitals}
                />
                <VitalInput
                  label="Weight"
                  type="number"
                  unit="kg"
                  value={vitals.weight}
                  onChange={(val) => updateVital("weight", val)}
                  isEditing={isEditingVitals}
                />
                <VitalInput
                  label="BMI"
                  type="number"
                  unit="kg/m²"
                  value={vitals.bmi}
                  onChange={(val) => updateVital("bmi", val)}
                  isEditing={isEditingVitals}
                />
                <VitalInput
                  label="Waist"
                  type="number"
                  unit="cm"
                  value={vitals.waist}
                  onChange={(val) => updateVital("waist", val)}
                  isEditing={isEditingVitals}
                />
                <VitalInput
                  label="BSA"
                  type="number"
                  unit="m²"
                  value={vitals.bsa}
                  onChange={(val) => updateVital("bsa", val)}
                  isEditing={isEditingVitals}
                />
              </div>
            </div>
          </div>

          {/* COMPLAINT CARD WITH VALIDATION */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-4 overflow-hidden">
            <div className="px-4 py-2 border-b border-gray-100 bg-white">
              <h3 className="text-sm font-medium text-gray-800">Complaint <span className="text-red-500">*</span></h3>
            </div>
            <div className="p-4">
              <input
                className={`w-full px-3 py-1.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent text-sm ${complaintError ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                placeholder="Enter value separated by comma"
                value={complaint}
                onChange={(e) => handleComplaintChange(e.target.value)}
              />
              <p className="text-[10px] text-gray-400 mt-1">Example: Fever, Headache, Cough</p>
              {complaintError && (
                <p className="text-red-500 text-[10px] mt-1">{complaintError}</p>
              )}
            </div>
          </div>

          {/* MEDICATIONS CARD WITH VALIDATION */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-4 overflow-hidden">
            <div className="px-4 py-2 border-b border-gray-100 bg-white">
              <h3 className="text-sm font-medium text-gray-800">Medications</h3>
            </div>
            <div className="p-4 overflow-x-auto scrollable-content">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-1.5 px-1 font-medium text-gray-600 text-xs">Medicine Name <span className="text-red-500">*</span></th>
                    <th className="text-left py-1.5 px-1 font-medium text-gray-600 text-xs">Dosage <span className="text-red-500">*</span></th>
                    <th className="text-left py-1.5 px-1 font-medium text-gray-600 text-xs">Duration <span className="text-red-500">*</span></th>
                    <th className="text-left py-1.5 px-1 font-medium text-gray-600 text-xs">Frequency <span className="text-red-500">*</span></th>
                    <th className="text-left py-1.5 px-1 font-medium text-gray-600 text-xs">Timing <span className="text-red-500">*</span></th>
                    <th className="text-left py-1.5 px-1 font-medium text-gray-600 text-xs">Instructions</th>
                    <th className="text-center py-1.5 px-1 font-medium text-gray-600 text-xs">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {medications.map((med) => (
                    <React.Fragment key={med.id}>
                      <tr className="border-b border-gray-100">
                        <td className="py-1.5 px-1">
                          <input 
                            className={`w-full px-1.5 py-1 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-[#1C62A0] ${medicationErrors[med.id]?.name ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                            placeholder="Medicine name" 
                            value={med.name} 
                            onChange={(e) => updateMedication(med.id, "name", e.target.value)} 
                          />
                          {medicationErrors[med.id]?.name && (
                            <p className="text-red-500 text-[10px] mt-0.5">{medicationErrors[med.id].name}</p>
                          )}
                        </td>
                        <td className="py-1.5 px-1">
                          <div className="flex">
                            <input 
                              className={`w-16 px-1.5 py-1 text-xs border rounded-l focus:outline-none focus:ring-2 focus:ring-[#1C62A0] ${medicationErrors[med.id]?.dosage ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                              placeholder="Dosage" 
                              value={med.dosage} 
                              onChange={(e) => updateMedication(med.id, "dosage", e.target.value)} 
                            />
                            <span className="px-1.5 py-1 text-xs bg-gray-50 border border-l-0 border-gray-300 rounded-r text-gray-500">mg</span>
                          </div>
                          {medicationErrors[med.id]?.dosage && (
                            <p className="text-red-500 text-[10px] mt-0.5">{medicationErrors[med.id].dosage}</p>
                          )}
                        </td>
                        <td className="py-1.5 px-1">
                          <div className="flex">
                            <input 
                              className={`w-16 px-1.5 py-1 text-xs border rounded-l focus:outline-none focus:ring-2 focus:ring-[#1C62A0] ${medicationErrors[med.id]?.duration ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                              placeholder="Duration" 
                              value={med.duration} 
                              onChange={(e) => updateMedication(med.id, "duration", e.target.value)} 
                            />
                            <span className="px-1.5 py-1 text-xs bg-gray-50 border border-l-0 border-gray-300 rounded-r text-gray-500">days</span>
                          </div>
                          {medicationErrors[med.id]?.duration && (
                            <p className="text-red-500 text-[10px] mt-0.5">{medicationErrors[med.id].duration}</p>
                          )}
                        </td>
                        <td className="py-1.5 px-1">
                          <select 
                            className={`w-full px-1.5 py-1 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-[#1C62A0] bg-white ${medicationErrors[med.id]?.frequency ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                            value={med.frequency} 
                            onChange={(e) => updateMedication(med.id, "frequency", e.target.value)}
                          >
                            <option value="">Select frequency</option>
                            <option value="Once daily">Once daily</option>
                            <option value="Twice daily">Twice daily</option>
                            <option value="Three times daily">Three times daily</option>
                            <option value="Four times daily">Four times daily</option>
                            <option value="Every 4 hours">Every 4 hours</option>
                            <option value="Every 6 hours">Every 6 hours</option>
                            <option value="Every 8 hours">Every 8 hours</option>
                          </select>
                          {medicationErrors[med.id]?.frequency && (
                            <p className="text-red-500 text-[10px] mt-0.5">{medicationErrors[med.id].frequency}</p>
                          )}
                        </td>
                        <td className="py-1.5 px-1">
                          <select 
                            className={`w-full px-1.5 py-1 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-[#1C62A0] bg-white ${medicationErrors[med.id]?.timing ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                            value={med.timing} 
                            onChange={(e) => updateMedication(med.id, "timing", e.target.value)}
                          >
                            <option value="">Select timing</option>
                            <option value="Before meals">Before meals</option>
                            <option value="After meals">After meals</option>
                            <option value="With meals">With meals</option>
                            <option value="At bedtime">At bedtime</option>
                            <option value="Morning">Morning</option>
                            <option value="Evening">Evening</option>
                          </select>
                          {medicationErrors[med.id]?.timing && (
                            <p className="text-red-500 text-[10px] mt-0.5">{medicationErrors[med.id].timing}</p>
                          )}
                        </td>
                        <td className="py-1.5 px-1">
                          <input 
                            className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#1C62A0]" 
                            placeholder="Instructions" 
                            value={med.instructions} 
                            onChange={(e) => updateMedication(med.id, "instructions", e.target.value)} 
                          />
                        </td>
                        <td className="py-1.5 px-1 text-center">
                          <button onClick={() => deleteMedicationRow(med.id)} className="text-[#1C62A0] hover:text-[#5281ab] p-1 rounded transition-colors" title="Delete medication">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>

              <button onClick={addMedicationRow} className="text-[#1C62A0] text-xs mt-3 hover:text-[#202f3b] flex items-center gap-1">
                + Add New Medication
              </button>
            </div>
          </div>

          {/* INVESTIGATIONS CARD - NO DEFAULT BLOOD TEST */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-4 overflow-hidden">
            <div className="px-4 py-2 border-b border-gray-100 bg-white">
              <h3 className="text-sm font-medium text-gray-800">Investigations & Procedure</h3>
            </div>
            <div className="p-4">
              <div className="flex gap-2 mb-3">
                <input 
                  className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C62A0] text-sm" 
                  placeholder="Enter investigation or procedure"
                  value={newInvestigation}
                  onChange={(e) => setNewInvestigation(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addInvestigation()}
                />
                <button 
                  onClick={addInvestigation}
                  className="px-3 py-1.5 text-[#1C62A0] hover:text-[#6da0ca] rounded-lg transition-colors text-sm font-medium"
                >
                  + Add
                </button>
              </div>

              {investigations.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-medium text-gray-500">Added Items:</p>
                  <div className="flex flex-wrap gap-2">
                    {investigations.map((item, index) => (
                      <div key={index} className="flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1">
                        <span className="text-sm text-gray-700">{item}</span>
                        <button
                          onClick={() => deleteInvestigation(index)}
                          className="text-gray-400 hover:text-[#1C62A0] transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ADVICE CARD */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-4 overflow-hidden">
            <div className="px-4 py-2 border-b border-gray-100 bg-white">
              <h3 className="text-sm font-medium text-gray-800">Advice</h3>
            </div>
            <div className="p-4">
              <textarea className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C62A0] text-sm" rows={2} placeholder="Write advice for the patient..." />
            </div>
          </div>

          {/* FOLLOW UP CARD */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-4 overflow-hidden">
            <div className="px-4 py-2 border-b border-gray-100 bg-white">
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
                <button className="px-4 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-[#b6c9da] transition-colors text-xs font-medium">Cancel</button>
                <button 
                  onClick={handleEndConsultation}
                  className="px-4 py-1.5 bg-[#1C62A0] hover:bg-[#5685ab] text-white rounded-lg transition-colors text-xs font-medium"
                >
                  End Consultation
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Medical History Modal */}
        <ViewMedicalHistory 
          isOpen={showMedicalHistory} 
          onClose={() => setShowMedicalHistory(false)} 
        />
      </div>
    </>
  );
};

// Vital Input Component - COMPACT SIZE
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

export default Consultation;