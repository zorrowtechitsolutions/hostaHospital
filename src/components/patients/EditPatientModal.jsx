// src/components/patients/EditPatient.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  User, Mail, Phone, Calendar, MapPin, 
  ArrowLeft, Heart, Users, 
  Briefcase, Clock, AlertTriangle,
  ChevronDown, Activity
} from 'lucide-react';
import { 
  Button, Input, Select, Card, Alert, Loader 
} from '../ui';
import { 
  showSuccessToast, showErrorToast, showWarningToast, showInfoToast, showUpdateToast 
} from '../ui/Toast';
import { useGetPatientByIdQuery, useUpdatePatientMutation } from '../../../app/service/patients';
import { Country, State, City } from 'country-state-city';
import { getAuthUser } from '../../utils/auth';

// SearchableDropdown Component
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
  const dropdownRef = React.useRef(null);

  const filteredOptions = options.filter(option => {
    const label = getOptionLabel(option).toLowerCase();
    return label.includes(searchTerm.toLowerCase());
  });

  React.useEffect(() => {
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

const EditPatient = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Convert id to number for API call
  const numericId = id ? Number(id) : null;
  
  // Get user data from auth utility
  const authUser = getAuthUser();
  const hospitalId = authUser?.id;
  
  // Fetch patient data
  const { 
    data: patientResponse, 
    isLoading: isLoadingPatient, 
    refetch,
    error: fetchError
  } = useGetPatientByIdQuery(numericId, {
    skip: !numericId
  });
  
  const [updatePatient, { isLoading: isUpdating }] = useUpdatePatientMutation();
  
  // Handle both response formats
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
    addressLine: '',
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
  const [originalPatientId, setOriginalPatientId] = useState(null);

  const countries = Country.getAllCountries();
  const states = State.getStatesOfCountry(formData.countryCode);
  const cities = City.getCitiesOfState(formData.countryCode, formData.stateCode);

  const bloodGroupOptions = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
  const maritalStatusOptions = ['Single', 'Married', 'Divorced', 'Widowed'];
  const guardianRelationOptions = ['Father', 'Mother', 'Spouse', 'Son', 'Daughter', 'Brother', 'Sister', 'Other'];
  const patientTypeOptions = ['Outpatient', 'Inpatient'];

  // Load patient data into form
  useEffect(() => {
    if (patient) {
      // Find country code from country name
      const country = countries.find(c => c.name === patient.location?.country);
      
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
        addressLine: patient.addressLine || '',
        countryCode: country?.isoCode || '',
        countryName: patient.location?.country || '',
        stateCode: '',
        stateName: patient.location?.state || '',
        district: patient.location?.district || '',
        place: patient.location?.place || '',
        pincode: patient.location?.pincode?.toString() || '',
        occupation: patient.occupation || '',
        email: patient.email || '',
      });
      
      setOriginalPatientId(patient.id || patient._id);
    }
  }, [patient, countries]);

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
      case 'addressLine':
        if (!value) return 'Address is required';
        if (value.length < 5) return 'Please enter a complete address';
        return '';
      case 'pincode':
        if (value && !/^\d{5,6}$/.test(value)) return 'Pin code must be 5 or 6 digits';
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
      'addressLine', 'countryName', 'stateName', 'district'
    ];
    
    if (formData.age) {
      const ageError = validateField('age', formData.age);
      if (ageError) newErrors.age = ageError;
    }
    
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
    if (name === 'dob' && value) {
      const today = new Date();
      const birthDate = new Date(value);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
      if (age > 0 && age <= 120) {
        setFormData(prev => ({ ...prev, age: age.toString() }));
        showInfoToast(`Patient age calculated: ${age} years`, 2000);
      }
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const prepareUpdateData = () => {
    const updateData = {
      name: formData.fullName,
      gender: formData.gender,
      mobileNumber: formData.mobileNumber,
      patientType: formData.patientType,
      addressLine: formData.addressLine,
      location: {
        country: formData.countryName,
        state: formData.stateName,
        district: formData.district,
        place: formData.place || "",
        pincode: formData.pincode ? Number(formData.pincode) : 0
      },
      hospitalId: hospitalId,
    };

    // Add optional fields only if they have values
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
    
    const allFields = [
      'fullName', 'mobileNumber', 'gender', 'patientType',
      'addressLine', 'countryName', 'stateName', 'district'
    ];
    const touchedFields = {};
    allFields.forEach(field => touchedFields[field] = true);
    setTouched(touchedFields);
    
    if (validateForm()) {
      setIsSubmitting(true);
      showInfoToast('Updating patient profile...', 2000);
      
      try {
        const updateData = prepareUpdateData();
        
        const result = await updatePatient({ 
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
        
        // Refetch to get latest data
        refetch();
        
        setTimeout(() => {
          navigate('/patients');
        }, 1500);
        
      } catch (error) {
        if (error.status === 409) {
          showErrorToast('❌ Mobile number or email already exists!');
        } else if (error.data?.message) {
          showErrorToast(`❌ ${error.data.message}`);
        } else {
          showErrorToast('❌ Failed to update patient. Please try again.');
        }
        
        setIsSubmitting(false);
      }
    } else {
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        showWarningToast(`⚠️ Please fix the ${firstErrorField.replace(/([A-Z])/g, ' $1').toLowerCase()} field`);
      }
      const firstError = document.querySelector('.error-message');
      if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleGoBack = () => navigate('/patients');

  // Loading state
  if (isLoadingPatient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader centered text="Loading patient data..." />
      </div>
    );
  }

  // Patient not found state - show proper message
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
                    placeholder="Age in years (Optional)" 
                    value={formData.age} 
                    onChange={handleChange} 
                    onBlur={handleBlur} 
                    error={errors.age} 
                    touched={touched.age} 
                  />
                  <Input 
                    label="Date of Birth" 
                    name="dob" 
                    type="date" 
                    icon={Calendar} 
                    value={formData.dob} 
                    onChange={handleChange} 
                    onBlur={handleBlur} 
                    error={errors.dob} 
                    touched={touched.dob} 
                  />
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
                  name="addressLine" 
                  icon={MapPin} 
                  placeholder="Street address" 
                  value={formData.addressLine} 
                  onChange={handleChange} 
                  onBlur={handleBlur} 
                  error={errors.addressLine} 
                  touched={touched.addressLine} 
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
                    placeholder="Place/Locality (Optional)" 
                    value={formData.place} 
                    onChange={handleChange} 
                  />
                </div>

                <div className="mt-5">
                  <Input 
                    label="Pin Code" 
                    name="pincode" 
                    placeholder="Postal code (Optional)" 
                    value={formData.pincode} 
                    onChange={handleChange} 
                    onBlur={handleBlur} 
                    error={errors.pincode} 
                    touched={touched.pincode} 
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
                disabled={isSubmitting || isUpdating} 
                loading={isSubmitting || isUpdating}
              >
                {isSubmitting || isUpdating ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </div>
  );
};

export default EditPatient;