// src/components/super-admin/Ambulance.jsx

import React, { useState, useEffect } from 'react';
import {
  Search,
  Loader2,
  X,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Phone,
  MapPin,
  Car,
  Eye,
  Filter,
  RefreshCw,
  Building2,
} from 'lucide-react';
import {
  useGetAmbulanceQuery
} from '../../../../../app/service/ambulance';
import { showSuccessToast, showErrorToast } from '../../../ui/Toast';
import { useNavigate } from 'react-router-dom';

// ================= PAGINATION COMPONENT =================
const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  totalItems, 
  itemsPerPage,
  isLoading 
}) => {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-200">
      <div className="text-sm text-gray-500">
        Showing <span className="font-medium text-gray-700">{startItem}</span> to{' '}
        <span className="font-medium text-gray-700">{endItem}</span> of{' '}
        <span className="font-medium text-gray-700">{totalItems}</span> ambulances
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
          className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
            currentPage === 1 || isLoading
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <ChevronLeft size={16} />
          <span>Prev</span>
        </button>

        <span className="px-3 py-1.5 text-sm font-medium text-[#6366F1] bg-[#EEF2FF] rounded-md">
          {currentPage}
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || isLoading}
          className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
            currentPage === totalPages || isLoading
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <span>Next</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

// ================= FILTER MODAL =================
const FilterModal = ({ isOpen, onClose, filters, onApply, onReset }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters, isOpen]);

  if (!isOpen) return null;

  const vehicleTypes = ['all', 'Basic Life Support (BLS)', 'Advanced Life Support (ALS)', 'Patient Transport', 'Neonatal Ambulance', 'ICU Ambulance', 'Air Ambulance'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters = {
      vehicleType: 'all',
      place: '',
      district: '',
      state: '',
      country: '',
    };
    setLocalFilters(resetFilters);
    onReset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            <Filter size={18} className="inline mr-2" />
            Filter Ambulances
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Vehicle Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vehicle Type
            </label>
            <select
              name="vehicleType"
              value={localFilters.vehicleType}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#154A7D] focus:border-transparent outline-none"
            >
              {vehicleTypes.map(type => (
                <option key={type} value={type}>{type === 'all' ? 'All Types' : type}</option>
              ))}
            </select>
          </div>

          {/* Place */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Place/Locality
            </label>
            <input
              type="text"
              name="place"
              value={localFilters.place}
              onChange={handleChange}
              placeholder="Enter place"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#154A7D] focus:border-transparent outline-none"
            />
          </div>

          {/* District */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              District
            </label>
            <input
              type="text"
              name="district"
              value={localFilters.district}
              onChange={handleChange}
              placeholder="Enter district"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#154A7D] focus:border-transparent outline-none"
            />
          </div>

          {/* State */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State
            </label>
            <input
              type="text"
              name="state"
              value={localFilters.state}
              onChange={handleChange}
              placeholder="Enter state"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#154A7D] focus:border-transparent outline-none"
            />
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Country
            </label>
            <input
              type="text"
              name="country"
              value={localFilters.country}
              onChange={handleChange}
              placeholder="Enter country"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#154A7D] focus:border-transparent outline-none"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4 mt-4 border-t border-gray-200">
          <button
            onClick={handleReset}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            Reset All
          </button>
          <button
            onClick={handleApply}
            className="flex-1 px-4 py-2 bg-[#154A7D] hover:bg-[#1a5c8f] text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

// ================= HELPER FUNCTIONS =================

// Convert string to Title Case
const toTitleCase = (text = "") => {
  if (!text) return "";
  return text.replace(/\b\w/g, (char) => char.toUpperCase());
};

// Get random color based on name
const getInitialColor = (name) => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
    '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

// Format phone number
const formatPhone = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
};

// Format address
const formatAddress = (address) => {
  if (!address) return '';
  const parts = [
    address.place,
    address.district,
    address.state,
    address.country,
  ].filter(Boolean);
  return parts.join(', ');
};

// ================= MAIN COMPONENT =================

const Ambulance = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    vehicleType: 'all',
    place: '',
    district: '',
    state: '',
    country: '',
  });
  const [appliedFilters, setAppliedFilters] = useState({});
  
  const itemsPerPage = 12;

  // Build query params - NO HOSPITAL FILTER
  const buildQueryParams = () => {
    const params = {
      limit: 1000,
      skipHospitalFilter: true, // Skip hospital filter for super admin view
    };
    
    if (searchTerm) {
      params.search_query = searchTerm;
    }
    
    // Apply filters
    if (appliedFilters.vehicleType && appliedFilters.vehicleType !== 'all') {
      params.vehicleType = appliedFilters.vehicleType;
    }
    
    if (appliedFilters.place) {
      params.place = appliedFilters.place;
    }
    
    if (appliedFilters.district) {
      params.district = appliedFilters.district;
    }
    
    if (appliedFilters.state) {
      params.state = appliedFilters.state;
    }
    
    if (appliedFilters.country) {
      params.country = appliedFilters.country;
    }
    
    return params;
  };

  const { 
    data: ambulanceData, 
    isLoading, 
    error, 
    refetch,
    isFetching
  } = useGetAmbulanceQuery(buildQueryParams());

  // Reset page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, appliedFilters]);

  const ambulances = ambulanceData?.data && Array.isArray(ambulanceData.data) 
    ? ambulanceData.data 
    : [];

  // Client-side filtering and pagination
  const filteredAmbulances = ambulances.filter(ambulance => {
    // Search filter is already applied via API
    return true;
  });

  const paginatedAmbulances = filteredAmbulances.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalItems = filteredAmbulances.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Get ambulance ID
  const getAmbulanceId = (ambulance) => {
    if (!ambulance) return null;
    return ambulance.id || ambulance._id || null;
  };

  const handleViewAmbulance = (ambulance) => {
    const id = getAmbulanceId(ambulance);
    if (id) {
      navigate(`/super-admin/ambulance/${id}`);
    }
  };

  const handleFilterApply = (newFilters) => {
    setAppliedFilters(newFilters);
  };

  const handleFilterReset = () => {
    setAppliedFilters({});
    setFilters({
      vehicleType: 'all',
      place: '',
      district: '',
      state: '',
      country: '',
    });
  };

  const handleRefresh = () => {
    refetch();
    showSuccessToast('🔄 Ambulances refreshed!');
  };

  const hasActiveFilters = Object.values(appliedFilters).some(value => value);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Ambulance Management</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage ambulance services across the platform
              {totalItems > 0 && (
                <span className="ml-2 font-medium text-gray-700">
                  ({totalItems} ambulances)
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isFetching}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw size={20} className={isFetching ? 'animate-spin' : ''} />
            </button>

            {/* Filter Button */}
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className={`p-2 rounded-lg transition-colors ${
                hasActiveFilters 
                  ? 'bg-[#154A7D] text-white hover:bg-[#1a5c8f]' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              title="Filter"
            >
              <Filter size={20} />
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
              )}
            </button>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="text-sm text-gray-500">Active filters:</span>
            {Object.entries(appliedFilters).map(([key, value]) => {
              if (!value || value === 'all') return null;
              const labels = {
                vehicleType: 'Vehicle Type',
                place: 'Place',
                district: 'District',
                state: 'State',
                country: 'Country',
              };
              return (
                <span 
                  key={key}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full"
                >
                  {labels[key] || key}: {value}
                  <button
                    onClick={() => {
                      const newFilters = { ...appliedFilters };
                      delete newFilters[key];
                      setAppliedFilters(newFilters);
                    }}
                    className="ml-1 hover:text-blue-900"
                  >
                    <X size={14} />
                  </button>
                </span>
              );
            })}
            <button
              onClick={handleFilterReset}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search ambulances by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#154A7D] focus:border-transparent outline-none"
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

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 size={48} className="animate-spin text-[#154A7D]" />
          <span className="mt-4 text-gray-600">Loading ambulances...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="text-red-500" size={24} />
          <div>
            <p className="text-red-700 font-medium">Error loading ambulances</p>
            <p className="text-red-600 text-sm">{error.data?.message || 'Failed to load ambulances. Please try again.'}</p>
            <button
              onClick={() => refetch()}
              className="mt-2 text-sm text-red-700 underline hover:text-red-900"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* No Ambulances State */}
      {!isLoading && !error && ambulances.length === 0 && !searchTerm && !hasActiveFilters && (
        <div className="text-center py-16 bg-gray-50 rounded-2xl">
          <div className="text-6xl mb-4">🚑</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Ambulances Found</h3>
          <p className="text-gray-500 mb-6">No ambulance services are registered in the system yet.</p>
        </div>
      )}

      {/* No Results for Search */}
      {!isLoading && !error && ambulances.length > 0 && filteredAmbulances.length === 0 && (
        <div className="text-center py-16 bg-gray-50 rounded-2xl">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Results Found</h3>
          <p className="text-gray-500">
            {searchTerm 
              ? `No ambulances match your search term "${searchTerm}"`
              : 'No ambulances match the applied filters'}
          </p>
          {(searchTerm || hasActiveFilters) && (
            <button
              onClick={() => {
                setSearchTerm('');
                handleFilterReset();
              }}
              className="mt-4 text-[#154A7D] hover:text-[#1a5c8f] underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Ambulances Grid */}
      {!isLoading && !error && filteredAmbulances.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedAmbulances.map((ambulance) => {
              const ambulanceId = getAmbulanceId(ambulance);
              const initialColor = getInitialColor(ambulance.serviceName || ambulance.name || 'Ambulance');
              const displayName = ambulance.serviceName || ambulance.name || 'Unknown Service';
              const firstLetter = displayName.charAt(0).toUpperCase();
              
              return (
                <div
                  key={ambulanceId || Math.random().toString()}
                  className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-emerald-200 relative cursor-pointer"
                  onClick={() => handleViewAmbulance(ambulance)}
                >
                  <div className="flex flex-col items-center">
                    {/* Avatar/Initial - Shows first letter of service name */}
                    <div 
                      className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg ring-4 ring-white"
                      style={{ backgroundColor: initialColor }}
                    >
                      <span>{firstLetter}</span>
                    </div>

                    {/* Service Name */}
                    <h3 className="text-lg font-semibold text-gray-800 text-center mt-4 mb-3 line-clamp-1">
                      {displayName}
                    </h3>

                    {/* Details */}
                    <div className="w-full space-y-2.5 text-sm text-gray-600">
                      <div className="flex items-center gap-2 justify-center">
                        <Phone size={14} className="text-gray-400 flex-shrink-0" />
                        <span className="font-medium">{formatPhone(ambulance.phone)}</span>
                      </div>
                      
                      {ambulance.address && (
                        <div className="flex items-center gap-2 justify-center text-xs text-gray-500">
                          <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                          <span className="truncate max-w-[180px]">
                            {formatAddress(ambulance.address)}
                          </span>
                        </div>
                      )}
                      
                      {ambulance.hospitalId && (
                        <div className="flex items-center gap-2 justify-center text-xs text-gray-500">
                          <Building2 size={14} className="text-gray-400 flex-shrink-0" />
                          <span>Hospital ID: {ambulance.hospitalId}</span>
                        </div>
                      )}
                    </div>

                    {/* View Details Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewAmbulance(ambulance);
                      }}
                      className="mt-4 w-full py-2.5 text-sm font-medium text-emerald-600 hover:text-white border border-emerald-600 hover:bg-emerald-600 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <Eye size={16} />
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            isLoading={isLoading || isFetching}
          />
        </>
      )}

      {/* Filter Modal */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={filters}
        onApply={handleFilterApply}
        onReset={handleFilterReset}
      />
    </div>
  );
};

export default Ambulance;