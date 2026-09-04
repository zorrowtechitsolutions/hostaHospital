// src/components/staffs/EditStaff.jsx - COMPLETE FIXED VERSION
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ChevronRight, Upload, X, Shield, ArrowLeft, Lock, Eye, EyeOff, Power,
  User, Mail, Phone, Calendar, MapPin, AlertCircle, Building, Briefcase,
  GraduationCap, DollarSign, ChevronDown, Users, Home
} from 'lucide-react';
import {
  Button,
  Input,
  Select,
  Card,
  Alert,
  Loader
} from '../ui';
import {
  showUpdateToast,
  showDeleteToast,
  showSuccessToast,
  showErrorToast,
  showWarningToast
} from '../ui/Toast';

import {
  useGetStaffByIdQuery,
  useUpdateStaffMutation,
  useChangeStaffPasswordMutation
} from '../../../app/service/staffApi';
import { useAssignPermissionsMutation } from '../../../app/service/rolePermission';
import { useGetRolesQuery } from '../../../app/service/role';
import { getAuthUser } from '../../utils/auth';
import { uploadToS3, S3_BASE_URL } from '../../../app/service/S3';
import { Country, State, City } from 'country-state-city';

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

// Helper function to get auth ID
const getAuthId = () => {
  const authUser = getAuthUser();
  return authUser?.id || authUser?.userId || authUser?._id || null;
};

// Helper function to get full image URL with cache-busting
const getFullImageUrl = (imageKey) => {
  if (!imageKey) return null;
  
  if (imageKey.startsWith('http://') || imageKey.startsWith('https://')) {
    return `${imageKey}?t=${Date.now()}`;
  }
  
  return `${S3_BASE_URL}/${encodeURIComponent(imageKey)}?t=${Date.now()}`;
};

// Status Toggle Component
const StatusToggle = React.memo(({ status, onToggle, disabled }) => {
  const isActive = status;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h3 className="text-md font-semibold text-gray-900 flex items-center gap-2">
          <Power className="h-5 w-5 text-blue-600" /> 
          Staff Status
        </h3>
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">
              {isActive ? 'Active' : 'Inactive'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {isActive 
                ? 'Staff is currently active' 
                : 'Staff is inactive and will not appear in search results'}
            </p>
          </div>
          <button
            type="button"
            onClick={onToggle}
            disabled={disabled}
            className={`
              relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
              ${isActive ? 'bg-green-500' : 'bg-gray-300'}
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <span
              className={`
                inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 shadow-md
                ${isActive ? 'translate-x-6' : 'translate-x-1'}
              `}
            />
          </button>
        </div>
      </div>
    </div>
  );
});

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

// Searchable Dropdown Component (same as AddStaff)
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

// Language options
const languageOptions = [
  { value: 'English', label: 'English' },
  { value: 'Spanish', label: 'Spanish' },
  { value: 'French', label: 'French' },
  { value: 'German', label: 'German' },
  { value: 'Chinese', label: 'Chinese' },
  { value: 'Japanese', label: 'Japanese' },
  { value: 'Arabic', label: 'Arabic' },
  { value: 'Hindi', label: 'Hindi' },
  { value: 'Bengali', label: 'Bengali' },
  { value: 'Portuguese', label: 'Portuguese' },
  { value: 'Malayalam', label: 'Malayalam' },
  { value: 'Tamil', label: 'Tamil' },
  { value: 'Telugu', label: 'Telugu' },
  { value: 'Kannada', label: 'Kannada' }
];

// Designations
const designations = ['Compounder', 'Nurse', 'Purchase Officer', 'Supervisor', 'Receptionist', 'Lab Assistant', 'Pharmacist', 'Doctor', 'Technician', 'Admin'];
const jobTypes = ['Day Shift', 'Night Shift', 'Remote', 'Hybrid'];
const staffTypes = ['Permanent', 'Contract', 'Temporary', 'Intern'];
const genders = ['male', 'female', 'other'];

const EditStaff = () => {
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  
  // Clean the ID
  const staffId = paramId ? paramId.replace(/[^0-9]/g, '') : '';
  
  // Get IDs using the helper functions
  const hospitalId = getHospitalId();
  const authUser = getAuthUser();
  const authId = getAuthId();
  const hospitalName = authUser?.name || '';
  
  // Role assignment state
  const [assignPermissions, { isLoading: isAssigning }] = useAssignPermissionsMutation();
  
  // Fetch roles with proper hospitalId
  const {
    data: rolesData,
    isLoading: rolesLoading,
  } = useGetRolesQuery({
    hospitalId: hospitalId || undefined,
    limit: 100
  }, {
    skip: !hospitalId
  });
  
  // Extract roles from response - include admin role (id=2) and hospital-specific roles
  const rolesList = [
    ...(rolesData?.admin || []).filter(role => role.id === 2),
    ...(rolesData?.data || []).filter(role => role.hospitalId === Number(hospitalId))
  ];
  
  const [formData, setFormData] = useState({
    profileImage: null,
    imageUrl: null,
    imageKey: null,
    name: '',
    gender: '',
    dob: '',
    phone: '',
    email: '',
    designation: '',
    roleId: '',
    joiningDate: '',
    staffType: '',
    jobType: '',
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
    password: '',
    confirmPassword: '',
    isActive: true
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const countries = useMemo(() => Country.getAllCountries(), []);
  const states = useMemo(() => State.getStatesOfCountry(formData.countryCode), [formData.countryCode]);
  const cities = useMemo(() => City.getCitiesOfState(formData.countryCode, formData.stateCode), [formData.countryCode, formData.stateCode]);

  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewImage, setPreviewImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formInitialized, setFormInitialized] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // State for language dropdown
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  
  // State to force image refresh
  const [imageRefreshKey, setImageRefreshKey] = useState(Date.now());

  // API hooks
  const { data: staffResponse, isLoading, error, refetch } = useGetStaffByIdQuery(staffId, {
    skip: !staffId
  });
  
  const [updateStaff, { isLoading: isUpdateLoading }] = useUpdateStaffMutation();
  
  // Password change hook
  const [changeStaffPassword, { isLoading: isPasswordChanging }] = useChangeStaffPasswordMutation();

  // Extract staff from response
  const staff = staffResponse?.data?.staff || staffResponse?.staff || staffResponse?.data || staffResponse;

  // Helper function to format staff ID
  const formatStaffId = (id) => {
    if (!id) return '#SF0000';
    let numericId;
    if (typeof id === 'string') {
      const match = id.match(/\d+/);
      numericId = match ? parseInt(match[0]) : parseInt(id) || 0;
    } else {
      numericId = parseInt(id) || 0;
    }
    return `#SF${String(numericId).padStart(4, '0')}`;
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

  // Check if hospitalId exists
  useEffect(() => {
    if (!hospitalId) {
      // No hospital ID found
    }
  }, [hospitalId]);

  // Reset everything when staff ID changes
  useEffect(() => {
    setFormInitialized(false);
    setFormData({
      profileImage: null,
      imageUrl: null,
      imageKey: null,
      name: '',
      gender: '',
      dob: '',
      phone: '',
      email: '',
      designation: '',
      roleId: '',
      joiningDate: '',
      staffType: '',
      jobType: '',
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
      password: '',
      confirmPassword: '',
      isActive: true
    });
    setPreviewImage(null);
    setImageLoaded(false);
    setImageRefreshKey(Date.now());
    setErrors({});
    
    if (staffId) {
      refetch();
    }
    
    return () => {
      setFormInitialized(false);
    };
  }, [staffId]);

  // Initialize form with staff data - ALL FIELDS INCLUDING LOCATION
  useEffect(() => {
    if (staff && staff.id && !formInitialized) {
      console.log('📋 Staff data received:', staff);
      
      // Get image key from staff
      const imageKey = 
        staff?.imageUrl ||
        staff?.profileImage ||
        staff?.image ||
        staff?.imageKey ||
        null;
      
      // Extract address details
      const address = staff?.address || {};
      
      // Extract country code from country name
      const countryName = address.country || '';
      const countryCode = countries.find(c => c.name === countryName)?.isoCode || '';
      
      // Extract state code from state name
      const stateName = address.state || '';
      const stateCode = State.getStatesOfCountry(countryCode).find(s => s.name === stateName)?.isoCode || '';
      
      // Extract district (city)
      const district = address.district || '';
      
      // Extract place and pincode
      const place = address.place || '';
      const pincode = address.pincode || '';
      
      console.log('📍 Location data extracted:', { countryName, countryCode, stateName, stateCode, district, place, pincode });
      
      const newFormData = {
        profileImage: imageKey,
        imageUrl: imageKey,
        imageKey: imageKey,
        name: staff.name || "",
        gender: staff.gender ? staff.gender.charAt(0).toUpperCase() + staff.gender.slice(1) : "",
        dob: staff.dob ? new Date(staff.dob).toISOString().split('T')[0] : "",
        phone: staff.phone || staff.mobile || "",
        email: staff.email || "",
        designation: staff.designation || "",
        roleId: staff.roleId || "",
        joiningDate: staff.joiningDate ? new Date(staff.joiningDate).toISOString().split('T')[0] : "",
        staffType: staff.staffType || "",
        jobType: staff.jobType || "",
        knowLanguages: staff.knowLanguages || [],
        qualification: staff.qualification || "",
        countryCode: countryCode,
        countryName: countryName,
        stateCode: stateCode,
        stateName: stateName,
        district: district,
        place: place,
        pincode: pincode,
        addressLine1: address.addressLine1 || address.line1 || address.street || '',
        addressLine2: address.addressLine2 || address.line2 || '',
        password: '',
        confirmPassword: '',
        isActive: staff.isActive ?? true
      };
      
      console.log('📝 Form data set:', newFormData);
      
      setFormData(newFormData);
      
      // Set preview image with cache-busting
      if (imageKey) {
        setPreviewImage(getFullImageUrl(imageKey));
        setImageRefreshKey(Date.now());
      }
      
      setFormInitialized(true);
    }
  }, [staff, formInitialized, countries]);

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

  // handleImageUpload with explicit staff ID and role
  const handleImageUpload = async (file) => {
    if (!file) return;
    
    const imageError = validateImage(file);
    if (imageError) {
      setErrors(prev => ({ ...prev, profileImage: imageError }));
      showWarningToast(imageError, 3000);
      return;
    }
    
    setErrors(prev => ({ ...prev, profileImage: '' }));
    setUploadProgress(10);
    
    const reader = new FileReader();
    reader.onloadend = () => setPreviewImage(reader.result);
    reader.readAsDataURL(file);
    
    try {
      setUploadProgress(30);
      
      const uploaded = await uploadToS3(
        file, 
        formData.imageKey || null,
        Number(staffId),
        "staff"
      );
      
      setUploadProgress(100);
      
      setFormData(prev => ({
        ...prev,
        imageUrl: uploaded.key,
        profileImage: uploaded.key,
        imageKey: uploaded.key
      }));
      
      setImageRefreshKey(Date.now());
      
      setTimeout(() => setUploadProgress(0), 1000);
      showSuccessToast('Image uploaded successfully!', 3000);
    } catch (error) {
      setUploadProgress(0);
      setErrors(prev => ({ ...prev, profileImage: 'Failed to upload image. Please try again.' }));
      showErrorToast('Failed to upload image. Please try again.', 3000);
      if (formData.profileImage) {
        setPreviewImage(getFullImageUrl(formData.profileImage));
      } else {
        setPreviewImage(null);
      }
    }
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

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) handleImageUpload(file);
  };

  const removeImage = () => {
    setPreviewImage(null);
    setImageLoaded(false);
    setUploadProgress(0);
    setFormData(prev => ({ ...prev, profileImage: null, imageUrl: null, imageKey: '' }));
    setErrors(prev => ({ ...prev, profileImage: '' }));
    setImageRefreshKey(Date.now());
    showSuccessToast('Image removed', 2000);
  };

  // Language handlers
  const handleLanguageSelect = useCallback((languageValue) => {
    setFormData(prev => {
      const currentLanguages = [...prev.knowLanguages];
      if (currentLanguages.includes(languageValue)) {
        return { ...prev, knowLanguages: currentLanguages.filter(lang => lang !== languageValue) };
      } else {
        return { ...prev, knowLanguages: [...currentLanguages, languageValue] };
      }
    });
  }, []);

  const removeLanguage = useCallback((languageValue) => {
    setFormData(prev => ({
      ...prev,
      knowLanguages: prev.knowLanguages.filter(lang => lang !== languageValue)
    }));
  }, []);

  const getLanguageLabel = (value) => {
    const lang = languageOptions.find(l => l.value === value);
    return lang ? lang.label : value;
  };

  // handleFieldChange with event object protection
  const handleFieldChange = useCallback((field, value) => {
    // Prevent event/object from being stored
    if (value && typeof value === "object" && value.target) {
      value = value.target.value;
    }

    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const toggleStaffStatus = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      isActive: !prev.isActive
    }));
    showSuccessToast(`Staff status changed to ${!formData.isActive ? 'Active' : 'Inactive'}`, 2000);
  }, [formData.isActive]);

  // Password validation
  const validatePassword = (password) => {
    if (!password) return '';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Password must contain at least one special character';
    return '';
  };

  const validateConfirmPassword = (confirmPassword, password) => {
    if (password && !confirmPassword) return 'Please confirm your password';
    if (password && confirmPassword !== password) return 'Passwords do not match';
    return '';
  };

  // ❌ REMOVED: Phone validation from frontend - let backend handle it

  // Form validation - without phone validation
  const validateField = (name, value) => {
    switch (name) {
      case 'name':
        if (!value || value.trim() === '') return 'Full name is required';
        if (value.length < 2) return 'Name must be at least 2 characters';
        return '';
      case 'email':
        if (!value || value.trim() === '') return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Please enter a valid email address';
        return '';
      case 'designation':
        if (!value) return 'Designation is required';
        return '';
      case 'roleId':
        if (!value) return 'Please select a role';
        return '';
      case 'password':
        return validatePassword(value);
      case 'confirmPassword':
        return validateConfirmPassword(value, formData.password);
      default:
        return '';
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = ['name', 'email', 'designation', 'roleId'];
    requiredFields.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });
    
    // Validate password if user is trying to change it
    if (formData.password) {
      const passwordError = validatePassword(formData.password);
      if (passwordError) newErrors.password = passwordError;
      const confirmError = validateConfirmPassword(formData.confirmPassword, formData.password);
      if (confirmError) newErrors.confirmPassword = confirmError;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // handleSubmit with proper password change API integration
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate hospitalId exists
    if (!hospitalId) {
      showErrorToast('❌ Hospital ID not found. Please log in again.');
      return;
    }

    // Validate password confirmation if password is provided
    if (formData.password && formData.password !== formData.confirmPassword) {
      showErrorToast('❌ Passwords do not match!');
      return;
    }

    if (!validateForm()) {
      showWarningToast('Please fix the validation errors before submitting', 3000);
      return;
    }

    try {
      setIsSubmitting(true);

      const roleId = Number(formData.roleId);
      const selectedRoleName = getRoleNameById(roleId);

      // Build address object with all fields
      const address = {
        country: formData.countryName || '',
        state: formData.stateName || '',
        district: formData.district || '',
        place: formData.place || '',
        pincode: formData.pincode ? Number(formData.pincode) : null,
        addressLine1: formData.addressLine1 || '',
        addressLine2: formData.addressLine2 || ''
      };

      // Remove empty/undefined values from address
      Object.keys(address).forEach(key => {
        if (address[key] === '' || address[key] === null || address[key] === undefined) {
          delete address[key];
        }
      });

      const updatedStaffData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        designation: formData.designation,
        joiningDate: formData.joiningDate,
        jobType: formData.jobType,
        staffType: formData.staffType,
        dob: formData.dob,
        gender: formData.gender?.toLowerCase(),
        knowLanguages: formData.knowLanguages,
        qualification: formData.qualification,
        roleId: roleId,
        hospitalName: hospitalName,
        hospitalId: Number(hospitalId),
        authId: authId,
        imageUrl: formData.imageUrl,
        profileImage: formData.profileImage,
        imageKey: formData.imageKey,
        isActive: formData.isActive,
        address: address
      };

      // Remove undefined values
      Object.keys(updatedStaffData).forEach(key => {
        if (updatedStaffData[key] === undefined || updatedStaffData[key] === '') {
          delete updatedStaffData[key];
        }
      });

      console.log('📤 Submitting staff data:', updatedStaffData);

      // STEP 1: Update staff basic info
      await updateStaff({
        id: String(staffId),
        data: updatedStaffData,
        hospitalId: Number(hospitalId),
        authId: authId
      }).unwrap();

      // STEP 2: Change password only if a new password is provided
      if (formData.password) {
        await changeStaffPassword({
          staffId: String(staffId),
          newPassword: formData.password,
          confirmPassword: formData.confirmPassword,
        }).unwrap();
      }

      // STEP 3: Update role permission if roleId exists
      if (roleId) {
        const payload = {
          hospitalId: Number(hospitalId),
          roleId: roleId,
          userType: "staff",
          staffIds: [
            {
              id: Number(staffId),
              roleId: roleId
            }
          ]
        };
        
        await assignPermissions(payload).unwrap();
      }

      // Force image refresh after update
      setImageRefreshKey(Date.now());
      await refetch();

      // Clear password fields after successful update
      setFormData(prev => ({
        ...prev,
        password: '',
        confirmPassword: ''
      }));

      showUpdateToast(
        `${formData.name}'s information has been updated successfully!`,
        4000,
        {
          'Name': formData.name,
          'ID': staffId,
          'Designation': formData.designation,
          'Role': selectedRoleName,
          'Status': formData.isActive ? 'Active' : 'Inactive',
          ...(formData.password ? { 'Password': 'Updated ✓' } : {})
        }
      );

      setTimeout(() => {
        navigate("/staffs");
      }, 1500);

    } catch (error) {
      console.error('Update Staff Error:', error);
      
      // ✅ IMPROVED: Extract error message from various response formats
      const status = error?.status || error?.originalStatus;
      
      if (status === 401) {
        showErrorToast('Session expired. Please login again.', 3000);
        setTimeout(() => {
          window.location.href = '/sign-in';
        }, 2000);
        return;
      }
      
      // ✅ Extract the specific error message from backend
      const message =
        error?.data?.error?.details?.[0]?.message ||
        error?.data?.details?.[0]?.message ||
        error?.data?.errors?.[0]?.message ||
        error?.data?.error?.message ||
        error?.data?.message ||
        error?.error ||
        error?.message ||
        'Failed to update staff member';
      
      showErrorToast(message, 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => {
    navigate('/staffs');
  };

  const handleRetry = () => {
    refetch();
  };

  // Show error state if no hospitalId
  if (!hospitalId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-lg">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Hospital ID Not Found</h2>
          <p className="text-gray-600 mb-4">
            Please log in again to access this page.
          </p>
          <Button 
            variant="primary" 
            onClick={() => navigate('/login')}
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  // Loading states
  if (isLoading || rolesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading staff data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-lg">
          <div className="bg-red-100 rounded-full h-20 w-20 flex items-center justify-center mx-auto">
            <AlertCircle className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mt-4">Error Loading Staff</h2>
          <p className="text-gray-600 mt-2">There was an error loading the staff data.</p>
          <div className="flex gap-3 mt-6 justify-center">
            <Button variant="outline" onClick={handleGoBack}>
              Back to Staff List
            </Button>
            <Button variant="primary" onClick={handleRetry}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!staff && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-lg">
          <div className="bg-yellow-100 rounded-full h-20 w-20 flex items-center justify-center mx-auto">
            <AlertCircle className="h-10 w-10 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mt-4">Staff Not Found</h2>
          <p className="text-gray-600 mt-2">No staff member found with ID: {staffId}</p>
          <Button variant="primary" onClick={handleGoBack} className="mt-6">
            Back to Staff List
          </Button>
        </div>
      </div>
    );
  }

  const isUploading = uploadProgress > 0 && uploadProgress < 100;
  const isFormSubmitting = isSubmitting || isUpdateLoading || isAssigning || isPasswordChanging;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Button variant="ghost" size="sm" onClick={handleGoBack} className="p-2">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Staff</h1>
              <p className="text-sm text-gray-500 mt-1">
                Editing: {formData.name} ({formatStaffId(staff?.id || staffId)})
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <div className="p-6 space-y-6">
              {/* Profile Image Section */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center border-2 border-gray-200 overflow-hidden shadow-sm">
                      {previewImage ? (
                        <img 
                          key={imageRefreshKey}
                          src={previewImage} 
                          alt="Profile" 
                          className="w-full h-full object-cover rounded-full"
                          onLoad={() => setImageLoaded(true)}
                          onError={() => setImageLoaded(false)}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-full">
                          <span className="text-gray-400 text-2xl font-medium">
                            {formData.name ? formData.name.charAt(0).toUpperCase() : 'S'}
                          </span>
                        </div>
                      )}
                    </div>
                    {(previewImage || formData.profileImage) && (
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
                    <input id="profileImageInput" type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleFileSelect} className="hidden" />
                    <Button type="button" variant="outline" onClick={() => document.getElementById('profileImageInput').click()} className="inline-flex items-center gap-2" disabled={isFormSubmitting}>
                      <Upload className="h-4 w-4" /> Upload New Image
                    </Button>
                    <p className="text-xs text-gray-400 mt-2">JPEG, PNG, GIF, WEBP accepted. Max 5MB</p>
                  </div>
                  {isUploading && (
                    <div className="mt-2">
                      <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-[#1C62A0] transition-all duration-300 rounded-full" style={{ width: `${uploadProgress}%` }} />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Uploading to cloud... {uploadProgress}%</p>
                    </div>
                  )}
                  {errors.profileImage && <Alert type="error" message={errors.profileImage} className="mt-2" />}
                </div>
              </div>

              {/* Staff ID Display */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Staff ID:</span>
                  <span className="text-sm font-medium text-gray-900 bg-gray-100 px-2 py-1 rounded">
                    {formatStaffId(staff?.id || staffId)}
                  </span>
                </div>
              </div>

              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input 
                  label="Full Name *" 
                  name="name" 
                  icon={User}
                  placeholder="Enter full name" 
                  value={formData.name} 
                  onChange={(e) => handleFieldChange('name', e.target.value)} 
                  error={errors.name}
                  touched={touched.name}
                  onBlur={(e) => {
                    setTouched(prev => ({ ...prev, name: true }));
                    const error = validateField('name', e.target.value);
                    setErrors(prev => ({ ...prev, name: error }));
                  }}
                  required 
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={(e) => handleFieldChange('gender', e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent appearance-none bg-white"
                    >
                      <option value="">Select gender</option>
                      {genders.map(gender => (
                        <option key={gender} value={gender.charAt(0).toUpperCase() + gender.slice(1)}>
                          {gender.charAt(0).toUpperCase() + gender.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input 
                  label="Date of Birth" 
                  name="dob" 
                  type="date" 
                  icon={Calendar} 
                  value={formData.dob} 
                  onChange={(e) => handleFieldChange('dob', e.target.value)} 
                />
                <Input 
                  label="Joining Date" 
                  name="joiningDate" 
                  type="date" 
                  icon={Calendar} 
                  value={formData.joiningDate} 
                  onChange={(e) => handleFieldChange('joiningDate', e.target.value)} 
                />
              </div>

              {/* Role Assignment */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign Role <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Shield size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select
                    name="roleId"
                    value={formData.roleId}
                    onChange={(e) => handleFieldChange('roleId', e.target.value)}
                    onBlur={(e) => {
                      setTouched(prev => ({ ...prev, roleId: true }));
                      const error = validateField('roleId', e.target.value);
                      setErrors(prev => ({ ...prev, roleId: error }));
                    }}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white ${
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
                {touched.roleId && errors.roleId && <p className="mt-1 text-xs text-red-500">{errors.roleId}</p>}
                {formData.roleId && (
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(formData.roleId)}`}>
                      {getRoleNameById(formData.roleId)}
                    </span>
                  </div>
                )}
              </div>

              {/* Professional Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Designation * <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
                    <select
                      name="designation"
                      value={formData.designation}
                      onChange={(e) => handleFieldChange('designation', e.target.value)}
                      onBlur={(e) => {
                        setTouched(prev => ({ ...prev, designation: true }));
                        const error = validateField('designation', e.target.value);
                        setErrors(prev => ({ ...prev, designation: error }));
                      }}
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
                  {touched.designation && errors.designation && <p className="mt-1 text-xs text-red-500">{errors.designation}</p>}
                </div>
                <Input 
                  label="Qualification" 
                  name="qualification" 
                  icon={GraduationCap} 
                  placeholder="e.g., MBA, B.Tech" 
                  value={formData.qualification} 
                  onChange={(e) => handleFieldChange('qualification', e.target.value)} 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Staff Type</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
                    <select
                      name="staffType"
                      value={formData.staffType}
                      onChange={(e) => handleFieldChange('staffType', e.target.value)}
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
                      onChange={(e) => handleFieldChange('jobType', e.target.value)}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input 
                  label="Phone Number *" 
                  name="phone" 
                  icon={Phone} 
                  placeholder="10 digit phone number" 
                  value={formData.phone} 
                  onChange={(e) => {
                    // ❌ REMOVED: No frontend restriction - let backend handle it
                    handleFieldChange('phone', e.target.value);
                  }}
                  required 
                />
                <Input 
                  label="Email Address *" 
                  name="email" 
                  type="email" 
                  icon={Mail} 
                  placeholder="staff@example.com" 
                  value={formData.email} 
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  onBlur={(e) => {
                    setTouched(prev => ({ ...prev, email: true }));
                    const error = validateField('email', e.target.value);
                    setErrors(prev => ({ ...prev, email: error }));
                  }}
                  error={errors.email}
                  touched={touched.email}
                  required 
                />
              </div>

              {/* Languages Multi-select */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Known Languages
                </label>
                
                {formData.knowLanguages.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.knowLanguages.map(lang => (
                      <span key={lang} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm">
                        {getLanguageLabel(lang)}
                        <button type="button" onClick={() => removeLanguage(lang)} className="hover:text-blue-600">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                    className={`w-full px-3 py-2 text-left border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between bg-white ${
                      formData.knowLanguages.length === 0 ? 'text-gray-400' : 'text-gray-900'
                    }`}
                  >
                    <span>
                      {formData.knowLanguages.length === 0 ? 'Select languages' : `${formData.knowLanguages.length} language(s) selected`}
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${showLanguageDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showLanguageDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowLanguageDropdown(false)} />
                      <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                        {languageOptions.map(lang => (
                          <label key={lang.value} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.knowLanguages.includes(lang.value)}
                              onChange={() => handleLanguageSelect(lang.value)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">{lang.label}</span>
                          </label>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Account Details Section with Password fields */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="relative">
                    <PasswordInput
                      label="New Password"
                      name="password"
                      value={formData.password}
                      onChange={(e) => handleFieldChange('password', e.target.value)}
                      onBlur={(e) => {
                        setTouched(prev => ({ ...prev, password: true }));
                        const error = validateField('password', e.target.value);
                        setErrors(prev => ({ ...prev, password: error }));
                      }}
                      error={errors.password}
                      touched={touched.password}
                      showPassword={showPassword}
                      setShowPassword={setShowPassword}
                      placeholder="Leave blank to keep current"
                      icon={Lock}
                    />
                  </div>
                  
                  <div className="relative">
                    <PasswordInput
                      label="Confirm New Password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
                      onBlur={(e) => {
                        setTouched(prev => ({ ...prev, confirmPassword: true }));
                        const error = validateField('confirmPassword', e.target.value);
                        setErrors(prev => ({ ...prev, confirmPassword: error }));
                      }}
                      error={errors.confirmPassword}
                      touched={touched.confirmPassword}
                      showPassword={showConfirmPassword}
                      setShowPassword={setShowConfirmPassword}
                      placeholder="Confirm new password"
                      icon={Lock}
                    />
                  </div>
                </div>
                {formData.password && !errors.password && (
                  <p className="text-xs text-green-600 mt-2">✓ New password will be updated</p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  Leave password fields blank to keep the current password
                </p>
              </div>

              {/* Address Information with Searchable Dropdowns */}
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input 
                      label="Address Line 1" 
                      name="addressLine1" 
                      icon={Home}
                      placeholder="Street address"
                      value={formData.addressLine1} 
                      onChange={(e) => handleFieldChange('addressLine1', e.target.value)} 
                    />
                    <Input 
                      label="Address Line 2" 
                      name="addressLine2" 
                      icon={Home}
                      placeholder="Apt, suite, unit (optional)"
                      value={formData.addressLine2} 
                      onChange={(e) => handleFieldChange('addressLine2', e.target.value)} 
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input 
                      label="Place" 
                      name="place" 
                      placeholder="Place/Locality"
                      value={formData.place} 
                      onChange={(e) => handleFieldChange('place', e.target.value)} 
                    />
                    <Input 
                      label="Pincode" 
                      name="pincode" 
                      placeholder="Postal code"
                      value={formData.pincode} 
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/\D/g, '').slice(0, 6);
                        handleFieldChange('pincode', cleaned);
                      }}
                      maxLength={6}
                    />
                  </div>
                </div>
              </div>

              {/* Status Toggle */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <StatusToggle 
                  status={formData.isActive} 
                  onToggle={toggleStaffStatus}
                  disabled={isFormSubmitting}
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end gap-3 rounded-b-lg">
              <Button variant="outline" onClick={handleGoBack} disabled={isFormSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isFormSubmitting} loading={isFormSubmitting}>
                {isFormSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </div>
  );
};

export default EditStaff;