// src/components/patients/EditAppointmentModal.jsx - With toast notifications
import React, { useState, useEffect } from "react";
import { Modal, Input, Select, Textarea, Button } from "../ui";
import { showUpdateToast, showWarningToast } from "../ui/Toast";

const EditAppointmentModal = ({ isOpen, onClose, appointment, patient, onSave, allPatients = [] }) => {
  const [form, setForm] = useState({
    patientId: "",
    patientName: "",
    patientType: "In Patient",
    department: "",
    doctor: "",
    mode: "In Person",
    date: "",
    startTime: "",
    endTime: "",
    reason: "",
    notes: "",
    payment: "Card"
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (appointment) {
      setForm({
        patientId: appointment.patientId || patient?.id || "",
        patientName: appointment.patientName || patient?.name || "",
        patientType: appointment.patientType || "In Patient",
        department: appointment.department || "",
        doctor: appointment.doctorName || "",
        mode: appointment.preferredMode || appointment.consultationMode || "In Person",
        date: appointment.appointmentDate || "",
        startTime: appointment.startTime || "",
        endTime: appointment.endTime || "",
        reason: appointment.reason || "",
        notes: appointment.notes || "",
        payment: appointment.paymentMethod || "Card"
      });
    }
  }, [appointment, patient]);

  const getAllPatients = () => {
    if (allPatients && allPatients.length > 0) return allPatients;
    return [];
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.department) newErrors.department = "Department is required";
    if (!form.doctor) newErrors.doctor = "Doctor is required";
    if (!form.date) newErrors.date = "Date is required";
    if (!form.startTime) newErrors.startTime = "Start time is required";
    if (!form.endTime) newErrors.endTime = "End time is required";
    if (!form.reason) newErrors.reason = "Reason is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      setIsSubmitting(true);
      
      setTimeout(() => {
        const updatedData = {
          patientId: form.patientId,
          patientName: form.patientName,
          patientType: form.patientType,
          department: form.department,
          doctor: form.doctor,
          consultationMode: form.mode,
          date: form.date,
          startTime: form.startTime,
          endTime: form.endTime,
          reason: form.reason,
          notes: form.notes,
          paymentMethod: form.payment
        };
        
        onSave(updatedData);
        
        showUpdateToast(
          `Appointment has been updated successfully!`,
          4000,
          {
            'Patient': form.patientName,
            'Date': form.date,
            'Time': `${form.startTime} - ${form.endTime}`,
            'Doctor': form.doctor
          }
        );
        
        setIsSubmitting(false);
        onClose();
      }, 500);
    } else {
      showWarningToast('Please fill in all required fields', 3000);
    }
  };

  const handlePatientChange = (e) => {
    const selectedPatient = getAllPatients().find(p => p.id === e.target.value);
    if (selectedPatient) {
      setForm(prev => ({
        ...prev,
        patientId: selectedPatient.id,
        patientName: selectedPatient.name,
        patientType: selectedPatient.type || "Out Patient"
      }));
    }
  };

  if (!isOpen) return null;

  const departments = ["Anaesthesiology", "Cardiology", "Dental Surgery", "Dermatology", "ENT Surgery", "General Medicine", "Neurology", "Ophthalmology", "Orthopaedics", "Paediatrics", "Radiology"];
  const doctors = ["Dr. Andrew Clark", "Dr. Katherine Brooks", "Dr. Benjamin Harris", "Dr. Laura Mitchell", "Dr. Christopher Lewis", "Dr. Sarah Wilson", "Dr. Michael Lee", "Dr. Emily Chen", "Dr. Robert Johnson", "Dr. Maria Garcia", "Dr. James Wilson"];
  const modes = ["In Person", "Video", "Phone"];
  const paymentMethods = ["Card", "Cash", "Insurance", "Online"];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Appointment" size="lg" showCloseButton={false}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Select 
            label="Select Patient" 
            name="patientId" 
            options={getAllPatients().map(p => ({ value: p.id, label: `${p.name} (${p.id})` }))} 
            value={form.patientId} 
            onChange={handlePatientChange} 
          />
          <Select 
            label="Patient Type" 
            name="patientType" 
            options={["In Patient", "Out Patient"]} 
            value={form.patientType} 
            onChange={handleChange} 
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select 
            label="Select Department" 
            name="department" 
            options={departments} 
            value={form.department} 
            onChange={handleChange} 
            error={errors.department} 
            required 
          />
          <Select 
            label="Select Doctor" 
            name="doctor" 
            options={doctors} 
            value={form.doctor} 
            onChange={handleChange} 
            error={errors.doctor} 
            required 
          />
        </div>

        <Select 
          label="Preferred Mode of Consultation" 
          name="mode" 
          options={modes} 
          value={form.mode} 
          onChange={handleChange} 
        />

        <div className="grid grid-cols-3 gap-3">
          <Input 
            label="Date" 
            name="date" 
            type="date" 
            value={form.date} 
            onChange={handleChange} 
            error={errors.date} 
            required 
          />
          <Input 
            label="Start Time" 
            name="startTime" 
            type="time" 
            value={form.startTime} 
            onChange={handleChange} 
            error={errors.startTime} 
            required 
          />
          <Input 
            label="End Time" 
            name="endTime" 
            type="time" 
            value={form.endTime} 
            onChange={handleChange} 
            error={errors.endTime} 
            required 
          />
        </div>

        <Input 
          label="Reason" 
          name="reason" 
          value={form.reason} 
          onChange={handleChange} 
          placeholder="Enter reason for appointment" 
          error={errors.reason} 
          required 
        />
        
        <Textarea 
          label="Quick Notes" 
          name="notes" 
          rows={3} 
          value={form.notes} 
          onChange={handleChange} 
          placeholder="Provide detailed instructions..." 
        />
        
        <Select 
          label="Mode of Payment" 
          name="payment" 
          options={paymentMethods} 
          value={form.payment} 
          onChange={handleChange} 
        />

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={isSubmitting} loading={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditAppointmentModal;