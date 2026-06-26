// PrescriptionReportModal.jsx
import React, { useEffect, useState } from "react";
import { X, Printer, Download } from "lucide-react";
import { Button } from "../../ui";

const PrescriptionReportModal = ({
  isOpen,
  onClose,
  patient,
  doctor,
  booking,
  existingPrescription,
  templateDesign = [],
  templateBgColor = "#ffffff",
  hospitalId
}) => {
  const [hasValidTemplate, setHasValidTemplate] = useState(false);
  const [fallbackDesign, setFallbackDesign] = useState([]);
  const [fallbackBg, setFallbackBg] = useState("#ffffff");

  // Default fallback template
  const getDefaultTemplate = () => {
    return {
      design: [
        {
          type: "patientGrid",
          x: 20,
          y: 20,
          width: 950,
          height: 150,
          style: { bgColor: "#f8fafc" }
        },
        {
          type: "doctorDetails",
          x: 20,
          y: 180,
          width: 400,
          height: 80
        },
        {
          type: "chiefComplaint",
          x: 20,
          y: 270,
          width: 950,
          height: 80,
          style: { bgColor: "#fef3c7" }
        },
        {
          type: "medicinesTable",
          x: 20,
          y: 360,
          width: 950,
          height: 250,
          style: { bgColor: "#ffffff" }
        },
        {
          type: "advice",
          x: 20,
          y: 620,
          width: 950,
          height: 100,
          style: { bgColor: "#d1fae5" }
        },
        {
          type: "signature",
          x: 20,
          y: 730,
          width: 400,
          height: 80
        },
        {
          type: "prescriptionInfo",
          x: 500,
          y: 730,
          width: 470,
          height: 80
        }
      ],
      bgColor: "#ffffff"
    };
  };

  useEffect(() => {
    // Validate the template design
    const hasDesignElements = templateDesign && templateDesign.length > 0;
    const hasPositioning = templateDesign.some(item => 
      typeof item.x === 'number' && typeof item.y === 'number'
    );
    
    if (hasDesignElements && hasPositioning) {
      setHasValidTemplate(true);
      setFallbackDesign([]);
    } else {
      // Use fallback template
      setHasValidTemplate(false);
      const defaultTemplate = getDefaultTemplate();
      setFallbackDesign(defaultTemplate.design);
      setFallbackBg(defaultTemplate.bgColor);
    }
  }, [templateDesign]);

  if (!isOpen) return null;

  const handlePrint = () => window.print();
  
  const handleDownload = () => {
    const printContent = document.querySelector('.prescription-content');
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Prescription - ${patient?.name || 'Patient'}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 40px; background: white; }
            .prescription-inner { position: relative; width: 1000px; min-height: 920px; margin: 0 auto; }
            .grid { display: grid; }
            .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
            .grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
            .gap-4 { gap: 16px; }
            .text-right { text-align: right; }
            .font-semibold { font-weight: 600; }
            .font-bold { font-weight: 700; }
            .text-gray-500 { color: #6b7280; }
            .text-gray-800 { color: #1f2937; }
            .text-xs { font-size: 12px; }
            .text-sm { font-size: 14px; }
            .border { border: 1px solid #e5e7eb; }
            .rounded-lg { border-radius: 8px; }
            .rounded-xl { border-radius: 12px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
            th { background-color: #1f2937; color: white; }
            .shadow-sm { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
            .overflow-hidden { overflow: hidden; }
            .divide-y > * + * { border-top: 1px solid #f3f4f6; }
          </style>
        </head>
        <body>
          ${printContent ? printContent.innerHTML : ''}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };
  
  // Extract data from props
  const medicines = existingPrescription?.medications || [];
  const safeMedicines = Array.isArray(medicines) ? medicines : [];
  const complaint = existingPrescription?.complaint || "";
  const advice = existingPrescription?.advice || "";
  const nextConsultation = existingPrescription?.next_consultation || "";
  
  const doctorName = doctor?.displayName || doctor?.name || existingPrescription?.doctorName || "Dr. Unknown";
  const doctorSpecialty = doctor?.specialization || doctor?.department || existingPrescription?.doctorSpecialization || "General Medicine";
  const doctorContact = doctor?.contact || doctor?.phone || "";
  
  const patientName = patient?.name || patient?.fullName || "N/A";
  const patientId = patient?.id || patient?.patientId || "N/A";
  const patientAge = patient?.age || "N/A";
  const patientGender = patient?.gender || "N/A";
  const patientPhone = patient?.contact || patient?.phone || "N/A";

  const replaceContent = (content) => {
    if (!content) return "";
    
    let replaced = content
      .replace(/\{patientName\}/g, patientName)
      .replace(/\{patientId\}/g, patientId)
      .replace(/\{age\}/g, patientAge)
      .replace(/\{gender\}/g, patientGender)
      .replace(/\{contact\}/g, patientPhone)
      .replace(/\{doctorName\}/g, doctorName)
      .replace(/\{doctorSpecialty\}/g, doctorSpecialty)
      .replace(/\{doctorContact\}/g, doctorContact)
      .replace(/\{complaint\}/g, complaint)
      .replace(/\{advice\}/g, advice)
      .replace(/\{date\}/g, new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
    
    return replaced;
  };

  // Calculate dynamic height for medicines table based on row count
  const getMedicinesTableHeight = () => {
    const headerHeight = 50;
    const rowHeight = 45;
    const padding = 20;
    const minHeight = 120;
    
    if (safeMedicines.length === 0) {
      return minHeight;
    }
    
    const calculatedHeight = headerHeight + (safeMedicines.length * rowHeight) + padding;
    return Math.max(minHeight, calculatedHeight);
  };

  // Render template blocks
  const renderTemplateBlock = (block, index) => {
    let blockHeight = block.height;
    let blockMinHeight = block.height;
    
    if (block.type === "medicinesTable") {
      const dynamicHeight = getMedicinesTableHeight();
      blockHeight = dynamicHeight;
      blockMinHeight = dynamicHeight;
    }

    let adjustedTop = block.y;

    const blockStyle = {
      position: "absolute",
      left: `${block.x}px`,
      top: `${adjustedTop}px`,
      width: `${block.width}px`,
      height: `${blockHeight}px`,
      minHeight: `${blockMinHeight}px`,
      backgroundColor: block.style?.bgColor || "transparent",
      color: block.style?.color || "#1e293b",
      fontSize: block.style?.fontSize || "16px",
      fontWeight: block.style?.fontWeight || "normal",
      textAlign: block.style?.textAlign || "left",
      borderRadius: block.style?.borderRadius || "0px",
      padding: block.style?.padding || "0px",
    };

    switch(block.type) {
      case "text":
        return (
          <div key={index} style={blockStyle}>
            {replaceContent(block.content || block.text || "")}
          </div>
        );
      
      case "patientGrid":
        return (
          <div 
            key="patient-grid" 
            style={{
              position: "absolute",
              left: `${block.x}px`,
              top: `${block.y}px`,
              width: `${block.width}px`,
              minHeight: `${block.height}px`,
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "12px",
              padding: "12px",
              borderRadius: "8px",
            }}
          >
            <div style={{
              padding: "12px",
              background: "#f8fafc",
              borderRadius: "8px",
              border: "1px solid #e5e7eb"
            }}>
              <p style={{
                fontSize: "11px",
                fontWeight: "600",
                color: "#64748b",
                letterSpacing: "0.8px",
                textTransform: "uppercase",
                marginBottom: "4px"
              }}>Patient Name</p>
              <p style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "#0f172a"
              }}>{patientName}</p>
            </div>
            <div style={{
              padding: "12px",
              background: "#f8fafc",
              borderRadius: "8px",
              border: "1px solid #e5e7eb"
            }}>
              <p style={{
                fontSize: "11px",
                fontWeight: "600",
                color: "#64748b",
                letterSpacing: "0.8px",
                textTransform: "uppercase",
                marginBottom: "4px"
              }}>Patient ID</p>
              <p style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "#0f172a"
              }}>{patientId}</p>
            </div>
            <div style={{
              padding: "12px",
              background: "#f8fafc",
              borderRadius: "8px",
              border: "1px solid #e5e7eb"
            }}>
              <p style={{
                fontSize: "11px",
                fontWeight: "600",
                color: "#64748b",
                letterSpacing: "0.8px",
                textTransform: "uppercase",
                marginBottom: "4px"
              }}>Age / Gender</p>
              <p style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "#0f172a"
              }}>{patientAge} / {patientGender}</p>
            </div>
            <div style={{
              padding: "12px",
              background: "#f8fafc",
              borderRadius: "8px",
              border: "1px solid #e5e7eb"
            }}>
              <p style={{
                fontSize: "11px",
                fontWeight: "600",
                color: "#64748b",
                letterSpacing: "0.8px",
                textTransform: "uppercase",
                marginBottom: "4px"
              }}>Contact</p>
              <p style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "#0f172a"
              }}>{patientPhone}</p>
            </div>
          </div>
        );
      
      case "medicinesTable":
        return (
          <div key="medicines-table" style={{ 
            ...blockStyle,
            overflow: "auto",
            height: `${getMedicinesTableHeight()}px`,
            minHeight: `${getMedicinesTableHeight()}px`,
          }}>
            <div className="rounded-xl overflow-hidden shadow-sm border" style={{ 
              borderColor: "#e5e7eb", 
              backgroundColor: block.style?.bgColor || "#f8fafc" 
            }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: block.style?.bgColor || "#e0e7ff" }}>
                    <th className="p-3 text-left font-semibold" style={{ color: block.style?.color || "#374151" }}>Medicine Name</th>
                    <th className="p-3 text-left font-semibold" style={{ color: block.style?.color || "#374151" }}>Dosage</th>
                    <th className="p-3 text-left font-semibold" style={{ color: block.style?.color || "#374151" }}>Duration</th>
                    <th className="p-3 text-left font-semibold" style={{ color: block.style?.color || "#374151" }}>Frequency</th>
                    <th className="p-3 text-left font-semibold" style={{ color: block.style?.color || "#374151" }}>Timing</th>
                    <th className="p-3 text-left font-semibold" style={{ color: block.style?.color || "#374151" }}>Instructions</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "#f3f4f6" }}>
                  {safeMedicines.length > 0 ? (
                    safeMedicines.map((med, idx) => (
                      <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? "transparent" : block.style?.bgColor || "#f9fafb" }}>
                        <td className="p-3 font-medium">
                          {med.medicine_name || med.medicineName || med.name || "N/A"}
                        </td>
                        <td className="p-3" style={{ color: block.style?.color || "#4b5563" }}>{med.dosage || "N/A"}</td>
                        <td className="p-3" style={{ color: block.style?.color || "#4b5563" }}>{med.duration || "N/A"}</td>
                        <td className="p-3" style={{ color: block.style?.color || "#4b5563" }}>{med.frequency || "N/A"}</td>
                        <td className="p-3" style={{ color: block.style?.color || "#4b5563" }}>{med.timing || "N/A"}</td>
                        <td className="p-3" style={{ color: block.style?.color || "#4b5563" }}>{med.instructions || "N/A"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="p-3 text-center" style={{ color: block.style?.color || "#6b7280" }}>No medications prescribed</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      
      case "doctorDetails":
        return (
          <div key="doctor-details" style={blockStyle}>
            <div style={{
              fontWeight: block.style?.fontWeight || "500",
              color: block.style?.color || "#1f2937",
              fontSize: block.style?.fontSize || "16px",
            }}>
              {doctorName}
            </div>
            <div style={{ fontSize: "14px", marginTop: "4px", color: block.style?.color || "#6b7280" }}>{doctorSpecialty}</div>
            {doctorContact && <div style={{ fontSize: "12px", marginTop: "4px", color: block.style?.color || "#9ca3af" }}>{doctorContact}</div>}
          </div>
        );
      
      case "chiefComplaint":
        return (
          <div
            key="chief-complaint"
            style={{
              ...blockStyle,
              backgroundColor: block.style?.bgColor || "#fef3c7",
              borderRadius: "8px",
              padding: block.style?.padding || "12px 16px",
            }}
          >
            <div
              style={{
                color: block.style?.color || "#92400e",
                fontWeight: block.style?.fontWeight || "bold",
                marginBottom: "6px",
              }}
            >
              Chief Complaint
            </div>
            <p style={{ color: block.style?.color || "#374151" }}>
              {complaint || "No complaint recorded"}
            </p>
          </div>
        );
      
      case "advice":
        return (
          <div key="advice" style={{ 
            ...blockStyle, 
            backgroundColor: block.style?.bgColor || "#d1fae5", 
            borderRadius: "8px",
            padding: block.style?.padding || "12px 16px",
          }}>
            <div className="flex items-center gap-2 mb-1" style={{ 
              fontWeight: "bold", 
              color: block.style?.color || "#065f46" 
            }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Doctor Notes & Instructions
            </div>
            <p style={{ color: block.style?.color || "#374151" }}>{advice || "No additional advice"}</p>
          </div>
        );
      
      case "prescriptionInfo":
        return (
          <div key="prescription-info" style={blockStyle}>
            <div style={{ color: block.style?.color || "#4b5563", fontSize: "14px" }}>
              Prescription ID: <span style={{ color: block.style?.color || "#1f2937" }}>{existingPrescription?.id || "N/A"}</span>
            </div>
            <div style={{ color: block.style?.color || "#4b5563", fontSize: "14px", marginTop: "4px" }}>
              Date: <span style={{ color: block.style?.color || "#1f2937" }}>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div style={{ color: block.style?.color || "#4b5563", fontSize: "14px", marginTop: "4px" }}>
              Next Consultation: <span style={{ color: block.style?.color || "#1f2937" }}>{nextConsultation ? new Date(nextConsultation).toLocaleDateString() : "Not scheduled"}</span>
            </div>
          </div>
        );
      
      case "signature":
        return (
          <div key="signature" style={{ 
            ...blockStyle, 
            textAlign: "right", 
            borderTop: `2px solid ${block.style?.bgColor || "#e5e7eb"}`, 
            paddingTop: "16px",
            marginTop: "8px",
          }}>
            <div style={{ color: "#1f2937", fontSize: "16px", fontWeight: "500" }}>
              {doctorName}
            </div>
            <div style={{ fontSize: "14px", color: block.style?.color || "#6b7280" }}>{doctorSpecialty}</div>
            <div style={{ fontSize: "12px", marginTop: "4px", fontStyle: "italic", color: block.style?.color || "#9ca3af" }}>(Digital Signature)</div>
          </div>
        );
      
      default:
        return null;
    }
  };

  // Determine which design to use
  const activeDesign = hasValidTemplate ? templateDesign : fallbackDesign;
  const activeBg = hasValidTemplate ? templateBgColor : fallbackBg;

  // If no template design at all, show message
  if (activeDesign.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md">
          <div className="text-center">
            <div className="text-5xl mb-4">📋</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Template Found</h3>
            <p className="text-gray-600 text-sm">Please create a prescription template first.</p>
            <Button onClick={onClose} className="mt-4">Close</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-xl shadow-2xl"
        style={{
          width: "auto",
          maxWidth: "90vw",
          maxHeight: "95vh",
          overflow: "auto"
        }}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b bg-white sticky top-0 z-10 no-print">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Prescription Details</h2>
            <p className="text-sm text-gray-500">Home &gt; Patient Details</p>
          </div>
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

        {/* Prescription Content */}
        <div
          className="prescription-content"
          style={{
            padding: "5px"
          }}
        >
          <div
            className="prescription-inner"
            style={{
              position: "relative",
              width: "990px",
              height: "920px",
              margin: "0 auto",
              background: activeBg,
            }}
          >
            {activeDesign.map((block, index) => renderTemplateBlock(block, index))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 p-4 border-t bg-white no-print">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button variant="primary" onClick={handlePrint}>Print</Button>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionReportModal;