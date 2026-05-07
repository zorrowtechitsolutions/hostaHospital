// src/components/Settings/Security.jsx - Refactored
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Modal, Input, Badge, Alert } from '../ui';

const Security = () => {
  const navigate = useNavigate();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showConfigureModal, setShowConfigureModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteItemModal, setShowDeleteItemModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [modalData, setModalData] = useState({ title: '', description: '', itemId: '' });
  const [phoneNumber, setPhoneNumber] = useState('');
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const devices = [
    { device: 'Chrome - Windows', date: '17 Jun 2025', ip: '23.222.12.72', location: 'New York / USA' },
    { device: 'Safari - Macos', date: '10 Jun 2025', ip: '224.111.12.75', location: 'New York / USA' },
    { device: 'Firefox - Windows', date: '22 May 2025', ip: '111.222.13.28', location: 'New York / USA' },
    { device: 'Safari - Macos', date: '15 Jan 2025', ip: '333.555.10.54', location: 'New York / USA' },
  ];

  const performLogout = () => {
    // Clear all localStorage items
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear any cookies if needed
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    // Force a hard reload to /sign-in
    window.location.href = '/sign-in';
  };

  const handleDeleteAccount = () => { 
    // Delete the account from localStorage
    const hospitals = JSON.parse(localStorage.getItem('hospitals') || '[]');
    const currentHospital = JSON.parse(localStorage.getItem('hospitalData') || '{}');
    
    // Remove current hospital from the list
    const updatedHospitals = hospitals.filter(h => h.email !== currentHospital.email);
    localStorage.setItem('hospitals', JSON.stringify(updatedHospitals));
    
    alert('Account deletion process initiated. You have 10 days to recover your account.');
    setShowDeleteModal(false);
    
    // Perform logout and redirect
    performLogout();
  };
  
  const handleConfigure = () => { alert(`Configured: ${modalData.title}`); setShowConfigureModal(false); };
  const handleEditItem = () => { alert(`Edited: ${modalData.title}`); setShowEditModal(false); };
  const handleDeleteItem = () => { alert(`Deleted: ${modalData.title}`); setShowDeleteItemModal(false); };
  const handleDeactivateAccount = () => { 
    alert('Account has been deactivated. You can reactivate by signing in again.');
    setShowDeactivateModal(false);
    performLogout();
  };
  const handleKeepActive = () => setShowDeactivateModal(false);
  const openModal = (type, title, description) => {
    setModalData({ title, description, itemId: title });
    if (type === 'configure') setShowConfigureModal(true);
    else if (type === 'edit') setShowEditModal(true);
    else if (type === 'deleteItem') setShowDeleteItemModal(true);
    else if (type === 'deactivate') setShowDeactivateModal(true);
  };

  const ChangePasswordModal = () => {
    const [localNewPassword, setLocalNewPassword] = useState('');
    const [localConfirmPassword, setLocalConfirmPassword] = useState('');
    const [localPasswordError, setLocalPasswordError] = useState('');

    const validatePassword = (password) => {
      if (password.length < 8) return 'Password must be at least 8 characters long';
      if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password) || !/[!@#$%^&*]/.test(password)) {
        return 'Password must include uppercase, lowercase, numbers, and symbols';
      }
      return '';
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      const error = validatePassword(localNewPassword);
      if (error) { setLocalPasswordError(error); return; }
      if (localNewPassword !== localConfirmPassword) { setLocalPasswordError('Passwords do not match'); return; }
      alert('Password changed successfully!');
      setLocalNewPassword(''); setLocalConfirmPassword(''); setLocalPasswordError('');
      setShowPasswordModal(false);
    };

    return (
      <Modal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} title="Change Password" size="md">
        <form onSubmit={handleSubmit}>
          <Input label="New Password" type="password" value={localNewPassword} onChange={(e) => { setLocalNewPassword(e.target.value); setLocalPasswordError(''); }} placeholder="Enter new password (min 8 characters)" required />
          <Input label="Confirm New Password" type="password" value={localConfirmPassword} onChange={(e) => { setLocalConfirmPassword(e.target.value); setLocalPasswordError(''); }} placeholder="Confirm new password" required className="mt-4" />
          {localPasswordError && <Alert type="error" message={localPasswordError} className="mt-4" />}
          <Alert type="info" message="Password must be at least 8 characters long and should include a mix of uppercase, lowercase, numbers, and symbols for better security." className="mt-4" />
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button variant="outline" onClick={() => { setLocalNewPassword(''); setLocalConfirmPassword(''); setLocalPasswordError(''); setShowPasswordModal(false); }}>Clear</Button>
            <Button type="submit" variant="primary">Update Password</Button>
          </div>
        </form>
      </Modal>
    );
  };

  const DeleteAccountModal = () => (
    <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Account" size="md">
      <p className="text-sm text-gray-500 mb-6">Permanently delete your hospital account</p>
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <h3 className="font-semibold text-yellow-800 mb-2 text-sm">Important: Account Deletion Information</h3>
        <ul className="space-y-1 text-xs text-yellow-800">
          <li>• This account will be temporarily deleted and permanently removed after 10 days</li>
          <li>• During this 10-day period, you can recover your account</li>
          <li>• After 10 days, your account and all associated data will be permanently deleted</li>
          <li>• All your booking data, patient records, and hospital information will be lost</li>
        </ul>
      </div>
      <Alert type="error" message="Warning: This action cannot be undone after the 10-day grace period. Please make sure you have exported any important data before proceeding." className="mb-6" />
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
        <Button onClick={handleDeleteAccount} className="bg-[#1C62A0] hover:bg-[#154d7a] text-white px-4 py-2 rounded-md transition-colors">Delete My Account</Button>
      </div>
    </Modal>
  );

  const ConfigureModal = () => {
    const isTwoFactor = modalData.title === 'Two Factor authentication';
    return (
      <Modal isOpen={showConfigureModal} onClose={() => setShowConfigureModal(false)} title={`Configure ${modalData.title}`} size="md">
        <p className="text-sm text-gray-500 mb-6">{modalData.description}</p>
        {isTwoFactor ? (
          <>
            <Input label="Phone Number" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="Enter phone number" required />
            <p className="text-xs text-gray-500 mt-2">By providing your phone number, you agree to receive text messages to enable two-factor authentication when you log in.</p>
          </>
        ) : (
          <Input label="New Email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Enter email address" required />
        )}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => setShowConfigureModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleConfigure}>Save Changes</Button>
        </div>
      </Modal>
    );
  };

  const EditModal = () => {
    const isPhone = modalData.title === 'Phone Number';
    const isEmail = modalData.title === 'Email Address';
    const isDevices = modalData.title === 'Browsers & Devices';
    return (
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title={`Edit ${modalData.title}`} size="md">
        <p className="text-sm text-gray-500 mb-6">{modalData.description}</p>
        {isPhone && (
          <>
            <Input label="Current Phone Number" type="tel" value="123-456-7890" readOnly className="bg-gray-100" />
            <Input label="New Phone Number" type="tel" value={newPhoneNumber} onChange={(e) => setNewPhoneNumber(e.target.value)} placeholder="987-654-3218" required className="mt-4" />
            <Input label="Current Password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" required className="mt-4" />
          </>
        )}
        {isEmail && (
          <>
            <Input label="Current Email" type="email" value="john@example.com" readOnly className="bg-gray-100" />
            <Input label="New Email" type="email" value={emailAddress} onChange={(e) => setEmailAddress(e.target.value)} placeholder="Enter new email" required className="mt-4" />
            <Input label="Current Password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" required className="mt-4" />
          </>
        )}
        {isDevices && (
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
              <tbody>
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
        )}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleEditItem}>Save Changes</Button>
        </div>
      </Modal>
    );
  };

  const DeleteItemModal = () => (
    <Modal isOpen={showDeleteItemModal} onClose={() => setShowDeleteItemModal(false)} title={`Delete ${modalData.title}`} size="sm">
      <p className="text-sm text-gray-500 mb-6">Are you sure you want to delete your {modalData.title.toLowerCase()}?</p>
      <Alert type="warning" message="This action cannot be undone. You will need to add it again if needed." className="mb-6" />
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => setShowDeleteItemModal(false)}>Cancel</Button>
        <Button onClick={handleDeleteItem} className="bg-[#1C62A0] hover:bg-[#154d7a] text-white px-4 py-2 rounded-md transition-colors">Delete</Button>
      </div>
    </Modal>
  );

  const DeactivateModal = () => (
    <Modal isOpen={showDeactivateModal} onClose={() => setShowDeactivateModal(false)} title="Deactivate Account" size="sm">
      <p className="text-sm text-gray-500 mb-4">Are you sure you want to deactivate?</p>
      <Alert type="warning" message="Your account will be shutdown. It will be reactive when you sign in again." className="mb-6" />
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={handleKeepActive}>Keep Active</Button>
        <Button onClick={handleDeactivateAccount} className="bg-[#1C62A0] hover:bg-[#154d7a] text-white px-4 py-2 rounded-md transition-colors">Yes, Deactivate</Button>
      </div>
    </Modal>
  );

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

  // Custom button styles for delete/deactivate buttons
  const deleteButtonStyle = "bg-[#1C62A0] hover:bg-[#154d7a] text-white px-4 py-2 rounded-md transition-colors text-sm font-medium";

  return (
    <Card>
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
                  {item.meta && <Badge variant={item.meta === 'Verified' || item.meta === 'Connected' ? 'success' : 'default'}>{item.meta}</Badge>}
                </div>
                <p className="text-sm text-gray-500 mt-1">{item.description}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {item.actions.map((action, idx) => {
                  // Check if this is a delete or deactivate button
                  const isDeleteOrDeactivate = action.label === 'Delete' || action.label === 'Deactivate';
                  return (
                    <Button 
                      key={idx} 
                      variant={!isDeleteOrDeactivate ? 'ghost' : undefined}
                      size="sm" 
                      onClick={action.onClick}
                      className={isDeleteOrDeactivate ? deleteButtonStyle : ''}
                    >
                      {action.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      <ChangePasswordModal />
      <DeleteAccountModal />
      <ConfigureModal />
      <EditModal />
      <DeleteItemModal />
      <DeactivateModal />
    </Card>
  );
};

export default Security;