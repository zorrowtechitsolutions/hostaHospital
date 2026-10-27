// src/components/visits/EditVisitModal.jsx - With toast notifications
import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Modal, Input, Textarea, Button } from '../ui';
import CustomSelect from '../ui/CustomSelect';
import { showUpdateToast, showWarningToast } from '../ui/Toast';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

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

  const validateForm = () => {
    const newErrors = {};
    if (!formData.patientName) newErrors.patientName = 'Patient name is required';
    if (!formData.department) newErrors.department = 'Department is required';
    if (!formData.doctorName) newErrors.doctorName = 'Doctor name is required';
    if (!formData.visitDate) newErrors.visitDate = 'Visit date is required';
    if (!formData.time) newErrors.time = 'Time is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  // ✅ Handler for CustomSelect (receives value directly, not an event)
  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showWarningToast('Please fill in all required fields', 3000);
      return;
    }
    
    setIsSubmitting(true);
    
    setTimeout(() => {
      onSave(formData);
      
      showUpdateToast(
        `Visit for ${formData.patientName} has been updated successfully!`,
        4000,
        {
          'Patient': formData.patientName,
          'Department': formData.department,
          'Doctor': formData.doctorName,
          'Date': formData.visitDate
        }
      );
      
      setIsSubmitting(false);
      onClose();
    }, 500);
  };

  const departments = [
    'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Dermatology',
    'ENT', 'Ophthalmology', 'General Medicine', 'Surgery', 'Pulmonology',
    'Nursing', 'Pharmacy'
  ];
  const patientTypes = ['Out Patient', 'In Patient'];
  const paymentMethods = ['Cash', 'Card', 'Insurance', 'Online'];

  // ✅ Helper to convert string array into { value, label } options for CustomSelect
  const toOptions = (arr) => arr.map((item) => ({ value: item, label: item }));

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Visit" size="lg" showCloseButton={false}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input 
            label="Patient Name" 
            name="patientName" 
            value={formData.patientName} 
            onChange={handleChange} 
            required 
            placeholder="Enter patient name"
            error={errors.patientName}
          />

          {/* ✅ Replaced Select with CustomSelect */}
          <CustomSelect 
            label="Patient Type" 
            name="patientType" 
            options={toOptions(patientTypes)} 
            value={formData.patientType} 
            onChange={(value) => handleSelectChange('patientType', value)} 
            placeholder="Select Patient Type"
          />

          {/* ✅ Replaced Select with CustomSelect */}
          <CustomSelect 
            label="Department" 
            name="department" 
            options={toOptions(departments)} 
            value={formData.department} 
            onChange={(value) => handleSelectChange('department', value)} 
            required 
            placeholder="Select Department"
            error={errors.department}
            touched={!!errors.department}
          />

          <Input 
            label="Doctor Name" 
            name="doctorName" 
            value={formData.doctorName} 
            onChange={handleChange} 
            required 
            placeholder="Enter doctor name"
            error={errors.doctorName}
          />

          <Input 
            label="Visit Date" 
            name="visitDate" 
            type="date" 
            value={formData.visitDate} 
            onChange={handleChange} 
            required 
            error={errors.visitDate}
          />

          <Input 
            label="Time" 
            name="time" 
            value={formData.time} 
            onChange={handleChange} 
            required 
            placeholder="09:00 AM - 10:00 AM"
            error={errors.time}
          />

          <div className="md:col-span-2">
            <Textarea 
              label="Reason for Visit" 
              name="reason" 
              rows={3} 
              value={formData.reason} 
              onChange={handleChange} 
              placeholder="Enter reason for visit..." 
            />
          </div>

          {/* ✅ Replaced Select with CustomSelect */}
          <CustomSelect 
            label="Payment Method" 
            name="paymentMethod" 
            options={toOptions(paymentMethods)} 
            value={formData.paymentMethod} 
            onChange={(value) => handleSelectChange('paymentMethod', value)} 
            placeholder="Select Payment Method" 
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" icon={Save} disabled={isSubmitting} loading={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditVisitModal;