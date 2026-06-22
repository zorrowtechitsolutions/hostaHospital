// src/components/patients/tabs/LabResultsTab.jsx - With Documents-style folder structure
import React, { useState, Fragment, useEffect, useMemo, useRef } from "react";
import { Eye, Trash2, Upload, X, Edit2, Beaker, Download, User, Search, FileText } from "lucide-react";
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
import { getS3ImageUrl } from "../../../../app/service/S3";
import LaboratoryReportModal from "../modals/LaboratoryReportModal";

// Searchable Doctor Dropdown Component
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
        {label} <span className="text-gray-400 text-xs">(Optional)</span>
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

const LabResultsTab = ({ patient }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLabResult, setSelectedLabResult] = useState(null);
  const [showLabModal, setShowLabModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLabResult, setEditingLabResult] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Required form fields only
  const [testName, setTestName] = useState("");
  const [status, setStatus] = useState("pending");
  const [department, setDepartment] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [doctorName, setDoctorName] = useState("");
  
  // Edit form fields
  const [editTestName, setEditTestName] = useState("");
  const [editStatus, setEditStatus] = useState("pending");
  const [editDepartment, setEditDepartment] = useState("");
  const [editDoctorId, setEditDoctorId] = useState("");
  const [editDoctorName, setEditDoctorName] = useState("");
  const [editFile, setEditFile] = useState(null);
  const [editFilePreview, setEditFilePreview] = useState(null);
  
  const itemsPerPage = 5;

  // Get auth user for hospitalId and userId
  const authUser = getAuthUser();
  const hospitalId = authUser?.id || authUser?.hospitalId;
  const userId = authUser?.id;

  // RTK Query hooks
  const { 
    data: labResultsData, 
    isLoading: isLoadingLabResults,
    refetch: refetchLabResults 
  } = useGetLabResultsQuery(
    { patientId: patient?.id },
    { skip: !patient?.id }
  );

  const [createLabResult] = useCreateLabResultMutation();
  const [updateLabResult] = useUpdateLabResultMutation();
  const [deleteLabResult] = useDeleteLabResultMutation();

  // Get lab results list from response
  const labResultsList = labResultsData?.data || patient?.labResultsList || [];
  
  // Debug logs
  useEffect(() => {
    console.log("🔍 Lab Results Data:", labResultsData);
    console.log("🔍 Lab Results List:", labResultsList);
    if (labResultsList.length > 0) {
      console.log("🔍 First Lab Result with fields:", {
        id: labResultsList[0]?.id,
        testName: labResultsList[0]?.testName,
        fileKey: labResultsList[0]?.fileKey,
        fileUrl: labResultsList[0]?.fileUrl,
        fileType: labResultsList[0]?.fileType,
        fileName: labResultsList[0]?.fileName,
        fileSize: labResultsList[0]?.fileSize,
      });
    }
  }, [labResultsData, labResultsList]);

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

  const getStatusBadge = (status) => {
    const classes = {
      received: "bg-blue-100 text-blue-700",
      progress: "bg-yellow-100 text-yellow-700",
      pending: "bg-orange-100 text-orange-700",
      completed: "bg-green-100 text-green-700",
      cancelled: "bg-red-100 text-red-700"
    };
    return `px-2 py-1 rounded-full text-xs font-medium ${classes[status] || 'bg-gray-100 text-gray-700'}`;
  };

  const getTypeBadgeClass = (category) => {
    const classes = {
      'Blood Test': "bg-red-100 text-red-700",
      'Urine Test': "bg-yellow-100 text-yellow-700",
      'X-Ray': "bg-blue-100 text-blue-700",
      'MRI': "bg-purple-100 text-purple-700",
      'CT Scan': "bg-indigo-100 text-indigo-700",
      'Ultrasound': "bg-pink-100 text-pink-700",
      'ECG': "bg-green-100 text-green-700",
      'Pathology': "bg-orange-100 text-orange-700"
    };
    return classes[category] || "bg-gray-100 text-gray-700";
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const hasFile = (item) => {
    return !!(item.fileKey || item.imageUrl || item.fileUrl);
  };

  const handleDoctorSelect = (id, name) => {
    setDoctorId(id);
    setDoctorName(name);
  };

  const handleEditDoctorSelect = (id, name) => {
    setEditDoctorId(id);
    setEditDoctorName(name);
  };

  const handleEditFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {
      showErrorToast("❌ Only Images (PNG, JPEG, WEBP) and PDF files are allowed.");
      e.target.value = '';
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      showErrorToast("❌ File size must be less than 10MB");
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

  const isImageFile = (fileType) => {
    if (!fileType) return false;
    const imageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    return imageTypes.includes(fileType);
  };

  const isPDFFile = (fileType) => {
    if (!fileType) return false;
    return fileType === 'application/pdf';
  };

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

  // CREATE - Add lab result
  const handleAddLabResult = async () => {
    if (!testName.trim()) {
      showWarningToast("Please enter a test name");
      return;
    }

    if (!department.trim()) {
      showWarningToast("Please enter a department");
      return;
    }

    setUploading(true);

    try {
      const labResultData = {
        patientId: patient.id,
        hospitalId: hospitalId || null,
        department: department.trim(),
        testName: testName.trim(),
        status: status,
        doctorId: doctorId || null,
        doctorName: doctorName || null,
        name: testName.trim(),
        date: new Date().toLocaleDateString(),
      };

      console.log("📄 Creating Lab Result:", labResultData);

      await createLabResult(labResultData).unwrap();

      showSuccessToast(`✅ Lab Result "${testName}" created successfully!`);
      
      setTestName("");
      setStatus("pending");
      setDepartment("");
      setDoctorId("");
      setDoctorName("");
      setShowAddModal(false);

      refetchLabResults();
      
    } catch (error) {
      console.error("Create failed:", error);
      showErrorToast(`❌ Failed to create lab result: ${error.message || error.data?.message || "Unknown error"}`);
    } finally {
      setUploading(false);
    }
  };

  // EDIT - Update lab result with image upload (Documents-style)
  const handleEditLabResult = (labResult) => {
    console.log("✏️ Editing Lab Result - Full item:", labResult);
    setEditingLabResult(labResult);
    setEditTestName(labResult.testName || "");
    setEditStatus(labResult.status || "pending");
    setEditDepartment(labResult.department || "");
    setEditDoctorId(labResult.doctorId || "");
    setEditDoctorName(labResult.doctorName || "");
    setEditFile(null);
    setEditFilePreview(null);
    setShowEditModal(true);
  };

  const handleUpdateLabResult = async () => {
    if (!editTestName.trim()) {
      showWarningToast("Please enter a test name");
      return;
    }

    if (!editDepartment.trim()) {
      showWarningToast("Please enter a department");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      let updateData = {
        patientId: patient.id,
        hospitalId: hospitalId || null,
        department: editDepartment.trim(),
        testName: editTestName.trim(),
        status: editStatus,
        doctorId: editDoctorId || null,
        doctorName: editDoctorName || null,
        name: editTestName.trim(),
        date: new Date().toLocaleDateString(),
      };

      // If a new file is selected, upload to S3 using Lab Result ID (Documents-style)
      if (editFile) {
        console.log("📤 Uploading file to S3...");
        
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 10, 90));
        }, 200);

        const timestamp = Date.now();
        const safeFileName = editFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        
        // ✅ Use Lab Result ID for folder structure (Documents-style)
        const labResultId = editingLabResult.id || editingLabResult._id;
        const fileKey = `lab-results/${labResultId}/${timestamp}_${safeFileName}`;
        
        console.log("📁 Lab Result ID:", labResultId);
        console.log("📁 File Key:", fileKey);
        
        const { uploadToS3 } = await import("../../../../app/service/S3");
        
        // ✅ Pass labResultId as customId and "lab-results" as customRole
        const s3Result = await uploadToS3(
          editFile,
          fileKey,
          labResultId,      // ← Pass Lab Result ID (Documents-style)
          "labresults"     // ← Pass "lab-results" as role
        );
        
        console.log("✅ S3 Upload Result:", s3Result);
        
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

        clearInterval(progressInterval);
        setUploadProgress(100);
      }

      console.log("📄 UPDATE PAYLOAD being sent:", JSON.stringify(updateData, null, 2));

      const result = await updateLabResult({
        id: editingLabResult.id || editingLabResult._id,
        updateData: updateData
      }).unwrap();

      console.log("📄 UPDATE RESPONSE:", result);

      showSuccessToast(`✅ Lab Result "${editTestName}" updated successfully!`);
      
      setShowEditModal(false);
      setEditingLabResult(null);
      setEditTestName("");
      setEditStatus("pending");
      setEditDepartment("");
      setEditDoctorId("");
      setEditDoctorName("");
      setEditFile(null);
      setEditFilePreview(null);
      setUploadProgress(0);

      refetchLabResults();
      
    } catch (error) {
      console.error("❌ Update failed:", error);
      showErrorToast(`❌ Failed to update lab result: ${error.message || error.data?.message || "Unknown error"}`);
    } finally {
      setUploading(false);
    }
  };

  // DELETE - Delete lab result
  const handleDeleteLabResult = async (id, name) => {
    try {
      await deleteLabResult(id).unwrap();
      showSuccessToast(`✅ Lab Result "${name}" deleted successfully!`);
      refetchLabResults();
    } catch (error) {
      console.error("Delete failed:", error);
      showErrorToast(`❌ Failed to delete lab result: ${error.message || error.data?.message || "Unknown error"}`);
    }
  };

  const handleViewReport = (labResult) => {
    console.log("👁️ VIEW ITEM:", labResult);
    console.log("👁️ hasFile:", hasFile(labResult));
    setSelectedLabResult(labResult);
    setShowLabModal(true);
  };

  const resetAddForm = () => {
    setTestName("");
    setStatus("pending");
    setDepartment("");
    setDoctorId("");
    setDoctorName("");
    setShowAddModal(false);
  };

  const resetEditForm = () => {
    setShowEditModal(false);
    setEditingLabResult(null);
    setEditTestName("");
    setEditStatus("pending");
    setEditDepartment("");
    setEditDoctorId("");
    setEditDoctorName("");
    setEditFile(null);
    setEditFilePreview(null);
    setUploadProgress(0);
  };

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
      <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-700">
          Total Lab Results
          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded ml-2">
            {totalItems}
          </span>
        </h2>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#1C62A0] text-white rounded-lg cursor-pointer hover:bg-[#154f7a] transition-colors flex items-center gap-2 text-sm"
        >
          <Upload size={16} />
          Add Lab Result
        </button>
      </div>

      {/* Add Lab Result Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Add Lab Result</h3>
              <button
                onClick={resetAddForm}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
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

              <DoctorSearchDropdown
                value={doctorId}
                onChange={setDoctorId}
                onSelect={handleDoctorSelect}
                placeholder="Search for a doctor..."
                disabled={uploading}
                label="Doctor (Optional)"
              />

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

              <div className="text-xs text-gray-400">
                Hospital ID: {hospitalId || 'Auto-detected'} • Patient ID: {patient?.id}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={resetAddForm}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddLabResult}
                  disabled={!testName.trim() || !department.trim() || uploading}
                  className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors flex items-center justify-center gap-2 ${
                    !testName.trim() || !department.trim() || uploading
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

      {/* Edit Lab Result Modal - Documents-style */}
      {showEditModal && editingLabResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Edit Lab Result</h3>
              <button
                onClick={resetEditForm}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Test Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editTestName}
                  onChange={(e) => setEditTestName(e.target.value)}
                  placeholder="e.g., Complete Blood Count, X-Ray, MRI"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent"
                  disabled={uploading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editDepartment}
                  onChange={(e) => setEditDepartment(e.target.value)}
                  placeholder="e.g., Cardiology, Neurology, Pathology"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent"
                  disabled={uploading}
                />
              </div>

              <DoctorSearchDropdown
                value={editDoctorId}
                onChange={setEditDoctorId}
                onSelect={handleEditDoctorSelect}
                placeholder="Search for a doctor..."
                disabled={uploading}
                label="Doctor (Optional)"
              />

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
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {editingLabResult.fileUrl && (
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

              {editFile && !uploading && (
                <div className="bg-gray-50 rounded-lg p-3">
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

              <div className="flex gap-3 pt-4">
                <button
                  onClick={resetEditForm}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateLabResult}
                  disabled={!editTestName.trim() || !editDepartment.trim() || uploading}
                  className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors flex items-center justify-center gap-2 ${
                    !editTestName.trim() || !editDepartment.trim() || uploading
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

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Test ID</th>
              <th className="px-4 py-3 font-medium">Test Name</th>
              <th className="px-4 py-3 font-medium">Department</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right w-44">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLabResults.length > 0 ? (
              paginatedLabResults.map((item, index) => {
                const hasFileValue = hasFile(item);

                return (
                  <tr
                    key={item.id || item._id || index}
                    className="border-t border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Beaker size={16} className="text-blue-500 flex-shrink-0" />
                        <span className="font-medium text-[#1C62A0]">
                          {item.id || `#LR${String(index + 1).padStart(4, '0')}`}
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
                            onClick={() => {
                              const url = getS3ImageUrl(item.fileKey || item.imageUrl);
                              if (url) window.open(url, '_blank');
                            }}
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
                          onClick={() => handleDeleteLabResult(item.id || item._id, item.testName || item.name)}
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
                <td colSpan={5} className="text-center text-gray-500 py-12">
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