// src/components/staffs/EditStaff.jsx - With Debug Logs
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ChevronRight, Upload, X, Shield, ArrowLeft, Lock, Eye, EyeOff } from 'lucide-react';
import {
  Button,
  Input,
  Select,
  Card,
  Tabs,
  Alert,
  Switch
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
  useChangeStaffPasswordMutation
} from '../../../app/service/staffApi';
import { useAssignPermissionsMutation } from '../../../app/service/rolePermission';
import { useGetRolesQuery } from '../../../app/service/role';
import { getHospitalId, getAuthUser } from '../../utils/auth';
import { uploadToS3, S3_BASE_URL } from '../../../app/service/S3';

// Helper function to get full image URL from key/filename with URL encoding
const getFullImageUrl = (imageKey) => {
  if (!imageKey) return null;
  
  if (imageKey.startsWith("http")) {
    return imageKey;
  }
  
  return `${S3_BASE_URL}/${encodeURIComponent(imageKey)}`;
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
  </div>
);

const EditStaff = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('basic');
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewImage, setPreviewImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Password change states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordTouched, setPasswordTouched] = useState({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Get hospital ID and hospital name from auth
  const hospitalId = getHospitalId();
  const authUser = getAuthUser();
  const hospitalName = authUser?.name || '';
  
  console.log("🏥 Hospital ID from auth:", hospitalId);
  console.log("🏥 Hospital Name from auth:", hospitalName);
  
  // Role assignment state
  const [assignPermissions, { isLoading: isAssigning }] = useAssignPermissionsMutation();
  
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
  
  // ✅ API hooks - Use getStaffById for single staff fetch
  const {
    data: staffData,
    isLoading: loading,
    refetch
  } = useGetStaffByIdQuery(
    id,
    { skip: !id }
  );
  
  const [updateStaff, { isLoading: isUpdateLoading }] = useUpdateStaffMutation();
  const [deleteStaff, { isLoading: isDeleteLoading }] = useDeleteStaffMutation();
  const [changeStaffPassword, { isLoading: isPasswordLoading }] = useChangeStaffPasswordMutation();

  const [formData, setFormData] = useState({
    id: '',
    originalId: '',
    staffId: '',
    name: '',
    gender: 'Male',
    dob: '',
    mobile: '',
    email: '',
    designation: '',
    roleId: '',
    appointmentDate: '',
    staffType: 'Permanent',
    jobType: 'Full Time',
    knowLanguages: [],
    qualification: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    country: '',
    place: '',
    pincode: '',
    isActive: true,
    profileImage: null,
    imageUrl: null,
    imageKey: '',
  });

  // Helper function to remove undefined values from an object
  const removeUndefined = obj => {
    Object.keys(obj).forEach(key => {
      if (obj[key] === undefined) {
        delete obj[key];
      }
    });
    return obj;
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

  // Image validation helper
  const validateImage = file => {
    if (file.size > 5 * 1024 * 1024) {
      return 'File size must be less than 5MB';
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return 'Only JPEG, PNG, GIF, and WEBP files are allowed';
    }

    return '';
  };

  // Password validation
  const validateCurrentPassword = (password) => {
    if (!password) return 'Current password is required';
    return '';
  };

  const validateNewPassword = (password) => {
    if (!password) return 'New password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    return '';
  };

  const validateConfirmPassword = (confirmPassword, newPassword) => {
    if (!confirmPassword) return 'Please confirm your password';
    if (confirmPassword !== newPassword) return 'Passwords do not match';
    return '';
  };

  const validatePasswordField = (name, value) => {
    switch (name) {
      case 'currentPassword': return validateCurrentPassword(value);
      case 'newPassword': return validateNewPassword(value);
      case 'confirmPassword': return validateConfirmPassword(value, passwordData.newPassword);
      default: return '';
    }
  };

  const handlePasswordBlur = (e) => {
    const { name, value } = e.target;
    setPasswordTouched(prev => ({ ...prev, [name]: true }));
    const error = validatePasswordField(name, value);
    setPasswordErrors(prev => ({ ...prev, [name]: error }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    if (passwordErrors[name]) setPasswordErrors(prev => ({ ...prev, [name]: '' }));
    
    // If new password changes, re-validate confirm password
    if (name === 'newPassword' && passwordData.confirmPassword) {
      const confirmError = validateConfirmPassword(passwordData.confirmPassword, value);
      setPasswordErrors(prev => ({ ...prev, confirmPassword: confirmError }));
    }
  };

  const validatePasswordForm = () => {
    const newErrors = {};
    const fields = ['currentPassword', 'newPassword', 'confirmPassword'];
    fields.forEach(field => {
      const error = validatePasswordField(field, passwordData[field]);
      if (error) newErrors[field] = error;
    });
    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validatePasswordForm()) {
      showWarningToast('Please fix the password validation errors', 3000);
      return;
    }

    setIsChangingPassword(true);

    try {
      console.log("formData.id:", formData.id);

      console.log("Password Request:", {
        staffId: Number(formData.id),
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      });

      await changeStaffPassword({
        staffId: Number(formData.id),
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      }).unwrap();

      showSuccessToast("Password changed successfully!", 3000);

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setPasswordErrors({});
      setPasswordTouched({});
      setIsChangingPassword(false);

    } catch (error) {
      console.error("Password change error:", error);
      setIsChangingPassword(false);
    }
  };

  // Populate form data from API response
  useEffect(() => {
    if (staffData?.data) {
      const staff = staffData.data;
      populateFormData(staff);
    } else if (location.state?.staff) {
      populateFormData(location.state.staff);
    }
  }, [staffData, location]);

  const populateFormData = (staff) => {
    console.log("🔍 RAW STAFF DATA:", staff);
    
    // Prioritize imageUrl, then imageKey, then profileImage
    const imageKey = staff.imageUrl || staff.imageKey || staff.profileImage || null;
    
    console.log("🖼️ Extracted imageKey:", imageKey);
    
    const address = staff.address || {};
    const place = address.place || '';
    const addressParts = place?.split(' ') || [];
    
    setFormData({
      id: staff.id || staff._id || '',
      originalId: staff.id || staff._id || '',
      staffId: formatStaffId(staff.id || staff._id || ''),
      name: staff.name || '',
      gender: staff.gender ? staff.gender.charAt(0).toUpperCase() + staff.gender.slice(1) : 'Male',
      dob: staff.dob ? staff.dob.split('T')[0] : '',
      mobile: staff.phone || '',
      email: staff.email || '',
      designation: staff.designation || '',
      roleId: staff.roleId || '',
      appointmentDate: staff.joiningDate ? staff.joiningDate.split('T')[0] : '',
      staffType: staff.staffType || 'Permanent',
      jobType: staff.jobType || 'Full Time',
      knowLanguages: staff.knowLanguages || [],
      qualification: staff.qualification || '',
      addressLine1: addressParts[0] || '',
      addressLine2: addressParts.slice(1).join(' ') || '',
      city: address.district || '',
      state: address.state || '',
      country: address.country || '',
      place: address.place || '',
      pincode: address.pincode || '',
      isActive: staff.isActive ?? true,
      profileImage: imageKey,
      imageUrl: imageKey,
      imageKey: imageKey,
    });
    
    // Set preview image using getFullImageUrl helper
    if (imageKey) {
      const fullUrl = getFullImageUrl(imageKey);
      console.log("🖼️ Setting preview image URL:", fullUrl);
      setPreviewImage(fullUrl);
    } else {
      console.log("❌ No profile image found");
      setPreviewImage(null);
    }
  };

  // ✅ FIXED: Image upload handler with hospital ID and DEBUG LOGS
  const handleImageUpload = async (file) => {
    if (!file) return false;
    
    const imageError = validateImage(file);
    if (imageError) {
      setErrors(prev => ({ ...prev, profileImage: imageError }));
      showWarningToast(imageError, 3000);
      return false;
    }
    
    setErrors(prev => ({ ...prev, profileImage: '' }));
    setUploadProgress(10);
    
    const reader = new FileReader();
    reader.onloadend = () => setPreviewImage(reader.result);
    reader.readAsDataURL(file);
    
    try {
      setUploadProgress(30);
      
      // ✅ DEBUG LOGS - Add these before the uploadToS3 call
      console.log("🔍 === EDIT STAFF UPLOAD DEBUG ===");
      console.log("🏥 Hospital ID:", hospitalId);
      console.log("🖼️ Image Key:", formData.imageKey);
      console.log("👤 Role:", "staff");
      console.log("📁 Staff ID:", formData.id);
      console.log("📄 File name:", file.name);
      console.log("📦 File size:", (file.size / 1024).toFixed(2), "KB");
      console.log("==================================");
      
      // ✅ FIX: Use hospitalId for S3 upload (NOT staff ID)
      const uploaded = await uploadToS3(
        file, 
        formData.imageKey || null,
        Number(formData.id),  // ✅ Use hospital ID
        "staff"              // ✅ Role is "staff"
      );
      
      setUploadProgress(100);
      
      // Store the key in all three fields
      setFormData(prev => ({
        ...prev,
        imageUrl: uploaded.key,
        profileImage: uploaded.key,
        imageKey: uploaded.key
      }));
      
      setTimeout(() => setUploadProgress(0), 1000);
      showSuccessToast('Image uploaded successfully!', 2000);
      return true;
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
      return false;
    }
  };

  const handleFileSelect = e => {
    const file = e.target.files[0];
    if (file) handleImageUpload(file);
  };

  const removeImage = () => {
    setPreviewImage(null);
    setUploadProgress(0);
    setFormData(prev => ({
      ...prev,
      profileImage: null,
      imageUrl: null,
      imageKey: ''
    }));
    setErrors(prev => ({
      ...prev,
      profileImage: ''
    }));
    showSuccessToast('Image removed', 2000);
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

  const validateRole = (roleId) => {
    if (!roleId) return 'Please select a role';
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
      case 'roleId': return validateRole(value);
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

  const handleStatusToggle = () => {
    setFormData(prev => ({
      ...prev,
      isActive: !prev.isActive
    }));
    showSuccessToast(`Staff status changed to ${!formData.isActive ? 'Active' : 'Inactive'}`, 2000);
  };

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = ['name', 'mobile', 'email', 'designation', 'roleId'];
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

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteStaff(formData.id).unwrap();
      showDeleteToast(
        `${formData.name} has been deleted successfully!`,
        4000,
        {
          'Name': formData.name,
          'ID': formData.id,
          'Designation': formData.designation
        }
      );
      setIsDeleting(false);
      setSubmitSuccess(true);
      setTimeout(() => navigate('/staffs'), 1500);
    } catch (error) {
      showErrorToast(error?.data?.message || 'Failed to delete staff member', 3000);
      setIsDeleting(false);
      setDeleteConfirm(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      if (errors.name || errors.mobile || errors.email || errors.designation || errors.dob) setActiveTab('basic');
      showWarningToast('Please fix the validation errors before submitting', 3000);
      return;
    }

    setIsSubmitting(true);

    try {
      const combinedPlace = `${formData.addressLine1} ${formData.addressLine2}`.trim();
      const roleId = Number(formData.roleId);
      const selectedRoleName = getRoleNameById(roleId);
      
      const updateData = {
        name: formData.name,
        email: formData.email,
        phone: formData.mobile,
        designation: formData.designation,
        joiningDate: formData.appointmentDate || undefined,
        jobType: formData.jobType || undefined,
        staffType: formData.staffType || undefined,
        dob: formData.dob || undefined,
        gender: formData.gender.toLowerCase(),
        knowLanguages: formData.knowLanguages,
        qualification: formData.qualification || undefined,
        roleId: roleId,
        hospitalName: hospitalName,
        address: {
          country: formData.country || undefined,
          state: formData.state || undefined,
          district: formData.city || undefined,
          place: combinedPlace || formData.place || undefined,
          pincode: formData.pincode ? Number(formData.pincode) : undefined
        },
        isActive: formData.isActive,
        imageUrl: formData.imageUrl,
        profileImage: formData.profileImage,
        imageKey: formData.imageKey,
      };

      removeUndefined(updateData);
      if (updateData.address) {
        removeUndefined(updateData.address);
      }

      console.log("📤 UPDATE DATA BEING SENT TO API:", JSON.stringify(updateData, null, 2));

      await updateStaff({
        id: formData.id,
        data: updateData
      }).unwrap();

      // Update role permission if roleId changed
      if (roleId) {
        const payload = {
          hospitalId: Number(hospitalId),
          roleId: roleId,
          userType: "staff",
          staffIds: [
            {
              id: Number(formData.id),
              roleId: roleId
            }
          ]
        };
        
        await assignPermissions(payload).unwrap();
      }

      await refetch();
      
      showUpdateToast(
        `${formData.name}'s information has been updated successfully!`,
        4000,
        {
          'Name': formData.name,
          'ID': formData.id,
          'Designation': formData.designation,
          'Role': selectedRoleName,
          'Hospital': hospitalName,
          'Status': formData.isActive ? 'Active' : 'Inactive'
        }
      );
      
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setTimeout(() => navigate('/staffs'), 1500);
    } catch (error) {
      console.error("Update error:", error);
      showErrorToast(error?.data?.message || 'Failed to update staff member', 3000);
      setIsSubmitting(false);
      setSubmitError(error?.data?.message || 'Failed to update staff');
    }
  };

  const designations = ['Compounder', 'Nurse', 'Purchase Officer', 'Supervisor', 'Receptionist', 'Lab Assistant', 'Pharmacist', 'Doctor', 'Technician', 'Admin'];
  const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'Austin'];
  const states = ['California', 'Texas', 'New York', 'Florida', 'Illinois', 'Pennsylvania', 'Ohio', 'Georgia', 'North Carolina', 'Michigan'];
  const countries = ['United States', 'Canada', 'United Kingdom', 'Australia', 'India', 'Germany', 'France', 'Japan', 'Brazil', 'Mexico'];

  const tabs = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'password', label: 'Change Password' }
  ];

  const isFormSubmitting = isSubmitting || isUpdateLoading || isAssigning;
  const isUploading = uploadProgress > 0 && uploadProgress < 100;
  const isLoadingData = loading || rolesLoading;

  // Skeleton Loading State
  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-gray-50" style={{ background: '#f4f6f9' }}>
        <div className="p-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="border-b border-gray-200 px-6 pt-4">
              <div className="flex gap-6">
                <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>

            <div className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-6 pb-6 border-b border-gray-200">
                <div className="w-24 h-24 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-10 w-40 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 w-48 bg-gray-200 rounded animate-pulse mt-2"></div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
                </div>
                {[...Array(15)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{ background: '#f4f6f9', fontFamily: "'Segoe UI', sans-serif" }}>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Delete</h3>
            <p className="text-gray-600 mb-4">Are you sure you want to delete <span className="font-semibold">{formData.name}</span>? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteConfirm(false)} disabled={isDeleting || isDeleteLoading}>Cancel</Button>
              <Button variant="danger" onClick={handleDelete} disabled={isDeleting || isDeleteLoading} loading={isDeleting || isDeleteLoading}>
                {isDeleting || isDeleteLoading ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="p-6">
        <Card>
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/staffs')} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Edit Staff</h2>
                <p className="text-sm text-gray-500 mt-0.5">Update staff member information</p>
              </div>
            </div>
          </div>
          
          <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

          {activeTab === 'basic' && (
            <div className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center border-2 border-gray-200 overflow-hidden shadow-sm">
                      {previewImage ? (
                        <img 
                          src={previewImage} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error("❌ Image failed to load:", previewImage);
                            e.target.style.display = 'none';
                            const parent = e.target.parentElement;
                            if (parent) {
                              parent.innerHTML = `<div class="w-full h-full bg-gray-100 flex items-center justify-center">
                                <span class="text-gray-400 text-2xl font-medium">${formData.name ? formData.name.charAt(0).toUpperCase() : '?'}</span>
                              </div>`;
                            }
                          }}
                        />
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
                      disabled={isFormSubmitting}
                    >
                      <Upload className="h-4 w-4" />
                      Upload New Image
                    </Button>
                    <p className="text-xs text-gray-400 mt-2">JPEG, PNG, GIF, WEBP accepted. Max 5MB</p>
                  </div>
                  
                  {isUploading && (
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
                {/* ✅ Staff ID field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Staff ID</label>
                  <input 
                    type="text" 
                    value={formData.staffId || formData.id} 
                    disabled 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600" 
                  />
                </div>
                
                <Input 
                  label="Full Name *" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  onBlur={handleBlur} 
                  error={errors.name} 
                  touched={touched.name} 
                  required 
                  placeholder="Enter full name" 
                />
                
                {/* Assign Role - Dynamic dropdown */}
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
                
                <Select label="Gender" name="gender" options={['Male', 'Female', 'Other']} value={formData.gender} onChange={handleChange} onBlur={handleBlur} error={errors.gender} touched={touched.gender} />
                <Input label="Date of Birth" name="dob" type="date" value={formData.dob} onChange={handleChange} onBlur={handleBlur} error={errors.dob} touched={touched.dob} />
                <Input label="Mobile Number *" name="mobile" type="tel" value={formData.mobile} onChange={handleChange} onBlur={handleBlur} error={errors.mobile} touched={touched.mobile} required placeholder="+1 00000 00000" />
                <Input label="Email *" name="email" type="email" value={formData.email} onChange={handleChange} onBlur={handleBlur} error={errors.email} touched={touched.email} required placeholder="staff@example.com" />
                <Select label="Designation *" name="designation" options={designations} value={formData.designation} onChange={handleChange} onBlur={handleBlur} error={errors.designation} touched={touched.designation} required />
                <Input label="Joining Date" name="appointmentDate" type="date" value={formData.appointmentDate} onChange={handleChange} onBlur={handleBlur} error={errors.appointmentDate} touched={touched.appointmentDate} />
                <Input label="Qualification" name="qualification" value={formData.qualification} onChange={handleChange} placeholder="MBA, B.Tech, etc." />
                <Select label="Staff Type" name="staffType" options={['Permanent', 'Contract', 'Temporary', 'Intern']} value={formData.staffType} onChange={handleChange} onBlur={handleBlur} error={errors.staffType} touched={touched.staffType} />
                <Select label="Job Type" name="jobType" options={['Full Time', 'Part Time', 'Remote', 'Hybrid']} value={formData.jobType} onChange={handleChange} onBlur={handleBlur} error={errors.jobType} touched={touched.jobType} />
                <div className="md:col-span-2"><Input label="Address Line 1" name="addressLine1" value={formData.addressLine1} onChange={handleChange} placeholder="Street address" /></div>
                <div className="md:col-span-2"><Input label="Address Line 2" name="addressLine2" value={formData.addressLine2} onChange={handleChange} placeholder="Apt, suite, unit (optional)" /></div>
                <Select label="City/District" name="city" options={cities} value={formData.city} onChange={handleChange} onBlur={handleBlur} error={errors.city} touched={touched.city} />
                <Select label="State" name="state" options={states} value={formData.state} onChange={handleChange} onBlur={handleBlur} error={errors.state} touched={touched.state} />
                <Select label="Country" name="country" options={countries} value={formData.country} onChange={handleChange} onBlur={handleBlur} error={errors.country} touched={touched.country} />
                <Input label="Pincode" name="pincode" value={formData.pincode} onChange={handleChange} onBlur={handleBlur} error={errors.pincode} touched={touched.pincode} placeholder="Postal code" maxLength={6} />
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-3">Status</label>
                <div className="flex items-center">
                  <Switch checked={formData.isActive} onChange={handleStatusToggle} />
                  <span className="ml-3 text-sm text-gray-600">{formData.isActive ? 'Active' : 'Inactive'}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Toggle to {formData.isActive ? 'deactivate' : 'activate'} this staff member
                </p>
                <div className="mt-3">
                  {formData.isActive ? (
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      Staff is currently ACTIVE
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      Staff is currently INACTIVE
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'password' && (
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Change Password</h3>
                  <p className="text-sm text-gray-500">Update your account password</p>
                </div>
              </div>

              <div className="max-w-lg space-y-4">
                <PasswordInput
                  label="Current Password *"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  onBlur={handlePasswordBlur}
                  error={passwordErrors.currentPassword}
                  touched={passwordTouched.currentPassword}
                  showPassword={showCurrentPassword}
                  setShowPassword={setShowCurrentPassword}
                  placeholder="Enter current password"
                  icon={Lock}
                  required
                />

                <PasswordInput
                  label="New Password *"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  onBlur={handlePasswordBlur}
                  error={passwordErrors.newPassword}
                  touched={passwordTouched.newPassword}
                  showPassword={showNewPassword}
                  setShowPassword={setShowNewPassword}
                  placeholder="Enter new password (min 8 characters)"
                  icon={Lock}
                  required
                />

                <PasswordInput
                  label="Confirm New Password *"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  onBlur={handlePasswordBlur}
                  error={passwordErrors.confirmPassword}
                  touched={passwordTouched.confirmPassword}
                  showPassword={showConfirmPassword}
                  setShowPassword={setShowConfirmPassword}
                  placeholder="Confirm new password"
                  icon={Lock}
                  required
                />

                <div className="pt-4 border-t border-gray-200">
                  <Button
                    variant="primary"
                    onClick={handleChangePassword}
                    disabled={isChangingPassword || isPasswordLoading}
                    loading={isChangingPassword || isPasswordLoading}
                    className="w-full sm:w-auto"
                  >
                    {isChangingPassword || isPasswordLoading ? 'Changing...' : 'Change Password'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end gap-3">
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate('/staffs')} disabled={isFormSubmitting}>Cancel</Button>
              <Button variant="danger" onClick={() => setDeleteConfirm(true)} disabled={isDeleting || isDeleteLoading || isFormSubmitting}>
                Delete
              </Button>
              <Button variant="primary" onClick={handleSubmit} disabled={isFormSubmitting} loading={isFormSubmitting}>
                {isFormSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default EditStaff;