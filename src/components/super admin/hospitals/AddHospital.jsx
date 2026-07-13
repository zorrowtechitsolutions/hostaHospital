// src/components/super-admin/hospitals/AddHospital.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, Lock, Building, Building2, MapPin, Globe, Landmark, Home, CreditCard,
  Phone, Eye, EyeOff, Navigation, ArrowLeft,
  Clock, Sun, Briefcase, ChevronDown, CheckCircle, XCircle, FileText
} from 'lucide-react';
import GoogleMapsLocationPicker from '../../../Authentication/GoogleMapsLocationPicker';
import { Input, Button, Alert } from '../../ui';
import { showSuccessToast, showErrorToast, showWarningToast, showInfoToast } from '../../ui/Toast';
import { Country, State, City } from 'country-state-city';
import { useAddNewHospitalMutation } from '../../../../app/service/hospitalApi';
import { useGetCategoryQuery } from '../../../../app/service/category';

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

const AddHospital = () => {
  const navigate = useNavigate();
  const [addHospital, { isLoading: isApiLoading }] = useAddNewHospitalMutation();
  
  // ✅ Working Hours Type
  const [workingHourType, setWorkingHourType] = useState("normal");
  const [is24x7, setIs24x7] = useState(false);
  const [showPassword, setShowPassword] = useState(false);     
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleMapsReady, setIsGoogleMapsReady] = useState(false);
  
  const { data: categoriesData, isLoading: isLoadingCategories } = useGetCategoryQuery({
    isActive: true,
    limit: 100
  });

  const categories = categoriesData?.data && Array.isArray(categoriesData.data) 
    ? categoriesData.data 
    : [];
  
  const [hospitalName, setHospitalName] = useState("");
  const [about, setAbout] = useState("");
  const [email, setEmail] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [emergencyNumber, setEmergencyNumber] = useState("");
  const [longitude, setLongitude] = useState("");
  const [latitude, setLatitude] = useState("");
  const [hospitalCategory, setHospitalCategory] = useState("");
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
  
  // ✅ Normal Hours (for "normal" type)
  const [normalHours, setNormalHours] = useState({
    monday: { start: "09:00", end: "18:00", isHoliday: false },
    tuesday: { start: "09:00", end: "18:00", isHoliday: false },
    wednesday: { start: "09:00", end: "18:00", isHoliday: false },
    thursday: { start: "09:00", end: "18:00", isHoliday: false },
    friday: { start: "09:00", end: "18:00", isHoliday: false },
    saturday: { start: "09:00", end: "18:00", isHoliday: false },
    sunday: { start: "09:00", end: "18:00", isHoliday: true }
  });

  // ✅ Clinic Hours (for "clinic" type)
  const [clinicHours, setClinicHours] = useState({
    monday: { start: "09:00", end: "18:00", isHoliday: false },
    tuesday: { start: "09:00", end: "18:00", isHoliday: false },
    wednesday: { start: "09:00", end: "18:00", isHoliday: false },
    thursday: { start: "09:00", end: "18:00", isHoliday: false },
    friday: { start: "09:00", end: "18:00", isHoliday: false },
    saturday: { start: "09:00", end: "18:00", isHoliday: false },
    sunday: { start: "09:00", end: "18:00", isHoliday: true }
  });

  // ✅ Clinic Break Hours (for "clinic-break" type)
  const [clinicBreakHours, setClinicBreakHours] = useState({
    monday: { morningStart: "09:00", morningEnd: "12:00", eveningStart: "16:00", eveningEnd: "20:00", isHoliday: false },
    tuesday: { morningStart: "09:00", morningEnd: "12:00", eveningStart: "16:00", eveningEnd: "20:00", isHoliday: false },
    wednesday: { morningStart: "09:00", morningEnd: "12:00", eveningStart: "16:00", eveningEnd: "20:00", isHoliday: false },
    thursday: { morningStart: "09:00", morningEnd: "12:00", eveningStart: "16:00", eveningEnd: "20:00", isHoliday: false },
    friday: { morningStart: "09:00", morningEnd: "12:00", eveningStart: "16:00", eveningEnd: "20:00", isHoliday: false },
    saturday: { morningStart: "09:00", morningEnd: "12:00", eveningStart: "16:00", eveningEnd: "20:00", isHoliday: false },
    sunday: { morningStart: "09:00", morningEnd: "12:00", eveningStart: "16:00", eveningEnd: "20:00", isHoliday: true }
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

  // ✅ Normal Hours handlers
  const handleNormalHoursChange = (day, field, value) => {
    const dayKey = day.toLowerCase();
    setNormalHours(prev => ({ ...prev, [dayKey]: { ...prev[dayKey], [field]: value } }));
  };

  // ✅ Clinic Hours handlers
  const handleClinicHoursChange = (day, field, value) => {
    const dayKey = day.toLowerCase();
    setClinicHours(prev => ({ ...prev, [dayKey]: { ...prev[dayKey], [field]: value } }));
  };

  // ✅ Clinic Break Hours handlers
  const handleClinicBreakHoursChange = (day, field, value) => {
    const dayKey = day.toLowerCase();
    setClinicBreakHours(prev => ({ ...prev, [dayKey]: { ...prev[dayKey], [field]: value } }));
  };

  const toggle247Mode = () => {
    if (!is24x7) {
      if (workingHourType === "normal") {
        const newHours = {};
        daysOfWeek.forEach(day => {
          newHours[day.toLowerCase()] = { start: "00:00", end: "23:59", isHoliday: false };
        });
        setNormalHours(newHours);
      } else if (workingHourType === "clinic") {
        const newHours = {};
        daysOfWeek.forEach(day => {
          newHours[day.toLowerCase()] = { start: "00:00", end: "23:59", isHoliday: false };
        });
        setClinicHours(newHours);
      } else {
        const newHours = {};
        daysOfWeek.forEach(day => {
          newHours[day.toLowerCase()] = { morningStart: "00:00", morningEnd: "11:59", eveningStart: "12:00", eveningEnd: "23:59", isHoliday: false };
        });
        setClinicBreakHours(newHours);
      }
      setIs24x7(true);
      showSuccessToast('24/7 mode enabled.', 4000);
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
        monday: { start: "09:00", end: "18:00", isHoliday: false },
        tuesday: { start: "09:00", end: "18:00", isHoliday: false },
        wednesday: { start: "09:00", end: "18:00", isHoliday: false },
        thursday: { start: "09:00", end: "18:00", isHoliday: false },
        friday: { start: "09:00", end: "18:00", isHoliday: false },
        saturday: { start: "09:00", end: "18:00", isHoliday: false },
        sunday: { start: "09:00", end: "18:00", isHoliday: true }
      };
      const defaultClinicBreakHours = {
        monday: { morningStart: "09:00", morningEnd: "12:00", eveningStart: "16:00", eveningEnd: "20:00", isHoliday: false },
        tuesday: { morningStart: "09:00", morningEnd: "12:00", eveningStart: "16:00", eveningEnd: "20:00", isHoliday: false },
        wednesday: { morningStart: "09:00", morningEnd: "12:00", eveningStart: "16:00", eveningEnd: "20:00", isHoliday: false },
        thursday: { morningStart: "09:00", morningEnd: "12:00", eveningStart: "16:00", eveningEnd: "20:00", isHoliday: false },
        friday: { morningStart: "09:00", morningEnd: "12:00", eveningStart: "16:00", eveningEnd: "20:00", isHoliday: false },
        saturday: { morningStart: "09:00", morningEnd: "12:00", eveningStart: "16:00", eveningEnd: "20:00", isHoliday: false },
        sunday: { morningStart: "09:00", morningEnd: "12:00", eveningStart: "16:00", eveningEnd: "20:00", isHoliday: true }
      };
      
      if (workingHourType === "normal") setNormalHours(defaultNormalHours);
      else if (workingHourType === "clinic") setClinicHours(defaultClinicHours);
      else setClinicBreakHours(defaultClinicBreakHours);
      
      setIs24x7(false);
      showWarningToast('24/7 mode disabled.', 3000);
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
    if (!hospitalCategory) { setRegisterError('Please select hospital category'); showWarningToast('Please select hospital category', 3000); return false; }
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

  // ✅ Convert to API format based on selected type
  const convertToApiWorkingHours = () => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const result = [];
    
    if (workingHourType === "normal") {
      days.forEach(day => {
        const dayData = normalHours[day];
        result.push({
          day: day,
          is_holiday: dayData?.isHoliday || false,
          opening_time: dayData?.start || '09:00',
          closing_time: dayData?.end || '18:00'
        });
      });
    } else if (workingHourType === "clinic") {
      days.forEach(day => {
        const dayData = clinicHours[day];
        result.push({
          day: day,
          is_holiday: dayData?.isHoliday || false,
          opening_time: dayData?.start || '09:00',
          closing_time: dayData?.end || '18:00'
        });
      });
    } else if (workingHourType === "clinic-break") {
      days.forEach(day => {
        const dayData = clinicBreakHours[day];
        result.push({
          day: day,
          is_holiday: dayData?.isHoliday || false,
          morning_start: dayData?.morningStart || '09:00',
          morning_end: dayData?.morningEnd || '12:00',
          evening_start: dayData?.eveningStart || '16:00',
          evening_end: dayData?.eveningEnd || '20:00'
        });
      });
    }
    
    return result;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      setIsSubmitting(true);
      setRegisterError('');
      showInfoToast('Creating hospital account...', 2000);
      
      const apiWorkingHours = convertToApiWorkingHours();

      const selectedCategory = categories.find(cat => cat._id === hospitalCategory || cat.id === hospitalCategory);
      
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
        categoryId: selectedCategory?._id || selectedCategory?.id || hospitalCategory,
        categoryName: selectedCategory?.name || "",
        emergencyContact: emergencyNumber,
        latitude: latitude ? Number(parseFloat(latitude).toFixed(6)) : null,
        longitude: longitude ? Number(parseFloat(longitude).toFixed(6)) : null,
        about: about || "",
        workingHourType: workingHourType,
        workingHoursData: apiWorkingHours
      };

      console.log('Submitting hospital data:', hospitalData);

      try {
        await addHospital(hospitalData).unwrap();
        showSuccessToast(`✅ ${hospitalName} has been successfully registered!`, 5000);
        setIsSubmitting(false);
        setTimeout(() => {
          navigate('/super-admin/hospitals');
        }, 2000);
      } catch (error) {
        let errorMessage = "Registration failed. Please try again.";
        if (error.data?.message) errorMessage = error.data.message;
        else if (error.status === 409) errorMessage = "Email already registered. Please use a different email.";
        setRegisterError(errorMessage);
        showErrorToast(`❌ ${errorMessage}`, 4000);
        setIsSubmitting(false);
      }
    }
  };

  const handleBack = () => {
    navigate('/super-admin/hospitals');
  };

  // ✅ Render Normal Hours
  const renderNormalHours = () => {
    return daysOfWeek.map((day) => {
      const dayHours = normalHours[day.toLowerCase()] || { start: "09:00", end: "18:00", isHoliday: false };
      return (
        <div key={day} className="rounded-xl border border-blue-200 bg-white p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-[#154A7D] text-lg">{day}</h3>
            <label className="flex items-center gap-2 text-sm font-medium text-red-600 cursor-pointer">
              <input 
                type="checkbox" 
                checked={dayHours.isHoliday} 
                onChange={(e) => handleNormalHoursChange(day, 'isHoliday', e.target.checked)} 
                className="w-4 h-4 rounded border-red-400" 
              />
              Holiday
            </label>
          </div>
          {!dayHours.isHoliday ? (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Open Time</label>
                <input 
                  type="time" 
                  value={dayHours.start} 
                  onChange={(e) => handleNormalHoursChange(day, 'start', e.target.value)} 
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#154A7D] outline-none text-black font-medium" 
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Close Time</label>
                <input 
                  type="time" 
                  value={dayHours.end} 
                  onChange={(e) => handleNormalHoursChange(day, 'end', e.target.value)} 
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#154A7D] outline-none text-black font-medium" 
                />
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">Closed for the day</p>
          )}
        </div>
      );
    });
  };

  // ✅ Render Clinic Hours
  const renderClinicHours = () => {
    return daysOfWeek.map((day) => {
      const dayHours = clinicHours[day.toLowerCase()] || { start: "09:00", end: "18:00", isHoliday: false };
      return (
        <div key={day} className="rounded-xl border border-blue-200 bg-white p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-[#154A7D] text-lg">{day}</h3>
            <label className="flex items-center gap-2 text-sm font-medium text-red-600 cursor-pointer">
              <input 
                type="checkbox" 
                checked={dayHours.isHoliday} 
                onChange={(e) => handleClinicHoursChange(day, 'isHoliday', e.target.checked)} 
                className="w-4 h-4 rounded border-red-400" 
              />
              Holiday
            </label>
          </div>
          {!dayHours.isHoliday ? (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Opening Time</label>
                <input 
                  type="time" 
                  value={dayHours.start} 
                  onChange={(e) => handleClinicHoursChange(day, 'start', e.target.value)} 
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#154A7D] outline-none text-black font-medium" 
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Closing Time</label>
                <input 
                  type="time" 
                  value={dayHours.end} 
                  onChange={(e) => handleClinicHoursChange(day, 'end', e.target.value)} 
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#154A7D] outline-none text-black font-medium" 
                />
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">Closed for the day</p>
          )}
        </div>
      );
    });
  };

  // ✅ Render Clinic Break Hours
  const renderClinicBreakHours = () => {
    return daysOfWeek.map((day) => {
      const dayHours = clinicBreakHours[day.toLowerCase()] || { 
        morningStart: "09:00", morningEnd: "12:00", 
        eveningStart: "16:00", eveningEnd: "20:00", 
        isHoliday: false 
      };
      return (
        <div key={day} className="rounded-xl border border-blue-200 bg-white p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-[#154A7D] text-lg">{day}</h3>
            <label className="flex items-center gap-2 text-sm font-medium text-red-600 cursor-pointer">
              <input 
                type="checkbox" 
                checked={dayHours.isHoliday} 
                onChange={(e) => handleClinicBreakHoursChange(day, 'isHoliday', e.target.checked)} 
                className="w-4 h-4 rounded border-red-400" 
              />
              Holiday
            </label>
          </div>
          {!dayHours.isHoliday ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Morning Session</label>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <input 
                      type="time" 
                      value={dayHours.morningStart} 
                      onChange={(e) => handleClinicBreakHoursChange(day, 'morningStart', e.target.value)} 
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#154A7D] outline-none text-black font-medium" 
                    />
                  </div>
                  <div>
                    <input 
                      type="time" 
                      value={dayHours.morningEnd} 
                      onChange={(e) => handleClinicBreakHoursChange(day, 'morningEnd', e.target.value)} 
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#154A7D] outline-none text-black font-medium" 
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Evening Session</label>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <input 
                      type="time" 
                      value={dayHours.eveningStart} 
                      onChange={(e) => handleClinicBreakHoursChange(day, 'eveningStart', e.target.value)} 
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#154A7D] outline-none text-black font-medium" 
                    />
                  </div>
                  <div>
                    <input 
                      type="time" 
                      value={dayHours.eveningEnd} 
                      onChange={(e) => handleClinicBreakHoursChange(day, 'eveningEnd', e.target.value)} 
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#154A7D] outline-none text-black font-medium" 
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">Closed for the day</p>
          )}
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-[#154A7D] transition-colors duration-200 group rounded-lg hover:bg-gray-50"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to Hospitals</span>
            </button>
          </div>
        </div>
      </div>

      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm p-8 space-y-8">
            <div className="text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-xl bg-[#154A7D] text-white flex items-center justify-center text-2xl font-bold">
                <Building className="h-7 w-7" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Create A Hospital</h1>
              <p className="text-slate-500">Create your hospital to get started with our management system</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {registerError && <Alert type="error" message={registerError} />}

              <div className="grid md:grid-cols-2 gap-5">
                <Input label="Hospital Name" placeholder="Enter hospital name" value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} required />
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                    <select 
                      value={hospitalCategory} 
                      onChange={(e) => setHospitalCategory(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 bg-white text-black font-medium focus:outline-none focus:ring-2 focus:ring-[#154A7D] appearance-none cursor-pointer"
                      disabled={isLoadingCategories}
                    >
                      <option value="">
                        {isLoadingCategories ? 'Loading categories...' : 'Select hospital category'}
                      </option>
                      {categories.map((category) => (
                        <option key={category._id || category.id} value={category._id || category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <Input label="Email" type="email" placeholder="Enter email address" value={email} onChange={(e) => setEmail(e.target.value)} required />
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

              {/* ✅ Working Hours Section */}
              <div className="rounded-2xl bg-slate-50 p-6 space-y-5">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                      <Clock size={20} className="text-[#154A7D]" />
                      Working Hours
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Select the working hours type for your hospital</p>
                  </div>
                  <button type="button" onClick={toggle247Mode} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${is24x7 ? "bg-[#154A7D] text-white hover:bg-[#0e3a61] hover:shadow-md" : "bg-white hover:bg-[#154A7D] hover:text-white border border-gray-200 hover:border-[#154A7D] text-gray-700"}`}>
                    <Sun size={14} />
                    {is24x7 ? "24/7 Mode: ON" : "Set 24/7 Hours"}
                  </button>
                </div>

                {/* ✅ Working Hours Type Dropdown */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Working Hours Type <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none z-10" />
                    <select
                      value={workingHourType}
                      onChange={(e) => setWorkingHourType(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 bg-white text-black font-medium focus:outline-none focus:ring-2 focus:ring-[#154A7D] appearance-none cursor-pointer"
                    >
                      <option value="normal">🏥 Normal Hospital</option>
                      <option value="clinic">🏪 Clinic</option>
                      <option value="clinic-break">🏪 Clinic with Break</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
                  <p className="text-xs text-gray-500">
                    {workingHourType === "normal" && "Single session per day (e.g., 9:00 AM - 6:00 PM)"}
                    {workingHourType === "clinic" && "Single session per day without break (e.g., 9:00 AM - 6:00 PM)"}
                    {workingHourType === "clinic-break" && "Two sessions per day with a break (Morning & Evening)"}
                  </p>
                </div>

                {/* ✅ Render based on selected type */}
                <div className="space-y-3 mt-4">
                  {workingHourType === "normal" && renderNormalHours()}
                  {workingHourType === "clinic" && renderClinicHours()}
                  {workingHourType === "clinic-break" && renderClinicBreakHours()}
                </div>
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
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddHospital;