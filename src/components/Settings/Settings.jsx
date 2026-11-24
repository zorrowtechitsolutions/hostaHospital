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
import {
  MapPin, ChevronDown, Clock, Edit2, Sun,
  CreditCard, CheckCircle, Home
} from 'lucide-react';
import { useGetHospitalByIdQuery, useUpdateHospitalMutation } from '../../../app/service/hospitalApi';
// ✅ Pincode API integration (same as AddDoctor / AddPatient / EditPatient)
import { useGetPincodeQuery } from '../../../app/service/pincodeApi';
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
/* Searchable dropdown for local area (post offices)                   */
/* ------------------------------------------------------------------ */

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
          onClick={() => !disabled && setIsOpen(prev => !prev)}
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
    // ✅ Pincode-based address
    streetAddress: '',
    countryName: 'India',
    stateName: '',
    cityName: '',      // district
    localArea: '',
    pincode: '',
    workingHourType: 'normal',
    normalHours: DEFAULT_NORMAL_HOURS,
    clinicHours: DEFAULT_CLINIC_HOURS,
    clinicBreakHours: DEFAULT_CLINIC_BREAK_HOURS,
  });

  const [addressTouched, setAddressTouched] = useState({});

  // Saved address (as stored in the API) so Edit / Cancel can restore it.
  // `place` is saved as "street, localArea".
  const addressSnapshotRef = useRef({
    place: '', stateName: '', cityName: '', pincode: ''
  });
  // Holds the saved place string until the pincode lookup runs once,
  // so the local area can be restored without being wiped.
  const pendingPlaceRef = useRef('');

  const isFormSaving = isSaving || isUpdating;

  // ✅ Pincode API integration (only while editing)
  const {
    currentData: pincodeData,
    isFetching: isPincodeLoading,
    isError: isPincodeError,
  } = useGetPincodeQuery(editForm.pincode, {
    skip: !isEditing || !/^\d{6}$/.test(editForm.pincode),
  });

  const postOffices =
    pincodeData?.[0]?.Status === 'Success'
      ? pincodeData[0].PostOffice || []
      : [];

  // De-duplicated post office names (note: `Map` is shadowed by the Map component import)
  const localAreaOptions = (() => {
    const seen = new Set();
    return postOffices
      .filter(o => {
        if (seen.has(o.Name)) return false;
        seen.add(o.Name);
        return true;
      })
      .map(o => ({ name: o.Name }));
  })();

  const hospitalTypes = categoriesData?.data
    ? (Array.isArray(categoriesData.data)
        ? categoriesData.data
        : [categoriesData.data])
    : [];

  const hospitalTypeOptions = hospitalTypes.map(category => ({
    value: category.name,
    label: category.name,
  }));

  /* ------------------- Pincode → state / district ------------------ */

  useEffect(() => {
    if (postOffices.length > 0) {
      const first = postOffices[0];
      const names = postOffices.map(o => o.Name);
      const pending = pendingPlaceRef.current;
      pendingPlaceRef.current = '';

      setEditForm(prev => {
        let street = prev.streetAddress;

        // keep the current local area if it is still valid for this pincode
        let local =
          names.find(n => n.trim().toLowerCase() === (prev.localArea || '').trim().toLowerCase()) || '';

        // otherwise try to restore it from the saved "street, localArea" string
        if (!local && pending) {
          const parts = pending.split(',').map(p => p.trim()).filter(Boolean);
          const last = parts[parts.length - 1];
          const match = last
            ? names.find(n => n.trim().toLowerCase() === last.toLowerCase())
            : null;
          if (match) {
            local = match;
            street = parts.slice(0, -1).join(', ');
          }
        }

        return {
          ...prev,
          stateName: first.State,
          cityName: first.District,
          localArea: local,
          streetAddress: street
        };
      });
    } else if (editForm.pincode.length === 6 && pincodeData) {
      pendingPlaceRef.current = '';
      setEditForm(prev => ({ ...prev, stateName: '', cityName: '', localArea: '' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pincodeData]);

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
          const h = parsed.hours[d];
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
        const snapshot = {
          place: hospital.address.place || '',
          stateName: hospital.address.state || '',
          cityName: hospital.address.district || '',
          pincode: hospital.address.pincode?.toString() || '',
        };
        addressSnapshotRef.current = snapshot;
        pendingPlaceRef.current = snapshot.place;

        setEditForm(prev => ({
          ...prev,
          ...nextEditForm,
          streetAddress: snapshot.place,
          countryName: 'India',
          stateName: snapshot.stateName,
          cityName: snapshot.cityName,
          localArea: '',
          pincode: snapshot.pincode,
        }));
      } else {
        setEditForm(prev => ({ ...prev, ...nextEditForm }));
      }
    }
  }, [hospitalData]);

  useEffect(() => {
    if (location.state?.tab) setActiveTab(location.state.tab);
  }, [location]);

  /* --------------------------- Handlers ---------------------------- */

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  // ✅ Handle pincode change
  const handlePincodeChange = (value) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 6);

    // user is typing a new pincode → forget the saved local area
    pendingPlaceRef.current = '';

    setEditForm(prev => ({
      ...prev,
      pincode: cleaned,
      stateName: '',
      cityName: '',
      localArea: ''
    }));
  };

  // ✅ Handle local area change
  const handleLocalAreaChange = (name) => {
    setEditForm(prev => ({ ...prev, localArea: name }));
    setAddressTouched(prev => ({ ...prev, localArea: true }));
  };

  // Restore address fields from the last saved address
  const restoreAddress = () => {
    const s = addressSnapshotRef.current;
    pendingPlaceRef.current = s.place;
    setEditForm(prev => ({
      ...prev,
      streetAddress: s.place,
      countryName: 'India',
      stateName: s.stateName,
      cityName: s.cityName,
      localArea: '',
      pincode: s.pincode,
    }));
    setAddressTouched({});
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
    restoreAddress();
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
    restoreAddress();
    showWarningToast('Edit cancelled. Changes discarded.', 2000);
  };

  // ✅ place is saved as "street, localArea"
  const buildPlace = () =>
    [editForm.streetAddress, editForm.localArea]
      .map(part => part?.trim())
      .filter(Boolean)
      .join(', ');

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    const phone = String(editForm.mobileNumber || '').trim();
    if (!/^\d{10}$/.test(phone)) {
      showErrorToast('Phone number must be exactly 10 digits', 4000);
      return;
    }

    // Address validation
    setAddressTouched({ pincode: true, localArea: true });
    if (!/^\d{6}$/.test(editForm.pincode)) {
      showErrorToast('Please enter a valid 6-digit pin code', 4000);
      return;
    }
    if (!editForm.stateName || !editForm.cityName) {
      showErrorToast('Location not found for this pin code. Please check it.', 4000);
      return;
    }
    if (!editForm.localArea) {
      showErrorToast('Please select a local area', 4000);
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
      const place = buildPlace();

      const updateData = {
        name: editForm.name,
        email: editForm.email,
        type: editForm.hospitalType,
        phone: editForm.mobileNumber,
        address: {
          country: 'India',
          state: editForm.stateName,
          district: editForm.cityName,
          place,
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

      // Sync saved address
      addressSnapshotRef.current = {
        place,
        stateName: editForm.stateName,
        cityName: editForm.cityName,
        pincode: editForm.pincode,
      };
      pendingPlaceRef.current = place;
      setEditForm(prev => ({ ...prev, streetAddress: place, localArea: '' }));

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

  const pincodeError =
    addressTouched.pincode && editForm.pincode && !/^\d{6}$/.test(editForm.pincode)
      ? 'Please enter a valid 6-digit pin code'
      : '';

  const localAreaError =
    addressTouched.localArea && !editForm.localArea ? 'Local area is required' : '';

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
                    <label className="block text-sm font-medium text-gray-700">Address</label>
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
                      Pincode <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        inputMode="numeric"
                        name="pincode"
                        value={editForm.pincode}
                        onChange={(e) => handlePincodeChange(e.target.value)}
                        onBlur={() => setAddressTouched(prev => ({ ...prev, pincode: true }))}
                        placeholder="Enter 6 digit pincode"
                        maxLength={6}
                        className={`w-full pl-10 pr-10 py-2 rounded-lg border ${
                          pincodeError ? 'border-red-500' : 'border-gray-300'
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
                    {editForm.pincode.length === 6 &&
                      !isPincodeLoading &&
                      !isPincodeError &&
                      postOffices.length === 0 && (
                        <p className="text-xs text-red-500 mt-2">
                          Invalid pincode or no location found.
                        </p>
                      )}
                    {pincodeError && (
                      <p className="text-sm text-red-600 mt-1">{pincodeError}</p>
                    )}
                  </div>

                  {/* State + District (read-only, auto-filled) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          value={editForm.stateName}
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
                          value={editForm.cityName}
                          readOnly
                          placeholder="Automatically detected district"
                          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-gray-100 text-gray-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Local area (post offices) + Street address */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SearchableCityDropdown
                      label="Local Area"
                      options={localAreaOptions}
                      value={editForm.localArea}
                      onChange={handleLocalAreaChange}
                      placeholder={
                        postOffices.length === 0
                          ? 'Enter pincode first'
                          : 'Select local area'
                      }
                      required={true}
                      disabled={postOffices.length === 0}
                      error={localAreaError}
                      touched={addressTouched.localArea}
                    />
                    <Input
                      label="Street Address"
                      name="streetAddress"
                      value={editForm.streetAddress}
                      onChange={handleInputChange}
                      placeholder="House no., street, place"
                    />
                  </div>
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