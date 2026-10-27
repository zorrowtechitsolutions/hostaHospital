// src/components/ui/CustomSelect.jsx
import React, { useState } from 'react';

/**
 * Reusable controlled dropdown that renders inside the modal DOM
 * (no native popup) so it works consistently on mobile.
 *
 * Props:
 *  - label: string
 *  - value: string (selected value)
 *  - options: Array<{ value: string, label: string }>
 *  - onChange: (value) => void
 *  - onBlur: () => void  (optional, called when dropdown closes without selection)
 *  - placeholder: string
 *  - error: string
 *  - touched: boolean
 *  - disabled: boolean
 *  - required: boolean
 */
const CustomSelect = ({
  label,
  value,
  options = [],
  onChange,
  onBlur,
  placeholder = 'Select an option',
  error,
  touched,
  disabled = false,
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find(o => o.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;
  const showError = error && touched;

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen(prev => !prev);
    if (!isOpen && onBlur) onBlur();
  };

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && '*'}
      </label>

      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`w-full px-3 py-2 border rounded-lg bg-white text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-[#1C62A0] ${
          showError
            ? 'border-red-500'
            : 'border-gray-300'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed text-gray-400' : ''}`}
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-400'}>
          {displayLabel}
        </span>

        <svg
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 top-full mt-1 z-[100] bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
          <div className="max-h-60 overflow-y-auto py-1">
            {options.length === 0 ? (
              <div className="px-3 py-2.5 text-sm text-gray-400">
                No options available
              </div>
            ) : (
              options.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full px-3 py-2.5 text-left text-sm hover:bg-blue-50 transition-colors ${
                    value === option.value
                      ? 'bg-blue-50 text-[#1C62A0] font-medium'
                      : 'text-gray-700'
                  }`}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {showError && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
};

export default CustomSelect;