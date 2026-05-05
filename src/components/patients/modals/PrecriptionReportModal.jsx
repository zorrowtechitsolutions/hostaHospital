// src/components/patients/modals/PrescriptionReportModal.jsx - Refactored
import React from "react";
import { X, Printer, Download } from "lucide-react";
import { Button, Badge, Card } from "../../ui";

const PrescriptionReportModal = ({ isOpen, onClose, patient, existingPrescription }) => {
  if (!isOpen) return null;

  const handlePrint = () => window.print();
  const handleDownload = () => alert("Downloading prescription...");
  const medicines = existingPrescription?.medicines || [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden" style={{ maxHeight: '90vh' }}>
        
        <div className="flex justify-between items-center px-6 py-4 border-b bg-white sticky top-0 z-10">
          <h2 className="text-xl font-bold text-gray-800">Prescription Details</h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handlePrint} className="p-2" title="Print Prescription">
              <Printer size={18} />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDownload} className="p-2" title="Download Prescription">
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
            <h3 className="text-lg font-semibold text-gray-800">Medical Prescription</h3>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p><span className="font-semibold">Prescribing Doctor:</span> {existingPrescription?.prescribedBy || "Dr. Sandy Maria"}</p>
              <p><span className="font-semibold">Specialization:</span> General Medicine</p>
              <p><span className="font-semibold">Registration No:</span> MED-2024-001</p>
            </div>
            <div className="space-y-1 text-right">
              <p><span className="font-semibold">Prescription Date:</span> {existingPrescription?.date || new Date().toLocaleDateString()}</p>
              <p><span className="font-semibold">Prescription ID:</span> {existingPrescription?.id || "N/A"}</p>
              <p><span className="font-semibold">Follow-up Date:</span> {new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString()}</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-blue-800 mb-3">Patient Information</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><p className="text-gray-500">Patient Name</p><p className="font-semibold text-gray-800">{patient?.name || "James Carter"}</p></div>
              <div><p className="text-gray-500">Patient ID</p><p className="font-semibold text-gray-800">{patient?.id || "PT0025"}</p></div>
              <div><p className="text-gray-500">Age / Gender</p><p className="font-semibold text-gray-800">{patient?.age || 34}Y / {patient?.gender || "Male"}</p></div>
              <div><p className="text-gray-500">Contact</p><p className="font-semibold text-gray-800">{patient?.phone || "+1 234 567 8900"}</p></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-semibold text-gray-800">Medicines Prescribed</h4>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-800 text-white">
                  <tr><th className="p-3 text-left">Medicine Name</th><th className="p-3 text-left">Dosage</th><th className="p-3 text-left">Duration</th><th className="p-3 text-left">Frequency</th><th className="p-3 text-left">Timing</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {medicines.length > 0 ? medicines.map((med, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="p-3 font-medium text-gray-800">{med.name}</td>
                      <td className="p-3 text-gray-600">{med.dosage}</td>
                      <td className="p-3 text-gray-600">{med.duration}</td>
                      <td className="p-3 text-gray-600">{med.frequency}</td>
                      <td className="p-3 text-gray-600">{med.timing}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan="5" className="p-3 text-center text-gray-500">No medicines found in this prescription</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">Doctor's Notes & Instructions</h4>
            <p className="text-sm text-gray-700">Take medications as prescribed. Complete the full course even if symptoms improve. Avoid alcohol during treatment. Report any adverse reactions immediately.</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="font-semibold text-gray-700">Dietary Advice:</p>
              <p className="text-gray-600 text-xs mt-1">Stay hydrated. Avoid spicy and oily food. Include fruits and vegetables in diet.</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="font-semibold text-gray-700">Next Appointment:</p>
              <p className="text-gray-600 text-xs mt-1">Please schedule a follow-up appointment after completing the medication course.</p>
            </div>
          </div>

          <div className="flex justify-between items-end pt-4 border-t mt-4">
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-100 flex items-center justify-center rounded-lg border">
                <div className="text-xs text-gray-400">QR Code</div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Scan to verify prescription</p>
            </div>
            <div className="text-right">
              <div className="mb-2">
                <p className="italic text-lg text-gray-700">{existingPrescription?.prescribedBy || "Dr. Sandy Maria"}</p>
                <p className="text-xs text-gray-500">MD General Medicine</p>
              </div>
              <div className="border-t-2 border-gray-300 w-48 pt-1">
                <p className="text-xs text-gray-500">Authorized Signature</p>
              </div>
            </div>
          </div>

          <div className="text-center text-xs text-gray-400 pt-4">
            <p>This is a computer generated prescription. No signature is required.</p>
            <p>** Take medicines only as prescribed by the doctor **</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-4 border-t bg-white no-print">
          <Button variant="primary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionReportModal;