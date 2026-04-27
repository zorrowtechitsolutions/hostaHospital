import React, { useState } from 'react';

const Notification = () => {
  // State for notification toggles
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    appointmentAlerts: true,
    subscriptionAlerts: false,
    securityAlerts: true,
    deviceLoginAlerts: false,
  });

  // State for selected notification method
  const [notificationMethod, setNotificationMethod] = useState('push');

  const handleToggle = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleMethodChange = (method) => {
    setNotificationMethod(method);
  };

  const handleSaveChanges = () => {
    console.log('Saved notification preferences:', {
      notifications,
      notificationMethod
    });
    alert('Notification preferences saved successfully!');
  };

  const handleCancel = () => {
    // Reset to initial state
    setNotifications({
      emailNotifications: true,
      appointmentAlerts: true,
      subscriptionAlerts: false,
      securityAlerts: true,
      deviceLoginAlerts: false,
    });
    setNotificationMethod('push');
    console.log('Changes cancelled');
    alert('Changes cancelled');
  };

  const notificationItems = [
    { id: 'emailNotifications', label: 'Email Notifications' },
    { id: 'appointmentAlerts', label: 'Appointment Alerts' },
    { id: 'subscriptionAlerts', label: 'Subscription Alerts' },
    { id: 'securityAlerts', label: 'Security Alerts' },
    { id: 'deviceLoginAlerts', label: 'Device Login Alerts' },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900">Preferences</h2>
        <p className="text-sm text-gray-500 mt-1">Manage your notification preferences</p>
      </div>
      
      <div className="p-6">
        {/* General Notifications Section */}
        <div className="mb-8">
          <h3 className="text-base font-semibold text-gray-900 mb-4">General Notifications</h3>
          <div className="space-y-3">
            {notificationItems.map((item) => (
              <div 
                key={item.id}
                className="flex items-center justify-between py-2"
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
                    notifications[item.id] ? 'bg-[#1C62A0]' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      notifications[item.id] ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Notification Method Section - Row layout like second image */}
        <div className="mb-8 pt-4 border-t border-gray-200">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Notification Delivery Method</h3>
          <div className="flex flex-row gap-4">
            <button
              onClick={() => handleMethodChange('push')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                notificationMethod === 'push'
                  ? 'bg-[#1C62A0] text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Push
            </button>
            <button
              onClick={() => handleMethodChange('email')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                notificationMethod === 'email'
                  ? 'bg-[#1C62A0] text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Email
            </button>
            <button
              onClick={() => handleMethodChange('sms')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                notificationMethod === 'sms'
                  ? 'bg-[#1C62A0] text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              SMS
            </button>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
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

export default Notification;