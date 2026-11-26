// src/components/super-admin/hospitals/staff/EditStaff.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Upload, X, Shield, ArrowLeft, Lock, Eye, EyeOff, Power,
  User, Mail, Phone, Calendar, MapPin, AlertCircle,
  Briefcase, GraduationCap, ChevronDown, Users, Home, Clock,
  CreditCard, CheckCircle
} from 'lucide-react';
import { Button, Input, Alert } from '../../../ui';
import CustomSelect from '../../../ui/CustomSelect';
import DatePicker from '../../../ui/DatePicker';
import {
  showUpdateToast, showSuccessToast,
  showErrorToast, showWarningToast
} from '../../../ui/Toast';

import {
  useGetStaffByIdQuery, useUpdateStaffMutation, useChangeStaffPasswordMutation
} from '../../../../../app/service/staffApi';
import { useAssignPermissionsMutation } from '../../../../../app/service/rolePermission';
import { useGetRolesQuery } from '../../../../../app/service/role';
// ✅ Pincode API integration (same as AddStaff model)
import { useGetPincodeQuery } from '../../../../../app/service/pincodeApi';
import { getAuthUser } from '../../../../utils/auth';
import {
  uploadToS3,
  getS3ImageUrl,
} from '../../../../../app/service/S3';

// ✅ Options for the Gender CustomSelect — capitalized values
const GENDER_SELECT_OPTIONS = ['male', 'female', 'other'].map(g => ({
  value: g.charAt(0).toUpperCase() + g.slice(1),
  label: g.charAt(0).toUpperCase() + g.slice(1),
}));

// Styling override so CustomSelect matches the inputs
const SELECT_FORM_CLASS =
  "[&>button]:border-gray-300 [&>button]:rounded-lg [&>button]:focus:ring-2 [&>button]:focus:ring-[#1C62A0] [&>button]:focus:border-transparent";

// Helpers
const getHospitalId = () => {
  const stored = localStorage.getItem('hospitalId');
  if (stored) return stored;
  const authUser = getAuthUser();
  return authUser?.hospitalId || null;
};

const getAuthId = () => {
  const authUser = getAuthUser();
  return authUser?.id || authUser?.userId || authUser?._id || null;
};

// ✅ place is saved as "line 1, line 2, local area"
const buildPlace = (...parts) =>
  parts
    .map(part => part?.trim())
    .filter(Boolean)
    .join(', ');

const EMPTY_FORM = {
  profileImage: null, imageUrl: null, imageKey: null,
  name: '', gender: '', dob: '', phone: '', email: '',
  designation: '', roleId: '', joiningDate: '', staffType: '',
  jobType: '', knowLanguages: [], qualification: '',
  // ✅ Pincode-based address
  countryName: 'India', stateName: '', district: '', localArea: '',
  pincode: '',
  addressLine1: '', addressLine2: '',
  password: '', confirmPassword: '', isActive: true,
  shiftStartTime: '', shiftEndTime: ''
};

// Status Toggle Component
const StatusToggle = React.memo(({ status, onToggle, disabled }) => {
  const isActive = status;
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h3 className="text-md font-semibold text-gray-900 flex items-center gap-2">
          <Power className="h-5 w-5 text-blue-600" />
          Staff Status
        </h3>
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">{isActive ? 'Active' : 'Inactive'}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {isActive
                ? 'Staff is currently active'
                : 'Staff is inactive and will not appear in search results'}
            </p>
          </div>
          <button
            type="button"
            onClick={onToggle}
            disabled={disabled}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              isActive ? 'bg-green-500' : 'bg-gray-300'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 shadow-md ${
              isActive ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </div>
    </div>
  );
});

// Password Input
const PasswordInput = ({
  label, name, value, onChange, onBlur, error, touched,
  showPassword, setShowPassword, placeholder, icon: Icon, required
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />}
      <input
        type={showPassword ? "text" : "password"}
        name={name} value={value} onChange={onChange} onBlur={onBlur}
        className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C62A0] ${
          error && touched ? 'border-red-500' : 'border-gray-300'
        }`}
        placeholder={placeholder}
      />
      <button type="button" onClick={() => setShowPassword(prev => !prev)}
        className="absolute right-3 top-1/2 transform -translate-y-1/2">
        {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
      </button>
    </div>
    {error && touched && <p className="mt-1 text-sm text-red-500">{error}</p>}
    {name === 'password' && value && !error && (
      <p className="text-xs text-green-600 mt-1">✓ Password is strong</p>
    )}
    {name === 'password' && value && error && (
      <p className="text-xs text-red-600 mt-1">{error}</p>
    )}
    {name === 'password' && (
      <p className="text-xs text-gray-400 mt-1">
        Password must contain: 8+ chars, uppercase, lowercase, number & special character
      </p>
    )}
  </div>
);

// ✅ Shift Time Input
const ShiftTimeInput = ({
  shiftStartTime, shiftEndTime, onChange, errors, touched, onBlur
}) => {
  const getDurationDisplay = () => {
    if (!shiftStartTime || !shiftEndTime) return null;
    const [startH, startM] = shiftStartTime.split(':').map(Number);
    const [endH, endM] = shiftEndTime.split(':').map(Number);
    let startMinutes = startH * 60 + startM;
    let endMinutes = endH * 60 + endM;
    if (endMinutes <= startMinutes) endMinutes += 24 * 60;
    const durationMinutes = endMinutes - startMinutes;
    const hours = Math.floor(durationMinutes / 60);
    const mins = durationMinutes % 60;
    return `${hours}h ${mins}m`;
  };

  const duration = getDurationDisplay();
  const isOvernight = shiftStartTime && shiftEndTime && shiftEndTime <= shiftStartTime;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Shift Start Time <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="time"
            name="shiftStartTime"
            value={shiftStartTime}
            onChange={onChange}
            onBlur={onBlur}
            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C62A0] ${
              errors.shiftStartTime && touched.shiftStartTime ? 'border-red-500' : 'border-gray-300'
            }`}
          />
        </div>
        {errors.shiftStartTime && touched.shiftStartTime && (
          <p className="mt-1 text-xs text-red-500">{errors.shiftStartTime}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Shift End Time <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="time"
            name="shiftEndTime"
            value={shiftEndTime}
            onChange={onChange}
            onBlur={onBlur}
            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C62A0] ${
              errors.shiftEndTime && touched.shiftEndTime ? 'border-red-500' : 'border-gray-300'
            }`}
          />
        </div>
        {errors.shiftEndTime && touched.shiftEndTime && (
          <p className="mt-1 text-xs text-red-500">{errors.shiftEndTime}</p>
        )}
      </div>

      {duration && (
        <div className="md:col-span-2 flex items-center gap-2 flex-wrap -mt-2">
          <span className="text-xs text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
            ⏱ Duration: {duration}
          </span>
          {isOvernight && (
            <span className="text-xs text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
              🌙 Overnight Shift
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// ✅ Searchable dropdown for local area (post offices)
const SearchableCityDropdown = ({
  label,
  options,
  value,
  onChange,
  placeholder,
  disabled = false,
  required = false,
  error = '',
  touched = false
}) => {
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

  const showError = touched && error;

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
        <input
          type="text"
          value={isOpen ? searchTerm : value}
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
          className={`w-full pl-10 pr-10 py-2 rounded-lg border ${
            showError ? 'border-red-500' : 'border-gray-300'
          } focus:outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent ${
            disabled ? 'text-gray-400 bg-gray-50 cursor-not-allowed' : ''
          }`}
        />
        <ChevronDown
          className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 cursor-pointer transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        />
      </div>

      {isOpen && filteredOptions.length > 0 && (
        <div
          className="absolute z-[9999] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto overscroll-contain"
          onWheel={(e) => e.stopPropagation()}
        >
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

      {showError && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
};

// Options
const languageOptions = [
  { value: 'English', label: 'English' },
  { value: 'Spanish', label: 'Spanish' },
  { value: 'French', label: 'French' },
  { value: 'German', label: 'German' },
  { value: 'Chinese', label: 'Chinese' },
  { value: 'Japanese', label: 'Japanese' },
  { value: 'Arabic', label: 'Arabic' },
  { value: 'Hindi', label: 'Hindi' },
  { value: 'Bengali', label: 'Bengali' },
  { value: 'Portuguese', label: 'Portuguese' },
  { value: 'Malayalam', label: 'Malayalam' },
  { value: 'Tamil', label: 'Tamil' },
  { value: 'Telugu', label: 'Telugu' },
  { value: 'Kannada', label: 'Kannada' }
];

const designations = ['Compounder', 'Nurse', 'Purchase Officer', 'Supervisor', 'Receptionist', 'Lab Assistant', 'Pharmacist', 'Doctor', 'Technician', 'Admin'];
const jobTypes = ['Day Shift', 'Night Shift', 'Remote', 'Hybrid'];
const staffTypes = ['Permanent', 'Contract', 'Temporary', 'Intern'];

const SHIFT_TYPES_WITH_TIME = ['Day Shift', 'Night Shift'];

const EditStaff = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Resolve: route param → location state → auth/localStorage
  const { id: paramId } = useParams();
  const staffId = paramId ? paramId.replace(/[^0-9]/g, '') : '';

  const hospitalId = location.state?.hospitalId || getHospitalId();
  const authUser = getAuthUser();
  const authId = getAuthId();
  const hospitalName = authUser?.name || '';

  const [assignPermissions, { isLoading: isAssigning }] = useAssignPermissionsMutation();

  const { data: rolesData, isLoading: rolesLoading } = useGetRolesQuery(
    { hospitalId: hospitalId || undefined, limit: 100 },
    { skip: !hospitalId }
  );

  const rolesList = [
    ...(rolesData?.admin || []).filter(role => role.id === 2),
    ...(rolesData?.data || []).filter(role => role.hospitalId === Number(hospitalId))
  ];

  // ✅ Options for the Assign Role CustomSelect — string values for strict ===
  const roleOptions = rolesList.map(role => ({
    value: String(role.id),
    label: role.name || role.roleName || String(role.id),
  }));

  const [formData, setFormData] = useState(EMPTY_FORM);

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewImage, setPreviewImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formInitialized, setFormInitialized] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [imageRefreshKey, setImageRefreshKey] = useState(Date.now());

  // Saved place string, kept until the pincode lookup runs once so the
  // local area can be restored without being wiped.
  // splitStreet = true when the saved place was built as "line 1, line 2, local area"
  // and address lines were not stored separately.
  const pendingPlaceRef = useRef({ place: '', splitStreet: false });

  const { data: staffResponse, isLoading, error, refetch } = useGetStaffByIdQuery(staffId, { skip: !staffId });
  const [updateStaff, { isLoading: isUpdateLoading }] = useUpdateStaffMutation();
  const [changeStaffPassword, { isLoading: isPasswordChanging }] = useChangeStaffPasswordMutation();

  const staff = staffResponse?.data?.staff || staffResponse?.staff || staffResponse?.data || staffResponse;

  const requiresShiftTime = SHIFT_TYPES_WITH_TIME.includes(formData.jobType);

  // ✅ Pincode API integration
  const {
    currentData: pincodeData,
    isFetching: isPincodeLoading,
    isError: isPincodeError,
  } = useGetPincodeQuery(formData.pincode, {
    skip: !/^\d{6}$/.test(formData.pincode),
  });

  const postOffices =
    pincodeData?.[0]?.Status === 'Success'
      ? pincodeData[0].PostOffice || []
      : [];

  // ✅ Automatically populate state and district (and restore the saved local area once)
  useEffect(() => {
    if (postOffices.length > 0) {
      const firstOffice = postOffices[0];
      const names = postOffices.map(o => o.Name);
      const pending = pendingPlaceRef.current;
      pendingPlaceRef.current = { place: '', splitStreet: false };

      setFormData(prev => {
        let line1 = prev.addressLine1;

        // keep the current local area if it is still valid for this pincode
        let local =
          names.find(n => n.trim().toLowerCase() === (prev.localArea || '').trim().toLowerCase()) || '';

        // otherwise try to restore it from the saved place string
        if (!local && pending.place) {
          const parts = pending.place.split(',').map(p => p.trim()).filter(Boolean);
          const last = parts[parts.length - 1];
          const match = last
            ? names.find(n => n.trim().toLowerCase() === last.toLowerCase())
            : null;
          if (match) {
            local = match;
            if (pending.splitStreet) line1 = parts.slice(0, -1).join(', ');
          }
        }

        return {
          ...prev,
          stateName: firstOffice.State,
          district: firstOffice.District,
          localArea: local,
          addressLine1: line1
        };
      });
    } else if (formData.pincode.length === 6 && pincodeData) {
      pendingPlaceRef.current = { place: '', splitStreet: false };
      setFormData(prev => ({
        ...prev,
        stateName: '',
        district: '',
        localArea: ''
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pincodeData]);

  const formatStaffId = (id) => {
    if (!id) return '#SF0000';
    let numericId;
    if (typeof id === 'string') {
      const match = id.match(/\d+/);
      numericId = match ? parseInt(match[0]) : parseInt(id) || 0;
    } else {
      numericId = parseInt(id) || 0;
    }
    return `#SF${String(numericId).padStart(4, '0')}`;
  };

  const getRoleNameById = (roleId) => {
    const role = rolesList.find(r => String(r.id) === String(roleId));
    return role?.name || role?.roleName || '';
  };

  const getRoleBadgeColor = (roleId) => {
    const roleName = getRoleNameById(roleId)?.toLowerCase();
    if (roleName === 'admin') return 'bg-purple-100 text-purple-800';
    if (roleName === 'doctor') return 'bg-blue-100 text-blue-800';
    if (roleName === 'staff') return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-700';
  };

  // Reset on ID change
  useEffect(() => {
    setFormInitialized(false);
    pendingPlaceRef.current = { place: '', splitStreet: false };
    setFormData(EMPTY_FORM);
    setPreviewImage(null);
    setImageLoaded(false);
    setImageRefreshKey(Date.now());
    setErrors({});
    if (staffId) refetch();
    return () => setFormInitialized(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffId]);

  // Load data
  useEffect(() => {
    if (staff && staff.id && !formInitialized) {
      const imageKey = staff?.imageUrl || staff?.profileImage || staff?.image || staff?.imageKey || null;
      const address = staff?.address || {};

      // Address lines: use stored lines if present; otherwise the whole saved
      // place goes into line 1 and the local area is split off after the pincode lookup.
      const storedLine1 = address.addressLine1 || address.line1 || address.street || '';
      const storedLine2 = address.addressLine2 || address.line2 || '';
      const hasStoredLines = !!(storedLine1 || storedLine2);
      const savedPlace = address.place || '';

      pendingPlaceRef.current = {
        place: savedPlace,
        splitStreet: !hasStoredLines
      };

      const newFormData = {
        profileImage: imageKey,
        imageUrl: imageKey,
        imageKey: imageKey,
        name: staff.name || "",
        gender: staff.gender ? staff.gender.charAt(0).toUpperCase() + staff.gender.slice(1) : "",
        dob: staff.dob ? new Date(staff.dob).toISOString().split('T')[0] : "",
        phone: staff.phone || staff.mobile || "",
        email: staff.email || "",
        designation: staff.designation || "",
        roleId: staff.roleId || "",
        joiningDate: staff.joiningDate ? new Date(staff.joiningDate).toISOString().split('T')[0] : "",
        staffType: staff.staffType || "",
        jobType: staff.jobType || "",
        knowLanguages: staff.knowLanguages || [],
        qualification: staff.qualification || "",
        countryName: 'India',
        stateName: address.state || '',
        district: address.district || '',
        localArea: '',
        pincode: address.pincode ? String(address.pincode) : '',
        addressLine1: hasStoredLines ? storedLine1 : savedPlace,
        addressLine2: storedLine2,
        password: '',
        confirmPassword: '',
        isActive: staff.isActive ?? true,
        shiftStartTime: staff.shiftStartTime || "",
        shiftEndTime: staff.shiftEndTime || ""
      };

      setFormData(newFormData);

      if (imageKey) {
        getS3ImageUrl(imageKey).then((viewUrl) => {
          setPreviewImage(viewUrl);
          setImageLoaded(false);
          setImageRefreshKey(Date.now());
        });
      } else {
        setPreviewImage(null);
      }

      setFormInitialized(true);
    }
  }, [staff, formInitialized]);

  // ✅ Handle pincode change
  const handlePincodeChange = (value) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 6);

    // user is typing a new pincode → forget the saved local area
    pendingPlaceRef.current = { place: '', splitStreet: false };

    setFormData(prev => ({
      ...prev,
      pincode: cleaned,
      stateName: '',
      district: '',
      localArea: ''
    }));

    if (errors.pincode) setErrors(prev => ({ ...prev, pincode: '' }));
  };

  // ✅ Handle local area change
  const handleLocalAreaChange = (name) => {
    setFormData(prev => ({ ...prev, localArea: name }));
    setTouched(prev => ({ ...prev, localArea: true }));
    if (errors.localArea) setErrors(prev => ({ ...prev, localArea: '' }));
  };

  // Image upload
  const handleImageUpload = async (file) => {
    if (!file) return;
    const imageError = validateImage(file);
    if (imageError) {
      setErrors(prev => ({ ...prev, profileImage: imageError }));
      showWarningToast(imageError, 3000);
      return;
    }
    setErrors(prev => ({ ...prev, profileImage: '' }));
    setUploadProgress(10);
    const reader = new FileReader();
    reader.onloadend = () => setPreviewImage(reader.result);
    reader.readAsDataURL(file);
    try {
      setUploadProgress(30);
      const uploaded = await uploadToS3(file, formData.imageKey || null, Number(staffId), "staff");

      setUploadProgress(80);

      setFormData(prev => ({
        ...prev,
        imageUrl: uploaded.key,
        profileImage: uploaded.key,
        imageKey: uploaded.key
      }));

      const viewUrl = await getS3ImageUrl(uploaded.key);

      if (!viewUrl) {
        throw new Error("Image uploaded, but could not retrieve its view URL.");
      }

      setPreviewImage(viewUrl);
      setImageLoaded(false);
      setImageRefreshKey(Date.now());

      setUploadProgress(100);
      setTimeout(() => setUploadProgress(0), 1000);
      showSuccessToast('Image uploaded successfully!', 3000);
    } catch (error) {
      setUploadProgress(0);
      setErrors(prev => ({ ...prev, profileImage: 'Failed to upload image. Please try again.' }));
      showErrorToast('Failed to upload image. Please try again.', 3000);
      if (formData.profileImage) {
        const viewUrl = await getS3ImageUrl(formData.profileImage);
        setPreviewImage(viewUrl);
      } else {
        setPreviewImage(null);
      }
    }
  };

  const validateImage = (file) => {
    if (!file) return '';
    if (file.size > 5 * 1024 * 1024) return 'File size must be less than 5MB';
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) return 'Only JPEG, PNG, GIF, and WEBP files are allowed';
    return '';
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) handleImageUpload(file);
  };

  const removeImage = () => {
    setPreviewImage(null);
    setImageLoaded(false);
    setUploadProgress(0);
    setFormData(prev => ({ ...prev, profileImage: null, imageUrl: null, imageKey: '' }));
    setErrors(prev => ({ ...prev, profileImage: '' }));
    setImageRefreshKey(Date.now());
    showSuccessToast('Image removed', 2000);
  };

  // Languages
  const handleLanguageSelect = useCallback((languageValue) => {
    setFormData(prev => {
      const currentLanguages = [...prev.knowLanguages];
      if (currentLanguages.includes(languageValue)) {
        return { ...prev, knowLanguages: currentLanguages.filter(lang => lang !== languageValue) };
      }
      return { ...prev, knowLanguages: [...currentLanguages, languageValue] };
    });
  }, []);

  const removeLanguage = useCallback((languageValue) => {
    setFormData(prev => ({
      ...prev,
      knowLanguages: prev.knowLanguages.filter(lang => lang !== languageValue)
    }));
  }, []);

  const getLanguageLabel = (value) => {
    const lang = languageOptions.find(l => l.value === value);
    return lang ? lang.label : value;
  };

  const handleFieldChange = useCallback((field, value) => {
    if (value && typeof value === "object" && value.target) {
      value = value.target.value;
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // ✅ Job type change (clears shift times when not needed)
  const handleJobTypeChange = useCallback((value) => {
    setFormData(prev => {
      const isShiftType = SHIFT_TYPES_WITH_TIME.includes(value);
      return {
        ...prev,
        jobType: value,
        shiftStartTime: isShiftType ? prev.shiftStartTime : '',
        shiftEndTime: isShiftType ? prev.shiftEndTime : ''
      };
    });
    if (!SHIFT_TYPES_WITH_TIME.includes(value)) {
      setErrors(prev => ({ ...prev, shiftStartTime: '', shiftEndTime: '' }));
      setTouched(prev => ({ ...prev, shiftStartTime: false, shiftEndTime: false }));
    }
  }, []);

  const toggleStaffStatus = useCallback(() => {
    setFormData(prev => ({ ...prev, isActive: !prev.isActive }));
    showSuccessToast(`Staff status changed to ${!formData.isActive ? 'Active' : 'Inactive'}`, 2000);
  }, [formData.isActive]);

  const validatePassword = (password) => {
    if (!password) return '';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Password must contain at least one special character';
    return '';
  };

  const validateConfirmPassword = (confirmPassword, password) => {
    if (password && !confirmPassword) return 'Please confirm your password';
    if (password && confirmPassword !== password) return 'Passwords do not match';
    return '';
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'name':
        if (!value || value.trim() === '') return 'Full name is required';
        if (value.length < 2) return 'Name must be at least 2 characters';
        return '';
      case 'email': {
        if (!value || value.trim() === '') return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Please enter a valid email address';
        return '';
      }
      case 'designation':
        if (!value) return 'Designation is required';
        return '';
      case 'roleId':
        if (!value) return 'Please select a role';
        return '';
      case 'password':
        return validatePassword(value);
      case 'confirmPassword':
        return validateConfirmPassword(value, formData.password);
      default:
        return '';
    }
  };

  const handleShiftTimeBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    if (!e.target.value) {
      setErrors(prev => ({
        ...prev,
        [name]: name === 'shiftStartTime' ? 'Shift start time is required' : 'Shift end time is required'
      }));
    } else {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Returns the errors object so callers don't read stale state
  const validateForm = () => {
    const newErrors = {};
    const requiredFields = ['name', 'email', 'designation', 'roleId'];
    requiredFields.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });

    if (formData.password) {
      const passwordError = validatePassword(formData.password);
      if (passwordError) newErrors.password = passwordError;
      const confirmError = validateConfirmPassword(formData.confirmPassword, formData.password);
      if (confirmError) newErrors.confirmPassword = confirmError;
    }

    if (requiresShiftTime) {
      if (!formData.shiftStartTime) newErrors.shiftStartTime = 'Shift start time is required';
      if (!formData.shiftEndTime) newErrors.shiftEndTime = 'Shift end time is required';
    }

    // ✅ Address is optional, but if a pincode is given it must be complete
    if (formData.pincode) {
      if (!/^\d{6}$/.test(formData.pincode)) {
        newErrors.pincode = 'Please enter a valid 6-digit pincode';
      } else if (!formData.stateName || !formData.district) {
        newErrors.pincode = 'Invalid pincode or no location found';
      } else if (!formData.localArea) {
        newErrors.localArea = 'Local area is required';
      }
    }

    setErrors(newErrors);
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!hospitalId) {
      showErrorToast('❌ Hospital ID not found. Please log in again.');
      return;
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      showErrorToast('❌ Passwords do not match!');
      return;
    }

    setTouched(prev => ({
      ...prev,
      pincode: true,
      localArea: true,
      ...(requiresShiftTime ? { shiftStartTime: true, shiftEndTime: true } : {})
    }));

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      showWarningToast('Please fix the validation errors before submitting', 3000);
      return;
    }

    try {
      setIsSubmitting(true);
      const roleId = Number(formData.roleId);
      const selectedRoleName = getRoleNameById(roleId);

      const address = {
        country: formData.pincode || formData.stateName ? 'India' : '',
        state: formData.stateName || '',
        district: formData.district || '',
        place: buildPlace(formData.addressLine1, formData.addressLine2, formData.localArea),
        pincode: formData.pincode ? Number(formData.pincode) : null,
        addressLine1: formData.addressLine1 || '',
        addressLine2: formData.addressLine2 || ''
      };
      Object.keys(address).forEach(key => {
        if (address[key] === '' || address[key] === null || address[key] === undefined) {
          delete address[key];
        }
      });

      const updatedStaffData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        designation: formData.designation,
        joiningDate: formData.joiningDate,
        jobType: formData.jobType,
        staffType: formData.staffType,
        dob: formData.dob,
        gender: formData.gender?.toLowerCase(),
        knowLanguages: formData.knowLanguages,
        qualification: formData.qualification,
        roleId: roleId,
        hospitalName: hospitalName,
        hospitalId: Number(hospitalId),
        authId: authId,
        imageUrl: formData.imageUrl,
        profileImage: formData.profileImage,
        imageKey: formData.imageKey,
        isActive: formData.isActive,
        shiftStartTime: requiresShiftTime ? formData.shiftStartTime : null,
        shiftEndTime: requiresShiftTime ? formData.shiftEndTime : null,
        address: address
      };

      Object.keys(updatedStaffData).forEach(key => {
        if (updatedStaffData[key] === undefined || updatedStaffData[key] === '') {
          delete updatedStaffData[key];
        }
      });

      await updateStaff({
        id: String(staffId),
        data: updatedStaffData,
        hospitalId: Number(hospitalId),
        authId: authId
      }).unwrap();

      if (formData.password) {
        await changeStaffPassword({
          staffId: String(staffId),
          newPassword: formData.password,
          confirmPassword: formData.confirmPassword,
        }).unwrap();
      }

      if (roleId) {
        const payload = {
          hospitalId: Number(hospitalId),
          roleId: roleId,
          userType: "staff",
          staffIds: [{ id: Number(staffId), roleId: roleId }]
        };
        await assignPermissions(payload).unwrap();
      }

      setImageRefreshKey(Date.now());
      await refetch();

      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));

      showUpdateToast(
        `${formData.name}'s information has been updated successfully!`,
        4000,
        {
          'Name': formData.name,
          'ID': staffId,
          'Designation': formData.designation,
          'Role': selectedRoleName,
          'Status': formData.isActive ? 'Active' : 'Inactive',
          ...(formData.password ? { 'Password': 'Updated ✓' } : {}),
          ...(requiresShiftTime ? {
            'Shift Start': formData.shiftStartTime,
            'Shift End': formData.shiftEndTime
          } : {})
        }
      );

      // ✅ Navigate back to super-admin hospital staff list
      setTimeout(() => {
        if (hospitalId) {
          navigate(`/super-admin/hospitals/${hospitalId}/staff`);
        } else {
          navigate('/staffs');
        }
      }, 1500);

    } catch (error) {
      console.error('Update Staff Error:', error);
      const status = error?.status || error?.originalStatus;
      if (status === 401) {
        showErrorToast('Session expired. Please login again.', 3000);
        setTimeout(() => { window.location.href = '/sign-in'; }, 2000);
        return;
      }
      const message =
        error?.data?.error?.details?.[0]?.message ||
        error?.data?.details?.[0]?.message ||
        error?.data?.errors?.[0]?.message ||
        error?.data?.error?.message ||
        error?.data?.message ||
        error?.error ||
        error?.message ||
        'Failed to update staff member';
      showErrorToast(message, 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ Navigate back to super-admin hospital staff list
  const handleGoBack = () => {
    if (hospitalId) {
      navigate(`/super-admin/hospitals/${hospitalId}/staff`);
    } else {
      navigate('/staffs');
    }
  };

  const handleRetry = () => refetch();

  if (!hospitalId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-lg">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Hospital ID Not Found</h2>
          <p className="text-gray-600 mb-4">Please log in again to access this page.</p>
          <Button variant="primary" onClick={() => navigate('/login')}>Go to Login</Button>
        </div>
      </div>
    );
  }

  if (isLoading || rolesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading staff data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-lg">
          <div className="bg-red-100 rounded-full h-20 w-20 flex items-center justify-center mx-auto">
            <AlertCircle className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mt-4">Error Loading Staff</h2>
          <p className="text-gray-600 mt-2">There was an error loading the staff data.</p>
          <div className="flex gap-3 mt-6 justify-center">
            <Button variant="outline" onClick={handleGoBack}>Back to Staff List</Button>
            <Button variant="primary" onClick={handleRetry}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!staff && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-lg">
          <div className="bg-yellow-100 rounded-full h-20 w-20 flex items-center justify-center mx-auto">
            <AlertCircle className="h-10 w-10 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mt-4">Staff Not Found</h2>
          <p className="text-gray-600 mt-2">No staff member found with ID: {staffId}</p>
          <Button variant="primary" onClick={handleGoBack} className="mt-6">Back to Staff List</Button>
        </div>
      </div>
    );
  }

  const isUploading = uploadProgress > 0 && uploadProgress < 100;
  const isFormSubmitting = isSubmitting || isUpdateLoading || isAssigning || isPasswordChanging;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Button variant="ghost" size="sm" onClick={handleGoBack} className="p-2">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Staff</h1>
              <p className="text-sm text-gray-500 mt-1">
                Editing: {formData.name} ({formatStaffId(staff?.id || staffId)})
              </p>
              {hospitalId && (
                <p className="text-xs text-blue-600 mt-0.5">Hospital ID: {hospitalId}</p>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Plain container (overflow-visible) so dropdowns are not clipped */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-visible">
            <div className="p-6 space-y-6">
              {/* Profile Image */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center border-2 border-gray-200 overflow-hidden shadow-sm">
                      {previewImage ? (
                        <img
                          key={imageRefreshKey}
                          src={previewImage}
                          alt="Profile"
                          className="w-full h-full object-cover rounded-full"
                          onLoad={() => setImageLoaded(true)}
                          onError={() => setImageLoaded(false)}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-full">
                          <span className="text-gray-400 text-2xl font-medium">
                            {formData.name ? formData.name.charAt(0).toUpperCase() : 'S'}
                          </span>
                        </div>
                      )}
                    </div>
                    {(previewImage || formData.profileImage) && (
                      <button type="button" onClick={removeImage}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm">
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex-1 w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Profile Image</label>
                  <div>
                    <input id="profileImageInput" type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleFileSelect} className="hidden" />
                    <Button type="button" variant="outline" onClick={() => document.getElementById('profileImageInput').click()} className="inline-flex items-center gap-2" disabled={isFormSubmitting}>
                      <Upload className="h-4 w-4" /> Upload New Image
                    </Button>
                    <p className="text-xs text-gray-400 mt-2">JPEG, PNG, GIF, WEBP accepted. Max 5MB</p>
                  </div>
                  {isUploading && (
                    <div className="mt-2">
                      <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-[#1C62A0] transition-all duration-300 rounded-full" style={{ width: `${uploadProgress}%` }} />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Uploading to cloud... {uploadProgress}%</p>
                    </div>
                  )}
                  {errors.profileImage && <Alert type="error" message={errors.profileImage} className="mt-2" />}
                </div>
              </div>

              {/* Staff ID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Staff ID:</span>
                  <span className="text-sm font-medium text-gray-900 bg-gray-100 px-2 py-1 rounded">
                    {formatStaffId(staff?.id || staffId)}
                  </span>
                </div>
              </div>

              {/* Personal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                  label="Full Name *" name="name" icon={User}
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  error={errors.name} touched={touched.name}
                  onBlur={(e) => {
                    setTouched(prev => ({ ...prev, name: true }));
                    const error = validateField('name', e.target.value);
                    setErrors(prev => ({ ...prev, name: error }));
                  }}
                  required
                />

                <CustomSelect
                  label="Gender"
                  icon={Users}
                  value={formData.gender}
                  options={GENDER_SELECT_OPTIONS}
                  placeholder="Select gender"
                  onChange={(value) => handleFieldChange('gender', value)}
                  className={SELECT_FORM_CLASS}
                />
              </div>

              {/* Date of Birth & Joining Date — using custom DatePicker */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10 pointer-events-none" />
                    <DatePicker
                      value={formData.dob}
                      onChange={(iso) => handleFieldChange('dob', iso)}
                      mode="dob"
                      placeholder="DD/MM/YYYY"
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Joining Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10 pointer-events-none" />
                    <DatePicker
                      value={formData.joiningDate}
                      onChange={(iso) => handleFieldChange('joiningDate', iso)}
                      mode="any"
                      placeholder="DD/MM/YYYY"
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <CustomSelect
                label="Assign Role"
                icon={Shield}
                value={formData.roleId != null ? String(formData.roleId) : ''}
                options={roleOptions}
                placeholder="Select a role"
                onChange={(value) => handleFieldChange('roleId', value)}
                onBlur={() => {
                  setTouched(prev => ({ ...prev, roleId: true }));
                  const error = validateField('roleId', formData.roleId);
                  setErrors(prev => ({ ...prev, roleId: error }));
                }}
                error={errors.roleId}
                touched={touched.roleId}
                required
                className={SELECT_FORM_CLASS}
              />
              {formData.roleId && (
                <div className="-mt-3">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(formData.roleId)}`}>
                    {getRoleNameById(formData.roleId)}
                  </span>
                </div>
              )}

              {/* Professional */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <CustomSelect
                  label="Designation"
                  icon={Briefcase}
                  value={formData.designation}
                  options={designations.map(d => ({ value: d, label: d }))}
                  placeholder="Select designation"
                  onChange={(value) => handleFieldChange('designation', value)}
                  onBlur={() => {
                    setTouched(prev => ({ ...prev, designation: true }));
                    const error = validateField('designation', formData.designation);
                    setErrors(prev => ({ ...prev, designation: error }));
                  }}
                  error={errors.designation}
                  touched={touched.designation}
                  required
                  className={SELECT_FORM_CLASS}
                />
                <Input
                  label="Qualification" name="qualification" icon={GraduationCap}
                  placeholder="e.g., MBA, B.Tech"
                  value={formData.qualification}
                  onChange={(e) => handleFieldChange('qualification', e.target.value)}
                />
              </div>

              {/* Staff Type & Job Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <CustomSelect
                  label="Staff Type"
                  icon={Users}
                  value={formData.staffType}
                  options={staffTypes.map(t => ({ value: t, label: t }))}
                  placeholder="Select staff type"
                  onChange={(value) => handleFieldChange('staffType', value)}
                  className={SELECT_FORM_CLASS}
                />

                <CustomSelect
                  label="Job Type"
                  icon={Briefcase}
                  value={formData.jobType}
                  options={jobTypes.map(t => ({ value: t, label: t }))}
                  placeholder="Select job type"
                  onChange={(value) => handleJobTypeChange(value)}
                  className={SELECT_FORM_CLASS}
                />
              </div>

              {/* ✅ Shift Time Fields */}
              {requiresShiftTime && (
                <ShiftTimeInput
                  shiftStartTime={formData.shiftStartTime}
                  shiftEndTime={formData.shiftEndTime}
                  onChange={(e) => handleFieldChange(e.target.name, e.target.value)}
                  onBlur={handleShiftTimeBlur}
                  errors={errors}
                  touched={touched}
                />
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                  label="Phone Number *" name="phone" icon={Phone}
                  placeholder="10 digit phone number"
                  value={formData.phone}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                  required
                />
                <Input
                  label="Email Address *" name="email" type="email" icon={Mail}
                  placeholder="staff@example.com"
                  value={formData.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  onBlur={(e) => {
                    setTouched(prev => ({ ...prev, email: true }));
                    const error = validateField('email', e.target.value);
                    setErrors(prev => ({ ...prev, email: error }));
                  }}
                  error={errors.email} touched={touched.email}
                  required
                />
              </div>

              {/* Languages */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Known Languages</label>
                {formData.knowLanguages.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.knowLanguages.map(lang => (
                      <span key={lang} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm">
                        {getLanguageLabel(lang)}
                        <button type="button" onClick={() => removeLanguage(lang)} className="hover:text-blue-600">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                    className={`w-full px-3 py-2 text-left border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between bg-white ${
                      formData.knowLanguages.length === 0 ? 'text-gray-400' : 'text-gray-900'
                    }`}
                  >
                    <span>
                      {formData.knowLanguages.length === 0 ? 'Select languages' : `${formData.knowLanguages.length} language(s) selected`}
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${showLanguageDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showLanguageDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowLanguageDropdown(false)} />
                      <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                        {languageOptions.map(lang => (
                          <label key={lang.value} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.knowLanguages.includes(lang.value)}
                              onChange={() => handleLanguageSelect(lang.value)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">{lang.label}</span>
                          </label>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Account Details */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="relative">
                    <PasswordInput
                      label="New Password" name="password"
                      value={formData.password}
                      onChange={(e) => handleFieldChange('password', e.target.value)}
                      onBlur={(e) => {
                        setTouched(prev => ({ ...prev, password: true }));
                        const error = validateField('password', e.target.value);
                        setErrors(prev => ({ ...prev, password: error }));
                      }}
                      error={errors.password} touched={touched.password}
                      showPassword={showPassword} setShowPassword={setShowPassword}
                      placeholder="Leave blank to keep current"
                      icon={Lock}
                    />
                  </div>
                  <div className="relative">
                    <PasswordInput
                      label="Confirm New Password" name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
                      onBlur={(e) => {
                        setTouched(prev => ({ ...prev, confirmPassword: true }));
                        const error = validateField('confirmPassword', e.target.value);
                        setErrors(prev => ({ ...prev, confirmPassword: error }));
                      }}
                      error={errors.confirmPassword} touched={touched.confirmPassword}
                      showPassword={showConfirmPassword} setShowPassword={setShowConfirmPassword}
                      placeholder="Confirm new password"
                      icon={Lock}
                    />
                  </div>
                </div>
                {formData.password && !errors.password && (
                  <p className="text-xs text-green-600 mt-2">✓ New password will be updated</p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  Leave password fields blank to keep the current password
                </p>
              </div>

              {/* Address */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h3>
                <div className="space-y-5">
                  {/* Country (fixed India) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <div className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-100 flex justify-between">
                      <span>🇮🇳 India</span>
                      <span className="text-green-600 font-medium text-sm">✓ Default</span>
                    </div>
                  </div>

                  {/* Pincode */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pincode
                    </label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        inputMode="numeric"
                        name="pincode"
                        value={formData.pincode}
                        onChange={(e) => handlePincodeChange(e.target.value)}
                        onBlur={() => setTouched(prev => ({ ...prev, pincode: true }))}
                        placeholder="Enter 6 digit pincode (Optional)"
                        maxLength={6}
                        className={`w-full pl-10 pr-10 py-2 rounded-lg border ${
                          errors.pincode && touched.pincode ? 'border-red-500' : 'border-gray-300'
                        } focus:outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent`}
                      />
                      {isPincodeLoading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600" />
                        </div>
                      )}
                      {!isPincodeLoading && postOffices.length > 0 && (
                        <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Enter pincode to automatically find the location.
                    </p>
                    {isPincodeLoading && (
                      <p className="text-xs text-blue-600 mt-2">Finding location...</p>
                    )}
                    {isPincodeError && (
                      <p className="text-xs text-red-500 mt-2">
                        Unable to fetch pincode details. Please try again.
                      </p>
                    )}
                    {formData.pincode.length === 6 &&
                      !isPincodeLoading &&
                      !isPincodeError &&
                      postOffices.length === 0 && (
                        <p className="text-xs text-red-500 mt-2">
                          Invalid pincode or no location found.
                        </p>
                      )}
                    {touched.pincode && errors.pincode && (
                      <p className="text-sm text-red-600 mt-1">{errors.pincode}</p>
                    )}
                  </div>

                  {/* State + District (read-only, auto-filled) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          value={formData.stateName}
                          readOnly
                          placeholder="Automatically detected state"
                          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-gray-100 text-gray-600"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          value={formData.district}
                          readOnly
                          placeholder="Automatically detected district"
                          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-gray-100 text-gray-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Local Area (post offices) */}
                  <SearchableCityDropdown
                    label="Local Area"
                    options={[
                      ...new Map(
                        postOffices.map((office) => [
                          office.Name,
                          { name: office.Name }
                        ])
                      ).values()
                    ]}
                    value={formData.localArea}
                    onChange={handleLocalAreaChange}
                    placeholder={
                      postOffices.length === 0
                        ? 'Enter pincode first'
                        : 'Select local area'
                    }
                    required={postOffices.length > 0}
                    disabled={postOffices.length === 0}
                    error={errors.localArea}
                    touched={touched.localArea}
                  />

                  {/* Address lines (editable) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input
                      label="Address Line 1" name="addressLine1"
                      placeholder="House no., street"
                      value={formData.addressLine1}
                      onChange={(e) => handleFieldChange('addressLine1', e.target.value)}
                    />
                    <Input
                      label="Address Line 2" name="addressLine2"
                      placeholder="Apt, suite, unit (optional)"
                      value={formData.addressLine2}
                      onChange={(e) => handleFieldChange('addressLine2', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <StatusToggle
                  status={formData.isActive}
                  onToggle={toggleStaffStatus}
                  disabled={isFormSubmitting}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
              <Button type="button" variant="outline" onClick={handleGoBack} disabled={isFormSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isFormSubmitting} loading={isFormSubmitting}>
                {isFormSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditStaff;