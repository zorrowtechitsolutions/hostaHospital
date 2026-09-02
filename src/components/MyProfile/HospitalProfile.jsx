import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Mail,
  Phone,
  MapPin,
  Link as LinkIcon,
  Save,
  Edit2,
  Globe,
  Briefcase,
  School,
  Heart,
  CheckCircle,
  Upload,
  X
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import {
  useGetHospitalByIdQuery,
  useUpdateHospitalMutation
} from '../../../app/service/hospitalApi';
import { uploadToS3, getS3ImageUrl } from '../../../app/service/S3';
import { registerHospitalEvents, unregisterHospitalEvents } from '../../socket/hospitalEvents';
// ✅ IMPORT TOAST FUNCTIONS
import { showSuccessToast, showErrorToast, showWarningToast } from '../ui/Toast';

// ==================== CONSTANTS ====================
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const FALLBACK_IMAGE = 'https://ui-avatars.com/api/?name=Hospital&background=1C62A0&color=fff&length=2';

const INPUT_CLASS = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent';
const CARD_CLASS = 'bg-white rounded-2xl shadow-sm border border-gray-100 p-6';
const SECTION_TITLE_CLASS = 'text-lg font-semibold text-gray-900 mb-4 flex items-center';
const SECTION_ICON_CLASS = 'w-5 h-5 mr-2 text-blue-600';
const ACTION_BUTTON_CLASS = 'w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors';

// ==================== HELPER FUNCTIONS ====================

// ✅ Phone validation helper
const validatePhone = (phone) => {
  if (!phone || phone.trim() === '') {
    return 'Phone number is required';
  }

  if (!/^\d{10}$/.test(phone)) {
    return 'Phone number must be exactly 10 digits';
  }

  return '';
};

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

// ==================== ❌ REMOVE THESE PLACEHOLDER FUNCTIONS ====================
// const showSuccessToast = (message) => {
//   // Toast implementation
// };
// const showErrorToast = (message) => {
//   // Toast implementation
// };
// const showWarningToast = (message) => {
//   // Toast implementation
// };

// ==================== SKELETON LOADER ====================
const ProfileSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="h-9 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
        <div className="h-5 w-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
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

// ==================== MAIN PROFILE COMPONENT ====================
const HospitalProfile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const hospitalId = user?.hospitalId || user?.id;
  
  const { data: hospitalData, isLoading: isLoadingHospital, error: fetchError, refetch } = useGetHospitalByIdQuery(hospitalId, {
    skip: !hospitalId,
  });
  const [updateHospital] = useUpdateHospitalMutation();

  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    phoneNumber: '',
    profileImage: null,
    imageUrl: null,
    imageKey: null,
    bio: '',
    websiteLink: '',
    location: '',
    occupation: '',
    education: 'Hospital',
    gender: '',
    dateOfBirth: ''
  });
  
  const [editForm, setEditForm] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [serverError, setServerError] = useState(null); // Keep for logic, but not displayed

  // ==================== SOCKET EVENT HANDLERS ====================
  
  const handleHospitalUpdated = (data) => {
    if (data && data.id === hospitalId) {
      showSuccessToast('Hospital profile updated in real-time!');
      refetch();
      
      if (data.name || data.email || data.phone) {
        setFormData(prev => ({
          ...prev,
          fullName: data.name || prev.fullName,
          email: data.email || prev.email,
          phoneNumber: data.phone || prev.phoneNumber,
          bio: data.about || prev.bio,
          websiteLink: data.website || prev.websiteLink,
          occupation: data.type || prev.occupation,
          profileImage: data.profilePicture || data.imageUrl || prev.profileImage,
          imageUrl: data.profilePicture || data.imageUrl || prev.imageUrl,
          imageKey: data.profilePicture || data.imageUrl || prev.imageKey,
        }));
      }
    }
  };

  const handleHospitalRegistered = (data) => {
    showSuccessToast('New hospital registered!');
  };

  const handleHospitalDeleted = (data) => {
    if (data && data.id === hospitalId) {
      showWarningToast('Your hospital profile has been deleted.');
      setTimeout(() => {
        logout();
        navigate('/sign-in');
      }, 3000);
    }
  };

  const handleHospitalBlacklisted = (data) => {
    if (data && data.id === hospitalId) {
      showErrorToast('Your hospital has been blacklisted. Please contact support.');
      setTimeout(() => {
        logout();
        navigate('/sign-in');
      }, 3000);
    }
  };

  const handleHospitalRecovered = (data) => {
    if (data && data.id === hospitalId) {
      showSuccessToast('Your hospital has been recovered!');
      refetch();
    }
  };

  useEffect(() => {
    registerHospitalEvents({
      onHospitalRegistered: handleHospitalRegistered,
      onHospitalUpdated: handleHospitalUpdated,
      onHospitalDeleted: handleHospitalDeleted,
      onHospitalBlacklisted: handleHospitalBlacklisted,
      onHospitalRecovered: handleHospitalRecovered,
    });

    return () => {
      unregisterHospitalEvents();
    };
  }, [hospitalId]);

  useEffect(() => {
    if (fetchError?.status === 401) {
      showErrorToast('Session expired. Redirecting to login...');
      setTimeout(() => {
        logout();
        navigate('/sign-in');
      }, 2000);
    }
  }, [fetchError, logout, navigate]);

  useEffect(() => {
    if (hospitalData) {
      const hospital = hospitalData.data || hospitalData;
      
      const imageKey = 
        hospital?.profilePicture ||
        hospital?.imageUrl ||
        hospital?.image ||
        null;
      
      const locationParts = [
        hospital.address?.place,
        hospital.address?.district,
        hospital.address?.state,
        hospital.address?.country
      ].filter(Boolean);
      
      const locationString = locationParts.join(', ');
      
      const newFormData = {
        fullName: hospital.name || '',
        username: '@' + (hospital.name || '').replace(/\s+/g, '').toLowerCase(),
        email: hospital.email || '',
        phoneNumber: hospital.phone || '',
        profileImage: imageKey,
        imageUrl: imageKey,
        imageKey: imageKey,
        bio: hospital.about || '',
        websiteLink: hospital.website || '',
        location: locationString,
        occupation: hospital.type || '',
        education: 'Hospital',
        gender: hospital.gender || '',
        dateOfBirth: hospital.dateOfBirth || ''
      };
      
      setFormData(newFormData);
      setEditForm(newFormData);
      
      if (imageKey) {
        const fullUrl = getFullImageUrl(imageKey);
        setPreviewImage(fullUrl);
        setImageError(false);
      }
    }
  }, [hospitalData]);

  const resetUploadState = () => {
    setUploadProgress(0);
  };

  const updateEditForm = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear server error when user makes changes
    if (serverError) setServerError(null);
  };

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
      const uploaded = await uploadToS3(
        file, 
        formData.imageKey || null, 
        hospitalId,
        'hospital'
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
    setServerError(null);
    resetUploadState();
  };

  // ============================================================
  // ✅ FIXED: Phone validation + robust error handling
  // ============================================================
  const handleSave = async () => {
    // ✅ Validate phone before sending to backend
    const phoneError = validatePhone(editForm.phoneNumber);

    if (phoneError) {
      setServerError(phoneError);
      showErrorToast(phoneError); // ✅ Shows toast only
      return;
    }

    setIsSaving(true);
    setServerError(null);
    
    try {
      const updateData = {
        name: editForm.fullName,
        email: editForm.email,
        phone: editForm.phoneNumber,
        type: editForm.occupation,
        about: editForm.bio,
        website: editForm.websiteLink,
        profilePicture: editForm.imageUrl || editForm.profileImage || editForm.imageKey,
      };
      
      const response = await updateHospital({ 
        id: hospitalId, 
        updateHospital: updateData 
      }).unwrap();
      
      const updatedHospital = response.data || response;
      
      let newProfilePicture = updatedHospital.profilePicture || 
                              updatedHospital.profileImage || 
                              updatedHospital.imageUrl ||
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
      setServerError(null);
      
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { 
        ...storedUser, 
        name: updateData.name,
        email: updateData.email,
        phone: updateData.phone,
        profilePicture: newProfilePicture
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      showSuccessToast('Profile updated successfully!');
      refetch();
      
    } catch (error) {
      console.error('Update Error:', error);

      // ✅ 401 Unauthorized - Session expired
      if (error?.status === 401) {
        showErrorToast('Session expired. Redirecting to login...');
        setTimeout(() => {
          logout();
          navigate('/sign-in');
        }, 2000);
        return;
      }

      // ✅ Get backend error safely
      const backendError = error?.data?.error;

      // ✅ Backend validation/details
      if (Array.isArray(backendError?.details) && backendError.details.length > 0) {
        const messages = backendError.details
          .map(detail => detail?.message)
          .filter(Boolean);

        const message = messages.join(', ');
        setServerError(message);
        showErrorToast(message); // ✅ Shows toast only
        return;
      }

      // ✅ Backend error.message
      if (backendError?.message) {
        setServerError(backendError.message);
        showErrorToast(backendError.message); // ✅ Shows toast only
        return;
      }

      // ✅ Direct API message
      if (error?.data?.message) {
        setServerError(error.data.message);
        showErrorToast(error.data.message); // ✅ Shows toast only
        return;
      }

      // ✅ RTK / fetch error
      if (error?.error) {
        setServerError(error.error);
        showErrorToast(error.error); // ✅ Shows toast only
        return;
      }

      // ✅ JavaScript error
      if (error?.message) {
        setServerError(error.message);
        showErrorToast(error.message); // ✅ Shows toast only
        return;
      }

      // ✅ Final fallback
      setServerError('Failed to update profile. Please try again.');
      showErrorToast('Failed to update profile. Please try again.'); // ✅ Shows toast only
      
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
    setServerError(null);
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

    return FALLBACK_IMAGE;
  };

  const handleImageError = (e) => {
    e.target.onerror = null;
    setImageError(true);
    e.target.src = FALLBACK_IMAGE;
  };

  if (isLoadingHospital) {
    return <ProfileSkeleton />;
  }

  const isUploading = uploadProgress > 0 && uploadProgress < 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Hospital Profile</h1>
          <p className="text-gray-600 mt-1">Manage your hospital information and preferences</p>
        </div>

        {/* ❌ REMOVED: Large red error div - now only shows toast notifications */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-6">
            <div className={CARD_CLASS}>
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="relative group">
                    <img
                      src={getProfileImage()}
                      alt="Hospital Profile"
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
                  {isEditing ? editForm.fullName : formData.fullName}
                </h2>
                <p className="text-gray-500 text-sm">
                  {isEditing ? editForm.username : formData.username}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <div className="flex items-center text-sm text-gray-500">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                    Verified Hospital
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                {!isEditing ? (
                  <button
                    onClick={handleEdit}
                    className={`${ACTION_BUTTON_CLASS} bg-[#1C62A0] text-white hover:bg-[#4c6c88]`}
                  >
                    <Edit2 className="w-4 h-4" />
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

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className={CARD_CLASS}>
              <SectionTitle icon={Heart} title="About Hospital" />
              
              <ProfileTextarea
                label="Bio"
                value={isEditing ? editForm.bio : formData.bio}
                isEditing={isEditing}
                onChange={(e) => updateEditForm('bio', e.target.value)}
              />

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-500 mb-1">Website Link</label>
                {isEditing ? (
                  <div className="flex items-center space-x-2">
                    <LinkIcon className="w-4 h-4 text-gray-400" />
                    <input
                      type="url"
                      value={editForm.websiteLink || ''}
                      onChange={(e) => updateEditForm('websiteLink', e.target.value)}
                      className={INPUT_CLASS}
                      placeholder="https://example.com"
                    />
                  </div>
                ) : (
                  formData.websiteLink && (
                    <div className="flex items-center text-sm">
                      <Globe className="w-4 h-4 text-gray-400 mr-2" />
                      <a 
                        href={formData.websiteLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        {formData.websiteLink}
                      </a>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className={CARD_CLASS}>
              <SectionTitle icon={Briefcase} title="Basic Information" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ProfileField
                  label="Hospital Name"
                  value={isEditing ? editForm.fullName : formData.fullName}
                  isEditing={isEditing}
                  onChange={(e) => updateEditForm('fullName', e.target.value)}
                />
                
                <ProfileField
                  label="Username"
                  value={isEditing ? editForm.username : formData.username}
                  isEditing={isEditing}
                  onChange={(e) => updateEditForm('username', e.target.value)}
                />
                
                <ProfileField
                  label="Email"
                  value={isEditing ? editForm.email : formData.email}
                  isEditing={isEditing}
                  onChange={(e) => updateEditForm('email', e.target.value)}
                  type="email"
                  icon={Mail}
                />
                
                {/* ✅ Phone input with 10-digit restriction */}
                <ProfileField
                  label="Phone Number"
                  value={isEditing ? editForm.phoneNumber : formData.phoneNumber}
                  isEditing={isEditing}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    updateEditForm('phoneNumber', value);
                  }}
                  type="tel"
                  icon={Phone}
                  placeholder="10 digit phone number"
                />
              </div>
            </div>

            <div className={CARD_CLASS}>
              <SectionTitle icon={MapPin} title="Location Information" />
              <div className="grid grid-cols-1 gap-4">
                <ProfileField
                  label="Location"
                  value={isEditing ? editForm.location : formData.location}
                  isEditing={isEditing}
                  onChange={(e) => updateEditForm('location', e.target.value)}
                  icon={MapPin}
                />
              </div>
            </div>

            <div className={CARD_CLASS}>
              <SectionTitle icon={School} title="Additional Information" />
              <div className="grid grid-cols-1 gap-4">
                <ProfileField
                  label="Hospital Type"
                  value={isEditing ? editForm.occupation : formData.occupation}
                  isEditing={isEditing}
                  onChange={(e) => updateEditForm('occupation', e.target.value)}
                  icon={Briefcase}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SectionTitle = ({ icon: Icon, title }) => (
  <h3 className={SECTION_TITLE_CLASS}>
    <Icon className={SECTION_ICON_CLASS} />
    {title}
  </h3>
);

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

export default HospitalProfile;