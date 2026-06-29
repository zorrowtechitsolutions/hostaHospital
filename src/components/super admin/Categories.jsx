// src/components/super-admin/Categories.jsx
import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  X,
  AlertCircle,
  MoreVertical
} from 'lucide-react';
import {
  useGetCategoryQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from '../../../app/service/category';
import { showSuccessToast, showErrorToast } from '../ui/Toast';

// ✅ Import socket
import { socket } from '../../socket/socket';
// ✅ Import socket event listeners
import { registerCategoryEvents, unregisterCategoryEvents } from '../../socket/categoryEvents';

const Categories = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);
  
  // ✅ Track if events are registered
  const [eventsRegistered, setEventsRegistered] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    color: '#154A7D',
    isActive: true,
    parentCategoryId: null
  });

  // API hooks
  const { 
    data: categoriesData, 
    isLoading, 
    error, 
    refetch 
  } = useGetCategoryQuery({
    search_query: searchTerm || undefined,
    sortBy: 'name',
    sortOrder: 'asc'
  });

  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteCategoryMutation();

  // ✅ Register socket event listeners for category events
  useEffect(() => {
    console.log("🔄 Registering category event listeners...");
    console.log("📡 Socket connected:", socket.connected);
    
    registerCategoryEvents({
      onCategoryRegistered: (data) => {
        console.log("📁 NEW CATEGORY REGISTERED:", data);
        showSuccessToast(`New category "${data.name || 'Category'}" created!`, 3000);
        refetch();
      },
      
      onCategoryUpdated: (data) => {
        console.log("✏️ CATEGORY UPDATED:", data);
        showSuccessToast(`Category "${data.name || 'Category'}" updated!`, 3000);
        refetch();
      },
      
      onCategoryDeleted: (data) => {
        console.log("🗑️ CATEGORY DELETED:", data);
        showSuccessToast(`Category deleted!`, 3000);
        refetch();
      }
    });

    setEventsRegistered(true);

    return () => {
      console.log("🧹 Unregistering category events...");
      unregisterCategoryEvents();
      setEventsRegistered(false);
    };
  }, [refetch]);

  // ✅ Listen for socket connection/disconnection
  useEffect(() => {
    const handleConnect = () => {
      console.log("✅ Socket CONNECTED - Category events will work!");
      if (!eventsRegistered) {
        registerCategoryEvents({
          onCategoryRegistered: (data) => {
            console.log("📁 NEW CATEGORY REGISTERED (reconnect):", data);
            showSuccessToast(`New category "${data.name || 'Category'}" created!`, 3000);
            refetch();
          },
          onCategoryUpdated: (data) => {
            console.log("✏️ CATEGORY UPDATED (reconnect):", data);
            showSuccessToast(`Category "${data.name || 'Category'}" updated!`, 3000);
            refetch();
          },
          onCategoryDeleted: (data) => {
            console.log("🗑️ CATEGORY DELETED (reconnect):", data);
            showSuccessToast(`Category deleted!`, 3000);
            refetch();
          }
        });
        setEventsRegistered(true);
      }
    };

    const handleDisconnect = () => {
      console.log("❌ Socket DISCONNECTED - Category events won't work!");
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
      console.log(`📡 ALL SOCKET EVENTS - CATEGORY: ${event}:`, args);
    };

    socket.onAny(handleAnyEvent);

    return () => {
      socket.offAny(handleAnyEvent);
    };
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Extract categories from response
  const categories = categoriesData?.data && Array.isArray(categoriesData.data) 
    ? categoriesData.data 
    : [];

  // Handle search
  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle modal open for create
  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      icon: '',
      color: '#154A7D',
      isActive: true,
      parentCategoryId: null
    });
    setIsModalOpen(true);
  };

  // Handle modal open for edit
  const handleOpenEditModal = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || '',
      description: category.description || '',
      icon: category.icon || '',
      color: category.color || '#154A7D',
      isActive: category.isActive !== undefined ? category.isActive : true,
      parentCategoryId: category.parentCategoryId || null
    });
    setIsModalOpen(true);
    setOpenMenuId(null);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      icon: '',
      color: '#154A7D',
      isActive: true,
      parentCategoryId: null
    });
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle form submit (create/update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let response;
      if (editingCategory) {
        // Update existing category
        response = await updateCategory({
          id: editingCategory._id || editingCategory.id,
          data: formData
        }).unwrap();
        
        // ✅ Emit socket event for category updated
        socket.emit("category_event", {
          event: "CATEGORY_UPDATED",
          data: {
            categoryId: editingCategory._id || editingCategory.id,
            name: formData.name,
            description: formData.description,
            icon: formData.icon,
            color: formData.color,
            isActive: formData.isActive,
            timestamp: new Date().toISOString()
          }
        });
        
        showSuccessToast(`✅ Category "${formData.name}" updated successfully!`);
        console.log('Category updated:', response);
      } else {
        // Create new category
        response = await createCategory(formData).unwrap();
        
        // ✅ Emit socket event for category registered
        socket.emit("category_event", {
          event: "CATEGORY_REGISTERED",
          data: {
            categoryId: response.data?._id || response.data?.id || response.id,
            name: formData.name,
            description: formData.description,
            icon: formData.icon,
            color: formData.color,
            isActive: formData.isActive,
            timestamp: new Date().toISOString()
          }
        });
        
        showSuccessToast(`✅ Category "${formData.name}" created successfully!`);
        console.log('Category created:', response);
      }
      
      handleCloseModal();
      refetch(); // Refresh the list
      
    } catch (error) {
      console.error('Error saving category:', error);
      const errorMessage = error.data?.message || 'Failed to save category. Please try again.';
      showErrorToast(`❌ ${errorMessage}`);
    }
  };

  // Handle delete category
  const handleDelete = async (category) => {
    setOpenMenuId(null);
    if (!window.confirm(`Are you sure you want to delete "${category.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await deleteCategory(category._id || category.id).unwrap();
      
      // ✅ Emit socket event for category deleted
      socket.emit("category_event", {
        event: "CATEGORY_DELETED",
        data: {
          categoryId: category._id || category.id,
          name: category.name,
          timestamp: new Date().toISOString()
        }
      });
      
      showSuccessToast(`✅ Category "${category.name}" deleted successfully!`);
      console.log('Category deleted:', response);
      refetch();
    } catch (error) {
      console.error('Error deleting category:', error);
      const errorMessage = error.data?.message || 'Failed to delete category. Please try again.';
      showErrorToast(`❌ ${errorMessage}`);
    }
  };

  // ✅ Handle toggle status (active/inactive)
  const handleToggleStatus = async (category) => {
    setOpenMenuId(null);
    const newStatus = !category.isActive;
    const action = newStatus ? 'activate' : 'deactivate';

    try {
      // Use updateCategory to toggle status
      const response = await updateCategory({
        id: category._id || category.id,
        data: { isActive: newStatus }
      }).unwrap();
      
      // ✅ Emit socket event for category updated
      socket.emit("category_event", {
        event: "CATEGORY_UPDATED",
        data: {
          categoryId: category._id || category.id,
          name: category.name,
          isActive: newStatus,
          timestamp: new Date().toISOString()
        }
      });
      
      showSuccessToast(`✅ Category "${category.name}" ${action}d successfully!`);
      console.log('Status toggled:', response);
      refetch();
    } catch (error) {
      console.error('Error toggling status:', error);
      const errorMessage = error.data?.message || `Failed to ${action} category. Please try again.`;
      showErrorToast(`❌ ${errorMessage}`);
    }
  };

  // Get random color for icon placeholder
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

  // Toggle menu
  const toggleMenu = (categoryId) => {
    setOpenMenuId(openMenuId === categoryId ? null : categoryId);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Categories Management</h1>
            <p className="text-sm text-gray-500 mt-1">Manage medical categories across the platform</p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Plus size={20} />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#154A7D] focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={40} className="animate-spin text-[#154A7D]" />
          <span className="ml-3 text-gray-600">Loading categories...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="text-red-500" size={24} />
          <div>
            <p className="text-red-700 font-medium">Error loading categories</p>
            <p className="text-red-600 text-sm">{error.data?.message || 'Failed to load categories. Please try again.'}</p>
            <button
              onClick={() => refetch()}
              className="mt-2 text-sm text-red-700 underline hover:text-red-900"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* No Categories State */}
      {!isLoading && !error && categories.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-6xl mb-4">📂</div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Categories Found</h3>
          <p className="text-gray-500 mb-4">Start by adding your first category</p>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Add Category
          </button>
        </div>
      )}

      {/* Categories Grid */}
      {!isLoading && !error && categories.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCategories.map((category) => (
            <div
              key={category._id || category.id}
              className="group bg-white rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 relative"
            >
              {/* Three-Dot Menu - Top Right */}
              <div className="absolute top-3 right-3" ref={menuRef}>
                <button
                  onClick={() => toggleMenu(category._id || category.id)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                  title="More options"
                >
                  <MoreVertical size={18} className="text-gray-600" />
                </button>

                {/* Dropdown Menu */}
                {openMenuId === (category._id || category.id) && (
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">

                    {/* Edit */}
                    <button
                      onClick={() => handleOpenEditModal(category)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors duration-150"
                    >
                      <Edit2 size={16} className="text-blue-600" />
                      <span>Edit</span>
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(category)}
                      disabled={isDeleting}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors duration-150 text-red-600 disabled:opacity-50"
                    >
                      {isDeleting ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center mt-4">
                {/* Circular Icon Area */}
                <div 
                  className="w-32 h-32 rounded-full flex items-center justify-center mb-4 text-5xl font-bold text-white"
                  style={{ backgroundColor: category.color || getInitialColor(category.name) }}
                >
                  {category.icon ? (
                    <span className="text-4xl">{category.icon}</span>
                  ) : (
                    <span>{category.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>

                {/* Category Name */}
                <h3 className="text-xl font-semibold text-gray-800 text-center mb-1">
                  {category.name}
                </h3>

                {/* Description */}
                {category.description && (
                  <p className="text-sm text-gray-500 text-center line-clamp-2">
                    {category.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter category name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#154A7D] focus:border-transparent outline-none"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter category description"
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#154A7D] focus:border-transparent outline-none resize-none"
                  />
                </div>

                {/* Form Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating || isUpdating}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {(isCreating || isUpdating) && (
                      <Loader2 size={18} className="animate-spin" />
                    )}
                    {editingCategory ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;