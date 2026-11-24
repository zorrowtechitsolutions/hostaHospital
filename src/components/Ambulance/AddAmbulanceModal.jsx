// src/components/Ambulance/AddAmbulanceModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Modal, Input, Button, CustomSelect } from '../ui';
import { CreditCard, MapPin, Home, ChevronDown, CheckCircle } from 'lucide-react';
import { useGetPincodeQuery } from '../../../app/service/pincodeApi';
import { showErrorToast } from '../ui/Toast';

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
          className={`w-full pl-10 pr-10 py-3 rounded-xl border ${
            showError ? 'border-red-500' : 'border-gray-200'
          } focus:outline-none focus:ring-2 focus:ring-[#154A7D] bg-white text-black font-medium ${
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
          No results found
        </div>
      )}

      {showError && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
};

const AddAmbulanceModal = ({ 
  isOpen, 
  onClose, 
  onSave
}) => {
  const [formData, setFormData] = useState({
    serviceName: '',
    address: {
      country: 'India',
      state: '',
      district: '',
      localArea: '',
      place: '',
      pincode: ''
    },
    phone: '',
    vehicleType: ''
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ Pincode API integration
  const {
    currentData: pincodeData,
    isFetching: isPincodeLoading,
    isError: isPincodeError,
  } = useGetPincodeQuery(formData.address.pincode, {
    skip: !/^\d{6}$/.test(formData.address.pincode),
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
        address: {
          ...prev.address,
          state: firstOffice.State,
          district: firstOffice.District,
          localArea: ''
        }
      }));
    } else if (formData.address.pincode.length === 6 && pincodeData) {
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          state: '',
          district: '',
          localArea: ''
        }
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pincodeData]);

  // ✅ Handle pincode change
  const handlePincodeChange = (value) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 6);

    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        pincode: cleaned,
        state: '',
        district: '',
        localArea: ''
      }
    }));

    if (errors['address.pincode']) {
      setErrors(prev => ({ ...prev, 'address.pincode': '' }));
    }
  };

  // Validation functions
  const validateServiceName = (name) => {
    if (!name || name.trim() === '') return 'Service name is required';
    if (name.length < 3) return 'Service name must be at least 3 characters';
    if (name.length > 100) return 'Service name must be less than 100 characters';
    return '';
  };

  const validatePhone = (phone) => {
    if (!phone || phone.trim() === '') return 'Phone number is required';
    const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{3,5}[-\s\.]?[0-9]{4,6}$/;
    if (!phoneRegex.test(phone)) return 'Please enter a valid phone number';
    return '';
  };

  const validateVehicleType = (type) => {
    if (!type || type.trim() === '') return 'Vehicle type is required';
    if (type.length < 2) return 'Vehicle type must be at least 2 characters';
    if (type.length > 100) return 'Vehicle type must be less than 100 characters';
    return '';
  };

  const validatePincode = (pincode) => {
    if (!pincode) return 'Pincode is required';
    const pincodeStr = String(pincode);
    if (!/^\d{6}$/.test(pincodeStr)) return 'Please enter a valid 6-digit pincode';
    return '';
  };

  const validateField = (name, value) => {
    if (name === 'serviceName') return validateServiceName(value);
    if (name === 'phone') return validatePhone(value);
    if (name === 'vehicleType') return validateVehicleType(value);
    if (name === 'address.pincode') return validatePincode(value);
    if (name === 'address.country') return !value ? 'Country is required' : '';
    if (name === 'address.state') return !value ? 'State is required' : '';
    if (name === 'address.district') return !value ? 'District is required' : '';
    if (name === 'address.localArea') return !value ? 'Local area is required' : '';
    if (name === 'address.place') return !value ? 'Place is required' : '';
    return '';
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    let value;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      value = formData[parent]?.[child];
    } else {
      value = formData[name];
    }
    
    const error = validateField(name, value);
    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // ✅ Handle local area change
  const handleLocalAreaChange = (name) => {
    setFormData(prev => ({
      ...prev,
      address: { ...prev.address, localArea: name }
    }));
    setTouched(prev => ({ ...prev, 'address.localArea': true }));
    if (errors['address.localArea']) {
      setErrors(prev => ({ ...prev, 'address.localArea': '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    const serviceNameError = validateServiceName(formData.serviceName);
    if (serviceNameError) newErrors.serviceName = serviceNameError;
    
    const phoneError = validatePhone(formData.phone);
    if (phoneError) newErrors.phone = phoneError;
    
    const vehicleTypeError = validateVehicleType(formData.vehicleType);
    if (vehicleTypeError) newErrors.vehicleType = vehicleTypeError;
    
    if (!formData.address.country) newErrors['address.country'] = 'Country is required';
    if (!formData.address.state) newErrors['address.state'] = 'State is required';
    if (!formData.address.district) newErrors['address.district'] = 'District is required';
    if (!formData.address.localArea) newErrors['address.localArea'] = 'Local area is required';
    if (!formData.address.place) newErrors['address.place'] = 'Place is required';
    
    const pincodeError = validatePincode(formData.address.pincode);
    if (pincodeError) newErrors['address.pincode'] = pincodeError;
    
    setErrors(newErrors);
    
    setTouched({
      serviceName: true,
      phone: true,
      vehicleType: true,
      'address.country': true,
      'address.state': true,
      'address.district': true,
      'address.localArea': true,
      'address.place': true,
      'address.pincode': true
    });
    
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      const firstErrorField = Object.keys(errors)[0];
      const errorElement = document.querySelector(`[name="${firstErrorField}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      showErrorToast('Please fix the validation errors before submitting', 3000);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const payload = {
        serviceName: formData.serviceName,
        phone: formData.phone,
        vehicleType: formData.vehicleType,
        address: {
          country: formData.address.country,
          state: formData.address.state,
          district: formData.address.district,
          localArea: formData.address.localArea,
          place: formData.address.place,
          pincode: Number(formData.address.pincode)
        }
      };
      
      await onSave(payload);
      
      setFormData({
        serviceName: '',
        address: { country: 'India', state: '', district: '', localArea: '', place: '', pincode: '' },
        phone: '',
        vehicleType: ''
      });
      
      setErrors({});
      setTouched({});
      
      onClose();
      
    } catch (error) {
      console.error('Add ambulance error:', error);
      
      const backendError = error?.data?.error;
      
      if (backendError?.details?.length) {
        const message = backendError.details.map(item => item?.message).filter(Boolean).join(', ');
        showErrorToast(message);
      }
      else if (backendError?.message) {
        showErrorToast(backendError.message);
      }
      else if (error?.data?.message) {
        showErrorToast(error.data.message);
      }
      else if (error?.message) {
        showErrorToast(error.message);
      }
      else {
        showErrorToast('Failed to save ambulance');
      }
      
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Ambulance" size="lg">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto px-2">
        <Input
          label="Service Name *"
          name="serviceName"
          value={formData.serviceName}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Enter ambulance service name"
          error={errors.serviceName}
          touched={touched.serviceName}
          required
        />

        {/* ✅ Vehicle Type as text input */}
        <Input
          label="Vehicle Type *"
          name="vehicleType"
          value={formData.vehicleType}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Enter vehicle type (e.g., Basic Life Support, ICU Ambulance, etc.)"
          error={errors.vehicleType}
          touched={touched.vehicleType}
          required
        />

        <Input
          label="Phone Number *"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Enter phone number"
          error={errors.phone}
          touched={touched.phone}
          required
        />

        <div className="border-t pt-4">
          <h3 className="text-md font-semibold text-gray-900 mb-3">Address Information</h3>
          
          <div className="space-y-3">
            {/* Country (fixed - India) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country
              </label>
              <div className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-100 flex justify-between">
                <span>🇮🇳 India</span>
                <span className="text-green-600 font-medium">✓ Default</span>
              </div>
            </div>

            {/* Pincode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pincode *
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  inputMode="numeric"
                  name="address.pincode"
                  value={formData.address.pincode}
                  onChange={(e) => handlePincodeChange(e.target.value)}
                  onBlur={handleBlur}
                  placeholder="Enter 6 digit pincode"
                  maxLength={6}
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#154A7D] bg-white text-black font-medium"
                />
                {isPincodeLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600" />
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
              {formData.address.pincode.length === 6 &&
                !isPincodeLoading &&
                !isPincodeError &&
                postOffices.length === 0 && (
                  <p className="text-xs text-red-500 mt-2">
                    Invalid pincode or no location found.
                  </p>
                )}
              {touched['address.pincode'] && errors['address.pincode'] && (
                <p className="text-xs text-red-500 mt-2">{errors['address.pincode']}</p>
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
                  value={formData.address.state}
                  readOnly
                  placeholder="Automatically detected state"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-600"
                />
              </div>
            </div>

            {/* District (read-only, auto-filled) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                District *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  value={formData.address.district}
                  readOnly
                  placeholder="Automatically detected district"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-600"
                />
              </div>
            </div>

            {/* Local Area / Place (dropdown of post offices) */}
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
              value={formData.address.localArea}
              onChange={handleLocalAreaChange}
              placeholder="Select your local area"
              required={true}
              disabled={postOffices.length === 0}
              error={errors['address.localArea']}
              touched={touched['address.localArea']}
            />

            {/* Street Address / Place */}
            <Input
              label="Street Address / Place *"
              name="address.place"
              value={formData.address.place}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter street address or locality"
              error={errors['address.place']}
              touched={touched['address.place']}
              required
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
        <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting} loading={isSubmitting}>
          {isSubmitting ? 'Adding...' : 'Add Ambulance'}
        </Button>
      </div>
    </Modal>
  );
};

export default AddAmbulanceModal;