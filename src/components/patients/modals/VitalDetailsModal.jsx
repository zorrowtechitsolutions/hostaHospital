// src/components/patients/modals/VitalDetailsModal.jsx - Refactored to show all vitals
import React from "react";
import { 
  Droplet, 
  Heart, 
  Activity, 
  Thermometer, 
  Wind, 
  Weight, 
  Ruler, 
  Circle, 
  User, 
  Scale,
  ArrowUpDown,
  X 
} from "lucide-react";
import { Modal, Button, Card } from "../../ui";

const VitalDetailsModal = ({ data, onClose }) => {
  if (!data) return null;

  // Define all vitals with their icons and formatting
  const vitals = [
    { 
      icon: Thermometer, 
      label: "Temperature", 
      value: data.temperature ? `${data.temperature} °F` : "N/A" 
    },
    { 
      icon: Heart, 
      label: "Pulse", 
      value: data.pulse ? `${data.pulse} bpm` : "N/A" 
    },
    { 
      icon: Wind, 
      label: "Respiratory Rate", 
      value: data.respiratoryRate ? `${data.respiratoryRate} rpm` : "N/A" 
    },
    { 
      icon: Activity, 
      label: "SPO2", 
      value: data.spo2 ? `${data.spo2} %` : "N/A" 
    },
    { 
      icon: Droplet, 
      label: "Blood Pressure", 
      value: data.bloodPressure ? `${data.bloodPressure} mmHg` : 
              (data.bloodPressureSystolic && data.bloodPressureDiastolic ? 
                `${data.bloodPressureSystolic}/${data.bloodPressureDiastolic} mmHg` : "N/A") 
    },
    { 
      icon: Ruler, 
      label: "Height", 
      value: data.height ? `${data.height} cm` : "N/A" 
    },
    { 
      icon: Scale, 
      label: "Weight", 
      value: data.weight ? `${data.weight} kg` : "N/A" 
    },
    { 
      icon: Circle, 
      label: "BMI", 
      value: data.bmi ? `${data.bmi} kg/m²` : "N/A" 
    },
    { 
      icon: User, 
      label: "Waist", 
      value: data.waist ? `${data.waist} cm` : "N/A" 
    },
  ];

  // Filter out vitals with N/A value (optional)
  const availableVitals = vitals.filter(vital => vital.value !== "N/A");

  return (
    <Modal isOpen={true} onClose={onClose} title="Vital Details" size="lg" showCloseButton={false}>
      {/* Patient Info Header */}
      {data.patientName && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Patient:</span> {data.patientName}
            {data.doctorName && (
              <span className="ml-4">
                <span className="font-semibold">Doctor:</span> {data.doctorName}
              </span>
            )}
            {data.department && (
              <span className="ml-4">
                <span className="font-semibold">Department:</span> {data.department}
              </span>
            )}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Recorded: {new Date(data.createdAt).toLocaleString()}
          </p>
        </div>
      )}

      {/* Vitals Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {availableVitals.map((vital, index) => (
          <div key={index} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
            <div className="bg-blue-100 p-2 rounded-md">
              <vital.icon size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">{vital.label}</p>
              <p className="font-medium text-sm">{vital.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Notes Section */}
      {data.notes && (
        <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm font-semibold text-gray-700">Notes:</p>
          <p className="text-sm text-gray-600">{data.notes}</p>
        </div>
      )}


      {/* Close Button */}
      <div className="flex justify-end mt-6 pt-4 border-t">
        <Button variant="primary" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
};

export default VitalDetailsModal;