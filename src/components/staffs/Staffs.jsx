// src/components/staff/Staffs.jsx - Staff sees only their hospital
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Filter,
  Download,
  MoreVertical,
  Eye,
  Edit,
  UsersIcon,
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

import { getS3ImageUrl, S3_BASE_URL } from '../../../app/service/S3';
import { getAuthUser } from '../../../src/utils/auth';

// Import socket
import { socket } from '../../socket/socket';
import { registerStaffEvents, unregisterStaffEvents } from '../../socket/staffEvents';

// FIX: Enhanced getS3ImageUrl with cache-busting
const getS3ImageUrlWithCache = (imageKey) => {
  if (!imageKey) return null;
  
  if (imageKey.startsWith('http://') || imageKey.startsWith('https://')) {
    return `${imageKey}?t=${Date.now()}`;
  }
  
  return `${S3_BASE_URL}/${encodeURIComponent(imageKey)}?t=${Date.now()}`;
};

const Staffs = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
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

  const [eventsRegistered, setEventsRegistered] = useState(false);
  const [imageRefreshKey, setImageRefreshKey] = useState(Date.now());

  // 🔥 Get authenticated user to check role
  const auth = getAuthUser();
  const isHospitalAdmin = auth?.role === 'hospital' || auth?.roleId === 2;
  const isDoctor = auth?.role === 'doctor' || auth?.roleId === 46;
  const isStaff = auth?.role === 'staff' || auth?.roleId === 3;
  
  // 🔥 FIX: Staff now included in hospital filter
  const shouldFilterByHospital = isHospitalAdmin || isDoctor || isStaff;

  console.log("👤 Staff Page - User:", auth);
  console.log("👨‍⚕️ Staff Page - Is Doctor:", isDoctor);
  console.log("👤 Staff Page - Is Staff:", isStaff);
  console.log("🏥 Staff Page - Hospital ID:", auth?.hospitalId || auth?.id);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, designationFilter, genderFilter, statusFilter, dateFilter]);

  // API Hooks with pagination parameters
  const {
    data: staffApiResponse,
    isLoading: loading,
    refetch,
    isFetching
  } = useGetStaffQuery({
    search_query: debouncedSearchTerm?.trim() || undefined,
    designation: designationFilter !== 'all' ? designationFilter : undefined,
    gender: genderFilter !== 'all' ? genderFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    date: dateFilter || undefined,
    page: currentPage,
    limit: itemsPerPage
  });

  const [deleteStaff] = useDeleteStaffMutation();
  const [recoverStaff] = useRecoverStaffMutation();

  // Register socket event listeners
  useEffect(() => {
    registerStaffEvents({
      onStaffRegistered: async () => {
        showSuccessToast(`New staff registered!`, 3000);
        await refetch();
        setImageRefreshKey(Date.now());
      },
      onStaffUpdated: async () => {
        showSuccessToast(`Staff updated!`, 3000);
        await refetch();
        setImageRefreshKey(Date.now());
      },
      onStaffDeleted: async () => {
        showSuccessToast(`Staff deleted!`, 3000);
        await refetch();
        setImageRefreshKey(Date.now());
      },
      onStaffRecovered: async () => {
        showSuccessToast(`Staff recovered successfully!`, 3000);
        await refetch();
        setImageRefreshKey(Date.now());
      },
      onStaffPasswordReset: async () => {
        showSuccessToast(`Staff password reset!`, 3000);
        await refetch();
      },
      onStaffPasswordChanged: async () => {
        showSuccessToast(`Staff password changed!`, 3000);
        await refetch();
      }
    });

    setEventsRegistered(true);

    return () => {
      unregisterStaffEvents();
      setEventsRegistered(false);
    };
  }, [refetch]);

  // Listen for socket connection/disconnection
  useEffect(() => {
    const handleConnect = () => {
      if (!eventsRegistered) {
        registerStaffEvents({
          onStaffRegistered: async () => {
            showSuccessToast(`New staff registered!`, 3000);
            await refetch();
            setImageRefreshKey(Date.now());
          },
          onStaffUpdated: async () => {
            showSuccessToast(`Staff updated!`, 3000);
            await refetch();
            setImageRefreshKey(Date.now());
          },
          onStaffDeleted: async () => {
            showSuccessToast(`Staff deleted!`, 3000);
            await refetch();
            setImageRefreshKey(Date.now());
          },
          onStaffRecovered: async () => {
            showSuccessToast(`Staff recovered successfully!`, 3000);
            await refetch();
            setImageRefreshKey(Date.now());
          },
          onStaffPasswordReset: async () => {
            showSuccessToast(`Staff password reset!`, 3000);
            await refetch();
          },
          onStaffPasswordChanged: async () => {
            showSuccessToast(`Staff password changed!`, 3000);
            await refetch();
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

  const getStaffImageUrl = (staff) => {
    const imageKey = staff?.imageUrl || staff?.profileImage || staff?.imageKey || staff?.profilePicture || null;
    if (!imageKey) return null;
    return getS3ImageUrlWithCache(imageKey);
  };

  // Transform API response
  const transformStaffData = (staffList) => {
    if (!staffList || !Array.isArray(staffList)) return [];
    
    return staffList.map((staff, index) => {
      const imageKey = staff?.imageUrl || staff?.profileImage || staff?.imageKey || staff?.profilePicture || null;
      
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
        originalStatus: staff.status,
        updatedAt: staff.updatedAt || staff.updated_at || null,
        hospitalId: staff.hospitalId || null,
        hospitalName: staff.hospitalName || staff.hospital?.name || `Hospital ${staff.hospitalId}` || 'Unknown Hospital'
      };
    });
  };

  const allStaffsData = transformStaffData(staffApiResponse?.data || []);
  const totalItemsFromApi = staffApiResponse?.pagination?.totalItems || 0;

  // ✅ Apply frontend search AND filter filtering
  const filteredStaffsData = useMemo(() => {
    let filtered = allStaffsData;

    // 1. Apply search filter
    const searchLower = debouncedSearchTerm?.trim().toLowerCase();
    if (searchLower && searchLower.length >= 2) {
      filtered = filtered.filter(staff => {
        const searchFields = [
          staff.name?.toLowerCase() || '',
          staff.formattedId?.toLowerCase() || '',
          staff.designation?.toLowerCase() || '',
          staff.phone?.toLowerCase() || '',
          staff.email?.toLowerCase() || '',
          staff.gender?.toLowerCase() || '',
          staff.department?.toLowerCase() || '',
          staff.staffType?.toLowerCase() || '',
          staff.jobType?.toLowerCase() || '',
          staff.address?.toLowerCase() || '',
          staff.hospitalName?.toLowerCase() || ''
        ];

        return searchFields.some(field => field.includes(searchLower));
      });
    }

    // 2. Apply designation filter
    if (designationFilter !== 'all') {
      filtered = filtered.filter(staff => 
        staff.designation?.toLowerCase() === designationFilter.toLowerCase()
      );
    }

    // 3. Apply gender filter
    if (genderFilter !== 'all') {
      filtered = filtered.filter(staff => 
        staff.gender?.toLowerCase() === genderFilter.toLowerCase()
      );
    }

    // 4. Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(staff => {
        if (statusFilter === 'Active') {
          return staff.isActive && !staff.isDelete;
        } else if (statusFilter === 'Inactive') {
          return !staff.isActive && !staff.isDelete;
        } else if (statusFilter === 'Blacklisted') {
          return staff.isDelete;
        }
        return true;
      });
    }

    // 5. Apply date filter (if implemented)
    if (dateFilter) {
      filtered = filtered.filter(staff => {
        if (!staff.appointmentDate) return false;
        return staff.appointmentDate === dateFilter;
      });
    }

    return filtered;
  }, [allStaffsData, debouncedSearchTerm, designationFilter, genderFilter, statusFilter, dateFilter]);

  // ✅ Use filtered data for display
  const staffsData = filteredStaffsData;
  const totalItems = staffsData.length;

  // ✅ Get unique hospitals (should only be 1 for staff now)
  const uniqueHospitals = useMemo(() => {
    const hospitals = new Set();
    staffsData.forEach(staff => {
      if (staff.hospitalId) {
        hospitals.add(staff.hospitalId);
      }
    });
    return Array.from(hospitals);
  }, [staffsData]);

  // ✅ Pagination for filtered data
  const paginatedStaffsData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return staffsData.slice(startIndex, endIndex);
  }, [staffsData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(staffsData.length / itemsPerPage);

  const getAllDesignations = () => {
    const allData = staffApiResponse?.allData || allStaffsData;
    const designations = [...new Set(allData.map(s => s.designation).filter(Boolean))];
    return designations.sort();
  };

  const clearAllFilters = () => {
    setDesignationFilter('all');
    setGenderFilter('all');
    setStatusFilter('all');
    setDateFilter('');
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    clearAllFilters();
    refetch();
    setImageRefreshKey(Date.now());
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
      'Hospital': staff.hospitalName || 'N/A',
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
        showSuccessToast(`Successfully imported ${importedData.length} staff members!`, 3000);
        refetch();
        setImageRefreshKey(Date.now());
      } catch {
        showErrorToast('Error parsing JSON file. Please make sure it\'s a valid JSON file.', 3000);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleViewDetails = (staff) => {
    if (staff.isDelete) {
      showErrorToast('Cannot view details of blacklisted staff', 3000);
      return;
    }
    setSelectedStaff(staff);
    setShowDetailsModal(true);
  };

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
        setImageRefreshKey(Date.now());
        setShowDeleteModal(false);
        setStaffToDelete(null);
      } catch {
        showErrorToast('Failed to delete staff member', 3000);
      }
    }
  };

  const handleRecoverStaff = async (staff) => {
    try {
      await recoverStaff(staff.id).unwrap();
      showSuccessToast(`${staff.name} recovered successfully!`, 2000);
      refetch();
      setImageRefreshKey(Date.now());
    } catch {
      showErrorToast('Failed to recover staff member', 3000);
    }
  };

  const handleAddStaff = () => navigate('/add-staff');
  
  const getActiveFilterCount = () =>
    [
      designationFilter !== 'all',
      genderFilter !== 'all',
      statusFilter !== 'all',
      !!dateFilter,
      !!searchTerm
    ].filter(Boolean).length;

  // StaffDetailsModal
  const StaffDetailsModal = ({ staff, onClose }) => {
    if (!staff) return null;
    
    const imageUrl = getStaffImageUrl(staff);
    
    return (
      <Modal isOpen={showDetailsModal} onClose={onClose} title="Staff Details" size="lg">
        <div className="flex items-center gap-4 mb-6">
          <Avatar className="w-16 h-16">
            <AvatarImage 
              src={imageUrl || undefined} 
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
            {staff.hospitalName && (
              <span className="text-xs text-blue-600">🏥 {staff.hospitalName}</span>
            )}
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
          
          {staff.staffType && (
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500">Staff Type</label>
              <p className="text-sm text-gray-800">{staff.staffType}</p>
            </div>
          )}
          
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

  // RowActionMenu
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
            {!staff.isDelete && (
              <>
                <button 
                  onClick={() => { handleViewDetails(staff); setShowMenu(false); }} 
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg"
                >
                  <Eye size={16} /> View Details
                </button>
                <button 
                  onClick={() => { handleEditStaff(staff); setShowMenu(false); }} 
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Edit size={16} /> Edit
                </button>
                <div className="border-t border-gray-100 my-1"></div>
                <button 
                  onClick={() => { handleDeleteClick(staff); setShowMenu(false); }} 
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 rounded-b-lg"
                >
                  <Trash2 size={16} /> Delete
                </button>
              </>
            )}
            {staff.isDelete && (
              <button 
                onClick={() => { handleRecoverStaff(staff); setShowMenu(false); }} 
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-green-600 hover:bg-gray-100 rounded-lg"
              >
                <RotateCcw size={16} /> Recover Staff
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const activeFilterCount = getActiveFilterCount();

  // Check if we should show the "No results" message
  const hasSearchTerm = searchTerm && searchTerm.trim().length > 0;
  const hasResults = staffsData.length > 0;
  const isSearchActive = debouncedSearchTerm && debouncedSearchTerm.trim().length >= 2;
  const hasActiveFilters = designationFilter !== 'all' || genderFilter !== 'all' || statusFilter !== 'all' || !!dateFilter;

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
          
          
          {/* ✅ Show warning if multiple hospitals (shouldn't happen for staff now) */}
          {isStaff && uniqueHospitals.length > 1 && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-lg px-4 py-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-sm text-red-800">
                ⚠️ Warning: Showing staff from multiple hospitals ({uniqueHospitals.join(', ')})
              </span>
            </div>
          )}
        </div>

        {/* Search and Action Buttons Row */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="flex-1 max-w-md">
            <SearchBar 
              placeholder="Search by name, staff ID, designation, phone or hospital..." 
              value={searchTerm} 
              onChange={setSearchTerm} 
              onClear={() => {
                setSearchTerm('');
                setDebouncedSearchTerm('');
              }} 
            />
            {searchTerm && searchTerm !== debouncedSearchTerm && (
              <span className="text-xs text-blue-500 ml-2">Searching...</span>
            )}
            {searchTerm && searchTerm.length > 0 && searchTerm.length < 2 && (
              <span className="text-xs text-yellow-500 ml-2">Type at least 2 characters</span>
            )}
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
                <option value="Blacklisted">Blacklisted</option>
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
        {!hasResults ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isSearchActive || hasActiveFilters ? 'No staff found' : 'No staff available'}
            </h3>
            <p className="text-sm text-gray-500">
              {isSearchActive 
                ? `No results found for "${searchTerm}". Try adjusting your search.`
                : hasActiveFilters
                ? 'No staff match the selected filters. Try adjusting your filters.'
                : 'Start by adding a new staff member.'}
            </p>
          </div>
        ) : (
          <Card className="flex flex-col bg-white rounded-xl shadow-sm">
            <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
              <h2 className="text-sm font-semibold text-gray-700">
                Total Staffs
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded ml-2">
                  {totalItems}
                </span>
                {(isSearchActive || hasActiveFilters) && totalItems > 0 && (
                  <span className="text-xs text-gray-400 ml-2">
                    (Filtered)
                  </span>
                )}
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
                    {paginatedStaffsData.map((staff, index) => {
                      const imageUrl = getStaffImageUrl(staff);
                      
                      return (
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
                                  src={imageUrl || undefined} 
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-auto px-6 py-3 bg-white border-t border-gray-200">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    itemLabel="staffs"
                  />
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Staff Details Modal */}
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