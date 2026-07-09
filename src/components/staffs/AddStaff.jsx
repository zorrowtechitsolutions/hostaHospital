// src/components/staffs/AddStaff.jsx - WITH Confirm Password
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Upload,
  X,
  Image,
  Eye,
  EyeOff,
  Lock,
  Shield,
  ArrowLeft
} from 'lucide-react';
import {
  Button,
  Input,
  Select,
  Card,
  Alert,
  Switch
} from '../ui';
import { showAddToast, showSuccessToast, showErrorToast, showWarningToast } from '../ui/Toast';
import { useCreateStaffMutation } from '../../../app/service/staffApi';
import { useAssignPermissionsMutation } from '../../../app/service/rolePermission';
import { useGetRolesQuery } from '../../../app/service/role';
import { getHospitalId, getAuthUser } from '../../utils/auth';
import { uploadToS3 } from '../../../app/service/S3';

// Constants
const TOAST_DURATION = 3000;
const SUCCESS_DURATION = 4000;
const STAFFS_ROUTE = '/staffs';

// Static arrays moved outside component
const designations = ['Compounder', 'Nurse', 'Purchase Officer', 'Supervisor', 'Receptionist', 'Lab Assistant', 'Pharmacist', 'Doctor', 'Technician', 'Admin'];
const jobTypes = ['Day Shift', 'Night Shift', 'Remote', 'Hybrid'];
const staffTypes = ['Permanent', 'Contract', 'Temporary', 'Intern'];
const genders = ['male', 'female', 'other'];
const countries = ['India', 'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 'France', 'Japan', 'Brazil', 'Mexico'];
const states = ['Kerala', 'Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'California', 'Texas', 'New York', 'Florida', 'Illinois'];
const districts = ['Malappuram', 'Kozhikode', 'Ernakulam', 'Thiruvananthapuram', 'Thrissur', 'Kannur', 'Kollam', 'Palakkad', 'Alappuzha', 'Kottayam'];
const languages = ['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Arabic', 'Hindi', 'Bengali', 'Portuguese', 'Malayalam', 'Tamil', 'Telugu', 'Kannada'];

// Helper functions moved outside component
const removeUndefined = obj => {
  if (!obj) return obj;
  Object.keys(obj).forEach(key => {
    if (obj[key] === undefined) {
      delete obj[key];
    }
  });
  return obj;
};

const validateName = (name) => {
  if (!name || name.trim() === '') return 'Full name is required';
  if (name.length < 2) return 'Name must be at least 2 characters';
  if (name.length > 50) return 'Name must be less than 50 characters';
  return '';
};

const validatePhone = (phone) => {
  if (!phone || phone.trim() === '') return 'Phone number is required';
  const mobileRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{3,5}[-\s\.]?[0-9]{4,6}$/;
  if (!mobileRegex.test(phone)) return 'Please enter a valid phone number';
  return '';
};

const validateEmail = (email) => {
  if (!email || email.trim() === '') return 'Email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Please enter a valid email address';
  return '';
};

const validatePassword = password => {
  if (!password) return 'Password is required';
  return password.length < 8 ? 'Password must be at least 8 characters' : '';
};

const validateConfirmPassword = (confirmPassword, password) => {
  if (!confirmPassword) return 'Please confirm your password';
  if (confirmPassword !== password) return 'Passwords do not match';
  return '';
};

const validateDesignation = designation => !designation ? 'Designation is required' : '';

const validateRole = roleId => !roleId ? 'Please select a role' : '';

const validateDob = (dob) => {
  if (!dob) return '';
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  if (age < 18) return 'Staff must be at least 18 years old';
  if (age > 70) return 'Age cannot exceed 70 years';
  return '';
};

const validateImage = (file) => {
  if (!file) return '';
  if (file.size > 5 * 1024 * 1024) {
    return 'File size must be less than 5MB';
  }
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return 'Only JPEG, PNG, GIF, and WEBP files are allowed';
  }
  return '';
};

const validators = {
  name: validateName,
  phone: validatePhone,
  email: validateEmail,
  password: validatePassword,
  confirmPassword: validateConfirmPassword,
  designation: validateDesignation,
  roleId: validateRole,
  dob: validateDob
};

const validateField = (name, value, formData) => {
  if (name === 'confirmPassword') {
    return validateConfirmPassword(value, formData.password);
  }
  return validators[name]?.(value) || '';
};

const buildPlace = (line1, line2) => `${line1} ${line2}`.trim();

const PasswordInput = ({ 
  label, 
  name, 
  value, 
  onChange, 
  onBlur, 
  error, 
  touched, 
  showPassword, 
  setShowPassword,
  placeholder,
  icon: Icon,
  required
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />}
      <input
        type={showPassword ? "text" : "password"}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C62A0] ${
          error && touched ? 'border-red-500' : 'border-gray-300'
        }`}
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={() => setShowPassword(prev => !prev)}
        className="absolute right-3 top-1/2 transform -translate-y-1/2"
      >
        {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
      </button>
    </div>
    {error && touched && (
      <p className="mt-1 text-sm text-red-500">{error}</p>
    )}
  </div>
);

const AddStaff = () => {
  const navigate = useNavigate();
  const [createStaff, { isLoading: isApiLoading }] = useCreateStaffMutation();
  const [errors, setErrors] = useState({});
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [languagesInput, setLanguagesInput] = useState('');
  
  // Role assignment state
  const [assignPermissions, { isLoading: isAssigning }] = useAssignPermissionsMutation();
  
  // Get hospital ID and hospital name from auth
  const hospitalId = getHospitalId();
  const authUser = getAuthUser();
  const hospitalName = authUser?.name || '';
  
  
  // Fetch roles from API
  const {
    data: rolesData,
    isLoading: rolesLoading,
  } = useGetRolesQuery({
    hospitalId,
    limit: 100
  });
  
  // Extract roles from response - include admin role (id=2) and hospital-specific roles
  const rolesList = [
    ...(rolesData?.admin || []).filter(role => role.id === 2),
    ...(rolesData?.data || []).filter(role => role.hospitalId === Number(hospitalId))
  ];
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    designation: '',
    roleId: '',
    joiningDate: '',
    jobType: '',
    staffType: '',
    dob: '',
    gender: 'male',
    knowLanguages: [],
    qualification: '',
    address: {
      country: '',
      state: '',
      district: '',
      place: '',
      pincode: ''
    },
    addressLine1: '',
    addressLine2: '',
    status: 'active',
    profileImage: null,
    imageKey: '',
  });

  // Helper functions for state updates
  const updateFormData = (updates) => {
    setFormData(prev => ({
      ...prev,
      ...updates
    }));
  };

  const clearFieldError = (field) => {
    setErrors(prev => ({
      ...prev,
      [field]: ''
    }));
  };

  const resetSubmitState = () => {
    setSubmitError('');
    setErrors({});
  };

  const handleGoBack = () => {
    navigate(STAFFS_ROUTE);
  };

  const handleApiError = (error) => {
    if (error?.status === 401 || error?.originalStatus === 401) {
      showErrorToast('Session expired. Please login again.', TOAST_DURATION);
      setTimeout(() => {
        window.location.href = '/sign-in';
      }, 2000);
      return;
    }
    
    const errorMessage = error?.data?.message || error?.message || 'Failed to add staff';
    
    if (error?.data?.errors) {
      const backendErrors = error.data.errors;
      const formattedErrors = {};
      Object.keys(backendErrors).forEach(key => {
        formattedErrors[key] = backendErrors[key];
      });
      setErrors(prev => ({ ...prev, ...formattedErrors }));
      showErrorToast('Please check the form for errors', SUCCESS_DURATION);
    } else {
      showErrorToast(errorMessage, SUCCESS_DURATION);
    }
    
    setSubmitError(errorMessage);
    setIsSubmitting(false);
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value, formData);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: { ...prev.address, [addressField]: value }
      }));
    } else {
      updateFormData({ [name]: type === 'checkbox' ? checked : value });
    }
    
    // If password changes, re-validate confirm password
    if (name === 'password' && formData.confirmPassword) {
      const confirmError = validateConfirmPassword(formData.confirmPassword, value);
      setErrors(prev => ({ ...prev, confirmPassword: confirmError }));
    }
    
    if (errors[name]) clearFieldError(name);
    if (submitError) setSubmitError('');
  };

  const handleAddressLineChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const updatedData = {
        ...prev,
        [name]: value
      };
      
      const combinedPlace = buildPlace(
        name === 'addressLine1' ? value : prev.addressLine1,
        name === 'addressLine2' ? value : prev.addressLine2
      );
      
      updatedData.address = {
        ...updatedData.address,
        place: combinedPlace
      };
      
      return updatedData;
    });
  };

  const handleStatusToggle = () => {
    setFormData(prev => ({
      ...prev,
      status: prev.status === 'active' ? 'inactive' : 'active'
    }));
  };

  const handleAddLanguage = () => {
    const language = languagesInput.trim();
    if (language && !formData.knowLanguages.includes(language)) {
      setFormData(prev => ({
        ...prev,
        knowLanguages: [...prev.knowLanguages, language]
      }));
      setLanguagesInput('');
    }
  };

  const handleRemoveLanguage = (language) => {
    setFormData(prev => ({
      ...prev,
      knowLanguages: prev.knowLanguages.filter(l => l !== language)
    }));
  };

  const handleImageUpload = async (file) => {
    if (!file) return;

    const imageError = validateImage(file);

    if (imageError) {
      clearFieldError('profileImage');
      setErrors(prev => ({
        ...prev,
        profileImage: imageError
      }));
      showWarningToast(imageError, TOAST_DURATION);
      return;
    }

    clearFieldError('profileImage');

    const reader = new FileReader();
    reader.onloadend = () => setPreviewImage(reader.result);
    reader.readAsDataURL(file);

    try {
      const uploaded = await uploadToS3(file);
      updateFormData({
        profileImage: uploaded.key,
        imageKey: uploaded.key
      });
      showSuccessToast('Image uploaded successfully!', TOAST_DURATION);
    } catch {
      showErrorToast('Failed to upload image', TOAST_DURATION);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) handleImageUpload(file);
  };

  const removeImage = () => {
    setPreviewImage(null);
    updateFormData({ profileImage: null, imageKey: '' });
    clearFieldError('profileImage');
    showSuccessToast('Image removed', TOAST_DURATION);
  };

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = ['name', 'phone', 'email', 'password', 'designation', 'roleId'];
    requiredFields.forEach(field => {
      const error = validateField(field, formData[field], formData);
      if (error) newErrors[field] = error;
    });
    
    // Validate confirm password
    const confirmError = validateConfirmPassword(formData.confirmPassword, formData.password);
    if (confirmError) newErrors.confirmPassword = confirmError;
    
    const dobError = validateDob(formData.dob);
    if (dobError) newErrors.dob = dobError;
    setErrors(newErrors);
    
    return Object.keys(newErrors).length === 0;
  };

  // Get role name by ID for display
  const getRoleNameById = (roleId) => {
    const role = rolesList.find(r => String(r.id) === String(roleId));
    return role?.name || role?.roleName || '';
  };

  // Get role badge color by role name
  const getRoleBadgeColor = (roleId) => {
    const roleName = getRoleNameById(roleId);
    const roleNameLower = roleName?.toLowerCase();
    if (roleNameLower === 'admin') return 'bg-purple-100 text-purple-800';
    if (roleNameLower === 'doctor') return 'bg-blue-100 text-blue-800';
    if (roleNameLower === 'staff') return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-700';
  };

  // Handle form submission - Create staff and assign role
  const handleSubmit = async () => {
    resetSubmitState();
    
    if (!validateForm()) {
      showWarningToast('Please fix the validation errors before submitting', TOAST_DURATION);
      return;
    }

    setIsSubmitting(true);

    try {
      const combinedPlace = buildPlace(formData.addressLine1, formData.addressLine2);
      const isActive = formData.status === 'active';
      const roleId = Number(formData.roleId);
      const selectedRoleName = getRoleNameById(roleId);
       
      
      const staffData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        roleId: Number(formData.roleId),
        phone: formData.phone,
        designation: formData.designation,
        joiningDate: formData.joiningDate || undefined,
        jobType: formData.jobType || undefined,
        staffType: formData.staffType || undefined,
        dob: formData.dob || undefined,
        gender: formData.gender.toLowerCase(),
        knowLanguages: formData.knowLanguages || [],
        qualification: formData.qualification || undefined,
        hospitalName: hospitalName,
        address: {
          country: formData.address.country || undefined,
          state: formData.address.state || undefined,
          district: formData.address.district || undefined,
          place: combinedPlace || formData.address.place || undefined,
          pincode: formData.address.pincode ? Number(formData.address.pincode) : undefined
        },
        status: formData.status,
        profileImage: formData.profileImage || undefined,
        imageKey: formData.imageKey || undefined,
      };

      removeUndefined(staffData);
      if (staffData.address) {
        removeUndefined(staffData.address);
      }


      // Create staff
      const response = await createStaff(staffData).unwrap();
      const staff = response.data;
      
      
      // Assign role permission to the created staff
      if (staff?.id && roleId) {
        const payload = {
          hospitalId: Number(hospitalId),
          roleId: roleId,
          userType: "staff",
          staffIds: [
            {
              id: Number(staff.id),
              roleId: roleId
            }
          ]
        };
        
        await assignPermissions(payload).unwrap();
      }
      
      showAddToast(
        `${formData.name} has been added as staff with role ${selectedRoleName}!`,
        SUCCESS_DURATION,
        {
          'Name': formData.name,
          'ID': staff?.id || staff?._id || 'Generated',
          'Email': formData.email,
          'Designation': formData.designation,
          'Role': selectedRoleName,
          'Hospital': hospitalName,
          'Status': isActive ? 'Active' : 'Inactive'
        }
      );
      
      setIsSubmitting(false);
      setSubmitSuccess(true);
      
      setTimeout(() => {
        navigate(STAFFS_ROUTE);
      }, 2000);
      
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleCancel = () => {
    navigate(STAFFS_ROUTE);
  };

  const isFormSubmitting = isSubmitting || isApiLoading || isAssigning;
  const isActive = formData.status === 'active';
  const isLoadingData = rolesLoading;

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#1C62A0]"></div>
          <p className="mt-3 text-gray-500">Loading roles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{ background: '#f4f6f9', fontFamily: "'Segoe UI', sans-serif" }}>
      <div className="p-6">
        <Card className="bg-white rounded-xl shadow-sm overflow-hidden">
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3 mb-1">
                <button onClick={handleGoBack} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                  <ArrowLeft size={20} className="text-gray-600" />
                </button>
                <h2 className="text-lg font-semibold text-gray-800">Staff Information</h2>
              </div>
              <p className="text-sm text-gray-500 mt-1">Add new staff member information</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Profile Image Upload Section */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-4">
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
                      disabled={isFormSubmitting}
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
                <Input 
                  label="Full Name *" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  onBlur={handleBlur} 
                  error={errors.name} 
                  required 
                  placeholder="Enter full name" 
                />
                
                <Input 
                  label="Email *" 
                  name="email" 
                  type="email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  onBlur={handleBlur} 
                  error={errors.email} 
                  required 
                  placeholder="staff@example.com" 
                />
                
                <PasswordInput
                  label="Password *"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.password}
                  touched={true}
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                  placeholder="Enter password (min 8 characters)"
                  icon={Lock}
                  required
                />
                
                <PasswordInput
                  label="Confirm Password *"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.confirmPassword}
                  touched={true}
                  showPassword={showConfirmPassword}
                  setShowPassword={setShowConfirmPassword}
                  placeholder="Confirm your password"
                  icon={Lock}
                  required
                />
                
                <Input 
                  label="Phone Number *" 
                  name="phone" 
                  type="tel" 
                  value={formData.phone} 
                  onChange={handleChange} 
                  onBlur={handleBlur} 
                  error={errors.phone} 
                  required 
                  placeholder="+1 00000 00000" 
                />

                {/* Assign Role - Dynamic dropdown like AddNewUser */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign Role <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Shield size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <select
                      name="roleId"
                      value={formData.roleId}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent appearance-none bg-white"
                    >
                      <option value="">Select a role</option>
                      {rolesList.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name || role.roleName}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.roleId && <p className="mt-1 text-xs text-red-500">{errors.roleId}</p>}
                  {formData.roleId && (
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(formData.roleId)}`}>
                        {getRoleNameById(formData.roleId)}
                      </span>
                    </div>
                  )}
                </div>
                
                <Select 
                  label="Gender" 
                  name="gender" 
                  options={genders} 
                  value={formData.gender} 
                  onChange={handleChange} 
                  onBlur={handleBlur} 
                  error={errors.gender} 
                />
                
                <Input 
                  label="Date of Birth" 
                  name="dob" 
                  type="date" 
                  value={formData.dob} 
                  onChange={handleChange} 
                  onBlur={handleBlur} 
                  error={errors.dob} 
                />
                
                <Select 
                  label="Designation *" 
                  name="designation" 
                  options={designations} 
                  value={formData.designation} 
                  onChange={handleChange} 
                  onBlur={handleBlur} 
                  error={errors.designation} 
                  required 
                />
                
                <Input 
                  label="Joining Date" 
                  name="joiningDate" 
                  type="date" 
                  value={formData.joiningDate} 
                  onChange={handleChange} 
                  onBlur={handleBlur} 
                  error={errors.joiningDate} 
                />
                
                <Select 
                  label="Staff Type" 
                  name="staffType" 
                  options={staffTypes} 
                  value={formData.staffType} 
                  onChange={handleChange} 
                  onBlur={handleBlur} 
                  error={errors.staffType} 
                />
                
                <Select 
                  label="Job Type" 
                  name="jobType" 
                  options={jobTypes} 
                  value={formData.jobType} 
                  onChange={handleChange} 
                  onBlur={handleBlur} 
                  error={errors.jobType} 
                />
              </div>

              {/* Languages Known */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Languages Known</label>
                <div className="flex gap-2 mb-2">
                  <select
                    value={languagesInput}
                    onChange={(e) => setLanguagesInput(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1C62A0]"
                  >
                    <option value="">Select a language</option>
                    {languages.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                  <Button type="button" variant="outline" onClick={handleAddLanguage}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.knowLanguages.map((lang, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-sm flex items-center gap-1">
                      {lang}
                      <button type="button" onClick={() => handleRemoveLanguage(lang)} className="hover:text-red-500">×</button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Qualification */}
              <div>
                <Input 
                  label="Qualification" 
                  name="qualification" 
                  value={formData.qualification} 
                  onChange={handleChange} 
                  placeholder="MBA, B.Tech, etc." 
                />
              </div>

              {/* Address Information */}
              <div>
                <h4 className="text-md font-semibold text-gray-800 mb-4 mt-2">Address Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Select 
                    label="Country" 
                    name="address.country" 
                    options={countries} 
                    value={formData.address.country} 
                    onChange={handleChange} 
                  />
                  <Select 
                    label="State" 
                    name="address.state" 
                    options={states} 
                    value={formData.address.state} 
                    onChange={handleChange} 
                  />
                  <Select 
                    label="District" 
                    name="address.district" 
                    options={districts} 
                    value={formData.address.district} 
                    onChange={handleChange} 
                  />
                  <div className="md:col-span-2">
                    <Input 
                      label="Address Line 1" 
                      name="addressLine1" 
                      value={formData.addressLine1} 
                      onChange={handleAddressLineChange} 
                      placeholder="Street address" 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Input 
                      label="Address Line 2" 
                      name="addressLine2" 
                      value={formData.addressLine2} 
                      onChange={handleAddressLineChange} 
                      placeholder="Apt, suite, unit (optional)" 
                    />
                  </div>
                  <Input 
                    label="Pincode" 
                    name="address.pincode" 
                    value={formData.address.pincode} 
                    onChange={handleChange} 
                    placeholder="Postal code (6 digits)" 
                    maxLength={6}
                  />
                </div>
              </div>

              {/* Status Toggle */}
              <div className="pt-4 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-3">Status</label>
                <div className="flex items-center">
                  <Switch checked={isActive} onChange={handleStatusToggle} />
                  <span className="ml-3 text-sm text-gray-600">{isActive ? 'Active' : 'Inactive'}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Toggle to activate or deactivate this staff member</p>
              </div>
            </div>

            {/* Form Actions */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="flex items-center gap-2"
                disabled={isFormSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isFormSubmitting}
                className="flex items-center gap-2"
                disabled={isFormSubmitting}
              >
                {isFormSubmitting ? 'Saving...' : 'Save Staff'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default AddStaff;