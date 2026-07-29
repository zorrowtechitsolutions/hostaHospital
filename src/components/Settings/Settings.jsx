// src/components/Settings/Settings.jsx
import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  Input,
  Tabs
} from '../ui';
import Security from './Security';
import Map from './Map';
import PrescriptionTemplate from './PrescriptionTemplate';
import { showSuccessToast, showWarningToast, showErrorToast } from '../ui/Toast';
import { Country, State, City } from 'country-state-city';
import { MapPin, ChevronDown, Clock, Save, X, Edit2, Plus, Minus } from 'lucide-react';
import { useGetHospitalByIdQuery, useUpdateHospitalMutation } from '../../../app/service/hospitalApi';
import { useAuth } from '../../context/AuthContext';
import HospitalReviews from "./HospitalReviews";

import { socket } from '../../socket/socket';
import { registerHospitalEvents, unregisterHospitalEvents } from '../../socket/hospitalEvents';

const TIME_OPTIONS = [
  '12:00 AM', '01:00 AM', '02:00 AM', '03:00 AM', '04:00 AM', '05:00 AM',
  '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
  '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM', '10:00 PM', '11:00 PM'
];

const DEFAULT_WORKING_HOURS = {
  monday: { open: '09:00 AM', close: '06:00 PM', closed: false },
  tuesday: { open: '09:00 AM', close: '06:00 PM', closed: false },
  wednesday: { open: '09:00 AM', close: '06:00 PM', closed: false },
  thursday: { open: '09:00 AM', close: '06:00 PM', closed: false },
  friday: { open: '09:00 AM', close: '06:00 PM', closed: false },
  saturday: { open: '09:00 AM', close: '06:00 PM', closed: false },
  sunday: { open: '09:00 AM', close: '06:00 PM', closed: true },
};

const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

const HOSPITAL_TYPES = [
  'Allopathy', 'Homeopathy', 'Ayurveda', 'Unani', 
  'Physiotherapy', 'Mental Health', 'Laboratory', 'Other'
];

// ✅ Convert "10:00" to "10:00 AM" with proper validation
const convertTo12HourFormat = (time) => {
  if (!time) return '09:00 AM';
  
  // If already in 12-hour format, return as is
  if (time.includes('AM') || time.includes('PM')) {
    return time;
  }
  
  // Handle "24:00" or "00:00" edge cases
  if (time === '24:00' || time === '00:00') {
    return '12:00 AM';
  }
  
  const parts = time.split(':');
  if (parts.length < 2) return '09:00 AM';
  
  const hours = parseInt(parts[0], 10);
  const minutes = parts[1] || '00';
  
  if (isNaN(hours) || hours > 24) return '09:00 AM';
  
  // Handle 24-hour format
  if (hours === 24) {
    return `12:${minutes.padStart(2, '0')} AM`;
  }
  if (hours === 0) {
    return `12:${minutes.padStart(2, '0')} AM`;
  }
  
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
};

// ✅ Helper: Convert time string to minutes for comparison
const convertTimeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  
  const parts = timeStr.split(' ');
  if (parts.length < 2) return 0;
  
  const timePart = parts[0];
  const period = parts[1];
  const timeParts = timePart.split(':');
  
  if (timeParts.length < 2) return 0;
  
  let hours = parseInt(timeParts[0], 10);
  const minutes = parseInt(timeParts[1], 10);
  
  if (isNaN(hours) || isNaN(minutes)) return 0;
  
  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }
  
  return hours * 60 + minutes;
};

// ✅ Convert API array format to frontend object format with validation
const convertApiToFrontendFormat = (apiHours) => {
  if (!apiHours || !Array.isArray(apiHours)) return null;
  
  const result = { ...DEFAULT_WORKING_HOURS };
  
  apiHours.forEach(dayData => {
    const dayKey = dayData.day?.toLowerCase();
    if (dayKey && DAYS.some(d => d.key === dayKey)) {
      // If holiday, mark as closed
      if (dayData.is_holiday) {
        result[dayKey] = {
          open: DEFAULT_WORKING_HOURS[dayKey].open,
          close: DEFAULT_WORKING_HOURS[dayKey].close,
          closed: true,
        };
        return;
      }
      
      // Convert "10:00" to "10:00 AM"
      let openTime = convertTo12HourFormat(dayData.opening_time);
      let closeTime = convertTo12HourFormat(dayData.closing_time);
      
      // ✅ Validate that close time is after open time
      const openMinutes = convertTimeToMinutes(openTime);
      const closeMinutes = convertTimeToMinutes(closeTime);
      
      // If close is before or equal to open, use default
      if (closeMinutes <= openMinutes) {
        console.warn(`Invalid hours for ${dayKey}: ${openTime} - ${closeTime}, using defaults`);
        openTime = DEFAULT_WORKING_HOURS[dayKey].open;
        closeTime = DEFAULT_WORKING_HOURS[dayKey].close;
      }
      
      result[dayKey] = {
        open: openTime,
        close: closeTime,
        closed: false,
      };
    }
  });
  
  return result;
};

// ✅ Normalize working hours from any format
const normalizeWorkingHours = (hours) => {
  if (!hours) return DEFAULT_WORKING_HOURS;
  
  // If hours is an array (API format), convert it
  if (Array.isArray(hours)) {
    const converted = convertApiToFrontendFormat(hours);
    if (converted) return converted;
    return DEFAULT_WORKING_HOURS;
  }
  
  // If hours is already an object (frontend format)
  const normalized = { ...DEFAULT_WORKING_HOURS };
  
  DAYS.forEach(day => {
    const dayData = hours[day.key];
    if (dayData) {
      let openTime = dayData.open || DEFAULT_WORKING_HOURS[day.key].open;
      let closeTime = dayData.close || DEFAULT_WORKING_HOURS[day.key].close;
      const isClosed = dayData.closed !== undefined ? dayData.closed : DEFAULT_WORKING_HOURS[day.key].closed;
      
      // If not closed, validate that close time is after open time
      if (!isClosed) {
        const openMinutes = convertTimeToMinutes(openTime);
        const closeMinutes = convertTimeToMinutes(closeTime);
        
        if (closeMinutes <= openMinutes) {
          openTime = DEFAULT_WORKING_HOURS[day.key].open;
          closeTime = DEFAULT_WORKING_HOURS[day.key].close;
        }
      }
      
      normalized[day.key] = {
        open: openTime,
        close: closeTime,
        closed: isClosed,
      };
    }
  });
  
  return normalized;
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

const Settings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('General');
  const location = useLocation();

  // ✅ FIXED: Use hospitalId instead of id
  const hospitalId = user?.hospitalId;
  const { data: hospitalData, isLoading: isLoadingHospital, error: fetchError, refetch } = useGetHospitalByIdQuery(hospitalId, {
    skip: !hospitalId,
  });
  const [updateHospital, { isLoading: isUpdating, error: updateError, reset: resetUpdate }] = useUpdateHospitalMutation();

  const [eventsRegistered, setEventsRegistered] = useState(false);

  const [hospitalInfo, setHospitalInfo] = useState({
    name: '',
    email: '',
    hospitalType: '',
    mobileNumber: '',
    createdDate: 'N/A',
    lastUpdated: 'N/A',
  });

  const [workingHours, setWorkingHours] = useState(DEFAULT_WORKING_HOURS);
  const [isEditing, setIsEditing] = useState(false);
  const [is24HourMode, setIs24HourMode] = useState(false);
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
    workingHours: DEFAULT_WORKING_HOURS,
  });

  const countries = Country.getAllCountries();
  const states = State.getStatesOfCountry(editForm.countryCode);
  const cities = City.getCitiesOfState(editForm.countryCode, editForm.stateCode);
  const isFormSaving = isSaving || isUpdating;

  // Register socket event listeners for hospital events
  useEffect(() => {
    registerHospitalEvents({
      onHospitalRegistered: () => {
        showSuccessToast(`New hospital registered!`, 3000);
      },
      onHospitalUpdated: () => {
        showSuccessToast(`Hospital updated successfully!`, 3000);
        refetch();
      },
      onHospitalDeleted: () => {
        showSuccessToast(`Hospital deleted!`, 3000);
      },
      onHospitalBlacklisted: () => {
        showSuccessToast(`Hospital blacklisted!`, 3000);
      },
      onHospitalRecovered: () => {
        showSuccessToast(`Hospital recovered successfully!`, 3000);
      }
    });

    setEventsRegistered(true);

    return () => {
      unregisterHospitalEvents();
      setEventsRegistered(false);
    };
  }, [refetch]);

  // Listen for socket connection/disconnection
  useEffect(() => {
    const handleConnect = () => {
      if (!eventsRegistered) {
        registerHospitalEvents({
          onHospitalRegistered: () => {
            showSuccessToast(`New hospital registered!`, 3000);
          },
          onHospitalUpdated: () => {
            showSuccessToast(`Hospital updated successfully!`, 3000);
            refetch();
          },
          onHospitalDeleted: () => {
            showSuccessToast(`Hospital deleted!`, 3000);
          },
          onHospitalBlacklisted: () => {
            showSuccessToast(`Hospital blacklisted!`, 3000);
          },
          onHospitalRecovered: () => {
            showSuccessToast(`Hospital recovered successfully!`, 3000);
          }
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
        showErrorToast(updateError?.data?.message || 'Failed to update hospital information', 4000);
      }
      resetUpdate();
    }
  }, [updateError, logout, navigate, resetUpdate]);

  // ✅ Properly handle working hours from API
  useEffect(() => {
    if (hospitalData) {
      
      const hospital = hospitalData.data || hospitalData;
      
      setHospitalInfo({
        name: hospital.name || '',
        email: hospital.email || '',
        hospitalType: hospital.type || '',
        mobileNumber: hospital.phone || '',
        createdDate: hospital.createdAt ? new Date(hospital.createdAt).toLocaleDateString() : 'N/A',
        lastUpdated: hospital.updatedAt ? new Date(hospital.updatedAt).toLocaleString() : 'N/A',
      });
      
      // ✅ Check all possible API fields for working hours
      let workingHoursData = null;
      
      if (hospital.working_hours_general && Array.isArray(hospital.working_hours_general) && hospital.working_hours_general.length > 0) {
        workingHoursData = hospital.working_hours_general;
      } else if (hospital.working_hours_clinic && Array.isArray(hospital.working_hours_clinic) && hospital.working_hours_clinic.length > 0) {
        workingHoursData = hospital.working_hours_clinic;
      } else if (hospital.working_hours_clinic_nobreak && Array.isArray(hospital.working_hours_clinic_nobreak) && hospital.working_hours_clinic_nobreak.length > 0) {
        workingHoursData = hospital.working_hours_clinic_nobreak;
      } else if (hospital.workingHours && typeof hospital.workingHours === 'object') {
        workingHoursData = hospital.workingHours;
      } else if (hospital.working_hours && Array.isArray(hospital.working_hours)) {
        workingHoursData = hospital.working_hours;
      }
      
      // Normalize the working hours
      const normalizedHours = normalizeWorkingHours(workingHoursData);
      setWorkingHours(normalizedHours);
      
      if (hospital.address) {
        const country = countries.find(c => c.name === hospital.address.country);
        const state = country ? State.getStatesOfCountry(country.isoCode).find(s => s.name === hospital.address.state) : null;
        
        setEditForm(prev => ({
          ...prev,
          streetAddress: hospital.address.place || '',
          countryCode: country?.isoCode || '',
          countryName: hospital.address.country || '',
          stateCode: state?.isoCode || '',
          stateName: hospital.address.state || '',
          cityName: hospital.address.district || '',
          pincode: hospital.address.pincode?.toString() || '',
          workingHours: normalizedHours,
        }));
      } else {
        setEditForm(prev => ({
          ...prev,
          workingHours: normalizedHours,
        }));
      }
    }
  }, [hospitalData, countries]);

  useEffect(() => {
    if (location.state?.tab) setActiveTab(location.state.tab);
  }, [location]);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
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
          pincode: Number(editForm.pincode)
        },
        workingHours: editForm.workingHours
      };
      
      
      const result = await updateHospital({ 
        id: hospitalId, 
        updateHospital: updateData 
      }).unwrap();
      
      
      socket.emit("hospital_event", {
        event: "HOSPITAL_UPDATED",
        data: {
          hospitalId: hospitalId,
          hospitalName: editForm.name,
          email: editForm.email,
          type: editForm.hospitalType,
          phone: editForm.mobileNumber,
          address: updateData.address,
          workingHours: editForm.workingHours,
          timestamp: new Date().toISOString(),
          staffIds: result?.data?.staffIds || [],
          doctorIds: result?.data?.doctorIds || []
        }
      });
      
      const now = new Date();
      const formattedDate = now.toLocaleString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true
      });
      
      setHospitalInfo(prev => ({ 
        ...prev, 
        name: editForm.name,
        email: editForm.email,
        hospitalType: editForm.hospitalType,
        mobileNumber: editForm.mobileNumber,
        lastUpdated: formattedDate 
      }));
      
      setWorkingHours(editForm.workingHours);
      
      showSuccessToast('Hospital information updated successfully!', 4000);
      setIsEditing(false);
      
      await refetch();
      
    } catch (error) {
      console.error('Update error:', error);
      if (error.status === 401) {
        showErrorToast('Session expired. Redirecting to login...', 3000);
        setTimeout(() => {
          logout();
          navigate('/sign-in');
        }, 2000);
      } else {
        showErrorToast(error.data?.message || error.message || 'Failed to update hospital information', 4000);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditClick = () => {
    setEditForm(prev => ({
      ...prev,
      name: hospitalInfo.name,
      email: hospitalInfo.email,
      hospitalType: hospitalInfo.hospitalType,
      mobileNumber: hospitalInfo.mobileNumber,
      workingHours: workingHours,
    }));
    setIsEditing(true);
  };

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

  // Properly update working hours with deep clone
  const handleWorkingHourChange = (day, field, value) => {
    setEditForm(prev => {
      const updatedWorkingHours = { ...prev.workingHours };
      updatedWorkingHours[day] = {
        ...updatedWorkingHours[day],
        [field]: value
      };
      return {
        ...prev,
        workingHours: updatedWorkingHours
      };
    });
  };

  // Properly toggle closed status with deep clone
  const handleToggleClosed = (day) => {
    setEditForm(prev => {
      const updatedWorkingHours = { ...prev.workingHours };
      updatedWorkingHours[day] = {
        ...updatedWorkingHours[day],
        closed: !updatedWorkingHours[day].closed
      };
      return {
        ...prev,
        workingHours: updatedWorkingHours
      };
    });
  };

  const handleSet24HourMode = () => {
    if (is24HourMode) {
      const newHours = { ...DEFAULT_WORKING_HOURS };
      setWorkingHours(newHours);
      setEditForm(prev => ({
        ...prev,
        workingHours: newHours
      }));
      setIs24HourMode(false);
      showWarningToast('24/7 mode disabled. Normal working hours restored.', 3000);
    } else {
      const newHours = Object.fromEntries(
        DAYS.map(day => [
          day.key,
          {
            open: '12:00 AM',
            close: '11:59 PM',
            closed: false
          }
        ])
      );
      setWorkingHours(newHours);
      setEditForm(prev => ({
        ...prev,
        workingHours: newHours
      }));
      setIs24HourMode(true);
      showSuccessToast('24/7 mode enabled. Hospital will be open all day, every day.', 4000);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm(prev => ({
      ...prev,
      workingHours: workingHours
    }));
    showWarningToast('Edit cancelled. Changes discarded.', 2000);
  };

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
                <Edit2 size={16} className="mr-2" /> Edit Settings
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

              {/* Working Hours - WITHOUT TODAY Highlight */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-md font-semibold text-gray-900 flex items-center gap-2">
                    <Clock size={18} className="text-gray-500" />
                    Working Hours
                  </h3>
                  <button
                    type="button"
                    onClick={handleSet24HourMode}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      is24HourMode 
                        ? 'bg-red-100 text-red-700 border border-red-300 hover:bg-red-200' 
                        : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700'
                    }`}
                  >
                    {is24HourMode ? 'Disable 24/7' : 'Set 24/7 Hours'}
                  </button>
                </div>
                <div className="space-y-2">
                  {DAYS.map((day) => {
                    const hours = workingHours[day.key];
                    
                    return (
                      <div 
                        key={day.key} 
                        className="flex items-center justify-between py-2.5 px-3 border-b border-gray-100 last:border-0 rounded-lg"
                      >
                        <span className="text-sm font-medium text-gray-700 w-24">
                          {day.label}
                        </span>
                        {hours?.closed ? (
                          <span className="text-sm text-red-500 font-medium">Closed</span>
                        ) : (
                          <span className="text-sm text-gray-600">
                            {hours?.open || '09:00 AM'} - {hours?.close || '06:00 PM'}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Hospital Name" name="name" value={editForm.name} onChange={handleInputChange} required />
                <Input label="Email Address" name="email" type="email" value={editForm.email} onChange={handleInputChange} required />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hospital Type *</label>
                  <select
                    name="hospitalType"
                    value={editForm.hospitalType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1C62A0]"
                    required
                  >
                    <option value="">Select hospital type</option>
                    {HOSPITAL_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                
                <Input label="Mobile Number" name="mobileNumber" value={editForm.mobileNumber} onChange={handleInputChange} required />
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

              <div className="border-t border-gray-200 pt-4 mt-2">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-md font-semibold text-gray-900">Edit Working Hours</h3>
                  <button
                    type="button"
                    onClick={handleSet24HourMode}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      is24HourMode 
                        ? 'bg-red-100 text-red-700 border border-red-300 hover:bg-red-200' 
                        : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700'
                    }`}
                  >
                    {is24HourMode ? 'Disable 24/7' : 'Set 24/7 Hours'}
                  </button>
                </div>
                <div className="space-y-4">
                  {DAYS.map((day) => (
                    <div key={day.key} className="border-b border-gray-200 pb-4 last:border-0">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-gray-900">{day.label}</h3>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={editForm.workingHours[day.key]?.closed || false}
                            onChange={() => handleToggleClosed(day.key)}
                            className="rounded border-gray-300 text-[#1C62A0] focus:ring-[#1C62A0]"
                          />
                          <span className={`text-sm ${editForm.workingHours[day.key]?.closed ? 'text-red-600' : 'text-gray-600'}`}>
                            {editForm.workingHours[day.key]?.closed ? 'Closed' : 'Open'}
                          </span>
                        </label>
                      </div>
                      
                      {!editForm.workingHours[day.key]?.closed && (
                        <div className="grid grid-cols-2 gap-4 ml-6">
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Open Time</label>
                            <select
                              value={editForm.workingHours[day.key]?.open || '09:00 AM'}
                              onChange={(e) => {
                                const value = e.target.value;
                                handleWorkingHourChange(day.key, 'open', value);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1C62A0]"
                            >
                              {TIME_OPTIONS.map(time => (
                                <option key={time} value={time}>{time}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Close Time</label>
                            <select
                              value={editForm.workingHours[day.key]?.close || '06:00 PM'}
                              onChange={(e) => {
                                const value = e.target.value;
                                handleWorkingHourChange(day.key, 'close', value);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1C62A0]"
                            >
                              {TIME_OPTIONS.map(time => (
                                <option key={time} value={time}>{time}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                      {editForm.workingHours[day.key]?.closed && (
                        <div className="ml-6">
                          <p className="text-sm text-red-500">Closed for the day</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <Button type="submit" variant="primary" disabled={isFormSaving} loading={isFormSaving}>
                  {isFormSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
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

  const tabs = ['General', 'Security', 'Map', 'Prescription Template','Reviews'];

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