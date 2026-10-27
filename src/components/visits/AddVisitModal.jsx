// src/components/visits/AddVisitModal.jsx - With toast notifications
import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { Modal, Input, Select, Textarea, Button } from '../ui';
import CustomSelect from '../ui/CustomSelect'; // ✅ Added import
import { showAddToast, showWarningToast } from '../ui/Toast';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // ✅ Static option lists
  const departments = [
    'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Dermatology',
    'ENT', 'Ophthalmology', 'General Medicine', 'Surgery', 'Pulmonology',
    'Nursing', 'Pharmacy'
  ];
  const patientTypes = ['Out Patient', 'In Patient'];
  const paymentMethods = ['Cash', 'Card', 'Insurance', 'Online'];

  // ✅ Build options for CustomSelect
  const patientTypeOptions = patientTypes.map(t => ({ value: t, label: t }));
  const departmentOptions = departments.map(d => ({ value: d, label: d }));
  const paymentMethodOptions = paymentMethods.map(p => ({ value: p, label: p }));

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

  // ✅ Handlers for CustomSelect fields (receive value directly)
  const handlePatientTypeChange = (value) => {
    setFormData(prev => ({ ...prev, patientType: value }));
  };

  const handleDepartmentChange = (value) => {
    setFormData(prev => ({ ...prev, department: value }));
    if (errors.department) setErrors(prev => ({ ...prev, department: '' }));
  };

  const handlePaymentMethodChange = (value) => {
    setFormData(prev => ({ ...prev, paymentMethod: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showWarningToast('Please fill in all required fields', 3000);
      return;
    }
    
    setIsSubmitting(true);
    
    setTimeout(() => {
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
      
      showAddToast(
        `New visit for ${formData.patientName} has been added successfully!`,
        4000,
        {
          'Patient': formData.patientName,
          'Department': formData.department,
          'Doctor': formData.doctorName,
          'ID': newId
        }
      );
      
      setIsSubmitting(false);
      resetForm();
      onClose();
    }, 500);
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
    setErrors({});
    setTouched({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add New Visit" size="lg" showCloseButton={false}>
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

          {/* ✅ Patient Type - CustomSelect */}
          <CustomSelect
            label="Patient Type"
            value={formData.patientType}
            options={patientTypeOptions}
            onChange={handlePatientTypeChange}
            placeholder="Select Patient Type"
          />

          {/* ✅ Department - CustomSelect */}
          <CustomSelect
            label="Department"
            value={formData.department}
            options={departmentOptions}
            onChange={handleDepartmentChange}
            onBlur={() => setTouched(prev => ({ ...prev, department: true }))}
            placeholder="Select Department"
            required
            error={errors.department}
            touched={!!errors.department || touched.department}
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

          {/* ✅ Payment Method - CustomSelect */}
          <CustomSelect
            label="Payment Method"
            value={formData.paymentMethod}
            options={paymentMethodOptions}
            onChange={handlePaymentMethodChange}
            placeholder="Select Payment Method"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button type="submit" variant="primary" icon={Save} disabled={isSubmitting} loading={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add Visit'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddVisitModal;