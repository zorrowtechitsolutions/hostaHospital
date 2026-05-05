import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  User, Mail, Phone, Calendar, MapPin, Lock, Image, 
  AlertCircle, ArrowLeft, Heart, Users, 
  FileText, Briefcase, Clock, ChevronRight, Home,
  Activity, Shield, Baby, AlertTriangle, Save, Upload, X
} from 'lucide-react';

const EditPatient = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const patientFromState = location.state?.patient;
  
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
    country: '',
    city: '',
    state: '',
    pinCode: '',
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
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [originalPatientId, setOriginalPatientId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Mock S3 upload function - replace with actual AWS SDK implementation
  const uploadToS3 = async (file) => {
    // This is a mock implementation. Replace with actual S3 upload logic.
    // For production, you would typically:
    // 1. Get a pre-signed URL from your backend
    // 2. Upload directly to S3 using that URL
    
    return new Promise((resolve, reject) => {
      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          // Return a mock S3 URL
          const mockS3Url = `https://your-bucket.s3.amazonaws.com/patient-images/${Date.now()}-${file.name}`;
          resolve(mockS3Url);
        }
      }, 200);
    });
  };

  // Populate form data when patient prop changes
  useEffect(() => {
    if (patientFromState) {
      const nameParts = patientFromState.name?.split(' ') || ['', '', ''];
      const firstName = nameParts[0] || '';
      const lastName = nameParts[nameParts.length - 1] || '';
      const middleName = nameParts.slice(1, -1).join(' ') || '';
      
      setFormData({
        profileImage: null,
        firstName: patientFromState.firstName || firstName,
        middleName: patientFromState.middleName || middleName,
        lastName: patientFromState.lastName || lastName,
        bloodGroup: patientFromState.bloodGroup || patientFromState.bloodType || '',
        age: patientFromState.age || '',
        dob: patientFromState.dob || '',
        gender: patientFromState.gender || '',
        maritalStatus: patientFromState.maritalStatus || '',
        mobileNumber: patientFromState.phone || patientFromState.mobileNumber || '',
        emergencyNumber: patientFromState.emergencyNumber || '',
        guardianName: patientFromState.guardianName || '',
        guardianRelation: patientFromState.guardianRelation || '',
        addressLine1: patientFromState.addressLine1 || patientFromState.address || '',
        addressLine2: patientFromState.addressLine2 || '',
        country: patientFromState.country || '',
        city: patientFromState.city || '',
        state: patientFromState.state || '',
        pinCode: patientFromState.pinCode || '',
        referredBy: patientFromState.referredBy || patientFromState.doctor || '',
        referredOn: patientFromState.referredOn || '',
        department: patientFromState.department || '',
        notes: patientFromState.notes || '',
        height: patientFromState.height || '',
        weight: patientFromState.weight || '',
        bloodPressure: patientFromState.bloodPressure || '',
        allergies: patientFromState.allergies || '',
        chronicConditions: patientFromState.chronicConditions || '',
        occupation: patientFromState.occupation || '',
        email: patientFromState.email || '',
      });
      
      setPreviewImage(patientFromState.imageUrl || null);
      setOriginalPatientId(patientFromState.id);
    }
  }, [patientFromState]);

  // If no patient is passed, redirect to patients list
  useEffect(() => {
    if (!patientFromState) {
      navigate('/patients');
    }
  }, [patientFromState, navigate]);

  // Validation functions
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

      default:
        return '';
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const fieldsToValidate = [
      'firstName', 'lastName', 'mobileNumber', 'age', 'dob', 
      'gender', 'bloodGroup', 'addressLine1'
    ];
    
    fieldsToValidate.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });

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

    // Auto-calculate age when DOB changes
    if (name === 'dob' && value) {
      const today = new Date();
      const birthDate = new Date(value);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age > 0 && age <= 120) {
        setFormData(prev => ({ ...prev, age: age.toString() }));
      }
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  // STANDARD IMAGE UPLOAD HANDLER WITH S3 UPLOAD
  const handleImageUpload = async (file) => {
    if (!file) return false;
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, profileImage: 'File size must be less than 5MB' }));
      return false;
    }
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, profileImage: 'Only JPEG, PNG, GIF, and WEBP files are allowed' }));
      return false;
    }
    
    setErrors(prev => ({ ...prev, profileImage: '' }));
    setUploadProgress(0);
    
    // Create preview immediately
    const reader = new FileReader();
    reader.onloadend = () => setPreviewImage(reader.result);
    reader.readAsDataURL(file);
    
    // Upload to S3
    try {
      const s3Url = await uploadToS3(file);
      setFormData(prev => ({ ...prev, profileImage: s3Url }));
      setUploadProgress(100);
      return true;
    } catch (error) {
      console.error('S3 upload error:', error);
      setErrors(prev => ({ ...prev, profileImage: 'Failed to upload image. Please try again.' }));
      setPreviewImage(patientFromState?.imageUrl || null);
      return false;
    }
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const allFields = [
      'firstName', 'lastName', 'mobileNumber', 'age', 'dob', 
      'gender', 'bloodGroup', 'addressLine1'
    ];
    const touchedFields = {};
    allFields.forEach(field => touchedFields[field] = true);
    setTouched(touchedFields);
    
    if (validateForm()) {
      setIsSubmitting(true);
      
      setTimeout(() => {
        const updatedPatient = {
          ...patientFromState,
          id: originalPatientId,
          firstName: formData.firstName,
          middleName: formData.middleName,
          lastName: formData.lastName,
          name: `${formData.firstName} ${formData.middleName ? formData.middleName + ' ' : ''}${formData.lastName}`,
          age: formData.age,
          dob: formData.dob,
          gender: formData.gender,
          bloodGroup: formData.bloodGroup,
          bloodType: formData.bloodGroup,
          maritalStatus: formData.maritalStatus,
          phone: formData.mobileNumber,
          mobileNumber: formData.mobileNumber,
          emergencyNumber: formData.emergencyNumber,
          guardianName: formData.guardianName,
          guardianRelation: formData.guardianRelation,
          address: `${formData.addressLine1} ${formData.addressLine2}`,
          addressLine1: formData.addressLine1,
          addressLine2: formData.addressLine2,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          pinCode: formData.pinCode,
          referredBy: formData.referredBy,
          doctor: formData.referredBy,
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
          // Use S3 URL if new image uploaded, otherwise keep existing
          imageUrl: formData.profileImage || previewImage || patientFromState.imageUrl
        };
        
        // Get existing patients from localStorage
        const existingPatients = JSON.parse(localStorage.getItem('patients') || '[]');
        const updatedPatients = existingPatients.map(p => 
          p.id === originalPatientId ? updatedPatient : p
        );
        localStorage.setItem('patients', JSON.stringify(updatedPatients));
        
        alert('Patient updated successfully!');
        setIsSubmitting(false);
        navigate('/patients');
      }, 1000);
    } else {
      const firstError = document.querySelector('.error-message');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  // Removed alert from go back - now navigates directly
  const handleGoBack = () => {
    navigate('/patients');
  };

  const InputField = ({ label, name, type = "text", required = true, icon: Icon, placeholder }) => {
    const hasError = errors[name] && touched[name];
    
    return (
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon className={`h-4 w-4 ${hasError ? 'text-red-400' : 'text-gray-400'}`} />
            </div>
          )}
          <input
            type={type}
            name={name}
            value={formData[name] || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`w-full px-3 py-2 ${Icon ? 'pl-9' : 'pl-3'} pr-3 border rounded-lg focus:ring-2 focus:outline-none transition-all duration-200 text-sm
              ${hasError 
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                : touched[name] && !errors[name] && formData[name]
                  ? 'border-green-500 focus:ring-green-500 focus:border-green-500'
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              }`}
            placeholder={placeholder}
          />
          {hasError && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <AlertCircle className="h-4 w-4 text-red-500" />
            </div>
          )}
        </div>
        {hasError && (
          <p className="text-xs text-red-500 error-message">{errors[name]}</p>
        )}
        {touched[name] && !errors[name] && formData[name] && (
          <p className="text-xs text-green-500">✓ Valid</p>
        )}
      </div>
    );
  };

  const SelectField = ({ label, name, required = true, options, placeholder }) => {
    const hasError = errors[name] && touched[name];
    
    return (
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <select
          name={name}
          value={formData[name] || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-all duration-200 text-sm
            ${hasError 
              ? 'border-red-500 focus:ring-red-500' 
              : touched[name] && !errors[name] && formData[name]
                ? 'border-green-500 focus:ring-green-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
        >
          <option value="">{placeholder || `Select ${label}`}</option>
          {options.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        {hasError && (
          <p className="text-xs text-red-500 error-message">{errors[name]}</p>
        )}
      </div>
    );
  };

  const TextAreaField = ({ label, name, required = false, rows = 3, placeholder }) => {
    const hasError = errors[name] && touched[name];
    
    return (
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <textarea
          name={name}
          value={formData[name] || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          rows={rows}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-all duration-200 text-sm
            ${hasError 
              ? 'border-red-500 focus:ring-red-500' 
              : 'border-gray-300 focus:ring-blue-500'
            }`}
          placeholder={placeholder}
        />
        {hasError && (
          <p className="text-xs text-red-500 error-message">{errors[name]}</p>
        )}
      </div>
    );
  };

  if (!patientFromState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading patient data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={handleGoBack}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              title="Go back to Patients List"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Patient</h1>
              <p className="text-sm text-gray-500 mt-1">Update patient profile information</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
              <p className="text-sm text-gray-500 mt-0.5">Patient's personal and medical details</p>
            </div>
            
            <div className="p-6 space-y-6">
              {/* STANDARD BUTTON IMAGE UPLOAD SECTION - LIKE ADD DOCTOR */}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Image
                  </label>
                  
                  {/* STANDARD BUTTON - NO DRAG & DROP ZONE */}
                  <div>
                    <input
                      id="profileImageInput"
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById('profileImageInput').click()}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors shadow-sm"
                      disabled={isSubmitting}
                    >
                      <Upload className="h-4 w-4" />
                      Upload New Image
                    </button>
                    <p className="text-xs text-gray-400 mt-2">
                      JPEG, PNG, GIF, WEBP accepted. Max 5MB
                    </p>
                  </div>
                  
                  {/* Upload Progress Bar */}
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="mt-2">
                      <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#1C62A0] transition-all duration-300 rounded-full"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Uploading to cloud... {uploadProgress}%</p>
                    </div>
                  )}
                  
                  {errors.profileImage && (
                    <p className="text-xs text-red-500 mt-2">{errors.profileImage}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <InputField label="First Name" name="firstName" icon={User} placeholder="Enter first name" />
                <InputField label="Middle Name" name="middleName" required={false} icon={User} placeholder="Enter middle name" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <InputField label="Last Name" name="lastName" icon={User} placeholder="Enter last name" />
                <SelectField 
                  label="Blood Group" 
                  name="bloodGroup" 
                  options={['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']}
                  placeholder="Select Blood Group"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <InputField label="Age" name="age" type="number" icon={Clock} placeholder="Age in years" />
                <InputField label="Date of Birth" name="dob" type="date" icon={Calendar} />
                <SelectField label="Gender" name="gender" options={['Male', 'Female', 'Other']} placeholder="Select Gender" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <SelectField 
                  label="Marital Status" 
                  name="maritalStatus" 
                  required={false}
                  options={['Single', 'Married', 'Divorced', 'Widowed']}
                  placeholder="Select Marital Status"
                />
                <InputField label="Occupation" name="occupation" required={false} icon={Briefcase} placeholder="Occupation" />
              </div>
            </div>
          </div>

          {/* Contact Information Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>
              <p className="text-sm text-gray-500 mt-0.5">Phone numbers and guardian details</p>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <InputField label="Mobile Number" name="mobileNumber" icon={Phone} placeholder="+1 234 567 8900" />
                <InputField label="Emergency Number" name="emergencyNumber" required={false} icon={AlertTriangle} placeholder="Emergency contact" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <InputField label="Guardian Name" name="guardianName" required={false} icon={Users} placeholder="Parent or guardian name" />
                <SelectField 
                  label="Guardian Relation" 
                  name="guardianRelation" 
                  required={false}
                  options={['Father', 'Mother', 'Spouse', 'Son', 'Daughter', 'Other']}
                  placeholder="Relationship"
                />
              </div>

              <InputField label="Email Address" name="email" type="email" required={false} icon={Mail} placeholder="patient@example.com" />
            </div>
          </div>

          {/* Address Information Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-900">Address Information</h2>
              <p className="text-sm text-gray-500 mt-0.5">Residential address details</p>
            </div>
            
            <div className="p-6 space-y-5">
              <InputField label="Address Line 1" name="addressLine1" icon={MapPin} placeholder="Street address" />
              <InputField label="Address Line 2" name="addressLine2" required={false} placeholder="Apartment, suite, unit, etc." />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <SelectField 
                  label="Country" 
                  name="country" 
                  required={false}
                  options={['United States', 'United Kingdom', 'Canada', 'Australia', 'India', 'Germany', 'France']}
                  placeholder="Select Country"
                />
                <InputField label="City" name="city" required={false} placeholder="City" />
                <InputField label="State" name="state" required={false} placeholder="State" />
                <InputField label="Pin Code" name="pinCode" required={false} placeholder="Postal code" />
              </div>
            </div>
          </div>

          {/* Medical Information Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-900">Medical Information</h2>
              <p className="text-sm text-gray-500 mt-0.5">Health metrics and clinical notes</p>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <InputField label="Height (cm)" name="height" type="number" required={false} icon={Activity} placeholder="cm" />
                <InputField label="Weight (kg)" name="weight" type="number" required={false} icon={Activity} placeholder="kg" />
                <InputField label="Blood Pressure" name="bloodPressure" required={false} icon={Heart} placeholder="e.g., 120/80" />
              </div>

              <TextAreaField label="Allergies" name="allergies" rows="2" placeholder="List any allergies (medications, food, etc.)" />
              <TextAreaField label="Chronic Conditions" name="chronicConditions" rows="2" placeholder="Diabetes, hypertension, asthma, etc." />
            </div>
          </div>

          {/* Referral Information Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-900">Referral Information</h2>
              <p className="text-sm text-gray-500 mt-0.5">Referring doctor and department details</p>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <InputField label="Referred By" name="referredBy" required={false} icon={User} placeholder="Doctor name" />
                <InputField label="Referred On" name="referredOn" type="date" required={false} icon={Calendar} />
                <SelectField 
                  label="Department" 
                  name="department" 
                  required={false}
                  options={['Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'Dermatology', 'Psychiatry', 'Radiology', 'Surgery', 'Pulmonology']}
                  placeholder="Select Department"
                />
              </div>
            </div>
          </div>

          {/* Additional Notes Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-900">Additional Notes</h2>
              <p className="text-sm text-gray-500 mt-0.5">Clinical observations and remarks</p>
            </div>
            
            <div className="p-6">
              <TextAreaField label="Notes" name="notes" rows="4" placeholder="Any additional information about the patient..." />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button 
              type="button" 
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={handleGoBack}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#1C62A0] hover:bg-[#154a7d] text-white text-sm font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPatient;