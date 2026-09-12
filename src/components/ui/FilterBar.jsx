// src/components/ui/FilterBar.jsx
import React from "react";
import { Filter } from "lucide-react";

// ✅ Global filter button style — icon always stays gray
export const FILTER_BUTTON_CLASS =
  "relative p-2 border border-gray-200 rounded-md bg-white transition-colors text-gray-500 hover:bg-gray-50";

const FilterBar = ({
  onClick,
  isOpen = false,
  activeFilterCount = 0,
  title = "Toggle Filters",
  className = "",
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${FILTER_BUTTON_CLASS} ${className}`}
      title={title}
      aria-expanded={isOpen}
      aria-label={title}
    >
      <Filter size={16} />
      {activeFilterCount > 0 && !isOpen && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
          {activeFilterCount}
        </span>
      )}
    </button>
  );
};

export default FilterBar;