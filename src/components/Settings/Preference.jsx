// src/components/Settings/Preference.jsx - With toast notifications
import React, { useState } from 'react';
import { Button, Card, Switch } from '../ui';
import { showSuccessToast, showWarningToast, showInfoToast } from '../ui/Toast';

const Preference = () => {
  const [preferences, setPreferences] = useState({
    patients: true,
    doctors: true,
    visits: false,
    appointments: true,
    laboratory: false,
    labResults: true,
    medicalRecords: false,
    pharmacy: true,
    staffs: false,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = (key) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    showInfoToast(`${key} module ${!preferences[key] ? 'enabled' : 'disabled'}`, 2000);
  };
  
  const handleSaveChanges = () => {
    setIsSaving(true);
    setTimeout(() => {
      const enabledCount = Object.values(preferences).filter(v => v === true).length;
      const totalCount = Object.keys(preferences).length;
      
      showSuccessToast(
        'Preferences saved successfully!',
        4000,
        {
          'Enabled Modules': `${enabledCount}/${totalCount}`,
          'Updated': new Date().toLocaleTimeString()
        }
      );
      setIsSaving(false);
    }, 500);
  };
  
  const handleCancel = () => {
    showWarningToast('Changes cancelled. Original preferences restored.', 3000);
  };

  const preferenceItems = [
    { id: 'patients', label: 'Patients' },
    { id: 'doctors', label: 'Doctors' },
    { id: 'visits', label: 'Visits' },
    { id: 'appointments', label: 'Appointments' },
    { id: 'laboratory', label: 'Laboratory' },
    { id: 'labResults', label: 'Lab Results' },
    { id: 'medicalRecords', label: 'Medical Records' },
    { id: 'pharmacy', label: 'Pharmacy' },
    { id: 'staffs', label: 'Staffs' },
  ];

  return (
    <Card>
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900">Preferences</h2>
        <p className="text-sm text-gray-500 mt-1">Manage your module preferences</p>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {preferenceItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <label className="text-sm font-medium text-gray-700 cursor-pointer">{item.label}</label>
              <Switch checked={preferences[item.id]} onChange={() => handleToggle(item.id)} />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
          <Button variant="outline" onClick={handleCancel}>Cancel</Button>
          <Button variant="primary" onClick={handleSaveChanges} disabled={isSaving} loading={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default Preference;