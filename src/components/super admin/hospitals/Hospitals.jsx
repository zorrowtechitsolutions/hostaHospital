// src/components/super-admin/Hospitals.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Edit,
  Trash2,
  Search,
  Loader2,
  MapPin,
  Mail,
  Phone,
  Plus
} from 'lucide-react';
import { Card, Button, Modal, Pagination } from '../../ui';
import { showSuccessToast, showErrorToast } from '../../ui/Toast';
import { 
  useGetAllHospitalsQuery, 
  useDeleteHospitalMutation 
} from '../../../../app/service/hospitalApi';

const Hospitals = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [hospitalToDelete, setHospitalToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // API hooks
  const { data: hospitalsData, isLoading, refetch } = useGetAllHospitalsQuery();
  const [deleteHospital, { isLoading: isDeleting }] = useDeleteHospitalMutation();

  // Get hospitals array from response
  const hospitals = hospitalsData?.data || hospitalsData || [];

  const handleDelete = async () => {
    if (hospitalToDelete) {
      try {
        await deleteHospital(hospitalToDelete.id).unwrap();
        showSuccessToast(`${hospitalToDelete.name} deleted successfully!`);
        refetch();
        setShowModal(false);
        setHospitalToDelete(null);
      } catch (error) {
        console.error('Error deleting hospital:', error);
        showErrorToast(error?.data?.message || 'Failed to delete hospital');
      }
    }
  };

  const handleDeleteClick = (hospital, e) => {
    e.stopPropagation();
    setHospitalToDelete(hospital);
    setShowModal(true);
  };

  const handleEditClick = (hospital, e) => {
    e.stopPropagation();
    navigate(`/super-admin/hospitals/edit/${hospital.id}`, { state: { hospital } });
  };

  const handleCardClick = (hospitalId) => {
    navigate(`/super-admin/hospitals/${hospitalId}`);
  };

  // Helper function to get full address
  const getFullAddress = (address) => {
    if (!address) return 'N/A';
    const parts = [address.place, address.district, address.state, address.country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  };

  const filteredHospitals = hospitals.filter(h => 
    h.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.address?.place?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.address?.district?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredHospitals.length / itemsPerPage);
  const paginatedHospitals = filteredHospitals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#6366F1] mx-auto mb-3" />
          <p className="text-gray-500">Loading hospitals...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header with Add Hospital Button */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Hospitals Management</h1>
          <p className="text-sm text-gray-500 mt-1">Click on any hospital to view details</p>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate('/super-admin/hospitals/add')}
          className="flex items-center gap-2"
        >
          <Plus size={18} />
          Add Hospital
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search hospitals by name, email, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
          />
        </div>
      </div>

      {/* Hospitals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {paginatedHospitals.map((hospital) => (
          <div
            key={hospital.id}
            onClick={() => handleCardClick(hospital.id)}
            className="cursor-pointer transition-transform hover:scale-[1.02]"
          >
            <Card className="h-[340px] p-6 hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
              {/* Top Section */}
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Building2 size={24} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-lg truncate">
                        {hospital.name}
                      </h3>
                      <p className="text-xs text-gray-500">ID: {hospital.id}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail size={14} className="text-gray-400 flex-shrink-0" />
                    <span className="truncate">{hospital.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone size={14} className="text-gray-400 flex-shrink-0" />
                    <span>{hospital.phone || 'N/A'}</span>
                  </div>
                  {hospital.address && (
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2 text-sm">
                        {getFullAddress(hospital.address)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Section - Buttons */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => handleEditClick(hospital, e)}
                >
                  <Edit size={14} className="mr-1" />
                  Edit
                </Button>
                <Button 
                  size="sm" 
                  variant="danger" 
                  onClick={(e) => handleDeleteClick(hospital, e)}
                  disabled={isDeleting}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </Card>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredHospitals.length}
            itemsPerPage={itemsPerPage}
            itemLabel="hospitals"
          />
        </div>
      )}

      {/* No Results */}
      {filteredHospitals.length === 0 && (
        <div className="text-center py-12">
          <Building2 size={48} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No hospitals found</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={showModal} 
        onClose={() => {
          setShowModal(false);
          setHospitalToDelete(null);
        }} 
        title="Delete Hospital" 
        size="sm"
      >
        <div className="p-4">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <Trash2 size={24} className="text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Deletion</h3>
            <p className="text-gray-500 mb-4">
              Are you sure you want to delete <span className="font-semibold text-gray-700">{hospitalToDelete?.name}</span>? 
              This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowModal(false);
                  setHospitalToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                variant="danger" 
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Hospital'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Hospitals;