// src/components/Doctor/EditDoctor.jsx
import React, { useState, useEffect, useRef, Suspense, lazy, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  User, Mail, Phone, Calendar, MapPin, Lock, Image, 
  DollarSign, IdCard, AlertCircle, ArrowLeft, Upload, X, GraduationCap,
  Building, Clock, Sun, Moon, Home, Video, CheckCircle, XCircle, ChevronDown, Eye, EyeOff, Briefcase, Users, Power, Shield
} from 'lucide-react';
import { 
  Button, Input, Select, Textarea, Card, Alert, Loader 
} from '../ui';
import { showUpdateToast, showErrorToast, showWarningToast, showSuccessToast } from '../ui/Toast';
import {
  useGetDoctorByIdQuery,
  useUpdateDoctorMutation,
  useGetSpecialitiesQuery
} from "../../../app/service/doctorApi";
import { useAssignPermissionsMutation } from '../../../app/service/rolePermission';
import { useGetRolesQuery } from '../../../app/service/role';
import { getHospitalId, getAuthUser } from '../../utils/auth';
import { Country, State, City } from 'country-state-city';
import { uploadToS3, S3_BASE_URL } from '../../../app/service/S3';

const DeleteDoctor = lazy(() => import("./DeleteDoctor"));
const AppointmentManagement = lazy(() => import("./AppointmentManagment"));

const getFullImageUrl = (imageKey) => {
  if (!imageKey) return null;
  if (imageKey.startsWith("http")) return imageKey;
  return `${S3_BASE_URL}/${encodeURIComponent(imageKey)}`;
};

const LazyProfileImage = ({ imageKey, firstName, onLoad, onError }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!imageKey) {
      setIsLoading(false);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setImageSrc(getFullImageUrl(imageKey));
            observer.disconnect();
          }
        });
      },
      { rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [imageKey]);

  return (
    <div ref={imgRef} className="w-full h-full">
      {isLoading && (
        <div className="w-full h-full bg-gray-200 animate-pulse rounded-full flex items-center justify-center">
          <span className="text-gray-400 text-2xl font-medium">
            {firstName ? firstName.charAt(0).toUpperCase() : 'D'}
          </span>
        </div>
      )}
      {imageSrc && (
        <img
          src={imageSrc}
          alt="Profile"
          className="w-full h-full object-cover rounded-full"
          onLoad={() => { setIsLoading(false); onLoad?.(); }}
          onError={(e) => { setIsLoading(false); onError?.(e); }}
        />
      )}
      {!imageSrc && !isLoading && (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-full">
          <span className="text-gray-400 text-2xl font-medium">
            {firstName ? firstName.charAt(0).toUpperCase() : 'D'}
          </span>
        </div>
      )}
    </div>
  );
};

const FormSectionSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-8 w-40 bg-gray-200 rounded"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-24 bg-gray-200 rounded"></div>
          <div className="h-10 w-full bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  </div>
);

const ProfileSectionSkeleton = () => (
  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-4 bg-gray-50 rounded-lg animate-pulse">
    <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
    <div className="flex-1 w-full">
      <div className="h-5 w-32 bg-gray-200 rounded mb-2"></div>
      <div className="h-10 w-40 bg-gray-200 rounded"></div>
      <div className="h-3 w-48 bg-gray-200 rounded mt-2"></div>
    </div>
  </div>
);

const SearchableDropdownComponent = ({ 
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

  const filteredOptions = useMemo(() => {
    return options.filter(option => {
      const label = getOptionLabel(option).toLowerCase();
      return label.includes(searchTerm.toLowerCase());
    });
  }, [options, searchTerm, getOptionLabel]);

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
    onChange(String(getOptionValue(option)), String(getOptionLabel(option)));
    setSearchTerm("");
    setIsOpen(false);
  };

  const displayValue = () => {
    if (!value) return "";
    const selected = options.find(opt => String(getOptionValue(opt)) === String(value));
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

const DayScheduleRowComponent = React.memo(({ day, schedule, onUpdate }) => {
  const [localSchedule, setLocalSchedule] = useState(schedule);

  useEffect(() => {
    setLocalSchedule(schedule);
  }, [schedule]);

  const handleChange = useCallback((field, value) => {
    const updated = { ...localSchedule, [field]: value };
    setLocalSchedule(updated);
    onUpdate(updated);
  }, [localSchedule, onUpdate]);

  const formatTimeDisplay = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <div className={`border rounded-lg p-4 mb-4 ${localSchedule.isHoliday ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
        <h4 className="text-lg font-semibold text-gray-900">{day}</h4>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={localSchedule.isHoliday || false}
            onChange={(e) => handleChange('isHoliday', e.target.checked)}
            className="h-4 w-4 text-red-500 focus:ring-red-500 rounded"
          />
          <span className={`text-sm ${localSchedule.isHoliday ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
            Holiday
          </span>
        </label>
      </div>

      {!localSchedule.isHoliday && (
        <>
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Sun className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700">Morning Session</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 pl-6">
              <div className="flex-1 min-w-[120px]">
                <input
                  type="time"
                  value={localSchedule.morningOpen || '09:00'}
                  onChange={(e) => handleChange('morningOpen', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">{formatTimeDisplay(localSchedule.morningOpen)}</p>
              </div>
              <span className="text-gray-400">to</span>
              <div className="flex-1 min-w-[120px]">
                <input
                  type="time"
                  value={localSchedule.morningClose || '17:00'}
                  onChange={(e) => handleChange('morningClose', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">{formatTimeDisplay(localSchedule.morningClose)}</p>
              </div>
            </div>
          </div>

          {localSchedule.hasBreak && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Moon className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Evening Session</span>
              </div>
              <div className="flex flex-wrap items-center gap-3 pl-6">
                <div className="flex-1 min-w-[120px]">
                  <input
                    type="time"
                    value={localSchedule.eveningOpen || '16:00'}
                    onChange={(e) => handleChange('eveningOpen', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">{formatTimeDisplay(localSchedule.eveningOpen)}</p>
                </div>
                <span className="text-gray-400">to</span>
                <div className="flex-1 min-w-[120px]">
                  <input
                    type="time"
                    value={localSchedule.eveningClose || '20:00'}
                    onChange={(e) => handleChange('eveningClose', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">{formatTimeDisplay(localSchedule.eveningClose)}</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-3 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={localSchedule.hasBreak || false}
                onChange={(e) => handleChange('hasBreak', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
              />
              <span className="text-sm text-gray-700">Has Break Between Sessions</span>
            </label>
          </div>
        </>
      )}

      {localSchedule.isHoliday && (
        <div className="text-center py-3">
          <p className="text-sm text-gray-500">📅 Closed for the day</p>
        </div>
      )}
    </div>
  );
});

const CenteredLoader = ({ text = "Loading..." }) => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">{text}</p>
    </div>
  </div>
);

const StatusToggle = React.memo(({ status, onToggle, disabled }) => (
  <div className="border border-gray-200 rounded-lg overflow-hidden">
    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
      <h3 className="text-md font-semibold text-gray-900 flex items-center gap-2">
        <Power className="h-5 w-5 text-blue-600" /> 
        Doctor Status
      </h3>
    </div>
    <div className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900">
            {status ? 'Active' : 'Inactive'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {status 
              ? 'Doctor is currently active and can receive appointments' 
              : 'Doctor is inactive and will not appear in search results'}
          </p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          className={`
            relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
            ${status ? 'bg-green-500' : 'bg-gray-300'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <span
            className={`
              inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 shadow-md
              ${status ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
        </button>
      </div>
    </div>
  </div>
));

const EditDoctor = () => {
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  const doctorId = paramId ? paramId.replace(/[^0-9]/g, '') : '';
  
  const hospitalId = getHospitalId();
  const authUser = getAuthUser();
  const hospitalName = authUser?.name || '';
  
  const [assignPermissions] = useAssignPermissionsMutation();
  
  const { data: rolesData, isLoading: rolesLoading } = useGetRolesQuery({
    hospitalId,
    limit: 100
  });
  
  const rolesList = [
    ...(rolesData?.admin || []).filter(role => role.id === 2),
    ...(rolesData?.data || []).filter(role => role.hospitalId === Number(hospitalId))
  ];
  
  const { data: specialitiesData, isLoading: isLoadingSpecialities } = useGetSpecialitiesQuery();
  
  const departmentOptions = useMemo(() => {
    const rows = specialitiesData?.data || [];
    return rows.map((spec) => ({
      id: spec.id,
      name: spec.name.toUpperCase(),
      value: spec.name.toUpperCase(),
      label: spec.name.toUpperCase()
    }));
  }, [specialitiesData]);
  
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('basic');
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formInitialized, setFormInitialized] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const [formData, setFormData] = useState({
    profileImage: null,
    imageUrl: null,
    imageKey: null,
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
    countryCode: '',
    countryName: '',
    stateCode: '',
    stateName: '',
    district: '',
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
    weeklySchedule: {},
    outDoorConsultingOpen: '',
    outDoorConsultingClose: '',
    outDoorConsultingPlace: '',
    bookingOpen: true,
    isActive: true
  });

  const [errors, setErrors] = useState({});

  const { data: doctorResponse, isLoading, error } = useGetDoctorByIdQuery(doctorId, {
    skip: !doctorId
  });
  
  const [updateDoctor] = useUpdateDoctorMutation();

  const doctor = doctorResponse?.data?.doctor || doctorResponse?.doctor || doctorResponse?.data || doctorResponse;

  const countries = Country.getAllCountries();
  const [availableStates, setAvailableStates] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);

  const languageOptions = [
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
    { value: 'urd', label: 'Urdu' }
  ];

  const weekDays = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ];

  const tabs = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'professional', label: 'Professional Info' }
  ];

  const getDefaultSchedule = () => ({
    monday: { isHoliday: false, hasBreak: true, morningOpen: '09:00', morningClose: '12:00', eveningOpen: '16:00', eveningClose: '20:00' },
    tuesday: { isHoliday: false, hasBreak: false, morningOpen: '09:00', morningClose: '18:00', eveningOpen: '16:00', eveningClose: '20:00' },
    wednesday: { isHoliday: false, hasBreak: false, morningOpen: '09:00', morningClose: '18:00', eveningOpen: '16:00', eveningClose: '20:00' },
    thursday: { isHoliday: false, hasBreak: true, morningOpen: '09:00', morningClose: '12:00', eveningOpen: '16:00', eveningClose: '20:00' },
    friday: { isHoliday: false, hasBreak: true, morningOpen: '09:00', morningClose: '12:00', eveningOpen: '16:00', eveningClose: '20:00' },
    saturday: { isHoliday: false, hasBreak: false, morningOpen: '09:00', morningClose: '14:00', eveningOpen: '16:00', eveningClose: '20:00' },
    sunday: { isHoliday: true, hasBreak: false, morningOpen: '10:00', morningClose: '13:00', eveningOpen: '16:00', eveningClose: '20:00' }
  });

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

  useEffect(() => {
    if (doctor && doctor.id && !formInitialized) {
      const imageKey = doctor?.imageUrl || doctor?.profileImage || doctor?.image || null;
      
      const country = countries.find(c => 
        c.name?.toLowerCase() === doctor.address?.country?.toLowerCase()
      );
      
      const stateList = State.getStatesOfCountry(country?.isoCode || '');
      const state = stateList.find(s => 
        s.name?.toLowerCase() === doctor.address?.state?.toLowerCase()
      );
      
      const schedule = getDefaultSchedule();
      
      if (doctor.consultingOne && Array.isArray(doctor.consultingOne)) {
        doctor.consultingOne.forEach(item => {
          const dayKey = item.day?.toLowerCase();
          if (schedule[dayKey]) {
            schedule[dayKey] = {
              ...schedule[dayKey],
              isHoliday: item.is_holiday || false,
              hasBreak: false,
              morningOpen: item.opening_time || schedule[dayKey].morningOpen,
              morningClose: item.closing_time || schedule[dayKey].morningClose,
            };
          }
        });
      }
      
      if (doctor.consultingTwo && Array.isArray(doctor.consultingTwo)) {
        doctor.consultingTwo.forEach(item => {
          const dayKey = item.day?.toLowerCase();
          if (schedule[dayKey]) {
            schedule[dayKey] = {
              ...schedule[dayKey],
              isHoliday: item.is_holiday || false,
              hasBreak: item.has_break || true,
              morningOpen: item.morning_session?.open || schedule[dayKey].morningOpen,
              morningClose: item.morning_session?.close || schedule[dayKey].morningClose,
              eveningOpen: item.evening_session?.open || schedule[dayKey].eveningOpen,
              eveningClose: item.evening_session?.close || schedule[dayKey].eveningClose,
            };
          }
        });
      }
      
      setFormData({
        profileImage: imageKey,
        imageUrl: imageKey,
        imageKey: imageKey,
        firstName: doctor.firstName || "",
        lastName: doctor.lastName || "",
        department: doctor.department?.toUpperCase() || "",
        specialist: doctor.specialist || "",
        qualification: doctor.qualification || "",
        fees: doctor.fees || "",
        phoneNumber: doctor.phone || "",
        email: doctor.email || "",
        dob: doctor.dob ? new Date(doctor.dob).toISOString().split('T')[0] : "",
        gender: doctor.gender ? doctor.gender.charAt(0).toUpperCase() + doctor.gender.slice(1) : "",
        registrationNumber: doctor.regNo || doctor.registrationNumber || "",
        knownLanguages: doctor.knowLanguages || [],
        about: doctor.about || "",
        place: doctor.address?.place || "",
        countryCode: country?.isoCode || '',
        countryName: doctor.address?.country || "",
        stateCode: state?.isoCode || '',
        stateName: doctor.address?.state || "",
        district: doctor.address?.district || "",
        pincode: doctor.address?.pincode || "",
        displayName: doctor.displayName || "",
        userName: doctor.userName || "",
        password: "",
        confirmPassword: "",
        joiningDate: doctor.joiningDate ? new Date(doctor.joiningDate).toISOString().split('T')[0] : "",
        experience: doctor.experience || "",
        appointmentCount: doctor.appointmentCount || doctor.appoimentCount || "",
        roleId: doctor.roleId || "",
        weeklySchedule: schedule,
        outDoorConsultingOpen: doctor.outDoorConsulting?.time?.open || "",
        outDoorConsultingClose: doctor.outDoorConsulting?.time?.close || "",
        outDoorConsultingPlace: doctor.outDoorConsulting?.place || "",
        bookingOpen: doctor.bookingOpen !== undefined ? doctor.bookingOpen : true,
        isActive: doctor.isActive ?? true
      });
      
      if (country?.isoCode) {
        setAvailableStates(State.getStatesOfCountry(country.isoCode));
        if (state?.isoCode) {
          setAvailableCities(City.getCitiesOfState(country.isoCode, state.isoCode));
        }
      }
      
      setFormInitialized(true);
    }
  }, [doctor, formInitialized, countries]);

  useEffect(() => {
    setFormInitialized(false);
    setFormData({
      profileImage: null,
      imageUrl: null,
      imageKey: null,
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
      countryCode: '',
      countryName: '',
      stateCode: '',
      stateName: '',
      district: '',
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
      weeklySchedule: getDefaultSchedule(),
      outDoorConsultingOpen: '',
      outDoorConsultingClose: '',
      outDoorConsultingPlace: '',
      bookingOpen: true,
      isActive: true
    });
    setPreviewImage(null);
    setImageLoaded(false);
  }, [doctorId]);

  const updateScheduleForDay = useCallback((day, newSchedule) => {
    setFormData(prev => ({
      ...prev,
      weeklySchedule: {
        ...prev.weeklySchedule,
        [day]: newSchedule
      }
    }));
  }, []);

  const validateImage = (file) => {
    if (!file) return '';
    if (file.size > 5 * 1024 * 1024) return 'File size must be less than 5MB';
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) return 'Only JPEG, PNG, GIF, and WEBP files are allowed';
    return '';
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    
    const imageError = validateImage(file);
    if (imageError) {
      setErrors(prev => ({ ...prev, profileImage: imageError }));
      showWarningToast(imageError);
      return;
    }
    
    setErrors(prev => ({ ...prev, profileImage: '' }));
    setUploadProgress(10);
    
    const reader = new FileReader();
    reader.onloadend = () => setPreviewImage(reader.result);
    reader.readAsDataURL(file);
    
    try {
      setUploadProgress(30);
      
      const uploaded = await uploadToS3(
        file, 
        formData.imageKey || null,
        Number(doctorId),
        "doctor"
      );
      
      setUploadProgress(100);
      
      setFormData(prev => ({
        ...prev,
        imageUrl: uploaded.key,
        profileImage: uploaded.key,
        imageKey: uploaded.key
      }));
      
      setTimeout(() => setUploadProgress(0), 1000);
      showSuccessToast('Image uploaded successfully!');
    } catch (error) {
      console.error("Upload error:", error);
      setUploadProgress(0);
      setErrors(prev => ({ ...prev, profileImage: 'Failed to upload image. Please try again.' }));
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
    setImageLoaded(false);
    setUploadProgress(0);
    setFormData(prev => ({ ...prev, profileImage: null, imageUrl: null, imageKey: '' }));
    setErrors(prev => ({ ...prev, profileImage: '' }));
    showSuccessToast('Image removed');
  };

  const handleCountryChange = useCallback((code, name) => {
    setFormData(prev => ({
      ...prev,
      countryCode: String(code),
      countryName: String(name),
      stateCode: '',
      stateName: '',
      district: ''
    }));
    setAvailableStates(State.getStatesOfCountry(code));
    setAvailableCities([]);
  }, []);

  const handleStateChange = useCallback((code, name) => {
    setFormData(prev => ({
      ...prev,
      stateCode: String(code),
      stateName: String(name),
      district: ''
    }));
    setAvailableCities(City.getCitiesOfState(formData.countryCode, code));
  }, [formData.countryCode]);

  const handleCityChange = useCallback((value, name) => {
    setFormData(prev => ({
      ...prev,
      district: String(name)
    }));
  }, []);

  const handleLanguageSelect = useCallback((languageValue) => {
    setFormData(prev => {
      const currentLanguages = [...prev.knownLanguages];
      if (currentLanguages.includes(languageValue)) {
        return { ...prev, knownLanguages: currentLanguages.filter(lang => lang !== languageValue) };
      } else {
        return { ...prev, knownLanguages: [...currentLanguages, languageValue] };
      }
    });
  }, []);

  const removeLanguage = useCallback((languageValue) => {
    setFormData(prev => ({
      ...prev,
      knownLanguages: prev.knownLanguages.filter(lang => lang !== languageValue)
    }));
  }, []);

  const getLanguageLabel = (value) => {
    const lang = languageOptions.find(l => l.value === value);
    return lang ? lang.label : value;
  };

  const handleFieldChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const toggleDoctorStatus = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      isActive: !prev.isActive
    }));
    showSuccessToast(`Doctor status changed to ${!formData.isActive ? 'Active' : 'Inactive'}`);
  }, [formData.isActive]);

  const toggleBookingStatus = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      bookingOpen: !prev.bookingOpen
    }));
    showSuccessToast(`Booking status changed to ${!formData.bookingOpen ? 'Open' : 'Closed'}`);
  }, [formData.bookingOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);

      const roleId = Number(formData.roleId);
      const selectedRoleName = getRoleNameById(roleId);

      const updatedDoctorData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        department: formData.department,
        specialist: formData.specialist,
        qualification: formData.qualification,
        fees: Number(formData.fees),
        phone: formData.phoneNumber,
        email: formData.email,
        dob: formData.dob,
        gender: formData.gender?.toLowerCase(),
        regNo: formData.registrationNumber,
        knowLanguages: formData.knownLanguages,
        about: formData.about,
        displayName: formData.displayName,
        imageUrl: formData.imageUrl,
        profileImage: formData.profileImage,
        imageKey: formData.imageKey,
        experience: formData.experience,
        bookingOpen: formData.bookingOpen,
        joiningDate: formData.joiningDate,
        isActive: formData.isActive,
        roleId: roleId,
        hospitalName: hospitalName,
        address: {
          country: formData.countryName,
          state: formData.stateName,
          district: formData.district,
          place: formData.place,
          pincode: formData.pincode ? Number(formData.pincode) : null
        },
        consultingOne: Object.entries(formData.weeklySchedule)
          .filter(([_, schedule]) => !schedule.isHoliday && !schedule.hasBreak)
          .map(([day, schedule]) => ({
            day,
            opening_time: schedule.morningOpen,
            closing_time: schedule.morningClose,
            is_holiday: false,
          })),
        consultingTwo: Object.entries(formData.weeklySchedule)
          .filter(([_, schedule]) => !schedule.isHoliday && schedule.hasBreak)
          .map(([day, schedule]) => ({
            day,
            morning_session: {
              open: schedule.morningOpen,
              close: schedule.morningClose,
            },
            evening_session: {
              open: schedule.eveningOpen,
              close: schedule.eveningClose,
            },
            is_holiday: false,
            has_break: true,
          })),
      };

      if (formData.appointmentCount && formData.appointmentCount !== '') {
        updatedDoctorData.appoimentCount = Number(formData.appointmentCount);
      }

      if (formData.outDoorConsultingOpen && 
          formData.outDoorConsultingClose && 
          formData.outDoorConsultingPlace) {
        updatedDoctorData.outDoorConsulting = {
          time: {
            open: formData.outDoorConsultingOpen,
            close: formData.outDoorConsultingClose,
          },
          place: formData.outDoorConsultingPlace,
        };
      }

      if (formData.password) {
        updatedDoctorData.password = formData.password;
      }

      await updateDoctor({
        id: String(doctorId),
        updateDoctor: updatedDoctorData,
      }).unwrap();

      if (roleId) {
        const payload = {
          hospitalId: Number(hospitalId),
          roleId: roleId,
          userType: "doctor",
          doctorIds: [
            {
              id: Number(doctorId),
              roleId: roleId
            }
          ]
        };
        await assignPermissions(payload).unwrap();
      }

      showUpdateToast(`Dr. ${formData.firstName} ${formData.lastName} updated successfully with role ${selectedRoleName}!`);
      setTimeout(() => navigate("/doctors"), 1500);

    } catch (error) {
      console.error("Update Error:", error);
      showErrorToast(error.data?.message || "Failed to update doctor");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => navigate('/doctors');

  if (isLoading || rolesLoading) {
    return <CenteredLoader text="Loading doctor data..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 rounded-full h-20 w-20 flex items-center justify-center mx-auto">
            <AlertCircle className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mt-4">Error Loading Doctor</h2>
          <p className="text-gray-600 mt-2">There was an error loading the doctor data.</p>
          <Button variant="primary" onClick={() => navigate('/doctors')} className="mt-6">
            Back to Doctors List
          </Button>
        </div>
      </div>
    );
  }

  if (!doctor && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-yellow-100 rounded-full h-20 w-20 flex items-center justify-center mx-auto">
            <AlertCircle className="h-10 w-10 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mt-4">Doctor Not Found</h2>
          <p className="text-gray-600 mt-2">No doctor found with ID: {doctorId}</p>
          <Button variant="primary" onClick={() => navigate('/doctors')} className="mt-6">
            Back to Doctors List
          </Button>
        </div>
      </div>
    );
  }

  if (!formInitialized && doctor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mt-2"></div>
          </div>
          <ProfileSectionSkeleton />
          <div className="mt-6">
            <FormSectionSkeleton />
          </div>
        </div>
      </div>
    );
  }

  const isUploading = uploadProgress > 0 && uploadProgress < 100;

  return (
    <Suspense fallback={<CenteredLoader text="Loading page..." />}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Button variant="ghost" size="sm" onClick={handleGoBack} className="p-2">
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit Doctor</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Editing: {formData.firstName} {formData.lastName}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <Card>
              <div className="border-b border-gray-200 px-6">
                <nav className="-mb-px flex space-x-8">
                  {tabs.map((tab) => (
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
                            <img 
                              src={previewImage} 
                              alt="Profile" 
                              className="w-full h-full object-cover rounded-full"
                              onLoad={() => setImageLoaded(true)}
                            />
                          ) : (
                            <LazyProfileImage 
                              imageKey={formData.profileImage}
                              firstName={formData.firstName}
                              onLoad={() => setImageLoaded(true)}
                              onError={() => setImageLoaded(false)}
                            />
                          )}
                        </div>
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
                    </div>
                    <div className="flex-1 w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Profile Image</label>
                      <div>
                        <input id="profileImageInput" type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleFileSelect} className="hidden" />
                        <Button type="button" variant="outline" onClick={() => document.getElementById('profileImageInput').click()} className="inline-flex items-center gap-2" disabled={isSubmitting}>
                          <Upload className="h-4 w-4" /> Upload New Image
                        </Button>
                        <p className="text-xs text-gray-400 mt-2">JPEG, PNG, GIF, WEBP accepted. Max 5MB</p>
                      </div>
                      {isUploading && (
                        <div className="mt-2">
                          <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-[#1C62A0] transition-all duration-300 rounded-full" style={{ width: `${uploadProgress}%` }} />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Uploading... {uploadProgress}%</p>
                        </div>
                      )}
                      {errors.profileImage && <Alert type="error" message={errors.profileImage} className="mt-2" />}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Doctor ID:</span>
                      <span className="text-sm font-medium text-gray-900 bg-gray-100 px-2 py-1 rounded">
                        #{String(doctor?.id || doctorId).padStart(4, '0')}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input 
                      label="First Name" 
                      name="firstName" 
                      icon={User} 
                      placeholder="Enter first name" 
                      value={formData.firstName} 
                      onChange={(e) => handleFieldChange('firstName', e.target.value)} 
                      required 
                    />
                    <Input 
                      label="Last Name" 
                      name="lastName" 
                      icon={User} 
                      placeholder="Enter last name" 
                      value={formData.lastName} 
                      onChange={(e) => handleFieldChange('lastName', e.target.value)} 
                      required 
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input 
                      label="Joining Date" 
                      name="joiningDate" 
                      type="date" 
                      icon={Calendar} 
                      value={formData.joiningDate} 
                      onChange={(e) => handleFieldChange('joiningDate', e.target.value)} 
                    />
                    <Input 
                      label="Experience (years)" 
                      name="experience" 
                      icon={Briefcase} 
                      placeholder="e.g., 5" 
                      value={formData.experience} 
                      onChange={(e) => handleFieldChange('experience', e.target.value)} 
                      required 
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <SearchableDropdownComponent
                      label="Department"
                      options={departmentOptions}
                      value={formData.department}
                      onChange={(value, label) => handleFieldChange('department', value)}
                      placeholder={isLoadingSpecialities ? "Loading departments..." : "Search for a department..."}
                      icon={Briefcase}
                      required={true}
                      isLoading={isLoadingSpecialities}
                      getOptionLabel={(option) => option.name}
                      getOptionValue={(option) => option.value}
                      optionKey={(option) => option.id}
                    />
                    
                    <Input 
                      label="Specialist" 
                      name="specialist" 
                      icon={IdCard} 
                      placeholder="e.g., Cardiologist (Optional)" 
                      value={formData.specialist} 
                      onChange={(e) => handleFieldChange('specialist', e.target.value)} 
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assign Role <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Shield size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <select
                        name="roleId"
                        value={formData.roleId}
                        onChange={(e) => handleFieldChange('roleId', e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                      >
                        <option value="">Select a role</option>
                        {rolesList.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name || role.roleName}
                          </option>
                        ))}
                      </select>
                    </div>
                    {formData.roleId && (
                      <div className="mt-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(formData.roleId)}`}>
                          {getRoleNameById(formData.roleId)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input 
                      label="Qualification" 
                      name="qualification" 
                      icon={GraduationCap} 
                      placeholder="e.g., MBBS, MD" 
                      value={formData.qualification} 
                      onChange={(e) => handleFieldChange('qualification', e.target.value)} 
                      required 
                    />
                    <Input 
                      label="Fees ($)" 
                      name="fees" 
                      type="number" 
                      icon={DollarSign} 
                      placeholder="0.00" 
                      value={formData.fees} 
                      onChange={(e) => handleFieldChange('fees', e.target.value)} 
                      required 
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input 
                      label="Phone Number" 
                      name="phoneNumber" 
                      icon={Phone} 
                      placeholder="+1 234 567 8900" 
                      value={formData.phoneNumber} 
                      onChange={(e) => handleFieldChange('phoneNumber', e.target.value)} 
                      required 
                    />
                    <Input 
                      label="Email Address" 
                      name="email" 
                      type="email" 
                      icon={Mail} 
                      placeholder="doctor@example.com" 
                      value={formData.email} 
                      onChange={(e) => handleFieldChange('email', e.target.value)} 
                      required 
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input 
                      label="Date of Birth" 
                      name="dob" 
                      type="date" 
                      icon={Calendar} 
                      value={formData.dob} 
                      onChange={(e) => handleFieldChange('dob', e.target.value)} 
                      required 
                    />
                    <Select 
                      label="Gender" 
                      name="gender" 
                      options={['Male', 'Female', 'Other']} 
                      placeholder="Select Gender" 
                      value={formData.gender} 
                      onChange={(value) => handleFieldChange('gender', value)} 
                      required 
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input 
                      label="Registration Number" 
                      name="registrationNumber" 
                      icon={IdCard} 
                      placeholder="Medical license number" 
                      value={formData.registrationNumber} 
                      onChange={(e) => handleFieldChange('registrationNumber', e.target.value)} 
                    />
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
                        onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                        className={`w-full px-3 py-2 text-left border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between`}
                      >
                        <span className={formData.knownLanguages.length === 0 ? 'text-gray-400' : 'text-gray-900'}>
                          {formData.knownLanguages.length === 0 ? 'Select languages' : `${formData.knownLanguages.length} language(s) selected`}
                        </span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${isLanguageDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {isLanguageDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setIsLanguageDropdownOpen(false)} />
                          <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                            {languageOptions.map(lang => (
                              <label key={lang.value} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={formData.knownLanguages.includes(lang.value)}
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

                  <Textarea 
                    label="About" 
                    name="about" 
                    rows={3} 
                    placeholder="Write a brief description..." 
                    value={formData.about} 
                    onChange={(e) => handleFieldChange('about', e.target.value)} 
                  />

                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h3>
                    <div className="space-y-5">
                      <SearchableDropdownComponent
                        label="Country"
                        options={countries}
                        value={formData.countryCode}
                        onChange={handleCountryChange}
                        placeholder="Search for a country..."
                        icon={MapPin}
                        required={true}
                      />
                      
                      <SearchableDropdownComponent
                        label="State"
                        options={availableStates}
                        value={formData.stateCode}
                        onChange={handleStateChange}
                        placeholder="Search for a state..."
                        icon={MapPin}
                        disabled={!formData.countryCode}
                        required={true}
                      />

                      <SearchableDropdownComponent
                        label="District"
                        options={availableCities}
                        value={formData.district}
                        onChange={handleCityChange}
                        placeholder="Search for a district..."
                        icon={MapPin}
                        disabled={!formData.stateCode}
                        required={true}
                        getOptionLabel={(option) => option.name}
                        getOptionValue={(option) => option.name}
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <Input 
                          label="Place" 
                          name="place" 
                          placeholder="Place/Locality" 
                          value={formData.place} 
                          onChange={(e) => handleFieldChange('place', e.target.value)} 
                        />
                        <Input 
                          label="Pincode" 
                          name="pincode" 
                          placeholder="Postal code" 
                          value={formData.pincode} 
                          onChange={(e) => handleFieldChange('pincode', e.target.value)} 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <Input 
                        label="Display Name" 
                        name="displayName" 
                        icon={User} 
                        placeholder="How name appears on profile" 
                        value={formData.displayName} 
                        onChange={(e) => handleFieldChange('displayName', e.target.value)} 
                      />
                      
                      <div className="relative">
                        <Input 
                          label="New Password" 
                          name="password" 
                          type={showPassword ? "text" : "password"} 
                          icon={Lock} 
                          placeholder="Leave blank to keep current" 
                          value={formData.password} 
                          onChange={(e) => handleFieldChange('password', e.target.value)} 
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-9 text-gray-400 hover:text-gray-600">
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      
                      <div className="relative">
                        <Input 
                          label="Confirm New Password" 
                          name="confirmPassword" 
                          type={showConfirmPassword ? "text" : "password"} 
                          icon={Lock} 
                          placeholder="Confirm new password" 
                          value={formData.confirmPassword} 
                          onChange={(e) => handleFieldChange('confirmPassword', e.target.value)} 
                        />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-9 text-gray-400 hover:text-gray-600">
                          {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <StatusToggle 
                      status={formData.isActive} 
                      onToggle={toggleDoctorStatus}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'professional' && (
                <div className="p-6 space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Consulting Hours</h3>
                  
                  <div className="space-y-4">
                    {weekDays.map((day) => (
                      <DayScheduleRowComponent
                        key={day.key}
                        day={day.label}
                        schedule={formData.weeklySchedule[day.key] || { isHoliday: false, hasBreak: false, morningOpen: '09:00', morningClose: '17:00', eveningOpen: '', eveningClose: '' }}
                        onUpdate={(newSchedule) => updateScheduleForDay(day.key, newSchedule)}
                      />
                    ))}
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2 mt-6">
                    <Home className="h-5 w-5" /> Out Door Consulting
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Consulting Time</label>
                      <div className="grid grid-cols-2 gap-3">
                        <Input 
                          label="Open Time" 
                          name="outDoorConsultingOpen" 
                          type="time" 
                          value={formData.outDoorConsultingOpen} 
                          onChange={(e) => handleFieldChange('outDoorConsultingOpen', e.target.value)} 
                        />
                        <Input 
                          label="Close Time" 
                          name="outDoorConsultingClose" 
                          type="time" 
                          value={formData.outDoorConsultingClose} 
                          onChange={(e) => handleFieldChange('outDoorConsultingClose', e.target.value)} 
                        />
                      </div>
                    </div>
                    <Input 
                      label="Consulting Place" 
                      name="outDoorConsultingPlace" 
                      icon={MapPin} 
                      placeholder="Enter consulting location" 
                      value={formData.outDoorConsultingPlace} 
                      onChange={(e) => handleFieldChange('outDoorConsultingPlace', e.target.value)} 
                    />
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2 mt-6">
                    <Video className="h-5 w-5" /> Booking Status
                  </h3>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Booking Availability</label>
                        <p className="text-xs text-gray-500">Allow patients to book appointments with this doctor</p>
                      </div>
                      <button
                        type="button"
                        onClick={toggleBookingStatus}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          formData.bookingOpen ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.bookingOpen ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      {formData.bookingOpen ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600"><CheckCircle className="h-3 w-3" /> Bookings Open</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-red-600"><XCircle className="h-3 w-3" /> Bookings Closed</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end gap-3 rounded-b-lg">
                <Button variant="outline" onClick={handleGoBack}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={isSubmitting} loading={isSubmitting}>
                  {isSubmitting ? 'Updating...' : 'Update Doctor'}
                </Button>
              </div>
            </Card>
          </form>
        </div>
      </div>
    </Suspense>
  );
};

export default EditDoctor;