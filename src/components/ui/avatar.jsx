// src/components/ui/Avatar.jsx
import React from 'react';

export const Avatar = ({ 
  src, 
  alt = '', 
  size = 'md', 
  rounded = 'full',
  className = '',
  ...props 
}) => {
  const sizes = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
    '2xl': 'w-20 h-20',
    '3xl': 'w-24 h-24',
  };
  
  const roundedStyles = {
    none: 'rounded-none',
    sm: 'rounded',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };
  
  return (
    <div className={`${sizes[size]} ${roundedStyles[rounded]} bg-gray-200 overflow-hidden flex-shrink-0 ${className}`}>
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" {...props} />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-500 font-medium">
          {alt ? alt.charAt(0).toUpperCase() : '?'}
        </div>
      )}
    </div>
  );
};