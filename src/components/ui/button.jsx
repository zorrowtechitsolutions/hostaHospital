import React from 'react';

const variants = {
  primary: `
    bg-gradient-to-r
    from-green-600
    to-emerald-600
    hover:from-green-700
    hover:to-emerald-700
    text-white
    border-0
    shadow-lg
    hover:shadow-xl
    transition-all
    duration-300
  `,
  secondary: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50',
  danger: 'bg-red-500 hover:bg-red-600 text-white shadow-sm',
  success: 'bg-green-500 hover:bg-green-600 text-white shadow-sm',
  warning: 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-sm',
  outline: 'bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100',
};

const sizes = {
  xs: 'px-2 py-1 text-xs rounded',
  sm: 'px-3 py-1.5 text-sm rounded-md',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-6 py-2.5 text-base rounded-lg',
  xl: 'px-8 py-3 text-lg rounded-xl',
};

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  className = "",
  disabled,
  ...props
}) => {
  return (
    <button
      className={`font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2
        ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      )}
      {!isLoading && leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
};