// src/components/visits/AddVisitModal.jsx - Refactored
import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { Modal, Input, Select, Textarea, Button } from '../ui';

const AddVisitModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    patientName: '',
    patientType: 'Out Patient',
    department: '',
    doctorName: '',
    visitDate: '',
    time: '',
    reason: '',
    paymentMethod: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newId = `VIS${String(Math.floor(Math.random() * 10000)).padStart(3, '0')}`;
    const visitDateObj = new Date(formData.visitDate);
    const visitDateDisplay = visitDateObj.toLocaleDateString('en-US', { 
      day: 'numeric', month: 'short', year: 'numeric' 
    });
    
    const timeParts = formData.time.split(' - ');
    const startTime = timeParts[0] || '';
    const endTime = timeParts[1] || '';
    
    const newVisit = {
      id: newId,
      visitId: newId,
      patientName: formData.patientName,
      patientId: `PT${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      patientType: formData.patientType,
      department: formData.department,
      doctorName: formData.doctorName,
      visitDate: formData.visitDate,
      visitDateDisplay: visitDateDisplay,
      startTime: startTime,
      endTime: endTime,
      status: 'Pending',
      reason: formData.reason,
      diagnosis: '',
      prescription: '',
      notes: '',
      followUpDate: '',
      paymentMethod: formData.paymentMethod,
      patientAvatar: `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${Math.floor(Math.random() * 70)}.jpg`
    };
    
    onSave(newVisit);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setFormData({
      patientName: '',
      patientType: 'Out Patient',
      department: '',
      doctorName: '',
      visitDate: '',
      time: '',
      reason: '',
      paymentMethod: ''
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const departments = [
    'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Dermatology',
    'ENT', 'Ophthalmology', 'General Medicine', 'Surgery', 'Pulmonology',
    'Nursing', 'Pharmacy'
  ];
  const patientTypes = ['Out Patient', 'In Patient'];
  const paymentMethods = ['Cash', 'Card', 'Insurance', 'Online'];

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add New Visit" size="lg" showCloseButton={false}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Patient Name" name="patientName" value={formData.patientName} onChange={handleChange} required placeholder="Enter patient name" />
          <Select label="Patient Type" name="patientType" options={patientTypes} value={formData.patientType} onChange={handleChange} />
          <Select label="Department" name="department" options={departments} value={formData.department} onChange={handleChange} required placeholder="Select Department" />
          <Input label="Doctor Name" name="doctorName" value={formData.doctorName} onChange={handleChange} required placeholder="Enter doctor name" />
          <Input label="Visit Date" name="visitDate" type="date" value={formData.visitDate} onChange={handleChange} required />
          <Input label="Time" name="time" value={formData.time} onChange={handleChange} required placeholder="09:00 AM - 10:00 AM" />
          <div className="md:col-span-2">
            <Textarea label="Reason for Visit" name="reason" rows={3} value={formData.reason} onChange={handleChange} placeholder="Enter reason for visit..." />
          </div>
          <Select label="Payment Method" name="paymentMethod" options={paymentMethods} value={formData.paymentMethod} onChange={handleChange} placeholder="Select Payment Method" />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button type="submit" variant="primary" icon={Save}>Add Visit</Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddVisitModal;