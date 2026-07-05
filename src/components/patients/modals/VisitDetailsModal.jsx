// src/components/patients/modals/VisitDetailsModal.jsx - Refactored
import React from "react";
import { X } from "lucide-react";
import { Modal, Button } from "../../ui";

const VisitDetailsModal = ({ data, patientName, onClose }) => {
  if (!data) return null;

  return (
    <Modal isOpen={true} onClose={onClose} title="Visit History" size="md" showCloseButton={false}>
      <div className="space-y-5 text-sm">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="font-semibold">{data.department}</p>
            <p className="text-gray-500">{data.visitDate}, {data.startTime}</p>
          </div>
          <div>
            <p className="font-semibold">Patient</p>
            <p className="text-gray-600">{patientName}</p>
          </div>
          <div>
            <p className="font-semibold">Doctor</p>
            <p className="text-gray-600">{data.doctorName}</p>
          </div>
        </div>
        
        <div>
          <h3 className="font-semibold text-gray-800">Reason for Visit</h3>
          <p className="text-gray-600 mt-1">{data.reason}</p>
        </div>
        
        <div>
          <h3 className="font-semibold text-gray-800">Diagnosis / Assessment</h3>
          <p className="text-gray-600 mt-1">{data.diagnosis || "No diagnosis recorded"}</p>
        </div>
        
        <div>
          <h3 className="font-semibold text-gray-800">Treatment / Prescription</h3>
          <p className="text-gray-600 mt-1">{data.prescription || "No prescription recorded"}</p>
        </div>
        
        <div>
          <h3 className="font-semibold text-gray-800">Follow Up</h3>
          <p className="text-gray-600 mt-1">{data.followUpDate || "Not scheduled"}</p>
        </div>
        
        <div>
          <h3 className="font-semibold text-gray-800">Notes</h3>
          <p className="text-gray-600 mt-1">{data.notes || "No additional notes"}</p>
        </div>
      </div>
      
      <div className="flex justify-end mt-6 pt-4 border-t">
        <Button variant="primary" onClick={onClose}>Close</Button>
      </div>
    </Modal>
  );
};

export default VisitDetailsModal;