// AddEditLabTestModal.jsx
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

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

  // Populate form when test prop changes (for editing)
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
      // Reset form when adding new test
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

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleClose = () => {
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
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-bold">{test ? 'Edit Lab Test' : 'Add New Lab Test'}</h2>
          <button onClick={handleClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Test Name *</label>
            <input
              type="text"
              required
              value={formData.testName}
              onChange={(e) => setFormData({...formData, testName: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter test name"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Test Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Test">Test</option>
                <option value="Group">Group</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <input
                type="text"
                required
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Biochemistry, Hematology"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
              <input
                type="number"
                required
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter price"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sample Type</label>
              <select
                value={formData.sampleType}
                onChange={(e) => setFormData({...formData, sampleType: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Blood">Blood</option>
                <option value="Urine">Urine</option>
                <option value="Stool">Stool</option>
                <option value="Saliva">Saliva</option>
                <option value="Blood/Urine">Blood/Urine</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Turnaround Time</label>
              <input
                type="text"
                value={formData.turnaroundTime}
                onChange={(e) => setFormData({...formData, turnaroundTime: e.target.value})}
                placeholder="e.g., 4-6 hours"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preparation Instructions</label>
            <textarea
              rows="2"
              value={formData.preparation}
              onChange={(e) => setFormData({...formData, preparation: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Any special preparation required before test"
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#1C62A0] text-white rounded-lg hover:bg-[#154a7d]"
            >
              {test ? 'Update Test' : 'Add Test'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditLabTestModal;