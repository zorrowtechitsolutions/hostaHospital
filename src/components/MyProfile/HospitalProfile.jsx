import React, { useState, useEffect, useRef } from 'react';
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
  X,
  Home,
  ChevronDown
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import {
  useGetHospitalByIdQuery,
  useUpdateHospitalMutation
} from '../../../app/service/hospitalApi';
// ✅ PINCODE API
import { useGetPincodeQuery } from '../../../app/service/pincodeApi';
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

// ✅ FIXED: async, awaits getS3ImageUrl, handles object keys, NEVER modifies signed URLs
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

// ==================== PROFILE FIELD COMPONENTS ====================

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

// ✅ Searchable dropdown for Local Area (post offices from pincode lookup)
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
    place: '',
    district: '',
    localArea: '',
    state: '',
    country: '',
    pincode: '',
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

  // ✅ PINCODE API - only runs while editing and when a full 6-digit pincode is entered
  const {
    currentData: pincodeData,
    isFetching: isPincodeLoading,
    isError: isPincodeError,
  } = useGetPincodeQuery(editForm.pincode, {
    skip: !isEditing || !/^\d{6}$/.test(String(editForm.pincode || '')),
  });

  const postOffices =
    pincodeData?.[0]?.Status === 'Success' ? pincodeData[0].PostOffice || [] : [];

  // Unique post office names for the Local Area dropdown
  const localAreaOptions = [
    ...new Map(postOffices.map((office) => [office.Name, { name: office.Name }])).values()
  ];

  // ✅ Auto-fill state / district / country when pincode lookup returns
  useEffect(() => {
    if (!isEditing) return;
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

  // ==================== SOCKET EVENT HANDLERS ====================

  const handleHospitalUpdated = (data) => {
    if (data && data.id === hospitalId) {
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
  };

  const handleHospitalDeleted = (data) => {
    if (data && data.id === hospitalId) {
      setTimeout(() => {
        logout();
        navigate('/sign-in');
      }, 3000);
    }
  };

  const handleHospitalBlacklisted = (data) => {
    if (data && data.id === hospitalId) {
      setTimeout(() => {
        logout();
        navigate('/sign-in');
      }, 3000);
    }
  };

  const handleHospitalRecovered = (data) => {
    if (data && data.id === hospitalId) {
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

  // ✅ FIXED: await async getFullImageUrl inside effect
  useEffect(() => {
    let isMounted = true;

    const loadHospitalData = async () => {
      if (!hospitalData) return;

      const hospital = hospitalData.data || hospitalData;

      const imageKey =
        hospital?.profilePicture ||
        hospital?.imageUrl ||
        hospital?.image ||
        null;

      const address = hospital?.address || {};
      const place = address?.place || '';
      const district = address?.district || '';
      const localArea = address?.localArea || '';
      const state = address?.state || '';
      const country = address?.country || '';
      const pincode = address?.pincode ? String(address.pincode) : '';

      const locationString = buildLocationString({
        localArea, place, district, state, country, pincode
      });

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
        place: place,
        district: district,
        localArea: localArea,
        state: state,
        country: country,
        pincode: pincode,
        occupation: hospital.type || '',
        education: 'Hospital',
        gender: hospital.gender || '',
        dateOfBirth: hospital.dateOfBirth || ''
      };

      if (!isMounted) return;
      setFormData(newFormData);
      setEditForm(newFormData);

      if (imageKey) {
        const fullUrl = await getFullImageUrl(imageKey);
        if (isMounted) {
          setPreviewImage(fullUrl);
          setImageError(false);
        }
      } else {
        setPreviewImage(null);
      }
    };

    loadHospitalData();

    return () => {
      isMounted = false;
    };
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

      // ✅ FIXED: await async getFullImageUrl
      if (formData.profileImage) {
        const imageUrl = await getFullImageUrl(formData.profileImage);
        setPreviewImage(imageUrl);
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
  // ✅ FIXED: Phone + Pincode + Local Area validation + robust error handling
  // ============================================================
  const handleSave = async () => {
    // ✅ Validate phone before sending to backend
    const phoneError = validatePhone(editForm.phoneNumber);

    if (phoneError) {
      setServerError(phoneError);
      showErrorToast(phoneError);
      return;
    }

    // ✅ Validate pincode before sending to backend
    const pincodeError = validatePincode(editForm.pincode);

    if (pincodeError) {
      setServerError(pincodeError);
      showErrorToast(pincodeError);
      return;
    }

    // ✅ If pincode was changed, it must resolve to a real location
    if (
      String(editForm.pincode) !== String(formData.pincode || '') &&
      (postOffices.length === 0 || !editForm.state || !editForm.district)
    ) {
      const msg = 'Invalid pincode or no location found';
      setServerError(msg);
      showErrorToast(msg);
      return;
    }

    // ✅ Local area must be selected from the pincode's post offices
    if (!editForm.localArea) {
      const msg = 'Please select your local area';
      setServerError(msg);
      showErrorToast(msg);
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
        address: {
          place: editForm.place,
          district: editForm.district,
          localArea: editForm.localArea,
          state: editForm.state,
          country: editForm.country,
          pincode: editForm.pincode ? Number(editForm.pincode) : ''
        }
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

      // ✅ FIXED: await async getFullImageUrl
      const newImageUrl = newProfilePicture
        ? await getFullImageUrl(newProfilePicture)
        : null;

      const updatedFormData = {
        ...editForm,
        location: buildLocationString(editForm),
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
        showErrorToast(message);
        return;
      }

      // ✅ Backend error.message
      if (backendError?.message) {
        setServerError(backendError.message);
        showErrorToast(backendError.message);
        return;
      }

      // ✅ Direct API message
      if (error?.data?.message) {
        setServerError(error.data.message);
        showErrorToast(error.data.message);
        return;
      }

      // ✅ RTK / fetch error
      if (error?.error) {
        setServerError(error.error);
        showErrorToast(error.error);
        return;
      }

      // ✅ JavaScript error
      if (error?.message) {
        setServerError(error.message);
        showErrorToast(error.message);
        return;
      }

      // ✅ Final fallback
      setServerError('Failed to update profile. Please try again.');
      showErrorToast('Failed to update profile. Please try again.');

    } finally {
      setIsSaving(false);
    }
  };

  // ✅ FIXED: use .then for the async helper (handleCancel is not async)
  const handleCancel = () => {
    setEditForm({ ...formData });

    if (formData.profileImage) {
      getFullImageUrl(formData.profileImage).then(setPreviewImage);
    } else {
      setPreviewImage(null);
    }

    setUploadProgress(0);
    setIsEditing(false);
    setImageError(false);
    setServerError(null);
    showWarningToast('Changes discarded');
  };

  // ✅ FIXED: synchronous — only returns state or fallback, no async call here
  const getProfileImage = () => {
    if (previewImage && !imageError) {
      return previewImage;
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
                      disabled={isSaving || isPincodeLoading}
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

            {/* Location Information - ✅ PINCODE DRIVEN */}
            <div className={CARD_CLASS}>
              <SectionTitle icon={MapPin} title="Location Information" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ProfileField
                  label="Pincode"
                  value={isEditing ? editForm.pincode : formData.pincode}
                  isEditing={isEditing}
                  onChange={(e) => handlePincodeChange(e.target.value)}
                  icon={MapPin}
                  placeholder="Enter 6 digit pincode"
                />

                {/* Pincode lookup status */}
                {isEditing && (
                  <div className="flex items-end pb-2">
                    {isPincodeLoading && (
                      <div className="flex items-center gap-2 text-xs text-blue-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
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
                )}

                {/* State / District / Country are auto-filled, read-only */}
                <ProfileField
                  label="State"
                  value={isEditing ? editForm.state : formData.state}
                  isEditing={false}
                  icon={MapPin}
                />
                <ProfileField
                  label="District"
                  value={isEditing ? editForm.district : formData.district}
                  isEditing={false}
                  icon={MapPin}
                />
                <ProfileField
                  label="Country"
                  value={isEditing ? editForm.country : formData.country}
                  isEditing={false}
                  icon={MapPin}
                />

                {/* ✅ Local Area - dropdown of post offices while editing */}
                {isEditing ? (
                  <SearchableLocalAreaDropdown
                    label="Local Area"
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
                ) : (
                  <ProfileField
                    label="Local Area"
                    value={formData.localArea}
                    isEditing={false}
                    icon={Home}
                  />
                )}
                <ProfileField
                  label="Street Address / Place"
                  value={isEditing ? editForm.place : formData.place}
                  isEditing={isEditing}
                  onChange={(e) => updateEditForm('place', e.target.value)}
                  icon={Home}
                  placeholder="Place / Locality"
                />

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Full Address</label>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">
                      {formData.location || 'Not specified'}
                    </span>
                  </div>
                </div>
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

export default HospitalProfile;