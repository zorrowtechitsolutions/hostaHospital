import React, { useState } from "react";
import { MoreVertical, Eye, Trash2 } from "lucide-react";
import LaboratoryReportModal from "../modals/LaboratoryReportModal";

const LabResultsTab = ({ patient, handleDeleteClick, openMenu, setOpenMenu, getStatusBadge }) => {
  const [selectedLabResult, setSelectedLabResult] = useState(null);
  const [showLabModal, setShowLabModal] = useState(false);

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
              {patient.labResultsList?.length || 0}
            </span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
              <tr>
                <th className="px-6 py-3">Test ID</th>
                <th className="px-6 py-3">Appointment Date</th>
                <th className="px-6 py-3">Referred By</th>
                <th className="px-6 py-3">Test Name</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {patient.labResultsList?.map((item, index) => (
                <tr key={item.id || index} className="hover:bg-gray-50 border-b border-gray-100">
                  <td 
                    className="px-6 py-4 text-[#1C62A0] font-medium cursor-pointer"
                    onClick={() => handleViewReport(item)}
                  >
                    {item.id}
                  </td>
                  <td 
                    className="px-6 py-4 text-gray-600 cursor-pointer"
                    onClick={() => handleViewReport(item)}
                  >
                    {item.appointmentDate}
                  </td>
                  <td 
                    className="px-6 py-4 font-medium text-gray-800 cursor-pointer"
                    onClick={() => handleViewReport(item)}
                  >
                    {item.referredBy}
                  </td>
                  <td 
                    className="px-6 py-4 text-gray-700 cursor-pointer"
                    onClick={() => handleViewReport(item)}
                  >
                    {item.testName}
                  </td>
                  <td 
                    className="px-6 py-4 cursor-pointer"
                    onClick={() => handleViewReport(item)}
                  >
                    <span className={getStatusBadge(item.status)}>{item.status}</span>
                  </td>
                  <td className="px-6 py-4 text-right relative action-menu-container">
                    <button
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setOpenMenu(openMenu === `lab-${item.id}` ? null : `lab-${item.id}`);
                      }}
                      className="p-2 rounded hover:bg-gray-100 transition-colors"
                    >
                      <MoreVertical size={16} className="text-gray-500" />
                    </button>
                    {openMenu === `lab-${item.id}` && (
                      <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1">
                        <button
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            handleViewReport(item);
                            setOpenMenu(null);
                          }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Eye size={15} /> View Report
                        </button>
                        <button
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            handleDeleteClick('lab', item.id, index, `${item.testName} (${item.id})`);
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
      </div>

      {/* Laboratory Report Modal */}
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