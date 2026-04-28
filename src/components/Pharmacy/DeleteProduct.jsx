import React from "react";

const DeleteProduct = ({ isOpen, onClose, productId, onDelete }) => {
  if (!isOpen) return null;

  const handleDelete = () => {
    const saved = JSON.parse(localStorage.getItem("products")) || [];

    const updated = saved.filter(
      (p) => p.id.replace("#", "") !== productId
    );

    localStorage.setItem("products", JSON.stringify(updated));

    if (onDelete) onDelete(); // callback (navigate / refresh)
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">

      {/* MODAL */}
      <div className="bg-white w-full max-w-sm rounded-xl shadow-lg p-6 text-center animate-fadeIn">

        {/* ICON */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-red-100">
            <span className="text-red-600 text-xl">🗑</span>
          </div>
        </div>

        {/* TITLE */}
        <h2 className="text-lg font-semibold text-gray-800">
          Delete Product
        </h2>

        {/* MESSAGE */}
        <p className="text-sm text-gray-500 mt-2">
          This action cannot be undone. Are you sure you want to delete this product?
        </p>

        {/* BUTTONS */}
        <div className="flex justify-center gap-3 mt-6">

          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            onClick={handleDelete}
            className="px-4 py-2 text-sm rounded-md bg-red-500 text-white hover:bg-red-600"
          >
            Yes, Delete
          </button>

        </div>
      </div>
    </div>
  );
};

export default DeleteProduct;