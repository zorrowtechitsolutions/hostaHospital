// src/components/Appointments/AddAppointmentModal.jsx
import React, { useState } from "react";
import { X, Calendar, Clock, DollarSign, FileText, User, Stethoscope } from "lucide-react";
import { Modal, Input, Select, Textarea, Button, Avatar, Badge } from "../ui";

const AddAppointmentModal = ({ isOpen, onClose, patient, onSave }) => {
  const [formData, setFormData] = useState({
    patientId: "",
    patientName: "",
    patientType: "",
    preferredMode: "",
    department: "",
    doctorName: "",
    appointmentDate: "",
    startTime: "",
    endTime: "",
    reason: "",
    quickNotes: "",
    paymentMethod: ""
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const appointmentData = {
      id: `APT${Math.floor(Math.random() * 10000)}`,
      patientId: formData.patientId || "PT0025",
      patientName: formData.patientName || "James Carter",
      doctorName: formData.doctorName,
      department: formData.department,
      appointmentDate: formData.appointmentDate,
      appointmentDateDisplay: formData.appointmentDate ? new Date(formData.appointmentDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : "",
      startTime: formData.startTime,
      endTime: formData.endTime,
      status: "Upcoming",
      fee: "$350",
      duration: "1 hour",
      reason: formData.reason,
      notes: formData.quickNotes,
      paymentMethod: formData.paymentMethod,
      patientType: formData.patientType,
      preferredMode: formData.preferredMode,
      patientAvatar: "https://randomuser.me/api/portraits/men/32.jpg"
    };
    
    if (onSave) {
      onSave(appointmentData);
    }
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      patientId: "",
      patientName: "",
      patientType: "",
      preferredMode: "",
      department: "",
      doctorName: "",
      appointmentDate: "",
      startTime: "",
      endTime: "",
      reason: "",
      quickNotes: "",
      paymentMethod: ""
    });
  };

  const patientsList = [
    { id: "PT0025", name: "James Carter" },
    { id: "PT0026", name: "Emily Rodriguez" },
    { id: "PT0027", name: "Michael Chen" },
    { id: "PT0028", name: "Lisa Wong" },
    { id: "PT0029", name: "Sophia Martinez" },
    { id: "PT0030", name: "David Thompson" }
  ];

  const doctorsList = [
    "Dr. Andrew Clark (Cardiology)",
    "Dr. Sarah Wilson (Cardiology)",
    "Dr. Michael Lee (Neurology)",
    "Dr. Emily Chen (Pulmonology)",
    "Dr. Robert Johnson (Surgery)",
    "Dr. Maria Garcia (Pulmonology)",
    "Dr. James Wilson (Cardiology)",
    "Dr. Katherine Brooks (Dental)",
    "Dr. Benjamin Harris (Dermatology)",
    "Dr. Laura Mitchell (ENT)"
  ];

  const departments = [
    "Cardiology", "Neurology", "Orthopedics", "Pediatrics", "Dermatology",
    "ENT", "Ophthalmology", "General Medicine", "Surgery", "Pulmonology",
    "Nursing", "Pharmacy", "Radiology", "Pathology"
  ];

  const patientTypes = ["Out Patient", "In Patient", "Emergency", "New Patient", "Follow-up Patient"];
  const consultationModes = ["In-person", "Video Call", "Phone Call", "Home Visit"];
  const paymentMethods = ["Cash", "Card", "Insurance", "Online Transfer", "Check"];
  const today = new Date().toISOString().split('T')[0];

  const handlePatientSelect = (e) => {
    const selectedId = e.target.value;
    const selectedPatient = patientsList.find(p => p.id === selectedId);
    if (selectedPatient) {
      setFormData(prev => ({
        ...prev,
        patientId: selectedPatient.id,
        patientName: selectedPatient.name
      }));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Schedule New Appointment" size="xl" showCloseButton={false}>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Select Patient */}
          <Select
            label="Select Patient"
            name="patientId"
            options={patientsList.map(p => ({ value: p.id, label: `${p.name} (${p.id})` }))}
            value={formData.patientId}
            onChange={handlePatientSelect}
            placeholder="Select Patient"
            required
          />

          {/* Patient Type */}
          <Select
            label="Patient Type"
            name="patientType"
            options={patientTypes}
            value={formData.patientType}
            onChange={handleChange}
            placeholder="Select Patient Type"
            required
          />

          {/* Select Department */}
          <Select
            label="Department"
            name="department"
            options={departments}
            value={formData.department}
            onChange={handleChange}
            placeholder="Select Department"
            required
          />

          {/* Select Doctor */}
          <Select
            label="Doctor"
            name="doctorName"
            options={doctorsList}
            value={formData.doctorName}
            onChange={handleChange}
            placeholder="Select Doctor"
            required
          />

          {/* Preferred Mode of Consultation */}
          <Select
            label="Preferred Mode of Consultation"
            name="preferredMode"
            options={consultationModes}
            value={formData.preferredMode}
            onChange={handleChange}
            placeholder="Select Mode"
            required
          />

          {/* Appointment Date */}
          <Input
            label="Appointment Date"
            name="appointmentDate"
            type="date"
            min={today}
            value={formData.appointmentDate}
            onChange={handleChange}
            required
            icon={Calendar}
          />

          {/* Start Time */}
          <Input
            label="Start Time"
            name="startTime"
            type="time"
            value={formData.startTime}
            onChange={handleChange}
            required
            icon={Clock}
          />

          {/* End Time */}
          <Input
            label="End Time"
            name="endTime"
            type="time"
            value={formData.endTime}
            onChange={handleChange}
            required
            icon={Clock}
          />

          {/* Reason */}
          <div className="md:col-span-2">
            <Input
              label="Reason for Visit"
              name="reason"
              type="text"
              value={formData.reason}
              onChange={handleChange}
              placeholder="Enter reason for appointment"
              required
              icon={FileText}
            />
          </div>

          {/* Quick Notes */}
          <div className="md:col-span-2">
            <Textarea
              label="Quick Notes"
              name="quickNotes"
              rows={3}
              value={formData.quickNotes}
              onChange={handleChange}
              placeholder="Additional information about the appointment..."
            />
          </div>

          {/* Mode of Payment */}
          <Select
            label="Mode of Payment"
            name="paymentMethod"
            options={paymentMethods}
            value={formData.paymentMethod}
            onChange={handleChange}
            placeholder="Select Payment Method"
            required
          />
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            Schedule Appointment
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddAppointmentModal;