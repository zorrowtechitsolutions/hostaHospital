// src/components/patients/DeleteModal.jsx - Refactored
import React from "react";
import { Button, Modal } from "../ui";

const DeleteModal = ({ isOpen, onClose, onConfirm, title, message, itemName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white w-full max-w-sm rounded-xl shadow-lg p-6 text-center" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-red-100">
            <span className="text-red-600 text-xl">🗑</span>
          </div>
        </div>
        <h2 className="text-lg font-semibold text-gray-800">{title || "Delete Item"}</h2>
        <p className="text-sm text-gray-500 mt-2">{message || "This action cannot be undone. Are you sure you want to delete this item?"}</p>
        {itemName && <p className="text-sm font-medium text-red-600 mt-2">"{itemName}"</p>}
        <div className="flex justify-center gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm}>Yes, Delete</Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;