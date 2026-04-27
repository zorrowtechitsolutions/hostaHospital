import React, { useState } from 'react';

const Preference = () => {
  // State for each preference toggle
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

  const handleToggle = (key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSaveChanges = () => {
    console.log('Saved preferences:', preferences);
    alert('Preferences saved successfully!');
   // Here you would typically save to backend
  };

  const handleCancel = () => {
    // Reset to original state or just close
    console.log('Changes cancelled');
    alert('Changes cancelled');
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
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900">Preferences</h2>
        <p className="text-sm text-gray-500 mt-1">Manage your module preferences</p>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {preferenceItems.map((item) => (
            <div 
              key={item.id}
              className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <label 
                htmlFor={item.id}
                className="text-sm font-medium text-gray-700 cursor-pointer"
              >
                {item.label}
              </label>
              <button
                type="button"
                onClick={() => handleToggle(item.id)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#1C62A0] focus:ring-offset-2 ${
                  preferences[item.id] ? 'bg-[#1C62A0]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    preferences[item.id] ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
        
        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={handleCancel}
            className="px-5 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveChanges}
            className="px-5 py-2 text-white bg-[#1C62A0] rounded-lg hover:bg-[#1C62A0] transition-colors font-medium shadow-sm"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default Preference;