import React, { useState } from "react";
import { XCircle } from "lucide-react";
import { Modal, Button, Textarea } from "../ui";
import { showWarningToast, showErrorToast } from "../ui/Toast";

const RejectRequestModal = ({ onClose, onConfirm, reason, setReason }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = () => {
    if (!reason.trim()) {
      showWarningToast("Please enter a reason for rejection", 3000);
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      onConfirm();
      
      showErrorToast(
        `Request has been rejected. Reason: ${reason.substring(0, 100)}${reason.length > 100 ? '...' : ''}`,
        4000,
        {
          'Reason': reason.substring(0, 50) + (reason.length > 50 ? '...' : ''),
          'Status': 'Rejected'
        }
      );
      
      setIsSubmitting(false);
      onClose();
    }, 500);
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
        />
      </div>

      <div className="flex justify-center gap-3 mt-5">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button variant="danger" onClick={handleConfirm} disabled={isSubmitting} loading={isSubmitting}>
          {isSubmitting ? 'Rejecting...' : 'Yes, Reject'}
        </Button>
      </div>
    </Modal>
  );
};

export default RejectRequestModal;