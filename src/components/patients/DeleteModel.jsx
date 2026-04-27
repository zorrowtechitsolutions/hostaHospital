import React from "react";

const DeleteModal = ({ isOpen, onClose, onConfirm, title, message, itemName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-xl shadow-lg p-6 text-center">
        {/* ICON */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-red-100">
            <span className="text-red-600 text-xl">🗑</span>
          </div>
        </div>

        {/* TITLE */}
        <h2 className="text-lg font-semibold text-gray-800">
          {title || "Delete Item"}
        </h2>

        {/* MESSAGE */}
        <p className="text-sm text-gray-500 mt-2">
          {message || "This action cannot be undone. Are you sure you want to delete this item?"}
        </p>
        
        {itemName && (
          <p className="text-sm font-medium text-red-600 mt-2">
            "{itemName}"
          </p>
        )}

        {/* BUTTONS */}
        <div className="flex justify-center gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm rounded-md bg-red-500 text-white hover:bg-red-600"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;