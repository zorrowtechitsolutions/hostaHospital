// AddPatient.jsx - DatePicker for DOB + Pincode API for address

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Phone, Calendar, MapPin,
  ArrowLeft, Users,
  Briefcase, Clock, AlertTriangle,
  ChevronDown, CreditCard, CheckCircle, Home
} from 'lucide-react';
import {
  Button, Input, DatePicker
} from '../ui';
import CustomSelect from '../ui/CustomSelect';
import {
  showSuccessToast, showErrorToast, showWarningToast, showInfoToast
} from '../ui/Toast';
import { useCreatePatientMutation } from '../../../app/service/patients';
// ✅ Pincode API integration (same as AddDoctor)
import { useGetPincodeQuery } from '../../../app/service/pincodeApi';
import { getAuthUser } from '../../utils/auth';

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
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  const filteredOptions = options.filter(option =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    onChange(option.name);
    setSearchTerm('');
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
            setSearchTerm('');
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full pl-10 pr-10 py-2 rounded-lg border ${
            showError ? 'border-red-500' : 'border-gray-300'
          } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            disabled ? 'text-gray-400 bg-gray-50 cursor-not-allowed' : ''
          }`}
        />
        <ChevronDown
          className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 cursor-pointer transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        />
      </div>

      {isOpen && filteredOptions.length > 0 && (
        <div
          className="absolute z-[9999] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto overscroll-contain"
          onWheel={(e) => e.stopPropagation()}
        >
          {filteredOptions.map((option, index) => (
            <div
              key={index}
              className="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors flex items-center gap-2"
              onClick={() => handleSelect(option)}
            >
              <Home className="h-4 w-4 text-gray-400" />
              <span className="text-gray-700">{option.name}</span>
            </div>
          ))}
        </div>
      )}

      {isOpen && filteredOptions.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
          No results found
        </div>
      )}

      {showError && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
};

const AddPatient = () => {
  const navigate = useNavigate();

  const authUser = getAuthUser();

  // 🔥 Get hospitalId properly
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

  // ✅ Get hospital name
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
    // ✅ Pincode-based location
    countryName: 'India',
    stateName: '',
    district: '',
    localArea: '',
    place: '',
    pincode: '',
    occupation: '',
    email: '',
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ Pincode API integration
  const {
    currentData: pincodeData,
    isFetching: isPincodeLoading,
    isError: isPincodeError,
  } = useGetPincodeQuery(formData.pincode, {
    skip: !/^\d{6}$/.test(formData.pincode),
  });

  const postOffices =
    pincodeData?.[0]?.Status === 'Success'
      ? pincodeData[0].PostOffice || []
      : [];

  // ✅ Automatically populate state and district
  useEffect(() => {
    if (postOffices.length > 0) {
      const firstOffice = postOffices[0];

      setFormData(prev => ({
        ...prev,
        stateName: firstOffice.State,
        district: firstOffice.District,
        localArea: ''
      }));
    } else if (formData.pincode.length === 6 && pincodeData) {
      setFormData(prev => ({
        ...prev,
        stateName: '',
        district: '',
        localArea: ''
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pincodeData]);

  const bloodGroupOptions = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
  const maritalStatusOptions = ['Single', 'Married', 'Divorced', 'Widowed'];
  const guardianRelationOptions = ['Father', 'Mother', 'Spouse', 'Son', 'Daughter', 'Brother', 'Sister', 'Other'];
  const patientTypeOptions = ['Outpatient', 'Inpatient'];

  // ✅ Convert local string arrays → {value, label} for CustomSelect
  const bloodGroupSelectOptions = bloodGroupOptions.map(v => ({ value: v, label: v }));
  const maritalStatusSelectOptions = maritalStatusOptions.map(v => ({ value: v, label: v }));
  const guardianRelationSelectOptions = guardianRelationOptions.map(v => ({ value: v, label: v }));
  const patientTypeSelectOptions = patientTypeOptions.map(v => ({ value: v, label: v }));
  const genderSelectOptions = ['Male', 'Female', 'Other'].map(v => ({ value: v, label: v }));

  // ✅ Handle pincode change
  const handlePincodeChange = (value) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 6);

    setFormData(prev => ({
      ...prev,
      pincode: cleaned,
      stateName: '',
      district: '',
      localArea: ''
    }));

    if (errors.pincode) {
      setErrors(prev => ({ ...prev, pincode: '' }));
    }
  };

  // ✅ Handle local area change
  const handleLocalAreaChange = (name) => {
    setFormData(prev => ({ ...prev, localArea: name }));
    setTouched(prev => ({ ...prev, localArea: true }));
    if (errors.localArea) {
      setErrors(prev => ({ ...prev, localArea: '' }));
    }
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'fullName':
        if (!value) return 'Full name is required';
        if (value.length < 3) return 'Full name must be at least 3 characters';
        if (!/^[a-zA-Z\s\-']+$/.test(value)) return 'Full name can only contain letters, spaces, hyphens, and apostrophes';
        return '';
      case 'mobileNumber': {
        if (!value) return 'Mobile number is required';
        const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{3,4}[-\s\.]?[0-9]{3,4}$/;
        if (!phoneRegex.test(value)) return 'Please enter a valid mobile number';
        return '';
      }
      case 'email':
        if (value && !/^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/.test(value)) return 'Please enter a valid email address';
        return '';
      case 'age':
        if (!value) return 'Age is required';
        if (isNaN(value) || value <= 0) return 'Age must be a positive number';
        if (value > 120) return 'Age cannot exceed 120 years';
        return '';
      case 'dob': {
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
      }
      case 'gender':
        if (!value) return 'Gender is required';
        return '';
      case 'patientType':
        if (!value) return 'Patient type is required';
        return '';
      case 'bloodGroup':
        return '';
      case 'pincode':
        if (!value) return 'Pin code is required';
        if (!/^\d{6}$/.test(String(value))) return 'Please enter a valid 6-digit pin code';
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
      case 'localArea':
        if (!value) return 'Local area is required';
        return '';
      default: return '';
    }
  };

  const FIELDS_TO_VALIDATE = [
    'fullName', 'mobileNumber', 'gender', 'patientType',
    'countryName', 'stateName', 'district', 'localArea',
    'dob', 'age', 'pincode', 'place'
  ];

  // Returns the errors object so callers don't read stale state
  const validateForm = () => {
    const newErrors = {};

    FIELDS_TO_VALIDATE.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });

    setErrors(newErrors);
    return newErrors;
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

  // ✅ Backend requires addressLine → build it from place + local area
  const buildAddressLine = () =>
    [formData.place, formData.localArea]
      .map(part => part?.trim())
      .filter(Boolean)
      .join(', ');

  // ✅ Prepare patient data with hospital name
  const preparePatientData = () => {
    const patientData = {
      name: formData.fullName,
      gender: formData.gender,
      mobileNumber: formData.mobileNumber,
      patientType: formData.patientType,
      addressLine: buildAddressLine(),
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

    const touchedFields = {};
    FIELDS_TO_VALIDATE.forEach(field => touchedFields[field] = true);
    setTouched(touchedFields);

    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length === 0) {
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
      const firstErrorField = Object.keys(validationErrors)[0];
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-visible">
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
                  <CustomSelect
                    label="Blood Group"
                    value={formData.bloodGroup}
                    options={bloodGroupSelectOptions}
                    placeholder="Select Blood Group (Optional)"
                    onChange={(value) => handleChange({ target: { name: 'bloodGroup', value } })}
                    error={errors.bloodGroup}
                    touched={touched.bloodGroup}
                  />

                  <CustomSelect
                    label="Patient Type"
                    value={formData.patientType}
                    options={patientTypeSelectOptions}
                    placeholder="Select Patient Type"
                    onChange={(value) => handleChange({ target: { name: 'patientType', value } })}
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

                  <CustomSelect
                    label="Gender"
                    value={formData.gender}
                    options={genderSelectOptions}
                    placeholder="Select Gender"
                    onChange={(value) => handleChange({ target: { name: 'gender', value } })}
                    error={errors.gender}
                    touched={touched.gender}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                  <CustomSelect
                    label="Marital Status"
                    value={formData.maritalStatus}
                    options={maritalStatusSelectOptions}
                    placeholder="Select Marital Status (Optional)"
                    onChange={(value) => handleChange({ target: { name: 'maritalStatus', value } })}
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

                  <CustomSelect
                    label="Guardian Relation"
                    value={formData.guardianRelation}
                    options={guardianRelationSelectOptions}
                    placeholder="Relationship (Optional)"
                    onChange={(value) => handleChange({ target: { name: 'guardianRelation', value } })}
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

                <div className="space-y-5">
                  {/* Country (fixed India) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <div className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-100 flex justify-between">
                      <span>🇮🇳 India</span>
                      <span className="text-green-600 font-medium text-sm">✓ Default</span>
                    </div>
                  </div>

                  {/* Pincode */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pin Code <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        inputMode="numeric"
                        name="pincode"
                        value={formData.pincode}
                        onChange={(e) => handlePincodeChange(e.target.value)}
                        onBlur={(e) => {
                          setTouched(prev => ({ ...prev, pincode: true }));
                          setErrors(prev => ({
                            ...prev,
                            pincode: validateField('pincode', e.target.value)
                          }));
                        }}
                        placeholder="Enter 6 digit pin code"
                        maxLength={6}
                        className={`w-full pl-10 pr-10 py-2 rounded-lg border ${
                          errors.pincode && touched.pincode ? 'border-red-500' : 'border-gray-300'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      />
                      {isPincodeLoading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600" />
                        </div>
                      )}
                      {!isPincodeLoading && postOffices.length > 0 && (
                        <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Enter pin code to automatically find the location.
                    </p>
                    {isPincodeLoading && (
                      <p className="text-xs text-blue-600 mt-2">Finding location...</p>
                    )}
                    {isPincodeError && (
                      <p className="text-xs text-red-500 mt-2">
                        Unable to fetch pin code details. Please try again.
                      </p>
                    )}
                    {formData.pincode.length === 6 &&
                      !isPincodeLoading &&
                      !isPincodeError &&
                      postOffices.length === 0 && (
                        <p className="text-xs text-red-500 mt-2">
                          Invalid pin code or no location found.
                        </p>
                      )}
                    {touched.pincode && errors.pincode && (
                      <p className="text-sm text-red-600 mt-1">{errors.pincode}</p>
                    )}
                  </div>

                  {/* State + District (read-only, auto-filled) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          value={formData.stateName}
                          readOnly
                          placeholder="Automatically detected state"
                          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-gray-100 text-gray-600"
                        />
                      </div>
                      {touched.stateName && errors.stateName && (
                        <p className="text-sm text-red-600 mt-1">{errors.stateName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        District <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          value={formData.district}
                          readOnly
                          placeholder="Automatically detected district"
                          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-gray-100 text-gray-600"
                        />
                      </div>
                      {touched.district && errors.district && (
                        <p className="text-sm text-red-600 mt-1">{errors.district}</p>
                      )}
                    </div>
                  </div>

                  {/* Local Area (post offices) + Place */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <SearchableCityDropdown
                      label="Local Area"
                      options={[
                        ...new Map(
                          postOffices.map((office) => [
                            office.Name,
                            { name: office.Name }
                          ])
                        ).values()
                      ]}
                      value={formData.localArea}
                      onChange={handleLocalAreaChange}
                      placeholder={
                        postOffices.length === 0
                          ? 'Enter pin code first'
                          : 'Select local area'
                      }
                      required={true}
                      disabled={postOffices.length === 0}
                      error={errors.localArea}
                      touched={touched.localArea}
                    />
                    <Input
                      label="Street / Place"
                      name="place"
                      placeholder="House no., street, place"
                      value={formData.place}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={errors.place}
                      touched={touched.place}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end gap-3 rounded-b-lg">
              <Button type="button" variant="outline" onClick={handleGoBack}>
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
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPatient;