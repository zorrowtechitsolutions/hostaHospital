// src/components/Doctor/AddDoctor.jsx - With toast notifications and Salary Info
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Mail, Phone, Calendar, MapPin, Lock, Image, 
  DollarSign, IdCard, AlertCircle, ArrowLeft, Upload, X 
} from 'lucide-react';
import { 
  Button, Input, Select, Textarea, Card, Alert, Loader 
} from '../ui';
import { showSuccessToast, showErrorToast, showWarningToast, showAddToast } from '../ui/Toast';

const AddDoctor = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    profileImage: null,
    firstName: '',
    lastName: '',
    department: '',
    specialist: '',
    fees: '',
    phoneNumber: '',
    email: '',
    dob: '',
    gender: '',
    registrationNumber: '',
    knownLanguages: '',
    about: '',
    address: '',
    country: '',
    state: '',
    city: '',
    pinCode: '',
    displayName: '',
    userName: '',
    password: '',
    confirmPassword: '',
    // Salary fields
    netSalary: '',
    basic: '',
    da: '',
    hra: '',
    conveyance: '',
    allowance: '',
    medicalAllowance: '',
    otherEarnings: '',
    tds: '',
    pf: '',
    leave: '',
    profTax: '',
    labourWelfare: '',
    otherDeductions: ''
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('basic'); // Tab state for Basic Info / Salary Info

  // Validation functions
  const validateField = (name, value) => {
    switch (name) {
      case 'firstName':
        if (!value) return 'First name is required';
        if (value.length < 2) return 'First name must be at least 2 characters';
        if (value.length > 50) return 'First name must be less than 50 characters';
        if (!/^[a-zA-Z\s\-']+$/.test(value)) return 'First name can only contain letters, spaces, hyphens, and apostrophes';
        return '';

      case 'lastName':
        if (!value) return 'Last name is required';
        if (value.length < 2) return 'Last name must be at least 2 characters';
        if (value.length > 50) return 'Last name must be less than 50 characters';
        if (!/^[a-zA-Z\s\-']+$/.test(value)) return 'Last name can only contain letters, spaces, hyphens, and apostrophes';
        return '';

      case 'department':
        if (!value) return 'Department is required';
        return '';

      case 'specialist':
        if (!value) return 'Specialist field is required';
        if (value.length < 3) return 'Specialist must be at least 3 characters';
        return '';

      case 'fees':
        if (!value) return 'Fees are required';
        if (isNaN(value) || value <= 0) return 'Fees must be a positive number';
        if (value > 10000) return 'Fees cannot exceed $10,000';
        return '';

      case 'phoneNumber':
        if (!value) return 'Phone number is required';
        const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{3,4}[-\s\.]?[0-9]{3,4}$/;
        if (!phoneRegex.test(value)) return 'Please enter a valid phone number';
        return '';

      case 'email':
        if (!value) return 'Email address is required';
        const emailRegex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
        if (!emailRegex.test(value)) return 'Please enter a valid email address';
        if (value.length > 100) return 'Email must be less than 100 characters';
        return '';

      case 'dob':
        if (!value) return 'Date of birth is required';
        const age = new Date().getFullYear() - new Date(value).getFullYear();
        if (age < 25) return 'Doctor must be at least 25 years old';
        if (age > 80) return 'Doctor must be less than 80 years old';
        return '';

      case 'gender':
        if (!value) return 'Gender is required';
        return '';

      case 'registrationNumber':
        if (!value) return 'Registration number is required';
        if (value.length < 5) return 'Registration number must be at least 5 characters';
        if (!/^[A-Z0-9\-]+$/.test(value)) return 'Registration number can only contain uppercase letters, numbers, and hyphens';
        return '';

      case 'knownLanguages':
        if (!value) return 'At least one language is required';
        return '';

      case 'address':
        if (!value) return 'Address is required';
        if (value.length < 10) return 'Please enter a complete address';
        return '';

      case 'pinCode':
        if (value && !/^\d{5,6}$/.test(value)) return 'Pin code must be 5 or 6 digits';
        return '';

      case 'userName':
        if (value && value.length < 4) return 'Username must be at least 4 characters';
        if (value && !/^[a-zA-Z0-9_]+$/.test(value)) return 'Username can only contain letters, numbers, and underscores';
        return '';

      case 'password':
        if (value) {
          if (value.length < 8) return 'Password must be at least 8 characters';
          if (!/[A-Z]/.test(value)) return 'Password must contain at least one uppercase letter';
          if (!/[a-z]/.test(value)) return 'Password must contain at least one lowercase letter';
          if (!/[0-9]/.test(value)) return 'Password must contain at least one number';
          if (!/[!@#$%^&*]/.test(value)) return 'Password must contain at least one special character (!@#$%^&*)';
        }
        return '';

      case 'confirmPassword':
        if (formData.password && value !== formData.password) return 'Passwords do not match';
        if (formData.password && !value) return 'Please confirm your password';
        return '';

      default:
        return '';
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const fieldsToValidate = [
      'firstName', 'lastName', 'department', 'specialist', 'fees', 
      'phoneNumber', 'email', 'dob', 'gender', 'registrationNumber', 
      'knownLanguages', 'address'
    ];
    
    fieldsToValidate.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });

    if (formData.password) {
      const passwordError = validateField('password', formData.password);
      if (passwordError) newErrors.password = passwordError;
      const confirmError = validateField('confirmPassword', formData.confirmPassword);
      if (confirmError) newErrors.confirmPassword = confirmError;
    }

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

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleImageUpload = (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, profileImage: 'File size must be less than 5MB' }));
      showWarningToast('Image size must be less than 5MB', 3000);
      return false;
    }
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, profileImage: 'Only JPEG, PNG, GIF, and WEBP files are allowed' }));
      showWarningToast('Only JPEG, PNG, GIF, and WEBP files are allowed', 3000);
      return false;
    }
    setErrors(prev => ({ ...prev, profileImage: '' }));
    setFormData(prev => ({ ...prev, profileImage: file }));
    const reader = new FileReader();
    reader.onloadend = () => setPreviewImage(reader.result);
    reader.readAsDataURL(file);
    showSuccessToast('Image uploaded successfully!', 2000);
    return true;
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) handleImageUpload(file);
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, profileImage: null }));
    setPreviewImage(null);
    setErrors(prev => ({ ...prev, profileImage: '' }));
    showSuccessToast('Image removed', 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allFields = [
      'firstName', 'lastName', 'department', 'specialist', 'fees', 
      'phoneNumber', 'email', 'dob', 'gender', 'registrationNumber', 
      'knownLanguages', 'address'
    ];
    const touchedFields = {};
    allFields.forEach(field => touchedFields[field] = true);
    setTouched(touchedFields);
    
    if (validateForm()) {
      setIsSubmitting(true);
      
      setTimeout(() => {
        const existingDoctors = JSON.parse(localStorage.getItem('doctors') || '[]');
        
        // Check if email already exists
        const emailExists = existingDoctors.some(doc => doc.email === formData.email);
        if (emailExists) {
          showErrorToast('❌ Email already exists! Please use a different email address.', 4000);
          setIsSubmitting(false);
          return;
        }
        
        const newDoctorId = existingDoctors.length + 1;
        const newDoctor = {
          id: newDoctorId,
          name: `Dr. ${formData.firstName} ${formData.lastName}`,
          specialty: formData.specialist,
          experience: calculateExperience(formData.dob),
          appointments: 0,
          email: formData.email,
          phone: formData.phoneNumber,
          photo: previewImage || `https://randomuser.me/api/portraits/${formData.gender === 'Male' ? 'men' : 'women'}/${Math.floor(Math.random() * 100)}.jpg`,
          department: formData.department,
          registrationNumber: formData.registrationNumber,
          gender: formData.gender,
          dob: formData.dob,
          knownLanguages: formData.knownLanguages,
          about: formData.about,
          address: formData.address,
          country: formData.country,
          state: formData.state,
          city: formData.city,
          pinCode: formData.pinCode,
          displayName: formData.displayName,
          userName: formData.userName,
          // Include salary details
          salaryDetails: {
            netSalary: formData.netSalary,
            earnings: {
              basic: formData.basic,
              da: formData.da,
              hra: formData.hra,
              conveyance: formData.conveyance,
              allowance: formData.allowance,
              medicalAllowance: formData.medicalAllowance,
              others: formData.otherEarnings
            },
            deductions: {
              tds: formData.tds,
              pf: formData.pf,
              leave: formData.leave,
              profTax: formData.profTax,
              labourWelfare: formData.labourWelfare,
              others: formData.otherDeductions
            }
          }
        };
        
        const updatedDoctors = [...existingDoctors, newDoctor];
        localStorage.setItem('doctors', JSON.stringify(updatedDoctors));
        
        showAddToast(
          `Dr. ${formData.firstName} ${formData.lastName} has been added successfully!`,
          5000,
          {
            '👨‍⚕️ Name': `Dr. ${formData.firstName} ${formData.lastName}`,
            '🔬 Specialty': formData.specialist,
            '🏥 Department': formData.department,
            '🆔 ID': `#DR${String(newDoctorId).padStart(4, '0')}`,
            '💰 Fees': `$${formData.fees}`,
            '📧 Email': formData.email,
            '📞 Phone': formData.phoneNumber
          }
        );
        
        setIsSubmitting(false);
        
        // Navigate after toast
        setTimeout(() => {
          navigate('/doctors');
        }, 2000);
      }, 1000);
    } else {
      // Show validation error toast
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        showWarningToast(`⚠️ Please fix the ${firstErrorField.replace(/([A-Z])/g, ' $1').toLowerCase()} field`, 3000);
      }
      
      const firstError = document.querySelector('.error-message');
      if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const calculateExperience = (dob) => {
    if (!dob) return '0+ Years';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
    const experienceYears = Math.max(0, age - 25);
    return `${experienceYears}+ Years`;
  };

  const handleGoBack = () => {
    if (formData.firstName || formData.lastName || formData.email || previewImage) {
      showWarningToast('⚠️ Any unsaved data will be lost. Confirm to continue.', 3000);
      setTimeout(() => {
        if (window.confirm('Are you sure you want to go back? Any unsaved data will be lost.')) {
          navigate('/doctors');
        }
      }, 100);
    } else {
      navigate('/doctors');
    }
  };

  // Tabs configuration
  const tabs = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'salary', label: 'Salary Info' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Button variant="ghost" size="sm" onClick={handleGoBack} className="p-2">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Add New Doctor</h1>
              <p className="text-sm text-gray-500 mt-1">Create a new doctor profile in the system</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            {/* Tabs Header */}
            <div className="border-b border-gray-200 px-6">
              <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Basic Information Tab */}
            {activeTab === 'basic' && (
              <div className="p-6 space-y-6">
                {/* Image Upload Section */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center border-2 border-gray-200 overflow-hidden shadow-sm">
                        {previewImage ? (
                          <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <Image className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      {previewImage && (
                        <button type="button" onClick={removeImage} className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm">
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Profile Image</label>
                    <div>
                      <input id="profileImageInput" type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleFileSelect} className="hidden" />
                      <Button type="button" variant="outline" onClick={() => document.getElementById('profileImageInput').click()} className="inline-flex items-center gap-2">
                        <Upload className="h-4 w-4" /> Upload Image
                      </Button>
                      <p className="text-xs text-gray-400 mt-2">JPEG, PNG, GIF, WEBP accepted. Max 5MB</p>
                    </div>
                    {errors.profileImage && <Alert type="error" message={errors.profileImage} className="mt-2" />}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Doctor ID:</span>
                    <span className="text-sm font-medium text-gray-900">Auto-generated</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Input label="First Name" name="firstName" icon={User} placeholder="Enter first name" value={formData.firstName} onChange={handleChange} onBlur={handleBlur} error={errors.firstName} touched={touched.firstName} required />
                  <Input label="Last Name" name="lastName" icon={User} placeholder="Enter last name" value={formData.lastName} onChange={handleChange} onBlur={handleBlur} error={errors.lastName} touched={touched.lastName} required />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Select label="Department" name="department" options={['Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'Dermatology', 'Psychiatry', 'Radiology', 'Surgery']} placeholder="Select Department" value={formData.department} onChange={handleChange} onBlur={handleBlur} error={errors.department} touched={touched.department} required />
                  <Input label="Specialist" name="specialist" icon={IdCard} placeholder="e.g., Cardiologist" value={formData.specialist} onChange={handleChange} onBlur={handleBlur} error={errors.specialist} touched={touched.specialist} required />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <Input label="Fees ($)" name="fees" type="number" icon={DollarSign} placeholder="0.00" value={formData.fees} onChange={handleChange} onBlur={handleBlur} error={errors.fees} touched={touched.fees} required />
                  <Input label="Phone Number" name="phoneNumber" icon={Phone} placeholder="+1 234 567 8900" value={formData.phoneNumber} onChange={handleChange} onBlur={handleBlur} error={errors.phoneNumber} touched={touched.phoneNumber} required />
                  <Input label="Email Address" name="email" type="email" icon={Mail} placeholder="doctor@example.com" value={formData.email} onChange={handleChange} onBlur={handleBlur} error={errors.email} touched={touched.email} required />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <Input label="Date of Birth" name="dob" type="date" icon={Calendar} value={formData.dob} onChange={handleChange} onBlur={handleBlur} error={errors.dob} touched={touched.dob} required />
                  <Select label="Gender" name="gender" options={['Male', 'Female', 'Other']} placeholder="Select Gender" value={formData.gender} onChange={handleChange} onBlur={handleBlur} error={errors.gender} touched={touched.gender} required />
                  <Input label="Registration Number" name="registrationNumber" icon={IdCard} placeholder="Medical license number" value={formData.registrationNumber} onChange={handleChange} onBlur={handleBlur} error={errors.registrationNumber} touched={touched.registrationNumber} required />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Select label="Known Languages" name="knownLanguages" options={['English', 'Spanish', 'French', 'German', 'Chinese', 'Arabic', 'Hindi', 'Russian', 'Japanese']} placeholder="Select Language" value={formData.knownLanguages} onChange={handleChange} onBlur={handleBlur} error={errors.knownLanguages} touched={touched.knownLanguages} required />
                </div>

                <Textarea label="About" name="about" rows={3} placeholder="Write a brief description about the doctor's experience, qualifications, and expertise..." value={formData.about} onChange={handleChange} onBlur={handleBlur} error={errors.about} touched={touched.about} />

                {/* Address Information */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h3>
                  <div className="space-y-5">
                    <Input label="Address" name="address" icon={MapPin} placeholder="Street address" value={formData.address} onChange={handleChange} onBlur={handleBlur} error={errors.address} touched={touched.address} required />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                      <Select label="Country" name="country" required={false} options={['United States', 'United Kingdom', 'Canada', 'Australia', 'India', 'Germany', 'France']} placeholder="Select Country" value={formData.country} onChange={handleChange} onBlur={handleBlur} error={errors.country} touched={touched.country} />
                      <Input label="State" name="state" required={false} placeholder="State" value={formData.state} onChange={handleChange} onBlur={handleBlur} error={errors.state} touched={touched.state} />
                      <Input label="City" name="city" required={false} placeholder="City" value={formData.city} onChange={handleChange} onBlur={handleBlur} error={errors.city} touched={touched.city} />
                      <Input label="Pin Code" name="pinCode" required={false} placeholder="Postal code" value={formData.pinCode} onChange={handleChange} onBlur={handleBlur} error={errors.pinCode} touched={touched.pinCode} />
                    </div>
                  </div>
                </div>

                {/* Account Details */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input label="Display Name" name="displayName" required={false} icon={User} placeholder="How name appears on profile" value={formData.displayName} onChange={handleChange} onBlur={handleBlur} error={errors.displayName} touched={touched.displayName} />
                    <Input label="Username" name="userName" required={false} icon={User} placeholder="Unique username" value={formData.userName} onChange={handleChange} onBlur={handleBlur} error={errors.userName} touched={touched.userName} />
                    <Input label="Password" name="password" type="password" required={false} icon={Lock} placeholder="Create password" value={formData.password} onChange={handleChange} onBlur={handleBlur} error={errors.password} touched={touched.password} />
                    <Input label="Confirm Password" name="confirmPassword" type="password" required={false} icon={Lock} placeholder="Confirm password" value={formData.confirmPassword} onChange={handleChange} onBlur={handleBlur} error={errors.confirmPassword} touched={touched.confirmPassword} />
                  </div>
                </div>
              </div>
            )}

            {/* Salary Information Tab */}
            {activeTab === 'salary' && (
              <div className="p-6">
                <Input 
                  name="netSalary" 
                  label="Net Salary"
                  value={formData.netSalary} 
                  onChange={handleChange} 
                  placeholder="Enter net salary" 
                  className="mb-6" 
                />
                
                <h4 className="text-md font-semibold text-gray-800 mb-4">Earnings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                  <Input name="basic" label="Basic" value={formData.basic} onChange={handleChange} placeholder="Basic" />
                  <Input name="da" label="DA" value={formData.da} onChange={handleChange} placeholder="DA" />
                  <Input name="hra" label="HRA" value={formData.hra} onChange={handleChange} placeholder="HRA" />
                  <Input name="conveyance" label="Conveyance" value={formData.conveyance} onChange={handleChange} placeholder="Conveyance" />
                  <Input name="allowance" label="Allowance" value={formData.allowance} onChange={handleChange} placeholder="Allowance" />
                  <Input name="medicalAllowance" label="Medical Allowance" value={formData.medicalAllowance} onChange={handleChange} placeholder="Medical Allowance" />
                  <Input name="otherEarnings" label="Others" value={formData.otherEarnings} onChange={handleChange} placeholder="Others" />
                </div>

                <h4 className="text-md font-semibold text-gray-800 mb-4">Deductions</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Input name="tds" label="TDS" value={formData.tds} onChange={handleChange} placeholder="TDS" />
                  <Input name="pf" label="PF" value={formData.pf} onChange={handleChange} placeholder="PF" />
                  <Input name="leave" label="Leave" value={formData.leave} onChange={handleChange} placeholder="Leave" />
                  <Input name="profTax" label="Prof. Tax" value={formData.profTax} onChange={handleChange} placeholder="Prof. Tax" />
                  <Input name="labourWelfare" label="Labour Welfare" value={formData.labourWelfare} onChange={handleChange} placeholder="Labour Welfare" />
                  <Input name="otherDeductions" label="Others" value={formData.otherDeductions} onChange={handleChange} placeholder="Others" />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end gap-3 rounded-b-lg">
              <Button variant="outline" onClick={handleGoBack}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={isSubmitting} loading={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Doctor'}
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </div>
  );
};

export default AddDoctor;