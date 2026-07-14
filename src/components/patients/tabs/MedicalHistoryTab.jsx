// src/components/patients/tabs/MedicalHistoryTab.jsx
import React, { useState } from "react";
import { MoreVertical, Eye, Trash2, Activity } from "lucide-react";
import { Button, TableHead, TableHeader, TableCell, Pagination } from "../../ui";
import { useGetPrescriptionsQuery } from "../../../../app/service/prescription";
import { useGetDoctorsQuery } from "../../../../app/service/doctorApi";

const MedicalHistoryTab = ({ patient, handleViewMedicalDetails, handleDeleteClick, openMenu, setOpenMenu }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const { data: prescriptionData } = useGetPrescriptionsQuery({
    patientId: patient?.id,
    page: 1,
    limit: 100,
  });

  const { data: doctorsData } = useGetDoctorsQuery();

  const medicalHistoryList = prescriptionData?.data?.map((item) => {
    const doctor = doctorsData?.data?.find(
      (doc) => Number(doc.id) === Number(item.doctorId)
    );

    return {
      id: item.id,
      illnessName: item.complaint,
      illnessDate: new Date(item.createdAt).toLocaleDateString(),
      doctorName: doctor?.displayName || doctor?.name || "Not Assigned",
      department: doctor?.specialization || doctor?.department || "Not Specified",
      advice: item.advice,
      investigations: item.investigations || [],
      medications: item.medications || [],
      rawData: item,
    };
  }) || [];

  const totalItems = medicalHistoryList.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMedicalHistory = medicalHistoryList.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm flex flex-col">
      <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50 flex-shrink-0">
        <h2 className="text-sm font-semibold text-gray-700">
          Total Medical History
          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded ml-2">
            {totalItems}
          </span>
        </h2>
      </div>

      {totalItems === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Activity size={32} className="text-gray-400" />
          </div>
          <p className="text-gray-500">No medical history found</p>
          <p className="text-sm text-gray-400 mt-1">Medical history will appear here after consultation</p>
        </div>
      ) : (
        <div className="flex flex-col min-h-[420px]">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
                <tr>
                  <TableHeader>Illness Name</TableHeader>
                  <TableHeader>Illness Date</TableHeader>
                  <TableHeader className="text-right w-16"></TableHeader>
                </tr>
              </thead>
              <tbody>
                {paginatedMedicalHistory.length > 0 ? (
                  paginatedMedicalHistory.map((item) => (
                    <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                      <td 
                        className="px-4 py-3 font-medium text-gray-800 cursor-pointer hover:text-[#1C62A0]"
                        onClick={() => handleViewMedicalDetails(item)}
                      >
                        {item.illnessName}
                      </td>
                      <td 
                        className="px-4 py-3 text-gray-600 cursor-pointer hover:text-[#1C62A0]"
                        onClick={() => handleViewMedicalDetails(item)}
                      >
                        {item.illnessDate}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end">
                          <div className="relative action-menu-container">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenu(
                                  openMenu === `medical-${item.id}` ? null : `medical-${item.id}`
                                );
                              }}
                              className="p-2"
                            >
                              <MoreVertical size={16} className="text-gray-500" />
                            </Button>

                            {openMenu === `medical-${item.id}` && (
                              <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewMedicalDetails(item);
                                    setOpenMenu(null);
                                  }}
                                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                                >
                                  <Eye size={15} /> View Details
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteClick('medical', item.id, item.illnessName);
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
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="text-center text-gray-500 py-12">
                      No medical history found
                    </td>
                  </tr>
                )}
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
                itemLabel="medical records"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MedicalHistoryTab;