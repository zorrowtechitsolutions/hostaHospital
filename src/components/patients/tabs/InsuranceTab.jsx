import React from "react";
import { MoreVertical, Trash2 } from "lucide-react";

const InsuranceTab = ({ patient, handleDeleteClick, getStatusBadge }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-700">
          Insurance Details
          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded ml-2">
            {patient.insuranceList.length}
          </span>
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
            <tr>
              <th className="px-6 py-3">Policy No</th>
              <th className="px-6 py-3">Insurance Provider</th>
              <th className="px-6 py-3">Plan Type</th>
              <th className="px-6 py-3">Coverage Amount</th>
              <th className="px-6 py-3">Start Date</th>
              <th className="px-6 py-3">Expiry Date</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {patient.insuranceList.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 border-b border-gray-100">
                <td className="px-6 py-4 text-[#1C62A0] font-medium">{item.policyNo}</td>
                <td className="px-6 py-4 font-medium text-gray-800">{item.provider}</td>
                <td className="px-6 py-4 text-gray-600">{item.planType}</td>
                <td className="px-6 py-4 text-gray-600">{item.coverageAmount}</td>
                <td className="px-6 py-4 text-gray-600">{item.startDate}</td>
                <td className="px-6 py-4 text-gray-600">{item.expiryDate}</td>
                <td className="px-6 py-4">
                  <span className={getStatusBadge(item.status)}>{item.status}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleDeleteClick('insurance', item.id, null, `${item.provider} - ${item.policyNo}`)}
                    className="p-2 rounded hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={16} className="text-gray-500 hover:text-red-600" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InsuranceTab;