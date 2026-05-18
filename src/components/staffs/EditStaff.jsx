// src/components/staffs/EditStaff.jsx - Connected to API with skeleton loading
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ChevronRight, Upload, X } from 'lucide-react';
import {
  Button,
  Input,
  Select,
  Card,
  Tabs,
  Alert,
  Switch
} from '../ui';
import {
  showUpdateToast,
  showDeleteToast,
  showSuccessToast,
  showErrorToast,
  showWarningToast
} from '../ui/Toast';
import {
  useGetStaffQuery,
  useUpdateStaffMutation,
  useDeleteStaffMutation
} from '../../../app/service/staffApi';

const EditStaff = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('basic');
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewImage, setPreviewImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // API hooks
  const {
    data: staffData,
    isLoading: loading,
    refetch
  } = useGetStaffQuery(
    { id },
    { skip: !id }
  );
  const [updateStaff, { isLoading: isUpdateLoading }] = useUpdateStaffMutation();
  const [deleteStaff, { isLoading: isDeleteLoading }] = useDeleteStaffMutation();

  const [formData, setFormData] = useState({
    id: '',
    originalId: '',
    name: '',
    gender: 'Male',
    dob: '',
    mobile: '',
    email: '',
    designation: '',
    appointmentDate: '',
    staffType: 'Permanent',
    jobType: 'Full Time',
    knowLanguages: [],
    qualification: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    country: '',
    place: '',
    pincode: '',
    status: true,
    profileImage: null,
  });

  // Helper function to remove undefined values from an object
  const removeUndefined = obj => {
    Object.keys(obj).forEach(key => {
      if (obj[key] === undefined) {
        delete obj[key];
      }
    });
    return obj;
  };

  // Image validation helper
  const validateImage = file => {
    if (file.size > 5 * 1024 * 1024) {
      return 'File size must be less than 5MB';
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return 'Only JPEG, PNG, GIF, and WEBP files are allowed';
    }

    return '';
  };

  // Mock S3 upload function
  const uploadToS3 = async (file) => {
    return new Promise((resolve, reject) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        if (progress === 100) {
          clearInterval(interval);
          const mockS3Url = `https://your-bucket.s3.amazonaws.com/staff-images/${Date.now()}-${file.name}`;
          resolve(mockS3Url);
        }
      }, 200);
    });
  };

  // Populate form data from API response
  useEffect(() => {
    if (staffData?.data) {
      const staff = staffData.data;
      populateFormData(staff);
    } else if (location.state?.staff) {
      populateFormData(location.state.staff);
    }
  }, [staffData, location]);

  const populateFormData = (staff) => {
    const address = staff.address || {};
    const place = address.place || '';
    const addressParts = place?.split(' ') || [];
    
    setFormData({
      id: staff.id || staff._id || '',
      originalId: staff.id || staff._id || '',
      name: staff.name || '',
      gender: staff.gender ? staff.gender.charAt(0).toUpperCase() + staff.gender.slice(1) : 'Male',
      dob: staff.dob ? staff.dob.split('T')[0] : '',
      mobile: staff.phone || '',
      email: staff.email || '',
      designation: staff.designation || '',
      appointmentDate: staff.joiningDate ? staff.joiningDate.split('T')[0] : '',
      staffType: staff.staffType || 'Permanent',
      jobType: staff.jobType || 'Full Time',
      knowLanguages: staff.knowLanguages || [],
      qualification: staff.qualification || '',
      addressLine1: addressParts[0] || '',
      addressLine2: addressParts.slice(1).join(' ') || '',
      city: address.district || '',
      state: address.state || '',
      country: address.country || '',
      place: address.place || '',
      pincode: address.pincode || '',
      status: staff.status === 'active',
      profileImage: staff.profileImage || null,
    });
    setPreviewImage(staff.profileImage || null);
  };

  // Image upload handler
  const handleImageUpload = async (file) => {
    if (!file) return false;
    
    const imageError = validateImage(file);
    if (imageError) {
      setErrors(prev => ({ ...prev, profileImage: imageError }));
      showWarningToast(imageError, 3000);
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
      setErrors(prev => ({ ...prev, profileImage: 'Failed to upload image. Please try again.' }));
      showErrorToast('Failed to upload image. Please try again.', 3000);
      if (formData.profileImage) {
        setPreviewImage(formData.profileImage);
      } else {
        setPreviewImage(null);
      }
      return false;
    }
  };

  const handleFileSelect = e => {
    const file = e.target.files[0];
    if (file) handleImageUpload(file);
  };

  const removeImage = () => {
    setPreviewImage(null);
    setUploadProgress(0);
    setFormData(prev => ({
      ...prev,
      profileImage: null
    }));
    setErrors(prev => ({
      ...prev,
      profileImage: ''
    }));
    showSuccessToast('Image removed', 2000);
  };

  const validateName = (name) => {
    if (!name || name.trim() === '') return 'Full name is required';
    if (name.length < 2) return 'Name must be at least 2 characters';
    if (name.length > 50) return 'Name must be less than 50 characters';
    return '';
  };

  const validateMobile = (mobile) => {
    if (!mobile || mobile.trim() === '') return 'Mobile number is required';
    const mobileRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{3,5}[-\s\.]?[0-9]{4,6}$/;
    if (!mobileRegex.test(mobile)) return 'Please enter a valid mobile number';
    return '';
  };

  const validateEmail = (email) => {
    if (!email || email.trim() === '') return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return '';
  };

  const validateDesignation = (designation) => {
    if (!designation) return 'Designation is required';
    return '';
  };

  const validateDob = (dob) => {
    if (dob) {
      const today = new Date();
      const birthDate = new Date(dob);
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
      if (age < 18 && age > 0) return 'Staff must be at least 18 years old';
      if (age > 70) return 'Age cannot exceed 70 years';
    }
    return '';
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'name': return validateName(value);
      case 'mobile': return validateMobile(value);
      case 'email': return validateEmail(value);
      case 'designation': return validateDesignation(value);
      case 'dob': return validateDob(value);
      default: return '';
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (submitError) setSubmitError('');
  };

  const handleStatusToggle = () => {
    setFormData(prev => ({
      ...prev,
      status: !prev.status
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = ['name', 'mobile', 'email', 'designation'];
    requiredFields.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });
    const dobError = validateDob(formData.dob);
    if (dobError) newErrors.dob = dobError;
    setErrors(newErrors);
    Object.keys(formData).forEach(key => setTouched(prev => ({ ...prev, [key]: true })));
    return Object.keys(newErrors).length === 0;
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteStaff(formData.id).unwrap();
      showDeleteToast(
        `${formData.name} has been deleted successfully!`,
        4000,
        {
          'Name': formData.name,
          'ID': formData.id,
          'Designation': formData.designation
        }
      );
      setIsDeleting(false);
      setSubmitSuccess(true);
      setTimeout(() => navigate('/staffs'), 1500);
    } catch (error) {
      showErrorToast(error?.data?.message || 'Failed to delete staff member', 3000);
      setIsDeleting(false);
      setDeleteConfirm(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      if (errors.name || errors.mobile || errors.email || errors.designation || errors.dob) setActiveTab('basic');
      showWarningToast('Please fix the validation errors before submitting', 3000);
      return;
    }

    setIsSubmitting(true);

    try {
      const combinedPlace = `${formData.addressLine1} ${formData.addressLine2}`.trim();
      
      const updateData = {
        name: formData.name,
        email: formData.email,
        phone: formData.mobile,
        designation: formData.designation,
        joiningDate: formData.appointmentDate || undefined,
        jobType: formData.jobType || undefined,
        staffType: formData.staffType || undefined,
        dob: formData.dob || undefined,
        gender: formData.gender.toLowerCase(),
        knowLanguages: formData.knowLanguages,
        qualification: formData.qualification || undefined,
        address: {
          country: formData.country || undefined,
          state: formData.state || undefined,
          district: formData.city || undefined,
          place: combinedPlace || formData.place || undefined,
          pincode: formData.pincode ? Number(formData.pincode) : undefined
        },
        status: formData.status ? 'active' : 'inactive',
        profileImage: formData.profileImage
      };

      removeUndefined(updateData);
      if (updateData.address) {
        removeUndefined(updateData.address);
      }

      await updateStaff({
        id: formData.id,
        data: updateData
      }).unwrap();

      await refetch();
      
      showUpdateToast(
        `${formData.name}'s information has been updated successfully!`,
        4000,
        {
          'Name': formData.name,
          'ID': formData.id,
          'Designation': formData.designation,
          'Status': formData.status ? 'Active' : 'Inactive'
        }
      );
      
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setTimeout(() => navigate('/staffs'), 1500);
    } catch (error) {
      showErrorToast(error?.data?.message || 'Failed to update staff member', 3000);
      setIsSubmitting(false);
      setSubmitError(error?.data?.message || 'Failed to update staff');
    }
  };

  const designations = ['Compounder', 'Nurse', 'Purchase Officer', 'Supervisor', 'Receptionist', 'Lab Assistant', 'Pharmacist', 'Doctor', 'Technician', 'Admin'];
  const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'Austin'];
  const states = ['California', 'Texas', 'New York', 'Florida', 'Illinois', 'Pennsylvania', 'Ohio', 'Georgia', 'North Carolina', 'Michigan'];
  const countries = ['United States', 'Canada', 'United Kingdom', 'Australia', 'India', 'Germany', 'France', 'Japan', 'Brazil', 'Mexico'];

  const tabs = [{ id: 'basic', label: 'Basic Info' }];

  const isFormSubmitting = isSubmitting || isUpdateLoading;

  // Skeleton Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50" style={{ background: '#f4f6f9' }}>
        <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
          <div className="h-7 w-48 bg-gray-200 rounded animate-pulse mb-1"></div>
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
        </div>

        <div className="p-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="border-b border-gray-200 px-6 pt-4">
              <div className="flex gap-6">
                <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>

            <div className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-6 pb-6 border-b border-gray-200">
                <div className="w-24 h-24 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-10 w-40 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 w-48 bg-gray-200 rounded animate-pulse mt-2"></div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
                </div>
                {[...Array(14)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{ background: '#f4f6f9', fontFamily: "'Segoe UI', sans-serif" }}>
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Edit Staff</h1>
        <div className="text-sm text-gray-500 flex items-center gap-2">
          <span>Home</span><ChevronRight size={14} /><span className="text-gray-700 font-medium">Staffs</span><ChevronRight size={14} /><span className="text-gray-700 font-medium">Edit Staff</span>
        </div>
      </div>

      {submitSuccess && <Alert type="success" message="Staff updated successfully! Redirecting..." className="fixed top-20 right-6 z-50 w-auto animate-pulse" />}
      {submitError && <Alert type="error" message={submitError} className="fixed top-20 right-6 z-50 w-auto" />}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Delete</h3>
            <p className="text-gray-600 mb-4">Are you sure you want to delete <span className="font-semibold">{formData.name}</span>? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteConfirm(false)} disabled={isDeleting || isDeleteLoading}>Cancel</Button>
              <Button variant="danger" onClick={handleDelete} disabled={isDeleting || isDeleteLoading} loading={isDeleting || isDeleteLoading}>
                {isDeleting || isDeleteLoading ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="p-6">
        <Card>
          <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

          {activeTab === 'basic' && (
            <div className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center border-2 border-gray-200 overflow-hidden shadow-sm">
                      {previewImage ? (
                        <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <span className="text-gray-400 text-2xl font-medium">
                            {formData.name ? formData.name.charAt(0).toUpperCase() : '?'}
                          </span>
                        </div>
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
                      disabled={isFormSubmitting}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Staff ID</label>
                  <input type="text" value={formData.id} disabled className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50" />
                </div>
                <Input label="Full Name" name="name" value={formData.name} onChange={handleChange} onBlur={handleBlur} error={errors.name} touched={touched.name} required placeholder="Enter full name" />
                <Select label="Gender" name="gender" options={['Male', 'Female', 'Other']} value={formData.gender} onChange={handleChange} onBlur={handleBlur} error={errors.gender} touched={touched.gender} />
                <Input label="Date of Birth" name="dob" type="date" value={formData.dob} onChange={handleChange} onBlur={handleBlur} error={errors.dob} touched={touched.dob} />
                <Input label="Mobile Number" name="mobile" type="tel" value={formData.mobile} onChange={handleChange} onBlur={handleBlur} error={errors.mobile} touched={touched.mobile} required placeholder="+1 00000 00000" />
                <Input label="Email" name="email" type="email" value={formData.email} onChange={handleChange} onBlur={handleBlur} error={errors.email} touched={touched.email} required placeholder="staff@example.com" />
                <Select label="Designation" name="designation" options={designations} value={formData.designation} onChange={handleChange} onBlur={handleBlur} error={errors.designation} touched={touched.designation} required />
                <Input label="Joining Date" name="appointmentDate" type="date" value={formData.appointmentDate} onChange={handleChange} onBlur={handleBlur} error={errors.appointmentDate} touched={touched.appointmentDate} />
                <Input label="Qualification" name="qualification" value={formData.qualification} onChange={handleChange} placeholder="MBA, B.Tech, etc." />
                <Select label="Staff Type" name="staffType" options={['Permanent', 'Contract', 'Temporary', 'Intern']} value={formData.staffType} onChange={handleChange} onBlur={handleBlur} error={errors.staffType} touched={touched.staffType} />
                <Select label="Job Type" name="jobType" options={['Full Time', 'Part Time', 'Remote', 'Hybrid']} value={formData.jobType} onChange={handleChange} onBlur={handleBlur} error={errors.jobType} touched={touched.jobType} />
                <div className="md:col-span-2"><Input label="Address Line 1" name="addressLine1" value={formData.addressLine1} onChange={handleChange} placeholder="Street address" /></div>
                <div className="md:col-span-2"><Input label="Address Line 2" name="addressLine2" value={formData.addressLine2} onChange={handleChange} placeholder="Apt, suite, unit (optional)" /></div>
                <Select label="City/District" name="city" options={cities} value={formData.city} onChange={handleChange} onBlur={handleBlur} error={errors.city} touched={touched.city} />
                <Select label="State" name="state" options={states} value={formData.state} onChange={handleChange} onBlur={handleBlur} error={errors.state} touched={touched.state} />
                <Select label="Country" name="country" options={countries} value={formData.country} onChange={handleChange} onBlur={handleBlur} error={errors.country} touched={touched.country} />
                <Input label="Pincode" name="pincode" value={formData.pincode} onChange={handleChange} onBlur={handleBlur} error={errors.pincode} touched={touched.pincode} placeholder="Postal code" maxLength={6} />
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-3">Status</label>
                <div className="flex items-center">
                  <Switch checked={formData.status} onChange={handleStatusToggle} />
                  <span className="ml-3 text-sm text-gray-600">{formData.status ? 'Active' : 'Inactive'}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Toggle to activate or deactivate this staff member</p>
              </div>
            </div>
          )}

          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end gap-3">
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate('/staffs')}>Cancel</Button>
              <Button variant="primary" onClick={handleSubmit} disabled={isFormSubmitting} loading={isFormSubmitting}>
                {isFormSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default EditStaff;