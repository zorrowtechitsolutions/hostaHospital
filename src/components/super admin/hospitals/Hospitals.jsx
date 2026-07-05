// src/components/super-admin/Hospitals.jsx
import React, { useState, useEffect } from 'react';
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
  Plus,
  RotateCcw,
  Eye
} from 'lucide-react';
import { Card, Button, Modal, Pagination, Badge } from '../../ui';
import { showSuccessToast, showErrorToast } from '../../ui/Toast';
import { 
  useGetAllHospitalsQuery, 
  useDeleteHospitalMutation,
  useRecoverHospitalMutation
} from '../../../../app/service/hospitalApi';
import { socket } from '../../../socket/socket';
import { registerHospitalEvents, unregisterHospitalEvents } from '../../../socket/hospitalEvents';

const Hospitals = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [hospitalToDelete, setHospitalToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleted, setShowDeleted] = useState(false);
  const itemsPerPage = 6;

  const [eventsRegistered, setEventsRegistered] = useState(false);

  const { 
    data: hospitalsData, 
    isLoading, 
    refetch,
    isFetching 
  } = useGetAllHospitalsQuery({
    includeDeleted: showDeleted
  });
  
  const [deleteHospital, { isLoading: isDeleting }] = useDeleteHospitalMutation();
  const [recoverHospital, { isLoading: isRecovering }] = useRecoverHospitalMutation();

  // Register socket event listeners
  useEffect(() => {
    registerHospitalEvents({
      onHospitalRegistered: (data) => {
        showSuccessToast(`New hospital registered: ${data.hospitalName || 'Hospital'}`, 3000);
        refetch();
      },
      onHospitalUpdated: (data) => {
        showSuccessToast(`Hospital ${data.hospitalName || 'Hospital'} updated successfully!`, 3000);
        refetch();
      },
      onHospitalDeleted: () => {
        showSuccessToast(`Hospital deleted!`, 3000);
        refetch();
      },
      onHospitalBlacklisted: () => {
        showSuccessToast(`Hospital blacklisted!`, 3000);
        refetch();
      },
      onHospitalRecovered: () => {
        showSuccessToast(`Hospital recovered successfully!`, 3000);
        refetch();
      }
    });

    setEventsRegistered(true);

    return () => {
      unregisterHospitalEvents();
      setEventsRegistered(false);
    };
  }, [refetch]);

  // Listen for socket connection
  useEffect(() => {
    const handleConnect = () => {
      if (!eventsRegistered) {
        registerHospitalEvents({
          onHospitalRegistered: (data) => {
            showSuccessToast(`New hospital registered: ${data.hospitalName || 'Hospital'}`, 3000);
            refetch();
          },
          onHospitalUpdated: (data) => {
            showSuccessToast(`Hospital ${data.hospitalName || 'Hospital'} updated successfully!`, 3000);
            refetch();
          },
          onHospitalDeleted: () => {
            showSuccessToast(`Hospital deleted!`, 3000);
            refetch();
          },
          onHospitalBlacklisted: () => {
            showSuccessToast(`Hospital blacklisted!`, 3000);
            refetch();
          },
          onHospitalRecovered: () => {
            showSuccessToast(`Hospital recovered successfully!`, 3000);
            refetch();
          }
        });
        setEventsRegistered(true);
      }
    };

    socket.on("connect", handleConnect);

    return () => {
      socket.off("connect", handleConnect);
    };
  }, [refetch, eventsRegistered]);

  const transformHospitals = (hospitals) => {
    if (!hospitals || !Array.isArray(hospitals)) return [];
    
    return hospitals.map((hospital) => {
      let status = 'Active';
      if (hospital.isDelete) {
        status = 'Blacklisted';
      } else if (hospital.isActive === false) {
        status = 'Inactive';
      }
      
      return {
        ...hospital,
        isDelete: hospital.isDelete || false,
        isActive: hospital.isActive !== undefined ? hospital.isActive : true,
        displayStatus: status
      };
    });
  };

  const hospitals = transformHospitals(hospitalsData?.data || hospitalsData || []);
  const totalItems = hospitalsData?.pagination?.totalItems || hospitals.length;

  const handleDelete = async () => {
    if (hospitalToDelete) {
      try {
        await deleteHospital(hospitalToDelete.id).unwrap();
        
        socket.emit("hospital_event", {
          event: "HOSPITAL_DELETED",
          data: {
            hospitalId: hospitalToDelete.id,
            hospitalName: hospitalToDelete.name,
            timestamp: new Date().toISOString()
          }
        });
        
        showSuccessToast(`${hospitalToDelete.name} deleted successfully!`);
        refetch();
        setShowModal(false);
        setHospitalToDelete(null);
      } catch (error) {
        showErrorToast(error?.data?.message || 'Failed to delete hospital');
      }
    }
  };

  const handleRecoverHospital = async (hospital, e) => {
    e.stopPropagation();
    try {
      await recoverHospital(hospital.id).unwrap();
      
      socket.emit("hospital_event", {
        event: "HOSPITAL_RECOVERED",
        data: {
          hospitalId: hospital.id,
          hospitalName: hospital.name,
          timestamp: new Date().toISOString()
        }
      });
      
      showSuccessToast(`${hospital.name} recovered successfully!`);
      refetch();
    } catch (error) {
      showErrorToast(error?.data?.message || 'Failed to recover hospital');
    }
  };

  const handleDeleteClick = (hospital, e) => {
    e.stopPropagation();
    if (hospital.isDelete) {
      showErrorToast('Cannot delete a blacklisted hospital', 3000);
      return;
    }
    setHospitalToDelete(hospital);
    setShowModal(true);
  };

  const handleEditClick = (hospital, e) => {
    e.stopPropagation();
    if (hospital.isDelete) {
      showErrorToast('Cannot edit blacklisted hospital', 3000);
      return;
    }
    navigate(`/super-admin/hospitals/edit/${hospital.id}`, { state: { hospital } });
  };

  const handleCardClick = (hospitalId, hospital) => {
    if (hospital.isDelete) {
      showErrorToast('Cannot view details of blacklisted hospital', 3000);
      return;
    }
    navigate(`/super-admin/hospitals/${hospitalId}`);
  };

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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, showDeleted]);

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
      <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Hospitals Management</h1>
          <p className="text-sm text-gray-500 mt-1">Click on any hospital to view details</p>
        </div>
        <div className="flex gap-2">
          {/* <Button
            variant={showDeleted ? "primary" : "outline"}
            size="sm"
            onClick={() => setShowDeleted(!showDeleted)}
            className="flex items-center gap-1"
          >
            <Trash2 size={14} />
            {showDeleted ? "Hide Deleted" : "Show Deleted"}
          </Button> */}

          <Button
            variant="primary"
            onClick={() => navigate('/super-admin/hospitals/add')}
            className="flex items-center gap-2"
          >
            <Plus size={18} />
            Add Hospital
          </Button>
        </div>
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
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Hospitals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {paginatedHospitals.map((hospital) => {
          const isBlacklisted = hospital.isDelete;
          
          return (
            <div
              key={hospital.id}
              onClick={() => handleCardClick(hospital.id, hospital)}
              className={`transition-transform hover:scale-[1.02] ${!isBlacklisted ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <Card className={`h-[360px] p-6 hover:shadow-lg transition-all duration-300 flex flex-col justify-between ${
                isBlacklisted ? 'bg-gray-50 border-gray-300' : ''
              }`}>
                {/* Top Section */}
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isBlacklisted 
                          ? 'bg-gray-400' 
                          : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                      }`}>
                        <Building2 size={24} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold text-lg truncate ${
                          isBlacklisted ? 'text-gray-500' : 'text-gray-900'
                        }`}>
                          {hospital.name}
                        </h3>
                        <p className={`text-xs ${isBlacklisted ? 'text-gray-400' : 'text-gray-500'}`}>
                          ID: {hospital.id}
                        </p>
                        <div className="mt-1">
                          {isBlacklisted ? (
                            <Badge variant="secondary" className="text-xs">
                              Blacklisted
                            </Badge>
                          ) : (
                            <Badge variant="success" className="text-xs">
                              Active
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className={`flex items-center gap-2 text-sm ${
                      isBlacklisted ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      <Mail size={14} className="text-gray-400 flex-shrink-0" />
                      <span className="truncate">{hospital.email}</span>
                    </div>
                    <div className={`flex items-center gap-2 text-sm ${
                      isBlacklisted ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      <Phone size={14} className="text-gray-400 flex-shrink-0" />
                      <span>{hospital.phone || 'N/A'}</span>
                    </div>
                    {hospital.address && (
                      <div className={`flex items-start gap-2 text-sm ${
                        isBlacklisted ? 'text-gray-400' : 'text-gray-600'
                      }`}>
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
                  {isBlacklisted ? (
                    <Button
                      size="sm"
                      variant="success"
                      onClick={(e) => handleRecoverHospital(hospital, e)}
                      disabled={isRecovering}
                      className="flex items-center gap-1"
                    >
                      <RotateCcw size={14} />
                      Recover
                    </Button>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
              </Card>
            </div>
          );
        })}
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
          <p className="text-gray-500">
            {showDeleted ? "No deleted hospitals found" : "No hospitals found"}
          </p>
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