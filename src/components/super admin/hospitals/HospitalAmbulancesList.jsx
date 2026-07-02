// src/components/super-admin/hospitals/HospitalAmbulancesList.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Ambulance, Phone, MapPin, Loader2, Truck, Plus, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react';
import { Card, Button, Pagination, Badge, Modal } from '../../ui';
import { useGetAmbulanceQuery, useDeleteAmbulanceMutation } from '../../../../app/service/ambulance';
import { showSuccessToast, showErrorToast } from '../../ui/Toast';
import ViewAmbulanceModal from '../../Ambulance/ViewAmbulanceModal';
import { socket } from '../../../socket/socket';
import { registerAmbulanceEvents, unregisterAmbulanceEvents } from '../../../socket/ambulanceEvents';

const formatAmbulanceId = (id) => {
  if (!id) return '#AMB0000';
  const numericId = parseInt(id) || 0;
  return `#AMB${String(numericId).padStart(4, '0')}`;
};

const HospitalAmbulancesList = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ambulanceToDelete, setAmbulanceToDelete] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedAmbulance, setSelectedAmbulance] = useState(null);
  const [eventsRegistered, setEventsRegistered] = useState(false);
  const itemsPerPage = 10;

  const { data: ambulanceData, isLoading, refetch } = useGetAmbulanceQuery({
    hospitalId: id
  });

  const [deleteAmbulance, { isLoading: isDeleting }] = useDeleteAmbulanceMutation();

  const ambulances = ambulanceData?.data || [];
  
  const transformedAmbulances = ambulances.map(ambulance => ({
    ...ambulance,
    formattedId: formatAmbulanceId(ambulance.id)
  }));
  
  const filteredAmbulances = transformedAmbulances.filter(a => 
    a.serviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.vehicleType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.phone?.includes(searchTerm) ||
    a.formattedId?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const totalItems = filteredAmbulances.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedAmbulances = filteredAmbulances.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    registerAmbulanceEvents({
      onRegistered: (data) => {
        showSuccessToast(`New ambulance "${data.serviceName || 'Ambulance'}" registered!`, 3000);
        refetch();
      },
      onUpdated: (data) => {
        showSuccessToast(`Ambulance "${data.serviceName || 'Ambulance'}" updated!`, 3000);
        refetch();
      },
      onDeleted: (data) => {
        showSuccessToast(`Ambulance deleted!`, 3000);
        refetch();
      }
    });

    setEventsRegistered(true);

    return () => {
      unregisterAmbulanceEvents();
      setEventsRegistered(false);
    };
  }, [refetch]);

  useEffect(() => {
    const handleConnect = () => {
      if (!eventsRegistered) {
        registerAmbulanceEvents({
          onRegistered: (data) => {
            showSuccessToast(`New ambulance registered!`, 3000);
            refetch();
          },
          onUpdated: (data) => {
            showSuccessToast(`Ambulance updated!`, 3000);
            refetch();
          },
          onDeleted: (data) => {
            showSuccessToast(`Ambulance deleted!`, 3000);
            refetch();
          }
        });
        setEventsRegistered(true);
      }
    };

    const handleDisconnect = () => {
      setEventsRegistered(false);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [refetch, eventsRegistered]);

  const handleAddAmbulance = () => {
    navigate('/super-admin/ambulance/add', { state: { hospitalId: id } });
  };

  const handleViewDetails = (ambulance) => {
    setSelectedAmbulance(ambulance);
    setShowViewModal(true);
  };

  const handleEditAmbulance = (ambulance) => {
    navigate(`/super-admin/ambulance/edit/${ambulance.id}`, { state: { ambulance, hospitalId: id } });
  };

  const handleDeleteClick = (ambulance) => {
    setAmbulanceToDelete(ambulance);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (ambulanceToDelete) {
      try {
        await deleteAmbulance(ambulanceToDelete.id).unwrap();
        
        socket.emit("ambulance_event", {
          event: "AMBULANCE_DELETED",
          data: {
            ambulanceId: ambulanceToDelete.id,
            serviceName: ambulanceToDelete.serviceName,
            hospitalId: id,
            timestamp: new Date().toISOString()
          }
        });
        
        showSuccessToast(`${ambulanceToDelete.serviceName} has been deleted successfully!`, 2000);
        refetch();
        setShowDeleteModal(false);
        setAmbulanceToDelete(null);
      } catch (error) {
        showErrorToast(error?.data?.message || 'Failed to delete ambulance', 3000);
      }
    }
  };

  const ActionMenu = ({ ambulance }) => {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
      const handleClickOutside = (e) => {
        if (menuRef.current && !menuRef.current.contains(e.target)) {
          setShowMenu(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
      <div className="relative inline-block" ref={menuRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <MoreVertical size={16} className="text-gray-500" />
        </button>
        
        {showMenu && (
          <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleViewDetails(ambulance);
                setShowMenu(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg"
            >
              <Eye size={14} /> View Details
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEditAmbulance(ambulance);
                setShowMenu(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Edit size={14} /> Edit
            </button>
            <div className="border-t border-gray-100"></div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick(ambulance);
                setShowMenu(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-gray-100 rounded-b-lg"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-10 w-10 animate-spin text-[#6366F1]" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} className="mr-1" /> Back to Hospital Details
          </Button>
          <Button
            variant="primary"
            onClick={handleAddAmbulance}
            className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Plus size={18} />
            Add Ambulance
          </Button>
        </div>
        <h1 className="text-2xl font-bold text-gray-800">Ambulances List</h1>
        <p className="text-sm text-gray-500 mt-1">Total Ambulances: {totalItems}</p>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search ambulances by name, ID, type or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
          />
        </div>
      </div>

      {paginatedAmbulances.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedAmbulances.map((ambulance) => (
              <Card key={ambulance.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Ambulance size={20} className="text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 truncate">{ambulance.serviceName}</h3>
                        <p className="text-xs text-gray-500">{ambulance.formattedId}</p>
                      </div>
                      <ActionMenu ambulance={ambulance} />
                    </div>
                    <div className="space-y-1 mt-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone size={14} className="text-gray-400 flex-shrink-0" />
                        <span className="truncate">{ambulance.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Truck size={14} className="text-gray-400 flex-shrink-0" />
                        <span className="truncate">{ambulance.vehicleType || 'Standard'}</span>
                      </div>
                      {ambulance.address && (
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="truncate">
                            {ambulance.address.place}, {ambulance.address.district}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                itemLabel="ambulances"
              />
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <Ambulance size={48} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            {searchTerm ? 'No ambulances match your search' : 'No ambulances found for this hospital'}
          </p>
          <Button
            variant="primary"
            onClick={handleAddAmbulance}
            className="mt-4 flex items-center gap-2 mx-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Plus size={18} />
            Add Your First Ambulance
          </Button>
        </div>
      )}

      <ViewAmbulanceModal 
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedAmbulance(null);
        }}
        ambulance={selectedAmbulance}
        onEdit={(ambulance) => {
          handleEditAmbulance(ambulance);
          setShowViewModal(false);
        }}
      />

      <Modal 
        isOpen={showDeleteModal} 
        onClose={() => {
          setShowDeleteModal(false);
          setAmbulanceToDelete(null);
        }} 
        title="Delete Ambulance" 
        size="sm"
      >
        <div className="p-4">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <Trash2 size={24} className="text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Deletion</h3>
            <p className="text-gray-500 mb-4">
              Are you sure you want to delete <span className="font-semibold text-gray-700">{ambulanceToDelete?.serviceName}</span>? 
              This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowDeleteModal(false);
                  setAmbulanceToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                variant="danger" 
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Ambulance'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default HospitalAmbulancesList;