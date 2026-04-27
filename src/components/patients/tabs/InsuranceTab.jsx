import React from "react";
import { Trash2 } from "lucide-react";

const InsuranceTab = ({ patient, handleDeleteClick, getStatusBadge }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="text-sm font-medium">Insurance Details <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs ml-1">{patient.insuranceList.length}</span></div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="p-3 text-left">Policy No</th>
              <th className="p-3 text-left">Insurance Provider</th>
              <th className="p-3 text-left">Plan Type</th>
              <th className="p-3 text-left">Coverage Amount</th>
              <th className="p-3 text-left">Start Date</th>
              <th className="p-3 text-left">Expiry Date</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left"></th>
            </tr>
          </thead>
          <tbody>
            {patient.insuranceList.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition">
                <td className="p-3 font-medium text-gray-800">{item.policyNo}</td>
                <td className="p-3 text-gray-700">{item.provider}</td>
                <td className="p-3 text-gray-600">{item.planType}</td>
                <td className="p-3 text-gray-600">{item.coverageAmount}</td>
                <td className="p-3 text-gray-600">{item.startDate}</td>
                <td className="p-3 text-gray-600">{item.expiryDate}</td>
                <td className="p-3"><span className={getStatusBadge(item.status)}>{item.status}</span></td>
                <td className="p-3 text-right"><button onClick={() => handleDeleteClick('insurance', item.id, null, `${item.provider} - ${item.policyNo}`)} className="p-2 border border-gray-200 rounded-md bg-gray-50 hover:bg-red-50 hover:text-red-600 transition"><Trash2 size={16} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InsuranceTab;