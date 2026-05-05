// src/components/visits/EditVisitModal.jsx - Refactored
import React, { useState } from "react";
import { Modal, Input, Select, Button } from "../ui";

const EditVisitModal = ({ isOpen, onClose, visitData, onSave }) => {
  const [formData, setFormData] = useState({
    patient: visitData?.patient || "James Carter",
    patientType: visitData?.patientType || "Out Patient",
    department: visitData?.department || "Anaesthesiology",
    doctor: visitData?.doctor || "Dr. Andrew Clark",
    date: visitData?.date || "2025-01-16",
    time: visitData?.time || "08:17",
    reason: visitData?.reason || "Fever, Headache",
    payment: visitData?.payment || "Cash"
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSave) onSave(formData);
    onClose();
  };

  const patients = ["James Carter", "Emily Rodriguez", "Michael Chen", "Sophia Martinez"];
  const patientTypes = ["Out Patient", "In Patient"];
  const departments = ["Anaesthesiology", "Cardiology", "Dental Surgery", "Dermatology", "ENT Surgery", "General Medicine", "Neurology", "Ophthalmology", "Orthopaedics", "Paediatrics", "Radiology"];
  const doctors = ["Dr. Andrew Clark", "Dr. Katherine Brooks", "Dr. Benjamin Harris", "Dr. Laura Mitchell", "Dr. Christopher Lewis", "Dr. Sarah Wilson", "Dr. Jonathan Adams"];
  const paymentMethods = ["Cash", "Card", "Insurance", "Online"];

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Visit" size="lg" showCloseButton={false}>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <Select label="Select Patient" name="patient" options={patients} value={formData.patient} onChange={handleChange} />
          <Select label="Patient Type" name="patientType" options={patientTypes} value={formData.patientType} onChange={handleChange} />
          <Select label="Select Department" name="department" options={departments} value={formData.department} onChange={handleChange} required />
          <Select label="Select Doctor" name="doctor" options={doctors} value={formData.doctor} onChange={handleChange} required />
          <Input label="Date of Visit" name="date" type="date" value={formData.date} onChange={handleChange} />
          <Input label="Time of Visit" name="time" type="time" value={formData.time} onChange={handleChange} />
          <Input label="Reason" name="reason" value={formData.reason} onChange={handleChange} placeholder="Enter reason for visit" />
          <Select label="Mode of Payment" name="payment" options={paymentMethods} value={formData.payment} onChange={handleChange} />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">Save Changes</Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditVisitModal;