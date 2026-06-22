// src/components/patients/AddAppointmentModal.jsx - Updated with gender from patient data
import React, { useState } from "react";
import { Calendar, FileText } from "lucide-react";
import { Modal, Textarea, Button, Avatar, Badge, Loader } from "../ui";
import { showWarningToast } from "../ui/Toast";
import { useGetDoctorsQuery } from "../../../app/service/doctorApi";

const AddAppointmentModal = ({ isOpen, onClose, patient, onProceedApprove }) => {
  const [formData, setFormData] = useState({
    date: "",
    quickNotes: "",
    selectDoctor: null,
    doctorId: null,
    doctorDepartment: null,
    doctorDisplayName: null
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch doctors using RTK Query
  const { 
    data: doctorsResponse, 
    isLoading: isLoadingDoctors,
    isFetching: isFetchingDoctors
  } = useGetDoctorsQuery({}, { skip: !isOpen });

  // Transform doctors data
  const doctorsList = React.useMemo(() => {
    if (!doctorsResponse?.data) return [];
    
    return doctorsResponse.data.map(doc => ({
      id: doc.id,
      name: doc.displayName || `${doc.firstName || ''} ${doc.lastName || ''}`.trim() || doc.name,
      department: doc.specialist || doc.specialty || doc.department || 'General',
      displayName: doc.displayName || doc.name
    }));
  }, [doctorsResponse]);

  if (!isOpen) return null;

  const validateForm = () => {
    if (!formData.selectDoctor) {
      showWarningToast('Please select doctor', 3000);
      return false;
    }
    if (!formData.date) {
      showWarningToast('Please select appointment date', 3000);
      return false;
    }
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    // Call the callback prop with booking data - gender comes from patient data
    if (onProceedApprove) {
      onProceedApprove({
  userId:
    patient?.userId,
            patient_dob: patient?.dob,
        patient_name: patient?.name,
        patient_place: patient?.location?.place || patient?.address,
        patient_phone: patient?.mobileNumber,
        patient_gender: patient?.gender, // Gender directly from patient data
        hospitalId: patient?.hospitalId,
        doctorId: formData.doctorId,
        booking_date: formData.date,
        department: formData.doctorDepartment,
        displayName: formData.doctorDisplayName,
        notes: formData.quickNotes
      });
    }
    
    setIsSubmitting(false);
    onClose();
  };

  const handleDoctorSelect = (e) => {
    const doctorId = e.target.value;
    const selectedDoctor = doctorsList.find(doc => doc.id == doctorId);
    setFormData({
      ...formData,
      selectDoctor: selectedDoctor?.name || "",
      doctorId: selectedDoctor?.id,
      doctorDepartment: selectedDoctor?.department,
      doctorDisplayName: selectedDoctor?.displayName
    });
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Schedule Appointment" size="md" showCloseButton={false}>
      {/* Patient Info Summary */}
      <div className="px-6 py-4 bg-blue-50 border-b border-blue-100 -mt-4 -mx-6 mb-4">
        <div className="flex items-center gap-4">
          <Avatar src={patient?.imageUrl || "https://randomuser.me/api/portraits/men/32.jpg"} alt={patient?.name} size="md" rounded="full" />
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-xs font-mono bg-white">#{patient?.id || "PT0025"}</Badge>
              <Badge variant="success" className="text-xs">Last Visit: {patient?.lastVisitDisplay || "N/A"}</Badge>
            </div>
            <h3 className="font-semibold text-gray-900">{patient?.name || "Patient Name"}</h3>
            <p className="text-xs text-gray-600">{patient?.gender || "N/A"} • {patient?.age || "N/A"} years</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-5">
          {/* Doctor Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Doctor <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.doctorId || ""}
              onChange={handleDoctorSelect}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              disabled={isLoadingDoctors || isFetchingDoctors}
            >
              <option value="">
                {isLoadingDoctors || isFetchingDoctors ? "Loading doctors..." : "Select Doctor"}
              </option>
              {doctorsList.map(doctor => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name} - {doctor.department}
                </option>
              ))}
            </select>
            {(isLoadingDoctors || isFetchingDoctors) && (
              <div className="mt-2 flex items-center gap-2">
                <Loader size="small" />
                <span className="text-xs text-gray-500">Loading doctors...</span>
              </div>
            )}
          </div>
          
          {/* Appointment Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Appointment Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="date" 
                required 
                min={today} 
                value={formData.date} 
                onChange={(e) => setFormData({...formData, date: e.target.value})} 
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
              />
            </div>
          </div>
          
          {/* Quick Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quick Notes (Optional)</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
              <textarea 
                rows="3" 
                value={formData.quickNotes} 
                onChange={(e) => setFormData({...formData, quickNotes: e.target.value})} 
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                placeholder="Additional information about the appointment..." 
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={isSubmitting} loading={isSubmitting}>
            {isSubmitting ? 'Processing...' : 'Proceed to Approve'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddAppointmentModal;