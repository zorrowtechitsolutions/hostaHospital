// src/components/staffs/EditStaff.jsx - Complete with UI components and S3 upload
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ChevronRight, Save, AlertCircle, Upload, X } from 'lucide-react';
import { Button, Input, Select, Card, Tabs, Avatar, Alert, Loader, Switch } from '../ui';

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
  const [uploadProgress, setUploadProgress] = useState(0);
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

  // Mock S3 upload function - replace with actual AWS SDK implementation
  const uploadToS3 = async (file) => {
    return new Promise((resolve, reject) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          const mockS3Url = `https://your-bucket.s3.amazonaws.com/staff-images/${Date.now()}-${file.name}`;
          resolve(mockS3Url);
        }
      }, 200);
    });
  };

  useEffect(() => {
    const loadStaff = () => {
      let decodedId = id;
      try { decodedId = decodeURIComponent(id); } catch (e) { decodedId = id; }
      
      if (location.state?.staff) {
        populateFormData(location.state.staff);
        setLoading(false);
        return;
      }

      const storedStaffs = JSON.parse(localStorage.getItem('staffs') || '[]');
      const staff = storedStaffs.find(s => s.id === decodedId);
      if (staff) populateFormData(staff);
      else { setSubmitError('Staff not found!'); setTimeout(() => navigate('/staffs'), 2000); }
      setLoading(false);
    };
    loadStaff();
  }, [id, location, navigate]);

  const populateFormData = (staff) => {
    setFormData({
      id: staff.id || '', name: staff.name || '', gender: staff.gender || 'Male', dob: staff.dob || '',
      mobile: staff.phone || '', email: staff.email || '', designation: staff.designation || '',
      appointmentDate: staff.appointmentDate || '', staffType: staff.staffType || 'Permanent',
      jobType: staff.jobType || 'Full Time', addressLine1: staff.addressLine1 || '',
      addressLine2: staff.addressLine2 || '', city: staff.city || '', state: staff.state || '',
      country: staff.country || '', pinCode: staff.pinCode || '', status: staff.status === 'Active',
      profileImage: staff.imageUrl || null,
      netSalary: staff.salary?.replace('$', '') || '', basic: staff.salaryDetails?.earnings?.basic || '',
      da: staff.salaryDetails?.earnings?.da || '', hra: staff.salaryDetails?.earnings?.hra || '',
      conveyance: staff.salaryDetails?.earnings?.conveyance || '', allowance: staff.salaryDetails?.earnings?.allowance || '',
      medicalAllowance: staff.salaryDetails?.earnings?.medicalAllowance || '', otherEarnings: staff.salaryDetails?.earnings?.others || '',
      tds: staff.salaryDetails?.deductions?.tds || '', pf: staff.salaryDetails?.deductions?.pf || '',
      leave: staff.salaryDetails?.deductions?.leave || '', profTax: staff.salaryDetails?.deductions?.profTax || '',
      labourWelfare: staff.salaryDetails?.deductions?.labourWelfare || '', otherDeductions: staff.salaryDetails?.deductions?.others || ''
    });
    setPreviewImage(staff.imageUrl || null);
  };

  // STANDARD IMAGE UPLOAD HANDLER WITH S3 UPLOAD
  const handleImageUpload = async (file) => {
    if (!file) return false;
    
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, profileImage: 'File size must be less than 5MB' }));
      return false;
    }
    
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, profileImage: 'Only JPEG, PNG, GIF, and WEBP files are allowed' }));
      return false;
    }
    
    setErrors(prev => ({ ...prev, profileImage: '' }));
    setUploadProgress(0);
    
    const reader = new FileReader();
    reader.onloadend = () => setPreviewImage(reader.result);
    reader.readAsDataURL(file);
    
    try {
      const s3Url = await uploadToS3(file);
      setFormData(prev => ({ ...prev, profileImage: s3Url }));
      setUploadProgress(100);
      return true;
    } catch (error) {
      console.error('S3 upload error:', error);
      setErrors(prev => ({ ...prev, profileImage: 'Failed to upload image. Please try again.' }));
      const storedStaffs = JSON.parse(localStorage.getItem('staffs') || '[]');
      const staff = storedStaffs.find(s => s.id === formData.id);
      if (staff?.imageUrl) {
        setPreviewImage(staff.imageUrl);
      } else {
        setPreviewImage(null);
      }
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (submitError) setSubmitError('');
  };

  const handleStatusToggle = () => setFormData(prev => ({ ...prev, status: !prev.status }));

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

  const handleDelete = () => {
    const storedStaffs = JSON.parse(localStorage.getItem('staffs') || '[]');
    localStorage.setItem('staffs', JSON.stringify(storedStaffs.filter(s => s.id !== formData.id)));
    setSubmitSuccess(true);
    setTimeout(() => navigate('/staffs'), 1500);
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      if (errors.name || errors.mobile || errors.email || errors.designation || errors.dob) setActiveTab('basic');
      return;
    }

    const updatedStaff = {
      ...formData, id: formData.id, name: formData.name,
      firstName: formData.name.split(' ')[0] || formData.name,
      lastName: formData.name.split(' ')[1] || '',
      gender: formData.gender, designation: formData.designation, phone: formData.mobile,
      email: formData.email, appointmentDate: formData.appointmentDate,
      appointmentDateDisplay: formData.appointmentDate ? new Date(formData.appointmentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
      imageUrl: formData.profileImage || previewImage,
      status: formData.status ? 'Active' : 'Inactive',
      jobType: formData.jobType, dob: formData.dob || 'N/A',
      address: `${formData.addressLine1} ${formData.addressLine2} ${formData.city} ${formData.state} ${formData.country} ${formData.pinCode}`.trim() || 'N/A',
      salary: formData.netSalary ? `$${formData.netSalary}` : '$0',
      department: formData.designation, staffType: formData.staffType,
      addressLine1: formData.addressLine1, addressLine2: formData.addressLine2,
      city: formData.city, state: formData.state, country: formData.country, pinCode: formData.pinCode,
      salaryDetails: {
        netSalary: formData.netSalary,
        earnings: { basic: formData.basic, da: formData.da, hra: formData.hra, conveyance: formData.conveyance, allowance: formData.allowance, medicalAllowance: formData.medicalAllowance, others: formData.otherEarnings },
        deductions: { tds: formData.tds, pf: formData.pf, leave: formData.leave, profTax: formData.profTax, labourWelfare: formData.labourWelfare, others: formData.otherDeductions }
      }
    };

    const storedStaffs = JSON.parse(localStorage.getItem('staffs') || '[]');
    localStorage.setItem('staffs', JSON.stringify(storedStaffs.map(staff => staff.id === formData.id ? updatedStaff : staff)));
    setSubmitSuccess(true);
    setTimeout(() => navigate('/staffs'), 1500);
  };

  const designations = ['Compounder', 'Nurse', 'Purchase Officer', 'Supervisor', 'Receptionist', 'Lab Assistant', 'Pharmacist', 'Doctor', 'Technician', 'Admin'];
  const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'Austin'];
  const states = ['California', 'Texas', 'New York', 'Florida', 'Illinois', 'Pennsylvania', 'Ohio', 'Georgia', 'North Carolina', 'Michigan'];
  const countries = ['United States', 'Canada', 'United Kingdom', 'Australia', 'India', 'Germany', 'France', 'Japan', 'Brazil', 'Mexico'];

  const tabs = [{ id: 'basic', label: 'Basic Info' }, { id: 'salary', label: 'Salary Info' }];

  if (loading) return <Loader centered text="Loading staff data..." />;

  return (
    <div className="min-h-screen bg-gray-50" style={{ background: '#f4f6f9', fontFamily: "'Segoe UI', sans-serif" }}>
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Edit Staff</h1>
        <div className="text-sm text-gray-500 flex items-center gap-2">
          <span>Home</span><ChevronRight size={14} /><span className="text-gray-700 font-medium">Staffs</span><ChevronRight size={14} /><span className="text-gray-700 font-medium">Edit Staff</span>
        </div>
      </div>

      {submitSuccess && <Alert type="success" message="Staff updated successfully! Redirecting..." className="fixed top-20 right-6 z-50 w-auto animate-pulse" />}
      {submitError && <Alert type="error" message={submitError} className="fixed top-20 right-6 z-50 w-auto" />}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Delete</h3>
            <p className="text-gray-600 mb-4">Are you sure you want to delete <span className="font-semibold">{formData.name}</span>? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteConfirm(false)}>Cancel</Button>
              <Button variant="danger" onClick={handleDelete}>Delete</Button>
            </div>
          </div>
        </div>
      )}

      <div className="p-6">
        <Card>
          <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

          {activeTab === 'basic' && (
            <div className="p-6">
              {/* Profile Image Upload with S3 Support */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center border-2 border-gray-200 overflow-hidden shadow-sm">
                      {previewImage ? (
                        <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <span className="text-gray-400 text-2xl font-medium">
                            {formData.name ? formData.name.charAt(0).toUpperCase() : '?'}
                          </span>
                        </div>
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
                      Upload New Image
                    </Button>
                    <p className="text-xs text-gray-400 mt-2">JPEG, PNG, GIF, WEBP accepted. Max 5MB</p>
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
                  
                  {errors.profileImage && <Alert type="error" message={errors.profileImage} className="mt-2" />}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Staff ID</label><input type="text" value={formData.id} disabled className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50" /></div>
                <Input label="Full Name" name="name" value={formData.name} onChange={handleChange} onBlur={handleBlur} error={errors.name} touched={touched.name} required placeholder="Enter full name" />
                <Select label="Gender" name="gender" options={['Male', 'Female', 'Other']} value={formData.gender} onChange={handleChange} onBlur={handleBlur} error={errors.gender} touched={touched.gender} />
                <Input label="Date of Birth" name="dob" type="date" value={formData.dob} onChange={handleChange} onBlur={handleBlur} error={errors.dob} touched={touched.dob} />
                <Input label="Mobile Number" name="mobile" type="tel" value={formData.mobile} onChange={handleChange} onBlur={handleBlur} error={errors.mobile} touched={touched.mobile} required placeholder="+1 00000 00000" />
                <Input label="Email" name="email" type="email" value={formData.email} onChange={handleChange} onBlur={handleBlur} error={errors.email} touched={touched.email} required placeholder="staff@example.com" />
                <Select label="Designation" name="designation" options={designations} value={formData.designation} onChange={handleChange} onBlur={handleBlur} error={errors.designation} touched={touched.designation} required />
                <Input label="Appointment Date" name="appointmentDate" type="date" value={formData.appointmentDate} onChange={handleChange} onBlur={handleBlur} error={errors.appointmentDate} touched={touched.appointmentDate} />
                <Select label="Staff Type" name="staffType" options={['Permanent', 'Contract', 'Temporary', 'Intern']} value={formData.staffType} onChange={handleChange} onBlur={handleBlur} error={errors.staffType} touched={touched.staffType} />
                <Select label="Job Type" name="jobType" options={['Full Time', 'Part Time', 'Remote', 'Hybrid']} value={formData.jobType} onChange={handleChange} onBlur={handleBlur} error={errors.jobType} touched={touched.jobType} />
                <div className="md:col-span-2"><Input label="Address Line 1" name="addressLine1" value={formData.addressLine1} onChange={handleChange} placeholder="Street address" /></div>
                <div className="md:col-span-2"><Input label="Address Line 2" name="addressLine2" value={formData.addressLine2} onChange={handleChange} placeholder="Apt, suite, unit (optional)" /></div>
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
            <div className="flex gap-3">
              <Button variant="danger" onClick={() => setDeleteConfirm(true)}>Delete</Button>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate('/staffs')}>Cancel</Button>
              <Button variant="primary" onClick={handleSubmit} icon={Save}>Save Changes</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default EditStaff;