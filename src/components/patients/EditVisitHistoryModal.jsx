// src/components/visits/EditVisitModal.jsx - With toast notifications
import React, { useState, useEffect } from "react";
import { Modal, Input, Select, Button } from "../ui";
import { showUpdateToast, showWarningToast } from "../ui/Toast";

const EditVisitModal = ({ 
  isOpen, 
  onClose, 
  visitData, 
  onSave,
  patients = [],
  departments = [],
  doctors = [],
  patientTypes = ["Out Patient", "In Patient"],
  paymentMethods = ["Cash", "Card", "Insurance", "Online Transfer", "Check"]
}) => {
  const [formData, setFormData] = useState({
    patient: "",
    patientType: "Out Patient",
    department: "",
    doctor: "",
    date: "",
    time: "",
    reason: "",
    payment: "Cash"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (visitData) {
      setFormData({
        patient: visitData.patientName || visitData.patient || "",
        patientType: visitData.patientType || "Out Patient",
        department: visitData.department || "",
        doctor: visitData.doctorName || visitData.doctor || "",
        date: visitData.visitDate || visitData.date || "",
        time: visitData.startTime || visitData.time || "",
        reason: visitData.reason || "",
        payment: visitData.paymentMethod || visitData.payment || "Cash"
      });
    }
  }, [visitData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.department) newErrors.department = "Department is required";
    if (!formData.doctor) newErrors.doctor = "Doctor is required";
    if (!formData.date) newErrors.date = "Date is required";
    if (!formData.reason) newErrors.reason = "Reason is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showWarningToast('Please fill in all required fields', 3000);
      return;
    }
    
    setIsSubmitting(true);
    
    setTimeout(() => {
      const updatedData = {
        patientName: formData.patient,
        patientType: formData.patientType,
        department: formData.department,
        doctorName: formData.doctor,
        visitDate: formData.date,
        startTime: formData.time,
        reason: formData.reason,
        paymentMethod: formData.payment
      };
      
      if (onSave) onSave(updatedData);
      
      showUpdateToast(
        `Visit for ${formData.patient} has been updated successfully!`,
        4000,
        {
          'Patient': formData.patient,
          'Department': formData.department,
          'Doctor': formData.doctor,
          'Date': formData.date
        }
      );
      
      setIsSubmitting(false);
      onClose();
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Visit" size="lg" showCloseButton={false}>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <Select 
            label="Select Patient" 
            name="patient" 
            options={patients} 
            value={formData.patient} 
            onChange={handleChange} 
          />
          <Select 
            label="Patient Type" 
            name="patientType" 
            options={patientTypes} 
            value={formData.patientType} 
            onChange={handleChange} 
          />
          <Select 
            label="Select Department" 
            name="department" 
            options={departments} 
            value={formData.department} 
            onChange={handleChange} 
            error={errors.department}
            required 
          />
          <Select 
            label="Select Doctor" 
            name="doctor" 
            options={doctors} 
            value={formData.doctor} 
            onChange={handleChange} 
            error={errors.doctor}
            required 
          />
          <Input 
            label="Date of Visit" 
            name="date" 
            type="date" 
            value={formData.date} 
            onChange={handleChange} 
            error={errors.date}
            required 
          />
          <Input 
            label="Time of Visit" 
            name="time" 
            type="time" 
            value={formData.time} 
            onChange={handleChange} 
          />
          <Input 
            label="Reason" 
            name="reason" 
            value={formData.reason} 
            onChange={handleChange} 
            placeholder="Enter reason for visit" 
            error={errors.reason}
            required 
          />
          <Select 
            label="Mode of Payment" 
            name="payment" 
            options={paymentMethods} 
            value={formData.payment} 
            onChange={handleChange} 
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t mt-4">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting} loading={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditVisitModal;