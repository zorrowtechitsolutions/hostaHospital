// src/components/ui/Textarea.jsx
import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

export const Textarea = ({ 
  label, 
  name, 
  required = false, 
  rows = 3, 
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
        <textarea
          name={name}
          value={value || ''}
          onChange={onChange}
          onBlur={onBlur}
          rows={rows}
          className={`
            w-full px-3 py-2 border rounded-lg 
            focus:ring-2 focus:outline-none transition-all duration-200 text-sm
            resize-vertical
            ${hasError 
              ? 'border-red-500 focus:ring-red-500' 
              : 'border-gray-300 focus:ring-blue-500'
            }
            ${className}
          `}
          placeholder={placeholder}
          {...props}
        />
        {hasError && (
          <div className="absolute top-3 right-3">
            <AlertCircle className="h-4 w-4 text-red-500" />
          </div>
        )}
      </div>
      {hasError && (
        <p className="text-xs text-red-500 error-message">{error}</p>
      )}
      {isValid && !hasError && value && value.length > 0 && (
        <p className="text-xs text-green-500 flex items-center gap-1">
          <CheckCircle className="h-3 w-3" /> {value.length} characters
        </p>
      )}
    </div>
  );
};