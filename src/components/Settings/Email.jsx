// src/components/Settings/Email.jsx
import React, { useState, useCallback, useMemo } from 'react';
import { Card, Button, Input, Textarea, Tabs } from '../ui';

const EmailTemplates = () => {
  const [activeTemplate, setActiveTemplate] = useState('Appointment Confirmation');
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templates, setTemplates] = useState({
    'Appointment Confirmation': {
      subject: 'Appointment Confirmation - {appointment_date}',
      body: `Dear {patient_name},

Your appointment has been confirmed for {appointment_date} at {appointment_time} with Dr. {doctor_name}.

Please arrive 15 minutes before your scheduled time. If you need to reschedule, please contact us at least 24 hours in advance.

Best regards,
{hospital_name}`,
      tags: ['{patient_name}', '{appointment_date}', '{appointment_time}', '{doctor_name}', '{hospital_name}', '{appointment_id}']
    },
    'Medical Report Ready': {
      subject: 'Your Medical Report is Ready - {patient_name}',
      body: `Dear {patient_name},

Your medical report for the test conducted on {test_date} is now ready.

You can download your report using the link below:
{report_url}

If you have any questions about your results, please consult with Dr. {doctor_name}.

Best regards,
{hospital_name}`,
      tags: ['{patient_name}', '{test_name}', '{test_date}', '{report_url}', '{doctor_name}', '{hospital_name}']
    },
    'Hospital Admission Approval': {
      subject: 'Admission Approval - {patient_name}',
      body: `Dear {patient_name},

We are pleased to inform you that your admission request to {hospital_name} has been APPROVED.

Admission Details:
- Admission Date: {admission_date}
- Room Type: {room_type}
- Department: {department}

Please report to the admission desk on {admission_date} at {admission_time} for further procedures.

Best regards,
{hospital_name}`,
      tags: ['{patient_name}', '{admission_date}', '{admission_time}', '{room_type}', '{department}', '{hospital_name}', '{admission_id}']
    },
    'Hospital Cancelled Appointment': {
      subject: 'Appointment Cancellation Notice - {appointment_date}',
      body: `Dear {patient_name},

We regret to inform you that your appointment scheduled on {appointment_date} at {appointment_time} with Dr. {doctor_name} has been CANCELLED by the hospital due to unforeseen circumstances.

We sincerely apologize for any inconvenience caused. Our team will contact you shortly to reschedule your appointment at the earliest available slot.

For immediate assistance, please call us at {hospital_phone}.

Best regards,
{hospital_name}`,
      tags: ['{patient_name}', '{appointment_date}', '{appointment_time}', '{doctor_name}', '{hospital_name}', '{hospital_phone}', '{cancellation_reason}']
    },
    'Hospital Approved Appointment': {
      subject: 'Appointment Approved - {appointment_date}',
      body: `Dear {patient_name},

Great news! Your appointment request has been APPROVED by {hospital_name}.

Appointment Details:
- Date: {appointment_date}
- Time: {appointment_time}
- Doctor: Dr. {doctor_name}
- Location: {hospital_address}

Please bring your previous medical records and identification proof. Kindly arrive 15 minutes before your scheduled time.

Need help? Reply to this email or call us at {hospital_phone}.

Best regards,
{hospital_name}`,
      tags: ['{patient_name}', '{appointment_date}', '{appointment_time}', '{doctor_name}', '{hospital_name}', '{hospital_address}', '{hospital_phone}', '{appointment_id}']
    }
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ subject: '', body: '' });

  const templateList = useMemo(() => Object.keys(templates), [templates]);

  const handleEditClick = useCallback(() => {
    const template = templates[activeTemplate];
    setEditForm({ subject: template.subject, body: template.body });
    setEditingTemplate(activeTemplate);
    setIsEditing(true);
  }, [activeTemplate, templates]);

  const handleSave = useCallback(() => {
    setTemplates(prev => ({
      ...prev,
      [editingTemplate]: {
        ...prev[editingTemplate],
        subject: editForm.subject,
        body: editForm.body
      }
    }));
    setIsEditing(false);
    setEditingTemplate(null);
  }, [editingTemplate, editForm]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditingTemplate(null);
  }, []);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleResetToDefault = useCallback(() => {
    // Reset current template to default
    const defaultTemplates = {
      'Appointment Confirmation': {
        subject: 'Appointment Confirmation - {appointment_date}',
        body: `Dear {patient_name},\n\nYour appointment has been confirmed for {appointment_date} at {appointment_time} with Dr. {doctor_name}.\n\nPlease arrive 15 minutes before your scheduled time. If you need to reschedule, please contact us at least 24 hours in advance.\n\nBest regards,\n{hospital_name}`,
        tags: ['{patient_name}', '{appointment_date}', '{appointment_time}', '{doctor_name}', '{hospital_name}', '{appointment_id}']
      },
      'Medical Report Ready': {
        subject: 'Your Medical Report is Ready - {patient_name}',
        body: `Dear {patient_name},\n\nYour medical report for the test conducted on {test_date} is now ready.\n\nYou can download your report using the link below:\n{report_url}\n\nIf you have any questions about your results, please consult with Dr. {doctor_name}.\n\nBest regards,\n{hospital_name}`,
        tags: ['{patient_name}', '{test_name}', '{test_date}', '{report_url}', '{doctor_name}', '{hospital_name}']
      },
      'Hospital Admission Approval': {
        subject: 'Admission Approval - {patient_name}',
        body: `Dear {patient_name},\n\nWe are pleased to inform you that your admission request to {hospital_name} has been APPROVED.\n\nAdmission Details:\n- Admission Date: {admission_date}\n- Room Type: {room_type}\n- Department: {department}\n\nPlease report to the admission desk on {admission_date} at {admission_time} for further procedures.\n\nBest regards,\n{hospital_name}`,
        tags: ['{patient_name}', '{admission_date}', '{admission_time}', '{room_type}', '{department}', '{hospital_name}', '{admission_id}']
      },
      'Hospital Cancelled Appointment': {
        subject: 'Appointment Cancellation Notice - {appointment_date}',
        body: `Dear {patient_name},\n\nWe regret to inform you that your appointment scheduled on {appointment_date} at {appointment_time} with Dr. {doctor_name} has been CANCELLED by the hospital due to unforeseen circumstances.\n\nWe sincerely apologize for any inconvenience caused. Our team will contact you shortly to reschedule your appointment at the earliest available slot.\n\nFor immediate assistance, please call us at {hospital_phone}.\n\nBest regards,\n{hospital_name}`,
        tags: ['{patient_name}', '{appointment_date}', '{appointment_time}', '{doctor_name}', '{hospital_name}', '{hospital_phone}', '{cancellation_reason}']
      },
      'Hospital Approved Appointment': {
        subject: 'Appointment Approved - {appointment_date}',
        body: `Dear {patient_name},\n\nGreat news! Your appointment request has been APPROVED by {hospital_name}.\n\nAppointment Details:\n- Date: {appointment_date}\n- Time: {appointment_time}\n- Doctor: Dr. {doctor_name}\n- Location: {hospital_address}\n\nPlease bring your previous medical records and identification proof. Kindly arrive 15 minutes before your scheduled time.\n\nNeed help? Reply to this email or call us at {hospital_phone}.\n\nBest regards,\n{hospital_name}`,
        tags: ['{patient_name}', '{appointment_date}', '{appointment_time}', '{doctor_name}', '{hospital_name}', '{hospital_address}', '{hospital_phone}', '{appointment_id}']
      }
    };
    
    setTemplates(prev => ({
      ...prev,
      [activeTemplate]: defaultTemplates[activeTemplate]
    }));
  }, [activeTemplate]);

  const currentTemplate = templates[activeTemplate];

  return (
    <div className="space-y-6">
      <Card>
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Email Templates</h2>
          <p className="text-sm text-gray-500">Manage email templates for automated communications</p>
        </div>
        
        <div className="p-6">
          <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-4">
            {templateList.map(template => (
              <button
                key={template}
                onClick={() => {
                  setActiveTemplate(template);
                  setIsEditing(false);
                }}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTemplate === template
                    ? 'bg-[#1C62A0] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {template}
              </button>
            ))}
          </div>

          {currentTemplate && !isEditing ? (
            <div className="space-y-6">
              {/* Email Subject Preview */}
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Subject</label>
                <div className="bg-white p-3 rounded border border-gray-200 font-medium">
                  {currentTemplate.subject}
                </div>
              </div>

              {/* Email Body Preview */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Body</label>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                    <span className="text-xs text-gray-500">Preview</span>
                  </div>
                  <div className="p-4 whitespace-pre-wrap font-mono text-sm">
                    {currentTemplate.body}
                  </div>
                </div>
              </div>

              {/* Available Tags */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <label className="block text-sm font-medium text-blue-800 mb-2">Available Tags</label>
                <div className="flex flex-wrap gap-2">
                  {currentTemplate.tags.map(tag => (
                    <code key={tag} className="px-2 py-1 bg-white rounded text-sm text-[#1C62A0] border border-blue-200">
                      {tag}
                    </code>
                  ))}
                </div>
                <p className="text-xs text-[#1C62A0] mt-3">
                  Use these tags in your email subject and body. They will be automatically replaced with actual values when sending emails.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <Button variant="primary" onClick={handleEditClick}>Edit Template</Button>
                <Button variant="outline" onClick={handleResetToDefault}>Reset to Default</Button>
              </div>
            </div>
          ) : currentTemplate && isEditing ? (
            <div className="space-y-6">
              {/* Edit Email Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Subject
                </label>
                <Input
                  name="subject"
                  value={editForm.subject}
                  onChange={handleInputChange}
                  placeholder="Email subject line"
                  className="w-full"
                />
              </div>

              {/* Edit Email Body */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Body
                </label>
                <Textarea
                  name="body"
                  value={editForm.body}
                  onChange={handleInputChange}
                  rows={12}
                  placeholder="Email body content..."
                  className="w-full font-mono text-sm"
                />
              </div>

              {/* Available Tags in Edit Mode */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <label className="block text-sm font-medium text-[#1C62A0] mb-2">Available Tags</label>
                <div className="flex flex-wrap gap-2">
                  {currentTemplate.tags.map(tag => (
                    <code 
                      key={tag} 
                      className="px-2 py-1 bg-white rounded text-sm text-[#1C62A0] border border-blue-200 cursor-pointer hover:bg-[#8a949c] transition-colors"
                      onClick={() => {
                        setEditForm(prev => ({
                          ...prev,
                          body: prev.body + tag
                        }));
                      }}
                    >
                      {tag}
                    </code>
                  ))}
                </div>
                <p className="text-xs text-[#1C62A0] mt-3">
                  Click on any tag to insert it into the email body.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <Button variant="primary" onClick={handleSave}>Save Changes</Button>
                <Button variant="outline" onClick={handleCancel}>Cancel</Button>
              </div>
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
};

export default EmailTemplates;