// src/components/Appointments/AddAppointmentModal.jsx
import React, { useState, useEffect } from "react";
import { X, Calendar, Clock, DollarSign, FileText, User, Stethoscope } from "lucide-react";
import { Modal, Input, Select, Textarea, Button, Avatar, Badge } from "../ui";
import { 
  showAddToast, 
  showUpdateToast, 
  showWarningToast, 
  showErrorToast,
  showSuccessToast
} from "../ui/Toast";
import { useCreateBookingMutation } from "../../../app/service/request";
import { useAuth } from "../../context/AuthContext";
import { useGetDoctorsQuery } from "../../../app/service/doctorApi";

// ✅ Import socket
import { socket } from '../../socket/socket';
// ✅ Import booking events (if you want to listen for events in this component)
import { registerBookingEvents, unregisterBookingEvents } from '../../socket/bookingEvents';

const AddAppointmentModal = ({ isOpen, onClose, patient, onSave, isEditing = false, appointment = null }) => {
  const { user } = useAuth();
  const [createBooking, { isLoading: isCreating }] = useCreateBookingMutation();
  
  // Form Data with speciality field
  const [formData, setFormData] = useState({
    patient_name: "",
    patient_dob: "",
    patient_place: "",
    patient_phone: "",
    doctorId: "",
    displayName: "",
    speciality: "",
    booking_date: "",
    consulting_time: "",
    reason: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Extract hospital ID correctly from user object
  const hospitalId = user?.hospital?.id || user?.hospitalId || user?.id;
  const hospitalName = user?.hospital?.name || user?.hospitalName || user?.name || '';
  const userId = user?.id || user?.userId;

  // Fetch doctors filtered by hospital and speciality
  const {
    data: doctorsResponse,
    isLoading: doctorsLoading,
  } = useGetDoctorsQuery({
    hospitalId: hospitalId,
    speciality: formData.speciality,
  }, {
    skip: !hospitalId || !formData.speciality,
  });

  // Get doctors list from response
  const doctorsList = doctorsResponse?.data || [];

  // ✅ Register booking event listeners when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log("🔄 Registering booking events in modal...");
      
      registerBookingEvents({
        onBookingRegistered: (data) => {
          console.log("📅 Booking Registered (modal):", data);
          // You can add specific logic here if needed
        },
        onBookingUpdated: (data) => {
          console.log("✏️ Booking Updated (modal):", data);
        },
        onBookingCancelled: (data) => {
          console.log("❌ Booking Cancelled (modal):", data);
        },
        onBookingAccepted: (data) => {
          console.log("✅ Booking Accepted (modal):", data);
        },
        onBookingCompleted: (data) => {
          console.log("✔️ Booking Completed (modal):", data);
        }
      });
    }

    return () => {
      if (isOpen) {
        console.log("🧹 Unregistering booking events from modal...");
        unregisterBookingEvents();
      }
    };
  }, [isOpen]);

  // Populate form when editing
  useEffect(() => {
    if (isEditing && appointment) {
      setFormData({
        patient_name: appointment.patient_name || appointment.patientName || "",
        patient_dob: appointment.patient_dob || appointment.dob || "",
        patient_place: appointment.patient_place || appointment.place || "",
        patient_phone: appointment.patient_phone || appointment.contact || "",
        doctorId: appointment.doctorId || "",
        displayName: appointment.displayName || appointment.doctorName || "",
        speciality: appointment.speciality || appointment.department || "",
        booking_date: appointment.booking_date || appointment.appointmentDate || "",
        consulting_time: appointment.consulting_time || appointment.time || "",
        reason: appointment.reason || ""
      });
    }
  }, [isEditing, appointment]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.patient_name.trim()) {
      showWarningToast('Please enter patient name', 3000);
      return false;
    }
    if (!formData.patient_dob) {
      showWarningToast('Please enter patient date of birth', 3000);
      return false;
    }
    // Validate realistic DOB (not in future)
    const dobDate = new Date(formData.patient_dob);
    const today = new Date();
    if (dobDate > today) {
      showWarningToast('Date of birth cannot be in the future', 3000);
      return false;
    }
    if (!formData.patient_phone.trim()) {
      showWarningToast('Please enter patient phone number', 3000);
      return false;
    }
    if (!formData.doctorId) {
      showWarningToast('Please select a doctor', 3000);
      return false;
    }
    if (!formData.speciality) {
      showWarningToast('Please select speciality', 3000);
      return false;
    }
    if (!formData.booking_date) {
      showWarningToast('Please select appointment date', 3000);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);

    try {
      // EXACT PAYLOAD MATCHING BACKEND EXPECTATIONS
      const appointmentData = {
        userId: Number(userId),
        hospitalId: Number(hospitalId),
        hospitalName: hospitalName, // ✅ Added hospitalName
        patient_dob: formData.patient_dob,
        patient_name: formData.patient_name,
        patient_place: formData.patient_place,
        patient_phone: formData.patient_phone,
        doctorId: Number(formData.doctorId),
        booking_date: formData.booking_date,
        consulting_time: formData.consulting_time,
        department: formData.speciality,
        displayName: formData.displayName,
      };

      console.log("📤 Creating booking with payload:", appointmentData);

      const response = await createBooking(appointmentData).unwrap();

      // ✅ Emit socket event for new booking
      if (socket && socket.connected) {
        socket.emit('BOOKING_REGISTERED', {
          bookingId: response?.data?.id || response?.data?._id,
          patientName: formData.patient_name,
          doctorName: formData.displayName,
          hospitalId: hospitalId,
          hospitalName: hospitalName,
          booking_date: formData.booking_date,
          consulting_time: formData.consulting_time,
        });
        console.log("📤 Emitted BOOKING_REGISTERED event");
      }

      if (onSave) {
        onSave(response.data);
      }

      showAddToast(
        `New appointment scheduled for ${formData.patient_name}!`,
        4000,
        {
          'Patient': formData.patient_name,
          'Date': new Date(formData.booking_date).toLocaleDateString(),
          'Doctor': formData.displayName,
          'Department': formData.speciality,
          'Hospital': hospitalName
        }
      );
      
      resetForm();
      onClose();
      
    } catch (error) {
      console.error('❌ Error creating booking:', error);
      console.error('Error response:', error?.data);
      showErrorToast(error?.data?.message || 'Failed to create appointment. Please try again.', 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      patient_name: "",
      patient_dob: "",
      patient_place: "",
      patient_phone: "",
      doctorId: "",
      displayName: "",
      speciality: "",
      booking_date: "",
      consulting_time: "",
      reason: ""
    });
  };

  // Speciality options
  const specialities = [
    "Cardiology",
    "Neurology",
    "Orthopedics",
    "Pediatrics",
    "Dermatology",
    "ENT",
    "Ophthalmology",
    "General Medicine",
    "Surgery",
    "Pulmonology"
  ];

  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00"
  ];

  const today = new Date().toISOString().split('T')[0];

  // Doctor select handler with fallbacks
  const handleDoctorSelect = (e) => {
    const selectedId = e.target.value;
    const selectedDoctor = doctorsList.find(
      (doc) => String(doc._id || doc.id) === selectedId
    );
    if (selectedDoctor) {
      setFormData(prev => ({
        ...prev,
        doctorId: selectedDoctor._id || selectedDoctor.id,
        displayName: selectedDoctor.displayName || selectedDoctor.name,
        speciality: selectedDoctor.speciality || selectedDoctor.department || "",
      }));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? "Edit Appointment" : "Schedule New Appointment"} size="xl" showCloseButton={false}>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Patient Name */}
          <Input
            label="Patient Name"
            name="patient_name"
            type="text"
            value={formData.patient_name}
            onChange={handleChange}
            placeholder="Enter patient name"
            required
            icon={User}
          />

          {/* Patient Date of Birth */}
          <Input
            label="Date of Birth"
            name="patient_dob"
            type="date"
            max={today}
            value={formData.patient_dob}
            onChange={handleChange}
            required
            icon={Calendar}
          />

          {/* Patient Place */}
          <Input
            label="Patient Place"
            name="patient_place"
            type="text"
            value={formData.patient_place}
            onChange={handleChange}
            placeholder="Enter patient address/place"
            icon={User}
          />

          {/* Patient Phone */}
          <Input
            label="Phone Number"
            name="patient_phone"
            type="tel"
            value={formData.patient_phone}
            onChange={handleChange}
            placeholder="Enter phone number"
            required
          />

          {/* Speciality Select */}
          <Select
            label="Speciality"
            name="speciality"
            options={specialities}
            value={formData.speciality}
            onChange={handleChange}
            placeholder="Select Speciality"
            required
          />

          {/* Doctor Dropdown */}
          <Select
            label="Doctor"
            name="doctorId"
            options={doctorsList.map((doc) => ({
              value: doc._id || doc.id,
              label: `${doc.displayName || doc.name} (${
                doc.speciality || doc.department || "General"
              })`,
            }))}
            value={formData.doctorId}
            onChange={handleDoctorSelect}
            placeholder={
              !formData.speciality
                ? "Select speciality first"
                : doctorsLoading
                ? "Loading doctors..."
                : doctorsList.length === 0
                ? "No doctors found"
                : "Select Doctor"
            }
            required
            disabled={!formData.speciality || doctorsLoading}
          />

          {/* Appointment Date */}
          <Input
            label="Appointment Date"
            name="booking_date"
            type="date"
            min={today}
            value={formData.booking_date}
            onChange={handleChange}
            required
            icon={Calendar}
          />

          {/* Consulting Time */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Consulting Time <span className="text-red-500">*</span>
            </label>
            <select
              name="consulting_time"
              value={formData.consulting_time}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Time</option>
              {timeSlots.map((consulting_time) => (
                <option key={consulting_time} value={consulting_time}>
                  {consulting_time}
                </option>
              ))}
            </select>
          </div>

          {/* Reason - UI only, not sent to backend */}
          <div className="md:col-span-2">
            <Textarea
              label="Reason for Visit (Optional)"
              name="reason"
              rows={3}
              value={formData.reason}
              onChange={handleChange}
              placeholder="Enter reason for appointment (for your reference only)"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={onClose} type="button" disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting} loading={isSubmitting}>
            {isSubmitting ? (isEditing ? 'Updating...' : 'Scheduling...') : (isEditing ? 'Update Appointment' : 'Schedule Appointment')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddAppointmentModal;