// src/components/ui/Table.jsx
import React from 'react';

export const Table = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm ${className}`}>
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        {children}
      </table>
    </div>
  </div>
);

export const TableHead = ({ children, className = '' }) => (
  <thead className={`bg-gray-100 text-gray-600 text-xs uppercase ${className}`}>
    {children}
  </thead>
);

export const TableBody = ({ children, className = '' }) => (
  <tbody className={`divide-y divide-gray-200 ${className}`}>
    {children}
  </tbody>
);

export const TableRow = ({ children, className = '', onClick, hover = true }) => (
  <tr 
    className={`
      ${hover ? 'hover:bg-gray-50 transition-colors' : ''}
      ${className}
    `}
    onClick={onClick}
  >
    {children}
  </tr>
);

export const TableHeader = ({ children, className = '' }) => (
  <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${className}`}>
    {children}
  </th>
);

export const TableCell = ({ children, className = '', colSpan }) => (
  <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${className}`} colSpan={colSpan}>
    {children}
  </td>
);