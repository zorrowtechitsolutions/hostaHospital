// src/components/patients/EditPatient.jsx - With toast notifications
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  User, Mail, Phone, Calendar, MapPin, Lock, Image, 
  AlertCircle, ArrowLeft, Heart, Users, 
  FileText, Briefcase, Clock, Activity, AlertTriangle,
  Upload, X
} from 'lucide-react';
import { 
  Button, Input, Select, Textarea, Card, Alert, Loader 
} from '../ui';
import { showUpdateToast, showErrorToast, showWarningToast, showSuccessToast } from '../ui/Toast';

const EditPatient = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const patientFromState = location.state?.patient;
  
  const [formData, setFormData] = useState({
    profileImage: null,
    firstName: '', middleName: '', lastName: '', bloodGroup: '',
    age: '', dob: '', gender: '', maritalStatus: '', mobileNumber: '', emergencyNumber: '',
    guardianName: '', guardianRelation: '', addressLine1: '', addressLine2: '',
    country: '', city: '', state: '', pinCode: '', referredBy: '', referredOn: '',
    department: '', notes: '', height: '', weight: '', bloodPressure: '',
    allergies: '', chronicConditions: '', occupation: '', email: '',
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [originalPatientId, setOriginalPatientId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);

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

  useEffect(() => {
    if (patientFromState) {
      const nameParts = patientFromState.name?.split(' ') || ['', '', ''];
      setFormData({
        profileImage: null,
        firstName: patientFromState.firstName || nameParts[0] || '',
        middleName: patientFromState.middleName || nameParts.slice(1, -1).join(' ') || '',
        lastName: patientFromState.lastName || nameParts[nameParts.length - 1] || '',
        bloodGroup: patientFromState.bloodGroup || patientFromState.bloodType || '',
        age: patientFromState.age || '',
        dob: patientFromState.dob || '',
        gender: patientFromState.gender || '',
        maritalStatus: patientFromState.maritalStatus || '',
        mobileNumber: patientFromState.phone || patientFromState.mobileNumber || '',
        emergencyNumber: patientFromState.emergencyNumber || '',
        guardianName: patientFromState.guardianName || '',
        guardianRelation: patientFromState.guardianRelation || '',
        addressLine1: patientFromState.addressLine1 || patientFromState.address || '',
        addressLine2: patientFromState.addressLine2 || '',
        country: patientFromState.country || '',
        city: patientFromState.city || '',
        state: patientFromState.state || '',
        pinCode: patientFromState.pinCode || '',
        referredBy: patientFromState.referredBy || patientFromState.doctor || '',
        referredOn: patientFromState.referredOn || '',
        department: patientFromState.department || '',
        notes: patientFromState.notes || '',
        height: patientFromState.height || '',
        weight: patientFromState.weight || '',
        bloodPressure: patientFromState.bloodPressure || '',
        allergies: patientFromState.allergies || '',
        chronicConditions: patientFromState.chronicConditions || '',
        occupation: patientFromState.occupation || '',
        email: patientFromState.email || '',
      });
      setPreviewImage(patientFromState.imageUrl || null);
      setOriginalPatientId(patientFromState.id);
      setLoading(false);
    } else {
      navigate('/patients');
    }
  }, [patientFromState, navigate]);

  const validateField = (name, value) => {
    // Validation logic remains the same
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
      setPreviewImage(patientFromState?.imageUrl || null);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allFields = ['firstName', 'lastName', 'mobileNumber', 'age', 'dob', 'gender', 'bloodGroup', 'addressLine1'];
    const touchedFields = {};
    allFields.forEach(field => touchedFields[field] = true);
    setTouched(touchedFields);
    
    if (validateForm()) {
      setIsSubmitting(true);
      setTimeout(() => {
        try {
          const updatedPatient = {
            ...patientFromState,
            id: originalPatientId,
            firstName: formData.firstName,
            middleName: formData.middleName,
            lastName: formData.lastName,
            name: `${formData.firstName} ${formData.middleName ? formData.middleName + ' ' : ''}${formData.lastName}`,
            age: formData.age, dob: formData.dob, gender: formData.gender,
            bloodGroup: formData.bloodGroup, bloodType: formData.bloodGroup,
            maritalStatus: formData.maritalStatus, phone: formData.mobileNumber,
            mobileNumber: formData.mobileNumber, emergencyNumber: formData.emergencyNumber,
            guardianName: formData.guardianName, guardianRelation: formData.guardianRelation,
            address: `${formData.addressLine1} ${formData.addressLine2}`,
            addressLine1: formData.addressLine1, addressLine2: formData.addressLine2,
            city: formData.city, state: formData.state, country: formData.country,
            pinCode: formData.pinCode, referredBy: formData.referredBy, doctor: formData.referredBy,
            referredOn: formData.referredOn, department: formData.department, notes: formData.notes,
            height: formData.height, weight: formData.weight, bloodPressure: formData.bloodPressure,
            allergies: formData.allergies, chronicConditions: formData.chronicConditions,
            occupation: formData.occupation, email: formData.email,
            imageUrl: formData.profileImage || previewImage || patientFromState.imageUrl
          };
          
          const existingPatients = JSON.parse(localStorage.getItem('patients') || '[]');
          const updatedPatients = existingPatients.map(p => p.id === originalPatientId ? updatedPatient : p);
          localStorage.setItem('patients', JSON.stringify(updatedPatients));
          
          showUpdateToast(
            `${updatedPatient.name} has been updated successfully!`,
            4000,
            {
              'Patient': updatedPatient.name,
              'ID': originalPatientId,
              'Age': `${updatedPatient.age} years`,
              'Blood Group': updatedPatient.bloodGroup
            }
          );
          
          setIsSubmitting(false);
          
          setTimeout(() => {
            navigate('/patients');
          }, 1500);
        } catch (error) {
          showErrorToast('Failed to update patient. Please try again.', 3000);
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

  const handleGoBack = () => navigate('/patients');

  if (loading) return <Loader centered text="Loading patient data..." />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
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

        {/* Rest of the form JSX remains the same */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ... all the Card components remain unchanged ... */}
          
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={handleGoBack}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={isSubmitting} loading={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPatient;