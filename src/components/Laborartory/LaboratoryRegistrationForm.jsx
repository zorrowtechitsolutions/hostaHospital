import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building, Phone, Mail, MapPin, Lock, AlertCircle, 
  ArrowLeft, Globe, Clock, FileText, PhoneCall, MapPinned, 
  ChevronDown, CheckCircle 
} from 'lucide-react';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const LaboratoryRegistrationForm = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    address: {
      country: '',
      state: '',
      district: '',
      place: '',
      pincode: '',
    },
    phone: '',
    emergencyContact: '',
    email: '',
    password: '',
    confirmPassword: '',
    latitude: '',
    longitude: '',
    about: '',
    web: '',
    working_hours: daysOfWeek.map(day => ({
      day,
      open: '09:00',
      close: '17:00',
      is_holiday: false,
    })),
  });

  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  // Validation functions
  const validateField = (name, value) => {
    switch (name) {
      case 'name':
        if (!value) return 'Laboratory name is required';
        if (value.length < 3) return 'Name must be at least 3 characters';
        if (value.length > 100) return 'Name must be less than 100 characters';
        return '';

      case 'phone':
        if (!value) return 'Phone number is required';
        const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{3,4}[-\s\.]?[0-9]{3,4}$/;
        if (!phoneRegex.test(value)) return 'Please enter a valid phone number';
        return '';

      case 'emergencyContact':
        if (!value) return 'Emergency contact is required';
        if (!phoneRegex.test(value)) return 'Please enter a valid emergency contact number';
        return '';

      case 'email':
        if (value) {
          const emailRegex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
          if (!emailRegex.test(value)) return 'Please enter a valid email address';
          if (value.length > 100) return 'Email must be less than 100 characters';
        }
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

      case 'address.place':
        if (!value) return 'Address is required';
        if (value.length < 5) return 'Please enter a complete address';
        return '';

      case 'address.pincode':
        if (!value) return 'Pincode is required';
        if (!/^\d{5,6}$/.test(String(value))) return 'Pincode must be 5 or 6 digits';
        return '';

      case 'latitude':
        if (!value && value !== 0) return 'Latitude is required';
        if (isNaN(value)) return 'Latitude must be a number';
        if (parseFloat(value) < -90 || parseFloat(value) > 90) return 'Latitude must be between -90 and 90';
        return '';

      case 'longitude':
        if (!value && value !== 0) return 'Longitude is required';
        if (isNaN(value)) return 'Longitude must be a number';
        if (parseFloat(value) < -180 || parseFloat(value) > 180) return 'Longitude must be between -180 and 180';
        return '';

      case 'about':
        if (!value) return 'About section is required';
        if (value.length < 50) return 'Please provide at least 50 characters describing the laboratory';
        if (value.length > 2000) return 'About section must be less than 2000 characters';
        return '';

      default:
        return '';
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Required fields
    const requiredFields = ['name', 'phone', 'emergencyContact', 'about'];
    requiredFields.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });

    // Address fields
    const addressPlaceError = validateField('address.place', formData.address.place);
    if (addressPlaceError) newErrors['address.place'] = addressPlaceError;
    
    const pincodeError = validateField('address.pincode', formData.address.pincode);
    if (pincodeError) newErrors['address.pincode'] = pincodeError;

    // Location fields
    const latError = validateField('latitude', formData.latitude);
    if (latError) newErrors.latitude = latError;
    
    const lngError = validateField('longitude', formData.longitude);
    if (lngError) newErrors.longitude = lngError;

    // Email if provided
    if (formData.email) {
      const emailError = validateField('email', formData.email);
      if (emailError) newErrors.email = emailError;
    }

    // Password if provided
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
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
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

  const handleWorkingHoursChange = (index, field, value) => {
    const updatedHours = [...(formData.working_hours || [])];
    updatedHours[index] = { ...updatedHours[index], [field]: value };
    setFormData(prev => ({ ...prev, working_hours: updatedHours }));
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
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setProfileImage(null);
    setPreviewImage(null);
    setErrors(prev => ({ ...prev, profileImage: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allFields = ['name', 'phone', 'emergencyContact', 'about', 'address.place', 'address.pincode', 'latitude', 'longitude'];
    const touchedFields = {};
    allFields.forEach(field => touchedFields[field] = true);
    setTouched(touchedFields);
    
    if (validateForm()) {
      setIsSubmitting(true);
      
      // Simulate API call
      setTimeout(() => {
        console.log('Form submitted successfully:', formData);
        
        // Get existing labs from localStorage
        const existingLabs = JSON.parse(localStorage.getItem('laboratories') || '[]');
        
        // Create new lab object
        const newLab = {
          id: Date.now(),
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          about: formData.about,
          logo: previewImage || null,
          status: 'Active',
          tests: 0,
          createdAt: new Date().toISOString(),
        };
        
        // Save to localStorage
        const updatedLabs = [...existingLabs, newLab];
        localStorage.setItem('laboratories', JSON.stringify(updatedLabs));
        
        alert('Laboratory registered successfully!');
        setIsSubmitting(false);
        
        // Navigate back to labs list
        navigate('/laboratories');
      }, 1000);
    } else {
      const firstError = document.querySelector('.error-message');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const handleGoBack = () => {
    if (window.confirm('Are you sure you want to go back? Any unsaved data will be lost.')) {
      navigate('/laboratories');
    }
  };

  // Helper function to get nested value
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  // Reusable Input Component
  const InputField = ({ label, name, type = "text", required = true, icon: Icon, placeholder }) => {
    const hasError = errors[name] && touched[name];
    const value = name.includes('.') 
      ? getNestedValue(formData, name)
      : formData[name];
    
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
            value={value || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`w-full px-3 py-2 ${Icon ? 'pl-9' : 'pl-3'} pr-3 border rounded-lg focus:ring-2 focus:outline-none transition-all duration-200 text-sm
              ${hasError 
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                : touched[name] && !errors[name] && value
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
        {touched[name] && !errors[name] && value && (
          <p className="text-xs text-green-500 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> Valid
          </p>
        )}
      </div>
    );
  };

  const SelectField = ({ label, name, required = true, options, placeholder }) => {
    const hasError = errors[name] && touched[name];
    const value = name.includes('.') 
      ? getNestedValue(formData, name)
      : formData[name];
    
    return (
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          <select
            name={name}
            value={value || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-all duration-200 text-sm appearance-none
              ${hasError 
                ? 'border-red-500 focus:ring-red-500' 
                : touched[name] && !errors[name] && value
                  ? 'border-green-500 focus:ring-green-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
          >
            <option value="">{placeholder || `Select ${label}`}</option>
            {options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
        {hasError && (
          <p className="text-xs text-red-500 error-message">{errors[name]}</p>
        )}
      </div>
    );
  };

  const TextAreaField = ({ label, name, required = false, rows = 3, placeholder }) => {
    const hasError = errors[name] && touched[name];
    const value = formData[name];
    
    return (
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <textarea
          name={name}
          value={value || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          rows={rows}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-all duration-200 text-sm resize-vertical
            ${hasError 
              ? 'border-red-500 focus:ring-red-500' 
              : 'border-gray-300 focus:ring-blue-500'
            }`}
          placeholder={placeholder}
        />
        {hasError && (
          <p className="text-xs text-red-500 error-message">{errors[name]}</p>
        )}
        {touched[name] && !errors[name] && value && value.length > 0 && (
          <p className="text-xs text-green-500 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> {value.length} characters
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={handleGoBack}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              title="Go back to Laboratories List"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Add New Laboratory</h1>
              <p className="text-sm text-gray-500 mt-1">Register a new diagnostic lab in the system</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tabs */}
          <div className="border-b border-gray-200 bg-white rounded-t-xl px-6 pt-4">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'basic', label: 'Basic Information', icon: Building },
                { id: 'address', label: 'Address & Location', icon: MapPin },
                { id: 'hours', label: 'Working Hours', icon: Clock },
                { id: 'about', label: 'About', icon: FileText },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Profile Image Section - Shown on all tabs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start gap-6 flex-wrap md:flex-nowrap">
                <div className="flex-shrink-0">
                  <div className="w-28 h-28 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-gray-200">
                    {previewImage ? (
                      <img src={previewImage} alt="Lab logo" className="w-full h-full object-cover" />
                    ) : (
                      <Building className="w-10 h-10 text-gray-400" />
                    )}
                  </div>
                  <div className="mt-3 text-center">
                    <label className="text-sm text-[#1C62A0] cursor-pointer hover:text-[#1C62A0]">
                      Upload Logo
                      <input type="file" accept="image/jpeg,image/png,image/gif" className="hidden" onChange={handleImageChange} />
                    </label>
                    {previewImage && (
                      <button type="button" onClick={removeImage} className="text-sm text-red-500 ml-2 hover:text-red-600">
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-center">JPEG, PNG, GIF. Max 5MB</p>
                  {errors.profileImage && (
                    <p className="text-xs text-red-500 mt-1 text-center">{errors.profileImage}</p>
                  )}
                </div>
                <div className="flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Lab ID:</span>
                      <span className="text-sm font-medium text-gray-900">Auto-generated</span>
                    </div>
                    <InputField 
                      label="Laboratory Name" 
                      name="name" 
                      icon={Building} 
                      placeholder="e.g., City Diagnostic Centre" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6">
              {/* Basic Information Tab */}
              {activeTab === 'basic' && (
                <div className="space-y-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InputField label="Phone Number" name="phone" icon={Phone} placeholder="+1 234 567 8900" />
                    <InputField label="Emergency Contact" name="emergencyContact" icon={PhoneCall} placeholder="+1 234 567 8900" />
                    <InputField label="Email Address" name="email" type="email" icon={Mail} placeholder="lab@example.com" required={false} />
                    <InputField label="Website" name="web" icon={Globe} placeholder="https://www.labwebsite.com" required={false} />
                  </div>
                  
                  <div className="border-t pt-5 mt-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Credentials (Optional)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <InputField label="Password" name="password" type="password" icon={Lock} placeholder="Create password" required={false} />
                      <InputField label="Confirm Password" name="confirmPassword" type="password" icon={Lock} placeholder="Confirm password" required={false} />
                    </div>
                  </div>
                </div>
              )}

              {/* Address & Location Tab */}
              {activeTab === 'address' && (
                <div className="space-y-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Address Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <SelectField 
                      label="Country" 
                      name="address.country" 
                      required={false}
                      options={['United States', 'United Kingdom', 'Canada', 'Australia', 'India', 'Germany', 'France']}
                      placeholder="Select Country"
                    />
                    <InputField label="State" name="address.state" required={false} placeholder="State" />
                    <InputField label="District" name="address.district" required={false} placeholder="District" />
                    <InputField label="Place / Area" name="address.place" icon={MapPin} placeholder="Street, area, locality" />
                    <InputField label="Pincode" name="address.pincode" type="text" placeholder="123456" />
                  </div>

                  <div className="border-t pt-5 mt-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">GPS Coordinates</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <InputField label="Latitude" name="latitude" type="number" step="any" icon={MapPinned} placeholder="40.7128" />
                      <InputField label="Longitude" name="longitude" type="number" step="any" icon={MapPinned} placeholder="-74.0060" />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Coordinates help display the laboratory location on maps</p>
                  </div>
                </div>
              )}

              {/* Working Hours Tab */}
              {activeTab === 'hours' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Operating Hours</h3>
                  <div className="space-y-3">
                    {formData.working_hours.map((session, index) => (
                      <div key={session.day} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg flex-wrap">
                        <div className="w-28 font-medium text-gray-700 text-sm">{session.day}</div>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={session.is_holiday}
                            onChange={(e) => handleWorkingHoursChange(index, 'is_holiday', e.target.checked)}
                            className="w-4 h-4 text-[#1C62A0] rounded focus:ring-[#1C62A0]"
                          />
                          <span className="text-sm text-gray-600">Holiday</span>
                        </label>
                        {!session.is_holiday && (
                          <div className="flex items-center gap-2">
                            <input
                              type="time"
                              value={session.open}
                              onChange={(e) => handleWorkingHoursChange(index, 'open', e.target.value)}
                              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1C62A0] focus:border-[#1C62A0]"
                            />
                            <span className="text-gray-500">to</span>
                            <input
                              type="time"
                              value={session.close}
                              onChange={(e) => handleWorkingHoursChange(index, 'close', e.target.value)}
                              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1C62A0] focus:border-[#1C62A0]"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* About Tab */}
              {activeTab === 'about' && (
                <div className="space-y-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Laboratory Information</h3>
                  <TextAreaField 
                    label="About the Laboratory" 
                    name="about" 
                    required={true}
                    rows={6}
                    placeholder="Write a detailed description about the laboratory including:"
                  />
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-[#1C62A0] flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>Provide comprehensive information about your laboratory including types of tests offered, accreditations, equipment, sample collection services, home collection availability, and reporting time.</span>
                    </p>
                  </div>
                </div>
              )}
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
              className="px-6 py-2.5 bg-[#1C62A0] hover:bg-[#154a7d] text-white text-sm font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Registering...
                </>
              ) : (
                'Register Laboratory'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LaboratoryRegistrationForm;