// src/components/patients/tabs/DocumentsTab.jsx - With View, Download, and Edit
import React, { useState, Fragment, useEffect } from "react";
import { File, Download, Trash2, Upload, X, ExternalLink, Edit2, Eye, FileText, Image, ChevronLeft, ChevronRight } from "lucide-react";
import { Button, Pagination } from "../../ui";
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
import { getS3ImageUrl } from "../../../../app/service/S3";

// Optional: Uncomment for react-pdf approach
// import { Document, Page, pdfjs } from "react-pdf";
// pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const DocumentsTab = ({ patient }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [documentName, setDocumentName] = useState("");
  const [documentDate, setDocumentDate] = useState("");
  const [uploading, setUploading] = useState(false);
  const [editingDocument, setEditingDocument] = useState(null);
  const [viewingDocument, setViewingDocument] = useState(null);
  const [editFile, setEditFile] = useState(null);
  const [editDocumentName, setEditDocumentName] = useState("");
  const [editDocumentDate, setEditDocumentDate] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pdfPageNumber, setPdfPageNumber] = useState(1);
  const [pdfNumPages, setPdfNumPages] = useState(null);
  const itemsPerPage = 5;

  // RTK Query hooks
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

  // Get documents list from response
  const documentsList = documentsData?.data || patient?.documentsList || [];
  const totalItems = documentsList.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDocuments = documentsList.slice(startIndex, startIndex + itemsPerPage);

  // Debug - check if documents are loading
  useEffect(() => {
    console.log("🔍 ===== DOCUMENTS DEBUG ===== 🔍");
    console.log("👤 Patient ID:", patient?.id);
    console.log("👤 Patient Name:", patient?.name);
    console.log("📄 documentsData:", documentsData);
    console.log("📄 documentsList:", documentsList);
    console.log("📄 Total Items:", totalItems);
    console.log("🔍 ============================= 🔍");
  }, [documentsData, documentsList, totalItems, patient]);

  // Reset PDF page when viewing a new document
  useEffect(() => {
    if (viewingDocument) {
      setPdfPageNumber(1);
      setPdfNumPages(null);
    }
  }, [viewingDocument]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
  };

  // CREATE - No file upload, only name and date
  const handleUpload = async () => {
    if (!documentName.trim()) {
      showWarningToast("Please enter a document name");
      return;
    }

    if (!documentDate) {
      showWarningToast("Please select a date");
      return;
    }

    setUploading(true);

    try {
      console.log("📝 Creating document for patient:", patient?.id);
      
      await createDocument({
        patientId: patient.id,
        name: documentName.trim(),
        date: documentDate,
      }).unwrap();

      showSuccessToast(`✅ Document "${documentName}" created successfully!`);
      
      setDocumentName("");
      setDocumentDate("");
      setShowUploadModal(false);

      refetchDocuments();
      
    } catch (error) {
      console.error("❌ Create failed:", error);
      showErrorToast(`❌ Failed to create document: ${error.message || error.data?.message || "Unknown error"}`);
    } finally {
      setUploading(false);
    }
  };

  // EDIT - With file upload support using Document ID
  const handleEditDocument = (document) => {
    console.log("✏️ Editing document:", document);
    setEditingDocument(document);
    setEditDocumentName(document.documentName || document.name || "");
    setEditDocumentDate(document.date || "");
    setEditFile(null);
    setShowEditModal(true);
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

    setUploading(true);
    setUploadProgress(0);

    try {
      let updateData = {
        patientId: patient.id,
        name: editDocumentName.trim(),
        date: editDocumentDate,
      };

      // If a new file is selected, upload to S3 using Document ID
      if (editFile) {
        console.log("📤 Uploading file to S3...");
        
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 10, 90));
        }, 200);

        const timestamp = Date.now();
        const safeFileName = editFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        
        const documentId = editingDocument.id || editingDocument._id;
        const fileKey = `documents/${documentId}/${timestamp}_${safeFileName}`;
        
        console.log("📁 Document ID:", documentId);
        console.log("📁 File Key:", fileKey);
        
        const { uploadToS3 } = await import("../../../../app/service/S3");
        
        const s3Result = await uploadToS3(
          editFile,
          fileKey,
          documentId,
          "documents"
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
        };

        clearInterval(progressInterval);
        setUploadProgress(100);
      }

      console.log("📝 Updating document:", editingDocument.id);
      console.log("📝 Update Data:", updateData);

      await updateDocument({
        id: editingDocument.id || editingDocument._id,
        updateData: updateData
      }).unwrap();

      showSuccessToast(`✅ Document "${editDocumentName}" updated successfully!`);
      
      setShowEditModal(false);
      setEditingDocument(null);
      setEditDocumentName("");
      setEditDocumentDate("");
      setEditFile(null);
      setUploadProgress(0);

      refetchDocuments();
      
    } catch (error) {
      console.error("❌ Update failed:", error);
      showErrorToast(`❌ Failed to update document: ${error.message || error.data?.message || "Unknown error"}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (id, name) => {
    console.log("🗑️ Deleting document:", id, name);
    
    try {
      await deleteDocument(id).unwrap();
      showSuccessToast(`✅ Document "${name}" deleted successfully!`);
      refetchDocuments();
    } catch (error) {
      console.error("❌ Delete failed:", error);
      showErrorToast(`❌ Failed to delete document: ${error.message || error.data?.message || "Unknown error"}`);
    }
  };

  const handleViewDocument = (document) => {
    console.log("👁️ Viewing document:", document);
    setViewingDocument(document);
    setPdfPageNumber(1);
    setPdfNumPages(null);
    setShowViewModal(true);
  };

  const handleDownloadDocument = (item) => {
    const url = getS3ImageUrl(item.fileKey || item.imageUrl);

    if (!url) {
      showWarningToast("No file attached to download");
      return;
    }

    console.log("📥 Downloading document:", item.documentName || item.name);
    window.open(url, '_blank');
  };

  const resetUploadForm = () => {
    setDocumentName("");
    setDocumentDate("");
    setShowUploadModal(false);
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
    setPdfPageNumber(1);
    setPdfNumPages(null);
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

  // PDF navigation functions for react-pdf approach
  const goToPrevPage = () => {
    setPdfPageNumber(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPdfPageNumber(prev => Math.min(prev + 1, pdfNumPages || prev));
  };

  if (isLoadingDocuments) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1C62A0]"></div>
          <span className="ml-3 text-gray-600">Loading documents...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
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

      {/* Upload Modal - NO FILE UPLOAD, only Name and Date */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Create Document</h3>
              <button
                onClick={resetUploadForm}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
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
                <input
                  type="date"
                  value={documentDate}
                  onChange={(e) => setDocumentDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent"
                  disabled={uploading}
                />
              </div>

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
                  disabled={!documentName.trim() || !documentDate || uploading}
                  className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors flex items-center justify-center gap-2 ${
                    !documentName.trim() || !documentDate || uploading
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
                      Create Document
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Modal - View Document with S3 URL */}
      {showViewModal && viewingDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-5xl w-full max-h-[95vh] overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 truncate">
                {viewingDocument.documentName || viewingDocument.name}
              </h3>
              <button
                onClick={resetViewForm}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[75vh]">
              <div className="flex flex-col items-center">
                {(() => {
                  // Get the full S3 URL using the helper
                  const fileUrl = getS3ImageUrl(viewingDocument.fileKey || viewingDocument.imageUrl);
                  
                  if (!fileUrl) {
                    return (
                      <div className="flex flex-col items-center justify-center p-12 bg-gray-100 rounded-lg w-full">
                        <File size={64} className="text-gray-400 mb-4" />
                        <p className="text-gray-600">No file attached</p>
                      </div>
                    );
                  }

                  // Check if it's a PDF by URL or file type
                  const isPdf = fileUrl.toLowerCase().endsWith('.pdf') || 
                               viewingDocument.fileType === 'application/pdf' ||
                               viewingDocument.type === 'PDF';

                  if (isPdf) {
                    return (
                      <div className="w-full">
                        {/* Quick Fix: Use URL parameters to hide sidebar */}
                        <iframe
                          src={`${fileUrl}#navpanes=0&scrollbar=1&toolbar=1`}
                          className="w-full h-[600px] border-0 rounded-lg"
                          title="PDF Preview"
                        />
                        <div className="mt-4 flex justify-center gap-4">
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                          >
                            <ExternalLink size={16} />
                            Open PDF in New Tab
                          </a>
                          <button
                            onClick={() => handleDownloadDocument(viewingDocument)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                          >
                            <Download size={16} />
                            Download
                          </button>
                        </div>
                      </div>
                    );
                  }

                  // Check if it's an image
                  const isImg = fileUrl.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ||
                               viewingDocument.fileType?.startsWith('image/');

                  if (isImg) {
                    return (
                      <div className="w-full flex flex-col items-center">
                        <img
                          src={fileUrl}
                          alt={viewingDocument.documentName || viewingDocument.name}
                          className="max-h-[600px] mx-auto object-contain rounded-lg shadow-lg"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const parent = e.target.parentElement;
                            if (parent) {
                              parent.innerHTML = `
                                <div class="flex flex-col items-center justify-center p-12 bg-gray-100 rounded-lg w-full">
                                  <FileText size="64" class="text-gray-400 mb-4" />
                                  <p class="text-gray-600">Unable to preview image</p>
                                  <button onclick="window.open('${fileUrl}', '_blank')" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                    Open in New Tab
                                  </button>
                                </div>
                              `;
                            }
                          }}
                        />
                        <div className="mt-4 flex justify-center gap-4">
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                          >
                            <ExternalLink size={16} />
                            Open in New Tab
                          </a>
                          <button
                            onClick={() => handleDownloadDocument(viewingDocument)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                          >
                            <Download size={16} />
                            Download
                          </button>
                        </div>
                      </div>
                    );
                  }

                  // Fallback for other file types
                  return (
                    <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-lg w-full">
                      <File size={64} className="text-blue-500 mb-4" />
                      <p className="text-lg font-medium text-gray-700 mb-2">Document</p>
                      <p className="text-sm text-gray-500 mb-4">
                        {viewingDocument.fileName || viewingDocument.name}
                      </p>
                      <div className="flex gap-4">
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                          <ExternalLink size={16} />
                          Open Document
                        </a>
                        <button
                          onClick={() => handleDownloadDocument(viewingDocument)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                        >
                          <Download size={16} />
                          Download
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* Document Details */}
                <div className="w-full mt-6 grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-lg">
                  <div>
                    <span className="font-semibold text-gray-600">Name:</span>
                    <span className="ml-2 text-gray-800">{viewingDocument.documentName || viewingDocument.name}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-600">Date:</span>
                    <span className="ml-2 text-gray-800">
                      {viewingDocument.date ? new Date(viewingDocument.date).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
              <button
                onClick={resetViewForm}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => handleDownloadDocument(viewingDocument)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Download size={16} />
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal - WITH FILE UPLOAD using Document ID */}
      {showEditModal && editingDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Edit Document</h3>
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
                <input
                  type="date"
                  value={editDocumentDate}
                  onChange={(e) => setEditDocumentDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent"
                  disabled={uploading}
                />
              </div>

              {editingDocument.fileUrl && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    {isImageFile(editingDocument.fileType || editingDocument.type) ? (
                      <img 
                        src={getS3ImageUrl(editingDocument.fileKey)} 
                        alt="Current" 
                        className="h-12 w-12 object-cover rounded"
                      />
                    ) : (
                      <File size={20} className="text-blue-500" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">Current File</p>
                      <p className="text-xs text-gray-500">
                        {editingDocument.fileName || "File"} • {editingDocument.fileSize || "N/A"}
                      </p>
                    </div>
                    <a
                      href={getS3ImageUrl(editingDocument.fileKey)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-xs underline"
                    >
                      View
                    </a>
                  </div>
                </div>
              )}

              {/* File upload field - Optional */}
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

      {/* Table - Document Name, Date, Actions with disabled states */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Document Name</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium text-right w-44">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedDocuments.length > 0 ? (
              paginatedDocuments.map((item, index) => {
                const hasFile = !!(item.fileKey || item.imageUrl || item.fileUrl);

                return (
                  <tr
                    key={item.id || item._id || index}
                    className="border-t border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    {/* Document Name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getFileIcon(item)}
                        <span className="font-medium text-gray-800">
                          {item.documentName || item.name}
                        </span>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {item.date
                        ? new Date(item.date).toLocaleDateString()
                        : "N/A"}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {/* View Button */}
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

                        {/* Download Button */}
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

                        {/* Edit Button */}
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

                        {/* Delete Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDocument(
                            item.id || item._id,
                            item.documentName || item.name
                          )}
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
                <td colSpan={3} className="text-center text-gray-500 py-12">
                  <div className="flex flex-col items-center gap-2">
                    <File size={48} className="text-gray-300" />
                    <p>No documents found</p>
                    <p className="text-xs text-gray-400">Click "Upload Document" to add files</p>
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
            itemLabel="documents"
          />
        </div>
      )}
    </div>
  );
};

export default DocumentsTab;