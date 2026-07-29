// src/components/patients/tabs/VisitHistoryTab.jsx - Enhanced with better functionality
import React, { useState, useMemo, useCallback } from "react";
import { MoreVertical, Trash2, Eye } from "lucide-react";
import { Button, TableHead, TableHeader, TableCell, Pagination } from "../../ui";
import { formatDate } from "../../../utils/dateFormatter";

const VisitHistoryTab = ({ 
  patient, 
  handleViewVisitDetails, 
  handleDeleteClick, 
  openMenu, 
  setOpenMenu, 
  getStatusBadge 
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const itemsPerPage = 5;

  // Memoize visit history list
  const visitHistoryList = useMemo(() => patient?.visitHistoryList || [], [patient]);
  const totalItems = visitHistoryList.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  // Reset to page 1 when data changes
  useMemo(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Sorting function
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return visitHistoryList;
    
    const sorted = [...visitHistoryList].sort((a, b) => {
      let aVal = a[sortConfig.key] || '';
      let bVal = b[sortConfig.key] || '';
      
      if (sortConfig.key === 'visitDate') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [visitHistoryList, sortConfig]);

  // Paginate sorted data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);

  const handleSort = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const handlePageChange = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [totalPages]);

  const handleMenuToggle = useCallback((itemId, e) => {
    e.stopPropagation();
    setOpenMenu(openMenu === `visit-${itemId}` ? null : `visit-${itemId}`);
  }, [openMenu, setOpenMenu]);

  const handleDelete = useCallback((item, e) => {
    e.stopPropagation();
    handleDeleteClick(
      'visit',
      item.id,
      `Visit on ${item.visitDate}`
    );
    setOpenMenu(null);
  }, [handleDeleteClick, setOpenMenu]);

  const handleRowClick = useCallback((item) => {
    handleViewVisitDetails(item);
  }, [handleViewVisitDetails]);

  // Get sort indicator
  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return '↕';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50 flex-shrink-0">
        <h2 className="text-sm font-semibold text-gray-700">
          Total Visit History
          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded ml-2">
            {totalItems}
          </span>
        </h2>
        {totalItems > 0 && (
          <span className="text-xs text-gray-500">
            Showing {((currentPage - 1) * itemsPerPage) + 1}-
            {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="flex flex-col min-h-[420px]">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
              <tr>
                <th 
                  className="px-4 py-3 font-semibold cursor-pointer hover:text-gray-800 select-none"
                  onClick={() => handleSort('visitId')}
                >
                  Visit ID {getSortIndicator('visitId')}
                </th>
                <th 
                  className="px-4 py-3 font-semibold cursor-pointer hover:text-gray-800 select-none"
                  onClick={() => handleSort('doctorName')}
                >
                  Doctor Name {getSortIndicator('doctorName')}
                </th>
                <th 
                  className="px-4 py-3 font-semibold cursor-pointer hover:text-gray-800 select-none"
                  onClick={() => handleSort('department')}
                >
                  Department {getSortIndicator('department')}
                </th>
                <th 
                  className="px-4 py-3 font-semibold cursor-pointer hover:text-gray-800 select-none"
                  onClick={() => handleSort('visitDate')}
                >
                  Visit Date {getSortIndicator('visitDate')}
                </th>
                <th 
                  className="px-4 py-3 font-semibold cursor-pointer hover:text-gray-800 select-none"
                  onClick={() => handleSort('status')}
                >
                  Status {getSortIndicator('status')}
                </th>
                <th className="px-4 py-3 text-right w-16"></th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length > 0 ? (
                paginatedData.map((item) => (
                  <tr 
                    key={item.id} 
                    className="border-t border-gray-100 hover:bg-gray-50 transition-colors group"
                  >
                    <td
                      className="px-4 py-3 text-[#1C62A0] font-medium cursor-pointer"
                      onClick={() => handleRowClick(item)}
                    >
                      {item.visitId || item.id}
                    </td>
                    <td
                      className="px-4 py-3 cursor-pointer"
                      onClick={() => handleRowClick(item)}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium text-blue-600">
                            {item.doctorName?.charAt(0) || 'D'}
                          </span>
                        </div>
                        <span className="font-medium text-gray-800 truncate max-w-[150px]">
                          {item.doctorName}
                        </span>
                      </div>
                    </td>
                    <td
                      className="px-4 py-3 text-gray-600 cursor-pointer"
                      onClick={() => handleRowClick(item)}
                    >
                      {item.department}
                    </td>
                    <td
                      className="px-4 py-3 text-gray-600 cursor-pointer whitespace-nowrap"
                      onClick={() => handleRowClick(item)}
                    >
                      {formatDate(item.visitDate)}
                    </td>
                    <td
                      className="px-4 py-3 cursor-pointer"
                      onClick={() => handleRowClick(item)}
                    >
                      <span className={getStatusBadge(item.status)}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        {/* Quick view button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(item);
                          }}
                          className="p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="View details"
                        >
                          <Eye size={15} className="text-gray-500" />
                        </Button>
                        
                        {/* Menu button */}
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleMenuToggle(item.id, e)}
                            className="p-1.5"
                          >
                            <MoreVertical size={15} className="text-gray-500" />
                          </Button>
                          {openMenu === `visit-${item.id}` && (
                            <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1">
                              <button
                                onClick={(e) => handleDelete(item, e)}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 size={15} /> Delete Visit
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center text-gray-500 py-12">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-4xl">📋</span>
                      <p>No visit history found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalItems > 0 && totalPages > 1 && (
          <div className="mt-auto px-6 py-3 border-t bg-gray-50">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              itemLabel="visit records"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default VisitHistoryTab;