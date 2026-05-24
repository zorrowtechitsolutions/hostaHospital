// src/components/patients/tabs/VitalsTab.jsx - With span, pagination, and proper action menu
import React, { useState } from "react";
import { MoreVertical, Eye, Trash2 } from "lucide-react";
import { Button, Table, TableHead, TableBody, TableRow, TableHeader, TableCell, Pagination } from "../../ui";

const VitalsTab = ({ patient, handleViewVitalDetails, handleDeleteClick, openMenu, setOpenMenu, getStatusBadge }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const vitalsList = patient?.vitalsList || [];
  const totalItems = vitalsList.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedVitals = vitalsList.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-700">
          Total Vitals Records
          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded ml-2">
            {totalItems}
          </span>
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
            <tr>
              <TableHeader>Doctor Name</TableHeader>
              <TableHeader>Department</TableHeader>
              <TableHeader>Date</TableHeader>
              <TableHeader className="text-right w-16"></TableHeader>
            </tr>
          </thead>
          <tbody>
            {paginatedVitals.length > 0 ? (
              paginatedVitals.map((item, index) => (
                <TableRow key={item.id} hover>
                  <TableCell 
                    className="cursor-pointer"
                    onClick={() => handleViewVitalDetails(item)}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-xs font-medium text-blue-600">
                          {item.doctorName?.charAt(0) || 'D'}
                        </span>
                      </div>
                      <span className="font-medium text-gray-800">{item.doctorName}</span>
                    </div>
                  </TableCell>
                  <TableCell 
                    className="text-gray-600 cursor-pointer"
                    onClick={() => handleViewVitalDetails(item)}
                  >
                    {item.department}
                  </TableCell>
                  <TableCell 
                    className="text-gray-600 cursor-pointer"
                    onClick={() => handleViewVitalDetails(item)}
                  >
                    {item.date}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end">
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setOpenMenu(openMenu === `vitals-${item.id}` ? null : `vitals-${item.id}`);
                          }}
                          className="p-2"
                        >
                          <MoreVertical size={16} className="text-gray-500" />
                        </Button>
                        {openMenu === `vitals-${item.id}` && (
                          <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1">
                            <button
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                handleViewVitalDetails(item);
                                setOpenMenu(null);
                              }}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                            >
                              <Eye size={15} /> View Details
                            </button>
                            <button
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                handleDeleteClick('vital', item.id, startIndex + index, `${item.date} - ${item.doctorName}`);
                                setOpenMenu(null);
                              }}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-50 rounded-b-lg"
                            >
                              <Trash2 size={15} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-gray-500 py-12">
                  No vital records found
                </TableCell>
              </TableRow>
            )}
          </tbody>
        </table>
      </div>

      {/* REPLACED INLINE PAGINATION WITH REUSABLE COMPONENT */}
      {totalItems > 0 && totalPages > 1 && (
        <div className="px-6 py-3 border-t bg-gray-50">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            itemLabel="vital records"
          />
        </div>
      )}
    </div>
  );
};

export default VitalsTab;