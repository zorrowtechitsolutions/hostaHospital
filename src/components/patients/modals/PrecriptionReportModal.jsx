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
  hospitalId,
  customTemplate = null,
  demoTemplate = null,
}) => {
  const [activeDesign, setActiveDesign] = useState([]);

  /* ---------------------------------------------------------
     DEFAULT REPORT TEMPLATE
  --------------------------------------------------------- */

  const getDefaultTemplate = () => ({
    canvasBg: "#ffffff",
    design: [
      {
        type: "text",
        content: "PRESCRIPTION",
        x: 197,
        y: 36,
        width: 537,
        height: 48,
        style: {
          textAlign: "center",
          bgColor: "transparent",
          color: "#1e293b",
          fontSize: "24px",
          fontWeight: "bold",
        },
      },
      {
        type: "doctorDetails",
        x: 44,
        y: 143,
        width: 196,
        height: 96,
        style: {
          textAlign: "left",
          bgColor: "transparent",
          color: "#1e293b",
          fontSize: "16px",
          fontWeight: "normal",
        },
      },
      {
        type: "prescriptionInfo",
        x: 701,
        y: 131,
        width: 271,
        height: 89,
        style: {
          textAlign: "left",
          bgColor: "transparent",
          color: "#1e293b",
          fontSize: "16px",
          fontWeight: "normal",
        },
      },
      {
        type: "patientGrid",
        x: 39,
        y: 266,
        width: 900,
        height: 80,
        style: {
          textAlign: "left",
          bgColor: "#F9FAFB",
          color: "#1e293b",
          fontSize: "16px",
          fontWeight: "normal",
        },
      },
      {
        type: "chiefComplaint",
        x: 57,
        y: 367,
        width: 842,
        height: 90,
        style: {
          textAlign: "left",
          bgColor: "#fffbeb",
          color: "#1e293b",
          fontSize: "16px",
          fontWeight: "normal",
        },
      },
      {
        type: "medicinesTable",
        x: 40,
        y: 479,
        width: 900,
        height: 202,
        style: {
          textAlign: "left",
          bgColor: "transparent",
          color: "#1e293b",
          fontSize: "16px",
          fontWeight: "normal",
        },
      },
      {
        type: "advice",
        x: 53,
        y: 699,
        width: 876,
        height: 90,
        style: {
          textAlign: "left",
          bgColor: "#ECFDF5",
          color: "#1e293b",
          fontSize: "16px",
          fontWeight: "normal",
        },
      },
      {
        type: "signature",
        x: 634,
        y: 812,
        width: 350,
        height: 90,
        style: {
          textAlign: "center",
          bgColor: "transparent",
          color: "#1e293b",
          fontSize: "16px",
          fontWeight: "bold",
        },
      },
    ],
  });

  /* ---------------------------------------------------------
     UNWRAP API TEMPLATE
  --------------------------------------------------------- */

  const normalizeTemplate = (template) => {
    if (!template) {
      return {
        design: [],
        bgColor: "#ffffff",
      };
    }

    // Already-normalized design array
    if (
      Array.isArray(template) &&
      template.length > 0 &&
      template.some(
        (item) =>
          item &&
          typeof item.x === "number" &&
          typeof item.y === "number"
      )
    ) {
      return {
        design: template,
        bgColor: "#ffffff",
      };
    }

    // API response:
    // design: [{ templateType, canvasBg, design: [...] }]
    if (Array.isArray(template) && template.length > 0) {
      const wrapper = template[0];

      if (Array.isArray(wrapper?.design)) {
        return {
          design: wrapper.design,
          bgColor: wrapper.canvasBg || "#ffffff",
        };
      }
    }

    return {
      design: [],
      bgColor: "#ffffff",
    };
  };

  /* ---------------------------------------------------------
     SELECT TEMPLATE
  --------------------------------------------------------- */

  useEffect(() => {
    let designToUse = [];

    // 1. Existing prescription
    const normalizedPrescription = normalizeTemplate(templateDesign);

    if (normalizedPrescription.design.length > 0) {
      designToUse = normalizedPrescription.design;
    }

    // 2. Custom template
    if (designToUse.length === 0 && customTemplate) {
      const normalizedCustom = normalizeTemplate(customTemplate.design);

      const sameHospital =
        Number(customTemplate.hospitalId) === Number(hospitalId);

      if (sameHospital && normalizedCustom.design.length > 0) {
        designToUse = normalizedCustom.design;
      }
    }

    // 3. Demo template
    if (designToUse.length === 0 && demoTemplate) {
      const normalizedDemo = normalizeTemplate(demoTemplate.design);

      if (normalizedDemo.design.length > 0) {
        designToUse = normalizedDemo.design;
      }
    }

    // 4. Default
    if (designToUse.length === 0) {
      const fallback = getDefaultTemplate();
      designToUse = fallback.design;
    }

    setActiveDesign(designToUse);
  }, [
    templateDesign,
    templateBgColor,
    customTemplate,
    demoTemplate,
    hospitalId,
    existingPrescription,
  ]);

  /* ---------------------------------------------------------
     DATA
  --------------------------------------------------------- */

  const safeMedicines = Array.isArray(existingPrescription?.medications)
    ? existingPrescription.medications
    : [];

  const complaint = existingPrescription?.complaint || "";

  const advice = existingPrescription?.advice || "";

  const nextConsultation = existingPrescription?.next_consultation || "";

  const doctorName =
    doctor?.displayName ||
    doctor?.name ||
    existingPrescription?.doctorName ||
    "Dr. Unknown";

  const doctorSpecialty =
    doctor?.specialization ||
    doctor?.department ||
    existingPrescription?.doctorSpecialization ||
    "General Medicine";

  const doctorContact = doctor?.contact || doctor?.phone || "";

  const patientName = patient?.name || patient?.fullName || "N/A";

  const patientNumber = patient?.patientNumber;

  const patientDisplayId =
    patientNumber !== undefined && patientNumber !== null
      ? `#PT${String(patientNumber).padStart(4, "0")}`
      : patient?.patientId || patient?.id || "N/A";

  const patientAge = patient?.age || "N/A";

  const patientGender = patient?.gender || "N/A";

  const patientPhone =
    patient?.contact ||
    patient?.mobileNumber ||
    patient?.phone ||
    "N/A";

  const prescriptionDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  /* ---------------------------------------------------------
     PLACEHOLDERS
  --------------------------------------------------------- */

  const replaceContent = (content = "") => {
    return content
      .replace(/\{patientName\}/g, patientName)
      .replace(/\{patientId\}/g, patientDisplayId)
      .replace(/\{patientNumber\}/g, patientNumber ?? "N/A")
      .replace(/\{age\}/g, patientAge)
      .replace(/\{gender\}/g, patientGender)
      .replace(/\{contact\}/g, patientPhone)
      .replace(/\{doctorName\}/g, doctorName)
      .replace(/\{doctorSpecialty\}/g, doctorSpecialty)
      .replace(/\{doctorContact\}/g, doctorContact)
      .replace(/\{complaint\}/g, complaint)
      .replace(/\{advice\}/g, advice)
      .replace(/\{date\}/g, prescriptionDate);
  };

  /* ---------------------------------------------------------
     MEDICINE HEIGHT
  --------------------------------------------------------- */

  const getMedicinesTableHeight = () => {
    const headerHeight = 45;
    const rowHeight = 44;
    const padding = 10;
    const minHeight = 120;

    if (safeMedicines.length === 0) {
      return minHeight;
    }

    return Math.max(
      minHeight,
      headerHeight + safeMedicines.length * rowHeight + padding
    );
  };

  const medicinesBlock = activeDesign.find(
    (item) => item.type === "medicinesTable"
  );

  const medicineHeight = getMedicinesTableHeight();

  const originalMedicineHeight = medicinesBlock?.height || 202;

  const heightDifference = Math.max(
    0,
    medicineHeight - originalMedicineHeight
  );

  /* ---------------------------------------------------------
     COMMON BLOCK STYLE
  --------------------------------------------------------- */

  const getBlockStyle = (block, topOverride) => ({
    position: "absolute",

    left: `${block.x || 0}px`,

    top: `${topOverride !== undefined ? topOverride : block.y || 0}px`,

    width: `${block.width || 100}px`,

    height: `${
      block.type === "medicinesTable"
        ? medicineHeight
        : block.height || 50
    }px`,

    backgroundColor: block.style?.bgColor || "transparent",

    color: block.style?.color || "#1e293b",

    fontSize: block.style?.fontSize || "16px",

    fontWeight: block.style?.fontWeight || "normal",

    textAlign: block.style?.textAlign || "left",

    borderRadius: block.style?.borderRadius || "0px",

    boxSizing: "border-box",

    padding: block.style?.padding || "0px",
  });

  /* ---------------------------------------------------------
     RENDER BLOCK
  --------------------------------------------------------- */

  const renderTemplateBlock = (block, index) => {
    if (!block) return null;

    let adjustedTop = block.y || 0;

    if (
      medicinesBlock &&
      block.type !== "medicinesTable" &&
      block.y > medicinesBlock.y
    ) {
      adjustedTop += heightDifference;
    }

    const blockStyle = getBlockStyle(block, adjustedTop);

    switch (block.type) {
      /* --------------------------------
         TEXT
      -------------------------------- */

      case "text":
        return (
          <div
            key={index}
            style={{
              ...blockStyle,
              display: "flex",
              alignItems: "center",
              justifyContent:
                block.style?.textAlign === "center"
                  ? "center"
                  : block.style?.textAlign === "right"
                  ? "flex-end"
                  : "flex-start",
            }}
          >
            {replaceContent(block.content || block.text || "")}
          </div>
        );

      /* --------------------------------
         DOCTOR
      -------------------------------- */

      case "doctorDetails":
        return (
          <div key={index} style={blockStyle}>
            <div
              style={{
                fontSize: block.style?.fontSize || "16px",
                fontWeight: block.style?.fontWeight || "600",
                color: block.style?.color || "#1e293b",
              }}
            >
              {doctorName}
            </div>

            <div
              style={{
                marginTop: "5px",
                fontSize: "14px",
                color: block.style?.color || "#64748b",
              }}
            >
              {doctorSpecialty}
            </div>

            {doctorContact && (
              <div
                style={{
                  marginTop: "5px",
                  fontSize: "12px",
                  color: block.style?.color || "#94a3b8",
                }}
              >
                {doctorContact}
              </div>
            )}
          </div>
        );

      /* --------------------------------
         PRESCRIPTION INFO
      -------------------------------- */

      case "prescriptionInfo":
        return (
          <div key={index} style={blockStyle}>
            <div>
              <strong>Prescription ID:</strong>{" "}
              {existingPrescription?.id || "N/A"}
            </div>

            <div style={{ marginTop: "7px" }}>
              <strong>Date:</strong> {prescriptionDate}
            </div>

            <div style={{ marginTop: "7px" }}>
              <strong>Next Consultation:</strong>{" "}
              {nextConsultation
                ? new Date(nextConsultation).toLocaleDateString()
                : "Not scheduled"}
            </div>
          </div>
        );

      /* --------------------------------
         PATIENT GRID
      -------------------------------- */

      case "patientGrid":
        return (
          <div
            key={index}
            style={{
              ...blockStyle,
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "10px",
              padding: "10px",
              overflow: "hidden",
            }}
          >
            {[
              ["Patient Name", patientName],
              ["Patient ID", patientDisplayId],
              ["Age / Gender", `${patientAge} / ${patientGender}`],
              ["Contact", patientPhone],
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  padding: "10px",
                  background: block.style?.bgColor || "#F9FAFB",
                  border: "1px solid #e5e7eb",
                  borderRadius: "7px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: "600",
                    color: "#64748b",
                    marginBottom: "4px",
                    textTransform: "uppercase",
                  }}
                >
                  {label}
                </div>

                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: block.style?.color || "#0f172a",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>
        );

      /* --------------------------------
         CHIEF COMPLAINT
      -------------------------------- */

      case "chiefComplaint":
        return (
          <div
            key={index}
            style={{
              ...blockStyle,
              padding: block.style?.padding || "12px 16px",
              borderRadius: "8px",
            }}
          >
            <div
              style={{
                fontWeight: block.style?.fontWeight || "600",
                marginBottom: "6px",
                color: block.style?.color || "#92400e",
              }}
            >
              Chief Complaint
            </div>

            <div style={{ color: block.style?.color || "#374151" }}>
              {complaint || "No complaint recorded"}
            </div>
          </div>
        );

      /* --------------------------------
         MEDICINES
      -------------------------------- */

      case "medicinesTable":
        return (
          <div
            key={index}
            style={{
              ...blockStyle,
              overflow: "hidden",
              padding: 0,
            }}
          >
            <table
              style={{
                width: "100%",
                height: "100%",
                borderCollapse: "collapse",
                tableLayout: "fixed",
                fontSize: block.style?.fontSize || "14px",
              }}
            >
              <thead>
                <tr>
                  {[
                    "Medicine Name",
                    "Dosage",
                    "Duration",
                    "Frequency",
                    "Timing",
                    "Instructions",
                  ].map((header) => (
                    <th
                      key={header}
                      style={{
                        padding: "10px 8px",
                        textAlign: "left",
                        background: "#f8fafc",
                        color: block.style?.color || "#1e293b",
                        borderBottom: "1px solid #e5e7eb",
                        fontWeight: "600",
                      }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {safeMedicines.length > 0 ? (
                  safeMedicines.map((med, idx) => (
                    <tr key={idx}>
                      <td
                        style={{
                          padding: "9px 8px",
                          borderBottom: "1px solid #f1f5f9",
                          fontWeight: "500",
                        }}
                      >
                        {med.medicine_name ||
                          med.medicineName ||
                          med.name ||
                          "N/A"}
                      </td>

                      <td
                        style={{
                          padding: "9px 8px",
                          borderBottom: "1px solid #f1f5f9",
                        }}
                      >
                        {med.dosage || "N/A"}
                      </td>

                      <td
                        style={{
                          padding: "9px 8px",
                          borderBottom: "1px solid #f1f5f9",
                        }}
                      >
                        {med.duration || "N/A"}
                      </td>

                      <td
                        style={{
                          padding: "9px 8px",
                          borderBottom: "1px solid #f1f5f9",
                        }}
                      >
                        {med.frequency || "N/A"}
                      </td>

                      <td
                        style={{
                          padding: "9px 8px",
                          borderBottom: "1px solid #f1f5f9",
                        }}
                      >
                        {med.timing || "N/A"}
                      </td>

                      <td
                        style={{
                          padding: "9px 8px",
                          borderBottom: "1px solid #f1f5f9",
                        }}
                      >
                        {med.instructions || "N/A"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        padding: "20px",
                        textAlign: "center",
                        color: "#64748b",
                      }}
                    >
                      No medications prescribed
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );

      /* --------------------------------
         ADVICE
      -------------------------------- */

      case "advice":
        return (
          <div
            key={index}
            style={{
              ...blockStyle,
              padding: block.style?.padding || "12px 16px",
              borderRadius: "8px",
            }}
          >
            <div
              style={{
                fontWeight: "600",
                marginBottom: "6px",
                color: block.style?.color || "#065f46",
              }}
            >
              Doctor Notes & Instructions
            </div>

            <div style={{ color: block.style?.color || "#374151" }}>
              {advice || "No additional advice"}
            </div>
          </div>
        );

      /* --------------------------------
         SIGNATURE
      -------------------------------- */

      case "signature":
        return (
          <div
            key={index}
            style={{
              ...blockStyle,
              paddingTop: "15px",
            }}
          >
            <div
              style={{
                fontSize: block.style?.fontSize || "16px",
                fontWeight: block.style?.fontWeight || "600",
                color: block.style?.color || "#1e293b",
              }}
            >
              {doctorName}
            </div>

            <div
              style={{
                marginTop: "4px",
                fontSize: "14px",
                color: block.style?.color || "#64748b",
              }}
            >
              {doctorSpecialty}
            </div>

            <div
              style={{
                marginTop: "4px",
                fontSize: "12px",
                fontStyle: "italic",
                color: block.style?.color || "#94a3b8",
              }}
            >
              (Digital Signature)
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  /* ---------------------------------------------------------
     PRINT
  --------------------------------------------------------- */

  const handlePrint = () => {
    window.print();
  };

  /* ---------------------------------------------------------
     DOWNLOAD / PRINT WINDOW
  --------------------------------------------------------- */

  const handleDownload = () => {
    const content = document.querySelector(".prescription-content");

    if (!content) return;

    const printWindow = window.open("", "_blank");

    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>
            Prescription - ${patientName}
          </title>

          <style>
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }

            body {
              background: #ffffff;
              font-family: Arial, sans-serif;
            }

            .prescription-content,
            .prescription-inner {
              background: #ffffff !important;
              width: 100%;
            }

            .prescription-inner {
              position: relative;
              margin: 0 auto;
            }

            table {
              border-collapse: collapse;
            }

            @media print {
              @page {
                size: A4;
                margin: 10mm;
              }

              body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
            }
          </style>
        </head>

        <body>
          ${content.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  };

  if (!isOpen) return null;

  if (!activeDesign.length) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <h3 className="text-lg font-semibold">No Template Found</h3>

          <p className="text-sm text-gray-600 mt-2">
            Please create a prescription template first.
          </p>

          <Button onClick={onClose} className="mt-4">
            Close
          </Button>
        </div>
      </div>
    );
  }

  const contentHeight = Math.max(
    940,
    ...activeDesign.map((block) => {
      let bottom = (block.y || 0) + (block.height || 0);

      if (
        medicinesBlock &&
        block.type !== "medicinesTable" &&
        block.y > medicinesBlock.y
      ) {
        bottom += heightDifference;
      }

      if (block.type === "medicinesTable") {
        bottom = block.y + medicineHeight;
      }

      return bottom;
    })
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-xl shadow-2xl"
        style={{
          maxWidth: "95vw",
          maxHeight: "95vh",
          overflow: "auto",
          backgroundColor: "#ffffff",
        }}
      >
        {/* HEADER */}

        <div className="flex justify-between items-center px-6 py-4 border-b bg-white sticky top-0 z-20 no-print">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Prescription Report
            </h2>

            <p className="text-sm text-gray-500">
              Patient: {patientName}
              {" • "}
              {patientDisplayId}
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer size={16} className="mr-2" />
              Print
            </Button>

            <Button variant="outline" onClick={handleDownload}>
              <Download size={16} className="mr-2" />
              PDF
            </Button>

            <Button variant="ghost" onClick={onClose}>
              <X size={18} />
            </Button>
          </div>
        </div>

        {/* REPORT */}

        <div
          className="prescription-content"
          style={{
            padding: "20px",
            backgroundColor: "#ffffff",
          }}
        >
          <div
            className="prescription-inner"
            style={{
              position: "relative",
              width: "990px",
              height: `${contentHeight}px`,
              margin: "0 auto",
              backgroundColor: "#ffffff",
              overflow: "hidden",
            }}
          >
            {activeDesign.map((block, index) =>
              renderTemplateBlock(block, index)
            )}
          </div>
        </div>

        {/* FOOTER */}

        <div className="flex justify-end p-4 border-t bg-white no-print">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionReportModal;