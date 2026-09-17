// AddPatient.jsx - with global DatePicker wrapper for Date of Birth

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Phone, Calendar, MapPin,
  ArrowLeft, Users,
  Briefcase, Clock, AlertTriangle,
  ChevronDown, Activity
} from 'lucide-react';
import {
  Button, Input, Select, Card, DatePicker
} from '../ui';
import {
  showSuccessToast, showErrorToast, showWarningToast, showInfoToast
} from '../ui/Toast';
import { useCreatePatientMutation } from '../../../app/service/patients';
import { Country, State, City } from 'country-state-city';
import { getAuthUser } from '../../utils/auth';

// SearchableDropdown Component (keep as is)
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
          className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-10 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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

const AddPatient = () => {
  const navigate = useNavigate();

  const authUser = getAuthUser();

  // 🔥 FIX: Get hospitalId properly
  const getHospitalId = () => {
    const storedHospitalId = localStorage.getItem('hospitalId');
    if (storedHospitalId) {
      return storedHospitalId;
    }

    if (authUser?.hospitalId) {
      return authUser.hospitalId;
    }

    return null;
  };

  // ✅ NEW: Get hospital name
  const getHospitalName = () => {
    const storedHospitalName = localStorage.getItem('hospitalName');
    if (storedHospitalName) {
      return storedHospitalName;
    }

    if (authUser?.hospitalName) {
      return authUser.hospitalName;
    }

    try {
      const hospitalData = localStorage.getItem('hospitalData');
      if (hospitalData) {
        const parsed = JSON.parse(hospitalData);
        return parsed.name || parsed.hospitalName || null;
      }
    } catch (e) {
      // Ignore
    }

    return null;
  };

  const hospitalId = getHospitalId();
  const hospitalName = getHospitalName();

  const [createPatient, { isLoading: isCreateLoading }] = useCreatePatientMutation();

  const [formData, setFormData] = useState({
    fullName: '',
    bloodGroup: '',
    age: '',
    dob: '',
    gender: '',
    patientType: 'Outpatient',
    maritalStatus: '',
    mobileNumber: '',
    emergencyNumber: '',
    guardianName: '',
    guardianRelation: '',
    addressLine1: '',
    countryCode: '',
    countryName: '',
    stateCode: '',
    stateName: '',
    district: '',
    place: '',
    pincode: '',
    occupation: '',
    email: '',
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const countries = Country.getAllCountries();
  const states = State.getStatesOfCountry(formData.countryCode);
  const cities = City.getCitiesOfState(formData.countryCode, formData.stateCode);

  const bloodGroupOptions = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
  const maritalStatusOptions = ['Single', 'Married', 'Divorced', 'Widowed'];
  const guardianRelationOptions = ['Father', 'Mother', 'Spouse', 'Son', 'Daughter', 'Brother', 'Sister', 'Other'];
  const patientTypeOptions = ['Outpatient', 'Inpatient'];

  const handleCountryChange = (code, name) => {
    setFormData(prev => ({
      ...prev,
      countryCode: code,
      countryName: name,
      stateCode: '',
      stateName: '',
      district: ''
    }));
  };

  const handleStateChange = (code, name) => {
    setFormData(prev => ({
      ...prev,
      stateCode: code,
      stateName: name,
      district: ''
    }));
  };

  const handleCityChange = (name) => {
    setFormData(prev => ({
      ...prev,
      district: name
    }));
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'fullName':
        if (!value) return 'Full name is required';
        if (value.length < 3) return 'Full name must be at least 3 characters';
        if (!/^[a-zA-Z\s\-']+$/.test(value)) return 'Full name can only contain letters, spaces, hyphens, and apostrophes';
        return '';
      case 'mobileNumber':
        if (!value) return 'Mobile number is required';
        const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{3,4}[-\s\.]?[0-9]{3,4}$/;
        if (!phoneRegex.test(value)) return 'Please enter a valid mobile number';
        return '';
      case 'email':
        if (value && !/^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/.test(value)) return 'Please enter a valid email address';
        return '';
      case 'age':
        if (!value) return 'Age is required';
        if (isNaN(value) || value <= 0) return 'Age must be a positive number';
        if (value > 120) return 'Age cannot exceed 120 years';
        return '';
      case 'dob':
        if (!value) return 'Date of birth is required';
        const dobDate = new Date(value);
        if (isNaN(dobDate.getTime())) return 'Please enter a valid date';

        const todayCheck = new Date();
        todayCheck.setHours(0, 0, 0, 0);
        if (dobDate > todayCheck) return 'Date of birth cannot be in the future';

        const minDate = new Date();
        minDate.setFullYear(minDate.getFullYear() - 120);
        if (dobDate < minDate) return 'Date of birth cannot be more than 120 years ago';
        return '';
      case 'gender':
        if (!value) return 'Gender is required';
        return '';
      case 'patientType':
        if (!value) return 'Patient type is required';
        return '';
      case 'bloodGroup':
        return '';
      case 'addressLine1':
        if (!value) return 'Address is required';
        if (value.length < 5) return 'Please enter a complete address';
        return '';
      case 'pincode':
        if (!value) return 'Pin code is required';
        if (!/^\d{5,6}$/.test(value)) return 'Pin code must be 5 or 6 digits';
        return '';
      case 'place':
        if (!value) return 'Place/Locality is required';
        if (value.length < 2) return 'Please enter a valid place name';
        return '';
      case 'countryName':
        if (!value) return 'Country is required';
        return '';
      case 'stateName':
        if (!value) return 'State is required';
        return '';
      case 'district':
        if (!value) return 'District is required';
        return '';
      default: return '';
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const fieldsToValidate = [
      'fullName', 'mobileNumber', 'gender', 'patientType',
      'addressLine1', 'countryName', 'stateName', 'district',
      'dob', 'age', 'pincode', 'place'
    ];

    fieldsToValidate.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  /* =====================================================
     DatePicker (global wrapper) DOB change handler
     Receives ISO string (YYYY-MM-DD) directly
     ===================================================== */
  const handleDobChange = (isoDate) => {
    setFormData(prev => ({ ...prev, dob: isoDate }));

    // Clear error
    setErrors(prev => ({ ...prev, dob: '' }));

    if (!isoDate) {
      setFormData(prev => ({ ...prev, age: '' }));
      return;
    }

    // Auto-calculate age
    const date = new Date(isoDate);
    const now = new Date();
    let age = now.getFullYear() - date.getFullYear();
    const monthDiff = now.getMonth() - date.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < date.getDate())) {
      age--;
    }

    if (age > 0 && age <= 120) {
      setFormData(prev => ({ ...prev, age: age.toString() }));
      showInfoToast(`Patient age calculated: ${age} years`, 2000);
    } else if (age <= 0) {
      showWarningToast('Please enter a valid date of birth (patient must be at least 1 year old)');
      setFormData(prev => ({ ...prev, age: '' }));
    } else if (age > 120) {
      showWarningToast('Age cannot exceed 120 years');
      setFormData(prev => ({ ...prev, age: '' }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  // ✅ UPDATED: Prepare patient data with hospital name
  const preparePatientData = () => {
    const patientData = {
      name: formData.fullName,
      gender: formData.gender,
      mobileNumber: formData.mobileNumber,
      patientType: formData.patientType,
      addressLine: formData.addressLine1,
      location: {
        country: formData.countryName,
        state: formData.stateName,
        district: formData.district,
        place: formData.place,
        pincode: Number(formData.pincode)
      },
      hospitalId: hospitalId,
      hospitalName: hospitalName,
    };

    if (formData.bloodGroup) patientData.bloodGroup = formData.bloodGroup;
    if (formData.age) patientData.age = Number(formData.age);
    if (formData.dob) patientData.dob = formData.dob;
    if (formData.maritalStatus) patientData.maritalStatus = formData.maritalStatus;
    if (formData.emergencyNumber) patientData.emergencyNumber = formData.emergencyNumber;
    if (formData.guardianName) patientData.guardianName = formData.guardianName;
    if (formData.guardianRelation) patientData.guardianRelation = formData.guardianRelation;
    if (formData.occupation) patientData.occupation = formData.occupation;
    if (formData.email) patientData.email = formData.email;

    return patientData;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!hospitalId) {
      showErrorToast('❌ Hospital ID not found. Please log in again.');
      return;
    }

    const allFields = [
      'fullName', 'mobileNumber', 'gender', 'patientType',
      'addressLine1', 'countryName', 'stateName', 'district',
      'dob', 'age', 'pincode', 'place'
    ];
    const touchedFields = {};
    allFields.forEach(field => touchedFields[field] = true);
    setTouched(touchedFields);

    if (validateForm()) {
      setIsSubmitting(true);
      showInfoToast('Creating patient profile...', 2000);

      try {
        const patientData = preparePatientData();

        await createPatient(patientData).unwrap();

        showSuccessToast(
          `${formData.fullName} has been added successfully as ${formData.patientType}`
        );

        setIsSubmitting(false);

        setTimeout(() => {
          navigate('/patients');
        }, 2000);

      } catch (error) {
        console.error('Create Patient Error:', error);

        const message =
          error?.data?.error?.details?.[0]?.message ||
          error?.data?.details?.[0]?.message ||
          error?.data?.errors?.[0]?.message ||
          error?.data?.error?.message ||
          error?.data?.message ||
          error?.error ||
          error?.message ||
          'Failed to add patient. Please try again.';

        showErrorToast(message);
        setIsSubmitting(false);
      }
    } else {
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        let fieldName = firstErrorField.replace(/([A-Z])/g, ' $1').toLowerCase();
        if (firstErrorField === 'dob') fieldName = 'date of birth';
        if (firstErrorField === 'age') fieldName = 'age';
        if (firstErrorField === 'pincode') fieldName = 'pin code';
        if (firstErrorField === 'place') fieldName = 'place/locality';
        showWarningToast(`⚠️ Please fix the ${fieldName} field`);
      }
    }
  };

  const handleGoBack = () => {
    navigate('/patients');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Button variant="ghost" size="sm" onClick={handleGoBack} className="p-2">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Add New Patient</h1>
              <p className="text-sm text-gray-500 mt-1">Create a new patient profile in the system</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <div className="p-6 space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>

                <div className="grid grid-cols-1 gap-5">
                  <Input
                    label="Full Name"
                    name="fullName"
                    icon={User}
                    placeholder="Enter full name"
                    value={formData.fullName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.fullName}
                    touched={touched.fullName}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                  <Select
                    label="Blood Group"
                    name="bloodGroup"
                    options={bloodGroupOptions}
                    placeholder="Select Blood Group (Optional)"
                    value={formData.bloodGroup}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.bloodGroup}
                    touched={touched.bloodGroup}
                  />

                  <Select
                    label="Patient Type"
                    name="patientType"
                    icon={Activity}
                    options={patientTypeOptions}
                    placeholder="Select Patient Type"
                    value={formData.patientType}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.patientType}
                    touched={touched.patientType}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
                  <Input
                    label="Age"
                    name="age"
                    type="number"
                    icon={Clock}
                    placeholder="Age in years"
                    value={formData.age}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.age}
                    touched={touched.age}
                    required
                  />

                  {/* ============ Date of Birth — Global DatePicker ============ */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth <span className="text-red-500">*</span>
                    </label>

                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 z-10 pointer-events-none" />

                      <DatePicker
                        mode="dob"
                        value={formData.dob}
                        onChange={handleDobChange}
                        onClose={() => {
                          setTouched(prev => ({ ...prev, dob: true }));
                          const error = validateField('dob', formData.dob);
                          setErrors(prev => ({ ...prev, dob: error }));
                        }}
                        placeholder="Select date of birth"
                        className={`w-full pl-10 pr-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.dob && touched.dob
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-300'
                        }`}
                      />
                    </div>

                    {errors.dob && touched.dob && (
                      <p className="text-red-500 text-xs mt-1">{errors.dob}</p>
                    )}
                  </div>

                  <Select
                    label="Gender"
                    name="gender"
                    options={['Male', 'Female', 'Other']}
                    placeholder="Select Gender"
                    value={formData.gender}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.gender}
                    touched={touched.gender}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                  <Select
                    label="Marital Status"
                    name="maritalStatus"
                    options={maritalStatusOptions}
                    placeholder="Select Marital Status (Optional)"
                    value={formData.maritalStatus}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.maritalStatus}
                    touched={touched.maritalStatus}
                  />
                  <Input
                    label="Occupation"
                    name="occupation"
                    icon={Briefcase}
                    placeholder="Occupation (Optional)"
                    value={formData.occupation}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.occupation}
                    touched={touched.occupation}
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-6 pt-4 border-t border-gray-200">Contact Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Input
                    label="Mobile Number"
                    name="mobileNumber"
                    icon={Phone}
                    placeholder="+1 234 567 8900"
                    value={formData.mobileNumber}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.mobileNumber}
                    touched={touched.mobileNumber}
                    required
                  />
                  <Input
                    label="Emergency Number"
                    name="emergencyNumber"
                    icon={AlertTriangle}
                    placeholder="Emergency contact (Optional)"
                    value={formData.emergencyNumber}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.emergencyNumber}
                    touched={touched.emergencyNumber}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                  <Input
                    label="Guardian Name"
                    name="guardianName"
                    icon={Users}
                    placeholder="Parent or guardian name (Optional)"
                    value={formData.guardianName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.guardianName}
                    touched={touched.guardianName}
                  />
                  <Select
                    label="Guardian Relation"
                    name="guardianRelation"
                    options={guardianRelationOptions}
                    placeholder="Relationship (Optional)"
                    value={formData.guardianRelation}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.guardianRelation}
                    touched={touched.guardianRelation}
                  />
                </div>

                <div className="mt-5">
                  <Input
                    label="Email Address"
                    name="email"
                    type="email"
                    icon={Mail}
                    placeholder="patient@example.com (Optional)"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.email}
                    touched={touched.email}
                  />
                </div>
              </div>

              {/* Address Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-6 pt-4 border-t border-gray-200">Address Information</h3>

                <Input
                  label="Address Line"
                  name="addressLine1"
                  icon={MapPin}
                  placeholder="Street address"
                  value={formData.addressLine1}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.addressLine1}
                  touched={touched.addressLine1}
                  required
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                  <SearchableDropdown
                    label="Country"
                    options={countries}
                    value={formData.countryCode}
                    onChange={handleCountryChange}
                    placeholder="Search for a country..."
                    icon={MapPin}
                    required={true}
                  />
                  <SearchableDropdown
                    label="State"
                    options={states}
                    value={formData.stateCode}
                    onChange={handleStateChange}
                    placeholder="Search for a state..."
                    icon={MapPin}
                    disabled={!formData.countryCode}
                    required={true}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                  <SearchableDropdown
                    label="District"
                    options={cities}
                    value={formData.district}
                    onChange={handleCityChange}
                    placeholder="Search for a district..."
                    icon={MapPin}
                    disabled={!formData.stateCode}
                    required={true}
                    getOptionLabel={(option) => option.name}
                    getOptionValue={(option) => option.name}
                  />
                  <Input
                    label="Place / Locality"
                    name="place"
                    placeholder="Place/Locality"
                    value={formData.place}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.place}
                    touched={touched.place}
                    required
                  />
                </div>

                <div className="mt-5">
                  <Input
                    label="Pin Code"
                    name="pincode"
                    placeholder="Postal code"
                    value={formData.pincode}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.pincode}
                    touched={touched.pincode}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end gap-3 rounded-b-lg">
              <Button variant="outline" onClick={handleGoBack}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting || isCreateLoading}
                loading={isSubmitting || isCreateLoading}
              >
                {isSubmitting || isCreateLoading ? 'Saving...' : 'Save Patient'}
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </div>
  );
};

export default AddPatient;