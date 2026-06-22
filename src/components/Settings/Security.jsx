// src/components/Settings/Security.jsx - With Green Change Password & Red Delete Button
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Modal, Input, Badge, Alert } from '../ui';
import {
  showSuccessToast,
  showErrorToast
} from '../ui/Toast';
import {
  useLogoutHospitalMutation,
  useDeleteHospitalMutation,
  useChangePasswordMutation
} from '../../../app/service/hospitalApi';
import { getHospitalId, getAuthUser, clearAuth } from '../../utils/auth';

// Constants
const REDIRECT_DELAY = 2000;
const TOAST_DURATION = 4000;

// Static security items configuration
const SECURITY_ITEMS = [
  {
    id: 'password',
    title: 'Password',
    description: 'Set a unique password to secure the account',
    meta: (user) => `Last Changed: ${user?.lastPasswordChange || 'Never'}`,
    actions: [{ label: 'Change Password', type: 'change' }]
  },
  {
    id: 'delete',
    title: 'Delete Account',
    description: 'Your account will be permanently deleted after 30 days',
    actions: [{ label: 'Delete Account', type: 'delete' }]
  },
];

const Security = () => {
  const navigate = useNavigate();
  
  // Get user info from auth utility
  const authUser = getAuthUser();
  const hospitalId = getHospitalId();
  
  const [logoutHospital] = useLogoutHospitalMutation();
  const [deleteHospital, { isLoading: isDeleting }] = useDeleteHospitalMutation();
  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const performLogout = async () => {
    try {
      await logoutHospital().unwrap();
    } catch (error) {
      // Silent fail - we'll log out anyway
    } finally {
      clearAuth();
      window.location.href = '/sign-in';
    }
  };

  // Reset password form helper
  const resetPasswordForm = (setters) => {
    setters.setLocalNewPassword('');
    setters.setLocalConfirmPassword('');
    setters.setLocalCurrentPassword('');
    setters.setLocalPasswordError('');
  };

  // Handle Delete Account
  const handleDeleteAccount = async () => {
    if (!hospitalId) {
      showErrorToast('Hospital ID not found', 3000);
      return;
    }

    try {
      await deleteHospital(hospitalId).unwrap();

      showSuccessToast(
        'Your account has been scheduled for deletion. You have 30 days to recover your account.',
        5000
      );

      setShowDeleteModal(false);

      localStorage.clear();
      sessionStorage.clear();

      // Clean cookies
      document.cookie.split(';').forEach(cookie => {
        document.cookie = cookie
          .replace(/^ +/, '')
          .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
      });

      await performLogout();

    } catch (error) {
      let errorMessage = 'Failed to delete account. Please try again.';

      if (error.data?.message) {
        errorMessage = error.data.message;
      } else if (error.status === 401) {
        errorMessage = 'Session expired. Please login again.';
      } else if (error.status === 404) {
        errorMessage = 'Hospital account not found.';
      }

      showErrorToast(`❌ ${errorMessage}`, TOAST_DURATION);
    }
  };

  // Handle Change Password
  const handleChangePassword = async (currentPwd, newPwd) => {
    try {
      await changePassword({
        currentPassword: currentPwd,
        newPassword: newPwd
      }).unwrap();

      showSuccessToast('Password changed successfully! Please login again.', TOAST_DURATION);

      setShowPasswordModal(false);

      setTimeout(async () => {
        await performLogout();
      }, REDIRECT_DELAY);

    } catch (error) {
      let errorMessage = 'Failed to change password. Please try again.';

      if (error.data?.message) {
        errorMessage = error.data.message;
      } else if (error.status === 400) {
        errorMessage = 'Invalid current password.';
      } else if (error.status === 401) {
        errorMessage = 'Current password is incorrect.';
      }

      showErrorToast(`❌ ${errorMessage}`, 5000);
      throw new Error(errorMessage);
    }
  };

  // Change Password Modal
  const ChangePasswordModal = () => {
    const [localNewPassword, setLocalNewPassword] = useState('');
    const [localConfirmPassword, setLocalConfirmPassword] = useState('');
    const [localPasswordError, setLocalPasswordError] = useState('');
    const [localCurrentPassword, setLocalCurrentPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isFormLoading = isSubmitting || isChangingPassword;

    const validatePassword = password =>
      password.length < 8
        ? 'Password must be at least 8 characters long'
        : '';

    const handleSubmit = async (e) => {
      e.preventDefault();

      if (!localCurrentPassword) {
        setLocalPasswordError('Current password is required');
        return;
      }

      const error = validatePassword(localNewPassword);
      if (error) {
        setLocalPasswordError(error);
        return;
      }

      if (localNewPassword !== localConfirmPassword) {
        setLocalPasswordError('New passwords do not match');
        return;
      }

      if (localCurrentPassword === localNewPassword) {
        setLocalPasswordError('New password must be different from current password');
        return;
      }

      setIsSubmitting(true);

      try {
        await handleChangePassword(localCurrentPassword, localNewPassword);
        resetPasswordForm({
          setLocalNewPassword,
          setLocalConfirmPassword,
          setLocalCurrentPassword,
          setLocalPasswordError
        });
      } catch (error) {
        // Error already handled in handleChangePassword
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleClose = () => {
      resetPasswordForm({
        setLocalNewPassword,
        setLocalConfirmPassword,
        setLocalCurrentPassword,
        setLocalPasswordError
      });
      setShowPasswordModal(false);
    };

    return (
      <Modal isOpen={showPasswordModal} onClose={handleClose} title="Change Password" size="md">
        <form onSubmit={handleSubmit}>
          <Input
            label="Current Password *"
            type="password"
            value={localCurrentPassword}
            onChange={(e) => {
              setLocalCurrentPassword(e.target.value);
              setLocalPasswordError('');
            }}
            placeholder="Enter current password"
            required
          />
          <Input
            label="New Password *"
            type="password"
            value={localNewPassword}
            onChange={(e) => {
              setLocalNewPassword(e.target.value);
              setLocalPasswordError('');
            }}
            placeholder="Enter new password (min 8 characters)"
            required
            className="mt-4"
          />
          <Input
            label="Confirm New Password *"
            type="password"
            value={localConfirmPassword}
            onChange={(e) => {
              setLocalConfirmPassword(e.target.value);
              setLocalPasswordError('');
            }}
            placeholder="Confirm new password"
            required
            className="mt-4"
          />
          {localPasswordError && <Alert type="error" message={localPasswordError} className="mt-4" />}
          <Alert
            type="info"
            message="Password must be at least 8 characters long."
            className="mt-4"
          />
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isFormLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isFormLoading}
              loading={isFormLoading}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {isFormLoading ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </form>
      </Modal>
    );
  };

  // Delete Account Modal
  const DeleteAccountModal = () => (
    <Modal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setConfirmText(''); }} title="Delete Account" size="md">
      <p className="text-sm text-gray-500 mb-6">Permanently delete your hospital account</p>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <h3 className="font-semibold text-yellow-800 mb-2 text-sm">⚠️ Important: Account Deletion Information</h3>
        <ul className="space-y-1 text-xs text-yellow-800">
          <li>• This account will be scheduled for deletion</li>
          <li>• You will have 30 days to recover your account</li>
          <li>• After 30 days, your account and all associated data will be permanently deleted</li>
          <li>• All patient records, appointments, staff data, and hospital information will be lost</li>
          <li>• This action cannot be undone after the grace period</li>
        </ul>
      </div>

      <Alert type="error" message="Warning: Please make sure you have exported any important data before proceeding." className="mb-4" />

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Type <span className="font-mono font-bold text-red-600">DELETE</span> to confirm:
        </label>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="Type DELETE here"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => { setShowDeleteModal(false); setConfirmText(''); }}>Cancel</Button>
        <Button
          onClick={handleDeleteAccount}
          disabled={confirmText.trim() !== 'DELETE' || isDeleting}
          loading={isDeleting}
          variant="ghost"
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          {isDeleting ? 'Deleting...' : 'Delete My Account'}
        </Button>
      </div>
    </Modal>
  );

  // Create user object for meta display
  const userForMeta = useMemo(() => ({
    lastPasswordChange: authUser?.lastPasswordChange || null
  }), [authUser]);

  // Prepare security items with dynamic meta
  const securityItems = useMemo(() => {
    return SECURITY_ITEMS.map(item => ({
      ...item,
      meta: typeof item.meta === 'function' ? item.meta(userForMeta) : item.meta,
      actions: item.actions.map(action => ({
        ...action,
        onClick: action.type === 'change'
          ? () => setShowPasswordModal(true)
          : () => setShowDeleteModal(true)
      }))
    }));
  }, [userForMeta]);

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
                  {item.meta && <Badge variant={item.meta.includes('Verified') || item.meta.includes('Connected') ? 'success' : 'default'}>{item.meta}</Badge>}
                </div>
                <p className="text-sm text-gray-500 mt-1">{item.description}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {item.actions.map((action, idx) => {
                  const isDangerAction = ['Delete', 'Delete Account', 'Deactivate'].includes(action.label);
                  const isChangeAction = ['Change', 'Change Password'].includes(action.label);
                  
                  if (isDangerAction) {
                    return (
                      <button
  key={idx}
  onClick={action.onClick}
  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
>
  {action.label}
</button>
                    );
                  }
                  
                  if (isChangeAction) {
                    return (
                      <Button
                        key={idx}
                        variant="ghost"
                        size="sm"
                        onClick={action.onClick}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        {action.label}
                      </Button>
                    );
                  }
                  
                  return (
                    <Button
                      key={idx}
                      variant="ghost"
                      size="sm"
                      onClick={action.onClick}
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
    </Card>
  );
};

export default Security;