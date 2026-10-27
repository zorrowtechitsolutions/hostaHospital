// src/components/Laboratory/AddEditLabTestModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Input, Select, Textarea, Button } from '../ui';
import CustomSelect from '../ui/CustomSelect';
import { showAddToast, showUpdateToast, showWarningToast } from '../ui/Toast';

const INITIAL_STATE = {
  testName: "",
  type: "Test",
  price: "",
  category: "",
  sampleType: "Blood",
  preparation: "",
  turnaroundTime: "",
  status: "Active"
};

const REQUIRED = ['testName', 'price', 'category'];

// ✅ Dropdown options for CustomSelect (value === label, simple strings)
const TYPE_OPTIONS = [
  { value: 'Test', label: 'Test' },
  { value: 'Group', label: 'Group' }
];
const SAMPLE_TYPE_OPTIONS = [
  { value: 'Blood', label: 'Blood' },
  { value: 'Urine', label: 'Urine' },
  { value: 'Stool', label: 'Stool' },
  { value: 'Saliva', label: 'Saliva' },
  { value: 'Blood/Urine', label: 'Blood/Urine' }
];
const STATUS_OPTIONS = [
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' }
];

const AddEditLabTestModal = ({ isOpen, onClose, onSave, test }) => {
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setFormData(test ? {
      testName: test.testName || "",
      type: test.type || "Test",
      price: test.price || "",
      category: test.category || "",
      sampleType: test.sampleType || "Blood",
      preparation: test.preparation || "",
      turnaroundTime: test.turnaroundTime || "",
      status: test.status || "Active"
    } : INITIAL_STATE);
    setErrors({});
  }, [test, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    REQUIRED.forEach(field => {
      if (!formData[field]) {
        const labels = { testName: 'Test name', price: 'Price', category: 'Category' };
        newErrors[field] = `${labels[field]} is required`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showWarningToast('Please fill all required fields', 3000);
      return;
    }

    const isEdit = !!test;
    const message = isEdit
      ? `Test "${formData.testName}" has been updated successfully!`
      : `New test "${formData.testName}" has been added successfully!`;
    const details = isEdit
      ? { 'Test Name': formData.testName, 'Price': `₹${formData.price}`, 'Status': formData.status }
      : { 'Test Name': formData.testName, 'Price': `₹${formData.price}`, 'Category': formData.category };

    isEdit ? showUpdateToast(message, 3000, details) : showAddToast(message, 3000, details);
    onSave(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={test ? 'Edit Lab Test' : 'Add New Lab Test'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Test Name"
          name="testName"
          value={formData.testName}
          onChange={handleChange}
          placeholder="Enter test name"
          required
          error={errors.testName}
        />

        <div className="grid grid-cols-2 gap-4">
          {/* ✅ Replaced shared with CustomSelect */}
          <CustomSelect
            label="Test Type"
            value={formData.type}
            options={TYPE_OPTIONS}
            placeholder="Select test type"
            onChange={(value) => handleChange({ target: { name: 'type', value } })}
            required
          />
          <Input
            label="Category"
            name="category"
            value={formData.category}
            onChange={handleChange}
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
            onChange={handleChange}
            placeholder="Enter price"
            required
            error={errors.price}
          />
          {/* ✅ Replaced shared with CustomSelect */}
          <CustomSelect
            label="Sample Type"
            value={formData.sampleType}
            options={SAMPLE_TYPE_OPTIONS}
            placeholder="Select sample type"
            onChange={(value) => handleChange({ target: { name: 'sampleType', value } })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Turnaround Time"
            name="turnaroundTime"
            value={formData.turnaroundTime}
            onChange={handleChange}
            placeholder="e.g., 4-6 hours"
          />
          {/* ✅ Replaced shared  with CustomSelect */}
          <CustomSelect
            label="Status"
            value={formData.status}
            options={STATUS_OPTIONS}
            placeholder="Select status"
            onChange={(value) => handleChange({ target: { name: 'status', value } })}
          />
        </div>

        <Textarea
          label="Preparation Instructions"
          name="preparation"
          rows={2}
          value={formData.preparation}
          onChange={handleChange}
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