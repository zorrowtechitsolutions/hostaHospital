// src/components/patients/modals/LaboratoryReportModal.jsx
import React, { useEffect, useState } from "react";
import { X, Download, FileText, ExternalLink } from "lucide-react";
import { Badge } from "../../ui";

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
          setFileUrl(typeof resolvedUrl === "string" ? resolvedUrl : null);
        }
      } catch (error) {
        console.error("Failed to resolve lab report URL:", error);
        if (active) setFileUrl(null);
      } finally {
        if (active) setIsLoadingFile(false);
      }
    };

    resolveFileUrl();

    return () => {
      active = false;
    };
  }, [isOpen, imageKey]);

  if (!isOpen) return null;

  const fileName =
    labResult?.fileName || imageKey.split("/").pop() || "Lab Report";

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
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-xl rounded-xl shadow-xl overflow-hidden max-h-[88vh] flex flex-col">
        {/* HEADER */}
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
              <FileText size={21} className="text-[#1C62A0]" />
            </div>

            <div className="min-w-0">
              <h2 className="text-base font-semibold text-gray-800">
                Lab Result Details
              </h2>
              <p className="text-xs text-gray-500 truncate">
                {labResult?.testName || labResult?.name || "Laboratory Report"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {hasFile && (
              <>
                <button
                  onClick={handleViewInNewTab}
                  disabled={!fileUrl}
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40"
                  title="Open in new tab"
                >
                  <ExternalLink size={17} />
                </button>

                <button
                  onClick={handleDownload}
                  disabled={!fileUrl}
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40"
                  title="Download"
                >
                  <Download size={17} />
                </button>
              </>
            )}

            <button
              onClick={onClose}
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
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-600">
                ATTACHED REPORT
              </p>
              <span className="text-xs text-gray-400">
                {labResult?.fileSize || ""}
              </span>
            </div>

            <div className="h-56 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden p-2">
              {isLoadingFile ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-7 w-7 border-2 border-[#1C62A0] border-t-transparent" />
                  <span className="text-xs text-gray-500">
                    Loading report...
                  </span>
                </div>
              ) : !fileUrl ? (
                <div className="text-center text-gray-400">
                  <FileText size={36} className="mx-auto mb-2" />
                  <p className="text-xs">No file available</p>
                </div>
              ) : isImage ? (
                <img
                  src={fileUrl}
                  alt={fileName}
                  className="max-w-full max-h-full object-contain rounded"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : isPDF ? (
                <iframe
                  src={`${fileUrl}#toolbar=0&navpanes=0`}
                  title="Lab Report Preview"
                  className="w-full h-full rounded border-0 bg-white"
                />
              ) : (
                <div className="text-center">
                  <FileText
                    size={38}
                    className="mx-auto mb-2 text-[#1C62A0]"
                  />
                  <p className="text-sm font-medium text-gray-700">
                    {fileName}
                  </p>
                  <button
                    onClick={handleViewInNewTab}
                    className="mt-2 text-xs text-[#1C62A0] hover:underline"
                  >
                    Open file
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* TEST DETAILS */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">
              Test Information
            </h3>

            <div className="grid grid-cols-2 gap-x-5 gap-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Test Name</p>
                <p className="text-sm font-medium text-gray-800">
                  {labResult?.testName || labResult?.name || "N/A"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <Badge
                  variant={
                    labResult?.status?.toLowerCase() === "completed"
                      ? "success"
                      : "warning"
                  }
                >
                  {labResult?.status || "Pending"}
                </Badge>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Department</p>
                <p className="text-sm font-medium text-gray-800">
                  {labResult?.department || "N/A"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Doctor</p>
                <p className="text-sm font-medium text-gray-800">
                  {labResult?.doctorName || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* PATIENT DETAILS */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">
              Patient Information
            </h3>

            <div className="grid grid-cols-2 gap-x-5 gap-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Patient Name</p>
                <p className="text-sm font-medium text-gray-800">
                  {labResult?.patientName || patient?.name || "N/A"}
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
                  {labResult?.hospitalName || "N/A"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Lab</p>
                <p className="text-sm font-medium text-gray-800">
                  {labResult?.labName || "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            Close
          </button>

          {hasFile && (
            <button
              onClick={handleDownload}
              disabled={!fileUrl}
              className="px-4 py-2 text-sm bg-[#1C62A0] hover:bg-[#154f7a] text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              <Download size={15} />
              Download Report
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LaboratoryReportModal;