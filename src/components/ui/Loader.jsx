// src/components/ui/Loader.jsx
import React from 'react';

export const Loader = ({ size = 'md', fullPage = false, className = '' }) => {
  const sizes = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-14 w-14',
    xl: 'h-20 w-20',
  };
  
  const spinner = (
    <div className={`animate-spin rounded-full border-b-2 border-[#1C62A0] ${sizes[size]} ${className}`} />
  );
  
  if (fullPage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        {spinner}
      </div>
    );
  }
  
  return spinner;
};