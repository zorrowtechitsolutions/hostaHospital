// src/components/MyProfile/DoctorProfile.jsx - COMPLETE WITH PHONE VALIDATION
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail, Phone, Edit, Save, X, Upload, CheckCircle,
  User, Stethoscope, Award, Calendar, FileText, Building,
  Heart, Briefcase, Clock, DollarSign, Info, AlertCircle,
  MapPin, Home, CalendarDays, GraduationCap, Users
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useGetDoctorByIdQuery, useUpdateDoctorMutation } from '../../../app/service/doctorApi';
import { uploadToS3, getS3ImageUrl } from '../../../app/service/S3';
// ✅ IMPORT TOAST FUNCTIONS
import { showSuccessToast, showErrorToast, showWarningToast } from '../ui/Toast';

// ==================== CONSTANTS ====================
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const FALLBACK_IMAGE = 'https://ui-avatars.com/api/?name=Doctor&background=1C62A0&color=fff&length=2';

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

// ==================== SKELETON LOADER ====================
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

const DoctorProfile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const doctorId = user?.doctorId || user?.id;
  
  // ✅ Fetch doctor data from API
  const { data: doctorResponse, isLoading, error: fetchError, refetch } = useGetDoctorByIdQuery(doctorId, {
    skip: !doctorId,
  });
  
  const [updateDoctor, { isLoading: isUpdating }] = useUpdateDoctorMutation();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    profileImage: null,
    imageUrl: null,
    imageKey: null,
    department: '',
    specialist: '',
    qualification: '',
    experience: '',
    regNo: '',
    hospitalName: '',
    hospitalId: '',
    bio: '',
    consultationFee: '',
    availability: '',
    gender: '',
    dob: '',
    address: {},
    place: '',
    district: '',
    state: '',
    country: '',
    pincode: '',
    addressString: '',
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
  const [serverError, setServerError] = useState(null); // Keep for logic, but not displayed

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
    if (doctorResponse) {
      // ✅ The doctor data is in doctorResponse.data
      const doctor = doctorResponse.data || doctorResponse;
      
      if (doctor) {
        const imageKey = 
          doctor?.profilePicture ||
          doctor?.imageUrl ||
          doctor?.image ||
          null;
        
        // Get address fields
        const address = doctor?.address || {};
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
        
        // Format date of birth
        const dob = doctor?.dob ? 
          doctor.dob.split('T')[0] : 
          '';
        
        const newFormData = {
          firstName: doctor?.firstName || doctor?.name?.split(' ')[0] || '',
          lastName: doctor?.lastName || doctor?.name?.split(' ')[1] || '',
          email: doctor?.email || '',
          phone: doctor?.phone || '',
          profileImage: imageKey,
          imageUrl: imageKey,
          imageKey: imageKey,
          department: doctor?.department || '',
          specialist: doctor?.specialist || doctor?.specialization || '',
          qualification: doctor?.qualification || '',
          experience: doctor?.experience || '',
          regNo: doctor?.regNo || doctor?.registrationNumber || '',
          hospitalName: doctor?.hospitalName || doctor?.hospital || '',
          hospitalId: doctor?.hospitalId || '',
          bio: doctor?.bio || doctor?.about || '',
          consultationFee: doctor?.consultationFee || '',
          availability: doctor?.availability || '',
          gender: doctor?.gender || '',
          dob: dob,
          address: address,
          place: place,
          district: district,
          state: state,
          country: country,
          pincode: pincode,
          addressString: addressString,
          roleId: doctor?.roleId || '',
          isActive: doctor?.isActive ?? true,
          createdAt: doctor?.createdAt || '',
          updatedAt: doctor?.updatedAt || ''
        };
        
        setFormData(newFormData);
        setEditForm(newFormData);
        
        if (imageKey) {
          const fullUrl = getFullImageUrl(imageKey);
          setPreviewImage(fullUrl);
          setImageError(false);
        }
      }
    }
  }, [doctorResponse]);

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

  // ✅ Image upload with proper params
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
        doctorId,
        'doctor'
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
    const phoneError = validatePhone(editForm.phone);

    if (phoneError) {
      setServerError(phoneError);
      showErrorToast(phoneError); // ✅ Shows toast only
      return;
    }

    setIsSaving(true);
    setServerError(null);
    
    try {
      const updateData = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        email: editForm.email,
        phone: editForm.phone,
        department: editForm.department,
        specialist: editForm.specialist,
        qualification: editForm.qualification,
        experience: editForm.experience,
        regNo: editForm.regNo,
        hospitalName: editForm.hospitalName,
        bio: editForm.bio,
        consultationFee: editForm.consultationFee,
        availability: editForm.availability,
        gender: editForm.gender,
        dob: editForm.dob,
        profilePicture: editForm.imageUrl || editForm.profileImage || editForm.imageKey,
        address: {
          place: editForm.place,
          district: editForm.district,
          state: editForm.state,
          country: editForm.country,
          pincode: editForm.pincode
        }
      };
      
      const response = await updateDoctor({ 
        id: doctorId, 
        updateDoctor: updateData 
      }).unwrap();
      
      const updatedDoctor = response.data || response;
      
      let newProfilePicture = updatedDoctor.profilePicture || 
                              updatedDoctor.profileImage || 
                              updatedDoctor.imageUrl ||
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
      
      // Update localStorage
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { 
        ...storedUser, 
        firstName: updateData.firstName,
        lastName: updateData.lastName,
        email: updateData.email,
        phone: updateData.phone,
        profilePicture: newProfilePicture
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Update authData
      const authData = JSON.parse(localStorage.getItem('authData') || '{}');
      localStorage.setItem('authData', JSON.stringify({
        ...authData,
        name: `${updateData.firstName} ${updateData.lastName}`,
        email: updateData.email,
        phone: updateData.phone,
        profilePicture: newProfilePicture
      }));
      
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

    const name = `${formData.firstName || ''} ${formData.lastName || ''}`.trim();
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Doctor')}&background=1C62A0&color=fff&length=2`;
  };

  const handleImageError = (e) => {
    e.target.onerror = null;
    setImageError(true);
    e.target.src = FALLBACK_IMAGE;
  };

  // ✅ Get the doctor object from response
  const doctor = doctorResponse?.data || doctorResponse || {};
  const address = doctor?.address || {};

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (!doctorResponse && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="bg-yellow-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto">
            <AlertCircle className="h-8 w-8 text-yellow-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mt-4">Doctor Not Found</h2>
          <p className="text-gray-600 mt-2">No doctor found with ID: {doctorId}</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Doctor Profile</h1>
          <p className="text-gray-600 mt-1">Manage your professional information</p>
        </div>

        {/* ❌ REMOVED: Large red error div - now only shows toast notifications */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className={CARD_CLASS}>
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="relative group">
                    <img
                      src={getProfileImage()}
                      alt="Doctor Profile"
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
                  Dr. {doctor?.firstName || formData.firstName || ''} {doctor?.lastName || formData.lastName || ''}
                </h2>
                <p className="text-gray-500 text-sm">
                  {doctor?.specialist || doctor?.specialization || formData.specialist || 'Specialist'}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <div className="flex items-center text-sm text-green-600">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Verified Doctor
                  </div>
                  {doctor?.staffId && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Users className="w-4 h-4 mr-1" />
                      ID: {doctor?.staffId}
                    </div>
                  )}
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
                      disabled={isSaving || isUpdating}
                      className={`${ACTION_BUTTON_CLASS} bg-[#1C62A0] text-white hover:bg-[#4c6c88] disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <Save className="w-4 h-4" />
                      <span>{isSaving || isUpdating ? 'Saving...' : 'Save Changes'}</span>
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
                  label="First Name"
                  value={isEditing ? editForm.firstName : formData.firstName}
                  isEditing={isEditing}
                  onChange={(e) => updateEditForm('firstName', e.target.value)}
                />
                <ProfileField
                  label="Last Name"
                  value={isEditing ? editForm.lastName : formData.lastName}
                  isEditing={isEditing}
                  onChange={(e) => updateEditForm('lastName', e.target.value)}
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
                  label="Phone"
                  value={isEditing ? editForm.phone : formData.phone}
                  isEditing={isEditing}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    updateEditForm('phone', value);
                  }}
                  type="tel"
                  icon={Phone}
                  placeholder="10 digit phone number"
                />
                <ProfileField
                  label="Gender"
                  value={isEditing ? editForm.gender : formData.gender}
                  isEditing={isEditing}
                  onChange={(e) => updateEditForm('gender', e.target.value)}
                  icon={User}
                  placeholder="e.g., Male, Female"
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
              <SectionTitle icon={Stethoscope} title="Professional Information" />
              <div className="grid md:grid-cols-2 gap-4">
                <ProfileField
                  label="Department"
                  value={isEditing ? editForm.department : formData.department}
                  isEditing={isEditing}
                  onChange={(e) => updateEditForm('department', e.target.value)}
                  icon={Briefcase}
                />
                <ProfileField
                  label="Specialization"
                  value={isEditing ? editForm.specialist : formData.specialist}
                  isEditing={isEditing}
                  onChange={(e) => updateEditForm('specialist', e.target.value)}
                  icon={Heart}
                />
                <ProfileField
                  label="Qualification"
                  value={isEditing ? editForm.qualification : formData.qualification}
                  isEditing={isEditing}
                  onChange={(e) => updateEditForm('qualification', e.target.value)}
                  icon={GraduationCap}
                />
                <ProfileField
                  label="Experience"
                  value={isEditing ? editForm.experience : formData.experience}
                  isEditing={isEditing}
                  onChange={(e) => updateEditForm('experience', e.target.value)}
                  icon={Calendar}
                  placeholder="e.g., 5 years"
                />
                <ProfileField
                  label="Registration Number"
                  value={isEditing ? editForm.regNo : formData.regNo}
                  isEditing={isEditing}
                  onChange={(e) => updateEditForm('regNo', e.target.value)}
                  icon={FileText}
                />
                <ProfileField
                  label="Hospital/Clinic"
                  value={isEditing ? editForm.hospitalName : formData.hospitalName}
                  isEditing={isEditing}
                  onChange={(e) => updateEditForm('hospitalName', e.target.value)}
                  icon={Building}
                />
                <ProfileField
                  label="Hospital ID"
                  value={formData.hospitalId}
                  isEditing={false}
                  icon={Building}
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
                  <label className="block text-sm font-medium text-gray-500 mb-1">Full Address</label>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">
                      {formData.addressString || 'Not specified'}
                    </span>
                  </div>
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

export default DoctorProfile;