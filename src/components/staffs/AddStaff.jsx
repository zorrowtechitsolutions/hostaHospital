// src/components/staffs/AddStaff.jsx - Complete with avatar upload like AddDoctor
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Save, AlertCircle, Upload, X, Image } from 'lucide-react';
import { Button, Input, Select, Card, Tabs, Alert, Switch } from '../ui';

const AddStaff = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('basic');
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  
  const [formData, setFormData] = useState({
    id: '', name: '', gender: 'Male', dob: '', mobile: '', email: '',
    designation: '', appointmentDate: '', staffType: 'Permanent', jobType: 'Full Time',
    addressLine1: '', addressLine2: '', city: '', state: '', country: '', pinCode: '',
    status: true, profileImage: null,
    netSalary: '', basic: '', da: '', hra: '', conveyance: '', allowance: '',
    medicalAllowance: '', otherEarnings: '', tds: '', pf: '', leave: '',
    profTax: '', labourWelfare: '', otherDeductions: ''
  });

  // Image validation
  const validateImage = (file) => {
    if (!file) return true;
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, profileImage: 'File size must be less than 5MB' }));
      return false;
    }
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, profileImage: 'Only JPEG, PNG, GIF, and WEBP files are allowed' }));
      return false;
    }
    return true;
  };

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
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
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

  const generateStaffId = () => {
    const existingStaffs = JSON.parse(localStorage.getItem('staffs') || '[]');
    const maxNum = existingStaffs.reduce((max, s) => {
      const match = s.id?.match(/#SF(\d+)/);
      if (match) return Math.max(max, parseInt(match[1], 10));
      return max;
    }, 0);
    return `#SF${String(maxNum + 1).padStart(4, '0')}`;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (submitError) setSubmitError('');
  };

  const handleStatusToggle = () => {
    setFormData(prev => ({ ...prev, status: !prev.status }));
  };

  // Image upload handler
  const handleImageUpload = (file) => {
    if (!file) return;
    
    if (!validateImage(file)) return;
    
    setErrors(prev => ({ ...prev, profileImage: '' }));
    
    const reader = new FileReader();
    reader.onloadend = () => setPreviewImage(reader.result);
    reader.readAsDataURL(file);
    setFormData(prev => ({ ...prev, profileImage: file }));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) handleImageUpload(file);
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, profileImage: null }));
    setPreviewImage(null);
    setErrors(prev => ({ ...prev, profileImage: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = ['name', 'mobile', 'email', 'designation'];
    requiredFields.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });
    const dobError = validateDob(formData.dob);
    if (dobError) newErrors.dob = dobError;
    setErrors(newErrors);
    Object.keys(formData).forEach(key => setTouched(prev => ({ ...prev, [key]: true })));
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
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
      profileImage: previewImage,
      imageUrl: previewImage || `https://i.pravatar.cc/80?u=${Date.now()}`,
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
    localStorage.setItem('staffs', JSON.stringify([newStaff, ...existingStaffs]));
    setSubmitSuccess(true);
    setTimeout(() => navigate('/staffs'), 1500);
  };

  const designations = ['Compounder', 'Nurse', 'Purchase Officer', 'Supervisor', 'Receptionist', 'Lab Assistant', 'Pharmacist', 'Doctor', 'Technician', 'Admin'];
  const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'Austin'];
  const states = ['California', 'Texas', 'New York', 'Florida', 'Illinois', 'Pennsylvania', 'Ohio', 'Georgia', 'North Carolina', 'Michigan'];
  const countries = ['United States', 'Canada', 'United Kingdom', 'Australia', 'India', 'Germany', 'France', 'Japan', 'Brazil', 'Mexico'];

  const tabs = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'salary', label: 'Salary Info' }
  ];

  return (
    <div className="min-h-screen bg-gray-50" style={{ background: '#f4f6f9', fontFamily: "'Segoe UI', sans-serif" }}>
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Add New Staff</h1>
        <div className="text-sm text-gray-500 flex items-center gap-2">
          <span>Home</span><ChevronRight size={14} /><span className="text-gray-700 font-medium">Staffs</span><ChevronRight size={14} /><span className="text-gray-700 font-medium">Add Staff</span>
        </div>
      </div>

      {submitSuccess && <Alert type="success" message="Staff added successfully! Redirecting..." className="fixed top-20 right-6 z-50 w-auto animate-pulse" />}

      <div className="p-6">
        <Card>
          <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

          {activeTab === 'basic' && (
            <div className="p-6">
              {/* Profile Image Upload Section - Like AddDoctor */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-6 pb-6 border-b border-gray-200">
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center border-2 border-gray-200 overflow-hidden shadow-sm">
                      {previewImage ? (
                        <img 
                          src={previewImage} 
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
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
                    >
                      <Upload className="h-4 w-4" />
                      Upload Image
                    </Button>
                    <p className="text-xs text-gray-400 mt-2">
                      JPEG, PNG, GIF, WEBP accepted. Max 5MB
                    </p>
                  </div>
                  {errors.profileImage && <Alert type="error" message={errors.profileImage} className="mt-2" />}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Staff ID</label>
                  <input
                    type="text"
                    value={formData.id || "Auto-generated"}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    disabled
                  />
                  <p className="text-xs text-gray-400 mt-1">Leave empty for auto-generation</p>
                </div>
                <Input label="Full Name" name="name" value={formData.name} onChange={handleChange} onBlur={handleBlur} error={errors.name} touched={touched.name} required placeholder="Enter full name" />
                <Select label="Gender" name="gender" options={['Male', 'Female', 'Other']} value={formData.gender} onChange={handleChange} onBlur={handleBlur} error={errors.gender} touched={touched.gender} />
                <Input label="Date of Birth" name="dob" type="date" value={formData.dob} onChange={handleChange} onBlur={handleBlur} error={errors.dob} touched={touched.dob} />
                <Input label="Mobile Number" name="mobile" type="tel" value={formData.mobile} onChange={handleChange} onBlur={handleBlur} error={errors.mobile} touched={touched.mobile} required placeholder="+1 00000 00000" />
                <Input label="Email" name="email" type="email" value={formData.email} onChange={handleChange} onBlur={handleBlur} error={errors.email} touched={touched.email} required placeholder="staff@example.com" />
                <Select label="Designation" name="designation" options={designations} value={formData.designation} onChange={handleChange} onBlur={handleBlur} error={errors.designation} touched={touched.designation} required />
                <Input label="Appointment Date" name="appointmentDate" type="date" value={formData.appointmentDate} onChange={handleChange} onBlur={handleBlur} error={errors.appointmentDate} touched={touched.appointmentDate} />
                <Select label="Staff Type" name="staffType" options={['Permanent', 'Contract', 'Temporary', 'Intern']} value={formData.staffType} onChange={handleChange} onBlur={handleBlur} error={errors.staffType} touched={touched.staffType} />
                <Select label="Job Type" name="jobType" options={['Full Time', 'Part Time', 'Remote', 'Hybrid']} value={formData.jobType} onChange={handleChange} onBlur={handleBlur} error={errors.jobType} touched={touched.jobType} />
                <div className="md:col-span-2">
                  <Input label="Address Line 1" name="addressLine1" value={formData.addressLine1} onChange={handleChange} placeholder="Street address" />
                </div>
                <div className="md:col-span-2">
                  <Input label="Address Line 2" name="addressLine2" value={formData.addressLine2} onChange={handleChange} placeholder="Apt, suite, unit (optional)" />
                </div>
                <Select label="City" name="city" options={cities} value={formData.city} onChange={handleChange} onBlur={handleBlur} error={errors.city} touched={touched.city} />
                <Select label="State" name="state" options={states} value={formData.state} onChange={handleChange} onBlur={handleBlur} error={errors.state} touched={touched.state} />
                <Select label="Country" name="country" options={countries} value={formData.country} onChange={handleChange} onBlur={handleBlur} error={errors.country} touched={touched.country} />
                <Input label="Pin Code" name="pinCode" value={formData.pinCode} onChange={handleChange} onBlur={handleBlur} error={errors.pinCode} touched={touched.pinCode} placeholder="Postal code" />
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-3">Status</label>
                <div className="flex items-center">
                  <Switch checked={formData.status} onChange={handleStatusToggle} />
                  <span className="ml-3 text-sm text-gray-600">{formData.status ? 'Active' : 'Inactive'}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Toggle to activate or deactivate this staff member</p>
              </div>
            </div>
          )}

          {activeTab === 'salary' && (
            <div className="p-6">
              <Input label="Net Salary" name="netSalary" value={formData.netSalary} onChange={handleChange} placeholder="Enter net salary" className="mb-6 md:w-1/2" />
              
              <h4 className="text-md font-semibold text-gray-800 mb-4">Earnings</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <Input name="basic" placeholder="Basic" value={formData.basic} onChange={handleChange} />
                <Input name="da" placeholder="DA" value={formData.da} onChange={handleChange} />
                <Input name="hra" placeholder="HRA" value={formData.hra} onChange={handleChange} />
                <Input name="conveyance" placeholder="Conveyance" value={formData.conveyance} onChange={handleChange} />
                <Input name="allowance" placeholder="Allowance" value={formData.allowance} onChange={handleChange} />
                <Input name="medicalAllowance" placeholder="Medical Allowance" value={formData.medicalAllowance} onChange={handleChange} />
                <Input name="otherEarnings" placeholder="Others" value={formData.otherEarnings} onChange={handleChange} />
              </div>

              <h4 className="text-md font-semibold text-gray-800 mb-4">Deductions</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input name="tds" placeholder="TDS" value={formData.tds} onChange={handleChange} />
                <Input name="pf" placeholder="PF" value={formData.pf} onChange={handleChange} />
                <Input name="leave" placeholder="Leave" value={formData.leave} onChange={handleChange} />
                <Input name="profTax" placeholder="Prof. Tax" value={formData.profTax} onChange={handleChange} />
                <Input name="labourWelfare" placeholder="Labour Welfare" value={formData.labourWelfare} onChange={handleChange} />
                <Input name="otherDeductions" placeholder="Others" value={formData.otherDeductions} onChange={handleChange} />
              </div>
            </div>
          )}

          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end gap-3">
            <Button variant="outline" onClick={() => navigate('/staffs')}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit} icon={Save}>Save Staff</Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AddStaff;