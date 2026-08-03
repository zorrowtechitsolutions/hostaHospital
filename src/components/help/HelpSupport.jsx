// src/components/HelpSupport/HelpSupport.jsx
import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  User,
  Send,
  MessageSquare,
  FileText,
  HelpCircle,
  Phone,
  Clock,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Stethoscope,
  Shield,
  Heart,
} from 'lucide-react';
import { Button, Card } from '../ui';
import { showSuccessToast, showErrorToast, showWarningToast } from '../ui/Toast';
import { useCreateEnquiryMutation } from '../../../app/service/emailEnquiryApi';

// ✅ FormField component with proper icon positioning
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
  label,
  required = true,
  rows = 4,
}) => {
  const isTextarea = name === 'message' || type === 'textarea';
  const hasError = error && touched;

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className={`absolute left-3 ${
            isTextarea ? 'top-3' : 'top-1/2 transform -translate-y-1/2'
          } h-4 w-4 text-emerald-500 pointer-events-none z-10`} />
        )}
        
        {isTextarea ? (
          <textarea
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            rows={rows}
            className={`w-full pl-10 pr-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-y transition duration-150 ${
              hasError ? 'border-red-400' : 'border-gray-300'
            } ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`}
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
            className={`w-full pl-10 pr-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition duration-150 ${
              hasError ? 'border-red-400' : 'border-gray-300'
            } ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`}
            disabled={disabled}
          />
        )}
      </div>
      {hasError && (
        <p className="flex items-center gap-1 text-xs text-red-500 mt-1.5">
          <AlertCircle size={12} />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
});

FormField.displayName = 'FormField';

// ✅ FAQ Accordion Component
const FAQItem = React.memo(({ question, answer, isOpen, onToggle }) => {
  return (
    <div className="border-b border-emerald-100 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-4 px-2 hover:bg-emerald-50 transition-colors rounded-lg group"
      >
        <span className="text-left text-sm font-medium text-gray-800 group-hover:text-emerald-600 transition-colors">
          {question}
        </span>
        <ChevronRight 
          className={`h-5 w-5 text-emerald-400 transition-transform duration-200 flex-shrink-0 ml-4 ${
            isOpen ? 'rotate-90' : ''
          }`}
        />
      </button>
      {isOpen && (
        <div className="px-2 pb-4 text-sm text-gray-600 leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
});

FAQItem.displayName = 'FAQItem';

// ✅ Support Option Card Component
const SupportOption = React.memo(({ icon: Icon, title, description, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="flex items-start gap-4 p-4 border border-emerald-200 rounded-lg hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group bg-white"
    >
      <div className="flex-shrink-0 p-2.5 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors">
        <Icon className="h-5 w-5 text-emerald-600" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-emerald-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
    </div>
  );
});

SupportOption.displayName = 'SupportOption';

const HelpSupport = () => {
  const navigate = useNavigate();
  const [createEnquiry, { isLoading: isSubmitting }] = useCreateEnquiryMutation();
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  // FAQ State
  const [openFAQ, setOpenFAQ] = useState(null);

  // Constants
  const FIELDS = ['name', 'email', 'subject', 'message'];
  const FIELD_LABELS = {
    name: 'Full Name',
    email: 'Email Address',
    subject: 'Subject',
    message: 'Message'
  };

  // FAQ Data
  const faqs = [
    {
      id: 1,
      question: "How do I reset my password?",
      answer: "You can reset your password by clicking on the 'Forgot Password' link on the login page. You'll receive an email with instructions to create a new password."
    },
    {
      id: 2,
      question: "How can I update my profile information?",
      answer: "Navigate to your profile settings from the dashboard. You can update your personal information, contact details, and preferences there."
    },
    {
      id: 3,
      question: "What should I do if I encounter a technical issue?",
      answer: "First, try refreshing your browser or clearing your cache. If the issue persists, use this contact form to reach out to our support team with details about the problem."
    },
    {
      id: 4,
      question: "How long does it take to get a response?",
      answer: "Our support team typically responds within 24-48 hours during business days. For urgent matters, please call our support hotline."
    }
  ];

  // Validation Functions
  const validateField = useCallback((name, value) => {
    const trimmed = value?.trim() || '';
    
    switch (name) {
      case 'name':
        if (!trimmed) return 'Name is required';
        if (trimmed.length < 2) return 'Name must be at least 2 characters';
        if (trimmed.length > 50) return 'Name must not exceed 50 characters';
        return '';
      case 'email':
        if (!trimmed) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
          return 'Please enter a valid email address';
        }
        return '';
      case 'subject':
        if (!trimmed) return 'Subject is required';
        if (trimmed.length < 3) return 'Subject must be at least 3 characters';
        if (trimmed.length > 100) return 'Subject must not exceed 100 characters';
        return '';
      case 'message':
        if (!trimmed) return 'Message is required';
        if (trimmed.length < 10) return 'Please provide more detail (minimum 10 characters)';
        if (trimmed.length > 500) return 'Message must not exceed 500 characters';
        return '';
      default:
        return '';
    }
  }, []);

  // Form Handlers
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  }, [touched, validateField]);

  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  }, [validateField]);

  const validateForm = useCallback(() => {
    const newErrors = {};
    let isValid = true;
    
    FIELDS.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });
    
    setErrors(newErrors);
    return isValid;
  }, [formData, validateField]);

  // Submit Handler
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    // Mark all fields as touched
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

  // Clear Form
  const handleClear = useCallback(() => {
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: ''
    });
    setErrors({});
    setTouched({});
    showWarningToast('Form has been cleared');
  }, []);

  // Toggle FAQ
  const toggleFAQ = useCallback((id) => {
    setOpenFAQ(prev => prev === id ? null : id);
  }, []);

  // Field Configurations
  const fieldConfigs = useMemo(() => [
    { name: 'name', type: 'text', icon: User, placeholder: 'Enter your full name' },
    { name: 'email', type: 'email', icon: Mail, placeholder: 'Enter your email address' },
    { name: 'subject', type: 'text', icon: FileText, placeholder: 'Enter message subject' },
    { name: 'message', type: 'textarea', icon: MessageSquare, placeholder: 'Describe your issue in detail...' },
  ], []);

  // Quick Support Options
  const supportOptions = [
    {
      id: 'email',
      icon: Mail,
      title: 'Email Support',
      description: 'We\'ll respond within 24-48 hours',
      onClick: () => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })
    },
    {
      id: 'phone',
      icon: Phone,
      title: 'Phone Support',
      description: 'Available Mon-Fri, 9AM-6PM',
      onClick: () => window.location.href = 'tel:+919567900329'
    },
    {
      id: 'faq',
      icon: HelpCircle,
      title: 'FAQ Section',
      description: 'Quick answers to common questions',
      onClick: () => document.getElementById('faq-section')?.scrollIntoView({ behavior: 'smooth' })
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* ✅ Header Section */}
        <div className="mb-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-600 mb-4" aria-label="Breadcrumb">
            <button 
              onClick={() => navigate(-1)} 
              className="hover:text-emerald-600 transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
            <span className="text-gray-400">/</span>
            <span className="text-emerald-700 font-medium">Help & Support</span>
          </nav>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-green-900 flex items-center gap-3">
                <div className="bg-emerald-100 p-2 rounded-full">
                  <Stethoscope className="h-8 w-8 text-emerald-600" />
                </div>
                Help & Support
              </h1>
              <p className="text-emerald-700 mt-1 text-sm">
                We're here to help you with any questions or issues
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-emerald-50 px-4 py-2 rounded-lg shadow-sm border border-emerald-200">
              <Clock className="h-4 w-4 text-emerald-600" />
              <span>Response time: <span className="font-medium text-emerald-700">24/7 Support</span></span>
            </div>
          </div>
        </div>

        {/* ✅ Quick Support Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {supportOptions.map((option) => (
            <SupportOption
              key={option.id}
              icon={option.icon}
              title={option.title}
              description={option.description}
              onClick={option.onClick}
            />
          ))}
        </div>

        {/* ✅ Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Form - Takes 2/3 on large screens */}
          <div className="lg:col-span-2" id="contact-form">
            <Card className="shadow-lg border border-emerald-200 hover:shadow-xl transition-shadow duration-300 bg-white">
              <div className="p-6 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-white">
                <h3 className="text-lg font-semibold text-green-900 flex items-center gap-2">
                  <Mail className="h-5 w-5 text-emerald-600" />
                  Send us a Message
                </h3>
                <p className="text-sm text-emerald-700 mt-1">
                  Fill out the form below and our support team will get back to you
                </p>
              </div>

              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-2">
                  {fieldConfigs.map(({ name, type, icon, placeholder, rows }) => (
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
                      rows={rows}
                      required={true}
                    />
                  ))}

                  <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClear}
                      disabled={isSubmitting}
                      className="w-full sm:w-auto border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400"
                    >
                      Clear Form
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={isSubmitting}
                      loading={isSubmitting}
                      className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 px-6"
                    >
                      <Send size={16} />
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </Button>
                  </div>
                </form>
              </div>
            </Card>
          </div>

          {/* ✅ Sidebar - Contact Info & Status */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="shadow-lg border border-emerald-200 bg-white">
              <div className="p-6">
                <h4 className="font-semibold text-green-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  Support Status
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Email Support</span>
                    <span className="flex items-center gap-1.5 text-emerald-600">
                      <span className="h-2 w-2 bg-emerald-500 rounded-full"></span>
                      Online
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Phone Support</span>
                    <span className="flex items-center gap-1.5 text-emerald-600">
                      <span className="h-2 w-2 bg-emerald-500 rounded-full"></span>
                      Available
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Avg. Response</span>
                    <span className="text-emerald-700 font-medium">24/7 Support</span>
                  </div>
                </div>

                <hr className="my-4 border-emerald-100" />

                <div className="space-y-3">
                  <h5 className="text-sm font-medium text-gray-700">Contact Information</h5>
                  <div className="space-y-2 text-sm">
                    <p className="flex items-center gap-2 text-gray-600">
                      <Mail className="h-4 w-4 text-emerald-600" />
                      <a href="mailto:support@hosta.com" className="hover:text-emerald-600 transition-colors">
                        support@hosta.com
                      </a>
                    </p>
                    <p className="flex items-center gap-2 text-gray-600">
                      <Phone className="h-4 w-4 text-emerald-600" />
                      <a href="tel:+919567900329" className="hover:text-emerald-600 transition-colors">
                        +91 95679 00329
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="shadow-lg border border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="h-5 w-5 text-emerald-600" />
                  <h4 className="font-semibold text-green-900">Need Urgent Help?</h4>
                </div>
                <p className="text-sm text-emerald-700 mb-3">
                  For urgent issues, please call our support hotline.
                </p>
                <Button
                  variant="primary"
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 shadow-md hover:shadow-lg transition-all"
                  onClick={() => window.location.href = 'tel:+919567900329'}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call Now
                </Button>
              </div>
            </Card>

            {/* Trust Badge */}
            <Card className="shadow-lg border border-emerald-200 bg-white">
              <div className="p-4 text-center">
                <Shield className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-xs text-gray-600">
                  Your information is secure and protected
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* ✅ FAQ Section */}
        <div id="faq-section" className="mt-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-emerald-100 p-2 rounded-full">
              <HelpCircle className="h-6 w-6 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-900">Frequently Asked Questions</h2>
          </div>
          
          <Card className="shadow-lg border border-emerald-200 bg-white">
            <div className="p-2">
              {faqs.map((faq) => (
                <FAQItem
                  key={faq.id}
                  question={faq.question}
                  answer={faq.answer}
                  isOpen={openFAQ === faq.id}
                  onToggle={() => toggleFAQ(faq.id)}
                />
              ))}
            </div>
          </Card>
        </div>

        {/* ✅ Footer Note */}
        <div className="mt-8 text-center text-sm text-gray-600 border-t border-emerald-100 pt-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Heart className="h-4 w-4 text-emerald-600" />
            <span className="text-emerald-700">Our support team is available 24/7 to assist you</span>
          </div>
          <p className="text-emerald-600">We aim to respond to all inquiries within 24-48 hours</p>
        </div>
      </div>
    </div>
  );
};

export default HelpSupport;