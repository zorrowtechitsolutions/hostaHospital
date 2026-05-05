// src/components/Settings/Notification.jsx - Refactored
import React, { useState } from 'react';
import { Button, Card, Switch } from '../ui';

const Notification = () => {
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    appointmentAlerts: true,
    subscriptionAlerts: false,
    securityAlerts: true,
    deviceLoginAlerts: false,
  });

  const [notificationMethod, setNotificationMethod] = useState('push');

  const handleToggle = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleMethodChange = (method) => setNotificationMethod(method);
  const handleSaveChanges = () => {
    console.log('Saved notification preferences:', { notifications, notificationMethod });
    alert('Notification preferences saved successfully!');
  };
  const handleCancel = () => {
    setNotifications({
      emailNotifications: true,
      appointmentAlerts: true,
      subscriptionAlerts: false,
      securityAlerts: true,
      deviceLoginAlerts: false,
    });
    setNotificationMethod('push');
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
    <Card>
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900">Preferences</h2>
        <p className="text-sm text-gray-500 mt-1">Manage your notification preferences</p>
      </div>
      <div className="p-6">
        <div className="mb-8">
          <h3 className="text-base font-semibold text-gray-900 mb-4">General Notifications</h3>
          <div className="space-y-3">
            {notificationItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2">
                <label className="text-sm font-medium text-gray-700 cursor-pointer">{item.label}</label>
                <Switch checked={notifications[item.id]} onChange={() => handleToggle(item.id)} />
              </div>
            ))}
          </div>
        </div>

        <div className="mb-8 pt-4 border-t border-gray-200">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Notification Delivery Method</h3>
          <div className="flex flex-row gap-4">
            {['push', 'email', 'sms'].map((method) => (
              <button
                key={method}
                onClick={() => handleMethodChange(method)}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  notificationMethod === method
                    ? 'bg-[#1C62A0] text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {method.charAt(0).toUpperCase() + method.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={handleCancel}>Cancel</Button>
          <Button variant="primary" onClick={handleSaveChanges}>Save Changes</Button>
        </div>
      </div>
    </Card>
  );
};

export default Notification;