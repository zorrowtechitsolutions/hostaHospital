import React from "react";
import { MoreVertical, Eye, Edit, Trash2 } from "lucide-react";

const VisitHistoryTab = ({ patient, handleViewVisitDetails, handleEditVisitClick, handleDeleteClick, openMenu, setOpenMenu, getStatusBadge }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="text-sm font-medium">Total Visit History <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs ml-1">{patient.visitHistoryList.length}</span></div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="p-3 text-left">Visit ID</th>
              <th className="p-3 text-left">Doctor Name</th>
              <th className="p-3 text-left">Department</th>
              <th className="p-3 text-left">Visit Date</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left"></th>
            </tr>
          </thead>
          <tbody>
            {patient.visitHistoryList.map((item, index) => (
              <tr key={item.id} className="hover:bg-gray-50 transition cursor-pointer" onClick={() => handleViewVisitDetails(item)}>
                <td className="p-3 font-medium text-gray-800">{item.visitId || item.id}</td>
                <td className="p-3 text-gray-800">{item.doctorName}</td>
                <td className="p-3 text-gray-600">{item.department}</td>
                <td className="p-3 text-gray-600">{item.visitDate}</td>
                <td className="p-3"><span className={getStatusBadge(item.status)}>{item.status}</span></td>
                <td className="p-3 text-right relative">
                  <button onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === `visit-${index}` ? null : `visit-${index}`); }} className="p-2 border border-gray-200 rounded-md bg-gray-50 hover:bg-gray-100"><MoreVertical size={16} /></button>
                  {openMenu === `visit-${index}` && (
                    <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-20 action-menu-container">
                      <button onClick={(e) => { e.stopPropagation(); handleViewVisitDetails(item); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"><Eye size={15} /> View Details</button>
                      <button onClick={(e) => { e.stopPropagation(); handleEditVisitClick(item); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"><Edit size={15} /> Edit</button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteClick('visit', item.id, index, `Visit on ${item.visitDate}`); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50"><Trash2 size={15} /> Delete</button>
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

export default VisitHistoryTab;