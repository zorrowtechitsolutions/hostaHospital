import React, { useState } from 'react';
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
import { showErrorToast, showSuccessToast, showWarningToast } from '../ui/Toast';

// ==================== CONSTANTS ====================
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const FALLBACK_IMAGE = 'https://via.placeholder.com/150?text=No+Image';

const INPUT_CLASS = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent';
const CARD_CLASS = 'bg-white rounded-2xl shadow-sm border border-gray-100 p-6';
const SECTION_TITLE_CLASS = 'text-lg font-semibold text-gray-900 mb-4 flex items-center';
const SECTION_ICON_CLASS = 'w-5 h-5 mr-2 text-blue-600';
const ACTION_BUTTON_CLASS = 'w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors';

const INITIAL_PROFILE = {
  fullName: 'Alex Morgan',
  username: '@alexmorgan',
  email: 'alex.morgan@example.com',
  phoneNumber: '+1 (555) 123-4567',
  profilePicture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
  bio: 'Passionate full-stack developer with 8+ years of experience. React enthusiast, open-source contributor, and tech blogger. Love building meaningful applications that make a difference.',
  websiteLink: 'https://alexmorgan.dev',
  location: 'San Francisco, California, USA',
  dateOfBirth: '1990-05-15',
  gender: 'Male',
  occupation: 'Senior Software Engineer',
  education: 'M.S. in Computer Science'
};

// ==================== HELPER FUNCTIONS ====================
const formatFileSize = (size) => `${(size / (1024 * 1024)).toFixed(2)}MB`;

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

const ProfileSelect = ({ label, value, isEditing, onChange, options }) => (
  <div>
    <label className="block text-sm font-medium text-gray-500 mb-1">{label}</label>
    {isEditing ? (
      <select
        value={value || ''}
        onChange={onChange}
        className={INPUT_CLASS}
      >
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    ) : (
      <div className="flex items-center space-x-2">
        <Users className="w-4 h-4 text-gray-400" />
        <span className="text-gray-900">{value || 'Not specified'}</span>
      </div>
    )}
  </div>
);

const Profile = () => {
  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(profile);
  const [previewImage, setPreviewImage] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const resetUploadState = () => {
    setPreviewImage(null);
    setUploadProgress(0);
  };

  const updateProfile = (field, value) => {
    setEditedProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getUpdatedFieldsCount = () => {
    return Object.keys(profile).filter(key => profile[key] !== editedProfile[key]).length;
  };

  // Mock S3 upload function - replace with actual AWS SDK implementation
  const uploadToS3 = async (file) => {
    // This is a mock implementation. Replace with actual S3 upload logic.
    // For production, you would typically:
    // 1. Get a pre-signed URL from your backend
    // 2. Upload directly to S3 using that URL
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
      showErrorToast('File size must be less than 5MB', 3000, {
        'Selected file': formatFileSize(file.size),
        'Maximum size': '5MB'
      });
      return false;
    }
    
    if (!VALID_IMAGE_TYPES.includes(file.type)) {
      showErrorToast('Invalid file type', 3000, {
        'Allowed types': 'JPEG, PNG, GIF, WEBP',
        'Selected type': file.type
      });
      return false;
    }
    
    setUploadProgress(0);
    
    const reader = new FileReader();
    reader.onloadend = () => setPreviewImage(reader.result);
    reader.readAsDataURL(file);
    
    showSuccessToast('Uploading image...', 2000);
    
    try {
      const s3Url = await uploadToS3(file);
      updateProfile('profilePicture', s3Url);
      setUploadProgress(100);
      showSuccessToast('Profile picture updated successfully!', 3000, {
        'File name': file.name,
        'File size': formatFileSize(file.size),
        'Type': file.type.split('/')[1].toUpperCase()
      });
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
    updateProfile('profilePicture', '');
    resetUploadState();
    showWarningToast('Profile picture removed', 2000);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedProfile({ ...profile });
    resetUploadState();
    showSuccessToast('Edit mode activated', 2000);
  };

  const handleSave = () => {
    setProfile({ ...editedProfile });
    setIsEditing(false);
    resetUploadState();
    showSuccessToast('Profile updated successfully', 3000, {
      'Updated fields': getUpdatedFieldsCount(),
      'Time': new Date().toLocaleTimeString()
    });
  };

  const handleCancel = () => {
    setEditedProfile({ ...profile });
    setIsEditing(false);
    resetUploadState();
    showWarningToast('Changes discarded', 2000);
  };

  const getProfileImage = () => {
    if (previewImage) return previewImage;
    if (isEditing && editedProfile.profilePicture) return editedProfile.profilePicture;
    if (profile.profilePicture) return profile.profilePicture;
    return FALLBACK_IMAGE;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600 mt-1">Manage your personal information and preferences</p>
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
                      alt="Profile"
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
                  {isEditing ? editedProfile.fullName : profile.fullName}
                </h2>
                <p className="text-gray-500 text-sm">
                  {isEditing ? editedProfile.username : profile.username}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <div className="flex items-center text-sm text-gray-500">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                    Verified Member
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
                      className={`${ACTION_BUTTON_CLASS} bg-[#1C62A0] text-white hover:bg-[#4c6c88]`}
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
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
              <SectionTitle icon={Heart} title="About Me" />
              
              <ProfileTextarea
                label="Bio"
                value={isEditing ? editedProfile.bio : profile.bio}
                isEditing={isEditing}
                onChange={(e) => updateProfile('bio', e.target.value)}
              />

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-500 mb-1">Website Link</label>
                {isEditing ? (
                  <div className="flex items-center space-x-2">
                    <LinkIcon className="w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={editedProfile.websiteLink || ''}
                      onChange={(e) => updateProfile('websiteLink', e.target.value)}
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
                  label="Full Name"
                  value={isEditing ? editedProfile.fullName : profile.fullName}
                  isEditing={isEditing}
                  onChange={(e) => updateProfile('fullName', e.target.value)}
                />
                
                <ProfileField
                  label="Username"
                  value={isEditing ? editedProfile.username : profile.username}
                  isEditing={isEditing}
                  onChange={(e) => updateProfile('username', e.target.value)}
                />
                
                <ProfileField
                  label="Email"
                  value={isEditing ? editedProfile.email : profile.email}
                  isEditing={isEditing}
                  onChange={(e) => updateProfile('email', e.target.value)}
                  type="email"
                  icon={Mail}
                />
                
                <ProfileField
                  label="Phone Number"
                  value={isEditing ? editedProfile.phoneNumber : profile.phoneNumber}
                  isEditing={isEditing}
                  onChange={(e) => updateProfile('phoneNumber', e.target.value)}
                  icon={Phone}
                />
              </div>
            </div>

            {/* Personal Information */}
            <div className={CARD_CLASS}>
              <SectionTitle icon={Heart} title="Personal Information" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ProfileField
                  label="Location"
                  value={isEditing ? editedProfile.location : profile.location}
                  isEditing={isEditing}
                  onChange={(e) => updateProfile('location', e.target.value)}
                  icon={MapPin}
                />
                
                <ProfileField
                  label="Date of Birth"
                  value={isEditing ? editedProfile.dateOfBirth : profile.dateOfBirth}
                  isEditing={isEditing}
                  onChange={(e) => updateProfile('dateOfBirth', e.target.value)}
                  type="date"
                  icon={Calendar}
                />
                
                <ProfileSelect
                  label="Gender"
                  value={isEditing ? editedProfile.gender : profile.gender}
                  isEditing={isEditing}
                  onChange={(e) => updateProfile('gender', e.target.value)}
                  options={['Male', 'Female', 'Other', 'Prefer not to say']}
                />
                
                <ProfileField
                  label="Occupation"
                  value={isEditing ? editedProfile.occupation : profile.occupation}
                  isEditing={isEditing}
                  onChange={(e) => updateProfile('occupation', e.target.value)}
                  icon={Briefcase}
                />
              </div>
            </div>

            {/* Additional Info */}
            <div className={CARD_CLASS}>
              <SectionTitle icon={School} title="Additional Information" />
              <div className="grid grid-cols-1 gap-4">
                <ProfileField
                  label="Education"
                  value={isEditing ? editedProfile.education : profile.education}
                  isEditing={isEditing}
                  onChange={(e) => updateProfile('education', e.target.value)}
                  icon={School}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;