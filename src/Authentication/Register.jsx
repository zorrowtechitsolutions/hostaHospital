// src/Authentication/Register.jsx - Refactored with global UI components
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Mail, Lock, MapPin, Building, Building2,
  Phone, AlertCircle, Eye, EyeOff, Navigation,
  Clock, Sun, Briefcase, ChevronDown
} from 'lucide-react';
import GoogleMapsLocationPicker from './GoogleMapsLocationPicker';
import { Input, Select, Textarea, Button, Alert, Card } from '../components/ui';

const Register = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("normal");
  const [is24x7, setIs24x7] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [hospitalName, setHospitalName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [longitude, setLongitude] = useState("");
  const [latitude, setLatitude] = useState("");
  const [hospitalType, setHospitalType] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
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
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    const checkGoogleMaps = setInterval(() => {
      if (window.google && window.google.maps && window.google.maps.Geocoder) {
        setIsGoogleMapsLoaded(true);
        clearInterval(checkGoogleMaps);
      }
    }, 100);
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
    }
  };

  const getCurrentLocation = () => {
    setLocationStatus('loading');
    if (!navigator.geolocation) {
      setLocationStatus('error');
      setTimeout(() => setLocationStatus(''), 3000);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat.toString());
        setLongitude(lng.toString());

        if (window.google && window.google.maps && window.google.maps.Geocoder) {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
              setAddress(results[0].formatted_address);
            }
          });
        }
        setLocationStatus('success');
        setTimeout(() => setLocationStatus(''), 3000);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocationStatus('error');
        setTimeout(() => setLocationStatus(''), 3000);
      }
    );
  };

  const handleLocationSelect = (lat, lng, addressText) => {
    setLatitude(lat.toString());
    setLongitude(lng.toString());
    if (addressText) setAddress(addressText);
    setLocationStatus('success');
    setTimeout(() => setLocationStatus(''), 3000);
  };

  const validateForm = () => {
    if (!hospitalName) { setRegisterError('Hospital name is required'); return false; }
    if (!email) { setRegisterError('Email is required'); return false; }
    if (!/^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/.test(email)) { setRegisterError('Please enter a valid email address'); return false; }
    if (!phone) { setRegisterError('Phone number is required'); return false; }
    if (!address) { setRegisterError('Address is required'); return false; }
    if (!hospitalType) { setRegisterError('Please select hospital type'); return false; }
    if (!password) { setRegisterError('Password is required'); return false; }
    if (password.length < 8) { setRegisterError('Password must be at least 8 characters'); return false; }
    if (password !== confirmPassword) { setRegisterError('Passwords do not match'); return false; }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      setIsSubmitting(true);
      setRegisterError('');
      
      setTimeout(() => {
        const existingHospitals = JSON.parse(localStorage.getItem('hospitals') || '[]');
        if (existingHospitals.some(h => h.email === email)) {
          setRegisterError('Email already registered. Please use a different email.');
          setIsSubmitting(false);
          return;
        }
        
        const finalWorkingHours = activeTab === "clinic" ? clinicHours : normalHours;
        const hospitalData = {
          id: `HSP${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
          hospitalName, email, address, phone, longitude, latitude, hospitalType,
          normalHours, clinicHours, workingHours: finalWorkingHours,
          selectedTab: activeTab, is24x7, password,
          createdAt: new Date().toISOString()
        };
        
        localStorage.setItem('hospitals', JSON.stringify([...existingHospitals, hospitalData]));
        alert('Hospital account created successfully! Please login.');
        setIsSubmitting(false);
        navigate('/sign-in');
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

          <div className="grid md:grid-cols-2 gap-5">
            <Textarea label="Address" placeholder="Enter hospital address" value={address} onChange={(e) => setAddress(e.target.value)} />
            <div className="space-y-5">
              <Input label="Latitude" placeholder="Enter latitude" value={latitude} onChange={(e) => setLatitude(e.target.value)} />
              <Input label="Longitude" placeholder="Enter longitude" value={longitude} onChange={(e) => setLongitude(e.target.value)} />
            </div>
          </div>

          {/* Google Maps Location Picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Location Picker</label>
            <GoogleMapsLocationPicker
              latitude={latitude}
              longitude={longitude}
              onLocationSelect={handleLocationSelect}
            />
            <p className="text-xs text-gray-500">Click on the map to select your hospital location</p>
          </div>

          {/* Get Current Location Button */}
          <button
            type="button"
            onClick={getCurrentLocation}
            className="w-full rounded-xl border border-[#D6E2EE] bg-[#F5FAFF] text-[#154A7D] py-4 font-medium text-lg flex items-center justify-center gap-3 transition-all duration-200 hover:bg-[#154A7D] hover:text-white hover:border-[#154A7D] hover:shadow-md"
          >
            <Navigation size={22} />
            Get Current Location
          </button>

          {locationStatus === 'loading' && <p className="text-xs text-blue-600 text-center">📍 Getting your location...</p>}
          {locationStatus === 'success' && <p className="text-xs text-green-600 text-center">✓ Location acquired successfully!</p>}
          {locationStatus === 'error' && <p className="text-xs text-red-600 text-center">❌ Failed to get location. Please enter manually.</p>}

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
                  <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#154A7D] bg-gray-50 text-black font-medium" />
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