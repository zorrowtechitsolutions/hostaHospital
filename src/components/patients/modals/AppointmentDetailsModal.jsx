import React from "react";
import { X } from "lucide-react";

const AppointmentDetailsModal = ({ data, onClose }) => {
  if (!data) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[520px] rounded-xl shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-lg font-semibold">Appointment Details</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"><X size={14} /></button>
        </div>
        <div className="p-5 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3"><img src={data.avatar || "https://randomuser.me/api/portraits/men/32.jpg"} alt="" className="w-10 h-10 rounded-full" /><div><p className="font-medium">{data.patientName || data.doctorName}</p><p className="text-sm text-gray-500">Patient</p></div></div>
            <span className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-xs">{data.status}</span>
          </div>
          <div><p className="font-medium text-sm mb-1">Date & Time</p><p className="text-sm text-gray-800">{data.fee} / {data.duration || "1 hour"}</p><p className="text-sm text-gray-500">{data.appointmentDate}, {data.startTime}</p></div>
          <div><p className="font-medium text-sm mb-1">Consultation With</p><p className="text-sm font-medium">{data.doctorName}</p><p className="text-sm text-gray-500">{data.department}</p></div>
          <div><p className="font-medium text-sm mb-1">Reason</p><p className="text-sm text-gray-600">{data.reason}</p></div>
          <div><p className="font-medium text-sm mb-1">Notes</p><p className="text-sm text-gray-600">{data.notes}</p></div>
        </div>
        <div className="flex justify-end gap-3 px-5 py-4 border-t">
          <button onClick={onClose} className="px-4 py-2 border rounded-md text-sm">Cancel</button>
          <button className="px-4 py-2 bg-[#1C62A0] text-white rounded-md text-sm">Start Consultation</button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetailsModal;