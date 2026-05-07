// src/components/Doctor/DeleteDoctor.jsx - Optimized with delete toast
import React, { useEffect, useState } from "react";
import { Button, Modal } from "../ui";
import { showDeleteToast, showErrorToast, showWarningToast } from "../ui/Toast";

const DeleteDoctor = ({ isOpen, onClose, doctorId, doctorName, doctorSpecialty, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => document.body.classList.remove("overflow-hidden");
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    
    // Simulate API call
    setTimeout(() => {
      try {
        // Get existing doctors
        const existingDoctors = JSON.parse(localStorage.getItem('doctors') || '[]');
        
        // Find doctor to delete
        const doctorToDelete = existingDoctors.find(doc => doc.id === doctorId);
        
        if (!doctorToDelete) {
          showErrorToast('Doctor not found!', 3000);
          setIsDeleting(false);
          return;
        }
        
        // Filter out the doctor
        const updatedDoctors = existingDoctors.filter(doc => doc.id !== doctorId);
        
        // Save back to localStorage
        localStorage.setItem('doctors', JSON.stringify(updatedDoctors));
        
        // Show delete toast with doctor details
        showDeleteToast(
          `${doctorToDelete.name || doctorName || 'Doctor'} has been deleted successfully!`,
          4000,
          {
            'Doctor': doctorToDelete.name || doctorName,
            'Specialty': doctorToDelete.specialty || doctorSpecialty || 'N/A',
            'ID': `#DR${String(doctorId).padStart(4, '0')}`
          }
        );
        
        // Call onDelete callback
        if (onDelete) onDelete(doctorId);
        
        // Close modal after short delay
        setTimeout(() => {
          setIsDeleting(false);
          onClose();
        }, 500);
        
      } catch (error) {
        console.error('Delete error:', error);
        showErrorToast('Failed to delete doctor. Please try again.', 3000);
        setIsDeleting(false);
      }
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white w-full max-w-sm rounded-xl shadow-lg p-6 text-center" onClick={(e) => e.stopPropagation()}>
        {/* Warning Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 flex items-center justify-center rounded-full bg-red-100">
            <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
        </div>
        
        {/* Title */}
        <h2 className="text-xl font-semibold text-gray-800">Delete Doctor</h2>
        
        {/* Message */}
        <p className="text-sm text-gray-500 mt-2">
          Are you sure you want to delete <span className="font-semibold text-gray-700">{doctorName || 'this doctor'}</span>?
        </p>
        <p className="text-xs text-red-500 mt-1">⚠️ This action cannot be undone.</p>
        
        {/* Doctor Info */}
        {doctorSpecialty && (
          <div className="mt-3 p-2 bg-gray-50 rounded-lg text-left">
            <p className="text-xs text-gray-500">
              <span className="font-medium">Specialty:</span> {doctorSpecialty}
            </p>
            {doctorId && (
              <p className="text-xs text-gray-500 mt-1">
                <span className="font-medium">ID:</span> #DR{String(doctorId).padStart(4, '0')}
              </p>
            )}
          </div>
        )}
        
        {/* Buttons */}
        <div className="flex justify-center gap-3 mt-6">
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDelete} 
            disabled={isDeleting}
            loading={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteDoctor;