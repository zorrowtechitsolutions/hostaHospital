// src/components/Settings/Security.jsx - UPDATED with eye toggle and improved Delete modal
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Modal, Input, Badge, Alert } from '../ui';
import {
  showSuccessToast,
  showErrorToast
} from '../ui/Toast';
import {
  useLogoutMutation,
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

// Eye icon components
const EyeIcon = ({ isOpen }) => (
  <svg 
    className="w-5 h-5 text-gray-500" 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    {isOpen ? (
      // Eye open
      <>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </>
    ) : (
      // Eye closed
      <>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
      </>
    )}
  </svg>
);

// Password input component with eye toggle
const PasswordInput = ({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  required,
  className = '',
  error = false
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-blue-600 focus:outline-none"
          tabIndex={-1}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          <EyeIcon isOpen={showPassword} />
        </button>
      </div>
    </div>
  );
};

const Security = () => {
  const navigate = useNavigate();
  
  // Get user info from auth utility
  const authUser = getAuthUser();
  const hospitalId = getHospitalId();
  
  const [logoutHospital] = useLogoutMutation();
  const [deleteHospital, { isLoading: isDeleting }] = useDeleteHospitalMutation();
  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const performLogout = async () => {
    try {
      const deviceId = localStorage.getItem('deviceId') || '';
      await logoutHospital(deviceId).unwrap();
    } catch (error) {
      console.error('Logout error:', error);
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
      } catch {
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
          <PasswordInput
            label="Current Password *"
            value={localCurrentPassword}
            onChange={(e) => {
              setLocalCurrentPassword(e.target.value);
              setLocalPasswordError('');
            }}
            placeholder="Enter current password"
            required
            error={!!localPasswordError}
          />
          
          <PasswordInput
            label="New Password *"
            value={localNewPassword}
            onChange={(e) => {
              setLocalNewPassword(e.target.value);
              setLocalPasswordError('');
            }}
            placeholder="Enter new password (min 8 characters)"
            required
            className="mt-4"
            error={!!localPasswordError}
          />
          
          <PasswordInput
            label="Confirm New Password *"
            value={localConfirmPassword}
            onChange={(e) => {
              setLocalConfirmPassword(e.target.value);
              setLocalPasswordError('');
            }}
            placeholder="Confirm new password"
            required
            className="mt-4"
            error={!!localPasswordError}
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

  // Delete Account Modal - UPDATED with better button styling
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

      {/* UPDATED: Improved button styling with better visual feedback */}
      <div className="flex justify-end items-center gap-3 mt-6 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => {
            setShowDeleteModal(false);
            setConfirmText('');
          }}
          className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleDeleteAccount}
          disabled={confirmText.trim() !== 'DELETE' || isDeleting}
          className={`
            px-5 py-2.5 rounded-lg font-medium text-white transition-all duration-300
            min-w-[150px]
            ${
              confirmText.trim() === 'DELETE' && !isDeleting
                ? 'bg-red-600 hover:bg-red-700 shadow-md hover:shadow-lg cursor-pointer'
                : 'bg-red-300 cursor-not-allowed opacity-60'
            }
          `}
        >
          {isDeleting ? 'Deleting...' : 'Delete My Account'}
        </button>
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