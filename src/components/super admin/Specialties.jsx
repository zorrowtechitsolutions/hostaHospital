// src/components/super-admin/Specialties.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stethoscope,
  Plus,
  Edit,
  Trash2,
  Search,
  Eye,
  MoreVertical,
  RefreshCcw,
  Download,
  Image as ImageIcon,
  Upload,
  X,
  FolderOpen,
} from 'lucide-react';
import { Card, Button, Modal, Badge, Pagination, Input } from '../ui';
import DeleteModal from '../patients/DeleteModel';
import { showSuccessToast, showErrorToast } from '../ui/Toast';
import {
  useGetSpecialitiesQuery,
  useRegisterSpecialityMutation,
  useUpdateSpecialityMutation,
  useDeleteSpecialityMutation,
} from '../../../app/service/speciality';
import { socket } from '../../socket/socket';
import { registerSpecialityEvents, unregisterSpecialityEvents } from '../../socket/specialityEvents';
import { uploadToS3, deleteFromS3, getS3ImageUrl } from '../../../app/service/S3';

// ================= HELPER FUNCTIONS =================

// Helper function to format date
const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Capitalize the first letter of a string
const capitalizeFirstLetter = (text = "") => {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
};

// Convert string to Title Case (capitalize every word)
const toTitleCase = (text = "") => {
  if (!text) return "";
  return text.replace(/\w\S*/g, (word) =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  );
};

// Get S3 image URL with cache busting
const getImageUrlWithCache = (imageUrl) => {
  if (!imageUrl) return null;
  const url = getS3ImageUrl(imageUrl);
  if (!url) return null;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_t=${Date.now()}`;
};

// ================= IMAGE UPLOAD COMPONENT =================

const ImageUpload = ({ 
  imageUrl, 
  onImageChange, 
  onImageRemove, 
  isUploading,
  label = "Speciality Image",
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
                alt="Speciality"
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1C62A0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isUploading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1C62A0]"></span>
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

// ================= MODAL COMPONENTS =================

// View Speciality Modal
const ViewSpecialityModal = ({ isOpen, onClose, speciality }) => {
  if (!speciality) return null;

  const imageUrl = speciality.imageUrl ? getImageUrlWithCache(speciality.imageUrl) : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Speciality Details" size="md">
      <div className="space-y-4">
        <div className="flex justify-center mb-4">
          {imageUrl ? (
            <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-green-200">
              <img src={imageUrl} alt={speciality.name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-32 h-32 bg-gradient-to-br from-green-50 to-green-100 rounded-full flex items-center justify-center border-2 border-green-200">
              <FolderOpen className="w-16 h-16 text-green-500" />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500">Speciality ID</label>
            <p className="text-sm font-semibold text-gray-800">#{speciality.id}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Status</label>
            <Badge variant={speciality.isActive ? 'success' : 'danger'}>
              {speciality.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-500">Speciality Name</label>
            <p className="text-sm text-gray-800 font-medium">{toTitleCase(speciality.name)}</p>
          </div>
          {speciality.imageUrl && (
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500">Image URL</label>
              <p className="text-sm text-gray-600 truncate">{imageUrl}</p>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-500">Created At</label>
            <p className="text-sm text-gray-600">{formatDate(speciality.createdAt)}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Last Updated</label>
            <p className="text-sm text-gray-600">{formatDate(speciality.updatedAt)}</p>
          </div>
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} fullWidth>Close</Button>
        </div>
      </div>
    </Modal>
  );
};

// Add Speciality Modal
const AddSpecialityModal = ({ isOpen, onClose, onSave, isSaving }) => {
  const [formData, setFormData] = useState({
    name: '',
    isActive: true
  });
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        isActive: true
      });
      setImageFile(null);
      setImagePreview(null);
    }
  }, [isOpen]);

  const handleImageChange = async (file) => {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleImageRemove = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      showErrorToast('Speciality name is required', 3000);
      return;
    }

    try {
      setIsUploading(true);
      
      let imageKey = null;

      // Upload image if selected
      if (imageFile) {
        // ✅ For specialities, use role "speciality" and id null (new speciality)
        const uploadResult = await uploadToS3(
          imageFile,
          null,
          null,        // ✅ Pass null for new speciality
          "speciality" // ✅ Role for speciality
        );
        imageKey = uploadResult.key;
      }

      const specialityData = {
        name: formData.name,
        isActive: formData.isActive,
        imageUrl: imageKey
      };

      await onSave(specialityData);
      
      // Clean up
      setImageFile(null);
      setImagePreview(null);
      
    } catch (error) {
      showErrorToast(error?.message || 'Failed to upload image', 3000);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Speciality" size="lg">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto px-2">
        <div className="flex items-center gap-3 mb-2 pb-2 border-b border-gray-100">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
            <FolderOpen className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-md font-semibold text-gray-800">Add New Speciality</h3>
            <p className="text-xs text-gray-500">Enter speciality details</p>
          </div>
        </div>

        <ImageUpload
          imageUrl={imagePreview}
          onImageChange={handleImageChange}
          onImageRemove={handleImageRemove}
          isUploading={isUploading}
          label="Speciality Image (Optional)"
        />

        <Input
          label="Speciality Name *"
          name="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter speciality name (e.g., Cardiology)"
          required
        />

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onClose} fullWidth>Cancel</Button>
          <Button 
            variant="primary" 
            onClick={handleSubmit} 
            disabled={isSaving || isUploading} 
            loading={isSaving || isUploading} 
            fullWidth
          >
            {isUploading ? 'Uploading Image...' : isSaving ? 'Adding...' : 'Add Speciality'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Edit Speciality Modal
const EditSpecialityModal = ({ isOpen, onClose, onSave, speciality, isSaving }) => {
  const [formData, setFormData] = useState({
    name: '',
    isActive: true,
    imageUrl: null
  });
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);

  useEffect(() => {
    if (speciality && isOpen) {
      const existingImageUrl = speciality.imageUrl ? getImageUrlWithCache(speciality.imageUrl) : null;
      
      setFormData({
        name: speciality.name || '',
        isActive: speciality.isActive !== undefined ? speciality.isActive : true,
        imageUrl: speciality.imageUrl || null
      });
      setImagePreview(existingImageUrl);
      setRemoveExistingImage(false);
      setImageFile(null);
    }
  }, [speciality, isOpen]);

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

  const handleSubmit = async () => {
    if (!formData.name) {
      showErrorToast('Speciality name is required', 3000);
      return;
    }

    try {
      setIsUploading(true);
      
      let finalImageUrl = formData.imageUrl;
      const specialityId = speciality?.id;

      // Handle image removal
      if (removeExistingImage && formData.imageUrl) {
        // ✅ Delete from S3 with correct role
        await deleteFromS3(formData.imageUrl, specialityId, "speciality");
        finalImageUrl = null;
      }

      // Upload new image if selected
      if (imageFile) {
        // Delete existing image if it exists (and not already removed)
        if (formData.imageUrl && !removeExistingImage) {
          await deleteFromS3(formData.imageUrl, specialityId, "speciality");
        }
        
        // ✅ Upload new image with correct parameters
        const uploadResult = await uploadToS3(
          imageFile,
          null,
          specialityId,   // ✅ Pass speciality ID
          "speciality"    // ✅ Role for speciality
        );
        finalImageUrl = uploadResult.key;
      }

      const updatedData = {
        name: formData.name,
        isActive: formData.isActive,
        imageUrl: finalImageUrl
      };

      await onSave({ ...speciality, ...updatedData });
      
      // Reset state
      setImageFile(null);
      setImagePreview(null);
      setRemoveExistingImage(false);
      
    } catch (error) {
      showErrorToast(error?.message || 'Failed to update image', 3000);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Speciality" size="lg">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto px-2">
        <div className="flex items-center gap-3 mb-2 pb-2 border-b border-gray-100">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
            <FolderOpen className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-md font-semibold text-gray-800">Edit Speciality</h3>
            <p className="text-xs text-gray-500">Update speciality details</p>
          </div>
        </div>

        <ImageUpload
          imageUrl={imagePreview}
          onImageChange={handleImageChange}
          onImageRemove={handleImageRemove}
          isUploading={isUploading}
          label="Speciality Image"
        />

        <Input
          label="Speciality Name *"
          name="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter speciality name"
          required
        />

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onClose} fullWidth>Cancel</Button>
          <Button 
            variant="primary" 
            onClick={handleSubmit} 
            disabled={isSaving || isUploading} 
            loading={isSaving || isUploading} 
            fullWidth
          >
            {isUploading ? 'Uploading Image...' : isSaving ? 'Updating...' : 'Update Speciality'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Action Menu Component
const ActionMenu = ({ speciality, onView, onEdit, onToggleStatus, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="absolute top-3 right-3 menu-container" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowMenu(!showMenu);
        }}
        className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
      >
        <MoreVertical size={18} className="text-gray-500" />
      </button>

      {showMenu && (
        <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <button
            onClick={() => { onView(speciality); setShowMenu(false); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg"
          >
            <Eye size={14} /> View Details
          </button>
          <button
            onClick={() => { onEdit(speciality); setShowMenu(false); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <Edit size={14} /> Edit
          </button>
          <button
            onClick={() => { onToggleStatus(speciality); setShowMenu(false); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            {speciality.isActive ? 'Deactivate' : 'Activate'}
          </button>
          <div className="border-t border-gray-100"></div>
          <button
            onClick={() => { onDelete(speciality); setShowMenu(false); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-gray-100 rounded-b-lg"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}
    </div>
  );
};

// Skeleton Loading Component
const SpecialitiesSkeleton = () => {
  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 font-sans">
      <div className="mb-6">
        <div className="h-7 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
        <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="h-10 w-64 bg-gray-200 rounded-md animate-pulse"></div>
        <div className="flex gap-2">
          <div className="w-10 h-10 bg-gray-200 rounded-md animate-pulse"></div>
          <div className="w-10 h-10 bg-gray-200 rounded-md animate-pulse"></div>
          <div className="w-10 h-10 bg-gray-200 rounded-md animate-pulse"></div>
          <div className="w-28 h-10 bg-gray-200 rounded-md animate-pulse"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse relative">
            <div className="w-8 h-8 bg-gray-200 rounded-full absolute top-3 right-3"></div>
            <div className="flex flex-col items-center gap-3 mt-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
              <div className="text-center">
                <div className="h-5 w-32 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ================= MAIN COMPONENT =================

const Specialties = () => {
  const navigate = useNavigate(); 
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSpeciality, setSelectedSpeciality] = useState(null);

  const [eventsRegistered, setEventsRegistered] = useState(false);

  const {
    data: specialitiesResponse,
    isLoading: loading,
    refetch,
    isFetching
  } = useGetSpecialitiesQuery({
    search_query: searchTerm || undefined
  });

  const [registerSpeciality, { isLoading: isAdding }] = useRegisterSpecialityMutation();
  const [updateSpeciality, { isLoading: isUpdating }] = useUpdateSpecialityMutation();
  const [deleteSpeciality, { isLoading: isDeleting }] = useDeleteSpecialityMutation();

  const specialities = specialitiesResponse?.data || [];
  const totalItems = specialitiesResponse?.count || specialities.length;

  // Register socket event listeners
  useEffect(() => {
    registerSpecialityEvents({
      onSpecialityRegistered: (data) => {
        showSuccessToast(`New speciality "${data.name || 'Speciality'}" created!`, 3000);
        refetch();
      },
      onSpecialityUpdated: (data) => {
        showSuccessToast(`Speciality "${data.name || 'Speciality'}" updated!`, 3000);
        refetch();
      },
      onSpecialityDeleted: () => {
        showSuccessToast(`Speciality deleted!`, 3000);
        refetch();
      }
    });

    setEventsRegistered(true);

    return () => {
      unregisterSpecialityEvents();
      setEventsRegistered(false);
    };
  }, [refetch]);

  // Listen for socket connection
  useEffect(() => {
    const handleConnect = () => {
      if (!eventsRegistered) {
        registerSpecialityEvents({
          onSpecialityRegistered: (data) => {
            showSuccessToast(`New speciality "${data.name || 'Speciality'}" created!`, 3000);
            refetch();
          },
          onSpecialityUpdated: (data) => {
            showSuccessToast(`Speciality "${data.name || 'Speciality'}" updated!`, 3000);
            refetch();
          },
          onSpecialityDeleted: () => {
            showSuccessToast(`Speciality deleted!`, 3000);
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
    setCurrentPage(1);
  }, [searchTerm]);

  const handleSpecialtyClick = (speciality) => {
    navigate(`/super-admin/specialities/${speciality.id}/hospitals`, {
      state: {
        specialityId: speciality.id,
        specialityName: speciality.name,
      },
    });
  };

  const handleAddSpeciality = async (newSpeciality) => {
    try {
      const response = await registerSpeciality(newSpeciality).unwrap();
      
      socket.emit("speciality_event", {
        event: "SPECIALITY_REGISTERED",
        data: {
          specialityId: response.data?.id || response.id,
          name: newSpeciality.name,
          isActive: newSpeciality.isActive,
          imageUrl: newSpeciality.imageUrl,
          timestamp: new Date().toISOString()
        }
      });
      
      showSuccessToast('Speciality created successfully!', 3000);
      refetch();
      setShowAddModal(false);
    } catch (error) {
      showErrorToast(error?.data?.message || 'Failed to create speciality', 3000);
    }
  };

  const handleEditSpeciality = async (updatedSpeciality) => {
    try {
      await updateSpeciality({
        id: updatedSpeciality.id,
        data: updatedSpeciality
      }).unwrap();

      socket.emit("speciality_event", {
        event: "SPECIALITY_UPDATED",
        data: {
          specialityId: updatedSpeciality.id,
          name: updatedSpeciality.name,
          isActive: updatedSpeciality.isActive,
          imageUrl: updatedSpeciality.imageUrl,
          timestamp: new Date().toISOString()
        }
      });

      showSuccessToast('Speciality updated successfully!', 3000);
      refetch();
      setShowEditModal(false);
      setSelectedSpeciality(null);
    } catch (error) {
      showErrorToast(error?.data?.message || 'Failed to update speciality', 3000);
    }
  };

  const handleToggleStatus = async (speciality) => {
    try {
      const newStatus = !speciality.isActive;
      await updateSpeciality({
        id: speciality.id,
        data: { isActive: newStatus }
      }).unwrap();

      socket.emit("speciality_event", {
        event: "SPECIALITY_UPDATED",
        data: {
          specialityId: speciality.id,
          name: speciality.name,
          isActive: newStatus,
          statusChanged: true,
          timestamp: new Date().toISOString()
        }
      });

      showSuccessToast(`Speciality ${newStatus ? 'activated' : 'deactivated'} successfully!`, 3000);
      refetch();
    } catch (error) {
      showErrorToast(error?.data?.message || 'Failed to update speciality status', 3000);
    }
  };

  const handleDeleteSpeciality = async () => {
    if (selectedSpeciality) {
      try {
        // ✅ Delete image from S3 if exists
        if (selectedSpeciality.imageUrl) {
          await deleteFromS3(selectedSpeciality.imageUrl, selectedSpeciality.id, "speciality");
        }
        
        await deleteSpeciality(selectedSpeciality.id).unwrap();
        
        socket.emit("speciality_event", {
          event: "SPECIALITY_DELETED",
          data: {
            specialityId: selectedSpeciality.id,
            name: selectedSpeciality.name,
            timestamp: new Date().toISOString()
          }
        });
        
        showSuccessToast('Speciality deleted successfully!', 3000);
        refetch();
        setShowDeleteModal(false);
        setSelectedSpeciality(null);
      } catch (error) {
        showErrorToast(error?.data?.message || 'Failed to delete speciality', 3000);
      }
    }
  };

  const handleRefresh = () => {
    setSearchTerm("");
    setCurrentPage(1);
    refetch();
    showSuccessToast("Specialities refreshed", 2000);
  };

  const handleExport = () => {
    const exportData = specialities.map(speciality => ({
      'ID': speciality.id,
      'Name': speciality.name,
      'Has Image': speciality.imageUrl ? 'Yes' : 'No',
      'Status': speciality.isActive ? 'Active' : 'Inactive',
      'Created At': speciality.createdAt,
      'Updated At': speciality.updatedAt
    }));

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `specialities_export_${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    showSuccessToast(`Exported ${exportData.length} speciality records`, 2000);
  };

  const paginatedSpecialities = specialities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(specialities.length / itemsPerPage);

  if (loading) {
    return <SpecialitiesSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 font-sans">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Specialities Management</h1>
        <p className="text-sm text-gray-500 mt-1">Manage medical specialities</p>
      </div>

      {/* Search and Action Buttons */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search specialities by name..."
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
          <button className="absolute right-2 top-1.5 bg-gradient-to-r from-green-600 to-emerald-600 p-1 rounded">
            <Search className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <button onClick={handleRefresh} className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50">
            <RefreshCcw size={16} className={isFetching ? "animate-spin" : ""} />
          </button>

          <button onClick={handleExport} className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50">
            <Download size={16} />
          </button>

          <button onClick={() => setShowAddModal(true)} className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-md flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300">
            <Plus size={16} /> Add Speciality
          </button>
        </div>
      </div>

      {/* Specialities Grid */}
      {paginatedSpecialities.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedSpecialities.map((speciality) => {
              const imageUrl = speciality.imageUrl ? getImageUrlWithCache(speciality.imageUrl) : null;
              
              return (
                <Card
                  key={speciality.id}
                  onClick={() => handleSpecialtyClick(speciality)}
                  className="p-6 hover:shadow-lg transition-shadow relative cursor-pointer"
                >
                  <div onClick={(e) => e.stopPropagation()}>
                    <ActionMenu
                      speciality={speciality}
                      onView={(s) => { setSelectedSpeciality(s); setShowViewModal(true); }}
                      onEdit={(s) => { setSelectedSpeciality(s); setShowEditModal(true); }}
                      onToggleStatus={handleToggleStatus}
                      onDelete={(s) => { setSelectedSpeciality(s); setShowDeleteModal(true); }}
                    />
                  </div>
                  
                  <div className="flex flex-col items-center text-center">
                    {imageUrl ? (
                      <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-green-200 mb-4">
                        <img 
                          src={imageUrl} 
                          alt={speciality.name} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const fallbackUrl = getS3ImageUrl(speciality.imageUrl);
                            if (fallbackUrl && e.target.src !== fallbackUrl) {
                              e.target.src = fallbackUrl;
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 bg-gradient-to-br from-green-50 to-green-100 rounded-full flex items-center justify-center border-2 border-green-200 mb-4">
                        <FolderOpen className="w-10 h-10 text-green-500" />
                      </div>
                    )}
                    
                    <div className="mb-2">
                      <h3 className="font-semibold text-lg text-gray-900">
                        {toTitleCase(speciality.name)}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">ID: #{speciality.id}</p>
                    </div>
                    
                    <div className="mb-3">
                      <Badge variant={speciality.isActive ? 'success' : 'danger'}>
                        {speciality.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    
                    {speciality.createdAt && (
                      <p className="text-xs text-gray-500 mt-2">
                        Created: {formatDate(speciality.createdAt)}
                      </p>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={specialities.length}
                itemsPerPage={itemsPerPage}
                itemLabel="specialities"
              />
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No specialities found</h3>
          <p className="text-gray-500">Click "Add Speciality" to create your first speciality</p>
        </div>
      )}

      {/* Modals */}
      <AddSpecialityModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddSpeciality}
        isSaving={isAdding}
      />

      <EditSpecialityModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedSpeciality(null);
        }}
        onSave={handleEditSpeciality}
        speciality={selectedSpeciality}
        isSaving={isUpdating}
      />

      <ViewSpecialityModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedSpeciality(null);
        }}
        speciality={selectedSpeciality}
      />

      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedSpeciality(null);
        }}
        onConfirm={handleDeleteSpeciality}
        title="Delete Speciality"
        message="Are you sure you want to delete this speciality? This action cannot be undone."
        itemName={selectedSpeciality?.name}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default Specialties;