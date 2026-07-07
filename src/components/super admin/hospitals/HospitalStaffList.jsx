// src/components/super-admin/HospitalStaffList.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Search, Briefcase, Phone, Mail, MapPin, Loader2, 
  Calendar, User, Eye, MoreVertical, Edit, Trash2, Plus,
  Filter, X, RotateCcw
} from 'lucide-react';
import { Card, Button, Pagination, Modal, Badge } from '../../ui';
import { useGetStaffQuery, useDeleteStaffMutation, useRecoverStaffMutation } from '../../../../app/service/staffApi';
// ✅ Import StaffDetailsModal instead of StaffDetails page
import StaffDetailsModal from './staff/staffDetails';
import { showSuccessToast, showErrorToast } from '../../ui/Toast';
import { socket } from '../../../socket/socket';
import { registerStaffEvents, unregisterStaffEvents } from '../../../socket/staffEvents';
import { getHospitalId, isDoctor, isStaff, isHospitalAdmin } from '../../../utils/auth';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getS3ImageUrl } from '../../../../app/service/S3';

const HospitalStaffList = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const menuRef = useRef(null);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [designationFilter, setDesignationFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [eventsRegistered, setEventsRegistered] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);
  
  // Menu state
  const [activeMenu, setActiveMenu] = useState(null);

  // Auth
  const authHospitalId = getHospitalId();
  const isDoctorRole = isDoctor();
  const isStaffRole = isStaff();
  const isHospitalAdminRole = isHospitalAdmin();
  const canModifyStaff = isHospitalAdminRole || (!isDoctorRole && !isStaffRole);

  // Build query parameters
  const buildQueryParams = () => {
    const params = {
      hospitalId: id,
      page: currentPage,
      limit: itemsPerPage,
    };

    if (searchTerm && searchTerm.trim()) {
      params.search_query = searchTerm.trim();
    }

    if (genderFilter !== 'all') {
      params.gender = genderFilter;
    }
    if (designationFilter !== 'all') {
      params.designation = designationFilter;
    }
    if (statusFilter !== 'all') {
      params.status = statusFilter;
    }

    return params;
  };

  const { data: staffData, isLoading, refetch, isFetching } = useGetStaffQuery(
    buildQueryParams(),
    {
      skip: !id,
      refetchOnMountOrArgChange: true,
    }
  );

  const [deleteStaff, { isLoading: isDeleting }] = useDeleteStaffMutation();
  const [recoverStaff] = useRecoverStaffMutation();

  const allStaff = staffData?.data || [];
  console.log("staffData =", staffData);
console.log("allStaff =", allStaff);
console.log("isFetching =", isFetching);

  const totalItems = staffData?.pagination?.totalItems || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Get unique designations for filter
  const getAllDesignations = () => {
    const designations = [...new Set(allStaff.map(s => s.designation).filter(Boolean))];
    return designations.sort();
  };

  // Helper functions
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

  const formatStaffId = (id) => {
    if (!id) return '#SF0000';
    return `#SF${String(id).padStart(4, '0')}`;
  };

  // Navigation helpers
  const getBasePath = () => {
    if (window.location.pathname.includes('/super-admin')) {
      return '/super-admin';
    }
    return '';
  };

  // ✅ FIXED: Show Staff Details Modal instead of navigating
  const handleViewDetails = (staff) => {
    if (staff.isDelete) {
      showErrorToast("Cannot view details of deleted staff", 3000);
      return;
    }

    // Transform staff data for the modal
    const transformedStaff = {
      ...staff,
      id: staff.id || staff._id,
      formattedId: formatStaffId(staff.id || staff._id),
      address: formatAddress(staff.address),
      department: getStringValue(staff.department) || getStringValue(staff.designation),
      designation: getStringValue(staff.designation),
      staffType: getStringValue(staff.staffType),
      qualifications: getStringValue(staff.qualifications),
      experience: getStringValue(staff.experience),
      joiningDate: staff.joiningDate,
      dob: staff.dob,
      gender: getStringValue(staff.gender),
      phone: getStringValue(staff.phone),
      email: getStringValue(staff.email),
      name: getStringValue(staff.name),
      status: staff.isActive === true ? 'Active' : 'Inactive'
    };

    setSelectedStaff(transformedStaff);
    setShowDetailsModal(true);
  };

  // ✅ FIXED: Navigation to Add Staff - uses the correct route
  const handleAddStaff = () => {
    if (!canModifyStaff) {
      showErrorToast('You do not have permission to add staff', 3000);
      return;
    }
    
    const basePath = getBasePath();
    navigate(`${basePath}/staff/add`, {
      state: {
        hospitalId: id,
        returnPath: window.location.pathname
      }
    });
  };

  // ✅ FIXED: Navigation to Edit Staff - uses the correct route
  const handleEditStaff = (staff) => {
    if (!canModifyStaff) {
      showErrorToast('You do not have permission to edit staff', 3000);
      return;
    }
    if (staff.isDelete) {
      showErrorToast('Cannot edit deleted staff', 3000);
      return;
    }
    
    const staffId = staff.id;
    const basePath = getBasePath();
    
    // Close the details modal if open
    setShowDetailsModal(false);
    
    navigate(`${basePath}/staff/edit/${staffId}`, {
      state: {
        staff: staff,
        hospitalId: id,
        returnPath: window.location.pathname
      }
    });
    setActiveMenu(null);
  };

  const handleDeleteClick = (staff) => {
    if (!canModifyStaff) {
      showErrorToast('You do not have permission to delete staff', 3000);
      return;
    }
    if (staff.isDelete) {
      showErrorToast('Cannot delete already deleted staff', 3000);
      return;
    }
    setStaffToDelete(staff);
    setShowDeleteModal(true);
    setActiveMenu(null);
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

  const handleRecoverStaff = async (staff) => {
    if (!canModifyStaff) {
      showErrorToast('You do not have permission to recover staff', 3000);
      return;
    }
    try {
      await recoverStaff(staff.id).unwrap();
      showSuccessToast(`${staff.name} recovered successfully!`, 2000);
      refetch();
      setActiveMenu(null);
    } catch (error) {
      showErrorToast(error?.data?.message || 'Failed to recover staff', 3000);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setGenderFilter('all');
    setDesignationFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
  };

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

  // Reset page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, genderFilter, designationFilter, statusFilter]);

  // Handle click outside for menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = (staffId) => {
    setActiveMenu(activeMenu === staffId ? null : staffId);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (searchTerm && searchTerm.trim()) count++;
    if (genderFilter !== 'all') count++;
    if (designationFilter !== 'all') count++;
    if (statusFilter !== 'all') count++;
    return count;
  };

  // Row Action Menu
  const RowActionMenu = ({ staff }) => {
    const isDeleted = staff.isDelete || false;
    const staffId = staff.id;

    return (
      <div className="relative inline-block">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            if (!isDeleted) {
              toggleMenu(staffId);
            }
          }} 
          className={`p-1 rounded-full transition-colors ${isDeleted ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100'}`}
          disabled={isDeleted}
        >
          <MoreVertical size={16} className={isDeleted ? 'text-gray-300' : 'text-gray-500'} />
        </button>
        {activeMenu === staffId && !isDeleted && (
          <div 
            ref={menuRef}
            className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1"
          >
            <button
              onClick={() => { handleViewDetails(staff); setActiveMenu(null); }}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg"
            >
              <Eye size={14} /> View Details
            </button>
            {canModifyStaff && (
              <button
                onClick={() => { handleEditStaff(staff); setActiveMenu(null); }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Edit size={14} /> Edit
              </button>
            )}
            <div className="border-t border-gray-100 my-1"></div>
            {canModifyStaff && (
              <button
                onClick={() => { handleDeleteClick(staff); setActiveMenu(null); }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 rounded-b-lg"
              >
                <Trash2 size={14} /> Delete
              </button>
            )}
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
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
          <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} className="mr-1" /> Back to Hospital Details
          </Button>
          {canModifyStaff && (
            <Button
              onClick={handleAddStaff}
              className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Plus size={18} /> Add Staff
            </Button>
          )}
        </div>
        
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Staff List</h1>
            <p className="text-sm text-gray-500 mt-1">Total Staff: {totalItems}</p>
          </div>
          
          <Button
            variant="secondary"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 relative"
          >
            <Filter size={18} />
            Filters
            {getActiveFilterCount() > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#6366F1] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {getActiveFilterCount()}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search staff by name, designation, or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-transparent border border-gray-300 outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Active filter tags */}
      {getActiveFilterCount() > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {searchTerm && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
              Search: {searchTerm}
              <button onClick={() => setSearchTerm('')} className="hover:bg-blue-200 rounded-full p-0.5">
                <X size={14} />
              </button>
            </span>
          )}
          {genderFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
              Gender: {genderFilter}
              <button onClick={() => setGenderFilter('all')} className="hover:bg-blue-200 rounded-full p-0.5">
                <X size={14} />
              </button>
            </span>
          )}
          {designationFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
              Designation: {designationFilter}
              <button onClick={() => setDesignationFilter('all')} className="hover:bg-blue-200 rounded-full p-0.5">
                <X size={14} />
              </button>
            </span>
          )}
          {statusFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
              Status: {statusFilter}
              <button onClick={() => setStatusFilter('all')} className="hover:bg-blue-200 rounded-full p-0.5">
                <X size={14} />
              </button>
            </span>
          )}
          <button
            onClick={handleClearFilters}
            className="text-sm text-gray-500 hover:text-red-600 transition-colors"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Filters Section */}
      {showFilters && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Filters</h3>
            <button
              onClick={handleClearFilters}
              className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1"
            >
              <X size={14} /> Clear All
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Gender Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Gender</label>
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-transparent outline-none text-sm"
              >
                <option value="all">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Designation Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Designation</label>
              <select
                value={designationFilter}
                onChange={(e) => setDesignationFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-transparent outline-none text-sm"
              >
                <option value="all">All Designations</option>
                {getAllDesignations().map((des) => (
                  <option key={des} value={des}>{des}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-transparent outline-none text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Staff Grid */}
      {allStaff.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allStaff.map((staffMember) => {
              const isDeleted = staffMember.isDelete || false;
              const isInactive = !staffMember.isActive && !isDeleted;
              const isDisabled = isDeleted || isInactive;
              
              return (
                <Card 
                  key={staffMember.id} 
                  className={`p-4 transition-shadow ${
                    isDeleted 
                      ? 'bg-gray-50 border-gray-300 opacity-60' 
                      : isInactive
                      ? 'bg-gray-50 border-gray-200'
                      : 'hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className={`w-12 h-12 ${isDeleted ? 'opacity-60' : ''}`}>
                      <AvatarImage 
                        src={getS3ImageUrl(staffMember.imageKey || staffMember.profileImage)} 
                        alt={staffMember.name}
                        className="object-cover"
                      />
                      <AvatarFallback className={`${isDeleted ? 'bg-gray-300 text-gray-500' : 'bg-purple-100 text-purple-600'} text-base font-medium`}>
                        {staffMember.name?.charAt(0)?.toUpperCase() || 'S'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className={`font-semibold truncate ${isDeleted ? 'text-gray-500' : 'text-gray-900'}`}>
                            {staffMember.name}
                          </h3>
                          <p className="text-xs text-gray-500">ID: {formatStaffId(staffMember.id)}</p>
                          {isDeleted && (
                            <Badge variant="secondary" className="text-xs bg-red-100 text-red-700 mt-1">
                              Blacklisted
                            </Badge>
                          )}
                          {isInactive && (
                            <Badge variant="secondary" className="text-xs bg-gray-300 text-gray-600 mt-1">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <RowActionMenu staff={staffMember} />
                      </div>
                      
                      <div className="space-y-1 mt-2">
                        {staffMember.designation && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Briefcase size={14} className="text-gray-400 flex-shrink-0" />
                            <span className={`truncate ${isDisabled ? 'text-gray-400' : ''}`}>
                              {staffMember.designation}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone size={14} className="text-gray-400 flex-shrink-0" />
                          <span className={`truncate ${isDisabled ? 'text-gray-400' : ''}`}>
                            {staffMember.phone || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail size={14} className="text-gray-400 flex-shrink-0" />
                          <span className={`truncate ${isDisabled ? 'text-gray-400' : ''}`}>
                            {staffMember.email || 'N/A'}
                          </span>
                        </div>
                        {staffMember.staffType && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <User size={14} className="text-gray-400 flex-shrink-0" />
                            <span className={`truncate ${isDisabled ? 'text-gray-400' : ''}`}>
                              {staffMember.staffType}
                            </span>
                          </div>
                        )}
                        {staffMember.joiningDate && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar size={14} className="text-gray-400 flex-shrink-0" />
                            <span className={isDisabled ? 'text-gray-400' : ''}>
                              Joined: {new Date(staffMember.joiningDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>

                      {isDeleted && canModifyStaff && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <button 
                            onClick={() => handleRecoverStaff(staffMember)}
                            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                          >
                            <RotateCcw size={14} /> Recover Staff
                          </button>
                        </div>
                      )}
                      
                      {isInactive && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="w-full flex items-center justify-center px-3 py-1.5 bg-gray-100 text-gray-400 rounded-lg text-sm font-medium cursor-not-allowed">
                            Inactive Staff
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
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
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                itemLabel="staff"
              />
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Briefcase size={48} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            {getActiveFilterCount() > 0 ? 'No staff members match your filters' : 'No staff members found for this hospital'}
          </p>
          {getActiveFilterCount() > 0 && (
            <button
              onClick={handleClearFilters}
              className="mt-2 text-[#6366F1] hover:underline text-sm"
            >
              Clear all filters
            </button>
          )}
          {canModifyStaff && getActiveFilterCount() === 0 && (
            <Button
              onClick={handleAddStaff}
              className="mt-4 flex items-center gap-2 mx-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Plus size={18} /> Add Your First Staff Member
            </Button>
          )}
        </div>
      )}

      {/* Staff Details Modal */}
      {showDetailsModal && selectedStaff && (
        <StaffDetailsModal
          staff={selectedStaff}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedStaff(null);
          }}
          onEdit={handleEditStaff}
        />
      )}

      {/* Delete Modal */}
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