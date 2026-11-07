// src/components/Settings/Settings.jsx
import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  Input,
  Tabs
} from '../ui';
import CustomSelect from '../ui/CustomSelect';
import Security from './Security';
import Map from './Map';
import PrescriptionTemplate from './PrescriptionTemplate';
import { showSuccessToast, showWarningToast, showErrorToast } from '../ui/Toast';
import { Country, State, City } from 'country-state-city';
import { MapPin, ChevronDown, Clock, Save, X, Edit2, Plus, Minus, Sun } from 'lucide-react';
import { useGetHospitalByIdQuery, useUpdateHospitalMutation } from '../../../app/service/hospitalApi';
import { useAuth } from '../../context/AuthContext';
import HospitalReviews from "./HospitalReviews";
import { useGetCategoryQuery } from '../../../app/service/category';

import { socket } from '../../socket/socket';
import { registerHospitalEvents, unregisterHospitalEvents } from '../../socket/hospitalEvents';

// Styling override so CustomSelect matches the form's border-gray-300 / rounded-md inputs
const HOSPITAL_TYPE_SELECT_CLASS =
  "w-full [&>button]:border-gray-300 [&>button]:rounded-md [&>button]:focus:ring-[#1C62A0] [&>button]:focus:border-[#1C62A0]";

/* ------------------------------------------------------------------ */
/* Working Hours Constants & Helpers                                   */
/* ------------------------------------------------------------------ */

const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

const DAY_KEYS = DAYS.map(d => d.key);

// Default 24h-format objects (same shape as Register)
const DEFAULT_NORMAL_HOURS = {
  monday:    { start: '09:00', end: '18:00', isHoliday: false },
  tuesday:   { start: '09:00', end: '18:00', isHoliday: false },
  wednesday: { start: '09:00', end: '18:00', isHoliday: false },
  thursday:  { start: '09:00', end: '18:00', isHoliday: false },
  friday:    { start: '09:00', end: '18:00', isHoliday: false },
  saturday:  { start: '09:00', end: '18:00', isHoliday: false },
  sunday:    { start: '09:00', end: '18:00', isHoliday: true  },
};

const DEFAULT_CLINIC_HOURS = {
  monday:    { start: '09:00', end: '18:00', isHoliday: false },
  tuesday:   { start: '09:00', end: '18:00', isHoliday: false },
  wednesday: { start: '09:00', end: '18:00', isHoliday: false },
  thursday:  { start: '09:00', end: '18:00', isHoliday: false },
  friday:    { start: '09:00', end: '18:00', isHoliday: false },
  saturday:  { start: '09:00', end: '18:00', isHoliday: false },
  sunday:    { start: '09:00', end: '18:00', isHoliday: true  },
};

const DEFAULT_CLINIC_BREAK_HOURS = {
  monday:    { morningStart: '09:00', morningEnd: '12:00', eveningStart: '16:00', eveningEnd: '20:00', isHoliday: false },
  tuesday:   { morningStart: '09:00', morningEnd: '12:00', eveningStart: '16:00', eveningEnd: '20:00', isHoliday: false },
  wednesday: { morningStart: '09:00', morningEnd: '12:00', eveningStart: '16:00', eveningEnd: '20:00', isHoliday: false },
  thursday:  { morningStart: '09:00', morningEnd: '12:00', eveningStart: '16:00', eveningEnd: '20:00', isHoliday: false },
  friday:    { morningStart: '09:00', morningEnd: '12:00', eveningStart: '16:00', eveningEnd: '20:00', isHoliday: false },
  saturday:  { morningStart: '09:00', morningEnd: '12:00', eveningStart: '16:00', eveningEnd: '20:00', isHoliday: false },
  sunday:    { morningStart: '09:00', morningEnd: '12:00', eveningStart: '16:00', eveningEnd: '20:00', isHoliday: true  },
};

// Convert 24h "09:00" -> "09:00 AM" (display)
const to12Hour = (time) => {
  if (!time || !String(time).includes(':')) return time || '';
  const [hStr, mStr] = String(time).split(':');
  let h = parseInt(hStr, 10);
  const m = (mStr || '00').padStart(2, '0');
  if (isNaN(h)) return time;
  if (h === 24) return `12:${m} AM`;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, '0')}:${m} ${period}`;
};

// Convert 12h "09:00 AM" -> 24h "09:00"
const to24Hour = (time12) => {
  if (!time12) return '09:00';
  const t = String(time12).trim();

  if (!t.includes('AM') && !t.includes('PM')) {
    const p = t.split(':');
    if (p.length >= 2) {
      const h = parseInt(p[0], 10);
      const m = parseInt(p[1], 10);
      if (!isNaN(h) && !isNaN(m)) {
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      }
    }
    return '09:00';
  }

  const [timePart, period] = t.split(' ');
  if (!timePart || !period) return '09:00';
  const [hStr, mStr] = timePart.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr || '0', 10);
  if (isNaN(h) || isNaN(m)) return '09:00';
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

// Parse whichever API field is populated into { type, hoursObject }
const parseApiWorkingHours = (hospital) => {
  const parseFlat = (arr) => {
    const out = JSON.parse(JSON.stringify(DEFAULT_NORMAL_HOURS));
    arr.forEach(d => {
      const key = d.day?.toLowerCase();
      if (!key || !DAY_KEYS.includes(key)) return;
      out[key] = {
        start: d.is_holiday ? '09:00' : to24Hour(d.opening_time || '09:00'),
        end:   d.is_holiday ? '18:00' : to24Hour(d.closing_time || '18:00'),
        isHoliday: !!d.is_holiday,
      };
    });
    return out;
  };

  const parseBreak = (arr) => {
    const out = JSON.parse(JSON.stringify(DEFAULT_CLINIC_BREAK_HOURS));
    arr.forEach(d => {
      const key = d.day?.toLowerCase();
      if (!key || !DAY_KEYS.includes(key)) return;
      out[key] = {
        morningStart: d.is_holiday ? '09:00' : to24Hour(d.morning_start || '09:00'),
        morningEnd:   d.is_holiday ? '12:00' : to24Hour(d.morning_end   || '12:00'),
        eveningStart: d.is_holiday ? '16:00' : to24Hour(d.evening_start || '16:00'),
        eveningEnd:   d.is_holiday ? '20:00' : to24Hour(d.evening_end   || '20:00'),
        isHoliday: !!d.is_holiday,
      };
    });
    return out;
  };

  if (Array.isArray(hospital.working_hours_general) && hospital.working_hours_general.length) {
    return { type: 'normal', hours: parseFlat(hospital.working_hours_general) };
  }
  if (Array.isArray(hospital.working_hours_clinic) && hospital.working_hours_clinic.length) {
    return { type: 'clinic', hours: parseFlat(hospital.working_hours_clinic) };
  }
  if (Array.isArray(hospital.working_hours_clinic_nobreak) && hospital.working_hours_clinic_nobreak.length) {
    return { type: 'clinic-break', hours: parseBreak(hospital.working_hours_clinic_nobreak) };
  }
  if (Array.isArray(hospital.working_hours) && hospital.working_hours.length) {
    return { type: 'normal', hours: parseFlat(hospital.working_hours) };
  }
  return { type: 'normal', hours: JSON.parse(JSON.stringify(DEFAULT_NORMAL_HOURS)) };
};

// Build the API payload for the currently-selected type
const buildWorkingHoursPayload = (type, normalHours, clinicHours, clinicBreakHours) => {
  if (type === 'normal') {
    return {
      field: 'working_hours_general',
      data: DAY_KEYS.map(day => ({
        day,
        is_holiday: !!normalHours[day]?.isHoliday,
        opening_time: normalHours[day]?.start || '09:00',
        closing_time: normalHours[day]?.end || '18:00',
      })),
    };
  }
  if (type === 'clinic') {
    return {
      field: 'working_hours_clinic',
      data: DAY_KEYS.map(day => ({
        day,
        is_holiday: !!clinicHours[day]?.isHoliday,
        opening_time: clinicHours[day]?.start || '09:00',
        closing_time: clinicHours[day]?.end || '18:00',
      })),
    };
  }
  // clinic-break
  return {
    field: 'working_hours_clinic_nobreak',
    data: DAY_KEYS.map(day => ({
      day,
      is_holiday: !!clinicBreakHours[day]?.isHoliday,
      morning_start: clinicBreakHours[day]?.morningStart || '09:00',
      morning_end:   clinicBreakHours[day]?.morningEnd   || '12:00',
      evening_start: clinicBreakHours[day]?.eveningStart || '16:00',
      evening_end:   clinicBreakHours[day]?.eveningEnd   || '20:00',
    })),
  };
};

/* ------------------------------------------------------------------ */
/* SearchableDropdown                                                  */
/* ------------------------------------------------------------------ */

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
  optionKey = (option, index) => option.isoCode || index
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

  const displayValue = value
    ? getOptionLabel(options.find(opt => getOptionValue(opt) === value) || {})
    : "";

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />}
        <input
          type="text"
          value={isOpen ? searchTerm : displayValue}
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
          className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-10 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent ${
            disabled ? 'text-gray-400 bg-gray-50 cursor-not-allowed' : ''
          }`}
        />
        <ChevronDown
          className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 cursor-pointer transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          onClick={() => setIsOpen(prev => !prev)}
        />
      </div>

      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.map((option, index) => (
            <div
              key={optionKey(option, index)}
              className="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors flex items-center gap-2"
              onClick={() => handleSelect(option)}
            >
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="text-gray-700">{getOptionLabel(option)}</span>
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

/* ------------------------------------------------------------------ */
/* Skeleton                                                            */
/* ------------------------------------------------------------------ */

const SettingsSkeleton = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="h-9 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-5 w-64 bg-gray-200 rounded animate-pulse"></div>
        </div>

        <div className="border-b border-gray-200 mb-6">
          <div className="flex gap-8">
            {['General', 'Security', 'Map', 'Prescription Template'].map((_, i) => (
              <div key={i} className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-1"></div>
              <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i}>
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-5 w-full bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Settings component                                                  */
/* ------------------------------------------------------------------ */

const Settings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('General');
  const location = useLocation();

  const hospitalId = user?.hospitalId;
  const { data: hospitalData, isLoading: isLoadingHospital, error: fetchError, refetch } = useGetHospitalByIdQuery(hospitalId, {
    skip: !hospitalId,
  });
  const [updateHospital, { isLoading: isUpdating, error: updateError, reset: resetUpdate }] = useUpdateHospitalMutation();

  const {
    data: categoriesData,
    isLoading: isLoadingCategories,
    error: categoriesError
  } = useGetCategoryQuery({
    isActive: true,
    parentCategoryId: null,
    limit: 100
  });

  const [eventsRegistered, setEventsRegistered] = useState(false);

  const [hospitalInfo, setHospitalInfo] = useState({
    name: '',
    email: '',
    hospitalType: '',
    mobileNumber: '',
    createdDate: 'N/A',
    lastUpdated: 'N/A',
  });

  // Working Hours state (matches Register.jsx model)
  const [workingHourType, setWorkingHourType] = useState('normal');
  const [is24x7, setIs24x7] = useState(false);
  const [normalHours, setNormalHours] = useState(DEFAULT_NORMAL_HOURS);
  const [clinicHours, setClinicHours] = useState(DEFAULT_CLINIC_HOURS);
  const [clinicBreakHours, setClinicBreakHours] = useState(DEFAULT_CLINIC_BREAK_HOURS);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    hospitalType: '',
    mobileNumber: '',
    streetAddress: '',
    countryCode: '',
    countryName: '',
    stateCode: '',
    stateName: '',
    cityName: '',
    pincode: '',
    workingHourType: 'normal',
    normalHours: DEFAULT_NORMAL_HOURS,
    clinicHours: DEFAULT_CLINIC_HOURS,
    clinicBreakHours: DEFAULT_CLINIC_BREAK_HOURS,
  });

  const countries = Country.getAllCountries();
  const states = State.getStatesOfCountry(editForm.countryCode);
  const cities = City.getCitiesOfState(editForm.countryCode, editForm.stateCode);
  const isFormSaving = isSaving || isUpdating;

  const hospitalTypes = categoriesData?.data
    ? (Array.isArray(categoriesData.data)
        ? categoriesData.data
        : [categoriesData.data])
    : [];

  const hospitalTypeOptions = hospitalTypes.map(category => ({
    value: category.name,
    label: category.name,
  }));

  /* ---------------------------- Sockets ---------------------------- */

  useEffect(() => {
    registerHospitalEvents({
      onHospitalRegistered: () => {},
      onHospitalUpdated: () => { refetch(); },
      onHospitalDeleted: () => {},
      onHospitalBlacklisted: () => {},
      onHospitalRecovered: () => {}
    });

    setEventsRegistered(true);

    return () => {
      unregisterHospitalEvents();
      setEventsRegistered(false);
    };
  }, [refetch]);

  useEffect(() => {
    const handleConnect = () => {
      if (!eventsRegistered) {
        registerHospitalEvents({
          onHospitalRegistered: () => {},
          onHospitalUpdated: () => { refetch(); },
          onHospitalDeleted: () => {},
          onHospitalBlacklisted: () => {},
          onHospitalRecovered: () => {}
        });
        setEventsRegistered(true);
      }
    };

    const handleDisconnect = () => {
      setEventsRegistered(false);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [refetch, eventsRegistered]);

  /* --------------------------- Auth errors ------------------------- */

  useEffect(() => {
    if (fetchError?.status === 401) {
      showErrorToast('Session expired. Redirecting to login...', 2000);
      setTimeout(() => {
        logout();
        navigate('/sign-in');
      }, 2000);
    }
  }, [fetchError, logout, navigate]);

  useEffect(() => {
    if (updateError) {
      const status = updateError?.status || updateError?.originalStatus;

      if (status === 401) {
        showErrorToast('Authentication failed. Please log in again.', 3000);
        setTimeout(() => {
          logout();
          navigate('/sign-in');
        }, 2000);
      } else {
        const message =
          updateError?.data?.error?.details?.[0]?.message ||
          updateError?.data?.details?.[0]?.message ||
          updateError?.data?.errors?.[0]?.message ||
          updateError?.data?.error?.message ||
          updateError?.data?.message ||
          updateError?.error ||
          updateError?.message ||
          'Failed to update hospital information';

        showErrorToast(message, 4000);
      }
      resetUpdate();
    }
  }, [updateError, logout, navigate, resetUpdate]);

  /* ------------------------ Hydrate from API ----------------------- */

  useEffect(() => {
    if (hospitalData) {
      const hospital = hospitalData.data || hospitalData;

      let hospitalType = hospital.type || hospital.hospitalType || '';
      if (typeof hospitalType === 'object' && hospitalType !== null) {
        hospitalType = hospitalType.name || hospitalType._id || '';
      }

      setHospitalInfo({
        name: hospital.name || '',
        email: hospital.email || '',
        hospitalType: hospitalType,
        mobileNumber: hospital.phone || '',
        createdDate: hospital.createdAt ? new Date(hospital.createdAt).toLocaleDateString() : 'N/A',
        lastUpdated: hospital.updatedAt ? new Date(hospital.updatedAt).toLocaleString() : 'N/A',
      });

      const parsed = parseApiWorkingHours(hospital);

      // Hydrate the standalone state used by the read view
      setWorkingHourType(parsed.type);
      if (parsed.type === 'normal') setNormalHours(parsed.hours);
      if (parsed.type === 'clinic') setClinicHours(parsed.hours);
      if (parsed.type === 'clinic-break') setClinicBreakHours(parsed.hours);

      // Detect 24/7 mode (only for flat types)
      const is247 =
        parsed.type !== 'clinic-break' &&
        DAY_KEYS.every(d => {
          const h = parsed.hours[d.key];
          return h && !h.isHoliday && h.start === '00:00' && (h.end === '23:59' || h.end === '24:00');
        });
      setIs24x7(is247);

      // Build editForm from parsed data
      const nextEditForm = {
        name: hospital.name || '',
        email: hospital.email || '',
        hospitalType: hospitalType,
        mobileNumber: hospital.phone || '',
        workingHourType: parsed.type,
        normalHours: parsed.type === 'normal' ? parsed.hours : DEFAULT_NORMAL_HOURS,
        clinicHours: parsed.type === 'clinic' ? parsed.hours : DEFAULT_CLINIC_HOURS,
        clinicBreakHours: parsed.type === 'clinic-break' ? parsed.hours : DEFAULT_CLINIC_BREAK_HOURS,
      };

      if (hospital.address) {
        const country = countries.find(c => c.name === hospital.address.country);
        const state = country
          ? State.getStatesOfCountry(country.isoCode).find(s => s.name === hospital.address.state)
          : null;

        setEditForm(prev => ({
          ...prev,
          ...nextEditForm,
          streetAddress: hospital.address.place || '',
          countryCode: country?.isoCode || '',
          countryName: hospital.address.country || '',
          stateCode: state?.isoCode || '',
          stateName: hospital.address.state || '',
          cityName: hospital.address.district || '',
          pincode: hospital.address.pincode?.toString() || '',
        }));
      } else {
        setEditForm(prev => ({ ...prev, ...nextEditForm }));
      }
    }
  }, [hospitalData, countries]);

  useEffect(() => {
    if (location.state?.tab) setActiveTab(location.state.tab);
  }, [location]);

  /* --------------------------- Handlers ---------------------------- */

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCountryChange = (code, name) => {
    setEditForm(prev => ({
      ...prev,
      countryCode: code,
      countryName: name,
      stateCode: '',
      stateName: '',
      cityName: ''
    }));
  };

  const handleStateChange = (code, name) => {
    setEditForm(prev => ({
      ...prev,
      stateCode: code,
      stateName: name,
      cityName: ''
    }));
  };

  const handleCityChange = (name) => {
    setEditForm(prev => ({ ...prev, cityName: name }));
  };

  // Working hours handlers (per-type)
  const handleNormalHoursChange = (day, field, value) => {
    setEditForm(prev => ({
      ...prev,
      normalHours: { ...prev.normalHours, [day]: { ...prev.normalHours[day], [field]: value } },
    }));
  };
  const handleClinicHoursChange = (day, field, value) => {
    setEditForm(prev => ({
      ...prev,
      clinicHours: { ...prev.clinicHours, [day]: { ...prev.clinicHours[day], [field]: value } },
    }));
  };
  const handleClinicBreakHoursChange = (day, field, value) => {
    setEditForm(prev => ({
      ...prev,
      clinicBreakHours: { ...prev.clinicBreakHours, [day]: { ...prev.clinicBreakHours[day], [field]: value } },
    }));
  };

  const toggle247Mode = () => {
    if (!is24x7) {
      if (editForm.workingHourType === 'normal') {
        const h = {};
        DAY_KEYS.forEach(d => h[d] = { start: '00:00', end: '23:59', isHoliday: false });
        setEditForm(prev => ({ ...prev, normalHours: h }));
      } else if (editForm.workingHourType === 'clinic') {
        const h = {};
        DAY_KEYS.forEach(d => h[d] = { start: '00:00', end: '23:59', isHoliday: false });
        setEditForm(prev => ({ ...prev, clinicHours: h }));
      } else {
        const h = {};
        DAY_KEYS.forEach(d => h[d] = {
          morningStart: '00:00', morningEnd: '11:59',
          eveningStart: '12:00', eveningEnd: '23:59',
          isHoliday: false
        });
        setEditForm(prev => ({ ...prev, clinicBreakHours: h }));
      }
      setIs24x7(true);
      showSuccessToast('24/7 mode enabled.', 3000);
    } else {
      if (editForm.workingHourType === 'normal') {
        setEditForm(prev => ({ ...prev, normalHours: JSON.parse(JSON.stringify(DEFAULT_NORMAL_HOURS)) }));
      } else if (editForm.workingHourType === 'clinic') {
        setEditForm(prev => ({ ...prev, clinicHours: JSON.parse(JSON.stringify(DEFAULT_CLINIC_HOURS)) }));
      } else {
        setEditForm(prev => ({ ...prev, clinicBreakHours: JSON.parse(JSON.stringify(DEFAULT_CLINIC_BREAK_HOURS)) }));
      }
      setIs24x7(false);
      showWarningToast('24/7 mode disabled.', 3000);
    }
  };

  const handleEditClick = () => {
    setEditForm(prev => ({
      ...prev,
      name: hospitalInfo.name,
      email: hospitalInfo.email,
      hospitalType: hospitalInfo.hospitalType,
      mobileNumber: hospitalInfo.mobileNumber,
      workingHourType: workingHourType,
      normalHours: normalHours,
      clinicHours: clinicHours,
      clinicBreakHours: clinicBreakHours,
    }));
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm(prev => ({
      ...prev,
      workingHourType: workingHourType,
      normalHours: normalHours,
      clinicHours: clinicHours,
      clinicBreakHours: clinicBreakHours,
    }));
    showWarningToast('Edit cancelled. Changes discarded.', 2000);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    const phone = String(editForm.mobileNumber || '').trim();
    if (!/^\d{10}$/.test(phone)) {
      showErrorToast('Phone number must be exactly 10 digits', 4000);
      return;
    }

    // Build the payload for the selected type
    const { field, data } = buildWorkingHoursPayload(
      editForm.workingHourType,
      editForm.normalHours,
      editForm.clinicHours,
      editForm.clinicBreakHours
    );

    // Validate active type only
    for (const row of data) {
      if (row.is_holiday) continue;

      if (editForm.workingHourType === 'clinic-break') {
        if (!row.morning_start || !row.morning_end || !row.evening_start || !row.evening_end) {
          showErrorToast(`${row.day}: all session times are required`, 4000);
          return;
        }
        if (row.morning_end <= row.morning_start) {
          showErrorToast(`${row.day}: morning end must be after morning start`, 4000);
          return;
        }
        if (row.evening_end <= row.evening_start) {
          showErrorToast(`${row.day}: evening end must be after evening start`, 4000);
          return;
        }
      } else {
        if (!row.opening_time || !row.closing_time) {
          showErrorToast(`${row.day}: open and close times are required`, 4000);
          return;
        }
        if (row.closing_time <= row.opening_time) {
          showErrorToast(`${row.day}: close time must be after open time`, 4000);
          return;
        }
      }
    }

    setIsSaving(true);

    try {
      const updateData = {
        name: editForm.name,
        email: editForm.email,
        type: editForm.hospitalType,
        phone: editForm.mobileNumber,
        address: {
          country: editForm.countryName,
          state: editForm.stateName,
          district: editForm.cityName,
          place: editForm.streetAddress,
          pincode: Number(editForm.pincode),
        },
        // Send the correct field for the active type
        [field]: data,
        workingHourType: editForm.workingHourType,
      };

      const result = await updateHospital({
        id: hospitalId,
        updateHospital: updateData,
      }).unwrap();

      socket.emit('hospital_event', {
        event: 'HOSPITAL_UPDATED',
        data: {
          hospitalId: hospitalId,
          hospitalName: editForm.name,
          email: editForm.email,
          type: editForm.hospitalType,
          phone: editForm.mobileNumber,
          address: updateData.address,
          workingHourType: editForm.workingHourType,
          [field]: data,
          timestamp: new Date().toISOString(),
          staffIds: result?.data?.staffIds || [],
          doctorIds: result?.data?.doctorIds || [],
        },
      });

      const now = new Date();
      const formattedDate = now.toLocaleString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: 'numeric', hour12: true,
      });

      setHospitalInfo(prev => ({
        ...prev,
        name: editForm.name,
        email: editForm.email,
        hospitalType: editForm.hospitalType,
        mobileNumber: editForm.mobileNumber,
        lastUpdated: formattedDate,
      }));

      // Sync read-mode state
      setWorkingHourType(editForm.workingHourType);
      setNormalHours(editForm.normalHours);
      setClinicHours(editForm.clinicHours);
      setClinicBreakHours(editForm.clinicBreakHours);

      showSuccessToast('Hospital information updated successfully!', 4000);
      setIsEditing(false);

      await refetch();
    } catch (error) {
      console.error('Update error:', error);

      const status = error?.status || error?.originalStatus;
      if (status === 401) {
        showErrorToast('Session expired. Redirecting to login...', 3000);
        setTimeout(() => {
          logout();
          navigate('/sign-in');
        }, 2000);
      } else {
        const message =
          error?.data?.error?.details?.[0]?.message ||
          error?.data?.details?.[0]?.message ||
          error?.data?.errors?.[0]?.message ||
          error?.data?.error?.message ||
          error?.data?.message ||
          error?.error ||
          error?.message ||
          'Failed to update hospital information';

        showErrorToast(message, 4000);
      }
    } finally {
      setIsSaving(false);
    }
  };

  /* --------------------------- Read view --------------------------- */

  const renderWorkingHoursReadView = () => {
    const source =
      workingHourType === 'normal' ? normalHours :
      workingHourType === 'clinic' ? clinicHours :
      clinicBreakHours;

    const typeLabel =
      workingHourType === 'normal' ? 'Normal Hospital' :
      workingHourType === 'clinic' ? 'Clinic' :
      'Clinic with Break';

    return (
      <div className="border-t border-gray-200 pt-4 mt-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-md font-semibold text-gray-900 flex items-center gap-2">
            <Clock size={18} className="text-gray-500" />
            Working Hours
            <span className="ml-2 text-xs font-normal text-gray-500">({typeLabel})</span>
          </h3>
          {is24x7 && (
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              24/7
            </span>
          )}
        </div>
        <div className="space-y-2">
          {DAYS.map(day => {
            const h = source[day.key];
            return (
              <div
                key={day.key}
                className="flex items-center justify-between py-2.5 px-3 border-b border-gray-100 last:border-0 rounded-lg"
              >
                <span className="text-sm font-medium text-gray-700 w-24">{day.label}</span>
                {h?.isHoliday ? (
                  <span className="text-sm text-red-500 font-medium">Closed</span>
                ) : workingHourType === 'clinic-break' ? (
                  <span className="text-sm text-gray-600">
                    {to12Hour(h?.morningStart)} - {to12Hour(h?.morningEnd)}
                    <span className="text-gray-400 mx-1">|</span>
                    {to12Hour(h?.eveningStart)} - {to12Hour(h?.eveningEnd)}
                  </span>
                ) : (
                  <span className="text-sm text-gray-600">
                    {to12Hour(h?.start)} - {to12Hour(h?.end)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /* --------------------------- Edit view --------------------------- */

  const renderWorkingHoursEditor = () => {
    const isBreak = editForm.workingHourType === 'clinic-break';
    const source =
      editForm.workingHourType === 'normal' ? editForm.normalHours :
      editForm.workingHourType === 'clinic' ? editForm.clinicHours :
      editForm.clinicBreakHours;

    const onChange =
      editForm.workingHourType === 'normal' ? handleNormalHoursChange :
      editForm.workingHourType === 'clinic' ? handleClinicHoursChange :
      handleClinicBreakHoursChange;

    return (
      <div className="border-t border-gray-200 pt-4 mt-2">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-md font-semibold text-gray-900">Edit Working Hours</h3>
          <button
            type="button"
            onClick={toggle247Mode}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
              is24x7
                ? 'bg-[#154A7D] text-white hover:bg-[#0e3a61]'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Sun size={14} />
            {is24x7 ? '24/7 Mode: ON' : 'Set 24/7 Hours'}
          </button>
        </div>

        {/* Working hours type selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Working Hours Type <span className="text-red-500">*</span>
          </label>
          <CustomSelect
            hideLabel
            value={editForm.workingHourType}
            options={[
              { value: 'normal', label: '🏥 Normal Hospital' },
              { value: 'clinic', label: '🏪 Clinic' },
              { value: 'clinic-break', label: '🏪 Clinic with Break' },
            ]}
            onChange={(value) => setEditForm(prev => ({ ...prev, workingHourType: value }))}
            placeholder="Select working hours type"
            className={HOSPITAL_TYPE_SELECT_CLASS}
          />
          <p className="text-xs text-gray-500 mt-1">
            {editForm.workingHourType === 'normal' && 'Single session per day (e.g., 9:00 AM – 6:00 PM).'}
            {editForm.workingHourType === 'clinic' && 'Single session per day without break (e.g., 9:00 AM – 6:00 PM).'}
            {editForm.workingHourType === 'clinic-break' && 'Two sessions per day with a break (Morning & Evening).'}
          </p>
        </div>

        {/* Per-day editor */}
        <div className="space-y-4">
          {DAYS.map(day => {
            const h = source[day.key] || {};
            return (
              <div key={day.key} className="border-b border-gray-200 pb-4 last:border-0">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">{day.label}</h3>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={h.isHoliday || false}
                      onChange={(e) => onChange(day.key, 'isHoliday', e.target.checked)}
                      className="rounded border-gray-300 text-[#1C62A0] focus:ring-[#1C62A0]"
                    />
                    <span className={`text-sm ${h.isHoliday ? 'text-red-600' : 'text-gray-600'}`}>
                      {h.isHoliday ? 'Closed' : 'Open'}
                    </span>
                  </label>
                </div>

                {!h.isHoliday && !isBreak && (
                  <div className="grid grid-cols-2 gap-4 ml-6">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Open Time</label>
                      <input
                        type="time"
                        value={h.start || '09:00'}
                        onChange={(e) => onChange(day.key, 'start', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1C62A0]"
                      />
                      <p className="text-xs text-gray-400 mt-1">{to12Hour(h.start) || '—'}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Close Time</label>
                      <input
                        type="time"
                        value={h.end || '18:00'}
                        onChange={(e) => onChange(day.key, 'end', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1C62A0]"
                      />
                      <p className="text-xs text-gray-400 mt-1">{to12Hour(h.end) || '—'}</p>
                    </div>
                  </div>
                )}

                {!h.isHoliday && isBreak && (
                  <div className="ml-6 space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Morning Session</label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <input
                            type="time"
                            value={h.morningStart || '09:00'}
                            onChange={(e) => onChange(day.key, 'morningStart', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1C62A0]"
                          />
                          <p className="text-xs text-gray-400 mt-1">{to12Hour(h.morningStart) || '—'}</p>
                        </div>
                        <div>
                          <input
                            type="time"
                            value={h.morningEnd || '12:00'}
                            onChange={(e) => onChange(day.key, 'morningEnd', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1C62A0]"
                          />
                          <p className="text-xs text-gray-400 mt-1">{to12Hour(h.morningEnd) || '—'}</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Evening Session</label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <input
                            type="time"
                            value={h.eveningStart || '16:00'}
                            onChange={(e) => onChange(day.key, 'eveningStart', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1C62A0]"
                          />
                          <p className="text-xs text-gray-400 mt-1">{to12Hour(h.eveningStart) || '—'}</p>
                        </div>
                        <div>
                          <input
                            type="time"
                            value={h.eveningEnd || '20:00'}
                            onChange={(e) => onChange(day.key, 'eveningEnd', e.target.value)}
                            className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1C62A0]"
                          />
                          <p className="text-xs text-gray-400 mt-1">{to12Hour(h.eveningEnd) || '—'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {h.isHoliday && (
                  <div className="ml-6">
                    <p className="text-sm text-red-500">Closed for the day</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /* --------------------------- General Tab ------------------------- */

  const GeneralTab = (
    <div className="space-y-8">
      <Card>
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Account Settings</h2>
              <p className="text-sm text-gray-500">Update your hospital account information</p>
            </div>
            {!isEditing && (
              <Button variant="primary" onClick={handleEditClick} size="sm">
                <Edit2 size={16} className="mr-2" /> Edit
              </Button>
            )}
          </div>
        </div>
        <div className="p-6">
          {!isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Hospital Name</label>
                  <p className="mt-1 text-gray-900 font-medium">{hospitalInfo.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email Address</label>
                  <p className="mt-1 text-gray-900">{hospitalInfo.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Hospital Type</label>
                  <p className="mt-1 text-gray-900">{hospitalInfo.hospitalType}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
                  <p className="mt-1 text-gray-900">{hospitalInfo.mobileNumber}</p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 mt-4">
                <h3 className="text-md font-semibold text-gray-900 mb-3">Address Information</h3>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Street Address</label>
                    <p className="mt-1 text-gray-900">{editForm.streetAddress || 'Not provided'}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Country</label>
                      <p className="mt-1 text-gray-900">{editForm.countryName || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">State</label>
                      <p className="mt-1 text-gray-900">{editForm.stateName || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">District</label>
                      <p className="mt-1 text-gray-900">{editForm.cityName || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Pincode</label>
                      <p className="mt-1 text-gray-900">{editForm.pincode || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {renderWorkingHoursReadView()}
            </div>
          ) : (
            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Hospital Name" name="name" value={editForm.name} onChange={handleInputChange} required />
                <Input label="Email Address" name="email" type="email" value={editForm.email} onChange={handleInputChange} required />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hospital Type *
                  </label>
                  <CustomSelect
                    hideLabel
                    value={editForm.hospitalType}
                    options={hospitalTypeOptions}
                    placeholder={isLoadingCategories ? 'Loading categories...' : 'Select hospital type'}
                    onChange={(value) => handleInputChange({ target: { name: 'hospitalType', value } })}
                    disabled={isLoadingCategories}
                    className={HOSPITAL_TYPE_SELECT_CLASS}
                  />
                  {categoriesError && (
                    <p className="text-xs text-red-500 mt-1">Failed to load categories. Using defaults.</p>
                  )}
                </div>

                <Input
                  label="Mobile Number"
                  name="mobileNumber"
                  value={editForm.mobileNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setEditForm(prev => ({ ...prev, mobileNumber: value }));
                  }}
                  type="tel"
                  required
                />
              </div>

              <div className="border-t border-gray-200 pt-4 mt-2">
                <h3 className="text-md font-semibold text-gray-900 mb-4">Edit Address Information</h3>
                <div className="space-y-4">
                  <SearchableDropdown
                    label="Country"
                    options={countries}
                    value={editForm.countryCode}
                    onChange={handleCountryChange}
                    placeholder="Search for a country..."
                    icon={MapPin}
                  />
                  <SearchableDropdown
                    label="State"
                    options={states}
                    value={editForm.stateCode}
                    onChange={handleStateChange}
                    placeholder="Search for a state..."
                    icon={MapPin}
                    disabled={!editForm.countryCode}
                  />
                  <SearchableDropdown
                    label="District"
                    options={cities}
                    value={editForm.cityName}
                    onChange={handleCityChange}
                    placeholder="Search for a District..."
                    icon={MapPin}
                    disabled={!editForm.stateCode}
                    getOptionLabel={(option) => option.name}
                    getOptionValue={(option) => option.name}
                    optionKey={(option, index) => index}
                  />
                  <Input
                    label="Street Address"
                    name="streetAddress"
                    value={editForm.streetAddress}
                    onChange={handleInputChange}
                    placeholder="Enter street address"
                  />
                  <Input
                    label="Pincode"
                    name="pincode"
                    value={editForm.pincode}
                    onChange={handleInputChange}
                    placeholder="Enter pincode (5-6 digits)"
                    maxLength={6}
                  />
                </div>
              </div>

              {renderWorkingHoursEditor()}

              <div className="flex space-x-3 pt-4">
                <Button type="submit" variant="primary" disabled={isFormSaving} loading={isFormSaving}>
                  {isFormSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      </Card>

      <Card>
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Account Information</h2>
          <p className="text-sm text-gray-500">Your account details</p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-500">Account Created:</span>
              <span className="text-gray-900">{hospitalInfo.createdDate}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2">
              <span className="text-sm font-medium text-gray-500">Last Updated:</span>
              <span className="text-gray-900">{hospitalInfo.lastUpdated}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  /* --------------------------- Tab routing ------------------------- */

  const renderTabContent = () => {
    switch (activeTab) {
      case 'General':
        return GeneralTab;
      case 'Security':
        return <Security />;
      case 'Map':
        return <Map />;
      case 'Prescription Template':
        return <PrescriptionTemplate />;
      case 'Reviews':
        return <HospitalReviews />;
      default:
        return null;
    }
  };

  const tabs = ['General', 'Security', 'Map', 'Prescription Template', 'Reviews'];

  if (isLoadingHospital) {
    return <SettingsSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1">Manage your account settings</p>
        </div>

        <Tabs
          tabs={tabs.map(tab => ({ id: tab, label: tab }))}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          className="mb-6"
        />

        <div className="mt-6">{renderTabContent()}</div>

        <div className="mt-12 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-400">© {hospitalInfo.name} - All Rights Reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;