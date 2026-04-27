// EditStaff.jsx - Fixed to handle encoded IDs with # symbol
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ChevronRight, Save, X, Trash2, AlertCircle } from 'lucide-react';

const EditStaff = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('basic');
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  
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
    profileImage: 'https://i.pravatar.cc/80',
    
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

  // Load staff data
  useEffect(() => {
    const loadStaff = () => {
      // Decode the ID from URL
      let decodedId = id;
      try {
        decodedId = decodeURIComponent(id);
      } catch (e) {
        decodedId = id;
      }
      
      // First try to get from location state
      if (location.state?.staff) {
        const staff = location.state.staff;
        populateFormData(staff);
        setLoading(false);
        return;
      }

      // Otherwise load from localStorage
      const storedStaffs = JSON.parse(localStorage.getItem('staffs') || '[]');
      const staff = storedStaffs.find(s => s.id === decodedId);
      if (staff) {
        populateFormData(staff);
      } else {
        setSubmitError('Staff not found!');
        setTimeout(() => navigate('/staffs'), 2000);
      }
      setLoading(false);
    };

    loadStaff();
  }, [id, location, navigate]);

  const populateFormData = (staff) => {
    setFormData({
      id: staff.id || '',
      name: staff.name || '',
      gender: staff.gender || 'Male',
      dob: staff.dob || '',
      mobile: staff.phone || '',
      email: staff.email || '',
      designation: staff.designation || '',
      appointmentDate: staff.appointmentDate || '',
      staffType: staff.staffType || 'Permanent',
      jobType: staff.jobType || 'Full Time',
      addressLine1: staff.addressLine1 || '',
      addressLine2: staff.addressLine2 || '',
      city: staff.city || '',
      state: staff.state || '',
      country: staff.country || '',
      pinCode: staff.pinCode || '',
      status: staff.status === 'Active',
      profileImage: staff.imageUrl || 'https://i.pravatar.cc/80',
      
      // Salary Info
      netSalary: staff.salary?.replace('$', '') || '',
      basic: staff.salaryDetails?.earnings?.basic || '',
      da: staff.salaryDetails?.earnings?.da || '',
      hra: staff.salaryDetails?.earnings?.hra || '',
      conveyance: staff.salaryDetails?.earnings?.conveyance || '',
      allowance: staff.salaryDetails?.earnings?.allowance || '',
      medicalAllowance: staff.salaryDetails?.earnings?.medicalAllowance || '',
      otherEarnings: staff.salaryDetails?.earnings?.others || '',
      tds: staff.salaryDetails?.deductions?.tds || '',
      pf: staff.salaryDetails?.deductions?.pf || '',
      leave: staff.salaryDetails?.deductions?.leave || '',
      profTax: staff.salaryDetails?.deductions?.profTax || '',
      labourWelfare: staff.salaryDetails?.deductions?.labourWelfare || '',
      otherDeductions: staff.salaryDetails?.deductions?.others || ''
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (submitError) setSubmitError('');
  };

  const handleStatusToggle = () => {
    setFormData(prev => ({
      ...prev,
      status: !prev.status
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, profileImage: 'Image size must be less than 2MB' }));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          profileImage: reader.result
        }));
        setErrors(prev => ({ ...prev, profileImage: '' }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({
      ...prev,
      profileImage: 'https://i.pravatar.cc/80'
    }));
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
    
    const allTouched = {};
    Object.keys(formData).forEach(key => {
      allTouched[key] = true;
    });
    setTouched(allTouched);
    
    return Object.keys(newErrors).length === 0;
  };

  const handleDelete = () => {
    const storedStaffs = JSON.parse(localStorage.getItem('staffs') || '[]');
    const updatedStaffs = storedStaffs.filter(s => s.id !== formData.id);
    localStorage.setItem('staffs', JSON.stringify(updatedStaffs));
    setSubmitSuccess(true);
    setTimeout(() => {
      navigate('/staffs');
    }, 1500);
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      if (errors.name || errors.mobile || errors.email || errors.designation || errors.dob) {
        setActiveTab('basic');
      }
      return;
    }

    const updatedStaff = {
      ...formData,
      id: formData.id,
      name: formData.name,
      firstName: formData.name.split(' ')[0] || formData.name,
      lastName: formData.name.split(' ')[1] || '',
      gender: formData.gender,
      designation: formData.designation,
      phone: formData.mobile,
      email: formData.email,
      appointmentDate: formData.appointmentDate,
      appointmentDateDisplay: formData.appointmentDate ? new Date(formData.appointmentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
      imageUrl: formData.profileImage,
      status: formData.status ? 'Active' : 'Inactive',
      jobType: formData.jobType,
      dob: formData.dob || 'N/A',
      address: `${formData.addressLine1} ${formData.addressLine2} ${formData.city} ${formData.state} ${formData.country} ${formData.pinCode}`.trim() || 'N/A',
      salary: formData.netSalary ? `$${formData.netSalary}` : '$0',
      department: formData.designation,
      staffType: formData.staffType,
      addressLine1: formData.addressLine1,
      addressLine2: formData.addressLine2,
      city: formData.city,
      state: formData.state,
      country: formData.country,
      pinCode: formData.pinCode,
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

    const storedStaffs = JSON.parse(localStorage.getItem('staffs') || '[]');
    const updatedStaffs = storedStaffs.map(staff => 
      staff.id === formData.id ? updatedStaff : staff
    );
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading staff data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{ background: '#f4f6f9', fontFamily: "'Segoe UI', sans-serif" }}>
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">
          Edit Staff
        </h1>
        <div className="text-sm text-gray-500 flex items-center gap-2">
          <span>Home</span>
          <ChevronRight size={14} />
          <span className="text-gray-700 font-medium">Staffs</span>
          <ChevronRight size={14} />
          <span className="text-gray-700 font-medium">Edit Staff</span>
        </div>
      </div>

      {submitSuccess && (
        <div className="fixed top-20 right-6 z-50 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg animate-pulse">
          Staff updated successfully! Redirecting...
        </div>
      )}

      {submitError && (
        <div className="fixed top-20 right-6 z-50 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg">
          {submitError}
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Delete</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete <span className="font-semibold">{formData.name}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
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

          {activeTab === 'basic' && (
            <div className="p-6">
              <div className="flex gap-4 mb-6 pb-6 border-b border-gray-200">
                <img 
                  src={formData.profileImage} 
                  alt="Profile"
                  className="w-20 h-20 rounded-lg object-cover"
                />
                <div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                    id="imageUpload"
                  />
                  <button
                    onClick={() => document.getElementById('imageUpload').click()}
                    className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 mr-2"
                  >
                    Change Image
                  </button>
                  <button
                    onClick={handleRemoveImage}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Remove
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    Use JPEG, PNG, or GIF. Best size: 200×200 pixels. Max 2MB.
                  </p>
                  {errors.profileImage && (
                    <p className="text-xs text-red-500 mt-1">{errors.profileImage}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Staff ID</label>
                  <input
                    type="text"
                    name="id"
                    value={formData.id}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
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
                <input type="text" name="basic" placeholder="Basic" value={formData.basic} onChange={handleChange} className="px-4 py-2 border border-gray-300 rounded-lg" />
                <input type="text" name="da" placeholder="DA" value={formData.da} onChange={handleChange} className="px-4 py-2 border border-gray-300 rounded-lg" />
                <input type="text" name="hra" placeholder="HRA" value={formData.hra} onChange={handleChange} className="px-4 py-2 border border-gray-300 rounded-lg" />
                <input type="text" name="conveyance" placeholder="Conveyance" value={formData.conveyance} onChange={handleChange} className="px-4 py-2 border border-gray-300 rounded-lg" />
                <input type="text" name="allowance" placeholder="Allowance" value={formData.allowance} onChange={handleChange} className="px-4 py-2 border border-gray-300 rounded-lg" />
                <input type="text" name="medicalAllowance" placeholder="Medical Allowance" value={formData.medicalAllowance} onChange={handleChange} className="px-4 py-2 border border-gray-300 rounded-lg" />
                <input type="text" name="otherEarnings" placeholder="Others" value={formData.otherEarnings} onChange={handleChange} className="px-4 py-2 border border-gray-300 rounded-lg" />
              </div>

              <h4 className="text-md font-semibold text-gray-800 mb-4">Deductions</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <input type="text" name="tds" placeholder="TDS" value={formData.tds} onChange={handleChange} className="px-4 py-2 border border-gray-300 rounded-lg" />
                <input type="text" name="pf" placeholder="PF" value={formData.pf} onChange={handleChange} className="px-4 py-2 border border-gray-300 rounded-lg" />
                <input type="text" name="leave" placeholder="Leave" value={formData.leave} onChange={handleChange} className="px-4 py-2 border border-gray-300 rounded-lg" />
                <input type="text" name="profTax" placeholder="Prof. Tax" value={formData.profTax} onChange={handleChange} className="px-4 py-2 border border-gray-300 rounded-lg" />
                <input type="text" name="labourWelfare" placeholder="Labour Welfare" value={formData.labourWelfare} onChange={handleChange} className="px-4 py-2 border border-gray-300 rounded-lg" />
                <input type="text" name="otherDeductions" placeholder="Others" value={formData.otherDeductions} onChange={handleChange} className="px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
            </div>
          )}

          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end gap-3">
  <button
    onClick={() => navigate('/staffs')}
    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2">
    Cancel
  </button>
  <button
    onClick={handleSubmit}
    className="px-4 py-2 bg-[#1C62A0] text-white rounded-lg hover:bg-[#154a7d] transition-colors flex items-center gap-2">
          <Save size={16} />
          Save Changes
        </button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default EditStaff;