// src/components/super-admin/HospitalDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Users,
  Stethoscope,
  Briefcase,
  Calendar,
  Activity,
  Ambulance,
  Droplet,
  Mail,
  Phone,
  MapPin,
  Globe,
  Loader2,
  ChevronRight,
  Bell,
  UserPlus,
  Edit2,
  Save,
  X,
  Upload,
  Image as ImageIcon,
  CheckCircle,
  Link as LinkIcon,
  School,
  Heart,
  Monitor, // Add this import
} from 'lucide-react';
import { Card, Button } from '../../ui';
import { showSuccessToast, showErrorToast, showWarningToast } from '../../ui/Toast';
import { useGetHospitalByIdQuery, useUpdateHospitalMutation } from '../../../../app/service/hospitalApi';
import { useGetPatientsQuery } from '../../../../app/service/patients';
import { useGetDoctorsQuery } from '../../../../app/service/doctorApi';
import { useGetStaffQuery } from '../../../../app/service/staffApi';
import { useGetBookingsQuery } from '../../../../app/service/request';
import { useGetAmbulanceQuery } from '../../../../app/service/ambulance';
import { useGetBloodBankQuery } from '../../../../app/service/bloodbank';
import { 
  useGetUnreadNotificationsQuery,
  useGetReadNotificationsQuery 
} from '../../../../app/service/notification';
import { uploadToS3, deleteFromS3, getS3ImageUrl } from '../../../../app/service/S3';

// ================= HELPER FUNCTIONS =================

const getImageUrlWithCache = (imageUrl) => {
  if (!imageUrl) return null;
  return getS3ImageUrl(imageUrl);
};

// ================= CONSTANTS =================
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const FALLBACK_IMAGE = 'https://ui-avatars.com/api/?name=Hospital&background=1C62A0&color=fff&length=2';

const INPUT_CLASS = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent';
const SECTION_TITLE_CLASS = 'text-lg font-semibold text-gray-900 mb-4 flex items-center';
const SECTION_ICON_CLASS = 'w-5 h-5 mr-2 text-blue-600';

// ================= CUSTOM AVATAR COMPONENT =================

const HospitalAvatar = ({ imageUrl, hospitalName, size = 'w-16 h-16' }) => {
  const [imgError, setImgError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div className={`flex-shrink-0 rounded-2xl overflow-hidden ${size}`}>
      {imageUrl && !imgError && (
        <img
          src={imageUrl}
          alt={hospitalName}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImgError(true)}
          loading="eager"
        />
      )}
      
      <div 
        className={`w-full h-full flex items-center justify-center text-white text-2xl transition-opacity duration-300 ${
          imageLoaded ? "opacity-0 pointer-events-none" : "opacity-100"
        } bg-gray-200`}
      >
        {(!imageUrl || !imageLoaded) && hospitalName?.charAt(0)?.toUpperCase() || "H"}
      </div>
    </div>
  );
};

// ================= SECTION TITLE COMPONENT =================

const SectionTitle = ({ icon: Icon, title }) => (
  <h3 className={SECTION_TITLE_CLASS}>
    <Icon className={SECTION_ICON_CLASS} />
    {title}
  </h3>
);

// ================= PROFILE FIELD COMPONENT =================

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

// ================= PROFILE TEXTAREA COMPONENT =================

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

// ================= EDIT HOSPITAL MODAL =================

const EditHospitalModal = ({ isOpen, onClose, hospital, onSave, isSaving }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    about: '',
    website: '',
    type: '',
    location: '',
    profileImage: null,
    imageUrl: null,
    imageKey: null,
  });
  
  const [editForm, setEditForm] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageFile, setImageFile] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);

  useEffect(() => {
    if (hospital && isOpen) {
      const existingImageUrl = hospital.imageUrl || hospital.profilePicture || hospital.profileImage;
      const previewUrl = existingImageUrl ? getImageUrlWithCache(existingImageUrl) : null;
      
      const locationParts = [
        hospital.address?.place,
        hospital.address?.district,
        hospital.address?.state,
        hospital.address?.country
      ].filter(Boolean);
      const locationString = locationParts.join(', ');
      
      const newFormData = {
        name: hospital.name || '',
        email: hospital.email || '',
        phone: hospital.phone || '',
        about: hospital.about || '',
        website: hospital.website || '',
        type: hospital.type || 'Hospital',
        location: locationString,
        profileImage: existingImageUrl || null,
        imageUrl: existingImageUrl || null,
        imageKey: existingImageUrl || null,
      };
      
      setFormData(newFormData);
      setEditForm(newFormData);
      setPreviewImage(previewUrl);
      setRemoveExistingImage(false);
      setImageFile(null);
      setImageError(false);
      setIsEditing(true);
    }
  }, [hospital, isOpen]);

  const resetUploadState = () => {
    setUploadProgress(0);
  };

  const updateEditForm = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    
    if (file.size > MAX_FILE_SIZE) {
      showErrorToast('File size must be less than 5MB', 3000);
      return;
    }
    
    if (!VALID_IMAGE_TYPES.includes(file.type)) {
      showErrorToast('Invalid file type. Allowed: JPEG, PNG, GIF, WEBP', 3000);
      return;
    }
    
    setUploadProgress(10);
    setImageFile(file);
    setPreviewImage(URL.createObjectURL(file));
    setRemoveExistingImage(false);
    setImageError(false);
    setUploadProgress(100);
    setTimeout(() => setUploadProgress(0), 1000);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) handleImageUpload(file);
  };

  const removeImage = () => {
    setPreviewImage(null);
    setUploadProgress(0);
    setImageFile(null);
    if (formData.profileImage) {
      setRemoveExistingImage(true);
    }
    setImageError(false);
    showSuccessToast('Image removed', 2000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    updateEditForm(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!editForm.name) {
      showErrorToast('Hospital name is required', 3000);
      return;
    }

    try {
      setUploadProgress(10);
      
      let finalImageUrl = formData.profileImage;
      const hospitalId = hospital?.id;

      // Handle image removal
      if (removeExistingImage && formData.profileImage) {
        await deleteFromS3(formData.profileImage, hospitalId, "hospital");
        finalImageUrl = null;
        setUploadProgress(30);
      }

      // Upload new image if selected
      if (imageFile) {
        // Delete existing image if it exists (and not already removed)
        if (formData.profileImage && !removeExistingImage) {
          await deleteFromS3(formData.profileImage, hospitalId, "hospital");
        }
        
        setUploadProgress(50);
        const uploadResult = await uploadToS3(
          imageFile,
          null,
          hospitalId,
          "hospital"
        );
        finalImageUrl = uploadResult.key;
        setUploadProgress(80);
      }

      const updateData = {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        about: editForm.about,
        website: editForm.website,
        type: editForm.type,
        profilePicture: finalImageUrl,
        profileImage: finalImageUrl,
        imageUrl: finalImageUrl,
        imageKey: finalImageUrl,
      };

      await onSave(updateData);
      
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(0), 1000);
      
      setImageFile(null);
      setPreviewImage(null);
      setRemoveExistingImage(false);
      
    } catch (error) {
      setUploadProgress(0);
      showErrorToast(error?.message || 'Failed to update hospital', 3000);
      throw error;
    }
  };

  // Reset state when modal closes
  const handleClose = () => {
    setImageFile(null);
    setPreviewImage(null);
    setRemoveExistingImage(false);
    setImageError(false);
    setUploadProgress(0);
    setIsEditing(false);
    onClose();
  };

  if (!isOpen) return null;

  const isUploading = uploadProgress > 0 && uploadProgress < 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Modal Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Edit Hospital</h2>
              <p className="text-sm text-gray-500 mt-1">Update hospital information and preferences</p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Modal Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Image Section */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <img
                    src={previewImage || getImageUrlWithCache(formData.profileImage) || FALLBACK_IMAGE}
                    alt="Hospital Profile"
                    className="w-32 h-32 rounded-full object-cover ring-4 ring-gray-200"
                    onError={() => {
                      setImageError(true);
                    }}
                    loading="lazy"
                  />
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
                
                {isUploading && (
                  <div className="mt-4 w-full max-w-xs">
                    <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#1C62A0] transition-all duration-300 rounded-full"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-center">Uploading... {uploadProgress}%</p>
                  </div>
                )}
                
                <p className="text-xs text-gray-400 mt-3">PNG, JPG, WEBP (Max 5MB)</p>
              </div>
            </div>

            {/* About Hospital Section */}
            <div className="bg-gray-50 rounded-xl p-6">
              <SectionTitle icon={Heart} title="About Hospital" />
              
              <ProfileTextarea
                label="Bio"
                value={editForm.about || ''}
                isEditing={true}
                onChange={(e) => updateEditForm('about', e.target.value)}
              />

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-500 mb-1">Website Link</label>
                <div className="flex items-center space-x-2">
                  <LinkIcon className="w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    value={editForm.website || ''}
                    onChange={(e) => updateEditForm('website', e.target.value)}
                    className={INPUT_CLASS}
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            </div>

            {/* Basic Information Section */}
            <div className="bg-gray-50 rounded-xl p-6">
              <SectionTitle icon={Briefcase} title="Basic Information" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ProfileField
                  label="Hospital Name *"
                  value={editForm.name || ''}
                  isEditing={true}
                  onChange={(e) => updateEditForm('name', e.target.value)}
                  required
                />
                
                <ProfileField
                  label="Email"
                  value={editForm.email || ''}
                  isEditing={true}
                  onChange={(e) => updateEditForm('email', e.target.value)}
                  type="email"
                  icon={Mail}
                />
                
                <ProfileField
                  label="Phone Number"
                  value={editForm.phone || ''}
                  isEditing={true}
                  onChange={(e) => updateEditForm('phone', e.target.value)}
                  icon={Phone}
                />
                
                <ProfileField
                  label="Hospital Type"
                  value={editForm.type || ''}
                  isEditing={true}
                  onChange={(e) => updateEditForm('type', e.target.value)}
                  icon={Briefcase}
                />
              </div>
            </div>

            {/* Location Information Section */}
            <div className="bg-gray-50 rounded-xl p-6">
              <SectionTitle icon={MapPin} title="Location Information" />
              <ProfileField
                label="Location"
                value={editForm.location || ''}
                isEditing={true}
                onChange={(e) => updateEditForm('location', e.target.value)}
                icon={MapPin}
              />
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || isUploading}
                className="flex-1 px-4 py-2 bg-[#1C62A0] hover:bg-[#4c6c88] text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {(isSaving || isUploading) && (
                  <Loader2 size={18} className="animate-spin" />
                )}
                {isUploading ? 'Uploading...' : isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// ================= MAIN COMPONENT =================

const HospitalDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [updateHospital, { isLoading: isUpdating }] = useUpdateHospitalMutation();
  
  const { data: hospitalData, isLoading: isHospitalLoading, error, refetch } = useGetHospitalByIdQuery(id);
  const hospital = hospitalData?.data || hospitalData;

  // Fetch patients with hospitalId filter
  const { data: patientsData, isLoading: patientsLoading, refetch: refetchPatients } = useGetPatientsQuery({ 
    hospitalId: id,
    page: 1,
    limit: 100
  });
  
  const { data: doctorsData, isLoading: doctorsLoading } = useGetDoctorsQuery({ 
    hospitalId: id,
    page: 1,
    limit: 100
  });
  
  const { data: staffData, isLoading: staffLoading } = useGetStaffQuery({ 
    hospitalId: id,
    page: 1,
    limit: 100
  });
  
  const { data: bookingsData, isLoading: bookingsLoading } = useGetBookingsQuery({ 
    hospitalId: id,
    page: 1,
    limit: 100
  });
  
  const { data: ambulanceData, isLoading: ambulanceLoading } = useGetAmbulanceQuery({ 
    hospitalId: id
  });
  
  const { data: bloodBankData, isLoading: bloodBankLoading } = useGetBloodBankQuery({ 
    hospitalId: id
  });

  const { 
    data: unreadData, 
    isLoading: unreadLoading 
  } = useGetUnreadNotificationsQuery({
    role: 'hospital',
    id: Number(id),
  }, {
    skip: !id,
  });

  const { 
    data: readData, 
    isLoading: readLoading 
  } = useGetReadNotificationsQuery({
    role: 'hospital',
    id: Number(id),
  }, {
    skip: !id,
  });

  const unreadNotifications = unreadData?.data || [];
  const readNotifications = readData?.data || [];
  const notificationCount = unreadNotifications.length;

  // Calculate counts - using the actual filtered data from API
  const patientsList = patientsData?.data || [];
  const doctorsList = doctorsData?.data || [];
  const staffList = staffData?.data || [];
  const bookingsList = bookingsData?.data || [];
  const ambulancesList = ambulanceData?.data || [];
  const bloodBanksList = bloodBankData?.data || [];

  const patientsCount = patientsList.length;
  const doctorsCount = doctorsList.length;
  const staffCount = staffList.length;
  
  const appointmentsCount = bookingsList.filter(
    booking => booking.status !== 'completed' && booking.status !== 'cancelled'
  ).length;
  
  const visitsCount = bookingsList.filter(
    booking => 
      booking.status === 'pending' || 
      booking.status === 'accepted'
  ).length;
  
  const ambulancesCount = ambulancesList.length;
  const bloodBanksCount = bloodBanksList.length;

  const isLoading = isHospitalLoading || patientsLoading || doctorsLoading || staffLoading || bookingsLoading || ambulanceLoading || bloodBankLoading || unreadLoading || readLoading;

  const getFullAddress = (address) => {
    if (!address) return 'N/A';
    const parts = [address.place, address.district, address.state, address.country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  };

  const getProfileImage = () => {
    if (!hospital) return null;
    const image = hospital.imageUrl || hospital.profilePicture || hospital.profileImage;
    return image ? getImageUrlWithCache(image) : null;
  };

  const handleUpdateHospital = async (updateData) => {
    setIsSaving(true);
    try {
      const response = await updateHospital({
        id: id,
        updateHospital: updateData
      }).unwrap();
      
      showSuccessToast('Hospital updated successfully!', 3000);
      setShowEditModal(false);
      
      refetch();
      
    } catch (error) {
      console.error("Update error:", error);
      showErrorToast(error?.data?.message || 'Failed to update hospital', 3000);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // Navigation handlers
  const navigateToPatients = () => {
    navigate(`/super-admin/hospitals/${id}/patients`, { 
      state: { 
        hospitalId: id,
        hospitalName: hospital?.name 
      } 
    });
  };

  const navigateToDoctors = () => {
    navigate(`/super-admin/hospitals/${id}/doctors`, { 
      state: { 
        hospitalId: id,
        hospitalName: hospital?.name 
      } 
    });
  };

  const navigateToStaff = () => {
    navigate(`/super-admin/hospitals/${id}/staff`, { 
      state: { 
        hospitalId: id,
        hospitalName: hospital?.name 
      } 
    });
  };

  const navigateToAppointments = () => {
    navigate(`/super-admin/hospitals/${id}/appointments`, { 
      state: { 
        hospitalId: id,
        hospitalName: hospital?.name 
      } 
    });
  };

  const navigateToVisits = () => {
    navigate(`/super-admin/hospitals/${id}/visits`, { 
      state: { 
        hospitalId: id,
        hospitalName: hospital?.name 
      } 
    });
  };

  const navigateToAmbulances = () => {
    navigate(`/super-admin/hospitals/${id}/ambulances`, { 
      state: { 
        hospitalId: id,
        hospitalName: hospital?.name 
      } 
    });
  };

  const navigateToBloodBanks = () => {
    navigate(`/super-admin/hospitals/${id}/blood-banks`, { 
      state: { 
        hospitalId: id,
        hospitalName: hospital?.name 
      } 
    });
  };

  const navigateToNotifications = () => {
    navigate(`/super-admin/hospitals/${id}/notifications`, { 
      state: { 
        hospitalId: id,
        hospitalName: hospital?.name 
      } 
    });
  };

  // NEW: Navigation to Session History
  const navigateToSessions = () => {
    navigate(`/super-admin/hospitals/${id}/sessions`, { 
      state: { 
        hospitalId: hospital.id,
        hospitalName: hospital.name 
      } 
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#6366F1] mx-auto mb-3" />
          <p className="text-gray-500">Loading hospital details...</p>
        </div>
      </div>
    );
  }

  if (error || !hospital) {
    return (
      <div className="text-center py-12">
        <Building2 size={48} className="text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Hospital not found</p>
        <Button onClick={() => navigate('/super-admin/hospitals')} className="mt-4">
          Back to Hospitals
        </Button>
      </div>
    );
  }

  const profileImageUrl = getProfileImage();

  const statCards = [
    { 
      title: 'Total Patients', 
      value: patientsCount, 
      icon: Users, 
      bgColor: 'bg-blue-50',
      iconBgColor: 'bg-blue-100',
      textColor: 'text-blue-600',
      borderColor: 'border-blue-200',
      hoverBg: 'hover:bg-blue-50/50',
      onClick: navigateToPatients,
      description: `${patientsCount} patients registered`,
      actionLabel: 'View All Patients'
    },
    { 
      title: 'Total Doctors', 
      value: doctorsCount, 
      icon: Stethoscope, 
      bgColor: 'bg-green-50',
      iconBgColor: 'bg-green-100',
      textColor: 'text-green-600',
      borderColor: 'border-green-200',
      hoverBg: 'hover:bg-green-50/50',
      onClick: navigateToDoctors,
      description: `${doctorsCount} doctors available`,
      actionLabel: 'View All Doctors'
    },
    { 
      title: 'Total Staff', 
      value: staffCount, 
      icon: Briefcase, 
      bgColor: 'bg-purple-50',
      iconBgColor: 'bg-purple-100',
      textColor: 'text-purple-600',
      borderColor: 'border-purple-200',
      hoverBg: 'hover:bg-purple-50/50',
      onClick: navigateToStaff,
      description: `${staffCount} staff members`,
      actionLabel: 'View All Staff'
    },
    { 
      title: 'Appointments', 
      value: appointmentsCount, 
      icon: Calendar, 
      bgColor: 'bg-orange-50',
      iconBgColor: 'bg-orange-100',
      textColor: 'text-orange-600',
      borderColor: 'border-orange-200',
      hoverBg: 'hover:bg-orange-50/50',
      onClick: navigateToAppointments,
      description: `${appointmentsCount} upcoming appointments`,
      actionLabel: 'View Appointments'
    },
    { 
      title: 'Pending Visits', 
      value: visitsCount, 
      icon: Activity, 
      bgColor: 'bg-indigo-50',
      iconBgColor: 'bg-indigo-100',
      textColor: 'text-indigo-600',
      borderColor: 'border-indigo-200',
      hoverBg: 'hover:bg-indigo-50/50',
      onClick: navigateToVisits,
      description: `${visitsCount} pending visits`,
      actionLabel: 'View Visits'
    },
    { 
      title: 'Ambulances', 
      value: ambulancesCount, 
      icon: Ambulance, 
      bgColor: 'bg-red-50',
      iconBgColor: 'bg-red-100',
      textColor: 'text-red-600',
      borderColor: 'border-red-200',
      hoverBg: 'hover:bg-red-50/50',
      onClick: navigateToAmbulances,
      description: `${ambulancesCount} ambulance${ambulancesCount !== 1 ? 's' : ''}`,
      actionLabel: 'View Ambulances'
    },
    { 
      title: 'Blood Banks', 
      value: bloodBanksCount, 
      icon: Droplet, 
      bgColor: 'bg-pink-50',
      iconBgColor: 'bg-pink-100',
      textColor: 'text-pink-600',
      borderColor: 'border-pink-200',
      hoverBg: 'hover:bg-pink-50/50',
      onClick: navigateToBloodBanks,
      description: `${bloodBanksCount} blood bank${bloodBanksCount !== 1 ? 's' : ''}`,
      actionLabel: 'View Blood Banks'
    },
    { 
      title: 'Notifications', 
      value: notificationCount, 
      icon: Bell, 
      bgColor: 'bg-yellow-50',
      iconBgColor: 'bg-yellow-100',
      textColor: 'text-yellow-600',
      borderColor: 'border-yellow-200',
      hoverBg: 'hover:bg-yellow-50/50',
      onClick: navigateToNotifications,
      description: `${notificationCount} unread notification${notificationCount !== 1 ? 's' : ''}`,
      actionLabel: 'View Notifications'
    },
    // NEW: Session History Card
    { 
      title: 'Session History', 
      value: 'View', 
      icon: Monitor, 
      bgColor: 'bg-cyan-50',
      iconBgColor: 'bg-cyan-100',
      textColor: 'text-cyan-600',
      borderColor: 'border-cyan-200',
      hoverBg: 'hover:bg-cyan-50/50',
      onClick: navigateToSessions,
      description: 'View user login sessions',
      actionLabel: 'View Sessions'
    }
  ];

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => navigate('/super-admin/hospitals')} 
            className="mb-4"
          >
            <ArrowLeft size={18} className="mr-1" /> Back to Hospitals
          </Button>
          
          <div className="flex gap-2">
            <Button 
              variant="primary" 
              size="sm" 
              onClick={navigateToSessions}
              className="mb-4"
            >
              <Monitor size={18} className="mr-1" /> Session History
            </Button>
            <Button 
              variant="primary" 
              size="sm" 
              onClick={() => setShowEditModal(true)}
              className="mb-4"
            >
              <Edit2 size={18} className="mr-1" /> Edit Hospital
            </Button>
          </div>
        </div>
        
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <HospitalAvatar 
              imageUrl={profileImageUrl}
              hospitalName={hospital.name}
              size="w-16 h-16"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{hospital.name}</h1>
              <p className="text-sm text-gray-500 mt-1">ID: {hospital.id}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs text-gray-400">Status:</span>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle size={10} /> Active
                </span>
                <span className="text-xs text-gray-400 ml-2">Last Updated:</span>
                <span className="text-xs text-gray-500">{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Hospital Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <Mail size={18} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-sm text-gray-900">{hospital.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Phone size={18} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Phone</p>
              <p className="text-sm text-gray-900">{hospital.phone || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Globe size={18} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Type</p>
              <p className="text-sm text-gray-900 capitalize">{hospital.type || 'Hospital'}</p>
            </div>
          </div>
          {hospital.website && (
            <div className="flex items-center gap-3">
              <Globe size={18} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Website</p>
                <a 
                  href={hospital.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  {hospital.website}
                </a>
              </div>
            </div>
          )}
          {hospital.address && (
            <div className="flex items-start gap-3 col-span-2">
              <MapPin size={18} className="text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Address</p>
                <p className="text-sm text-gray-900">{getFullAddress(hospital.address)}</p>
              </div>
            </div>
          )}
          {hospital.emergencyContact && (
            <div className="flex items-center gap-3">
              <Phone size={18} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Emergency Contact</p>
                <p className="text-sm text-gray-900">{hospital.emergencyContact}</p>
              </div>
            </div>
          )}
        </div>
        
        {hospital.about && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-1">About</p>
            <p className="text-sm text-gray-700">{hospital.about}</p>
          </div>
        )}
      </Card>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Overview Statistics</h2>
          <span className="text-sm text-gray-400">Click any card to view details</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div 
                key={index} 
                onClick={stat.onClick}
                className={`group cursor-pointer transition-all duration-300 hover:scale-[1.02]`}
              >
                <Card className={`p-5 border ${stat.borderColor} hover:shadow-lg transition-all duration-300 ${stat.hoverBg}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-500">
                        {stat.title}
                      </p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value.toLocaleString()}</p>
                      <p className="text-xs text-gray-400 mt-1 group-hover:text-gray-600 transition-colors truncate">
                        {stat.description}
                      </p>
                    </div>
                    <div className={`${stat.iconBgColor || stat.bgColor} p-3 rounded-xl group-hover:scale-110 transition-transform duration-300 flex-shrink-0 ml-2`}>
                      <Icon size={22} className={stat.textColor} />
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-400 group-hover:text-gray-600 transition-colors">
                      {stat.actionLabel}
                    </span>
                    <ChevronRight size={14} className="text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Hospital Modal */}
      <EditHospitalModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        hospital={hospital}
        onSave={handleUpdateHospital}
        isSaving={isSaving}
      />
    </div>
  );
};

export default HospitalDetails;