// src/components/appointments/EditAppointmentModal.jsx

import React, { useState, useEffect } from 'react';
import { Modal, Button } from '../ui';
import { showSuccessToast, showErrorToast } from '../ui/Toast';
import { useUpdateBookingMutation } from '../../../app/service/request';
import { useGetDoctorsQuery } from '../../../app/service/doctorApi';
import { convertTo24Hour } from '../../utils/timeUtils';
import { format } from 'date-fns';

const EditAppointmentModal = ({ isOpen, onClose, appointment, onSave }) => {
  const [formData, setFormData] = useState({
    patient_name: '',
    patient_phone: '',
    doctorId: '',
    booking_date: '',
    consulting_time: '',
    token: '',
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [doctors, setDoctors] = useState([]);

  // Fetch doctors list
  const { data: doctorsData } = useGetDoctorsQuery({ limit: 1000 });
  const [updateBooking] = useUpdateBookingMutation();

  useEffect(() => {
    if (doctorsData?.data) {
      const doctorList = Array.isArray(doctorsData.data) 
        ? doctorsData.data 
        : doctorsData.data?.rows || [];
      setDoctors(doctorList);
    }
  }, [doctorsData]);

  // Populate form when appointment changes
  useEffect(() => {
    if (appointment) {
      const booking = appointment;
      
      // FIXED: More robust date parsing with multiple possible field names
      let formattedDate = '';
      const rawDate = 
        booking.booking_date ||
        booking.appointmentDate ||
        booking.appointment_date ||
        booking.date ||
        '';

      if (rawDate && rawDate !== 'N/A' && rawDate !== '') {
        try {
          // Handle YYYY-MM-DD directly
          if (/^\d{4}-\d{2}-\d{2}$/.test(String(rawDate))) {
            formattedDate = String(rawDate);
          } else {
            const dateObj = new Date(rawDate);
            if (!isNaN(dateObj.getTime())) {
              formattedDate = format(dateObj, 'yyyy-MM-dd');
            }
          }
        } catch (e) {
          console.warn('Date parsing error:', e);
        }
      }

      // Format time for input (HH:mm) - 24-hour format for time input
      let formattedTime = '';
      const rawTime = booking.consulting_time || booking.time || '';
      
      if (rawTime && rawTime !== 'N/A' && rawTime !== '') {
        if (rawTime.includes('AM') || rawTime.includes('PM')) {
          formattedTime = convertTo24Hour(rawTime);
        } else {
          formattedTime = rawTime;
        }
      }

      // Get doctor ID from various possible sources
      const doctorId = booking.doctorId || booking.doctor?.id || booking.doctor_id || '';

      // FIXED: More robust token extraction
      const existingToken = 
        booking.token ??
        booking.token_number ??
        booking.tokenNumber ??
        '';

      setFormData({
        patient_name: booking.patient_name || booking.patientName || '',
        patient_phone: booking.patient_phone || booking.contact || booking.patientPhone || '',
        doctorId: String(doctorId),
        booking_date: formattedDate,
        consulting_time: formattedTime,
        token: String(existingToken),
      });
    }
  }, [appointment]);

  // Validation functions
  const validatePatientName = (name) => {
    if (!name || name.trim() === '') return 'Patient name is required';
    if (name.length < 2) return 'Name must be at least 2 characters';
    return '';
  };

  const validatePhone = (phone) => {
    if (!phone || phone.trim() === '') return 'Phone number is required';
    const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{3,5}[-\s\.]?[0-9]{4,6}$/;
    if (!phoneRegex.test(phone)) return 'Please enter a valid phone number';
    return '';
  };

  const validateDoctor = (doctorId) => {
    if (!doctorId) return 'Please select a doctor';
    return '';
  };

  const validateDate = (date) => {
    if (!date) return 'Appointment date is required';
    return '';
  };

  const validateTime = (time) => {
    if (!time) return 'Consulting time is required';
    return '';
  };

  const validateField = (name, value) => {
    if (name === 'patient_name') return validatePatientName(value);
    if (name === 'patient_phone') return validatePhone(value);
    if (name === 'doctorId') return validateDoctor(value);
    if (name === 'booking_date') return validateDate(value);
    if (name === 'consulting_time') return validateTime(value);
    return '';
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, formData[name]);
    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    const patientNameError = validatePatientName(formData.patient_name);
    if (patientNameError) newErrors.patient_name = patientNameError;
    
    const phoneError = validatePhone(formData.patient_phone);
    if (phoneError) newErrors.patient_phone = phoneError;
    
    const doctorError = validateDoctor(formData.doctorId);
    if (doctorError) newErrors.doctorId = doctorError;
    
    const dateError = validateDate(formData.booking_date);
    if (dateError) newErrors.booking_date = dateError;
    
    const timeError = validateTime(formData.consulting_time);
    if (timeError) newErrors.consulting_time = timeError;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showErrorToast('Please fix the validation errors before submitting', 3000);
      return;
    }

    if (!appointment?.id) {
      showErrorToast('Appointment ID is missing', 3000);
      return;
    }

    setIsSubmitting(true);

    try {
      // Format time to 24-hour for API
      let consultingTime = formData.consulting_time;
      if (consultingTime.includes('AM') || consultingTime.includes('PM')) {
        consultingTime = convertTo24Hour(consultingTime);
      }

      const updateData = {
        patient_name: formData.patient_name,
        patient_phone: formData.patient_phone,
        doctorId: formData.doctorId,
        booking_date: formData.booking_date,
        consulting_time: consultingTime,
        token: formData.token, // Token is preserved on save
      };

      await updateBooking({
        id: appointment.id,
        data: updateData,
      }).unwrap();

      showSuccessToast('Appointment updated successfully!', 3000);
      
      if (onSave) {
        onSave(updateData);
      }
      onClose();
    } catch (error) {
      console.error('Update error:', error);
      showErrorToast(
        error?.data?.message || 'Failed to update appointment. Please try again.',
        3000
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedDoctor = doctors.find(d => String(d.id) === String(formData.doctorId));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Appointment" size="lg">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto px-2">
        {/* Patient Information */}
        <div className="border-b pb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Patient Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Patient Name *
              </label>
              <input
                type="text"
                name="patient_name"
                value={formData.patient_name}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Enter patient name"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent ${
                  errors.patient_name && touched.patient_name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.patient_name && touched.patient_name && (
                <p className="text-xs text-red-500 mt-1">{errors.patient_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                name="patient_phone"
                value={formData.patient_phone}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Enter phone number"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent ${
                  errors.patient_phone && touched.patient_phone ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.patient_phone && touched.patient_phone && (
                <p className="text-xs text-red-500 mt-1">{errors.patient_phone}</p>
              )}
            </div>
          </div>
        </div>

        {/* Appointment Details */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Appointment Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Doctor *
              </label>
              <select
                name="doctorId"
                value={formData.doctorId}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent bg-white ${
                  errors.doctorId && touched.doctorId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select a doctor</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={String(doctor.id)}>
                    {doctor.displayName || doctor.name}
                    {doctor.department && ` - ${doctor.department}`}
                  </option>
                ))}
              </select>
              {errors.doctorId && touched.doctorId && (
                <p className="text-xs text-red-500 mt-1">{errors.doctorId}</p>
              )}
              {selectedDoctor && (
                <p className="text-xs text-gray-400 mt-1">
                  Department: {selectedDoctor.department || 'N/A'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Appointment Date *
              </label>
              <input
                type="date"
                name="booking_date"
                value={formData.booking_date}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent ${
                  errors.booking_date && touched.booking_date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.booking_date && touched.booking_date && (
                <p className="text-xs text-red-500 mt-1">{errors.booking_date}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Consulting Time *
              </label>
              <input
                type="time"
                name="consulting_time"
                value={formData.consulting_time}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent ${
                  errors.consulting_time && touched.consulting_time ? 'border-red-500' : 'border-gray-300'
                }`}
                step="60"
              />
              {errors.consulting_time && touched.consulting_time && (
                <p className="text-xs text-red-500 mt-1">{errors.consulting_time}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Token Number
              </label>
              <input
                type="text"
                name="token"
                value={formData.token}
                onChange={handleChange}
                placeholder="Enter token number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
        <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSubmit} 
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </Modal>
  );
};

export default EditAppointmentModal;