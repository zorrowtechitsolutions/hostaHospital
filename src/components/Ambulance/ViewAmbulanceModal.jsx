// src/components/Ambulance/ViewAmbulanceModal.jsx
import React from 'react';
import { Modal, Badge, Button } from '../ui';
import { Phone, MapPin, Truck, Calendar, Hash, Building, Clock } from 'lucide-react';

const ViewAmbulanceModal = ({ isOpen, onClose, ambulance }) => {
  if (!ambulance) return null;

  const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-start py-3 border-b border-gray-100 last:border-0">
      <div className="w-10 flex-shrink-0">
        <Icon className="w-5 h-5 text-gray-400" />
      </div>
      <div className="flex-1">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900 mt-0.5">{value || 'Not provided'}</p>
      </div>
    </div>
  );

  // Helper to get vehicle type display value
  const getVehicleTypeDisplay = (type) => {
    if (!type) return 'Not specified';
    const typeMap = {
      'W': 'Wheelchair Accessible',
      'B': 'Basic Life Support',
      'A': 'Advanced Life Support'
    };
    return typeMap[type] || type;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ambulance Details" size="md">
      <div className="space-y-4">
        {/* Header Section - Use formattedId for display */}
        <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
            <Truck className="w-8 h-8 text-[#1C62A0]" />
          </div>
          <div className="flex-1">
            <Badge variant="default" className="text-xs font-mono mb-1">
              {ambulance.formattedId || `#AMB${String(ambulance.id || 0).padStart(4, '0')}`}
            </Badge>
            <h3 className="text-xl font-bold text-gray-900">{ambulance.serviceName}</h3>
          </div>
        </div>

        {/* Vehicle Information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Truck className="w-4 h-4" /> Vehicle Information
          </h4>
          <InfoRow icon={Truck} label="Vehicle Type" value={getVehicleTypeDisplay(ambulance.vehicleType)} />
          <InfoRow icon={Phone} label="Contact Number" value={ambulance.phone} />
        </div>

        {/* Address Information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Address Information
          </h4>
          <InfoRow icon={Building} label="Country" value={ambulance.address?.country} />
          <InfoRow icon={MapPin} label="State" value={ambulance.address?.state} />
          <InfoRow icon={MapPin} label="District" value={ambulance.address?.district} />
          <InfoRow icon={MapPin} label="Place / Locality" value={ambulance.address?.place} />
          <InfoRow icon={Hash} label="Pincode" value={ambulance.address?.pincode} />
        </div>

        {/* Timeline Information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Timeline
          </h4>
          <InfoRow icon={Calendar} label="Created At" value={ambulance.createdAt} />
          <InfoRow icon={Calendar} label="Last Updated" value={ambulance.lastUpdated} />
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>Close</Button>
      </div>
    </Modal>
  );
};

export default ViewAmbulanceModal;