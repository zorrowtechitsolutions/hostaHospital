// src/components/ui/FilterBar.jsx
import React from 'react';
import { Search, Filter, X } from 'lucide-react';

export const FilterBar = ({ 
  isOpen, 
  onToggle, 
  children, 
  activeFilterCount = 0,
  onClearAll,
  title = "Filters",
  searchPlaceholder = "Search by Product ID, Name",
  searchValue = "",
  onSearchChange,
  showSearch = true,
  showSort = true,
  sortValue = "newest",
  onSortChange,
  showDate = true,
  dateValue = "",
  onDateChange,
  sortOptions = [
    { value: "newest", label: "Newest" },
    { value: "oldest", label: "Oldest" },
    { value: "az", label: "A to Z" },
    { value: "za", label: "Z to A" }
  ]
}) => {
  return (
    <div className="mb-6">
      {/* Filter Toggle Button */}
      <button
        onClick={onToggle}
        className={`relative p-2 border border-gray-200 rounded-md bg-white ${
          isOpen || activeFilterCount > 0 ? 'text-[#1C62A0]' : 'text-gray-500'
        } hover:bg-gray-50 transition-colors`}
        title="Toggle Filters"
      >
        <Filter size={16} />
        {activeFilterCount > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Filter Panel */}
      {isOpen && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mt-4 shadow-sm">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center">
                <Filter size={18} className="text-[#1C62A0]" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800">
                {title}
              </h2>
              {activeFilterCount > 0 && (
                <span className="bg-blue-100 text-[#1C62A0] text-xs font-semibold px-2 py-1 rounded-md">
                  {activeFilterCount} Active Filter{activeFilterCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {onClearAll && (
              <button 
                onClick={onClearAll} 
                className="text-red-500 text-sm font-medium hover:text-red-600 transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Search Input */}
            {showSearch && (
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchValue}
                  onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                  className="w-full h-12 pl-11 pr-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent text-gray-700 text-sm"
                />
              </div>
            )}

            {/* Sort Dropdown */}
            {showSort && (
              <select
                value={sortValue}
                onChange={(e) => onSortChange && onSortChange(e.target.value)}
                className="h-12 px-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent text-gray-700 text-sm bg-white cursor-pointer"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}

            {/* Date Input */}
            {showDate && (
              <input
                type="date"
                value={dateValue}
                onChange={(e) => onDateChange && onDateChange(e.target.value)}
                className="h-12 px-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent text-gray-700 text-sm"
              />
            )}
          </div>

          {/* Additional Children (Custom Filters) */}
          {children && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              {children}
            </div>
          )}
        </div>
      )}
    </div>
  );
};