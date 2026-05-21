// src/Authentication/Register.jsx - COMPLETE FIXED VERSION WITH AUTO-LOGIN
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Mail, Lock, Building, Building2, MapPin, Globe, Landmark, Home, CreditCard,
  Phone, AlertCircle, Eye, EyeOff, Navigation,
  Clock, Sun, Briefcase, ChevronDown, CheckCircle, XCircle, Search, FileText
} from 'lucide-react';
import GoogleMapsLocationPicker from './GoogleMapsLocationPicker';
import { Input, Select, Textarea, Button, Alert, Card } from '../components/ui';
import { showAddToast, showErrorToast, showWarningToast, showSuccessToast, showInfoToast } from '../components/ui/Toast';
import { Country, State, City } from 'country-state-city';
import { useRegisterMutation } from '../../app/service/hospitalApi';  
import { useAuth } from '../context/AuthContext'; 

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
  const inputRef = useRef(null);

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
          ref={inputRef}
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
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-10 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#154A7D] bg-white text-black font-medium ${
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
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.map((option, index) => (
            <div
              key={optionKey(option, index)}
              className="px-4 py-2 hover:bg-[#F5FAFF] cursor-pointer transition-colors flex items-center gap-2"
              onClick={() => handleSelect(option)}
            >
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="text-gray-700">{getOptionLabel(option)}</span>
            </div>
          ))}
        </div>
      )}
      
      {isOpen && filteredOptions.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-4 text-center text-gray-500">
          No results found
        </div>
      )}
    </div>
  );
};

const SearchableCityDropdown = ({ 
  label, 
  options, 
  value, 
  onChange, 
  placeholder, 
  disabled = false,
  required = false
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
          className={`w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#154A7D] bg-white text-black font-medium ${
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
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.map((option, index) => (
            <div
              key={index}
              className="px-4 py-2 hover:bg-[#F5FAFF] cursor-pointer transition-colors flex items-center gap-2"
              onClick={() => handleSelect(option)}
            >
              <Home className="h-4 w-4 text-gray-400" />
              <span className="text-gray-700">{option.name}</span>
            </div>
          ))}
        </div>
      )}
      
      {isOpen && filteredOptions.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-4 text-center text-gray-500">
          No cities found
        </div>
      )}
    </div>
  );
};

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth(); // ADDED: Get login function from auth context
  const [register, { isLoading: isApiLoading }] = useRegisterMutation(); // CHANGED: useRegisterMutation instead of useAddNewHospitalMutation
  const [activeTab, setActiveTab] = useState("normal");
  const [is24x7, setIs24x7] = useState(false);
  const [showPassword, setShowPassword] = useState(false);     
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleMapsReady, setIsGoogleMapsReady] = useState(false);
  
  const [hospitalName, setHospitalName] = useState("");
  const [about, setAbout] = useState("");
  const [email, setEmail] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [emergencyNumber, setEmergencyNumber] = useState("");
  const [longitude, setLongitude] = useState("");
  const [latitude, setLatitude] = useState("");
  const [hospitalType, setHospitalType] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [countryCode, setCountryCode] = useState("");
  const [countryName, setCountryName] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [stateName, setStateName] = useState("");
  const [cityName, setCityName] = useState("");
  const [pincode, setPincode] = useState("");
  
  const countries = Country.getAllCountries();
  const states = State.getStatesOfCountry(countryCode);
  const cities = City.getCitiesOfState(countryCode, stateCode);
  
  const [normalHours, setNormalHours] = useState({
    monday: { start: "09:00", end: "18:00", isHoliday: false },
    tuesday: { start: "09:00", end: "18:00", isHoliday: false },
    wednesday: { start: "09:00", end: "18:00", isHoliday: false },
    thursday: { start: "09:00", end: "18:00", isHoliday: false },
    friday: { start: "09:00", end: "18:00", isHoliday: false },
    saturday: { start: "09:00", end: "18:00", isHoliday: false },
    sunday: { start: "09:00", end: "18:00", isHoliday: true }
  });

  const [clinicHours, setClinicHours] = useState({
    monday: { start: "09:00", end: "18:00", isHoliday: false, hasBreak: false, morningStart: "09:00", morningEnd: "12:00", eveningStart: "16:00", eveningEnd: "20:00" },
    tuesday: { start: "09:00", end: "18:00", isHoliday: false, hasBreak: false, morningStart: "09:00", morningEnd: "12:00", eveningStart: "16:00", eveningEnd: "20:00" },
    wednesday: { start: "09:00", end: "18:00", isHoliday: false, hasBreak: false, morningStart: "09:00", morningEnd: "12:00", eveningStart: "16:00", eveningEnd: "20:00" },
    thursday: { start: "09:00", end: "18:00", isHoliday: false, hasBreak: false, morningStart: "09:00", morningEnd: "12:00", eveningStart: "16:00", eveningEnd: "20:00" },
    friday: { start: "09:00", end: "18:00", isHoliday: false, hasBreak: false, morningStart: "09:00", morningEnd: "12:00", eveningStart: "16:00", eveningEnd: "20:00" },
    saturday: { start: "09:00", end: "18:00", isHoliday: false, hasBreak: false, morningStart: "09:00", morningEnd: "12:00", eveningStart: "16:00", eveningEnd: "20:00" },
    sunday: { start: "09:00", end: "12:00", isHoliday: true, hasBreak: false, morningStart: "09:00", morningEnd: "12:00", eveningStart: "16:00", eveningEnd: "20:00" }
  });

  const [locationStatus, setLocationStatus] = useState('');
  const [registerError, setRegisterError] = useState('');
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    const checkGoogleMaps = setInterval(() => {
      if (window.google && window.google.maps && typeof window.google.maps.Geocoder === 'function') {
        setIsGoogleMapsReady(true);
        clearInterval(checkGoogleMaps);
      }
    }, 500);
    return () => clearInterval(checkGoogleMaps);
  }, []);

  const handleNormalHoursChange = (day, field, value) => {
    const dayKey = day.toLowerCase();
    setNormalHours(prev => ({ ...prev, [dayKey]: { ...prev[dayKey], [field]: value } }));
  };

  const handleClinicHoursChange = (day, field, value) => {
    const dayKey = day.toLowerCase();
    setClinicHours(prev => ({ ...prev, [dayKey]: { ...prev[dayKey], [field]: value } }));
  };

  const handleBreakToggle = (day, checked) => {
    const dayKey = day.toLowerCase();
    if (!checked) {
      setClinicHours(prev => ({ ...prev, [dayKey]: { ...prev[dayKey], hasBreak: false } }));
    } else {
      setClinicHours(prev => ({ ...prev, [dayKey]: { ...prev[dayKey], hasBreak: true } }));
    }
  };

  const toggle247Mode = () => {
    if (!is24x7) {
      if (activeTab === "clinic") {
        const newHours = {};
        daysOfWeek.forEach(day => {
          newHours[day.toLowerCase()] = { start: "00:00", end: "23:59", isHoliday: false, hasBreak: false, morningStart: "00:00", morningEnd: "23:59", eveningStart: "00:00", eveningEnd: "23:59" };
        });
        setClinicHours(newHours);
      } else {
        const newHours = {};
        daysOfWeek.forEach(day => {
          newHours[day.toLowerCase()] = { start: "00:00", end: "23:59", isHoliday: false };
        });
        setNormalHours(newHours);
      }
      setIs24x7(true);
      showSuccessToast('24/7 mode enabled. Hospital will be open all day, every day.', 4000);
    } else {
      const defaultNormalHours = {
        monday: { start: "09:00", end: "18:00", isHoliday: false },
        tuesday: { start: "09:00", end: "18:00", isHoliday: false },
        wednesday: { start: "09:00", end: "18:00", isHoliday: false },
        thursday: { start: "09:00", end: "18:00", isHoliday: false },
        friday: { start: "09:00", end: "18:00", isHoliday: false },
        saturday: { start: "09:00", end: "18:00", isHoliday: false },
        sunday: { start: "09:00", end: "18:00", isHoliday: true }
      };
      const defaultClinicHours = {
        monday: { start: "09:00", end: "18:00", isHoliday: false, hasBreak: false, morningStart: "09:00", morningEnd: "12:00", eveningStart: "16:00", eveningEnd: "20:00" },
        tuesday: { start: "09:00", end: "18:00", isHoliday: false, hasBreak: false, morningStart: "09:00", morningEnd: "12:00", eveningStart: "16:00", eveningEnd: "20:00" },
        wednesday: { start: "09:00", end: "18:00", isHoliday: false, hasBreak: false, morningStart: "09:00", morningEnd: "12:00", eveningStart: "16:00", eveningEnd: "20:00" },
        thursday: { start: "09:00", end: "18:00", isHoliday: false, hasBreak: false, morningStart: "09:00", morningEnd: "12:00", eveningStart: "16:00", eveningEnd: "20:00" },
        friday: { start: "09:00", end: "18:00", isHoliday: false, hasBreak: false, morningStart: "09:00", morningEnd: "12:00", eveningStart: "16:00", eveningEnd: "20:00" },
        saturday: { start: "09:00", end: "18:00", isHoliday: false, hasBreak: false, morningStart: "09:00", morningEnd: "12:00", eveningStart: "16:00", eveningEnd: "20:00" },
        sunday: { start: "09:00", end: "12:00", isHoliday: true, hasBreak: false, morningStart: "09:00", morningEnd: "12:00", eveningStart: "16:00", eveningEnd: "20:00" }
      };
      setNormalHours(defaultNormalHours);
      setClinicHours(defaultClinicHours);
      setIs24x7(false);
      showWarningToast('24/7 mode disabled. Normal working hours restored.', 3000);
    }
  };

  const getCurrentLocation = () => {
    setLocationStatus('loading');
    showInfoToast('Getting your current location coordinates...', 2000);
    if (!navigator.geolocation) {
      setLocationStatus('error');
      showErrorToast('Geolocation is not supported by your browser', 4000);
      setTimeout(() => setLocationStatus(''), 3000);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat.toString());
        setLongitude(lng.toString());
        showSuccessToast(`Coordinates captured: ${lat.toFixed(4)}, ${lng.toFixed(4)}`, 4000);
        setLocationStatus('success');
        setTimeout(() => setLocationStatus(''), 3000);
      },
      (error) => {
        setLocationStatus('error');
        showErrorToast('Failed to get location', 4000);
        setTimeout(() => setLocationStatus(''), 3000);
      }
    );
  };

  const handleLocationSelect = (lat, lng) => {
    setLatitude(lat.toString());
    setLongitude(lng.toString());
    showSuccessToast(`Location coordinates set: ${lat.toFixed(4)}, ${lng.toFixed(4)}`, 3000);
    setLocationStatus('success');
    setTimeout(() => setLocationStatus(''), 3000);
  };

  const validateForm = () => {
    if (!hospitalName) { setRegisterError('Hospital name is required'); showWarningToast('Hospital name is required', 3000); return false; }
    if (!email) { setRegisterError('Email is required'); showWarningToast('Email is required', 3000); return false; }
    if (!/^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/.test(email)) { setRegisterError('Please enter a valid email address'); showWarningToast('Please enter a valid email address', 3000); return false; }
    if (!phone) { setRegisterError('Phone number is required'); showWarningToast('Phone number is required', 3000); return false; }
    if (!streetAddress) { setRegisterError('Street address is required'); showWarningToast('Street address is required', 3000); return false; }
    if (!countryCode) { setRegisterError('Country is required'); showWarningToast('Country is required', 3000); return false; }
    if (!stateCode) { setRegisterError('State is required'); showWarningToast('State is required', 3000); return false; }
    if (!cityName) { setRegisterError('City is required'); showWarningToast('City is required', 3000); return false; }
    if (!pincode) { setRegisterError('Pincode is required'); showWarningToast('Pincode is required', 3000); return false; }
    if (!/^\d{5,6}$/.test(pincode)) { setRegisterError('Please enter a valid pincode (5-6 digits)'); showWarningToast('Please enter a valid pincode (5-6 digits)', 3000); return false; }
    if (!hospitalType) { setRegisterError('Please select hospital type'); showWarningToast('Please select hospital type', 3000); return false; }
    if (!password) { setRegisterError('Password is required'); showWarningToast('Password is required', 3000); return false; }
    if (password.length < 8) { setRegisterError('Password must be at least 8 characters'); showWarningToast('Password must be at least 8 characters', 3000); return false; }
    if (password !== confirmPassword) { setRegisterError('Passwords do not match'); showWarningToast('Passwords do not match', 3000); return false; }
    return true;
  };

  const handleCountryChange = (code, name) => {
    setCountryCode(code);
    setCountryName(name);
    setStateCode("");
    setStateName("");
    setCityName("");
  };

  const handleStateChange = (code, name) => {
    setStateCode(code);
    setStateName(name);
    setCityName("");
  };

  const handleCityChange = (name) => {
    setCityName(name);
  };

  // UPDATED: handleSubmit with auto-login
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      setIsSubmitting(true);
      setRegisterError('');
      showInfoToast('Creating hospital account...', 2000);
      
      const working_hours_clinic = [];
      const working_hours_general = [];
      const working_hours_clinic_nobreak = [];

      daysOfWeek.forEach((day) => {
        const dayKey = day.toLowerCase();
        if (clinicHours[dayKey]?.hasBreak) {
          working_hours_clinic.push({
            day: dayKey,
            morning_session: { open: clinicHours[dayKey].morningStart, close: clinicHours[dayKey].morningEnd },
            evening_session: { open: clinicHours[dayKey].eveningStart, close: clinicHours[dayKey].eveningEnd },
            is_holiday: clinicHours[dayKey].isHoliday,
            has_break: true
          });
        }
        if (!clinicHours[dayKey]?.hasBreak) {
          working_hours_clinic_nobreak.push({
            day: dayKey,
            opening_time: clinicHours[dayKey].start,
            closing_time: clinicHours[dayKey].end,
            is_holiday: clinicHours[dayKey].isHoliday
          });
        }
        working_hours_general.push({
          day: dayKey,
          opening_time: normalHours[dayKey].start,
          closing_time: normalHours[dayKey].end,
          is_holiday: normalHours[dayKey].isHoliday
        });
      });

      const hospitalData = {
        name: hospitalName,
        email,
        password,
        phone,
        address: {
          country: countryName,
          state: stateName,
          district: cityName,
          place: streetAddress,
          pincode: Number(pincode)
        },
        type: hospitalType,
        emergencyContact: emergencyNumber,
        latitude: latitude ? Number(parseFloat(latitude).toFixed(6)) : null,
        longitude: longitude ? Number(parseFloat(longitude).toFixed(6)) : null,
        about: about || "",
        working_hours_clinic,
        working_hours_general,
        working_hours_clinic_nobreak
      };

      console.log("🚀 Submitting hospital data:", hospitalData);

      try {
        const response = await register(hospitalData).unwrap();
        console.log("Registration successful with tokens:", response);
        
        // Extract hospital data from response.data (your backend returns data in response.data)
        // Backend did not return hospital data
if (!response.data) {

  showSuccessToast(
    "Registration completed successfully. Please sign in.",
    4000
  );

  setIsSubmitting(false);

  navigate("/sign-in");

  return;
}

// AUTO LOGIN ONLY IF DATA EXISTS
login({
  id: response.data.id,
  name: response.data.name,
  email: response.data.email,
  phone: response.data.phone,
  type: response.data.type,
});
        
        // Tokens are automatically stored by transformResponse in the API
        const accessToken = localStorage.getItem("accessToken");
        const refreshToken = localStorage.getItem("refreshToken");
        console.log("Access token stored:", !!accessToken);
        console.log("Refresh token stored:", !!refreshToken);
        
        showSuccessToast(`✅ Welcome ${hospitalName}! Your account has been created and you're logged in.`, 5000);
        
        setIsSubmitting(false);
        
        // Navigate directly to dashboard (no need to go to login page)
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
        
      } catch (error) {
        console.error("❌ Registration error:", error);
        let errorMessage = "Registration failed. Please try again.";
        if (error.data?.message) errorMessage = error.data.message;
        else if (error.status === 409) errorMessage = "Email already registered. Please use a different email.";
        setRegisterError(errorMessage);
        showErrorToast(`❌ ${errorMessage}`, 4000);
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-sm p-8 space-y-8">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-xl bg-[#154A7D] text-white flex items-center justify-center text-2xl font-bold">
            <Building className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Create Hospital Account</h1>
          <p className="text-slate-500">Register your hospital to get started with our management system</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {registerError && <Alert type="error" message={registerError} />}

          <div className="grid md:grid-cols-2 gap-5">
            <Input label="Hospital Name" placeholder="Enter hospital name" value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} />
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Hospital Type <span className="text-red-500">*</span></label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                <select value={hospitalType} onChange={(e) => setHospitalType(e.target.value)} className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 bg-white text-black font-medium focus:outline-none focus:ring-2 focus:ring-[#154A7D] appearance-none cursor-pointer">
                  <option value="">Select hospital type</option>
                  <option value="Allopathy">Allopathy</option>
                  <option value="Homeopathy">Homeopathy</option>
                  <option value="Ayurveda">Ayurveda</option>
                  <option value="Unani">Unani</option>
                  <option value="Physiotherapy">Physiotherapy</option>
                  <option value="Mental Health">Mental Health</option>
                  <option value="Laboratory">Laboratory</option>
                  <option value="Other">Other</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <Input label="Email" type="email" placeholder="Enter email address" value={email} onChange={(e) => setEmail(e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Mobile Number" placeholder="Enter mobile number" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              <Input label="Emergency Number" placeholder="Emergency contact (optional)" value={emergencyNumber} onChange={(e) => setEmergencyNumber(e.target.value)} icon={Phone} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">About Hospital <span className="text-gray-400 text-xs">(optional)</span></label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400 z-10" />
              <textarea value={about} onChange={(e) => setAbout(e.target.value)} placeholder="Tell us about your hospital - specialties, facilities, mission, etc." rows={4} className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#154A7D] bg-white text-black font-medium resize-none" />
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-6 space-y-5">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2"><MapPin className="h-5 w-5 text-[#154A7D]" /> Address Information</h2>
            <SearchableDropdown label="Country" options={countries} value={countryCode} onChange={handleCountryChange} placeholder="Search for a country..." icon={Globe} required={true} getOptionLabel={(option) => option.name} getOptionValue={(option) => option.isoCode} optionKey={(option) => option.isoCode} />
            <SearchableDropdown label="State" options={states} value={stateCode} onChange={handleStateChange} placeholder="Search for a state..." icon={Landmark} required={true} disabled={!countryCode} getOptionLabel={(option) => option.name} getOptionValue={(option) => option.isoCode} optionKey={(option) => option.isoCode} />
            <SearchableCityDropdown label="District" options={cities} value={cityName} onChange={handleCityChange} placeholder="Search for a District..." required={true} disabled={!stateCode} />
            <div className="space-y-2"><label className="block text-sm font-medium text-gray-700">Street Address <span className="text-red-500">*</span></label><textarea value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} placeholder="Enter hospital street address" rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#154A7D] bg-white text-black font-medium resize-none" /></div>
            <div className="relative"><CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10" /><input type="text" value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="Pincode * (5-6 digits)" maxLength={6} className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#154A7D] bg-white text-black font-medium" /></div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-6 space-y-5">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2"><Navigation className="h-5 w-5 text-[#154A7D]" /> Location Coordinates</h2>
            <div className="grid md:grid-cols-2 gap-5">
              <Input label="Latitude" placeholder="Enter latitude" value={latitude} onChange={(e) => setLatitude(e.target.value)} />
              <Input label="Longitude" placeholder="Enter longitude" value={longitude} onChange={(e) => setLongitude(e.target.value)} />
            </div>
            <GoogleMapsLocationPicker latitude={latitude} longitude={longitude} onLocationSelect={handleLocationSelect} />
            <button type="button" onClick={getCurrentLocation} disabled={locationStatus === 'loading'} className={`w-full rounded-xl border py-4 font-medium text-lg flex items-center justify-center gap-3 transition-all duration-200 ${locationStatus === 'loading' ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' : 'bg-[#F5FAFF] text-[#154A7D] border-[#D6E2EE] hover:bg-[#154A7D] hover:text-white hover:border-[#154A7D] hover:shadow-md'}`}>
              <Navigation size={22} className={locationStatus === 'loading' ? 'animate-pulse' : ''} />
              {locationStatus === 'loading' ? 'Getting your location...' : '📍 Get Current Location Coordinates'}
            </button>
            {locationStatus === 'loading' && <div className="flex items-center justify-center gap-2"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#154A7D]"></div><p className="text-xs text-blue-600 text-center">📍 Fetching your location coordinates...</p></div>}
            {locationStatus === 'success' && <div className="flex items-center justify-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /><p className="text-xs text-green-600 text-center">✓ Location coordinates captured successfully!</p></div>}
            {locationStatus === 'error' && <div className="flex items-center justify-center gap-2"><XCircle className="h-4 w-4 text-red-500" /><p className="text-xs text-red-600 text-center">❌ Failed to get location. Please enter coordinates manually or use the map.</p></div>}
          </div>

          <div className="rounded-2xl bg-slate-50 p-6 space-y-5">
            <div className="flex justify-between items-center"><h2 className="text-xl font-semibold text-gray-900">Working Hours</h2><button type="button" onClick={toggle247Mode} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${is24x7 ? "bg-[#154A7D] text-white hover:bg-[#0e3a61] hover:shadow-md" : "bg-white hover:bg-[#154A7D] hover:text-white border border-gray-200 hover:border-[#154A7D] text-gray-700"}`}><Sun size={14} />{is24x7 ? "24/7 Mode: ON" : "Set 24/7 Hours"}</button></div>
            <div className="flex gap-6 border-b border-slate-200">
              <button type="button" onClick={() => { setActiveTab("normal"); if (is24x7) toggle247Mode(); }} className={`pb-3 text-sm font-medium transition-all flex items-center gap-2 border-b-2 ${activeTab === "normal" ? "border-[#154A7D] text-[#154A7D]" : "border-transparent text-slate-500 hover:text-slate-800"}`}><Clock size={16} /> Normal Hospital</button>
              <button type="button" onClick={() => { setActiveTab("clinic"); if (is24x7) toggle247Mode(); }} className={`pb-3 text-sm font-medium transition-all flex items-center gap-2 border-b-2 ${activeTab === "clinic" ? "border-[#154A7D] text-[#154A7D]" : "border-transparent text-slate-500 hover:text-slate-800"}`}><Briefcase size={16} /> Clinic</button>
            </div>

            {activeTab === "normal" ? (
              <div className="space-y-3">
                {daysOfWeek.map((day) => {
                  const dayHours = normalHours[day.toLowerCase()] || { start: "09:00", end: "18:00", isHoliday: false };
                  return (<div key={day} className="rounded-xl border border-blue-200 bg-white p-5 shadow-sm"><div className="flex justify-between items-center mb-4"><h3 className="font-semibold text-[#154A7D] text-lg">{day}</h3><label className="flex items-center gap-2 text-sm font-medium text-red-600 cursor-pointer"><input type="checkbox" checked={dayHours.isHoliday} onChange={(e) => handleNormalHoursChange(day, 'isHoliday', e.target.checked)} className="w-4 h-4 rounded border-red-400" />Holiday</label></div>{!dayHours.isHoliday ? (<div className="grid md:grid-cols-2 gap-4"><div><label className="block text-sm text-gray-600 mb-1">Open Time</label><input type="time" value={dayHours.start} onChange={(e) => handleNormalHoursChange(day, 'start', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#154A7D] outline-none text-black font-medium" /></div><div><label className="block text-sm text-gray-600 mb-1">Close Time</label><input type="time" value={dayHours.end} onChange={(e) => handleNormalHoursChange(day, 'end', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#154A7D] outline-none text-black font-medium" /></div></div>) : <p className="text-sm text-gray-500 italic">Closed for the day</p>}</div>);
                })}
              </div>
            ) : (
              <div className="space-y-3">
                {daysOfWeek.map((day) => {
                  const dayHours = clinicHours[day.toLowerCase()] || { start: "09:00", end: "18:00", isHoliday: false, hasBreak: false, morningStart: "09:00", morningEnd: "12:00", eveningStart: "16:00", eveningEnd: "20:00" };
                  return (<div key={day} className="rounded-xl border border-blue-200 bg-white p-5 space-y-4 shadow-sm"><div className="flex justify-between items-center"><h3 className="font-semibold text-[#154A7D] text-lg">{day}</h3><label className="flex items-center gap-2 text-sm font-medium text-red-600 cursor-pointer"><input type="checkbox" checked={dayHours.isHoliday} onChange={(e) => handleClinicHoursChange(day, 'isHoliday', e.target.checked)} className="w-4 h-4 rounded border-red-400" />Holiday</label></div>{!dayHours.isHoliday && (<>{dayHours.hasBreak ? (<div className="space-y-4"><div><label className="block text-sm font-semibold text-gray-700 mb-2">Morning Session</label><div className="grid md:grid-cols-2 gap-4"><div><input type="time" value={dayHours.morningStart} onChange={(e) => handleClinicHoursChange(day, 'morningStart', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#154A7D] outline-none text-black font-medium" placeholder="Morning Start" /></div><div><input type="time" value={dayHours.morningEnd} onChange={(e) => handleClinicHoursChange(day, 'morningEnd', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#154A7D] outline-none text-black font-medium" placeholder="Morning End" /></div></div></div><div><label className="block text-sm font-semibold text-gray-700 mb-2">Evening Session</label><div className="grid md:grid-cols-2 gap-4"><div><input type="time" value={dayHours.eveningStart} onChange={(e) => handleClinicHoursChange(day, 'eveningStart', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#154A7D] outline-none text-black font-medium" placeholder="Evening Start" /></div><div><input type="time" value={dayHours.eveningEnd} onChange={(e) => handleClinicHoursChange(day, 'eveningEnd', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#154A7D] outline-none text-black font-medium" placeholder="Evening End" /></div></div></div></div>) : (<div className="space-y-3"><div className="grid md:grid-cols-2 gap-4"><div><label className="block text-sm text-gray-600 mb-1">Opening Time</label><input type="time" value={dayHours.start} onChange={(e) => handleClinicHoursChange(day, 'start', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#154A7D] outline-none text-black font-medium" /></div><div><label className="block text-sm text-gray-600 mb-1">Closing Time</label><input type="time" value={dayHours.end} onChange={(e) => handleClinicHoursChange(day, 'end', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#154A7D] outline-none text-black font-medium" /></div></div></div>)}<div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mt-4"><label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer"><input type="checkbox" checked={dayHours.hasBreak} onChange={(e) => handleBreakToggle(day, e.target.checked)} className="w-4 h-4 rounded border-gray-400" /><span>Has Break Between Sessions</span></label>{!dayHours.hasBreak && <span className="text-xs text-gray-500">Normal schedule (single session)</span>}{dayHours.hasBreak && <span className="text-xs text-blue-600">Morning & Evening sessions</span>}</div></>)}</div>);
                })}
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-slate-50 p-6 space-y-5">
            <h2 className="text-xl font-semibold text-gray-900">Account Security</h2>
            <div className="grid md:grid-cols-2 gap-5">
              <div><label className="text-sm font-medium text-gray-700">Password <span className="text-red-500">*</span></label><div className="relative mt-2"><Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" /><input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password (min 8 characters)" className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#154A7D] bg-gray-50 text-black font-medium" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>
              <div><label className="text-sm font-medium text-gray-700">Confirm Password <span className="text-red-500">*</span></label><div className="relative mt-2"><Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" /><input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#154A7D] bg-gray-50 text-black font-medium" /><button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2">{showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>
            </div>
            <p className="text-xs text-gray-500">Password must be at least 8 characters with uppercase, lowercase, and numbers</p>
          </div>

          <Button type="submit" variant="primary" size="lg" fullWidth disabled={isSubmitting || isApiLoading} loading={isSubmitting || isApiLoading}>
            {isSubmitting || isApiLoading ? 'Creating Account...' : 'Create Account'}
          </Button>

          <p className="text-center text-sm text-gray-600">Already have an account? <Link to="/sign-in" className="text-[#154A7D] hover:text-[#0e3a61] font-medium">Sign In</Link></p>
        </form>
      </div>
    </div>
  );
};

export default Register;