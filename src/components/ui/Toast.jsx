// src/components/ui/Toast.jsx
import React, { useEffect, useState } from 'react';

const Toast = ({ message, type = 'success', duration = 4000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onClose) setTimeout(onClose, 300);
    }, duration);

    return () => clearInterval(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      case 'delete':
        return '🗑';
      case 'update':
        return '🔄';
      case 'edit':
        return '✎';
      case 'save':
        return '💾';
      case 'add':
        return '+';
      default:
        return '✓';
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return '#22c55e';
      case 'error':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      case 'info':
        return '#3b82f6';
      case 'delete':
        return '#ef4444';
      case 'update':
        return '#8b5cf6';
      case 'edit':
        return '#3b82f6';
      case 'save':
        return '#10b981';
      case 'add':
        return '#22c55e';
      default:
        return '#22c55e';
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'success':
        return 'Success';
      case 'error':
        return 'Error';
      case 'warning':
        return 'Warning';
      case 'info':
        return 'Info';
      case 'delete':
        return 'Deleted';
      case 'update':
        return 'Updated';
      case 'edit':
        return 'Edited';
      case 'save':
        return 'Saved';
      case 'add':
        return 'Added';
      default:
        return 'Success';
    }
  };

  const getMessage = () => {
    if (message) return message;
    switch (type) {
      case 'success':
        return 'Operation completed successfully.';
      case 'error':
        return 'Something went wrong. Please try again.';
      case 'warning':
        return 'Please check your input.';
      case 'info':
        return 'New update available.';
      case 'delete':
        return 'Item has been deleted.';
      case 'update':
        return 'Item has been updated.';
      case 'edit':
        return 'Changes have been saved.';
      case 'save':
        return 'Data has been saved.';
      case 'add':
        return 'New item has been added.';
      default:
        return 'Your changes have been saved.';
    }
  };

  return (
    <div className="fixed top-5 right-5 z-50" style={{ animation: 'slideIn 0.4s ease' }}>
      <div 
        className="toast-container"
        style={{
          background: getBgColor(),
          color: 'white',
          padding: '14px 18px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          minWidth: '260px',
          maxWidth: '320px',
          boxShadow: '0 8px 20px rgba(0,0,0,0.15)'
        }}
      >
        <div 
          className="toast-icon"
          style={{
            width: '22px',
            height: '22px',
            background: 'white',
            color: getBgColor(),
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '14px'
          }}
        >
          {getIcon()}
        </div>
        <div style={{ flex: 1, fontSize: '14px' }}>
          <strong>{getTitle()}:</strong> {getMessage()}
        </div>
        <div 
          onClick={() => {
            setIsVisible(false);
            if (onClose) setTimeout(onClose, 300);
          }}
          style={{ marginLeft: 'auto', cursor: 'pointer', opacity: 0.8, fontSize: '16px' }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
        >
          ✕
        </div>
      </div>
    </div>
  );
};

// Global Toast Container
let toastContainer = null;

export const showToast = (message, type = 'success', duration = 4000) => {
  if (toastContainer) {
    toastContainer(message, type, duration);
  }
};

// Convenience methods
export const showSuccessToast = (message, duration = 4000) => {
  showToast(message, 'success', duration);
};

export const showErrorToast = (message, duration = 4000) => {
  showToast(message, 'error', duration);
};

export const showWarningToast = (message, duration = 4000) => {
  showToast(message, 'warning', duration);
};

export const showInfoToast = (message, duration = 4000) => {
  showToast(message, 'info', duration);
};

export const showDeleteToast = (message, duration = 4000) => {
  showToast(message, 'delete', duration);
};

export const showUpdateToast = (message, duration = 4000) => {
  showToast(message, 'update', duration);
};

export const showEditToast = (message, duration = 4000) => {
  showToast(message, 'edit', duration);
};

export const showSaveToast = (message, duration = 4000) => {
  showToast(message, 'save', duration);
};

export const showAddToast = (message, duration = 4000) => {
  showToast(message, 'add', duration);
};

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);

  const showToastMessage = (message, type = 'success', duration = 4000) => {
    setToast({ message, type, duration });
  };

  useEffect(() => {
    toastContainer = showToastMessage;
    return () => {
      toastContainer = null;
    };
  }, []);

  return (
    <>
      {children}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
};