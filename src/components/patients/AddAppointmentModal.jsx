// src/components/patients/AddAppointmentModal.jsx - Fixed
import React, { useState } from "react";
import { X, Calendar, Clock, DollarSign, FileText } from "lucide-react";
import { Modal, Input, Select, Textarea, Button, Avatar, Badge } from "../ui";

const AddAppointmentModal = ({ isOpen, onClose, patient, onSave }) => {
  const [formData, setFormData] = useState({
    patientType: "",
    preferredMode: "",
    date: "",
    startTime: "",
    endTime: "",
    reason: "",
    quickNotes: "",
    paymentMethod: "",
    selectDoctor: ""
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const appointmentData = {
      id: `APT${Math.floor(Math.random() * 10000)}`,
      patientId: patient?.id || "PT0025",
      patientName: patient?.name || "James Carter",
      doctorName: formData.selectDoctor,
      department: patient?.department || "Cardiology",
      appointmentDate: formData.date,
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
      avatar: patient?.imageUrl || "https://randomuser.me/api/portraits/men/32.jpg"
    };
    if (onSave) onSave(appointmentData);
    onClose();
  };

  const doctorsList = [
    "Dr. Andrew Clark (Cardiology)", "Dr. Sarah Wilson (Cardiology)", "Dr. Michael Lee (Neurology)",
    "Dr. Emily Chen (Pulmonology)", "Dr. Robert Johnson (Surgery)", "Dr. Maria Garcia (Pulmonology)",
    "Dr. James Wilson (Cardiology)", "Dr. Katherine Brooks (Dental)", "Dr. Benjamin Harris (Dermatology)",
    "Dr. Laura Mitchell (ENT)"
  ];

  const reasonsList = ["General Checkup", "Follow-up Visit", "Emergency", "Consultation", "Vaccination", "Test Results Review", "Surgery Follow-up", "New Symptoms"];
  const paymentMethods = ["Cash", "Card", "Insurance", "Online Transfer", "Check"];
  const patientTypes = ["Out Patient", "In Patient", "Emergency", "New Patient", "Follow-up Patient"];
  const consultationModes = ["In-person", "Video Call", "Phone Call", "Home Visit"];
  const today = new Date().toISOString().split('T')[0];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Schedule Appointment" size="lg" showCloseButton={false}>
      {/* Patient Info Summary */}
      <div className="px-6 py-4 bg-blue-50 border-b border-blue-100 -mt-4 -mx-6 mb-4">
        <div className="flex items-center gap-4">
          <Avatar src={patient?.imageUrl || "https://randomuser.me/api/portraits/men/32.jpg"} alt={patient?.name} size="md" rounded="full" />
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-xs font-mono bg-white">{patient?.id || "PT0025"}</Badge>
              <Badge variant="success" className="text-xs">Last Visit: {patient?.lastVisitDisplay || "17 Jun 2025"}</Badge>
            </div>
            <h3 className="font-semibold text-gray-900">{patient?.name || "James Carter"}</h3>
            <p className="text-xs text-gray-600">{patient?.gender || "Male"} • {patient?.age || 45} years</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Select label="Patient Type" name="patientType" options={patientTypes} placeholder="Select Patient Type" value={formData.patientType} onChange={(e) => setFormData({...formData, patientType: e.target.value})} required />
          <Select label="Preferred Mode of Consultation" name="preferredMode" options={consultationModes} placeholder="Select Mode" value={formData.preferredMode} onChange={(e) => setFormData({...formData, preferredMode: e.target.value})} required />
          <Select label="Select Doctor" name="selectDoctor" options={doctorsList} placeholder="Select Doctor" value={formData.selectDoctor} onChange={(e) => setFormData({...formData, selectDoctor: e.target.value})} required />
          <Select label="Reason for Visit" name="reason" options={reasonsList} placeholder="Select Reason" value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} required />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Appointment Date <span className="text-red-500">*</span></label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input type="date" required min={today} value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Time <span className="text-red-500">*</span></label>
            <div className="relative"><Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" /><input type="time" required value={formData.startTime} onChange={(e) => setFormData({...formData, startTime: e.target.value})} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Time <span className="text-red-500">*</span></label>
            <div className="relative"><Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" /><input type="time" required value={formData.endTime} onChange={(e) => setFormData({...formData, endTime: e.target.value})} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mode of Payment <span className="text-red-500">*</span></label>
            <div className="relative"><DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" /><select required value={formData.paymentMethod} onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white"><option value="">Select Payment Method</option>{paymentMethods.map(method => <option key={method} value={method}>{method}</option>)}</select></div>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Quick Notes</label>
            <div className="relative"><FileText className="absolute left-3 top-3 text-gray-400 w-4 h-4" /><textarea rows="3" value={formData.quickNotes} onChange={(e) => setFormData({...formData, quickNotes: e.target.value})} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Additional information about the appointment..." /></div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">Add Appointment</Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddAppointmentModal;