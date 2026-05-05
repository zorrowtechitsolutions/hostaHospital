// src/components/patients/modals/LaboratoryReportModal.jsx - Refactored
import React from "react";
import { X, Download, Printer } from "lucide-react";
import { Button, Badge, Card } from "../../ui";

const LaboratoryReportModal = ({ isOpen, onClose, labResult, patient }) => {
  if (!isOpen) return null;

  const reportData = {
    testName: labResult?.testName || "Complete Blood Count (CBC)",
    collectedOn: labResult?.collectedOn || labResult?.appointmentDate || "25 Jan 2024, 10:00 AM",
    reportedOn: labResult?.reportedOn || labResult?.appointmentDate || "25 Jan 2024, 11:00 AM",
    referredBy: labResult?.referredBy || "Dr. Sandy Maria",
    investigations: [
      { name: "Neutrophils", result: 75, refLow: 50, refHigh: 62, unit: "%" },
      { name: "Lymphocytes", result: 90, refLow: 20, refHigh: 40, unit: "%" },
      { name: "Eosinophils", result: 60, refLow: 0, refHigh: 6, unit: "%" },
      { name: "Monocytes", result: 60, refLow: 0, refHigh: 10, unit: "%" },
      { name: "Basophils", result: 95, refLow: 0, refHigh: 2, unit: "%" },
      { name: "Hemoglobin", result: 14.5, refLow: 13, refHigh: 17, unit: "g/dL" },
      { name: "RBC Count", result: 5.2, refLow: 4.5, refHigh: 5.9, unit: "M/µL" },
      { name: "WBC Count", result: 11.5, refLow: 4, refHigh: 11, unit: "K/µL" },
      { name: "Platelet Count", result: 150000, refLow: 150000, refHigh: 410000, unit: "cumm" },
      { name: "MCV", result: 88, refLow: 80, refHigh: 100, unit: "fL" },
      { name: "MCH", result: 29, refLow: 27, refHigh: 33, unit: "pg" },
      { name: "MCHC", result: 33, refLow: 32, refHigh: 36, unit: "g/dL" },
    ]
  };

  const getResultColor = (result, refLow, refHigh) => {
    if (result > refHigh) return "text-red-600 font-semibold";
    if (result < refLow) return "text-orange-600 font-semibold";
    return "text-gray-700";
  };

  const handlePrint = () => window.print();
  const handleDownload = () => alert("Downloading report...");

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden" style={{ maxHeight: '90vh' }}>
        
        <div className="flex justify-between items-center px-6 py-4 border-b bg-white sticky top-0 z-10">
          <h2 className="text-xl font-bold text-gray-800">Laboratory Report</h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handlePrint} className="p-2" title="Print Report">
              <Printer size={18} />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDownload} className="p-2" title="Download Report">
              <Download size={18} />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} className="p-2">
              <X size={18} />
            </Button>
          </div>
        </div>

        <div className="p-8 space-y-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 73px)', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <style>{`div::-webkit-scrollbar { display: none; }`}</style>
          
          <div className="text-center border-b pb-4">
            <h1 className="text-2xl font-bold text-blue-800">Dream's Medical Center</h1>
            <p className="text-gray-600">123 Healthcare Avenue, Medical District, City</p>
            <p className="text-gray-500 text-sm">Phone: +1 (555) 123-4567 | Email: info@dreamsmedical.com</p>
          </div>

          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800">Laboratory Report</h3>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p><span className="font-semibold">Referring Doctor:</span> {reportData.referredBy}</p>
              <p><span className="font-semibold">Test Type:</span> {reportData.testName}</p>
              <p><span className="font-semibold">Lab Number:</span> {labResult?.id || "LAB-2024-001"}</p>
            </div>
            <div className="space-y-1 text-right">
              <p><span className="font-semibold">Collected On:</span> {reportData.collectedOn}</p>
              <p><span className="font-semibold">Reported On:</span> {reportData.reportedOn}</p>
              <p><span className="font-semibold">Status:</span> <Badge variant="success">Final</Badge></p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-3">Patient Information</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><p className="text-gray-500">Patient Name</p><p className="font-semibold text-gray-800">{patient?.name || "James Carter"}</p></div>
              <div><p className="text-gray-500">Patient ID</p><p className="font-semibold text-gray-800">{patient?.id || "PT0025"}</p></div>
              <div><p className="text-gray-500">Age / Gender</p><p className="font-semibold text-gray-800">{patient?.age || 34}Y / {patient?.gender || "Male"}</p></div>
              <div><p className="text-gray-500">Blood Group</p><p className="font-semibold text-gray-800">{patient?.blood || "O+ve"}</p></div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Test Results</h4>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-800 text-white">
                  <tr><th className="p-3 text-left">Investigation</th><th className="p-3 text-left">Result</th><th className="p-3 text-left">Reference Range</th><th className="p-3 text-left">Unit</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reportData.investigations.map((item, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="p-3 font-medium text-gray-800">{item.name}</td>
                      <td className="p-3"><span className={getResultColor(item.result, item.refLow, item.refHigh)}>{item.result}</span></td>
                      <td className="p-3 text-gray-500">{item.refLow} - {item.refHigh}</td>
                      <td className="p-3 text-gray-600">{item.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h4 className="font-semibold text-yellow-800 mb-2">Interpretation</h4>
            <p className="text-sm text-gray-700">
              {reportData.investigations.some(i => i.result > i.refHigh) ? 
                "Elevated levels of multiple parameters detected. Clinical correlation is advised. Patient may have an ongoing infection or inflammatory condition. Follow-up testing recommended." :
                reportData.investigations.some(i => i.result < i.refLow) ?
                "Some parameters are below normal range. Clinical correlation is advised." :
                "All parameters are within normal reference range. No significant abnormalities detected."
              }
            </p>
          </div>

          <div className="flex justify-between items-end pt-4 border-t mt-4">
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-100 flex items-center justify-center rounded-lg border">
                <div className="text-xs text-gray-400">QR Code</div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Scan to verify report</p>
            </div>
            <div className="text-right">
              <div className="mb-2">
                <p className="italic text-lg text-gray-700">Dr. Sandy Maria</p>
                <p className="text-xs text-gray-500">MD Pathology, DNB</p>
              </div>
              <div className="border-t-2 border-gray-300 w-48 pt-1">
                <p className="text-xs text-gray-500">Authorized Signatory</p>
              </div>
            </div>
          </div>

          <div className="text-center text-xs text-gray-400 pt-4">
            <p>This is a computer generated report. No signature is required.</p>
            <p>** Values outside reference range are highlighted in color **</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LaboratoryReportModal;