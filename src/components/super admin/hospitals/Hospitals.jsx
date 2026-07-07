// src/components/super-admin/Hospitals.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Edit,
  Trash2,
  Search,
  Loader2,
  MapPin,
  Mail,
  Phone,
  Plus,
  RotateCcw,
  Eye,
  Image as ImageIcon,
  Upload,
  X,
  CheckCircle
} from 'lucide-react';
import { Card, Button, Modal, Pagination, Badge } from '../../ui';
import { showSuccessToast, showErrorToast } from '../../ui/Toast';
import { 
  useGetAllHospitalsQuery, 
  useDeleteHospitalMutation,
  useRecoverHospitalMutation,
  useUpdateHospitalMutation
} from '../../../../app/service/hospitalApi';
import { socket } from '../../../socket/socket';
import { registerHospitalEvents, unregisterHospitalEvents } from '../../../socket/hospitalEvents';
import { uploadToS3, deleteFromS3, getS3ImageUrl } from '../../../../app/service/S3';

// ================= HELPER FUNCTIONS =================

// Get S3 image URL without cache busting to allow browser caching
const getImageUrlWithCache = (imageUrl) => {
  if (!imageUrl) return null;
  return getS3ImageUrl(imageUrl);
};

// ================= CUSTOM HOSPITAL AVATAR =================

const HospitalAvatar = ({ imageUrl, hospitalName, isBlacklisted, size = 'w-14 h-14' }) => {
  const [imgError, setImgError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const firstLetter = hospitalName?.charAt(0)?.toUpperCase() || "H";

  return (
    <div className={`flex-shrink-0 rounded-xl overflow-hidden ${size}`}>
      {/* Image - shown when loaded */}
      {imageUrl && !imgError && (
        <img
          src={imageUrl}
          alt={hospitalName}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          } ${isBlacklisted ? 'opacity-60' : ''}`}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImgError(true)}
          loading="eager"
        />
      )}
      
      {/* Fallback - neutral gray, only shown until image loads */}
      <div 
        className={`w-full h-full flex items-center justify-center text-white text-2xl transition-opacity duration-300 ${
          imageLoaded ? "opacity-0 pointer-events-none" : "opacity-100"
        } ${isBlacklisted ? 'bg-gray-300' : 'bg-gray-200'}`}
      >
        {(!imageUrl || !imageLoaded) && firstLetter}
      </div>
    </div>
  );
};

// ================= IMAGE UPLOAD MODAL =================

const ImageUploadModal = ({ isOpen, onClose, hospital, onImageUpdate, isUpdating }) => {
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const fileInputRef = React.useRef(null);

  useEffect(() => {
    if (hospital && isOpen) {
      const existingImageUrl = hospital.imageUrl || hospital.profilePicture || hospital.profileImage;
      const previewUrl = existingImageUrl ? getImageUrlWithCache(existingImageUrl) : null;
      setImagePreview(previewUrl);
      setImageFile(null);
      setRemoveExistingImage(false);
    }
  }, [hospital, isOpen]);

  const handleImageChange = async (file) => {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setRemoveExistingImage(false);
  };

  const handleImageRemove = () => {
    if (hospital?.imageUrl || hospital?.profilePicture || hospital?.profileImage) {
      setRemoveExistingImage(true);
      setImagePreview(null);
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const handleSubmit = async () => {
    if (!hospital) return;

    try {
      setIsUploading(true);
      
      let finalImageUrl = hospital.imageUrl || hospital.profilePicture || hospital.profileImage;

      // Handle image removal
      if (removeExistingImage && finalImageUrl) {
        await deleteFromS3(finalImageUrl, hospital.id, "hospital");
        finalImageUrl = null;
      }

      // Upload new image if selected
      if (imageFile) {
        // Delete existing image if it exists (and not already removed)
        if (finalImageUrl && !removeExistingImage) {
          await deleteFromS3(finalImageUrl, hospital.id, "hospital");
        }
        
        const uploadResult = await uploadToS3(
          imageFile,
          null,
          hospital.id,
          "hospital"
        );
        finalImageUrl = uploadResult.key;
      }

      await onImageUpdate(hospital.id, {
        profilePicture: finalImageUrl,
        profileImage: finalImageUrl,
        imageUrl: finalImageUrl
      });
      
      setImageFile(null);
      setImagePreview(null);
      setRemoveExistingImage(false);
      
    } catch (error) {
      showErrorToast(error?.message || 'Failed to update hospital image', 3000);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Update Hospital Image</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Image Preview */}
          <div className="flex flex-col items-center">
            <div className="relative w-32 h-32">
              {imagePreview ? (
                <div className="relative w-full h-full">
                  <img
                    src={imagePreview}
                    alt="Hospital"
                    className="w-full h-full object-cover rounded-full border-2 border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={handleImageRemove}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    disabled={isUploading}
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="w-full h-full rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                  <ImageIcon className="w-12 h-12 text-gray-400" />
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">PNG, JPG, WEBP (Max 5MB)</p>
          </div>

          {/* Upload Button */}
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageChange(file);
              }}
              className="hidden"
              disabled={isUploading}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1C62A0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUploading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  Uploading...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Upload size={16} />
                  {imagePreview ? 'Change Image' : 'Upload Image'}
                </span>
              )}
            </button>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isUploading || isUpdating}
              className="flex-1 px-4 py-2 bg-[#1C62A0] hover:bg-[#4c6c88] text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {(isUploading || isUpdating) && <Loader2 size={18} className="animate-spin" />}
              {isUploading ? 'Uploading...' : isUpdating ? 'Saving...' : 'Save Image'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ================= MAIN COMPONENT =================

const Hospitals = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [hospitalToDelete, setHospitalToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleted, setShowDeleted] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [isUpdatingImage, setIsUpdatingImage] = useState(false);
  const itemsPerPage = 6;

  const [eventsRegistered, setEventsRegistered] = useState(false);

  const { 
    data: hospitalsData, 
    isLoading, 
    refetch,
    isFetching 
  } = useGetAllHospitalsQuery({
    includeDeleted: showDeleted
  });
  
  const [deleteHospital, { isLoading: isDeleting }] = useDeleteHospitalMutation();
  const [recoverHospital, { isLoading: isRecovering }] = useRecoverHospitalMutation();
  const [updateHospital, { isLoading: isUpdating }] = useUpdateHospitalMutation();

  // Register socket event listeners
  useEffect(() => {
    registerHospitalEvents({
      onHospitalRegistered: (data) => {
        showSuccessToast(`New hospital registered: ${data.hospitalName || 'Hospital'}`, 3000);
        refetch();
      },
      onHospitalUpdated: (data) => {
        showSuccessToast(`Hospital ${data.hospitalName || 'Hospital'} updated successfully!`, 3000);
        refetch();
      },
      onHospitalDeleted: () => {
        showSuccessToast(`Hospital deleted!`, 3000);
        refetch();
      },
      onHospitalBlacklisted: () => {
        showSuccessToast(`Hospital blacklisted!`, 3000);
        refetch();
      },
      onHospitalRecovered: () => {
        showSuccessToast(`Hospital recovered successfully!`, 3000);
        refetch();
      }
    });

    setEventsRegistered(true);

    return () => {
      unregisterHospitalEvents();
      setEventsRegistered(false);
    };
  }, [refetch]);

  // Listen for socket connection
  useEffect(() => {
    const handleConnect = () => {
      if (!eventsRegistered) {
        registerHospitalEvents({
          onHospitalRegistered: (data) => {
            showSuccessToast(`New hospital registered: ${data.hospitalName || 'Hospital'}`, 3000);
            refetch();
          },
          onHospitalUpdated: (data) => {
            showSuccessToast(`Hospital ${data.hospitalName || 'Hospital'} updated successfully!`, 3000);
            refetch();
          },
          onHospitalDeleted: () => {
            showSuccessToast(`Hospital deleted!`, 3000);
            refetch();
          },
          onHospitalBlacklisted: () => {
            showSuccessToast(`Hospital blacklisted!`, 3000);
            refetch();
          },
          onHospitalRecovered: () => {
            showSuccessToast(`Hospital recovered successfully!`, 3000);
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

  const transformHospitals = (hospitals) => {
    if (!hospitals || !Array.isArray(hospitals)) return [];
    
    return hospitals.map((hospital) => {
      let status = 'Active';
      if (hospital.isDelete) {
        status = 'Blacklisted';
      } else if (hospital.isActive === false) {
        status = 'Inactive';
      }
      
      return {
        ...hospital,
        isDelete: hospital.isDelete || false,
        isActive: hospital.isActive !== undefined ? hospital.isActive : true,
        displayStatus: status
      };
    });
  };

  const hospitals = transformHospitals(hospitalsData?.data || hospitalsData || []);
  const totalItems = hospitalsData?.pagination?.totalItems || hospitals.length;

  const handleDelete = async () => {
    if (hospitalToDelete) {
      try {
        await deleteHospital(hospitalToDelete.id).unwrap();
        
        socket.emit("hospital_event", {
          event: "HOSPITAL_DELETED",
          data: {
            hospitalId: hospitalToDelete.id,
            hospitalName: hospitalToDelete.name,
            timestamp: new Date().toISOString()
          }
        });
        
        showSuccessToast(`${hospitalToDelete.name} deleted successfully!`);
        refetch();
        setShowModal(false);
        setHospitalToDelete(null);
      } catch (error) {
        showErrorToast(error?.data?.message || 'Failed to delete hospital');
      }
    }
  };

  const handleRecoverHospital = async (hospital, e) => {
    e.stopPropagation();
    try {
      await recoverHospital(hospital.id).unwrap();
      
      socket.emit("hospital_event", {
        event: "HOSPITAL_RECOVERED",
        data: {
          hospitalId: hospital.id,
          hospitalName: hospital.name,
          timestamp: new Date().toISOString()
        }
      });
      
      showSuccessToast(`${hospital.name} recovered successfully!`);
      refetch();
    } catch (error) {
      showErrorToast(error?.data?.message || 'Failed to recover hospital');
    }
  };

  const handleDeleteClick = (hospital, e) => {
    e.stopPropagation();
    if (hospital.isDelete) {
      showErrorToast('Cannot delete a blacklisted hospital', 3000);
      return;
    }
    setHospitalToDelete(hospital);
    setShowModal(true);
  };

  const handleEditClick = (hospital, e) => {
    e.stopPropagation();
    if (hospital.isDelete) {
      showErrorToast('Cannot edit blacklisted hospital', 3000);
      return;
    }
    navigate(`/super-admin/hospitals/edit/${hospital.id}`, { state: { hospital } });
  };

  const handleImageClick = (hospital, e) => {
    e.stopPropagation();
    if (hospital.isDelete) {
      showErrorToast('Cannot update image of blacklisted hospital', 3000);
      return;
    }
    setSelectedHospital(hospital);
    setShowImageModal(true);
  };

  const handleCardClick = (hospitalId, hospital) => {
    if (hospital.isDelete) {
      showErrorToast('Cannot view details of blacklisted hospital', 3000);
      return;
    }
    navigate(`/super-admin/hospitals/${hospitalId}`);
  };

  const handleImageUpdate = async (hospitalId, imageData) => {
    setIsUpdatingImage(true);
    try {
      await updateHospital({
        id: hospitalId,
        updateHospital: imageData
      }).unwrap();
      
      showSuccessToast('Hospital image updated successfully!', 3000);
      setShowImageModal(false);
      setSelectedHospital(null);
      refetch();
    } catch (error) {
      showErrorToast(error?.data?.message || 'Failed to update hospital image', 3000);
    } finally {
      setIsUpdatingImage(false);
    }
  };

  const getFullAddress = (address) => {
    if (!address) return 'N/A';
    const parts = [address.place, address.district, address.state, address.country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  };

  const getHospitalImage = (hospital) => {
    const image = hospital.imageUrl || hospital.profilePicture || hospital.profileImage;
    return image ? getImageUrlWithCache(image) : null;
  };

  const filteredHospitals = hospitals.filter(h => 
    h.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.address?.place?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.address?.district?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredHospitals.length / itemsPerPage);
  const paginatedHospitals = filteredHospitals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, showDeleted]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#6366F1] mx-auto mb-3" />
          <p className="text-gray-500">Loading hospitals...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header with Add Hospital Button */}
      <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Hospitals Management</h1>
          <p className="text-sm text-gray-500 mt-1">Click on any hospital to view details</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="primary"
            onClick={() => navigate('/super-admin/hospitals/add')}
            className="flex items-center gap-2"
          >
            <Plus size={18} />
            Add Hospital
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search hospitals by name, email, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Toggle Deleted */}
      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={() => setShowDeleted(!showDeleted)}
          className={`px-3 py-1 rounded-lg text-sm transition-colors ${
            showDeleted 
              ? 'bg-red-100 text-red-700 hover:bg-red-200' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {showDeleted ? 'Showing Deleted' : 'Show Deleted'}
        </button>
      </div>

      {/* Hospitals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {paginatedHospitals.map((hospital) => {
          const isBlacklisted = hospital.isDelete;
          const imageUrl = getHospitalImage(hospital);
          
          return (
            <div
              key={hospital.id}
              onClick={() => handleCardClick(hospital.id, hospital)}
              className={`transition-transform hover:scale-[1.02] ${!isBlacklisted ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <Card className={`h-[400px] p-6 hover:shadow-lg transition-all duration-300 flex flex-col justify-between ${
                isBlacklisted ? 'bg-gray-50 border-gray-300' : ''
              }`}>
                {/* Top Section */}
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <HospitalAvatar 
                        imageUrl={imageUrl}
                        hospitalName={hospital.name}
                        isBlacklisted={isBlacklisted}
                        size="w-14 h-14"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold text-lg truncate ${
                          isBlacklisted ? 'text-gray-500' : 'text-gray-900'
                        }`}>
                          {hospital.name}
                        </h3>
                        <p className={`text-xs ${isBlacklisted ? 'text-gray-400' : 'text-gray-500'}`}>
                          ID: {hospital.id}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          {isBlacklisted ? (
                            <Badge variant="secondary" className="text-xs">
                              Blacklisted
                            </Badge>
                          ) : (
                            <Badge variant="success" className="text-xs flex items-center gap-1">
                              <CheckCircle size={10} /> Active
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className={`flex items-center gap-2 text-sm ${
                      isBlacklisted ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      <Mail size={14} className="text-gray-400 flex-shrink-0" />
                      <span className="truncate">{hospital.email}</span>
                    </div>
                    <div className={`flex items-center gap-2 text-sm ${
                      isBlacklisted ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      <Phone size={14} className="text-gray-400 flex-shrink-0" />
                      <span>{hospital.phone || 'N/A'}</span>
                    </div>
                    {hospital.address && (
                      <div className={`flex items-start gap-2 text-sm ${
                        isBlacklisted ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2 text-sm">
                          {getFullAddress(hospital.address)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Section - Buttons */}
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
                  {isBlacklisted ? (
                    <Button
                      size="sm"
                      variant="success"
                      onClick={(e) => handleRecoverHospital(hospital, e)}
                      disabled={isRecovering}
                      className="flex items-center gap-1"
                    >
                      <RotateCcw size={14} />
                      Recover
                    </Button>
                  ) : (
                    <>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => handleEditClick(hospital, e)}
                        >
                          <Edit size={14} />
                        </Button>
                      </div>
                      <Button 
                        size="sm" 
                        variant="danger" 
                        onClick={(e) => handleDeleteClick(hospital, e)}
                        disabled={isDeleting}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredHospitals.length}
            itemsPerPage={itemsPerPage}
            itemLabel="hospitals"
          />
        </div>
      )}

      {/* No Results */}
      {filteredHospitals.length === 0 && (
        <div className="text-center py-12">
          <Building2 size={48} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            {showDeleted ? "No deleted hospitals found" : "No hospitals found"}
          </p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={showModal} 
        onClose={() => {
          setShowModal(false);
          setHospitalToDelete(null);
        }} 
        title="Delete Hospital" 
        size="sm"
      >
        <div className="p-4">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <Trash2 size={24} className="text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Deletion</h3>
            <p className="text-gray-500 mb-4">
              Are you sure you want to delete <span className="font-semibold text-gray-700">{hospitalToDelete?.name}</span>? 
              This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowModal(false);
                  setHospitalToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                variant="danger" 
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Hospital'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Image Upload Modal */}
      <ImageUploadModal
        isOpen={showImageModal}
        onClose={() => {
          setShowImageModal(false);
          setSelectedHospital(null);
        }}
        hospital={selectedHospital}
        onImageUpdate={handleImageUpdate}
        isUpdating={isUpdatingImage}
      />
    </div>
  );
};

export default Hospitals;