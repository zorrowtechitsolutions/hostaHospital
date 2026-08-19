import React from 'react';
import { ChevronDown, AlertCircle, CheckCircle } from 'lucide-react';

export const Select = ({ 
  label, 
  name, 
  required = false, 
  options, 
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  touched,
  className = '',
  ...props 
}) => {
  const hasError = error && touched;
  const isValid = touched && !error && value;
  
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          name={name}
          value={value || ''}
          onChange={onChange}
          onBlur={onBlur}
          className={`
            w-full px-3 py-2 border rounded-lg 
            focus:ring-2 focus:outline-none transition-all duration-200 text-sm
            appearance-none bg-white
            ${hasError 
              ? 'border-red-500 focus:ring-red-500' 
              : isValid
                ? 'border-green-500 focus:ring-green-500'
                : 'border-gray-300 focus:ring-blue-500'
            }
            ${className}
          `}
          {...props}
        >
          <option value="">
            {placeholder || `Select ${label}`}
          </option>

          {options.map((option, index) => {
            if (typeof option === 'string') {
              return (
                <option key={index} value={option}>
                  {option}
                </option>
              );
            } else if (typeof option === 'object' && option !== null) {
              return (
                <option key={index} value={option.value}>
                  {option.label || option.value}
                </option>
              );
            }

            return null;
          })}
        </select>

        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />

        {hasError && (
          <div className="absolute inset-y-0 right-8 pr-3 flex items-center">
            <AlertCircle className="h-4 w-4 text-red-500" />
          </div>
        )}

        {isValid && !hasError && value && (
          <div className="absolute inset-y-0 right-8 pr-3 flex items-center">
            <CheckCircle className="h-4 w-4 text-green-500" />
          </div>
        )}
      </div>

      {hasError && (
        <p className="text-xs text-red-500 error-message">
          {error}
        </p>
      )}
    </div>
  );
};