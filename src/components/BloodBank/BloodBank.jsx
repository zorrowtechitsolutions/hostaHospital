import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Droplet, Plus, Filter, Download, MoreVertical, Eye, 
  Edit, RefreshCcw, Trash2, Search
} from 'lucide-react';
import { 
  Button, Badge, Loader, Card, Modal, SearchBar, Pagination
} from '../ui';
import DeleteModal from '../patients/DeleteModel';
import PermissionDeniedModal from '../ui/PermissionDeniedModal';
import { showSuccessToast, showErrorToast, showWarningToast } from '../ui/Toast';
import { 
  useGetBloodBankQuery,
  useCreateBloodBankMutation,
  useUpdateBloodBankMutation,
  useDeleteBloodBankMutation
} from '../../../app/service/bloodbank';
import { getHospitalId } from '../../utils/auth';

// Import the export function
import { exportToExcel } from "../../utils/excelExport";

// Import hasPermission for permission checks
import { hasPermission } from "../../utils/permission";

// Import socket
import { socket } from '../../socket/socket';
import { registerBloodBankEvents, unregisterBloodBankEvents } from '../../socket/bloodBankEvents';

// Permission IDs for Blood Bank module (25-28)
const PERMISSIONS = {
  CREATE: 25,
  VIEW: 26,
  EDIT: 27,
  DELETE: 28
};

// Blood groups list
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Helper function to safely convert to string for search
const safeToString = (value) => {
  if (value === null || value === undefined) return '';
  return String(value);
};

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
const AddBloodStockModal = ({ isOpen, onClose, onSave, isSaving, error }) => {
  const [formData, setFormData] = useState({
    bloodGroup: 'A+',
    count: 0
  });
  const [serverError, setServerError] = useState(null);

  useEffect(() => {
    if (error) {
      setServerError(error);
    }
  }, [error]);

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

  const handleClose = () => {
    setServerError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Blood Stock" size="md">
      <div className="space-y-4">
        {/* ✅ Display server error if provided */}
        {serverError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{serverError}</p>
          </div>
        )}

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
          <Button variant="outline" onClick={handleClose} fullWidth>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSaving} loading={isSaving} fullWidth>
            {isSaving ? 'Adding...' : 'Add Blood Stock'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Edit Blood Stock Modal
const EditBloodStockModal = ({ isOpen, onClose, onSave, stock, isSaving, error }) => {
  const [formData, setFormData] = useState({
    bloodGroup: '',
    count: 0
  });
  const [serverError, setServerError] = useState(null);

  useEffect(() => {
    if (error) {
      setServerError(error);
    }
  }, [error]);

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

  const handleClose = () => {
    setServerError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Edit Blood Stock" size="md">
      <div className="space-y-4">
        {/* ✅ Display server error if provided */}
        {serverError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{serverError}</p>
          </div>
        )}

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
          <Button variant="outline" onClick={handleClose} fullWidth>Cancel</Button>
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
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  
  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBloodStock, setSelectedBloodStock] = useState(null);
  
  // ✅ Error states for modals
  const [addError, setAddError] = useState(null);
  const [editError, setEditError] = useState(null);
  
  // Permission Denied Modal State
  const [showPermissionDenied, setShowPermissionDenied] = useState(false);
  const [permissionDeniedAction, setPermissionDeniedAction] = useState('');
  const [permissionDeniedPermissionId, setPermissionDeniedPermissionId] = useState(null);
  
  // Menu state
  const [activeMenu, setActiveMenu] = useState(null);
  
  // Filter states
  const [bloodGroupFilter, setBloodGroupFilter] = useState('all');

  // Get hospital ID from auth
  const hospitalId = getHospitalId();

  // ✅ API Hooks - WITH hospitalId from auth
  const { 
    data: bloodStocksResponse, 
    isLoading: loading, 
    refetch,
    isFetching
  } = useGetBloodBankQuery({
    hospitalId: hospitalId,
    bloodGroup: bloodGroupFilter !== "all" ? bloodGroupFilter : undefined,
    search_query: searchTerm?.trim() && searchTerm.trim().length >= 2 ? searchTerm : undefined,
  }, {
    skip: !hospitalId, // Skip if no hospital ID
  });

  const [createBloodBank, { isLoading: isAdding }] = useCreateBloodBankMutation();
  const [updateBloodBank, { isLoading: isUpdating }] = useUpdateBloodBankMutation();
  const [deleteBloodBank, { isLoading: isDeleting }] = useDeleteBloodBankMutation();

  // ✅ Register socket event listeners
  useEffect(() => {
    registerBloodBankEvents({
      onStockCreated: async () => {
        showSuccessToast(`New blood stock created!`, 3000);
        await refetch();
      },
      onStockUpdated: async () => {
        showSuccessToast(`Blood stock updated!`, 3000);
        await refetch();
      },
      onStockDeleted: async () => {
        showSuccessToast(`Blood stock deleted!`, 3000);
        await refetch();
      }
    });

    return () => {
      unregisterBloodBankEvents();
    };
  }, [refetch]);

  // Listen for socket connection/disconnection
  useEffect(() => {
    const handleConnect = () => {
      registerBloodBankEvents({
        onStockCreated: async () => {
          showSuccessToast(`New blood stock created!`, 3000);
          await refetch();
        },
        onStockUpdated: async () => {
          showSuccessToast(`Blood stock updated!`, 3000);
          await refetch();
        },
        onStockDeleted: async () => {
          showSuccessToast(`Blood stock deleted!`, 3000);
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

  // Transform data from API response
  const allBloodStocks = transformBloodStockData(bloodStocksResponse?.data || []);
  
  // ✅ FRONTEND SEARCH FILTERING - FALLBACK when API doesn't filter properly
  const filteredBloodStocks = React.useMemo(() => {
    // If no search term or search term is too short, return all data
    if (!searchTerm || searchTerm.trim().length < 2) {
      return allBloodStocks;
    }

    const searchLower = searchTerm.toLowerCase().trim();
    
    return allBloodStocks.filter(item => {
      const searchFields = [
        safeToString(item.formattedId).toLowerCase(),
        safeToString(item.bloodGroup).toLowerCase(),
        safeToString(item.count).toLowerCase()
      ];

      return searchFields.some(field => field.includes(searchLower));
    });
  }, [allBloodStocks, searchTerm]);

  // ✅ Apply blood group filter (frontend fallback)
  const paginatedBloodStocks = React.useMemo(() => {
    let result = filteredBloodStocks;

    // Apply blood group filter
    if (bloodGroupFilter !== 'all') {
      result = result.filter(item => 
        safeToString(item.bloodGroup).toLowerCase() === bloodGroupFilter.toLowerCase()
      );
    }

    return result;
  }, [filteredBloodStocks, bloodGroupFilter]);

  // Pagination
  const totalFilteredItems = paginatedBloodStocks.length;
  const totalFilteredPages = Math.ceil(totalFilteredItems / itemsPerPage);

  // Paginate the filtered results
  const paginatedData = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return paginatedBloodStocks.slice(startIndex, endIndex);
  }, [paginatedBloodStocks, currentPage, itemsPerPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, bloodGroupFilter]);

  // Check if filters are active
  const hasSearchTerm = searchTerm && searchTerm.trim().length >= 2;
  const hasActiveFilters = bloodGroupFilter !== 'all';

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

  // ✅ Search handler - receives value directly from SearchBar
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // ✅ Clear search handler
  const handleClearSearch = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Permission check helper with modal
  const checkPermission = (permissionId, actionName) => {
    if (!hasPermission(permissionId)) {
      setPermissionDeniedAction(actionName);
      setPermissionDeniedPermissionId(permissionId);
      setShowPermissionDenied(true);
      return false;
    }
    return true;
  };

  // ✅ CRUD Handlers with Proper Error Handling
  const handleAddBloodStock = async (newBloodStock) => {
    // Check CREATE permission
    if (!checkPermission(PERMISSIONS.CREATE, 'create blood stock')) {
      return;
    }

    setAddError(null);

    try {
      await createBloodBank({
        bloodGroup: newBloodStock.bloodGroup,
        count: newBloodStock.count
      }).unwrap();
      
      showSuccessToast(`${newBloodStock.bloodGroup} blood stock added successfully!`, 3000);
      await refetch();
      setShowAddModal(false);
      setAddError(null);
    } catch (error) {
      console.error("Error adding blood stock:", error);
      
      // 🔥 FIXED: Properly handle nested error structure
      if (error.data?.error?.details?.length) {
        const messages = error.data.error.details
          .map(detail => detail.message)
          .filter(Boolean);
        setAddError(messages.join(', '));
        showErrorToast(`❌ ${messages.join(', ')}`, 4000);
      } else if (error.data?.error?.message) {
        setAddError(error.data.error.message);
        showErrorToast(`❌ ${error.data.error.message}`, 4000);
      } else if (error.data?.message) {
        setAddError(error.data.message);
        showErrorToast(`❌ ${error.data.message}`, 4000);
      } else {
        setAddError('Failed to add blood stock. Please try again.');
        showErrorToast('Failed to add blood stock. Please try again.', 4000);
      }
    }
  };

  const handleEditBloodStock = async (updatedStock) => {
    // Check EDIT permission
    if (!checkPermission(PERMISSIONS.EDIT, 'edit blood stock')) {
      return;
    }

    setEditError(null);

    try {
      await updateBloodBank({ 
        id: updatedStock.id, 
        data: {
          bloodGroup: updatedStock.bloodGroup,
          count: updatedStock.count
        }
      }).unwrap();
      
      showSuccessToast(`${updatedStock.bloodGroup} blood stock updated successfully!`, 3000);
      await refetch();
      setShowEditModal(false);
      setSelectedBloodStock(null);
      setEditError(null);
    } catch (error) {
      console.error("Error updating blood stock:", error);
      
      // 🔥 FIXED: Properly handle nested error structure
      if (error.data?.error?.details?.length) {
        const messages = error.data.error.details
          .map(detail => detail.message)
          .filter(Boolean);
        setEditError(messages.join(', '));
        showErrorToast(`❌ ${messages.join(', ')}`, 4000);
      } else if (error.data?.error?.message) {
        setEditError(error.data.error.message);
        showErrorToast(`❌ ${error.data.error.message}`, 4000);
      } else if (error.data?.message) {
        setEditError(error.data.message);
        showErrorToast(`❌ ${error.data.message}`, 4000);
      } else {
        setEditError('Failed to update blood stock. Please try again.');
        showErrorToast('Failed to update blood stock. Please try again.', 4000);
      }
    }
  };

  const handleDeleteBloodStock = async () => {
    // Check DELETE permission
    if (!checkPermission(PERMISSIONS.DELETE, 'delete blood stock')) {
      return;
    }

    if (selectedBloodStock) {
      try {
        await deleteBloodBank(selectedBloodStock.id).unwrap();
        
        showSuccessToast(`${selectedBloodStock.bloodGroup} blood stock deleted successfully!`, 3000);
        await refetch();
        
        setShowDeleteModal(false);
        setSelectedBloodStock(null);
      } catch (error) {
        console.error("Error deleting blood stock:", error);
        
        // 🔥 FIXED: Properly handle nested error structure
        if (error.data?.error?.details?.length) {
          const messages = error.data.error.details
            .map(detail => detail.message)
            .filter(Boolean);
          showErrorToast(`❌ ${messages.join(', ')}`, 4000);
        } else if (error.data?.error?.message) {
          showErrorToast(`❌ ${error.data.error.message}`, 4000);
        } else if (error.data?.message) {
          showErrorToast(`❌ ${error.data.message}`, 4000);
        } else {
          showErrorToast('Failed to delete blood stock. Please try again.', 4000);
        }
      }
    }
  };

  const handleViewDetails = (stock) => {
    // Check VIEW permission
    if (!checkPermission(PERMISSIONS.VIEW, 'view blood stock details')) {
      return;
    }
    setSelectedBloodStock(stock);
    setShowViewModal(true);
    setActiveMenu(null);
  };

  const handleEditClick = (stock) => {
    // Check EDIT permission
    if (!checkPermission(PERMISSIONS.EDIT, 'edit blood stock')) {
      setActiveMenu(null);
      return;
    }
    setSelectedBloodStock(stock);
    setEditError(null);
    setShowEditModal(true);
    setActiveMenu(null);
  };

  const handleDeleteClick = (stock) => {
    // Check DELETE permission
    if (!checkPermission(PERMISSIONS.DELETE, 'delete blood stock')) {
      setActiveMenu(null);
      return;
    }
    setSelectedBloodStock(stock);
    setShowDeleteModal(true);
    setActiveMenu(null);
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

  const handleAddClick = () => {
    // Check CREATE permission
    if (!checkPermission(PERMISSIONS.CREATE, 'add blood stock')) {
      return;
    }
    setAddError(null);
    setShowAddModal(true);
  };

  // Updated Export handler with Excel functionality
  const handleExport = () => {
    if (paginatedBloodStocks.length === 0) {
      showErrorToast("No data available to export", 3000);
      return;
    }

    try {
      // Transform data for Excel export
      const exportData = paginatedBloodStocks.map(stock => ({
        'Stock ID': stock.formattedId,
        'Blood Group': stock.bloodGroup,
        'Available Units': stock.count,
        'Last Updated': stock.lastUpdated || new Date().toISOString().split('T')[0]
      }));

      // Generate filename with date
      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `blood_bank_export_${dateStr}`;

      // Export to Excel with column width
      exportToExcel({
        data: exportData,
        fileName: fileName,
        sheetName: "Blood Stock",
        columnWidth: 20
      });

      showSuccessToast(
        `Successfully exported ${exportData.length} blood stock records to Excel!`,
        3000
      );
    } catch (error) {
      console.error("Export error:", error);
      showErrorToast("Failed to export data. Please try again.", 3000);
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalFilteredPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading) {
    return <BloodBankSkeleton />;
  }

  return (
    <>
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
            {/* ✅ Using global SearchBar component */}
            <SearchBar
              placeholder="Search by blood group or ID..."
              value={searchTerm}
              onChange={handleSearchChange}
              onClear={handleClearSearch}
              className="flex-1 max-w-sm"
            />
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
            <button 
              onClick={handleRefresh} 
              className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50 transition-colors"
              disabled={isFetching}
            >
              <RefreshCcw size={16} className={isFetching ? "animate-spin" : ""} />
            </button>

            <button onClick={handleExport} className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50 transition-colors" title="Export to Excel">
              <Download size={16} />
            </button>

            {/* Add Blood Stock Button with Permission Check */}
            <button 
              onClick={handleAddClick} 
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-md flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Plus size={16} /> Add Blood Stock
            </button>
          </div>
        </div>

        {/* No Results - Shows when no blood stock found */}
        {!loading && paginatedBloodStocks.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Droplet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {hasSearchTerm || hasActiveFilters ? 'No blood stock found' : 'No blood stock available'}
            </h3>
            <p className="text-gray-500 mb-4">
              {hasSearchTerm 
                ? `No results found for "${searchTerm}". Try adjusting your search.`
                : hasActiveFilters
                ? 'No blood stock matches the selected filters. Try adjusting your filters.'
                : 'Start by adding a new blood stock.'}
            </p>
          </div>
        )}

        {/* GRID VIEW - Always shown */}
        {paginatedBloodStocks.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {paginatedData.map((stock) => {
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
                            <button onClick={() => handleViewDetails(stock)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                              <Eye size={16} /> View Details
                            </button>
                            <button onClick={() => handleEditClick(stock)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                              <Edit size={16} /> Edit
                            </button>
                            <div className="border-t border-gray-100 my-1"></div>
                            <button onClick={() => handleDeleteClick(stock)} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50 flex items-center gap-2">
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
            {totalFilteredPages > 1 && (
              <div className="mt-6 flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalFilteredPages}
                  onPageChange={handlePageChange}
                  totalItems={totalFilteredItems}
                  itemsPerPage={itemsPerPage}
                  itemLabel="blood stocks"
                  variant="centered"
                />
              </div>
            )}
          </>
        )}

        {/* Modals */}
        <AddBloodStockModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setAddError(null);
          }}
          onSave={handleAddBloodStock}
          isSaving={isAdding}
          error={addError}
        />

        <EditBloodStockModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedBloodStock(null);
            setEditError(null);
          }}
          onSave={handleEditBloodStock}
          stock={selectedBloodStock}
          isSaving={isUpdating}
          error={editError}
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

        {/* Permission Denied Modal */}
        <PermissionDeniedModal
          isOpen={showPermissionDenied}
          onClose={() => setShowPermissionDenied(false)}
          action={permissionDeniedAction}
          permissionId={permissionDeniedPermissionId}
        />
      </div>
    </>
  );
};

export default BloodBank;