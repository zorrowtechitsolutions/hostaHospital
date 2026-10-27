// src/components/Ambulance/AddAmbulanceModal.jsx
import React, { useState } from 'react';
import { Modal, Input, Button, CustomSelect } from '../ui';
import { Country, State, City } from 'country-state-city';
import { showErrorToast } from '../ui/Toast';

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

  // ---- Options for CustomSelect ----
  const vehicleTypeOptions = (ambulanceTypes || []).map(t => ({ value: t, label: t }));

  const countryOptions = countries.map(c => ({
    value: c.isoCode,
    label: c.name
  }));

  const stateOptions = states.map(s => ({
    value: s.isoCode,
    label: s.name
  }));

  const districtOptions = cities.map(c => ({
    value: c.name,
    label: c.name
  }));

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

  const handleCountryChange = (code) => {
    const country = countries.find(c => c.isoCode === code);
    if (!country) return;
    setCountryCode(code);
    setFormData(prev => ({
      ...prev,
      address: { ...prev.address, country: country.name, state: '', district: '', place: '', pincode: '' }
    }));
    setStateCode('');
    setTouched(prev => ({ ...prev, 'address.country': true }));
    if (errors['address.country']) setErrors(prev => ({ ...prev, 'address.country': '' }));
    if (errors['address.state']) setErrors(prev => ({ ...prev, 'address.state': '' }));
    if (errors['address.district']) setErrors(prev => ({ ...prev, 'address.district': '' }));
  };

  const handleStateChange = (code) => {
    const state = states.find(s => s.isoCode === code);
    if (!state) return;
    setStateCode(code);
    setFormData(prev => ({
      ...prev,
      address: { ...prev.address, state: state.name, district: '', place: '', pincode: '' }
    }));
    setTouched(prev => ({ ...prev, 'address.state': true }));
    if (errors['address.state']) setErrors(prev => ({ ...prev, 'address.state': '' }));
    if (errors['address.district']) setErrors(prev => ({ ...prev, 'address.district': '' }));
  };

  const handleCityChange = (name) => {
    setFormData(prev => ({
      ...prev,
      address: { ...prev.address, district: name, place: '', pincode: '' }
    }));
    setTouched(prev => ({ ...prev, 'address.district': true }));
    if (errors['address.district']) setErrors(prev => ({ ...prev, 'address.district': '' }));
  };

  const handleVehicleTypeChange = (value) => {
    setFormData(prev => ({ ...prev, vehicleType: value }));
    setTouched(prev => ({ ...prev, vehicleType: true }));
    if (errors.vehicleType) setErrors(prev => ({ ...prev, vehicleType: '' }));
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
          place: formData.address.place,
          pincode: Number(formData.address.pincode)
        }
      };
      
      await onSave(payload);
      
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

        {/* ✅ Custom Vehicle Type dropdown */}
        <CustomSelect
          label="Vehicle Type"
          value={formData.vehicleType}
          options={vehicleTypeOptions}
          onChange={handleVehicleTypeChange}
          placeholder="Select vehicle type"
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
            {/* ✅ Custom Country dropdown */}
            <CustomSelect
              label="Country"
              value={countryCode}
              options={countryOptions}
              onChange={handleCountryChange}
              placeholder="Select country"
              error={errors['address.country']}
              touched={touched['address.country']}
              required
            />

            {/* ✅ Custom State dropdown */}
            <CustomSelect
              label="State"
              value={stateCode}
              options={stateOptions}
              onChange={handleStateChange}
              placeholder={countryCode ? 'Select state' : 'Select country first'}
              error={errors['address.state']}
              touched={touched['address.state']}
              disabled={!countryCode}
              required
            />

            {/* ✅ Custom District dropdown */}
            <CustomSelect
              label="District"
              value={formData.address.district}
              options={districtOptions}
              onChange={handleCityChange}
              placeholder={stateCode ? 'Select district' : 'Select state first'}
              error={errors['address.district']}
              touched={touched['address.district']}
              disabled={!stateCode}
              required
            />

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
              type="text"
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