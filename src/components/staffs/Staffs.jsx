// Staffs.jsx - Complete file with Deleted/Blacklisted Support and Recover Functionality
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Filter,
  Download,
  MoreVertical,
  Eye,
  Edit,
  Users as UsersIcon,
  RefreshCcw,
  Upload,
  Trash2,
  RotateCcw
} from 'lucide-react';

import {
  Button,
  Card,
  Badge,
  SearchBar,
  Modal,
  Pagination
} from '../ui';

import DeleteModal from '../patients/DeleteModel';

import {
  useGetStaffQuery,
  useDeleteStaffMutation,
  useRecoverStaffMutation
} from '../../../app/service/staffApi';

import {
  showSuccessToast,
  showErrorToast
} from '../ui/Toast';

import {
  Avatar,
  AvatarImage,
  AvatarFallback
} from "@/components/ui/avatar";

import { getS3ImageUrl } from '../../../app/service/S3';

// Import socket
import { socket } from '../../socket/socket';
import { registerStaffEvents, unregisterStaffEvents } from '../../socket/staffEvents';

const Staffs = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);
  
  const [designationFilter, setDesignationFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Track if showing deleted staff
  const [showDeleted, setShowDeleted] = useState(false);

  // Track if events are registered
  const [eventsRegistered, setEventsRegistered] = useState(false);

  // API Hooks with pagination parameters
  const {
    data: staffApiResponse,
    isLoading: loading,
    refetch,
    isFetching
  } = useGetStaffQuery({
    search_query: searchTerm?.trim() || undefined,
    designation: designationFilter !== 'all' ? designationFilter : undefined,
    gender: genderFilter !== 'all' ? genderFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    date: dateFilter || undefined,
    page: currentPage,
    limit: itemsPerPage,
    includeDeleted: showDeleted
  });

  const [deleteStaff] = useDeleteStaffMutation();
  const [recoverStaff] = useRecoverStaffMutation();

  // ✅ Register socket event listeners
  useEffect(() => {
    console.log("🔄 Registering staff event listeners...");
    console.log("📡 Socket connected:", socket.connected);
    
    registerStaffEvents({
      onStaffRegistered: async (data) => {
        console.log("👤 NEW STAFF REGISTERED:", data);
        showSuccessToast(`New staff registered!`, 3000);
        await refetch();
      },

      onStaffUpdated: async (data) => {
        console.log("✏️ STAFF UPDATED:", data);
        showSuccessToast(`Staff updated!`, 3000);
        await refetch();
      },

      onStaffDeleted: async (data) => {
        console.log("🗑️ STAFF DELETED:", data);
        showSuccessToast(`Staff deleted!`, 3000);
        await refetch();
      },

      // ✅ Handle STAFF_RECOVERED event
      onStaffRecovered: async (data) => {
        console.log("♻️ STAFF RECOVERED:", data);
        showSuccessToast(`Staff recovered successfully!`, 3000);
        await refetch();
      },

      onStaffPasswordReset: async (data) => {
        console.log("🔑 STAFF PASSWORD RESET:", data);
        showSuccessToast(`Staff password reset!`, 3000);
        await refetch();
      },

      onStaffPasswordChanged: async (data) => {
        console.log("🔐 STAFF PASSWORD CHANGED:", data);
        showSuccessToast(`Staff password changed!`, 3000);
        await refetch();
      }
    });

    setEventsRegistered(true);

    return () => {
      console.log("🧹 Unregistering staff events...");
      unregisterStaffEvents();
      setEventsRegistered(false);
    };
  }, [refetch]);

  // ✅ Listen for socket connection/disconnection
  useEffect(() => {
    const handleConnect = () => {
      console.log("✅ Socket CONNECTED - Staff events will work!");
      if (!eventsRegistered) {
        registerStaffEvents({
          onStaffRegistered: async (data) => {
            console.log("👤 NEW STAFF REGISTERED (reconnect):", data);
            showSuccessToast(`New staff registered!`, 3000);
            await refetch();
          },
          onStaffUpdated: async (data) => {
            console.log("✏️ STAFF UPDATED (reconnect):", data);
            showSuccessToast(`Staff updated!`, 3000);
            await refetch();
          },
          onStaffDeleted: async (data) => {
            console.log("🗑️ STAFF DELETED (reconnect):", data);
            showSuccessToast(`Staff deleted!`, 3000);
            await refetch();
          },
          // ✅ Handle STAFF_RECOVERED on reconnect
          onStaffRecovered: async (data) => {
            console.log("♻️ STAFF RECOVERED (reconnect):", data);
            showSuccessToast(`Staff recovered successfully!`, 3000);
            await refetch();
          },
          onStaffPasswordReset: async (data) => {
            console.log("🔑 STAFF PASSWORD RESET (reconnect):", data);
            showSuccessToast(`Staff password reset!`, 3000);
            await refetch();
          },
          onStaffPasswordChanged: async (data) => {
            console.log("🔐 STAFF PASSWORD CHANGED (reconnect):", data);
            showSuccessToast(`Staff password changed!`, 3000);
            await refetch();
          }
        });
        setEventsRegistered(true);
      }
    };

    const handleDisconnect = () => {
      console.log("❌ Socket DISCONNECTED - Staff events won't work!");
      setEventsRegistered(false);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [refetch, eventsRegistered]);

  // ✅ Log all socket events for debugging
  useEffect(() => {
    const handleAnyEvent = (event, ...args) => {
      console.log(`📡 ALL SOCKET EVENTS - STAFF: ${event}:`, args);
    };

    socket.onAny(handleAnyEvent);

    return () => {
      socket.offAny(handleAnyEvent);
    };
  }, []);

  // Helper function to format staff ID
  const formatStaffId = (id) => {
    if (!id) return '#SF0000';
    let numericId;
    if (typeof id === 'string') {
      const match = id.match(/\d+/);
      numericId = match ? parseInt(match[0]) : parseInt(id) || 0;
    } else {
      numericId = parseInt(id) || 0;
    }
    return `#SF${String(numericId).padStart(4, '0')}`;
  };

  // Transform API response to match the expected format
  const transformStaffData = (staffList) => {
    if (!staffList || !Array.isArray(staffList)) return [];
    
    return staffList.map((staff, index) => {
      console.log("STAFF DATA:", staff);
      
      const imageKey = staff.imageUrl || staff.profileImage || staff.imageKey || null;
      
      // Modified status logic
      let staffStatus = 'Inactive';
      
      if (staff.isDelete) {
        staffStatus = 'Blacklisted';
      } else if (staff.isActive) {
        staffStatus = 'Active';
      }
      
      return {
        id: staff.id,
        formattedId: formatStaffId(staff.id || index + 1),
        originalId: staff.id || staff._id,
        name: staff.name || '',
        firstName: staff.name?.split(' ')[0] || '',
        lastName: staff.name?.split(' ').slice(1).join(' ') || '',
        gender: staff.gender ? staff.gender.charAt(0).toUpperCase() + staff.gender.slice(1) : '',
        designation: staff.designation || '',
        phone: staff.phone || '',
        email: staff.email || '',
        appointmentDate: staff.createdAt?.split('T')[0] || staff.joiningDate || new Date().toISOString().split('T')[0],
        appointmentDateDisplay: staff.createdAt ? new Date(staff.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
        patientsCount: Math.floor(Math.random() * 200) + 10,
        imageKey: imageKey,
        profileImage: imageKey,
        imageUrl: imageKey,
        status: staffStatus,
        jobType: staff.jobType || '',
        dob: staff.dob ? new Date(staff.dob).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }) : '',
        address: staff.address ? `${staff.address.place || ''}, ${staff.address.district || ''}, ${staff.address.state || ''}` : '',
        joiningDate: staff.joiningDate ? new Date(staff.joiningDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
        department: staff.designation || '',
        staffType: staff.staffType || '',
        isActive: staff.isActive || false,
        isDelete: staff.isDelete || false,
        deleteDate: staff.deleteDate || null,
        originalStatus: staff.status
      };
    });
  };

  const staffsData = transformStaffData(staffApiResponse?.data || []);
  const totalItems = staffApiResponse?.pagination?.totalItems || 0;
  const totalPages = staffApiResponse?.pagination?.totalPages || 1;

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, designationFilter, genderFilter, statusFilter, dateFilter, showDeleted]);

  const getAllDesignations = () => {
    const allData = staffApiResponse?.allData || staffsData;
    const designations = [...new Set(allData.map(s => s.designation).filter(Boolean))];
    return designations.sort();
  };

  const clearAllFilters = () => {
    setDesignationFilter('all');
    setGenderFilter('all');
    setStatusFilter('all');
    setDateFilter('');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    clearAllFilters();
    refetch();
    showSuccessToast("Refreshed staff list", 2000);
  };

  const handleExport = () => {
    const exportData = staffsData.map(staff => ({
      'Staff ID': staff.formattedId,
      'Staff Name': staff.name,
      'Gender': staff.gender,
      'Designation': staff.designation,
      'Phone Number': staff.phone,
      'Email': staff.email,
      'Appointment Date': staff.appointmentDateDisplay,
      'Department': staff.department,
      'Status': staff.isDelete ? 'Blacklisted' : staff.status,
      'Joining Date': staff.joiningDate,
      'Delete Date': staff.deleteDate || 'N/A'
    }));
    
    const link = document.createElement('a');
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    link.href = URL.createObjectURL(blob);
    link.download = `staffs_export_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    showSuccessToast(`Exported ${exportData.length} staff records`, 2000);
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        showSuccessToast(`Successfully imported ${importedData.length} staff members! (Note: Import to API requires additional implementation)`, 3000);
        refetch();
      } catch (error) {
        showErrorToast('Error parsing JSON file. Please make sure it\'s a valid JSON file.', 3000);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // ✅ View Details - Only for Active/Inactive staff
  const handleViewDetails = (staff) => {
    if (staff.isDelete) {
      showErrorToast('Cannot view details of blacklisted staff', 3000);
      return;
    }
    setSelectedStaff(staff);
    setShowDetailsModal(true);
  };

  // ✅ Edit - Only for Active/Inactive staff
  const handleEditStaff = (staff) => {
    if (staff.isDelete) {
      showErrorToast('Cannot edit blacklisted staff', 3000);
      return;
    }
    const encodedId = encodeURIComponent(staff.id);
    navigate(`/edit-staff/${encodedId}`, { state: { staff } });
  };

  const handleDeleteClick = (staff) => {
    setStaffToDelete(staff);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (staffToDelete) {
      try {
        await deleteStaff(staffToDelete.id).unwrap();
        showSuccessToast(`${staffToDelete.name} has been deleted successfully!`, 2000);
        refetch();
        setShowDeleteModal(false);
        setStaffToDelete(null);
      } catch (error) {
        console.error('Delete error:', error);
        showErrorToast(error?.data?.message || 'Failed to delete staff member', 3000);
      }
    }
  };

  // ✅ Recover handler
  const handleRecoverStaff = async (staff) => {
    try {
      await recoverStaff(staff.id).unwrap();
      showSuccessToast(`${staff.name} recovered successfully!`, 2000);
      refetch();
    } catch (error) {
      console.error('Recover error:', error);
      showErrorToast(error?.data?.message || 'Failed to recover staff member', 3000);
    }
  };

  const handleAddStaff = () => navigate('/add-staff');
  
  const getActiveFilterCount = () =>
    [
      designationFilter !== 'all',
      genderFilter !== 'all',
      statusFilter !== 'all',
      !!dateFilter,
      !!searchTerm,
      showDeleted
    ].filter(Boolean).length;

  // ✅ StaffDetailsModal - Only shown for Active/Inactive staff
  const StaffDetailsModal = ({ staff, onClose }) => {
    if (!staff) return null;
    
    return (
      <Modal isOpen={showDetailsModal} onClose={onClose} title="Staff Details" size="lg">
        <div className="flex items-center gap-4 mb-6">
          <Avatar className="w-16 h-16">
            <AvatarImage 
              src={getS3ImageUrl(staff.imageUrl)} 
              alt={staff.name} 
            />
            <AvatarFallback className="text-xl font-medium">
              {staff.name?.charAt(0)?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-800 text-lg">{staff.name}</h3>
              <span className="text-xs text-gray-500">{staff.formattedId}</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500">Designation</label>
            <p className="text-sm text-gray-800">{staff.designation || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Department</label>
            <p className="text-sm text-gray-800">{staff.department || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Gender</label>
            <p className="text-sm text-gray-800">{staff.gender || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Phone</label>
            <p className="text-sm text-gray-800">{staff.phone || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Email</label>
            <p className="text-sm text-gray-800">{staff.email || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Joining Date</label>
            <p className="text-sm text-gray-800">{staff.joiningDate || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Date of Birth</label>
            <p className="text-sm text-gray-800">{staff.dob || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Status</label>
            <Badge
              variant={
                staff.isDelete
                  ? 'secondary'
                  : staff.isActive
                  ? 'success'
                  : 'danger'
              }
            >
              {staff.isDelete ? 'Blacklisted' : staff.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-500">Address</label>
            <p className="text-sm text-gray-800">{staff.address || 'N/A'}</p>
          </div>
          
          {/* Show Staff Type if available */}
          {staff.staffType && (
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500">Staff Type</label>
              <p className="text-sm text-gray-800">{staff.staffType}</p>
            </div>
          )}
          
          {/* Show Job Type if available */}
          {staff.jobType && (
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500">Job Type</label>
              <p className="text-sm text-gray-800">{staff.jobType}</p>
            </div>
          )}
        </div>
        
        <div className="flex gap-2 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose} fullWidth>Close</Button>
          <Button variant="primary" onClick={() => { handleEditStaff(staff); onClose(); }} fullWidth>
            Edit Staff
          </Button>
        </div>
      </Modal>
    );
  };

  // ✅ Updated RowActionMenu - View & Edit only for Active/Inactive, Recover for Blacklisted
  const RowActionMenu = ({ staff }) => {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);
    
    useEffect(() => {
      const handleClickOutside = (e) => {
        if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    
    return (
      <div className="relative inline-block" ref={menuRef}>
        <Button variant="ghost" size="sm" onClick={() => setShowMenu(prev => !prev)} className="p-2">
          <MoreVertical size={18} />
        </Button>
        {showMenu && (
          <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            {/* ✅ View Details - Only for Active/Inactive staff */}
            {!staff.isDelete && (
              <button 
                onClick={() => { handleViewDetails(staff); setShowMenu(false); }} 
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg"
              >
                <Eye size={16} /> View Details
              </button>
            )}
            
            {/* ✅ Edit - Only for Active/Inactive staff */}
            {!staff.isDelete && (
              <button 
                onClick={() => { handleEditStaff(staff); setShowMenu(false); }} 
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Edit size={16} /> Edit
              </button>
            )}
            
            {/* Show divider only if there are items above */}
            {!staff.isDelete && <div className="border-t border-gray-100 my-1"></div>}
            
            {/* ✅ Show Delete or Recover based on isDelete status */}
            {staff.isDelete ? (
              <button 
                onClick={() => { handleRecoverStaff(staff); setShowMenu(false); }} 
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-green-600 hover:bg-gray-100 rounded-lg"
              >
                <RotateCcw size={16} /> Recover Staff
              </button>
            ) : (
              <button 
                onClick={() => { handleDeleteClick(staff); setShowMenu(false); }} 
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 rounded-b-lg"
              >
                <Trash2 size={16} /> Delete
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const activeFilterCount = getActiveFilterCount();

  // Skeleton Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-6 font-sans">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-7 w-32 bg-gray-200 rounded animate-pulse mt-2"></div>
        </div>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="flex flex-1 gap-3 w-full lg:w-auto">
            <div className="h-10 w-64 bg-gray-200 rounded-md animate-pulse"></div>
            <div className="h-10 w-40 bg-gray-200 rounded-md animate-pulse"></div>
          </div>
          <div className="flex gap-2">
            <div className="w-10 h-10 bg-gray-200 rounded-md animate-pulse"></div>
            <div className="w-10 h-10 bg-gray-200 rounded-md animate-pulse"></div>
            <div className="w-10 h-10 bg-gray-200 rounded-md animate-pulse"></div>
            <div className="w-10 h-10 bg-gray-200 rounded-md animate-pulse"></div>
            <div className="w-28 h-10 bg-gray-200 rounded-md animate-pulse"></div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
            <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100">
                <tr>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <th key={i} className="px-6 py-3">
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#F8F9FA] p-6 font-sans">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="p-1">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Button>
            <div className="text-xs text-gray-500">
              <span className="text-gray-700">Staffs</span><span className="mx-1 text-gray-400">»</span>
              <span>Home</span><span className="mx-1 text-gray-400">»</span><span>Staffs</span>
            </div>
          </div>
          <h1 className="text-xl font-bold text-gray-800">Staffs</h1>
        </div>

        {/* Search and Action Buttons Row */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="flex-1 max-w-md">
            <SearchBar 
              placeholder="Search by name, staff ID, designation or phone..." 
              value={searchTerm} 
              onChange={setSearchTerm} 
              onClear={() => setSearchTerm('')} 
            />
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <Button variant="outline" size="sm" onClick={handleRefresh} title="Refresh" disabled={isFetching}>
              <RefreshCcw size={16} className={isFetching ? "animate-spin" : ""} />
            </Button>
            <input type="file" onChange={handleImport} accept=".json" className="hidden" id="import-file" />
            <label htmlFor="import-file" className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50 cursor-pointer" title="Import">
              <Upload size={16} />
            </label>
            <Button variant="outline" size="sm" onClick={handleExport} title="Export">
              <Download size={16} />
            </Button>
            
            <button
              onClick={() => setShowFilters(prev => !prev)}
              className={`relative p-2 border border-gray-200 rounded-md bg-white ${
                showFilters || activeFilterCount > 0 ? 'text-[#1C62A0]' : 'text-gray-500'
              } hover:bg-gray-50`}
              title="Toggle Filters"
            >
              <Filter size={16} />
              {activeFilterCount > 0 && !showFilters && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
            
            {/* ✅ Toggle Deleted Staff Button */}
            <Button
              variant={showDeleted ? "primary" : "outline"}
              size="sm"
              onClick={() => setShowDeleted(!showDeleted)}
              className="flex items-center gap-2"
            >
              <Trash2 size={16} />
              {showDeleted ? 'Show Active' : 'Show Deleted'}
            </Button>
            
            <Button onClick={handleAddStaff} className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <Plus size={16} /> New Staff
            </Button>
          </div>
        </div>

        {/* FILTER SECTION */}
        {showFilters && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center bg-gray-50">
                  <Filter size={18} className="text-[#1C62A0]" />
                </div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-semibold text-gray-800">Filters</h2>
                  {activeFilterCount > 0 && (
                    <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-md">
                      {activeFilterCount} Active Filter{activeFilterCount !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={clearAllFilters} className="text-sm font-medium text-red-500 hover:text-red-600">
                Clear All Filters
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <select
                value={designationFilter}
                onChange={(e) => setDesignationFilter(e.target.value)}
                className="h-12 px-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1C62A0] bg-white"
              >
                <option value="all">All Designations</option>
                {getAllDesignations().map((des) => (
                  <option key={des} value={des}>{des}</option>
                ))}
              </select>

              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="h-12 px-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1C62A0] bg-white"
              >
                <option value="all">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-12 px-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1C62A0] bg-white"
              >
                <option value="all">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>

              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="h-12 px-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1C62A0]"
              />
            </div>
          </div>
        )}

        {/* Staff Table */}
        {staffsData.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No staff found</h3>
            <p className="text-sm text-gray-500">
              {showDeleted ? "No deleted staff members found" : "Try adjusting your search or filters"}
            </p>
          </div>
        ) : (
          <Card className="flex flex-col bg-white rounded-xl shadow-sm">
            <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
              <h2 className="text-sm font-semibold text-gray-700">
                {showDeleted ? "Deleted Staffs" : "Total Staffs"}
                <span className={`text-white text-xs px-2 py-0.5 rounded ml-2 ${
                  showDeleted ? 'bg-gray-500' : 'bg-red-500'
                }`}>
                  {totalItems}
                </span>
              </h2>
            </div>
            
            <div className="flex flex-col min-h-[420px]">
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
                    <tr>
                      <th className="px-6 py-3">Staff ID</th>
                      <th className="px-6 py-3">Staff Name</th>
                      <th className="px-6 py-3">Gender</th>
                      <th className="px-6 py-3">Designation</th>
                      <th className="px-6 py-3">Phone Number</th>
                      <th className="px-6 py-3">Appointment Date</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffsData.map((staff, index) => (
                      <tr 
                        key={staff.id || index} 
                        className={`hover:bg-gray-50 border-b border-gray-100 ${
                          staff.isDelete ? 'bg-gray-50' : ''
                        }`}
                      >
                        <td className={`px-6 py-4 font-medium ${
                          staff.isDelete ? 'text-gray-500' : 'text-[#1C62A0]'
                        }`}>
                          {staff.formattedId}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage 
                                src={getS3ImageUrl(staff.imageUrl)} 
                                alt={staff.name} 
                              />
                              <AvatarFallback className={`text-sm font-medium ${
                                staff.isDelete ? 'bg-gray-200 text-gray-500' : ''
                              }`}>
                                {staff.name?.charAt(0)?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className={`font-medium ${
                              staff.isDelete ? 'text-gray-500' : 'text-gray-800'
                            }`}>
                              {staff.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{staff.gender || 'N/A'}</td>
                        <td className="px-6 py-4 text-gray-600">{staff.designation || 'N/A'}</td>
                        <td className="px-6 py-4 text-gray-600">{staff.phone || 'N/A'}</td>
                        <td className="px-6 py-4 text-gray-600">{staff.appointmentDateDisplay || 'N/A'}</td>
                        <td className="px-6 py-4">
                          <Badge
                            variant={
                              staff.isDelete
                                ? 'secondary'
                                : staff.isActive
                                ? 'success'
                                : 'danger'
                            }
                            className="text-xs"
                          >
                            {staff.isDelete
                              ? 'Blacklisted'
                              : staff.isActive
                              ? 'Active'
                              : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end">
                            <RowActionMenu staff={staff} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              <div className="mt-auto px-6 py-3 bg-white border-t border-gray-200">
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.max(1, totalPages)}
                  onPageChange={setCurrentPage}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  itemLabel="staffs"
                />
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Staff Details Modal - Only shown for Active/Inactive staff */}
      {showDetailsModal && selectedStaff && !selectedStaff.isDelete && (
        <StaffDetailsModal staff={selectedStaff} onClose={() => setShowDetailsModal(false)} />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteModal 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
        onConfirm={handleConfirmDelete} 
        title="Delete Staff Member" 
        message="Are you sure you want to delete this staff member? This action cannot be undone." 
        itemName={staffToDelete?.name} 
      />
    </>
  );
};

export default Staffs;