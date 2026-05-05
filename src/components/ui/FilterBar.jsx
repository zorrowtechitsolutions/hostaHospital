// src/components/ui/FilterBar.jsx
import React from 'react';
import { Filter, X } from 'lucide-react';

export const FilterBar = ({ 
  isOpen, 
  onToggle, 
  children, 
  activeFilterCount = 0,
  onClearAll,
  title = "Filters"
}) => {
  return (
    <div>
      <button
        onClick={onToggle}
        className={`relative p-2 border border-gray-200 rounded-md bg-white ${
          isOpen || activeFilterCount > 0 ? 'text-blue-600' : 'text-gray-500'
        } hover:bg-gray-50`}
      >
        <Filter size={16} />
        {activeFilterCount > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
            {activeFilterCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mt-4 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
              {activeFilterCount > 0 && (
                <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-md">
                  {activeFilterCount} Active Filter{activeFilterCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            {onClearAll && (
              <button onClick={onClearAll} className="text-sm text-red-600 hover:text-red-700 font-medium">
                Clear All Filters
              </button>
            )}
          </div>
          {children}
        </div>
      )}
    </div>
  );
};