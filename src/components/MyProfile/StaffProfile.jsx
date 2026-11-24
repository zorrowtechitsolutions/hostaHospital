// src/components/MyProfile/StaffProfile.jsx - COMPLETE WITH PHONE + PINCODE + LOCAL AREA
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail, Phone, Edit, Save, X, Upload, CheckCircle,
  User, Briefcase, Award, Building, Info, Calendar, Users, IdCard,
  MapPin, CalendarDays, Clock, GraduationCap, Home, AlertCircle, ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useGetStaffByIdQuery, useUpdateStaffMutation } from '../../../app/service/staffApi';
// ✅ PINCODE API
import { useGetPincodeQuery } from '../../../app/service/pincodeApi';
import { uploadToS3, getS3ImageUrl } from '../../../app/service/S3';
import { formatDate } from "../../utils/dateFormatter";
// ✅ IMPORT TOAST FUNCTIONS
import { showSuccessToast, showErrorToast, showWarningToast } from '../ui/Toast';

// ==================== CONSTANTS ====================
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const FALLBACK_IMAGE = 'https://ui-avatars.com/api/?name=Staff&background=1C62A0&color=fff&length=2';

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
  <div className="min-h-screen bg-gray-50 p-4">
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

const StaffProfile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const staffId = user?.staffId || user?.id;

  const { data: staffResponse, isLoading, error: fetchError, refetch } = useGetStaffByIdQuery(staffId, {
    skip: !staffId,
  });

  const [updateStaff, { isLoading: isUpdating }] = useUpdateStaffMutation();

  const [formData, setFormData] = useState({
    id: '',
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
    staffId: '',
    gender: '',
    dob: '',
    jobType: '',
    place: '',
    district: '',
    localArea: '',
    state: '',
    country: '',
    pincode: '',
    addressString: '',
    knowLanguages: [],
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

  // ✅ FIXED: await async getFullImageUrl inside effect
  useEffect(() => {
    let isMounted = true;

    const loadStaffData = async () => {
      if (!staffResponse) return;

      const staff = staffResponse.data;
      if (!staff) return;

      const imageKey =
        staff?.profilePicture ||
        staff?.imageUrl ||
        staff?.image ||
        null;

      const address = staff?.address || {};
      const place = address?.place || '';
      const district = address?.district || '';
      const localArea = address?.localArea || '';
      const state = address?.state || '';
      const country = address?.country || '';
      const pincode = address?.pincode ? String(address.pincode) : '';

      const addressParts = [localArea, place, district, state, country].filter(Boolean);
      const addressString = addressParts.length > 0 ?
        `${addressParts.join(', ')}${pincode ? ` - ${pincode}` : ''}` :
        '';

      const joiningDate = staff?.joiningDate ?
        staff.joiningDate.split('T')[0] :
        '';

      const dob = staff?.dob ?
        staff.dob.split('T')[0] :
        '';

      const staffInfo = {
        id: staff?.id || '',
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
        joiningDate: joiningDate,
        staffId: staff?.staffId || staff?.id || '',
        gender: staff?.gender || '',
        dob: dob,
        jobType: staff?.jobType || '',
        place: place,
        district: district,
        localArea: localArea,
        state: state,
        country: country,
        pincode: pincode,
        addressString: addressString,
        knowLanguages: staff?.knowLanguages || [],
        roleId: staff?.roleId || '',
        isActive: staff?.isActive ?? true,
        createdAt: staff?.createdAt || '',
        updatedAt: staff?.updatedAt || ''
      };

      if (!isMounted) return;
      setFormData(staffInfo);
      setEditForm(staffInfo);

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

    loadStaffData();

    return () => {
      isMounted = false;
    };
  }, [staffResponse]);

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
      const numericId = formData.id || formData.staffNumericId || parseInt(formData.staffId?.replace(/\D/g, '') || '0');
      const uploaded = await uploadToS3(
        file,
        formData.imageKey || null,
        numericId,
        'staff'
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
    const phoneError = validatePhone(editForm.phone);

    if (phoneError) {
      setServerError(phoneError);
      showErrorToast(phoneError); // ✅ Shows toast only
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
      const staffIdValue = formData.id || formData.staffNumericId || formData.staffId;

      const updateData = {
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
        gender: editForm.gender,
        dob: editForm.dob,
        jobType: editForm.jobType,
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

      const response = await updateStaff({
        id: staffIdValue,
        data: updateData
      }).unwrap();

      const updatedStaff = response.data;

      let newProfilePicture = updatedStaff?.profilePicture ||
                              updatedStaff?.profileImage ||
                              updatedStaff?.imageUrl ||
                              updateData.profilePicture;

      // ✅ FIXED: await async getFullImageUrl
      const newImageUrl = newProfilePicture
        ? await getFullImageUrl(newProfilePicture)
        : null;

      // Rebuild the display address string from the saved values
      const addressParts = [
        editForm.localArea,
        editForm.place,
        editForm.district,
        editForm.state,
        editForm.country
      ].filter(Boolean);
      const newAddressString = addressParts.length > 0
        ? `${addressParts.join(', ')}${editForm.pincode ? ` - ${editForm.pincode}` : ''}`
        : '';

      const updatedFormData = {
        ...editForm,
        profileImage: newProfilePicture,
        imageUrl: newProfilePicture,
        imageKey: newProfilePicture,
        addressString: newAddressString,
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
        staffId: staffIdValue,
        name: updateData.name,
        email: updateData.email,
        phone: updateData.phone,
        profilePicture: newProfilePicture
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      const authData = JSON.parse(localStorage.getItem('authData') || '{}');
      localStorage.setItem('authData', JSON.stringify({
        ...authData,
        name: updateData.name,
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

  const staff = staffResponse?.data || {};
  const address = staff?.address || {};

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (!staffResponse && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="bg-yellow-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto">
            <AlertCircle className="h-8 w-8 text-yellow-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mt-4">Staff Not Found</h2>
          <p className="text-gray-600 mt-2">No staff found with ID: {staffId}</p>
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
                  {staff?.name || formData.name || 'Staff'}
                </h2>
                <p className="text-gray-500 text-sm">
                  {staff?.designation || formData.designation || 'No designation'}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <div className="flex items-center text-sm text-green-600">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    {staff?.isActive ? 'Active Staff' : 'Inactive'}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <IdCard className="w-4 h-4 mr-1" />
                    ID: {staff?.staffId || formData.staffId || 'N/A'}
                  </div>
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
                      disabled={isSaving || isUpdating || isPincodeLoading}
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
                  label="Full Name"
                  value={isEditing ? editForm.name : formData.name}
                  isEditing={isEditing}
                  onChange={(e) => updateEditForm('name', e.target.value)}
                  icon={User}
                  placeholder="Full name"
                />
                <ProfileField
                  label="Staff ID"
                  value={isEditing ? editForm.staffId : formData.staffId}
                  isEditing={isEditing}
                  onChange={(e) => updateEditForm('staffId', e.target.value)}
                  icon={IdCard}
                  placeholder="Staff ID"
                />
                <ProfileField
                  label="Email"
                  value={isEditing ? editForm.email : formData.email}
                  isEditing={isEditing}
                  onChange={(e) => updateEditForm('email', e.target.value)}
                  type="email"
                  icon={Mail}
                  placeholder="Email"
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
                  placeholder="Gender"
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
              <SectionTitle icon={Briefcase} title="Professional Information" />
              <div className="grid md:grid-cols-2 gap-4">
                <ProfileField
                  label="Designation"
                  value={isEditing ? editForm.designation : formData.designation}
                  isEditing={isEditing}
                  onChange={(e) => updateEditForm('designation', e.target.value)}
                  icon={Briefcase}
                  placeholder="Designation"
                />
                <ProfileField
                  label="Staff Type"
                  value={isEditing ? editForm.staffType : formData.staffType}
                  isEditing={isEditing}
                  onChange={(e) => updateEditForm('staffType', e.target.value)}
                  icon={Users}
                  placeholder="Staff type"
                />
                <ProfileField
                  label="Qualification"
                  value={isEditing ? editForm.qualification : formData.qualification}
                  isEditing={isEditing}
                  onChange={(e) => updateEditForm('qualification', e.target.value)}
                  icon={GraduationCap}
                  placeholder="Qualification"
                />
                <ProfileField
                  label="Hospital/Clinic"
                  value={isEditing ? editForm.hospitalName : formData.hospitalName}
                  isEditing={isEditing}
                  onChange={(e) => updateEditForm('hospitalName', e.target.value)}
                  icon={Building}
                  placeholder="Hospital"
                />
                <ProfileField
                  label="Job Type"
                  value={isEditing ? editForm.jobType : formData.jobType}
                  isEditing={isEditing}
                  onChange={(e) => updateEditForm('jobType', e.target.value)}
                  icon={Clock}
                  placeholder="Job type"
                />
                <ProfileField
                  label="Joining Date"
                  value={isEditing ? editForm.joiningDate : (formData.joiningDate ? new Date(formData.joiningDate).toLocaleDateString() : 'Not specified')}
                  isEditing={isEditing}
                  onChange={(e) => updateEditForm('joiningDate', e.target.value)}
                  type="date"
                  icon={CalendarDays}
                />
              </div>
            </div>

            {/* Address Information - ✅ PINCODE DRIVEN */}
            <div className={CARD_CLASS}>
              <SectionTitle icon={MapPin} title="Address Information" />
              <div className="grid md:grid-cols-2 gap-4">
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

export default StaffProfile;