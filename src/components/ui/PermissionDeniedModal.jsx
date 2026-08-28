
import React from "react";
import { ShieldX, X } from "lucide-react";

const PermissionDeniedModal = ({
  isOpen,
  onClose,
  message = "You do not have permission to perform this action.",
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">
            Permission Required
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-5 text-center">

          <div className="mx-auto mb-3 w-11 h-11 rounded-full bg-red-50 flex items-center justify-center">
            <ShieldX className="w-6 h-6 text-red-500" />
          </div>

          <h3 className="text-sm font-semibold text-gray-800 mb-1.5">
            Access Denied
          </h3>

          <p className="text-xs text-gray-500 leading-5">
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-gray-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-white bg-[#1C62A0] hover:bg-[#154A7D] rounded-md transition"
          >
            OK
          </button>
        </div>

      </div>
    </div>
  );
};

export default PermissionDeniedModal;

