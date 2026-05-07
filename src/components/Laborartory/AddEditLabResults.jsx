// src/components/Laboratory/AddEditLabResults.jsx - With toast notifications
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Save, User, Phone, Mail, MapPin, Calendar, FileText, 
  CreditCard, Stethoscope, AlertCircle, Clock, Activity,
  DollarSign, Tag
} from 'lucide-react';
import { 
  Button, Input, Select, Textarea, Card, Alert, Loader, RadioGroup 
} from '../ui';
import { showAddToast, showUpdateToast, showErrorToast, showWarningToast, showSuccessToast } from '../ui/Toast';

const AddEditLabResults = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
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
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      setIsLoading(true);
      setTimeout(() => {
        const existingResults = JSON.parse(localStorage.getItem('labResults') || '[]');
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
      }, 500);
    }
  }, [id, isEditMode]);

  const validateField = (name, value) => {
    switch (name) {
      case 'patientName':
        if (!value) return 'Patient name is required';
        if (value.length < 2) return 'Name must be at least 2 characters';
        return '';
      case 'mobile':
        if (!value) return 'Mobile number is required';
        const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{3,4}[-\s\.]?[0-9]{3,4}$/;
        if (!phoneRegex.test(value)) return 'Please enter a valid mobile number';
        return '';
      case 'email':
        if (value && !/^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/.test(value)) return 'Please enter a valid email address';
        return '';
      case 'testName':
        if (!value) return 'Test name is required';
        return '';
      case 'referredBy':
        if (!value) return 'Referred by doctor is required';
        return '';
      case 'amount':
        if (!value) return 'Amount is required';
        if (isNaN(value) || value <= 0) return 'Amount must be a positive number';
        return '';
      case 'age':
        if (value && (isNaN(value) || value <= 0 || value > 120)) return 'Age must be between 1-120 years';
        return '';
      default:
        return '';
    }
  };

  const calculateTotals = () => {
    const amount = parseFloat(formData.amount) || 0;
    const discount = parseFloat(formData.discount) || 0;
    const paid = parseFloat(formData.paid) || 0;
    const grandTotal = amount - discount;
    const balance = grandTotal - paid;
    setFormData(prev => ({ ...prev, grandTotal: grandTotal.toFixed(2), balance: balance.toFixed(2) }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
    if (name === 'amount' || name === 'discount' || name === 'paid') {
      setTimeout(() => calculateTotals(), 0);
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
    const fieldsToValidate = ['patientName', 'mobile', 'testName', 'referredBy', 'amount'];
    fieldsToValidate.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fieldsToTouch = ['patientName', 'mobile', 'testName', 'referredBy', 'amount'];
    const touchedFields = {};
    fieldsToTouch.forEach(field => touchedFields[field] = true);
    setTouched(touchedFields);
    
    if (validateForm()) {
      setIsSubmitting(true);
      setTimeout(() => {
        try {
          const existingResults = JSON.parse(localStorage.getItem('labResults') || '[]');
          const newLabResult = {
            id: isEditMode ? id : `LAB-${String(existingResults.length + 1).padStart(3, '0')}`,
            testId: isEditMode ? formData.testId : `LDH${String(existingResults.length + 1).padStart(3, '0')}`,
            patientName: formData.patientName,
            gender: formData.gender,
            appointmentDate: formData.appointmentDate,
            referredBy: formData.referredBy,
            testName: formData.testName,
            status: formData.status,
            patientId: isEditMode ? (existingResults.find(r => r.id === id)?.patientId || `PT${String(existingResults.length + 1).padStart(3, '0')}`) : `PT${String(existingResults.length + 1).padStart(3, '0')}`,
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
            investigations: formData.resultValue ? [{ name: formData.testName, result: formData.resultValue, refLow: formData.referenceRange?.split('-')[0] || 0, refHigh: formData.referenceRange?.split('-')[1] || 0, unit: formData.unit }] : []
          };
          
          if (isEditMode) {
            const updatedResults = existingResults.map(r => r.id === id ? newLabResult : r);
            localStorage.setItem('labResults', JSON.stringify(updatedResults));
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
            localStorage.setItem('labResults', JSON.stringify([...existingResults, newLabResult]));
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
          setIsSubmitting(false);
          
          setTimeout(() => {
            navigate('/lab/results');
          }, 1500);
        } catch (error) {
          showErrorToast('Failed to save lab result. Please try again.', 3000);
          setIsSubmitting(false);
        }
      }, 500);
    } else {
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        showWarningToast(`Please fix the ${firstErrorField} field`, 3000);
      }
    }
  };

  const handleGoBack = () => navigate('/lab/results');

  if (isLoading) return <Loader centered text="Loading lab result data..." />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Button variant="ghost" size="sm" onClick={handleGoBack} className="p-2">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isEditMode ? 'Edit Lab Result' : 'Add New Lab Result'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {isEditMode ? 'Update lab result information' : 'Create a new lab result in the system'}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rest of the form remains the same */}
          {/* ... (all the Card components remain unchanged) ... */}
          
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={handleGoBack}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={isSubmitting} loading={isSubmitting} icon={Save}>
              {isSubmitting ? 'Saving...' : (isEditMode ? 'Update Lab Result' : 'Save Lab Result')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditLabResults;