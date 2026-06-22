// src/components/patients/modals/LaboratoryReportModal.jsx - With Direct Download
import React from "react";
import { X, Download, FileText, ExternalLink } from "lucide-react";
import { Button, Badge } from "../../ui";

const S3_BASE_URL = "https://hostahealthcare.s3.eu-north-1.amazonaws.com";

const LaboratoryReportModal = ({ isOpen, onClose, labResult, patient }) => {
  if (!isOpen) return null;

  // Use imageUrl from backend (since backend only stores imageUrl)
  const imageUrl = labResult?.imageUrl || labResult?.fileKey || labResult?.fileUrl || "";
  
  // Build S3 URL directly (bypass encodeURIComponent issues)
  const fileUrl = imageUrl 
    ? `${S3_BASE_URL}/${imageUrl}` 
    : null;

  // Check if it's an image by file extension
  const isImage = /\.(png|jpe?g|gif|webp|svg)$/i.test(imageUrl);
  
  // Check if it's a PDF by file extension
  const isPDF = /\.pdf$/i.test(imageUrl);
  
  const hasFile = !!imageUrl;

  // ✅ Download - Direct download without opening new tab
  const handleDownload = async () => {
    if (!fileUrl) return;

    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = labResult?.fileName || imageUrl.split('/').pop() || 'download';
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: open in new tab if fetch fails
      window.open(fileUrl, '_blank');
    }
  };

  // View in new tab
  const handleViewInNewTab = () => {
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    }
  };

  // Debug logs
  console.log("🔍 Lab Result in Modal:", labResult);
  console.log("🔍 imageUrl:", imageUrl);
  console.log("🔍 fileUrl:", fileUrl);
  console.log("🔍 isImage:", isImage);
  console.log("🔍 isPDF:", isPDF);
  console.log("🔍 hasFile:", hasFile);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden" style={{ maxHeight: '90vh' }}>
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b bg-white sticky top-0 z-10">
          <h2 className="text-xl font-bold text-gray-800">
            {labResult?.testName || labResult?.name || "Lab Report"}
          </h2>
          <div className="flex items-center gap-2">
            {hasFile && (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleViewInNewTab} 
                  className="p-2" 
                  title="Open in New Tab"
                >
                  <ExternalLink size={18} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleDownload} 
                  className="p-2" 
                  title="Download"
                >
                  <Download size={18} />
                </Button>
              </>
            )}
            <Button variant="ghost" size="sm" onClick={onClose} className="p-2">
              <X size={18} />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 73px)' }}>
          
          {/* File Preview */}
          {hasFile ? (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Attached File</span>
                <span className="text-xs text-gray-500">{labResult?.fileSize || ''}</span>
              </div>
              <div className="p-4 flex justify-center bg-gray-50">
                {isImage ? (
                  <img 
                    src={fileUrl} 
                    alt={labResult?.fileName || "Report Image"} 
                    className="max-h-[400px] max-w-full object-contain rounded"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = `
                        <div class="flex flex-col items-center justify-center p-8 text-gray-500">
                          <FileText size="48" class="mb-2" />
                          <p class="text-sm">Unable to load image</p>
                          <button onclick="window.open('${fileUrl}', '_blank')" class="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                            Open in new tab
                          </button>
                        </div>
                      `;
                    }}
                  />
                ) : isPDF ? (
                  <div className="flex flex-col items-center justify-center p-8 w-full">
                    <FileText size={48} className="text-red-500 mb-4" />
                    <p className="text-sm text-gray-600 mb-2">{labResult?.fileName || "PDF Document"}</p>
                    <div className="flex gap-3">
                      <button
                        onClick={handleViewInNewTab}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center gap-2"
                      >
                        <ExternalLink size={16} />
                        View PDF
                      </button>
                      <button
                        onClick={handleDownload}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
                      >
                        <Download size={16} />
                        Download
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 w-full">
                    <FileText size={48} className="text-blue-500 mb-4" />
                    <p className="text-sm text-gray-600 mb-2">{labResult?.fileName || "Document"}</p>
                    <button
                      onClick={handleDownload}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
                    >
                      <Download size={16} />
                      Download
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-400">
              <FileText size={48} className="mx-auto mb-2" />
              <p>No file attached</p>
            </div>
          )}

          {/* Lab Result Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Test Name</p>
              <p className="font-medium text-gray-800">{labResult?.testName || labResult?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500">Status</p>
              <Badge variant={labResult?.status === 'completed' ? 'success' : 'warning'}>
                {labResult?.status || 'Pending'}
              </Badge>
            </div>
            <div>
              <p className="text-gray-500">Department</p>
              <p className="font-medium text-gray-800">{labResult?.department || 'N/A'}</p>
            </div>
            </div>

          {/* Patient Info */}
          <div className="border-t pt-4">
            <p className="text-xs text-gray-500">
              Patient: {patient?.name || 'N/A'} • ID: {patient?.id || 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LaboratoryReportModal;