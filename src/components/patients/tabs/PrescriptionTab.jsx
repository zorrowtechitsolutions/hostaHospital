import React from "react";
import { MoreVertical, Trash2, Eye } from "lucide-react";

const PrescriptionTab = ({ 
  patient, 
  handleDeleteClick, 
  handleViewDetails,
  openMenu, 
  setOpenMenu, 
  getStatusBadge 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="text-sm font-medium">
          Total Prescriptions{" "}
          <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs ml-1">
            {patient?.prescriptionsList?.length || 0}
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Quantity</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Prescribed By</th>
              <th className="p-3 text-left">Amount</th>
              <th className="p-3 text-left">Payment Method</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left"></th>
            </tr>
          </thead>
          <tbody>
            {patient?.prescriptionsList?.map((item, index) => (
              <tr key={item.id} className="hover:bg-gray-50 transition">
                <td className="p-3 text-gray-700">{item.type}</td>
                <td className="p-3 text-gray-600">{item.quantity}</td>
                <td className="p-3 text-gray-600">{item.date}</td>
                <td className="p-3 text-gray-800">{item.prescribedBy}</td>
                <td className="p-3 text-gray-600">{item.amount}</td>
                <td className="p-3 text-gray-600">{item.paymentMethod}</td>
                <td className="p-3">
                  <span className={getStatusBadge(item.status)}>{item.status}</span>
                </td>
                <td className="p-3 text-right relative">
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setOpenMenu(openMenu === `prescription-${index}` ? null : `prescription-${index}`); 
                    }} 
                    className="p-2 border border-gray-200 rounded-md bg-gray-50 hover:bg-gray-100"
                  >
                    <MoreVertical size={16} />
                  </button>
                  {openMenu === `prescription-${index}` && (
                    <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-20 action-menu-container">
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          handleViewDetails(item); 
                        }} 
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Eye size={15} /> View Details
                      </button>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          handleDeleteClick('prescription', item.id, index, `${item.type} prescribed on ${item.date}`); 
                        }} 
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50"
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

export default PrescriptionTab;