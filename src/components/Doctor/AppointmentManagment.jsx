// src/components/Doctor/AppointmentManagement.jsx
import React, { useState, useEffect } from 'react';
import { Clock, X, Save, Settings, Users, Calendar, AlertCircle } from 'lucide-react';

const AppointmentManagement = ({ isOpen, onClose, onSave, doctor = null }) => {
  const [selectionType, setSelectionType] = useState('manual_count');
  const [autoDeclineMinutes, setAutoDeclineMinutes] = useState(5);
  const [manualCount, setManualCount] = useState(10);

  useEffect(() => {
    if (doctor && doctor.id) {
      const savedSettings = JSON.parse(localStorage.getItem('appointmentSettings') || '{}');
      const settings = savedSettings[doctor.id];
      if (settings) {
        setSelectionType(settings.selectionType || 'manual_count');
        setAutoDeclineMinutes(settings.autoDeclineMinutes || 5);
        setManualCount(settings.manualCount || 10);
      }
    }
  }, [doctor]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      selectionType,
      autoDeclineMinutes,
      manualCount,
      doctorId: doctor?.id,
      doctorName: doctor?.name
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-gray-600" />
            <h2 className="text-md font-semibold text-gray-800">Appointment Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 transition-colors"
          >
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {/* Doctor Name */}
          {doctor && (
            <div className="mb-4 pb-3 border-b border-gray-100">
              <p className="text-sm text-gray-600">
                <span className="font-medium">{doctor.name}</span> • {doctor.specialty}
              </p>
            </div>
          )}

          {/* Section Title */}
          <p className="text-xs text-gray-500 mb-3">Choose how to manage appointment bookings</p>

          {/* Option 1 - Auto Decline */}
          <label className="flex items-start gap-3 py-2 cursor-pointer">
            <input
              type="radio"
              name="bookingType"
              value="auto_decline"
              checked={selectionType === 'auto_decline'}
              onChange={(e) => setSelectionType(e.target.value)}
              className="w-4 h-4 text-[#1C62A0] mt-0.5"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-gray-400" />
                <span className="text-sm font-medium text-gray-800">Auto Decline</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Automatically decline pending bookings after set time
              </p>
            </div>
          </label>

          {/* Option 2 - Manual Count Limit */}
          <label className="flex items-start gap-3 py-2 cursor-pointer mt-2">
            <input
              type="radio"
              name="bookingType"
              value="manual_count"
              checked={selectionType === 'manual_count'}
              onChange={(e) => setSelectionType(e.target.value)}
              className="w-4 h-4 text-[#1C62A0] mt-0.5"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-gray-400" />
                <span className="text-sm font-medium text-gray-800">Manual Count Limit</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Set maximum number of bookings allowed per day
              </p>
            </div>
          </label>

          {/* Dynamic Configuration Section */}
          {selectionType === 'auto_decline' && (
            <div className="mt-5 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <Clock size={14} className="text-gray-500" />
                <h4 className="text-sm font-medium text-gray-700">Auto Decline Configuration</h4>
              </div>
              
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Auto Decline Time (Minutes)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="1440"
                    value={autoDeclineMinutes}
                    onChange={(e) => setAutoDeclineMinutes(parseInt(e.target.value) || 1)}
                    className="w-24 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#3676ae]"
                  />
                  <span className="text-xs text-gray-500">minutes</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Time before pending bookings are automatically declined
                </p>
              </div>

              <div className="mt-3 p-2 bg-gray-50 rounded border border-gray-100">
                <div className="flex items-center gap-2">
                  <AlertCircle size={12} className="text-gray-400" />
                  <p className="text-xs text-gray-600">
                    Current: <span className="font-medium">{autoDeclineMinutes} minutes</span> auto-decline
                  </p>
                </div>
              </div>
            </div>
          )}

          {selectionType === 'manual_count' && (
            <div className="mt-5 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <Users size={14} className="text-gray-500" />
                <h4 className="text-sm font-medium text-gray-700">Manual Count Configuration</h4>
              </div>
              
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Maximum Bookings per Day
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={manualCount}
                    onChange={(e) => setManualCount(parseInt(e.target.value) || 1)}
                    className="w-24 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#3676ae]"
                  />
                  <span className="text-xs text-gray-500">appointments per day</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Maximum number of appointments that can be booked per day
                </p>
              </div>

              <div className="mt-3 p-2 bg-gray-50 rounded border border-gray-100">
                <div className="flex items-center gap-2">
                  <AlertCircle size={12} className="text-gray-400" />
                  <p className="text-xs text-gray-600">
                    Current: Maximum <span className="font-medium">{manualCount} appointments</span> allowed per day
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1.5 text-xs font-medium text-white bg-[#1C62A0] rounded hover:bg-[#6b97bd] transition-colors flex items-center gap-1"
          >
            <Save size={12} />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentManagement;