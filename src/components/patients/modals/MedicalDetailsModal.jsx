// src/components/patients/modals/MedicalDetailsModal.jsx - Refactored
import React from "react";
import { Stethoscope, X } from "lucide-react";
import { Modal, Button, Badge } from "../../ui";

const MedicalDetailsModal = ({ data, onClose }) => {
  if (!data) return null;

  return (
    <Modal isOpen={true} onClose={onClose} title="Medical History" size="md" showCloseButton={false}>
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 text-white rounded-lg flex items-center justify-center">
            <Stethoscope size={18} />
          </div>
          <div>
            <p className="font-semibold text-gray-800">{data.illnessName || data.illness}</p>
            <p className="text-sm text-gray-500">{data.illnessDate || data.date} ({data.yearsAgo})</p>
          </div>
        </div>
        
        <div>
          <p className="font-semibold text-gray-800 mb-2">Assessment</p>
          <ol className="list-decimal ml-5 text-sm text-gray-600 space-y-2">
            {data.assessment?.map((item, idx) => <li key={idx}>{item}</li>)}
          </ol>
        </div>
        
        <div>
          <p className="font-semibold text-gray-800 mb-2">Notes</p>
          <p className="text-sm text-gray-600">{data.notes}</p>
        </div>
      </div>
      
      <div className="flex justify-end mt-6 pt-4 border-t">
        <Button variant="primary" onClick={onClose}>Close</Button>
      </div>
    </Modal>
  );
};

export default MedicalDetailsModal;