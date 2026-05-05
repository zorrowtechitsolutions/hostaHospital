// AddStaff.jsx - Page component for adding new staff with inline validation and status toggle
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Save, X, AlertCircle, Upload } from 'lucide-react';

const AddStaff = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('basic');
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [formData, setFormData] = useState({
    // Basic Info
    id: '',
    name: '',
    gender: 'Male',
    dob: '',
    mobile: '',
    email: '',
    designation: '',
    appointmentDate: '',
    staffType: 'Permanent',
    jobType: 'Full Time',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    country: '',
    pinCode: '',
    status: true,
    profileImage: null, // Changed to store S3 URL
    
    // Salary Info
    netSalary: '',
    basic: '',
    da: '',
    hra: '',
    conveyance: '',
    allowance: '',
    medicalAllowance: '',
    otherEarnings: '',
    tds: '',
    pf: '',
    leave: '',
    profTax: '',
    labourWelfare: '',
    otherDeductions: ''
  });

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
          const mockS3Url = `https://your-bucket.s3.amazonaws.com/staff-images/${Date.now()}-${file.name}`;
          resolve(mockS3Url);
        }
      }, 200);
    });
  };

  // Validation functions
  const validateName = (name) => {
    if (!name || name.trim() === '') return 'Full name is required';
    if (name.length < 2) return 'Name must be at least 2 characters';
    if (name.length > 50) return 'Name must be less than 50 characters';
    return '';
  };

  const validateMobile = (mobile) => {
    if (!mobile || mobile.trim() === '') return 'Mobile number is required';
    const mobileRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{3,5}[-\s\.]?[0-9]{4,6}$/;
    if (!mobileRegex.test(mobile)) return 'Please enter a valid mobile number';
    return '';
  };

  const validateEmail = (email) => {
    if (!email || email.trim() === '') return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return '';
  };

  const validateDesignation = (designation) => {
    if (!designation) return 'Designation is required';
    return '';
  };

  const validateDob = (dob) => {
    if (dob) {
      const today = new Date();
      const birthDate = new Date(dob);
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 18 && age > 0) return 'Staff must be at least 18 years old';
      if (age > 70) return 'Age cannot exceed 70 years';
    }
    return '';
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'name': return validateName(value);
      case 'mobile': return validateMobile(value);
      case 'email': return validateEmail(value);
      case 'designation': return validateDesignation(value);
      case 'dob': return validateDob(value);
      default: return '';
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  // Generate next staff ID
  const generateStaffId = () => {
    const existingStaffs = JSON.parse(localStorage.getItem('staffs') || '[]');
    const maxNum = existingStaffs.reduce((max, s) => {
      const match = s.id.match(/#SF(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, 0);
    const newNum = maxNum + 1;
    return `#SF${String(newNum).padStart(4, '0')}`;
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (submitError) setSubmitError('');
  };

  // Handle status toggle
  const handleStatusToggle = () => {
    setFormData(prev => ({
      ...prev,
      status: !prev.status
    }));
  };

  // STANDARD IMAGE UPLOAD HANDLER WITH S3 UPLOAD
  const handleImageUpload = async (file) => {
    if (!file) return false;
    
    // Validate file size (max 2MB as per original)
    if (file.size > 2 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, profileImage: 'Image size must be less than 2MB' }));
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
      setPreviewImage(null);
      return false;
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({
      ...prev,
      profileImage: null
    }));
    setPreviewImage(null);
    setUploadProgress(0);
    setErrors(prev => ({ ...prev, profileImage: '' }));
  };

  // Validate all required fields
  const validateForm = () => {
    const newErrors = {};
    const requiredFields = ['name', 'mobile', 'email', 'designation'];
    
    requiredFields.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });
    
    // Validate DOB if provided
    const dobError = validateDob(formData.dob);
    if (dobError) newErrors.dob = dobError;
    
    setErrors(newErrors);
    
    // Mark all fields as touched
    const allTouched = {};
    Object.keys(formData).forEach(key => {
      allTouched[key] = true;
    });
    setTouched(allTouched);
    
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!validateForm()) {
      // Switch to basic tab if there are errors there
      if (errors.name || errors.mobile || errors.email || errors.designation || errors.dob) {
        setActiveTab('basic');
      }
      return;
    }

    const today = new Date();
    const formattedDate = `${today.getDate().toString().padStart(2, ' ')} ${today.toLocaleString('default', { month: 'short' })} ${today.getFullYear()}`;
    const isoDate = today.toISOString().split('T')[0];

    const newStaff = {
      id: formData.id || generateStaffId(),
      name: formData.name,
      firstName: formData.name.split(' ')[0] || formData.name,
      lastName: formData.name.split(' ')[1] || '',
      gender: formData.gender,
      designation: formData.designation,
      phone: formData.mobile,
      email: formData.email,
      appointmentDate: formData.appointmentDate || isoDate,
      appointmentDateDisplay: formattedDate,
      patientsCount: 0,
      imageUrl: formData.profileImage || `https://i.pravatar.cc/80?u=${Date.now()}`, // Use S3 URL or fallback
      status: formData.status ? 'Active' : 'Inactive',
      jobType: formData.jobType,
      dob: formData.dob || 'N/A',
      address: `${formData.addressLine1} ${formData.addressLine2} ${formData.city} ${formData.state} ${formData.country} ${formData.pinCode}`.trim() || 'N/A',
      salary: formData.netSalary ? `$${formData.netSalary}` : '$0',
      joiningDate: formattedDate,
      department: formData.designation,
      staffType: formData.staffType,
      salaryTransactions: [],
      salaryDetails: {
        netSalary: formData.netSalary,
        earnings: {
          basic: formData.basic,
          da: formData.da,
          hra: formData.hra,
          conveyance: formData.conveyance,
          allowance: formData.allowance,
          medicalAllowance: formData.medicalAllowance,
          others: formData.otherEarnings
        },
        deductions: {
          tds: formData.tds,
          pf: formData.pf,
          leave: formData.leave,
          profTax: formData.profTax,
          labourWelfare: formData.labourWelfare,
          others: formData.otherDeductions
        }
      }
    };

    const existingStaffs = JSON.parse(localStorage.getItem('staffs') || '[]');
    const updatedStaffs = [newStaff, ...existingStaffs];
    localStorage.setItem('staffs', JSON.stringify(updatedStaffs));

    setSubmitSuccess(true);
    setTimeout(() => {
      navigate('/staffs');
    }, 1500);
  };

  const designations = ['Compounder', 'Nurse', 'Purchase Officer', 'Supervisor', 'Receptionist', 'Lab Assistant', 'Pharmacist', 'Doctor', 'Technician', 'Admin'];
  const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'Austin'];
  const states = ['California', 'Texas', 'New York', 'Florida', 'Illinois', 'Pennsylvania', 'Ohio', 'Georgia', 'North Carolina', 'Michigan'];
  const countries = ['United States', 'Canada', 'United Kingdom', 'Australia', 'India', 'Germany', 'France', 'Japan', 'Brazil', 'Mexico'];

  // Helper to render input with validation
  const renderInput = (name, label, type = 'text', placeholder = '', required = false, options = null) => {
    const hasError = touched[name] && errors[name];
    const value = formData[name];
    
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {options ? (
          <select
            name={name}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              hasError ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select {label}</option>
            {options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            name={name}
            placeholder={placeholder}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              hasError ? 'border-red-500' : 'border-gray-300'
            }`}
          />
        )}
        {hasError && (
          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
            <AlertCircle size={12} />
            {errors[name]}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50" style={{ background: '#f4f6f9', fontFamily: "'Segoe UI', sans-serif" }}>
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">
          Add New Staff
        </h1>
        <div className="text-sm text-gray-500 flex items-center gap-2">
          <span>Home</span>
          <ChevronRight size={14} />
          <span className="text-gray-700 font-medium">Staffs</span>
          <ChevronRight size={14} />
          <span className="text-gray-700 font-medium">Add Staff</span>
        </div>
      </div>

      {/* Success Message */}
      {submitSuccess && (
        <div className="fixed top-20 right-6 z-50 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg animate-pulse">
          Staff added successfully! Redirecting...
        </div>
      )}

      {/* Main Content */}
      <div className="p-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-200 px-6 pt-4">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('basic')}
                className={`pb-3 px-2 text-sm font-medium transition-colors ${
                  activeTab === 'basic'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Basic Info
              </button>
              <button
                onClick={() => setActiveTab('salary')}
                className={`pb-3 px-2 text-sm font-medium transition-colors ${
                  activeTab === 'salary'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Salary Info
              </button>
            </div>
          </div>

          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="p-6">
              {/* Profile Image Upload - UPDATED WITH S3 UPLOAD STYLE */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-6 pb-6 border-b border-gray-200">
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-gray-200 overflow-hidden shadow-sm">
                      {previewImage ? (
                        <img 
                          src={previewImage} 
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <span className="text-gray-400 text-3xl font-medium">
                            {formData.name ? formData.name.charAt(0).toUpperCase() : '?'}
                          </span>
                        </div>
                      )}
                    </div>
                    {previewImage && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
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
                    >
                      <Upload className="h-4 w-4" />
                      Upload Image
                    </button>
                    <p className="text-xs text-gray-400 mt-2">
                      JPEG, PNG, GIF, WEBP accepted. Max 2MB
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

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Staff ID</label>
                  <input
                    type="text"
                    name="id"
                    placeholder="Auto-generated"
                    value={formData.id}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                  <p className="text-xs text-gray-400 mt-1">Leave empty for auto-generation</p>
                </div>
                
                {renderInput('name', 'Full Name', 'text', 'Enter full name', true)}
                {renderInput('gender', 'Gender', 'select', '', false, ['Male', 'Female', 'Other'])}
                {renderInput('dob', 'Date of Birth', 'date', '', false)}
                {renderInput('mobile', 'Mobile Number', 'tel', '+1 00000 00000', true)}
                {renderInput('email', 'Email', 'email', 'staff@example.com', true)}
                {renderInput('designation', 'Designation', 'select', '', true, designations)}
                {renderInput('appointmentDate', 'Appointment Date', 'date', '', false)}
                {renderInput('staffType', 'Staff Type', 'select', '', false, ['Permanent', 'Contract', 'Temporary', 'Intern'])}
                {renderInput('jobType', 'Job Type', 'select', '', false, ['Full Time', 'Part Time', 'Remote', 'Hybrid'])}
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
                  <input
                    type="text"
                    name="addressLine1"
                    placeholder="Street address"
                    value={formData.addressLine1}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                  <input
                    type="text"
                    name="addressLine2"
                    placeholder="Apt, suite, unit (optional)"
                    value={formData.addressLine2}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                {renderInput('city', 'City', 'select', '', false, cities)}
                {renderInput('state', 'State', 'select', '', false, states)}
                {renderInput('country', 'Country', 'select', '', false, countries)}
                {renderInput('pinCode', 'Pin Code', 'text', 'Postal code', false)}
              </div>

              {/* Status Toggle Switch */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-3">Status</label>
                <button
                  type="button"
                  onClick={handleStatusToggle}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                    ${formData.status ? 'bg-green-600' : 'bg-gray-300'}
                  `}
                >
                  <span
                    className={`
                      inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${formData.status ? 'translate-x-6' : 'translate-x-1'}
                    `}
                  />
                </button>
                <span className="ml-3 text-sm text-gray-600">
                  {formData.status ? 'Active' : 'Inactive'}
                </span>
                <p className="text-xs text-gray-400 mt-1">
                  Toggle to activate or deactivate this staff member
                </p>
              </div>
            </div>
          )}

          {/* Salary Info Tab */}
          {activeTab === 'salary' && (
            <div className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Net Salary</label>
                <input
                  type="text"
                  name="netSalary"
                  placeholder="Enter net salary"
                  value={formData.netSalary}
                  onChange={handleChange}
                  className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <h4 className="text-md font-semibold text-gray-800 mb-4">Earnings</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <input
                  type="text"
                  name="basic"
                  placeholder="Basic"
                  value={formData.basic}
                  onChange={handleChange}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  name="da"
                  placeholder="DA"
                  value={formData.da}
                  onChange={handleChange}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  name="hra"
                  placeholder="HRA"
                  value={formData.hra}
                  onChange={handleChange}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  name="conveyance"
                  placeholder="Conveyance"
                  value={formData.conveyance}
                  onChange={handleChange}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  name="allowance"
                  placeholder="Allowance"
                  value={formData.allowance}
                  onChange={handleChange}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  name="medicalAllowance"
                  placeholder="Medical Allowance"
                  value={formData.medicalAllowance}
                  onChange={handleChange}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  name="otherEarnings"
                  placeholder="Others"
                  value={formData.otherEarnings}
                  onChange={handleChange}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <h4 className="text-md font-semibold text-gray-800 mb-4">Deductions</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <input
                  type="text"
                  name="tds"
                  placeholder="TDS"
                  value={formData.tds}
                  onChange={handleChange}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  name="pf"
                  placeholder="PF"
                  value={formData.pf}
                  onChange={handleChange}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  name="leave"
                  placeholder="Leave"
                  value={formData.leave}
                  onChange={handleChange}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  name="profTax"
                  placeholder="Prof. Tax"
                  value={formData.profTax}
                  onChange={handleChange}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  name="labourWelfare"
                  placeholder="Labour Welfare"
                  value={formData.labourWelfare}
                  onChange={handleChange}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  name="otherDeductions"
                  placeholder="Others"
                  value={formData.otherDeductions}
                  onChange={handleChange}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end gap-3">
            <button
              onClick={() => navigate('/staffs')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-[#1C62A0] text-white rounded-lg hover:bg-[#154a7d] transition-colors flex items-center gap-2"
            >
              <Save size={16} />
              Save Staff
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddStaff;