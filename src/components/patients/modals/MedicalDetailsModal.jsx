import React from "react";
import { Stethoscope, X } from "lucide-react";

const MedicalDetailsModal = ({ data, onClose }) => {
  if (!data) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999]">
      <div className="bg-white w-[520px] rounded-xl shadow-xl">
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Medical History</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-800 text-white hover:bg-gray-700"><X size={14} /></button>
        </div>
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 text-white rounded-lg flex items-center justify-center"><Stethoscope size={18} /></div>
            <div><p className="font-semibold text-gray-800">{data.illnessName || data.illness}</p><p className="text-sm text-gray-500">{data.illnessDate || data.date} ({data.yearsAgo})</p></div>
          </div>
          <div><p className="font-semibold text-gray-800 mb-2">Assessment</p><ol className="list-decimal ml-5 text-sm text-gray-600 space-y-2">{data.assessment?.map((item, idx) => <li key={idx}>{item}</li>)}</ol></div>
          <div><p className="font-semibold text-gray-800 mb-2">Notes</p><p className="text-sm text-gray-600">{data.notes}</p></div>
        </div>
      </div>
    </div>
  );
};

export default MedicalDetailsModal;