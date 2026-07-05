// src/components/HelpSupport/HelpSupport.jsx
import React, { useState } from 'react';
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

  const validateField = (name, value) => {
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

  const validateForm = () => {
    const newErrors = {};
    FIELDS.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
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
  };

  const handleClear = () => {
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: ''
    });
    setErrors({});
    setTouched({});
    showWarningToast('Form cleared');
  };

  const FormField = ({ name, type = 'text', icon: Icon, placeholder }) => {
    const isTextarea = name === 'message';
    const error = errors[name];
    const touchedField = touched[name];
    const value = formData[name];

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {FIELD_LABELS[name]} <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          {isTextarea ? (
            <textarea
              name={name}
              value={value}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder={placeholder}
              rows={5}
              className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent resize-none transition ${
                error && touchedField ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isSubmitting}
            />
          ) : (
            <input
              type={type}
              name={name}
              value={value}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder={placeholder}
              className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent transition ${
                error && touchedField ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isSubmitting}
            />
          )}
        </div>
        {error && touchedField && (
          <p className="text-xs text-red-500 mt-1">{error}</p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-200 rounded transition-colors">
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
              <FormField
                name="name"
                icon={User}
                placeholder="Enter your full name"
              />

              <FormField
                name="email"
                type="email"
                icon={Mail}
                placeholder="Enter your email address"
              />

              <FormField
                name="subject"
                icon={FileText}
                placeholder="Enter message subject"
              />

              <FormField
                name="message"
                icon={MessageSquare}
                placeholder="Enter your message here..."
              />

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