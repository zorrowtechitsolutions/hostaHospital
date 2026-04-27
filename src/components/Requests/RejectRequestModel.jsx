import React from "react";
import { XCircle } from "lucide-react";

const RejectRequestModal = ({ onClose, onConfirm, reason, setReason }) => {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[400px] rounded-xl shadow-lg p-6 text-center">

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="bg-red-100 p-3 rounded-full">
            <XCircle className="text-red-600" size={28} />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-lg font-semibold text-gray-800">
          Reject Request
        </h2>

        {/* Subtitle */}
        <p className="text-sm text-gray-500 mt-1">
          Are you sure you want to reject this request?
        </p>

        {/* Textarea */}
        <div className="mt-4 text-left">
          <label className="text-sm text-gray-600 mb-1 block">
            Reason
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            placeholder="Enter reason for rejection..."
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-center gap-3 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-md text-sm hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition-colors"
          >
            Yes, Reject
          </button>
        </div>
      </div>
    </div>
  );
};

export default RejectRequestModal;