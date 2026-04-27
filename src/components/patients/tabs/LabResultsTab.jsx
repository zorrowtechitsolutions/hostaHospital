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
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="text-sm font-medium">Total Lab Results <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs ml-1">{patient.labResultsList.length}</span></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="p-3 text-left">Test ID</th>
                <th className="p-3 text-left">Appointment Date</th>
                <th className="p-3 text-left">Referred By</th>
                <th className="p-3 text-left">Test Name</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left"></th>
              </tr>
            </thead>
            <tbody>
              {patient.labResultsList.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50 transition">
                  <td className="p-3 font-medium text-gray-800">{item.id}</td>
                  <td className="p-3 text-gray-600">{item.appointmentDate}</td>
                  <td className="p-3 text-gray-800">{item.referredBy}</td>
                  <td className="p-3 text-gray-700">{item.testName}</td>
                  <td className="p-3"><span className={getStatusBadge(item.status)}>{item.status}</span></td>
                  <td className="p-3 text-right relative">
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setOpenMenu(openMenu === `lab-${index}` ? null : `lab-${index}`);
                      }} 
                      className="p-2 border border-gray-200 rounded-md bg-gray-50 hover:bg-gray-100"
                    >
                      <MoreVertical size={16} />
                    </button>
                    {openMenu === `lab-${index}` && (
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 action-menu-container">
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation();
                            handleViewReport(item);
                          }} 
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
                        >
                          <Eye size={15} />
                          View Report
                        </button>
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation();
                            handleDeleteClick('lab', item.id, index, `${item.testName} (${item.id})`);
                          }} 
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50"
                        >
                          <Trash2 size={15} />
                          Delete
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