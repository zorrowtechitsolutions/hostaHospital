// src/components/ui/Tabs.jsx
import React from 'react';

export const Tabs = ({ tabs, activeTab, onTabChange, className = '' }) => {
  return (
    <div className={`w-full overflow-x-auto scrollbar-hide ${className}`}>
      <nav className="flex min-w-max gap-6 sm:gap-8 border-b border-gray-200 -mb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`
              shrink-0
              whitespace-nowrap
              py-4 px-1
              border-b-2
              font-medium text-sm
              flex items-center gap-2
              transition-colors
              ${activeTab === tab.id
                ? 'border-[#1C62A0] text-[#1C62A0]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            {tab.icon && <tab.icon className="w-4 h-4 shrink-0" />}
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
};