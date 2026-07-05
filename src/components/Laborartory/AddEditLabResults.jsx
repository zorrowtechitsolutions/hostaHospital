import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { Button, Loader } from '../ui';
import {
  showAddToast,
  showUpdateToast,
  showErrorToast,
  showWarningToast
} from '../ui/Toast';

// ==================== CONSTANTS ====================
const STORAGE_KEY = 'labResults';
const REQUIRED_FIELDS = ['patientName', 'mobile', 'testName', 'referredBy', 'amount'];

const DEFAULT_FORM_DATA = {
  testId: "",
  patientName: "",
  age: "",
  gender: "",
  mobile: "",
  email: "",
  address: "",
  referredBy: "",
  testName: "",
  testType: "Test",
  appointmentDate: new Date().toISOString().split('T')[0],
  status: "Pending",
  resultValue: "",
  referenceRange: "",
  unit: "",
  interpretation: "",
  amount: "",
  discount: "",
  grandTotal: "",
  paid: "",
  balance: ""
};

// ==================== HELPER FUNCTIONS ====================
const getStorageData = (key, fallback) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
};

const setStorageData = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const generateId = (prefix, length) => `${prefix}${String(length).padStart(3, '0')}`;

const isEmpty = (value) => !value?.toString().trim();
const isPositiveNumber = (value) => !isNaN(value) && Number(value) > 0;

// ==================== REUSABLE COMPONENTS ====================
const PageHeader = ({ title, subtitle, onBack }) => (
  <div className="mb-8">
    <div className="flex items-center gap-3 mb-2">
      <Button variant="ghost" size="sm" onClick={onBack} className="p-2">
        <ArrowLeft className="h-5 w-5 text-gray-600" />
      </Button>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
      </div>
    </div>
  </div>
);

const FormField = ({ field, value, onChange, onBlur, error, touched }) => {
  const { label, name, type, placeholder, required, options, gridCols } = field;
  
  return (
    <div className={gridCols || ""}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {type === 'select' ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {options.map(opt => (
            <option key={opt} value={opt}>{opt || `Select ${label}`}</option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          name={name}
          rows={3}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      ) : (
        <input
          type={type}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      )}
      {touched && error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
};

const SectionCard = ({ icon, title, children }) => (
  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
    <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-white border-b border-gray-200">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-blue-100 rounded-md">
          {icon}
        </div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>
    </div>
    <div className="p-6">
      {children}
    </div>
  </div>
);

const AddEditLabResults = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load data for edit mode
  useEffect(() => {
    if (isEditMode) {
      setIsLoading(true);
      const existingResults = getStorageData(STORAGE_KEY, []);
      const result = existingResults.find(r => r.id === id);
      
      if (result) {
        setFormData({
          testId: result.testId || "",
          patientName: result.patientName || "",
          age: result.age || "",
          gender: result.gender || "",
          mobile: result.mobile || "",
          email: result.email || "",
          address: result.address || "",
          referredBy: result.referredBy || "",
          testName: result.testName || "",
          testType: result.testType === "General" ? "Test" : "Group",
          appointmentDate: result.appointmentDate || new Date().toISOString().split('T')[0],
          status: result.status || "Pending",
          resultValue: result.resultValue || "",
          referenceRange: result.referenceRange || "",
          unit: result.unit || "",
          interpretation: result.interpretation || "",
          amount: result.amount || "",
          discount: result.discount || "",
          grandTotal: (result.amount - (result.discount || 0)).toFixed(2) || "",
          paid: result.paid || "",
          balance: result.balance || ""
        });
      }
      setIsLoading(false);
    }
  }, [id, isEditMode]);

  const validateField = (name, value) => {
    switch (name) {
      case 'patientName':
        if (isEmpty(value)) return 'Patient name is required';
        if (value.length < 2) return 'Name must be at least 2 characters';
        return '';
      case 'mobile':
        if (isEmpty(value)) return 'Mobile number is required';
        const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{3,4}[-\s\.]?[0-9]{3,4}$/;
        if (!phoneRegex.test(value)) return 'Please enter a valid mobile number';
        return '';
      case 'email':
        if (value && !/^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/.test(value)) 
          return 'Please enter a valid email address';
        return '';
      case 'testName':
      case 'referredBy':
        if (isEmpty(value)) return `${name === 'testName' ? 'Test' : 'Referred by doctor'} is required`;
        return '';
      case 'amount':
        if (isEmpty(value)) return 'Amount is required';
        if (!isPositiveNumber(value)) return 'Amount must be a positive number';
        return '';
      case 'age':
        if (value && (isNaN(value) || value <= 0 || value > 120)) 
          return 'Age must be between 1-120 years';
        return '';
      default:
        return '';
    }
  };

  const calculateTotals = (updatedFormData) => {
    const amount = parseFloat(updatedFormData.amount) || 0;
    const discount = parseFloat(updatedFormData.discount) || 0;
    const paid = parseFloat(updatedFormData.paid) || 0;
    const grandTotal = amount - discount;
    const balance = grandTotal - paid;
    
    return {
      grandTotal: grandTotal.toFixed(2),
      balance: balance.toFixed(2)
    };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedData = { ...formData, [name]: value };
    
    if (['amount', 'discount', 'paid'].includes(name)) {
      const totals = calculateTotals(updatedData);
      setFormData({ ...updatedData, ...totals });
    } else {
      setFormData(updatedData);
    }
    
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const validateForm = () => {
    const newErrors = {};
    REQUIRED_FIELDS.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const touchedFields = Object.fromEntries(REQUIRED_FIELDS.map(field => [field, true]));
    setTouched(touchedFields);
    
    if (!validateForm()) {
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        showWarningToast(`Please fix the ${firstErrorField} field`, 3000);
      }
      return;
    }

    setIsSubmitting(true);
    
    try {
      const existingResults = getStorageData(STORAGE_KEY, []);
      const newIndex = existingResults.length;
      
      const newLabResult = {
        id: isEditMode ? id : generateId('LAB-', newIndex + 1),
        testId: isEditMode ? formData.testId : generateId('LDH', newIndex + 1),
        patientName: formData.patientName,
        gender: formData.gender,
        appointmentDate: formData.appointmentDate,
        referredBy: formData.referredBy,
        testName: formData.testName,
        status: formData.status,
        patientId: isEditMode 
          ? (existingResults.find(r => r.id === id)?.patientId || generateId('PT', newIndex + 1))
          : generateId('PT', newIndex + 1),
        age: formData.age,
        testType: formData.testType === "Test" ? "General" : "Panel",
        amount: parseFloat(formData.amount),
        paymentStatus: parseFloat(formData.balance) === 0 ? "Paid" : "Pending",
        department: formData.testType === "Test" ? "Pathology" : "Biochemistry",
        labTechnician: "Dr. Assigned",
        resultSummary: formData.interpretation || "Results recorded",
        avatar: `https://randomuser.me/api/portraits/${formData.gender === 'Male' ? 'men' : 'women'}/1.jpg`,
        mobile: formData.mobile,
        email: formData.email,
        address: formData.address,
        resultValue: formData.resultValue,
        referenceRange: formData.referenceRange,
        unit: formData.unit,
        interpretation: formData.interpretation,
        discount: parseFloat(formData.discount) || 0,
        paid: parseFloat(formData.paid) || 0,
        balance: parseFloat(formData.balance) || 0,
        investigations: formData.resultValue 
          ? [{ 
              name: formData.testName, 
              result: formData.resultValue, 
              refLow: formData.referenceRange?.split('-')[0] || 0, 
              refHigh: formData.referenceRange?.split('-')[1] || 0, 
              unit: formData.unit 
            }] 
          : []
      };
      
      if (isEditMode) {
        const updatedResults = existingResults.map(r => r.id === id ? newLabResult : r);
        setStorageData(STORAGE_KEY, updatedResults);
        showUpdateToast(
          `Lab result for ${formData.patientName} has been updated!`,
          4000,
          {
            'Patient': formData.patientName,
            'Test': formData.testName,
            'Status': formData.status
          }
        );
      } else {
        setStorageData(STORAGE_KEY, [...existingResults, newLabResult]);
        showAddToast(
          `New lab result for ${formData.patientName} has been added!`,
          4000,
          {
            'Patient': formData.patientName,
            'Test': formData.testName,
            'Amount': `₹${formData.amount}`
          }
        );
      }
      
      navigate('/lab/results');
    } catch (error) {
      showErrorToast('Failed to save lab result. Please try again.', 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => navigate(-1);

  if (isLoading) return <Loader centered text="Loading lab result data..." />;

  // Form Fields Configuration
  const formFields = [
    { label: "Patient Name", name: "patientName", type: "text", placeholder: "Enter patient name", required: true, gridCols: "md:col-span-2" },
    { label: "Age", name: "age", type: "number", placeholder: "Enter age" },
    { label: "Gender", name: "gender", type: "select", options: ["", "Male", "Female", "Other"] },
    { label: "Mobile Number", name: "mobile", type: "tel", placeholder: "Enter mobile number", required: true },
    { label: "Email", name: "email", type: "email", placeholder: "Enter email address" },
    { label: "Address", name: "address", type: "textarea", placeholder: "Enter address", gridCols: "md:col-span-2" },
    { label: "Referred By (Doctor)", name: "referredBy", type: "text", placeholder: "Enter referring doctor name", required: true, gridCols: "md:col-span-2" },
    { label: "Test Name", name: "testName", type: "text", placeholder: "Enter test name", required: true },
    { label: "Test Type", name: "testType", type: "select", options: ["Test", "Group"] },
    { label: "Appointment Date", name: "appointmentDate", type: "date" },
    { label: "Status", name: "status", type: "select", options: ["Pending", "Completed", "Cancelled"] }
  ];

  const resultFields = [
    { label: "Result Value", name: "resultValue", type: "text", placeholder: "Enter result value" },
    { label: "Reference Range", name: "referenceRange", type: "text", placeholder: "e.g., 10-20 mg/dL" },
    { label: "Unit", name: "unit", type: "text", placeholder: "e.g., mg/dL, mmol/L" },
    { label: "Interpretation", name: "interpretation", type: "textarea", placeholder: "Clinical interpretation of results" }
  ];

  const financialFields = [
    { label: "Amount (₹)", name: "amount", type: "number", placeholder: "Enter amount", required: true },
    { label: "Discount (₹)", name: "discount", type: "number", placeholder: "Enter discount" },
    { label: "Paid Amount (₹)", name: "paid", type: "number", placeholder: "Enter paid amount" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <PageHeader
          title={isEditMode ? 'Edit Lab Result' : 'Add New Lab Result'}
          subtitle={isEditMode ? 'Update lab result information' : 'Create a new lab result in the system'}
          onBack={handleGoBack}
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient & Test Information */}
          <SectionCard 
            icon={
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
            title="Patient & Test Information"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {formFields.map((field) => (
                <FormField
                  key={field.name}
                  field={field}
                  value={formData[field.name]}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors[field.name]}
                  touched={touched[field.name]}
                />
              ))}
            </div>
          </SectionCard>

          {/* Test Results */}
          <SectionCard 
            icon={
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
            title="Test Results"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {resultFields.map((field) => (
                <FormField
                  key={field.name}
                  field={field}
                  value={formData[field.name]}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              ))}
            </div>
          </SectionCard>

          {/* Payment Details */}
          <SectionCard 
            icon={
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            title="Payment Details"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {financialFields.map((field) => (
                <FormField
                  key={field.name}
                  field={field}
                  value={formData[field.name]}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors[field.name]}
                  touched={touched[field.name]}
                />
              ))}
              
              {/* Calculated Totals */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Subtotal:</span>
                    <span className="font-semibold text-gray-900">₹{formData.amount || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Discount:</span>
                    <span className="font-semibold text-green-600">-₹{formData.discount || 0}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900">Grand Total:</span>
                      <span className="text-lg font-bold text-blue-600">₹{formData.grandTotal || 0}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-sm text-gray-600">Paid:</span>
                    <span className="font-semibold text-green-600">₹{formData.paid || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Balance:</span>
                    <span className={`font-semibold ${parseFloat(formData.balance) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ₹{formData.balance || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={handleGoBack}>Cancel</Button>
            <Button 
              type="submit" 
              variant="primary" 
              disabled={isSubmitting} 
              loading={isSubmitting} 
              icon={Save}
            >
              {isSubmitting ? 'Saving...' : (isEditMode ? 'Update Lab Result' : 'Save Lab Result')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditLabResults;