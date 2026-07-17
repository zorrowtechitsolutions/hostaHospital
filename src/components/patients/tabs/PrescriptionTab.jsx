import React, { useState } from "react";
import { MoreVertical, Eye, Trash2, FileText, RotateCcw } from "lucide-react";
import { Button, Pagination, Badge } from "../../ui";

const PrescriptionTab = ({ 
  patient, 
  handleDeleteClick, 
  handleViewDetails,
  handleRecoverClick,
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

  // Helper function to get doctor display name
  const getDoctorDisplayName = (item) => {
    return (
      item.doctorName ||
      item.doctor?.name ||
      item.physicianName ||
      item.prescribedBy ||
      item.fullData?.doctorName ||
      item.fullData?.doctor?.name ||
      item.consultation?.doctorName ||
      item.consultation?.doctor?.name ||
      item.appointment?.doctor?.name ||
      "Dr. Unknown"
    );
  };

  // Helper function to get doctor specialization
  const getDoctorSpecialization = (item) => {
    return (
      item.doctorSpecialization ||
      item.specialization ||
      item.department ||
      item.doctorSpecialty ||
      item.fullData?.doctorSpecialization ||
      item.fullData?.specialization ||
      item.doctor?.specialization ||
      item.consultation?.doctorSpecialization ||
      item.consultation?.doctor?.specialization ||
      item.appointment?.doctor?.specialization ||
      "General Medicine"
    );
  };

  // Check if prescription is blacklisted (deleted)
  const isBlacklisted = (item) => {
    return item.isDelete === true || 
           item.status === 'deleted' || 
           item.status === 'Blacklisted' ||
           item.isDelete === 'true';
  };

  // Get status badge variant like staff module
  const getStatusVariant = (item) => {
    if (isBlacklisted(item)) {
      return "dark";
    }
    if (item.status === "Completed" || item.status === "Active") {
      return "success";
    }
    return "danger";
  };

  // Get status text like staff module
  const getStatusText = (item) => {
    if (isBlacklisted(item)) {
      return "Blacklisted";
    }
    return item.status || "Active";
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm flex flex-col">
      <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50 flex-shrink-0">
        <h2 className="text-sm font-semibold text-gray-700">
          Total Prescriptions
          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded ml-2">
            {totalItems}
          </span>
        </h2>
      </div>

      {totalItems === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <FileText size={32} className="text-gray-400" />
          </div>
          <p className="text-gray-500">No prescriptions found</p>
          <p className="text-sm text-gray-400 mt-1">Prescriptions will appear here after consultation</p>
        </div>
      ) : (
        <div className="flex flex-col min-h-[420px]">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Prescribed By</th>
                  <th className="px-6 py-3">Specialization</th>
                  <th className="px-6 py-3">Medicines</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPrescriptions.map((item, index) => {
                  const isBlacklistedItem = isBlacklisted(item);
                  
                  return (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                        isBlacklistedItem ? 'opacity-60' : 'cursor-pointer'
                      }`}
                    >
                      <td className="px-6 py-4 text-gray-600">
                        {item.date}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                            isBlacklistedItem ? 'bg-gray-200' : 'bg-green-100'
                          }`}>
                            <span className={`text-xs font-medium ${
                              isBlacklistedItem ? 'text-gray-400' : 'text-green-600'
                            }`}>
                              {getDoctorDisplayName(item).charAt(0)}
                            </span>
                          </div>
                          <span className={`font-medium ${
                            isBlacklistedItem ? 'text-gray-400' : 'text-gray-800'
                          }`}>
                            {getDoctorDisplayName(item)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs ${
                          isBlacklistedItem ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {getDoctorSpecialization(item)}
                        </span>
                      </td>
                      <td className={`px-6 py-4 ${
                        isBlacklistedItem ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {item.quantity} medicine{item.quantity !== 1 ? 's' : ''}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={getStatusVariant(item)}
                          className="text-xs"
                        >
                          {getStatusText(item)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right relative action-menu-container">
                        <div className="flex justify-end">
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
                            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1">
                              {/* View Details - Only for non-blacklisted */}
                              {!isBlacklistedItem && (
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
                              )}
                              
                              {/* Delete - Only for non-blacklisted */}
                              {!isBlacklistedItem && (
                                <>
                                  <div className="border-t border-gray-100 my-1"></div>
                                  <button
                                    onClick={(e) => { 
                                      e.stopPropagation(); 
                                      handleDeleteClick('prescription', item.id, startIndex + index, `prescription from ${item.date}`);
                                      setOpenMenu(null);
                                    }}
                                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                                  >
                                    <Trash2 size={15} /> Delete
                                  </button>
                                </>
                              )}
                              
                              {/* Recover - Only for blacklisted */}
                              {isBlacklistedItem && (
                                <button
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    handleRecoverClick(item);
                                    setOpenMenu(null);
                                  }}
                                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-green-600 hover:bg-gray-50"
                                >
                                  <RotateCcw size={15} /> Recover Prescription
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalItems > 0 && totalPages > 1 && (
            <div className="mt-auto px-6 py-3 border-t bg-gray-50">
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
      )}
    </div>
  );
};

export default PrescriptionTab;