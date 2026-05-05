// src/components/Doctor/DeleteDoctor.jsx - Refactored
import React, { useEffect } from "react";
import { Button, Modal } from "../ui";

const DeleteDoctor = ({ isOpen, onClose, doctorId, onDelete }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => document.body.classList.remove("overflow-hidden");
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDelete = () => {
    if (onDelete) onDelete();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white w-full max-w-sm rounded-xl shadow-lg p-6 text-center" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-red-100">
            <span className="text-red-600 text-xl">🗑</span>
          </div>
        </div>
        <h2 className="text-lg font-semibold text-gray-800">Delete Doctor</h2>
        <p className="text-sm text-gray-500 mt-2">This action cannot be undone. Are you sure you want to delete this doctor?</p>
        <div className="flex justify-center gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Delete</Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteDoctor;