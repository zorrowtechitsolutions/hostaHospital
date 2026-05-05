// src/components/ui/DataTable.jsx
import React from 'react';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from './table';

export const DataTable = ({ 
  columns, 
  data, 
  onRowClick,
  loading = false,
  emptyMessage = "No data found"
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1C62A0]"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          {columns.map((col, idx) => (
            <TableHeader key={idx} className={col.className}>
              {col.header}
            </TableHeader>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {data.map((row, rowIdx) => (
          <TableRow 
            key={rowIdx} 
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={onRowClick ? 'cursor-pointer' : ''}
          >
            {columns.map((col, colIdx) => (
              <TableCell key={colIdx} className={col.cellClassName}>
                {col.accessor ? row[col.accessor] : col.cell?.(row)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};