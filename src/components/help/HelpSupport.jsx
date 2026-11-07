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

/* ------------------------------------------------------------------ */
/*  FormField                                                          */
/* ------------------------------------------------------------------ */
const FormField = React.memo(
  ({
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
    const isTextarea = type === 'textarea';
    const hasError = error && touched;

    return (
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>

        <div className="relative">
          {Icon && (
            <Icon
              className={`pointer-events-none absolute left-3 h-4 w-4 text-gray-400 ${
                isTextarea ? 'top-3' : 'top-1/2 -translate-y-1/2'
              }`}
            />
          )}

          {isTextarea ? (
            <textarea
              name={name}
              value={value}
              onChange={onChange}
              onBlur={onBlur}
              placeholder={placeholder}
              rows={rows}
              disabled={disabled}
              className={`block w-full rounded-lg border bg-white py-2.5 pl-10 pr-3 text-sm placeholder-gray-400 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 ${
                hasError ? 'border-red-400' : 'border-gray-300'
              } ${disabled ? 'cursor-not-allowed bg-gray-50' : ''}`}
            />
          ) : (
            <input
              type={type}
              name={name}
              value={value}
              onChange={onChange}
              onBlur={onBlur}
              placeholder={placeholder}
              disabled={disabled}
              className={`block w-full rounded-lg border bg-white py-2.5 pl-10 pr-3 text-sm placeholder-gray-400 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 ${
                hasError ? 'border-red-400' : 'border-gray-300'
              } ${disabled ? 'cursor-not-allowed bg-gray-50' : ''}`}
            />
          )}
        </div>

        {hasError && (
          <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
            <AlertCircle size={12} />
            <span>{error}</span>
          </p>
        )}
      </div>
    );
  }
);
FormField.displayName = 'FormField';

/* ------------------------------------------------------------------ */
/*  FAQItem                                                            */
/* ------------------------------------------------------------------ */
const FAQItem = React.memo(({ question, answer, isOpen, onToggle }) => (
  <div className="border-b border-gray-200 last:border-b-0">
    <button
      onClick={onToggle}
      className="flex w-full items-center justify-between px-4 py-4 text-left transition-colors hover:bg-gray-50"
    >
      <span className="text-sm font-medium text-gray-800">{question}</span>
      <ChevronRight
        className={`ml-4 h-5 w-5 flex-shrink-0 text-gray-400 transition-transform duration-200 ${
          isOpen ? 'rotate-90' : ''
        }`}
      />
    </button>
    {isOpen && (
      <div className="px-4 pb-4 text-sm leading-relaxed text-gray-600">
        {answer}
      </div>
    )}
  </div>
));
FAQItem.displayName = 'FAQItem';

/* ------------------------------------------------------------------ */
/*  SupportOption                                                      */
/* ------------------------------------------------------------------ */
const SupportOption = React.memo(
  ({ icon: Icon, title, description, onClick }) => (
    <button
      onClick={onClick}
      className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-5 text-left transition-all hover:border-emerald-300 hover:shadow-md"
    >
      <div className="flex-shrink-0 rounded-lg bg-emerald-50 p-2.5">
        <Icon className="h-5 w-5 text-emerald-600" />
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
        <p className="mt-0.5 text-xs text-gray-500">{description}</p>
      </div>
      <ChevronRight className="mt-1 h-4 w-4 flex-shrink-0 text-gray-300" />
    </button>
  )
);
SupportOption.displayName = 'SupportOption';

/* ------------------------------------------------------------------ */
/*  HelpSupport                                                        */
/* ------------------------------------------------------------------ */
const HelpSupport = () => {
  const navigate = useNavigate();
  const [createEnquiry, { isLoading: isSubmitting }] = useCreateEnquiryMutation();

  /* ----------------------------- state ---------------------------- */
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [openFAQ, setOpenFAQ] = useState(null);

  /* --------------------------- constants -------------------------- */
  const FIELDS = ['name', 'email', 'subject', 'message'];
  const FIELD_LABELS = {
    name: 'Full Name',
    email: 'Email Address',
    subject: 'Subject',
    message: 'Message',
  };

  const faqs = [
    {
      id: 1,
      question: 'How do I reset my password?',
      answer:
        "You can reset your password by clicking on the 'Forgot Password' link on the login page. You'll receive an email with instructions to create a new password.",
    },
    {
      id: 2,
      question: 'How can I update my profile information?',
      answer:
        'Navigate to your profile settings from the dashboard. You can update your personal information, contact details, and preferences there.',
    },
    {
      id: 3,
      question: 'What should I do if I encounter a technical issue?',
      answer:
        'First, try refreshing your browser or clearing your cache. If the issue persists, use this contact form to reach out to our support team with details about the problem.',
    },
    {
      id: 4,
      question: 'How long does it take to get a response?',
      answer:
        'Our support team typically responds within 24-48 hours during business days. For urgent matters, please call our support hotline.',
    },
  ];

  /* --------------------------- validation ------------------------- */
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
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed))
          return 'Please enter a valid email address';
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

  /* --------------------------- handlers --------------------------- */
  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (touched[name]) {
        const error = validateField(name, value);
        setErrors((prev) => ({ ...prev, [name]: error }));
      }
    },
    [touched, validateField]
  );

  const handleBlur = useCallback(
    (e) => {
      const { name, value } = e.target;
      setTouched((prev) => ({ ...prev, [name]: true }));
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    },
    [validateField]
  );

  const validateForm = useCallback(() => {
    const newErrors = {};
    let isValid = true;
    FIELDS.forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });
    setErrors(newErrors);
    return isValid;
  }, [formData, validateField]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const allTouched = {};
      FIELDS.forEach((field) => {
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
          setFormData({ name: '', email: '', subject: '', message: '' });
          setErrors({});
          setTouched({});
        } else {
          showErrorToast(response.message || 'Failed to send message');
        }
      } catch (error) {
        console.error('Error sending message:', error);
        const errorMessage =
          error?.data?.message || 'Failed to send message. Please try again.';
        showErrorToast(errorMessage);
      }
    },
    [formData, createEnquiry, validateForm]
  );

  const handleClear = useCallback(() => {
    setFormData({ name: '', email: '', subject: '', message: '' });
    setErrors({});
    setTouched({});
    showWarningToast('Form has been cleared');
  }, []);

  const toggleFAQ = useCallback((id) => {
    setOpenFAQ((prev) => (prev === id ? null : id));
  }, []);

  /* --------------------------- config ----------------------------- */
  const fieldConfigs = useMemo(
    () => [
      { name: 'name', type: 'text', icon: User, placeholder: 'Enter your full name' },
      { name: 'email', type: 'email', icon: Mail, placeholder: 'Enter your email address' },
      { name: 'subject', type: 'text', icon: FileText, placeholder: 'Enter message subject' },
      { name: 'message', type: 'textarea', icon: MessageSquare, placeholder: 'Describe your issue in detail...', rows: 5 },
    ],
    []
  );

  const supportOptions = [
    {
      id: 'email',
      icon: Mail,
      title: 'Email Support',
      description: "We'll respond within 24-48 hours",
      onClick: () =>
        document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' }),
    },
    {
      id: 'phone',
      icon: Phone,
      title: 'Phone Support',
      description: 'Available Mon-Fri, 9AM-6PM',
      onClick: () => (window.location.href = 'tel:+919567900329'),
    },
    {
      id: 'faq',
      icon: HelpCircle,
      title: 'FAQ Section',
      description: 'Quick answers to common questions',
      onClick: () =>
        document.getElementById('faq-section')?.scrollIntoView({ behavior: 'smooth' }),
    },
  ];

  /* ----------------------------- UI ------------------------------- */
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ====== Header ====== */}
        <div className="mb-8">
          {/* Breadcrumb */}
          <nav className="mb-4 flex items-center gap-2 text-sm text-gray-500" aria-label="Breadcrumb">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 transition-colors hover:text-emerald-600"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
            <span className="text-gray-300">/</span>
            <span className="font-medium text-gray-700">Help &amp; Support</span>
          </nav>

          {/* Title row */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white">
                  <Stethoscope className="h-6 w-6" />
                </span>
                Help &amp; Support
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                We&apos;re here to help you with any questions or issues.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
              <Clock className="h-4 w-4" />
              <span>
                Response time: <span className="font-semibold">24/7 Support</span>
              </span>
            </div>
          </div>
        </div>

        {/* ====== Quick support options ====== */}
        <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          {supportOptions.map((option) => (
            <SupportOption key={option.id} {...option} />
          ))}
        </div>

        {/* ====== Two-column layout ====== */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* ---- Contact form ---- */}
          <div className="lg:col-span-2" id="contact-form">
            <Card className="overflow-hidden border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
                  <Mail className="h-5 w-5 text-emerald-600" />
                  Send us a Message
                </h3>
                <p className="mt-0.5 text-sm text-gray-500">
                  Fill out the form below and our support team will get back to you.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 p-6">
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
                    required
                  />
                ))}

                <div className="flex flex-col justify-end gap-3 pt-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClear}
                    disabled={isSubmitting}
                    className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 sm:w-auto"
                  >
                    Clear Form
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting}
                    loading={isSubmitting}
                    className="flex w-full items-center justify-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700 sm:w-auto"
                  >
                    <Send size={16} />
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          {/* ---- Sidebar ---- */}
          <div className="space-y-4 lg:col-span-1">
            {/* Status */}
            <Card className="border border-gray-200 bg-white p-6 shadow-sm">
              <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
                Support Status
              </h4>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Email Support</span>
                  <span className="flex items-center gap-1.5 text-emerald-600">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Online
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Phone Support</span>
                  <span className="flex items-center gap-1.5 text-emerald-600">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Available
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Avg. Response</span>
                  <span className="font-medium text-gray-900">24/7 Support</span>
                </div>
              </div>

              <hr className="my-4 border-gray-100" />

              <h5 className="mb-2 text-sm font-medium text-gray-700">Contact Information</h5>
              <div className="space-y-2 text-sm">
                <a
                  href="mailto:support@hosta.com"
                  className="flex items-center gap-2 text-gray-600 transition-colors hover:text-emerald-600"
                >
                  <Mail className="h-4 w-4 text-emerald-600" />
                  hostahealthcare@gmail.com
                </a>
                <a
                  href="tel:+919567900329"
                  className="flex items-center gap-2 text-gray-600 transition-colors hover:text-emerald-600"
                >
                  <Phone className="h-4 w-4 text-emerald-600" />
                  +91 95679 00329
                </a>
              </div>
            </Card>

            {/* Urgent help */}
            <Card className="border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <Heart className="h-5 w-5 text-emerald-600" />
                <h4 className="text-sm font-semibold text-gray-900">Need Urgent Help?</h4>
              </div>
              <p className="mb-4 text-sm text-gray-500">
                For urgent issues, please call our support hotline.
              </p>
              <Button
                variant="primary"
                className="flex w-full items-center justify-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={() => (window.location.href = 'tel:+919567900329')}
              >
                <Phone className="h-4 w-4" />
                Call Now
              </Button>
            </Card>

            {/* Trust badge */}
            <Card className="border border-gray-200 bg-white p-4 text-center shadow-sm">
              <Shield className="mx-auto mb-2 h-8 w-8 text-emerald-600" />
              <p className="text-xs text-gray-500">
                Your information is secure and protected.
              </p>
            </Card>
          </div>
        </div>

        {/* ====== FAQ ====== */}
        <div id="faq-section" className="mt-12">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
              <HelpCircle className="h-5 w-5 text-emerald-600" />
            </span>
            <h2 className="text-2xl font-bold text-gray-900">Frequently Asked Questions</h2>
          </div>

          <Card className="overflow-hidden border border-gray-200 bg-white shadow-sm">
            {faqs.map((faq) => (
              <FAQItem
                key={faq.id}
                question={faq.question}
                answer={faq.answer}
                isOpen={openFAQ === faq.id}
                onToggle={() => toggleFAQ(faq.id)}
              />
            ))}
          </Card>
        </div>

        {/* ====== Footer note ====== */}
        <div className="mt-8 border-t border-gray-200 pt-6 text-center">
          <div className="mb-2 flex items-center justify-center gap-2 text-sm text-gray-600">
            <Heart className="h-4 w-4 text-emerald-600" />
            <span>Our support team is available 24/7 to assist you.</span>
          </div>
          <p className="text-sm text-gray-500">
            We aim to respond to all inquiries within 24-48 hours.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HelpSupport;