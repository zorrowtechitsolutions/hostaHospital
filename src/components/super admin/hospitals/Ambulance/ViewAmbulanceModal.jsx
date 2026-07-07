// src/components/Ambulance/ViewAmbulanceModal.jsx
import React from 'react';
import { Modal, Badge, Button } from '../../../ui';
import { Phone, MapPin, Truck, Calendar, Hash, Building, Clock, Edit } from 'lucide-react';

const ViewAmbulanceModal = ({ isOpen, onClose, ambulance, onEdit }) => {
  if (!ambulance) return null;

  const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-start py-3 border-b border-gray-100 last:border-0">
      <div className="w-10 flex-shrink-0">
        <Icon className="w-5 h-5 text-gray-400" />
      </div>
      <div className="flex-1">
        <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-gray-900 mt-1">{value || 'Not provided'}</p>
      </div>
    </div>
  );

  // Format date helper
  const formatDate = (date) => {
    if (!date) return 'Not provided';
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Not provided';
    }
  };

  // Helper to get vehicle type display value
  const getVehicleTypeDisplay = (type) => {
    if (!type) return 'Not specified';
    return type;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ambulance Details" size="lg">
      <div className="space-y-4">
        {/* Header Section - Ambulance Icon + Name + ID */}
        <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
            <Truck className="w-8 h-8 text-[#1C62A0]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="default" className="text-xs font-mono">
                {ambulance.formattedId || `#AMB${String(ambulance.id || 0).padStart(4, '0')}`}
              </Badge>
              <Badge variant="info" className="text-xs">
                {getVehicleTypeDisplay(ambulance.vehicleType)}
              </Badge>
            </div>
            <h3 className="text-xl font-bold text-gray-900">{ambulance.serviceName}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Phone size={12} className="text-gray-400" />
              <span className="text-sm text-gray-600">{ambulance.phone}</span>
            </div>
          </div>
        </div>

        {/* Vehicle Information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Truck className="w-4 h-4 text-[#1C62A0]" />
            Vehicle Information
          </h4>
          <InfoRow icon={Truck} label="Vehicle Type" value={getVehicleTypeDisplay(ambulance.vehicleType)} />
          <InfoRow icon={Phone} label="Contact Number" value={ambulance.phone} />
          {ambulance.driverName && (
            <InfoRow icon={Truck} label="Driver Name" value={ambulance.driverName} />
          )}
          {ambulance.licensePlate && (
            <InfoRow icon={Hash} label="License Plate" value={ambulance.licensePlate} />
          )}
        </div>

        {/* Address Information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#1C62A0]" />
            Address Information
          </h4>
          <InfoRow icon={Building} label="Country" value={ambulance.address?.country} />
          <InfoRow icon={MapPin} label="State" value={ambulance.address?.state} />
          <InfoRow icon={MapPin} label="District" value={ambulance.address?.district} />
          <InfoRow icon={MapPin} label="Place / Locality" value={ambulance.address?.place} />
          <InfoRow icon={Hash} label="Pincode" value={ambulance.address?.pincode} />
        </div>

        {/* Hospital Information (if available) */}
        {(ambulance.hospitalId || ambulance.hospitalName) && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Building className="w-4 h-4 text-[#1C62A0]" />
              Hospital Information
            </h4>
            {ambulance.hospitalId && (
              <InfoRow icon={Building} label="Hospital ID" value={ambulance.hospitalId} />
            )}
            {ambulance.hospitalName && (
              <InfoRow icon={Building} label="Hospital Name" value={ambulance.hospitalName} />
            )}
          </div>
        )}

        {/* Timeline Information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#1C62A0]" />
            Timeline
          </h4>
          <InfoRow icon={Calendar} label="Created At" value={formatDate(ambulance.createdAt)} />
          <InfoRow icon={Calendar} label="Last Updated" value={formatDate(ambulance.lastUpdated || ambulance.updatedAt)} />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        {onEdit && (
          <Button 
            variant="primary" 
            onClick={() => {
              onEdit?.(ambulance);
              onClose();
            }}
            className="flex items-center gap-2"
          >
            <Edit size={16} />
            Edit Ambulance
          </Button>
        )}
      </div>
    </Modal>
  );
};

export default ViewAmbulanceModal;