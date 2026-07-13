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

// Get S3 image URL without cache busting to allow browser caching
const getImageUrlWithCache = (imageUrl) => {
  if (!imageUrl) return null;
  return getS3ImageUrl(imageUrl);
};

// ================= CUSTOM AVATAR COMPONENT =================

const HospitalAvatar = ({ imageUrl, hospitalName, size = 'w-16 h-16' }) => {
  const [imgError, setImgError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div className={`flex-shrink-0 rounded-2xl overflow-hidden ${size}`}>
      {/* Image - shown when loaded */}
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
      
      {/* Fallback - neutral gray, only shown until image loads */}
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

// ================= IMAGE UPLOAD COMPONENT =================

const ImageUpload = ({ 
  imageUrl, 
  onImageChange, 
  onImageRemove, 
  isUploading,
  label = "Hospital Image",
  disabled = false
}) => {
  const fileInputRef = React.useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showErrorToast('Please select an image file', 3000);
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showErrorToast('Image size should be less than 5MB', 3000);
      return;
    }

    onImageChange(file);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      
      <div className="flex items-start gap-4">
        {/* Image Preview */}
        <div className="relative w-24 h-24 flex-shrink-0">
          {imageUrl ? (
            <div className="relative w-full h-full">
              <img
                src={imageUrl}
                alt="Hospital"
                className="w-full h-full object-cover rounded-lg border border-gray-200"
              />
              <button
                type="button"
                onClick={onImageRemove}
                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                disabled={isUploading || disabled}
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="w-full h-full border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
              <ImageIcon className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* Upload Button */}
        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading || disabled}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || disabled}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1C62A0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isUploading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1C62A0]"></span>
                Uploading...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Upload size={16} />
                {imageUrl ? 'Change Image' : 'Upload Image'}
              </span>
            )}
          </button>
          <p className="mt-1 text-xs text-gray-500">PNG, JPG, WEBP (Max 5MB)</p>
        </div>
      </div>
    </div>
  );
};

// ================= EDIT HOSPITAL MODAL =================

const EditHospitalModal = ({ isOpen, onClose, hospital, onSave, isSaving }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    about: '',
    website: '',
    type: '',
    profileImage: null
  });
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);

  useEffect(() => {
    if (hospital && isOpen) {
      const existingImageUrl = hospital.imageUrl || hospital.profilePicture || hospital.profileImage;
      const previewUrl = existingImageUrl ? getImageUrlWithCache(existingImageUrl) : null;
      
      setFormData({
        name: hospital.name || '',
        email: hospital.email || '',
        phone: hospital.phone || '',
        about: hospital.about || '',
        website: hospital.website || '',
        type: hospital.type || 'Hospital',
        profileImage: existingImageUrl || null
      });
      setImagePreview(previewUrl);
      setRemoveExistingImage(false);
      setImageFile(null);
    }
  }, [hospital, isOpen]);

  const handleImageChange = async (file) => {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setRemoveExistingImage(false);
  };

  const handleImageRemove = () => {
    if (formData.profileImage) {
      setRemoveExistingImage(true);
      setImagePreview(null);
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      showErrorToast('Hospital name is required', 3000);
      return;
    }

    try {
      setIsUploading(true);
      
      let finalImageUrl = formData.profileImage;
      const hospitalId = hospital?.id;

      // Handle image removal
      if (removeExistingImage && formData.profileImage) {
        await deleteFromS3(formData.profileImage, hospitalId, "hospital");
        finalImageUrl = null;
      }

      // Upload new image if selected
      if (imageFile) {
        // Delete existing image if it exists (and not already removed)
        if (formData.profileImage && !removeExistingImage) {
          await deleteFromS3(formData.profileImage, hospitalId, "hospital");
        }
        
        const uploadResult = await uploadToS3(
          imageFile,
          null,
          hospitalId,
          "hospital"
        );
        finalImageUrl = uploadResult.key;
      }

      const updateData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        about: formData.about,
        website: formData.website,
        type: formData.type,
        profilePicture: finalImageUrl,
        profileImage: finalImageUrl,
        imageUrl: finalImageUrl
      };

      await onSave(updateData);
      
      setImageFile(null);
      setImagePreview(null);
      setRemoveExistingImage(false);
      
    } catch (error) {
      showErrorToast(error?.message || 'Failed to update hospital', 3000);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Modal Header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Edit Hospital</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Modal Form */}
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
            {/* Image Upload */}
            <ImageUpload
              imageUrl={imagePreview}
              onImageChange={handleImageChange}
              onImageRemove={handleImageRemove}
              isUploading={isUploading}
              label="Hospital Image"
            />

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hospital Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter hospital name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent outline-none"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter email"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent outline-none"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter phone number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent outline-none"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hospital Type
              </label>
              <input
                type="text"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                placeholder="Enter hospital type"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent outline-none"
              />
            </div>

            {/* Website */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                placeholder="Enter website URL"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent outline-none"
              />
            </div>

            {/* About */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                About
              </label>
              <textarea
                name="about"
                value={formData.about}
                onChange={handleInputChange}
                rows="3"
                placeholder="Enter description"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent outline-none resize-none"
              />
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
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
  
  // ✅ Add the updateHospital mutation hook
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
  
  // ✅ Appointments count - bookings that are NOT completed or cancelled
  const appointmentsCount = bookingsList.filter(
    booking => booking.status !== 'completed' && booking.status !== 'cancelled'
  ).length;
  
  // ✅ FIXED: Visits count - ONLY pending visits (not completed or cancelled)
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

  // Handle add new patient
  const handleAddPatient = () => {
    navigate(`/super-admin/hospitals/${id}/patients/add`, {
      state: {
        hospitalId: id,
        hospitalName: hospital?.name
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
          
          <Button 
            variant="primary" 
            size="sm" 
            onClick={() => setShowEditModal(true)}
            className="mb-4"
          >
            <Edit2 size={18} className="mr-1" /> Edit Hospital
          </Button>
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