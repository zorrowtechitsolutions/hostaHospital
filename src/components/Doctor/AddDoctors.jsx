// src/components/patients/AddPatient.jsx - Updated with Doctor-like UI structure
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Mail, Phone, Calendar, MapPin, Lock, Image, 
  DollarSign, IdCard, AlertCircle, ArrowLeft, Upload, X,
  Activity, Heart, Droplet, Ruler, Weight, Stethoscope,
  Users, FileText, Briefcase, Clock
} from 'lucide-react';
import { 
  Button, Input, Select, Textarea, Card, Alert, Loader 
} from '../ui';
import { showSuccessToast, showErrorToast, showWarningToast, showAddToast } from '../ui/Toast';

const AddPatient = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    profileImage: null,
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    mobileNumber: '',
    emergencyNumber: '',
    dob: '',
    age: '',
    gender: '',
    bloodGroup: '',
    maritalStatus: '',
    occupation: '',
    guardianName: '',
    guardianRelation: '',
    addressLine1: '',
    addressLine2: '',
    country: '',
    state: '',
    city: '',
    pinCode: '',
    height: '',
    weight: '',
    bloodPressure: '',
    allergies: '',
    chronicConditions: '',
    referredBy: '',
    referredOn: '',
    department: '',
    notes: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  // Validation functions
  const validateField = (name, value) => {
    switch (name) {
      case 'firstName':
        if (!value) return 'First name is required';
        if (value.length < 2) return 'First name must be at least 2 characters';
        if (value.length > 50) return 'First name must be less than 50 characters';
        if (!/^[a-zA-Z\s\-']+$/.test(value)) return 'First name can only contain letters, spaces, hyphens, and apostrophes';
        return '';

      case 'lastName':
        if (!value) return 'Last name is required';
        if (value.length < 2) return 'Last name must be at least 2 characters';
        if (value.length > 50) return 'Last name must be less than 50 characters';
        if (!/^[a-zA-Z\s\-']+$/.test(value)) return 'Last name can only contain letters, spaces, hyphens, and apostrophes';
        return '';

      case 'mobileNumber':
        if (!value) return 'Mobile number is required';
        const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{3,4}[-\s\.]?[0-9]{3,4}$/;
        if (!phoneRegex.test(value)) return 'Please enter a valid mobile number';
        return '';

      case 'email':
        if (value && !/^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/.test(value)) return 'Please enter a valid email address';
        if (value && value.length > 100) return 'Email must be less than 100 characters';
        return '';

      case 'dob':
        if (!value) return 'Date of birth is required';
        const today = new Date();
        const birthDate = new Date(value);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
        if (age < 0) return 'Date of birth cannot be in the future';
        if (age > 120) return 'Age cannot exceed 120 years';
        return '';

      case 'gender':
        if (!value) return 'Gender is required';
        return '';

      case 'bloodGroup':
        if (!value) return 'Blood group is required';
        return '';

      case 'addressLine1':
        if (!value) return 'Address is required';
        if (value.length < 5) return 'Please enter a complete address';
        return '';

      case 'pinCode':
        if (value && !/^\d{5,6}$/.test(value)) return 'Pin code must be 5 or 6 digits';
        return '';

      case 'height':
        if (value && (isNaN(value) || value <= 0 || value > 300)) return 'Height must be between 1-300 cm';
        return '';

      case 'weight':
        if (value && (isNaN(value) || value <= 0 || value > 500)) return 'Weight must be between 1-500 kg';
        return '';

      case 'password':
        if (value) {
          if (value.length < 8) return 'Password must be at least 8 characters';
          if (!/[A-Z]/.test(value)) return 'Password must contain at least one uppercase letter';
          if (!/[a-z]/.test(value)) return 'Password must contain at least one lowercase letter';
          if (!/[0-9]/.test(value)) return 'Password must contain at least one number';
          if (!/[!@#$%^&*]/.test(value)) return 'Password must contain at least one special character (!@#$%^&*)';
        }
        return '';

      case 'confirmPassword':
        if (formData.password && value !== formData.password) return 'Passwords do not match';
        if (formData.password && !value) return 'Please confirm your password';
        return '';

      default:
        return '';
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const fieldsToValidate = [
      'firstName', 'lastName', 'mobileNumber', 'dob', 'gender', 'bloodGroup', 'addressLine1'
    ];
    
    fieldsToValidate.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });

    if (formData.password) {
      const passwordError = validateField('password', formData.password);
      if (passwordError) newErrors.password = passwordError;
      const confirmError = validateField('confirmPassword', formData.confirmPassword);
      if (confirmError) newErrors.confirmPassword = confirmError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'dob' && value) {
      const today = new Date();
      const birthDate = new Date(value);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
      if (age >= 0 && age <= 120) {
        setFormData(prev => ({ ...prev, age: age.toString() }));
      }
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

  const handleImageUpload = (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, profileImage: 'File size must be less than 5MB' }));
      showWarningToast('Image size must be less than 5MB', 3000);
      return false;
    }
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, profileImage: 'Only JPEG, PNG, GIF, and WEBP files are allowed' }));
      showWarningToast('Only JPEG, PNG, GIF, and WEBP files are allowed', 3000);
      return false;
    }
    setErrors(prev => ({ ...prev, profileImage: '' }));
    setFormData(prev => ({ ...prev, profileImage: file }));
    const reader = new FileReader();
    reader.onloadend = () => setPreviewImage(reader.result);
    reader.readAsDataURL(file);
    showSuccessToast('Image uploaded successfully!', 2000);
    return true;
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) handleImageUpload(file);
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, profileImage: null }));
    setPreviewImage(null);
    setErrors(prev => ({ ...prev, profileImage: '' }));
    showSuccessToast('Image removed', 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allFields = [
      'firstName', 'lastName', 'mobileNumber', 'dob', 'gender', 'bloodGroup', 'addressLine1'
    ];
    const touchedFields = {};
    allFields.forEach(field => touchedFields[field] = true);
    setTouched(touchedFields);
    
    if (validateForm()) {
      setIsSubmitting(true);
      
      setTimeout(() => {
        try {
          const existingPatients = JSON.parse(localStorage.getItem('patients') || '[]');
          
          // Check if mobile number already exists
          const mobileExists = existingPatients.some(p => p.phone === formData.mobileNumber);
          if (mobileExists) {
            showErrorToast('Mobile number already exists! Please use a different number.', 4000);
            setIsSubmitting(false);
            return;
          }
          
          const patientId = `PT${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
          const fullName = `${formData.firstName} ${formData.middleName ? formData.middleName + ' ' : ''}${formData.lastName}`;
          
          const newPatient = {
            id: patientId,
            name: fullName,
            firstName: formData.firstName,
            middleName: formData.middleName,
            lastName: formData.lastName,
            age: formData.age,
            dob: formData.dob,
            gender: formData.gender,
            bloodGroup: formData.bloodGroup,
            maritalStatus: formData.maritalStatus,
            phone: formData.mobileNumber,
            emergencyNumber: formData.emergencyNumber,
            guardianName: formData.guardianName,
            guardianRelation: formData.guardianRelation,
            address: `${formData.addressLine1} ${formData.addressLine2}`,
            city: formData.city,
            state: formData.state,
            country: formData.country,
            pinCode: formData.pinCode,
            referredBy: formData.referredBy,
            referredOn: formData.referredOn,
            department: formData.department,
            notes: formData.notes,
            height: formData.height,
            weight: formData.weight,
            bloodPressure: formData.bloodPressure,
            allergies: formData.allergies,
            chronicConditions: formData.chronicConditions,
            occupation: formData.occupation,
            email: formData.email,
            lastVisit: new Date().toISOString().split('T')[0],
            lastVisitDisplay: new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
            condition: 'Initial Consultation',
            status: 'Active',
            imageUrl: previewImage || `https://randomuser.me/api/portraits/${formData.gender === 'Male' ? 'men' : 'women'}/${Math.floor(Math.random() * 100)}.jpg`
          };
          
          localStorage.setItem('patients', JSON.stringify([...existingPatients, newPatient]));
          
          showAddToast(
            `${newPatient.name} has been added successfully!`,
            4000,
            {
              'Patient ID': patientId,
              'Patient Name': newPatient.name,
              'Age': `${newPatient.age} years`,
              'Blood Group': newPatient.bloodGroup,
              'Department': newPatient.department || 'Not Assigned'
            }
          );
          
          setIsSubmitting(false);
          
          setTimeout(() => {
            navigate('/patients');
          }, 1500);
        } catch (error) {
          showErrorToast('Failed to add patient. Please try again.', 3000);
          setIsSubmitting(false);
        }
      }, 1000);
    } else {
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        showWarningToast(`Please fix the ${firstErrorField.replace(/([A-Z])/g, ' $1').toLowerCase()} field`, 3000);
      }
      
      const firstError = document.querySelector('.error-message');
      if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleGoBack = () => {
    if (formData.firstName || formData.lastName || formData.mobileNumber || previewImage) {
      showWarningToast('Any unsaved data will be lost. Are you sure you want to leave?', 4000);
      setTimeout(() => {
        if (window.confirm('Are you sure you want to go back? Any unsaved data will be lost.')) {
          navigate('/patients');
        }
      }, 100);
    } else {
      navigate('/patients');
    }
  };

  // Tabs configuration
  const tabs = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'medical', label: 'Medical Info' },
    { id: 'guardian', label: 'Guardian & Referral' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Button variant="ghost" size="sm" onClick={handleGoBack} className="p-2">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Add New Patient</h1>
              <p className="text-sm text-gray-500 mt-1">Create a new patient profile in the system</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            {/* Tabs Header */}
            <div className="border-b border-gray-200 px-6">
              <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Basic Information Tab */}
            {activeTab === 'basic' && (
              <div className="p-6 space-y-6">
                {/* Image Upload Section */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center border-2 border-gray-200 overflow-hidden shadow-sm">
                        {previewImage ? (
                          <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <Image className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      {previewImage && (
                        <button type="button" onClick={removeImage} className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm">
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Profile Image</label>
                    <div>
                      <input id="profileImageInput" type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleFileSelect} className="hidden" />
                      <Button type="button" variant="outline" onClick={() => document.getElementById('profileImageInput').click()} className="inline-flex items-center gap-2">
                        <Upload className="h-4 w-4" /> Upload Image
                      </Button>
                      <p className="text-xs text-gray-400 mt-2">JPEG, PNG, GIF, WEBP accepted. Max 5MB</p>
                    </div>
                    {errors.profileImage && <Alert type="error" message={errors.profileImage} className="mt-2" />}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Patient ID:</span>
                    <span className="text-sm font-medium text-gray-900">Auto-generated</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <Input 
                    label="First Name" 
                    name="firstName" 
                    icon={User} 
                    placeholder="Enter first name" 
                    value={formData.firstName} 
                    onChange={handleChange} 
                    onBlur={handleBlur} 
                    error={errors.firstName} 
                    touched={touched.firstName} 
                    required 
                  />
                  <Input 
                    label="Middle Name" 
                    name="middleName" 
                    icon={User} 
                    placeholder="Enter middle name" 
                    value={formData.middleName} 
                    onChange={handleChange} 
                    onBlur={handleBlur} 
                    error={errors.middleName} 
                    touched={touched.middleName} 
                  />
                  <Input 
                    label="Last Name" 
                    name="lastName" 
                    icon={User} 
                    placeholder="Enter last name" 
                    value={formData.lastName} 
                    onChange={handleChange} 
                    onBlur={handleBlur} 
                    error={errors.lastName} 
                    touched={touched.lastName} 
                    required 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <Input 
                    label="Date of Birth" 
                    name="dob" 
                    type="date" 
                    icon={Calendar} 
                    value={formData.dob} 
                    onChange={handleChange} 
                    onBlur={handleBlur} 
                    error={errors.dob} 
                    touched={touched.dob} 
                    required 
                  />
                  <Input 
                    label="Age" 
                    name="age" 
                    type="number" 
                    icon={Clock} 
                    value={formData.age} 
                    readOnly 
                    className="bg-gray-50"
                  />
                  <Select 
                    label="Gender" 
                    name="gender" 
                    options={['Male', 'Female', 'Other']} 
                    placeholder="Select Gender" 
                    value={formData.gender} 
                    onChange={handleChange} 
                    onBlur={handleBlur} 
                    error={errors.gender} 
                    touched={touched.gender} 
                    required 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <Select 
                    label="Blood Group" 
                    name="bloodGroup" 
                    options={['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']} 
                    placeholder="Select Blood Group" 
                    value={formData.bloodGroup} 
                    onChange={handleChange} 
                    onBlur={handleBlur} 
                    error={errors.bloodGroup} 
                    touched={touched.bloodGroup} 
                    required 
                  />
                  <Select 
                    label="Marital Status" 
                    name="maritalStatus" 
                    options={['Single', 'Married', 'Divorced', 'Widowed']} 
                    placeholder="Select Status" 
                    value={formData.maritalStatus} 
                    onChange={handleChange} 
                    onBlur={handleBlur} 
                    error={errors.maritalStatus} 
                    touched={touched.maritalStatus} 
                  />
                  <Input 
                    label="Occupation" 
                    name="occupation" 
                    icon={Briefcase} 
                    placeholder="e.g., Software Engineer" 
                    value={formData.occupation} 
                    onChange={handleChange} 
                    onBlur={handleBlur} 
                    error={errors.occupation} 
                    touched={touched.occupation} 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Input 
                    label="Mobile Number" 
                    name="mobileNumber" 
                    icon={Phone} 
                    placeholder="+1 234 567 8900" 
                    value={formData.mobileNumber} 
                    onChange={handleChange} 
                    onBlur={handleBlur} 
                    error={errors.mobileNumber} 
                    touched={touched.mobileNumber} 
                    required 
                  />
                  <Input 
                    label="Email Address" 
                    name="email" 
                    type="email" 
                    icon={Mail} 
                    placeholder="patient@example.com" 
                    value={formData.email} 
                    onChange={handleChange} 
                    onBlur={handleBlur} 
                    error={errors.email} 
                    touched={touched.email} 
                  />
                </div>

                {/* Address Information */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h3>
                  <div className="space-y-5">
                    <Input 
                      label="Address Line 1" 
                      name="addressLine1" 
                      icon={MapPin} 
                      placeholder="Street address" 
                      value={formData.addressLine1} 
                      onChange={handleChange} 
                      onBlur={handleBlur} 
                      error={errors.addressLine1} 
                      touched={touched.addressLine1} 
                      required 
                    />
                    <Input 
                      label="Address Line 2" 
                      name="addressLine2" 
                      icon={MapPin} 
                      placeholder="Apartment, suite, unit, building, floor" 
                      value={formData.addressLine2} 
                      onChange={handleChange} 
                      onBlur={handleBlur} 
                      error={errors.addressLine2} 
                      touched={touched.addressLine2} 
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                      <Select 
                        label="Country" 
                        name="country" 
                        required={false} 
                        options={['United States', 'United Kingdom', 'Canada', 'Australia', 'India', 'Germany', 'France']} 
                        placeholder="Select Country" 
                        value={formData.country} 
                        onChange={handleChange} 
                        onBlur={handleBlur} 
                        error={errors.country} 
                        touched={touched.country} 
                      />
                      <Input 
                        label="State" 
                        name="state" 
                        required={false} 
                        placeholder="State" 
                        value={formData.state} 
                        onChange={handleChange} 
                        onBlur={handleBlur} 
                        error={errors.state} 
                        touched={touched.state} 
                      />
                      <Input 
                        label="City" 
                        name="city" 
                        required={false} 
                        placeholder="City" 
                        value={formData.city} 
                        onChange={handleChange} 
                        onBlur={handleBlur} 
                        error={errors.city} 
                        touched={touched.city} 
                      />
                      <Input 
                        label="Pin Code" 
                        name="pinCode" 
                        required={false} 
                        placeholder="Postal code" 
                        value={formData.pinCode} 
                        onChange={handleChange} 
                        onBlur={handleBlur} 
                        error={errors.pinCode} 
                        touched={touched.pinCode} 
                      />
                    </div>
                  </div>
                </div>

                {/* Portal Access */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Portal Access (Optional)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input 
                      label="Password" 
                      name="password" 
                      type="password" 
                      icon={Lock} 
                      placeholder="Create password" 
                      value={formData.password} 
                      onChange={handleChange} 
                      onBlur={handleBlur} 
                      error={errors.password} 
                      touched={touched.password} 
                    />
                    <Input 
                      label="Confirm Password" 
                      name="confirmPassword" 
                      type="password" 
                      icon={Lock} 
                      placeholder="Confirm password" 
                      value={formData.confirmPassword} 
                      onChange={handleChange} 
                      onBlur={handleBlur} 
                      error={errors.confirmPassword} 
                      touched={touched.confirmPassword} 
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Setting a password allows the patient to access the patient portal.</p>
                </div>
              </div>
            )}

            {/* Medical Information Tab */}
            {activeTab === 'medical' && (
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <Input 
                    label="Height (cm)" 
                    name="height" 
                    type="number" 
                    icon={Ruler} 
                    placeholder="Height in cm" 
                    value={formData.height} 
                    onChange={handleChange} 
                    onBlur={handleBlur} 
                    error={errors.height} 
                    touched={touched.height} 
                  />
                  <Input 
                    label="Weight (kg)" 
                    name="weight" 
                    type="number" 
                    icon={Weight} 
                    placeholder="Weight in kg" 
                    value={formData.weight} 
                    onChange={handleChange} 
                    onBlur={handleBlur} 
                    error={errors.weight} 
                    touched={touched.weight} 
                  />
                  <Input 
                    label="Blood Pressure" 
                    name="bloodPressure" 
                    icon={Activity} 
                    placeholder="e.g., 120/80" 
                    value={formData.bloodPressure} 
                    onChange={handleChange} 
                    onBlur={handleBlur} 
                    error={errors.bloodPressure} 
                    touched={touched.bloodPressure} 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Textarea 
                    label="Allergies" 
                    name="allergies" 
                    rows={3} 
                    placeholder="List any allergies (medications, food, environmental)" 
                    value={formData.allergies} 
                    onChange={handleChange} 
                    onBlur={handleBlur} 
                    error={errors.allergies} 
                    touched={touched.allergies} 
                  />
                  <Textarea 
                    label="Chronic Conditions" 
                    name="chronicConditions" 
                    rows={3} 
                    placeholder="List any chronic diseases or conditions" 
                    value={formData.chronicConditions} 
                    onChange={handleChange} 
                    onBlur={handleBlur} 
                    error={errors.chronicConditions} 
                    touched={touched.chronicConditions} 
                  />
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input 
                      label="Emergency Number" 
                      name="emergencyNumber" 
                      icon={Phone} 
                      placeholder="Emergency contact number" 
                      value={formData.emergencyNumber} 
                      onChange={handleChange} 
                      onBlur={handleBlur} 
                      error={errors.emergencyNumber} 
                      touched={touched.emergencyNumber} 
                    />
                  </div>
                </div>

                <Textarea 
                  label="Additional Notes" 
                  name="notes" 
                  rows={4} 
                  placeholder="Any additional information about the patient..." 
                  value={formData.notes} 
                  onChange={handleChange} 
                  onBlur={handleBlur} 
                  error={errors.notes} 
                  touched={touched.notes} 
                />
              </div>
            )}

            {/* Guardian & Referral Tab */}
            {activeTab === 'guardian' && (
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Input 
                    label="Guardian Name" 
                    name="guardianName" 
                    icon={User} 
                    placeholder="Parent or guardian name" 
                    value={formData.guardianName} 
                    onChange={handleChange} 
                    onBlur={handleBlur} 
                    error={errors.guardianName} 
                    touched={touched.guardianName} 
                  />
                  <Input 
                    label="Guardian Relation" 
                    name="guardianRelation" 
                    icon={Users} 
                    placeholder="e.g., Father, Mother, Spouse" 
                    value={formData.guardianRelation} 
                    onChange={handleChange} 
                    onBlur={handleBlur} 
                    error={errors.guardianRelation} 
                    touched={touched.guardianRelation} 
                  />
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Referral Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input 
                      label="Referred By" 
                      name="referredBy" 
                      icon={Users} 
                      placeholder="Doctor name or source" 
                      value={formData.referredBy} 
                      onChange={handleChange} 
                      onBlur={handleBlur} 
                      error={errors.referredBy} 
                      touched={touched.referredBy} 
                    />
                    <Input 
                      label="Referred On" 
                      name="referredOn" 
                      type="date" 
                      icon={Calendar} 
                      value={formData.referredOn} 
                      onChange={handleChange} 
                      onBlur={handleBlur} 
                      error={errors.referredOn} 
                      touched={touched.referredOn} 
                    />
                  </div>
                  <div className="mt-5">
                    <Select 
                      label="Department Assigned To" 
                      name="department" 
                      options={['Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'General Medicine', 'Dermatology', 'Ophthalmology', 'ENT']} 
                      placeholder="Select Department" 
                      value={formData.department} 
                      onChange={handleChange} 
                      onBlur={handleBlur} 
                      error={errors.department} 
                      touched={touched.department} 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end gap-3 rounded-b-lg">
              <Button variant="outline" onClick={handleGoBack}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={isSubmitting} loading={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Patient'}
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </div>
  );
};

export default AddPatient;