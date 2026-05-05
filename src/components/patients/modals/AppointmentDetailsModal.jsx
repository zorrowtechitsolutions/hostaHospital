// src/components/patients/modals/AppointmentDetailsModal.jsx - Refactored
import React from "react";
import { X } from "lucide-react";
import { Button, Modal, Badge, Card } from "../../ui";

const AppointmentDetailsModal = ({ data, onClose }) => {
  if (!data) return null;

  return (
    <Modal isOpen={true} onClose={onClose} title="Appointment Details" size="md" showCloseButton={false}>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={data.avatar || "https://randomuser.me/api/portraits/men/32.jpg"} alt="" className="w-10 h-10 rounded-full" />
            <div>
              <p className="font-medium">{data.patientName || data.doctorName}</p>
              <p className="text-sm text-gray-500">Patient</p>
            </div>
          </div>
          <Badge variant="purple">{data.status}</Badge>
        </div>
        
        <div>
          <p className="font-medium text-sm mb-1">Date & Time</p>
          <p className="text-sm text-gray-800">{data.fee} / {data.duration || "1 hour"}</p>
          <p className="text-sm text-gray-500">{data.appointmentDate}, {data.startTime}</p>
        </div>
        
        <div>
          <p className="font-medium text-sm mb-1">Consultation With</p>
          <p className="text-sm font-medium">{data.doctorName}</p>
          <p className="text-sm text-gray-500">{data.department}</p>
        </div>
        
        <div>
          <p className="font-medium text-sm mb-1">Reason</p>
          <p className="text-sm text-gray-600">{data.reason}</p>
        </div>
        
        <div>
          <p className="font-medium text-sm mb-1">Notes</p>
          <p className="text-sm text-gray-600">{data.notes}</p>
        </div>
      </div>
      
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button variant="primary">Start Consultation</Button>
      </div>
    </Modal>
  );
};

export default AppointmentDetailsModal;