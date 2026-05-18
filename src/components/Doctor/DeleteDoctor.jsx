// src/components/Doctor/DeleteDoctor.jsx
import React, { useEffect, useState } from "react";
import { useDeleteDoctorMutation } from "../../../app/service/doctorApi";
import { showDeleteToast, showErrorToast } from "../ui/Toast";

const DeleteDoctor = ({ isOpen, onClose, doctorId, doctorName, doctorSpecialty, onDelete }) => {
  const [deleteDoctor, { isLoading }] = useDeleteDoctorMutation();
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
    if (!doctorId) {
      showErrorToast('Doctor ID is missing!', 3000);
      return;
    }

    setIsDeleting(true);
    
    try {
      // Call API to delete doctor
      const result = await deleteDoctor(doctorId).unwrap();
      console.log('Delete result:', result);
      
      // Also remove from localStorage for backup
      const existingDoctors = JSON.parse(localStorage.getItem('doctors') || '[]');
      const updatedDoctors = existingDoctors.filter(doc => doc.id !== doctorId);
      localStorage.setItem('doctors', JSON.stringify(updatedDoctors));
      
      // Remove appointment settings for this doctor
      const appointmentSettings = JSON.parse(localStorage.getItem('appointmentSettings') || '{}');
      delete appointmentSettings[doctorId];
      localStorage.setItem('appointmentSettings', JSON.stringify(appointmentSettings));
      
      // Show delete toast with doctor details
      showDeleteToast(
        `${doctorName || 'Doctor'} has been deleted successfully!`,
        4000,
        {
          'Doctor': doctorName || 'Unknown',
          'Specialty': doctorSpecialty || 'N/A',
          'ID': `#DR${String(doctorId).padStart(4, '0')}`
        }
      );
      
      // Call onDelete callback to refresh the parent component
      if (onDelete) {
        onDelete(doctorId);
      }
      
      // Close modal after short delay
      setTimeout(() => {
        setIsDeleting(false);
        onClose();
      }, 500);
      
    } catch (error) {
      console.error('Delete error:', error);
      const errorMessage = error?.data?.message || error?.message || 'Failed to delete doctor. Please try again.';
      showErrorToast(errorMessage, 3000);
      setIsDeleting(false);
    }
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
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteDoctor;