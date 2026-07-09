// src/components/super-admin/Categories.jsx

import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  X,
  AlertCircle,
  MoreVertical,
  Image as ImageIcon,
  Upload,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  useGetCategoryQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from '../../../app/service/category';
import { showSuccessToast, showErrorToast } from '../ui/Toast';
import { socket } from '../../socket/socket';
import { registerCategoryEvents, unregisterCategoryEvents } from '../../socket/categoryEvents';
import { uploadToS3, deleteFromS3, getS3ImageUrl } from '../../../app/service/S3';

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
        <span className="font-medium text-gray-700">{totalItems}</span> categories
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

// ================= HELPER FUNCTIONS =================

// Convert string to Title Case (capitalize every word)
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

// Get S3 image URL with cache busting
const getImageUrlWithCache = (imageUrl) => {
  if (!imageUrl) return null;
  const url = getS3ImageUrl(imageUrl);
  if (!url) return null;
  // Add cache busting timestamp
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_t=${Date.now()}`;
};

// ================= IMAGE UPLOAD COMPONENT =================

const ImageUpload = ({ 
  imageUrl, 
  onImageChange, 
  onImageRemove, 
  isUploading,
  label = "Category Image",
  disabled = false
}) => {
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showErrorToast('Please select an image file', 3000);
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showErrorToast('Image size should be less than 5MB', 3000);
      return;
    }

    onImageChange(file);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      
      <div className="flex items-start gap-4">
        {/* Image Preview */}
        <div className="relative w-24 h-24 flex-shrink-0">
          {imageUrl ? (
            <div className="relative w-full h-full">
              <img
                src={imageUrl}
                alt="Category"
                className="w-full h-full object-cover rounded-lg border border-gray-200"
              />
              <button
                type="button"
                onClick={onImageRemove}
                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                disabled={isUploading || disabled}
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="w-full h-full border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
              <ImageIcon className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* Upload Button */}
        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading || disabled}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || disabled}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#154A7D] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isUploading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#154A7D]"></span>
                Uploading...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Upload size={16} />
                {imageUrl ? 'Change Image' : 'Upload Image'}
              </span>
            )}
          </button>
          <p className="mt-1 text-xs text-gray-500">PNG, JPG, WEBP (Max 5MB)</p>
        </div>
      </div>
    </div>
  );
};

// ================= DELETE CONFIRMATION MODAL =================

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, categoryName, isDeleting }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <Trash2 size={24} className="text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Delete Category</h3>
            <p className="text-sm text-gray-500">This action cannot be undone</p>
          </div>
        </div>

        <p className="text-gray-600 mb-6">
          Are you sure you want to delete "<span className="font-semibold">{categoryName}</span>"? 
          This will permanently remove the category and all associated data.
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const Categories = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  
  // ✅ Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  
  const [eventsRegistered, setEventsRegistered] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    isActive: true,
    imageUrl: null
  });

  // Image upload states
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);

  // ✅ Added limit: 1000 to fetch all categories
  const { 
    data: categoriesData, 
    isLoading, 
    error, 
    refetch,
    isFetching
  } = useGetCategoryQuery({
    search_query: searchTerm || undefined,
    sortBy: 'name',
    sortOrder: 'asc',
    limit: 1000 // ✅ Set limit to 1000 to get all categories
  });

  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteCategoryMutation();

  // Register socket event listeners
  useEffect(() => {
    registerCategoryEvents({
      onCategoryRegistered: (data) => {
        showSuccessToast(`New category "${data.name || 'Category'}" created!`, 3000);
        refetch();
      },
      onCategoryUpdated: (data) => {
        showSuccessToast(`Category "${data.name || 'Category'}" updated!`, 3000);
        refetch();
      },
      onCategoryDeleted: () => {
        showSuccessToast(`Category deleted!`, 3000);
        refetch();
      }
    });

    setEventsRegistered(true);

    return () => {
      unregisterCategoryEvents();
      setEventsRegistered(false);
    };
  }, [refetch]);

  // Listen for socket connection
  useEffect(() => {
    const handleConnect = () => {
      if (!eventsRegistered) {
        registerCategoryEvents({
          onCategoryRegistered: (data) => {
            showSuccessToast(`New category "${data.name || 'Category'}" created!`, 3000);
            refetch();
          },
          onCategoryUpdated: (data) => {
            showSuccessToast(`Category "${data.name || 'Category'}" updated!`, 3000);
            refetch();
          },
          onCategoryDeleted: () => {
            showSuccessToast(`Category deleted!`, 3000);
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

  // Click outside handler using class-based approach
  useEffect(() => {
    const handleClickOutside = (event) => {
      const menuContainer = event.target.closest('.category-menu-container');
      if (!menuContainer) {
        setOpenMenuId(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ✅ Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const categories = categoriesData?.data && Array.isArray(categoriesData.data) 
    ? categoriesData.data 
    : [];

  // ✅ Client-side filtering and pagination
  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ✅ Client-side pagination
  const paginatedCategories = filteredCategories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalItems = filteredCategories.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Helper to get category ID (handles both `id` and `_id`)
  const getCategoryId = (category) => {
    if (!category) return null;
    return category.id || category._id || null;
  };

  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      isActive: true,
      imageUrl: null
    });
    setImageFile(null);
    setImagePreview(null);
    setRemoveExistingImage(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (category) => {
    console.log("📝 Opening edit modal for category:", category);
    const categoryId = getCategoryId(category);
    console.log("📝 Category ID:", categoryId);
    
    if (!categoryId) {
      showErrorToast("❌ Invalid category ID", 3000);
      return;
    }
    
    // Use cache-busted URL for preview
    const existingImageUrl = category.imageUrl ? getImageUrlWithCache(category.imageUrl) : null;
    
    setEditingCategory(category);
    setFormData({
      name: category.name || '',
      isActive: category.isActive !== undefined ? category.isActive : true,
      imageUrl: category.imageUrl || null
    });
    setImagePreview(existingImageUrl);
    setImageFile(null);
    setRemoveExistingImage(false);
    setIsModalOpen(true);
    setOpenMenuId(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      isActive: true,
      imageUrl: null
    });
    setImageFile(null);
    setImagePreview(null);
    setRemoveExistingImage(false);
  };

  const handleImageChange = async (file) => {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setRemoveExistingImage(false);
  };

  const handleImageRemove = () => {
    if (formData.imageUrl) {
      setRemoveExistingImage(true);
      setImagePreview(null);
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Only handle image upload if editing (has imageFile or removeExistingImage)
      let finalImageUrl = formData.imageUrl;
      const categoryId = editingCategory ? getCategoryId(editingCategory) : null;

      if (editingCategory) {
        // Handle image removal
        if (removeExistingImage && formData.imageUrl) {
          await deleteFromS3(formData.imageUrl, categoryId, "category");
          finalImageUrl = null;
        }

        // Upload new image if selected
        if (imageFile) {
          // Delete existing image if it exists (and not already removed)
          if (formData.imageUrl && !removeExistingImage) {
            await deleteFromS3(formData.imageUrl, categoryId, "category");
          }
          
          setIsUploading(true);
          const uploadResult = await uploadToS3(
            imageFile,
            null,
            categoryId,
            "category"
          );
          finalImageUrl = uploadResult.key;
          console.log("✅ Image uploaded:", finalImageUrl);
        }
      }

      const categoryData = {
        name: formData.name,
        isActive: formData.isActive,
        ...(editingCategory && { imageUrl: finalImageUrl }) // Only include imageUrl for edit
      };

      if (editingCategory) {
        const id = getCategoryId(editingCategory);
        console.log("🔄 Updating category:", id, categoryData);
        
        await updateCategory({
          id: id,
          data: categoryData
        }).unwrap();
        
        socket.emit("category_event", {
          event: "CATEGORY_UPDATED",
          data: {
            categoryId: id,
            name: formData.name,
            isActive: formData.isActive,
            imageUrl: finalImageUrl,
            timestamp: new Date().toISOString()
          }
        });
        
        showSuccessToast(`✅ Category "${toTitleCase(formData.name)}" updated successfully!`);
      } else {
        const response = await createCategory(categoryData).unwrap();
        const newId = getCategoryId(response.data) || response.id;
        
        socket.emit("category_event", {
          event: "CATEGORY_REGISTERED",
          data: {
            categoryId: newId,
            name: formData.name,
            isActive: formData.isActive,
            timestamp: new Date().toISOString()
          }
        });
        
        showSuccessToast(`✅ Category "${toTitleCase(formData.name)}" created successfully!`);
      }
      
      // Reset image states
      setImageFile(null);
      setImagePreview(null);
      setRemoveExistingImage(false);
      
      handleCloseModal();
      
      // Force refetch with cache busting
      await refetch();
      
    } catch (error) {
      console.error("❌ Submit error:", error);
      const errorMessage = error.data?.message || 'Failed to save category. Please try again.';
      showErrorToast(`❌ ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Open delete confirmation modal
  const handleDeleteClick = (category) => {
    setOpenMenuId(null);
    setCategoryToDelete(category);
    setIsDeleteModalOpen(true);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;

    console.log("🗑️ Delete category:", categoryToDelete);
    
    try {
      const categoryId = getCategoryId(categoryToDelete);
      console.log("🗑️ Category ID:", categoryId);
      
      if (!categoryId) {
        showErrorToast("❌ Invalid category ID", 3000);
        setIsDeleteModalOpen(false);
        setCategoryToDelete(null);
        return;
      }
      
      // Delete image from S3 if exists
      if (categoryToDelete.imageUrl) {
        await deleteFromS3(categoryToDelete.imageUrl, categoryId, "category");
      }
      
      await deleteCategory(categoryId).unwrap();
      
      socket.emit("category_event", {
        event: "CATEGORY_DELETED",
        data: {
          categoryId: categoryId,
          name: categoryToDelete.name,
          timestamp: new Date().toISOString()
        }
      });
      
      showSuccessToast(`✅ Category "${toTitleCase(categoryToDelete.name)}" deleted successfully!`);
      setIsDeleteModalOpen(false);
      setCategoryToDelete(null);
      refetch();
    } catch (error) {
      console.error("❌ Delete error:", error);
      const errorMessage = error.data?.message || 'Failed to delete category. Please try again.';
      showErrorToast(`❌ ${errorMessage}`);
      setIsDeleteModalOpen(false);
      setCategoryToDelete(null);
    }
  };

  // Cancel delete
  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setCategoryToDelete(null);
  };

  const handleToggleStatus = async (category) => {
    console.log("🔄 Toggle status:", category);
    setOpenMenuId(null);
    
    const newStatus = !category.isActive;
    const action = newStatus ? 'activate' : 'deactivate';

    try {
      const categoryId = getCategoryId(category);
      
      if (!categoryId) {
        showErrorToast("❌ Invalid category ID", 3000);
        return;
      }
      
      await updateCategory({
        id: categoryId,
        data: { isActive: newStatus }
      }).unwrap();
      
      socket.emit("category_event", {
        event: "CATEGORY_UPDATED",
        data: {
          categoryId: categoryId,
          name: category.name,
          isActive: newStatus,
          timestamp: new Date().toISOString()
        }
      });
      
      showSuccessToast(`✅ Category "${toTitleCase(category.name)}" ${action}d successfully!`);
      refetch();
    } catch (error) {
      console.error("❌ Toggle status error:", error);
      const errorMessage = error.data?.message || `Failed to ${action} category. Please try again.`;
      showErrorToast(`❌ ${errorMessage}`);
    }
  };

  const toggleMenu = (categoryId) => {
    console.log("🔄 Toggle menu for ID:", categoryId, "Current open:", openMenuId);
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
      {!isLoading && !error && categories.length === 0 && !searchTerm && (
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

      {/* No Results for Search */}
      {!isLoading && !error && categories.length > 0 && filteredCategories.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Results Found</h3>
          <p className="text-gray-500">No categories match your search term "{searchTerm}"</p>
        </div>
      )}

      {/* Categories Grid */}
      {!isLoading && !error && filteredCategories.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedCategories.map((category) => {
              // Use cache-busted URL for image
              const imageUrl = category.imageUrl ? getImageUrlWithCache(category.imageUrl) : null;
              const categoryId = getCategoryId(category);
              
              return (
                <div
                  key={categoryId || Math.random().toString()}
                  className="group bg-white rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 relative"
                >
                  {/* Three-Dot Menu - Top Right */}
                  <div className="absolute top-3 right-3 category-menu-container">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMenu(categoryId);
                      }}
                      className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                      title="More options"
                    >
                      <MoreVertical size={18} className="text-gray-600" />
                    </button>

                    {/* Dropdown Menu */}
                    {openMenuId === categoryId && (
                      <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 category-menu-dropdown">
                        {/* Edit */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditModal(category);
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors duration-150"
                        >
                          <Edit2 size={16} className="text-blue-600" />
                          <span>Edit</span>
                        </button>

                        {/* Delete */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(category);
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors duration-150 text-red-600"
                        >
                          <Trash2 size={16} />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-center mt-4">
                    {/* Category Image or Initial */}
                    {imageUrl ? (
                      <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-gray-200 mb-4">
                        <img 
                          src={imageUrl} 
                          alt={category.name} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // If image fails to load, try without cache busting
                            const fallbackUrl = getS3ImageUrl(category.imageUrl);
                            if (fallbackUrl && e.target.src !== fallbackUrl) {
                              e.target.src = fallbackUrl;
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div 
                        className="w-32 h-32 rounded-full flex items-center justify-center mb-4 text-5xl font-bold text-white"
                        style={{ backgroundColor: getInitialColor(category.name) }}
                      >
                        <span>{category.name.charAt(0).toUpperCase()}</span>
                      </div>
                    )}

                    {/* Category Name - Title Case */}
                    <h3 className="text-xl font-semibold text-gray-800 text-center mb-1">
                      {toTitleCase(category.name)}
                    </h3>

                    {/* Status Badge */}
                    <div className="mt-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        category.isActive 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {category.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ✅ Pagination - Simplified with < Prev 1 Next > */}
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
                {/* Image Upload - Only show when editing */}
                {editingCategory && (
                  <ImageUpload
                    imageUrl={imagePreview}
                    onImageChange={handleImageChange}
                    onImageRemove={handleImageRemove}
                    isUploading={isUploading}
                    label="Category Image"
                  />
                )}

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

                {/* Status */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-[#154A7D] border-gray-300 rounded focus:ring-[#154A7D]"
                  />
                  <label className="text-sm text-gray-700">
                    Active
                  </label>
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
                    disabled={isCreating || isUpdating || isUploading}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {(isCreating || isUpdating || isUploading) && (
                      <Loader2 size={18} className="animate-spin" />
                    )}
                    {isUploading ? 'Uploading...' : editingCategory ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        categoryName={categoryToDelete ? toTitleCase(categoryToDelete.name) : ''}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default Categories;