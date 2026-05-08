// src/components/Settings/Settings.jsx - With address information like Register page
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Button, Card, Input, Tabs } from '../ui';
import Security from './Security';
import Preference from './Preference';
import Notification from './Notification';
import UserPermissions from './UserPermissions';
import Billing from './Billing';
import Map from './Map';
import EmailTemplates from './Email';
import { showSuccessToast, showWarningToast, showInfoToast } from '../ui/Toast';
import { Country, State, City } from 'country-state-city';
import { MapPin, ChevronDown } from 'lucide-react'; // Add MapPin here

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
          className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-10 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent ${
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

const Settings = () => {
  const [activeTab, setActiveTab] = useState('General');
  const location = useLocation();

  // Address fields using country-state-city
  const [countryCode, setCountryCode] = useState("");
  const [countryName, setCountryName] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [stateName, setStateName] = useState("");
  const [cityName, setCityName] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [pincode, setPincode] = useState("");

  const [hospitalInfo, setHospitalInfo] = useState({
    name: 'AL ABEER HOSPITAL KIZHISSERI',
    email: 'alabeerh@gmail.com',
    hospitalType: 'Multi-Specialty',
    mobileNumber: '+91 9876543210',
    createdDate: 'N/A',
    lastUpdated: 'November 30, 2025 at 12:54 PM',
  });

  const [workingHours, setWorkingHours] = useState({
    monday: { open: '09:00 AM', close: '06:00 PM', closed: false },
    tuesday: { open: '09:00 AM', close: '06:00 PM', closed: false },
    wednesday: { open: '09:00 AM', close: '06:00 PM', closed: false },
    thursday: { open: '09:00 AM', close: '06:00 PM', closed: false },
    friday: { open: '09:00 AM', close: '06:00 PM', closed: false },
    saturday: { open: '09:00 AM', close: '06:00 PM', closed: false },
    sunday: { open: '09:00 AM', close: '06:00 PM', closed: true },
  });

  const [isEditing, setIsEditing] = useState(false);
  const [is24HourMode, setIs24HourMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: hospitalInfo.name,
    email: hospitalInfo.email,
    hospitalType: hospitalInfo.hospitalType,
    mobileNumber: hospitalInfo.mobileNumber,
    streetAddress: streetAddress,
    countryCode: countryCode,
    countryName: countryName,
    stateCode: stateCode,
    stateName: stateName,
    cityName: cityName,
    pincode: pincode,
  });

  // Get dropdown options
  const countries = Country.getAllCountries();
  const states = State.getStatesOfCountry(editForm.countryCode);
  const cities = City.getCitiesOfState(editForm.countryCode, editForm.stateCode);

  useEffect(() => {
    if (location.state?.tab) setActiveTab(location.state.tab);
  }, [location]);

  // Load saved address data from localStorage on component mount
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('hospitals') || '[]');
    const currentHospital = userData[0]; // Assuming first hospital is current
    if (currentHospital?.address) {
      setStreetAddress(currentHospital.address.street || '');
      setCountryCode(currentHospital.address.countryCode || '');
      setCountryName(currentHospital.address.country || '');
      setStateCode(currentHospital.address.stateCode || '');
      setStateName(currentHospital.address.state || '');
      setCityName(currentHospital.address.city || '');
      setPincode(currentHospital.address.pincode || '');
    }
  }, []);

  const handleEditSubmit = useCallback((e) => {
    e.preventDefault();
    setIsSaving(true);
    
    setTimeout(() => {
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
      
      // Save address changes
      setStreetAddress(editForm.streetAddress);
      setCountryCode(editForm.countryCode);
      setCountryName(editForm.countryName);
      setStateCode(editForm.stateCode);
      setStateName(editForm.stateName);
      setCityName(editForm.cityName);
      setPincode(editForm.pincode);
      
      showSuccessToast(
        'Hospital information updated successfully!',
        4000,
        {
          'Hospital Name': editForm.name,
          'Email': editForm.email,
          'Type': editForm.hospitalType,
          'Address': `${editForm.streetAddress}, ${editForm.cityName}, ${editForm.stateName}, ${editForm.countryName} - ${editForm.pincode}`
        }
      );
      
      setIsEditing(false);
      setIsSaving(false);
    }, 500);
  }, [editForm]);

  const handleEditClick = useCallback(() => {
    setEditForm({
      name: hospitalInfo.name,
      email: hospitalInfo.email,
      hospitalType: hospitalInfo.hospitalType,
      mobileNumber: hospitalInfo.mobileNumber,
      streetAddress: streetAddress,
      countryCode: countryCode,
      countryName: countryName,
      stateCode: stateCode,
      stateName: stateName,
      cityName: cityName,
      pincode: pincode,
    });
    setIsEditing(true);
  }, [hospitalInfo, streetAddress, countryCode, countryName, stateCode, stateName, cityName, pincode]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleCountryChange = useCallback((code, name) => {
    setEditForm(prev => ({
      ...prev,
      countryCode: code,
      countryName: name,
      stateCode: '',
      stateName: '',
      cityName: ''
    }));
  }, []);

  const handleStateChange = useCallback((code, name) => {
    setEditForm(prev => ({
      ...prev,
      stateCode: code,
      stateName: name,
      cityName: ''
    }));
  }, []);

  const handleCityChange = useCallback((name) => {
    setEditForm(prev => ({ ...prev, cityName: name }));
  }, []);

  const handleWorkingHourChange = useCallback((day, field, value) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
    showInfoToast(`${day} ${field} updated to ${value}`, 1500);
  }, []);

  const handleToggleClosed = useCallback((day) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: { ...prev[day], closed: !prev[day].closed }
    }));
    const newStatus = !workingHours[day].closed;
    showInfoToast(`${day} is now ${newStatus ? 'closed' : 'open'}`, 2000);
  }, [workingHours]);

  const handleSet24HourMode = useCallback(() => {
    if (is24HourMode) {
      setWorkingHours({
        monday: { open: '09:00 AM', close: '06:00 PM', closed: false },
        tuesday: { open: '09:00 AM', close: '06:00 PM', closed: false },
        wednesday: { open: '09:00 AM', close: '06:00 PM', closed: false },
        thursday: { open: '09:00 AM', close: '06:00 PM', closed: false },
        friday: { open: '09:00 AM', close: '06:00 PM', closed: false },
        saturday: { open: '09:00 AM', close: '06:00 PM', closed: false },
        sunday: { open: '09:00 AM', close: '06:00 PM', closed: true },
      });
      showWarningToast('24/7 mode disabled. Normal working hours restored.', 3000);
    } else {
      const newHours = {};
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      days.forEach(day => {
        newHours[day] = { open: '00:00 AM', close: '11:59 PM', closed: false };
      });
      setWorkingHours(newHours);
      showSuccessToast('24/7 mode enabled. Hospital will be open all day, every day.', 4000);
    }
    setIs24HourMode(!is24HourMode);
  }, [is24HourMode]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    showWarningToast('Edit cancelled. Changes discarded.', 2000);
  }, []);

  const tabs = useMemo(() => ['General', 'Security', 'Preferences', 'Notifications', 'Email Templates', 'User Permissions', 'Map'], []);

  const days = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
  ];

  const GeneralTab = useMemo(() => (
    <div className="space-y-8">
      <Card>
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Account Settings</h2>
          <p className="text-sm text-gray-500">Update your hospital account information</p>
        </div>
        <div className="p-6">
          {!isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700">Hospital Name</label><p className="mt-1 text-gray-900 font-medium">{hospitalInfo.name}</p></div>
                <div><label className="block text-sm font-medium text-gray-700">Email Address</label><p className="mt-1 text-gray-900">{hospitalInfo.email}</p></div>
                <div><label className="block text-sm font-medium text-gray-700">Hospital Type</label><p className="mt-1 text-gray-900">{hospitalInfo.hospitalType}</p></div>
                <div><label className="block text-sm font-medium text-gray-700">Mobile Number</label><p className="mt-1 text-gray-900">{hospitalInfo.mobileNumber}</p></div>
              </div>
              
              {/* Address Display */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h3 className="text-md font-semibold text-gray-900 mb-3">Address Information</h3>
                <div className="grid grid-cols-1 gap-3">
                  <div><label className="block text-sm font-medium text-gray-700">Street Address</label><p className="mt-1 text-gray-900">{streetAddress || 'Not provided'}</p></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-gray-700">Country</label><p className="mt-1 text-gray-900">{countryName || 'Not provided'}</p></div>
                    <div><label className="block text-sm font-medium text-gray-700">State</label><p className="mt-1 text-gray-900">{stateName || 'Not provided'}</p></div>
                    <div><label className="block text-sm font-medium text-gray-700">City</label><p className="mt-1 text-gray-900">{cityName || 'Not provided'}</p></div>
                    <div><label className="block text-sm font-medium text-gray-700">Pincode</label><p className="mt-1 text-gray-900">{pincode || 'Not provided'}</p></div>
                  </div>
                </div>
              </div>
              
              <Button variant="primary" onClick={handleEditClick} className="mt-4">Edit Settings</Button>
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
                    <option value="General Hospital">General Hospital</option>
                    <option value="Multi-Specialty">Multi-Specialty</option>
                    <option value="Super Specialty">Super Specialty</option>
                    <option value="Teaching Hospital">Teaching Hospital</option>
                    <option value="Clinic">Clinic</option>
                    <option value="Nursing Home">Nursing Home</option>
                  </select>
                </div>
                
                <Input label="Mobile Number" name="mobileNumber" value={editForm.mobileNumber} onChange={handleInputChange} required />
              </div>

              {/* Address Edit Section */}
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
              
              <div className="flex space-x-3 pt-4">
                <Button type="submit" variant="primary" disabled={isSaving} loading={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
              </div>
            </form>
          )}
        </div>
      </Card>

      {/* Working Hours Section */}
      <Card>
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Working Hours</h2>
          <p className="text-sm text-gray-500">Set your hospital operating hours</p>
        </div>
        <div className="p-6">
          <div className="mb-6">
            <button
              type="button"
              onClick={handleSet24HourMode}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                is24HourMode 
                  ? 'bg-red-100 text-red-700 border border-red-300' 
                  : 'bg-[#1C62A0] text-white hover:bg-[#154d7a]'
              }`}
            >
              {is24HourMode ? 'Disable 24/7 Hours' : 'Set 24/7 Hours'}
            </button>
          </div>
          
          <div className="space-y-4">
            {days.map((day) => (
              <div key={day.key} className="border-b border-gray-200 pb-4 last:border-0">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">{day.label}</h3>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={workingHours[day.key].closed}
                      onChange={() => handleToggleClosed(day.key)}
                      className="rounded border-gray-300 text-[#1C62A0] focus:ring-[#1C62A0]"
                    />
                    <span className="text-sm text-gray-600">Closed for the day</span>
                  </label>
                </div>
                
                {!workingHours[day.key].closed && (
                  <div className="grid grid-cols-2 gap-4 ml-6">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Open Time</label>
                      <select
                        value={workingHours[day.key].open}
                        onChange={(e) => handleWorkingHourChange(day.key, 'open', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1C62A0]"
                      >
                        {['12:00 AM', '01:00 AM', '02:00 AM', '03:00 AM', '04:00 AM', '05:00 AM', '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM', '10:00 PM', '11:00 PM'].map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Close Time</label>
                      <select
                        value={workingHours[day.key].close}
                        onChange={(e) => handleWorkingHourChange(day.key, 'close', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1C62A0]"
                      >
                        {['12:00 AM', '01:00 AM', '02:00 AM', '03:00 AM', '04:00 AM', '05:00 AM', '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM', '10:00 PM', '11:00 PM'].map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Account Information Card */}
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
  ), [isEditing, hospitalInfo, editForm, workingHours, is24HourMode, isSaving, streetAddress, countryName, stateName, cityName, pincode, countries, states, cities, handleEditClick, handleEditSubmit, handleInputChange, handleCancelEdit, handleWorkingHourChange, handleToggleClosed, handleSet24HourMode, handleCountryChange, handleStateChange, handleCityChange]);

  const renderTabContent = useCallback(() => {
    switch (activeTab) {
      case 'General': return GeneralTab;
      case 'Security': return <Security />;
      case 'Preferences': return <Preference />;
      case 'Notifications': return <Notification />;
      case 'Email Templates': return <EmailTemplates />;
      case 'User Permissions': return <UserPermissions />;
      case 'Map': return <Map />;
      default: return null;
    }
  }, [activeTab, GeneralTab]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1">Manage your account settings</p>
        </div>
        
        <Tabs tabs={tabs.map(tab => ({ id: tab, label: tab }))} activeTab={activeTab} onTabChange={setActiveTab} className="mb-6" />
        
        <div className="mt-6">{renderTabContent()}</div>
        
        <div className="mt-12 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-400">© DreamS EMR - All Rights Reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;