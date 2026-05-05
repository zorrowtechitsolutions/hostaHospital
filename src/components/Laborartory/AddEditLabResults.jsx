// src/components/Laboratory/AddEditLabResults.jsx - Refactored
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
          alert('Lab result updated successfully!');
        } else {
          localStorage.setItem('labResults', JSON.stringify([...existingResults, newLabResult]));
          alert('Lab result added successfully!');
        }
        setIsSubmitting(false);
        navigate('/lab/results');
      }, 500);
    } else {
      const firstError = document.querySelector('.error-message');
      if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
          {/* Basic Information Card */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
              <p className="text-sm text-gray-500 mt-0.5">Patient personal details</p>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Test ID</label>
                  <input type="text" value={formData.testId || (isEditMode ? formData.testId : "Auto-generated")} disabled className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500 text-sm" />
                  <p className="text-xs text-gray-400 mt-1">Auto-generated</p>
                </div>
                <Input label="Patient Name" name="patientName" icon={User} placeholder="Enter patient name" value={formData.patientName} onChange={handleChange} onBlur={handleBlur} error={errors.patientName} touched={touched.patientName} required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <Input label="Age" name="age" type="number" icon={Clock} placeholder="Age in years" required={false} value={formData.age} onChange={handleChange} onBlur={handleBlur} error={errors.age} touched={touched.age} />
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">Gender</label>
                  <div className="flex gap-6 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="gender" value="Male" checked={formData.gender === 'Male'} onChange={handleChange} className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">Male</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="gender" value="Female" checked={formData.gender === 'Female'} onChange={handleChange} className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">Female</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Contact Information Card */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>
              <p className="text-sm text-gray-500 mt-0.5">Phone, email and address</p>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input label="Mobile Number" name="mobile" icon={Phone} placeholder="+1 234 567 8900" value={formData.mobile} onChange={handleChange} onBlur={handleBlur} error={errors.mobile} touched={touched.mobile} required />
                <Input label="Email Address" name="email" type="email" icon={Mail} placeholder="patient@example.com" required={false} value={formData.email} onChange={handleChange} onBlur={handleBlur} error={errors.email} touched={touched.email} />
              </div>
              <Input label="Address" name="address" icon={MapPin} placeholder="Enter address" required={false} value={formData.address} onChange={handleChange} onBlur={handleBlur} error={errors.address} touched={touched.address} />
            </div>
          </Card>

          {/* Test Information Card */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-900">Test Information</h2>
              <p className="text-sm text-gray-500 mt-0.5">Test and doctor details</p>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input label="Referred By (Doctor)" name="referredBy" icon={User} placeholder="Dr. Name" value={formData.referredBy} onChange={handleChange} onBlur={handleBlur} error={errors.referredBy} touched={touched.referredBy} required />
                <Input label="Test Name" name="testName" icon={Stethoscope} placeholder="Enter test name" value={formData.testName} onChange={handleChange} onBlur={handleBlur} error={errors.testName} touched={touched.testName} required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <Select label="Test Type" name="testType" required={false} options={['Test', 'Group']} placeholder="Select Test Type" value={formData.testType} onChange={handleChange} onBlur={handleBlur} error={errors.testType} touched={touched.testType} />
                <Input label="Appointment Date" name="appointmentDate" type="date" icon={Calendar} required={false} value={formData.appointmentDate} onChange={handleChange} onBlur={handleBlur} error={errors.appointmentDate} touched={touched.appointmentDate} />
                <Select label="Status" name="status" required={false} options={['Pending', 'In Progress', 'Completed', 'Cancelled']} placeholder="Select Status" value={formData.status} onChange={handleChange} onBlur={handleBlur} error={errors.status} touched={touched.status} />
              </div>
            </div>
          </Card>

          {/* Test Results Card */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-900">Test Results</h2>
              <p className="text-sm text-gray-500 mt-0.5">Lab results and interpretation</p>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <Input label="Result Value" name="resultValue" icon={Activity} placeholder="Enter result" required={false} value={formData.resultValue} onChange={handleChange} onBlur={handleBlur} error={errors.resultValue} touched={touched.resultValue} />
                <Input label="Reference Range" name="referenceRange" placeholder="e.g., 70-100" required={false} value={formData.referenceRange} onChange={handleChange} onBlur={handleBlur} error={errors.referenceRange} touched={touched.referenceRange} />
                <Input label="Unit" name="unit" placeholder="mg/dL, g/dL, %" required={false} value={formData.unit} onChange={handleChange} onBlur={handleBlur} error={errors.unit} touched={touched.unit} />
              </div>
              <Textarea label="Interpretation" name="interpretation" rows={3} placeholder="Clinical interpretation of results..." value={formData.interpretation} onChange={handleChange} onBlur={handleBlur} error={errors.interpretation} touched={touched.interpretation} />
            </div>
          </Card>

          {/* Billing Details Card */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-900">Billing Details</h2>
              <p className="text-sm text-gray-500 mt-0.5">Payment and billing information</p>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <Input label="Amount (₹)" name="amount" type="number" icon={DollarSign} placeholder="Enter amount" value={formData.amount} onChange={handleChange} onBlur={handleBlur} error={errors.amount} touched={touched.amount} required />
                <Input label="Discount (₹)" name="discount" type="number" icon={Tag} placeholder="Discount amount" required={false} value={formData.discount} onChange={handleChange} onBlur={handleBlur} error={errors.discount} touched={touched.discount} />
                <Input label="Grand Total (₹)" name="grandTotal" type="text" value={formData.grandTotal} readOnly icon={CreditCard} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input label="Paid Amount (₹)" name="paid" type="number" icon={DollarSign} placeholder="Enter paid amount" required={false} value={formData.paid} onChange={handleChange} onBlur={handleBlur} error={errors.paid} touched={touched.paid} />
                <Input label="Balance (₹)" name="balance" type="text" value={formData.balance} readOnly />
              </div>
              {formData.balance && parseFloat(formData.balance) > 0 && (
                <Alert type="warning" message={`Pending balance: ₹${formData.balance}. Please collect payment.`} />
              )}
              {formData.balance && parseFloat(formData.balance) === 0 && formData.amount && (
                <Alert type="success" message="Payment completed. No balance due." />
              )}
            </div>
          </Card>

          {/* Action Buttons */}
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