// src/components/patients/tabs/DocumentsTab.jsx - With span, pagination, and proper action buttons
import React, { useState } from "react";
import { File, Download, Trash2 } from "lucide-react";
import { Button, Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from "../../ui";

const DocumentsTab = ({ patient, handleDownloadDocument, handleDeleteClick }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const documentsList = patient?.documentsList || [];
  const totalItems = documentsList.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDocuments = documentsList.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getTypeBadgeClass = (type) => {
    const classes = {
      PDF: "bg-red-100 text-red-700",
      DOC: "bg-blue-100 text-blue-700",
      DOCX: "bg-blue-100 text-blue-700",
      JPG: "bg-green-100 text-green-700",
      PNG: "bg-green-100 text-green-700",
      XLS: "bg-purple-100 text-purple-700",
      XLSX: "bg-purple-100 text-purple-700"
    };
    return classes[type] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-700">
          Total Documents
          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded ml-2">
            {totalItems}
          </span>
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
            <tr>
              <TableHeader>Document Name</TableHeader>
              <TableHeader>Date</TableHeader>
              <TableHeader>File Size</TableHeader>
              <TableHeader>Type</TableHeader>
              <TableHeader className="text-right w-24"></TableHeader>
            </tr>
          </thead>
          <tbody>
            {paginatedDocuments.length > 0 ? (
              paginatedDocuments.map((item, index) => (
                <TableRow key={item.id} hover>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <File size={16} className="text-blue-500" />
                      <span className="font-medium text-gray-800">{item.documentName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600">{item.date}</TableCell>
                  <TableCell className="text-gray-500">{item.fileSize}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${getTypeBadgeClass(item.type)}`}>
                      {item.type}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadDocument(item)}
                        className="p-2 hover:text-blue-600"
                        title="Download Document"
                      >
                        <Download size={16} className="text-gray-500 hover:text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick('document', item.id, startIndex + index, item.documentName)}
                        className="p-2 hover:text-red-600"
                        title="Delete Document"
                      >
                        <Trash2 size={16} className="text-gray-500 hover:text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500 py-12">
                  No documents found
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
            Showing {paginatedDocuments.length} of {totalItems} documents
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
  );
};

export default DocumentsTab;