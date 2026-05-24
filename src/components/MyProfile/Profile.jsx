import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
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

// ==================== CONSTANTS ====================
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const FALLBACK_IMAGE = 'https://via.placeholder.com/150?text=No+Image';

const INPUT_CLASS = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent';
const CARD_CLASS = 'bg-white rounded-2xl shadow-sm border border-gray-100 p-6';
const SECTION_TITLE_CLASS = 'text-lg font-semibold text-gray-900 mb-4 flex items-center';
const SECTION_ICON_CLASS = 'w-5 h-5 mr-2 text-blue-600';
const ACTION_BUTTON_CLASS = 'w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors';

// ==================== HELPER FUNCTIONS ====================
const formatFileSize = (size) => `${(size / (1024 * 1024)).toFixed(2)}MB`;

// ==================== SKELETON LOADER ====================
const ProfileSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="h-9 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
        <div className="h-5 w-64 bg-gray-200 rounded animate-pulse"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column Skeleton */}
        <div className="lg:col-span-1 space-y-6">
          <div className={CARD_CLASS}>
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-full bg-gray-200 animate-pulse"></div>
              <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mt-4"></div>
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mt-2"></div>
            </div>
            <div className="mt-6">
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Right Column Skeleton */}
        <div className="lg:col-span-2 space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className={CARD_CLASS}>
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
              <div className="space-y-4">
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// ==================== MAIN PROFILE COMPONENT ====================
const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const hospitalId = user?.id;
  const { data: hospitalData, isLoading: isLoadingHospital, error: fetchError, refetch } = useGetHospitalByIdQuery(hospitalId, {
    skip: !hospitalId,
  });
  const [updateHospital, { isLoading: isUpdating }] = useUpdateHospitalMutation();

  const [profile, setProfile] = useState({
    fullName: '',
    username: '',
    email: '',
    phoneNumber: '',
    profilePicture: '',
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

  // Handle fetch error (401 unauthorized)
  useEffect(() => {
    if (fetchError?.status === 401) {
      showErrorToast('Session expired. Redirecting to login...', 2000);
      setTimeout(() => {
        logout();
        navigate('/sign-in');
      }, 2000);
    }
  }, [fetchError, logout, navigate]);

  // Populate profile from API data
  useEffect(() => {
    if (hospitalData) {
      const hospital = hospitalData.data || hospitalData;
      
      // Build location string from address
      const locationParts = [
        hospital.address?.place,
        hospital.address?.district,
        hospital.address?.state,
        hospital.address?.country
      ].filter(Boolean);
      
      const locationString = locationParts.join(', ');
      
      setProfile({
        fullName: hospital.name || '',
        username: '@' + (hospital.name || '').replace(/\s+/g, '').toLowerCase(),
        email: hospital.email || '',
        phoneNumber: hospital.phone || '',
        profilePicture: hospital.profilePicture || '',
        bio: hospital.about || '',
        websiteLink: hospital.website || '',
        location: locationString,
        occupation: hospital.type || '',
        education: 'Hospital',
        gender: hospital.gender || '',
        dateOfBirth: hospital.dateOfBirth || ''
      });
      
      setEditForm({
        fullName: hospital.name || '',
        email: hospital.email || '',
        phoneNumber: hospital.phone || '',
        bio: hospital.about || '',
        websiteLink: hospital.website || '',
        location: locationString,
        occupation: hospital.type || '',
        education: 'Hospital'
      });
    }
  }, [hospitalData]);

  const resetUploadState = () => {
    setPreviewImage(null);
    setUploadProgress(0);
  };

  const updateEditForm = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getUpdatedFieldsCount = () => {
    return Object.keys(profile).filter(key => profile[key] !== editForm[key]).length;
  };

  // Mock S3 upload function - replace with actual AWS SDK implementation
  const uploadToS3 = async (file) => {
    return new Promise((resolve, reject) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          const mockS3Url = `https://your-bucket.s3.amazonaws.com/profile-images/${Date.now()}-${file.name}`;
          resolve(mockS3Url);
        }
      }, 200);
    });
  };

  const handleImageUpload = async (file) => {
    if (!file) return false;
    
    if (file.size > MAX_FILE_SIZE) {
      showErrorToast('File size must be less than 5MB', 3000);
      return false;
    }
    
    if (!VALID_IMAGE_TYPES.includes(file.type)) {
      showErrorToast('Invalid file type. Allowed: JPEG, PNG, GIF, WEBP', 3000);
      return false;
    }
    
    setUploadProgress(0);
    
    const reader = new FileReader();
    reader.onloadend = () => setPreviewImage(reader.result);
    reader.readAsDataURL(file);
    
    showSuccessToast('Uploading image...', 2000);
    
    try {
      const s3Url = await uploadToS3(file);
      updateEditForm('profilePicture', s3Url);
      setUploadProgress(100);
      showSuccessToast('Profile picture updated successfully!', 3000);
      return true;
    } catch (error) {
      showErrorToast('Failed to upload image. Please try again.', 4000);
      setPreviewImage(null);
      return false;
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) handleImageUpload(file);
  };

  const removeImage = () => {
    updateEditForm('profilePicture', '');
    resetUploadState();
    showWarningToast('Profile picture removed', 2000);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditForm({ ...profile });
    resetUploadState();
    showSuccessToast('Edit mode activated', 2000);
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Prepare update data
      const updateData = {
        name: editForm.fullName,
        email: editForm.email,
        phone: editForm.phoneNumber,
        type: editForm.occupation,
        about: editForm.bio,
        website: editForm.websiteLink,
      };
      
      // Call API to update hospital
      await updateHospital({ 
        id: hospitalId, 
        updateHospital: updateData 
      }).unwrap();
      
      // Update local profile state
      setProfile({ ...editForm });
      setIsEditing(false);
      resetUploadState();
      
      // Update localStorage user data
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { ...storedUser, ...updateData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      showSuccessToast('Profile updated successfully!', 3000, {
        'Updated fields': getUpdatedFieldsCount(),
        'Time': new Date().toLocaleTimeString()
      });
      
      refetch(); // Refresh data from API
      
    } catch (error) {
      if (error.status === 401) {
        showErrorToast('Session expired. Redirecting to login...', 3000);
        setTimeout(() => {
          logout();
          navigate('/sign-in');
        }, 2000);
      } else {
        showErrorToast(error.data?.message || 'Failed to update profile', 4000);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditForm({ ...profile });
    setIsEditing(false);
    resetUploadState();
    showWarningToast('Changes discarded', 2000);
  };

  const getProfileImage = () => {
    if (previewImage) return previewImage;
    if (isEditing && editForm.profilePicture) return editForm.profilePicture;
    if (profile.profilePicture) return profile.profilePicture;
    return FALLBACK_IMAGE;
  };

  // Loading state
  if (isLoadingHospital) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Hospital Profile</h1>
          <p className="text-gray-600 mt-1">Manage your hospital information and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Picture & Bio */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Picture Card */}
            <div className={CARD_CLASS}>
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="relative group">
                    <img
                      src={getProfileImage()}
                      alt="Hospital Profile"
                      className="w-32 h-32 rounded-full object-cover ring-4 ring-gray-100"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = FALLBACK_IMAGE;
                      }}
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
                    {isEditing && previewImage && (
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  
                  {/* Upload Progress Bar */}
                  {isEditing && uploadProgress > 0 && uploadProgress < 100 && (
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
                  {isEditing ? editForm.fullName : profile.fullName}
                </h2>
                <p className="text-gray-500 text-sm">
                  {isEditing ? editForm.username : profile.username}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <div className="flex items-center text-sm text-gray-500">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                    Verified Hospital
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
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

          {/* Right Column - Detailed Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* About Section */}
            <div className={CARD_CLASS}>
              <SectionTitle icon={Heart} title="About Hospital" />
              
              <ProfileTextarea
                label="Bio"
                value={isEditing ? editForm.bio : profile.bio}
                isEditing={isEditing}
                onChange={(e) => updateEditForm('bio', e.target.value)}
              />

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-500 mb-1">Website Link</label>
                {isEditing ? (
                  <div className="flex items-center space-x-2">
                    <LinkIcon className="w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={editForm.websiteLink || ''}
                      onChange={(e) => updateEditForm('websiteLink', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter website link"
                    />
                  </div>
                ) : (
                  profile.websiteLink && (
                    <div className="flex items-center text-sm">
                      <Globe className="w-4 h-4 text-gray-400 mr-2" />
                      <a 
                        href={profile.websiteLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        {profile.websiteLink}
                      </a>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Basic Information */}
            <div className={CARD_CLASS}>
              <SectionTitle icon={Briefcase} title="Basic Information" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ProfileField
                  label="Hospital Name"
                  value={isEditing ? editForm.fullName : profile.fullName}
                  isEditing={isEditing}
                  onChange={(e) => updateEditForm('fullName', e.target.value)}
                />
                
                <ProfileField
                  label="Username"
                  value={isEditing ? editForm.username : profile.username}
                  isEditing={isEditing}
                  onChange={(e) => updateEditForm('username', e.target.value)}
                />
                
                <ProfileField
                  label="Email"
                  value={isEditing ? editForm.email : profile.email}
                  isEditing={isEditing}
                  onChange={(e) => updateEditForm('email', e.target.value)}
                  type="email"
                  icon={Mail}
                />
                
                <ProfileField
                  label="Phone Number"
                  value={isEditing ? editForm.phoneNumber : profile.phoneNumber}
                  isEditing={isEditing}
                  onChange={(e) => updateEditForm('phoneNumber', e.target.value)}
                  icon={Phone}
                />
              </div>
            </div>

            {/* Location Information */}
            <div className={CARD_CLASS}>
              <SectionTitle icon={Heart} title="Location Information" />
              <div className="grid grid-cols-1 gap-4">
                <ProfileField
                  label="Location"
                  value={isEditing ? editForm.location : profile.location}
                  isEditing={isEditing}
                  onChange={(e) => updateEditForm('location', e.target.value)}
                  icon={MapPin}
                />
              </div>
            </div>

            {/* Additional Info */}
            <div className={CARD_CLASS}>
              <SectionTitle icon={School} title="Additional Information" />
              <div className="grid grid-cols-1 gap-4">
                <ProfileField
                  label="Hospital Type"
                  value={isEditing ? editForm.occupation : profile.occupation}
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

// ==================== REUSABLE COMPONENTS ====================
const SectionTitle = ({ icon: Icon, title }) => (
  <h3 className={SECTION_TITLE_CLASS}>
    <Icon className={SECTION_ICON_CLASS} />
    {title}
  </h3>
);

const ProfileField = ({ label, value, isEditing, onChange, type = 'text', icon: Icon }) => (
  <div>
    <label className="block text-sm font-medium text-gray-500 mb-1">{label}</label>
    {isEditing ? (
      <input
        type={type}
        value={value || ''}
        onChange={onChange}
        className={INPUT_CLASS}
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

export default Profile;