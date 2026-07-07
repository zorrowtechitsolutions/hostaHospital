// src/components/super-admin/hospitals/HospitalBloodBanksList.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Droplet, Loader2, Plus, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react';
import { Card, Button, Pagination, Badge, Modal } from '../../ui';
import { useGetBloodBankQuery, useDeleteBloodBankMutation } from '../../../../app/service/bloodbank';
import { showSuccessToast, showErrorToast } from '../../ui/Toast';
import { socket } from '../../../socket/socket';
import { registerBloodBankEvents, unregisterBloodBankEvents } from '../../../socket/bloodBankEvents';

// Helper function to format blood bank ID
const formatBloodBankId = (id) => {
  if (!id) return '#BB0000';
  const numericId = parseInt(id) || 0;
  return `#BB${String(numericId).padStart(4, '0')}`;
};

const HospitalBloodBanksList = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bloodBankToDelete, setBloodBankToDelete] = useState(null);
  const itemsPerPage = 10;

  const [eventsRegistered, setEventsRegistered] = useState(false);

  const { data: bloodBankData, isLoading, refetch } = useGetBloodBankQuery({
    hospitalId: id,
    search_query: searchTerm || undefined
  });

  const [deleteBloodBank, { isLoading: isDeleting }] = useDeleteBloodBankMutation();

  const bloodBanks = bloodBankData?.data || [];
  
  const transformedBloodBanks = bloodBanks.map(blood => ({
    ...blood,
    formattedId: formatBloodBankId(blood.id)
  }));
  
  const filteredBloodBanks = transformedBloodBanks.filter(b => 
    b.bloodGroup?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.formattedId?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const totalItems = filteredBloodBanks.length;
  const totalUnits = filteredBloodBanks.reduce((sum, item) => sum + (item.count || 0), 0);
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedBloodBanks = filteredBloodBanks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Register socket event listeners
  useEffect(() => {
    registerBloodBankEvents({
      onStockCreated: () => {
        showSuccessToast(`New blood stock added!`, 3000);
        refetch();
      },
      onStockUpdated: () => {
        showSuccessToast(`Blood stock updated!`, 3000);
        refetch();
      },
      onStockDeleted: () => {
        showSuccessToast(`Blood stock deleted!`, 3000);
        refetch();
      }
    });

    setEventsRegistered(true);

    return () => {
      unregisterBloodBankEvents();
      setEventsRegistered(false);
    };
  }, [refetch]);

  // Listen for socket connection
  useEffect(() => {
    const handleConnect = () => {
      if (!eventsRegistered) {
        registerBloodBankEvents({
          onStockCreated: () => {
            showSuccessToast(`New blood stock added!`, 3000);
            refetch();
          },
          onStockUpdated: () => {
            showSuccessToast(`Blood stock updated!`, 3000);
            refetch();
          },
          onStockDeleted: () => {
            showSuccessToast(`Blood stock deleted!`, 3000);
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

  const getBloodGroupColor = (bloodGroup) => {
    const colors = {
      'A+': 'bg-red-100 text-red-800',
      'A-': 'bg-red-100 text-red-800',
      'B+': 'bg-blue-100 text-blue-800',
      'B-': 'bg-blue-100 text-blue-800',
      'O+': 'bg-green-100 text-green-800',
      'O-': 'bg-green-100 text-green-800',
      'AB+': 'bg-purple-100 text-purple-800',
      'AB-': 'bg-purple-100 text-purple-800'
    };
    return colors[bloodGroup] || 'bg-gray-100 text-gray-800';
  };

  const getStockStatus = (count) => {
    if (count > 20) return <Badge className="bg-green-100 text-green-800">High Stock</Badge>;
    if (count > 10) return <Badge className="bg-yellow-100 text-yellow-800">Medium Stock</Badge>;
    if (count > 0) return <Badge className="bg-orange-100 text-orange-800">Low Stock</Badge>;
    return <Badge className="bg-red-100 text-red-800">Out of Stock</Badge>;
  };

  const handleAddBloodBank = () => {
    navigate('/super-admin/blood-bank/add', { state: { hospitalId: id } });
  };

  const handleViewDetails = (bloodBank) => {
    navigate(`/super-admin/blood-bank/${bloodBank.id}`, {
      state: { bloodStock: bloodBank }
    });
  };

  const handleEditBloodBank = (bloodBank) => {
    navigate(`/super-admin/blood-bank/edit/${bloodBank.id}`, { 
      state: { bloodBank, hospitalId: id } 
    });
  };

  const handleDeleteClick = (bloodBank) => {
    setBloodBankToDelete(bloodBank);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (bloodBankToDelete) {
      try {
        await deleteBloodBank(bloodBankToDelete.id).unwrap();
        
        socket.emit("blood_bank_event", {
          event: "STOCK_DELETED",
          data: {
            stockId: bloodBankToDelete.id,
            bloodGroup: bloodBankToDelete.bloodGroup,
            hospitalId: id,
            timestamp: new Date().toISOString()
          }
        });
        
        showSuccessToast(`${bloodBankToDelete.bloodGroup} blood stock has been deleted successfully!`, 2000);
        refetch();
        setShowDeleteModal(false);
        setBloodBankToDelete(null);
      } catch (error) {
        showErrorToast(error?.data?.message || 'Failed to delete blood bank record', 3000);
      }
    }
  };

  const ActionMenu = ({ bloodBank }) => {
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
                handleViewDetails(bloodBank);
                setShowMenu(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg"
            >
              <Eye size={14} /> View Details
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEditBloodBank(bloodBank);
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
                handleDeleteClick(bloodBank);
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
            onClick={handleAddBloodBank}
            className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Plus size={18} />
            Add Blood Stock
          </Button>
        </div>
        <h1 className="text-2xl font-bold text-gray-800">Blood Bank Inventory</h1>
        <div className="flex gap-4 mt-1">
          <p className="text-sm text-gray-500">
            Blood Groups: <span className="font-semibold text-gray-700">{totalItems}</span>
          </p>
          <p className="text-sm text-gray-500">
            Total Units: <span className="font-semibold text-gray-700">{totalUnits}</span>
          </p>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by blood group or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-transparent outline-none"
          />
        </div>
      </div>

      {paginatedBloodBanks.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedBloodBanks.map((blood) => (
              <Card key={blood.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div 
                    className={`w-10 h-10 ${getBloodGroupColor(blood.bloodGroup)} rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer`}
                    onClick={() => handleViewDetails(blood)}
                  >
                    <Droplet size={20} className="text-current" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 
                          className="font-semibold text-gray-900 cursor-pointer hover:text-[#1C62A0]"
                          onClick={() => handleViewDetails(blood)}
                        >
                          {blood.bloodGroup}
                        </h3>
                        <p className="text-xs text-gray-500">{blood.formattedId}</p>
                      </div>
                      <ActionMenu bloodBank={blood} />
                    </div>
                    <div className="space-y-1 mt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Units Available:</span>
                        <span className="text-lg font-bold text-gray-800">{blood.count}</span>
                      </div>
                      <div className="mt-2">
                        {getStockStatus(blood.count)}
                      </div>
                      {blood.lastUpdated && (
                        <p className="text-xs text-gray-500 mt-2">
                          Updated: {new Date(blood.lastUpdated).toLocaleDateString()}
                        </p>
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
                itemLabel="blood groups"
              />
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <Droplet size={48} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            {searchTerm ? 'No blood groups match your search' : 'No blood bank records found for this hospital'}
          </p>
          <Button
            variant="primary"
            onClick={handleAddBloodBank}
            className="mt-4 flex items-center gap-2 mx-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Plus size={18} />
            Add Your First Blood Stock
          </Button>
        </div>
      )}

      <Modal 
        isOpen={showDeleteModal} 
        onClose={() => {
          setShowDeleteModal(false);
          setBloodBankToDelete(null);
        }} 
        title="Delete Blood Stock" 
        size="sm"
      >
        <div className="p-4">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <Trash2 size={24} className="text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Deletion</h3>
            <p className="text-gray-500 mb-4">
              Are you sure you want to delete <span className="font-semibold text-gray-700">{bloodBankToDelete?.bloodGroup}</span> blood stock? 
              This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowDeleteModal(false);
                  setBloodBankToDelete(null);
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
                {isDeleting ? 'Deleting...' : 'Delete Stock'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default HospitalBloodBanksList;