// src/components/patients/tabs/DocumentsTab.jsx - Complete with Table Numbers, Skeleton Loading & Real-time Events

import React, { useState, useEffect, useCallback } from "react";
import { File, Download, Trash2, Upload, X, ExternalLink, Edit2, Eye, FileText, Image, AlertTriangle } from "lucide-react";
import { Button, Pagination } from "../../ui";
import DatePicker from "../../ui/DatePicker";
import { 
  showSuccessToast,
  showErrorToast,
  showWarningToast,
} from "../../ui/Toast";
import { 
  useDeleteDocumentMutation,
  useGetDocumentsQuery,
  useUpdateDocumentMutation,
  useCreateDocumentMutation
} from "../../../../app/service/documentApi";
import { getS3ImageUrl, uploadToS3 } from "../../../../app/service/S3";
import { getAuthUser } from "../../../utils/auth";
import {
  registerDocumentEvents,
  unregisterDocumentEvents,
} from "../../../socket/documentEvents";

// ============ SKELETON LOADING COMPONENTS ============

const SkeletonText = ({ width = "w-full", height = "h-4", className = "" }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${width} ${height} ${className}`}></div>
);

const SkeletonRow = ({ showNumber = true }) => (
  <tr className="border-t border-gray-100">
    {showNumber && (
      <td className="px-4 py-3">
        <SkeletonText width="w-6" height="h-3" />
      </td>
    )}
    <td className="px-4 py-3">
      <div className="flex items-center gap-2">
        <SkeletonText width="w-5" height="h-5" className="rounded" />
        <SkeletonText width="w-32" height="h-3" />
      </div>
    </td>
    <td className="px-4 py-3">
      <SkeletonText width="w-20" height="h-3" />
    </td>
    <td className="px-4 py-3">
      <div className="flex justify-end gap-1">
        <SkeletonText width="w-8" height="h-8" className="rounded" />
        <SkeletonText width="w-8" height="h-8" className="rounded" />
        <SkeletonText width="w-8" height="h-8" className="rounded" />
        <SkeletonText width="w-8" height="h-8" className="rounded" />
      </div>
    </td>
  </tr>
);

const DocumentsSkeleton = () => (
  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm flex flex-col">
    <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50 flex-shrink-0">
      <div className="flex items-center gap-2">
        <SkeletonText width="w-32" height="h-5" />
        <SkeletonText width="w-8" height="h-5" className="rounded-full" />
      </div>
      <SkeletonText width="w-36" height="h-9" className="rounded-lg" />
    </div>

    <div className="flex flex-col min-h-[420px]">
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">
                <SkeletonText width="w-4" height="h-3" />
              </th>
              <th className="px-4 py-3 font-medium">
                <SkeletonText width="w-24" height="h-3" />
              </th>
              <th className="px-4 py-3 font-medium">
                <SkeletonText width="w-12" height="h-3" />
              </th>
              <th className="px-4 py-3 font-medium text-right w-44">
                <SkeletonText width="w-16" height="h-3" className="ml-auto" />
              </th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, index) => (
              <SkeletonRow key={index} showNumber={true} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-auto px-6 py-3 border-t bg-gray-50">
        <div className="flex justify-between items-center">
          <SkeletonText width="w-32" height="h-3" />
          <div className="flex gap-2">
            <SkeletonText width="w-8" height="h-8" />
            <SkeletonText width="w-8" height="h-8" />
            <SkeletonText width="w-8" height="h-8" />
            <SkeletonText width="w-8" height="h-8" />
            <SkeletonText width="w-8" height="h-8" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ============ END SKELETON LOADING COMPONENTS ============

const DocumentsTab = ({ patient }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [documentName, setDocumentName] = useState("");
  const [documentDate, setDocumentDate] = useState("");
  const [uploading, setUploading] = useState(false);
  const [editingDocument, setEditingDocument] = useState(null);
  const [viewingDocument, setViewingDocument] = useState(null);
  const [deletingDocument, setDeletingDocument] = useState(null);
  const [editFile, setEditFile] = useState(null);
  const [editDocumentName, setEditDocumentName] = useState("");
  const [editDocumentDate, setEditDocumentDate] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const itemsPerPage = 5;

  // ✅ Resolved signed URL for the document currently in the viewer
  const [viewingFileUrl, setViewingFileUrl] = useState(null);
  const [isResolvingFileUrl, setIsResolvingFileUrl] = useState(false);

  // Get auth user for hospitalId
  const authUser = getAuthUser();
  const hospitalId = authUser?.hospitalId || authUser?.id;
  
  // ✅ FIX: Get patient's userId from patient object
  const patientUserId = patient?.userId;
  
  const userRole = authUser?.role || "documents";

  const { 
    data: documentsData, 
    isLoading: isLoadingDocuments,
    refetch: refetchDocuments 
  } = useGetDocumentsQuery(
    { patientId: patient?.id },
    { skip: !patient?.id }
  );

  const [createDocument] = useCreateDocumentMutation();
  const [deleteDocument] = useDeleteDocumentMutation();
  const [updateDocument] = useUpdateDocumentMutation();

  const documentsList = documentsData?.data || patient?.documentsList || [];
  const totalItems = documentsList.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDocuments = documentsList.slice(startIndex, startIndex + itemsPerPage);

  // ========================
  // REAL-TIME DOCUMENT EVENTS
  // ========================
  const refreshDocs = useCallback(async () => {
    if (patient?.id) {
      await refetchDocuments();
    }
  }, [refetchDocuments, patient?.id]);

  useEffect(() => {
    if (!patient?.id) return;

    registerDocumentEvents({
      onRegistered: async ({ message, data }) => {
        if (data?.patientId && String(data.patientId) !== String(patient.id)) return;
        if (
          data?.hospitalId &&
          hospitalId &&
          String(data.hospitalId) !== String(hospitalId)
        ) return;
        await refreshDocs();
      },

      onUpdated: async ({ message, data }) => {
        if (data?.patientId && String(data.patientId) !== String(patient.id)) return;
        if (
          data?.hospitalId &&
          hospitalId &&
          String(data.hospitalId) !== String(hospitalId)
        ) return;
        await refreshDocs();
      },

      onDeleted: async ({ message, data }) => {
        if (data?.patientId && String(data.patientId) !== String(patient.id)) return;
        if (
          data?.hospitalId &&
          hospitalId &&
          String(data.hospitalId) !== String(hospitalId)
        ) return;
        await refreshDocs();
      },
    });

    return () => {
      unregisterDocumentEvents();
    };
  }, [patient?.id, hospitalId, refreshDocs]);

  // ========================
  // RESOLVE SIGNED URL FOR VIEWER
  // ========================
  useEffect(() => {
    let isActive = true;

    const resolveFileUrl = async () => {
      if (!viewingDocument) {
        setViewingFileUrl(null);
        return;
      }

      const fileKey =
        viewingDocument.fileKey ||
        viewingDocument.imageUrl ||
        viewingDocument.fileUrl;

      if (!fileKey || typeof fileKey !== "string") {
        setViewingFileUrl(null);
        return;
      }

      try {
        setIsResolvingFileUrl(true);

        const url = await getS3ImageUrl(fileKey);

        if (isActive) {
          setViewingFileUrl(
            typeof url === "string" ? url : null
          );
        }
      } catch (error) {
        console.error("Failed to resolve document URL:", error);

        if (isActive) {
          setViewingFileUrl(null);
        }
      } finally {
        if (isActive) {
          setIsResolvingFileUrl(false);
        }
      }
    };

    resolveFileUrl();

    return () => {
      isActive = false;
    };
  }, [viewingDocument]);

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

  const isImageFile = (fileType) => {
    if (!fileType) return false;
    const imageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    const ext = getFileExtension(fileType).toLowerCase();
    const imageExts = ['png', 'jpg', 'jpeg', 'webp', 'gif'];
    return imageTypes.includes(fileType) || imageExts.includes(ext);
  };

  const isPDFFile = (fileType) => {
    if (!fileType) return false;
    return fileType === 'application/pdf' || getFileExtension(fileType) === 'PDF';
  };

  const getFileIcon = (item) => {
    const fileType = item.fileType || item.type;
    if (isImageFile(fileType)) {
      return <Image size={16} className="text-green-500 flex-shrink-0" />;
    } else if (isPDFFile(fileType)) {
      return <FileText size={16} className="text-red-500 flex-shrink-0" />;
    } else {
      return <File size={16} className="text-blue-500 flex-shrink-0" />;
    }
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
  // CREATE DOCUMENT WITH S3 UPLOAD
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

  const handleUpload = async () => {
    if (!documentName.trim()) {
      showWarningToast("Please enter a document name");
      return;
    }

    if (!documentDate) {
      showWarningToast("Please select a date");
      return;
    }

    if (!selectedFile) {
      showWarningToast("Please select a file to upload");
      return;
    }

    if (!patientUserId) {
      showErrorToast("❌ Patient user ID not found.");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const documentData = {
        patientId: patient.id,
        name: documentName.trim(),
        documentName: documentName.trim(),
        date: documentDate,
        userId: patient.userId,  
        uploadedById: patientUserId,
        hospitalId: hospitalId || null,
        role: userRole,
      };

      const createResult = await createDocument(documentData).unwrap();

      const documentId = 
        createResult?.data?.id ||      
        createResult?.id ||            
        createResult?.data?._id ||     
        createResult?._id ||           
        createResult?.data?.documentId ||
        createResult?.documentId;
      
      if (!documentId) {
        console.error("❌ Could not extract document ID. Response:", createResult);
        throw new Error(`Document ID not found in response: ${JSON.stringify(createResult)}`);
      }

      setUploadProgress(30);

      const timestamp = Date.now();
      const safeFileName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileKey = `documents/${documentId}/${timestamp}_${safeFileName}`;

      const s3Result = await uploadToS3(
        selectedFile,
        fileKey,
        documentId,
        "documents"
      );

      setUploadProgress(80);

      const updateData = {
        fileKey: s3Result.key,
        fileUrl: s3Result.imageUrl,
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        fileSize: formatFileSize(selectedFile.size),
        type: getFileExtension(selectedFile.name),
        contentType: selectedFile.type,
        uploadedById: patientUserId,
        hospitalId: hospitalId || null,
      };

      await updateDocument({
        id: documentId,
        updateData: updateData
      }).unwrap();

      setUploadProgress(100);

      showSuccessToast(` Document "${documentName}" uploaded successfully!`);
      
      setDocumentName("");
      setDocumentDate("");
      setSelectedFile(null);
      setShowUploadModal(false);
      setUploadProgress(0);
      refetchDocuments();
      
    } catch (error) {
      console.error("❌ Upload failed:", error);
      
      let errorMessage = "Unknown error";
      if (error.data?.message) {
        errorMessage = error.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showErrorToast(`❌ Failed to upload document: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  // ========================
  // EDIT DOCUMENT WITH S3 UPLOAD
  // ========================

  const handleEditDocument = (document) => {
    setEditingDocument(document);
    setEditDocumentName(document.documentName || document.name || "");
    setEditDocumentDate(document.date || "");
    setEditFile(null);
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
  };

  const handleUpdateDocument = async () => {
    if (!editDocumentName.trim()) {
      showWarningToast("Please enter a document name");
      return;
    }

    if (!editDocumentDate) {
      showWarningToast("Please select a date");
      return;
    }

    if (!patientUserId) {
      showErrorToast("❌ Patient user ID not found.");
      return;
    }

    const documentId = editingDocument.id || editingDocument._id;
    if (!documentId) {
      showErrorToast("❌ Document ID not found.");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      let updateData = {
        patientId: patient.id,
        name: editDocumentName.trim(),
        documentName: editDocumentName.trim(),
        date: editDocumentDate,
        uploadedById: patientUserId,
        hospitalId: hospitalId || null,
        role: userRole,
      };

      if (editFile) {
        const timestamp = Date.now();
        const safeFileName = editFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileKey = `documents/${documentId}/${timestamp}_${safeFileName}`;

        setUploadProgress(20);

        const s3Result = await uploadToS3(
          editFile,
          fileKey,
          documentId,
          "documents"
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
          uploadedById: patientUserId,
          hospitalId: hospitalId || null,
        };
      }

      await updateDocument({
        id: documentId,
        updateData: updateData
      }).unwrap();

      setUploadProgress(100);

      showSuccessToast(` Document "${editDocumentName}" updated successfully!`);
      
      setShowEditModal(false);
      setEditingDocument(null);
      setEditDocumentName("");
      setEditDocumentDate("");
      setEditFile(null);
      setUploadProgress(0);
      refetchDocuments();
      
    } catch (error) {
      console.error("❌ Update failed:", error);
      
      let errorMessage = "Unknown error";
      if (error.data?.message) {
        errorMessage = error.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showErrorToast(`❌ Failed to update document: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  // ========================
  // DELETE DOCUMENT
  // ========================

  const handleDeleteClick = (document) => {
    const docId = document.id || document._id;
    if (!docId) {
      showErrorToast("❌ Document ID not found.");
      return;
    }
    setDeletingDocument(document);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingDocument) return;

    const docId = deletingDocument.id || deletingDocument._id;
    const docName = deletingDocument.documentName || deletingDocument.name || "Untitled";

    setIsDeleting(true);

    try {
      await deleteDocument(docId).unwrap();
      showSuccessToast(` Document "${docName}" deleted successfully!`);
      setShowDeleteModal(false);
      setDeletingDocument(null);
      refetchDocuments();
      
      const remainingItems = documentsList.length - 1;
      const maxPage = Math.ceil(remainingItems / itemsPerPage);
      if (currentPage > maxPage && maxPage > 0) {
        setCurrentPage(maxPage);
      }
    } catch (error) {
      console.error("❌ Delete failed:", error);
      showErrorToast(`❌ Failed to delete document: ${error.message || error.data?.message || "Unknown error"}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setDeletingDocument(null);
    setIsDeleting(false);
  };

  // ========================
  // VIEW & DOWNLOAD
  // ========================

  const handleViewDocument = (document) => {
    setViewingDocument(document);
    setShowViewModal(true);
  };

  const handleDownloadDocument = async (item) => {
    try {
      const fileKey =
        item.fileKey ||
        item.imageUrl ||
        item.fileUrl;

      if (!fileKey || typeof fileKey !== "string") {
        showWarningToast("No file attached to download");
        return;
      }

      const url = await getS3ImageUrl(fileKey);

      if (!url || typeof url !== "string") {
        showWarningToast("Unable to load document URL");
        return;
      }

      window.open(url, "_blank");
    } catch (error) {
      console.error("Download error:", error);
      showErrorToast("Failed to open document");
    }
  };

  // ✅ Downloads the already-resolved signed URL as a blob (used by the new modal)
  const handleDownloadDocumentFile = async (document, url) => {
    if (!url) return;

    const fileName =
      document?.fileName ||
      document?.documentName ||
      document?.name ||
      "document";

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to download file");
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Download error:", error);
      // Fallback: just open the signed URL
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  // ========================
  // RESET FUNCTIONS
  // ========================

  const resetUploadForm = () => {
    setDocumentName("");
    setDocumentDate("");
    setSelectedFile(null);
    setShowUploadModal(false);
    setUploadProgress(0);
  };

  const resetEditForm = () => {
    setShowEditModal(false);
    setEditingDocument(null);
    setEditDocumentName("");
    setEditDocumentDate("");
    setEditFile(null);
    setUploadProgress(0);
  };

  const resetViewForm = () => {
    setShowViewModal(false);
    setViewingDocument(null);
    setViewingFileUrl(null);
    setIsResolvingFileUrl(false);
  };

  // ========================
  // PAGINATION
  // ========================

  useEffect(() => {
    if (viewingDocument) {
      setCurrentPage(1);
    }
  }, [viewingDocument]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ========================
  // RENDER
  // ========================

  if (isLoadingDocuments) {
    return <DocumentsSkeleton />;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50 flex-shrink-0">
        <h2 className="text-sm font-semibold text-gray-700">
          Total Documents
          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded ml-2">
            {totalItems}
          </span>
        </h2>
        
        <button
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2 bg-[#1C62A0] text-white rounded-lg cursor-pointer hover:bg-[#154f7a] transition-colors flex items-center gap-2 text-sm"
        >
          <Upload size={16} />
          Upload Document
        </button>
      </div>

      {/* UPLOAD MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Upload Document</h3>
              <button
                onClick={resetUploadForm}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                disabled={uploading}
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  placeholder="e.g., Medical Report, Prescription, Lab Results"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent"
                  disabled={uploading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <DatePicker
                  value={documentDate}
                  onChange={(isoDate) => setDocumentDate(isoDate)}
                  mode="past"
                  placeholder="DD/MM/YYYY"
                  disabled={uploading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

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

              {selectedFile && !uploading && (
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <div className="flex items-center gap-3">
                    {selectedFile.type.startsWith('image/') ? (
                      <Image size={20} className="text-green-500" />
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

              <div className="flex gap-3 pt-4">
                <button
                  onClick={resetUploadForm}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!documentName.trim() || !documentDate || !selectedFile || uploading}
                  className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors flex items-center justify-center gap-2 ${
                    !documentName.trim() || !documentDate || !selectedFile || uploading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-[#1C62A0] hover:bg-[#154f7a]"
                  }`}
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Upload Document
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && editingDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Edit Document</h3>
              <button
                onClick={resetEditForm}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                disabled={uploading}
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editDocumentName}
                  onChange={(e) => setEditDocumentName(e.target.value)}
                  placeholder="e.g., Medical Report, Prescription, Lab Results"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent"
                  disabled={uploading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <DatePicker
                  value={editDocumentDate}
                  onChange={(isoDate) => setEditDocumentDate(isoDate)}
                  mode="past"
                  placeholder="DD/MM/YYYY"
                  disabled={uploading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              {editingDocument.fileKey && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    {isImageFile(editingDocument.fileType || editingDocument.type) ? (
                      <File size={20} className="text-blue-500" />
                    ) : (
                      <File size={20} className="text-blue-500" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">Current File</p>
                      <p className="text-xs text-gray-500">
                        {editingDocument.fileName || "File"} • {editingDocument.fileSize || "N/A"}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDownloadDocument(editingDocument)}
                      className="text-blue-600 hover:text-blue-800 text-xs underline"
                    >
                      View
                    </button>
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
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <div className="flex items-center gap-3">
                    <File size={20} className="text-green-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{editFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(editFile.size)} • {getFileExtension(editFile.name)}
                      </p>
                    </div>
                    <button
                      onClick={() => setEditFile(null)}
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
                  onClick={handleUpdateDocument}
                  disabled={!editDocumentName.trim() || !editDocumentDate || uploading}
                  className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors flex items-center justify-center gap-2 ${
                    !editDocumentName.trim() || !editDocumentDate || uploading
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
                      Update Document
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ COMPACT DOCUMENT VIEW MODAL ============ */}
      {showViewModal && viewingDocument && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-xl rounded-xl shadow-xl overflow-hidden max-h-[88vh] flex flex-col">
            {/* HEADER */}
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <FileText size={21} className="text-[#1C62A0]" />
                </div>

                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-gray-800">
                    Document Details
                  </h2>
                  <p className="text-xs text-gray-500 truncate">
                    {viewingDocument.documentName || viewingDocument.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {viewingFileUrl && (
                  <>
                    <button
                      onClick={() =>
                        window.open(viewingFileUrl, "_blank", "noopener,noreferrer")
                      }
                      className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                      title="Open in new tab"
                    >
                      <ExternalLink size={17} />
                    </button>

                    <button
                      onClick={() =>
                        handleDownloadDocumentFile(
                          viewingDocument,
                          viewingFileUrl
                        )
                      }
                      className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                      title="Download"
                    >
                      <Download size={17} />
                    </button>
                  </>
                )}

                <button
                  onClick={resetViewForm}
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                >
                  <X size={19} />
                </button>
              </div>
            </div>

            {/* BODY */}
            <div className="p-5 overflow-y-auto space-y-5">
              {/* FILE PREVIEW */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs font-semibold text-gray-600">
                    ATTACHED DOCUMENT
                  </p>
                  <span className="text-xs text-gray-400">
                    {viewingDocument.fileSize || ""}
                  </span>
                </div>

                <div className="h-56 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden p-2">
                  {isResolvingFileUrl ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-7 w-7 border-2 border-[#1C62A0] border-t-transparent" />
                      <span className="text-xs text-gray-500">
                        Loading document...
                      </span>
                    </div>
                  ) : !viewingFileUrl ? (
                    <div className="text-center text-gray-400">
                      <FileText size={36} className="mx-auto mb-2" />
                      <p className="text-xs">No file available</p>
                    </div>
                  ) : (() => {
                    const fileName =
                      viewingDocument.fileName ||
                      viewingDocument.documentName ||
                      viewingDocument.name ||
                      "Document";

                    const fileType =
                      viewingDocument.fileType ||
                      viewingDocument.contentType ||
                      "";

                    const isPdf =
                      fileType === "application/pdf" ||
                      viewingDocument.type === "PDF" ||
                      /\.pdf(\?.*)?$/i.test(fileName) ||
                      /\.pdf(\?.*)?$/i.test(viewingFileUrl);

                    const isImg =
                      fileType.startsWith("image/") ||
                      /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(fileName) ||
                      /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(viewingFileUrl);

                    if (isPdf) {
                      return (
                        <iframe
                          src={`${viewingFileUrl}#toolbar=0&navpanes=0`}
                          title="Document Preview"
                          className="w-full h-full rounded border-0 bg-white"
                        />
                      );
                    }

                    if (isImg) {
                      return (
                        <img
                          src={viewingFileUrl}
                          alt={fileName}
                          className="max-w-full max-h-full object-contain rounded"
                        />
                      );
                    }

                    return (
                      <div className="text-center">
                        <FileText size={38} className="mx-auto mb-2 text-[#1C62A0]" />
                        <p className="text-sm font-medium text-gray-700">
                          {fileName}
                        </p>
                        <button
                          onClick={() =>
                            window.open(
                              viewingFileUrl,
                              "_blank",
                              "noopener,noreferrer"
                            )
                          }
                          className="mt-2 text-xs text-[#1C62A0] hover:underline"
                        >
                          Open document
                        </button>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* DOCUMENT INFORMATION */}
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">
                  Document Information
                </h3>

                <div className="grid grid-cols-2 gap-x-5 gap-y-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Document Name</p>
                    <p className="text-sm font-medium text-gray-800 break-words">
                      {viewingDocument.documentName || viewingDocument.name || "N/A"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-1">Document Date</p>
                    <p className="text-sm font-medium text-gray-800">
                      {viewingDocument.date
                        ? new Date(viewingDocument.date).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-1">File Type</p>
                    <p className="text-sm font-medium text-gray-800">
                      {viewingDocument.fileType ||
                        viewingDocument.type ||
                        "N/A"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-1">File Size</p>
                    <p className="text-sm font-medium text-gray-800">
                      {viewingDocument.fileSize || "N/A"}
                    </p>
                  </div>

                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 mb-1">File Name</p>
                    <p className="text-sm font-medium text-gray-800 break-all">
                      {viewingDocument.fileName || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* PATIENT INFORMATION */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">
                  Patient Information
                </h3>

                <div className="grid grid-cols-2 gap-x-5 gap-y-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Patient Name</p>
                    <p className="text-sm font-medium text-gray-800">
                      {patient?.name || viewingDocument.patientName || "N/A"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-1">Patient Number</p>
                    <p className="text-sm font-medium text-gray-800">
                      {patient?.patientNumber != null
                        ? `#PT${String(patient.patientNumber).padStart(4, "0")}`
                        : "N/A"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-1">Hospital</p>
                    <p className="text-sm font-medium text-gray-800">
                      {viewingDocument.hospitalName ||
                        patient?.hospitalName ||
                        "N/A"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-1">Uploaded By</p>
                    <p className="text-sm font-medium text-gray-800">
                      {viewingDocument.uploadedByName || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
              <button
                onClick={resetViewForm}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100"
              >
                Close
              </button>

              {viewingFileUrl && (
                <button
                  onClick={() =>
                    handleDownloadDocumentFile(
                      viewingDocument,
                      viewingFileUrl
                    )
                  }
                  className="px-4 py-2 text-sm bg-[#1C62A0] hover:bg-[#154f7a] text-white rounded-lg flex items-center gap-2"
                >
                  <Download size={15} />
                  Download
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* ============ END COMPACT DOCUMENT VIEW MODAL ============ */}

      {/* DELETE MODAL */}
      {showDeleteModal && deletingDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle size={24} className="text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800">Delete Document</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Are you sure you want to delete this document?
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3">
                {getFileIcon(deletingDocument)}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">
                    {deletingDocument.documentName || deletingDocument.name || "Untitled"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {deletingDocument.date 
                      ? new Date(deletingDocument.date).toLocaleDateString() 
                      : "No date"}
                    {deletingDocument.fileName && ` • ${deletingDocument.fileName}`}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancelDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors flex items-center justify-center gap-2 ${
                  isDeleting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete Document
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TABLE */}
      {totalItems === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <File size={32} className="text-gray-400" />
          </div>
          <p className="text-gray-500">No documents found</p>
          <p className="text-sm text-gray-400 mt-1">Click "Upload Document" to add files</p>
        </div>
      ) : (
        <div className="flex flex-col min-h-[420px]">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Document Name</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium text-right w-44">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDocuments.length > 0 ? (
                  paginatedDocuments.map((item, index) => {
                    const hasFile = !!(item.fileKey || item.imageUrl || item.fileUrl);
                    const displayNumber = startIndex + index + 1;

                    return (
                      <tr
                        key={item.id || item._id || index}
                        className="border-t border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <span className="font-medium text-[#1C62A0]">
                            {displayNumber}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {getFileIcon(item)}
                            <span className="font-medium text-gray-800">
                              {item.documentName || item.name}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {item.date
                            ? new Date(item.date).toLocaleDateString()
                            : "N/A"}
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={!hasFile}
                              onClick={() => hasFile && handleViewDocument(item)}
                              title={hasFile ? "View Document" : "No file attached"}
                              className="p-2"
                            >
                              <Eye
                                size={16}
                                className={hasFile ? "text-blue-600 hover:text-blue-800" : "text-gray-300"}
                              />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={!hasFile}
                              onClick={() => hasFile && handleDownloadDocument(item)}
                              title={hasFile ? "Download Document" : "No file attached"}
                              className="p-2"
                            >
                              <Download
                                size={16}
                                className={hasFile ? "text-blue-600 hover:text-blue-800" : "text-gray-300"}
                              />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditDocument(item)}
                              title="Edit Document"
                              className="p-2"
                            >
                              <Edit2
                                size={16}
                                className="text-green-600 hover:text-green-800"
                              />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(item)}
                              title="Delete Document"
                              className="p-2"
                            >
                              <Trash2
                                size={16}
                                className="text-red-600 hover:text-red-800"
                              />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center text-gray-500 py-12">
                      <div className="flex flex-col items-center gap-2">
                        <File size={48} className="text-gray-300" />
                        <p>No documents found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalItems > 0 && totalPages > 1 && (
            <div className="mt-auto px-6 py-3 border-t bg-gray-50">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                itemLabel="documents"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentsTab;