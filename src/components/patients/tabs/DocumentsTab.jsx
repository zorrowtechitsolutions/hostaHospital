// src/components/patients/tabs/DocumentsTab.jsx - With Upload File button (Image + PDF only)
import React, { useState } from "react";
import { File, Download, Trash2, Upload, X } from "lucide-react";
import { Button, Table, TableHead, TableBody, TableRow, TableHeader, TableCell, Pagination } from "../../ui";
import { uploadToS3, getS3ImageUrl } from "../../../../app/service/S3";

const DocumentsTab = ({ patient, handleDownloadDocument, handleDeleteClick, onDocumentUpload }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentName, setDocumentName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const itemsPerPage = 5;

  const documentsList = patient?.documentsList || [];
  const totalItems = documentsList.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDocuments = documentsList.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getTypeBadgeClass = (type) => {
    const classes = {
      PDF: "bg-red-100 text-red-700",
      DOC: "bg-blue-100 text-blue-700",
      DOCX: "bg-blue-100 text-blue-700",
      JPG: "bg-green-100 text-green-700",
      JPEG: "bg-green-100 text-green-700",
      PNG: "bg-green-100 text-green-700",
      WEBP: "bg-green-100 text-green-700",
      XLS: "bg-purple-100 text-purple-700",
      XLSX: "bg-purple-100 text-purple-700"
    };
    return classes[type] || "bg-gray-100 text-gray-700";
  };

  const getFileExtension = (filename) => {
    return filename.split('.').pop().toUpperCase();
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type - Only Images and PDFs
    const allowedTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {
      alert("❌ Only Images (PNG, JPEG, WEBP) and PDF files are allowed. No videos, audio, or other file types.");
      e.target.value = '';
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert("❌ File size must be less than 10MB");
      e.target.value = '';
      return;
    }

    setSelectedFile(file);
    // Auto-fill document name from filename (without extension)
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
    setDocumentName(nameWithoutExt);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file first");
      return;
    }

    if (!documentName.trim()) {
      alert("Please enter a document name");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Generate a unique key for the file
      const timestamp = Date.now();
      const safeFileName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileKey = `documents/${patient.id}/${timestamp}_${safeFileName}`;
      
      // Upload to S3
      const result = await uploadToS3(selectedFile, fileKey);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      console.log("File uploaded successfully:", result);

      // Create document object
      const newDocument = {
        id: Date.now(),
        documentName: documentName.trim(),
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        fileKey: result.key,
        fileUrl: result.imageUrl,
        fileSize: formatFileSize(selectedFile.size),
        type: getFileExtension(selectedFile.name),
        date: new Date().toLocaleDateString(),
        uploadDate: new Date().toISOString()
      };

      // Callback to parent component to save document
      if (onDocumentUpload) {
        await onDocumentUpload(newDocument);
      }

      alert(`✅ Document "${documentName}" uploaded successfully!`);
      
      // Reset form
      setSelectedFile(null);
      setDocumentName("");
      setShowUploadModal(false);
      setUploadProgress(0);
      
    } catch (error) {
      console.error("Upload failed:", error);
      alert(`❌ Failed to upload file: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const resetUploadForm = () => {
    setSelectedFile(null);
    setDocumentName("");
    setShowUploadModal(false);
    setUploadProgress(0);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-700">
          Total Documents
          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded ml-2">
            {totalItems}
          </span>
        </h2>
        
        {/* Upload Button */}
        <button
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2 bg-[#1C62A0] text-white rounded-lg cursor-pointer hover:bg-[#154f7a] transition-colors flex items-center gap-2 text-sm"
        >
          <Upload size={16} />
          Upload Document
        </button>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Upload Document</h3>
              <button
                onClick={resetUploadForm}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Field Name Input */}
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

              {/* File Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select File <span className="text-red-500">*</span>
                </label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload size={24} className="text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">
                      {selectedFile ? selectedFile.name : "Click to select or drag and drop"}
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

              {/* Selected File Preview */}
              {selectedFile && !uploading && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <File size={20} className="text-blue-500" />
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

              {/* Action Buttons */}
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
                  disabled={!selectedFile || !documentName.trim() || uploading}
                  className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors flex items-center justify-center gap-2 ${
                    !selectedFile || !documentName.trim() || uploading
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

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
            <tr>
              <TableHeader>Document Name</TableHeader>
              <TableHeader>Date</TableHeader>
              <TableHeader>File Size</TableHeader>
              <TableHeader>Type</TableHeader>
              <TableHeader className="text-right w-24"></TableHeader>
            </tr>
          </thead>
          <tbody>
            {paginatedDocuments.length > 0 ? (
              paginatedDocuments.map((item, index) => (
                <TableRow key={item.id} hover>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <File size={16} className="text-blue-500" />
                      <span className="font-medium text-gray-800">{item.documentName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600">{item.date}</TableCell>
                  <TableCell className="text-gray-500">{item.fileSize}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${getTypeBadgeClass(item.type)}`}>
                      {item.type}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadDocument(item)}
                        className="p-2 hover:text-blue-600"
                        title="Download Document"
                      >
                        <Download size={16} className="text-gray-500 hover:text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick('document', item.id, startIndex + index, item.documentName)}
                        className="p-2 hover:text-red-600"
                        title="Delete Document"
                      >
                        <Trash2 size={16} className="text-gray-500 hover:text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500 py-12">
                  <div className="flex flex-col items-center gap-2">
                    <File size={48} className="text-gray-300" />
                    <p>No documents found</p>
                    <p className="text-xs text-gray-400">Click "Upload Document" to add files</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </tbody>
        </table>
      </div>

      {/* REPLACED INLINE PAGINATION WITH REUSABLE COMPONENT */}
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