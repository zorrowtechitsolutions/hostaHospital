// src/components/patients/AddPatient.jsx - Complete with UI components and S3 upload
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Mail, Phone, Calendar, MapPin, Lock, Image, 
  AlertCircle, ArrowLeft, Heart, Users, 
  FileText, Briefcase, Clock, Activity, AlertTriangle,
  Upload, X
} from 'lucide-react';
import { 
  Button, Input, Select, Textarea, Card, Alert, Loader 
} from '../ui';

const AddPatient = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    profileImage: null,
    firstName: '', middleName: '', lastName: '', bloodGroup: '', age: '', dob: '',
    gender: '', maritalStatus: '', mobileNumber: '', emergencyNumber: '',
    guardianName: '', guardianRelation: '', addressLine1: '', addressLine2: '',
    country: '', city: '', state: '', pinCode: '', referredBy: '', referredOn: '',
    department: '', notes: '', height: '', weight: '', bloodPressure: '',
    allergies: '', chronicConditions: '', occupation: '', email: '',
    password: '', confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Mock S3 upload function - replace with actual AWS SDK implementation
  const uploadToS3 = async (file) => {
    return new Promise((resolve, reject) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          const mockS3Url = `https://your-bucket.s3.amazonaws.com/patient-images/${Date.now()}-${file.name}`;
          resolve(mockS3Url);
        }
      }, 200);
    });
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'firstName':
        if (!value) return 'First name is required';
        if (value.length < 2) return 'First name must be at least 2 characters';
        if (!/^[a-zA-Z\s\-']+$/.test(value)) return 'First name can only contain letters';
        return '';
      case 'lastName':
        if (!value) return 'Last name is required';
        if (value.length < 2) return 'Last name must be at least 2 characters';
        if (!/^[a-zA-Z\s\-']+$/.test(value)) return 'Last name can only contain letters';
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
        return '';
      case 'gender':
        if (!value) return 'Gender is required';
        return '';
      case 'bloodGroup':
        if (!value) return 'Blood group is required';
        return '';
      case 'addressLine1':
        if (!value) return 'Address is required';
        if (value.length < 5) return 'Please enter a complete address';
        return '';
      case 'pinCode':
        if (value && !/^\d{5,6}$/.test(value)) return 'Pin code must be 5 or 6 digits';
        return '';
      case 'password':
        if (value) {
          if (value.length < 8) return 'Password must be at least 8 characters';
          if (!/[A-Z]/.test(value)) return 'Password must contain at least one uppercase letter';
          if (!/[a-z]/.test(value)) return 'Password must contain at least one lowercase letter';
          if (!/[0-9]/.test(value)) return 'Password must contain at least one number';
        }
        return '';
      case 'confirmPassword':
        if (formData.password && value !== formData.password) return 'Passwords do not match';
        if (formData.password && !value) return 'Please confirm your password';
        return '';
      case 'height':
        if (value && (isNaN(value) || value <= 0 || value > 300)) return 'Height must be between 1-300 cm';
        return '';
      case 'weight':
        if (value && (isNaN(value) || value <= 0 || value > 500)) return 'Weight must be between 1-500 kg';
        return '';
      default: return '';
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const fieldsToValidate = ['firstName', 'lastName', 'mobileNumber', 'age', 'dob', 'gender', 'bloodGroup', 'addressLine1'];
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
    if (name === 'dob' && value) {
      const today = new Date();
      const birthDate = new Date(value);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
      if (age > 0 && age <= 120) setFormData(prev => ({ ...prev, age: age.toString() }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleImageUpload = async (file) => {
    if (!file) return false;
    
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, profileImage: 'File size must be less than 5MB' }));
      return false;
    }
    
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, profileImage: 'Only JPEG, PNG, GIF, and WEBP files are allowed' }));
      return false;
    }
    
    setErrors(prev => ({ ...prev, profileImage: '' }));
    setUploadProgress(0);
    
    const reader = new FileReader();
    reader.onloadend = () => setPreviewImage(reader.result);
    reader.readAsDataURL(file);
    
    try {
      const s3Url = await uploadToS3(file);
      setFormData(prev => ({ ...prev, profileImage: s3Url }));
      setUploadProgress(100);
      return true;
    } catch (error) {
      console.error('S3 upload error:', error);
      setErrors(prev => ({ ...prev, profileImage: 'Failed to upload image. Please try again.' }));
      setPreviewImage(null);
      return false;
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, profileImage: null }));
    setPreviewImage(null);
    setUploadProgress(0);
    setErrors(prev => ({ ...prev, profileImage: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allFields = ['firstName', 'lastName', 'mobileNumber', 'age', 'dob', 'gender', 'bloodGroup', 'addressLine1'];
    const touchedFields = {};
    allFields.forEach(field => touchedFields[field] = true);
    setTouched(touchedFields);
    
    if (validateForm()) {
      setIsSubmitting(true);
      setTimeout(() => {
        const patientId = `PT${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
        const newPatient = {
          id: patientId,
          name: `${formData.firstName} ${formData.lastName}`,
          firstName: formData.firstName,
          middleName: formData.middleName,
          lastName: formData.lastName,
          age: formData.age,
          dob: formData.dob,
          gender: formData.gender,
          bloodGroup: formData.bloodGroup,
          maritalStatus: formData.maritalStatus,
          phone: formData.mobileNumber,
          emergencyNumber: formData.emergencyNumber,
          guardianName: formData.guardianName,
          guardianRelation: formData.guardianRelation,
          address: `${formData.addressLine1} ${formData.addressLine2}`,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          pinCode: formData.pinCode,
          referredBy: formData.referredBy,
          referredOn: formData.referredOn,
          department: formData.department,
          notes: formData.notes,
          height: formData.height,
          weight: formData.weight,
          bloodPressure: formData.bloodPressure,
          allergies: formData.allergies,
          chronicConditions: formData.chronicConditions,
          occupation: formData.occupation,
          email: formData.email,
          lastVisit: new Date().toISOString().split('T')[0],
          lastVisitDisplay: new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
          condition: 'Initial Consultation',
          status: 'Active',
          imageUrl: formData.profileImage || `https://randomuser.me/api/portraits/${formData.gender === 'Male' ? 'men' : 'women'}/${Math.floor(Math.random() * 100)}.jpg`
        };
        const existingPatients = JSON.parse(localStorage.getItem('patients') || '[]');
        localStorage.setItem('patients', JSON.stringify([...existingPatients, newPatient]));
        alert('Patient added successfully!');
        setIsSubmitting(false);
        navigate('/patients');
      }, 1000);
    } else {
      const firstError = document.querySelector('.error-message');
      if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleGoBack = () => navigate('/patients');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information Card */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
              <p className="text-sm text-gray-500 mt-0.5">Patient's personal and medical details</p>
            </div>
            <div className="p-6 space-y-6">
              {/* Profile Image Upload with S3 Support */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center border-2 border-gray-200 overflow-hidden shadow-sm">
                      {previewImage ? (
                        <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    {previewImage && (
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex-1 w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Profile Image</label>
                  <div>
                    <input
                      id="profileImageInput"
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('profileImageInput').click()}
                      className="inline-flex items-center gap-2"
                      disabled={isSubmitting}
                    >
                      <Upload className="h-4 w-4" />
                      Upload Image
                    </Button>
                    <p className="text-xs text-gray-400 mt-2">
                      JPEG, PNG, GIF, WEBP accepted. Max 5MB
                    </p>
                  </div>
                  
                  {/* Upload Progress Bar */}
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="mt-2">
                      <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#1C62A0] transition-all duration-300 rounded-full"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Uploading to cloud... {uploadProgress}%</p>
                    </div>
                  )}
                  
                  {errors.profileImage && <Alert type="error" message={errors.profileImage} className="mt-2" />}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input label="First Name" name="firstName" icon={User} placeholder="Enter first name" value={formData.firstName} onChange={handleChange} onBlur={handleBlur} error={errors.firstName} touched={touched.firstName} required />
                <Input label="Middle Name" name="middleName" required={false} icon={User} placeholder="Enter middle name" value={formData.middleName} onChange={handleChange} onBlur={handleBlur} error={errors.middleName} touched={touched.middleName} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input label="Last Name" name="lastName" icon={User} placeholder="Enter last name" value={formData.lastName} onChange={handleChange} onBlur={handleBlur} error={errors.lastName} touched={touched.lastName} required />
                <Select label="Blood Group" name="bloodGroup" options={['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']} placeholder="Select Blood Group" value={formData.bloodGroup} onChange={handleChange} onBlur={handleBlur} error={errors.bloodGroup} touched={touched.bloodGroup} required />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <Input label="Age" name="age" type="number" icon={Clock} placeholder="Age in years" value={formData.age} onChange={handleChange} onBlur={handleBlur} error={errors.age} touched={touched.age} required />
                <Input label="Date of Birth" name="dob" type="date" icon={Calendar} value={formData.dob} onChange={handleChange} onBlur={handleBlur} error={errors.dob} touched={touched.dob} required />
                <Select label="Gender" name="gender" options={['Male', 'Female', 'Other']} placeholder="Select Gender" value={formData.gender} onChange={handleChange} onBlur={handleBlur} error={errors.gender} touched={touched.gender} required />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Select label="Marital Status" name="maritalStatus" required={false} options={['Single', 'Married', 'Divorced', 'Widowed']} placeholder="Select Marital Status" value={formData.maritalStatus} onChange={handleChange} onBlur={handleBlur} error={errors.maritalStatus} touched={touched.maritalStatus} />
                <Input label="Occupation" name="occupation" required={false} icon={Briefcase} placeholder="Occupation" value={formData.occupation} onChange={handleChange} onBlur={handleBlur} error={errors.occupation} touched={touched.occupation} />
              </div>
            </div>
          </Card>

          {/* Contact Information Card */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>
              <p className="text-sm text-gray-500 mt-0.5">Phone numbers and guardian details</p>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input label="Mobile Number" name="mobileNumber" icon={Phone} placeholder="+1 234 567 8900" value={formData.mobileNumber} onChange={handleChange} onBlur={handleBlur} error={errors.mobileNumber} touched={touched.mobileNumber} required />
                <Input label="Emergency Number" name="emergencyNumber" required={false} icon={AlertTriangle} placeholder="Emergency contact" value={formData.emergencyNumber} onChange={handleChange} onBlur={handleBlur} error={errors.emergencyNumber} touched={touched.emergencyNumber} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input label="Guardian Name" name="guardianName" required={false} icon={Users} placeholder="Parent or guardian name" value={formData.guardianName} onChange={handleChange} onBlur={handleBlur} error={errors.guardianName} touched={touched.guardianName} />
                <Select label="Guardian Relation" name="guardianRelation" required={false} options={['Father', 'Mother', 'Spouse', 'Son', 'Daughter', 'Other']} placeholder="Relationship" value={formData.guardianRelation} onChange={handleChange} onBlur={handleBlur} error={errors.guardianRelation} touched={touched.guardianRelation} />
              </div>
              <Input label="Email Address" name="email" type="email" required={false} icon={Mail} placeholder="patient@example.com" value={formData.email} onChange={handleChange} onBlur={handleBlur} error={errors.email} touched={touched.email} />
            </div>
          </Card>

          {/* Address Information Card */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-900">Address Information</h2>
              <p className="text-sm text-gray-500 mt-0.5">Residential address details</p>
            </div>
            <div className="p-6 space-y-5">
              <Input label="Address Line 1" name="addressLine1" icon={MapPin} placeholder="Street address" value={formData.addressLine1} onChange={handleChange} onBlur={handleBlur} error={errors.addressLine1} touched={touched.addressLine1} required />
              <Input label="Address Line 2" name="addressLine2" required={false} placeholder="Apartment, suite, unit, etc." value={formData.addressLine2} onChange={handleChange} onBlur={handleBlur} error={errors.addressLine2} touched={touched.addressLine2} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <Select label="Country" name="country" required={false} options={['United States', 'United Kingdom', 'Canada', 'Australia', 'India', 'Germany', 'France']} placeholder="Select Country" value={formData.country} onChange={handleChange} onBlur={handleBlur} error={errors.country} touched={touched.country} />
                <Input label="City" name="city" required={false} placeholder="City" value={formData.city} onChange={handleChange} onBlur={handleBlur} error={errors.city} touched={touched.city} />
                <Input label="State" name="state" required={false} placeholder="State" value={formData.state} onChange={handleChange} onBlur={handleBlur} error={errors.state} touched={touched.state} />
                <Input label="Pin Code" name="pinCode" required={false} placeholder="Postal code" value={formData.pinCode} onChange={handleChange} onBlur={handleBlur} error={errors.pinCode} touched={touched.pinCode} />
              </div>
            </div>
          </Card>

          {/* Medical Information Card */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-900">Medical Information</h2>
              <p className="text-sm text-gray-500 mt-0.5">Health metrics and clinical notes</p>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <Input label="Height (cm)" name="height" type="number" required={false} icon={Activity} placeholder="cm" value={formData.height} onChange={handleChange} onBlur={handleBlur} error={errors.height} touched={touched.height} />
                <Input label="Weight (kg)" name="weight" type="number" required={false} icon={Activity} placeholder="kg" value={formData.weight} onChange={handleChange} onBlur={handleBlur} error={errors.weight} touched={touched.weight} />
                <Input label="Blood Pressure" name="bloodPressure" required={false} icon={Heart} placeholder="e.g., 120/80" value={formData.bloodPressure} onChange={handleChange} onBlur={handleBlur} error={errors.bloodPressure} touched={touched.bloodPressure} />
              </div>
              <Textarea label="Allergies" name="allergies" rows={2} placeholder="List any allergies (medications, food, etc.)" value={formData.allergies} onChange={handleChange} onBlur={handleBlur} error={errors.allergies} touched={touched.allergies} />
              <Textarea label="Chronic Conditions" name="chronicConditions" rows={2} placeholder="Diabetes, hypertension, asthma, etc." value={formData.chronicConditions} onChange={handleChange} onBlur={handleBlur} error={errors.chronicConditions} touched={touched.chronicConditions} />
            </div>
          </Card>

          {/* Referral Information Card */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-900">Referral Information</h2>
              <p className="text-sm text-gray-500 mt-0.5">Referring doctor and department details</p>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <Input label="Referred By" name="referredBy" required={false} icon={User} placeholder="Doctor name" value={formData.referredBy} onChange={handleChange} onBlur={handleBlur} error={errors.referredBy} touched={touched.referredBy} />
                <Input label="Referred On" name="referredOn" type="date" required={false} icon={Calendar} value={formData.referredOn} onChange={handleChange} onBlur={handleBlur} error={errors.referredOn} touched={touched.referredOn} />
                <Select label="Department" name="department" required={false} options={['Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'Dermatology', 'Psychiatry', 'Radiology', 'Surgery', 'Pulmonology']} placeholder="Select Department" value={formData.department} onChange={handleChange} onBlur={handleBlur} error={errors.department} touched={touched.department} />
              </div>
            </div>
          </Card>

          {/* Additional Notes Card */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-900">Additional Notes</h2>
              <p className="text-sm text-gray-500 mt-0.5">Clinical observations and remarks</p>
            </div>
            <div className="p-6">
              <Textarea label="Notes" name="notes" rows={4} placeholder="Any additional information about the patient..." value={formData.notes} onChange={handleChange} onBlur={handleBlur} error={errors.notes} touched={touched.notes} />
            </div>
          </Card>

          {/* Account Details Card */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-900">Account Details</h2>
              <p className="text-sm text-gray-500 mt-0.5">Login credentials for patient portal (optional)</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input label="Password" name="password" type="password" required={false} icon={Lock} placeholder="Create password" value={formData.password} onChange={handleChange} onBlur={handleBlur} error={errors.password} touched={touched.password} />
                <Input label="Confirm Password" name="confirmPassword" type="password" required={false} icon={Lock} placeholder="Confirm password" value={formData.confirmPassword} onChange={handleChange} onBlur={handleBlur} error={errors.confirmPassword} touched={touched.confirmPassword} />
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={handleGoBack}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={isSubmitting} loading={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Patient'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPatient;