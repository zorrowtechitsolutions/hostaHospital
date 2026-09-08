// src/components/Requests/RejectRequestModal.jsx
import React from "react";
import { XCircle, Hash } from "lucide-react";
import { Modal, Button, Textarea } from "../ui";
import { showWarningToast } from "../ui/Toast";

const RejectRequestModal = ({ 
  onClose, 
  onConfirm, 
  reason, 
  setReason,
  requestData, // ✅ Added to show booking info
  bookingId, // ✅ bookingNumber passed from parent
  isLoading = false
}) => {
  // Format booking number for display
  const formattedBookingId = bookingId 
    ? `#BK${String(bookingId).padStart(5, '0')}`
    : 'N/A';

  const handleConfirm = () => {
    if (!reason.trim()) {
      showWarningToast("Please enter a reason for rejection", 3000);
      return;
    }
    
    // ✅ Pass booking number to parent
    if (onConfirm) {
      onConfirm({
        reason: reason.trim(),
        bookingNumber: bookingId, // ✅ Pass booking number
      });
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Reject Request" size="sm" showCloseButton={false}>
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-red-100 p-3 rounded-full">
            <XCircle className="text-red-600" size={28} />
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-1">Are you sure you want to reject this request?</p>
        
        {/* ✅ Show booking number */}
        {bookingId && (
          <p className="text-xs text-red-600 mt-2 font-medium">
            Booking: {formattedBookingId}
          </p>
        )}
        
        {requestData?.patient_name && (
          <p className="text-xs text-gray-400 mt-1">
            Patient: {requestData.patient_name}
          </p>
        )}
        {requestData?.displayName && (
          <p className="text-xs text-gray-400 mt-1">
            Doctor: {requestData.displayName}
          </p>
        )}
      </div>

      <div className="mt-4">
        <Textarea 
          label="Reason" 
          name="reason" 
          rows={3} 
          value={reason} 
          onChange={(e) => setReason(e.target.value)} 
          placeholder="Enter reason for rejection..." 
          required
          disabled={isLoading}
        />
        <p className="text-xs text-gray-400 mt-1">This reason will be shared with the patient.</p>
      </div>

      <div className="flex justify-center gap-3 mt-5">
        <Button variant="outline" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button variant="danger" onClick={handleConfirm} disabled={isLoading} loading={isLoading}>
          {isLoading ? 'Rejecting...' : 'Yes, Reject'}
        </Button>
      </div>
    </Modal>
  );
};

export default RejectRequestModal;