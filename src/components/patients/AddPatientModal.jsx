// src/components/patients/AddPatient.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Mail, Phone, Calendar, MapPin, Lock, Image, 
  AlertCircle, ArrowLeft, Heart, Users, 
  FileText, Briefcase, Clock, Activity, AlertTriangle,
  Upload, X, ChevronDown, Eye, EyeOff, Home, Stethoscope
} from 'lucide-react';
import { 
  Button, Input, Select, Textarea, Card, Alert, Loader 
} from '../ui';
import { 
  showSuccessToast, showErrorToast, showWarningToast, showInfoToast 
} from '../ui/Toast';
import { useCreatePatientMutation } from '../../../app/service/patients';
import { Country, State, City } from 'country-state-city';

// SearchableDropdown Component
const SearchableDropdown = ({ 
  label, 
  options, 
  value, 
  onChange, 
  placeholder, 
  icon: Icon,
  disabled = false,
  required = false,
  getOptionLabel = (option) => option.name || option,
  getOptionValue = (option) => option.isoCode || option,
  optionKey = (option, index) => option.isoCode || index
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  const filteredOptions = options.filter(option => {
    const label = getOptionLabel(option).toLowerCase();
    return label.includes(searchTerm.toLowerCase());
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    onChange(getOptionValue(option), getOptionLabel(option));
    setSearchTerm("");
    setIsOpen(false);
  };

  const displayValue = () => {
    if (!value) return "";
    const selected = options.find(opt => getOptionValue(opt) === value);
    return selected ? getOptionLabel(selected) : "";
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />}
        <input
          type="text"
          value={isOpen ? searchTerm : displayValue()}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            setSearchTerm("");
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-10 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            disabled ? 'text-gray-400 bg-gray-50 cursor-not-allowed' : ''
          }`}
        />
        <ChevronDown 
          className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 cursor-pointer transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          onClick={() => setIsOpen(!isOpen)}
        />
      </div>
      
      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.map((option, index) => (
            <div
              key={optionKey(option, index)}
              className="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors flex items-center gap-2"
              onClick={() => handleSelect(option)}
            >
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="text-gray-700">{getOptionLabel(option)}</span>
            </div>
          ))}
        </div>
      )}
      
      {isOpen && filteredOptions.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
          No results found
        </div>
      )}
    </div>
  );
};

const AddPatient = () => {
  const navigate = useNavigate();
  
  // Get user data from auth storage
  const authData = JSON.parse(localStorage.getItem("auth") || "{}");
  const user = authData?.user || JSON.parse(localStorage.getItem("user") || "{}");
  
  console.log("Logged User:", user);
  
  const [createPatient, { isLoading: isCreateLoading }] = useCreatePatientMutation();
  
  const [formData, setFormData] = useState({
    profileImage: null,
    firstName: '',
    middleName: '',
    lastName: '',
    bloodGroup: '',
    age: '',
    dob: '',
    gender: '',
    maritalStatus: '',
    mobileNumber: '',
    emergencyNumber: '',
    guardianName: '',
    guardianRelation: '',
    addressLine1: '',
    addressLine2: '',
    countryCode: '',
    countryName: '',
    stateCode: '',
    stateName: '',
    district: '',
    place: '',
    pincode: '',
    referredBy: '',
    referredOn: '',
    department: '',
    notes: '',
    height: '',
    weight: '',
    bloodPressure: '',
    allergies: '',
    chronicConditions: '',
    occupation: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const countries = Country.getAllCountries();
  const states = State.getStatesOfCountry(formData.countryCode);
  const cities = City.getCitiesOfState(formData.countryCode, formData.stateCode);

  const bloodGroupOptions = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
  const maritalStatusOptions = ['Single', 'Married', 'Divorced', 'Widowed'];
  const departmentOptions = ['Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'Dermatology', 'Psychiatry', 'Radiology', 'Surgery', 'Pulmonology', 'ENT'];
  const guardianRelationOptions = ['Father', 'Mother', 'Spouse', 'Son', 'Daughter', 'Brother', 'Sister', 'Other'];

  const handleCountryChange = (code, name) => {
    setFormData(prev => ({
      ...prev,
      countryCode: code,
      countryName: name,
      stateCode: '',
      stateName: '',
      district: ''
    }));
  };

  const handleStateChange = (code, name) => {
    setFormData(prev => ({
      ...prev,
      stateCode: code,
      stateName: name,
      district: ''
    }));
  };

  const handleCityChange = (name) => {
    setFormData(prev => ({
      ...prev,
      district: name
    }));
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'firstName':
        if (!value) return 'First name is required';
        if (value.length < 2) return 'First name must be at least 2 characters';
        if (!/^[a-zA-Z\s\-']+$/.test(value)) return 'First name can only contain letters';
        return '';
      case 'lastName':
        if (!value) return 'Last name is required';
        if (value.length < 2) return 'Last name must be at least 2 characters';
        if (!/^[a-zA-Z\s\-']+$/.test(value)) return 'Last name can only contain letters';
        return '';
      case 'mobileNumber':
        if (!value) return 'Mobile number is required';
        const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{3,4}[-\s\.]?[0-9]{3,4}$/;
        if (!phoneRegex.test(value)) return 'Please enter a valid mobile number';
        return '';
      case 'email':
        if (value && !/^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/.test(value)) return 'Please enter a valid email address';
        return '';
      case 'age':
        if (!value) return 'Age is required';
        if (isNaN(value) || value <= 0) return 'Age must be a positive number';
        if (value > 120) return 'Age cannot exceed 120 years';
        return '';
      case 'dob':
        if (!value) return 'Date of birth is required';
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
      case 'pincode':
        if (value && !/^\d{5,6}$/.test(value)) return 'Pin code must be 5 or 6 digits';
        return '';
      case 'countryName':
        if (!value) return 'Country is required';
        return '';
      case 'stateName':
        if (!value) return 'State is required';
        return '';
      case 'district':
        if (!value) return 'District is required';
        return '';
      case 'password':
        if (value) {
          if (value.length < 8) return 'Password must be at least 8 characters';
          if (!/[A-Z]/.test(value)) return 'Password must contain at least one uppercase letter';
          if (!/[a-z]/.test(value)) return 'Password must contain at least one lowercase letter';
          if (!/[0-9]/.test(value)) return 'Password must contain at least one number';
        }
        return '';
      case 'confirmPassword':
        if (formData.password && value !== formData.password) return 'Passwords do not match';
        if (formData.password && !value) return 'Please confirm your password';
        return '';
      case 'height':
        if (value && (isNaN(value) || value <= 0 || value > 300)) return 'Height must be between 1-300 cm';
        return '';
      case 'weight':
        if (value && (isNaN(value) || value <= 0 || value > 500)) return 'Weight must be between 1-500 kg';
        return '';
      default: return '';
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const fieldsToValidate = [
      'firstName', 'lastName', 'mobileNumber', 'age', 'dob', 'gender', 
      'bloodGroup', 'addressLine1', 'countryName', 'stateName', 'district'
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
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
    if (name === 'dob' && value) {
      const today = new Date();
      const birthDate = new Date(value);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
      if (age > 0 && age <= 120) {
        setFormData(prev => ({ ...prev, age: age.toString() }));
        showInfoToast(`Patient age calculated: ${age} years`, 2000);
      }
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleImageUpload = async (file) => {
    if (!file) return false;
    
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, profileImage: 'File size must be less than 5MB' }));
      showWarningToast('File size must be less than 5MB', 3000);
      return false;
    }
    
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, profileImage: 'Only JPEG, PNG, GIF, and WEBP files are allowed' }));
      showWarningToast('Only JPEG, PNG, GIF, and WEBP files are allowed', 3000);
      return false;
    }
    
    setErrors(prev => ({ ...prev, profileImage: '' }));
    setUploadProgress(0);
    
    const reader = new FileReader();
    reader.onloadend = () => setPreviewImage(reader.result);
    reader.readAsDataURL(file);
    
    showInfoToast('Uploading image...', 2000);
    
    // Simulate upload - replace with actual upload to S3/cloud
    setTimeout(() => {
      setUploadProgress(100);
      setFormData(prev => ({ ...prev, profileImage: previewImage }));
      showSuccessToast('Image uploaded successfully!', 3000);
    }, 1000);
    
    return true;
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, profileImage: null }));
    setPreviewImage(null);
    setUploadProgress(0);
    setErrors(prev => ({ ...prev, profileImage: '' }));
    showSuccessToast('Image removed', 2000);
  };

  const preparePatientData = () => {
    const userId = user?.userId || user?.id;
    const hospitalId = user?.hospitalId || user?.id;

    const patientData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      middleName: formData.middleName || null,
      bloodGroup: formData.bloodGroup,
      gender: formData.gender,
      maritalStatus: formData.maritalStatus || undefined,
      patientType: "OPD",
      age: parseInt(formData.age),
      dob: formData.dob,
      mobileNumber: formData.mobileNumber,
      emergencyNumber: formData.emergencyNumber || undefined,
      guardianName: formData.guardianName || undefined,
      addressLine1: formData.addressLine1,
      location: {
        country: formData.countryName,
        state: formData.stateName,
        district: formData.district,
        place: formData.place || "",
        pincode: formData.pincode ? parseInt(formData.pincode) : 0
      },
      hospitalId: hospitalId,
      referredBy: formData.referredBy || null,
      department: formData.department || undefined,
      referredOn: formData.referredOn || null,
      email: formData.email || undefined,
      userId: userId,
      profileImage: formData.profileImage || null,
      height: formData.height ? parseInt(formData.height) : null,
      weight: formData.weight ? parseInt(formData.weight) : null,
      bloodPressure: formData.bloodPressure || null,
      allergies: formData.allergies || null,
      chronicConditions: formData.chronicConditions || null,
      occupation: formData.occupation || null,
      guardianRelation: formData.guardianRelation || null
    };

    // Add password only if provided
    if (formData.password) {
      patientData.password = formData.password;
    }

    return patientData;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const allFields = [
      'firstName', 'lastName', 'mobileNumber', 'age', 'dob', 'gender', 
      'bloodGroup', 'addressLine1', 'countryName', 'stateName', 'district'
    ];
    const touchedFields = {};
    allFields.forEach(field => touchedFields[field] = true);
    setTouched(touchedFields);
    
    if (validateForm()) {
      setIsSubmitting(true);
      showInfoToast('Creating patient profile...', 2000);
      
      try {
        const patientData = preparePatientData();
        
        console.log('Sending patient data:', JSON.stringify(patientData, null, 2));
        
        const result = await createPatient(patientData).unwrap();
        
        const patientId = result?.data?.id;
        console.log('✅ Patient created successfully! Patient ID:', patientId);
        
        showSuccessToast(
          `${formData.firstName} ${formData.lastName} has been added successfully!`
        );
        
        setIsSubmitting(false);
        
        setTimeout(() => {
          navigate('/patients');
        }, 2000);
        
      } catch (error) {
        console.error('Error creating patient:', error);
        
        if (error.status === 409) {
          showErrorToast('❌ Mobile number or email already exists!');
        } else if (error.data?.message?.includes('Mobile number already exists')) {
          showErrorToast('❌ Mobile number already exists! Please use a different number.', 4000);
        } else if (error.data?.message?.includes('Email already exists')) {
          showErrorToast('❌ Email already exists! Please use a different email.', 4000);
        } else if (error.data?.message) {
          showErrorToast(`❌ ${error.data.message}`);
        } else {
          showErrorToast('❌ Failed to add patient. Please try again.');
        }
        
        setIsSubmitting(false);
      }
    } else {
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        showWarningToast(`⚠️ Please fix the ${firstErrorField.replace(/([A-Z])/g, ' $1').toLowerCase()} field`);
      }
    }
  };

  const handleGoBack = () => {
    navigate('/patients');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
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
            <div className="p-6 space-y-6">
              {/* Profile Image Upload */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center border-2 border-gray-200 overflow-hidden shadow-sm">
                      {previewImage ? (
                        <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    {previewImage && (
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex-1 w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Profile Image</label>
                  <div>
                    <input
                      id="profileImageInput"
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('profileImageInput').click()}
                      className="inline-flex items-center gap-2"
                      disabled={isSubmitting}
                    >
                      <Upload className="h-4 w-4" />
                      Upload Image
                    </Button>
                    <p className="text-xs text-gray-400 mt-2">
                      JPEG, PNG, GIF, WEBP accepted. Max 5MB
                    </p>
                  </div>
                  
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="mt-2">
                      <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#1C62A0] transition-all duration-300 rounded-full"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Uploading... {uploadProgress}%</p>
                    </div>
                  )}
                  
                  {errors.profileImage && <Alert type="error" message={errors.profileImage} className="mt-2" />}
                </div>
              </div>

              {/* Personal Information */}
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                <Select 
                  label="Blood Group" 
                  name="bloodGroup" 
                  options={bloodGroupOptions} 
                  placeholder="Select Blood Group" 
                  value={formData.bloodGroup} 
                  onChange={handleChange} 
                  onBlur={handleBlur} 
                  error={errors.bloodGroup} 
                  touched={touched.bloodGroup} 
                  required 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <Input 
                  label="Age" 
                  name="age" 
                  type="number" 
                  icon={Clock} 
                  placeholder="Age in years" 
                  value={formData.age} 
                  onChange={handleChange} 
                  onBlur={handleBlur} 
                  error={errors.age} 
                  touched={touched.age} 
                  required 
                />
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Select 
                  label="Marital Status" 
                  name="maritalStatus" 
                  options={maritalStatusOptions} 
                  placeholder="Select Marital Status" 
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
                  placeholder="Occupation" 
                  value={formData.occupation} 
                  onChange={handleChange} 
                  onBlur={handleBlur} 
                  error={errors.occupation} 
                  touched={touched.occupation} 
                />
              </div>

              {/* Contact Information */}
              <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-6 pt-4 border-t border-gray-200">Contact Information</h3>
              
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
                  label="Emergency Number" 
                  name="emergencyNumber" 
                  icon={AlertTriangle} 
                  placeholder="Emergency contact" 
                  value={formData.emergencyNumber} 
                  onChange={handleChange} 
                  onBlur={handleBlur} 
                  error={errors.emergencyNumber} 
                  touched={touched.emergencyNumber} 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input 
                  label="Guardian Name" 
                  name="guardianName" 
                  icon={Users} 
                  placeholder="Parent or guardian name" 
                  value={formData.guardianName} 
                  onChange={handleChange} 
                  onBlur={handleBlur} 
                  error={errors.guardianName} 
                  touched={touched.guardianName} 
                />
                <Select 
                  label="Guardian Relation" 
                  name="guardianRelation" 
                  options={guardianRelationOptions} 
                  placeholder="Relationship" 
                  value={formData.guardianRelation} 
                  onChange={handleChange} 
                  onBlur={handleBlur} 
                  error={errors.guardianRelation} 
                  touched={touched.guardianRelation} 
                />
              </div>

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

              {/* Address Information */}
              <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-6 pt-4 border-t border-gray-200">Address Information</h3>
              
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
              

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <SearchableDropdown
                  label="Country"
                  options={countries}
                  value={formData.countryCode}
                  onChange={handleCountryChange}
                  placeholder="Search for a country..."
                  icon={MapPin}
                  required={true}
                />
                <SearchableDropdown
                  label="State"
                  options={states}
                  value={formData.stateCode}
                  onChange={handleStateChange}
                  placeholder="Search for a state..."
                  icon={MapPin}
                  disabled={!formData.countryCode}
                  required={true}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <SearchableDropdown
                  label="District"
                  options={cities}
                  value={formData.district}
                  onChange={handleCityChange}
                  placeholder="Search for a district..."
                  icon={MapPin}
                  disabled={!formData.stateCode}
                  required={true}
                  getOptionLabel={(option) => option.name}
                  getOptionValue={(option) => option.name}
                />
                <Input 
                  label="Place / Locality" 
                  name="place" 
                  placeholder="Place/Locality" 
                  value={formData.place} 
                  onChange={handleChange} 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input 
                  label="Pin Code" 
                  name="pincode" 
                  placeholder="Postal code" 
                  value={formData.pincode} 
                  onChange={handleChange} 
                  onBlur={handleBlur} 
                  error={errors.pincode} 
                  touched={touched.pincode} 
                />
              </div>

              {/* Medical Information */}
              <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-6 pt-4 border-t border-gray-200">Medical Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <Input 
                  label="Height (cm)" 
                  name="height" 
                  type="number" 
                  icon={Activity} 
                  placeholder="cm" 
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
                  icon={Activity} 
                  placeholder="kg" 
                  value={formData.weight} 
                  onChange={handleChange} 
                  onBlur={handleBlur} 
                  error={errors.weight} 
                  touched={touched.weight} 
                />
                <Input 
                  label="Blood Pressure" 
                  name="bloodPressure" 
                  icon={Heart} 
                  placeholder="e.g., 120/80" 
                  value={formData.bloodPressure} 
                  onChange={handleChange} 
                  onBlur={handleBlur} 
                  error={errors.bloodPressure} 
                  touched={touched.bloodPressure} 
                />
              </div>

              <Textarea 
                label="Allergies" 
                name="allergies" 
                rows={2} 
                placeholder="List any allergies (medications, food, etc.)" 
                value={formData.allergies} 
                onChange={handleChange} 
                onBlur={handleBlur} 
                error={errors.allergies} 
                touched={touched.allergies} 
              />
              
              <Textarea 
                label="Chronic Conditions" 
                name="chronicConditions" 
                rows={2} 
                placeholder="Diabetes, hypertension, asthma, etc." 
                value={formData.chronicConditions} 
                onChange={handleChange} 
                onBlur={handleBlur} 
                error={errors.chronicConditions} 
                touched={touched.chronicConditions} 
              />

              {/* Referral Information */}
              <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-6 pt-4 border-t border-gray-200">Referral Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <Input 
                  label="Referred By" 
                  name="referredBy" 
                  icon={User} 
                  placeholder="Doctor name" 
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
                <Select 
                  label="Department" 
                  name="department" 
                  options={departmentOptions} 
                  placeholder="Select Department" 
                  value={formData.department} 
                  onChange={handleChange} 
                  onBlur={handleBlur} 
                  error={errors.department} 
                  touched={touched.department} 
                />
              </div>

              {/* Additional Notes */}
              <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-6 pt-4 border-t border-gray-200">Additional Notes</h3>
              
              
              {/* Account Details */}
              <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-6 pt-4 border-t border-gray-200">Account Details (Optional)</h3>
              <p className="text-sm text-gray-500 mb-4">Setting a password allows the patient to access the patient portal</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="relative">
                  <Input 
                    label="Password" 
                    name="password" 
                    type={showPassword ? "text" : "password"} 
                    icon={Lock} 
                    placeholder="Create password" 
                    value={formData.password} 
                    onChange={handleChange} 
                    onBlur={handleBlur} 
                    error={errors.password} 
                    touched={touched.password} 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute right-3 top-9 text-gray-400"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                
                <div className="relative">
                  <Input 
                    label="Confirm Password" 
                    name="confirmPassword" 
                    type={showConfirmPassword ? "text" : "password"} 
                    icon={Lock} 
                    placeholder="Confirm password" 
                    value={formData.confirmPassword} 
                    onChange={handleChange} 
                    onBlur={handleBlur} 
                    error={errors.confirmPassword} 
                    touched={touched.confirmPassword} 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                    className="absolute right-3 top-9 text-gray-400"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end gap-3 rounded-b-lg">
              <Button variant="outline" onClick={handleGoBack}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="primary" 
                disabled={isSubmitting || isCreateLoading} 
                loading={isSubmitting || isCreateLoading}
              >
                {isSubmitting || isCreateLoading ? 'Saving...' : 'Save Patient'}
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </div>
  );
};

export default AddPatient;