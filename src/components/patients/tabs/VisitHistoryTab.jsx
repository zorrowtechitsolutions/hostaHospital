import React from "react";
import { MoreVertical, Eye, Edit, Trash2 } from "lucide-react";

const VisitHistoryTab = ({ patient, handleViewVisitDetails, handleEditVisitClick, handleDeleteClick, openMenu, setOpenMenu, getStatusBadge }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-700">
          Total Visit History
          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded ml-2">
            {patient.visitHistoryList?.length || 0}
          </span>
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
            <tr>
              <th className="px-6 py-3">Visit ID</th>
              <th className="px-6 py-3">Doctor Name</th>
              <th className="px-6 py-3">Department</th>
              <th className="px-6 py-3">Visit Date</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {patient.visitHistoryList?.map((item, index) => (
              <tr 
                key={item.id} 
                className="hover:bg-gray-50 border-b border-gray-100"
              >
                <td 
                  className="px-6 py-4 text-[#1C62A0] font-medium cursor-pointer"
                  onClick={() => handleViewVisitDetails(item)}
                >
                  {item.visitId || item.id}
                </td>
                <td 
                  className="px-6 py-4 cursor-pointer"
                  onClick={() => handleViewVisitDetails(item)}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-600">
                        {item.doctorName?.charAt(0) || 'D'}
                      </span>
                    </div>
                    <span className="font-medium text-gray-800">{item.doctorName}</span>
                  </div>
                </td>
                <td 
                  className="px-6 py-4 text-gray-600 cursor-pointer"
                  onClick={() => handleViewVisitDetails(item)}
                >
                  {item.department}
                </td>
                <td 
                  className="px-6 py-4 text-gray-600 cursor-pointer"
                  onClick={() => handleViewVisitDetails(item)}
                >
                  {item.visitDate}
                </td>
                <td 
                  className="px-6 py-4 cursor-pointer"
                  onClick={() => handleViewVisitDetails(item)}
                >
                  <span className={getStatusBadge(item.status)}>{item.status}</span>
                </td>
                <td className="px-6 py-4 text-right relative action-menu-container">
                  <button
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setOpenMenu(openMenu === `visit-${item.id}` ? null : `visit-${item.id}`);
                    }}
                    className="p-2 rounded hover:bg-gray-100 transition-colors"
                  >
                    <MoreVertical size={16} className="text-gray-500" />
                  </button>
                  {openMenu === `visit-${item.id}` && (
                    <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1">
                      <button
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          handleViewVisitDetails(item);
                          setOpenMenu(null);
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Eye size={15} /> View Details
                      </button>
                      <button
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          handleEditVisitClick(item);
                          setOpenMenu(null);
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Edit size={15} /> Edit
                      </button>
                      <button
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          handleDeleteClick('visit', item.id, index, `Visit on ${item.visitDate}`);
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
  );
};

export default VisitHistoryTab;