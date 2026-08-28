import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, MapPin, Car, Building2, Calendar, User } from 'lucide-react';
import { useGetAmbulanceQuery } from '../../../../../app/service/ambulance';
import { showErrorToast } from '../../../ui/Toast';

const AmbulanceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { data: ambulanceData, isLoading, error } = useGetAmbulanceQuery({ 
    id: id,
    skipHospitalFilter: true 
  });

  const ambulance = ambulanceData?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#154A7D]"></div>
      </div>
    );
  }

  if (error) {
    showErrorToast('Failed to load ambulance details');
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load ambulance details</p>
        <button 
          onClick={() => navigate('/super-admin/ambulance')}
          className="mt-4 text-[#154A7D] hover:underline"
        >
          Go back to list
        </button>
      </div>
    );
  }

  if (!ambulance) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Ambulance not found</p>
        <button 
          onClick={() => navigate('/super-admin/ambulance')}
          className="mt-4 text-[#154A7D] hover:underline"
        >
          Go back to list
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Back Button */}
      <button
        onClick={() => navigate('/super-admin/ambulance')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        <span>Back to Ambulances</span>
      </button>

      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl p-6 text-white mb-6">
        <h1 className="text-2xl font-bold">{ambulance.serviceName || ambulance.name}</h1>
        <p className="text-emerald-100 mt-1">Ambulance Service Details</p>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Car size={20} className="text-emerald-600" />
            Basic Information
          </h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <User size={18} className="text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Service Name</p>
                <p className="font-medium">{ambulance.serviceName || ambulance.name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone size={18} className="text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Phone Number</p>
                <p className="font-medium">{ambulance.phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Car size={18} className="text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Vehicle Type</p>
                <p className="font-medium">{ambulance.vehicleType || 'Not specified'}</p>
              </div>
            </div>
            {ambulance.hospitalId && (
              <div className="flex items-start gap-3">
                <Building2 size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Hospital ID</p>
                  <p className="font-medium">{ambulance.hospitalId}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <MapPin size={20} className="text-emerald-600" />
            Address Information
          </h2>
          {ambulance.address ? (
            <div className="space-y-3">
              {ambulance.address.place && (
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Place</p>
                    <p className="font-medium">{ambulance.address.place}</p>
                  </div>
                </div>
              )}
              {ambulance.address.district && (
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">District</p>
                    <p className="font-medium">{ambulance.address.district}</p>
                  </div>
                </div>
              )}
              {ambulance.address.state && (
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">State</p>
                    <p className="font-medium">{ambulance.address.state}</p>
                  </div>
                </div>
              )}
              {ambulance.address.country && (
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Country</p>
                    <p className="font-medium">{ambulance.address.country}</p>
                  </div>
                </div>
              )}
              {ambulance.address.pincode && (
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Pincode</p>
                    <p className="font-medium">{ambulance.address.pincode}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No address information available</p>
          )}
        </div>

        {/* Additional Information */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 md:col-span-2">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-emerald-600" />
            Additional Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ambulance.createdAt && (
              <div>
                <p className="text-sm text-gray-500">Created At</p>
                <p className="font-medium">{new Date(ambulance.createdAt).toLocaleDateString()}</p>
              </div>
            )}
            {ambulance.updatedAt && (
              <div>
                <p className="text-sm text-gray-500">Last Updated</p>
                <p className="font-medium">{new Date(ambulance.updatedAt).toLocaleDateString()}</p>
              </div>
            )}
            {ambulance.userId && (
              <div>
                <p className="text-sm text-gray-500">User ID</p>
                <p className="font-medium">{ambulance.userId}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AmbulanceDetails;