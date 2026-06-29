// src/components/super-admin/Ads.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Image, Plus, Filter, Download, MoreVertical, Eye, 
  Edit, RefreshCcw, Upload, Trash2, Search, Calendar,
  MapPin, Navigation, Clock, X, Loader2, Building
} from 'lucide-react';
import { 
  Button, Badge, Loader, Card, Modal, Input
} from '../ui';
import DeleteModal from '../patients/DeleteModel';
import { showSuccessToast, showErrorToast, showWarningToast } from '../ui/Toast';
import { 
  useGetAdsQuery,
  useCreateAdMutation,
  useUpdateAdMutation,
  useDeleteAdMutation,
} from '../../../app/service/ads';
import { useGetAllHospitalsQuery } from '../../../app/service/hospitalApi';
import { getS3ImageUrl, uploadToS3 } from '../../../app/service/S3';

// ✅ Import socket
import { socket } from '../../socket/socket';
// ✅ Import socket event listeners
import { registerAdEvents, unregisterAdEvents } from '../../socket/adEvents';

// Helper function to format date
const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Add Ad Modal
const AddAdModal = ({ isOpen, onClose, onSave, isSaving, hospitals }) => {
  const [formData, setFormData] = useState({
    imageUrl: '',
    imageKey: '',
    hospitalId: '',
    startDate: '',
    endDate: '',
    kilometer: 5,
    isActive: true
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleImageUpload = async (file) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showErrorToast('Image size must be less than 5MB', 3000);
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showErrorToast('Only JPEG, PNG, GIF, and WEBP files are allowed', 3000);
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result);
    };
    reader.readAsDataURL(file);

    try {
      setUploadProgress(30);
      const uploaded = await uploadToS3(file);
      setUploadProgress(100);
      
      setFormData(prev => ({
        ...prev,
        imageUrl: uploaded.imageUrl,
        imageKey: uploaded.key
      }));
      
      showSuccessToast('Image uploaded successfully!', 2000);
    } catch (error) {
      console.error('Upload error:', error);
      showErrorToast('Failed to upload image', 3000);
      setPreviewImage(null);
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) handleImageUpload(file);
  };

  const removeImage = () => {
    setPreviewImage(null);
    setFormData(prev => ({
      ...prev,
      imageUrl: '',
      imageKey: ''
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = () => {
    if (!formData.hospitalId) {
      showErrorToast('Hospital is required', 3000);
      return;
    }
    if (!formData.startDate) {
      showErrorToast('Start date is required', 3000);
      return;
    }
    if (!formData.endDate) {
      showErrorToast('End date is required', 3000);
      return;
    }
    onSave({
      imageUrl: formData.imageUrl || null,
      hospitalId: Number(formData.hospitalId),
      startDate: formData.startDate,
      endDate: formData.endDate,
      kilometer: formData.kilometer,
      isActive: formData.isActive
    });
    setFormData({
      imageUrl: '',
      imageKey: '',
      hospitalId: '',
      startDate: '',
      endDate: '',
      kilometer: 5,
      isActive: true
    });
    setPreviewImage(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Ad" size="lg">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto px-2">
        <div className="flex items-center gap-3 mb-2 pb-2 border-b border-gray-100">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Image className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-md font-semibold text-gray-800">Add New Advertisement</h3>
            <p className="text-xs text-gray-500">Enter ad details and targeting parameters</p>
          </div>
        </div>

        {/* Image Upload Section - Optional */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ad Image <span className="text-gray-400 text-xs">(Optional)</span>
          </label>
          <div className="flex flex-col items-center gap-4 p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
            {previewImage ? (
              <div className="relative">
                <img 
                  src={previewImage} 
                  alt="Preview" 
                  className="w-full max-h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="text-center">
                <Image className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-400">JPEG, PNG, GIF, WEBP up to 5MB (Optional)</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileSelect}
              className="hidden"
              id="image-upload"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('image-upload').click()}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : previewImage ? 'Change Image' : 'Choose Image'}
            </Button>
            {isUploading && (
              <div className="w-full">
                <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#1C62A0] transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 text-center mt-1">Uploading... {uploadProgress}%</p>
              </div>
            )}
          </div>
        </div>

        {/* Hospital Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hospital *
          </label>
          <select
            value={formData.hospitalId}
            onChange={(e) => setFormData({ ...formData, hospitalId: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C62A0]"
          >
            <option value="">Select Hospital</option>
            {Array.isArray(hospitals) && hospitals.map((hospital) => (
              <option key={hospital.id} value={hospital.id}>
                {hospital.name || hospital.hospitalName || hospital.email}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Start Date *"
            name="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            required
          />
          <Input
            label="End Date *"
            name="endDate"
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            required
          />
        </div>

        <Input
          label="Radius (KM) *"
          name="kilometer"
          type="number"
          min="1"
          value={formData.kilometer}
          onChange={(e) => setFormData({ ...formData, kilometer: parseFloat(e.target.value) })}
          placeholder="Target radius in kilometers"
          required
        />

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onClose} fullWidth>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSaving || isUploading} loading={isSaving} fullWidth>
            {isSaving ? 'Adding...' : 'Add Ad'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Edit Ad Modal
const EditAdModal = ({ isOpen, onClose, onSave, ad, isSaving, hospitals }) => {
  const [formData, setFormData] = useState({
    imageUrl: '',
    imageKey: '',
    hospitalId: '',
    startDate: '',
    endDate: '',
    kilometer: 5,
    isActive: true
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (ad) {
      setFormData({
        imageUrl: ad.imageUrl || '',
        imageKey: ad.imageKey || '',
        hospitalId: ad.hospitalId || '',
        startDate: ad.startDate ? ad.startDate.split('T')[0] : '',
        endDate: ad.endDate ? ad.endDate.split('T')[0] : '',
        kilometer: ad.kilometer || 5,
        isActive: ad.isActive !== undefined ? ad.isActive : true
      });
      setPreviewImage(ad.imageUrl ? getS3ImageUrl(ad.imageUrl) : null);
    }
  }, [ad]);

  const handleImageUpload = async (file) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showErrorToast('Image size must be less than 5MB', 3000);
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showErrorToast('Only JPEG, PNG, GIF, and WEBP files are allowed', 3000);
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result);
    };
    reader.readAsDataURL(file);

    try {
      setUploadProgress(30);
      const uploaded = await uploadToS3(file, formData.imageKey || null);
      setUploadProgress(100);
      
      setFormData(prev => ({
        ...prev,
        imageUrl: uploaded.imageUrl,
        imageKey: uploaded.key
      }));
      
      showSuccessToast('Image uploaded successfully!', 2000);
    } catch (error) {
      console.error('Upload error:', error);
      showErrorToast('Failed to upload image', 3000);
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) handleImageUpload(file);
  };

  const removeImage = () => {
    setPreviewImage(null);
    setFormData(prev => ({
      ...prev,
      imageUrl: '',
      imageKey: ''
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = () => {
    if (!formData.hospitalId) {
      showErrorToast('Hospital is required', 3000);
      return;
    }
    if (!formData.startDate) {
      showErrorToast('Start date is required', 3000);
      return;
    }
    if (!formData.endDate) {
      showErrorToast('End date is required', 3000);
      return;
    }
    onSave({ ...ad, ...formData });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Ad" size="lg">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto px-2">
        <div className="flex items-center gap-3 mb-2 pb-2 border-b border-gray-100">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Image className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-md font-semibold text-gray-800">Edit Advertisement</h3>
            <p className="text-xs text-gray-500">Update ad details and targeting parameters</p>
          </div>
        </div>

        {/* Image Upload Section - Optional */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ad Image <span className="text-gray-400 text-xs">(Optional)</span>
          </label>
          <div className="flex flex-col items-center gap-4 p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
            {previewImage ? (
              <div className="relative">
                <img 
                  src={previewImage} 
                  alt="Preview" 
                  className="w-full max-h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="text-center">
                <Image className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-400">JPEG, PNG, GIF, WEBP up to 5MB (Optional)</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileSelect}
              className="hidden"
              id="edit-image-upload"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('edit-image-upload').click()}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : previewImage ? 'Change Image' : 'Choose Image'}
            </Button>
            {isUploading && (
              <div className="w-full">
                <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#1C62A0] transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 text-center mt-1">Uploading... {uploadProgress}%</p>
              </div>
            )}
          </div>
        </div>

        {/* Hospital Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hospital *
          </label>
          <select
            value={formData.hospitalId}
            onChange={(e) => setFormData({ ...formData, hospitalId: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C62A0]"
          >
            <option value="">Select Hospital</option>
            {Array.isArray(hospitals) && hospitals.map((hospital) => (
              <option key={hospital.id} value={hospital.id}>
                {hospital.name || hospital.hospitalName || hospital.email}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Start Date *"
            name="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            required
          />
          <Input
            label="End Date *"
            name="endDate"
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            required
          />
        </div>

        <Input
          label="Radius (KM) *"
          name="kilometer"
          type="number"
          min="1"
          value={formData.kilometer}
          onChange={(e) => setFormData({ ...formData, kilometer: parseFloat(e.target.value) })}
          required
        />

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onClose} fullWidth>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSaving || isUploading} loading={isSaving} fullWidth>
            {isSaving ? 'Updating...' : 'Update Ad'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// View Ad Modal
const ViewAdModal = ({ isOpen, onClose, ad, hospitalName }) => {
  if (!ad) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ad Details" size="md">
      <div className="space-y-4">
        {ad.imageUrl && (
          <div className="flex justify-center mb-4">
            <img 
              src={getS3ImageUrl(ad.imageUrl) || ad.imageUrl} 
              alt={ad.id}
              className="w-full max-h-48 object-cover rounded-lg"
              onError={(e) => {
                e.target.src = 'https://placehold.co/400x200?text=No+Image';
              }}
            />
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500">Ad ID</label>
            <p className="text-sm font-semibold text-gray-800">#{ad.id}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Status</label>
            <Badge variant={ad.isActive ? 'success' : 'danger'}>
              {ad.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Start Date</label>
            <p className="text-sm text-gray-600">{formatDate(ad.startDate)}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">End Date</label>
            <p className="text-sm text-gray-600">{formatDate(ad.endDate)}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Target Radius</label>
            <p className="text-sm text-gray-600">{ad.kilometer} KM</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Hospital</label>
            <p className="text-sm text-gray-600 flex items-center gap-1">
              <Building size={12} className="text-gray-400" />
              {hospitalName || `Hospital ID: ${ad.hospitalId}`}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} fullWidth>Close</Button>
        </div>
      </div>
    </Modal>
  );
};

// Skeleton Loading Component
const AdsSkeleton = () => {
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
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
            <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
            <div className="h-5 w-32 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 w-24 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Ads = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  
  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAd, setSelectedAd] = useState(null);
  
  // Menu state
  const [activeMenu, setActiveMenu] = useState(null);

  // ✅ Track if events are registered
  const [eventsRegistered, setEventsRegistered] = useState(false);

  // API Hooks
  const { 
    data: adsResponse, 
    isLoading: loading, 
    refetch,
    isFetching
  } = useGetAdsQuery({
    page: currentPage,
    limit: itemsPerPage,
    search_query: searchTerm || undefined
  });

  const ads = adsResponse?.data || adsResponse?.ads || [];
  const totalPages = adsResponse?.pagination?.totalPages || 
                     adsResponse?.totalPages || 
                     Math.ceil(ads.length / itemsPerPage) || 1;
  const totalItems = adsResponse?.pagination?.totalItems || 
                     adsResponse?.totalItems || 
                     ads.length;

  const { data: hospitalsData } = useGetAllHospitalsQuery();
  
  let hospitals = [];
  if (Array.isArray(hospitalsData)) {
    hospitals = hospitalsData;
  } else if (hospitalsData?.data && Array.isArray(hospitalsData.data)) {
    hospitals = hospitalsData.data;
  } else if (hospitalsData?.hospitals && Array.isArray(hospitalsData.hospitals)) {
    hospitals = hospitalsData.hospitals;
  }

  const [createAd, { isLoading: isAdding }] = useCreateAdMutation();
  const [updateAd, { isLoading: isUpdating }] = useUpdateAdMutation();
  const [deleteAd, { isLoading: isDeleting }] = useDeleteAdMutation();

  // Create a map of hospitalId to hospital name
  const hospitalMap = React.useMemo(() => {
    const map = new Map();
    if (Array.isArray(hospitals)) {
      hospitals.forEach(hospital => {
        map.set(hospital.id, hospital.name || hospital.hospitalName || hospital.email);
      });
    }
    return map;
  }, [hospitals]);

  // Get hospital name by ID
  const getHospitalName = (hospitalId) => {
    return hospitalMap.get(hospitalId) || `Hospital ID: ${hospitalId}`;
  };

  // ✅ Register socket event listeners for ad events
  useEffect(() => {
    console.log("🔄 Registering ad event listeners...");
    console.log("📡 Socket connected:", socket.connected);
    
    registerAdEvents({
      onAdCreated: (data) => {
        console.log("📢 NEW AD CREATED:", data);
        showSuccessToast(`New ad created for hospital ${data.hospitalName || 'Hospital'}!`, 3000);
        refetch();
      },
      
      onAdUpdated: (data) => {
        console.log("✏️ AD UPDATED:", data);
        showSuccessToast(`Ad updated successfully!`, 3000);
        refetch();
      },
      
      onAdDeleted: (data) => {
        console.log("🗑️ AD DELETED:", data);
        showSuccessToast(`Ad deleted!`, 3000);
        refetch();
      }
    });

    setEventsRegistered(true);

    return () => {
      console.log("🧹 Unregistering ad events...");
      unregisterAdEvents();
      setEventsRegistered(false);
    };
  }, [refetch]);

  // ✅ Listen for socket connection/disconnection
  useEffect(() => {
    const handleConnect = () => {
      console.log("✅ Socket CONNECTED - Ad events will work!");
      if (!eventsRegistered) {
        registerAdEvents({
          onAdCreated: (data) => {
            console.log("📢 NEW AD CREATED (reconnect):", data);
            showSuccessToast(`New ad created!`, 3000);
            refetch();
          },
          onAdUpdated: (data) => {
            console.log("✏️ AD UPDATED (reconnect):", data);
            showSuccessToast(`Ad updated!`, 3000);
            refetch();
          },
          onAdDeleted: (data) => {
            console.log("🗑️ AD DELETED (reconnect):", data);
            showSuccessToast(`Ad deleted!`, 3000);
            refetch();
          }
        });
        setEventsRegistered(true);
      }
    };

    const handleDisconnect = () => {
      console.log("❌ Socket DISCONNECTED - Ad events won't work!");
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
      console.log(`📡 ALL SOCKET EVENTS - ADS: ${event}:`, args);
    };

    socket.onAny(handleAnyEvent);

    return () => {
      socket.offAny(handleAnyEvent);
    };
  }, []);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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

  // CRUD Handlers
  const handleAddAd = async (newAd) => {
    try {
      const response = await createAd(newAd).unwrap();
      
      // ✅ Emit socket event for ad created
      socket.emit("ad_event", {
        event: "AD_CREATED",
        data: {
          adId: response.data?.id || response.id,
          hospitalId: newAd.hospitalId,
          hospitalName: getHospitalName(newAd.hospitalId),
          startDate: newAd.startDate,
          endDate: newAd.endDate,
          kilometer: newAd.kilometer,
          timestamp: new Date().toISOString()
        }
      });
      
      showSuccessToast('Ad created successfully!', 3000);
      refetch();
      setShowAddModal(false);
    } catch (error) {
      console.error('Add error:', error);
      showErrorToast(error?.data?.message || 'Failed to create ad', 3000);
    }
  };

  const handleEditAd = async (updatedAd) => {
    try {
      await updateAd({ 
        id: updatedAd.id, 
        data: updatedAd 
      }).unwrap();
      
      // ✅ Emit socket event for ad updated
      socket.emit("ad_event", {
        event: "AD_UPDATED",
        data: {
          adId: updatedAd.id,
          hospitalId: updatedAd.hospitalId,
          hospitalName: getHospitalName(updatedAd.hospitalId),
          startDate: updatedAd.startDate,
          endDate: updatedAd.endDate,
          kilometer: updatedAd.kilometer,
          isActive: updatedAd.isActive,
          timestamp: new Date().toISOString()
        }
      });
      
      showSuccessToast('Ad updated successfully!', 3000);
      refetch();
      setShowEditModal(false);
      setSelectedAd(null);
    } catch (error) {
      console.error('Update error:', error);
      showErrorToast(error?.data?.message || 'Failed to update ad', 3000);
    }
  };

  const handleToggleStatus = async (ad) => {
    try {
      const newStatus = !ad.isActive;
      await updateAd({ 
        id: ad.id, 
        data: { isActive: newStatus } 
      }).unwrap();
      
      // ✅ Emit socket event for ad updated (status change)
      socket.emit("ad_event", {
        event: "AD_UPDATED",
        data: {
          adId: ad.id,
          hospitalId: ad.hospitalId,
          hospitalName: getHospitalName(ad.hospitalId),
          isActive: newStatus,
          statusChanged: true,
          timestamp: new Date().toISOString()
        }
      });
      
      showSuccessToast(`Ad ${newStatus ? 'activated' : 'deactivated'} successfully!`, 3000);
      refetch();
    } catch (error) {
      console.error('Toggle error:', error);
      showErrorToast(error?.data?.message || 'Failed to update ad status', 3000);
    }
  };

  const handleDeleteAd = async () => {
    if (selectedAd) {
      try {
        await deleteAd(selectedAd.id).unwrap();
        
        // ✅ Emit socket event for ad deleted
        socket.emit("ad_event", {
          event: "AD_DELETED",
          data: {
            adId: selectedAd.id,
            hospitalId: selectedAd.hospitalId,
            hospitalName: getHospitalName(selectedAd.hospitalId),
            timestamp: new Date().toISOString()
          }
        });
        
        showSuccessToast('Ad deleted successfully!', 3000);
        refetch();
        setShowDeleteModal(false);
        setSelectedAd(null);
      } catch (error) {
        console.error('Delete error:', error);
        showErrorToast(error?.data?.message || 'Failed to delete ad', 3000);
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
    setCurrentPage(1);
    refetch();
    showSuccessToast("Ads refreshed", 2000);
  };

  const handleExport = () => {
    const exportData = ads.map(ad => ({
      'ID': ad.id,
      'Hospital Name': getHospitalName(ad.hospitalId),
      'Hospital ID': ad.hospitalId,
      'Image URL': ad.imageUrl || 'No image',
      'Start Date': ad.startDate,
      'End Date': ad.endDate,
      'Radius (KM)': ad.kilometer,
      'Status': ad.isActive ? 'Active' : 'Inactive',
      'Created At': ad.createdAt,
      'Updated At': ad.updatedAt
    }));
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `ads_export_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    showSuccessToast(`Exported ${exportData.length} ad records`, 2000);
  };

  if (loading) {
    return <AdsSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 font-sans">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Advertisement Management</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your hospital advertisements and targeting</p>
      </div>

      {/* Search and Action Buttons */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search ads by ID or Hospital..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1C62A0]"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <button onClick={handleRefresh} className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50">
            <RefreshCcw size={16} className={isFetching ? "animate-spin" : ""} />
          </button>

          <button onClick={handleExport} className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50">
            <Download size={16} />
          </button>

          <button onClick={() => setShowAddModal(true)} className="px-4 py-2 text-sm font-medium text-white bg-[#1C62A0] rounded-md flex items-center gap-2 hover:bg-[#154A7D]">
            <Plus size={16} /> Add Ad
          </button>
        </div>
      </div>

      {/* Ads Grid */}
      {ads.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ads.map((ad) => (
            <Card key={ad.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative">
                {ad.imageUrl ? (
                  <img 
                    src={getS3ImageUrl(ad.imageUrl) || ad.imageUrl} 
                    alt={`Ad ${ad.id}`}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.target.src = 'https://placehold.co/400x200?text=No+Image';
                    }}
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                    <Image className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-2 right-2 menu-container">
                  <button onClick={(e) => toggleMenu(ad.id, e)} className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-100">
                    <MoreVertical size={16} className="text-gray-600" />
                  </button>
                  {activeMenu === ad.id && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1">
                      <button onClick={() => { setSelectedAd(ad); setShowViewModal(true); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <Eye size={16} /> View Details
                      </button>
                      <button onClick={() => { setSelectedAd(ad); setShowEditModal(true); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <Edit size={16} /> Edit
                      </button>
                      <button onClick={() => handleToggleStatus(ad)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <RefreshCcw size={16} /> {ad.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button onClick={() => { setSelectedAd(ad); setShowDeleteModal(true); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50 flex items-center gap-2">
                        <Trash2 size={16} /> Delete
                      </button>
                    </div>
                  )}
                </div>
                <div className="absolute top-2 left-2">
                  <Badge variant={ad.isActive ? 'success' : 'danger'}>
                    {ad.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-500">ID: #{ad.id}</p>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <MapPin size={12} />
                    <span>{ad.kilometer} km radius</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                  <Building size={12} />
                  <span className="truncate">{getHospitalName(ad.hospitalId)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                  <Calendar size={12} />
                  <span>{formatDate(ad.startDate)} - {formatDate(ad.endDate)}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Image className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No ads found</h3>
          <p className="text-gray-500">Click "Add Ad" to create your first advertisement</p>
        </div>
      )}

      {/* Pagination */}
      {ads.length > 0 && totalPages > 1 && (
        <div className="mt-6 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} records
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
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
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
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

      {/* Modals */}
      <AddAdModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddAd}
        isSaving={isAdding}
        hospitals={hospitals}
      />

      <EditAdModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedAd(null);
        }}
        onSave={handleEditAd}
        ad={selectedAd}
        isSaving={isUpdating}
        hospitals={hospitals}
      />

      <ViewAdModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedAd(null);
        }}
        ad={selectedAd}
        hospitalName={selectedAd ? getHospitalName(selectedAd.hospitalId) : null}
      />

      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedAd(null);
        }}
        onConfirm={handleDeleteAd}
        title="Delete Ad"
        message="Are you sure you want to delete this advertisement? This action cannot be undone."
        itemName={`Ad #${selectedAd?.id} - ${selectedAd ? getHospitalName(selectedAd.hospitalId) : ''}`}
      />
    </div>
  );
};

export default Ads;