// src/components/ui/Pagination.jsx
import React from 'react';

export const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  totalItems,
  itemsPerPage,
  className = ''
}) => {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);
  
  return (
    <div className={`px-6 py-3 bg-gray-50 rounded-b-xl border-t border-gray-200 flex items-center justify-between ${className}`}>
      <div className="text-sm text-gray-500">
        Showing {startIndex + 1} to {endIndex} of {totalItems} items
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`
            px-3 py-1 border rounded-md text-sm transition-all
            ${currentPage === 1
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-white text-gray-600 hover:bg-gray-50 border-gray-300"
            }
          `}
        >
          Previous
        </button>
        <span className="px-3 py-1 bg-[#1C62A0] text-white rounded-md text-sm">
          {currentPage}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          className={`
            px-3 py-1 border rounded-md text-sm transition-all
            ${currentPage === totalPages || totalPages === 0
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-white text-gray-600 hover:bg-gray-50 border-gray-300"
            }
          `}
        >
          Next
        </button>
      </div>
    </div>
  );
};