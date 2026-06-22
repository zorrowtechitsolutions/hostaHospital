// src/components/BloodBank/BloodBank.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Droplet, Plus, Filter, Download, MoreVertical, Eye, 
  Edit, RefreshCcw, Upload, Trash2, Search, LayoutGrid, List
} from 'lucide-react';
import { 
  Button, Badge, Loader, Card, Modal, SearchBar, Pagination
} from '../ui';
import DeleteModal from '../patients/DeleteModel';
import { showSuccessToast, showErrorToast, showWarningToast } from '../ui/Toast';
import { 
  useGetBloodBankQuery,
  useCreateBloodBankMutation,
  useUpdateBloodBankMutation,
  useDeleteBloodBankMutation
} from '../../../app/service/bloodbank';

// Blood groups list
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Helper function to format ID for display only
const formatBloodId = (id) => {
  if (!id) return '#BLD0000';
  let numericId;
  if (typeof id === 'string') {
    const match = id.match(/\d+/);
    numericId = match ? parseInt(match[0]) : parseInt(id) || 0;
  } else {
    numericId = parseInt(id) || 0;
  }
  return `#BLD${String(numericId).padStart(4, '0')}`;
};

// Transform API response - SEPARATE display ID from database ID
const transformBloodStockData = (stockList) => {
  if (!stockList || !Array.isArray(stockList)) return [];
  
  return stockList.map((stock, index) => ({
    id: stock.id || stock._id,
    formattedId: formatBloodId(stock.id || stock._id || index + 1),
    bloodGroup: stock.bloodGroup || '',
    count: stock.count || 0,
    hospitalId: stock.hospitalId,
    lastUpdated: stock.updatedAt?.split('T')[0] || stock.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0]
  }));
};

// Skeleton Loading Component
const BloodBankSkeleton = () => {
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
            <div className="flex justify-between mb-6">
              <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
              <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-gray-200 mb-4"></div>
              <div className="w-16 h-6 bg-gray-200 rounded mb-2"></div>
              <div className="w-24 h-5 bg-gray-200 rounded mb-6"></div>
              <div className="w-full border-t border-gray-100 pt-4 mt-2">
                <div className="text-center">
                  <div className="w-20 h-3 bg-gray-200 rounded mx-auto mb-2"></div>
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



// Add Blood Stock Modal
const AddBloodStockModal = ({ isOpen, onClose, onSave, isSaving }) => {
  const [formData, setFormData] = useState({
    bloodGroup: 'A+',
    count: 0
  });
 
 
  
  const handleSubmit = () => {
    if (formData.count < 0) {
      showErrorToast('Count cannot be negative', 3000);
      return;
    }
    if (formData.count > 1000) {
      showErrorToast('Count cannot exceed 1000 units', 3000);
      return;
    }
    onSave(formData);
    setFormData({ bloodGroup: 'A+', count: 0 });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Blood Stock" size="md">
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-2 pb-2 border-b border-gray-100">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <Droplet className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-md font-semibold text-gray-800">Add New Blood Stock</h3>
            <p className="text-xs text-gray-500">Enter blood group and available units</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group *</label>
          <select
            value={formData.bloodGroup}
            onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C62A0]"
          >
            {BLOOD_GROUPS.map(group => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Count (Units) *</label>
          <input
            type="number"
            min="0"
            value={formData.count}
            onChange={(e) => setFormData({ ...formData, count: parseInt(e.target.value) || 0 })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C62A0]"
            placeholder="Enter number of units"
          />
          <p className="text-xs text-gray-400 mt-1">Number of blood units available</p>
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onClose} fullWidth>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSaving} loading={isSaving} fullWidth>
            {isSaving ? 'Adding...' : 'Add Blood Stock'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Edit Blood Stock Modal
const EditBloodStockModal = ({ isOpen, onClose, onSave, stock, isSaving }) => {
  const [formData, setFormData] = useState({
    bloodGroup: '',
    count: 0
  });

  useEffect(() => {
    if (stock) {
      setFormData({
        bloodGroup: stock.bloodGroup,
        count: stock.count
      });
    }
  }, [stock]);

  const handleSubmit = () => {
    if (formData.count < 0) {
      showErrorToast('Count cannot be negative', 3000);
      return;
    }
    if (formData.count > 1000) {
      showErrorToast('Count cannot exceed 1000 units', 3000);
      return;
    }
    onSave({ ...stock, ...formData });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Blood Stock" size="md">
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-2 pb-2 border-b border-gray-100">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <Droplet className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-md font-semibold text-gray-800">Edit Blood Stock</h3>
            <p className="text-xs text-gray-500">Update blood group and available units</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group *</label>
          <select
            value={formData.bloodGroup}
            onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C62A0]"
          >
            {BLOOD_GROUPS.map(group => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Count (Units) *</label>
          <input
            type="number"
            min="0"
            value={formData.count}
            onChange={(e) => setFormData({ ...formData, count: parseInt(e.target.value) || 0 })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C62A0]"
          />
          <p className="text-xs text-gray-400 mt-1">Number of blood units available</p>
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onClose} fullWidth>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSaving} loading={isSaving} fullWidth>
            {isSaving ? 'Updating...' : 'Update Blood Stock'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// View Modal Component
const ViewBloodStockModal = ({ isOpen, onClose, stock }) => {
  if (!stock) return null;
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Blood Stock Details" size="md">
      <div className="space-y-4">
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center shadow-lg">
            <Droplet className="w-10 h-10 text-red-600" />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500">Blood Stock ID</label>
            <p className="text-sm font-semibold text-gray-800">{stock.formattedId}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Blood Group</label>
            <p className="text-sm font-semibold text-gray-800">{stock.bloodGroup}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Available Units</label>
            <p className="text-2xl font-bold text-[#1C62A0]">{stock.count}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Last Updated</label>
            <p className="text-sm text-gray-600">{stock.lastUpdated || new Date().toISOString().split('T')[0]}</p>
          </div>
        </div>
        
        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} fullWidth>Close</Button>
          <Button variant="primary" onClick={() => { onClose(); }} fullWidth>Edit Stock</Button>
        </div>
      </div>
    </Modal>
  );
};

const BloodBank = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  
  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBloodStock, setSelectedBloodStock] = useState(null);
  
  // Menu state
  const [activeMenu, setActiveMenu] = useState(null);
  
  // Filter states
  const [bloodGroupFilter, setBloodGroupFilter] = useState('all');

  // Save view mode to localStorage
  useEffect(() => {
    localStorage.setItem('bloodBankViewMode', viewMode);
  }, [viewMode]);

  // API Hooks - WITH QUERY PARAMETERS
  const { 
    data: bloodStocksResponse, 
    isLoading: loading, 
    refetch,
    isFetching
  } = useGetBloodBankQuery({
    page: currentPage,
    limit: itemsPerPage,
    bloodGroup: bloodGroupFilter !== "all" ? bloodGroupFilter : undefined,
    search_query: searchTerm?.trim() ? searchTerm : undefined
  });

  const [createBloodBank, { isLoading: isAdding }] = useCreateBloodBankMutation();
  const [updateBloodBank, { isLoading: isUpdating }] = useUpdateBloodBankMutation();
  const [deleteBloodBank, { isLoading: isDeleting }] = useDeleteBloodBankMutation();

  // Transform data from API response
  const paginatedBloodStocks = transformBloodStockData(bloodStocksResponse?.data || []);
  const totalPages = bloodStocksResponse?.pagination?.totalPages || 1;
  const totalItems = bloodStocksResponse?.pagination?.totalItems || 0;

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, bloodGroupFilter]);

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

  // CRUD Handlers with API - hospitalId is auto-injected
  const handleAddBloodStock = async (newBloodStock) => {
    try {
      const stockToAdd = {
        bloodGroup: newBloodStock.bloodGroup,
        count: newBloodStock.count
      };
      
      console.log("add",stockToAdd); 
      
      await createBloodBank(stockToAdd).unwrap();    
      showSuccessToast(`${newBloodStock.bloodGroup} blood stock added successfully!`, 3000);
      refetch();
      setShowAddModal(false);
    } catch (error) {
      console.error('Add error:', error);
      showErrorToast(error?.data?.message || 'Failed to add blood stock', 3000);
    }
  };

  const handleEditBloodStock = async (updatedStock) => {
    try {
      const updateData = {
        bloodGroup: updatedStock.bloodGroup,
        count: updatedStock.count
      };
      
      await updateBloodBank({ 
        id: updatedStock.id, 
        data: updateData 
      }).unwrap();
      
      showSuccessToast(`${updatedStock.bloodGroup} blood stock updated successfully!`, 3000);
      refetch();
      setShowEditModal(false);
      setSelectedBloodStock(null);
    } catch (error) {
      console.error('Update error:', error);
      showErrorToast(error?.data?.message || 'Failed to update blood stock', 3000);
    }
  };

  const handleDeleteBloodStock = async () => {
    if (selectedBloodStock) {
      try {
        await deleteBloodBank(selectedBloodStock.id).unwrap();
        showSuccessToast(`${selectedBloodStock.bloodGroup} blood stock deleted successfully!`, 3000);
        refetch();
        setShowDeleteModal(false);
        setSelectedBloodStock(null);
      } catch (error) {
        console.error('Delete error:', error);
        showErrorToast(error?.data?.message || 'Failed to delete blood stock', 3000);
      }
    }
  };

  // Menu handlers
  const toggleMenu = (id, e) => {
    e.stopPropagation();
    setActiveMenu(activeMenu === id ? null : id);
  };

  const handleRefresh = () => {
    setSearchTerm("");
    setBloodGroupFilter("all");
    setCurrentPage(1);
    refetch();
    showSuccessToast("Blood stock refreshed", 2000);
  };

  const handleExport = () => {
    const exportData = paginatedBloodStocks.map(stock => ({
      'ID': stock.formattedId,
      'Blood Group': stock.bloodGroup,
      'Count (Units)': stock.count,
      'Last Updated': stock.lastUpdated
    }));
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `blood_bank_export_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    showSuccessToast(`Exported ${exportData.length} blood stock records`, 2000);
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
        
        for (const stock of importedData) {
          try {
            await createBloodBank({
              bloodGroup: stock['Blood Group'] || stock.bloodGroup,
              count: stock['Count (Units)'] || stock.count || 0
            }).unwrap();
            successCount++;
          } catch (error) {
            errorCount++;
          }
        }
        
        showSuccessToast(`Successfully imported ${successCount} blood stock records! ${errorCount > 0 ? `Failed: ${errorCount}` : ''}`, 4000);
        refetch();
      } catch (error) {
        showErrorToast('Error parsing JSON file. Please make sure it\'s a valid JSON file.', 3000);
      }
    };
    
    reader.readAsText(file);
    event.target.value = '';
  };

  const clearAllFilters = () => {
    setBloodGroupFilter('all');
    setSearchTerm('');
    setCurrentPage(1);
    showSuccessToast("All filters cleared", 2000);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (bloodGroupFilter !== 'all') count++;
    if (searchTerm) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading) {
    return <BloodBankSkeleton />;
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
            <span className="text-gray-700">Blood Bank</span>
            <span className="mx-1 text-gray-400">»</span>
            <span>Home</span>
            <span className="mx-1 text-gray-400">»</span>
            <span>Blood Bank Management</span>
          </div>
        </div>
        <h1 className="text-xl font-bold text-gray-800">Blood Bank Management</h1>
      </div>

      {/* Search and Action Buttons Row */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="flex flex-1 gap-3 w-full lg:w-auto flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Search by blood group or ID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1C62A0]"
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
            <button className="absolute right-2 top-1.5 bg-gradient-to-r from-green-600 to-emerald-600 p-1 rounded">
              <Search className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Blood Group Dropdown - Filter */}
          <select
            value={bloodGroupFilter}
            onChange={(e) => {
              setBloodGroupFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-600 bg-white focus:outline-none focus:ring-1 focus:ring-[#1C62A0]"
          >
            <option value="all">All Blood Groups</option>
            {BLOOD_GROUPS.map(group => (
              <option key={group} value={group}>{group}</option>
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
            disabled={isFetching}
          >
            <RefreshCcw size={16} className={isFetching ? "animate-spin" : ""} />
          </button>

          <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" id="import-file" />
          <label htmlFor="import-file" className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50 cursor-pointer">
            <Upload size={16} />
          </label>

          <button onClick={handleExport} className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50 transition-colors">
            <Download size={16} />
          </button>

          <button 
            onClick={() => setShowAddModal(true)} 
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-md flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Plus size={16} /> Add Blood Stock
          </button>
        </div>
      </div>

      {/* GRID VIEW */}
      {viewMode === 'grid' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {paginatedBloodStocks.map((stock) => {
              return (
                <div key={stock.id} className="bg-white rounded-lg border border-gray-100 p-5 relative flex flex-col items-center shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-full flex justify-between items-start mb-4">
                    <Badge variant="info" className="text-[10px]">
                      {stock.formattedId}
                    </Badge>
                    <div className="relative menu-container">
                      <button onClick={(e) => toggleMenu(stock.id, e)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 text-xl font-bold">
                        ⋮
                      </button>
                      {activeMenu === stock.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1">
                          <button onClick={() => { setSelectedBloodStock(stock); setShowViewModal(true); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                            <Eye size={16} /> View Details
                          </button>
                          <button onClick={() => { setSelectedBloodStock(stock); setShowEditModal(true); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                            <Edit size={16} /> Edit
                          </button>
                          <div className="border-t border-gray-100 my-1"></div>
                          <button onClick={() => { setSelectedBloodStock(stock); setShowDeleteModal(true); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50 flex items-center gap-2">
                            <Trash2 size={16} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-800">{stock.bloodGroup}</h3>
                    <p className="text-2xl font-bold text-[#1C62A0] mt-1">{stock.count} <span className="text-xs text-gray-400 font-normal">units</span></p>
                  </div>

                  <div className="w-full border-t border-gray-50 pt-4 mt-4 text-center">
                    <p className="text-[9px] text-gray-400 uppercase font-bold">Last Updated</p>
                    <p className="text-xs font-medium text-gray-700">{stock.lastUpdated || new Date().toISOString().split('T')[0]}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination for Grid View */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                itemLabel="blood stocks"
                variant="centered"
              />
            </div>
          )}
        </>
      )}

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">
              Total Blood Stocks
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded ml-2">{totalItems}</span>
            </h2>
          </div>

          <div className="flex flex-col min-h-[500px]">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
                  <tr>
                    <th className="px-6 py-3">Stock ID</th>
                    <th className="px-6 py-3">Blood Group</th>
                    <th className="px-6 py-3">Available Units</th>
                    <th className="px-6 py-3">Last Updated</th>
                    <th className="px-6 py-3 text-right w-16">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedBloodStocks.map((stock) => (
                    <tr key={stock.id} className="hover:bg-gray-50 border-b border-gray-100">
                      <td className="px-6 py-4 text-[#1C62A0] font-medium">
                        {stock.formattedId}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                            <Droplet className="w-4 h-4 text-red-600" />
                          </div>
                          <span className="font-medium text-gray-800">{stock.bloodGroup}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-[#1C62A0]">{stock.count}</span>
                        <span className="text-xs text-gray-400 ml-1">units</span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{stock.lastUpdated}</td>
                      <td className="px-6 py-4 text-right relative menu-container">
                        <div className="flex justify-end">
                          <button onClick={(e) => toggleMenu(stock.id, e)} className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 text-xl font-bold">
                            ⋮
                          </button>
                          {activeMenu === stock.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1">
                              <button onClick={() => { setSelectedBloodStock(stock); setShowViewModal(true); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                <Eye size={16} /> View Details
                              </button>
                              <button onClick={() => { setSelectedBloodStock(stock); setShowEditModal(true); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                <Edit size={16} /> Edit
                              </button>
                              <div className="border-t border-gray-100 my-1"></div>
                              <button onClick={() => { setSelectedBloodStock(stock); setShowDeleteModal(true); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50 flex items-center gap-2">
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

            {/* Pagination - Sticks to bottom */}
            {totalPages > 1 && (
              <div className="mt-auto px-6 py-4 bg-gray-50 border-t border-gray-200">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  itemLabel="blood stocks"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* No Results */}
      {!loading && paginatedBloodStocks.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Droplet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No blood stock found</h3>
        </div>
      )}

      {/* Modals */}
      <AddBloodStockModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddBloodStock}
        isSaving={isAdding}
      />

      <EditBloodStockModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedBloodStock(null);
        }}
        onSave={handleEditBloodStock}
        stock={selectedBloodStock}
        isSaving={isUpdating}
      />

      <ViewBloodStockModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedBloodStock(null);
        }}
        stock={selectedBloodStock}
      />

      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedBloodStock(null);
        }}
        onConfirm={handleDeleteBloodStock}
        title="Delete Blood Stock"
        message="Are you sure you want to delete this blood stock? This action cannot be undone."
        itemName={selectedBloodStock?.bloodGroup}
      />
    </div>
  );
};

export default BloodBank;