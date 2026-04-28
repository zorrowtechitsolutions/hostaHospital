import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { User, Mail, Phone, Calendar, MapPin, Lock, Image, DollarSign, IdCard, AlertCircle, ArrowLeft } from 'lucide-react';

const EditDoctor = () => {
  const navigate = useNavigate();
  let { id } = useParams();
  
  // Enhanced ID cleaning
  if (id) {
    console.log('Raw ID from URL:', id);
    // Remove any non-numeric characters
    id = id.replace(/[^0-9]/g, '');
    // Convert to number
    id = parseInt(id);
    console.log('Cleaned ID:', id);
  }
  
  // Rest of your code...  
  const [loading, setLoading] = useState(true);
  const [doctorNotFound, setDoctorNotFound] = useState(false);
  
  const [formData, setFormData] = useState({
    profileImage: null,
    firstName: '',
    lastName: '',
    department: '',
    specialist: '',
    fees: '',
    phoneNumber: '',
    email: '',
    dob: '',
    gender: '',
    registrationNumber: '',
    knownLanguages: '',
    about: '',
    address: '',
    country: '',
    state: '',
    city: '',
    pinCode: '',
    displayName: '',
    userName: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load doctor data from localStorage on component mount
  useEffect(() => {
    const loadDoctorData = () => {
      const existingDoctors = JSON.parse(localStorage.getItem('doctors') || '[]');
      
      console.log('Looking for doctor with ID (cleaned):', id);
      console.log('Available doctors:', existingDoctors);
      
      // Find doctor by ID
      const doctor = existingDoctors.find(doc => doc.id === id);
      
      if (!doctor) {
        setDoctorNotFound(true);
        setLoading(false);
        return;
      }
      
      // Parse doctor name to get first and last name
      const nameWithoutDr = doctor.name?.replace('Dr. ', '') || '';
      const nameParts = nameWithoutDr.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Pre-fill form with existing doctor data
      setFormData({
        profileImage: doctor.photo || null,
        firstName: firstName,
        lastName: lastName,
        department: doctor.specialty || doctor.department || '',
        specialist: doctor.specialty || '',
        fees: doctor.fees || '',
        phoneNumber: doctor.phone || '',
        email: doctor.email || '',
        dob: doctor.dob || '',
        gender: doctor.gender || '',
        registrationNumber: doctor.registrationNumber || '',
        knownLanguages: doctor.knownLanguages || '',
        about: doctor.about || '',
        address: doctor.address || '',
        country: doctor.country || '',
        state: doctor.state || '',
        city: doctor.city || '',
        pinCode: doctor.pinCode || '',
        displayName: doctor.displayName || doctor.name || '',
        userName: doctor.userName || '',
        password: '',
        confirmPassword: ''
      });
      
      // Set preview image if exists
      if (doctor.photo && (doctor.photo.startsWith('data:') || doctor.photo?.startsWith('http'))) {
        setPreviewImage(doctor.photo);
      }
      
      setLoading(false);
    };
    
    if (id && !isNaN(id)) {
      loadDoctorData();
    } else {
      setDoctorNotFound(true);
      setLoading(false);
    }
  }, [id]);

  // Validation functions (same as your AddDoctor)
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

      case 'department':
        if (!value) return 'Department is required';
        return '';

      case 'specialist':
        if (!value) return 'Specialist field is required';
        if (value.length < 3) return 'Specialist must be at least 3 characters';
        return '';

      case 'fees':
        if (!value) return 'Fees are required';
        if (isNaN(value) || value <= 0) return 'Fees must be a positive number';
        if (value > 10000) return 'Fees cannot exceed $10,000';
        return '';

      case 'phoneNumber':
        if (!value) return 'Phone number is required';
        const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{3,4}[-\s\.]?[0-9]{3,4}$/;
        if (!phoneRegex.test(value)) return 'Please enter a valid phone number';
        return '';

      case 'email':
        if (!value) return 'Email address is required';
        const emailRegex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
        if (!emailRegex.test(value)) return 'Please enter a valid email address';
        if (value.length > 100) return 'Email must be less than 100 characters';
        return '';

      case 'dob':
        if (!value) return 'Date of birth is required';
        const age = new Date().getFullYear() - new Date(value).getFullYear();
        if (age < 25) return 'Doctor must be at least 25 years old';
        if (age > 80) return 'Doctor must be less than 80 years old';
        return '';

      case 'gender':
        if (!value) return 'Gender is required';
        return '';

      case 'registrationNumber':
        if (!value) return 'Registration number is required';
        if (value.length < 5) return 'Registration number must be at least 5 characters';
        if (!/^[A-Z0-9\-]+$/.test(value)) return 'Registration number can only contain uppercase letters, numbers, and hyphens';
        return '';

      case 'knownLanguages':
        if (!value) return 'At least one language is required';
        return '';

      case 'address':
        if (!value) return 'Address is required';
        if (value.length < 10) return 'Please enter a complete address';
        return '';

      case 'pinCode':
        if (value && !/^\d{5,6}$/.test(value)) return 'Pin code must be 5 or 6 digits';
        return '';

      case 'userName':
        if (value && value.length < 4) return 'Username must be at least 4 characters';
        if (value && !/^[a-zA-Z0-9_]+$/.test(value)) return 'Username can only contain letters, numbers, and underscores';
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
      'firstName', 'lastName', 'department', 'specialist', 'fees', 
      'phoneNumber', 'email', 'dob', 'gender', 'registrationNumber', 
      'knownLanguages', 'address'
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
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, profileImage: 'File size must be less than 5MB' }));
        return;
      }
      
      const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, profileImage: 'Only JPEG, PNG, and GIF files are allowed' }));
        return;
      }
      
      setErrors(prev => ({ ...prev, profileImage: '' }));
      setFormData(prev => ({ ...prev, profileImage: file }));
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, profileImage: null }));
    setPreviewImage(null);
    setErrors(prev => ({ ...prev, profileImage: '' }));
  };

  const calculateExperience = (dob) => {
    if (!dob) return '0+ Years';
    const birthDate = new Date(dob);
    const today = new Date();
    let experience = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      experience--;
    }
    const experienceYears = Math.max(0, experience - 25);
    return `${experienceYears}+ Years`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const allFields = [
      'firstName', 'lastName', 'department', 'specialist', 'fees', 
      'phoneNumber', 'email', 'dob', 'gender', 'registrationNumber', 
      'knownLanguages', 'address'
    ];
    const touchedFields = {};
    allFields.forEach(field => touchedFields[field] = true);
    setTouched(touchedFields);
    
    if (validateForm()) {
      setIsSubmitting(true);
      
      setTimeout(() => {
        const existingDoctors = JSON.parse(localStorage.getItem('doctors') || '[]');
        
        // Find index of doctor to update
        const doctorIndex = existingDoctors.findIndex(doc => doc.id === id);
        
        if (doctorIndex !== -1) {
          const updatedDoctor = {
            ...existingDoctors[doctorIndex],
            name: `Dr. ${formData.firstName} ${formData.lastName}`,
            specialty: formData.specialist,
            experience: calculateExperience(formData.dob),
            email: formData.email,
            phone: formData.phoneNumber,
            photo: previewImage || existingDoctors[doctorIndex].photo,
            department: formData.department,
            fees: formData.fees,
            dob: formData.dob,
            gender: formData.gender,
            registrationNumber: formData.registrationNumber,
            knownLanguages: formData.knownLanguages,
            about: formData.about,
            address: formData.address,
            country: formData.country,
            state: formData.state,
            city: formData.city,
            pinCode: formData.pinCode,
            displayName: formData.displayName,
            userName: formData.userName,
            appointments: existingDoctors[doctorIndex].appointments || 0,
            ...(formData.password && { password: formData.password })
          };
          
          existingDoctors[doctorIndex] = updatedDoctor;
          localStorage.setItem('doctors', JSON.stringify(existingDoctors));
          
          alert('Doctor updated successfully!');
          setIsSubmitting(false);
          navigate('/doctors');
        } else {
          alert('Doctor not found!');
          setIsSubmitting(false);
        }
      }, 1000);
    } else {
      const firstError = document.querySelector('.error-message');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const handleGoBack = () => {
    if (window.confirm('Are you sure you want to go back? Any unsaved changes will be lost.')) {
      navigate('/doctors');
    }
  };

  // Form field components
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
            value={formData[name]}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`w-full px-3 py-2 ${Icon ? 'pl-9' : 'pl-3'} pr-3 border rounded-lg focus:ring-2 focus:outline-none transition-all duration-200 text-sm
              ${hasError 
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                : touched[name] && !errors[name]
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
          value={formData[name]}
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
          value={formData[name]}
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading doctor data...</p>
        </div>
      </div>
    );
  }

  // Not found state
  if (doctorNotFound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 rounded-full h-20 w-20 flex items-center justify-center mx-auto">
            <AlertCircle className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mt-4">Doctor Not Found</h2>
          <p className="text-gray-600 mt-2">The doctor you're trying to edit doesn't exist.</p>
          <button
            onClick={() => navigate('/doctors')}
            className="mt-6 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Back to Doctors List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={handleGoBack}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              title="Go back to Doctors List"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Doctor</h1>
              <p className="text-sm text-gray-500 mt-1">Update doctor profile in the system</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
              <p className="text-sm text-gray-500 mt-0.5">Doctor's personal and professional details</p>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Profile Image */}
              <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center border-2 border-gray-200 overflow-hidden">
                    {previewImage ? (
                      <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <Image className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Profile Image</label>
                  <div className="flex gap-3">
                    <label className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors">
                      Upload New Image
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>
                    {previewImage && (
                      <button type="button" onClick={removeImage} className="px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm font-medium text-red-600 hover:bg-red-100 transition-colors">
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">JPEG, PNG, GIF accepted. Max 5MB</p>
                  {errors.profileImage && (
                    <p className="text-xs text-red-500 mt-1">{errors.profileImage}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Doctor ID:</span>
                  <span className="text-sm font-medium text-gray-900">#{String(id).padStart(4, '0')}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <InputField label="First Name" name="firstName" icon={User} placeholder="Enter first name" />
                <InputField label="Last Name" name="lastName" icon={User} placeholder="Enter last name" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <SelectField 
                  label="Department" 
                  name="department" 
                  options={['Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'Dermatology', 'Psychiatry', 'Radiology', 'Surgery']}
                  placeholder="Select Department"
                />
                <InputField label="Specialist" name="specialist" icon={IdCard} placeholder="e.g., Cardiologist" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <InputField label="Fees ($)" name="fees" type="number" icon={DollarSign} placeholder="0.00" />
                <InputField label="Phone Number" name="phoneNumber" icon={Phone} placeholder="+1 234 567 8900" />
                <InputField label="Email Address" name="email" type="email" icon={Mail} placeholder="doctor@example.com" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <InputField label="Date of Birth" name="dob" type="date" icon={Calendar} />
                <SelectField label="Gender" name="gender" options={['Male', 'Female', 'Other']} placeholder="Select Gender" />
                <InputField label="Registration Number" name="registrationNumber" icon={IdCard} placeholder="Medical license number" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <SelectField 
                  label="Known Languages" 
                  name="knownLanguages" 
                  options={['English', 'Spanish', 'French', 'German', 'Chinese', 'Arabic', 'Hindi', 'Russian', 'Japanese']}
                  placeholder="Select Language"
                />
              </div>

              <TextAreaField label="About" name="about" rows="3" placeholder="Write a brief description about the doctor's experience, qualifications, and expertise..." />
            </div>
          </div>

          {/* Address Information Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-900">Address Information</h2>
              <p className="text-sm text-gray-500 mt-0.5">Clinic or hospital address details</p>
            </div>
            
            <div className="p-6 space-y-5">
              <InputField label="Address" name="address" icon={MapPin} required={true} placeholder="Street address" />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <SelectField 
                  label="Country" 
                  name="country" 
                  required={false}
                  options={['United States', 'United Kingdom', 'Canada', 'Australia', 'India', 'Germany', 'France']}
                  placeholder="Select Country"
                />
                <InputField label="State" name="state" required={false} placeholder="State" />
                <InputField label="City" name="city" required={false} placeholder="City" />
                <InputField label="Pin Code" name="pinCode" required={false} placeholder="Postal code" />
              </div>
            </div>
          </div>

          {/* Account Details Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-900">Account Details</h2>
              <p className="text-sm text-gray-500 mt-0.5">Login credentials for the doctor portal (leave password blank to keep current)</p>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <InputField label="Display Name" name="displayName" required={false} icon={User} placeholder="How name appears on profile" />
                <InputField label="Username" name="userName" required={false} icon={User} placeholder="Unique username" />
                <InputField label="New Password" name="password" type="password" required={false} icon={Lock} placeholder="Leave blank to keep current" />
                <InputField label="Confirm New Password" name="confirmPassword" type="password" required={false} icon={Lock} placeholder="Confirm new password" />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button 
              type="button" 
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={handleGoBack}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#1C62A0] hover:bg-[#154a7d] text-white text-sm font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Updating...' : 'Update Doctor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditDoctor;