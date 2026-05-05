// src/components/ui/Breadcrumb.jsx
import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Breadcrumb = ({ items, onBack }) => {
  const navigate = useNavigate();

  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-1">
        {onBack && (
          <button
            onClick={onBack}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="Go back"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
        )}
        <div className="text-xs text-gray-500">
          {items.map((item, index) => (
            <span key={index}>
              <span className={index === items.length - 1 ? 'text-gray-800 font-medium' : 'text-gray-500'}>
                {item.label}
              </span>
              {index < items.length - 1 && <span className="mx-1 text-gray-400">»</span>}
            </span>
          ))}
        </div>
      </div>
      {items.length > 0 && (
        <h1 className="text-xl font-bold text-gray-800">{items[items.length - 1].label}</h1>
      )}
    </div>
  );
};