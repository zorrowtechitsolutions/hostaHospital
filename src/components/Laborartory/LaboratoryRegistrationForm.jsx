// src/components/Laboratory/LaboratoryRegistrationForm.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building, Phone, Mail, MapPin, Lock, 
  ArrowLeft, Globe, Clock, FileText, PhoneCall, MapPinned,
  Upload, X
} from 'lucide-react';
import { 
  Button, Input, Select, Textarea, Card, Alert, Tabs, Checkbox 
} from '../ui';
import { showAddToast, showErrorToast, showWarningToast, showSuccessToast } from '../ui/Toast';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const PHONE_REGEX = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{3,4}[-\s\.]?[0-9]{3,4}$/;

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
    working_hours: DAYS.map(day => ({ day, open: '09:00', close: '17:00', is_holiday: false })),
  });

  const [previewImage, setPreviewImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [uploadProgress, setUploadProgress] = useState(0);

  const validateField = (name, value) => {
    const validations = {
      name: () => !value ? 'Laboratory name is required' : 
             value.length < 3 ? 'Name must be at least 3 characters' : '',
      phone: () => !value ? 'Phone number is required' : 
             !PHONE_REGEX.test(value) ? 'Please enter a valid phone number' : '',
      emergencyContact: () => !value ? 'Emergency contact is required' : 
                        !PHONE_REGEX.test(value) ? 'Please enter a valid emergency contact number' : '',
      email: () => value && !/^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/.test(value) ? 'Please enter a valid email address' : '',
      password: () => value && (value.length < 8 ? 'Password must be at least 8 characters' :
                 !/[A-Z]/.test(value) ? 'Password must contain at least one uppercase letter' :
                 !/[a-z]/.test(value) ? 'Password must contain at least one lowercase letter' :
                 !/[0-9]/.test(value) ? 'Password must contain at least one number' : ''),
      confirmPassword: () => formData.password && (!value ? 'Please confirm your password' :
                         value !== formData.password ? 'Passwords do not match' : ''),
      'address.place': () => !value ? 'Address is required' : 
                         value.length < 5 ? 'Please enter a complete address' : '',
      'address.pincode': () => !value ? 'Pincode is required' : 
                         !/^\d{5,6}$/.test(String(value)) ? 'Pincode must be 5 or 6 digits' : '',
      latitude: () => !value && value !== 0 ? 'Latitude is required' :
                isNaN(value) ? 'Latitude must be a number' :
                parseFloat(value) < -90 || parseFloat(value) > 90 ? 'Latitude must be between -90 and 90' : '',
      longitude: () => !value && value !== 0 ? 'Longitude is required' :
                 isNaN(value) ? 'Longitude must be a number' :
                 parseFloat(value) < -180 || parseFloat(value) > 180 ? 'Longitude must be between -180 and 180' : '',
      about: () => !value ? 'About section is required' :
               value.length < 50 ? 'Please provide at least 50 characters' :
               value.length > 2000 ? 'About section must be less than 2000 characters' : '',
    };
    return validations[name]?.() || '';
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
    setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleWorkingHoursChange = (index, field, value) => {
    const updatedHours = [...formData.working_hours];
    updatedHours[index] = { ...updatedHours[index], [field]: value };
    setFormData(prev => ({ ...prev, working_hours: updatedHours }));
  };

  const uploadToS3 = async (file) => {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          resolve(`https://your-bucket.s3.amazonaws.com/lab-images/${Date.now()}-${file.name}`);
        }
      }, 200);
    });
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, profileImage: 'File size must be less than 5MB' }));
      showWarningToast('File size must be less than 5MB', 3000);
      return;
    }
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, profileImage: 'Only JPEG, PNG, GIF, and WEBP files are allowed' }));
      showWarningToast('Only JPEG, PNG, GIF, and WEBP files are allowed', 3000);
      return;
    }
    setErrors(prev => ({ ...prev, profileImage: '' }));
    setUploadProgress(0);
    
    const reader = new FileReader();
    reader.onloadend = () => setPreviewImage(reader.result);
    reader.readAsDataURL(file);
    
    try {
      await uploadToS3(file);
      showSuccessToast('Logo uploaded successfully!', 2000);
    } catch {
      setErrors(prev => ({ ...prev, profileImage: 'Failed to upload image' }));
      showErrorToast('Failed to upload image', 3000);
      setPreviewImage(null);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const required = ['name', 'phone', 'emergencyContact', 'about', 'address.place', 'address.pincode', 'latitude', 'longitude'];
    required.forEach(field => {
      const value = field.includes('.') ? field.split('.').reduce((obj, key) => obj?.[key], formData) : formData[field];
      const error = validateField(field, value);
      if (error) newErrors[field] = error;
    });
    if (formData.email) {
      const error = validateField('email', formData.email);
      if (error) newErrors.email = error;
    }
    if (formData.password) {
      const passError = validateField('password', formData.password);
      if (passError) newErrors.password = passError;
      const confirmError = validateField('confirmPassword', formData.confirmPassword);
      if (confirmError) newErrors.confirmPassword = confirmError;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const required = ['name', 'phone', 'emergencyContact', 'about', 'address.place', 'address.pincode', 'latitude', 'longitude'];
    const touchedFields = Object.fromEntries(required.map(field => [field, true]));
    setTouched(touchedFields);
    
    if (!validateForm()) {
      const firstError = Object.keys(errors)[0];
      if (firstError) showWarningToast(`Please fix the ${firstError} field`, 3000);
      return;
    }

    setIsSubmitting(true);
    try {
      const existingLabs = JSON.parse(localStorage.getItem('laboratories') || '[]');
      if (existingLabs.some(lab => lab.name.toLowerCase() === formData.name.toLowerCase())) {
        showErrorToast('Laboratory name already exists!', 4000);
        setIsSubmitting(false);
        return;
      }
      
      const newLabId = Date.now();
      const newLab = {
        id: newLabId,
        ...formData,
        logo: previewImage || null,
        status: 'Active',
        tests: 0,
        createdAt: new Date().toISOString(),
      };
      
      localStorage.setItem('laboratories', JSON.stringify([...existingLabs, newLab]));
      
      showAddToast(
        `${formData.name} has been registered successfully!`,
        4000,
        { 'Laboratory': formData.name, 'Phone': formData.phone, 'ID': `#LAB${String(newLabId).slice(-6)}` }
      );
      
      setIsSubmitting(false);
      setTimeout(() => navigate('/laboratories'), 1500);
    } catch {
      showErrorToast('Failed to register laboratory', 3000);
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => {
    const hasUnsaved = formData.name || formData.phone || formData.about || previewImage;
    if (hasUnsaved && window.confirm('Any unsaved data will be lost. Are you sure?')) {
      navigate('/laboratories');
    } else if (!hasUnsaved) {
      navigate('/laboratories');
    }
  };

  const renderField = (field) => {
    const { label, name, type = 'text', icon, placeholder, required = false, options } = field;
    const value = name.includes('.') ? name.split('.').reduce((obj, key) => obj?.[key], formData) : formData[name];
    
    if (type === 'select') {
      return (
        <Select
          key={name}
          label={label}
          name={name}
          options={options}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors[name]}
          touched={touched[name]}
          required={required}
        />
      );
    }
    
    return (
      <Input
        key={name}
        label={label}
        name={name}
        type={type}
        icon={icon}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        error={errors[name]}
        touched={touched[name]}
        required={required}
      />
    );
  };

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

          {/* Logo Upload */}
          <Card>
            <div className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center border-2 border-gray-200 overflow-hidden">
                    {previewImage ? (
                      <img src={previewImage} alt="Lab logo" className="w-full h-full object-cover" />
                    ) : (
                      <Building className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  {previewImage && (
                    <button
                      type="button"
                      onClick={() => { setPreviewImage(null); setUploadProgress(0); }}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
                
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Laboratory Logo</label>
                  <input
                    id="logoImageInput"
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={(e) => handleImageUpload(e.target.files[0])}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('logoImageInput').click()}
                    className="inline-flex items-center gap-2"
                    disabled={isSubmitting}
                  >
                    <Upload className="h-4 w-4" /> Upload Logo
                  </Button>
                  <p className="text-xs text-gray-400 mt-2">JPEG, PNG, GIF, WEBP. Max 5MB</p>
                  
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="mt-2">
                      <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-[#1C62A0] transition-all duration-300 rounded-full" style={{ width: `${uploadProgress}%` }} />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Uploading... {uploadProgress}%</p>
                    </div>
                  )}
                  {errors.profileImage && <Alert type="error" message={errors.profileImage} className="mt-2" />}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Lab ID:</span>
                    <span className="text-sm font-medium text-gray-900">Auto-generated</span>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                {renderField({ label: "Laboratory Name", name: "name", icon: Building, placeholder: "e.g., City Diagnostic Centre", required: true })}
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              {activeTab === 'basic' && (
                <div className="space-y-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {renderField({ label: "Phone Number", name: "phone", icon: Phone, placeholder: "+1 234 567 8900", required: true })}
                    {renderField({ label: "Emergency Contact", name: "emergencyContact", icon: PhoneCall, placeholder: "+1 234 567 8900", required: true })}
                    {renderField({ label: "Email Address", name: "email", type: "email", icon: Mail, placeholder: "lab@example.com" })}
                    {renderField({ label: "Website", name: "web", icon: Globe, placeholder: "https://www.labwebsite.com" })}
                  </div>
                  <div className="border-t pt-5 mt-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Credentials (Optional)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {renderField({ label: "Password", name: "password", type: "password", icon: Lock, placeholder: "Create password" })}
                      {renderField({ label: "Confirm Password", name: "confirmPassword", type: "password", icon: Lock, placeholder: "Confirm password" })}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'address' && (
                <div className="space-y-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Address Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {renderField({ label: "Country", name: "address.country", type: "select", options: ['United States', 'United Kingdom', 'Canada', 'Australia', 'India', 'Germany', 'France'], placeholder: "Select Country" })}
                    {renderField({ label: "State", name: "address.state", placeholder: "State" })}
                    {renderField({ label: "District", name: "address.district", placeholder: "District" })}
                    {renderField({ label: "Place / Area", name: "address.place", icon: MapPin, placeholder: "Street, area, locality", required: true })}
                    {renderField({ label: "Pincode", name: "address.pincode", placeholder: "123456", required: true })}
                  </div>
                  <div className="border-t pt-5 mt-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">GPS Coordinates</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {renderField({ label: "Latitude", name: "latitude", type: "number", step: "any", icon: MapPinned, placeholder: "40.7128", required: true })}
                      {renderField({ label: "Longitude", name: "longitude", type: "number", step: "any", icon: MapPinned, placeholder: "-74.0060", required: true })}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Coordinates help display the laboratory location on maps</p>
                  </div>
                </div>
              )}

              {activeTab === 'hours' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Operating Hours</h3>
                  {formData.working_hours.map((session, index) => (
                    <div key={session.day} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg flex-wrap">
                      <div className="w-28 font-medium text-gray-700 text-sm">{session.day}</div>
                      <Checkbox 
                        label="Holiday" 
                        checked={session.is_holiday} 
                        onChange={(e) => handleWorkingHoursChange(index, 'is_holiday', e.target.checked)} 
                      />
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
              )}

              {activeTab === 'about' && (
                <div className="space-y-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Laboratory Information</h3>
                  <Textarea 
                    label="About the Laboratory" 
                    name="about" 
                    required 
                    rows={6} 
                    placeholder="Write a detailed description about the laboratory including types of tests offered, accreditations, equipment, sample collection services, home collection availability, and reporting time." 
                    value={formData.about} 
                    onChange={handleChange} 
                    onBlur={handleBlur} 
                    error={errors.about} 
                    touched={touched.about} 
                  />
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