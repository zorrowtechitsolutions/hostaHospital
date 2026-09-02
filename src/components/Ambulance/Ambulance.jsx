import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus,
  Download,
  Eye,
  Edit,
  LayoutGrid,
  List,
  RefreshCcw,
  Trash2,
  MapPin,
  Truck
} from 'lucide-react';
import DeleteModal from '../patients/DeleteModel';
import AddAmbulanceModal from './AddAmbulanceModal';
import EditAmbulanceModal from './EditAmbulanceModal';
import ViewAmbulanceModal from './ViewAmbulanceModal';
import PermissionDeniedModal from '../ui/PermissionDeniedModal';
import { 
  Badge, 
  Pagination,
  SearchBar
} from '../ui';
import { 
  useGetAmbulanceQuery,
  useCreateAmbulanceMutation,
  useUpdateAmbulanceMutation,
  useDeleteAmbulanceMutation
} from '../../../app/service/ambulance';
import { showSuccessToast, showErrorToast } from '../ui/Toast';
import { exportToExcel } from "../../utils/excelExport";
import { hasPermission } from "../../utils/permission";
import { socket } from '../../socket/socket';
import { registerAmbulanceEvents, unregisterAmbulanceEvents } from '../../socket/ambulanceEvents';

const ambulanceTypes = [
  "Basic Life Support (BLS)",
  "Advanced Life Support (ALS)",
  "Patient Transport Ambulance",
  "ICU Ambulance",
  "Neonatal Ambulance",
  "Air Ambulance",
  "Mortuary Ambulance",
  "Motorcycle Ambulance",
  "Boat Ambulance",
  "Emergency Response Vehicle"
];

// Permission IDs for Ambulance module (29-32)
const PERMISSIONS = {
  CREATE: 29,
  VIEW: 30,
  EDIT: 31,
  DELETE: 32
};

// Skeleton Loading Component
const AmbulanceSkeleton = () => {
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
          <div className="h-10 w-56 bg-gray-200 rounded-md animate-pulse"></div>
        </div>
        <div className="flex gap-2">
          <div className="w-10 h-10 bg-gray-200 rounded-md animate-pulse"></div>
          <div className="w-10 h-10 bg-gray-200 rounded-md animate-pulse"></div>
          <div className="w-10 h-10 bg-gray-200 rounded-md animate-pulse"></div>
          <div className="w-28 h-10 bg-gray-200 rounded-md animate-pulse"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
            <div className="flex justify-between mb-6">
              <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
              <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-gray-200 mb-4"></div>
              <div className="w-32 h-4 bg-gray-200 rounded mb-2"></div>
              <div className="w-24 h-3 bg-gray-200 rounded mb-6"></div>
              <div className="grid grid-cols-2 gap-4 w-full border-t border-gray-100 pt-4">
                <div className="text-center">
                  <div className="w-12 h-3 bg-gray-200 rounded mx-auto mb-2"></div>
                  <div className="w-20 h-4 bg-gray-200 rounded mx-auto"></div>
                </div>
                <div className="text-center">
                  <div className="w-12 h-3 bg-gray-200 rounded mx-auto mb-2"></div>
                  <div className="w-16 h-4 bg-gray-200 rounded mx-auto"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Ambulance = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); 
  const [typeFilter, setTypeFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('');
  
  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPermissionDeniedModal, setShowPermissionDeniedModal] = useState(false);
  const [permissionDeniedMessage, setPermissionDeniedMessage] = useState('');
  const [selectedAmbulance, setSelectedAmbulance] = useState(null);
  
  // Menu state for grid view
  const [activeMenu, setActiveMenu] = useState(null);
  
  // Pagination state - server-side
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Save view mode to localStorage
  useEffect(() => {
    localStorage.setItem('ambulanceViewMode', viewMode);
  }, [viewMode]);

  // Helper function to format ambulance ID for display only
  const formatAmbulanceId = (id) => {
    if (!id) return '#AMB0000';
    const numericId = parseInt(id) || 0;
    return `#AMB${String(numericId).padStart(4, '0')}`;
  };

  // API Hooks - Passing pagination and filter parameters
  const { 
    data: ambulancesResponse, 
    isLoading: loading, 
    refetch,
    isFetching
  } = useGetAmbulanceQuery({
    page: currentPage,
    limit: itemsPerPage,
    search_query: searchTerm?.trim() || undefined,
    vehicleType: typeFilter !== 'all' ? typeFilter : undefined,
    country: countryFilter || undefined,
  });
  
  const [createAmbulance] = useCreateAmbulanceMutation();
  const [updateAmbulance] = useUpdateAmbulanceMutation();
  const [deleteAmbulance] = useDeleteAmbulanceMutation();

  // Register socket event listeners
  useEffect(() => {
    registerAmbulanceEvents({
      onRegistered: async (data) => {
        showSuccessToast(`New ambulance registered!`, 3000);
        await refetch();
      },
      onUpdated: async (data) => {
        showSuccessToast(`Ambulance updated!`, 3000);
        await refetch();
      },
      onDeleted: async (data) => {
        showSuccessToast(`Ambulance deleted!`, 3000);
        await refetch();
      }
    });

    return () => {
      unregisterAmbulanceEvents();
    };
  }, [refetch]);

  // Listen for socket connection/disconnection
  useEffect(() => {
    const handleConnect = () => {
      registerAmbulanceEvents({
        onRegistered: async (data) => {
          showSuccessToast(`New ambulance registered!`, 3000);
          await refetch();
        },
        onUpdated: async (data) => {
          showSuccessToast(`Ambulance updated!`, 3000);
          await refetch();
        },
        onDeleted: async (data) => {
          showSuccessToast(`Ambulance deleted!`, 3000);
          await refetch();
        }
      });
    };

    const handleDisconnect = () => {};

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [refetch]);

  // Transform API response - SEPARATE display ID from database ID
  const transformAmbulanceData = (ambulanceList) => {
    if (!ambulanceList || !Array.isArray(ambulanceList)) return [];
    
    return ambulanceList.map((ambulance, index) => ({
      id: ambulance.id,
      formattedId: formatAmbulanceId(ambulance.id || index + 1),
      serviceName: ambulance.serviceName || '',
      phone: ambulance.phone || '',
      vehicleType: ambulance.vehicleType || '',
      address: ambulance.address || {},
      hospitalId: ambulance.hospitalId,
      createdAt: ambulance.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
      lastUpdated: ambulance.updatedAt?.split('T')[0] || new Date().toISOString().split('T')[0]
    }));
  };

  // No client-side filtering - use data directly from API
  const ambulancesData = transformAmbulanceData(ambulancesResponse?.data || []);
  
  // Get pagination from API response
  const totalItems = ambulancesResponse?.pagination?.totalItems || 0;
  const totalPages = ambulancesResponse?.pagination?.totalPages || 1;

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, countryFilter]);

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

  // Search handler - receives value directly from SearchBar
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Clear search handler
  const handleClearSearch = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  // ============================================================
  // ✅ FIXED: handleAddAmbulance - Now throws errors to modal
  // ============================================================
  const handleAddAmbulance = async (newAmbulance) => {
    // Check permission before adding
    if (!hasPermission(PERMISSIONS.CREATE)) {
      setPermissionDeniedMessage("You do not have permission to create an ambulance. Please contact your administrator.");
      setShowPermissionDeniedModal(true);
      // Throw error so modal knows something went wrong
      throw new Error("Permission denied");
    }

    try {
      const ambulanceToAdd = {
        serviceName: newAmbulance.serviceName,
        phone: newAmbulance.phone,
        vehicleType: newAmbulance.vehicleType,
        address: newAmbulance.address
      };
      
      await createAmbulance(ambulanceToAdd).unwrap();
      
      showSuccessToast(`${newAmbulance.serviceName} has been added successfully!`, 3000);
      await refetch();
      setShowAddModal(false);
    } catch (error) {
      console.error('Add ambulance error:', error);
      // ✅ IMPORTANT: Re-throw the error so the modal can handle it
      throw error;
    }
  };

  // ============================================================
  // ✅ FIXED: handleEditAmbulance - Now throws errors to modal
  // ============================================================
  const handleEditAmbulance = async (updatedAmbulance) => {
    // Check permission before editing
    if (!hasPermission(PERMISSIONS.EDIT)) {
      setPermissionDeniedMessage("You do not have permission to edit an ambulance. Please contact your administrator.");
      setShowPermissionDeniedModal(true);
      // Throw error so modal knows something went wrong
      throw new Error("Permission denied");
    }

    try {
      const updateData = {
        serviceName: updatedAmbulance.serviceName,
        phone: updatedAmbulance.phone,
        vehicleType: updatedAmbulance.vehicleType,
        address: updatedAmbulance.address
      };
      
      await updateAmbulance({ 
        id: updatedAmbulance.id, 
        data: updateData 
      }).unwrap();
      
      showSuccessToast(`${updatedAmbulance.serviceName} has been updated successfully!`, 3000);
      await refetch();
      setShowEditModal(false);
      setSelectedAmbulance(null);
    } catch (error) {
      console.error('Edit ambulance error:', error);
      // ✅ IMPORTANT: Re-throw the error so the modal can handle it
      throw error;
    }
  };

  const handleDeleteAmbulance = async () => {
    // Check permission before deleting
    if (!hasPermission(PERMISSIONS.DELETE)) {
      setPermissionDeniedMessage("You do not have permission to delete an ambulance. Please contact your administrator.");
      setShowPermissionDeniedModal(true);
      return;
    }

    if (selectedAmbulance) {
      try {
        await deleteAmbulance(selectedAmbulance.id).unwrap();
        
        showSuccessToast(`${selectedAmbulance.serviceName} has been deleted successfully!`, 3000);
        await refetch();
        setShowDeleteModal(false);
        setSelectedAmbulance(null);
      } catch (error) {
        showErrorToast(error?.data?.message || 'Failed to delete ambulance', 3000);
      }
    }
  };

  // Menu handlers
  const toggleMenu = (id, e) => {
    e.stopPropagation();
    setActiveMenu(activeMenu === id ? null : id);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleRefresh = () => {
    setSearchTerm("");
    setTypeFilter("all");
    setCountryFilter("");
    setCurrentPage(1);
    refetch();
    showSuccessToast("Refreshed ambulance list", 2000);
  };

  // Updated Export handler with Excel functionality
  const handleExport = () => {
    if (ambulancesData.length === 0) {
      showErrorToast("No data available to export", 3000);
      return;
    }

    try {
      // Transform data for Excel export
      const exportData = ambulancesData.map(amb => ({
        'Ambulance ID': amb.formattedId,
        'Service Name': amb.serviceName,
        'Vehicle Type': amb.vehicleType,
        'Phone': amb.phone,
        'Country': amb.address?.country || 'N/A',
        'State': amb.address?.state || 'N/A',
        'District': amb.address?.district || 'N/A',
        'Place': amb.address?.place || 'N/A',
        'Pincode': amb.address?.pincode || 'N/A',
        'Created Date': amb.createdAt,
        'Last Updated': amb.lastUpdated
      }));

      // Generate filename with date
      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `ambulances_export_${dateStr}`;

      // Export to Excel with column width
      exportToExcel({
        data: exportData,
        fileName: fileName,
        sheetName: "Ambulances",
        columnWidth: 18
      });

      showSuccessToast(
        `Successfully exported ${exportData.length} ambulance records to Excel!`,
        3000
      );
    } catch (error) {
      console.error("Export error:", error);
      showErrorToast("Failed to export data. Please try again.", 3000);
    }
  };

  // Loading state with skeleton
  if (loading) {
    return <AmbulanceSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 font-sans">
      {/* Breadcrumb Navigation */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <button
            onClick={() => navigate('/blood')}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="text-xs text-gray-500">
            <span className="text-gray-700">Ambulance</span>
            <span className="mx-1 text-gray-400">»</span>
            <span>Home</span>
            <span className="mx-1 text-gray-400">»</span>
            <span>Ambulance Management</span>
          </div>
        </div>
        <h1 className="text-xl font-bold text-gray-800">Ambulance Management</h1>
      </div>

      {/* Search, Filters and Action Buttons Row */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="flex flex-1 gap-3 w-full lg:w-auto flex-wrap">
          {/* Using global SearchBar component */}
          <SearchBar
            placeholder="Search by name, ID, place..."
            value={searchTerm}
            onChange={handleSearchChange}
            onClear={handleClearSearch}
            className="flex-1 max-w-sm"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-600 bg-white focus:outline-none focus:ring-1 focus:ring-[#1C62A0]"
          >
            <option value="all">All Vehicle Types</option>
            {ambulanceTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <div className="flex border border-gray-200 rounded-md bg-white mr-2">
            <button 
              onClick={() => setViewMode('grid')} 
              className={`p-2 rounded-l-md transition-colors ${viewMode === 'grid' ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white' : 'text-gray-400 hover:bg-gray-50'}`}
            >
              <LayoutGrid size={16} />
            </button>
            <button 
              onClick={() => setViewMode('list')} 
              className={`p-2 rounded-r-md transition-colors ${viewMode === 'list' ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white' : 'text-gray-400 hover:bg-gray-50'}`}
            >
              <List size={16} />
            </button>
          </div>

          <button 
            onClick={handleRefresh} 
            className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50 transition-colors" 
            title="Refresh"
          >
            <RefreshCcw size={16} className={isFetching ? "animate-spin" : ""} />
          </button>

          <button onClick={handleExport} className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50 transition-colors" title="Export to Excel">
            <Download size={16} />
          </button>

          {/* Add Ambulance Button with Permission Check */}
          <button 
            onClick={() => {
              if (!hasPermission(PERMISSIONS.CREATE)) {
                setPermissionDeniedMessage("You do not have permission to create an ambulance. Please contact your administrator.");
                setShowPermissionDeniedModal(true);
                return;
              }
              setShowAddModal(true);
            }} 
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-md flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Plus size={16} /> Add Ambulance
          </button>
        </div>
      </div>

      {/* GRID VIEW - Using server-side paginated data */}
      {viewMode === 'grid' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {ambulancesData.map((ambulance) => (
              <div key={ambulance.id} className="bg-white rounded-lg border border-gray-100 p-5 relative flex flex-col items-center shadow-sm hover:shadow-md transition-shadow">
                <div className="w-full flex justify-between items-start mb-4">
                  <Badge variant="info" className="text-[10px]">
                    {ambulance.formattedId}
                  </Badge>
                  <div className="relative menu-container">
                    <button onClick={(e) => toggleMenu(ambulance.id, e)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 text-xl font-bold">
                      ⋮
                    </button>
                    {activeMenu === ambulance.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1">
                        {/* View Details with Permission Check */}
                        <button onClick={() => { 
                          if (!hasPermission(PERMISSIONS.VIEW)) {
                            setPermissionDeniedMessage("You do not have permission to view ambulance details. Please contact your administrator.");
                            setShowPermissionDeniedModal(true);
                            setActiveMenu(null);
                            return;
                          }
                          setSelectedAmbulance(ambulance); 
                          setShowViewModal(true); 
                          setActiveMenu(null); 
                        }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                          <Eye size={16} /> View Details
                        </button>
                        
                        {/* Edit with Permission Check */}
                        <button onClick={() => { 
                          if (!hasPermission(PERMISSIONS.EDIT)) {
                            setPermissionDeniedMessage("You do not have permission to edit an ambulance. Please contact your administrator.");
                            setShowPermissionDeniedModal(true);
                            setActiveMenu(null);
                            return;
                          }
                          setSelectedAmbulance(ambulance); 
                          setShowEditModal(true); 
                          setActiveMenu(null); 
                        }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                          <Edit size={16} /> Edit
                        </button>
                        
                        <div className="border-t border-gray-100 my-1"></div>
                        
                        {/* Delete with Permission Check */}
                        <button onClick={() => { 
                          if (!hasPermission(PERMISSIONS.DELETE)) {
                            setPermissionDeniedMessage("You do not have permission to delete an ambulance. Please contact your administrator.");
                            setShowPermissionDeniedModal(true);
                            setActiveMenu(null);
                            return;
                          }
                          setSelectedAmbulance(ambulance); 
                          setShowDeleteModal(true); 
                          setActiveMenu(null); 
                        }} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50 flex items-center gap-2">
                          <Trash2 size={16} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="relative mb-3">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center border-2 border-white shadow-sm">
                    <Truck className="w-8 h-8 text-[#1C62A0]" />
                  </div>
                </div>

                <h3 onClick={() => { 
                  if (!hasPermission(PERMISSIONS.VIEW)) {
                    setPermissionDeniedMessage("You do not have permission to view ambulance details. Please contact your administrator.");
                    setShowPermissionDeniedModal(true);
                    return;
                  }
                  setSelectedAmbulance(ambulance); 
                  setShowViewModal(true); 
                }} className="text-[14px] font-bold text-gray-800 cursor-pointer hover:text-[#1C62A0] text-center">
                  {ambulance.serviceName}
                </h3>
                <p className="text-[11px] text-gray-500 mb-4 text-center">{ambulance.vehicleType}</p>

                <div className="grid grid-cols-1 gap-4 w-full border-t border-gray-50 pt-4 mb-4">
                  <div className="w-full flex flex-col items-center justify-center text-center">
                    <p className="text-[9px] text-gray-400 uppercase font-bold">Phone</p>
                    <p className="text-xs font-bold text-gray-700">{ambulance.phone}</p>
                  </div>
                </div>

                <div className="w-full border-t border-gray-50 pt-3 mt-1">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-gray-500">
                    <MapPin size={10} />
                    <span className="truncate">{ambulance.address?.place}, {ambulance.address?.district}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination for Grid View - Using server-side totalPages */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                itemLabel="ambulances"
                variant="centered"
              />
            </div>
          )}
        </>
      )}

      {/* LIST VIEW - Using server-side paginated data */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">
              Total Ambulances
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded ml-2">{totalItems}</span>
            </h2>
          </div>

          <div className="flex flex-col min-h-[500px]">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
                  <tr>
                    <th className="px-6 py-3">Ambulance ID</th>
                    <th className="px-6 py-3">Service Name</th>
                    <th className="px-6 py-3">Vehicle Type</th>
                    <th className="px-6 py-3">Place</th>
                    <th className="px-6 py-3">District</th>
                    <th className="px-6 py-3">State</th>
                    <th className="px-6 py-3">Phone</th>
                    <th className="px-6 py-3 text-right w-16">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ambulancesData.map((ambulance) => (
                    <tr key={ambulance.id} className="hover:bg-gray-50 border-b border-gray-100">
                      <td className="px-6 py-4 text-[#1C62A0] font-medium">
                        {ambulance.formattedId}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <Truck className="w-4 h-4 text-[#1C62A0]" />
                          </div>
                          <span 
                            onClick={() => { 
                              if (!hasPermission(PERMISSIONS.VIEW)) {
                                setPermissionDeniedMessage("You do not have permission to view ambulance details. Please contact your administrator.");
                                setShowPermissionDeniedModal(true);
                                return;
                              }
                              setSelectedAmbulance(ambulance); 
                              setShowViewModal(true); 
                            }} 
                            className="font-medium text-gray-800 cursor-pointer hover:text-[#1C62A0]"
                          >
                            {ambulance.serviceName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 max-w-[200px] truncate">{ambulance.vehicleType}</td>
                      <td className="px-6 py-4 text-gray-600">{ambulance.address?.place || 'N/A'}</td>
                      <td className="px-6 py-4 text-gray-600">{ambulance.address?.district || 'N/A'}</td>
                      <td className="px-6 py-4 text-gray-600">{ambulance.address?.state || 'N/A'}</td>
                      <td className="px-6 py-4 text-gray-600">{ambulance.phone}</td>
                      <td className="px-6 py-4 text-right relative menu-container">
                        <div className="flex justify-end">
                          <button onClick={(e) => toggleMenu(ambulance.id, e)} className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 text-xl font-bold">
                            ⋮
                          </button>
                          {activeMenu === ambulance.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1">
                              {/* View Details with Permission Check */}
                              <button onClick={() => { 
                                if (!hasPermission(PERMISSIONS.VIEW)) {
                                  setPermissionDeniedMessage("You do not have permission to view ambulance details. Please contact your administrator.");
                                  setShowPermissionDeniedModal(true);
                                  setActiveMenu(null);
                                  return;
                                }
                                setSelectedAmbulance(ambulance); 
                                setShowViewModal(true); 
                                setActiveMenu(null); 
                              }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                <Eye size={16} /> View Details
                              </button>
                              
                              {/* Edit with Permission Check */}
                              <button onClick={() => { 
                                if (!hasPermission(PERMISSIONS.EDIT)) {
                                  setPermissionDeniedMessage("You do not have permission to edit an ambulance. Please contact your administrator.");
                                  setShowPermissionDeniedModal(true);
                                  setActiveMenu(null);
                                  return;
                                }
                                setSelectedAmbulance(ambulance); 
                                setShowEditModal(true); 
                                setActiveMenu(null); 
                              }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                <Edit size={16} /> Edit
                              </button>
                              
                              <div className="border-t border-gray-100 my-1"></div>
                              
                              {/* Delete with Permission Check */}
                              <button onClick={() => { 
                                if (!hasPermission(PERMISSIONS.DELETE)) {
                                  setPermissionDeniedMessage("You do not have permission to delete an ambulance. Please contact your administrator.");
                                  setShowPermissionDeniedModal(true);
                                  setActiveMenu(null);
                                  return;
                                }
                                setSelectedAmbulance(ambulance); 
                                setShowDeleteModal(true); 
                                setActiveMenu(null); 
                              }} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50 flex items-center gap-2">
                                <Trash2 size={16} /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="mt-auto px-6 py-4 bg-gray-50 border-t border-gray-200">
              <Pagination
                currentPage={currentPage}
                totalPages={Math.max(1, totalPages)}
                onPageChange={handlePageChange}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                itemLabel="ambulances"
              />
            </div>
          </div>
        </div>
      )}

      {/* No Results */}
      {!loading && ambulancesData.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No ambulances found</h3>
          <p className="text-sm text-gray-500">Try adjusting your search or filter criteria</p>
        </div>
      )}

      {/* Modals */}
      <AddAmbulanceModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddAmbulance}
        ambulanceTypes={ambulanceTypes}
      />

      <EditAmbulanceModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedAmbulance(null);
        }}
        onSave={handleEditAmbulance}
        ambulance={selectedAmbulance}
        ambulanceTypes={ambulanceTypes}
      />

      <ViewAmbulanceModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedAmbulance(null);
        }}
        ambulance={selectedAmbulance}
      />

      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedAmbulance(null);
        }}
        onConfirm={handleDeleteAmbulance}
        title="Delete Ambulance"
        message="Are you sure you want to delete this ambulance? This action cannot be undone."
        itemName={selectedAmbulance?.serviceName}
      />

      {/* Permission Denied Modal */}
      <PermissionDeniedModal
        isOpen={showPermissionDeniedModal}
        onClose={() => setShowPermissionDeniedModal(false)}
        message={permissionDeniedMessage}
      />
    </div>
  );
};

export default Ambulance;