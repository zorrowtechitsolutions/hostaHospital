// src/components/super-admin/HospitalDetails.jsx
import React, { useState, useEffect, useRef } from 'react';
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
  ChevronDown,
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
  Monitor,
  ClipboardCheck,
  Cpu,
  IdCard,
  Home,
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
import { useGetDevicesQuery } from '../../../../app/service/device';
// ✅ PINCODE API
import { useGetPincodeQuery } from '../../../../app/service/pincodeApi';
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

// ✅ Async image URL resolver (handles S3 object keys + signed URLs)
const getFullImageUrl = async (imageKey) => {
  if (!imageKey) return null;

  // Extract image key if API returns an object
  if (typeof imageKey === 'object') {
    imageKey =
      imageKey.key ||
      imageKey.url ||
      imageKey.imageUrl ||
      imageKey.Location ||
      null;
  }

  if (typeof imageKey !== 'string') return null;

  // Already a complete image URL
  if (
    imageKey.startsWith('http://') ||
    imageKey.startsWith('https://') ||
    imageKey.startsWith('data:') ||
    imageKey.startsWith('blob:')
  ) {
    return imageKey;
  }

  // Get signed URL from S3
  const url = await getS3ImageUrl(imageKey);
  if (!url) return null;

  // IMPORTANT: Do not modify signed URLs
  return url;
};

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

// ✅ Pincode validation helper
const validatePincode = (pincode) => {
  if (!pincode) return 'Pincode is required';
  if (!/^\d{6}$/.test(String(pincode))) return 'Pincode must be exactly 6 digits';
  return '';
};

// ✅ Build "Local Area, Place, District, State, Country - Pincode"
const buildLocationString = ({ localArea, place, district, state, country, pincode }) => {
  const parts = [localArea, place, district, state, country].filter(Boolean);
  if (parts.length === 0) return '';
  return `${parts.join(', ')}${pincode ? ` - ${pincode}` : ''}`;
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

// ================= SEARCHABLE LOCAL AREA DROPDOWN =================

const SearchableLocalAreaDropdown = ({ label, options, value, onChange, placeholder, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  const filteredOptions = options.filter(option =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    onChange(option.name);
    setSearchTerm('');
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-500 mb-1">{label}</label>
      <div className="relative">
        <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
        <input
          type="text"
          value={isOpen ? searchTerm : (value || '')}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            setSearchTerm('');
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={`${INPUT_CLASS} pl-9 pr-10 ${disabled ? 'text-gray-400 bg-gray-50 cursor-not-allowed' : ''}`}
        />
        <ChevronDown
          className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 cursor-pointer transition-transform ${isOpen ? 'rotate-180' : ''}`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        />
      </div>

      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.map((option, index) => (
            <div
              key={index}
              className="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors flex items-center gap-2"
              onClick={() => handleSelect(option)}
            >
              <Home className="h-4 w-4 text-gray-400" />
              <span className="text-gray-700">{option.name}</span>
            </div>
          ))}
        </div>
      )}

      {isOpen && filteredOptions.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
          No results found
        </div>
      )}
    </div>
  );
};

// ================= EDIT HOSPITAL MODAL =================

const EditHospitalModal = ({ isOpen, onClose, hospital, onSave, isSaving }) => {
  const [formData, setFormData] = useState({});
  const [editForm, setEditForm] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageFile, setImageFile] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [serverError, setServerError] = useState(null);

  const hospitalId = hospital?.id;

  // ✅ PINCODE API - only runs while modal is open and a full 6-digit pincode is entered
  const {
    currentData: pincodeData,
    isFetching: isPincodeLoading,
    isError: isPincodeError,
  } = useGetPincodeQuery(editForm.pincode, {
    skip: !isOpen || !/^\d{6}$/.test(String(editForm.pincode || '')),
  });

  const postOffices =
    pincodeData?.[0]?.Status === 'Success' ? pincodeData[0].PostOffice || [] : [];

  // Unique post office names for the Local Area dropdown
  const localAreaOptions = [
    ...new Map(postOffices.map((office) => [office.Name, { name: office.Name }])).values()
  ];

  // ✅ Load hospital into form when modal opens
  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!hospital || !isOpen) return;

      const imageKey =
        hospital.imageUrl ||
        hospital.profilePicture ||
        hospital.profileImage ||
        null;

      const address = hospital.address || {};
      const place = address.place || '';
      const district = address.district || '';
      const localArea = address.localArea || '';
      const state = address.state || '';
      const country = address.country || '';
      const pincode = address.pincode ? String(address.pincode) : '';

      const newFormData = {
        name: hospital.name || '',
        email: hospital.email || '',
        phone: hospital.phone || '',
        about: hospital.about || '',
        website: hospital.website || '',
        type: hospital.type || 'Hospital',
        profileImage: imageKey,
        imageUrl: imageKey,
        imageKey: imageKey,
        // Address fields
        place,
        district,
        localArea,
        state,
        country,
        pincode,
        location: buildLocationString({ localArea, place, district, state, country, pincode }),
      };

      if (!isMounted) return;
      setFormData(newFormData);
      setEditForm(newFormData);
      setImageFile(null);
      setImageError(false);
      setServerError(null);

      if (imageKey) {
        const fullUrl = await getFullImageUrl(imageKey);
        if (isMounted) setPreviewImage(fullUrl);
      } else {
        setPreviewImage(null);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [hospital, isOpen]);

  // ✅ Auto-fill state / district / country when pincode lookup returns
  useEffect(() => {
    if (!isOpen) return;
    // Pincode unchanged from saved value -> keep saved address as-is
    if (String(editForm.pincode || '') === String(formData.pincode || '')) return;

    if (postOffices.length > 0) {
      const { State, District } = postOffices[0];
      setEditForm(prev => ({
        ...prev,
        state: State,
        district: District,
        country: 'India',
        localArea: ''
      }));
    } else if (pincodeData && String(editForm.pincode || '').length === 6) {
      setEditForm(prev => ({ ...prev, state: '', district: '', localArea: '' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pincodeData]);

  const updateEditForm = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
    if (serverError) setServerError(null);
  };

  // ✅ Pincode change handler: digits only, max 6, resets / restores location fields
  const handlePincodeChange = (value) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 6);

    setEditForm(prev => {
      // Back to the saved pincode -> restore the saved address fields
      if (cleaned === String(formData.pincode || '')) {
        return {
          ...prev,
          pincode: cleaned,
          state: formData.state,
          district: formData.district,
          localArea: formData.localArea,
          country: formData.country
        };
      }
      // Different pincode -> clear until the lookup fills them in
      return { ...prev, pincode: cleaned, state: '', district: '', localArea: '' };
    });

    if (serverError) setServerError(null);
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
      setImageFile(uploaded.key);
      setEditForm(prev => ({
        ...prev,
        imageUrl: uploaded.key,
        profileImage: uploaded.key,
        imageKey: uploaded.key
      }));
      setImageError(false);
      setTimeout(() => setUploadProgress(0), 1000);
    } catch (err) {
      console.error('Upload error:', err);
      setUploadProgress(0);
      showErrorToast('Failed to upload image. Please try again.', 3000);
      if (formData.profileImage) {
        const url = await getFullImageUrl(formData.profileImage);
        setPreviewImage(url);
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
    setImageFile(null);
    setEditForm(prev => ({ ...prev, profileImage: null, imageUrl: null, imageKey: '' }));
    setImageError(false);
    showSuccessToast('Image removed', 2000);
  };

  // ✅ Save with full validation (phone + pincode + local area)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!editForm.name) {
      showErrorToast('Hospital name is required', 3000);
      return;
    }

    // ✅ Validate phone before sending to backend
    const phoneError = validatePhone(editForm.phone);
    if (phoneError) {
      setServerError(phoneError);
      showErrorToast(phoneError, 3000);
      return;
    }

    // ✅ Validate pincode before sending to backend
    const pincodeError = validatePincode(editForm.pincode);
    if (pincodeError) {
      setServerError(pincodeError);
      showErrorToast(pincodeError, 3000);
      return;
    }

    // ✅ If pincode was changed, it must resolve to a real location
    if (
      String(editForm.pincode) !== String(formData.pincode || '') &&
      (postOffices.length === 0 || !editForm.state || !editForm.district)
    ) {
      const msg = 'Invalid pincode or no location found';
      setServerError(msg);
      showErrorToast(msg, 3000);
      return;
    }

    // ✅ Local area must be selected from the pincode's post offices
    if (!editForm.localArea) {
      const msg = 'Please select your local area';
      setServerError(msg);
      showErrorToast(msg, 3000);
      return;
    }

    try {
      const updateData = {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        about: editForm.about,
        website: editForm.website,
        type: editForm.type,
        profilePicture: editForm.imageUrl || editForm.profileImage || editForm.imageKey || null,
        address: {
          place: editForm.place,
          district: editForm.district,
          localArea: editForm.localArea,
          state: editForm.state,
          country: editForm.country,
          pincode: editForm.pincode ? Number(editForm.pincode) : '',
        },
      };

      await onSave(updateData);
    } catch (error) {
      // Parent's handleUpdateHospital already shows the error toast
      setUploadProgress(0);
    }
  };

  // Reset state when modal closes
  const handleClose = () => {
    setImageFile(null);
    setPreviewImage(null);
    setImageError(false);
    setUploadProgress(0);
    setServerError(null);
    onClose();
  };

  if (!isOpen) return null;

  const isUploading = uploadProgress > 0 && uploadProgress < 100;

  const getProfileImage = () => {
    if (previewImage && !imageError) return previewImage;
    return FALLBACK_IMAGE;
  };

  const handleImageError = (e) => {
    e.target.onerror = null;
    setImageError(true);
    e.target.src = FALLBACK_IMAGE;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
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
                    src={getProfileImage()}
                    alt="Hospital Profile"
                    className="w-32 h-32 rounded-full object-cover ring-4 ring-gray-200"
                    onError={handleImageError}
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
                  {(previewImage || editForm.profileImage) && (
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

                {/* ✅ Phone with 10-digit restriction */}
                <ProfileField
                  label="Phone Number"
                  value={editForm.phone || ''}
                  isEditing={true}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    updateEditForm('phone', value);
                  }}
                  type="tel"
                  icon={Phone}
                  placeholder="10 digit phone number"
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

            {/* Location Information Section - ✅ PINCODE DRIVEN */}
            <div className="bg-gray-50 rounded-xl p-6">
              <SectionTitle icon={MapPin} title="Location Information" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pincode */}
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Pincode *</label>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={editForm.pincode || ''}
                      onChange={(e) => handlePincodeChange(e.target.value)}
                      className={INPUT_CLASS}
                      placeholder="Enter 6 digit pincode"
                      maxLength={6}
                    />
                  </div>
                </div>

                {/* Pincode lookup status */}
                <div className="flex items-end pb-2">
                  {isPincodeLoading && (
                    <div className="flex items-center gap-2 text-xs text-blue-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Finding your location...
                    </div>
                  )}
                  {!isPincodeLoading && isPincodeError && (
                    <p className="text-xs text-red-500">
                      Unable to fetch pincode details. Please try again.
                    </p>
                  )}
                  {!isPincodeLoading && !isPincodeError && postOffices.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      Location detected
                    </div>
                  )}
                  {!isPincodeLoading && !isPincodeError && pincodeData &&
                    String(editForm.pincode || '').length === 6 &&
                    postOffices.length === 0 && (
                      <p className="text-xs text-red-500">
                        Invalid pincode or no location found.
                      </p>
                    )}
                </div>

                {/* State / District / Country are auto-filled, read-only */}
                <ProfileField
                  label="State"
                  value={editForm.state}
                  isEditing={false}
                  icon={MapPin}
                />
                <ProfileField
                  label="District"
                  value={editForm.district}
                  isEditing={false}
                  icon={MapPin}
                />
                <ProfileField
                  label="Country"
                  value={editForm.country}
                  isEditing={false}
                  icon={MapPin}
                />

                {/* ✅ Local Area - dropdown of post offices */}
                <SearchableLocalAreaDropdown
                  label="Local Area *"
                  options={localAreaOptions}
                  value={editForm.localArea}
                  onChange={(name) => updateEditForm('localArea', name)}
                  placeholder={
                    localAreaOptions.length === 0
                      ? 'Enter pincode first'
                      : 'Select your local area'
                  }
                  disabled={localAreaOptions.length === 0}
                />

                {/* Street Address / Place */}
                <ProfileField
                  label="Street Address / Place"
                  value={editForm.place || ''}
                  isEditing={true}
                  onChange={(e) => updateEditForm('place', e.target.value)}
                  icon={Home}
                  placeholder="Place / Locality"
                />

                {/* Full Address preview */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Full Address</label>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">
                      {buildLocationString(editForm) || 'Not specified'}
                    </span>
                  </div>
                </div>
              </div>
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
                disabled={isSaving || isUploading || isPincodeLoading}
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

  // ✅ Fetch devices for this hospital
  const { data: devicesData, isLoading: devicesLoading } = useGetDevicesQuery(
    { hospitalId: id },
    { skip: !id }
  );

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
  const devicesList = devicesData?.data || [];

  const patientsCount = patientsList.length;
  const doctorsCount = doctorsList.length;
  const staffCount = staffList.length;
  const devicesCount = devicesList.length;

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

  const isLoading = isHospitalLoading || patientsLoading || doctorsLoading || staffLoading || bookingsLoading || ambulanceLoading || bloodBankLoading || unreadLoading || readLoading || devicesLoading;

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

      // ✅ 401 Unauthorized - Session expired
      if (error?.status === 401) {
        showErrorToast('Session expired. Please login again.', 3000);
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
        showErrorToast(message, 3000);
        throw error;
      }

      // ✅ Backend error.message
      if (backendError?.message) {
        showErrorToast(backendError.message, 3000);
        throw error;
      }

      // ✅ Direct API message
      if (error?.data?.message) {
        showErrorToast(error.data.message, 3000);
        throw error;
      }

      // ✅ RTK / fetch error
      if (error?.error) {
        showErrorToast(error.error, 3000);
        throw error;
      }

      // ✅ JavaScript error
      if (error?.message) {
        showErrorToast(error.message, 3000);
        throw error;
      }

      // ✅ Final fallback
      showErrorToast('Failed to update hospital. Please try again.', 3000);
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

  // Navigation to Session History
  const navigateToSessions = () => {
    navigate(`/super-admin/hospitals/${id}/sessions`, {
      state: {
        hospitalId: hospital.id,
        hospitalName: hospital.name
      }
    });
  };

  // ✅ Navigation to Attendance Records (legacy)
  const navigateToAttendanceRecords = () => {
    navigate(`/super-admin/hospital-attendance`, {
      state: {
        hospitalId: hospital.id,
        hospitalName: hospital.name
      }
    });
  };

  // ✅ NEW: Navigation to Attendance Devices (tabbed: Access Cards + Fingerprints)
  const navigateToAttendance = () => {
    navigate(`/super-admin/hospitals/${id}/attendance-devices`, {
      state: {
        hospitalId: id,
        hospitalName: hospital?.name,
      },
    });
  };

  // ✅ Navigation to Devices (physical attendance hardware)
  const navigateToDevices = () => {
    navigate(`/super-admin/hospitals/${id}/devices`, {
      state: {
        hospitalId: id,
        hospitalName: hospital?.name,
      },
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
    // ✅ Devices card (physical attendance hardware)
    {
      title: 'Devices',
      value: devicesCount,
      icon: Cpu,
      bgColor: 'bg-sky-50',
      iconBgColor: 'bg-sky-100',
      textColor: 'text-sky-600',
      borderColor: 'border-sky-200',
      hoverBg: 'hover:bg-sky-50/50',
      onClick: navigateToDevices,
      description: `${devicesCount} attendance device${devicesCount !== 1 ? 's' : ''}`,
      actionLabel: 'View Devices'
    },
    // ✅ NEW: Attendance Devices card (Access Cards + Fingerprints)
    {
      title: 'Attendance Devices',
      value: 'View',
      icon: IdCard,
      bgColor: 'bg-teal-50',
      iconBgColor: 'bg-teal-100',
      textColor: 'text-teal-600',
      borderColor: 'border-teal-200',
      hoverBg: 'hover:bg-teal-50/50',
      onClick: navigateToAttendance,
      description: 'Manage access cards & fingerprints',
      actionLabel: 'Manage Devices'
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
    // Session History Card
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
    },
    // ✅ Attendance Records Card (legacy, renamed for clarity)
    {
      title: 'Attendance Records',
      value: 'View',
      icon: ClipboardCheck,
      bgColor: 'bg-emerald-50',
      iconBgColor: 'bg-emerald-100',
      textColor: 'text-emerald-600',
      borderColor: 'border-emerald-200',
      hoverBg: 'hover:bg-emerald-50/50',
      onClick: navigateToAttendanceRecords,
      description: 'View attendance records',
      actionLabel: 'View Records'
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
                      <p className="text-3xl font-bold text-gray-900 mt-1">
                        {typeof stat.value === 'number'
                          ? stat.value.toLocaleString()
                          : stat.value}
                      </p>
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