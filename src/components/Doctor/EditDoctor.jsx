// src/components/Doctor/EditDoctor.jsx - With toast notifications
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  User, Mail, Phone, Calendar, MapPin, Lock, Image, 
  DollarSign, IdCard, AlertCircle, ArrowLeft, Upload, X 
} from 'lucide-react';
import { 
  Button, Input, Select, Textarea, Card, Alert, Loader 
} from '../ui';
import { showUpdateToast, showErrorToast, showWarningToast, showSuccessToast } from '../ui/Toast';

const EditDoctor = () => {
  const navigate = useNavigate();
  let { id } = useParams();
  
  // Enhanced ID cleaning
  if (id) {
    console.log('Raw ID from URL:', id);
    id = id.replace(/[^0-9]/g, '');
    id = parseInt(id);
    console.log('Cleaned ID:', id);
  }
  
  const [loading, setLoading] = useState(true);
  const [doctorNotFound, setDoctorNotFound] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
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
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock S3 upload function
  const uploadToS3 = async (file) => {
    return new Promise((resolve, reject) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          const mockS3Url = `https://your-bucket.s3.amazonaws.com/doctor-images/${Date.now()}-${file.name}`;
          resolve(mockS3Url);
        }
      }, 200);
    });
  };

  // Load doctor data from localStorage
  useEffect(() => {
    const loadDoctorData = () => {
      const existingDoctors = JSON.parse(localStorage.getItem('doctors') || '[]');
      
      console.log('Looking for doctor with ID (cleaned):', id);
      console.log('Available doctors:', existingDoctors);
      
      const doctor = existingDoctors.find(doc => doc.id === id);
      
      if (!doctor) {
        setDoctorNotFound(true);
        setLoading(false);
        return;
      }
      
      const nameWithoutDr = doctor.name?.replace('Dr. ', '') || '';
      const nameParts = nameWithoutDr.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      setFormData({
        profileImage: doctor.photo || null,
        firstName: firstName,
        lastName: lastName,
        department: doctor.specialty || doctor.department || '',
        specialist: doctor.specialty || '',
        fees: doctor.fees || '',
        phoneNumber: doctor.phone || '',
        email: doctor.email || '',
        dob: doctor.dob || '',
        gender: doctor.gender || '',
        registrationNumber: doctor.registrationNumber || '',
        knownLanguages: doctor.knownLanguages || '',
        about: doctor.about || '',
        address: doctor.address || '',
        country: doctor.country || '',
        state: doctor.state || '',
        city: doctor.city || '',
        pinCode: doctor.pinCode || '',
        displayName: doctor.displayName || doctor.name || '',
        userName: doctor.userName || '',
        password: '',
        confirmPassword: ''
      });
      
      if (doctor.photo && (doctor.photo.startsWith('data:') || doctor.photo?.startsWith('http'))) {
        setPreviewImage(doctor.photo);
      }
      
      setLoading(false);
    };
    
    if (id && !isNaN(id)) {
      loadDoctorData();
    } else {
      setDoctorNotFound(true);
      setLoading(false);
    }
  }, [id]);

  // Image upload handler
  const handleImageUpload = async (file) => {
    if (!file) return false;
    
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, profileImage: 'File size must be less than 5MB' }));
      showWarningToast('File size must be less than 5MB', 3000);
      return false;
    }
    
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, profileImage: 'Only JPEG, PNG, GIF, and WEBP files are allowed' }));
      showWarningToast('Only JPEG, PNG, GIF, and WEBP files are allowed', 3000);
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
      showSuccessToast('Image uploaded successfully!', 2000);
      return true;
    } catch (error) {
      console.error('S3 upload error:', error);
      setErrors(prev => ({ ...prev, profileImage: 'Failed to upload image. Please try again.' }));
      showErrorToast('Failed to upload image. Please try again.', 3000);
      const existingDoctors = JSON.parse(localStorage.getItem('doctors') || '[]');
      const doctor = existingDoctors.find(doc => doc.id === id);
      if (doctor?.photo) {
        setPreviewImage(doctor.photo);
      } else {
        setPreviewImage(null);
      }
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
    showSuccessToast('Image removed', 2000);
  };

  // Validation functions (same as AddDoctor)
  const validateField = (name, value) => {
    // ... (same validation as AddDoctor)
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
      case 'email':
        if (!value) return 'Email address is required';
        const emailRegex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
        if (!emailRegex.test(value)) return 'Please enter a valid email address';
        return '';
      // Add other validations as needed
      default:
        return '';
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const fieldsToValidate = ['firstName', 'lastName', 'email', 'phoneNumber', 'specialist', 'fees'];
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

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const calculateExperience = (dob) => {
    if (!dob) return '0+ Years';
    const birthDate = new Date(dob);
    const today = new Date();
    let experience = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) experience--;
    const experienceYears = Math.max(0, experience - 25);
    return `${experienceYears}+ Years`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const allFields = ['firstName', 'lastName', 'email', 'phoneNumber', 'specialist', 'fees'];
    const touchedFields = {};
    allFields.forEach(field => touchedFields[field] = true);
    setTouched(touchedFields);
    
    if (validateForm()) {
      setIsSubmitting(true);
      
      setTimeout(() => {
        try {
          const existingDoctors = JSON.parse(localStorage.getItem('doctors') || '[]');
          const doctorIndex = existingDoctors.findIndex(doc => doc.id === id);
          
          if (doctorIndex !== -1) {
            const updatedDoctor = {
              ...existingDoctors[doctorIndex],
              name: `Dr. ${formData.firstName} ${formData.lastName}`,
              specialty: formData.specialist,
              experience: calculateExperience(formData.dob),
              email: formData.email,
              phone: formData.phoneNumber,
              photo: formData.profileImage || previewImage || existingDoctors[doctorIndex].photo,
              department: formData.department,
              fees: formData.fees,
              dob: formData.dob,
              gender: formData.gender,
              registrationNumber: formData.registrationNumber,
              knownLanguages: formData.knownLanguages,
              about: formData.about,
              address: formData.address,
              country: formData.country,
              state: formData.state,
              city: formData.city,
              pinCode: formData.pinCode,
              displayName: formData.displayName,
              userName: formData.userName,
              appointments: existingDoctors[doctorIndex].appointments || 0,
              ...(formData.password && { password: formData.password })
            };
            
            existingDoctors[doctorIndex] = updatedDoctor;
            localStorage.setItem('doctors', JSON.stringify(existingDoctors));
            
            showUpdateToast(
              `Dr. ${formData.firstName} ${formData.lastName} has been updated successfully!`,
              4000,
              {
                'Name': `Dr. ${formData.firstName} ${formData.lastName}`,
                'Specialty': formData.specialist,
                'Department': formData.department,
                'ID': `#DR${String(id).padStart(4, '0')}`
              }
            );
            
            setIsSubmitting(false);
            
            setTimeout(() => {
              navigate('/doctors');
            }, 1500);
          } else {
            showErrorToast('Doctor not found!', 3000);
            setIsSubmitting(false);
          }
        } catch (error) {
          showErrorToast('Failed to update doctor. Please try again.', 3000);
          setIsSubmitting(false);
        }
      }, 1000);
    } else {
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        showWarningToast(`Please fix the ${firstErrorField} field`, 3000);
      }
    }
  };

  const handleGoBack = () => {
    if (formData.firstName || formData.lastName || formData.email) {
      showWarningToast('Any unsaved changes will be lost. Are you sure you want to leave?', 4000);
      setTimeout(() => {
        if (window.confirm('Are you sure you want to go back? Any unsaved changes will be lost.')) {
          navigate('/doctors');
        }
      }, 100);
    } else {
      navigate('/doctors');
    }
  };

  if (loading) {
    return <Loader centered text="Loading doctor data..." />;
  }

  if (doctorNotFound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 rounded-full h-20 w-20 flex items-center justify-center mx-auto">
            <AlertCircle className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mt-4">Doctor Not Found</h2>
          <p className="text-gray-600 mt-2">The doctor you're trying to edit doesn't exist.</p>
          <Button variant="primary" onClick={() => navigate('/doctors')} className="mt-6">
            Back to Doctors List
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Button variant="ghost" size="sm" onClick={handleGoBack} className="p-2">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Doctor</h1>
              <p className="text-sm text-gray-500 mt-1">Update doctor profile in the system</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information Card */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
              <p className="text-sm text-gray-500 mt-0.5">Doctor's personal and professional details</p>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Profile Image Upload */}
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
                      Upload New Image
                    </Button>
                    <p className="text-xs text-gray-400 mt-2">JPEG, PNG, GIF, WEBP accepted. Max 5MB</p>
                  </div>
                  
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
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Doctor ID:</span>
                  <span className="text-sm font-medium text-gray-900 bg-gray-100 px-2 py-1 rounded">
                    #{String(id).padStart(4, '0')}
                  </span>
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
            </div>
          </Card>

          {/* Address Information Card */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-900">Address Information</h2>
              <p className="text-sm text-gray-500 mt-0.5">Clinic or hospital address details</p>
            </div>
            <div className="p-6 space-y-5">
              <Input label="Address" name="address" icon={MapPin} placeholder="Street address" value={formData.address} onChange={handleChange} onBlur={handleBlur} error={errors.address} touched={touched.address} required />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <Select label="Country" name="country" required={false} options={['United States', 'United Kingdom', 'Canada', 'Australia', 'India', 'Germany', 'France']} placeholder="Select Country" value={formData.country} onChange={handleChange} onBlur={handleBlur} error={errors.country} touched={touched.country} />
                <Input label="State" name="state" required={false} placeholder="State" value={formData.state} onChange={handleChange} onBlur={handleBlur} error={errors.state} touched={touched.state} />
                <Input label="City" name="city" required={false} placeholder="City" value={formData.city} onChange={handleChange} onBlur={handleBlur} error={errors.city} touched={touched.city} />
                <Input label="Pin Code" name="pinCode" required={false} placeholder="Postal code" value={formData.pinCode} onChange={handleChange} onBlur={handleBlur} error={errors.pinCode} touched={touched.pinCode} />
              </div>
            </div>
          </Card>

          {/* Account Details Card */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-900">Account Details</h2>
              <p className="text-sm text-gray-500 mt-0.5">Login credentials for the doctor portal (leave password blank to keep current)</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input label="Display Name" name="displayName" required={false} icon={User} placeholder="How name appears on profile" value={formData.displayName} onChange={handleChange} onBlur={handleBlur} error={errors.displayName} touched={touched.displayName} />
                <Input label="Username" name="userName" required={false} icon={User} placeholder="Unique username" value={formData.userName} onChange={handleChange} onBlur={handleBlur} error={errors.userName} touched={touched.userName} />
                <Input label="New Password" name="password" type="password" required={false} icon={Lock} placeholder="Leave blank to keep current" value={formData.password} onChange={handleChange} onBlur={handleBlur} error={errors.password} touched={touched.password} />
                <Input label="Confirm New Password" name="confirmPassword" type="password" required={false} icon={Lock} placeholder="Confirm new password" value={formData.confirmPassword} onChange={handleChange} onBlur={handleBlur} error={errors.confirmPassword} touched={touched.confirmPassword} />
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={handleGoBack}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={isSubmitting} loading={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Doctor'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditDoctor;