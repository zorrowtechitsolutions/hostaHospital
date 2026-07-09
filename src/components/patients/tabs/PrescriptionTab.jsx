import React, { useState } from "react";
import { MoreVertical, Eye, Trash2, FileText } from "lucide-react";
import { Button, Pagination } from "../../ui";

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

      {totalItems === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <FileText size={32} className="text-gray-400" />
          </div>
          <p className="text-gray-500">No prescriptions found</p>
          <p className="text-sm text-gray-400 mt-1">Prescriptions will appear here after consultation</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Prescribed By</th>
                  <th className="px-6 py-3">Specialization</th>
                  <th className="px-6 py-3">Medicines</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {paginatedPrescriptions.map((item, index) => (
                  <tr 
                    key={item.id} 
                    className="hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100"
                    onClick={() => handleViewDetails(item)}
                  >
                    <td className="px-6 py-4 text-gray-600">
                      {item.date}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-xs font-medium text-green-600">
                            {getDoctorDisplayName(item).charAt(0)}
                          </span>
                        </div>
                        <span className="font-medium text-gray-800">
                          {getDoctorDisplayName(item)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-500 text-xs">
                        {getDoctorSpecialization(item)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {item.quantity} medicine{item.quantity !== 1 ? 's' : ''}
                    </td>
                    <td className="px-6 py-4">
                      <span className={getStatusBadge(item.status)}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right relative action-menu-container">
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
                              handleDeleteClick('prescription', item.id, startIndex + index, `prescription from ${item.date}`);
                              setOpenMenu(null);
                            }}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                          >
                            <Trash2 size={15} /> Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
        </>
      )}
    </div>
  );
};

export default PrescriptionTab;