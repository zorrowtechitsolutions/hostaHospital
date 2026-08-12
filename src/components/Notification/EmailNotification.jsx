// EmailComposer.js
// Complete email composer with enhanced draft workflow UI/UX and rich text editor

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  Paperclip,
  ChevronDown,
} from 'lucide-react';
import { useGetRolesQuery } from '../../../app/service/role';
import { getHospitalId } from '../../utils/auth';
import { useGetDoctorsQuery } from '../../../app/service/doctorApi';
import { useGetStaffQuery } from '../../../app/service/staffApi';
import { useGetTemplatesQuery } from '../../../app/service/emailtemplate';
import { 
  useSendEmailMutation,
  useSaveDraftMutation,
  useSendDraftMutation,
  useUpdateDraftMutation,
  useDeleteDraftMutation,
  useDuplicateEmailMutation,
  useResendEmailMutation,
  useArchiveEmailMutation,
  useUnarchiveEmailMutation,
} from '../../../app/service/emailnotification';
import { showErrorToast, showSuccessToast, showInfoToast } from '../ui/Toast';
import { Button } from '../ui/button'; // Import Button component

// ============================================
// SKELETON LOADING COMPONENTS
// ============================================

const EmailComposerSkeleton = () => {
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-7 w-48 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6 border-b border-slate-200">
        <div className="h-10 w-24 bg-gray-200 rounded-t animate-pulse"></div>
        <div className="h-10 w-32 bg-gray-200 rounded-t animate-pulse"></div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="h-5 w-36 bg-gray-200 rounded animate-pulse"></div>
                <div className="ml-auto h-5 w-24 bg-gray-200 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-6 mb-4">
                <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="p-3 bg-slate-50 border-b border-slate-200">
                  <div className="h-9 w-full bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
                <div className="overflow-x-auto max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        {[1, 2, 3, 4].map((_, i) => (
                          <th key={i} className="px-4 py-2.5">
                            <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[...Array(4)].map((_, i) => (
                        <tr key={i}>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="h-5 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                          </td>
                          <td className="px-4 py-2.5 hidden md:table-cell">
                            <div className="h-4 w-28 bg-gray-200 rounded animate-pulse"></div>
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <div className="w-5 h-5 bg-gray-200 rounded border-2 inline-block animate-pulse"></div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-1.5"></div>
                <div className="h-11 w-full bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="h-4 w-28 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 w-48 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
              <div>
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-1.5"></div>
                <div className="border border-slate-300 rounded-lg overflow-hidden">
                  <div className="bg-slate-50 px-3 py-1.5 border-b border-slate-200">
                    <div className="flex gap-3">
                      <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                  <div className="h-32 w-full bg-gray-100 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50">
              <div className="h-4 w-28 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
              <div className="h-4 w-36 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="p-4 max-h-48 overflow-y-auto">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-2 text-sm p-1.5 rounded-lg mb-1.5">
                  <div className="w-5 h-5 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse ml-auto"></div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50">
              <div className="h-4 w-28 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="p-4">
              <div className="bg-slate-50 rounded-lg p-3 space-y-1.5">
                {[1, 2, 3].map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
                <div className="pt-2 border-t border-slate-200">
                  <div className="h-20 w-full bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50">
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="p-4 space-y-3">
              <div className="h-11 w-full bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="h-11 w-full bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="h-11 w-full bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN EMAIL COMPOSER COMPONENT
// ============================================

const EmailComposer = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
  const [editingEmail, setEditingEmail] = useState(null);

  // Editor refs
  const editorRef = useRef(null);
  const savedSelectionRef = useRef(null);
  const fileInputRef = useRef(null);

  const hospitalId = getHospitalId();

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

  const [sendEmailApi] = useSendEmailMutation();
  const [saveDraftApi] = useSaveDraftMutation();
  const [sendDraftApi] = useSendDraftMutation();
  const [updateDraftApi] = useUpdateDraftMutation();
  const [deleteDraftApi] = useDeleteDraftMutation();
  const [duplicateEmailApi] = useDuplicateEmailMutation();
  const [resendEmailApi] = useResendEmailMutation();
  const [archiveEmailApi] = useArchiveEmailMutation();
  const [unarchiveEmailApi] = useUnarchiveEmailMutation();

  const isLoading = doctorsLoading || staffLoading || rolesLoading || templatesLoading;

  // Define doctors and staff after the queries
  const doctors = doctorsData?.data || doctorsData || [];
  const staff = staffData?.data || staffData || [];
  const roles = rolesData?.data || rolesData?.admin || [];
  const templates = templatesData?.data || templatesData || [];

  // Save and restore selection functions
  const saveSelection = () => {
    const selection = window.getSelection();
    if (
      selection &&
      selection.rangeCount > 0 &&
      editorRef.current?.contains(selection.anchorNode)
    ) {
      savedSelectionRef.current = selection.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    const selection = window.getSelection();
    if (selection && savedSelectionRef.current) {
      selection.removeAllRanges();
      selection.addRange(savedSelectionRef.current);
    }
  };

  // Format text using execCommand
  const formatText = (command, value = null) => {
    editorRef.current?.focus();
    restoreSelection();
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setMessage(editorRef.current.innerHTML);
    }
  };

  // Handle editor input changes
  const handleEditorInput = () => {
    if (editorRef.current) {
      setMessage(editorRef.current.innerHTML);
    }
  };

  // Handle file attachment selection
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    saveSelection();
    editorRef.current?.focus();
    restoreSelection();

    const fileName = file.name;
    document.execCommand(
      "insertHTML",
      false,
      `<span
        data-file-name="${fileName}"
        data-file-type="${file.type}"
        class="email-attachment"
      >
        📎 ${fileName}
      </span>&nbsp;`
    );

    if (editorRef.current) {
      setMessage(editorRef.current.innerHTML);
    }

    e.target.value = "";
  };

  // Load email for editing
  const loadEmailForEditing = (email) => {
    if (!email) return;

    setEditingEmail(email);
    setDraftId(email.id);

    setSubject(email.subject || '');
    setMessage(email.message || '');
    setSelectedTemplateId(email.templateId || '');

    // Update editor content
    requestAnimationFrame(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = email.message || '';
      }
    });

    const recipients = Array.isArray(email.recipients)
      ? email.recipients
      : [];

    const doctorIds = [];
    const staffIds = [];

    recipients.forEach((recipient) => {
      if (Array.isArray(recipient.userIds)) {
        recipient.userIds.forEach((userId) => {
          const numericId = Number(userId);

          const isDoctor = doctors.some(
            (doctor) => Number(doctor.id) === numericId
          );

          if (isDoctor) {
            doctorIds.push(numericId);
          } else {
            staffIds.push(numericId);
          }
        });
      }
    });

    setSelectedDoctors(doctorIds);
    setSelectedStaff(staffIds);

    showInfoToast(
      `Editing draft: "${email.subject || 'No subject'}"`
    );
  };

  // Load email from navigation state
  useEffect(() => {
    const emailToEdit = location.state?.editEmail;

    if (!emailToEdit) return;
    if (!doctors.length && !staff.length) return;

    loadEmailForEditing(emailToEdit);

    // Remove the navigation state so refresh/back doesn't reopen the draft
    navigate(location.pathname, {
      replace: true,
      state: null,
    });
  }, [
    location.state,
    doctors,
    staff,
    navigate,
    location.pathname,
  ]);

  if (isLoading) {
    return <EmailComposerSkeleton />;
  }

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
    setEditingEmail(null);
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
    }
  };

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
        // Update editor content
        requestAnimationFrame(() => {
          if (editorRef.current) {
            editorRef.current.innerHTML = selectedTemplate.message;
          }
        });
      }
    }
  };

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

    } catch (error) {
      const errorMessage = error?.data?.message || error?.message || 'Failed to save draft.';
      showErrorToast(errorMessage);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const sendDraftById = async (id) => {
    if (!id) {
      showErrorToast('No draft ID provided.');
      return;
    }

    const isCurrentDraft = draftId === id;

    try {
      await sendDraftApi({
        id: id,
      }).unwrap();
      
      showSuccessToast('Email sent successfully!');
      
      if (isCurrentDraft) {
        resetAll();
      }
      
    } catch (error) {
      const errorMessage = error?.data?.message || error?.message || 'Failed to send draft.';
      showErrorToast(errorMessage);
    }
  };

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
      };

      await sendEmailApi(emailPayload).unwrap();
      showSuccessToast(`Email sent successfully to ${recipients.length} recipient(s)!`);
      resetAll();

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

  const handleDeleteDraft = async (id) => {
    if (!window.confirm('Are you sure you want to delete this draft?')) return;
    
    try {
      await deleteDraftApi(id).unwrap();
      showSuccessToast('Draft deleted successfully!');
      
      if (draftId === id) {
        resetAll();
      }
    } catch (error) {
      showErrorToast(error?.data?.message || 'Failed to delete draft.');
    }
  };

  const handleDuplicateEmail = async (id) => {
    try {
      const result = await duplicateEmailApi(id).unwrap();
      showSuccessToast('Email duplicated successfully!');
      
      if (result.data && result.data.status === 'draft') {
        loadEmailForEditing(result.data);
      }
    } catch (error) {
      showErrorToast(error?.data?.message || 'Failed to duplicate email.');
    }
  };

  const handleResendEmail = async (id) => {
    try {
      await resendEmailApi({ id }).unwrap();
      showSuccessToast('Email resent successfully!');
    } catch (error) {
      showErrorToast(error?.data?.message || 'Failed to resend email.');
    }
  };

  const handleArchiveEmail = async (id) => {
    try {
      await archiveEmailApi(id).unwrap();
      showSuccessToast('Email archived successfully!');
    } catch (error) {
      showErrorToast(error?.data?.message || 'Failed to archive email.');
    }
  };

  const handleUnarchiveEmail = async (id) => {
    try {
      await unarchiveEmailApi(id).unwrap();
      showSuccessToast('Email unarchived successfully!');
    } catch (error) {
      showErrorToast(error?.data?.message || 'Failed to unarchive email.');
    }
  };

  const totalRecipients = selectedDoctors.length + selectedStaff.length;
  const selectedDoctorObjects = doctors.filter(d => selectedDoctors.includes(Number(d.id)));
  const selectedStaffObjects = staff.filter(s => selectedStaff.includes(Number(s.id)));

  const isEditingDraft = !!draftId || !!editingEmail;

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
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="text-2xl font-semibold text-slate-800 flex items-center gap-2">
          <span>✉️</span> Email Composer
        </h1>
        <div className="flex items-center gap-3">
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

      {/* Navigation Bar - Compose Only with View History Button */}
      <div className="flex items-center justify-between mb-6 border-b border-slate-200">
        <button
          onClick={() => navigate('/email-history')}
          className="ml-auto px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition flex items-center gap-2 hover:bg-slate-50 rounded-t-lg"
        >
          <span>📋</span> View History
        </button>
      </div>

      {/* Compose Content */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Recipients Selection */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-indigo-600 bg-indigo-100 px-2.5 py-0.5 rounded-full">1</span>
                <h2 className="text-base font-semibold text-slate-700">Select Recipients</h2>
                <span className="ml-auto text-xs text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                  {doctors.length + staff.length} total users
                </span>
              </div>
            </div>

            <div className="p-5">
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

          {/* Compose Email */}
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

            {/* Email content area with proper p-5 wrapper */}
            <div className="p-5 space-y-4">
              {/* Email Template */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email Template
                </label>

                <div className="flex items-center gap-3">
                  <select
                    value={selectedTemplateId}
                    onChange={handleTemplateSelect}
                    className="
                      w-full
                      border border-slate-300
                      rounded-lg
                      px-4 py-2.5
                      text-sm
                      text-slate-700
                      bg-white
                      focus:outline-none
                      focus:ring-2
                      focus:ring-indigo-400
                      focus:border-transparent
                    "
                  >
                    <option value="">-- Select Template --</option>

                    {templates.length > 0 ? (
                      templates.map((template) => {
                        const id = template.id || template._id;

                        return (
                          <option key={id} value={id}>
                            {template.templateName}
                            {template.category
                              ? ` (${template.category})`
                              : ""}
                          </option>
                        );
                      })
                    ) : (
                      <option value="" disabled>
                        No templates available
                      </option>
                    )}
                  </select>

                  {selectedTemplateId && (
                    <span className="
                      shrink-0
                      text-xs
                      text-emerald-600
                      bg-emerald-50
                      border border-emerald-200
                      px-2.5 py-1.5
                      rounded-full
                      whitespace-nowrap
                    ">
                      Applied: {getSelectedTemplateName()}
                    </span>
                  )}
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Subject <span className="text-red-500">*</span>
                </label>

                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="
                    w-full
                    border border-slate-300
                    rounded-lg
                    px-4 py-2.5
                    text-sm
                    focus:outline-none
                    focus:ring-2
                    focus:ring-indigo-400
                    focus:border-transparent
                  "
                  placeholder="Enter subject..."
                  required
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Message <span className="text-red-500">*</span>
                </label>

                {/* Rich Text Editor */}
                <div className="border border-slate-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-400">
                  {/* Rich Text Toolbar */}
                  <div className="h-11 px-3 flex items-center gap-4 border-b border-slate-200 bg-slate-50">
                    <span className="text-xs font-medium text-slate-600">Paragraph</span>
                    <ChevronDown size={14} className="text-slate-400" />
                    <div className="w-px h-5 bg-slate-200" />

                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        saveSelection();
                        formatText("bold");
                      }}
                      className="text-slate-600 hover:text-indigo-600"
                      title="Bold"
                    >
                      <Bold size={16} />
                    </button>

                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        saveSelection();
                        formatText("italic");
                      }}
                      className="text-slate-600 hover:text-indigo-600"
                      title="Italic"
                    >
                      <Italic size={16} />
                    </button>

                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        saveSelection();
                        formatText("underline");
                      }}
                      className="text-slate-600 hover:text-indigo-600"
                      title="Underline"
                    >
                      <Underline size={16} />
                    </button>

                    <div className="w-px h-5 bg-slate-200" />

                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        saveSelection();
                        formatText("insertUnorderedList");
                      }}
                      className="text-slate-600 hover:text-indigo-600"
                      title="Bullet list"
                    >
                      <List size={16} />
                    </button>

                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        saveSelection();
                        formatText("insertOrderedList");
                      }}
                      className="text-slate-600 hover:text-indigo-600"
                      title="Numbered list"
                    >
                      <ListOrdered size={16} />
                    </button>

                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        saveSelection();
                        formatText("justifyLeft");
                      }}
                      className="text-slate-600 hover:text-indigo-600"
                      title="Align left"
                    >
                      <AlignLeft size={16} />
                    </button>

                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        saveSelection();
                        fileInputRef.current?.click();
                      }}
                      className="text-slate-600 hover:text-indigo-600"
                      title="Attach file"
                    >
                      <Paperclip size={16} />
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>

                  {/* Rich Text Editor */}
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={handleEditorInput}
                    className="
                      w-full
                      min-h-[280px]
                      px-4
                      py-3
                      text-sm
                      text-slate-700
                      outline-none
                      overflow-y-auto

                      [&_ul]:list-disc
                      [&_ul]:pl-6
                      [&_ul]:my-2

                      [&_ol]:list-decimal
                      [&_ol]:pl-6
                      [&_ol]:my-2

                      [&_li]:my-1

                      [&_a]:text-indigo-600
                      [&_a]:underline

                      [&_img]:max-w-full
                      [&_img]:h-auto

                      [&_.email-attachment]:inline-block
                      [&_.email-attachment]:bg-slate-100
                      [&_.email-attachment]:text-slate-700
                      [&_.email-attachment]:px-2
                      [&_.email-attachment]:py-1
                      [&_.email-attachment]:rounded
                      [&_.email-attachment]:text-xs
                      [&_.email-attachment]:font-medium
                      [&_.email-attachment]:border
                      [&_.email-attachment]:border-slate-200
                    "
                    style={{ maxHeight: "500px" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-5">
          {/* Email Summary */}
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

          {/* Selected Recipients */}
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

          {/* Email Preview */}
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

          {/* Actions */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50">
              <h3 className="text-sm font-semibold text-slate-700">Actions</h3>
            </div>
            <div className="p-4 space-y-3">
              {/* Send Email Button - Using Button component with green gradient */}
              <Button
                onClick={sendEmail}
                variant="primary"
                size="lg"
                fullWidth
                loading={isSending}
                disabled={isSending || totalRecipients === 0 || !subject.trim() || !message.trim()}
                leftIcon={
                  !isSending && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  )
                }
              >
                {isEditingDraft ? 'Send Draft' : 'Send Email'}
              </Button>

              {/* Save Draft Button */}
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
    </div>
  );
};

export default EmailComposer;