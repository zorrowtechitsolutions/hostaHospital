// src/components/leave/AddLeaveRequest.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Info,
  Check,
  Calendar as CalendarIcon,
  FileText,
  Send,
  BookOpen,
  AlertTriangle,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { Button } from '../ui';
import CustomSelect from '../ui/CustomSelect';
import { showSuccessToast, showErrorToast } from '../ui/Toast';

// ✅ API
import { useCreateLeaveRequestMutation } from '../../../app/service/leaverequest';
import {
  useGetLeaveTemplatesQuery,
  useGetPredefinedLeaveTemplatesQuery,
} from '../../../app/service/leaverequesttemplate';
import { getAuthUser } from '../../utils/auth';

// ============================================================
// CONSTANTS
// ============================================================
const LEAVE_TYPES = [
  { value: 'Casual', label: 'Casual Leave' },
  { value: 'Sick', label: 'Sick Leave' },
  { value: 'Annual', label: 'Annual Leave' },
  { value: 'Maternity', label: 'Maternity Leave' },
  { value: 'Emergency', label: 'Emergency Leave' },
];

// ✅ Fallback categories (used only if API returns none)
const FALLBACK_REASON_CATEGORIES = [
  'Family Event',
  'Medical',
  'Personal',
  'Vacation',
  'Emergency',
  'Other',
];

const MAX_REASON = 500;
const MAX_NOTES = 500;

// ============================================================
// HELPERS
// ============================================================
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const diffDays = (start, end) => {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s) || isNaN(e) || e < s) return 0;
  return Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const renderTemplate = (templateText, values) => {
  if (!templateText) return '';
  return templateText.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
    const v = values[key];
    return v !== undefined && v !== null && String(v).trim() !== ''
      ? String(v)
      : `[${key}]`;
  });
};

const normalizeList = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return [data];
};

const extractCategories = (templates) => {
  const set = new Set();
  templates.forEach((t) => {
    if (t?.reasonCategory) set.add(t.reasonCategory);
  });
  return [...set].sort();
};

// ============================================================
// SECTION WRAPPER
// ============================================================
const Section = ({ number, title, subtitle, children }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
    <div className="flex items-start gap-3 mb-4">
      <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
        {number}
      </div>
      <div>
        <h3 className="font-semibold text-gray-800">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    <div className="space-y-4">{children}</div>
  </div>
);

// ============================================================
// MAIN COMPONENT
// ============================================================
const AddLeaveRequest = () => {
  const navigate = useNavigate();
  const auth = getAuthUser();

  const [form, setForm] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    reasonCategory: '',
    reason: '',
    additionalDetails: '',
    handoverTo: '',
    handoverNotes: '',
    confirm: false,
    templateId: '',
    templateName: '',
  });

  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('predefined');
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const [createLeaveRequest, { isLoading: submitting }] = useCreateLeaveRequestMutation();

  // ============================================================
  // FETCH TEMPLATES
  // ============================================================
  const {
    data: predefinedRes,
    isLoading: loadingPredefined,
    isError: predefinedError,
  } = useGetPredefinedLeaveTemplatesQuery({});

  const {
    data: myRes,
    isLoading: loadingMy,
    isError: myError,
  } = useGetLeaveTemplatesQuery({});

  const predefinedTemplates = useMemo(
    () => normalizeList(predefinedRes?.data),
    [predefinedRes]
  );

  const myTemplates = useMemo(() => normalizeList(myRes?.data), [myRes]);

  // ============================================================
  // REASON CATEGORIES — SCOPED TO ACTIVE TAB ONLY
  // ============================================================
  const reasonCategories = useMemo(() => {
    const source = activeTab === 'predefined' ? predefinedTemplates : myTemplates;
    const fromApi = extractCategories(source);
    return fromApi.length > 0 ? fromApi : FALLBACK_REASON_CATEGORIES;
  }, [activeTab, predefinedTemplates, myTemplates]);

  // ============================================================
  // FILTER TEMPLATES BY SELECTED CATEGORY + ACTIVE TAB
  // ============================================================
  const currentTemplates = useMemo(() => {
    const source = activeTab === 'predefined' ? predefinedTemplates : myTemplates;
    if (!form.reasonCategory) return source;
    return source.filter((t) => t.reasonCategory === form.reasonCategory);
  }, [activeTab, predefinedTemplates, myTemplates, form.reasonCategory]);

  // ============================================================
  // OPTIONS FOR CustomSelect
  // ============================================================
  const reasonCategoryOptions = useMemo(
    () => reasonCategories.map((c) => ({ value: c, label: c })),
    [reasonCategories]
  );

  const templateOptions = useMemo(
    () => currentTemplates.map((t) => ({ value: String(t.id), label: t.templateName })),
    [currentTemplates]
  );

  // ============================================================
  // DERIVED
  // ============================================================
  const totalDays = useMemo(
    () => diffDays(form.startDate, form.endDate),
    [form.startDate, form.endDate]
  );

  const renderValues = useMemo(() => {
    const merged = {};
    if (form.startDate) merged.startDate = formatDate(form.startDate);
    if (form.endDate) merged.endDate = formatDate(form.endDate);
    if (form.handoverTo) {
      merged.handoverPerson = form.handoverTo;
      merged.handoverName = form.handoverTo;
      merged.handoverTo = form.handoverTo;
    }
    return merged;
  }, [form.startDate, form.endDate, form.handoverTo]);

  const autoGeneratedReason = useMemo(() => {
    if (!selectedTemplate?.templateText) return '';
    return renderTemplate(selectedTemplate.templateText, renderValues);
  }, [selectedTemplate, renderValues]);

  useEffect(() => {
    if (selectedTemplate) {
      setForm((prev) => ({ ...prev, reason: autoGeneratedReason }));
    }
  }, [autoGeneratedReason, selectedTemplate]);

  // Reset selected template if it no longer matches the category/tab
  useEffect(() => {
    if (!selectedTemplate) return;
    const stillAvailable = currentTemplates.some(
      (t) => String(t.id) === String(selectedTemplate.id)
    );
    if (!stillAvailable) {
      setSelectedTemplate(null);
      setForm((prev) => ({
        ...prev,
        templateId: '',
        templateName: '',
      }));
    }
  }, [currentTemplates, selectedTemplate]);

  // Reset category if it doesn't exist in the new tab
  useEffect(() => {
    if (!form.reasonCategory) return;
    const stillValid = reasonCategories.includes(form.reasonCategory);
    if (!stillValid) {
      setForm((prev) => ({
        ...prev,
        reasonCategory: '',
        templateId: '',
        templateName: '',
      }));
      setSelectedTemplate(null);
    }
  }, [reasonCategories, form.reasonCategory]);

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setForm((prev) => ({
      ...prev,
      reasonCategory: '',
      templateId: '',
      templateName: '',
    }));
    setSelectedTemplate(null);
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setForm((prev) => ({
      ...prev,
      templateId: template.id,
      templateName: template.templateName,
      reasonCategory: prev.reasonCategory || template.reasonCategory,
      reason: '',
    }));
  };

  const validate = () => {
    const e = {};
    if (!form.leaveType) e.leaveType = 'Please select a leave type';
    if (!form.startDate) e.startDate = 'Start date is required';
    if (!form.endDate) e.endDate = 'End date is required';
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      e.endDate = 'End date cannot be before start date';
    }
    if (!form.reasonCategory) e.reasonCategory = 'Please select a reason category';
    if (!form.reason.trim()) e.reason = 'Reason for leave is required';
    if (!form.confirm) e.confirm = 'Please confirm the information is accurate';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      showErrorToast('Please fix the errors before submitting', 2500);
      return;
    }

    const employeeId =
      auth?.employeeId ?? auth?.id ?? auth?.userId ?? auth?.doctorId;

    const employeeType =
      auth?.employeeType || (auth?.role === 'doctor' ? 'Doctor' : 'Staff');

    try {
      await createLeaveRequest({
        hospitalId: auth?.hospitalId,
        employeeId,
        employeeType,
        employeeName: auth?.name || auth?.employeeName,
        employeeEmail: auth?.email,
        department: auth?.department,
        leaveType: form.leaveType,
        startDate: form.startDate,
        endDate: form.endDate,
        totalDays,
        reasonCategory: form.reasonCategory,
        reason: form.reason,
        additionalDetails: form.additionalDetails || undefined,
        ...(form.handoverTo.trim()
          ? { handoverToName: form.handoverTo.trim() }
          : {}),
        ...(form.handoverNotes.trim()
          ? { handoverNotes: form.handoverNotes.trim() }
          : {}),
        isConfirmed: form.confirm,
        templateId: form.templateId || undefined,
      }).unwrap();

      showSuccessToast('Leave request submitted successfully', 2500);
      navigate('/my-leave-requests');
    } catch (err) {
      showErrorToast(
        err?.data?.message || 'Failed to submit leave request',
        3000
      );
    }
  };

  const handleCancel = () => navigate('/my-leave-requests');

  const isLoadingTemplates = activeTab === 'predefined' ? loadingPredefined : loadingMy;
  const hasTemplateError = activeTab === 'predefined' ? predefinedError : myError;

  return (
    <div className="w-full min-h-screen max-w-none bg-[#F8FAFC] p-4 md:p-6 font-sans text-gray-800">
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft size={18} />
        </button>
        <nav className="flex items-center gap-1.5 text-sm">
          <span className="text-gray-500">Hospital</span>
          <span className="text-gray-400">›</span>
          <span className="text-gray-500">Leave Management</span>
          <span className="text-gray-400">›</span>
          <span className="text-gray-500">My Leave Requests</span>
          <span className="text-gray-400">›</span>
          <span className="text-gray-700 font-medium">Add Leave Request</span>
        </nav>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Create Leave Request</h1>
        <p className="text-sm text-slate-500 mt-1">
          Use a template to quickly create a professional leave request. You can edit it before submitting.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-4">
            {/* SECTION 1 — LEAVE DETAILS */}
            <Section number={1} title="Leave Details">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Leave Type <span className="text-red-500">*</span>
                </label>
                {/* ✅ Replaced native  with CustomSelect */}
                <CustomSelect
                  hideLabel
                  value={form.leaveType}
                  options={LEAVE_TYPES}
                  placeholder="Select leave type…"
                  onChange={(value) => handleChange('leaveType', value)}
                  error={errors.leaveType}
                  touched={!!errors.leaveType}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <CalendarIcon
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={(e) => handleChange('startDate', e.target.value)}
                      className={`w-full h-11 pl-9 pr-4 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent ${
                        errors.startDate ? 'border-red-300' : 'border-gray-200'
                      }`}
                    />
                  </div>
                  {errors.startDate && (
                    <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <CalendarIcon
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                    <input
                      type="date"
                      value={form.endDate}
                      min={form.startDate || todayISO()}
                      onChange={(e) => handleChange('endDate', e.target.value)}
                      className={`w-full h-11 pl-9 pr-4 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent ${
                        errors.endDate ? 'border-red-300' : 'border-gray-200'
                      }`}
                    />
                  </div>
                  {errors.endDate && (
                    <p className="text-xs text-red-500 mt-1">{errors.endDate}</p>
                  )}
                </div>
              </div>

              {totalDays > 0 && (
                <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5">
                  <Info size={14} />
                  <span>
                    Total Leave Days:{' '}
                    <strong>{totalDays} {totalDays === 1 ? 'day' : 'days'}</strong>
                  </span>
                </div>
              )}
            </Section>

            {/* SECTION 2 — TEMPLATE SELECTION */}
            <Section number={2} title="Template Selection">
              {/* Tabs */}
              <div className="flex border-b border-gray-200 mb-4">
                <button
                  type="button"
                  onClick={() => handleTabChange('predefined')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'predefined'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Predefined Templates
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('my')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'my'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  My Templates
                </button>
              </div>

              {/* Reason Category — scoped to active tab */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Reason Category <span className="text-red-500">*</span>
                  <span className="text-slate-400 font-normal ml-1">(Auto-filled from template)</span>
                </label>
                {/* ✅ Replaced native  with CustomSelect */}
                <CustomSelect
                  hideLabel
                  value={form.reasonCategory}
                  options={reasonCategoryOptions}
                  placeholder={
                    isLoadingTemplates
                      ? 'Loading categories…'
                      : reasonCategories.length === 0
                        ? 'No categories available'
                        : 'Select a category…'
                  }
                  onChange={(value) => handleChange('reasonCategory', value)}
                  disabled={isLoadingTemplates || reasonCategories.length === 0}
                  error={errors.reasonCategory}
                  touched={!!errors.reasonCategory}
                />
                {errors.reasonCategory && (
                  <p className="text-xs text-red-500 mt-1">{errors.reasonCategory}</p>
                )}
              </div>

              {/* Select Template dropdown */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Select Template <span className="text-red-500">*</span>
                </label>
                {/* ✅ Replaced native  with CustomSelect */}
                <CustomSelect
                  hideLabel
                  value={form.templateId ? String(form.templateId) : ''}
                  options={templateOptions}
                  placeholder={
                    isLoadingTemplates
                      ? 'Loading templates…'
                      : currentTemplates.length === 0
                        ? 'No templates available'
                        : 'Choose a template…'
                  }
                  onChange={(value) => {
                    const t = currentTemplates.find((x) => String(x.id) === value);
                    if (t) handleTemplateSelect(t);
                  }}
                  disabled={isLoadingTemplates || currentTemplates.length === 0}
                />
              </div>

              {/* Loading / Error / Empty */}
              {isLoadingTemplates && (
                <div className="flex items-center justify-center py-6 text-slate-400 text-sm gap-2">
                  <Loader2 size={16} className="animate-spin" /> Loading templates…
                </div>
              )}

              {!isLoadingTemplates && hasTemplateError && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg px-3 py-2.5">
                  Failed to load templates. Please try again.
                </div>
              )}

              {!isLoadingTemplates && !hasTemplateError && currentTemplates.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-sm">
                  <FileText size={28} className="mx-auto mb-2 opacity-50" />
                  <p>
                    No templates available
                    {form.reasonCategory ? ` for "${form.reasonCategory}"` : ''}
                    {activeTab === 'my' ? ' in My Templates' : ''}.
                  </p>
                </div>
              )}

              {/* Final Reason — auto-generated or manual */}
              {selectedTemplate ? (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Final Reason <span className="text-slate-400 font-normal">(Auto-generated from template)</span>
                  </label>
                  <textarea
                    rows={4}
                    maxLength={MAX_REASON}
                    value={form.reason}
                    onChange={(e) => handleChange('reason', e.target.value)}
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent resize-none ${
                      errors.reason ? 'border-red-300' : 'border-gray-200'
                    }`}
                  />
                  <div className="flex items-center justify-between mt-1">
                    {form.reason.length >= 20 && !errors.reason ? (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <Check size={12} /> Template applied successfully. You can edit the text if needed.
                      </p>
                    ) : errors.reason ? (
                      <p className="text-xs text-red-500">{errors.reason}</p>
                    ) : (
                      <span />
                    )}
                    <span className="text-xs text-slate-400">
                      {form.reason.length} / {MAX_REASON}
                    </span>
                  </div>
                </div>
              ) : (
                !isLoadingTemplates && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Reason for Leave <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={4}
                      maxLength={MAX_REASON}
                      value={form.reason}
                      onChange={(e) => handleChange('reason', e.target.value)}
                      placeholder="Describe the reason for your leave…"
                      className={`w-full px-4 py-2.5 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent resize-none ${
                        errors.reason ? 'border-red-300' : 'border-gray-200'
                      }`}
                    />
                    <div className="flex items-center justify-between mt-1">
                      {errors.reason ? (
                        <p className="text-xs text-red-500">{errors.reason}</p>
                      ) : (
                        <span />
                      )}
                      <span className="text-xs text-slate-400">
                        {form.reason.length} / {MAX_REASON}
                      </span>
                    </div>
                  </div>
                )
              )}
            </Section>

            {/* SECTION 3 — WORK HANDOVER (OPTIONAL) */}
            <Section
              number={3}
              title="Work Handover"
              subtitle="Optional. Fill this if you want to hand over responsibilities during your leave."
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Handover To <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={form.handoverTo}
                    onChange={(e) => handleChange('handoverTo', e.target.value)}
                    placeholder="e.g. Dr. Anitha S"
                    className="w-full h-11 px-4 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Handover Notes <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    maxLength={MAX_NOTES}
                    value={form.handoverNotes}
                    onChange={(e) => handleChange('handoverNotes', e.target.value)}
                    placeholder="e.g. Pending appointments and follow-ups have been handed over…"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent resize-none"
                  />
                  <div className="text-right text-xs text-slate-400 mt-1">
                    {form.handoverNotes.length} / {MAX_NOTES}
                  </div>
                </div>
              </div>
            </Section>

            {/* SECTION 4 — CONFIRMATION */}
            <Section number={4} title="Confirmation">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.confirm}
                  onChange={(e) => handleChange('confirm', e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-sm text-gray-700 select-none">
                  I confirm that the information provided is accurate and complete.
                </span>
              </label>
              {errors.confirm && (
                <p className="text-xs text-red-500">{errors.confirm}</p>
              )}
            </Section>

            <div className="flex justify-between items-center pt-2">
              <Button type="button" variant="secondary" onClick={handleCancel} disabled={submitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={submitting}
                loading={submitting}
                className="inline-flex items-center gap-2"
              >
                <Send size={16} /> Submit Leave Request
              </Button>
            </div>
          </div>

          {/* RIGHT COLUMN — GUIDELINES */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-[#F0F7FF] border border-[#BEE3F8] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Info size={16} className="text-blue-600" />
                <h3 className="font-semibold text-gray-800 text-sm">
                  Guidelines for a valid reason
                </h3>
              </div>
              <p className="text-xs text-slate-600 mb-5 leading-relaxed">
                Please provide a clear and detailed reason for your leave. Avoid vague
                statements like "personal work" or "need leave".
              </p>

              <h4 className="text-xs font-semibold text-gray-700 mb-3">
                Examples based on leave type
              </h4>

              <div className="mb-4">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 mb-1.5">
                  <FileText size={11} /> Casual Leave
                </span>
                <p className="text-xs text-slate-600 italic leading-relaxed">
                  "I need to attend my sister's wedding ceremony and complete the related family arrangements."
                </p>
              </div>

              <div className="mb-4">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-700 mb-1.5">
                  <AlertTriangle size={11} /> Sick Leave
                </span>
                <p className="text-xs text-slate-600 italic leading-relaxed">
                  "I am unwell and need leave to rest and recover."
                </p>
              </div>

              <div className="mb-4">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700 mb-1.5">
                  <FileText size={11} /> Annual Leave
                </span>
                <p className="text-xs text-slate-600 italic leading-relaxed">
                  "I am requesting annual leave for a planned family vacation during the specified dates."
                </p>
              </div>

              <div className="mb-5">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-orange-50 text-orange-700 mb-1.5">
                  <AlertTriangle size={11} /> Emergency Leave
                </span>
                <p className="text-xs text-slate-600 italic leading-relaxed">
                  "I need to attend to an unexpected family emergency that requires my immediate attention."
                </p>
              </div>

              <div className="pt-4 border-t border-blue-200">
                <div className="flex items-start gap-2 mb-3">
                  <BookOpen size={16} className="text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800">Use a template</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Get a ready-to-use template based on your selected reason category.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="w-full border border-blue-200 text-blue-600 hover:bg-blue-50 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <FileText size={14} /> View Templates
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddLeaveRequest;