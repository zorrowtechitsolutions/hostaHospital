// src/components/patients/tabs/VisitHistoryTab.jsx - With sticky pagination at bottom
import React, { useState } from "react";
import { MoreVertical, Trash2 } from "lucide-react";
import { Button, TableHead, TableHeader, TableCell, Pagination } from "../../ui";
import { formatDate } from "../../../utils/dateFormatter";

// ============ SKELETON LOADING COMPONENTS ============

const SkeletonText = ({ width = "w-full", height = "h-4", className = "" }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${width} ${height} ${className}`}></div>
);

const SkeletonRow = () => (
  <tr className="border-t border-gray-100">
    <td className="px-4 py-3">
      <SkeletonText width="w-20" height="h-3" />
    </td>
    <td className="px-4 py-3">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-gray-200 animate-pulse"></div>
        <SkeletonText width="w-28" height="h-3" />
      </div>
    </td>
    <td className="px-4 py-3">
      <SkeletonText width="w-24" height="h-3" />
    </td>
    <td className="px-4 py-3">
      <SkeletonText width="w-28" height="h-3" />
    </td>
    <td className="px-4 py-3">
      <SkeletonText width="w-16" height="h-5" className="rounded-full" />
    </td>
    <td className="px-4 py-3 text-right">
      <SkeletonText width="w-8" height="h-4" className="ml-auto" />
    </td>
  </tr>
);

const VisitHistorySkeleton = () => (
  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm flex flex-col h-[500px]">
    {/* Header - Fixed */}
    <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50 flex-shrink-0">
      <div className="flex items-center gap-2">
        <SkeletonText width="w-36" height="h-5" />
        <SkeletonText width="w-8" height="h-5" className="rounded-full" />
      </div>
    </div>

    <div className="flex flex-col h-full">
      {/* Scrollable table container */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-600 text-xs uppercase sticky top-0 z-10">
            <tr>
              <TableHeader>
                <SkeletonText width="w-12" height="h-3" />
              </TableHeader>
              <TableHeader>
                <SkeletonText width="w-20" height="h-3" />
              </TableHeader>
              <TableHeader>
                <SkeletonText width="w-20" height="h-3" />
              </TableHeader>
              <TableHeader>
                <SkeletonText width="w-16" height="h-3" />
              </TableHeader>
              <TableHeader>
                <SkeletonText width="w-12" height="h-3" />
              </TableHeader>
              <TableHeader className="text-right w-16">
                <SkeletonText width="w-8" height="h-3" className="ml-auto" />
              </TableHeader>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, index) => (
              <SkeletonRow key={index} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination - Sticky at bottom */}
      <div className="flex-shrink-0 px-6 py-3 border-t bg-gray-50">
        <div className="flex justify-between items-center">
          <SkeletonText width="w-32" height="h-3" />
          <div className="flex gap-2">
            <SkeletonText width="w-8" height="h-8" />
            <SkeletonText width="w-8" height="h-8" />
            <SkeletonText width="w-8" height="h-8" />
            <SkeletonText width="w-8" height="h-8" />
            <SkeletonText width="w-8" height="h-8" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ============ END SKELETON LOADING COMPONENTS ============

const VisitHistoryTab = ({ 
  patient, 
  handleViewVisitDetails, 
  handleDeleteClick, 
  openMenu, 
  setOpenMenu, 
  getStatusBadge,
  isLoading = false // New prop for loading state
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const visitHistoryList = patient?.visitHistoryList || [];
  const totalItems = visitHistoryList.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedVisitHistory = visitHistoryList.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ============ SKELETON LOADING STATE ============
  if (isLoading) {
    return <VisitHistorySkeleton />;
  }
  // ============ END SKELETON LOADING STATE ============

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm flex flex-col h-[500px]">
      {/* Header - Fixed */}
      <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50 flex-shrink-0">
        <h2 className="text-sm font-semibold text-gray-700">
          Total Visit History
          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded ml-2">
            {totalItems}
          </span>
        </h2>
      </div>

      {totalItems === 0 ? (
        <div className="text-center py-12 flex-1 flex items-center justify-center flex-col">
          <p className="text-gray-500">No visit history found</p>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          {/* Scrollable table container */}
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-600 text-xs uppercase sticky top-0 z-10">
                <tr>
                  <TableHeader>Visit ID</TableHeader>
                  <TableHeader>Doctor Name</TableHeader>
                  <TableHeader>Department</TableHeader>
                  <TableHeader>Visit Date</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader className="text-right w-16"></TableHeader>
                </tr>
              </thead>
              <tbody>
                {paginatedVisitHistory.map((item) => (
                  <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                    <td
                      className="px-4 py-3 text-[#1C62A0] font-medium cursor-pointer"
                      onClick={() => handleViewVisitDetails(item)}
                    >
                      {item.visitId || item.id}
                    </td>
                    <td
                      className="px-4 py-3 cursor-pointer"
                      onClick={() => handleViewVisitDetails(item)}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-xs font-medium text-blue-600">
                            {item.doctorName?.charAt(0) || 'D'}
                          </span>
                        </div>
                        <span className="font-medium text-gray-800">{item.doctorName}</span>
                      </div>
                    </td>
                    <td
                      className="px-4 py-3 text-gray-600 cursor-pointer"
                      onClick={() => handleViewVisitDetails(item)}
                    >
                      {item.department}
                    </td>
                    <td
                      className="px-4 py-3 text-gray-600 cursor-pointer"
                      onClick={() => handleViewVisitDetails(item)}
                    >
                      {item.visitDate}
                    </td>
                    <td
                      className="px-4 py-3 cursor-pointer"
                      onClick={() => handleViewVisitDetails(item)}
                    >
                      <span className={getStatusBadge(item.status)}>{item.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end">
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenu(openMenu === `visit-${item.id}` ? null : `visit-${item.id}`);
                            }}
                            className="p-2"
                          >
                            <MoreVertical size={16} className="text-gray-500" />
                          </Button>
                          {openMenu === `visit-${item.id}` && (
                            <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClick(
                                    'visit',
                                    item.id,
                                    `Visit on ${item.visitDate}`
                                  );
                                  setOpenMenu(null);
                                }}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-50 rounded-lg"
                              >
                                <Trash2 size={15} /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination - Sticky at bottom */}
          {totalPages > 1 && (
            <div className="flex-shrink-0 px-6 py-3 border-t bg-gray-50">
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
      )}
    </div>
  );
};

export default VisitHistoryTab;