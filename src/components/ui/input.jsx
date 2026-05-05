// src/components/ui/Input.jsx
import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

export const Input = ({ 
  label, 
  name, 
  type = "text", 
  required = false, 
  icon: Icon, 
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
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className={`h-4 w-4 ${hasError ? 'text-red-400' : 'text-gray-400'}`} />
          </div>
        )}
        <input
          type={type}
          name={name}
          value={value || ''}
          onChange={onChange}
          onBlur={onBlur}
          className={`
            w-full px-3 py-2 
            ${Icon ? 'pl-9' : 'pl-3'} 
            pr-3 border rounded-lg 
            focus:ring-2 focus:outline-none transition-all duration-200 text-sm
            ${hasError 
              ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
              : isValid
                ? 'border-green-500 focus:ring-green-500 focus:border-green-500'
                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            }
            ${className}
          `}
          placeholder={placeholder}
          {...props}
        />
        {hasError && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <AlertCircle className="h-4 w-4 text-red-500" />
          </div>
        )}
        {isValid && !hasError && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <CheckCircle className="h-4 w-4 text-green-500" />
          </div>
        )}
      </div>
      {hasError && (
        <p className="text-xs text-red-500 error-message">{error}</p>
      )}
      {isValid && !hasError && value && (
        <p className="text-xs text-green-500">✓ Valid</p>
      )}
    </div>
  );
};