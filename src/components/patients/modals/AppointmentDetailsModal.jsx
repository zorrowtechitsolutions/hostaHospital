// src/components/patients/modals/AppointmentDetailsModal.jsx
import React, { useState, useEffect } from "react";
import { 
  X, Calendar, User, Stethoscope, FileText, 
  MessageSquare, UserCircle, Briefcase, Mail,
  AlertCircle, ChevronRight
} from "lucide-react";

const AppointmentDetailsModal = ({ data, onClose, patientId, doctorData }) => {
  const [enrichedData, setEnrichedData] = useState(data);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!data) return null;

  // Fetch additional patient details if needed
  useEffect(() => {
    const fetchAppointmentDetails = async () => {
      // If we have doctorData passed directly, use it
      if (doctorData) {
        setEnrichedData({
          ...data,
          doctorName: doctorData.name || doctorData.doctorName || data.doctorName,
          department: doctorData.department || data.department,
          doctorEmail: doctorData.email,
          doctorPhone: doctorData.phone,
          doctorSpecialty: doctorData.specialty,
        });
        return;
      }

      // If we have patientId, fetch details
      if (patientId && !data.doctorName) {
        setLoading(true);
        try {
          const response = await fetch(`/api/patients/${patientId}/appointments/latest`);
          if (response.ok) {
            const appointmentData = await response.json();
            setEnrichedData({
              ...data,
              doctorName: appointmentData.doctorName || data.doctorName,
              department: appointmentData.department || data.department,
              doctorEmail: appointmentData.doctorEmail || data.doctorEmail,
              doctorPhone: appointmentData.doctorPhone || data.doctorPhone,
              reason: appointmentData.reason || data.reason,
              notes: appointmentData.notes || appointmentData.doctorNotes || data.notes,
              appointmentId: appointmentData.appointmentId || data.appointmentId,
            });
          }
        } catch (err) {
          console.error("Error fetching appointment details:", err);
          setError("Could not load complete details");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchAppointmentDetails();
  }, [data, patientId, doctorData]);

  // Format date helper - only date, no time
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    const statusMap = {
      'completed': 'bg-green-100 text-green-800 border-green-200',
      'confirmed': 'bg-blue-100 text-blue-800 border-blue-200',
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'cancelled': 'bg-red-100 text-red-800 border-red-200',
      'scheduled': 'bg-purple-100 text-purple-800 border-purple-200',
      'in-progress': 'bg-indigo-100 text-indigo-800 border-indigo-200'
    };
    return statusMap[status?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const displayData = enrichedData || data;

  // Debug log to see what data we have
  console.log("Appointment Data:", displayData);
  console.log("Department:", displayData.department);
  console.log("Doctor Name:", displayData.doctorName);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1C62A0] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading appointment details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1C62A0] text-white flex items-center justify-center shadow-md">
              <Stethoscope size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Appointment Details
              </h2>
              <p className="text-xs text-gray-500">Complete consultation information</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#1C62A0] text-white flex items-center justify-center hover:bg-[#154f7a] transition-colors shadow-md"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Patient Profile & Status Row */}
          <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#1C62A0] to-[#4A90D9] flex items-center justify-center text-white font-semibold text-xl shadow-md">
                {displayData.patientName?.charAt(0).toUpperCase() || "P"}
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-lg">
                  {displayData.patientName || "Patient Name"}
                </p>
                {displayData.patientEmail && (
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Mail size={12} />
                    {displayData.patientEmail}
                  </p>
                )}
              </div>
            </div>
            <div className={`px-3 py-1.5 rounded-full border text-sm font-medium ${getStatusBadge(displayData.status)}`}>
              {displayData.status || "Scheduled"}
            </div>
          </div>

          {/* Appointment Details - Only Date, No Time */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="flex items-start gap-6">
              {/* Date */}
              <div className="flex-1">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Calendar size={16} className="text-[#1C62A0]" />
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Date</p>
                </div>
                <p className="font-semibold text-gray-800">
                  {formatDate(displayData.appointmentDate)}
                </p>
                <p className="text-xs text-gray-400">Appointment scheduled</p>
              </div>

              {/* Appointment ID */}
              <div className="flex-1">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <FileText size={16} className="text-[#1C62A0]" />
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Appointment ID</p>
                </div>
                <p className="font-semibold text-gray-800">
                  {displayData.appointmentId || displayData.id || "N/A"}
                </p>
                <p className="text-xs text-gray-400">Reference number</p>
              </div>
            </div>
          </div>

          {/* Consultation With - Doctor Details */}
          <div className="bg-gradient-to-r from-blue-50 to-white border border-blue-200 rounded-xl p-4">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <UserCircle size={18} className="text-[#1C62A0]" />
              Consultation With
            </h4>
            
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
            <div className="flex items-center gap-3 border-t border-blue-100 pt-2 mt-2">
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
          </div>


        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-wrap items-center justify-between gap-3">
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetailsModal;