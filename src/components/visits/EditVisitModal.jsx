// src/components/visits/EditVisitModal.jsx - Refactored
import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Modal, Input, Select, Textarea, Button } from '../ui';

const EditVisitModal = ({ isOpen, onClose, visit, onSave }) => {
  const [formData, setFormData] = useState({
    patientName: '',
    patientType: '',
    department: '',
    doctorName: '',
    visitDate: '',
    time: '',
    reason: '',
    paymentMethod: ''
  });

  useEffect(() => {
    if (visit) {
      setFormData({
        patientName: visit.patientName || '',
        patientType: visit.patientType || 'Out Patient',
        department: visit.department || '',
        doctorName: visit.doctorName || '',
        visitDate: visit.visitDate || '',
        time: `${visit.startTime || ''} - ${visit.endTime || ''}`,
        reason: visit.reason || '',
        paymentMethod: visit.paymentMethod || 'Cash'
      });
    }
  }, [visit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
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
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Visit" size="lg" showCloseButton={false}>
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
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" icon={Save}>Save Changes</Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditVisitModal;