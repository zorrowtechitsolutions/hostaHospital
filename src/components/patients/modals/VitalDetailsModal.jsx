import React from "react";
import { Droplet, Heart, Activity, Thermometer, Wind, Weight, X } from "lucide-react";

const VitalDetailsModal = ({ data, onClose }) => {
  if (!data) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999]">
      <div className="bg-white w-[520px] rounded-xl shadow-xl">
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Vital Details</h2>
          <button onClick={onClose} className="bg-gray-800 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-gray-700"><X size={14} /></button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3"><div className="bg-gray-200 p-2 rounded-md"><Droplet size={18} /></div><div><p className="text-sm text-gray-500">Blood Pressure</p><p className="font-medium">{data.bloodPressure} mmHg</p></div></div>
          <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3"><div className="bg-gray-200 p-2 rounded-md"><Heart size={18} /></div><div><p className="text-sm text-gray-500">Heart Rate</p><p className="font-medium">{data.heartRate} Bpm</p></div></div>
          <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3"><div className="bg-gray-200 p-2 rounded-md"><Activity size={18} /></div><div><p className="text-sm text-gray-500">SPO2</p><p className="font-medium">{data.spo2} %</p></div></div>
          <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3"><div className="bg-gray-200 p-2 rounded-md"><Thermometer size={18} /></div><div><p className="text-sm text-gray-500">Temperature</p><p className="font-medium">{data.temperature} °F</p></div></div>
          <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3"><div className="bg-gray-200 p-2 rounded-md"><Wind size={18} /></div><div><p className="text-sm text-gray-500">Respiratory Rate</p><p className="font-medium">{data.respiratoryRate} rpm</p></div></div>
          <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3"><div className="bg-gray-200 p-2 rounded-md"><Weight size={18} /></div><div><p className="text-sm text-gray-500">Weight</p><p className="font-medium">{data.weight} kg</p></div></div>
        </div>
      </div>
    </div>
  );
};

export default VitalDetailsModal;