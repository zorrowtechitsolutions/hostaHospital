import React, { useState } from 'react';

const Security = () => {
  // Modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showConfigureModal, setShowConfigureModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteItemModal, setShowDeleteItemModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  
  // Modal data for dynamic content
  const [modalData, setModalData] = useState({ title: '', description: '', itemId: '' });
  
  // Form states for different modals
  const [phoneNumber, setPhoneNumber] = useState('');
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [newEmail, setNewEmail] = useState('');

  // Security settings state
  const [accountDeactivated, setAccountDeactivated] = useState(false);
  
  // Device data for Browsers & Devices table
  const devices = [
    { device: 'Chrome - Windows', date: '17 Jun 2025', ip: '23.222.12.72', location: 'New York / USA' },
    { device: 'Safari - Macos', date: '10 Jun 2025', ip: '224.111.12.75', location: 'New York / USA' },
    { device: 'Firefox - Windows', date: '22 May 2025', ip: '111.222.13.28', location: 'New York / USA' },
    { device: 'Safari - Macos', date: '15 Jan 2025', ip: '333.555.10.54', location: 'New York / USA' },
  ];

  const handleDeleteAccount = () => {
    alert('Account deletion process initiated. You have 10 days to recover your account.');
    setShowDeleteModal(false);
  };

  const handleConfigure = () => {
    alert(`Configured: ${modalData.title}`);
    setShowConfigureModal(false);
  };

  const handleEditItem = () => {
    alert(`Edited: ${modalData.title}`);
    setShowEditModal(false);
  };

  const handleDeleteItem = () => {
    alert(`Deleted: ${modalData.title}`);
    setShowDeleteItemModal(false);
  };

  const handleDeactivateAccount = () => {
    setAccountDeactivated(true);
    alert('Account has been deactivated. You can reactivate by signing in again.');
    setShowDeactivateModal(false);
  };

  const handleKeepActive = () => {
    setShowDeactivateModal(false);
  };

  // Helper function to open modals with data
  const openModal = (type, title, description) => {
    setModalData({ title, description, itemId: title });
    switch(type) {
      case 'configure': setShowConfigureModal(true); break;
      case 'edit': setShowEditModal(true); break;
      case 'deleteItem': setShowDeleteItemModal(true); break;
      case 'deactivate': setShowDeactivateModal(true); break;
      default: break;
    }
  };

  // Change Password Modal
  const ChangePasswordModal = () => {
    const [localNewPassword, setLocalNewPassword] = useState('');
    const [localConfirmPassword, setLocalConfirmPassword] = useState('');
    const [localPasswordError, setLocalPasswordError] = useState('');

    const validateLocalPassword = (password) => {
      if (password.length < 8) {
        return 'Password must be at least 8 characters long';
      }
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumbers = /\d/.test(password);
      const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
      
      if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSymbol) {
        return 'Password must include uppercase, lowercase, numbers, and symbols';
      }
      return '';
    };

    const handleLocalChangePassword = (e) => {
      e.preventDefault();
      const error = validateLocalPassword(localNewPassword);
      if (error) {
        setLocalPasswordError(error);
        return;
      }
      if (localNewPassword !== localConfirmPassword) {
        setLocalPasswordError('Passwords do not match');
        return;
      }
      alert('Password changed successfully!');
      setLocalNewPassword('');
      setLocalConfirmPassword('');
      setLocalPasswordError('');
      setShowPasswordModal(false);
    };

    const handleLocalClearPassword = () => {
      setLocalNewPassword('');
      setLocalConfirmPassword('');
      setLocalPasswordError('');
    };

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowPasswordModal(false)}></div>
          <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
          <div className="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div className="px-6 pt-5 pb-4 bg-white sm:p-6 sm:pb-4">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Change Password</h2>
              <p className="text-sm text-gray-500 mb-6">Update your account password</p>
              
              <form onSubmit={handleLocalChangePassword}>
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input
                    type="password"
                    value={localNewPassword}
                    onChange={(e) => {
                      setLocalNewPassword(e.target.value);
                      setLocalPasswordError('');
                    }}
                    placeholder="Enter new password (min 8 characters)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#1C62A0] focus:border-[#1C62A0]"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={localConfirmPassword}
                    onChange={(e) => {
                      setLocalConfirmPassword(e.target.value);
                      setLocalPasswordError('');
                    }}
                    placeholder="Confirm new password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#1C62A0] focus:border-[#1C62A0]"
                    required
                  />
                </div>
                
                {localPasswordError && (
                  <p className="text-red-600 text-sm mb-4">{localPasswordError}</p>
                )}
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                  <p className="text-xs text-gray-700">
                    Password must be at least 8 characters long and should include a mix of uppercase, lowercase, numbers, and symbols for better security.
                  </p>
                </div>
                
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleLocalClearPassword}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Clear
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-white bg-[#1C62A0] rounded-lg hover:bg-[#1C62A0] transition"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Delete Account Modal
  const DeleteAccountModal = () => {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowDeleteModal(false)}></div>
          <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
          <div className="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div className="px-6 pt-5 pb-4 bg-white sm:p-6 sm:pb-4">
              <h2 className="text-xl font-bold text-red-600 mb-1">Delete Account</h2>
              <p className="text-sm text-gray-500 mb-6">Permanently delete your hospital account</p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-yellow-800 mb-2 text-sm">Important: Account Deletion Information</h3>
                <ul className="space-y-1 text-xs text-yellow-800">
                  <li>• This account will be temporarily deleted and permanently removed after 10 days</li>
                  <li>• During this 10-day period, you can recover your account</li>
                  <li>• After 10 days, your account and all associated data will be permanently deleted</li>
                  <li>• Once permanently deleted, you can register again with the same credentials</li>
                  <li>• All your booking data, patient records, and hospital information will be lost</li>
                </ul>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                <p className="text-red-700 text-xs font-medium">⚠️ Warning: This action cannot be undone after the 10-day grace period. Please make sure you have exported any important data before proceeding.</p>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={handleDeleteAccount} className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700">Delete My Account</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Configure Modal (Two Factor, Google Auth)
  const ConfigureModal = () => {
    const isTwoFactor = modalData.title === 'Two Factor authentication';
    const isGoogleAuth = modalData.title === 'Google Authentication';
    
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowConfigureModal(false)}></div>
          <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
          <div className="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div className="px-6 pt-5 pb-4 bg-white sm:p-6 sm:pb-4">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Configure {modalData.title}</h2>
              <p className="text-sm text-gray-500 mb-6">{modalData.description}</p>
              
              {isTwoFactor && (
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Enter phone number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#1C62A0] focus:border-[#1C62A0]"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      By providing your phone number, you agree to receive text messages to enable two-factor authentication when you log in.
                    </p>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <button onClick={() => setShowConfigureModal(false)} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                    <button onClick={handleConfigure} className="px-4 py-2 text-white bg-[#1C62A0] rounded-lg hover:bg-[#1C62A0]">Save Changes</button>
                  </div>
                </div>
              )}
              
              {isGoogleAuth && (
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="Enter email address"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#1C62A0] focus:border-[#1C62A0]"
                    />
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <button onClick={() => setShowConfigureModal(false)} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                    <button onClick={handleConfigure} className="px-4 py-2 text-white bg-[#1C62A0] rounded-lg hover:bg-[#1C62A0]">Connect</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Edit Modal (Phone Number, Email Address, Browsers & Devices)
  const EditModal = () => {
    const isPhone = modalData.title === 'Phone Number';
    const isEmail = modalData.title === 'Email Address';
    const isDevices = modalData.title === 'Browsers & Devices';
    
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowEditModal(false)}></div>
          <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
          <div className="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div className="px-6 pt-5 pb-4 bg-white sm:p-6 sm:pb-4">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Edit {modalData.title}</h2>
              <p className="text-sm text-gray-500 mb-6">{modalData.description}</p>
              
              {isPhone && (
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Phone Number <span className="text-red-500">*</span></label>
                    <input type="tel" defaultValue="123-456-7890" className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100" readOnly />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Phone Number <span className="text-red-500">*</span></label>
                    <input type="tel" value={newPhoneNumber} onChange={(e) => setNewPhoneNumber(e.target.value)} placeholder="987-654-3218" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#1C62A0] focus:border-[#1C62A0]" />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Password <span className="text-red-500">*</span></label>
                    <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#1C62A0] focus:border-[#1C62A0]" />
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                    <button onClick={handleEditItem} className="px-4 py-2 text-white bg-[#1C62A0] rounded-lg hover:bg-[#1C62A0]">Save Changes</button>
                  </div>
                </div>
              )}
              
              {isEmail && (
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Email <span className="text-red-500">*</span></label>
                    <input type="email" defaultValue="john@example.com" className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100" readOnly />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Email <span className="text-red-500">*</span></label>
                    <input type="email" value={emailAddress} onChange={(e) => setEmailAddress(e.target.value)} placeholder="Enter new email" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#1C62A0] focus:border-[#1C62A0]" />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Password <span className="text-red-500">*</span></label>
                    <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#1C62A0] focus:border-[#1C62A0]" />
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                    <button onClick={handleEditItem} className="px-4 py-2 text-white bg-[#1C62A0] rounded-lg hover:bg-[#1C62A0]">Save Changes</button>
                  </div>
                </div>
              )}
              
              {isDevices && (
                <div>
                  <div className="overflow-x-auto mb-4 max-h-80 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Device</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">IP Address</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Location</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {devices.map((device, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2 text-sm text-gray-900">{device.device}</td>
                            <td className="px-3 py-2 text-sm text-gray-500">{device.date}</td>
                            <td className="px-3 py-2 text-sm text-gray-500">{device.ip}</td>
                            <td className="px-3 py-2 text-sm text-gray-500">{device.location}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-end gap-3 mt-4">
                    <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Close</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Delete Item Modal
  const DeleteItemModal = () => {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowDeleteItemModal(false)}></div>
          <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
          <div className="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
            <div className="px-6 pt-5 pb-4 bg-white sm:p-6 sm:pb-4">
              <h2 className="text-xl font-bold text-red-600 mb-1">Delete {modalData.title}</h2>
              <p className="text-sm text-gray-500 mb-6">Are you sure you want to delete your {modalData.title.toLowerCase()}?</p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                <p className="text-yellow-800 text-xs">This action cannot be undone. You will need to add it again if needed.</p>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowDeleteItemModal(false)} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={handleDeleteItem} className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700">Delete</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Deactivate Account Modal
  const DeactivateModal = () => {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowDeactivateModal(false)}></div>
          <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
          <div className="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
            <div className="px-6 pt-5 pb-4 bg-white sm:p-6 sm:pb-4">
              <h2 className="text-xl font-bold text-red-600 mb-1">Deactivate Account</h2>
              <p className="text-sm text-gray-500 mb-4">Are you sure you want to deactivate?</p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                <p className="text-yellow-800 text-xs">Your account will be shutdown. It will be reactive when you sign in again.</p>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={handleKeepActive} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Keep Active</button>
                <button onClick={handleDeactivateAccount} className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700">Yes, Deactivate</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Security Items List
  const securityItems = [
    { id: 'password', title: 'Password', description: 'Set a unique password to secure the account', meta: 'Last Changed, Mar 18, 2025', actions: [{ label: 'Edit', onClick: () => setShowPasswordModal(true) }] },
    { id: 'twofactor', title: 'Two Factor authentication', description: 'Use your mobile phone to receive security PIN.', meta: 'Enabled, Mar 18, 2025', actions: [{ label: 'Configure', onClick: () => openModal('configure', 'Two Factor authentication', 'Use your mobile phone to receive security PIN.') }] },
    { id: 'google', title: 'Google Authentication', description: 'Connect to Google', meta: 'Connected', actions: [{ label: 'Configure', onClick: () => openModal('configure', 'Google Authentication', 'Connect your Google account') }] },
    { id: 'phone', title: 'Phone Number', description: 'Phone Number associated with the account', meta: 'Verified', actions: [{ label: 'Edit', onClick: () => openModal('edit', 'Phone Number', 'Update phone number') }, { label: 'Delete', onClick: () => openModal('deleteItem', 'Phone Number', 'Delete phone number') }] },
    { id: 'email', title: 'Email Address', description: 'Email Address associated with the account', meta: 'Verified', actions: [{ label: 'Edit', onClick: () => openModal('edit', 'Email Address', 'Update email address') }, { label: 'Delete', onClick: () => openModal('deleteItem', 'Email Address', 'Delete email address') }] },
    { id: 'devices', title: 'Browsers & Devices', description: 'The browsers & devices associated with the account', meta: '', actions: [{ label: 'Edit', onClick: () => openModal('edit', 'Browsers & Devices', 'View and manage devices') }, { label: 'Delete', onClick: () => openModal('deleteItem', 'Browsers & Devices', 'Delete device') }] },
    { id: 'deactivate', title: 'Deactivate Account', description: 'This will shutdown your account. Your account will be reactive when you sign in again', actions: [{ label: 'Deactivate', onClick: () => openModal('deactivate', 'Deactivate Account', 'Deactivate your account') }] },
    { id: 'delete', title: 'Delete Account', description: 'Your account will be permanently deleted', actions: [{ label: 'Delete', onClick: () => setShowDeleteModal(true) }] },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900">Security</h2>
        <p className="text-sm text-gray-500 mt-1">Manage your account security settings</p>
      </div>
      
      <div className="divide-y divide-gray-100">
        {securityItems.map((item) => (
          <div key={item.id} className="px-6 py-5 hover:bg-gray-50 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="text-base font-semibold text-gray-900">{item.title}</h3>
                  {item.meta && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      item.meta === 'Verified' || item.meta === 'Connected' || item.meta === 'Enabled, Mar 18, 2025'
                        ? 'bg-green-100 text-green-700'
                        : item.meta === 'Deleted' || item.meta === 'Deactivated'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {item.meta}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">{item.description}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {item.actions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={action.onClick}
                    className={`text-sm font-medium px-3 py-1.5 rounded-md transition ${
                      action.label === 'Delete' || action.label === 'Deactivate'
                        ? 'text-red-600 hover:bg-red-50'
                        : 'text-[#1C62A0] hover:bg-blue-50'
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      {showPasswordModal && <ChangePasswordModal />}
      {showDeleteModal && <DeleteAccountModal />}
      {showConfigureModal && <ConfigureModal />}
      {showEditModal && <EditModal />}
      {showDeleteItemModal && <DeleteItemModal />}
      {showDeactivateModal && <DeactivateModal />}
    </div>
  );
};

export default Security;