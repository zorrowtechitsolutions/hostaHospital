// src/components/super-admin/StaffDetailsModal.jsx
import React from 'react';
import { Modal, Badge, Button } from '../../../ui';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const StaffDetailsModal = ({ staff, onClose, onEdit }) => {
  if (!staff) return null;

  // Helper function for S3 images
  const getS3ImageUrl = (imageUrl) => {
    if (!imageUrl) return '';
    // If using S3, transform the URL here
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    const S3_BASE_URL = 'https://hostahealthcare.s3.eu-north-1.amazonaws.com';
    return `${S3_BASE_URL}/${encodeURIComponent(imageUrl)}`;
  };

  // Format date helper
  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  // Format address helper - handles both string and object addresses
  const formatAddress = (address) => {
    if (!address) return 'N/A';
    
    // If it's already a string, return it
    if (typeof address === 'string') {
      return address;
    }
    
    // If it's an object, format it nicely
    if (typeof address === 'object') {
      const parts = [
        address.place,
        address.district,
        address.city,
        address.state,
        address.country,
        address.pincode || address.zipCode
      ].filter(Boolean);
      
      return parts.length > 0 ? parts.join(', ') : 'N/A';
    }
    
    return 'N/A';
  };

  // Safe formatter for any field that might be an object
  const formatField = (value) => {
    if (!value) return 'N/A';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'object') {
      // If it's an object with a name property
      if (value.name) return value.name;
      // If it's an object with a title property
      if (value.title) return value.title;
      // Otherwise, try to stringify
      try {
        return JSON.stringify(value);
      } catch {
        return 'N/A';
      }
    }
    return 'N/A';
  };

  // Debug log to see what fields are objects
  React.useEffect(() => {
    if (staff) {
      console.log('Staff Details Modal - Staff Data:', staff);
      console.log('Address type:', typeof staff.address, staff.address);
      console.log('Department type:', typeof staff.department, staff.department);
      console.log('Qualifications type:', typeof staff.qualifications, staff.qualifications);
    }
  }, [staff]);

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Staff Details"
      size="lg"
    >
      {/* Staff Photo + Name + ID */}
      <div className="flex items-center gap-4 mb-6">
        <Avatar className="w-16 h-16">
          <AvatarImage
            src={getS3ImageUrl(staff.imageUrl)}
            alt={staff.name}
          />
          <AvatarFallback className="text-xl font-medium bg-gradient-to-br from-purple-100 to-purple-200">
            {staff.name?.charAt(0)?.toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>

        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-800 text-lg">
              {staff.name}
            </h3>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {staff.formattedId || staff.id}
            </span>
          </div>
          {staff.staffType && (
            <p className="text-sm text-gray-500 mt-1">{formatField(staff.staffType)}</p>
          )}
        </div>
      </div>

      {/* Staff Details Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Designation */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
            Designation
          </label>
          <p className="text-sm text-gray-800 mt-1">{formatField(staff.designation)}</p>
        </div>

        {/* Department */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
            Department
          </label>
          <p className="text-sm text-gray-800 mt-1">
            {formatField(staff.department)}
          </p>
        </div>

        {/* Gender */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
            Gender
          </label>
          <p className="text-sm text-gray-800 mt-1">{formatField(staff.gender)}</p>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
            Phone
          </label>
          <p className="text-sm text-gray-800 mt-1">{formatField(staff.phone)}</p>
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
            Email
          </label>
          <p className="text-sm text-gray-800 mt-1 break-words">{formatField(staff.email)}</p>
        </div>

        {/* Joining Date */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
            Joining Date
          </label>
          <p className="text-sm text-gray-800 mt-1">{formatDate(staff.joiningDate)}</p>
        </div>

        {/* Date of Birth */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
            Date of Birth
          </label>
          <p className="text-sm text-gray-800 mt-1">{formatDate(staff.dob)}</p>
        </div>

        {/* Status Badge */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
            Status
          </label>
          <div className="mt-1">
            <Badge
              variant={staff.status === 'Active' ? 'success' : 'danger'}
            >
              {staff.status || 'active'}
            </Badge>
          </div>
        </div>

        {/* Hospital ID */}
        {staff.hospitalId && (
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
              Hospital ID
            </label>
            <p className="text-sm text-gray-800 mt-1">{formatField(staff.hospitalId)}</p>
          </div>
        )}

        {/* Address (full width) - USING THE FIXED FORMATTER */}
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
            Address
          </label>
          <p className="text-sm text-gray-800 mt-1">{formatAddress(staff.address)}</p>
        </div>

        {/* Qualifications (if available) */}
        {staff.qualifications && (
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
              Qualifications
            </label>
            <p className="text-sm text-gray-800 mt-1">{formatField(staff.qualifications)}</p>
          </div>
        )}

        {/* Experience (if available) */}
        {staff.experience && (
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
              Experience
            </label>
            <p className="text-sm text-gray-800 mt-1">{formatField(staff.experience)} years</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-6 pt-4 border-t">
        <Button variant="outline" onClick={onClose} fullWidth>
          Close
        </Button>

        <Button
          variant="primary"
          onClick={() => {
            onEdit?.(staff);
            onClose();
          }}
          fullWidth
        >
          Edit Staff
        </Button>
      </div>
    </Modal>
  );
};

export default StaffDetailsModal;