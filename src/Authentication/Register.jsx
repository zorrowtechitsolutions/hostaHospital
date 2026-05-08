// src/Authentication/Register.jsx - With searchable dropdowns (typing to filter)
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Mail, Lock, Building, Building2, MapPin, Globe, Landmark, Home, CreditCard,
  Phone, AlertCircle, Eye, EyeOff, Navigation,
  Clock, Sun, Briefcase, ChevronDown, CheckCircle, XCircle, Search
} from 'lucide-react';
import GoogleMapsLocationPicker from './GoogleMapsLocationPicker';
import { Input, Select, Textarea, Button, Alert, Card } from '../components/ui';
import { showAddToast, showErrorToast, showWarningToast, showSuccessToast, showInfoToast } from '../components/ui/Toast';
import { Country, State, City } from 'country-state-city';

// Custom Searchable Dropdown Component
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

  // Filter options based on search term
  const filteredOptions = options.filter(option => {
    const label = getOptionLabel(option).toLowerCase();
    return label.includes(searchTerm.toLowerCase());
  });

  // Handle click outside to close dropdown
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

// Simple Searchable Dropdown for Cities (no icon needed)
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

  // Filter options based on search term
  const filteredOptions = options.filter(option => 
    option.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle click outside to close dropdown
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
  const [activeTab, setActiveTab] = useState("normal");
  const [is24x7, setIs24x7] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleMapsReady, setIsGoogleMapsReady] = useState(false);
  
  // Form state
  const [hospitalName, setHospitalName] = useState("");
  const [email, setEmail] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [longitude, setLongitude] = useState("");
  const [latitude, setLatitude] = useState("");
  const [hospitalType, setHospitalType] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Location fields using country-state-city
  const [countryCode, setCountryCode] = useState("");
  const [countryName, setCountryName] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [stateName, setStateName] = useState("");
  const [cityName, setCityName] = useState("");
  const [pincode, setPincode] = useState("");
  
  // Get dropdown options
  const countries = Country.getAllCountries();
  const states = State.getStatesOfCountry(countryCode);
  const cities = City.getCitiesOfState(countryCode, stateCode);
  
  // Normal Hospital Hours (Single session)
  const [normalHours, setNormalHours] = useState({
    monday: { start: "09:00", end: "18:00", isHoliday: false },
    tuesday: { start: "09:00", end: "18:00", isHoliday: false },
    wednesday: { start: "09:00", end: "18:00", isHoliday: false },
    thursday: { start: "09:00", end: "18:00", isHoliday: false },
    friday: { start: "09:00", end: "18:00", isHoliday: false },
    saturday: { start: "09:00", end: "18:00", isHoliday: false },
    sunday: { start: "09:00", end: "18:00", isHoliday: true }
  });

  // Clinic Hours
  const [clinicHours, setClinicHours] = useState({
    monday: { start: "09:00", end: "12:00", isHoliday: false, hasBreak: false, breakStart: "13:00", breakEnd: "14:00", eveningStart: "16:00", eveningEnd: "20:00" },
    tuesday: { start: "09:00", end: "12:00", isHoliday: false, hasBreak: false, breakStart: "13:00", breakEnd: "14:00", eveningStart: "16:00", eveningEnd: "20:00" },
    wednesday: { start: "09:00", end: "12:00", isHoliday: false, hasBreak: false, breakStart: "13:00", breakEnd: "14:00", eveningStart: "16:00", eveningEnd: "20:00" },
    thursday: { start: "09:00", end: "12:00", isHoliday: false, hasBreak: false, breakStart: "13:00", breakEnd: "14:00", eveningStart: "16:00", eveningEnd: "20:00" },
    friday: { start: "09:00", end: "12:00", isHoliday: false, hasBreak: false, breakStart: "13:00", breakEnd: "14:00", eveningStart: "16:00", eveningEnd: "20:00" },
    saturday: { start: "09:00", end: "12:00", isHoliday: false, hasBreak: false, breakStart: "13:00", breakEnd: "14:00", eveningStart: "16:00", eveningEnd: "20:00" },
    sunday: { start: "09:00", end: "12:00", isHoliday: true, hasBreak: false, breakStart: "13:00", breakEnd: "14:00", eveningStart: "16:00", eveningEnd: "20:00" }
  });

  const [locationStatus, setLocationStatus] = useState('');
  const [registerError, setRegisterError] = useState('');

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Check if Google Maps is loaded
  useEffect(() => {
    const checkGoogleMaps = setInterval(() => {
      if (window.google && window.google.maps && typeof window.google.maps.Geocoder === 'function') {
        setIsGoogleMapsReady(true);
        console.log('✅ Google Maps is fully loaded and ready');
        clearInterval(checkGoogleMaps);
      } else {
        console.log('⏳ Waiting for Google Maps to load...');
      }
    }, 500);
    
    return () => clearInterval(checkGoogleMaps);
  }, []);

  const handleNormalHoursChange = (day, field, value) => {
    const dayKey = day.toLowerCase();
    setNormalHours(prev => ({
      ...prev,
      [dayKey]: { ...prev[dayKey], [field]: value }
    }));
  };

  const handleClinicHoursChange = (day, field, value) => {
    const dayKey = day.toLowerCase();
    setClinicHours(prev => ({
      ...prev,
      [dayKey]: { ...prev[dayKey], [field]: value }
    }));
  };

  const toggle247Mode = () => {
    if (!is24x7) {
      if (activeTab === "clinic") {
        const newHours = {};
        daysOfWeek.forEach(day => {
          newHours[day.toLowerCase()] = {
            start: "00:00", end: "23:59", isHoliday: false,
            hasBreak: false, breakStart: "13:00", breakEnd: "14:00",
            eveningStart: "00:00", eveningEnd: "23:59"
          };
        });
        setClinicHours(newHours);
      } else {
        const newHours = {};
        daysOfWeek.forEach(day => {
          newHours[day.toLowerCase()] = {
            start: "00:00", end: "23:59", isHoliday: false
          };
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
        monday: { start: "09:00", end: "12:00", isHoliday: false, hasBreak: false, breakStart: "13:00", breakEnd: "14:00", eveningStart: "16:00", eveningEnd: "20:00" },
        tuesday: { start: "09:00", end: "12:00", isHoliday: false, hasBreak: false, breakStart: "13:00", breakEnd: "14:00", eveningStart: "16:00", eveningEnd: "20:00" },
        wednesday: { start: "09:00", end: "12:00", isHoliday: false, hasBreak: false, breakStart: "13:00", breakEnd: "14:00", eveningStart: "16:00", eveningEnd: "20:00" },
        thursday: { start: "09:00", end: "12:00", isHoliday: false, hasBreak: false, breakStart: "13:00", breakEnd: "14:00", eveningStart: "16:00", eveningEnd: "20:00" },
        friday: { start: "09:00", end: "12:00", isHoliday: false, hasBreak: false, breakStart: "13:00", breakEnd: "14:00", eveningStart: "16:00", eveningEnd: "20:00" },
        saturday: { start: "09:00", end: "12:00", isHoliday: false, hasBreak: false, breakStart: "13:00", breakEnd: "14:00", eveningStart: "16:00", eveningEnd: "20:00" },
        sunday: { start: "09:00", end: "12:00", isHoliday: true, hasBreak: false, breakStart: "13:00", breakEnd: "14:00", eveningStart: "16:00", eveningEnd: "20:00" }
      };
      setNormalHours(defaultNormalHours);
      setClinicHours(defaultClinicHours);
      setIs24x7(false);
      showWarningToast('24/7 mode disabled. Normal working hours restored.', 3000);
    }
  };

  // Get current location coordinates
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
        
        console.log("📍 Got coordinates:", lat, lng);
        
        setLatitude(lat.toString());
        setLongitude(lng.toString());
        
        showSuccessToast(`Coordinates captured: ${lat.toFixed(4)}, ${lng.toFixed(4)}`, 4000);
        setLocationStatus('success');
        setTimeout(() => setLocationStatus(''), 3000);
      },
      (error) => {
        console.error('❌ Geolocation error:', error);
        setLocationStatus('error');
        
        let errorMessage = '';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please allow location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable. Please check your GPS.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again.';
            break;
          default:
            errorMessage = 'Failed to get location. Please try again.';
        }
        
        showErrorToast(errorMessage, 4000);
        setTimeout(() => setLocationStatus(''), 3000);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleLocationSelect = (lat, lng, addressText) => {
    console.log('📍 Map click - Location selected:', lat, lng);
    setLatitude(lat.toString());
    setLongitude(lng.toString());
    
    showSuccessToast(`Location coordinates set: ${lat.toFixed(4)}, ${lng.toFixed(4)}`, 3000);
    setLocationStatus('success');
    setTimeout(() => setLocationStatus(''), 3000);
  };

  const validateForm = () => {
    if (!hospitalName) { 
      setRegisterError('Hospital name is required'); 
      showWarningToast('Hospital name is required', 3000); 
      return false; 
    }
    if (!email) { 
      setRegisterError('Email is required'); 
      showWarningToast('Email is required', 3000); 
      return false; 
    }
    if (!/^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/.test(email)) { 
      setRegisterError('Please enter a valid email address'); 
      showWarningToast('Please enter a valid email address', 3000); 
      return false; 
    }
    if (!phone) { 
      setRegisterError('Phone number is required'); 
      showWarningToast('Phone number is required', 3000); 
      return false; 
    }
    if (!streetAddress) { 
      setRegisterError('Street address is required'); 
      showWarningToast('Street address is required', 3000); 
      return false; 
    }
    if (!countryCode) { 
      setRegisterError('Country is required'); 
      showWarningToast('Country is required', 3000); 
      return false; 
    }
    if (!stateCode) { 
      setRegisterError('State is required'); 
      showWarningToast('State is required', 3000); 
      return false; 
    }
    if (!cityName) { 
      setRegisterError('City is required'); 
      showWarningToast('City is required', 3000); 
      return false; 
    }
    if (!pincode) { 
      setRegisterError('Pincode is required'); 
      showWarningToast('Pincode is required', 3000); 
      return false; 
    }
    if (!/^\d{5,6}$/.test(pincode)) { 
      setRegisterError('Please enter a valid pincode (5-6 digits)'); 
      showWarningToast('Please enter a valid pincode (5-6 digits)', 3000); 
      return false; 
    }
    if (!hospitalType) { 
      setRegisterError('Please select hospital type'); 
      showWarningToast('Please select hospital type', 3000); 
      return false; 
    }
    if (!password) { 
      setRegisterError('Password is required'); 
      showWarningToast('Password is required', 3000); 
      return false; 
    }
    if (password.length < 8) { 
      setRegisterError('Password must be at least 8 characters'); 
      showWarningToast('Password must be at least 8 characters', 3000); 
      return false; 
    }
    if (password !== confirmPassword) { 
      setRegisterError('Passwords do not match'); 
      showWarningToast('Passwords do not match', 3000); 
      return false; 
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      setIsSubmitting(true);
      setRegisterError('');
      showInfoToast('Creating hospital account...', 2000);
      
      setTimeout(() => {
        const existingHospitals = JSON.parse(localStorage.getItem('hospitals') || '[]');
        if (existingHospitals.some(h => h.email === email)) {
          setRegisterError('Email already registered. Please use a different email.');
          showErrorToast('❌ Email already registered. Please use a different email.', 4000);
          setIsSubmitting(false);
          return;
        }
        
        const finalWorkingHours = activeTab === "clinic" ? clinicHours : normalHours;
        const hospitalId = `HSP${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
        const hospitalData = {
          id: hospitalId,
          hospitalName, 
          email, 
          address: {
            street: streetAddress,
            country: countryName,
            countryCode: countryCode,
            state: stateName,
            stateCode: stateCode,
            city: cityName,
            pincode
          },
          phone, 
          longitude, 
          latitude, 
          hospitalType,
          normalHours, 
          clinicHours, 
          workingHours: finalWorkingHours,
          selectedTab: activeTab, 
          is24x7, 
          password,
          createdAt: new Date().toISOString()
        };
        
        localStorage.setItem('hospitals', JSON.stringify([...existingHospitals, hospitalData]));
        
        // Registration Success Toast with detailed information
        showSuccessToast(
          `✅ Registration Successful! Welcome to the HMS Family!`,
          5000,
          {
            '🏥 Hospital ID': hospitalId,
            '🏥 Hospital Name': hospitalName,
            '📧 Email': email,
            '⚕️ Type': hospitalType,
            '⏰ Working Hours': is24x7 ? '24/7 Available' : (activeTab === 'clinic' ? 'Clinic Schedule' : 'Normal Schedule'),
            '📞 Contact': phone,
            '📍 Address': `${cityName}, ${stateName}, ${countryName} - ${pincode}`
          }
        );
        
        setIsSubmitting(false);
        
        setTimeout(() => {
          showSuccessToast('✨ Redirecting you to login page...', 2000);
          navigate('/sign-in');
        }, 2000);
      }, 1000);
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
            <Input 
              label="Hospital Name" 
              placeholder="Enter hospital name"
              value={hospitalName}
              onChange={(e) => setHospitalName(e.target.value)}
            />
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Hospital Type <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                <select
                  value={hospitalType}
                  onChange={(e) => setHospitalType(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 bg-white text-black font-medium focus:outline-none focus:ring-2 focus:ring-[#154A7D] appearance-none cursor-pointer"
                >
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
            <Input label="Mobile Number" placeholder="Enter mobile number" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          {/* Address Section with Searchable Dropdowns */}
          <div className="rounded-2xl bg-slate-50 p-6 space-y-5">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-[#154A7D]" />
              Address Information
            </h2>

            {/* Searchable Country Dropdown */}
            <SearchableDropdown
              label="Country"
              options={countries}
              value={countryCode}
              onChange={handleCountryChange}
              placeholder="Search for a country..."
              icon={Globe}
              required={true}
              getOptionLabel={(option) => option.name}
              getOptionValue={(option) => option.isoCode}
              optionKey={(option) => option.isoCode}
            />

            {/* Searchable State Dropdown */}
            <SearchableDropdown
              label="State"
              options={states}
              value={stateCode}
              onChange={handleStateChange}
              placeholder="Search for a state..."
              icon={Landmark}
              required={true}
              disabled={!countryCode}
              getOptionLabel={(option) => option.name}
              getOptionValue={(option) => option.isoCode}
              optionKey={(option) => option.isoCode}
            />

            {/* Searchable City Dropdown */}
            <SearchableCityDropdown
              label="District"
              options={cities}
              value={cityName}
              onChange={handleCityChange}
              placeholder="Search for a District..."
              required={true}
              disabled={!stateCode}
            />
             <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Street Address <span className="text-red-500">*</span>
              </label>
              <textarea
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                placeholder="Enter hospital street address"
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#154A7D] bg-white text-black font-medium resize-none"
              />
            </div>
            {/* Pincode */}
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="Pincode * (5-6 digits)"
                maxLength={6}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#154A7D] bg-white text-black font-medium"
              />
            </div>
          </div>

          {/* Coordinates Section */}
          <div className="rounded-2xl bg-slate-50 p-6 space-y-5">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Navigation className="h-5 w-5 text-[#154A7D]" />
              Location Coordinates
            </h2>
            
            <div className="grid md:grid-cols-2 gap-5">
              <Input 
                label="Latitude" 
                placeholder="Enter latitude" 
                value={latitude} 
                onChange={(e) => setLatitude(e.target.value)} 
              />
              <Input 
                label="Longitude" 
                placeholder="Enter longitude" 
                value={longitude} 
                onChange={(e) => setLongitude(e.target.value)} 
              />
            </div>

            {/* Google Maps Location Picker */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Location Picker</label>
              <GoogleMapsLocationPicker
                latitude={latitude}
                longitude={longitude}
                onLocationSelect={handleLocationSelect}
              />
              <p className="text-xs text-gray-500">Click on the map to select your hospital location (coordinates only)</p>
            </div>

            {/* Get Current Location Button */}
            <button
              type="button"
              onClick={getCurrentLocation}
              disabled={locationStatus === 'loading'}
              className={`w-full rounded-xl border py-4 font-medium text-lg flex items-center justify-center gap-3 transition-all duration-200 ${
                locationStatus === 'loading'
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                  : 'bg-[#F5FAFF] text-[#154A7D] border-[#D6E2EE] hover:bg-[#154A7D] hover:text-white hover:border-[#154A7D] hover:shadow-md'
              }`}
            >
              <Navigation size={22} className={locationStatus === 'loading' ? 'animate-pulse' : ''} />
              {locationStatus === 'loading' ? 'Getting your location...' : '📍 Get Current Location Coordinates'}
            </button>

            {/* Location Status Messages */}
            {locationStatus === 'loading' && (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#154A7D]"></div>
                <p className="text-xs text-blue-600 text-center">📍 Fetching your location coordinates...</p>
              </div>
            )}
            {locationStatus === 'success' && (
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <p className="text-xs text-green-600 text-center">✓ Location coordinates captured successfully!</p>
              </div>
            )}
            {locationStatus === 'error' && (
              <div className="flex items-center justify-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <p className="text-xs text-red-600 text-center">❌ Failed to get location. Please enter coordinates manually or use the map.</p>
              </div>
            )}
          </div>

          {/* Working Hours Section */}
          <div className="rounded-2xl bg-slate-50 p-6 space-y-5">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Working Hours</h2>
              <button
                type="button"
                onClick={toggle247Mode}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  is24x7
                    ? "bg-[#154A7D] text-white hover:bg-[#0e3a61] hover:shadow-md"
                    : "bg-white hover:bg-[#154A7D] hover:text-white border border-gray-200 hover:border-[#154A7D] text-gray-700"
                }`}
              >
                <Sun size={14} />
                {is24x7 ? "24/7 Mode: ON" : "Set 24/7 Hours"}
              </button>
            </div>

            <div className="flex gap-6 border-b border-slate-200">
              <button
                type="button"
                onClick={() => { setActiveTab("normal"); if (is24x7) toggle247Mode(); }}
                className={`pb-3 text-sm font-medium transition-all flex items-center gap-2 border-b-2 ${
                  activeTab === "normal" ? "border-[#154A7D] text-[#154A7D]" : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Clock size={16} /> Normal Hospital
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab("clinic"); if (is24x7) toggle247Mode(); }}
                className={`pb-3 text-sm font-medium transition-all flex items-center gap-2 border-b-2 ${
                  activeTab === "clinic" ? "border-[#154A7D] text-[#154A7D]" : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Briefcase size={16} /> Clinic
              </button>
            </div>

            {/* Working Hours Display */}
            {activeTab === "normal" ? (
              <div className="space-y-3">
                {daysOfWeek.map((day) => {
                  const dayKey = day.toLowerCase();
                  const dayHours = normalHours[dayKey] || { start: "09:00", end: "18:00", isHoliday: false };
                  return (
                    <div key={day} className="rounded-xl border border-blue-200 bg-white p-5 shadow-sm">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-[#154A7D] text-lg">{day}</h3>
                        <label className="flex items-center gap-2 text-sm font-medium text-red-600 cursor-pointer">
                          <input type="checkbox" checked={dayHours.isHoliday} onChange={(e) => handleNormalHoursChange(day, 'isHoliday', e.target.checked)} className="w-4 h-4 rounded border-red-400" />
                          Holiday
                        </label>
                      </div>
                      {!dayHours.isHoliday ? (
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Open Time</label>
                            <input type="time" value={dayHours.start} onChange={(e) => handleNormalHoursChange(day, 'start', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#154A7D] outline-none text-black font-medium" />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Close Time</label>
                            <input type="time" value={dayHours.end} onChange={(e) => handleNormalHoursChange(day, 'end', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#154A7D] outline-none text-black font-medium" />
                          </div>
                        </div>
                      ) : <p className="text-sm text-gray-500 italic">Closed for the day</p>}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                {daysOfWeek.map((day) => {
                  const dayKey = day.toLowerCase();
                  const dayHours = clinicHours[dayKey] || { start: "09:00", end: "12:00", isHoliday: false, hasBreak: false, breakStart: "13:00", breakEnd: "14:00", eveningStart: "16:00", eveningEnd: "20:00" };
                  return (
                    <div key={day} className="rounded-xl border border-blue-200 bg-white p-5 space-y-4 shadow-sm">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-[#154A7D] text-lg">{day}</h3>
                        <label className="flex items-center gap-2 text-sm font-medium text-red-600 cursor-pointer">
                          <input type="checkbox" checked={dayHours.isHoliday} onChange={(e) => handleClinicHoursChange(day, 'isHoliday', e.target.checked)} className="w-4 h-4 rounded border-red-400" />
                          Holiday
                        </label>
                      </div>
                      {!dayHours.isHoliday && (
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm font-medium text-slate-500 mb-2">Morning Session</p>
                            <div className="grid md:grid-cols-2 gap-4">
                              <input type="time" value={dayHours.start} onChange={(e) => handleClinicHoursChange(day, 'start', e.target.value)} className="border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#154A7D] outline-none text-black font-medium" />
                              <input type="time" value={dayHours.end} onChange={(e) => handleClinicHoursChange(day, 'end', e.target.value)} className="border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#154A7D] outline-none text-black font-medium" />
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-500 mb-2">Evening Session</p>
                            <div className="grid md:grid-cols-2 gap-4">
                              <input type="time" value={dayHours.eveningStart} onChange={(e) => handleClinicHoursChange(day, 'eveningStart', e.target.value)} className="border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#154A7D] outline-none text-black font-medium" />
                              <input type="time" value={dayHours.eveningEnd} onChange={(e) => handleClinicHoursChange(day, 'eveningEnd', e.target.value)} className="border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#154A7D] outline-none text-black font-medium" />
                            </div>
                          </div>
                          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer pt-2">
                            <input type="checkbox" checked={dayHours.hasBreak} onChange={(e) => handleClinicHoursChange(day, 'hasBreak', e.target.checked)} className="w-4 h-4 rounded" />
                            Has Break Between Sessions
                          </label>
                          {dayHours.hasBreak && (
                            <div className="pl-6 border-l-2 border-blue-200 space-y-3">
                              <p className="text-sm font-medium text-slate-500">Break Time</p>
                              <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">Break Start</label>
                                  <input type="time" value={dayHours.breakStart} onChange={(e) => handleClinicHoursChange(day, 'breakStart', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#154A7D] outline-none text-black font-medium" />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">Break End</label>
                                  <input type="time" value={dayHours.breakEnd} onChange={(e) => handleClinicHoursChange(day, 'breakEnd', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#154A7D] outline-none text-black font-medium" />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {dayHours.isHoliday && <p className="text-sm text-gray-500 italic">Closed for the day</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-slate-50 p-6 space-y-5">
            <h2 className="text-xl font-semibold text-gray-900">Account Security</h2>
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="text-sm font-medium text-gray-700">Password <span className="text-red-500">*</span></label>
                <div className="relative mt-2">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password (min 8 characters)" className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#154A7D] bg-gray-50 text-black font-medium" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Confirm Password <span className="text-red-500">*</span></label>
                <div className="relative mt-2">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#154A7D] bg-gray-50 text-black font-medium" />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500">Password must be at least 8 characters with uppercase, lowercase, and numbers</p>
          </div>

          <Button type="submit" variant="primary" size="lg" fullWidth disabled={isSubmitting} loading={isSubmitting}>
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </Button>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/sign-in" className="text-[#154A7D] hover:text-[#0e3a61] font-medium">
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;