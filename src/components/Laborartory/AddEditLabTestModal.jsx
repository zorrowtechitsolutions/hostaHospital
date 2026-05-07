// src/components/Laboratory/AddEditLabTestModal.jsx - With toast notifications
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Modal, Input, Select, Textarea, Button } from '../ui';
import { showAddToast, showUpdateToast, showWarningToast } from '../ui/Toast';

const AddEditLabTestModal = ({ isOpen, onClose, onSave, test }) => {
  const [formData, setFormData] = useState({
    testName: "",
    type: "Test",
    price: "",
    category: "",
    sampleType: "Blood",
    preparation: "",
    turnaroundTime: "",
    status: "Active"
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (test) {
      setFormData({
        testName: test.testName || "",
        type: test.type || "Test",
        price: test.price || "",
        category: test.category || "",
        sampleType: test.sampleType || "Blood",
        preparation: test.preparation || "",
        turnaroundTime: test.turnaroundTime || "",
        status: test.status || "Active"
      });
    } else {
      setFormData({
        testName: "",
        type: "Test",
        price: "",
        category: "",
        sampleType: "Blood",
        preparation: "",
        turnaroundTime: "",
        status: "Active"
      });
    }
  }, [test, isOpen]);

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors = {};
    if (!formData.testName) newErrors.testName = 'Test name is required';
    if (!formData.price) newErrors.price = 'Price is required';
    if (!formData.category) newErrors.category = 'Category is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      if (test) {
        showUpdateToast(`Test "${formData.testName}" has been updated successfully!`, 3000, {
          'Test Name': formData.testName,
          'Price': `₹${formData.price}`,
          'Status': formData.status
        });
      } else {
        showAddToast(`New test "${formData.testName}" has been added successfully!`, 3000, {
          'Test Name': formData.testName,
          'Price': `₹${formData.price}`,
          'Category': formData.category
        });
      }
      onSave(formData);
    } else {
      showWarningToast('Please fill all required fields', 3000);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={test ? 'Edit Lab Test' : 'Add New Lab Test'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input 
          label="Test Name" 
          name="testName" 
          value={formData.testName} 
          onChange={(e) => setFormData({...formData, testName: e.target.value})} 
          placeholder="Enter test name" 
          required 
          error={errors.testName}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <Select 
            label="Test Type" 
            name="type" 
            options={['Test', 'Group']} 
            value={formData.type} 
            onChange={(e) => setFormData({...formData, type: e.target.value})} 
            required 
          />
          <Input 
            label="Category" 
            name="category" 
            value={formData.category} 
            onChange={(e) => setFormData({...formData, category: e.target.value})} 
            placeholder="e.g., Biochemistry, Hematology" 
            required 
            error={errors.category}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <Input 
            label="Price (₹)" 
            name="price" 
            type="number" 
            value={formData.price} 
            onChange={(e) => setFormData({...formData, price: e.target.value})} 
            placeholder="Enter price" 
            required 
            error={errors.price}
          />
          <Select 
            label="Sample Type" 
            name="sampleType" 
            options={['Blood', 'Urine', 'Stool', 'Saliva', 'Blood/Urine']} 
            value={formData.sampleType} 
            onChange={(e) => setFormData({...formData, sampleType: e.target.value})} 
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <Input 
            label="Turnaround Time" 
            name="turnaroundTime" 
            value={formData.turnaroundTime} 
            onChange={(e) => setFormData({...formData, turnaroundTime: e.target.value})} 
            placeholder="e.g., 4-6 hours" 
          />
          <Select 
            label="Status" 
            name="status" 
            options={['Active', 'Inactive']} 
            value={formData.status} 
            onChange={(e) => setFormData({...formData, status: e.target.value})} 
          />
        </div>
        
        <Textarea 
          label="Preparation Instructions" 
          name="preparation" 
          rows={2} 
          value={formData.preparation} 
          onChange={(e) => setFormData({...formData, preparation: e.target.value})} 
          placeholder="Any special preparation required before test" 
        />
        
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">
            {test ? 'Update Test' : 'Add Test'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddEditLabTestModal;