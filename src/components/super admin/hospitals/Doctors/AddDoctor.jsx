// src/components/superadmin/Doctor/AddDoctors.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  User, Mail, Phone, Calendar, MapPin, Lock, Image,
  DollarSign, IdCard, ArrowLeft, Upload, X, GraduationCap,
  Home, CheckCircle, XCircle, ChevronDown, Eye, EyeOff, Briefcase, Users, Shield,
  CreditCard
} from 'lucide-react';
import {
  Button,
  Input,
  Textarea,
  Card,
} from "../../../ui";
import DatePicker from "../../../ui/DatePicker";
import CustomSelect from "../../../ui/CustomSelect";
import {
  showSuccessToast,
  showErrorToast,
  showWarningToast,
} from "../../../ui/Toast";
import { useAddNewDoctorMutation, useGetSpecialitiesQuery } from "../../../../../app/service/doctorApi";
import { useAssignPermissionsMutation } from '../../../../../app/service/rolePermission';
import { useGetRolesQuery } from '../../../../../app/service/role';
import { getHospitalId, getAuthUser } from '../../../../utils/auth';
// ✅ Pincode API integration
import { useGetPincodeQuery } from '../../../../../app/service/pincodeApi';
import { uploadToS3 } from '../../../../../app/service/S3';

// ============ SKELETON LOADING COMPONENTS ============

const SkeletonText = ({ width = "w-full", height = "h-4", className = "" }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${width} ${height} ${className}`}></div>
);

const SkeletonCard = ({ className = "" }) => (
  <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
    <div className="border-b border-gray-200 px-6">
      <div className="flex gap-8 py-4">
        <SkeletonText width="w-24" height="h-6" />
        <SkeletonText width="w-28" height="h-6" />
      </div>
    </div>
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex-shrink-0">
          <div className="w-24 h-24 bg-gray-200 rounded-full animate-pulse"></div>
        </div>
        <div className="flex-1 w-full space-y-2">
          <SkeletonText width="w-32" height="h-4" />
          <SkeletonText width="w-36" height="h-9" className="rounded-lg" />
          <SkeletonText width="w-48" height="h-3" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="space-y-2">
            <SkeletonText width="w-28" height="h-4" />
            <SkeletonText width="w-full" height="h-10" className="rounded-lg" />
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <SkeletonText width="w-48" height="h-6" className="mb-4" />
        <div className="space-y-5">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="space-y-2">
              <SkeletonText width="w-24" height="h-4" />
              <SkeletonText width="w-full" height="h-10" className="rounded-lg" />
            </div>
          ))}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <SkeletonText width="w-16" height="h-4" />
              <SkeletonText width="w-full" height="h-10" className="rounded-lg" />
            </div>
            <div className="space-y-2">
              <SkeletonText width="w-16" height="h-4" />
              <SkeletonText width="w-full" height="h-10" className="rounded-lg" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <SkeletonText width="w-48" height="h-6" className="mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="space-y-2">
              <SkeletonText width="w-28" height="h-4" />
              <SkeletonText width="w-full" height="h-10" className="rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4 flex justify-end gap-3">
        <SkeletonText width="w-24" height="h-10" className="rounded-lg" />
        <SkeletonText width="w-28" height="h-10" className="rounded-lg" />
      </div>
    </div>
  </div>
);

const AddDoctorSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <SkeletonText width="w-10" height="h-10" className="rounded-lg" />
          <div>
            <SkeletonText width="w-48" height="h-7" />
            <SkeletonText width="w-64" height="h-4" className="mt-1" />
          </div>
        </div>
      </div>
      <SkeletonCard />
    </div>
  </div>
);

// ============ END SKELETON LOADING COMPONENTS ============

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const GRID_CLASS = "grid grid-cols-1 md:grid-cols-2 gap-5";

const DEFAULT_SCHEDULE = {
  isHoliday: false,
  hasBreak: false,
  morningOpen: '09:00',
  morningClose: '18:00',
  eveningOpen: '16:00',
  eveningClose: '20:00'
};

const TABS = [
  { id: 'basic', label: 'Basic Info' },
  { id: 'professional', label: 'Professional Info' },
];

const REQUIRED_FIELDS = [
  'firstName', 'lastName', 'department', 'qualification', 'fees',
  'phoneNumber', 'email', 'dob', 'gender', 'registrationNumber', 'joiningDate',
  'knownLanguages', 'stateName', 'district', 'displayName',
  'password', 'confirmPassword', 'experience', 'roleId'
];

const LANGUAGE_OPTIONS = [
  { value: 'mal', label: 'Malayalam' },
  { value: 'eng', label: 'English' },
  { value: 'hin', label: 'Hindi' },
  { value: 'tam', label: 'Tamil' },
  { value: 'tel', label: 'Telugu' },
  { value: 'kan', label: 'Kannada' },
  { value: 'ben', label: 'Bengali' },
  { value: 'mar', label: 'Marathi' },
  { value: 'guj', label: 'Gujarati' },
  { value: 'pun', label: 'Punjabi' },
  { value: 'urd', label: 'Urdu' },
  { value: 'spa', label: 'Spanish' },
  { value: 'fre', label: 'French' },
  { value: 'ger', label: 'German' },
  { value: 'chi', label: 'Chinese' },
  { value: 'ara', label: 'Arabic' },
  { value: 'rus', label: 'Russian' },
  { value: 'jap', label: 'Japanese' }
];

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' }
];

const WEEK_DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' }
];

const getLanguageLabel = (value) => {
  const lang = LANGUAGE_OPTIONS.find(l => l.value === value);
  return lang ? lang.label : value;
};

const validatePasswordStrength = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters long';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Password must contain at least one special character';
  return '';
};

const SearchableDropdown = ({
  label,
  options,
  value,
  onChange,
  placeholder,
  icon: Icon,
  disabled = false,
  required = false,
  getOptionLabel = (option) => option.name || option,
  getOptionValue = (option) => option.isoCode || option,
  optionKey = (option, index) => option.isoCode || index,
  isLoading = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  const filteredOptions = options.filter(option => {
    const label = getOptionLabel(option).toLowerCase();
    return label.includes(searchTerm.toLowerCase());
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    onChange(getOptionValue(option), getOptionLabel(option));
    setSearchTerm("");
    setIsOpen(false);
  };

  const displayValue = () => {
    if (!value) return "";
    const selected = options.find(opt => getOptionValue(opt) === value);
    return selected ? getOptionLabel(selected) : "";
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />}
        <input
          type="text"
          value={isOpen ? searchTerm : displayValue()}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            setSearchTerm("");
          }}
          placeholder={isLoading ? "Loading..." : placeholder}
          disabled={disabled || isLoading}
          className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-10 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            (disabled || isLoading) ? 'text-gray-400 bg-gray-50 cursor-not-allowed' : ''
          }`}
        />
        <ChevronDown
          className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 cursor-pointer transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          onClick={() => !isLoading && setIsOpen(!isOpen)}
        />
      </div>

      {isOpen && !isLoading && filteredOptions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.map((option, index) => (
            <div
              key={optionKey(option, index)}
              className="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors flex items-center gap-2"
              onClick={() => handleSelect(option)}
            >
              <Briefcase className="h-4 w-4 text-gray-400" />
              <span className="text-gray-700">{getOptionLabel(option)}</span>
            </div>
          ))}
        </div>
      )}

      {isOpen && !isLoading && filteredOptions.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
          No options found
        </div>
      )}

      {isLoading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span>Loading...</span>
          </div>
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
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  const filteredOptions = options.filter(option =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    onChange(option.name);
    setSearchTerm("");
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
            setSearchTerm("");
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full pl-10 pr-10 py-2 rounded-lg border ${
            showError ? 'border-red-500' : 'border-gray-300'
          } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            disabled ? 'text-gray-400 bg-gray-50 cursor-not-allowed' : ''
          }`}
        />
        <ChevronDown
          className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 cursor-pointer transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          onClick={() => setIsOpen(!isOpen)}
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

      {showError && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
};

const DayScheduleRow = ({ day, schedule, onUpdate }) => {
  const [isHoliday, setIsHoliday] = useState(schedule.isHoliday || false);
  const [hasBreak, setHasBreak] = useState(schedule.hasBreak || false);

  const formatTimeDisplay = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const updateTime = (field, value) => {
    onUpdate({
      ...schedule,
      [field]: value,
      isHoliday,
      hasBreak
    });
  };

  const handleHolidayChange = (checked) => {
    setIsHoliday(checked);
    onUpdate({
      ...schedule,
      isHoliday: checked,
      hasBreak: checked ? false : hasBreak
    });
  };

  const handleBreakChange = (checked) => {
    setHasBreak(checked);
    onUpdate({
      ...schedule,
      hasBreak: checked,
      isHoliday
    });
  };

  return (
    <div className={`border rounded-lg p-4 mb-4 ${isHoliday ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
        <h4 className="text-lg font-semibold text-gray-900">{day}</h4>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isHoliday}
            onChange={(e) => handleHolidayChange(e.target.checked)}
            className="h-4 w-4 text-gray-500 focus:ring-gray-500 rounded"
          />
          <span className={`text-sm ${isHoliday ? 'text-gray-100 font-medium' : 'text-gray-500'}`}>
            Holiday
          </span>
        </label>
      </div>

      {!isHoliday && (
        <>
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-gray-700">Morning Session</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 pl-6">
              <div className="flex-1 min-w-[120px]">
                <input
                  type="time"
                  value={schedule.morningOpen}
                  onChange={(e) => updateTime('morningOpen', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">{formatTimeDisplay(schedule.morningOpen)}</p>
              </div>
              <span className="text-gray-400">to</span>
              <div className="flex-1 min-w-[120px]">
                <input
                  type="time"
                  value={schedule.morningClose}
                  onChange={(e) => updateTime('morningClose', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">{formatTimeDisplay(schedule.morningClose)}</p>
              </div>
            </div>
          </div>

          {hasBreak && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-gray-700">Evening Session</span>
              </div>
              <div className="flex flex-wrap items-center gap-3 pl-6">
                <div className="flex-1 min-w-[120px]">
                  <input
                    type="time"
                    value={schedule.eveningOpen}
                    onChange={(e) => updateTime('eveningOpen', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">{formatTimeDisplay(schedule.eveningOpen)}</p>
                </div>
                <span className="text-gray-400">to</span>
                <div className="flex-1 min-w-[120px]">
                  <input
                    type="time"
                    value={schedule.eveningClose}
                    onChange={(e) => updateTime('eveningClose', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">{formatTimeDisplay(schedule.eveningClose)}</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-3 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasBreak}
                onChange={(e) => handleBreakChange(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
              />
              <span className="text-sm text-gray-700">Has Break Between Sessions</span>
            </label>
            <p className="text-xs text-gray-500 ml-6 mt-1">
              {hasBreak ? 'Morning & Evening sessions' : 'Normal schedule (single session)'}
            </p>
          </div>
        </>
      )}

      {isHoliday && (
        <div className="text-center py-3">
          <p className="text-sm text-gray-500">📅 Closed for the day</p>
        </div>
      )}
    </div>
  );
};

const AddDoctor = () => {
  const navigate = useNavigate();
  // Get hospital ID from route params
  const { id: hospitalIdFromRoute } = useParams();

  // Use route param for hospital ID, fallback to auth
  const hospitalId = hospitalIdFromRoute || getHospitalId();

  const authUser = getAuthUser();
  const hospitalName = authUser?.name || '';

  const [addNewDoctor] = useAddNewDoctorMutation();
  const [assignPermissions] = useAssignPermissionsMutation();

  const {
    data: rolesData,
    isLoading: rolesLoading,
    error: rolesError
  } = useGetRolesQuery({
    hospitalId: hospitalId,
    limit: 100
  }, {
    skip: !hospitalId
  });

  const rolesList = React.useMemo(() => {
    if (!rolesData) return [];
    let roles = [];

    if (rolesData.admin && Array.isArray(rolesData.admin)) {
      roles = [...roles, ...rolesData.admin.filter(role => role.id === 2)];
    }

    if (rolesData.data && Array.isArray(rolesData.data)) {
      const hospitalRoles = rolesData.data.filter(role => role.hospitalId === Number(hospitalId));
      roles = [...roles, ...hospitalRoles];
    }

    if (roles.length === 0 && Array.isArray(rolesData)) {
      roles = rolesData.filter(role => role.hospitalId === Number(hospitalId));
    }

    if (roles.length === 0 && rolesData.roles && Array.isArray(rolesData.roles)) {
      roles = rolesData.roles.filter(role => role.hospitalId === Number(hospitalId));
    }

    return roles;
  }, [rolesData, hospitalId]);

  useEffect(() => {
    if (rolesError) {
      console.error("❌ Roles Error:", rolesError);
    }
  }, [rolesData, rolesError]);

  const { data: specialitiesData, isLoading: isLoadingSpecialities } =
    useGetSpecialitiesQuery({
      page: 1,
      limit: 1000,
    });

  const departmentOptions = React.useMemo(() => {
    const rows = specialitiesData?.data || [];
    return rows.map((spec) => ({
      id: spec.id,
      name: spec.name.toUpperCase(),
      value: spec.name.toUpperCase(),
      label: spec.name.toUpperCase()
    }));
  }, [specialitiesData]);

  const roleOptions = React.useMemo(() => {
    return rolesList.map(role => ({
      value: String(role.id),
      label: role.name || role.roleName || String(role.id),
    }));
  }, [rolesList]);

  const [formData, setFormData] = useState({
    profileImage: null,
    imageKey: '',
    firstName: '',
    lastName: '',
    department: '',
    specialist: '',
    qualification: '',
    fees: '',
    phoneNumber: '',
    email: '',
    dob: '',
    gender: '',
    registrationNumber: '',
    knownLanguages: [],
    about: '',
    // ✅ Pincode-based location states
    countryName: 'India',
    stateName: '',
    district: '',
    localArea: '',
    place: '',
    pincode: '',
    displayName: '',
    userName: '',
    password: '',
    confirmPassword: '',
    joiningDate: '',
    experience: '',
    appointmentCount: '',
    roleId: '',
    weeklySchedule: {
      monday: { ...DEFAULT_SCHEDULE, hasBreak: true, morningClose: '12:00' },
      tuesday: { ...DEFAULT_SCHEDULE },
      wednesday: { ...DEFAULT_SCHEDULE },
      thursday: { ...DEFAULT_SCHEDULE, hasBreak: true, morningClose: '12:00' },
      friday: { ...DEFAULT_SCHEDULE, hasBreak: true, morningClose: '12:00' },
      saturday: { ...DEFAULT_SCHEDULE, morningClose: '14:00' },
      sunday: {
        ...DEFAULT_SCHEDULE,
        isHoliday: true,
        morningOpen: '10:00',
        morningClose: '13:00'
      }
    },
    outDoorConsultingOpen: '',
    outDoorConsultingClose: '',
    outDoorConsultingPlace: '',
    bookingOpen: true
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');

  // ✅ Pincode API integration
  const {
    currentData: pincodeData,
    isFetching: isPincodeLoading,
    isError: isPincodeError,
  } = useGetPincodeQuery(formData.pincode, {
    skip: !/^\d{6}$/.test(formData.pincode),
  });

  const postOffices =
    pincodeData?.[0]?.Status === "Success"
      ? pincodeData[0].PostOffice || []
      : [];

  // ✅ Automatically populate state and district
  useEffect(() => {
    if (postOffices.length > 0) {
      const firstOffice = postOffices[0];

      setFormData(prev => ({
        ...prev,
        stateName: firstOffice.State,
        district: firstOffice.District,
        localArea: ''
      }));
    } else if (formData.pincode.length === 6 && pincodeData) {
      setFormData(prev => ({
        ...prev,
        stateName: '',
        district: '',
        localArea: ''
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pincodeData]);

  // ✅ Handle pincode change
  const handlePincodeChange = (value) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 6);

    setFormData(prev => ({
      ...prev,
      pincode: cleaned,
      stateName: '',
      district: '',
      localArea: ''
    }));

    if (errors.pincode) {
      setErrors(prev => ({ ...prev, pincode: '' }));
    }
  };

  const updateScheduleForDay = (day, newSchedule) => {
    setFormData(prev => ({
      ...prev,
      weeklySchedule: {
        ...prev.weeklySchedule,
        [day]: newSchedule
      }
    }));
  };

  const handleDepartmentChange = (departmentValue) => {
    setFormData(prev => ({
      ...prev,
      department: departmentValue
    }));

    if (touched.department) {
      const error = validateField('department', departmentValue);
      setErrors(prev => ({ ...prev, department: error }));
    }
  };

  const handleLanguageSelect = (languageValue) => {
    setFormData(prev => ({
      ...prev,
      knownLanguages: prev.knownLanguages.includes(languageValue)
        ? prev.knownLanguages.filter(lang => lang !== languageValue)
        : [...prev.knownLanguages, languageValue]
    }));
  };

  const removeLanguage = (languageValue) => {
    setFormData(prev => ({
      ...prev,
      knownLanguages: prev.knownLanguages.filter(lang => lang !== languageValue)
    }));
  };

  // ✅ Handle local area change
  const handleLocalAreaChange = (name) => {
    setFormData(prev => ({
      ...prev,
      localArea: name
    }));
    setTouched(prev => ({ ...prev, localArea: true }));
    if (errors.localArea) {
      setErrors(prev => ({ ...prev, localArea: '' }));
    }
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

  const validateField = (name, value) => {
    switch (name) {
      case 'firstName':
      case 'lastName':
        if (!value) return `${name === 'firstName' ? 'First' : 'Last'} name is required`;
        if (value.length < 2) return `${name === 'firstName' ? 'First' : 'Last'} name must be at least 2 characters`;
        return '';
      case 'department':
      case 'qualification':
      case 'registrationNumber':
      case 'joiningDate':
        if (!value) return `${name.charAt(0).toUpperCase() + name.slice(1)} is required`;
        return '';
      case 'fees':
        if (!value) return 'Fees are required';
        if (isNaN(value) || value <= 0) return 'Fees must be a positive number';
        return '';
      case 'phoneNumber':
        if (!value) return 'Phone number is required';
        if (!/^[\+]?[0-9]{10,15}$/.test(value)) return 'Please enter a valid phone number';
        return '';
      case 'email':
        if (!value) return 'Email address is required';
        if (!/^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/.test(value)) return 'Please enter a valid email address';
        return '';
      case 'dob':
      case 'gender':
      case 'stateName':
      case 'district':
      case 'localArea':
      case 'roleId':
        if (!value) return `${name.charAt(0).toUpperCase() + name.slice(1)} is required`;
        return '';
      case 'pincode':
        if (!value) return 'Pincode is required';
        if (!/^\d{6}$/.test(String(value))) return 'Please enter a valid 6-digit pincode';
        return '';
      case 'knownLanguages':
        if (!value || value.length === 0) return 'At least one language is required';
        return '';
      case 'displayName':
        if (!value) return 'Display name is required';
        if (value.length < 4) return 'Display name must be at least 4 characters';
        return '';
      case 'password':
        return validatePasswordStrength(value);
      case 'confirmPassword':
        if (!formData.password && !value) return '';
        if (formData.password && !value) return 'Please confirm your password';
        if (formData.password && value !== formData.password) return 'Passwords do not match';
        return '';
      case 'experience':
        if (!value) return 'Experience is required';
        if (isNaN(value) || value < 0) return 'Experience must be a valid number';
        return '';
      default:
        return '';
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // ✅ Validate required fields + pincode & localArea
    const fieldsToValidate = [...REQUIRED_FIELDS, 'localArea', 'pincode'];

    fieldsToValidate.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (name === 'password') {
      setPasswordStrength(validatePasswordStrength(value));
    }

    if (touched[name]) {
      const error = validateField(name, type === 'checkbox' ? (checked ? 'true' : 'false') : value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e) => {
    const { name, value, type, checked } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, type === 'checkbox' ? (checked ? 'true' : 'false') : value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleJoiningDateChange = (isoDate) => {
    setFormData(prev => ({ ...prev, joiningDate: isoDate }));
    setTouched(prev => ({ ...prev, joiningDate: true }));

    const error = validateField('joiningDate', isoDate);
    setErrors(prev => ({ ...prev, joiningDate: error }));
  };

  const handleDobChange = (isoDate) => {
    setFormData(prev => ({ ...prev, dob: isoDate }));
    setTouched(prev => ({ ...prev, dob: true }));

    const error = validateField('dob', isoDate);
    setErrors(prev => ({ ...prev, dob: error }));
  };

  const handleImageUpload = async (file) => {
    if (!file) return false;

    if (file.size > MAX_FILE_SIZE) {
      showWarningToast('File size must be less than 5MB');
      return false;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showWarningToast('Only JPEG, PNG, GIF, and WEBP files are allowed');
      return false;
    }

    const reader = new FileReader();
    reader.onloadend = () => setPreviewImage(reader.result);
    reader.readAsDataURL(file);

    try {
      const uploaded = await uploadToS3(file);
      setFormData(prev => ({
        ...prev,
        profileImage: uploaded.key,
        imageKey: uploaded.key
      }));
      showSuccessToast('Image uploaded successfully!');
      return true;
    } catch (error) {
      console.error('Upload error:', error);
      showErrorToast('Failed to upload image. Please try again.');
      setPreviewImage(null);
      return false;
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) handleImageUpload(file);
  };

  const removeImage = () => {
    setPreviewImage(null);
    setFormData(prev => ({ ...prev, profileImage: null, imageKey: '' }));
    showSuccessToast('Image removed');
  };

  const prepareDoctorData = () => {
    const consultingOneArray = [];
    const consultingTwoArray = [];

    Object.entries(formData.weeklySchedule).forEach(([day, schedule]) => {
      if (schedule.hasBreak) {
        consultingTwoArray.push({
          day,
          morning_session: {
            open: schedule.morningOpen,
            close: schedule.morningClose,
          },
          evening_session: {
            open: schedule.eveningOpen,
            close: schedule.eveningClose,
          },
          is_holiday: schedule.isHoliday === true,
          has_break: true,
        });
      } else {
        consultingOneArray.push({
          day,
          opening_time: schedule.morningOpen,
          closing_time: schedule.morningClose,
          is_holiday: schedule.isHoliday === true,
        });
      }
    });

    const doctorData = {
      email: formData.email,
      password: formData.password,
      phone: formData.phoneNumber,
      joiningDate: formData.joiningDate,
      dob: formData.dob,
      gender: formData.gender?.toLowerCase(),
      knowLanguages: formData.knownLanguages,
      qualification: formData.qualification,

      // ✅ Address with localArea
      address: {
        country: formData.countryName,
        state: formData.stateName,
        district: formData.district,
        localArea: formData.localArea,
        place: formData.place || "",
        pincode: formData.pincode ? Number(formData.pincode) : "",
      },

      firstName: formData.firstName,
      lastName: formData.lastName,
      fees: Number(formData.fees),
      department: formData.department,
      specialist: formData.specialist || "",

      consultingOne: consultingOneArray,
      consultingTwo: consultingTwoArray,

      bookingOpen: formData.bookingOpen,
      displayName:
        formData.displayName ||
        `${formData.firstName} ${formData.lastName}`,
      experience: formData.experience,
      profileImage: formData.profileImage || undefined,
      imageKey: formData.imageKey || undefined,
      roleId: Number(formData.roleId),
      hospitalName: hospitalName,
      hospitalId: hospitalId,
    };

    if (formData.registrationNumber) {
      doctorData.regNo = formData.registrationNumber;
    }

    if (formData.appointmentCount && formData.appointmentCount !== '') {
      doctorData.appoimentCount = Number(formData.appointmentCount);
    }

    if (
      formData.outDoorConsultingOpen &&
      formData.outDoorConsultingClose &&
      formData.outDoorConsultingPlace
    ) {
      doctorData.outDoorConsulting = {
        time: {
          open: formData.outDoorConsultingOpen,
          close: formData.outDoorConsultingClose,
        },
        place: formData.outDoorConsultingPlace,
      };
    }

    return doctorData;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!hospitalId) {
      showErrorToast('❌ Hospital ID not found. Please try again.');
      return;
    }

    const touchedFields = {};
    [...REQUIRED_FIELDS, 'localArea', 'pincode'].forEach(field => touchedFields[field] = true);
    setTouched(touchedFields);

    if (validateForm()) {
      setIsSubmitting(true);

      try {
        const doctorData = prepareDoctorData();
        const roleId = Number(formData.roleId);
        const selectedRoleName = getRoleNameById(roleId);

        const result = await addNewDoctor(doctorData).unwrap();
        const doctor = result.data || result;

        if (doctor?.id && roleId) {
          const payload = {
            hospitalId: Number(hospitalId),
            roleId: roleId,
            userType: "doctor",
            doctorIds: [
              {
                id: Number(doctor.id),
                roleId: roleId
              }
            ]
          };
          await assignPermissions(payload).unwrap();
        }

        showSuccessToast(
          `Dr. ${formData.firstName} ${formData.lastName} has been added with role ${selectedRoleName}!`
        );

        setTimeout(() => {
          navigate(`/super-admin/hospitals/${hospitalId}/doctors`);
        }, 2000);

      } catch (error) {
        console.error("Error adding doctor:", error);

        if (error.status === 409) {
          showErrorToast(
            'Email already exists! Please use a different email address.'
          );
        } else if (error.data?.error?.details?.length) {
          const validationMessages = error.data.error.details
            .map(detail => detail.message)
            .filter(Boolean);

          showErrorToast(`❌ ${validationMessages.join(', ')}`);
        } else if (error.data?.error?.message) {
          showErrorToast(`❌ ${error.data.error.message}`);
        } else if (error.data?.message) {
          showErrorToast(`❌ ${error.data.message}`);
        } else {
          showErrorToast('Failed to add doctor. Please try again.');
        }
      } finally {
        setIsSubmitting(false);
      }
    } else {
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        showWarningToast(`Please fix the ${firstErrorField.replace(/([A-Z])/g, ' $1').toLowerCase()} field`);
      }
    }
  };

  const handleGoBack = () => {
    navigate(`/super-admin/hospitals/${hospitalId}/doctors`);
  };

  if (!hospitalId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-lg">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Hospital ID Not Found</h2>
          <p className="text-gray-600 mb-4">
            Please go back and try again.
          </p>
          <Button
            variant="primary"
            onClick={() => navigate('/super-admin/hospitals')}
          >
            Go to Hospitals
          </Button>
        </div>
      </div>
    );
  }

  if (rolesLoading) {
    return <AddDoctorSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Button variant="ghost" size="sm" onClick={handleGoBack} className="p-2">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Add New Doctor</h1>
              <p className="text-sm text-gray-500 mt-1">Create a new doctor profile in the system</p>
              {hospitalId && (
                <p className="text-xs text-blue-600 mt-1">Hospital ID: {hospitalId}</p>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <div className="border-b border-gray-200 px-6">
              <nav className="-mb-px flex space-x-8">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {activeTab === 'basic' && (
              <div className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center border-2 border-gray-200 overflow-hidden shadow-sm">
                        {previewImage ? (
                          <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <Image className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      {previewImage && (
                        <button type="button" onClick={removeImage} className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm">
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Profile Image</label>
                    <div>
                      <input id="profileImageInput" type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleFileSelect} className="hidden" />
                      <Button type="button" variant="outline" onClick={() => document.getElementById('profileImageInput').click()} className="inline-flex items-center gap-2">
                        <Upload className="h-4 w-4" /> Upload Image
                      </Button>
                      <p className="text-xs text-gray-400 mt-2">JPEG, PNG, GIF, WEBP accepted. Max 5MB</p>
                    </div>
                  </div>
                </div>

                <div className={GRID_CLASS}>
                  <Input label="First Name" name="firstName" icon={User} placeholder="Enter first name" value={formData.firstName} onChange={handleChange} onBlur={handleBlur} error={errors.firstName} touched={touched.firstName} required />
                  <Input label="Last Name" name="lastName" icon={User} placeholder="Enter last name" value={formData.lastName} onChange={handleChange} onBlur={handleBlur} error={errors.lastName} touched={touched.lastName} required />
                </div>

                <div className={GRID_CLASS}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Joining Date <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10 pointer-events-none" />
                      <DatePicker
                        value={formData.joiningDate}
                        onChange={handleJoiningDateChange}
                        mode="any"
                        placeholder="DD/MM/YYYY"
                        className={`w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:border-transparent ${
                          errors.joiningDate && touched.joiningDate
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                      />
                    </div>
                    {errors.joiningDate && touched.joiningDate && (
                      <p className="text-sm text-red-600 mt-1">{errors.joiningDate}</p>
                    )}
                  </div>
                  <Input label="Experience (years)" name="experience" icon={Briefcase} placeholder="e.g., 5" value={formData.experience} onChange={handleChange} onBlur={handleBlur} error={errors.experience} touched={touched.experience} required />
                </div>

                <div className={GRID_CLASS}>
                  <SearchableDropdown
                    label="Department"
                    options={departmentOptions}
                    value={formData.department}
                    onChange={handleDepartmentChange}
                    placeholder={isLoadingSpecialities ? "Loading departments..." : "Search for a department..."}
                    icon={Briefcase}
                    required={true}
                    isLoading={isLoadingSpecialities}
                    getOptionLabel={(option) => option.name}
                    getOptionValue={(option) => option.value}
                    optionKey={(option) => option.id}
                  />
                  {touched.department && errors.department && (
                    <p className="text-sm text-red-600 -mt-4">{errors.department}</p>
                  )}

                  <Input
                    label="Specialist"
                    name="specialist"
                    icon={IdCard}
                    placeholder="e.g., Cardiologist (Optional)"
                    value={formData.specialist}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.specialist}
                    touched={touched.specialist}
                  />
                </div>

                <div className="md:col-span-2">
                  <CustomSelect
                    label="Assign Role"
                    icon={Shield}
                    placeholder="Select a role"
                    value={formData.roleId}
                    options={roleOptions}
                    onChange={(value) => {
                      setFormData(prev => ({ ...prev, roleId: value }));
                      setTouched(prev => ({ ...prev, roleId: true }));
                      setErrors(prev => ({ ...prev, roleId: validateField('roleId', value) }));
                    }}
                    error={errors.roleId}
                    touched={touched.roleId}
                    required
                  />
                  {formData.roleId && (
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(formData.roleId)}`}>
                        {getRoleNameById(formData.roleId)}
                      </span>
                    </div>
                  )}
                  {rolesList && rolesList.length === 0 && !rolesLoading && (
                    <p className="mt-1 text-xs text-yellow-600">
                      ⚠️ No roles found. Please create roles in the system first.
                    </p>
                  )}
                </div>

                <div className={GRID_CLASS}>
                  <Input label="Qualification" name="qualification" icon={GraduationCap} placeholder="e.g., MBBS, MD" value={formData.qualification} onChange={handleChange} onBlur={handleBlur} error={errors.qualification} touched={touched.qualification} required />
                  <Input label="Fees ($)" name="fees" type="number" icon={DollarSign} placeholder="0.00" value={formData.fees} onChange={handleChange} onBlur={handleBlur} error={errors.fees} touched={touched.fees} required />
                </div>

                <div className={GRID_CLASS}>
                  <Input label="Phone Number" name="phoneNumber" icon={Phone} placeholder="+1 234 567 8900" value={formData.phoneNumber} onChange={handleChange} onBlur={handleBlur} error={errors.phoneNumber} touched={touched.phoneNumber} required />
                  <Input label="Email Address" name="email" type="email" icon={Mail} placeholder="doctor@example.com" value={formData.email} onChange={handleChange} onBlur={handleBlur} error={errors.email} touched={touched.email} required />
                </div>

                <div className={GRID_CLASS}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10 pointer-events-none" />
                      <DatePicker
                        value={formData.dob}
                        onChange={handleDobChange}
                        mode="dob"
                        placeholder="DD/MM/YYYY"
                        className={`w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:border-transparent ${
                          errors.dob && touched.dob
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                      />
                    </div>
                    {errors.dob && touched.dob && (
                      <p className="text-sm text-red-600 mt-1">{errors.dob}</p>
                    )}
                  </div>

                  <CustomSelect
                    label="Gender"
                    icon={Users}
                    placeholder="Select gender"
                    value={formData.gender}
                    options={GENDER_OPTIONS}
                    onChange={(value) => {
                      setFormData(prev => ({ ...prev, gender: value }));
                      setTouched(prev => ({ ...prev, gender: true }));
                      setErrors(prev => ({ ...prev, gender: validateField('gender', value) }));
                    }}
                    error={errors.gender}
                    touched={touched.gender}
                    required
                  />
                </div>

                <div className={GRID_CLASS}>
                  <Input label="Registration Number" name="registrationNumber" icon={IdCard} placeholder="Medical license number" value={formData.registrationNumber} onChange={handleChange} onBlur={handleBlur} error={errors.registrationNumber} touched={touched.registrationNumber} required />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Known Languages <span className="text-red-500">*</span>
                  </label>

                  {formData.knownLanguages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.knownLanguages.map(lang => (
                        <span key={lang} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm">
                          {getLanguageLabel(lang)}
                          <button type="button" onClick={() => removeLanguage(lang)}>
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                      className={`w-full px-3 py-2 text-left border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between ${
                        errors.knownLanguages && touched.knownLanguages ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <span>{formData.knownLanguages.length === 0 ? 'Select languages' : `${formData.knownLanguages.length} language(s) selected`}</span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${isLanguageDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isLanguageDropdownOpen && (
                      <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                        {LANGUAGE_OPTIONS.map(lang => (
                          <label key={lang.value} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.knownLanguages.includes(lang.value)}
                              onChange={() => handleLanguageSelect(lang.value)}
                              className="h-4 w-4 text-blue-600 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">{lang.label}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  {touched.knownLanguages && errors.knownLanguages && <p className="text-sm text-red-600">{errors.knownLanguages}</p>}
                </div>

                <Textarea label="About" name="about" rows={3} placeholder="Write a brief description..." value={formData.about} onChange={handleChange} />

                {/* ✅ REPLACED: Address Information with Pincode API */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h3>
                  <div className="space-y-5">
                    {/* Country (fixed India) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Country
                      </label>
                      <div className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-100 flex justify-between">
                        <span>🇮🇳 India</span>
                        <span className="text-green-600 font-medium text-sm">✓ Default</span>
                      </div>
                    </div>

                    {/* Pincode */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pincode <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formData.pincode}
                          onChange={(e) => handlePincodeChange(e.target.value)}
                          onBlur={() => setTouched(prev => ({ ...prev, pincode: true }))}
                          placeholder="Enter 6 digit pincode"
                          maxLength={6}
                          className={`w-full pl-10 pr-10 py-2 rounded-lg border ${
                            errors.pincode && touched.pincode ? 'border-red-500' : 'border-gray-300'
                          } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
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
                        Enter pincode to automatically find your location.
                      </p>
                      {isPincodeLoading && (
                        <p className="text-xs text-blue-600 mt-2">Finding your location...</p>
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

                    {/* State (read-only, auto-filled) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          value={formData.stateName}
                          readOnly
                          placeholder="Automatically detected state"
                          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-gray-100 text-gray-600"
                        />
                      </div>
                      {touched.stateName && errors.stateName && (
                        <p className="text-sm text-red-600 mt-1">{errors.stateName}</p>
                      )}
                    </div>

                    {/* District (read-only, auto-filled) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        District <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          value={formData.district}
                          readOnly
                          placeholder="Automatically detected district"
                          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-gray-100 text-gray-600"
                        />
                      </div>
                      {touched.district && errors.district && (
                        <p className="text-sm text-red-600 mt-1">{errors.district}</p>
                      )}
                    </div>

                    {/* Local Area / Place (post offices dropdown) */}
                    <SearchableCityDropdown
                      label="Local Area / Place"
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
                          : 'Select your local area'
                      }
                      required={true}
                      disabled={postOffices.length === 0}
                      error={errors.localArea}
                      touched={touched.localArea}
                    />

                    {/* Street Address / Place */}
                    <div className={GRID_CLASS}>
                      <Input label="Street Address / Place" name="place" placeholder="Place/Locality" value={formData.place} onChange={handleChange} />
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Details</h3>
                  <div className={GRID_CLASS}>
                    <Input label="Display Name" name="displayName" icon={User} placeholder="How name appears on profile" value={formData.displayName} onChange={handleChange} onBlur={handleBlur} error={errors.displayName} touched={touched.displayName} required />

                    <div className="relative">
                      <Input label="Password" name="password" type={showPassword ? "text" : "password"} required icon={Lock} placeholder="Create password" value={formData.password} onChange={handleChange} onBlur={handleBlur} error={errors.password} touched={touched.password} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-9 text-gray-400">
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                      {formData.password && !errors.password && (
                        <p className="text-xs text-green-600 mt-1">✓ Password is strong</p>
                      )}
                      {formData.password && errors.password && (
                        <p className="text-xs text-red-600 mt-1">{errors.password}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        Password must contain: 8+ chars, uppercase, lowercase, number & special character
                      </p>
                    </div>

                    <div className="relative">
                      <Input label="Confirm Password" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} required icon={Lock} placeholder="Confirm password" value={formData.confirmPassword} onChange={handleChange} onBlur={handleBlur} error={errors.confirmPassword} touched={touched.confirmPassword} />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-9 text-gray-400">
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'professional' && (
              <div className="p-6 space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Consulting Hours</h3>

                <div className="space-y-4">
                  {WEEK_DAYS.map((day) => (
                    <DayScheduleRow
                      key={day.key}
                      day={day.label}
                      schedule={formData.weeklySchedule[day.key]}
                      onUpdate={(newSchedule) => updateScheduleForDay(day.key, newSchedule)}
                    />
                  ))}
                </div>

                <div className="border border-gray-200 rounded-lg overflow-hidden mt-6">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h3 className="text-md font-semibold text-gray-900 flex items-center gap-2">
                      <Home className="h-5 w-5 text-blue-600" />
                      Out Door Consulting
                    </h3>
                  </div>

                  <div className="p-5 space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Consulting Time
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Open Time</label>
                          <input
                            type="time"
                            name="outDoorConsultingOpen"
                            value={formData.outDoorConsultingOpen}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Close Time</label>
                          <input
                            type="time"
                            name="outDoorConsultingClose"
                            value={formData.outDoorConsultingClose}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Consulting Place
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          name="outDoorConsultingPlace"
                          placeholder="Enter consulting location"
                          value={formData.outDoorConsultingPlace}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Booking Status
                      </label>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Booking Availability</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Allow patients to book appointments with this doctor
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, bookingOpen: !prev.bookingOpen }))}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                              formData.bookingOpen ? 'bg-blue-600' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                formData.bookingOpen ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                        <div className="mt-3">
                          {formData.bookingOpen ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-xs font-medium">Bookings Open</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-red-600">
                              <XCircle className="h-4 w-4" />
                              <span className="text-xs font-medium">Bookings Closed</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end gap-3 rounded-b-lg">
              <Button variant="outline" onClick={handleGoBack}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={isSubmitting} loading={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Doctor'}
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </div>
  );
};

export default AddDoctor;