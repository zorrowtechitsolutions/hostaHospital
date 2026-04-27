import React from "react";
import { MoreVertical, Eye, Trash2 } from "lucide-react";

const MedicalHistoryTab = ({ patient, handleViewMedicalDetails, handleDeleteClick, openMenu, setOpenMenu, getStatusBadge }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="text-sm font-medium">Total Medical History <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs ml-1">{patient.medicalHistoryList.length}</span></div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="p-3 text-left">Illness Name</th>
              <th className="p-3 text-left">Illness Date</th>
              <th className="p-3 text-left"></th>
            </tr>
          </thead>
          <tbody>
            {patient.medicalHistoryList.map((item, index) => (
              <tr key={item.id} className="hover:bg-gray-50 transition cursor-pointer" onClick={() => handleViewMedicalDetails(item)}>
                <td className="p-3 font-medium text-gray-800">{item.illnessName}</td>
                <td className="p-3 text-gray-600">{item.illnessDate} ({item.yearsAgo})</td>
                <td className="p-3 text-right relative">
                  <button onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === `medical-${index}` ? null : `medical-${index}`); }} className="p-2 border border-gray-200 rounded-md bg-gray-50 hover:bg-gray-100"><MoreVertical size={16} /></button>
                  {openMenu === `medical-${index}` && (
                    <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-20 action-menu-container">
                      <button onClick={(e) => { e.stopPropagation(); handleViewMedicalDetails(item); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"><Eye size={15} /> View Details</button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteClick('medical', item.id, index, item.illnessName); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50"><Trash2 size={15} /> Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MedicalHistoryTab;