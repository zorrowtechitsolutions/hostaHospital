// src/components/patients/tabs/PrescriptionTab.jsx - Matching AppointmentsTab style
import React, { useState } from "react";
import { MoreVertical, Eye, Trash2 } from "lucide-react";
import { Button, Table, TableHead, TableBody, TableRow, TableHeader, TableCell, Pagination } from "../../ui";

const PrescriptionTab = ({ 
  patient, 
  handleDeleteClick, 
  handleViewDetails,
  openMenu, 
  setOpenMenu, 
  getStatusBadge 
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const prescriptionsList = patient?.prescriptionsList || [];
  const totalItems = prescriptionsList.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPrescriptions = prescriptionsList.slice(startIndex, startIndex + itemsPerPage);

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
          Total Prescriptions
          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded ml-2">
            {totalItems}
          </span>
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
            <tr>
              <TableHeader>Type</TableHeader>
              <TableHeader>Quantity</TableHeader>
              <TableHeader>Date</TableHeader>
              <TableHeader>Prescribed By</TableHeader>
              <TableHeader>Amount</TableHeader>
              <TableHeader>Payment Method</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader className="text-right"></TableHeader>
            </tr>
          </thead>
          <tbody>
            {paginatedPrescriptions.length > 0 ? (
              paginatedPrescriptions.map((item, index) => (
                <TableRow key={item.id} hover>
                  <TableCell 
                    className="text-gray-800 cursor-pointer"
                    onClick={() => handleViewDetails(item)}
                  >
                    {item.type}
                  </TableCell>
                  <TableCell 
                    className="text-gray-600 cursor-pointer"
                    onClick={() => handleViewDetails(item)}
                  >
                    {item.quantity}
                  </TableCell>
                  <TableCell 
                    className="text-gray-600 cursor-pointer"
                    onClick={() => handleViewDetails(item)}
                  >
                    {item.date}
                  </TableCell>
                  <TableCell 
                    className="font-medium text-gray-800 cursor-pointer"
                    onClick={() => handleViewDetails(item)}
                  >
                    {item.prescribedBy}
                  </TableCell>
                  <TableCell 
                    className="text-gray-600 cursor-pointer"
                    onClick={() => handleViewDetails(item)}
                  >
                    {item.amount}
                  </TableCell>
                  <TableCell 
                    className="text-gray-600 cursor-pointer"
                    onClick={() => handleViewDetails(item)}
                  >
                    {item.paymentMethod}
                  </TableCell>
                  <TableCell 
                    className="cursor-pointer"
                    onClick={() => handleViewDetails(item)}
                  >
                    <span className={getStatusBadge(item.status)}>{item.status}</span>
                  </TableCell>
                  <TableCell className="text-right relative action-menu-container">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setOpenMenu(openMenu === `prescription-${item.id}` ? null : `prescription-${item.id}`);
                      }}
                      className="p-2"
                    >
                      <MoreVertical size={16} className="text-gray-500" />
                    </Button>
                    {openMenu === `prescription-${item.id}` && (
                      <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1">
                        <button
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            handleViewDetails(item);
                            setOpenMenu(null);
                          }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Eye size={15} /> View Details
                        </button>
                        <button
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            handleDeleteClick('prescription', item.id, startIndex + index, `${item.type} prescribed on ${item.date}`);
                            setOpenMenu(null);
                          }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                        >
                          <Trash2 size={15} /> Delete
                        </button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-gray-500 py-12">
                  No prescriptions found
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
            itemLabel="prescriptions"
          />
        </div>
      )}
    </div>
  );
};

export default PrescriptionTab;