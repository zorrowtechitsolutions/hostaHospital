import React from "react";
import { X } from "lucide-react";

const VisitDetailsModal = ({ data, patientName, onClose }) => {
  if (!data) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999]">
      <div className="bg-white w-[520px] rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center px-6 py-4 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-gray-800">Visit History</h2>
          <button onClick={onClose} className="bg-gray-800 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-gray-700"><X size={14} /></button>
        </div>
        <div className="p-6 space-y-5 text-sm text-gray-700">
          <div className="grid grid-cols-3 gap-4">
            <div><p className="font-semibold">{data.department}</p><p className="text-gray-500">{data.visitDate}, {data.startTime}</p></div>
            <div><p className="font-semibold">Patient</p><p className="text-gray-600">{patientName}</p></div>
            <div><p className="font-semibold">Doctor</p><p className="text-gray-600">{data.doctorName}</p></div>
          </div>
          <div><h3 className="font-semibold text-gray-800">Reason for Visit</h3><p className="text-gray-600 mt-1">{data.reason}</p></div>
          <div><h3 className="font-semibold text-gray-800">Diagnosis / Assessment</h3><p className="text-gray-600 mt-1">{data.diagnosis || "No diagnosis recorded"}</p></div>
          <div><h3 className="font-semibold text-gray-800">Treatment / Prescription</h3><p className="text-gray-600 mt-1">{data.prescription || "No prescription recorded"}</p></div>
          <div><h3 className="font-semibold text-gray-800">Follow Up</h3><p className="text-gray-600 mt-1">{data.followUpDate || "Not scheduled"}</p></div>
          <div><h3 className="font-semibold text-gray-800">Notes</h3><p className="text-gray-600 mt-1">{data.notes || "No additional notes"}</p></div>
        </div>
      </div>
    </div>
  );
};

export default VisitDetailsModal;