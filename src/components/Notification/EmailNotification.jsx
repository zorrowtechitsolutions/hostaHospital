// EmailComposer.connected.js
// Complete email composer with enhanced draft workflow UI/UX

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useGetRolesQuery } from '../../../app/service/role';
import { getHospitalId } from '../../utils/auth';

// Import doctor and staff APIs
import { useGetDoctorsQuery } from '../../../app/service/doctorApi';
import { useGetStaffQuery } from '../../../app/service/staffApi';

// Import Template API
import { useGetTemplatesQuery } from '../../../app/service/emailtemplate';

// Import Email APIs
import { 
  useSendEmailMutation,
  useSaveDraftMutation,
  useSendDraftMutation,
  useUpdateDraftMutation,
  useDeleteDraftMutation,
  useDuplicateEmailMutation,
  useResendEmailMutation,
  useArchiveEmailMutation,
  useGetEmailsQuery
} from '../../../app/service/emailnotification';

// Import Toast methods
import { showErrorToast, showSuccessToast, showInfoToast } from '../ui/Toast';

// ============================================
// SUB-COMPONENTS
// ============================================

// Email History/Activity Component with Enhanced Actions
const EmailHistoryPanel = ({ 
  hospitalId, 
  onSelectEmail,
  onEditEmail,
  onSendDraft,
  onDeleteDraft,
  onDuplicateEmail,
  onResendEmail,
  onArchiveEmail
}) => {
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEmailId, setSelectedEmailId] = useState(null);

  // ✅ FIXED: Query now properly uses the filter status
  const { data: emailsData, isLoading, refetch } = useGetEmailsQuery({
    hospitalId: hospitalId,
    status: filterStatus === 'all' ? undefined : filterStatus,
    search_query: searchQuery,
    page: currentPage,
    limit: 10,
    isArchived: false,
  });

  const emails = emailsData?.data || [];
  const pagination = emailsData?.pagination;

  const handleEmailSelect = (email) => {
    setSelectedEmailId(email.id);
    if (onSelectEmail) {
      onSelectEmail(email);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      sent: 'bg-green-100 text-green-700',
      draft: 'bg-slate-100 text-slate-600',
      scheduled: 'bg-blue-100 text-blue-700',
      failed: 'bg-red-100 text-red-700',
      queued: 'bg-yellow-100 text-yellow-700'
    };
    return styles[status] || 'bg-slate-100 text-slate-600';
  };

  const getStatusIcon = (status) => {
    const icons = {
      sent: '✅',
      draft: '📝',
      scheduled: '⏰',
      failed: '❌',
      queued: '⏳'
    };
    return icons[status] || '📧';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getEmailPreview = (email) => {
    const preview = email.message?.replace(/<[^>]*>/g, '') || '';
    return preview.length > 100 ? preview.substring(0, 100) + '...' : preview;
  };

  // ✅ FIXED: Reset pagination when filter or search changes
  const handleFilterChange = (e) => {
    const newStatus = e.target.value;
    setFilterStatus(newStatus);
    setCurrentPage(1); // Reset to first page
    setSelectedEmailId(null); // Clear selection
  };

  const handleSearchChange = (e) => {
    const newSearch = e.target.value;
    setSearchQuery(newSearch);
    setCurrentPage(1); // Reset to first page
    setSelectedEmailId(null); // Clear selection
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-slate-50/50">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <span>📨</span> Email History
            <span className="text-xs text-slate-400 font-normal">
              ({emails.length} items)
            </span>
          </h3>
          <div className="flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={handleFilterChange} // ✅ FIXED: Uses handler that resets pagination
              className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
            >
              <option value="all">📋 All</option>
              <option value="draft">📝 Drafts</option>
              <option value="sent">✅ Sent</option>
              <option value="scheduled">⏰ Scheduled</option>
              <option value="failed">❌ Failed</option>
              <option value="queued">⏳ Queued</option>
            </select>
            <button
              onClick={() => refetch()}
              className="p-1.5 text-slate-400 hover:text-slate-600 transition"
              title="Refresh"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
        <div className="mt-2">
          <input
            type="text"
            placeholder="Search emails by subject or recipient..."
            value={searchQuery}
            onChange={handleSearchChange} // ✅ FIXED: Uses handler that resets pagination
            className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
          />
        </div>
      </div>

      <div className="max-h-[600px] overflow-y-auto divide-y divide-slate-100">
        {emails.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            <div className="text-4xl mb-2">📭</div>
            <p>No emails found</p>
            <p className="text-xs mt-1">Try adjusting your filters or search</p>
          </div>
        ) : (
          emails.map((email) => {
            const isDraft = email.status === 'draft';
            const isSent = email.status === 'sent' || email.status === 'scheduled';
            
            return (
              <div
                key={email.id}
                className={`p-4 hover:bg-slate-50 transition ${
                  selectedEmailId === email.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleEmailSelect(email)}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getStatusIcon(email.status)}</span>
                      <p className="text-sm font-medium text-slate-700 truncate">
                        {email.subject || '(No subject)'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(email.status)}`}>
                        {email.status || 'Draft'}
                      </span>
                      <span className="text-xs text-slate-400">
                        {formatDate(email.sentAt || email.createdAt)}
                      </span>
                      <span className="text-xs text-slate-400">
                        {email.recipients?.length || 0} recipients
                      </span>
                      {email.recipients?.length > 0 && (
                        <span className="text-xs text-slate-400 truncate max-w-[150px]">
                          {email.recipients.map(r => 
                            r.userIds?.length || 0
                          ).reduce((a, b) => a + b, 0)} users
                        </span>
                      )}
                    </div>
                    {email.message && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {getEmailPreview(email)}
                      </p>
                    )}
                  </div>
                  {email.isArchived && (
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full ml-2">
                      Archived
                    </span>
                  )}
                </div>

                {/* ACTION BUTTONS - Only show for selected email */}
                {selectedEmailId === email.id && (
                  <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100">
                    {/* Draft Actions */}
                    {isDraft && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onEditEmail) onEditEmail(email);
                          }}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition flex items-center gap-1.5"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSendDraft) onSendDraft(email.id);
                          }}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition flex items-center gap-1.5"
                        >
                          📤 Send
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onDeleteDraft) onDeleteDraft(email.id);
                          }}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition flex items-center gap-1.5"
                        >
                          🗑️ Delete
                        </button>
                      </>
                    )}

                    {/* Sent/Scheduled Actions */}
                    {isSent && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onDuplicateEmail) onDuplicateEmail(email.id);
                          }}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition flex items-center gap-1.5"
                        >
                          📋 Duplicate
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onResendEmail) onResendEmail(email.id);
                          }}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition flex items-center gap-1.5"
                        >
                          🔄 Resend
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onArchiveEmail) onArchiveEmail(email.id);
                          }}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition flex items-center gap-1.5"
                        >
                          📦 Archive
                        </button>
                      </>
                    )}

                    {/* Failed actions */}
                    {email.status === 'failed' && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onResendEmail) onResendEmail(email.id);
                          }}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition flex items-center gap-1.5"
                        >
                          🔄 Retry
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onDuplicateEmail) onDuplicateEmail(email.id);
                          }}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition flex items-center gap-1.5"
                        >
                          📋 Duplicate
                        </button>
                      </>
                    )}

                    {/* Always show View/Select */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEmailId(null);
                      }}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition ml-auto"
                    >
                      ✕ Close
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="p-3 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm border border-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition"
          >
            Previous
          </button>
          <span className="text-sm text-slate-600">
            Page {currentPage} of {pagination.pages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(pagination.pages, p + 1))}
            disabled={currentPage === pagination.pages}
            className="px-3 py-1 text-sm border border-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================
// MAIN EMAIL COMPOSER COMPONENT
// ============================================

const EmailComposer = () => {
  // ---------- STATE ----------
  const [activeTab, setActiveTab] = useState('compose');
  const [activeRole, setActiveRole] = useState('doctor');
  const [doctorSearch, setDoctorSearch] = useState('');
  const [staffSearch, setStaffSearch] = useState('');
  const [selectedDoctors, setSelectedDoctors] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [draftId, setDraftId] = useState(null);
  const [scheduledAt, setScheduledAt] = useState('');
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [editingEmail, setEditingEmail] = useState(null);
  const [selectedEmailForAction, setSelectedEmailForAction] = useState(null);

  // ---------- GET HOSPITAL ID ----------
  const hospitalId = getHospitalId();

  // ---------- FETCH DOCTORS AND STAFF ----------
  const { 
    data: doctorsData, 
    isLoading: doctorsLoading,
    error: doctorsError,
    refetch: refetchDoctors 
  } = useGetDoctorsQuery({ 
    hospitalId: hospitalId,
    limit: 100 
  });

  const { 
    data: staffData, 
    isLoading: staffLoading,
    error: staffError,
    refetch: refetchStaff 
  } = useGetStaffQuery({ 
    hospitalId: hospitalId,
    limit: 100 
  });

  // ---------- FETCH ROLES ----------
  const { 
    data: rolesData, 
    isLoading: rolesLoading,
    error: rolesError,
    refetch: refetchRoles 
  } = useGetRolesQuery({
    hospitalId: hospitalId,
    page: 1,
    limit: 100,
  });

  // ---------- FETCH TEMPLATES ----------
  const { 
    data: templatesData, 
    isLoading: templatesLoading,
    error: templatesError,
    refetch: refetchTemplates 
  } = useGetTemplatesQuery({
    hospitalId: hospitalId,
    status: 'Active',
    limit: 100,
  });

  // ---------- EMAIL API MUTATIONS ----------
  const [sendEmailApi] = useSendEmailMutation();
  const [saveDraftApi] = useSaveDraftMutation();
  const [sendDraftApi] = useSendDraftMutation();
  const [updateDraftApi] = useUpdateDraftMutation();
  const [deleteDraftApi] = useDeleteDraftMutation();
  const [duplicateEmailApi] = useDuplicateEmailMutation();
  const [resendEmailApi] = useResendEmailMutation();
  const [archiveEmailApi] = useArchiveEmailMutation();

  // ---------- ✅ FIXED: Use a single refetch function instead of duplicate query ----------
  // The refetch from EmailHistoryPanel is passed up via the refetchEmails callback
  // We'll use a refetch function that the History panel can call
  const [refetchHistory, setRefetchHistory] = useState(null);

  const isLoading = doctorsLoading || staffLoading || rolesLoading || templatesLoading;

  // ---------- PROCESS DATA ----------
  const doctors = doctorsData?.data || doctorsData || [];
  const staff = staffData?.data || staffData || [];
  const roles = rolesData?.data || rolesData?.admin || [];
  const templates = templatesData?.data || templatesData || [];

  // ---------- HELPER FUNCTIONS ----------
  const convertMessageToHtml = (text) => {
    if (!text) return "";
    const hasHtmlTags = /<[a-z][\s\S]*>/i.test(text);
    if (hasHtmlTags) return text.trim();
    return text
      .trim()
      .split(/\n\s*\n/)
      .map(paragraph => `<p>${paragraph.replace(/\n/g, "<br/>")}</p>`)
      .join("");
  };

  const hasHtmlTags = (text) => {
    if (!text) return false;
    return /<[a-z][\s\S]*>/i.test(text);
  };

  const getRoleId = (person) => {
    if (person.roleId) return Number(person.roleId);
    if (person.role?.id) return Number(person.role.id);
    if (person.role?._id) return Number(person.role._id);
    
    const roleName = person.roleName || person.role?.name || person.role?.roleName || 
                     person.position || person.designation || person.specialty || '';
    
    if (roleName && roles.length > 0) {
      const foundRole = roles.find(
        role => String(role.name || role.roleName || '').toLowerCase() === 
                String(roleName).toLowerCase()
      );
      if (foundRole) return Number(foundRole.id || foundRole._id);
    }
    return null;
  };

  const getDoctorName = (doc) => {
    return doc.name || doc.fullName || `${doc.firstName || ''} ${doc.lastName || ''}`.trim() || 'Unknown Doctor';
  };

  const getStaffName = (staffMember) => {
    return staffMember.name || staffMember.fullName || `${staffMember.firstName || ''} ${staffMember.lastName || ''}`.trim() || 'Unknown Staff';
  };

  const getDoctorSpecialty = (doc) => {
    return doc.specialty || doc.specialization || doc.department || 'General';
  };

  const getStaffRole = (staffMember) => {
    return staffMember.role || staffMember.position || staffMember.designation || 'Staff';
  };

  const getSelectedTemplateName = () => {
    if (!selectedTemplateId) return 'None';
    const template = templates.find(t => String(t.id || t._id) === String(selectedTemplateId));
    return template?.templateName || 'Unknown Template';
  };

  // ---------- FILTER DATA ----------
  const filteredDoctors = doctors.filter((d) => {
    const name = d.name || d.fullName || `${d.firstName || ''} ${d.lastName || ''}`.trim() || '';
    const email = d.email || '';
    const specialty = d.specialty || d.specialization || d.department || '';
    const phone = d.phone || d.phoneNumber || '';
    const search = doctorSearch.toLowerCase();
    return name.toLowerCase().includes(search) ||
      email.toLowerCase().includes(search) ||
      specialty.toLowerCase().includes(search) ||
      phone.toLowerCase().includes(search);
  });

  const filteredStaff = staff.filter((s) => {
    const name = s.name || s.fullName || `${s.firstName || ''} ${s.lastName || ''}`.trim() || '';
    const email = s.email || '';
    const role = s.role || s.position || s.designation || '';
    const search = staffSearch.toLowerCase();
    return name.toLowerCase().includes(search) ||
      email.toLowerCase().includes(search) ||
      role.toLowerCase().includes(search);
  });

  // ---------- HANDLERS ----------
  const toggleDoctor = (id) => {
    setSelectedDoctors((prev) =>
      prev.includes(id) ? prev.filter((docId) => docId !== id) : [...prev, id]
    );
  };

  const toggleStaff = (id) => {
    setSelectedStaff((prev) =>
      prev.includes(id) ? prev.filter((staffId) => staffId !== id) : [...prev, id]
    );
  };

  const resetAll = () => {
    setSelectedDoctors([]);
    setSelectedStaff([]);
    setSubject('');
    setMessage('');
    setDoctorSearch('');
    setStaffSearch('');
    setSelectedTemplateId('');
    setDraftId(null);
    setScheduledAt('');
    setShowSchedulePicker(false);
    setEditingEmail(null);
  };

  // Template selection now stores value as number or empty string
  const handleTemplateSelect = (e) => {
    const value = e.target.value;
    const templateId = value ? Number(value) : '';
    setSelectedTemplateId(templateId);
    
    if (!templateId) return;
    
    const selectedTemplate = templates.find(
      t => Number(t.id || t._id) === templateId
    );
    
    if (selectedTemplate) {
      if (selectedTemplate.subject) {
        setSubject(selectedTemplate.subject);
      }
      if (selectedTemplate.message) {
        setMessage(selectedTemplate.message);
      }
    }
  };

  const loadEmailForEditing = (email) => {
    setEditingEmail(email);
    setDraftId(email.id);
    setSubject(email.subject || '');
    setMessage(email.message || '');
    setSelectedTemplateId(email.templateId || '');
    setScheduledAt(email.scheduledAt || '');
    
    // Load recipients
    const recipients = email.recipients || [];
    const doctorIds = [];
    const staffIds = [];
    
    recipients.forEach(recipient => {
      if (recipient.userIds) {
        // Check if these are doctors or staff
        recipient.userIds.forEach(id => {
          const isDoctor = doctors.some(d => Number(d.id) === Number(id));
          if (isDoctor) {
            doctorIds.push(Number(id));
          } else {
            staffIds.push(Number(id));
          }
        });
      }
    });
    
    setSelectedDoctors(doctorIds);
    setSelectedStaff(staffIds);
    setActiveTab('compose');
    
    // Show info toast
    showInfoToast(`Editing draft: "${email.subject || 'No subject'}"`);
  };

  // ---------- SAVE DRAFT ----------
  const saveDraft = async () => {
    const total = selectedDoctors.length + selectedStaff.length;
    if (total === 0) {
      showErrorToast('Please select at least one recipient.');
      return;
    }
    if (!subject.trim()) {
      showErrorToast('Please enter a subject.');
      return;
    }
    if (!message.trim()) {
      showErrorToast('Please enter a message.');
      return;
    }

    setIsSavingDraft(true);

    try {
      const doctorRecipients = doctors.filter(d => selectedDoctors.includes(Number(d.id)));
      const staffRecipients = staff.filter(s => selectedStaff.includes(Number(s.id)));
      const allRecipients = [...doctorRecipients, ...staffRecipients];

      const recipients = [];
      const errors = [];

      allRecipients.forEach((r) => {
        const roleId = getRoleId(r);
        const name = getDoctorName(r) || getStaffName(r) || 'Unknown';
        const personId = Number(r.id);

        if (!roleId || Number.isNaN(Number(roleId))) {
          errors.push(`Role ID not found for "${name}"`);
          return;
        }
        if (!Number.isFinite(personId)) {
          errors.push(`Valid Staff ID not found for "${name}"`);
          return;
        }

        recipients.push({
          roleId: Number(roleId),
          all: false,
          userIds: [personId],
        });
      });

      if (errors.length > 0) {
        showErrorToast(`Cannot save draft: ${errors.join(', ')}`);
        setIsSavingDraft(false);
        return;
      }

      const htmlMessage = convertMessageToHtml(message);

      if (draftId) {
        await updateDraftApi({
          id: draftId,
          data: {
            recipients: recipients,
            subject: subject.trim(),
            message: htmlMessage,
            templateId: selectedTemplateId ? Number(selectedTemplateId) : undefined,
            scheduledAt: scheduledAt || undefined,
          }
        }).unwrap();
        showSuccessToast('Draft updated successfully!');
      } else {
        const result = await saveDraftApi({
          recipients: recipients,
          subject: subject.trim(),
          message: htmlMessage,
          templateId: selectedTemplateId ? Number(selectedTemplateId) : undefined,
        }).unwrap();
        if (result.data?.id) {
          setDraftId(result.data.id);
        }
        showSuccessToast('Draft saved successfully!');
      }

      // ✅ FIXED: Refetch history using the refetch function if available
      if (refetchHistory) {
        refetchHistory();
      }

    } catch (error) {
      const errorMessage = error?.data?.message || error?.message || 'Failed to save draft.';
      showErrorToast(errorMessage);
    } finally {
      setIsSavingDraft(false);
    }
  };

  // ---------- SEND DRAFT BY ID ----------
  const sendDraftById = async (id) => {
    if (!id) {
      showErrorToast('No draft ID provided.');
      return;
    }

    // If the draft being sent is the one currently being edited, clear the composer
    const isCurrentDraft = draftId === id;

    try {
      await sendDraftApi({
        id: id,
        scheduledAt: scheduledAt || undefined,
      }).unwrap();
      
      showSuccessToast(`Email ${scheduledAt ? 'scheduled' : 'sent'} successfully!`);
      
      if (isCurrentDraft) {
        resetAll();
      }
      
      // ✅ FIXED: Refetch history using the refetch function if available
      if (refetchHistory) {
        refetchHistory();
      }
      
      // Clear selection if this draft was selected
      setSelectedEmailForAction(null);
      
    } catch (error) {
      const errorMessage = error?.data?.message || error?.message || 'Failed to send draft.';
      showErrorToast(errorMessage);
    }
  };

  // ---------- SEND EMAIL ----------
  const sendEmail = async () => {
    const total = selectedDoctors.length + selectedStaff.length;
    if (total === 0) {
      showErrorToast('Please select at least one recipient.');
      return;
    }
    if (!subject.trim()) {
      showErrorToast('Please enter a subject.');
      return;
    }
    if (!message.trim()) {
      showErrorToast('Please enter a message.');
      return;
    }

    // If editing a draft, use sendDraftById instead
    if (draftId) {
      return sendDraftById(draftId);
    }

    setIsSending(true);

    try {
      const doctorRecipients = doctors.filter(d => selectedDoctors.includes(Number(d.id)));
      const staffRecipients = staff.filter(s => selectedStaff.includes(Number(s.id)));
      const allRecipients = [...doctorRecipients, ...staffRecipients];

      const recipients = [];
      const errors = [];

      allRecipients.forEach((r) => {
        const roleId = getRoleId(r);
        const name = getDoctorName(r) || getStaffName(r) || 'Unknown';
        const personId = Number(r.id);

        if (!roleId || Number.isNaN(Number(roleId))) {
          errors.push(`Role ID not found for "${name}"`);
          return;
        }
        if (!Number.isFinite(personId)) {
          errors.push(`Valid Staff ID not found for "${name}"`);
          return;
        }

        recipients.push({
          roleId: Number(roleId),
          all: false,
          userIds: [personId],
        });
      });

      if (errors.length > 0) {
        showErrorToast(`Cannot send email: ${errors.join(', ')}`);
        setIsSending(false);
        return;
      }

      const htmlMessage = convertMessageToHtml(message);

      const emailPayload = {
        recipients: recipients,
        subject: subject.trim(),
        message: htmlMessage,
        templateId: selectedTemplateId ? Number(selectedTemplateId) : undefined,
        scheduledAt: scheduledAt || undefined,
      };

      await sendEmailApi(emailPayload).unwrap();
      showSuccessToast(`Email ${scheduledAt ? 'scheduled' : 'sent'} successfully to ${recipients.length} recipient(s)!`);
      resetAll();
      
      // ✅ FIXED: Refetch history using the refetch function if available
      if (refetchHistory) {
        refetchHistory();
      }

    } catch (error) {
      const errorMessage = error?.data?.message || error?.message || 'Failed to send email.';
      if (error?.data?.errors) {
        const validationErrors = Object.entries(error.data.errors)
          .map(([field, msg]) => `• ${field}: ${msg}`)
          .join('\n');
        showErrorToast(`Validation Error: ${validationErrors}`);
      } else {
        showErrorToast(errorMessage);
      }
    } finally {
      setIsSending(false);
    }
  };

  // ---------- DELETE DRAFT ----------
  const handleDeleteDraft = async (id) => {
    if (!window.confirm('Are you sure you want to delete this draft?')) return;
    
    try {
      await deleteDraftApi(id).unwrap();
      showSuccessToast('Draft deleted successfully!');
      
      // If the deleted draft is the one being edited, reset the composer
      if (draftId === id) {
        resetAll();
      }
      
      // ✅ FIXED: Refetch history using the refetch function if available
      if (refetchHistory) {
        refetchHistory();
      }
      
      setSelectedEmailForAction(null);
    } catch (error) {
      showErrorToast(error?.data?.message || 'Failed to delete draft.');
    }
  };

  // ---------- DUPLICATE EMAIL ----------
  const handleDuplicateEmail = async (id) => {
    try {
      const result = await duplicateEmailApi(id).unwrap();
      showSuccessToast('Email duplicated successfully!');
      
      // ✅ FIXED: Refetch history using the refetch function if available
      if (refetchHistory) {
        refetchHistory();
      }
      
      // Load the duplicated email for editing if it's a draft
      if (result.data && result.data.status === 'draft') {
        loadEmailForEditing(result.data);
      }
    } catch (error) {
      showErrorToast(error?.data?.message || 'Failed to duplicate email.');
    }
  };

  // ---------- RESEND EMAIL ----------
  const handleResendEmail = async (id) => {
    try {
      await resendEmailApi({ id }).unwrap();
      showSuccessToast('Email resent successfully!');
      
      // ✅ FIXED: Refetch history using the refetch function if available
      if (refetchHistory) {
        refetchHistory();
      }
    } catch (error) {
      showErrorToast(error?.data?.message || 'Failed to resend email.');
    }
  };

  // ---------- ARCHIVE EMAIL ----------
  const handleArchiveEmail = async (id) => {
    try {
      await archiveEmailApi(id).unwrap();
      showSuccessToast('Email archived successfully!');
      
      // ✅ FIXED: Refetch history using the refetch function if available
      if (refetchHistory) {
        refetchHistory();
      }
      
      setSelectedEmailForAction(null);
    } catch (error) {
      showErrorToast(error?.data?.message || 'Failed to archive email.');
    }
  };

  // ---------- RENDER ----------
  const totalRecipients = selectedDoctors.length + selectedStaff.length;
  const selectedDoctorObjects = doctors.filter(d => selectedDoctors.includes(Number(d.id)));
  const selectedStaffObjects = staff.filter(s => selectedStaff.includes(Number(s.id)));

  // Check if in draft editing mode
  const isEditingDraft = !!draftId || !!editingEmail;

  // ============================================
  // MAIN RENDER
  // ============================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading recipients and templates...</p>
        </div>
      </div>
    );
  }

  if (doctorsError || staffError || rolesError || templatesError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-2xl mx-auto mt-8">
        <p className="text-red-600 font-medium">Failed to load data</p>
        <p className="text-sm text-red-500 mt-1">Please check your connection and try again</p>
        <button 
          onClick={() => {
            refetchDoctors();
            refetchStaff();
            refetchRoles();
            refetchTemplates();
          }}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="text-2xl font-semibold text-slate-800 flex items-center gap-2">
          <span>✉️</span> Email Composer
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500 bg-slate-100 px-4 py-2 rounded-lg">
            Hospital ID: {hospitalId || 'Not set'}
          </span>
          {isEditingDraft && (
            <span className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full font-medium border border-amber-200 flex items-center gap-1.5">
              📝 Editing Draft #{draftId}
              <button
                onClick={() => {
                  resetAll();
                  setEditingEmail(null);
                  showInfoToast('Draft editing cancelled');
                }}
                className="ml-1 text-slate-400 hover:text-slate-600 transition"
                title="Cancel editing"
              >
                ✕
              </button>
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('compose')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            activeTab === 'compose'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
         Compose
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            activeTab === 'history'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
        History
        </button>
      </div>

      {/* Compose Tab */}
      {activeTab === 'compose' && (
        <div className="grid grid-cols-12 gap-6">
          {/* ============================================================ */}
          {/* LEFT COLUMN - 8/12 */}
          {/* ============================================================ */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            {/* PART 1: SELECT RECIPIENTS */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-slate-700">Select Recipients</h2>
                  <span className="ml-auto text-xs text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                    {doctors.length + staff.length} total users
                  </span>
                </div>
              </div>

              <div className="p-5">
                {/* Role Selector */}
                <div className="flex items-center gap-6 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="recipientRole"
                      value="doctor"
                      checked={activeRole === 'doctor'}
                      onChange={() => setActiveRole('doctor')}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium text-slate-700">Doctors</span>
                    <span className="text-xs text-slate-400">({doctors.length})</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="recipientRole"
                      value="staff"
                      checked={activeRole === 'staff'}
                      onChange={() => setActiveRole('staff')}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium text-slate-700">Staff</span>
                    <span className="text-xs text-slate-400">({staff.length})</span>
                  </label>
                </div>

                {/* DOCTOR PANEL */}
                {activeRole === 'doctor' && (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="p-3 bg-slate-50 border-b border-slate-200">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search doctors by name, email or specialty..."
                          value={doctorSearch}
                          onChange={(e) => setDoctorSearch(e.target.value)}
                          className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-white"
                        />
                        <svg className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="overflow-x-auto max-h-64 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider sticky top-0">
                          <tr>
                            <th className="px-4 py-2.5 text-left font-semibold">Name</th>
                            <th className="px-4 py-2.5 text-left font-semibold">Specialty</th>
                            <th className="px-4 py-2.5 text-left font-semibold hidden md:table-cell">Email</th>
                            <th className="px-4 py-2.5 text-right font-semibold whitespace-nowrap">
                              <span className="inline-flex items-center bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap">
                                {selectedDoctors.length} Selected
                              </span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredDoctors.length > 0 ? (
                            filteredDoctors.map((doc) => {
                              const id = Number(doc.id);
                              const isSelected = selectedDoctors.includes(id);
                              const name = getDoctorName(doc);
                              const specialty = getDoctorSpecialty(doc);
                              return (
                                <tr
                                  key={id}
                                  onClick={() => toggleDoctor(id)}
                                  className={`cursor-pointer transition hover:bg-slate-50 ${
                                    isSelected ? 'bg-indigo-50/60' : ''
                                  }`}
                                >
                                  <td className="px-4 py-2.5 font-medium text-slate-700">
                                    <div className="flex items-center gap-2">
                                      <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                                        {name.charAt(0) || 'D'}
                                      </span>
                                      {name}
                                    </div>
                                  </td>
                                  <td className="px-4 py-2.5 text-slate-600">
                                    <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs">
                                      {specialty}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2.5 text-slate-500 hidden md:table-cell">{doc.email || 'N/A'}</td>
                                  <td className="px-4 py-2.5 text-right">
                                    <div className="inline-flex items-center justify-center w-5 h-5 rounded border-2 transition-colors duration-100"
                                      style={{
                                        borderColor: isSelected ? '#4f46e5' : '#cbd5e1',
                                        backgroundColor: isSelected ? '#4f46e5' : 'transparent'
                                      }}
                                    >
                                      {isSelected && (
                                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                        </svg>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan="4" className="px-4 py-8 text-center text-slate-400 text-sm">
                                {doctorSearch ? 'No doctors match your search.' : 'No doctors found for this hospital.'}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* STAFF PANEL */}
                {activeRole === 'staff' && (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="p-3 bg-slate-50 border-b border-slate-200">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search staff by name, email or role..."
                          value={staffSearch}
                          onChange={(e) => setStaffSearch(e.target.value)}
                          className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-white"
                        />
                        <svg className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="overflow-x-auto max-h-64 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider sticky top-0">
                          <tr>
                            <th className="px-4 py-2.5 text-left font-semibold">Name</th>
                            <th className="px-4 py-2.5 text-left font-semibold">Role</th>
                            <th className="px-4 py-2.5 text-left font-semibold hidden lg:table-cell">Email</th>
                            <th className="px-4 py-2.5 text-right font-semibold whitespace-nowrap">
                              <span className="inline-flex items-center bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap">
                                {selectedStaff.length} Selected
                              </span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredStaff.length > 0 ? (
                            filteredStaff.map((staffMember) => {
                              const id = Number(staffMember.id);
                              const isSelected = selectedStaff.includes(id);
                              const name = getStaffName(staffMember);
                              const role = getStaffRole(staffMember);
                              return (
                                <tr
                                  key={id}
                                  onClick={() => toggleStaff(id)}
                                  className={`cursor-pointer transition hover:bg-slate-50 ${
                                    isSelected ? 'bg-indigo-50/60' : ''
                                  }`}
                                >
                                  <td className="px-4 py-2.5 font-medium text-slate-700">
                                    <div className="flex items-center gap-2">
                                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">
                                        {name.charAt(0) || 'S'}
                                      </span>
                                      {name}
                                    </div>
                                  </td>
                                  <td className="px-4 py-2.5 text-slate-600">
                                    <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs">
                                      {role}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2.5 text-slate-500 hidden lg:table-cell">
                                    {staffMember.email || 'N/A'}
                                  </td>
                                  <td className="px-4 py-2.5 text-right">
                                    <div className="inline-flex items-center justify-center w-5 h-5 rounded border-2 transition-colors duration-100"
                                      style={{
                                        borderColor: isSelected ? '#4f46e5' : '#cbd5e1',
                                        backgroundColor: isSelected ? '#4f46e5' : 'transparent'
                                      }}
                                    >
                                      {isSelected && (
                                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                        </svg>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan="4" className="px-4 py-8 text-center text-slate-400 text-sm">
                                {staffSearch ? 'No staff match your search.' : 'No staff found for this hospital.'}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* PART 2: COMPOSE EMAIL */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-indigo-600 bg-indigo-100 px-2.5 py-0.5 rounded-full">2</span>
                  <h2 className="text-base font-semibold text-slate-700">Compose Email</h2>
                  {isEditingDraft && (
                    <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full ml-2">
                      Updating draft
                    </span>
                  )}
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                    placeholder="Enter subject..."
                    required
                  />
                </div>

                {/* Template selector */}
                <div className="flex items-center gap-3 flex-wrap">
                  <label className="text-sm font-medium text-slate-700">Email Template</label>
                  <select
                    value={selectedTemplateId}
                    onChange={handleTemplateSelect}
                    className="border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white min-w-[200px]"
                  >
                    <option value="">-- Select Template --</option>
                    {templates.length > 0 ? (
                      templates.map((template) => {
                        const id = template.id || template._id;
                        return (
                          <option key={id} value={id}>
                            {template.templateName} {template.category ? `(${template.category})` : ''}
                          </option>
                        );
                      })
                    ) : (
                      <option value="" disabled>No templates available</option>
                    )}
                  </select>
                  {selectedTemplateId && (
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                      Applied: {getSelectedTemplateName()}
                    </span>
                  )}
                </div>

                {/* Message editor */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Message <span className="text-red-500">*</span>
                    {hasHtmlTags(message) && (
                      <span className="ml-2 text-xs text-emerald-600 font-normal">
                        ✅ HTML formatting detected
                      </span>
                    )}
                    {!hasHtmlTags(message) && message.trim() && (
                      <span className="ml-2 text-xs text-slate-400 font-normal">
                        Plain text will be automatically formatted
                      </span>
                    )}
                  </label>
                  <div className="border border-slate-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-400">
                    <div className="bg-slate-50 px-3 py-1.5 border-b border-slate-200 flex justify-between text-sm text-slate-500">
                      <div className="flex gap-3">
                        <span className="font-medium text-slate-700">Paragraph</span>
                        <span className="cursor-pointer hover:text-slate-800 font-bold">B</span>
                        <span className="cursor-pointer hover:text-slate-800 italic">I</span>
                        <span className="cursor-pointer hover:text-slate-800 underline">U</span>
                      </div>
                      <div className="text-xs text-slate-400">
                        {hasHtmlTags(message) ? 'HTML mode' : 'Plain text mode'}
                      </div>
                    </div>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows="5"
                      className="w-full px-4 py-3 text-sm focus:outline-none resize-y font-mono"
                      placeholder="Write your message here...&#10;&#10;Use HTML tags for rich formatting (optional)&#10;or plain text will be auto-formatted."
                      required
                    />
                  </div>
                  {selectedTemplateId && (
                    <p className="text-xs text-emerald-600 mt-1.5">
                      ✅ Template applied. You can edit the message above.
                    </p>
                  )}
                  {message.trim() && !hasHtmlTags(message) && (
                    <div className="mt-2 text-xs text-slate-400 bg-slate-50 p-2 rounded border border-slate-200">
                      <span className="font-medium">Preview:</span>
                      <div className="mt-1 whitespace-pre-wrap">{message}</div>
                    </div>
                  )}
                </div>

                {/* Schedule Picker */}
                <div>
                  <button
                    onClick={() => setShowSchedulePicker(!showSchedulePicker)}
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {scheduledAt ? 'Update Schedule' : 'Schedule Email'}
                  </button>
                  {showSchedulePicker && (
                    <div className="mt-2 flex items-center gap-3">
                      <input
                        type="datetime-local"
                        value={scheduledAt}
                        onChange={(e) => setScheduledAt(e.target.value)}
                        className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                      {scheduledAt && (
                        <button
                          onClick={() => setScheduledAt('')}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* RIGHT COLUMN - 4/12 */}
          {/* ============================================================ */}
          <div className="col-span-12 lg:col-span-4 space-y-5">
            {/* EMAIL SUMMARY */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50/50">
                <h3 className="text-sm font-semibold text-slate-700">Email Summary</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Total Recipients</span>
                  <span className="text-lg font-bold text-indigo-600">{totalRecipients}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Doctors</span>
                  <span className="font-medium text-slate-700">{selectedDoctors.length}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Staff</span>
                  <span className="font-medium text-slate-700">{selectedStaff.length}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-t border-slate-200 pt-2">
                  <span className="text-slate-600">Hospital</span>
                  <span className="font-medium text-slate-700 text-xs truncate max-w-[120px]">
                    {hospitalId || 'Not set'}
                  </span>
                </div>
                {selectedTemplateId && (
                  <div className="flex justify-between items-center text-sm border-t border-slate-200 pt-2">
                    <span className="text-slate-600">Template</span>
                    <span className="font-medium text-emerald-600 text-xs truncate max-w-[120px]">
                      {getSelectedTemplateName()}
                    </span>
                  </div>
                )}
                {scheduledAt && (
                  <div className="flex justify-between items-center text-sm border-t border-slate-200 pt-2">
                    <span className="text-slate-600">Scheduled</span>
                    <span className="font-medium text-blue-600 text-xs">
                      {new Date(scheduledAt).toLocaleString()}
                    </span>
                  </div>
                )}
                {isEditingDraft && (
                  <div className="flex justify-between items-center text-sm border-t border-slate-200 pt-2">
                    <span className="text-slate-600">Draft ID</span>
                    <span className="font-medium text-amber-600 text-xs">#{draftId}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm border-t border-slate-200 pt-2">
                  <span className="text-slate-600">Format</span>
                  <span className="font-medium text-slate-700 text-xs">
                    {hasHtmlTags(message) ? 'HTML (rich)' : 'Plain text → HTML'}
                  </span>
                </div>
              </div>
            </div>

            {/* SELECTED RECIPIENTS */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-slate-700">Selected Recipients</h3>
                <span className="text-xs text-slate-400">{totalRecipients} selected</span>
              </div>
              <div className="p-4 max-h-48 overflow-y-auto">
                {selectedDoctorObjects.length > 0 || selectedStaffObjects.length > 0 ? (
                  <div className="space-y-2">
                    {selectedDoctorObjects.map((doc) => {
                      const name = getDoctorName(doc);
                      const specialty = getDoctorSpecialty(doc);
                      return (
                        <div key={Number(doc.id)} className="flex items-center gap-2 text-sm p-1.5 bg-indigo-50/50 rounded-lg">
                          <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                            {name.charAt(0) || 'D'}
                          </span>
                          <span className="text-slate-700 font-medium">{name}</span>
                          <span className="text-slate-400 text-xs ml-auto bg-white px-1.5 py-0.5 rounded">
                            {specialty}
                          </span>
                        </div>
                      );
                    })}
                    {selectedStaffObjects.map((staffMember) => {
                      const name = getStaffName(staffMember);
                      const role = getStaffRole(staffMember);
                      return (
                        <div key={Number(staffMember.id)} className="flex items-center gap-2 text-sm p-1.5 bg-emerald-50/50 rounded-lg">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">
                            {name.charAt(0) || 'S'}
                          </span>
                          <span className="text-slate-700 font-medium">{name}</span>
                          <span className="text-slate-400 text-xs ml-auto bg-white px-1.5 py-0.5 rounded">
                            {role}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic text-center py-4">No recipients selected</p>
                )}
              </div>
            </div>

            {/* EMAIL PREVIEW */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50/50">
                <h3 className="text-sm font-semibold text-slate-700">Email Preview</h3>
              </div>
              <div className="p-4">
                <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-1.5">
                  <div className="flex justify-between">
                    <span className="font-medium text-slate-600">Subject:</span>
                    <span className="text-slate-700 text-right truncate max-w-[150px]">{subject || '(no subject)'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-slate-600">To:</span>
                    <span className="text-slate-700">{totalRecipients} recipient(s)</span>
                  </div>
                  {selectedTemplateId && (
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-600">Template:</span>
                      <span className="text-emerald-600 text-right truncate max-w-[150px]">{getSelectedTemplateName()}</span>
                    </div>
                  )}
                  {scheduledAt && (
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-600">Scheduled:</span>
                      <span className="text-blue-600 text-right text-xs">{new Date(scheduledAt).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-200">
                    <div className="text-slate-600 max-h-32 overflow-y-auto text-xs leading-relaxed">
                      {message ? (
                        hasHtmlTags(message) ? (
                          <div dangerouslySetInnerHTML={{ __html: message }} />
                        ) : (
                          <div className="whitespace-pre-wrap">{message}</div>
                        )
                      ) : (
                        '(empty message)'
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex gap-4 text-xs text-slate-400">
                  <span>Words: {message.trim() ? message.trim().split(/\s+/).length : 0}</span>
                  <span>Characters: {message.replace(/\n/g, '').length}</span>
                  <span>Format: {hasHtmlTags(message) ? 'HTML' : 'Plain'}</span>
                </div>
              </div>
            </div>

            {/* WARNING CARD */}
            {totalRecipients === 0 && (
              <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
                <div className="flex items-start gap-2">
                  <span className="text-amber-500 text-lg">⚠️</span>
                  <div>
                    <p className="text-sm font-medium text-amber-800">No recipients selected</p>
                    <p className="text-xs text-amber-700 mt-0.5">Please select at least one doctor or staff member.</p>
                  </div>
                </div>
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50/50">
                <h3 className="text-sm font-semibold text-slate-700">Actions</h3>
              </div>
              <div className="p-4 space-y-3">
                {/* Primary Action - Send or Send Draft */}
                <button
                  onClick={sendEmail}
                  disabled={isSending || totalRecipients === 0 || !subject.trim() || !message.trim()}
                  className={`w-full py-2.5 rounded-lg text-sm font-medium shadow-sm transition flex items-center justify-center gap-2 ${
                    isSending || totalRecipients === 0 || !subject.trim() || !message.trim()
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : isEditingDraft 
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  {isSending ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {scheduledAt ? 'Scheduling...' : 'Sending...'}
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {isEditingDraft ? 'Send Draft' : scheduledAt ? 'Schedule Email' : 'Send Email'}
                    </>
                  )}
                </button>

                {/* Draft Save/Update Button */}
                <button
                  onClick={saveDraft}
                  disabled={isSavingDraft || totalRecipients === 0 || !subject.trim() || !message.trim()}
                  className={`w-full py-2.5 rounded-lg text-sm font-medium border transition flex items-center justify-center gap-2 ${
                    isSavingDraft || totalRecipients === 0 || !subject.trim() || !message.trim()
                      ? 'border-slate-200 text-slate-400 cursor-not-allowed'
                      : isEditingDraft
                        ? 'border-amber-200 text-amber-600 hover:bg-amber-50'
                        : 'border-indigo-200 text-indigo-600 hover:bg-indigo-50'
                  }`}
                >
                  {isSavingDraft ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {isEditingDraft ? 'Updating...' : 'Saving...'}
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      {isEditingDraft ? 'Update Draft' : 'Save Draft'}
                    </>
                  )}
                </button>

                {/* Cancel Editing - only shown when editing a draft */}
                {isEditingDraft && (
                  <button
                    onClick={() => {
                      resetAll();
                      setEditingEmail(null);
                      showInfoToast('Draft editing cancelled');
                    }}
                    className="w-full py-2.5 border border-slate-300 bg-white hover:bg-slate-50 rounded-lg text-sm font-medium text-slate-600 transition flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancel Editing
                  </button>
                )}

                {/* Delete Draft - only shown when editing a draft */}
                {isEditingDraft && draftId && (
                  <button
                    onClick={() => handleDeleteDraft(draftId)}
                    className="w-full py-2.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Draft
                  </button>
                )}

                {/* Reset/Clear Button */}
                <button
                  onClick={resetAll}
                  className="w-full py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Clear All
                </button>

                <div className="text-xs text-slate-400 text-center pt-1">
                  {totalRecipients > 0 
                    ? `${totalRecipients} recipient(s) ready${isEditingDraft ? ' (editing draft)' : ''}` 
                    : 'No recipients selected'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <EmailHistoryPanel 
            hospitalId={hospitalId}
            onSelectEmail={loadEmailForEditing}
            onEditEmail={loadEmailForEditing}
            onSendDraft={sendDraftById}
            onDeleteDraft={handleDeleteDraft}
            onDuplicateEmail={handleDuplicateEmail}
            onResendEmail={handleResendEmail}
            onArchiveEmail={handleArchiveEmail}
            // ✅ FIXED: Pass refetch function from the panel back up
            refetchEmails={(refetchFn) => setRefetchHistory(() => refetchFn)}
          />
        </div>
      )}
    </div>
  );
};

export default EmailComposer;