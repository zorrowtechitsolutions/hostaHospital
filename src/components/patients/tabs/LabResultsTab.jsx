// src/components/patients/tabs/LabResultsTab.jsx - Complete with S3 Upload

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Eye, Trash2, Upload, X, Edit2, Beaker, Download, User, Search, FileText, AlertTriangle, Image as ImageIcon } from "lucide-react";
import { Button, Pagination } from "../../ui";
import { 
  showSuccessToast,
  showErrorToast,
  showWarningToast,
} from "../../ui/Toast";
import { 
  useGetLabResultsQuery,
  useDeleteLabResultMutation,
  useCreateLabResultMutation,
  useUpdateLabResultMutation
} from "../../../../app/service/labresults";
import { useGetDoctorsQuery } from "../../../../app/service/doctorApi";
import { getAuthUser } from "../../../utils/auth";
import { getS3ImageUrl, uploadToS3 } from "../../../../app/service/S3";
import LaboratoryReportModal from "../modals/LaboratoryReportModal";

// ========================
// DOCTOR SEARCH DROPDOWN
// ========================

const DoctorSearchDropdown = ({ 
  value, 
  onChange, 
  onSelect, 
  placeholder = "Search for a doctor...",
  disabled = false,
  required = false,
  label = "Doctor"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  const { data: doctorsData, isLoading: isLoadingDoctors } = useGetDoctorsQuery({
    limit: 50,
    search_query: searchTerm?.trim() || undefined,
  });

  const doctors = doctorsData?.data || [];

  const filteredDoctors = useMemo(() => {
    if (!searchTerm.trim()) return doctors;
    const term = searchTerm.toLowerCase();
    return doctors.filter(doc => 
      (doc.displayName?.toLowerCase().includes(term) ||
       doc.firstName?.toLowerCase().includes(term) ||
       doc.lastName?.toLowerCase().includes(term) ||
       doc.department?.toLowerCase().includes(term) ||
       doc.specialist?.toLowerCase().includes(term))
    );
  }, [doctors, searchTerm]);

  const getDoctorDisplayName = (doctor) => {
    return doctor.displayName || `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() || 'Unnamed Doctor';
  };

  const getDoctorDepartment = (doctor) => {
    return doctor.department || doctor.specialist || doctor.specialty || '';
  };

  const selectedDoctor = doctors.find(d => String(d.id) === String(value));

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
        {!required && <span className="text-gray-400 text-xs">(Optional)</span>}
      </label>
      <div className="relative">
        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
        <input
          type="text"
          value={isOpen ? searchTerm : (selectedDoctor ? getDoctorDisplayName(selectedDoctor) : "")}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            setSearchTerm("");
          }}
          placeholder={isLoadingDoctors ? "Loading doctors..." : placeholder}
          disabled={disabled || isLoadingDoctors}
          className={`w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent bg-white ${
            (disabled || isLoadingDoctors) ? 'text-gray-400 bg-gray-50 cursor-not-allowed' : ''
          }`}
        />
        {isLoadingDoctors && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1C62A0]"></div>
          </div>
        )}
        {!isLoadingDoctors && (
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        )}
      </div>
      
      {isOpen && !isLoadingDoctors && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredDoctors.length > 0 ? (
            filteredDoctors.map((doctor) => {
              const displayName = getDoctorDisplayName(doctor);
              const department = getDoctorDepartment(doctor);
              return (
                <div
                  key={doctor.id}
                  className="px-4 py-2 hover:bg-[#F5FAFF] cursor-pointer transition-colors flex items-center justify-between"
                  onClick={() => {
                    onChange(doctor.id);
                    onSelect(doctor.id, displayName);
                    setSearchTerm("");
                    setIsOpen(false);
                  }}
                >
                  <div>
                    <span className="text-gray-700 font-medium">{displayName}</span>
                    {department && (
                      <span className="ml-2 text-xs text-gray-400">({department})</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">#{doctor.id}</span>
                </div>
              );
            })
          ) : (
            <div className="px-4 py-3 text-center text-gray-500 text-sm">
              {searchTerm ? 'No doctors found' : 'Type to search for a doctor'}
            </div>
          )}
        </div>
      )}
      
      {isOpen && isLoadingDoctors && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1C62A0]"></div>
            <span>Loading doctors...</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ========================
// MAIN COMPONENT
// ========================

const LabResultsTab = ({ patient }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLabResult, setSelectedLabResult] = useState(null);
  const [showLabModal, setShowLabModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLabResult, setEditingLabResult] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Delete confirmation states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingLabResult, setDeletingLabResult] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Store deleted IDs in localStorage to persist across refreshes
  const STORAGE_KEY = `deleted_lab_results_${patient?.id || 'unknown'}`;
  
  // Load deleted IDs from localStorage on mount
  const loadDeletedIds = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return new Set(parsed);
      }
    } catch (error) {
      console.error("Failed to load deleted IDs:", error);
    }
    return new Set();
  }, [STORAGE_KEY]);

  // Save deleted IDs to localStorage
  const saveDeletedIds = useCallback((ids) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(ids)));
    } catch (error) {
      console.error("Failed to save deleted IDs:", error);
    }
  }, [STORAGE_KEY]);

  // Initialize deletedIds from localStorage
  const [deletedIds, setDeletedIds] = useState(() => loadDeletedIds());
  
  // Force refresh counter
  const [refreshCounter, setRefreshCounter] = useState(0);
  
  // Required form fields
  const [testName, setTestName] = useState("");
  const [status, setStatus] = useState("pending");
  const [department, setDepartment] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [labName, setLabName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null); // ✅ For create modal
  
  // Edit form fields
  const [editTestName, setEditTestName] = useState("");
  const [editStatus, setEditStatus] = useState("pending");
  const [editDepartment, setEditDepartment] = useState("");
  const [editDoctorId, setEditDoctorId] = useState("");
  const [editDoctorName, setEditDoctorName] = useState("");
  const [editLabName, setEditLabName] = useState("");
  const [editFile, setEditFile] = useState(null);
  const [editFilePreview, setEditFilePreview] = useState(null);
  
  const itemsPerPage = 5;

  const authUser = getAuthUser();
  const hospitalId = authUser?.id || authUser?.hospitalId;
  const hospitalName = authUser?.hospitalName || authUser?.name || authUser?.hospital || '';
  const userId = authUser?.id;

  // RTK Query hooks
  const { 
    data: labResultsData, 
    isLoading: isLoadingLabResults,
    refetch: refetchLabResults,
    isFetching: isFetchingLabResults,
  } = useGetLabResultsQuery(
    { patientId: patient?.id },
    { 
      skip: !patient?.id,
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  );

  const [createLabResult] = useCreateLabResultMutation();
  const [updateLabResult] = useUpdateLabResultMutation();
  const [deleteLabResult] = useDeleteLabResultMutation();

  // ========================
  // HELPER FUNCTIONS
  // ========================

  const getFileExtension = (filename) => {
    if (!filename) return '';
    return filename.split('.').pop().toUpperCase();
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const hasFile = (item) => {
    return !!(item.fileKey || item.imageUrl || item.fileUrl);
  };

  const getStatusBadge = (status) => {
    const classes = {
      received: "bg-blue-100 text-blue-700",
      progress: "bg-yellow-100 text-yellow-700",
      pending: "bg-orange-100 text-orange-700",
      cancelled: "bg-red-100 text-red-700",
      completed: "bg-green-100 text-green-700"
    };
    return `px-2 py-1 rounded-full text-xs font-medium ${classes[status] || 'bg-gray-100 text-gray-700'}`;
  };

  const isImageFile = (fileType) => {
    if (!fileType) return false;
    const imageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    return imageTypes.includes(fileType);
  };

  const isPDFFile = (fileType) => {
    if (!fileType) return false;
    return fileType === 'application/pdf';
  };

  // ========================
  // FILE VALIDATION
  // ========================

  const validateFile = (file) => {
    if (!file) return { valid: false, error: "No file selected" };

    const allowedTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {
      return { 
        valid: false, 
        error: "Only Images (PNG, JPEG, WEBP) and PDF files are allowed." 
      };
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { 
        valid: false, 
        error: "File size must be less than 10MB" 
      };
    }

    return { valid: true, error: null };
  };

  // ========================
  // CREATE LAB RESULT WITH S3 UPLOAD
  // ========================

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.valid) {
      showErrorToast(`❌ ${validation.error}`);
      e.target.value = '';
      return;
    }

    setSelectedFile(file);
  };

  const handleAddLabResult = async () => {
    // Validate required fields
    if (!testName.trim()) {
      showWarningToast("Please enter a test name");
      return;
    }

    if (!department.trim()) {
      showWarningToast("Please enter a department");
      return;
    }

    if (!doctorName.trim()) {
      showWarningToast("Please select a doctor");
      return;
    }

    if (!selectedFile) {
      showWarningToast("Please select a file to upload");
      return;
    }

    if (!hospitalName) {
      showErrorToast("❌ Hospital name not found. Please log in again.");
      return;
    }

    if (!userId) {
      showErrorToast("❌ User ID not found. Please log in again.");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // ✅ STEP 1: Create lab result in database (without file)
      const labResultData = {
        patientId: patient.id,
        patientName: patient.name || patient.displayName || '',
        userId: userId,
        hospitalId: hospitalId || null,
        hospitalName: hospitalName,
        department: department.trim(),
        testName: testName.trim(),
        status: status,
        doctorId: doctorId || null,
        doctorName: doctorName.trim(),
        labName: labName.trim() || null,
        name: testName.trim(),
        date: new Date().toLocaleDateString(),
      };


      const createResult = await createLabResult(labResultData).unwrap();

      // ✅ Extract ID from response.data
      const labResultId = 
        createResult?.data?.id ||      
        createResult?.id ||            
        createResult?.data?._id ||     
        createResult?._id ||           
        createResult?.data?.labResultId ||
        createResult?.labResultId;
      

      if (!labResultId) {
        console.error("❌ Could not extract lab result ID. Response:", createResult);
        throw new Error(`Lab Result ID not found in response: ${JSON.stringify(createResult)}`);
      }

      setUploadProgress(30);

      // ✅ STEP 2: Upload file to S3
     

      const timestamp = Date.now();
      const safeFileName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileKey = `lab-results/${labResultId}/${timestamp}_${safeFileName}`;


      const s3Result = await uploadToS3(
        selectedFile,
        fileKey,
        labResultId,
        "labresults"
      );

     

      setUploadProgress(80);

      // ✅ STEP 3: Update lab result with file info
      const updateData = {
        fileKey: s3Result.key,
        fileUrl: s3Result.imageUrl,
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        fileSize: formatFileSize(selectedFile.size),
        type: getFileExtension(selectedFile.name),
        contentType: selectedFile.type,
        uploadedById: userId,
        role: "labresults",
      };

    

      await updateLabResult({
        id: labResultId,
        updateData: updateData
      }).unwrap();

      setUploadProgress(100);

      showSuccessToast(`✅ Lab Result "${testName}" created successfully!`);
      
      // Reset form
      setTestName("");
      setStatus("pending");
      setDepartment("");
      setDoctorId("");
      setDoctorName("");
      setLabName("");
      setSelectedFile(null);
      setShowAddModal(false);
      setUploadProgress(0);

      await forceRefresh();
      
    } catch (error) {
      console.error("❌ Create failed:", error);
      
      let errorMessage = "Unknown error";
      if (error.data?.message) {
        errorMessage = error.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showErrorToast(`❌ Failed to create lab result: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  // ========================
  // EDIT LAB RESULT WITH S3 UPLOAD
  // ========================

  const handleEditLabResult = (labResult) => {
    setEditingLabResult(labResult);
    setEditTestName(labResult.testName || "");
    setEditStatus(labResult.status || "pending");
    setEditDepartment(labResult.department || "");
    setEditDoctorId(labResult.doctorId || "");
    setEditDoctorName(labResult.doctorName || "");
    setEditLabName(labResult.labName || "");
    setEditFile(null);
    setEditFilePreview(null);
    setShowEditModal(true);
  };

  const handleEditFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.valid) {
      showErrorToast(`❌ ${validation.error}`);
      e.target.value = '';
      return;
    }

    setEditFile(file);
    
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setEditFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setEditFilePreview(null);
    }
  };

  const handleUpdateLabResult = async () => {
    // Validate required fields
    if (!editTestName.trim()) {
      showWarningToast("Please enter a test name");
      return;
    }

    if (!editDepartment.trim()) {
      showWarningToast("Please enter a department");
      return;
    }

    if (!editDoctorName.trim()) {
      showWarningToast("Please select a doctor");
      return;
    }

    if (!hospitalName) {
      showErrorToast("❌ Hospital name not found. Please log in again.");
      return;
    }

    if (!userId) {
      showErrorToast("❌ User ID not found. Please log in again.");
      return;
    }

    const labResultId = editingLabResult.id || editingLabResult._id;
    if (!labResultId) {
      showErrorToast("❌ Lab result ID not found.");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      let updateData = {
        patientId: patient.id,
        patientName: patient.name || patient.displayName || '',
        userId: userId,
        hospitalId: hospitalId || null,
        hospitalName: hospitalName,
        department: editDepartment.trim(),
        testName: editTestName.trim(),
        status: editStatus,
        doctorId: editDoctorId || null,
        doctorName: editDoctorName.trim(),
        labName: editLabName.trim() || null,
        name: editTestName.trim(),
        date: new Date().toLocaleDateString(),
      };


      // ✅ If a new file is selected, upload to S3
      if (editFile) {
        
        const timestamp = Date.now();
        const safeFileName = editFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileKey = `lab-results/${labResultId}/${timestamp}_${safeFileName}`;


        setUploadProgress(20);

        const s3Result = await uploadToS3(
          editFile,
          fileKey,
          labResultId,
          "labresults"
        );


        setUploadProgress(70);

        updateData = {
          ...updateData,
          fileKey: s3Result.key,
          fileUrl: s3Result.imageUrl,
          fileName: editFile.name,
          fileType: editFile.type,
          fileSize: formatFileSize(editFile.size),
          type: getFileExtension(editFile.name),
          contentType: editFile.type,
          uploadedById: userId,
          role: "labresults",
        };
      }


      await updateLabResult({
        id: labResultId,
        updateData: updateData
      }).unwrap();

      setUploadProgress(100);

      showSuccessToast(`✅ Lab Result "${editTestName}" updated successfully!`);
      
      setShowEditModal(false);
      setEditingLabResult(null);
      setEditTestName("");
      setEditStatus("pending");
      setEditDepartment("");
      setEditDoctorId("");
      setEditDoctorName("");
      setEditLabName("");
      setEditFile(null);
      setEditFilePreview(null);
      setUploadProgress(0);

      await forceRefresh();
      
    } catch (error) {
      console.error("❌ Update failed:", error);
      
      let errorMessage = "Unknown error";
      if (error.data?.message) {
        errorMessage = error.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showErrorToast(`❌ Failed to update lab result: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  // ========================
  // DELETE LAB RESULT
  // ========================

  const handleDeleteClick = (id, name) => {
    setDeletingLabResult({ id: String(id), name });
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingLabResult) return;

    setIsDeleting(true);

    try {
      const id = deletingLabResult.id;
      
      // IMMEDIATE UI UPDATE: Add to deleted IDs and save to localStorage
      setDeletedIds(prev => {
        const newSet = new Set(prev);
        newSet.add(id);
        saveDeletedIds(newSet);
        return newSet;
      });
      
      setShowDeleteModal(false);
      
      try {
        await deleteLabResult(id).unwrap();
        showSuccessToast(`✅ Lab Result "${deletingLabResult.name}" deleted successfully!`);
      } catch (error) {
        if (error.status === 404 || error.data?.message === 'Lab result not found') {
          showWarningToast("Lab result was already deleted.");
        } else {
          setDeletedIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            saveDeletedIds(newSet);
            return newSet;
          });
          throw error;
        }
      }
      
      await refetchLabResults();
      setRefreshCounter(prev => prev + 1);
      
    } catch (error) {
      console.error("❌ Delete failed:", error);
      showErrorToast(`❌ Failed to delete: ${error.message || error.data?.message || "Unknown error"}`);
    } finally {
      setIsDeleting(false);
      setDeletingLabResult(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setDeletingLabResult(null);
  };

  // ========================
  // VIEW & DOWNLOAD
  // ========================

  const handleViewReport = (labResult) => {
    setSelectedLabResult(labResult);
    setShowLabModal(true);
  };

  const handleDownloadFile = (item) => {
    const url = getS3ImageUrl(item.fileKey || item.imageUrl);
    if (!url) {
      showWarningToast("No file attached to download");
      return;
    }
    window.open(url, '_blank');
  };

  // ========================
  // FORCE REFRESH
  // ========================

  const forceRefresh = useCallback(async () => {
    try {
      setRefreshCounter(prev => prev + 1);
      await refetchLabResults();
    } catch (error) {
      console.error("❌ Refetch failed:", error);
    }
  }, [refetchLabResults]);

  // ========================
  // EFFECTS
  // ========================

  // Save deleted IDs whenever they change
  useEffect(() => {
    saveDeletedIds(deletedIds);
  }, [deletedIds, saveDeletedIds]);

  // Refetch when patient changes
  useEffect(() => {
    if (patient?.id) {
      const loaded = loadDeletedIds();
      setDeletedIds(loaded);
      forceRefresh();
    }
  }, [patient?.id, loadDeletedIds, forceRefresh]);

  // ========================
  // RESET FUNCTIONS
  // ========================

  const resetAddForm = () => {
    setTestName("");
    setStatus("pending");
    setDepartment("");
    setDoctorId("");
    setDoctorName("");
    setLabName("");
    setSelectedFile(null);
    setShowAddModal(false);
    setUploadProgress(0);
  };

  const resetEditForm = () => {
    setShowEditModal(false);
    setEditingLabResult(null);
    setEditTestName("");
    setEditStatus("pending");
    setEditDepartment("");
    setEditDoctorId("");
    setEditDoctorName("");
    setEditLabName("");
    setEditFile(null);
    setEditFilePreview(null);
    setUploadProgress(0);
  };

  // ========================
  // PAGINATION
  // ========================

  const labResultsList = useMemo(() => {
    const list = labResultsData?.data || [];
   
    
    const filteredList = list.filter(item => {
      const id = String(item.id || item._id);
      const isDeleted = deletedIds.has(id);
      if (isDeleted) {
      }
      return !isDeleted;
    });
    
    return filteredList;
  }, [labResultsData, deletedIds, refreshCounter]);

  const totalItems = labResultsList.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLabResults = labResultsList.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDoctorSelect = (id, name) => {
    setDoctorId(id);
    setDoctorName(name);
  };

  const handleEditDoctorSelect = (id, name) => {
    setEditDoctorId(id);
    setEditDoctorName(name);
  };

  // ========================
  // RENDER
  // ========================

  if (isLoadingLabResults) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1C62A0]"></div>
          <span className="ml-3 text-gray-600">Loading lab results...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-700">
          Total Lab Results
          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded ml-2">
            {totalItems}
          </span>
          {isFetchingLabResults && (
            <span className="ml-2 inline-block animate-spin rounded-full h-3 w-3 border-2 border-[#1C62A0] border-t-transparent"></span>
          )}
        </h2>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#1C62A0] text-white rounded-lg cursor-pointer hover:bg-[#154f7a] transition-colors flex items-center gap-2 text-sm"
        >
          <Upload size={16} />
          Add Lab Result
        </button>
      </div>

      {/* ======================== */}
      {/* ADD LAB RESULT MODAL WITH FILE */}
      {/* ======================== */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] flex flex-col">
            <div className="px-6 py-5 border-b border-gray-200 flex-shrink-0">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">Add Lab Result</h3>
                <button onClick={resetAddForm} className="p-1 hover:bg-gray-100 rounded-full transition-colors" disabled={uploading}>
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {/* Test Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Test Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  placeholder="e.g., Complete Blood Count, X-Ray, MRI"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent"
                  disabled={uploading}
                />
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g., Cardiology, Neurology, Pathology"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent"
                  disabled={uploading}
                />
              </div>

              {/* Doctor Search */}
              <DoctorSearchDropdown
                value={doctorId}
                onChange={setDoctorId}
                onSelect={handleDoctorSelect}
                placeholder="Search for a doctor..."
                disabled={uploading}
                required={true}
                label="Doctor"
              />

              {/* Lab Name (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lab Name <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={labName}
                  onChange={(e) => setLabName(e.target.value)}
                  placeholder="e.g., LabCorp, Quest Diagnostics"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent"
                  disabled={uploading}
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent"
                  disabled={uploading}
                >
                  <option value="pending">Pending</option>
                  <option value="received">Received</option>
                  <option value="progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* ✅ File Upload - NEW */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  File <span className="text-red-500">*</span>
                </label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload size={24} className="text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">
                      {selectedFile ? selectedFile.name : "Click to select a file"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Images (PNG, JPEG, WEBP) or PDF (Max 10MB)
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={handleFileSelect}
                    disabled={uploading}
                  />
                </label>
              </div>

              {/* File Preview */}
              {selectedFile && !uploading && (
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <div className="flex items-center gap-3">
                    {selectedFile.type.startsWith('image/') ? (
                      <ImageIcon size={20} className="text-green-500" />
                    ) : (
                      <FileText size={20} className="text-red-500" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(selectedFile.size)} • {getFileExtension(selectedFile.name)}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="p-1 hover:bg-gray-200 rounded-full"
                    >
                      <X size={16} className="text-gray-500" />
                    </button>
                  </div>
                </div>
              )}

              {/* Upload Progress */}
              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-[#1C62A0] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Info Box */}
              <div className="bg-blue-50 p-3 rounded-lg text-xs text-gray-600">
                <p className="font-medium mb-1">📋 Information to be saved:</p>
                <ul className="space-y-1">
                  <li>• Patient: <span className="font-medium">{patient?.name || 'N/A'}</span></li>
                  <li>• Hospital: <span className="font-medium">{hospitalName || 'N/A'}</span></li>
                  <li>• Doctor: <span className="font-medium">{doctorName || 'Not selected'}</span></li>
                </ul>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-white flex-shrink-0 rounded-b-xl">
              <div className="flex gap-3">
                <button
                  onClick={resetAddForm}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddLabResult}
                  disabled={!testName.trim() || !department.trim() || !doctorName.trim() || !selectedFile || uploading}
                  className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors flex items-center justify-center gap-2 ${
                    !testName.trim() || !department.trim() || !doctorName.trim() || !selectedFile || uploading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-[#1C62A0] hover:bg-[#154f7a]"
                  }`}
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Add Lab Result
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================== */}
      {/* EDIT LAB RESULT MODAL WITH FILE */}
      {/* ======================== */}
      {showEditModal && editingLabResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] flex flex-col">
            <div className="px-6 py-5 border-b border-gray-200 flex-shrink-0">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">Edit Lab Result</h3>
                <button onClick={resetEditForm} className="p-1 hover:bg-gray-100 rounded-full transition-colors" disabled={uploading}>
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {/* Test Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Test Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editTestName}
                  onChange={(e) => setEditTestName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent"
                  disabled={uploading}
                />
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editDepartment}
                  onChange={(e) => setEditDepartment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent"
                  disabled={uploading}
                />
              </div>

              {/* Doctor Search */}
              <DoctorSearchDropdown
                value={editDoctorId}
                onChange={setEditDoctorId}
                onSelect={handleEditDoctorSelect}
                placeholder="Search for a doctor..."
                disabled={uploading}
                required={true}
                label="Doctor"
              />

              {/* Lab Name (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lab Name <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={editLabName}
                  onChange={(e) => setEditLabName(e.target.value)}
                  placeholder="e.g., LabCorp, Quest Diagnostics"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent"
                  disabled={uploading}
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent"
                  disabled={uploading}
                >
                  <option value="pending">Pending</option>
                  <option value="received">Received</option>
                  <option value="progress">In Progress</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Current File Display */}
              {editingLabResult.fileKey && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    {isImageFile(editingLabResult.fileType || editingLabResult.type) ? (
                      <img 
                        src={getS3ImageUrl(editingLabResult.fileKey)} 
                        alt="Current" 
                        className="h-12 w-12 object-cover rounded"
                      />
                    ) : isPDFFile(editingLabResult.fileType || editingLabResult.type) ? (
                      <FileText size={20} className="text-red-500" />
                    ) : (
                      <FileText size={20} className="text-blue-500" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">Current File</p>
                      <p className="text-xs text-gray-500">
                        {editingLabResult.fileName || "File"} • {editingLabResult.fileSize || "N/A"}
                      </p>
                    </div>
                    <a
                      href={getS3ImageUrl(editingLabResult.fileKey)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-xs underline"
                    >
                      View
                    </a>
                  </div>
                </div>
              )}

              {/* Replace File */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Replace File <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload size={24} className="text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">
                      {editFile ? editFile.name : "Click to select a new file"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Images (PNG, JPEG, WEBP) or PDF (Max 10MB)
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={handleEditFileSelect}
                    disabled={uploading}
                  />
                </label>
              </div>

              {/* New File Preview */}
              {editFile && !uploading && (
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <div className="flex items-center gap-3">
                    {editFile.type.startsWith('image/') ? (
                      <img 
                        src={editFilePreview} 
                        alt="Preview" 
                        className="h-12 w-12 object-cover rounded"
                      />
                    ) : editFile.type === 'application/pdf' ? (
                      <FileText size={20} className="text-red-500" />
                    ) : (
                      <FileText size={20} className="text-blue-500" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{editFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(editFile.size)} • {getFileExtension(editFile.name)}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setEditFile(null);
                        setEditFilePreview(null);
                      }}
                      className="p-1 hover:bg-gray-200 rounded-full"
                    >
                      <X size={16} className="text-gray-500" />
                    </button>
                  </div>
                </div>
              )}

              {/* Upload Progress */}
              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Updating...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-[#1C62A0] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Info Box */}
              <div className="bg-blue-50 p-3 rounded-lg text-xs text-gray-600">
                <p className="font-medium mb-1">📋 Information to be saved:</p>
                <ul className="space-y-1">
                  <li>• Patient: <span className="font-medium">{patient?.name || 'N/A'}</span></li>
                  <li>• Hospital: <span className="font-medium">{hospitalName || 'N/A'}</span></li>
                  <li>• Doctor: <span className="font-medium">{editDoctorName || 'Not selected'}</span></li>
                </ul>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-white flex-shrink-0 rounded-b-xl">
              <div className="flex gap-3">
                <button
                  onClick={resetEditForm}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateLabResult}
                  disabled={!editTestName.trim() || !editDepartment.trim() || !editDoctorName.trim() || uploading}
                  className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors flex items-center justify-center gap-2 ${
                    !editTestName.trim() || !editDepartment.trim() || !editDoctorName.trim() || uploading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-[#1C62A0] hover:bg-[#154f7a]"
                  }`}
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Update Lab Result
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================== */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ======================== */}
      {showDeleteModal && deletingLabResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Lab Result</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone.</p>
                </div>
              </div>
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete <span className="font-semibold text-gray-900">"{deletingLabResult.name}"</span>?
                <br />
                <span className="text-sm text-gray-500">All associated data and files will be permanently removed.</span>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleCancelDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================== */}
      {/* TABLE */}
      {/* ======================== */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Test ID</th>
              <th className="px-4 py-3 font-medium">Test Name</th>
              <th className="px-4 py-3 font-medium">Department</th>
              <th className="px-4 py-3 font-medium">Doctor</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right w-44">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLabResults.length > 0 ? (
              paginatedLabResults.map((item, index) => {
                const hasFileValue = hasFile(item);
                const itemId = item.id || item._id;

                return (
                  <tr
                    key={`${itemId || index}-${refreshCounter}`}
                    className="border-t border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
  <div className="flex items-center gap-2">
    <Beaker size={16} className="text-blue-500 flex-shrink-0" />
    <span className="font-medium text-[#1C62A0]">
      {String(startIndex + index + 1)}
    </span>
  </div>
</td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-800">
                        {item.testName || item.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {item.department || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {item.doctorName || 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={getStatusBadge(item.status)}>
                        {item.status || 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewReport(item)}
                          className="p-2 hover:text-blue-600"
                          title="View Report"
                        >
                          <Eye size={16} className="text-gray-500 hover:text-blue-600" />
                        </Button>
                        {hasFileValue && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadFile(item)}
                            className="p-2 hover:text-blue-600"
                            title="Download Report"
                          >
                            <Download size={16} className="text-gray-500 hover:text-blue-600" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditLabResult(item)}
                          className="p-2 hover:text-green-600"
                          title="Edit Lab Result"
                        >
                          <Edit2 size={16} className="text-gray-500 hover:text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(itemId, item.testName || item.name)}
                          className="p-2 hover:text-red-600"
                          title="Delete Lab Result"
                        >
                          <Trash2 size={16} className="text-gray-500 hover:text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="text-center text-gray-500 py-12">
                  <div className="flex flex-col items-center gap-2">
                    <Beaker size={48} className="text-gray-300" />
                    <p>No lab results found</p>
                    <p className="text-xs text-gray-400">Click "Add Lab Result" to add new records</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalItems > 0 && totalPages > 1 && (
        <div className="px-6 py-3 border-t bg-gray-50">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            itemLabel="lab results"
          />
        </div>
      )}

      {/* Laboratory Report Modal */}
      <LaboratoryReportModal
        isOpen={showLabModal}
        onClose={() => {
          setShowLabModal(false);
          setSelectedLabResult(null);
        }}
        labResult={selectedLabResult}
        patient={patient}
      />
    </div>
  );
};

export default LabResultsTab;