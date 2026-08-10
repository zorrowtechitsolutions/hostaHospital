// src/components/super-admin/DonorDetails.jsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetDonorByIdQuery } from '../../../../../app/service/blooddonor';
import { 
  Loader2, 
  ArrowLeft, 
  Edit2, 
  Trash2,
  Phone,
  Calendar,
  MapPin,
  Droplet,
  User,
  Mail,
  Clock
} from 'lucide-react';
import { showSuccessToast, showErrorToast } from '../../../ui/Toast';

const DonorDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { data, isLoading, error } = useGetDonorByIdQuery(id);
  const donor = data?.data;

  // Helper functions
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  const formatPhone = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    return phone;
  };

  const formatAddress = (address) => {
    if (!address) return '';
    const parts = [
      address.place,
      address.district,
      address.state,
      address.country,
    ].filter(Boolean);
    return parts.join(', ');
  };

  const getBloodGroupColor = (bloodGroup) => {
    const colors = {
      'A+': 'bg-green-100 text-green-800',
      'A-': 'bg-green-50 text-green-600',
      'B+': 'bg-blue-100 text-blue-800',
      'B-': 'bg-blue-50 text-blue-600',
      'O+': 'bg-red-100 text-red-800',
      'O-': 'bg-red-50 text-red-600',
      'AB+': 'bg-purple-100 text-purple-800',
      'AB-': 'bg-purple-50 text-purple-600',
    };
    return colors[bloodGroup] || 'bg-gray-100 text-gray-800';
  };

  const getInitialColor = (name) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
      '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
      '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const toTitleCase = (text = "") => {
    if (!text) return "";
    return text.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={40} className="animate-spin text-[#154A7D]" />
        <span className="ml-3 text-gray-600">Loading donor details...</span>
      </div>
    );
  }

  if (error || !donor) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">Failed to load donor details</p>
        <button
          onClick={() => navigate('/super-admin/blood-donors')}
          className="mt-2 text-sm text-red-700 underline hover:text-red-900"
        >
          Go back
        </button>
      </div>
    );
  }

  const age = calculateAge(donor.dateOfBirth);
  const bloodGroupColor = getBloodGroupColor(donor.bloodGroup);
  const initialColor = getInitialColor(donor.name);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/super-admin/blood-donors')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Donors</span>
        </button>
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/super-admin/blood-donors/edit/${id}`)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
          >
            <Edit2 size={18} />
            Edit Donor
          </button>
        </div>
      </div>

      {/* Donor Card */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-red-600 to-rose-600 px-6 py-8 text-white">
          <div className="flex items-center gap-6">
            <div 
              className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white border-4 border-white/30"
              style={{ backgroundColor: initialColor }}
            >
              <span>{donor.name.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">{toTitleCase(donor.name)}</h1>
              <div className="flex items-center gap-3 mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold bg-white/20 text-white`}>
                  <Droplet size={14} className="inline mr-1" />
                  {donor.bloodGroup}
                </span>
                {age && (
                  <span className="text-white/90 text-sm">
                    {age} years old
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Phone */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <Phone size={16} />
                <span>Phone Number</span>
              </div>
              <p className="text-gray-900 font-medium">{formatPhone(donor.phone)}</p>
            </div>

            {/* Date of Birth */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <Calendar size={16} />
                <span>Date of Birth</span>
              </div>
              <p className="text-gray-900 font-medium">
                {new Date(donor.dateOfBirth).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>

            {/* Address */}
            {donor.address && (
              <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <MapPin size={16} />
                  <span>Address</span>
                </div>
                <p className="text-gray-900 font-medium">{formatAddress(donor.address)}</p>
                {donor.address.pincode && (
                  <p className="text-sm text-gray-500 mt-1">
                    Pincode: {donor.address.pincode}
                  </p>
                )}
              </div>
            )}

            {/* Donor ID */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <User size={16} />
                <span>Donor ID</span>
              </div>
              <p className="text-gray-900 font-medium text-sm">#{donor.id || donor._id}</p>
            </div>

            {/* Created At */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <Clock size={16} />
                <span>Registered On</span>
              </div>
              <p className="text-gray-900 font-medium text-sm">
                {new Date(donor.createdAt).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })}
                {' at '}
                {new Date(donor.createdAt).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonorDetails;