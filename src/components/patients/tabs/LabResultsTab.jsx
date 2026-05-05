// src/components/patients/tabs/LabResultsTab.jsx - Fixed closing tags
import React, { useState } from "react";
import { MoreVertical, Eye, Trash2 } from "lucide-react";
import { Button, Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from "../../ui";
import LaboratoryReportModal from "../modals/LaboratoryReportModal";

const LabResultsTab = ({ patient, handleDeleteClick, openMenu, setOpenMenu, getStatusBadge }) => {
  const [selectedLabResult, setSelectedLabResult] = useState(null);
  const [showLabModal, setShowLabModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const labResultsList = patient?.labResultsList || [];
  const totalItems = labResultsList.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLabResults = labResultsList.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleViewReport = (labResult) => {
    setSelectedLabResult(labResult);
    setShowLabModal(true);
    setOpenMenu(null);
  };

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">
            Total Lab Results
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded ml-2">
              {totalItems}
            </span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
              <tr>
                <TableHeader>Test ID</TableHeader>
                <TableHeader>Appointment Date</TableHeader>
                <TableHeader>Referred By</TableHeader>
                <TableHeader>Test Name</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader className="text-right w-16"></TableHeader>
              </tr>
            </thead>
            <tbody>
              {paginatedLabResults.length > 0 ? (
                paginatedLabResults.map((item, index) => (
                  <TableRow key={item.id || index} hover>
                    <TableCell 
                      className="text-[#1C62A0] font-medium cursor-pointer"
                      onClick={() => handleViewReport(item)}
                    >
                      {item.id}
                    </TableCell>
                    <TableCell 
                      className="text-gray-600 cursor-pointer"
                      onClick={() => handleViewReport(item)}
                    >
                      {item.appointmentDate}
                    </TableCell>
                    <TableCell 
                      className="font-medium text-gray-800 cursor-pointer"
                      onClick={() => handleViewReport(item)}
                    >
                      {item.referredBy}
                    </TableCell>
                    <TableCell 
                      className="text-gray-700 cursor-pointer"
                      onClick={() => handleViewReport(item)}
                    >
                      {item.testName}
                    </TableCell>
                    <TableCell 
                      className="cursor-pointer"
                      onClick={() => handleViewReport(item)}
                    >
                      <span className={getStatusBadge(item.status)}>{item.status}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end">
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setOpenMenu(openMenu === `lab-${item.id}` ? null : `lab-${item.id}`);
                            }}
                            className="p-2"
                          >
                            <MoreVertical size={16} className="text-gray-500" />
                          </Button>
                          {openMenu === `lab-${item.id}` && (
                            <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1">
                              <button
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  handleViewReport(item);
                                  setOpenMenu(null);
                                }}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                              >
                                <Eye size={15} /> View Report
                              </button>
                              <button
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  handleDeleteClick('lab', item.id, startIndex + index, `${item.testName} (${item.id})`);
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
                  <TableCell colSpan={6} className="text-center text-gray-500 py-12">
                    No lab results found
                  </TableCell>
                </TableRow>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalItems > 0 && (
          <div className="px-6 py-3 border-t bg-gray-50 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Showing {paginatedLabResults.length} of {totalItems} lab results
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="px-3 py-1 bg-[#1C62A0] text-white rounded-md text-sm">
                {currentPage}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <LaboratoryReportModal
        isOpen={showLabModal}
        onClose={() => {
          setShowLabModal(false);
          setSelectedLabResult(null);
        }}
        labResult={selectedLabResult}
        patient={patient}
      />
    </>
  );
};

export default LabResultsTab;