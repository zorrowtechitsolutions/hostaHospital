// src/components/Laboratory/LaboratoryRegistrationForm.jsx - With toast notifications
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building, Phone, Mail, MapPin, Lock, AlertCircle, 
  ArrowLeft, Globe, Clock, FileText, PhoneCall, MapPinned,
  Upload, X
} from 'lucide-react';
import { 
  Button, Input, Select, Textarea, Card, Alert, Tabs, Checkbox 
} from '../ui';
import { showAddToast, showErrorToast, showWarningToast, showSuccessToast } from '../ui/Toast';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const LaboratoryRegistrationForm = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    address: { country: '', state: '', district: '', place: '', pincode: '' },
    phone: '',
    emergencyContact: '',
    email: '',
    password: '',
    confirmPassword: '',
    latitude: '',
    longitude: '',
    about: '',
    web: '',
    working_hours: daysOfWeek.map(day => ({ day, open: '09:00', close: '17:00', is_holiday: false })),
  });

  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [uploadProgress, setUploadProgress] = useState(0);

  // Mock S3 upload function
  const uploadToS3 = async (file) => {
    return new Promise((resolve, reject) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          const mockS3Url = `https://your-bucket.s3.amazonaws.com/lab-images/${Date.now()}-${file.name}`;
          resolve(mockS3Url);
        }
      }, 200);
    });
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'name':
        if (!value) return 'Laboratory name is required';
        if (value.length < 3) return 'Name must be at least 3 characters';
        if (value.length > 100) return 'Name must be less than 100 characters';
        return '';
      case 'phone':
        if (!value) return 'Phone number is required';
        const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{3,4}[-\s\.]?[0-9]{3,4}$/;
        if (!phoneRegex.test(value)) return 'Please enter a valid phone number';
        return '';
      case 'emergencyContact':
        if (!value) return 'Emergency contact is required';
        if (!phoneRegex.test(value)) return 'Please enter a valid emergency contact number';
        return '';
      case 'email':
        if (value) {
          const emailRegex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
          if (!emailRegex.test(value)) return 'Please enter a valid email address';
        }
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
      case 'address.place':
        if (!value) return 'Address is required';
        if (value.length < 5) return 'Please enter a complete address';
        return '';
      case 'address.pincode':
        if (!value) return 'Pincode is required';
        if (!/^\d{5,6}$/.test(String(value))) return 'Pincode must be 5 or 6 digits';
        return '';
      case 'latitude':
        if (!value && value !== 0) return 'Latitude is required';
        if (isNaN(value)) return 'Latitude must be a number';
        if (parseFloat(value) < -90 || parseFloat(value) > 90) return 'Latitude must be between -90 and 90';
        return '';
      case 'longitude':
        if (!value && value !== 0) return 'Longitude is required';
        if (isNaN(value)) return 'Longitude must be a number';
        if (parseFloat(value) < -180 || parseFloat(value) > 180) return 'Longitude must be between -180 and 180';
        return '';
      case 'about':
        if (!value) return 'About section is required';
        if (value.length < 50) return 'Please provide at least 50 characters describing the laboratory';
        if (value.length > 2000) return 'About section must be less than 2000 characters';
        return '';
      default:
        return '';
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = ['name', 'phone', 'emergencyContact', 'about'];
    requiredFields.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });

    const addressPlaceError = validateField('address.place', formData.address.place);
    if (addressPlaceError) newErrors['address.place'] = addressPlaceError;
    
    const pincodeError = validateField('address.pincode', formData.address.pincode);
    if (pincodeError) newErrors['address.pincode'] = pincodeError;

    const latError = validateField('latitude', formData.latitude);
    if (latError) newErrors.latitude = latError;
    
    const lngError = validateField('longitude', formData.longitude);
    if (lngError) newErrors.longitude = lngError;

    if (formData.email) {
      const emailError = validateField('email', formData.email);
      if (emailError) newErrors.email = emailError;
    }

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
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({ ...prev, [parent]: { ...prev[parent], [child]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
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

  const handleWorkingHoursChange = (index, field, value) => {
    const updatedHours = [...formData.working_hours];
    updatedHours[index] = { ...updatedHours[index], [field]: value };
    setFormData(prev => ({ ...prev, working_hours: updatedHours }));
  };

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
      setProfileImage(s3Url);
      setUploadProgress(100);
      showSuccessToast('Logo uploaded successfully!', 2000);
      return true;
    } catch (error) {
      console.error('S3 upload error:', error);
      setErrors(prev => ({ ...prev, profileImage: 'Failed to upload image. Please try again.' }));
      showErrorToast('Failed to upload image. Please try again.', 3000);
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
    setProfileImage(null);
    setPreviewImage(null);
    setUploadProgress(0);
    setErrors(prev => ({ ...prev, profileImage: '' }));
    showSuccessToast('Logo removed', 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allFields = ['name', 'phone', 'emergencyContact', 'about', 'address.place', 'address.pincode', 'latitude', 'longitude'];
    const touchedFields = {};
    allFields.forEach(field => touchedFields[field] = true);
    setTouched(touchedFields);
    
    if (validateForm()) {
      setIsSubmitting(true);
      setTimeout(() => {
        try {
          const existingLabs = JSON.parse(localStorage.getItem('laboratories') || '[]');
          
          // Check if lab name already exists
          const nameExists = existingLabs.some(lab => lab.name.toLowerCase() === formData.name.toLowerCase());
          if (nameExists) {
            showErrorToast('Laboratory name already exists! Please use a different name.', 4000);
            setIsSubmitting(false);
            return;
          }
          
          const newLabId = Date.now();
          const newLab = {
            id: newLabId,
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            emergencyContact: formData.emergencyContact,
            address: formData.address,
            about: formData.about,
            web: formData.web,
            latitude: formData.latitude,
            longitude: formData.longitude,
            working_hours: formData.working_hours,
            logo: previewImage || null,
            status: 'Active',
            tests: 0,
            createdAt: new Date().toISOString(),
          };
          
          localStorage.setItem('laboratories', JSON.stringify([...existingLabs, newLab]));
          
          showAddToast(
            `${formData.name} has been registered successfully!`,
            4000,
            {
              'Laboratory': formData.name,
              'Phone': formData.phone,
              'ID': `#LAB${String(newLabId).slice(-6)}`
            }
          );
          
          setIsSubmitting(false);
          
          setTimeout(() => {
            navigate('/laboratories');
          }, 1500);
        } catch (error) {
          showErrorToast('Failed to register laboratory. Please try again.', 3000);
          setIsSubmitting(false);
        }
      }, 1000);
    } else {
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        showWarningToast(`Please fix the ${firstErrorField} field`, 3000);
      }
      const firstError = document.querySelector('.error-message');
      if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleGoBack = () => {
    if (formData.name || formData.phone || formData.about || previewImage) {
      showWarningToast('Any unsaved data will be lost. Are you sure you want to leave?', 4000);
      setTimeout(() => {
        if (window.confirm('Are you sure you want to go back? Any unsaved data will be lost.')) {
          navigate('/laboratories');
        }
      }, 100);
    } else {
      navigate('/laboratories');
    }
  };

  const getNestedValue = (obj, path) => path.split('.').reduce((current, key) => current?.[key], obj);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Button variant="ghost" size="sm" onClick={handleGoBack} className="p-2">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Add New Laboratory</h1>
              <p className="text-sm text-gray-500 mt-1">Register a new diagnostic lab in the system</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs 
            tabs={[
              { id: 'basic', label: 'Basic Information', icon: Building },
              { id: 'address', label: 'Address & Location', icon: MapPin },
              { id: 'hours', label: 'Working Hours', icon: Clock },
              { id: 'about', label: 'About', icon: FileText },
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          {/* Profile Image Section with S3 Upload */}
          <Card>
            <div className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center border-2 border-gray-200 overflow-hidden shadow-sm">
                      {previewImage ? (
                        <img src={previewImage} alt="Lab logo" className="w-full h-full object-cover" />
                      ) : (
                        <Building className="h-8 w-8 text-gray-400" />
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Laboratory Logo</label>
                  <div>
                    <input
                      id="logoImageInput"
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('logoImageInput').click()}
                      className="inline-flex items-center gap-2"
                      disabled={isSubmitting}
                    >
                      <Upload className="h-4 w-4" />
                      Upload Logo
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

                <div className="flex-1">
                  <div className="grid grid-cols-1 gap-5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Lab ID:</span>
                      <span className="text-sm font-medium text-gray-900">Auto-generated</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Input 
                    label="Laboratory Name" 
                    name="name" 
                    icon={Building} 
                    placeholder="e.g., City Diagnostic Centre" 
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.name}
                    touched={touched.name}
                    required
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              {/* Basic Information Tab */}
              {activeTab === 'basic' && (
                <div className="space-y-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input label="Phone Number" name="phone" icon={Phone} placeholder="+1 234 567 8900" value={formData.phone} onChange={handleChange} onBlur={handleBlur} error={errors.phone} touched={touched.phone} required />
                    <Input label="Emergency Contact" name="emergencyContact" icon={PhoneCall} placeholder="+1 234 567 8900" value={formData.emergencyContact} onChange={handleChange} onBlur={handleBlur} error={errors.emergencyContact} touched={touched.emergencyContact} required />
                    <Input label="Email Address" name="email" type="email" icon={Mail} placeholder="lab@example.com" required={false} value={formData.email} onChange={handleChange} onBlur={handleBlur} error={errors.email} touched={touched.email} />
                    <Input label="Website" name="web" icon={Globe} placeholder="https://www.labwebsite.com" required={false} value={formData.web} onChange={handleChange} onBlur={handleBlur} error={errors.web} touched={touched.web} />
                  </div>
                  <div className="border-t pt-5 mt-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Credentials (Optional)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <Input label="Password" name="password" type="password" icon={Lock} placeholder="Create password" required={false} value={formData.password} onChange={handleChange} onBlur={handleBlur} error={errors.password} touched={touched.password} />
                      <Input label="Confirm Password" name="confirmPassword" type="password" icon={Lock} placeholder="Confirm password" required={false} value={formData.confirmPassword} onChange={handleChange} onBlur={handleBlur} error={errors.confirmPassword} touched={touched.confirmPassword} />
                    </div>
                  </div>
                </div>
              )}

              {/* Address & Location Tab */}
              {activeTab === 'address' && (
                <div className="space-y-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Address Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Select label="Country" name="address.country" required={false} options={['United States', 'United Kingdom', 'Canada', 'Australia', 'India', 'Germany', 'France']} placeholder="Select Country" value={formData.address.country} onChange={handleChange} onBlur={handleBlur} error={errors['address.country']} touched={touched['address.country']} />
                    <Input label="State" name="address.state" required={false} placeholder="State" value={formData.address.state} onChange={handleChange} onBlur={handleBlur} error={errors['address.state']} touched={touched['address.state']} />
                    <Input label="District" name="address.district" required={false} placeholder="District" value={formData.address.district} onChange={handleChange} onBlur={handleBlur} error={errors['address.district']} touched={touched['address.district']} />
                    <Input label="Place / Area" name="address.place" icon={MapPin} placeholder="Street, area, locality" value={formData.address.place} onChange={handleChange} onBlur={handleBlur} error={errors['address.place']} touched={touched['address.place']} required />
                    <Input label="Pincode" name="address.pincode" placeholder="123456" value={formData.address.pincode} onChange={handleChange} onBlur={handleBlur} error={errors['address.pincode']} touched={touched['address.pincode']} required />
                  </div>
                  <div className="border-t pt-5 mt-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">GPS Coordinates</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <Input label="Latitude" name="latitude" type="number" step="any" icon={MapPinned} placeholder="40.7128" value={formData.latitude} onChange={handleChange} onBlur={handleBlur} error={errors.latitude} touched={touched.latitude} required />
                      <Input label="Longitude" name="longitude" type="number" step="any" icon={MapPinned} placeholder="-74.0060" value={formData.longitude} onChange={handleChange} onBlur={handleBlur} error={errors.longitude} touched={touched.longitude} required />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Coordinates help display the laboratory location on maps</p>
                  </div>
                </div>
              )}

              {/* Working Hours Tab */}
              {activeTab === 'hours' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Operating Hours</h3>
                  <div className="space-y-3">
                    {formData.working_hours.map((session, index) => (
                      <div key={session.day} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg flex-wrap">
                        <div className="w-28 font-medium text-gray-700 text-sm">{session.day}</div>
                        <Checkbox label="Holiday" checked={session.is_holiday} onChange={(e) => handleWorkingHoursChange(index, 'is_holiday', e.target.checked)} />
                        {!session.is_holiday && (
                          <div className="flex items-center gap-2">
                            <input type="time" value={session.open} onChange={(e) => handleWorkingHoursChange(index, 'open', e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1C62A0]" />
                            <span className="text-gray-500">to</span>
                            <input type="time" value={session.close} onChange={(e) => handleWorkingHoursChange(index, 'close', e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1C62A0]" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* About Tab */}
              {activeTab === 'about' && (
                <div className="space-y-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Laboratory Information</h3>
                  <Textarea label="About the Laboratory" name="about" required rows={6} placeholder="Write a detailed description about the laboratory including:" value={formData.about} onChange={handleChange} onBlur={handleBlur} error={errors.about} touched={touched.about} />
                  <Alert type="info" message="Provide comprehensive information about your laboratory including types of tests offered, accreditations, equipment, sample collection services, home collection availability, and reporting time." />
                </div>
              )}
            </div>
          </Card>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={handleGoBack}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={isSubmitting} loading={isSubmitting}>
              {isSubmitting ? 'Registering...' : 'Register Laboratory'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LaboratoryRegistrationForm;