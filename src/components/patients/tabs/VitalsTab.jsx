import React from "react";
import { MoreVertical, Eye, Trash2 } from "lucide-react";

const VitalsTab = ({ patient, handleViewVitalDetails, handleDeleteClick, openMenu, setOpenMenu, getStatusBadge }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="text-sm font-medium">Total Vitals Records <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs ml-1">{patient.vitalsList.length}</span></div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="p-3 text-left">Doctor Name</th>
              <th className="p-3 text-left">Department</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left"></th>
            </tr>
          </thead>
          <tbody>
            {patient.vitalsList.map((item, index) => (
              <tr key={item.id} className="hover:bg-gray-50 transition cursor-pointer" onClick={() => handleViewVitalDetails(item)}>
                <td className="p-3 text-gray-800">{item.doctorName}</td>
                <td className="p-3 text-gray-600">{item.department}</td>
                <td className="p-3 text-gray-600">{item.date}</td>
                <td className="p-3 text-right relative">
                  <button onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === `vitals-${index}` ? null : `vitals-${index}`); }} className="p-2 border border-gray-200 rounded-md bg-gray-50 hover:bg-gray-100"><MoreVertical size={16} /></button>
                  {openMenu === `vitals-${index}` && (
                    <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-20 action-menu-container">
                      <button onClick={(e) => { e.stopPropagation(); handleViewVitalDetails(item); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"><Eye size={15} /> View Details</button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteClick('vital', item.id, index, `Vital record from ${item.date}`); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50"><Trash2 size={15} /> Delete</button>
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

export default VitalsTab;