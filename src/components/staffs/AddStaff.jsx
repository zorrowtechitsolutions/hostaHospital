// src/components/staffs/AddStaff.jsx - Single Tab Version
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Lock,
  Image,
  Upload,
  X,
  Eye,
  EyeOff,
  Shield,
  Briefcase,
  Users,
  GraduationCap,
  Home,
  ChevronDown,
  CheckCircle,
  XCircle
} from 'lucide-react';
import {
  Button,
  Input,
  Card,
  Switch
} from '../ui';
import { showAddToast, showSuccessToast, showErrorToast, showWarningToast } from '../ui/Toast';
import { useCreateStaffMutation } from '../../../app/service/staffApi';
import { useAssignPermissionsMutation } from '../../../app/service/rolePermission';
import { useGetRolesQuery } from '../../../app/service/role';
import { getAuthUser } from '../../utils/auth';
import { uploadToS3 } from '../../../app/service/S3';
import { Country, State, City } from 'country-state-city';

// Constants
const TOAST_DURATION = 3000;
const SUCCESS_DURATION = 4000;
const STAFFS_ROUTE = '/staffs';
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const GRID_CLASS = "grid grid-cols-1 md:grid-cols-2 gap-5";

// Static arrays
const designations = ['Compounder', 'Nurse', 'Purchase Officer', 'Supervisor', 'Receptionist', 'Lab Assistant', 'Pharmacist', 'Doctor', 'Technician', 'Admin'];
const jobTypes = ['Day Shift', 'Night Shift', 'Remote', 'Hybrid'];
const staffTypes = ['Permanent', 'Contract', 'Temporary', 'Intern'];
const genders = ['male', 'female', 'other'];
const languages = ['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Arabic', 'Hindi', 'Bengali', 'Portuguese', 'Malayalam', 'Tamil', 'Telugu', 'Kannada'];

// Helper function to get hospital ID
const getHospitalId = () => {
  const storedHospitalId = localStorage.getItem('hospitalId');
  if (storedHospitalId) {
    return storedHospitalId;
  }
  
  const authUser = getAuthUser();
  if (authUser?.hospitalId) {
    return authUser.hospitalId;
  }
  
  return null;
};

// Helper functions
const removeUndefined = obj => {
  if (!obj) return obj;
  Object.keys(obj).forEach(key => {
    if (obj[key] === undefined) {
      delete obj[key];
    }
  });
  return obj;
};

const buildPlace = (line1, line2) => `${line1} ${line2}`.trim();

// Validation functions
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
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Password must contain at least one special character';
  return '';
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
  if (file.size > MAX_FILE_SIZE) {
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

// Searchable Dropdown Component
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
  optionKey = (option, index) => option.isoCode || index,
  isLoading = false
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
          placeholder={isLoading ? "Loading..." : placeholder}
          disabled={disabled || isLoading}
          className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-10 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent ${
            (disabled || isLoading) ? 'text-gray-400 bg-gray-50 cursor-not-allowed' : ''
          }`}
        />
        <ChevronDown 
          className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 cursor-pointer transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          onClick={() => !isLoading && setIsOpen(!isOpen)}
        />
      </div>
      
      {isOpen && !isLoading && filteredOptions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.map((option, index) => (
            <div
              key={optionKey(option, index)}
              className="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors flex items-center gap-2"
              onClick={() => handleSelect(option)}
            >
              <Briefcase className="h-4 w-4 text-gray-400" />
              <span className="text-gray-700">{getOptionLabel(option)}</span>
            </div>
          ))}
        </div>
      )}
      
      {isOpen && !isLoading && filteredOptions.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
          No options found
        </div>
      )}

      {isLoading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1C62A0]"></div>
            <span>Loading...</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Password Input Component
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
    {name === 'password' && value && !error && (
      <p className="text-xs text-green-600 mt-1">✓ Password is strong</p>
    )}
    {name === 'password' && value && error && (
      <p className="text-xs text-red-600 mt-1">{error}</p>
    )}
    {name === 'password' && (
      <p className="text-xs text-gray-400 mt-1">
        Password must contain: 8+ chars, uppercase, lowercase, number & special character
      </p>
    )}
  </div>
);

const AddStaff = () => {
  const navigate = useNavigate();
  const [createStaff, { isLoading: isApiLoading }] = useCreateStaffMutation();
  const [assignPermissions, { isLoading: isAssigning }] = useAssignPermissionsMutation();
  
  const hospitalId = getHospitalId();
  const authUser = getAuthUser();
  const hospitalName = authUser?.name || '';

  // Fetch roles
  const {
    data: rolesData,
    isLoading: rolesLoading,
  } = useGetRolesQuery({
    hospitalId,
    limit: 100
  }, {
    skip: !hospitalId
  });

  const rolesList = [
    ...(rolesData?.admin || []).filter(role => role.id === 2),
    ...(rolesData?.data || []).filter(role => role.hospitalId === Number(hospitalId))
  ];

  // Form state
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
    countryCode: '',
    countryName: '',
    stateCode: '',
    stateName: '',
    district: '',
    place: '',
    pincode: '',
    addressLine1: '',
    addressLine2: '',
    status: 'active',
    profileImage: null,
    imageKey: '',
  });

  // Countries/States/Cities
  const countries = Country.getAllCountries();
  const states = State.getStatesOfCountry(formData.countryCode);
  const cities = City.getCitiesOfState(formData.countryCode, formData.stateCode);

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);

  // Helper functions
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

  // Navigation
  const handleGoBack = () => {
    navigate(STAFFS_ROUTE);
  };

  // Address handlers
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

  // Form handlers
  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
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
    
    if (name === 'password' && formData.confirmPassword) {
      const confirmError = validateConfirmPassword(formData.confirmPassword, value);
      setErrors(prev => ({ ...prev, confirmPassword: confirmError }));
    }
    
    if (errors[name]) clearFieldError(name);
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
      
      updatedData.place = combinedPlace;
      
      return updatedData;
    });
  };

  // Language handlers
  const handleLanguageSelect = (languageValue) => {
    setFormData(prev => ({
      ...prev,
      knowLanguages: prev.knowLanguages.includes(languageValue)
        ? prev.knowLanguages.filter(lang => lang !== languageValue)
        : [...prev.knowLanguages, languageValue]
    }));
  };

  const removeLanguage = (languageValue) => {
    setFormData(prev => ({
      ...prev,
      knowLanguages: prev.knowLanguages.filter(lang => lang !== languageValue)
    }));
  };

  // Image handlers
  const handleImageUpload = async (file) => {
    if (!file) return false;
    
    const imageError = validateImage(file);
    if (imageError) {
      setErrors(prev => ({ ...prev, profileImage: imageError }));
      showWarningToast(imageError, TOAST_DURATION);
      return false;
    }

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
      return true;
    } catch {
      showErrorToast('Failed to upload image', TOAST_DURATION);
      return false;
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

  // Status toggle
  const handleStatusToggle = () => {
    setFormData(prev => ({
      ...prev,
      status: prev.status === 'active' ? 'inactive' : 'active'
    }));
  };

  // Role helpers
  const getRoleNameById = (roleId) => {
    const role = rolesList.find(r => String(r.id) === String(roleId));
    return role?.name || role?.roleName || '';
  };

  const getRoleBadgeColor = (roleId) => {
    const roleName = getRoleNameById(roleId)?.toLowerCase();
    if (roleName === 'admin') return 'bg-purple-100 text-purple-800';
    if (roleName === 'doctor') return 'bg-blue-100 text-blue-800';
    if (roleName === 'staff') return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-700';
  };

  // Validation
  const validateForm = () => {
    const newErrors = {};
    const requiredFields = ['name', 'phone', 'email', 'password', 'designation', 'roleId'];
    requiredFields.forEach(field => {
      const error = validateField(field, formData[field], formData);
      if (error) newErrors[field] = error;
    });
    
    const confirmError = validateConfirmPassword(formData.confirmPassword, formData.password);
    if (confirmError) newErrors.confirmPassword = confirmError;
    
    const dobError = validateDob(formData.dob);
    if (dobError) newErrors.dob = dobError;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!hospitalId) {
      showErrorToast('❌ Hospital ID not found. Please log in again.');
      return;
    }

    // Mark all fields as touched
    const touchedFields = {};
    ['name', 'phone', 'email', 'password', 'confirmPassword', 'designation', 'roleId'].forEach(field => {
      touchedFields[field] = true;
    });
    setTouched(touchedFields);

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
        hospitalId: hospitalId,
        address: {
          country: formData.countryName || undefined,
          state: formData.stateName || undefined,
          district: formData.district || undefined,
          place: combinedPlace || formData.place || undefined,
          pincode: formData.pincode ? Number(formData.pincode) : undefined
        },
        status: formData.status,
        profileImage: formData.profileImage || undefined,
        imageKey: formData.imageKey || undefined,
      };

      removeUndefined(staffData);
      if (staffData.address) {
        removeUndefined(staffData.address);
      }

      const response = await createStaff(staffData).unwrap();
      const staff = response.data;

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
      setTimeout(() => {
        navigate(STAFFS_ROUTE);
      }, 2000);

    } catch (error) {
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
      setIsSubmitting(false);
    }
  };

  const isFormSubmitting = isSubmitting || isApiLoading || isAssigning;
  const isActive = formData.status === 'active';

  if (!hospitalId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-lg">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Hospital ID Not Found</h2>
          <p className="text-gray-600 mb-4">Please log in again to access this page.</p>
          <Button variant="primary" onClick={() => navigate('/login')}>Go to Login</Button>
        </div>
      </div>
    );
  }

  if (rolesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#1C62A0] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Button variant="ghost" size="sm" onClick={handleGoBack} className="p-2">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Add New Staff</h1>
              <p className="text-sm text-gray-500 mt-1">Create a new staff profile in the system</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="overflow-hidden">
            <div className="p-6 space-y-6">
              {/* Profile Image Upload */}
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
                      <Upload className="h-4 w-4" /> Upload Image
                    </Button>
                    <p className="text-xs text-gray-400 mt-2">JPEG, PNG, GIF, WEBP accepted. Max 5MB</p>
                  </div>
                  {errors.profileImage && <p className="text-sm text-red-600 mt-1">{errors.profileImage}</p>}
                </div>
              </div>

              {/* Basic Info Grid */}
              <div className={GRID_CLASS}>
                <Input 
                  label="Full Name" 
                  name="name" 
                  icon={User}
                  placeholder="Enter full name"
                  value={formData.name} 
                  onChange={handleChange} 
                  onBlur={handleBlur} 
                  error={errors.name} 
                  touched={touched.name}
                  required 
                />
                
                <Input 
                  label="Email" 
                  name="email" 
                  type="email" 
                  icon={Mail}
                  placeholder="staff@example.com"
                  value={formData.email} 
                  onChange={handleChange} 
                  onBlur={handleBlur} 
                  error={errors.email} 
                  touched={touched.email}
                  required 
                />
              </div>

              <div className={GRID_CLASS}>
                <PasswordInput
                  label="Password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.password}
                  touched={touched.password}
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                  placeholder="Create password (min 8 characters)"
                  icon={Lock}
                  required
                />
                
                <PasswordInput
                  label="Confirm Password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.confirmPassword}
                  touched={touched.confirmPassword}
                  showPassword={showConfirmPassword}
                  setShowPassword={setShowConfirmPassword}
                  placeholder="Confirm your password"
                  icon={Lock}
                  required
                />
              </div>

              <div className={GRID_CLASS}>
                <Input 
                  label="Phone Number" 
                  name="phone" 
                  type="tel" 
                  icon={Phone}
                  placeholder="+1 00000 00000"
                  value={formData.phone} 
                  onChange={handleChange} 
                  onBlur={handleBlur} 
                  error={errors.phone} 
                  touched={touched.phone}
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
                />
              </div>

              <div className={GRID_CLASS}>
                {/* Gender Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent appearance-none bg-white"
                    >
                      {genders.map(gender => (
                        <option key={gender} value={gender}>
                          {gender.charAt(0).toUpperCase() + gender.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <Input 
                  label="Qualification" 
                  name="qualification" 
                  icon={GraduationCap}
                  placeholder="MBA, B.Tech, etc."
                  value={formData.qualification} 
                  onChange={handleChange} 
                />
              </div>

              {/* Designation and Joining Date */}
              <div className={GRID_CLASS}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Designation <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
                    <select
                      name="designation"
                      value={formData.designation}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent appearance-none bg-white ${
                        errors.designation && touched.designation ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select designation</option>
                      {designations.map(designation => (
                        <option key={designation} value={designation}>{designation}</option>
                      ))}
                    </select>
                  </div>
                  {touched.designation && errors.designation && (
                    <p className="text-sm text-red-600 mt-1">{errors.designation}</p>
                  )}
                </div>

                <Input 
                  label="Joining Date" 
                  name="joiningDate" 
                  type="date" 
                  icon={Calendar}
                  value={formData.joiningDate} 
                  onChange={handleChange} 
                />
              </div>

              <div className={GRID_CLASS}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Staff Type</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
                    <select
                      name="staffType"
                      value={formData.staffType}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent appearance-none bg-white"
                    >
                      <option value="">Select staff type</option>
                      {staffTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
                    <select
                      name="jobType"
                      value={formData.jobType}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent appearance-none bg-white"
                    >
                      <option value="">Select job type</option>
                      {jobTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Role Assignment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign Role <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Shield size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
                  <select
                    name="roleId"
                    value={formData.roleId}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent appearance-none bg-white ${
                      errors.roleId && touched.roleId ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select a role</option>
                    {rolesList.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name || role.roleName}
                      </option>
                    ))}
                  </select>
                </div>
                {touched.roleId && errors.roleId && (
                  <p className="mt-1 text-xs text-red-500">{errors.roleId}</p>
                )}
                {formData.roleId && (
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(formData.roleId)}`}>
                      {getRoleNameById(formData.roleId)}
                    </span>
                  </div>
                )}
              </div>

              {/* Languages Known */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Known Languages
                </label>
                
                {formData.knowLanguages.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.knowLanguages.map(lang => (
                      <span key={lang} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm">
                        {lang}
                        <button type="button" onClick={() => removeLanguage(lang)}>
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                    className="w-full px-3 py-2 text-left border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1C62A0] flex items-center justify-between bg-white"
                  >
                    <span className={formData.knowLanguages.length === 0 ? 'text-gray-500' : 'text-gray-700'}>
                      {formData.knowLanguages.length === 0 ? 'Select languages' : `${formData.knowLanguages.length} language(s) selected`}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isLanguageDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isLanguageDropdownOpen && (
                    <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                      {languages.map(lang => (
                        <label key={lang} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.knowLanguages.includes(lang)}
                            onChange={() => handleLanguageSelect(lang)}
                            className="h-4 w-4 text-[#1C62A0] rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">{lang}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Address Information */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h3>
                <div className="space-y-5">
                  <SearchableDropdown
                    label="Country"
                    options={countries}
                    value={formData.countryCode}
                    onChange={handleCountryChange}
                    placeholder="Search for a country..."
                    icon={MapPin}
                  />

                  <SearchableDropdown
                    label="State"
                    options={states}
                    value={formData.stateCode}
                    onChange={handleStateChange}
                    placeholder="Search for a state..."
                    icon={MapPin}
                    disabled={!formData.countryCode}
                  />

                  <SearchableDropdown
                    label="District"
                    options={cities}
                    value={formData.district}
                    onChange={handleCityChange}
                    placeholder="Search for a district..."
                    icon={MapPin}
                    disabled={!formData.stateCode}
                    getOptionLabel={(option) => option.name}
                    getOptionValue={(option) => option.name}
                  />

                  <div className={GRID_CLASS}>
                    <Input 
                      label="Address Line 1" 
                      name="addressLine1" 
                      icon={Home}
                      placeholder="Street address"
                      value={formData.addressLine1} 
                      onChange={handleAddressLineChange} 
                    />
                    <Input 
                      label="Address Line 2" 
                      name="addressLine2" 
                      icon={Home}
                      placeholder="Apt, suite, unit (optional)"
                      value={formData.addressLine2} 
                      onChange={handleAddressLineChange} 
                    />
                  </div>

                  <div className={GRID_CLASS}>
                    <Input 
                      label="Place" 
                      name="place" 
                      placeholder="Place/Locality"
                      value={formData.place} 
                      onChange={handleChange} 
                    />
                    <Input 
                      label="Pincode" 
                      name="pincode" 
                      placeholder="Postal code"
                      value={formData.pincode} 
                      onChange={handleChange} 
                      maxLength={6}
                    />
                  </div>
                </div>
              </div>

              {/* Status Toggle */}
              <div className="pt-4 border-t border-gray-200">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Account Status</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Toggle to activate or deactivate this staff member
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-medium ${isActive ? 'text-green-600' : 'text-red-600'}`}>
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                      <Switch checked={isActive} onChange={handleStatusToggle} />
                    </div>
                  </div>
                  <div className="mt-3">
                    {isActive ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-xs font-medium">Account is active</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-red-600">
                        <XCircle className="h-4 w-4" />
                        <span className="text-xs font-medium">Account is inactive</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <Button variant="outline" onClick={handleGoBack} disabled={isFormSubmitting}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="primary" 
                disabled={isFormSubmitting}
                loading={isFormSubmitting}
              >
                {isFormSubmitting ? 'Saving...' : 'Save Staff'}
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </div>
  );
};

export default AddStaff;