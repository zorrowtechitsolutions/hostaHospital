// src/components/patients/modals/LaboratoryReportModal.jsx
import React, { useEffect, useState } from "react";
import { X, Download, FileText, ExternalLink } from "lucide-react";
import { Button, Badge } from "../../ui";

// ✅ Import shared S3 helper (env-driven base URL)
import { getS3ImageUrl } from "../../../../app/service/S3";

const LaboratoryReportModal = ({ isOpen, onClose, labResult, patient }) => {
  const [fileUrl, setFileUrl] = useState(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);

  // Try every possible key the backend may store the S3 object under
  const imageKey =
    labResult?.fileKey ||
    labResult?.fileUrl ||
    labResult?.imageUrl ||
    "";

  // ✅ Resolve the signed URL once, asynchronously, into state
  useEffect(() => {
    let active = true;

    const resolveFileUrl = async () => {
      if (!isOpen || !imageKey || typeof imageKey !== "string") {
        setFileUrl(null);
        setIsLoadingFile(false);
        return;
      }

      setFileUrl(null);
      setIsLoadingFile(true);

      try {
        const resolvedUrl = await getS3ImageUrl(imageKey);

        if (active) {
          setFileUrl(
            typeof resolvedUrl === "string" ? resolvedUrl : null
          );
        }
      } catch (error) {
        console.error("Failed to resolve lab report URL:", error);

        if (active) {
          setFileUrl(null);
        }
      } finally {
        if (active) {
          setIsLoadingFile(false);
        }
      }
    };

    resolveFileUrl();

    return () => {
      active = false;
    };
  }, [isOpen, imageKey]);

  if (!isOpen) return null;

  const fileName =
    labResult?.fileName ||
    imageKey.split("/").pop() ||
    "Lab Report";

  const isImage =
    /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(fileUrl || "") ||
    labResult?.fileType?.startsWith("image/");

  const isPDF =
    /\.pdf(\?.*)?$/i.test(fileUrl || "") ||
    labResult?.fileType === "application/pdf" ||
    labResult?.type === "PDF";

  const hasFile = !!imageKey;

  const handleDownload = async () => {
    if (!fileUrl) return;

    try {
      const response = await fetch(fileUrl);

      if (!response.ok) {
        throw new Error("Failed to download file");
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName || "download";

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Download error:", error);
      window.open(fileUrl, "_blank");
    }
  };

  const handleViewInNewTab = () => {
    if (fileUrl) {
      window.open(fileUrl, "_blank");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden"
        style={{ maxHeight: "90vh" }}
      >
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
                  disabled={!fileUrl}
                  className="p-2"
                  title="Open in New Tab"
                >
                  <ExternalLink size={18} />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                  disabled={!fileUrl}
                  className="p-2"
                  title="Download"
                >
                  <Download size={18} />
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2"
            >
              <X size={18} />
            </Button>
          </div>
        </div>

        <div
          className="p-6 space-y-4 overflow-y-auto"
          style={{ maxHeight: "calc(90vh - 73px)" }}
        >
          {hasFile ? (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  Attached File
                </span>
                <span className="text-xs text-gray-500">
                  {labResult?.fileSize || ""}
                </span>
              </div>

              <div className="p-4 flex justify-center bg-gray-50 min-h-40">
                {isLoadingFile ? (
                  <div className="flex flex-col items-center justify-center p-8 text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#1C62A0] border-t-transparent mb-3" />
                    <p className="text-sm">Loading report...</p>
                  </div>
                ) : !fileUrl ? (
                  <div className="flex flex-col items-center justify-center p-8 text-gray-500">
                    <FileText size={48} className="mb-2" />
                    <p className="text-sm">Unable to load attached file</p>
                  </div>
                ) : isImage ? (
                  <img
                    src={fileUrl}
                    alt={fileName}
                    className="max-h-[400px] max-w-full object-contain rounded"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : isPDF ? (
                  <div className="flex flex-col items-center justify-center p-8 w-full">
                    <FileText size={48} className="text-red-500 mb-4" />
                    <p className="text-sm text-gray-600 mb-2">
                      {fileName}
                    </p>

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
                    <p className="text-sm text-gray-600 mb-2">
                      {fileName}
                    </p>

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

          {/* Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Test Name</p>
              <p className="font-medium text-gray-800">
                {labResult?.testName || labResult?.name || "N/A"}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Status</p>
              <Badge
                variant={
                  labResult?.status === "completed" ? "success" : "warning"
                }
              >
                {labResult?.status || "Pending"}
              </Badge>
            </div>

            <div>
              <p className="text-gray-500">Department</p>
              <p className="font-medium text-gray-800">
                {labResult?.department || "N/A"}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Doctor</p>
              <p className="font-medium text-gray-800">
                {labResult?.doctorName || "N/A"}
              </p>
            </div>
          </div>

          {/* Patient and hospital details */}
          <div className="border-t pt-4 space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Patient Name</p>
                <p className="font-medium text-gray-800">
                  {labResult?.patientName || patient?.name || "N/A"}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Patient Number</p>
                <p className="font-medium text-gray-800">
                  {patient?.patientNumber != null
                    ? `#PT${String(patient.patientNumber).padStart(4, "0")}`
                    : "N/A"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Hospital</p>
                <p className="font-medium text-gray-800">
                  {labResult?.hospitalName || "N/A"}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Lab</p>
                <p className="font-medium text-gray-800">
                  {labResult?.labName || "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LaboratoryReportModal;