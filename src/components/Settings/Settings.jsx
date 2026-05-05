// src/components/Settings/Settings.jsx - Refactored
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Button, Card, Input, Tabs } from '../ui';
import Security from './Security';
import Preference from './Preference';
import Notification from './Notification';
import UserPermissions from './UserPermissions';
import Billing from './Billing';
import Map from './Map';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('General');
  const location = useLocation();

  const [hospitalInfo, setHospitalInfo] = useState({
    name: 'AL ABEER HOSPITAL KIZHISSERI',
    email: 'alabeerh@gmail.com',
    createdDate: 'N/A',
    lastUpdated: 'November 30, 2025 at 12:54 PM',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: hospitalInfo.name, email: hospitalInfo.email });

  useEffect(() => {
    if (location.state?.tab) setActiveTab(location.state.tab);
  }, [location]);

  const handleEditSubmit = useCallback((e) => {
    e.preventDefault();
    const now = new Date();
    const formattedDate = now.toLocaleString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true
    });
    setHospitalInfo(prev => ({ ...prev, name: editForm.name, email: editForm.email, lastUpdated: formattedDate }));
    setIsEditing(false);
  }, [editForm.name, editForm.email]);

  const handleEditClick = useCallback(() => {
    setEditForm({ name: hospitalInfo.name, email: hospitalInfo.email });
    setIsEditing(true);
  }, [hospitalInfo.name, hospitalInfo.email]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleCancelEdit = useCallback(() => setIsEditing(false), []);

  const tabs = useMemo(() => ['General', 'Security', 'Preferences', 'Notifications', 'User Permissions', 'Map'], []);

  const GeneralTab = useMemo(() => (
    <div className="space-y-8">
      <Card>
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Account Settings</h2>
          <p className="text-sm text-gray-500">Update your hospital account information</p>
        </div>
        <div className="p-6">
          {!isEditing ? (
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700">Hospital Name</label><p className="mt-1 text-gray-900 font-medium">{hospitalInfo.name}</p></div>
              <div><label className="block text-sm font-medium text-gray-700">Email Address</label><p className="mt-1 text-gray-900">{hospitalInfo.email}</p></div>
              <Button variant="primary" onClick={handleEditClick}>Edit Settings</Button>
            </div>
          ) : (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <Input label="Hospital Name" name="name" value={editForm.name} onChange={handleInputChange} required />
              <Input label="Email Address" name="email" type="email" value={editForm.email} onChange={handleInputChange} required />
              <div className="flex space-x-3">
                <Button type="submit" variant="primary">Save Changes</Button>
                <Button type="button" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
              </div>
            </form>
          )}
        </div>
      </Card>

      <Card>
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Account Information</h2>
          <p className="text-sm text-gray-500">Your account details</p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-500">Account Created:</span>
              <span className="text-gray-900">{hospitalInfo.createdDate}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2">
              <span className="text-sm font-medium text-gray-500">Last Updated:</span>
              <span className="text-gray-900">{hospitalInfo.lastUpdated}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  ), [isEditing, hospitalInfo, editForm, handleEditClick, handleEditSubmit, handleInputChange, handleCancelEdit]);

  const renderTabContent = useCallback(() => {
    switch (activeTab) {
      case 'General': return GeneralTab;
      case 'Security': return <Security />;
      case 'Preferences': return <Preference />;
      case 'Notifications': return <Notification />;
      case 'User Permissions': return <UserPermissions />;
      case 'Map': return <Map />;
      // case 'Billing': return <Billing />;
      default: return null;
    }
  }, [activeTab, GeneralTab]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1">Manage your account settings</p>
        </div>
        
        <Tabs tabs={tabs.map(tab => ({ id: tab, label: tab }))} activeTab={activeTab} onTabChange={setActiveTab} className="mb-6" />
        
        <div className="mt-6">{renderTabContent()}</div>
        
        <div className="mt-12 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-400">© DreamS EMR - All Rights Reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;