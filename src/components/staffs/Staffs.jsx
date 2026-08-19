// src/components/staff/Staffs.jsx - Staff sees only their hospital
import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
  RotateCcw,
  LayoutGrid,
  List,
  Calendar,
  Mail,
  Phone,
  MapPin
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
import PermissionDeniedModal from '../ui/PermissionDeniedModal'; // Import the PermissionDeniedModal

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

// Import the export function
import { exportToExcel } from "../../utils/excelExport";

// Import hasPermission for permission checks
import { hasPermission } from "../../utils/permission";

// Import socket
import { socket } from '../../socket/socket';
import { registerStaffEvents, unregisterStaffEvents } from '../../socket/staffEvents';

// Permission IDs for Staff module (9-12)
const PERMISSIONS = {
  CREATE: 9,
  VIEW: 10,
  EDIT: 11,
  DELETE: 12
};

// Helper function to get hospital ID
const getHospitalId = () => {
  const storedHospitalId = localStorage.getItem('hospitalId');
  if (storedHospitalId) {
    return storedHospitalId;
  }
  
  const authUser = getAuthUser();
  if (authUser?.hospitalId) {
    return authUser.hospitalId;
  }
  
  return null;
};

// Helper function to get auth ID
const getAuthId = () => {
  const authUser = getAuthUser();
  return authUser?.id || authUser?.userId || authUser?._id || null;
};

// FIX: Enhanced getS3ImageUrl with cache-busting
const getS3ImageUrlWithCache = (imageKey) => {
  if (!imageKey) return null;
  
  if (imageKey.startsWith('http://') || imageKey.startsWith('https://')) {
    return `${imageKey}?t=${Date.now()}`;
  }
  
  return `${S3_BASE_URL}/${encodeURIComponent(imageKey)}?t=${Date.now()}`;
};

// ✅ Staff Action Menu Component with Permission Checks
const StaffActionMenu = React.memo(({ staff, activeMenu, onView, onEdit, onDelete, onRecover }) => {
  if (activeMenu !== staff.id) return null;
  
  return (
    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1">
      {!staff.isDelete && (
        <button 
          onClick={() => onView(staff)} 
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <Eye className="w-4 h-4" />
          View Details
        </button>
      )}
      {!staff.isDelete && (
        <button 
          onClick={() => onEdit(staff)} 
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <Edit className="w-4 h-4" />
          Edit
        </button>
      )}
      {!staff.isDelete && <div className="border-t border-gray-100 my-1"></div>}
      
      {staff.isDelete ? (
        <button
          onClick={() => onRecover(staff)}
          className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-gray-50 flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Recover Staff
        </button>
      ) : (
        <button 
          onClick={() => onDelete(staff)} 
          className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50 flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      )}
    </div>
  );
});

// ✅ Skeleton Loader Component
const StaffSkeletonLoader = ({ viewMode = 'grid', itemsPerPage = 10 }) => {
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-100 p-5 relative flex flex-col items-center shadow-sm">
            <div className="w-full flex justify-between items-start mb-4">
              <div className="h-5 w-16 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-7 h-7 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
            <div className="relative mb-3">
              <div className="w-16 h-16 rounded-full bg-gray-200 animate-pulse"></div>
            </div>
            <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="grid grid-cols-2 gap-4 w-full border-t border-gray-50 pt-4 mb-4">
              <div className="text-center">
                <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mx-auto mb-1"></div>
                <div className="h-4 w-12 bg-gray-200 rounded animate-pulse mx-auto"></div>
              </div>
              <div className="text-center">
                <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mx-auto mb-1"></div>
                <div className="h-4 w-12 bg-gray-200 rounded animate-pulse mx-auto"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
        <div className="h-5 w-40 bg-gray-200 rounded animate-pulse"></div>
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
            {[...Array(itemsPerPage)].map((_, i) => (
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
  );
};

const Staffs = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [viewMode, setViewMode] = useState(() => {
    // Load view mode from localStorage
    return localStorage.getItem('staffViewMode') || 'grid';
  });
  
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
  const [activeMenu, setActiveMenu] = useState(null);

  // Permission Denied Modal state
  const [showPermissionDeniedModal, setShowPermissionDeniedModal] = useState(false);
  const [permissionDeniedAction, setPermissionDeniedAction] = useState('');

  // Get authenticated user
  const auth = getAuthUser();
  
  // Get hospital ID using helper
  const hospitalId = getHospitalId();
  const authId = getAuthId();

  // Save view mode to localStorage
  useEffect(() => {
    localStorage.setItem('staffViewMode', viewMode);
  }, [viewMode]);


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

  // Handle click outside for menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeMenu !== null && !event.target.closest('.menu-container')) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeMenu]);

  // Build query params with hospital filter
  const queryParams = {
    search_query: debouncedSearchTerm?.trim() || undefined,
    designation: designationFilter !== 'all' ? designationFilter : undefined,
    gender: genderFilter !== 'all' ? genderFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    date: dateFilter || undefined,
    page: currentPage,
    limit: itemsPerPage
  };

  // Always filter by hospital for all users
  if (hospitalId) {
    queryParams.hospitalId = String(hospitalId);
  } else {
    console.warn('⚠️ No hospitalId found for filtering');
  }

  // API Hooks with pagination parameters
  const {
    data: staffApiResponse,
    isLoading: loading,
    refetch,
    isFetching
  } = useGetStaffQuery(queryParams);

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

  // Apply frontend search AND filter filtering
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

  // ✅ FIXED: Use filtered data for display
  const staffsData = filteredStaffsData;
  
  // ✅ FIXED: Use API response pagination for total items and pages
  const totalItems = staffApiResponse?.pagination?.totalItems || 0;
  const totalPages = staffApiResponse?.pagination?.totalPages || Math.ceil(totalItems / itemsPerPage);

  // Get unique hospitals
  const uniqueHospitals = useMemo(() => {
    const hospitals = new Set();
    staffsData.forEach(staff => {
      if (staff.hospitalId) {
        hospitals.add(staff.hospitalId);
      }
    });
    return Array.from(hospitals);
  }, [staffsData]);

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

  // Updated Export handler with Excel functionality
  const handleExport = () => {
    if (staffsData.length === 0) {
      showErrorToast("No data available to export", 3000);
      return;
    }

    try {
      // Transform data for Excel export
      const exportData = staffsData.map(staff => ({
        'Staff ID': staff.formattedId,
        'Staff Name': staff.name,
        'Gender': staff.gender || 'N/A',
        'Designation': staff.designation || 'N/A',
        'Phone Number': staff.phone || 'N/A',
        'Email': staff.email || 'N/A',
        'Hospital': staff.hospitalName || 'N/A',
        'Appointment Date': staff.appointmentDateDisplay || 'N/A',
        'Department': staff.department || 'N/A',
        'Status': staff.isDelete ? 'Blacklisted' : staff.status || 'Active',
        'Joining Date': staff.joiningDate || 'N/A',
        'Date of Birth': staff.dob || 'N/A',
        'Address': staff.address || 'N/A'
      }));

      // Generate filename with date
      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `staffs_export_${dateStr}`;

      // Export to Excel with column width
      exportToExcel({
        data: exportData,
        fileName: fileName,
        sheetName: "Staff",
        columnWidth: 20
      });

      showSuccessToast(
        `Successfully exported ${exportData.length} staff records to Excel!`,
        3000
      );
    } catch (error) {
      console.error("Export error:", error);
      showErrorToast("Failed to export data. Please try again.", 3000);
    }
  };

  // Permission check helper with modal
  const checkPermission = (permissionId, actionName) => {
    if (!hasPermission(permissionId)) {
      setPermissionDeniedAction(actionName);
      setShowPermissionDeniedModal(true);
      return false;
    }
    return true;
  };

  const handleViewDetails = (staff) => {
    // Check VIEW permission
    if (!checkPermission(PERMISSIONS.VIEW, 'view staff details')) {
      return;
    }
    
    if (staff.isDelete) {
      showErrorToast('Cannot view details of blacklisted staff', 3000);
      return;
    }
    setSelectedStaff(staff);
    setShowDetailsModal(true);
    setActiveMenu(null);
  };

  const handleEditStaff = (staff) => {
    // Check EDIT permission
    if (!checkPermission(PERMISSIONS.EDIT, 'edit staff')) {
      return;
    }
    
    if (staff.isDelete) {
      showErrorToast('Cannot edit blacklisted staff', 3000);
      return;
    }
    const encodedId = encodeURIComponent(staff.id);
    navigate(`/edit-staff/${encodedId}`, { state: { staff } });
    setActiveMenu(null);
  };

  const handleDeleteClick = (staff) => {
    // Check DELETE permission
    if (!checkPermission(PERMISSIONS.DELETE, 'delete staff')) {
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
      setActiveMenu(null);
    } catch {
      showErrorToast('Failed to recover staff member', 3000);
    }
  };

  const handleAddStaff = () => {
    // Check CREATE permission
    if (!checkPermission(PERMISSIONS.CREATE, 'create staff')) {
      return;
    }
    navigate('/add-staff');
  };
  
  const getActiveFilterCount = () =>
    [
      designationFilter !== 'all',
      genderFilter !== 'all',
      statusFilter !== 'all',
      !!dateFilter,
      !!searchTerm
    ].filter(Boolean).length;

  const toggleMenu = useCallback((id, e) => {
    e.stopPropagation();
    setActiveMenu(prevActive => prevActive === id ? null : id);
  }, []);

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

  const activeFilterCount = getActiveFilterCount();

  // Check if we should show the "No results" message
  const hasSearchTerm = searchTerm && searchTerm.trim().length > 0;
  const hasResults = staffsData.length > 0;
  const isSearchActive = debouncedSearchTerm && debouncedSearchTerm.trim().length >= 2;
  const hasActiveFilters = designationFilter !== 'all' || genderFilter !== 'all' || statusFilter !== 'all' || !!dateFilter;

  // Skeleton Loading State
  if (loading) {
    return <StaffSkeletonLoader viewMode={viewMode} itemsPerPage={itemsPerPage} />;
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
          
          {/* Show warning if multiple hospitals */}
          {uniqueHospitals.length > 1 && (
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
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            {/* View Mode Toggle */}
            <div className="flex border border-gray-200 rounded-md bg-white mr-2">
              <button 
                onClick={() => setViewMode('grid')} 
                className={`p-2 rounded-l-md transition-colors ${viewMode === 'grid' ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white' : 'text-gray-400 hover:bg-gray-50'}`}
                aria-label="Grid view"
              >
                <LayoutGrid size={16} />
              </button>
              <button 
                onClick={() => setViewMode('list')} 
                className={`p-2 rounded-r-md transition-colors ${viewMode === 'list' ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white' : 'text-gray-400 hover:bg-gray-50'}`}
                aria-label="List view"
              >
                <List size={16} />
              </button>
            </div>

            <Button variant="outline" size="sm" onClick={handleRefresh} title="Refresh" disabled={isFetching}>
              <RefreshCcw size={16} className={isFetching ? "animate-spin" : ""} />
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} title="Export to Excel">
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
            
            {/* New Staff Button with Permission Check */}
            <Button 
              onClick={handleAddStaff} 
              className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
            >
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

        {/* Empty State */}
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
            {(isSearchActive || hasActiveFilters) && (
              <button 
                onClick={clearAllFilters}
                className="mt-4 text-sm text-[#1C62A0] hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* ✅ GRID VIEW - Pagination conditional (matching Doctors.jsx) */
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {staffsData.map((staff) => {
                const isBlacklisted = staff.isDelete;
                const imageUrl = getStaffImageUrl(staff);
                
                return (
                  <div 
                    key={staff.id} 
                    className={`bg-white rounded-lg border border-gray-100 p-5 relative flex flex-col items-center shadow-sm hover:shadow-md transition-shadow ${
                      isBlacklisted ? 'opacity-75' : ''
                    }`}
                  >
                    <div className="w-full flex justify-between items-start mb-4">
                      <Badge variant="info" className="text-[10px]">
                        {staff.formattedId}
                      </Badge>
                      <div className="relative menu-container">
                        <button 
                          onClick={(e) => toggleMenu(staff.id, e)} 
                          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 text-xl font-bold transition-colors"
                          aria-label="Actions menu"
                        >
                          ⋮
                        </button>
                        <StaffActionMenu
                          staff={staff}
                          activeMenu={activeMenu}
                          onView={handleViewDetails}
                          onEdit={handleEditStaff}
                          onDelete={handleDeleteClick}
                          onRecover={handleRecoverStaff}
                        />
                      </div>
                    </div>
                    
                    <div className="relative mb-3">
                      <Avatar className="w-16 h-16">
                        <AvatarImage 
                          src={imageUrl || undefined} 
                          alt={staff.name} 
                        />
                        <AvatarFallback className={`text-sm font-medium ${
                          isBlacklisted ? 'bg-gray-200 text-gray-500' : ''
                        }`}>
                          {staff.name?.charAt(0)?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`absolute bottom-0.5 right-0.5 w-3 h-3 border-2 border-white rounded-full ${
                          isBlacklisted
                            ? "bg-black"
                            : staff.isActive
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      />
                    </div>
                    
                    <h3 
                      onClick={() => {
                        // Check VIEW permission before opening details
                        if (!checkPermission(PERMISSIONS.VIEW, 'view staff details')) {
                          return;
                        }
                        if (!isBlacklisted) {
                          handleViewDetails(staff);
                        }
                      }} 
                      className={`text-[14px] font-bold text-gray-800 ${!isBlacklisted ? 'cursor-pointer hover:text-[#1C62A0] transition-colors' : ''}`}
                    >
                      {staff.name}
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      {staff.designation || 'N/A'}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 w-full border-t border-gray-50 pt-4 mt-4">
                      <div className="text-center">
                        <p className="text-[9px] text-gray-400 uppercase font-bold">Gender</p>
                        <p className="text-xs font-bold text-gray-700">
                          {staff.gender || 'N/A'}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] text-gray-400 uppercase font-bold">Status</p>
                        <Badge
                          variant={
                            isBlacklisted
                              ? "secondary"
                              : staff.isActive
                              ? "success"
                              : "danger"
                          }
                          className="text-[10px]"
                        >
                          {isBlacklisted ? 'Blacklisted' : staff.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>

                    {/* Recover button for blacklisted staff (matching Doctors.jsx) */}
                    {isBlacklisted && (
                      <button 
                        onClick={() => {
                          // Check DELETE permission for recover
                          if (!checkPermission(PERMISSIONS.DELETE, 'recover staff')) {
                            return;
                          }
                          handleRecoverStaff(staff);
                        }} 
                        className="w-full py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center gap-2 mt-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Recover
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ✅ Pagination for Grid View - Conditional (matching Doctors.jsx) */}
            {totalPages > 1 && (
              <div className="mt-6 flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  itemLabel="staffs"
                  variant="centered"
                />
              </div>
            )}
          </>
        ) : (
          /* ✅ LIST VIEW - Pagination always visible (like Ambulance) */
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
                    {staffsData.map((staff) => {
                      const imageUrl = getStaffImageUrl(staff);
                      const isBlacklisted = staff.isDelete;
                      
                      return (
                        <tr 
                          key={staff.id} 
                          className={`hover:bg-gray-50 border-b border-gray-100 ${
                            isBlacklisted ? 'bg-gray-50' : ''
                          }`}
                        >
                          <td className={`px-6 py-4 font-medium ${
                            isBlacklisted ? 'text-gray-500' : 'text-[#1C62A0]'
                          }`}>
                            {staff.formattedId}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarImage 
                                  src={imageUrl || undefined} 
                                  alt={staff.name} 
                                />
                                <AvatarFallback className={`text-sm font-medium ${
                                  isBlacklisted ? 'bg-gray-200 text-gray-500' : ''
                                }`}>
                                  {staff.name?.charAt(0)?.toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span 
                                onClick={() => {
                                  // Check VIEW permission before opening details
                                  if (!checkPermission(PERMISSIONS.VIEW, 'view staff details')) {
                                    return;
                                  }
                                  if (!isBlacklisted) {
                                    handleViewDetails(staff);
                                  }
                                }}
                                className={`font-medium ${!isBlacklisted ? 'cursor-pointer hover:text-[#1C62A0] transition-colors' : ''} ${
                                  isBlacklisted ? 'text-gray-500' : 'text-gray-800'
                                }`}
                              >
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
                                isBlacklisted
                                  ? 'secondary'
                                  : staff.isActive
                                  ? 'success'
                                  : 'danger'
                              }
                              className="text-xs"
                            >
                              {isBlacklisted
                                ? 'Blacklisted'
                                : staff.isActive
                                ? 'Active'
                                : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right relative menu-container">
                            <div className="flex justify-end">
                              <button 
                                onClick={(e) => toggleMenu(staff.id, e)} 
                                className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 text-xl font-bold transition-colors"
                                aria-label="Actions menu"
                              >
                                ⋮
                              </button>
                              <StaffActionMenu
                                staff={staff}
                                activeMenu={activeMenu}
                                onView={handleViewDetails}
                                onEdit={handleEditStaff}
                                onDelete={handleDeleteClick}
                                onRecover={handleRecoverStaff}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* ✅ Pagination - ALWAYS VISIBLE (like Ambulance) */}
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

      {/* Permission Denied Modal */}
      <PermissionDeniedModal
        isOpen={showPermissionDeniedModal}
        onClose={() => setShowPermissionDeniedModal(false)}
        action={permissionDeniedAction}
        permissionId={PERMISSIONS.VIEW} // Pass a default permission ID or make it dynamic
      />
    </>
  );
};

export default Staffs;