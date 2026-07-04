import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail, Phone, Edit, Save, X, Upload, CheckCircle,
  User, Briefcase, Award, Building, Info, Calendar, Users, IdCard
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useGetStaffByIdQuery, useUpdateStaffMutation } from '../../../app/service/staffApi';
import { uploadToS3, S3_BASE_URL } from '../../../app/service/S3';
import { formatDate } from "../../utils/dateFormatter";

// Constants
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const INPUT_CLASS = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent';
const CARD_CLASS = 'bg-white rounded-2xl shadow-sm border border-gray-100 p-6';

const getFullImageUrl = (imageKey) => {
  if (!imageKey) return null;
  if (imageKey.startsWith("http")) return imageKey;
  return `${S3_BASE_URL}/${encodeURIComponent(imageKey)}`;
};

const ProfileSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
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

const StaffProfile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const staffId = user?.staffId || user?.id;
  const { data: staffData, isLoading, error: fetchError, refetch } = useGetStaffByIdQuery(staffId, {
    skip: !staffId,
  });
  const [updateStaff] = useUpdateStaffMutation();

  const [formData, setFormData] = useState({
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
    staffId: ''
  });
  
  const [editForm, setEditForm] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (fetchError?.status === 401) {
      setTimeout(() => {
        logout();
        navigate('/sign-in');
      }, 2000);
    }
  }, [fetchError, logout, navigate]);

  useEffect(() => {
    if (staffData) {
      const staff = staffData.data || staffData;
      const imageKey = staff?.profilePicture || staff?.imageUrl || staff?.image || null;
      
      setFormData({
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
        joiningDate: staff?.joiningDate || '',
        staffId: staff?.staffId || staff?.id || staffId
      });
      
      setEditForm({
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
        joiningDate: staff?.joiningDate || '',
        staffId: staff?.staffId || staff?.id || staffId
      });
      
      if (imageKey) setPreviewImage(getFullImageUrl(imageKey));
    }
  }, [staffData, staffId]);

  const updateEditForm = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      alert('File size must be less than 5MB');
      return;
    }
    if (!VALID_IMAGE_TYPES.includes(file.type)) {
      alert('Invalid file type. Allowed: JPEG, PNG, GIF, WEBP');
      return;
    }
    
    setUploadProgress(10);
    const reader = new FileReader();
    reader.onloadend = () => setPreviewImage(reader.result);
    reader.readAsDataURL(file);
    
    try {
      setUploadProgress(30);
      const uploaded = await uploadToS3(file, formData.imageKey || null, staffId);
      setUploadProgress(100);
      setEditForm(prev => ({ ...prev, imageUrl: uploaded.key, profileImage: uploaded.key, imageKey: uploaded.key }));
      setTimeout(() => setUploadProgress(0), 1000);
    } catch {
      setUploadProgress(0);
      if (formData.profileImage) setPreviewImage(getFullImageUrl(formData.profileImage));
      else setPreviewImage(null);
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
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditForm({ ...formData });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updateData = {
        staffId: staffId,
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
        staffId: editForm.staffId,
        profilePicture: editForm.imageUrl || editForm.profileImage || editForm.imageKey,
      };
      
      const response = await updateStaff({ 
        id: staffId, 
        updateStaff: updateData 
      }).unwrap();
      
      const updatedStaff = response.data || response;
      let newProfilePicture = updatedStaff.profilePicture || updatedStaff.profileImage || updateData.profilePicture;
      const newImageUrl = newProfilePicture ? getFullImageUrl(newProfilePicture) : null;
      
      const updatedFormData = { ...editForm, profileImage: newProfilePicture, imageUrl: newProfilePicture, imageKey: newProfilePicture };
      setFormData(updatedFormData);
      if (newImageUrl) setPreviewImage(newImageUrl);
      
      setIsEditing(false);
      
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { 
        ...storedUser, 
        staffId: staffId,
        name: updateData.name, 
        email: updateData.email, 
        phone: updateData.phone, 
        profilePicture: newProfilePicture 
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      refetch();
    } catch {
      // Silently handle save error
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditForm({ ...formData });
    setPreviewImage(formData.profileImage ? getFullImageUrl(formData.profileImage) : null);
    setIsEditing(false);
  };

  const getProfileImage = () => {
    if (previewImage) return previewImage;
    if (formData.profileImage || formData.imageUrl || formData.imageKey) {
      const imageValue = formData.profileImage || formData.imageUrl || formData.imageKey;
      const url = getFullImageUrl(imageValue);
      if (url) return url;
    }
    return `https://ui-avatars.com/api/?name=${formData.name}&background=1C62A0&color=fff&length=2`;
  };

  if (isLoading) return <ProfileSkeleton />;

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
                    />
                    {isEditing && (
                      <>
                        <input
                          id="staffImageInput"
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById('staffImageInput')?.click()}
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
                        <div className="h-full bg-[#1C62A0] transition-all duration-300 rounded-full" style={{ width: `${uploadProgress}%` }} />
                      </div>
                      <p className="text-xs text-gray-500 mt-1 text-center">Uploading... {uploadProgress}%</p>
                    </div>
                  )}
                </div>
                
                <h2 className="mt-4 text-xl font-semibold text-gray-900">
                  {isEditing ? editForm.name : formData.name}
                </h2>
                <p className="text-gray-500 text-sm">
                  {isEditing ? editForm.designation : formData.designation}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <div className="flex items-center text-sm text-green-600">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Active Staff
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <IdCard className="w-4 h-4 mr-1" />
                    Staff ID: {staffId}
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                {!isEditing ? (
                  <button
                    onClick={handleEdit}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-[#1C62A0] text-white rounded-lg hover:bg-[#155a8a] transition-colors"
                  >
                    <Edit size={18} />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      <Save size={18} />
                      <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                    <button
                      onClick={handleCancel}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      <X size={18} />
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
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-[#1C62A0]" />
                Basic Information
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <ProfileField
                  label="Full Name"
                  value={isEditing ? editForm.name : formData.name}
                  isEditing={isEditing}
                  onChange={(e) => updateEditForm('name', e.target.value)}
                  icon={User}
                />
                <ProfileField
                  label="Email Address"
                  value={isEditing ? editForm.email : formData.email}
                  isEditing={isEditing}
                  onChange={(e) => updateEditForm('email', e.target.value)}
                  type="email"
                  icon={Mail}
                />
                <ProfileField
                  label="Phone Number"
                  value={isEditing ? editForm.phone : formData.phone}
                  isEditing={isEditing}
                  onChange={(e) => updateEditForm('phone', e.target.value)}
                  icon={Phone}
                />
                <ProfileField
                  label="Staff ID"
                  value={isEditing ? editForm.staffId : formData.staffId}
                  isEditing={isEditing}
                  onChange={(e) => updateEditForm('staffId', e.target.value)}
                  icon={IdCard}
                  placeholder="e.g., STF001"
                />
              </div>
            </div>

            {/* Professional Information */}
            <div className={CARD_CLASS}>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Briefcase className="w-5 h-5 mr-2 text-[#1C62A0]" />
                Professional Information
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <ProfileField
                  label="Designation"
                  value={isEditing ? editForm.designation : formData.designation}
                  isEditing={isEditing}
                  onChange={(e) => updateEditForm('designation', e.target.value)}
                  icon={Briefcase}
                  placeholder="e.g., Senior Nurse"
                />
                <ProfileField
                  label="Staff Type"
                  value={isEditing ? editForm.staffType : formData.staffType}
                  isEditing={isEditing}
                  onChange={(e) => updateEditForm('staffType', e.target.value)}
                  icon={Users}
                  placeholder="e.g., Nursing, Administrative"
                />
                <ProfileField
                  label="Qualification"
                  value={isEditing ? editForm.qualification : formData.qualification}
                  isEditing={isEditing}
                  onChange={(e) => updateEditForm('qualification', e.target.value)}
                  icon={Award}
                  placeholder="e.g., B.Sc Nursing"
                />
                <ProfileField
                  label="Hospital/Clinic"
                  value={isEditing ? editForm.hospitalName : formData.hospitalName}
                  isEditing={isEditing}
                  onChange={(e) => updateEditForm('hospitalName', e.target.value)}
                  icon={Building}
                />
                <ProfileField
                  label="Joining Date"
                  value={
                    isEditing
                      ? editForm.joiningDate
                      : formatDate(formData.joiningDate)
                  }
                  isEditing={isEditing}
                  onChange={(e) => updateEditForm("joiningDate", e.target.value)}
                  type="date"
                  icon={Calendar}
                />
              </div>
            </div>

            {/* Additional Information */}
            <div className={CARD_CLASS}>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Info className="w-5 h-5 mr-2 text-[#1C62A0]" />
                Additional Information
              </h3>
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
  );
};

export default StaffProfile;