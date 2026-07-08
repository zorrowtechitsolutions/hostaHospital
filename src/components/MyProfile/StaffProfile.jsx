// src/components/MyProfile/StaffProfile.jsx - COMPLETE FIXED VERSION
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail, Phone, Edit, Save, X, Upload, CheckCircle,
  User, Briefcase, Award, Building, Info, Calendar, Users, IdCard,
  MapPin, CalendarDays, Clock, GraduationCap, Home, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useGetStaffByIdQuery, useUpdateStaffMutation } from '../../../app/service/staffApi';
import { uploadToS3, getS3ImageUrl } from '../../../app/service/S3';
import { formatDate } from "../../utils/dateFormatter";

// ==================== CONSTANTS ====================
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const FALLBACK_IMAGE = 'https://ui-avatars.com/api/?name=Staff&background=1C62A0&color=fff&length=2';

const INPUT_CLASS = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent';
const CARD_CLASS = 'bg-white rounded-2xl shadow-sm border border-gray-100 p-6';
const SECTION_TITLE_CLASS = 'text-lg font-semibold text-gray-900 mb-4 flex items-center';
const SECTION_ICON_CLASS = 'w-5 h-5 mr-2 text-blue-600';
const ACTION_BUTTON_CLASS = 'w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors';

// ==================== HELPER FUNCTIONS ====================

const getFullImageUrl = (imageKey) => {
  if (!imageKey) return null;
  
  if (imageKey.startsWith('http://') || imageKey.startsWith('https://')) {
    const separator = imageKey.includes('?') ? '&' : '?';
    return `${imageKey}${separator}_t=${Date.now()}`;
  }
  
  const url = getS3ImageUrl(imageKey);
  if (!url) return null;
  
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_t=${Date.now()}`;
};

// ==================== TOAST FUNCTIONS ====================
const showSuccessToast = (message) => {
  console.log('✅ Success:', message);
};

const showErrorToast = (message) => {
  console.error('❌ Error:', message);
};

const showWarningToast = (message) => {
  console.warn('⚠️ Warning:', message);
};

// ==================== SKELETON LOADER ====================
const ProfileSkeleton = () => (
  <div className="min-h-screen bg-gray-50 p-4">
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="h-9 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
        <div className="h-5 w-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className={CARD_CLASS}>
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-full bg-gray-200 animate-pulse"></div>
              <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mt-4"></div>
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mt-2"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ==================== PROFILE FIELD COMPONENTS ====================

const ProfileField = ({ label, value, isEditing, onChange, type = 'text', icon: Icon, placeholder = '' }) => (
  <div>
    <label className="block text-sm font-medium text-gray-500 mb-1">{label}</label>
    {isEditing ? (
      <input
        type={type}
        value={value || ''}
        onChange={onChange}
        className={INPUT_CLASS}
        placeholder={placeholder}
      />
    ) : (
      <div className="flex items-center space-x-2">
        {Icon && <Icon className="w-4 h-4 text-gray-400" />}
        <span className="text-gray-900">{value || 'Not specified'}</span>
      </div>
    )}
  </div>
);

const ProfileTextarea = ({ label, value, isEditing, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-gray-500 mb-1">{label}</label>
    {isEditing ? (
      <textarea
        value={value || ''}
        onChange={onChange}
        rows={3}
        className={INPUT_CLASS}
        placeholder={`Enter ${label.toLowerCase()}`}
      />
    ) : (
      <p className="text-gray-900 leading-relaxed">{value || 'Not specified'}</p>
    )}
  </div>
);

const SectionTitle = ({ icon: Icon, title }) => (
  <h3 className={SECTION_TITLE_CLASS}>
    <Icon className={SECTION_ICON_CLASS} />
    {title}
  </h3>
);

// ==================== MAIN PROFILE COMPONENT ====================

const StaffProfile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const staffId = user?.staffId || user?.id;
  
  console.log('📱 StaffProfile - Staff ID:', staffId);
  console.log('📱 User object:', user);
  
  const { data: staffResponse, isLoading, error: fetchError, refetch } = useGetStaffByIdQuery(staffId, {
    skip: !staffId,
  });
  
  const [updateStaff, { isLoading: isUpdating }] = useUpdateStaffMutation();

  const [formData, setFormData] = useState({
    id: '', // ✅ Add numeric ID field
    name: '',
    email: '',
    phone: '',
    profileImage: null,
    imageUrl: null,
    imageKey: null,
    designation: '',
    staffType: '',
    qualification: '',
    hospitalName: '',
    department: '',
    bio: '',
    joiningDate: '',
    staffId: '',
    gender: '',
    dob: '',
    jobType: '',
    place: '',
    district: '',
    state: '',
    country: '',
    pincode: '',
    addressString: '',
    knowLanguages: [],
    roleId: '',
    isActive: true,
    createdAt: '',
    updatedAt: ''
  });
  
  const [editForm, setEditForm] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Handle fetch error (401 unauthorized)
  useEffect(() => {
    if (fetchError?.status === 401) {
      showErrorToast('Session expired. Redirecting to login...');
      setTimeout(() => {
        logout();
        navigate('/sign-in');
      }, 2000);
    }
  }, [fetchError, logout, navigate]);

  // ✅ Populate profile from API data
  useEffect(() => {
    console.log('📥 staffResponse changed:', staffResponse);
    
    if (staffResponse) {
      const staff = staffResponse.data;
      console.log('📥 Staff object:', staff);
      
      if (staff) {
        const imageKey = 
          staff?.profilePicture ||
          staff?.imageUrl ||
          staff?.image ||
          null;
        
        // Get address fields
        const address = staff?.address || {};
        const place = address?.place || '';
        const district = address?.district || '';
        const state = address?.state || '';
        const country = address?.country || '';
        const pincode = address?.pincode || '';
        
        // Format address for display
        const addressParts = [place, district, state, country].filter(Boolean);
        const addressString = addressParts.length > 0 ? 
          `${addressParts.join(', ')}${pincode ? ` - ${pincode}` : ''}` : 
          '';
        
        // Format joining date
        const joiningDate = staff?.joiningDate ? 
          staff.joiningDate.split('T')[0] : 
          '';
        
        // Format date of birth
        const dob = staff?.dob ? 
          staff.dob.split('T')[0] : 
          '';
        
        const staffInfo = {
          id: staff?.id || '', // ✅ Store numeric ID
          name: staff?.name || '',
          email: staff?.email || '',
          phone: staff?.phone || '',
          profileImage: imageKey,
          imageUrl: imageKey,
          imageKey: imageKey,
          designation: staff?.designation || '',
          staffType: staff?.staffType || '',
          qualification: staff?.qualification || '',
          hospitalName: staff?.hospitalName || '',
          department: staff?.department || '',
          bio: staff?.bio || '',
          joiningDate: joiningDate,
          staffId: staff?.staffId || staff?.id || '',
          gender: staff?.gender || '',
          dob: dob,
          jobType: staff?.jobType || '',
          place: place,
          district: district,
          state: state,
          country: country,
          pincode: pincode,
          addressString: addressString,
          knowLanguages: staff?.knowLanguages || [],
          roleId: staff?.roleId || '',
          isActive: staff?.isActive ?? true,
          createdAt: staff?.createdAt || '',
          updatedAt: staff?.updatedAt || ''
        };
        
        console.log('📥 Staff info populated:', staffInfo);
        
        setFormData(staffInfo);
        setEditForm(staffInfo);
        
        if (imageKey) {
          const fullUrl = getFullImageUrl(imageKey);
          setPreviewImage(fullUrl);
          setImageError(false);
        }
      }
    }
  }, [staffResponse]);

  const resetUploadState = () => {
    setUploadProgress(0);
  };

  const updateEditForm = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // ✅ FIXED: Image upload with proper numeric ID
  const handleImageUpload = async (file) => {
    if (!file) return;
    
    if (file.size > MAX_FILE_SIZE) {
      showErrorToast('File size must be less than 5MB');
      return;
    }
    
    if (!VALID_IMAGE_TYPES.includes(file.type)) {
      showErrorToast('Invalid file type. Allowed: JPEG, PNG, GIF, WEBP');
      return;
    }
    
    setUploadProgress(10);
    
    const reader = new FileReader();
    reader.onloadend = () => setPreviewImage(reader.result);
    reader.readAsDataURL(file);
    
    try {
      setUploadProgress(30);
      
      // ✅ Get the numeric ID from formData
      // staffId is "STF00011" (formatted) - ❌ DON'T use this
      // id is the numeric ID (e.g., 11) - ✅ USE THIS
      const numericId = formData.id || formData.staffNumericId || parseInt(formData.staffId?.replace(/\D/g, '') || '0');
      
      console.log('📤 Uploading with numeric ID:', numericId);
      console.log('📤 Staff ID (formatted):', formData.staffId);
      
      const uploaded = await uploadToS3(
        file, 
        formData.imageKey || null, 
        numericId,  // ✅ Pass numeric ID
        'staff'
      );
      
      setUploadProgress(100);
      
      setEditForm(prev => ({
        ...prev,
        imageUrl: uploaded.key,
        profileImage: uploaded.key,
        imageKey: uploaded.key
      }));
      
      setImageError(false);
      setTimeout(() => setUploadProgress(0), 1000);
      showSuccessToast('Image uploaded successfully! Click Save to apply.');
    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress(0);
      showErrorToast('Failed to upload image. Please try again.');
      if (formData.profileImage) {
        setPreviewImage(getFullImageUrl(formData.profileImage));
      } else {
        setPreviewImage(null);
      }
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) handleImageUpload(file);
  };

  const removeImage = () => {
    setPreviewImage(null);
    setUploadProgress(0);
    setEditForm(prev => ({ ...prev, profileImage: null, imageUrl: null, imageKey: '' }));
    setImageError(false);
    showSuccessToast('Image removed');
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditForm({ ...formData });
    resetUploadState();
  };

  // ✅ Save with proper update data
  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const staffIdValue = formData.id || formData.staffNumericId || formData.staffId;
      
      const updateData = {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        designation: editForm.designation,
        staffType: editForm.staffType,
        qualification: editForm.qualification,
        hospitalName: editForm.hospitalName,
        department: editForm.department,
        bio: editForm.bio,
        joiningDate: editForm.joiningDate,
        gender: editForm.gender,
        dob: editForm.dob,
        jobType: editForm.jobType,
        profilePicture: editForm.imageUrl || editForm.profileImage || editForm.imageKey,
        address: {
          place: editForm.place,
          district: editForm.district,
          state: editForm.state,
          country: editForm.country,
          pincode: editForm.pincode
        }
      };
      
      const response = await updateStaff({ 
        id: staffIdValue, 
        data: updateData 
      }).unwrap();
      
      const updatedStaff = response.data;
      
      let newProfilePicture = updatedStaff?.profilePicture || 
                              updatedStaff?.profileImage || 
                              updatedStaff?.imageUrl ||
                              updateData.profilePicture;
      
      const newImageUrl = newProfilePicture ? getFullImageUrl(newProfilePicture) : null;
      
      const updatedFormData = {
        ...editForm,
        profileImage: newProfilePicture,
        imageUrl: newProfilePicture,
        imageKey: newProfilePicture,
      };
      
      setFormData(updatedFormData);
      
      if (newImageUrl) {
        setPreviewImage(newImageUrl);
        setImageError(false);
      }
      
      setIsEditing(false);
      resetUploadState();
      
      // Update localStorage
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { 
        ...storedUser, 
        staffId: staffIdValue,
        name: updateData.name, 
        email: updateData.email, 
        phone: updateData.phone, 
        profilePicture: newProfilePicture 
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Update authData
      const authData = JSON.parse(localStorage.getItem('authData') || '{}');
      localStorage.setItem('authData', JSON.stringify({
        ...authData,
        name: updateData.name,
        email: updateData.email,
        phone: updateData.phone,
        profilePicture: newProfilePicture
      }));
      
      showSuccessToast('Profile updated successfully!');
      
      refetch();
      
    } catch (error) {
      if (error?.status === 401) {
        showErrorToast('Session expired. Redirecting to login...');
        setTimeout(() => {
          logout();
          navigate('/sign-in');
        }, 2000);
      } else {
        showErrorToast(error?.data?.message || 'Failed to update profile');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditForm({ ...formData });
    setPreviewImage(formData.profileImage ? getFullImageUrl(formData.profileImage) : null);
    setUploadProgress(0);
    setIsEditing(false);
    setImageError(false);
    showWarningToast('Changes discarded');
  };

  const getProfileImage = () => {
    if (previewImage && !imageError) {
      return previewImage;
    }

    if (formData.profileImage || formData.imageUrl || formData.imageKey) {
      const imageValue = formData.profileImage || formData.imageUrl || formData.imageKey;
      const url = getFullImageUrl(imageValue);
      if (url) return url;
    }

    const name = formData.name || 'Staff';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1C62A0&color=fff&length=2`;
  };

  const handleImageError = (e) => {
    e.target.onerror = null;
    setImageError(true);
    e.target.src = FALLBACK_IMAGE;
  };

  // ✅ Get the staff object from response
  const staff = staffResponse?.data || {};
  const address = staff?.address || {};

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (!staffResponse && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="bg-yellow-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto">
            <AlertCircle className="h-8 w-8 text-yellow-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mt-4">Staff Not Found</h2>
          <p className="text-gray-600 mt-2">No staff found with ID: {staffId}</p>
          <button 
            onClick={() => navigate('/dashboard')} 
            className="mt-4 px-4 py-2 bg-[#1C62A0] text-white rounded-lg hover:bg-[#155a8a]"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isUploading = uploadProgress > 0 && uploadProgress < 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Staff Profile</h1>
          <p className="text-gray-600 mt-1">Manage your staff information</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className={CARD_CLASS}>
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="relative group">
                    <img
                      src={getProfileImage()}
                      alt="Staff Profile"
                      className="w-32 h-32 rounded-full object-cover ring-4 ring-gray-100"
                      onError={handleImageError}
                      loading="lazy"
                    />
                    {isEditing && (
                      <>
                        <input
                          id="profileImageInput"
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById('profileImageInput')?.click()}
                          className="absolute bottom-0 right-0 bg-[#1C62A0] rounded-full p-2 shadow-lg hover:bg-[#4c6c88] transition-colors"
                        >
                          <Upload className="w-4 h-4 text-white" />
                        </button>
                      </>
                    )}
                    {isEditing && (editForm.imageUrl || editForm.profileImage) && !previewImage && (
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  
                  {isEditing && isUploading && (
                    <div className="mt-4 w-full">
                      <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#1C62A0] transition-all duration-300 rounded-full"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1 text-center">Uploading... {uploadProgress}%</p>
                    </div>
                  )}
                </div>
                
                <h2 className="mt-4 text-xl font-semibold text-gray-900">
                  {staff?.name || formData.name || 'Staff'}
                </h2>
                <p className="text-gray-500 text-sm">
                  {staff?.designation || formData.designation || 'No designation'}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <div className="flex items-center text-sm text-green-600">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    {staff?.isActive ? 'Active Staff' : 'Inactive'}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <IdCard className="w-4 h-4 mr-1" />
                    ID: {staff?.staffId || formData.staffId || 'N/A'}
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                {!isEditing ? (
                  <button
                    onClick={handleEdit}
                    className={`${ACTION_BUTTON_CLASS} bg-[#1C62A0] text-white hover:bg-[#4c6c88]`}
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className={`${ACTION_BUTTON_CLASS} bg-[#1C62A0] text-white hover:bg-[#4c6c88] disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <Save className="w-4 h-4" />
                      <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                    <button
                      onClick={handleCancel}
                      className={`${ACTION_BUTTON_CLASS} bg-gray-200 text-gray-700 hover:bg-gray-300`}
                    >
                      <span>Cancel</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className={CARD_CLASS}>
              <SectionTitle icon={User} title="Basic Information" />
              <div className="grid md:grid-cols-2 gap-4">
                <ProfileField
                  label="Full Name"
                  value={isEditing ? editForm.name : formData.name}
                  isEditing={isEditing}
                  onChange={(e) => updateEditForm('name', e.target.value)}
                  icon={User}
                  placeholder="Full name"
                />
                <ProfileField
                  label="Staff ID"
                  value={isEditing ? editForm.staffId : formData.staffId}
                  isEditing={isEditing}
                  onChange={(e) => updateEditForm('staffId', e.target.value)}
                  icon={IdCard}
                  placeholder="Staff ID"
                />
                <ProfileField
                  label="Email"
                  value={isEditing ? editForm.email : formData.email}
                  isEditing={isEditing}
                  onChange={(e) => updateEditForm('email', e.target.value)}
                  type="email"
                  icon={Mail}
                  placeholder="Email"
                />
                <ProfileField
                  label="Phone"
                  value={isEditing ? editForm.phone : formData.phone}
                  isEditing={isEditing}
                  onChange={(e) => updateEditForm('phone', e.target.value)}
                  icon={Phone}
                  placeholder="Phone"
                />
                <ProfileField
                  label="Gender"
                  value={isEditing ? editForm.gender : formData.gender}
                  isEditing={isEditing}
                  onChange={(e) => updateEditForm('gender', e.target.value)}
                  icon={User}
                  placeholder="Gender"
                />
                <ProfileField
                  label="Date of Birth"
                  value={isEditing ? editForm.dob : (formData.dob ? new Date(formData.dob).toLocaleDateString() : 'Not specified')}
                  isEditing={isEditing}
                  onChange={(e) => updateEditForm('dob', e.target.value)}
                  type="date"
                  icon={Calendar}
                />
              </div>
            </div>

            {/* Professional Information */}
            <div className={CARD_CLASS}>
              <SectionTitle icon={Briefcase} title="Professional Information" />
              <div className="grid md:grid-cols-2 gap-4">
                <ProfileField
                  label="Designation"
                  value={isEditing ? editForm.designation : formData.designation}
                  isEditing={isEditing}
                  onChange={(e) => updateEditForm('designation', e.target.value)}
                  icon={Briefcase}
                  placeholder="Designation"
                />
                <ProfileField
                  label="Staff Type"
                  value={isEditing ? editForm.staffType : formData.staffType}
                  isEditing={isEditing}
                  onChange={(e) => updateEditForm('staffType', e.target.value)}
                  icon={Users}
                  placeholder="Staff type"
                />
                <ProfileField
                  label="Qualification"
                  value={isEditing ? editForm.qualification : formData.qualification}
                  isEditing={isEditing}
                  onChange={(e) => updateEditForm('qualification', e.target.value)}
                  icon={GraduationCap}
                  placeholder="Qualification"
                />
                <ProfileField
                  label="Hospital/Clinic"
                  value={isEditing ? editForm.hospitalName : formData.hospitalName}
                  isEditing={isEditing}
                  onChange={(e) => updateEditForm('hospitalName', e.target.value)}
                  icon={Building}
                  placeholder="Hospital"
                />
                <ProfileField
                  label="Job Type"
                  value={isEditing ? editForm.jobType : formData.jobType}
                  isEditing={isEditing}
                  onChange={(e) => updateEditForm('jobType', e.target.value)}
                  icon={Clock}
                  placeholder="Job type"
                />
                <ProfileField
                  label="Joining Date"
                  value={isEditing ? editForm.joiningDate : (formData.joiningDate ? new Date(formData.joiningDate).toLocaleDateString() : 'Not specified')}
                  isEditing={isEditing}
                  onChange={(e) => updateEditForm('joiningDate', e.target.value)}
                  type="date"
                  icon={CalendarDays}
                />
              </div>
            </div>

            {/* Address Information */}
            <div className={CARD_CLASS}>
              <SectionTitle icon={MapPin} title="Address Information" />
              <div className="grid md:grid-cols-2 gap-4">
                <ProfileField
                  label="Place"
                  value={isEditing ? editForm.place : formData.place}
                  isEditing={isEditing}
                  onChange={(e) => updateEditForm('place', e.target.value)}
                  icon={Home}
                  placeholder="Place"
                />
                <ProfileField
                  label="District"
                  value={isEditing ? editForm.district : formData.district}
                  isEditing={isEditing}
                  onChange={(e) => updateEditForm('district', e.target.value)}
                  icon={MapPin}
                  placeholder="District"
                />
                <ProfileField
                  label="State"
                  value={isEditing ? editForm.state : formData.state}
                  isEditing={isEditing}
                  onChange={(e) => updateEditForm('state', e.target.value)}
                  icon={MapPin}
                  placeholder="State"
                />
                <ProfileField
                  label="Country"
                  value={isEditing ? editForm.country : formData.country}
                  isEditing={isEditing}
                  onChange={(e) => updateEditForm('country', e.target.value)}
                  icon={MapPin}
                  placeholder="Country"
                />
                <ProfileField
                  label="Pincode"
                  value={isEditing ? editForm.pincode : formData.pincode}
                  isEditing={isEditing}
                  onChange={(e) => updateEditForm('pincode', e.target.value)}
                  icon={MapPin}
                  placeholder="Pincode"
                />
                <div className="md:col-span-2">
                  <ProfileField
                    label="Full Address"
                    value={isEditing ? editForm.addressString : formData.addressString}
                    isEditing={isEditing}
                    onChange={(e) => updateEditForm('addressString', e.target.value)}
                    icon={MapPin}
                    placeholder="Full address"
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className={CARD_CLASS}>
              <SectionTitle icon={Info} title="Additional Information" />
              <div className="space-y-4">
                <ProfileTextarea
                  label="Bio"
                  value={isEditing ? editForm.bio : formData.bio}
                  isEditing={isEditing}
                  onChange={(e) => updateEditForm('bio', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffProfile;