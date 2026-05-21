import { useEffect, useState } from "react";
import { useDeleteDoctorMutation } from "../../../app/service/doctorApi";
import { showDeleteToast, showErrorToast } from "../ui/Toast";

// ==================== CONSTANTS ====================
const MODAL_CLASS = "fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm";
const BUTTON_CLASS = "px-4 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
const CANCEL_BUTTON_CLASS = `${BUTTON_CLASS} text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:ring-gray-500`;
const DELETE_BUTTON_CLASS = `${BUTTON_CLASS} text-white bg-red-600 border border-transparent hover:bg-red-700 focus:ring-red-500 flex items-center gap-2`;

// ==================== HELPER FUNCTIONS ====================
const formatDoctorId = (id) => `#DR${String(id).padStart(4, "0")}`;

const getStorageData = (key, fallback = {}) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
};

const setStorageData = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

// ==================== COMPONENTS ====================
const Spinner = () => (
  <svg
    className="animate-spin h-4 w-4 text-white"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

const DeleteDoctor = ({ isOpen, onClose, doctorId, doctorName, doctorSpecialty, onDelete }) => {
  const [deleteDoctor] = useDeleteDoctorMutation();
  const [isDeleting, setIsDeleting] = useState(false);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => document.body.classList.remove("overflow-hidden");
  }, [isOpen]);

  // Safe close handler - prevents closing while deleting
  const handleClose = () => {
    if (!isDeleting) {
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!doctorId) {
      showErrorToast('Doctor ID is missing!', 3000);
      return;
    }

    setIsDeleting(true);
    
    try {
      // Call API to delete doctor - auth is automatic via API service
      await deleteDoctor(doctorId).unwrap();
      
      // Also remove from localStorage for backup (optional)
      const existingDoctors = getStorageData('doctors', []);
      const updatedDoctors = existingDoctors.filter(doc => doc.id !== doctorId);
      setStorageData('doctors', updatedDoctors);
      
      // Remove appointment settings for this doctor (optional)
      const appointmentSettings = getStorageData('appointmentSettings', {});
      delete appointmentSettings[doctorId];
      setStorageData('appointmentSettings', appointmentSettings);
      
      // Show delete toast with doctor details
      showDeleteToast(
        `${doctorName || 'Doctor'} has been deleted successfully!`,
        4000,
        {
          'Doctor': doctorName || 'Unknown',
          'Specialty': doctorSpecialty || 'N/A',
          'ID': formatDoctorId(doctorId)
        }
      );
      
      // Call onDelete callback to refresh the parent component
      onDelete?.(doctorId);
      
      // Close modal after short delay
      setTimeout(() => {
        setIsDeleting(false);
        handleClose();
      }, 500);
      
    } catch (error) {
      const errorMessage = error?.data?.message || error?.message || 'Failed to delete doctor. Please try again.';
      showErrorToast(errorMessage, 3000);
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={MODAL_CLASS}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
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
                <span className="font-medium">ID:</span> {formatDoctorId(doctorId)}
              </p>
            )}
          </div>
        )}
        
        {/* Buttons */}
        <div className="flex justify-center gap-3 mt-6">
          <button
            onClick={handleClose}
            disabled={isDeleting}
            className={CANCEL_BUTTON_CLASS}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className={DELETE_BUTTON_CLASS}
          >
            {isDeleting ? (
              <>
                <Spinner />
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