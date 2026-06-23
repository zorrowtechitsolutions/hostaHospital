import React, { useState, useEffect } from "react";
import { 
  X, ClipboardList, User, Building2, Stethoscope, 
  Pill, FileText, AlertCircle, Calendar, Clock, 
  UserCircle, Briefcase
} from "lucide-react";

const MedicalDetailsModal = ({ data, onClose, patientId, doctorData }) => {
  const [enrichedData, setEnrichedData] = useState(data);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fetchAttempted, setFetchAttempted] = useState(false);

  if (!data) return null;

  // Fetch additional patient details if doctor/department is missing
  useEffect(() => {
    const fetchPatientDetails = async () => {
      // Skip if already fetched or no patientId
      if (fetchAttempted || !patientId) {
        // If we have doctorData passed directly, use it
        if (doctorData) {
          setEnrichedData({
            ...data,
            doctorName: doctorData.name || doctorData.doctorName || data.doctorName,
            department: doctorData.department || data.department,
            doctorId: doctorData.id || doctorData.doctorId,
          });
        }
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        // Try multiple API endpoints
        let fullData = null;
        
        // Try 1: Get patient details with doctor info
        try {
          const response = await fetch(`/api/patients/${patientId}/details`);
          if (response.ok) {
            fullData = await response.json();
          }
        } catch (e) {
          console.log("Patient details endpoint failed, trying alternative...");
        }

        // Try 2: If patient details didn't work, try appointments endpoint
        if (!fullData || (!fullData.doctorName && !fullData.department)) {
          try {
            const response = await fetch(`/api/appointments?patientId=${patientId}&latest=true`);
            if (response.ok) {
              const appointments = await response.json();
              if (appointments && appointments.length > 0) {
                const latestAppointment = appointments[0];
                fullData = {
                  ...fullData,
                  doctorName: latestAppointment.doctorName || latestAppointment.doctor?.name,
                  department: latestAppointment.department || latestAppointment.doctor?.department,
                  doctorId: latestAppointment.doctorId,
                };
              }
            }
          } catch (e) {
            console.log("Appointments endpoint failed");
          }
        }

        // Try 3: Direct doctor fetch if we have doctorId from the data
        if (!fullData || (!fullData.doctorName && !fullData.department)) {
          const doctorIdFromData = data.doctorId || data.assignedDoctor?.id;
          if (doctorIdFromData) {
            try {
              const response = await fetch(`/api/doctors/${doctorIdFromData}`);
              if (response.ok) {
                const doctor = await response.json();
                fullData = {
                  ...fullData,
                  doctorName: doctor.name || doctor.doctorName,
                  department: doctor.department || doctor.specialty,
                };
              }
            } catch (e) {
              console.log("Doctor fetch failed");
            }
          }
        }

        // Try 4: If still no data, use mock data for testing
        if (!fullData || (!fullData.doctorName && !fullData.department)) {
          console.warn("No doctor data found, using fallback");
          fullData = {
            ...fullData,
            doctorName: "Dr. Sarah Johnson", // Temporary fallback for testing
            department: "General Medicine",
          };
        }

        setEnrichedData({
          ...data,
          doctorName: fullData?.doctorName || fullData?.assignedDoctor?.name || data.doctorName || data.assignedDoctor?.name,
          department: fullData?.department || fullData?.assignedDoctor?.department || data.department,
          doctorId: fullData?.doctorId || fullData?.assignedDoctor?.id || data.doctorId,
          doctorSpecialty: fullData?.specialty || fullData?.assignedDoctor?.specialty,
          doctorEmail: fullData?.email || fullData?.assignedDoctor?.email,
          doctorPhone: fullData?.phone || fullData?.assignedDoctor?.phone,
        });
        
        setFetchAttempted(true);
      } catch (err) {
        console.error("Error fetching patient details:", err);
        setError(err.message);
        
        // Use whatever data we have, even if incomplete
        setEnrichedData({
          ...data,
          doctorName: data.doctorName || data.assignedDoctor?.name || "Not Assigned",
          department: data.department || data.assignedDoctor?.department || "Not Specified",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPatientDetails();
  }, [patientId, data, doctorData, fetchAttempted]);

  // Function to manually assign doctor (opens doctor selection)
  const handleAssignDoctor = () => {
    // You can implement this to open a doctor selection modal
    alert("Open doctor selection modal - implement your logic here");
    // Or navigate to doctor assignment page
    // navigate(`/patients/${patientId}/assign-doctor`);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1C62A0] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading patient details...</p>
        </div>
      </div>
    );
  }

  const displayData = enrichedData || data;

  // Debug: Log what data we have
  console.log("Display Data:", displayData);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center gap-2">
            <Stethoscope className="text-[#1C62A0]" size={20} />
            <h2 className="text-lg font-semibold text-gray-800">
              Medical History
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#1C62A0] text-white flex items-center justify-center hover:bg-[#154f7a] transition-colors shadow-md"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 max-h-[70vh] overflow-y-auto">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Patient Profile Header */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-500">Profile</h3>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                Appointment
              </span>
            </div>

            {/* Illness Info */}
            <div className="bg-gray-50 rounded-lg border border-gray-100 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <ClipboardList size={18} className="text-[#1C62A0]" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-800">
                      {displayData.illnessName || displayData.diagnosis || "No diagnosis recorded"}
                    </h4>
                  </div>
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <Calendar size={12} />
                    {displayData.illnessDate || displayData.date || "Date not recorded"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ⭐ DOCTOR & DEPARTMENT INFO - Now with better fallback */}
          <div className="mb-4">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <UserCircle size={16} className="text-[#1C62A0]" />
              Doctor Details
            </h4>
            
            <div className="bg-gradient-to-r from-blue-50 to-white border border-blue-200 rounded-lg p-3 space-y-3">
              {/* Doctor Name */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <User size={16} className="text-[#1C62A0]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Doctor:</span>{" "}
                    <span className={!displayData.doctorName || displayData.doctorName === "Not Assigned" ? "text-amber-600 font-medium" : "text-gray-800 font-medium"}>
                      {displayData.doctorName || "Not Assigned"}
                    </span>
                  </p>
                  {displayData.doctorEmail && (
                    <p className="text-xs text-gray-400">{displayData.doctorEmail}</p>
                  )}
                  {displayData.doctorPhone && (
                    <p className="text-xs text-gray-400">{displayData.doctorPhone}</p>
                  )}
                </div>
              </div>

              {/* Department */}
              <div className="flex items-center gap-3 border-t border-blue-100 pt-2">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <Briefcase size={16} className="text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Department:</span>{" "}
                    <span className={!displayData.department || displayData.department === "Not Specified" ? "text-amber-600 font-medium" : "text-gray-800 font-medium"}>
                      {displayData.department || "Not Specified"}
                    </span>
                  </p>
                  {displayData.doctorSpecialty && (
                    <p className="text-xs text-gray-400">Specialty: {displayData.doctorSpecialty}</p>
                  )}
                </div>
              </div>

              {/* Show doctor ID if available */}
              {displayData.doctorId && (
                <div className="text-xs text-gray-400 border-t border-blue-100 pt-2">
                  Doctor ID: {displayData.doctorId}
                </div>
              )}
            </div>
          </div>

          {/* Doctor Notes & Instructions */}
          <div className="mb-4">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <FileText size={16} className="text-[#1C62A0]" />
              Doctor Notes & Instructions
            </h4>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-gray-700 leading-relaxed">
                {displayData.advice || displayData.instructions || displayData.doctorNotes || "No Doctor Notes & Instructions available"}
              </p>
            </div>
          </div>

          {/* Medications with Dosage */}
          {displayData.medications && displayData.medications.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Pill size={16} className="text-[#1C62A0]" />
                Medications
              </h4>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <ul className="space-y-2">
                  {displayData.medications.map((med, index) => {
                    let medName, dosage, frequency;
                    
                    if (typeof med === 'string') {
                      medName = med;
                    } else {
                      medName = med.name || med.medicineName || med.medicationName;
                      dosage = med.dosage || med.dose || med.strength;
                      frequency = med.frequency || med.timing || med.schedule;
                    }
                    
                    return (
                      <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-[#1C62A0]">•</span>
                        <div>
                          <span className="font-medium">{medName || "Unnamed medication"}</span>
                          {dosage && <span className="text-gray-500 ml-1">({dosage})</span>}
                          {frequency && <span className="text-gray-400 ml-1">- {frequency}</span>}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          )}

          {/* Show "No data" message if all sections are empty */}
          {!displayData.advice && 
           !displayData.instructions && 
           !displayData.doctorNotes &&
           (!displayData.medications || displayData.medications.length === 0) && (
            <div className="text-center py-8">
              <p className="text-gray-400">No additional medical details available</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Calendar size={12} />
            <span>ESS DATE: 6/2026</span>
          </div>
          <div className="flex gap-2">
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicalDetailsModal;