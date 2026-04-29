import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Security from './Security';
import Preference from './Preference';
import Notification from './Notification';
import UserPermissions from './UserPermissions';
import Billing from './Billing';
import { useLocation } from 'react-router-dom';
import Map from './Map'; // Import the Map component

const Settings = () => {
  const [activeTab, setActiveTab] = useState('General');
  const location = useLocation();

  // Account info state
  const [hospitalInfo, setHospitalInfo] = useState({
    name: 'AL ABEER HOSPITAL KIZHISSERI',
    email: 'alabeerh@gmail.com',
    createdDate: 'N/A',
    lastUpdated: 'November 30, 2025 at 12:54 PM',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: hospitalInfo.name, email: hospitalInfo.email });

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location]);

  const handleEditSubmit = useCallback((e) => {
    e.preventDefault();
    const now = new Date();
    const formattedDate = now.toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
    setHospitalInfo(prev => ({ 
      ...prev, 
      name: editForm.name, 
      email: editForm.email,
      lastUpdated: formattedDate
    }));
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

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
  }, []);

  const tabs = useMemo(() => ['General', 'Security', 'Preferences', 'Notifications', 'User Permissions', 'Map'], []);

  // General Tab Content - Memoized to prevent re-renders
  const GeneralTab = useMemo(() => {
    return (
      <div className="space-y-8">
        {/* Account Settings Section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Account Settings</h2>
            <p className="text-sm text-gray-500">Update your hospital account information</p>
          </div>
          <div className="p-6">
            {!isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Hospital Name</label>
                  <p className="mt-1 text-gray-900 font-medium">{hospitalInfo.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email Address</label>
                  <p className="mt-1 text-gray-900">{hospitalInfo.email}</p>
                </div>
                <button
                  onClick={handleEditClick}
                  className="mt-4 px-4 py-2 bg-[#1C62A0] hover:bg-[#1C62A0] text-white font-medium rounded-lg transition-colors shadow-sm"
                >
                  Edit Settings
                </button>
              </div>
            ) : (
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hospital Name</label>
                  <input
                    type="text"
                    name="name"
                    value={editForm.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#1C62A0] focus:border-[#1C62A0]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={editForm.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#1C62A0] focus:border-[#1C62A0]"
                    required
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#1C62A0] hover:bg-[#1C62A0] text-white font-medium rounded-lg transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Account Information Section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
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
        </div>
      </div>
    );
  }, [isEditing, hospitalInfo.name, hospitalInfo.email, hospitalInfo.createdDate, hospitalInfo.lastUpdated, editForm.name, editForm.email, handleEditClick, handleEditSubmit, handleInputChange, handleCancelEdit]);

  const renderTabContent = useCallback(() => {
    switch (activeTab) {
      case 'General':
        return GeneralTab;
      case 'Security':
        return <Security />;
      case 'Preferences':
        return <Preference />;
      case 'Notifications':
        return <Notification />;
      case 'User Permissions':
        return <UserPermissions />;
      case 'Map':
        return <Map />; // Use Map component here
      default:
        return null;
    }
  }, [activeTab, GeneralTab]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1">Manage your account settings</p>
        </div>
        
        <div className="border-b border-gray-200 mb-6 overflow-x-auto">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'border-[#1C62A0] text-[#1C62A0]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="mt-6">{renderTabContent()}</div>
        
        <div className="mt-12 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-400">© DreamS EMR - All Rights Reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;