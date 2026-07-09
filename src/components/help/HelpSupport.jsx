// src/components/HelpSupport/HelpSupport.jsx - FIXED ICON POSITIONING
import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  User,
  Send,
  MessageSquare,
  FileText,
} from 'lucide-react';
import { Button, Card } from '../ui';
import { showSuccessToast, showErrorToast, showWarningToast } from '../ui/Toast';
import { useCreateEnquiryMutation } from '../../../app/service/emailEnquiryApi';

// ✅ FormField component with fixed icon positioning for textarea
const FormField = React.memo(({ 
  name, 
  type = 'text', 
  icon: Icon, 
  placeholder, 
  value, 
  onChange, 
  onBlur, 
  error, 
  touched, 
  disabled,
  label
}) => {
  const isTextarea = name === 'message';
  const hasError = error && touched;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        {/* ✅ Icon positioned at top for textarea, center for input */}
        <Icon className={`absolute left-3 ${
          isTextarea ? 'top-3' : 'top-1/2 transform -translate-y-1/2'
        } h-4 w-4 text-gray-400 pointer-events-none z-10`} />
        
        {isTextarea ? (
          <textarea
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            rows={5}
            className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent resize-none transition ${
              hasError ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={disabled}
          />
        ) : (
          <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent transition ${
              hasError ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={disabled}
          />
        )}
      </div>
      {hasError && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
});

FormField.displayName = 'FormField';

const HelpSupport = () => {
  const navigate = useNavigate();
  const [createEnquiry, { isLoading: isSubmitting }] = useCreateEnquiryMutation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const FIELDS = ['name', 'email', 'subject', 'message'];
  const FIELD_LABELS = {
    name: 'Name',
    email: 'Email',
    subject: 'Subject',
    message: 'Message'
  };

  const validateField = useCallback((name, value) => {
    const trimmed = value.trim();
    
    switch (name) {
      case 'name':
        if (!trimmed) return 'Name is required';
        if (trimmed.length < 2) return 'Name must be at least 2 characters';
        return '';
      case 'email':
        if (!trimmed) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'Please enter a valid email address';
        return '';
      case 'subject':
        if (!trimmed) return 'Subject is required';
        if (trimmed.length < 3) return 'Subject must be at least 3 characters';
        return '';
      case 'message':
        if (!trimmed) return 'Message is required';
        if (trimmed.length < 10) return 'Message must be at least 10 characters';
        return '';
      default:
        return '';
    }
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    setTouched(prev => {
      if (prev[name]) {
        const error = validateField(name, value);
        setErrors(prevErrors => ({ ...prevErrors, [name]: error }));
      }
      return prev;
    });
  }, [validateField]);

  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  }, [validateField]);

  const validateForm = useCallback(() => {
    const newErrors = {};
    FIELDS.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, validateField]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    const allTouched = {};
    FIELDS.forEach(field => {
      allTouched[field] = true;
    });
    setTouched(allTouched);
    
    if (!validateForm()) {
      showWarningToast('Please fill in all required fields correctly');
      return;
    }

    try {
      const response = await createEnquiry(formData).unwrap();
      
      if (response.success) {
        showSuccessToast('Your message has been sent successfully!');
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: ''
        });
        setErrors({});
        setTouched({});
      } else {
        showErrorToast(response.message || 'Failed to send message');
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = error?.data?.message || 'Failed to send message. Please try again.';
      showErrorToast(errorMessage);
    }
  }, [formData, createEnquiry, validateForm]);

  const handleClear = useCallback(() => {
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: ''
    });
    setErrors({});
    setTouched({});
    showWarningToast('Form cleared');
  }, []);

  const fieldConfigs = useMemo(() => [
    { name: 'name', type: 'text', icon: User, placeholder: 'Enter your full name' },
    { name: 'email', type: 'email', icon: Mail, placeholder: 'Enter your email address' },
    { name: 'subject', type: 'text', icon: FileText, placeholder: 'Enter message subject' },
    { name: 'message', type: 'text', icon: MessageSquare, placeholder: 'Enter your message here...' },
  ], []);

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <button 
            onClick={() => navigate(-1)} 
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            type="button"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="text-xs text-gray-500">
            <span className="text-gray-700">Contact Us</span>
            <span className="mx-1 text-gray-400">»</span>
            <span>Home</span>
            <span className="mx-1 text-gray-400">»</span>
            <span>Contact Us</span>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-800">Contact Us</h1>
        <p className="text-sm text-gray-500 mt-1">Get in touch with our support team</p>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card>
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Send us a Message</h3>
            <p className="text-sm text-gray-500 mt-1">Fill out the form below and we'll get back to you as soon as possible</p>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {fieldConfigs.map(({ name, type, icon, placeholder }) => (
                <FormField
                  key={name}
                  name={name}
                  type={type}
                  icon={icon}
                  placeholder={placeholder}
                  label={FIELD_LABELS[name]}
                  value={formData[name]}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors[name]}
                  touched={touched[name]}
                  disabled={isSubmitting}
                />
              ))}

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClear}
                  disabled={isSubmitting}
                >
                  Clear
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                  loading={isSubmitting}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
                >
                  <Send size={16} />
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </Button>
              </div>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default HelpSupport;