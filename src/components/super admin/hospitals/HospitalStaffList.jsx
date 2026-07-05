// src/components/super-admin/HospitalStaffList.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Briefcase, Phone, Mail, MapPin, Loader2, Calendar, User, Eye, MoreVertical, Edit, Trash2, Plus } from 'lucide-react';
import { Card, Button, Pagination, Modal } from '../../ui';
import { useGetStaffQuery, useDeleteStaffMutation } from '../../../../app/service/staffApi';
import StaffDetails from '../hospitals/staff/staffDetails';
import { showSuccessToast, showErrorToast } from '../../ui/Toast';
import { socket } from '../../../socket/socket';
import { registerStaffEvents, unregisterStaffEvents } from '../../../socket/staffEvents';

const HospitalStaffList = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const itemsPerPage = 10;

  const [eventsRegistered, setEventsRegistered] = useState(false);

  const { data: staffData, isLoading, refetch, isFetching } = useGetStaffQuery({
    hospitalId: id,
    page: currentPage,
    limit: itemsPerPage,
    search_query: searchTerm || undefined
  });

  const [deleteStaff, { isLoading: isDeleting }] = useDeleteStaffMutation();

  const allStaff = staffData?.data || [];
  const totalItems = staffData?.pagination?.totalItems || allStaff.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Register socket event listeners
  useEffect(() => {
    registerStaffEvents({
      onStaffRegistered: () => {
        showSuccessToast(`New staff registered!`, 3000);
        refetch();
      },
      onStaffUpdated: () => {
        showSuccessToast(`Staff updated!`, 3000);
        refetch();
      },
      onStaffDeleted: () => {
        showSuccessToast(`Staff deleted!`, 3000);
        refetch();
      },
      onStaffRecovered: () => {
        showSuccessToast(`Staff recovered!`, 3000);
        refetch();
      },
      onStaffPasswordReset: () => {
        showSuccessToast(`Staff password reset!`, 3000);
        refetch();
      },
      onStaffPasswordChanged: () => {
        showSuccessToast(`Staff password changed!`, 3000);
        refetch();
      }
    });

    setEventsRegistered(true);

    return () => {
      unregisterStaffEvents();
      setEventsRegistered(false);
    };
  }, [refetch]);

  // Listen for socket connection
  useEffect(() => {
    const handleConnect = () => {
      if (!eventsRegistered) {
        registerStaffEvents({
          onStaffRegistered: () => {
            showSuccessToast(`New staff registered!`, 3000);
            refetch();
          },
          onStaffUpdated: () => {
            showSuccessToast(`Staff updated!`, 3000);
            refetch();
          },
          onStaffDeleted: () => {
            showSuccessToast(`Staff deleted!`, 3000);
            refetch();
          },
          onStaffRecovered: () => {
            showSuccessToast(`Staff recovered!`, 3000);
            refetch();
          },
          onStaffPasswordReset: () => {
            showSuccessToast(`Staff password reset!`, 3000);
            refetch();
          },
          onStaffPasswordChanged: () => {
            showSuccessToast(`Staff password changed!`, 3000);
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

  const formatAddress = (address) => {
    if (!address) return 'N/A';
    if (typeof address === 'string') return address;
    
    const parts = [
      address.place,
      address.district,
      address.city,
      address.state,
      address.country,
      address.pincode
    ].filter(Boolean);
    
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  };

  const formatDate = (date) => {
    if (!date) return '';
    try {
      return new Date(date).toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return '';
    }
  };

  const getStringValue = (value) => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'object') {
      if (value.name) return value.name;
      if (value.title) return value.title;
      return '';
    }
    return '';
  };

  const handleViewDetails = (staff) => {
    const transformedStaff = {
      ...staff,
      address: formatAddress(staff.address),
      department: getStringValue(staff.department) || getStringValue(staff.designation),
      designation: getStringValue(staff.designation),
      staffType: getStringValue(staff.staffType),
      qualifications: getStringValue(staff.qualifications),
      experience: getStringValue(staff.experience),
      joiningDate: formatDate(staff.joiningDate),
      dob: formatDate(staff.dob),
      gender: getStringValue(staff.gender),
      phone: getStringValue(staff.phone),
      email: getStringValue(staff.email),
      name: getStringValue(staff.name),
      formattedId: staff.formattedId || `#SF${String(staff.id).padStart(4, '0')}`,
      status: staff.status === 'active' ? 'Active' : 
              staff.status === 'inactive' ? 'Inactive' : 
              staff.isActive === true ? 'Active' :
              staff.isActive === false ? 'Inactive' : 'Active'
    };

    setSelectedStaff(transformedStaff);
    setShowDetailsModal(true);
  };

  const handleAddStaff = () => {
    navigate('/super-admin/staff/add', { state: { hospitalId: id } });
  };

  const handleEditStaff = (staff) => {
    navigate(`/super-admin/staff/edit/${staff.id}`, { state: { staff, hospitalId: id } });
  };

  const handleDeleteClick = (staff) => {
    setStaffToDelete(staff);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (staffToDelete) {
      try {
        await deleteStaff(staffToDelete.id).unwrap();
        
        socket.emit("staff_event", {
          event: "STAFF_DELETED",
          data: {
            staffId: staffToDelete.id,
            staffName: staffToDelete.name,
            hospitalId: id,
            timestamp: new Date().toISOString()
          }
        });
        
        showSuccessToast(`${staffToDelete.name} has been deleted successfully!`, 2000);
        refetch();
        setShowDeleteModal(false);
        setStaffToDelete(null);
      } catch (error) {
        showErrorToast(error?.data?.message || 'Failed to delete staff member', 3000);
      }
    }
  };

  const ActionMenu = ({ staff }) => {
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
                handleViewDetails(staff);
                setShowMenu(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg"
            >
              <Eye size={14} /> View Details
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEditStaff(staff);
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
                handleDeleteClick(staff);
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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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
            onClick={handleAddStaff}
            className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Plus size={18} />
            Add Staff
          </Button>
        </div>
        <h1 className="text-2xl font-bold text-gray-800">Staff List</h1>
        <p className="text-sm text-gray-500 mt-1">
          Total Staff: {totalItems}
        </p>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search staff by name, designation, or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-transparent border border-gray-300 outline-none"
          />
        </div>
      </div>

      {allStaff.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allStaff.map((staffMember) => (
              <Card 
                key={staffMember.id} 
                className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleViewDetails(staffMember)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center flex-shrink-0">
                    {staffMember.imageUrl ? (
                      <img 
                        src={staffMember.imageUrl} 
                        alt={staffMember.name}
                        className="w-12 h-12 rounded-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = `<div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                            <Briefcase size={20} class="text-purple-600" />
                          </div>`;
                        }}
                      />
                    ) : (
                      <span className="text-purple-600 font-semibold text-lg">
                        {staffMember.name?.charAt(0)?.toUpperCase() || 'S'}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 truncate">{staffMember.name}</h3>
                      <ActionMenu staff={staffMember} />
                    </div>
                    <p className="text-xs text-gray-500">ID: {staffMember.formattedId || staffMember.id}</p>
                    <p className="text-xs text-gray-400">Hospital ID: {staffMember.hospitalId}</p>
                    <div className="space-y-1 mt-2">
                      {staffMember.designation && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Briefcase size={14} className="text-gray-400 flex-shrink-0" />
                          <span className="truncate">{staffMember.designation}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone size={14} className="text-gray-400 flex-shrink-0" />
                        <span className="truncate">{staffMember.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail size={14} className="text-gray-400 flex-shrink-0" />
                        <span className="truncate">{staffMember.email}</span>
                      </div>
                      {staffMember.staffType && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User size={14} className="text-gray-400 flex-shrink-0" />
                          <span className="truncate">{staffMember.staffType}</span>
                        </div>
                      )}
                      {staffMember.joiningDate && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar size={14} className="text-gray-400 flex-shrink-0" />
                          <span>Joined: {new Date(staffMember.joiningDate).toLocaleDateString()}</span>
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
                itemLabel="staff"
              />
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <Briefcase size={48} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            {searchTerm ? 'No staff members match your search' : 'No staff members found for this hospital'}
          </p>
          <Button
            variant="primary"
            onClick={handleAddStaff}
            className="mt-4 flex items-center gap-2 mx-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Plus size={18} />
            Add Your First Staff Member
          </Button>
        </div>
      )}

      {showDetailsModal && selectedStaff && (
        <StaffDetails
          staff={selectedStaff}
          onClose={() => setShowDetailsModal(false)}
          onEdit={handleEditStaff}
        />
      )}

      <Modal 
        isOpen={showDeleteModal} 
        onClose={() => {
          setShowDeleteModal(false);
          setStaffToDelete(null);
        }} 
        title="Delete Staff Member" 
        size="sm"
      >
        <div className="p-4">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <Trash2 size={24} className="text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Deletion</h3>
            <p className="text-gray-500 mb-4">
              Are you sure you want to delete <span className="font-semibold text-gray-700">{staffToDelete?.name}</span>? 
              This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowDeleteModal(false);
                  setStaffToDelete(null);
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
                {isDeleting ? 'Deleting...' : 'Delete Staff'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default HospitalStaffList;