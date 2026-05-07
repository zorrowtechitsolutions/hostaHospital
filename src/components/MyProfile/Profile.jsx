import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Users, 
  Link as LinkIcon,
  Camera, 
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

const Profile = () => {
  // State for profile data
  const [profile, setProfile] = useState({
    // Basic Info
    fullName: 'Alex Morgan',
    username: '@alexmorgan',
    email: 'alex.morgan@example.com',
    phoneNumber: '+1 (555) 123-4567',
    
    // Profile Details
    profilePicture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
    bio: 'Passionate full-stack developer with 8+ years of experience. React enthusiast, open-source contributor, and tech blogger. Love building meaningful applications that make a difference.',
    websiteLink: 'https://alexmorgan.dev',
    
    // Personal Info
    location: 'San Francisco, California, USA',
    dateOfBirth: '1990-05-15',
    gender: 'Male',
    
    // Additional Info
    occupation: 'Senior Software Engineer',
    education: 'M.S. in Computer Science'
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(profile);
  const [previewImage, setPreviewImage] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Mock S3 upload function - replace with actual AWS SDK implementation
  const uploadToS3 = async (file) => {
    // This is a mock implementation. Replace with actual S3 upload logic.
    // For production, you would typically:
    // 1. Get a pre-signed URL from your backend
    // 2. Upload directly to S3 using that URL
    
    return new Promise((resolve, reject) => {
      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          // Return a mock S3 URL
          const mockS3Url = `https://your-bucket.s3.amazonaws.com/profile-images/${Date.now()}-${file.name}`;
          resolve(mockS3Url);
        }
      }, 200);
    });
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedProfile({...profile});
    setPreviewImage(null);
    setUploadProgress(0);
  };

  const handleSave = () => {
    setProfile({...editedProfile});
    setIsEditing(false);
    setPreviewImage(null);
    setUploadProgress(0);
  };

  const handleCancel = () => {
    setEditedProfile({...profile});
    setIsEditing(false);
    setPreviewImage(null);
    setUploadProgress(0);
  };

  const handleChange = (field, value) => {
    setEditedProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // STANDARD IMAGE UPLOAD HANDLER WITH S3 UPLOAD
  const handleImageUpload = async (file) => {
    if (!file) return false;
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return false;
    }
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Only JPEG, PNG, GIF, and WEBP files are allowed');
      return false;
    }
    
    setUploadProgress(0);
    
    // Create preview immediately
    const reader = new FileReader();
    reader.onloadend = () => setPreviewImage(reader.result);
    reader.readAsDataURL(file);
    
    // Upload to S3
    try {
      const s3Url = await uploadToS3(file);
      handleChange('profilePicture', s3Url);
      setUploadProgress(100);
      return true;
    } catch (error) {
      console.error('S3 upload error:', error);
      alert('Failed to upload image. Please try again.');
      setPreviewImage(null);
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
    handleChange('profilePicture', '');
    setPreviewImage(null);
    setUploadProgress(0);
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
            {/* Profile Picture Card - UPDATED WITH S3 UPLOAD STYLE */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="relative group">
                    <img
                      src={previewImage || (isEditing ? editedProfile.profilePicture : profile.profilePicture)}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover ring-4 ring-gray-100"
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
                          onClick={() => document.getElementById('profileImageInput').click()}
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
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-[#1C62A0] text-white rounded-lg hover:bg-[#4c6c88] transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSave}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-[#1C62A0] text-white rounded-lg hover:bg-[#4c6c88] transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </button>
                    <button
                      onClick={handleCancel}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
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
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                About Me
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Bio
                </label>
                {isEditing ? (
                  <textarea
                    value={editedProfile.bio}
                    onChange={(e) => handleChange('bio', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter bio"
                  />
                ) : (
                  <p className="text-gray-900 leading-relaxed">{profile.bio || 'Not specified'}</p>
                )}
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Website Link
                </label>
                {isEditing ? (
                  <div className="flex items-center space-x-2">
                    <LinkIcon className="w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={editedProfile.websiteLink || ''}
                      onChange={(e) => handleChange('websiteLink', e.target.value)}
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
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Briefcase className="w-5 h-5 mr-2 text-blue-600" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Full Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedProfile.fullName}
                      onChange={(e) => handleChange('fullName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <span className="text-gray-900">{profile.fullName}</span>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Username</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedProfile.username}
                      onChange={(e) => handleChange('username', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <span className="text-gray-900">{profile.username}</span>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editedProfile.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{profile.email}</span>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Phone Number</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedProfile.phoneNumber}
                      onChange={(e) => handleChange('phoneNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{profile.phoneNumber}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Heart className="w-5 h-5 mr-2 text-blue-600" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Location</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedProfile.location}
                      onChange={(e) => handleChange('location', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{profile.location}</span>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Date of Birth</label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editedProfile.dateOfBirth}
                      onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{profile.dateOfBirth}</span>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Gender</label>
                  {isEditing ? (
                    <select
                      value={editedProfile.gender}
                      onChange={(e) => handleChange('gender', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{profile.gender}</span>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Occupation</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedProfile.occupation}
                      onChange={(e) => handleChange('occupation', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Briefcase className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{profile.occupation}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <School className="w-5 h-5 mr-2 text-blue-600" />
                Additional Information
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Education</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedProfile.education}
                      onChange={(e) => handleChange('education', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <School className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{profile.education}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;