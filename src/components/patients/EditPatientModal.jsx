// EditPatient.jsx - DatePicker for DOB + Pincode API for address (same as AddPatient)

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  User, Mail, Phone, Calendar, MapPin,
  ArrowLeft, Users,
  Briefcase, Clock, AlertTriangle,
  ChevronDown, Activity, CreditCard, CheckCircle, Home
} from 'lucide-react';
import {
  Button, Input, Loader
} from '../ui';
import CustomSelect from '../ui/CustomSelect';
import DatePicker from '../ui/DatePicker';
import {
  showSuccessToast, showErrorToast, showWarningToast, showInfoToast, showUpdateToast
} from '../ui/Toast';
import { useGetPatientByIdQuery, useUpdatePatientMutation } from '../../../app/service/patients';
// ✅ Pincode API integration (same as AddPatient / AddDoctor)
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

const EditPatient = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const numericId = id ? Number(id) : null;
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

  const hospitalId = getHospitalId();

  const {
    data: patientResponse,
    isLoading: isLoadingPatient,
    refetch
  } = useGetPatientByIdQuery(numericId, {
    skip: !numericId
  });

  const [updatePatient, { isLoading: isUpdating }] = useUpdatePatientMutation();

  const patient = patientResponse?.data || patientResponse || null;

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
  const [originalPatientId, setOriginalPatientId] = useState(null);

  // Holds the local area guessed from the saved addressLine, so the
  // pincode lookup doesn't wipe it when the form first loads.
  const savedLocalAreaRef = useRef('');

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

  // ✅ Automatically populate state and district (and restore saved local area once)
  useEffect(() => {
    if (postOffices.length > 0) {
      const firstOffice = postOffices[0];

      const saved = savedLocalAreaRef.current?.trim().toLowerCase();
      const match = saved
        ? postOffices.find(o => o.Name.trim().toLowerCase() === saved)
        : null;
      savedLocalAreaRef.current = '';

      setFormData(prev => ({
        ...prev,
        stateName: firstOffice.State,
        district: firstOffice.District,
        localArea: match ? match.Name : ''
      }));
    } else if (formData.pincode.length === 6 && pincodeData) {
      savedLocalAreaRef.current = '';
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

  // Prefill form from the loaded patient
  useEffect(() => {
    if (patient) {
      // addressLine was saved as "place, localArea" → last part is the local area
      const addressParts = (patient.addressLine || '').split(',').map(p => p.trim()).filter(Boolean);
      savedLocalAreaRef.current = addressParts.length > 1 ? addressParts[addressParts.length - 1] : '';

      setFormData({
        fullName: patient.name || '',
        bloodGroup: patient.bloodGroup || '',
        age: patient.age?.toString() || '',
        dob: patient.dob?.split('T')[0] || '',
        gender: patient.gender || '',
        patientType: patient.patientType || 'Outpatient',
        maritalStatus: patient.maritalStatus || '',
        mobileNumber: patient.mobileNumber || '',
        emergencyNumber: patient.emergencyNumber || '',
        guardianName: patient.guardianName || '',
        guardianRelation: patient.guardianRelation || '',
        countryName: 'India',
        stateName: patient.location?.state || '',
        district: patient.location?.district || '',
        localArea: '',
        place: patient.location?.place || '',
        pincode: patient.location?.pincode?.toString() || '',
        occupation: patient.occupation || '',
        email: patient.email || '',
      });

      setOriginalPatientId(patient.id || patient._id);
    }
  }, [patient]);

  // ✅ Handle pincode change
  const handlePincodeChange = (value) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 6);

    // user is typing a new pincode → forget the saved local area
    savedLocalAreaRef.current = '';

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
        if (value && (isNaN(value) || value <= 0)) return 'Age must be a positive number';
        if (value && value > 120) return 'Age cannot exceed 120 years';
        return '';
      case 'dob':
        return '';
      case 'gender':
        if (!value) return 'Gender is required';
        return '';
      case 'patientType':
        if (!value) return 'Patient type is required';
        return '';
      case 'pincode':
        if (!value) return 'Pin code is required';
        if (!/^\d{6}$/.test(String(value))) return 'Please enter a valid 6-digit pin code';
        return '';
      case 'place':
        if (!value) return 'Street / Place is required';
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
    'pincode', 'place'
  ];

  // Returns the errors object so callers don't read stale state
  const validateForm = () => {
    const newErrors = {};

    if (formData.age) {
      const ageError = validateField('age', formData.age);
      if (ageError) newErrors.age = ageError;
    }

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

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  /* =====================================================
     DatePicker handler — receives ISO string (YYYY-MM-DD)
     and auto-calculates age from DOB.
     ===================================================== */
  const handleDateChange = (isoDate) => {
    setFormData(prev => ({ ...prev, dob: isoDate }));

    setTouched(prev => ({ ...prev, dob: true }));
    setErrors(prev => ({ ...prev, dob: '' }));

    if (isoDate) {
      const today = new Date();
      const birthDate = new Date(isoDate);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age > 0 && age <= 120) {
        setFormData(prev => ({ ...prev, age: age.toString() }));
        showInfoToast(`Patient age calculated: ${age} years`, 2000);
      }
    }
  };

  // ✅ Backend requires addressLine → build it from place + local area
  const buildAddressLine = () =>
    [formData.place, formData.localArea]
      .map(part => part?.trim())
      .filter(Boolean)
      .join(', ');

  const prepareUpdateData = () => {
    const updateData = {
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
    };

    if (formData.bloodGroup) updateData.bloodGroup = formData.bloodGroup;
    if (formData.age) updateData.age = Number(formData.age);
    if (formData.dob) updateData.dob = formData.dob;
    if (formData.maritalStatus) updateData.maritalStatus = formData.maritalStatus;
    if (formData.emergencyNumber) updateData.emergencyNumber = formData.emergencyNumber;
    if (formData.guardianName) updateData.guardianName = formData.guardianName;
    if (formData.guardianRelation) updateData.guardianRelation = formData.guardianRelation;
    if (formData.occupation) updateData.occupation = formData.occupation;
    if (formData.email) updateData.email = formData.email;

    return updateData;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!originalPatientId) {
      showErrorToast('❌ Patient ID not found. Please try again.');
      return;
    }

    const touchedFields = {};
    FIELDS_TO_VALIDATE.forEach(field => touchedFields[field] = true);
    setTouched(touchedFields);

    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length === 0) {
      setIsSubmitting(true);
      showInfoToast('Updating patient profile...', 2000);

      try {
        const updateData = prepareUpdateData();

        await updatePatient({
          id: originalPatientId,
          updatePatient: updateData
        }).unwrap();

        showUpdateToast(
          `${formData.fullName} has been updated successfully!`,
          4000,
          {
            'Patient': formData.fullName,
            'ID': originalPatientId,
            'Type': formData.patientType,
            'Age': formData.age ? `${formData.age} years` : 'N/A',
            'Blood Group': formData.bloodGroup || 'N/A'
          }
        );

        setIsSubmitting(false);
        refetch();

        setTimeout(() => {
          navigate('/patients');
        }, 1500);

      } catch (error) {
        console.error('Update Patient Error:', error);

        const message =
          error?.data?.error?.details?.[0]?.message ||
          error?.data?.details?.[0]?.message ||
          error?.data?.errors?.[0]?.message ||
          error?.data?.error?.message ||
          error?.data?.message ||
          error?.error ||
          error?.message ||
          'Failed to update patient. Please try again.';

        showErrorToast(message);
        setIsSubmitting(false);
      }
    } else {
      const firstErrorField = Object.keys(validationErrors)[0];
      if (firstErrorField) {
        let fieldName = firstErrorField.replace(/([A-Z])/g, ' $1').toLowerCase();
        if (firstErrorField === 'pincode') fieldName = 'pin code';
        if (firstErrorField === 'place') fieldName = 'street / place';
        showWarningToast(`⚠️ Please fix the ${fieldName} field`);
      }
    }
  };

  const handleGoBack = () => navigate('/patients');

  if (isLoadingPatient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader centered text="Loading patient data..." />
      </div>
    );
  }

  if (!patient && !isLoadingPatient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Patient not found</h2>
            <p className="text-gray-500 mb-6">
              The patient you're trying to edit doesn't exist or has been removed.
              <br />
              <span className="text-xs text-gray-400">Patient ID: {id}</span>
            </p>
            <Button onClick={handleGoBack} variant="primary">
              Back to Patients
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Button variant="ghost" size="sm" onClick={handleGoBack} className="p-2">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Patient</h1>
              <p className="text-sm text-gray-500 mt-1">Update patient profile information</p>
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
                    icon={Activity}
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
                    placeholder="Age in years (Optional)"
                    value={formData.age}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.age}
                    touched={touched.age}
                  />

                  {/* DatePicker — replaces native Input type="date" */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10 pointer-events-none" />
                      <DatePicker
                        value={formData.dob}
                        onChange={handleDateChange}
                        mode="dob"
                        placeholder="DD/MM/YYYY"
                        className={`w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:border-transparent ${
                          errors.dob && touched.dob
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                      />
                    </div>
                    {errors.dob && touched.dob && (
                      <p className="mt-1 text-xs text-red-500 error-message">{errors.dob}</p>
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
                      <p className="text-sm text-red-600 mt-1 error-message">{errors.pincode}</p>
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

                  {/* Local Area (post offices) + Street / Place */}
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

            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end gap-3 rounded-b-lg">
              <Button type="button" variant="outline" onClick={handleGoBack}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting || isUpdating}
                loading={isSubmitting || isUpdating}
              >
                {isSubmitting || isUpdating ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPatient;