// src/components/patients/modals/VitalDetailsModal.jsx - Refactored
import React from "react";
import { Droplet, Heart, Activity, Thermometer, Wind, Weight, X } from "lucide-react";
import { Modal, Button, Card } from "../../ui";

const VitalDetailsModal = ({ data, onClose }) => {
  if (!data) return null;

  const vitals = [
    { icon: Droplet, label: "Blood Pressure", value: `${data.bloodPressure} mmHg` },
    { icon: Heart, label: "Heart Rate", value: `${data.heartRate} Bpm` },
    { icon: Activity, label: "SPO2", value: `${data.spo2} %` },
    { icon: Thermometer, label: "Temperature", value: `${data.temperature} °F` },
    { icon: Wind, label: "Respiratory Rate", value: `${data.respiratoryRate} rpm` },
    { icon: Weight, label: "Weight", value: `${data.weight} kg` },
  ];

  return (
    <Modal isOpen={true} onClose={onClose} title="Vital Details" size="md" showCloseButton={false}>
      <div className="grid grid-cols-2 gap-4">
        {vitals.map((vital, index) => (
          <div key={index} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
            <div className="bg-gray-200 p-2 rounded-md">
              <vital.icon size={18} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{vital.label}</p>
              <p className="font-medium">{vital.value}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex justify-end mt-6 pt-4 border-t">
        <Button variant="primary" onClick={onClose}>Close</Button>
      </div>
    </Modal>
  );
};

export default VitalDetailsModal;