// src/components/Ambulance/AddAmbulanceModal.jsx
import React, { useState } from 'react';
import { Modal, Input, Button } from '../ui';
import { Country, State, City } from 'country-state-city';
import { showErrorToast } from '../ui/Toast';

// ✅ Default ambulance types as fallback
const DEFAULT_AMBULANCE_TYPES = [
  "Basic Life Support (BLS)",
  "Advanced Life Support (ALS)",
  "Patient Transport Ambulance",
  "ICU Ambulance",
  "Neonatal Ambulance",
  "Air Ambulance",
  "Mortuary Ambulance",
  "Motorcycle Ambulance",
  "Boat Ambulance",
  "Emergency Response Vehicle"
];

// ✅ Add default value for ambulanceTypes
const AddAmbulanceModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  ambulanceTypes = DEFAULT_AMBULANCE_TYPES 
}) => {
  const [formData, setFormData] = useState({
    serviceName: '',
    address: {
      country: '',
      state: '',
      district: '',
      place: '',
      pincode: ''
    },
    phone: '',
    vehicleType: ''
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [countryCode, setCountryCode] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const countries = Country.getAllCountries();
  const states = State.getStatesOfCountry(countryCode);
  const cities = City.getCitiesOfState(countryCode, stateCode);

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
    if (!type) return 'Vehicle type is required';
    return '';
  };

  const validatePincode = (pincode) => {
    if (!pincode) return 'Pincode is required';
    const pincodeStr = String(pincode);
    if (!/^\d{5,6}$/.test(pincodeStr)) return 'Please enter a valid pincode (5-6 digits)';
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

  const handleCountryChange = (code, name) => {
    setCountryCode(code);
    setFormData(prev => ({
      ...prev,
      address: { ...prev.address, country: name, state: '', district: '', place: '', pincode: '' }
    }));
    setStateCode('');
    if (errors['address.country']) setErrors(prev => ({ ...prev, 'address.country': '' }));
    if (errors['address.state']) setErrors(prev => ({ ...prev, 'address.state': '' }));
    if (errors['address.district']) setErrors(prev => ({ ...prev, 'address.district': '' }));
  };

  const handleStateChange = (code, name) => {
    setStateCode(code);
    setFormData(prev => ({
      ...prev,
      address: { ...prev.address, state: name, district: '', place: '', pincode: '' }
    }));
    if (errors['address.state']) setErrors(prev => ({ ...prev, 'address.state': '' }));
    if (errors['address.district']) setErrors(prev => ({ ...prev, 'address.district': '' }));
  };

  const handleCityChange = (name) => {
    setFormData(prev => ({
      ...prev,
      address: { ...prev.address, district: name, place: '', pincode: '' }
    }));
    if (errors['address.district']) setErrors(prev => ({ ...prev, 'address.district': '' }));
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
      'address.place': true,
      'address.pincode': true
    });
    
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
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
    
    const payload = {
      serviceName: formData.serviceName,
      phone: formData.phone,
      vehicleType: formData.vehicleType,
      address: {
        country: formData.address.country,
        state: formData.address.state,
        district: formData.address.district,
        place: formData.address.place,
        pincode: Number(formData.address.pincode)
      }
    };
    
    onSave(payload);
    
    setFormData({
      serviceName: '',
      address: { country: '', state: '', district: '', place: '', pincode: '' },
      phone: '',
      vehicleType: ''
    });
    setCountryCode('');
    setStateCode('');
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
    onClose();
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vehicle Type *
          </label>
          <select
            name="vehicleType"
            value={formData.vehicleType}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent ${
              errors.vehicleType && touched.vehicleType ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select vehicle type</option>
            {/* ✅ Safe map with fallback */}
            {(ambulanceTypes || []).map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          {errors.vehicleType && touched.vehicleType && (
            <p className="text-xs text-red-500 mt-1">{errors.vehicleType}</p>
          )}
        </div>

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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country *
              </label>
              <select
                value={countryCode}
                onChange={(e) => {
                  const country = countries.find(c => c.isoCode === e.target.value);
                  if (country) handleCountryChange(country.isoCode, country.name);
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#1C62A0] ${
                  errors['address.country'] && touched['address.country'] ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select country</option>
                {countries.map(country => (
                  <option key={country.isoCode} value={country.isoCode}>{country.name}</option>
                ))}
              </select>
              {errors['address.country'] && touched['address.country'] && (
                <p className="text-xs text-red-500 mt-1">{errors['address.country']}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State *
              </label>
              <select
                value={stateCode}
                onChange={(e) => {
                  const state = states.find(s => s.isoCode === e.target.value);
                  if (state) handleStateChange(state.isoCode, state.name);
                }}
                disabled={!countryCode}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#1C62A0] disabled:bg-gray-100 ${
                  errors['address.state'] && touched['address.state'] ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select state</option>
                {states.map(state => (
                  <option key={state.isoCode} value={state.isoCode}>{state.name}</option>
                ))}
              </select>
              {errors['address.state'] && touched['address.state'] && (
                <p className="text-xs text-red-500 mt-1">{errors['address.state']}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                District *
              </label>
              <select
                value={formData.address.district}
                onChange={(e) => handleCityChange(e.target.value)}
                disabled={!stateCode}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#1C62A0] disabled:bg-gray-100 ${
                  errors['address.district'] && touched['address.district'] ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select district</option>
                {cities.map(city => (
                  <option key={city.name} value={city.name}>{city.name}</option>
                ))}
              </select>
              {errors['address.district'] && touched['address.district'] && (
                <p className="text-xs text-red-500 mt-1">{errors['address.district']}</p>
              )}
            </div>

            <Input
              label="Place / Locality *"
              name="address.place"
              value={formData.address.place}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter place or locality"
              error={errors['address.place']}
              touched={touched['address.place']}
              required
            />

            <Input
              label="Pincode *"
              name="address.pincode"
              type="number"
              value={formData.address.pincode}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter pincode (5-6 digits)"
              error={errors['address.pincode']}
              touched={touched['address.pincode']}
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