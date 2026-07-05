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
  MoreVertical,
  Image as ImageIcon,
  Upload,
  FolderOpen,
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

// ================= HELPER FUNCTIONS =================

// Convert string to Title Case (capitalize every word)
const toTitleCase = (text = "") => {
  if (!text) return "";
  return text.replace(/\w\S*/g, (word) =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  );
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

const Categories = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);
  
  const [eventsRegistered, setEventsRegistered] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    color: '#154A7D',
    isActive: true,
    parentCategoryId: null,
    imageUrl: null
  });

  // Image upload states
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const categories = categoriesData?.data && Array.isArray(categoriesData.data) 
    ? categoriesData.data 
    : [];

  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      icon: '',
      color: '#154A7D',
      isActive: true,
      parentCategoryId: null,
      imageUrl: null
    });
    setImageFile(null);
    setImagePreview(null);
    setRemoveExistingImage(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (category) => {
    const existingImageUrl = category.imageUrl ? getS3ImageUrl(category.imageUrl) : null;
    
    setEditingCategory(category);
    setFormData({
      name: category.name || '',
      description: category.description || '',
      icon: category.icon || '',
      color: category.color || '#154A7D',
      isActive: category.isActive !== undefined ? category.isActive : true,
      parentCategoryId: category.parentCategoryId || null,
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
      description: '',
      icon: '',
      color: '#154A7D',
      isActive: true,
      parentCategoryId: null,
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
      // If there's an existing image, mark it for removal
      setRemoveExistingImage(true);
      setImagePreview(null);
    } else {
      // If it's a new image, just clear it
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
      setIsUploading(true);
      
      let finalImageUrl = formData.imageUrl;

      // Handle image removal
      if (removeExistingImage && formData.imageUrl) {
        // ✅ Delete from S3 with category role
        await deleteFromS3(formData.imageUrl, "categories", "category");
        finalImageUrl = null;
      }

      // Upload new image if selected
      if (imageFile) {
        // Delete existing image if it exists (and not already removed)
        if (formData.imageUrl && !removeExistingImage) {
          await deleteFromS3(formData.imageUrl, "categories", "category");
        }
        
        // ✅ Upload new image with category role
        const uploadResult = await uploadToS3(
          imageFile,
          null,
          "categories",  // ✅ ID for categories folder
          "category"     // ✅ Role for category
        );
        finalImageUrl = uploadResult.key;
      }

      const categoryData = {
        name: formData.name,
        description: formData.description,
        icon: formData.icon,
        color: formData.color,
        isActive: formData.isActive,
        parentCategoryId: formData.parentCategoryId,
        imageUrl: finalImageUrl
      };

      if (editingCategory) {
        await updateCategory({
          id: editingCategory._id || editingCategory.id,
          data: categoryData
        }).unwrap();
        
        socket.emit("category_event", {
          event: "CATEGORY_UPDATED",
          data: {
            categoryId: editingCategory._id || editingCategory.id,
            name: formData.name,
            description: formData.description,
            icon: formData.icon,
            color: formData.color,
            isActive: formData.isActive,
            imageUrl: finalImageUrl,
            timestamp: new Date().toISOString()
          }
        });
        
        showSuccessToast(`✅ Category "${formData.name}" updated successfully!`);
      } else {
        const response = await createCategory(categoryData).unwrap();
        
        socket.emit("category_event", {
          event: "CATEGORY_REGISTERED",
          data: {
            categoryId: response.data?._id || response.data?.id || response.id,
            name: formData.name,
            description: formData.description,
            icon: formData.icon,
            color: formData.color,
            isActive: formData.isActive,
            imageUrl: finalImageUrl,
            timestamp: new Date().toISOString()
          }
        });
        
        showSuccessToast(`✅ Category "${formData.name}" created successfully!`);
      }
      
      // Reset image states
      setImageFile(null);
      setImagePreview(null);
      setRemoveExistingImage(false);
      
      handleCloseModal();
      refetch();
      
    } catch (error) {
      const errorMessage = error.data?.message || 'Failed to save category. Please try again.';
      showErrorToast(`❌ ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (category) => {
    setOpenMenuId(null);
    if (!window.confirm(`Are you sure you want to delete "${category.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      // ✅ Delete image from S3 if exists
      if (category.imageUrl) {
        await deleteFromS3(category.imageUrl, "categories", "category");
      }
      
      await deleteCategory(category._id || category.id).unwrap();
      
      socket.emit("category_event", {
        event: "CATEGORY_DELETED",
        data: {
          categoryId: category._id || category.id,
          name: category.name,
          timestamp: new Date().toISOString()
        }
      });
      
      showSuccessToast(`✅ Category "${category.name}" deleted successfully!`);
      refetch();
    } catch (error) {
      const errorMessage = error.data?.message || 'Failed to delete category. Please try again.';
      showErrorToast(`❌ ${errorMessage}`);
    }
  };

  const handleToggleStatus = async (category) => {
    setOpenMenuId(null);
    const newStatus = !category.isActive;
    const action = newStatus ? 'activate' : 'deactivate';

    try {
      await updateCategory({
        id: category._id || category.id,
        data: { isActive: newStatus }
      }).unwrap();
      
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
      refetch();
    } catch (error) {
      const errorMessage = error.data?.message || `Failed to ${action} category. Please try again.`;
      showErrorToast(`❌ ${errorMessage}`);
    }
  };

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
          {filteredCategories.map((category) => {
            const imageUrl = category.imageUrl ? getS3ImageUrl(category.imageUrl) : null;
            
            return (
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
                  {/* Category Image or Icon */}
                  {imageUrl ? (
                    <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-gray-200 mb-4">
                      <img src={imageUrl} alt={category.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
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
                  )}

                  {/* Category Name */}
                  <h3 className="text-xl font-semibold text-gray-800 text-center mb-1">
                    {toTitleCase(category.name)}
                  </h3>

                  {/* Description */}
                  {category.description && (
                    <p className="text-sm text-gray-500 text-center line-clamp-2">
                      {category.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
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
                {/* Image Upload */}
                <ImageUpload
                  imageUrl={imagePreview}
                  onImageChange={handleImageChange}
                  onImageRemove={handleImageRemove}
                  isUploading={isUploading}
                  label="Category Image (Optional)"
                />

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

                {/* Icon */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Icon (Emoji)
                  </label>
                  <input
                    type="text"
                    name="icon"
                    value={formData.icon}
                    onChange={handleInputChange}
                    placeholder="Enter emoji icon (e.g., 🏥)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#154A7D] focus:border-transparent outline-none"
                  />
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      name="color"
                      value={formData.color}
                      onChange={handleInputChange}
                      className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      name="color"
                      value={formData.color}
                      onChange={handleInputChange}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#154A7D] focus:border-transparent outline-none"
                    />
                  </div>
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
    </div>
  );
};

export default Categories;