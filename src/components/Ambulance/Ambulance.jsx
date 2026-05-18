// src/components/Ambulance/Ambulance.jsx - Connected to API with formatted IDs and skeleton loading
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Ambulance as AmbulanceIcon,
  Plus,
  Download,
  MoreVertical,
  Eye,
  Edit,
  LayoutGrid,
  List,
  RefreshCcw,
  Upload,
  Trash2,
  Filter,
  Search,
  Phone,
  MapPin,
  Truck,
  AlertCircle
} from 'lucide-react';
import DeleteModal from '../patients/DeleteModel';
import AddAmbulanceModal from './AddAmbulanceModal';
import EditAmbulanceModal from './EditAmbulanceModal';
import ViewAmbulanceModal from './ViewAmbulanceModal';
import { 
  Button, 
  Badge, 
  Loader, 
  Pagination, 
  SearchBar,
  Card
} from '../ui';
import { useAuth } from '../../context/AuthContext';
import { 
  useGetAmbulanceQuery,
  useCreateAmbulanceMutation,
  useUpdateAmbulanceMutation,
  useDeleteAmbulanceMutation
} from '../../../app/service/ambulance';
import { showSuccessToast, showErrorToast, showWarningToast } from '../ui/Toast';

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

// Skeleton Loading Component
const AmbulanceSkeleton = () => {
  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 font-sans">
      {/* Breadcrumb Skeleton */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="h-7 w-32 bg-gray-200 rounded animate-pulse mt-2"></div>
      </div>

      {/* Search and Filters Skeleton */}
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

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse"
          >
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
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAmbulance, setSelectedAmbulance] = useState(null);
  
  // Menu state for grid view
  const [activeMenu, setActiveMenu] = useState(null);
  
  // Filter states
  const [typeFilter, setTypeFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Helper function to format ambulance ID for display only
  const formatAmbulanceId = (id) => {
    if (!id) return '#AMB0000';
    const numericId = parseInt(id) || 0;
    return `#AMB${String(numericId).padStart(4, '0')}`;
  };

  // API Hooks - Updated to use the new unified query
  const { 
    data: ambulancesResponse, 
    isLoading: loading, 
    refetch,
    isFetching
  } = useGetAmbulanceQuery(
    { hospitalId: user?.id },
    { skip: !user?.id }
  );
  
  const [createAmbulance, { isLoading: isAdding }] = useCreateAmbulanceMutation();
  const [updateAmbulance, { isLoading: isUpdating }] = useUpdateAmbulanceMutation();
  const [deleteAmbulance, { isLoading: isDeleting }] = useDeleteAmbulanceMutation();

  // Transform API response - SEPARATE display ID from database ID
  const transformAmbulanceData = (ambulanceList) => {
    if (!ambulanceList || !Array.isArray(ambulanceList)) return [];
    
    return ambulanceList.map((ambulance, index) => ({
      id: ambulance.id, // Keep original numeric ID for API operations
      formattedId: formatAmbulanceId(ambulance.id || index + 1), // Formatted ID for display only
      serviceName: ambulance.serviceName || '',
      phone: ambulance.phone || '',
      vehicleType: ambulance.vehicleType || '',
      address: ambulance.address || {},
      hospitalId: ambulance.hospitalId,
      createdAt: ambulance.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
      lastUpdated: ambulance.updatedAt?.split('T')[0] || new Date().toISOString().split('T')[0]
    }));
  };

  const ambulancesData = transformAmbulanceData(ambulancesResponse?.data || []);

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

  // CRUD Handlers with API - Updated to use new mutation names
  const handleAddAmbulance = async (newAmbulance) => {
    try {
      const ambulanceToAdd = {
        serviceName: newAmbulance.serviceName,
        phone: newAmbulance.phone,
        vehicleType: newAmbulance.vehicleType,
        address: newAmbulance.address,
        hospitalId: user?.id
      };
      
      const response = await createAmbulance(ambulanceToAdd).unwrap();
      showSuccessToast(`${newAmbulance.serviceName} has been added successfully!`, 3000);
      refetch();
      setShowAddModal(false);
    } catch (error) {
      console.error('Add error:', error);
      showErrorToast(error?.data?.message || 'Failed to add ambulance', 3000);
    }
  };

  const handleEditAmbulance = async (updatedAmbulance) => {
    try {
      const updateData = {
        serviceName: updatedAmbulance.serviceName,
        phone: updatedAmbulance.phone,
        vehicleType: updatedAmbulance.vehicleType,
        address: updatedAmbulance.address
      };
      
      // Use the numeric ID directly with the new data structure
      const response = await updateAmbulance({ 
        id: updatedAmbulance.id, 
        data: updateData 
      }).unwrap();
      
      showSuccessToast(`${updatedAmbulance.serviceName} has been updated successfully!`, 3000);
      refetch();
      setShowEditModal(false);
      setSelectedAmbulance(null);
    } catch (error) {
      console.error('Update error:', error);
      showErrorToast(error?.data?.message || 'Failed to update ambulance', 3000);
    }
  };

  const handleDeleteAmbulance = async () => {
    if (selectedAmbulance) {
      try {
        // Use the numeric ID directly
        await deleteAmbulance(selectedAmbulance.id).unwrap();
        showSuccessToast(`${selectedAmbulance.serviceName} has been deleted successfully!`, 3000);
        refetch();
        setShowDeleteModal(false);
        setSelectedAmbulance(null);
      } catch (error) {
        console.error('Delete error:', error);
        showErrorToast(error?.data?.message || 'Failed to delete ambulance', 3000);
      }
    }
  };

  // Menu handlers
  const toggleMenu = (id, e) => {
    e.stopPropagation();
    setActiveMenu(activeMenu === id ? null : id);
  };

  // Filter functions
  const getFilteredAmbulances = () => {
    let filtered = [...ambulancesData];
    
    if (searchTerm) {
      filtered = filtered.filter(amb => 
        amb.serviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        amb.formattedId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        amb.phone?.includes(searchTerm) ||
        amb.address?.place?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        amb.address?.district?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (typeFilter !== 'all') {
      filtered = filtered.filter(amb => amb.vehicleType === typeFilter);
    }
    
    if (countryFilter) {
      filtered = filtered.filter(amb => 
        amb.address?.country?.toLowerCase().includes(countryFilter.toLowerCase())
      );
    }
    
    return filtered;
  };

  const filteredAmbulances = getFilteredAmbulances();
  const totalPages = Math.ceil(filteredAmbulances.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAmbulances = filteredAmbulances.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleRefresh = () => {
    setSearchTerm("");
    setTypeFilter("all");
    setCountryFilter("");
    setCurrentPage(1);
    refetch();
  };

  const handleExport = () => {
    const filteredData = getFilteredAmbulances();
    const exportData = filteredData.map(amb => ({
      'ID': amb.id,
      'Formatted ID': amb.formattedId,
      'Service Name': amb.serviceName,
      'Vehicle Type': amb.vehicleType,
      'Phone': amb.phone,
      'Country': amb.address?.country,
      'State': amb.address?.state,
      'District': amb.address?.district,
      'Place': amb.address?.place,
      'Pincode': amb.address?.pincode,
      'Created At': amb.createdAt,
      'Last Updated': amb.lastUpdated
    }));
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `ambulances_export_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    showSuccessToast(`Exported ${exportData.length} ambulance records`, 2000);
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        let successCount = 0;
        let errorCount = 0;
        
        for (const amb of importedData) {
          try {
            await createAmbulance({
              serviceName: amb['Service Name'] || amb.serviceName,
              phone: amb.Phone || amb.phone,
              vehicleType: amb['Vehicle Type'] || amb.vehicleType,
              address: {
                country: amb.Country || amb.address?.country,
                state: amb.State || amb.address?.state,
                district: amb.District || amb.address?.district,
                place: amb.Place || amb.address?.place,
                pincode: amb.Pincode || amb.address?.pincode
              },
              hospitalId: user?.id
            }).unwrap();
            successCount++;
          } catch (error) {
            errorCount++;
          }
        }
        
        showSuccessToast(`Successfully imported ${successCount} ambulances! ${errorCount > 0 ? `Failed: ${errorCount}` : ''}`, 4000);
        refetch();
      } catch (error) {
        showErrorToast('Error parsing JSON file. Please make sure it\'s a valid JSON file.', 3000);
      }
    };
    
    reader.readAsText(file);
    event.target.value = '';
  };

  const clearAllFilters = () => {
    setTypeFilter('all');
    setCountryFilter('');
    setSearchTerm('');
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (typeFilter !== 'all') count++;
    if (countryFilter) count++;
    if (searchTerm) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

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
            onClick={() => navigate(-1)}
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

      {/* Search and Action Buttons Row */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="flex flex-1 gap-3 w-full lg:w-auto">
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Search by name, ID, place..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1C62A0]"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
            <button className="absolute right-2 top-1.5 bg-[#1C62A0] p-1 rounded">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </button>
          </div>

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
            <button onClick={() => setViewMode('grid')} className={`p-2 ${viewMode === 'grid' ? 'bg-[#1C62A0] text-white' : 'text-gray-400'}`}>
              <LayoutGrid size={16} />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-2 ${viewMode === 'list' ? 'bg-[#1C62A0] text-white' : 'text-gray-400'}`}>
              <List size={16} />
            </button>
          </div>

          <button onClick={handleRefresh} className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50">
            <RefreshCcw size={16} />
          </button>

          <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" id="import-file" />
          <label htmlFor="import-file" className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50 cursor-pointer">
            <Upload size={16} />
          </label>

          <button onClick={handleExport} className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50">
            <Download size={16} />
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`relative p-2 border border-gray-200 rounded-md bg-white ${
              showFilters || activeFilterCount > 0 ? 'text-[#1C62A0]' : 'text-gray-500'
            } hover:bg-gray-50`}
          >
            <Filter size={16} />
            {activeFilterCount > 0 && !showFilters && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          <button onClick={() => setShowAddModal(true)} className="px-4 py-2 text-sm font-medium text-white bg-[#1C62A0] rounded-md flex items-center gap-2 hover:bg-[#154A7D]">
            <Plus size={16} /> Add Ambulance
          </button>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-12 px-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1C62A0] bg-white"
            >
              <option value="all">All Vehicle Types</option>
              {ambulanceTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            <input
              type="text"
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              placeholder="Filter by country..."
              className="h-12 px-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1C62A0]"
            />
          </div>
        </div>
      )}

      {/* GRID VIEW - Using formattedId for display */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {paginatedAmbulances.map((ambulance) => (
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
                      <button onClick={() => { setSelectedAmbulance(ambulance); setShowViewModal(true); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <Eye size={16} /> View Details
                      </button>
                      <button onClick={() => { setSelectedAmbulance(ambulance); setShowEditModal(true); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <Edit size={16} /> Edit
                      </button>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button onClick={() => { setSelectedAmbulance(ambulance); setShowDeleteModal(true); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50 flex items-center gap-2">
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

              <h3 onClick={() => { setSelectedAmbulance(ambulance); setShowViewModal(true); }} className="text-[14px] font-bold text-gray-800 cursor-pointer hover:text-[#1C62A0] text-center">
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
      )}

      {/* LIST VIEW - Using formattedId for display */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">
              Total Ambulances
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded ml-2">{filteredAmbulances.length}</span>
            </h2>
          </div>

          <div className="overflow-x-auto">
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
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAmbulances.map((ambulance) => (
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
                          onClick={() => { setSelectedAmbulance(ambulance); setShowViewModal(true); }} 
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
                      <button onClick={(e) => toggleMenu(ambulance.id, e)} className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 text-xl font-bold">
                        ⋮
                      </button>
                      {activeMenu === ambulance.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1">
                          <button onClick={() => { setSelectedAmbulance(ambulance); setShowViewModal(true); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                            <Eye size={16} /> View Details
                          </button>
                          <button onClick={() => { setSelectedAmbulance(ambulance); setShowEditModal(true); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                            <Edit size={16} /> Edit
                          </button>
                          <div className="border-t border-gray-100 my-1"></div>
                          <button onClick={() => { setSelectedAmbulance(ambulance); setShowDeleteModal(true); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50 flex items-center gap-2">
                            <Trash2 size={16} /> Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredAmbulances.length > 0 && (
            <div className="px-6 py-3 bg-gray-50 rounded-b-xl border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {filteredAmbulances.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredAmbulances.length)} of {filteredAmbulances.length} ambulances
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 border rounded-md text-sm transition-all ${
                    currentPage === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-600 hover:bg-gray-50 border-gray-300"
                  }`}
                >
                  Previous
                </button>
                <span className="px-3 py-1 bg-[#1C62A0] text-white rounded-md text-sm">
                  {currentPage}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className={`px-3 py-1 border rounded-md text-sm transition-all ${
                    currentPage === totalPages || totalPages === 0
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-600 hover:bg-gray-50 border-gray-300"
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Results */}
      {!loading && filteredAmbulances.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No ambulances found</h3>
          <p className="text-gray-500 mb-4">Try adjusting your search or filter criteria</p>
          <button onClick={clearAllFilters} className="px-4 py-2 bg-[#1C62A0] text-white rounded-md hover:bg-[#154A7D]">
            Clear Filters
          </button>
        </div>
      )}

      {/* Modals */}
      <AddAmbulanceModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddAmbulance}
        ambulanceTypes={ambulanceTypes}
        hospitalId={user?.id}
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
    </div>
  );
};

export default Ambulance;