// src/components/ui/Checkbox.jsx
import React from 'react';

export const Checkbox = ({ checked, onChange, label, disabled = false, className = '', ...props }) => {
  const checkbox = (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => !disabled && onChange?.(!checked)}
      disabled={disabled}
      className={`
        w-5 h-5 rounded border-2 flex items-center justify-center transition-all
        ${checked ? 'bg-[#1C62A0] border-[#1C62A0]' : 'border-gray-300 hover:border-[#1C62A0]'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      {...props}
    >
      {checked && (
        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </button>
  );

  if (label) {
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        {checkbox}
        <span className="text-sm text-gray-700">{label}</span>
      </label>
    );
  }

  return checkbox;
};