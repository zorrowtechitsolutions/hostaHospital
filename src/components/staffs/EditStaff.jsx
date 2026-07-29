// src/components/staffs/EditStaff.jsx - With Password Fields in Basic Info (no separate tab)
import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense, lazy } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  ChevronRight, Upload, X, Shield, ArrowLeft, Lock, Eye, EyeOff, Power,
  User, Mail, Phone, Calendar, MapPin, AlertCircle, Building, Briefcase,
  GraduationCap, DollarSign, ChevronDown 
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
  useDeleteStaffMutation,
  useChangeStaffPasswordMutation  // ✅ Import the password change hook
} from '../../../app/service/staffApi';
import { useAssignPermissionsMutation } from '../../../app/service/rolePermission';
import { useGetRolesQuery } from '../../../app/service/role';
import { getAuthUser } from '../../utils/auth';
import { uploadToS3, S3_BASE_URL } from '../../../app/service/S3';

// 🔥 FIX: Enhanced helper function to get hospital ID (same pattern as EditDoctor)
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

// 🔥 FIX: Enhanced helper function to get auth ID (same pattern as EditDoctor)
const getAuthId = () => {
  const authUser = getAuthUser();
  return authUser?.id || authUser?.userId || authUser?._id || null;
};

// FIX: Enhanced helper function to get full image URL with cache-busting
const getFullImageUrl = (imageKey) => {
  if (!imageKey) return null;
  
  if (imageKey.startsWith('http://') || imageKey.startsWith('https://')) {
    return `${imageKey}?t=${Date.now()}`;
  }
  
  return `${S3_BASE_URL}/${encodeURIComponent(imageKey)}?t=${Date.now()}`;
};

// Lazy Image Component with Intersection Observer - same as EditDoctor
const LazyProfileImage = ({ imageKey, name, onLoad, onError, refreshKey }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!imageKey) {
      setIsLoading(false);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setImageSrc(getFullImageUrl(imageKey));
            observer.disconnect();
          }
        });
      },
      { rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [imageKey, refreshKey]);

  return (
    <div ref={imgRef} className="w-full h-full">
      {isLoading && (
        <div className="w-full h-full bg-gray-200 animate-pulse rounded-full flex items-center justify-center">
          <span className="text-gray-400 text-2xl font-medium">
            {name ? name.charAt(0).toUpperCase() : 'S'}
          </span>
        </div>
      )}
      {imageSrc && (
        <img
          key={refreshKey}
          src={imageSrc}
          alt="Profile"
          className="w-full h-full object-cover rounded-full"
          onLoad={() => {
            setIsLoading(false);
            onLoad?.();
          }}
          onError={(e) => {
            setIsLoading(false);
            onError?.(e);
          }}
        />
      )}
      {!imageSrc && !isLoading && (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-full">
          <span className="text-gray-400 text-2xl font-medium">
            {name ? name.charAt(0).toUpperCase() : 'S'}
          </span>
        </div>
      )}
    </div>
  );
};

// Form Section Skeleton Loader - same as EditDoctor
const FormSectionSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-8 w-40 bg-gray-200 rounded"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-24 bg-gray-200 rounded"></div>
          <div className="h-10 w-full bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  </div>
);

// Profile Section Skeleton - same as EditDoctor
const ProfileSectionSkeleton = () => (
  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-4 bg-gray-50 rounded-lg animate-pulse">
    <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
    <div className="flex-1 w-full">
      <div className="h-5 w-32 bg-gray-200 rounded mb-2"></div>
      <div className="h-10 w-40 bg-gray-200 rounded"></div>
      <div className="h-3 w-48 bg-gray-200 rounded mt-2"></div>
    </div>
  </div>
);

// Centered Loader Component - same as EditDoctor
const CenteredLoader = ({ text = "Loading..." }) => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">{text}</p>
    </div>
  </div>
);

// Status Toggle Component - same as EditDoctor
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

// Password Input Component - same as EditDoctor
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

// Language options
const languageOptions = [
  { value: 'mal', label: 'Malayalam' },
  { value: 'eng', label: 'English' },
  { value: 'hin', label: 'Hindi' },
  { value: 'tam', label: 'Tamil' },
  { value: 'tel', label: 'Telugu' },
  { value: 'kan', label: 'Kannada' },
  { value: 'ben', label: 'Bengali' },
  { value: 'mar', label: 'Marathi' },
  { value: 'guj', label: 'Gujarati' },
  { value: 'pun', label: 'Punjabi' },
  { value: 'urd', label: 'Urdu' }
];

const EditStaff = () => {
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  const location = useLocation();
  
  // Clean the ID (same as EditDoctor)
  const staffId = paramId ? paramId.replace(/[^0-9]/g, '') : '';
  
  // 🔥 FIX: Get IDs using the helper functions (same pattern as EditDoctor)
  const hospitalId = getHospitalId();
  const authUser = getAuthUser();
  const authId = getAuthId();
  const hospitalName = authUser?.name || '';
  
  // Role assignment state
  const [assignPermissions, { isLoading: isAssigning }] = useAssignPermissionsMutation();
  
  // 🔥 FIX: Fetch roles with proper hospitalId (skip if no hospitalId)
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
  
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewImage, setPreviewImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formInitialized, setFormInitialized] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // 🔥 FIX: Add the missing state for language dropdown
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  
  // FIX: Add state to force image refresh
  const [imageRefreshKey, setImageRefreshKey] = useState(Date.now());
  
  // Form state - consistent with EditDoctor pattern, includes password fields
  const [formData, setFormData] = useState({
    profileImage: null,
    imageUrl: null,
    imageKey: null,
    name: '',
    gender: '',
    dob: '',
    phoneNumber: '',
    email: '',
    designation: '',
    roleId: '',
    joiningDate: '',
    staffType: '',
    jobType: '',
    knowLanguages: [],
    qualification: '',
    country: '',
    state: '',
    district: '',
    place: '',
    pincode: '',
    password: '',
    confirmPassword: '',
    isActive: true
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // API hooks
  const { data: staffResponse, isLoading, error, refetch } = useGetStaffByIdQuery(staffId, {
    skip: !staffId
  });
  
  const [updateStaff, { isLoading: isUpdateLoading }] = useUpdateStaffMutation();
  
  // ✅ Add the password change hook
  const [changeStaffPassword, { isLoading: isPasswordChanging }] = useChangeStaffPasswordMutation();

  // Extract staff from response (handles different response structures like EditDoctor)
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

  // Get role name by ID for display (same as EditDoctor)
  const getRoleNameById = (roleId) => {
    const role = rolesList.find(r => String(r.id) === String(roleId));
    return role?.name || role?.roleName || '';
  };

  // Get role badge color by role name (same as EditDoctor)
  const getRoleBadgeColor = (roleId) => {
    const roleName = getRoleNameById(roleId);
    const roleNameLower = roleName?.toLowerCase();
    if (roleNameLower === 'admin') return 'bg-purple-100 text-purple-800';
    if (roleNameLower === 'doctor') return 'bg-blue-100 text-blue-800';
    if (roleNameLower === 'staff') return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-700';
  };

  const designations = ['Compounder', 'Nurse', 'Purchase Officer', 'Supervisor', 'Receptionist', 'Lab Assistant', 'Pharmacist', 'Doctor', 'Technician', 'Admin'];
  const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'Austin'];
  const states = ['California', 'Texas', 'New York', 'Florida', 'Illinois', 'Pennsylvania', 'Ohio', 'Georgia', 'North Carolina', 'Michigan'];
  const countries = ['United States', 'Canada', 'United Kingdom', 'Australia', 'India', 'Germany', 'France', 'Japan', 'Brazil', 'Mexico'];

  // 🔥 FIX: Check if hospitalId exists and show error if not (same as EditDoctor)
  useEffect(() => {
    if (!hospitalId) {
      console.warn('⚠️ No hospital ID found. Please log in again.');
    }
  }, [hospitalId]);

  // ✅ FIX: Reset everything when staff ID changes or component mounts (same as EditDoctor)
  useEffect(() => {
    setFormInitialized(false);
    setFormData({
      profileImage: null,
      imageUrl: null,
      imageKey: null,
      name: '',
      gender: '',
      dob: '',
      phoneNumber: '',
      email: '',
      designation: '',
      roleId: '',
      joiningDate: '',
      staffType: '',
      jobType: '',
      knowLanguages: [],
      qualification: '',
      country: '',
      state: '',
      district: '',
      place: '',
      pincode: '',
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
  }, [staffId]); // Runs when staffId changes (same as EditDoctor)

  // Initialize form with staff data (same pattern as EditDoctor)
  useEffect(() => {
    if (staff && staff.id && !formInitialized) {
      // Get image key from staff
      const imageKey = 
        staff?.imageUrl ||
        staff?.profileImage ||
        staff?.image ||
        staff?.imageKey ||
        null;
      
      // Extract address details
      const address = staff?.address || {};
      
      const newFormData = {
        profileImage: imageKey,
        imageUrl: imageKey,
        imageKey: imageKey,
        name: staff.name || "",
        gender: staff.gender ? staff.gender.charAt(0).toUpperCase() + staff.gender.slice(1) : "",
        dob: staff.dob ? new Date(staff.dob).toISOString().split('T')[0] : "",
        phoneNumber: staff.phone || staff.mobile || "",
        email: staff.email || "",
        designation: staff.designation || "",
        roleId: staff.roleId || "",
        joiningDate: staff.joiningDate ? new Date(staff.joiningDate).toISOString().split('T')[0] : "",
        staffType: staff.staffType || "Permanent",
        jobType: staff.jobType || "Full Time",
        knowLanguages: staff.knowLanguages || [],
        qualification: staff.qualification || "",
        country: address.country || "",
        state: address.state || "",
        district: address.district || "",
        place: address.place || "",
        pincode: address.pincode || "",
        password: '',
        confirmPassword: '',
        isActive: staff.isActive ?? true
      };
      
      setFormData(newFormData);
      
      // Set preview image with cache-busting
      if (imageKey) {
        setPreviewImage(getFullImageUrl(imageKey));
        setImageRefreshKey(Date.now());
      }
      
      setFormInitialized(true);
    }
  }, [staff, formInitialized]);

  // ✅ FIXED: handleImageUpload with explicit staff ID and role (same as EditDoctor)
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
      
      // ✅ FIX: Pass the staff ID and role explicitly (same as EditDoctor)
      const uploaded = await uploadToS3(
        file, 
        formData.imageKey || null,
        Number(staffId),  // ✅ Pass staff ID explicitly
        "staff"           // ✅ Pass role explicitly
      );
      
      setUploadProgress(100);
      
      setFormData(prev => ({
        ...prev,
        imageUrl: uploaded.key,
        profileImage: uploaded.key,
        imageKey: uploaded.key
      }));
      
      // FIX: Force image refresh after upload
      setImageRefreshKey(Date.now());
      
      setTimeout(() => setUploadProgress(0), 1000);
      showSuccessToast('Image uploaded successfully!', 3000);
    } catch (error) {
      console.error("Upload error details:", error);
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

  // Language handlers (same as EditDoctor)
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

  const handleFieldChange = useCallback((field, value) => {
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

  // Password validation (same as EditDoctor pattern)
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

  // Form validation (same as EditDoctor pattern)
  const validateField = (name, value) => {
    switch (name) {
      case 'name':
        if (!value || value.trim() === '') return 'Full name is required';
        if (value.length < 2) return 'Name must be at least 2 characters';
        return '';
      case 'phoneNumber':
        if (!value || value.trim() === '') return 'Mobile number is required';
        const mobileRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{3,5}[-\s\.]?[0-9]{4,6}$/;
        if (!mobileRegex.test(value)) return 'Please enter a valid mobile number';
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
    const requiredFields = ['name', 'phoneNumber', 'email', 'designation', 'roleId'];
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

  // ✅ Updated handleSubmit with password change API integration
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 🔥 Validate hospitalId exists (same as EditDoctor)
    if (!hospitalId) {
      showErrorToast('❌ Hospital ID not found. Please log in again.');
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

      const updatedStaffData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phoneNumber,
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
        address: {
          country: formData.country,
          state: formData.state,
          district: formData.district,
          place: formData.place,
          pincode: formData.pincode ? Number(formData.pincode) : null
        }
      };

      console.log('📤 Updating staff data:', {
        ...updatedStaffData,
        hospitalId: hospitalId,
        authId: authId,
        password: updatedStaffData.password ? '[REDACTED]' : 'Not changing'
      });

      // ✅ Step 1: Update staff basic info
      await updateStaff({
        id: String(staffId),
        data: updatedStaffData,
        hospitalId: Number(hospitalId),
        authId: authId
      }).unwrap();

      // ✅ Step 2: Change password if a new password is provided
      if (formData.password) {
        try {
          console.log('🔑 Changing password for staff:', staffId);
          
          // Note: For staff password change, we need the current password.
          // Since the staff admin might not know the current password, 
          // we use a special endpoint that doesn't require current password
          // OR we can prompt the admin to enter the current password.
          
          // Option A: If your backend supports admin-initiated password change
          // without current password (recommended for admin use case)
          await changeStaffPassword({
            staffId: Number(staffId),
            currentPassword: formData.currentPassword, // Leave empty for admin-initiated change
            newPassword: formData.password,
            confirmPassword: formData.confirmPassword,
          }).unwrap();
          
          showSuccessToast('Password updated successfully!', 3000);
          
        } catch (passwordError) {
          console.error('Password change error:', passwordError);
          
          // If the API requires current password, prompt the user to enter it
          // Or handle the error appropriately
          if (passwordError?.status === 400 || passwordError?.data?.message?.includes('current')) {
            showWarningToast('Current password verification failed. Please provide the current password.', 5000);
            
            // You could add a modal here to collect current password
            // For now, we'll show an error and continue
          } else {
            throw new Error('Failed to update password: ' + (passwordError?.data?.message || 'Unknown error'));
          }
        }
      }

      // ✅ Step 3: Update role permission if roleId exists
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
        
        console.log('📤 Assigning permissions:', payload);
        await assignPermissions(payload).unwrap();
      }

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
      console.error("Update Error:", error);
      if (error.status === 409) {
        showErrorToast('Email already exists! Please use a different email address.');
      } else if (error.status === 400 && error.data?.message?.includes('password')) {
        showErrorToast('Password update failed: ' + error.data.message);
      } else {
        showErrorToast(error.data?.message || "Failed to update staff member");
      }
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

  // 🔥 FIX: Show error state if no hospitalId (same as EditDoctor)
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

  // Loading states - Show skeleton while form is initializing (same as EditDoctor)
  if (isLoading || rolesLoading) {
    return <CenteredLoader text="Loading staff data..." />;
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

  if (!formInitialized && staff) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mt-2"></div>
          </div>
          <ProfileSectionSkeleton />
          <div className="mt-6">
            <FormSectionSkeleton />
          </div>
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
                Editing: {formData.name}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <div className="p-6 space-y-6">
              {/* Profile Image Section with Lazy Loading - same as EditDoctor */}
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
                        <LazyProfileImage 
                          key={imageRefreshKey}
                          imageKey={formData.profileImage}
                          name={formData.name}
                          refreshKey={imageRefreshKey}
                          onLoad={() => setImageLoaded(true)}
                          onError={() => setImageLoaded(false)}
                        />
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Staff ID:</span>
                  <span className="text-sm font-medium text-gray-900 bg-gray-100 px-2 py-1 rounded">
                    {formatStaffId(staff?.id || staffId)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input 
                  label="Full Name *" 
                  name="name" 
                  icon={User}
                  placeholder="Enter full name" 
                  value={formData.name} 
                  onChange={(e) => handleFieldChange('name', e.target.value)} 
                  required 
                />
                
                <Select 
                  label="Gender" 
                  name="gender" 
                  options={['Male', 'Female', 'Other']} 
                  placeholder="Select Gender" 
                  value={formData.gender} 
                  onChange={(value) => handleFieldChange('gender', value)} 
                />
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

              {/* Assign Role - Dynamic dropdown (same as EditDoctor) */}
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
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Select 
                  label="Designation *" 
                  name="designation" 
                  options={designations} 
                  placeholder="Select designation" 
                  value={formData.designation} 
                  onChange={(value) => handleFieldChange('designation', value)} 
                  required 
                />
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
                <Input 
                  label="Phone Number *" 
                  name="phoneNumber" 
                  icon={Phone} 
                  placeholder="+1 234 567 8900" 
                  value={formData.phoneNumber} 
                  onChange={(e) => handleFieldChange('phoneNumber', e.target.value)} 
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
                  required 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Select 
                  label="Staff Type" 
                  name="staffType" 
                  options={['Permanent', 'Contract', 'Temporary', 'Intern']} 
                  placeholder="Select staff type" 
                  value={formData.staffType} 
                  onChange={(value) => handleFieldChange('staffType', value)} 
                />
                <Select 
                  label="Job Type" 
                  name="jobType" 
                  options={['Full Time', 'Part Time', 'Remote', 'Hybrid']} 
                  placeholder="Select job type" 
                  value={formData.jobType} 
                  onChange={(value) => handleFieldChange('jobType', value)} 
                />
              </div>

              {/* Languages Multi-select - same as EditDoctor */}
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

              {/* Account Details Section - Same as EditDoctor with Password fields */}
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

              {/* Address Section - same as EditDoctor */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h3>
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Select 
                      label="Country" 
                      name="country" 
                      options={countries} 
                      placeholder="Select country" 
                      value={formData.country} 
                      onChange={(value) => handleFieldChange('country', value)} 
                    />
                    <Select 
                      label="State" 
                      name="state" 
                      options={states} 
                      placeholder="Select state" 
                      value={formData.state} 
                      onChange={(value) => handleFieldChange('state', value)} 
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Select 
                      label="City/District" 
                      name="district" 
                      options={cities} 
                      placeholder="Select city" 
                      value={formData.district} 
                      onChange={(value) => handleFieldChange('district', value)} 
                    />
                    <Input 
                      label="Place" 
                      name="place" 
                      icon={MapPin} 
                      placeholder="Place/Locality" 
                      value={formData.place} 
                      onChange={(e) => handleFieldChange('place', e.target.value)} 
                    />
                  </div>
                  <Input 
                    label="Pincode" 
                    name="pincode" 
                    placeholder="Postal code" 
                    value={formData.pincode} 
                    onChange={(e) => handleFieldChange('pincode', e.target.value)} 
                  />
                </div>
              </div>

              {/* Status Toggle - same as EditDoctor */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <StatusToggle 
                  status={formData.isActive} 
                  onToggle={toggleStaffStatus}
                  disabled={isFormSubmitting}
                />
              </div>
            </div>

            {/* Form Actions - Without Delete Button */}
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