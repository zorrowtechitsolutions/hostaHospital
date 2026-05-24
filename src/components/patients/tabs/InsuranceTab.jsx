// src/components/patients/tabs/InsuranceTab.jsx - With span, pagination, and proper styling
import React, { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button, Table, TableHead, TableBody, TableRow, TableHeader, TableCell, Pagination } from "../../ui";

const InsuranceTab = ({ patient, handleDeleteClick, getStatusBadge }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const insuranceList = patient?.insuranceList || [];
  const totalItems = insuranceList.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInsurance = insuranceList.slice(startIndex, startIndex + itemsPerPage);

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
          Insurance Details
          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded ml-2">
            {totalItems}
          </span>
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
            <tr>
              <TableHeader>Policy No</TableHeader>
              <TableHeader>Insurance Provider</TableHeader>
              <TableHeader>Plan Type</TableHeader>
              <TableHeader>Coverage Amount</TableHeader>
              <TableHeader>Start Date</TableHeader>
              <TableHeader>Expiry Date</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader className="text-right w-16"></TableHeader>
            </tr>
          </thead>
          <tbody>
            {paginatedInsurance.length > 0 ? (
              paginatedInsurance.map((item, index) => (
                <TableRow key={item.id} hover>
                  <TableCell className="text-[#1C62A0] font-medium">{item.policyNo}</TableCell>
                  <TableCell className="font-medium text-gray-800">{item.provider}</TableCell>
                  <TableCell className="text-gray-600">{item.planType}</TableCell>
                  <TableCell className="text-gray-600">{item.coverageAmount}</TableCell>
                  <TableCell className="text-gray-600">{item.startDate}</TableCell>
                  <TableCell className="text-gray-600">{item.expiryDate}</TableCell>
                  <TableCell>
                    <span className={getStatusBadge(item.status)}>{item.status}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick('insurance', item.id, null, `${item.provider} - ${item.policyNo}`)}
                        className="p-2 hover:text-red-600"
                        title="Delete Insurance Policy"
                      >
                        <Trash2 size={16} className="text-gray-500 hover:text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-gray-500 py-12">
                  No insurance policies found
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
            itemLabel="insurance policies"
          />
        </div>
      )}
    </div>
  );
};

export default InsuranceTab;