// src/components/patients/DeleteModal.jsx - With toast notifications
import React, { useState } from "react";
import { Button, Modal } from "../ui";
import { showDeleteToast, showErrorToast } from "../ui/Toast";

const DeleteModal = ({ isOpen, onClose, onConfirm, title, message, itemName }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    
    try {
      await onConfirm();
      
      showDeleteToast(
        `${itemName || 'Item'} has been deleted successfully!`,
        4000,
        {
          'Item': itemName || 'Item',
          'Status': 'Deleted'
        }
      );
      
      setIsDeleting(false);
      onClose();
    } catch (error) {
      showErrorToast('Failed to delete. Please try again.', 3000);
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white w-full max-w-sm rounded-xl shadow-lg p-6 text-center" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 flex items-center justify-center rounded-full bg-red-100">
            <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
        </div>
        <h2 className="text-xl font-semibold text-gray-800">{title || "Delete Item"}</h2>
        <p className="text-sm text-gray-500 mt-2">{message || "This action cannot be undone. Are you sure you want to delete this item?"}</p>
        {itemName && <p className="text-sm font-medium text-red-600 mt-2">"{itemName}"</p>}
        <div className="flex justify-center gap-3 mt-6">
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleConfirm} 
            disabled={isDeleting}
            loading={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Yes, Delete'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;