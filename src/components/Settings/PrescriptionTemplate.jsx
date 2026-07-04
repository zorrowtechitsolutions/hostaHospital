// PrescriptionTemplate.jsx
import React, { useState, useEffect } from "react";
import { Rnd } from "react-rnd";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import PrescriptionReportModal from "../patients/modals/PrecriptionReportModal";
import { useNavigate, useParams } from "react-router-dom";

import {
  useCreatePrescriptionTemplateMutation,
  useUpdatePrescriptionTemplateMutation,
  useGetPrescriptionTemplatesQuery,
  useDeletePrescriptionTemplateMutation,
} from "../../../app/service/prescriptionTemplate";

import { useGetPatientByIdQuery } from "../../../app/service/patients";
import { useGetDoctorByIdQuery } from "../../../app/service/doctorApi";
import { useGetBookingByIdQuery } from "../../../app/service/request";
import { useCreatePrescriptionMutation } from "../../../app/service/prescription";

import { getHospitalId } from "../../utils/auth";

// Component for rendering different block types
const BlockRenderer = ({ block, prescriptionData, doctorData, patientData, onTextChange, isEditable }) => {
  const blockStyle = {
    backgroundColor: block.style?.bgColor || "transparent",
    color: block.style?.color || "#1e293b",
    fontSize: block.style?.fontSize || "16px",
    fontWeight: block.style?.fontWeight || "normal",
    textAlign: block.style?.textAlign || "left",
    borderRadius: block.style?.borderRadius || "0px",
    padding: block.style?.padding || "0px",
  };

  switch (block.type) {
    case "text":
      let displayContent = block.text || block.content || "";
      displayContent = displayContent.replace(/\{doctorName\}/g, doctorData?.displayName || doctorData?.name || "Dr. Unknown");
      displayContent = displayContent.replace(/\{doctorSpecialty\}/g, doctorData?.specialization || doctorData?.department || "General Medicine");
      displayContent = displayContent.replace(/\{doctorContact\}/g, doctorData?.contact || doctorData?.phone || "N/A");
      displayContent = displayContent.replace(/\{patientName\}/g, patientData?.name || patientData?.fullName || "N/A");
      displayContent = displayContent.replace(/\{patientId\}/g, patientData?.id || patientData?.patientId || "N/A");
      displayContent = displayContent.replace(/\{age\}/g, patientData?.age || "N/A");
      displayContent = displayContent.replace(/\{gender\}/g, patientData?.gender || "N/A");
      displayContent = displayContent.replace(/\{contact\}/g, patientData?.contact || patientData?.phone || "N/A");
      displayContent = displayContent.replace(/\{date\}/g, new Date().toLocaleDateString());
      displayContent = displayContent.replace(/\{complaint\}/g, prescriptionData?.complaint || "N/A");
      displayContent = displayContent.replace(/\{advice\}/g, prescriptionData?.advice || "N/A");
      
      return (
        <div
          contentEditable={isEditable && block.editable}
          suppressContentEditableWarning
          onBlur={(e) => onTextChange && onTextChange(block.id, e.target.innerText)}
          className={`w-full h-full outline-none px-2 py-1 rounded ${isEditable && block.editable ? 'cursor-text' : ''}`}
          style={blockStyle}
        >
          {displayContent}
        </div>
      );

    case "prescriptionInfo":
      return (
        <div className="w-full h-full p-3" style={blockStyle}>
          <div style={{ color: block.style?.color || "#4b5563", fontSize: block.style?.fontSize || "14px" }}>
            Prescription ID: <span style={{ color: block.style?.color || "#1f2937" }}>{prescriptionData?.id || "N/A"}</span>
          </div>
          <div style={{ color: block.style?.color || "#4b5563", fontSize: block.style?.fontSize || "14px", marginTop: "4px" }}>
            Date: <span style={{ color: block.style?.color || "#1f2937" }}>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          <div style={{ color: block.style?.color || "#4b5563", fontSize: block.style?.fontSize || "14px", marginTop: "4px" }}>
            Next Consulting: <span style={{ color: block.style?.color || "#1f2937" }}>{prescriptionData?.next_consultation ? new Date(prescriptionData.next_consultation).toLocaleDateString() : "Not scheduled"}</span>
          </div>
        </div>
      );

    case "patientGrid":
      return (
        <div className="w-full h-full p-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="p-3 rounded-lg" style={{ backgroundColor: block.style?.bgColor || "#f9fafb", color: block.style?.color || "#1e293b" }}>
              <p style={{ color: block.style?.color || "#6b7280", fontSize: block.style?.fontSize || "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Patient Name</p>
              <p style={{ fontWeight: "semibold", color: block.style?.color || "#1f2937" }}>{patientData?.name || patientData?.fullName || "N/A"}</p>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: block.style?.bgColor || "#f9fafb", color: block.style?.color || "#1e293b" }}>
              <p style={{ color: block.style?.color || "#6b7280", fontSize: block.style?.fontSize || "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Patient ID</p>
              <p style={{ fontWeight: "semibold", color: block.style?.color || "#1f2937" }}>{patientData?.id || patientData?.patientId || "N/A"}</p>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: block.style?.bgColor || "#f9fafb", color: block.style?.color || "#1e293b" }}>
              <p style={{ color: block.style?.color || "#6b7280", fontSize: block.style?.fontSize || "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Age / Gender</p>
              <p style={{ fontWeight: "semibold", color: block.style?.color || "#1f2937" }}>
                {patientData?.age || "N/A"} / {patientData?.gender || "N/A"}
              </p>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: block.style?.bgColor || "#f9fafb", color: block.style?.color || "#1e293b" }}>
              <p style={{ color: block.style?.color || "#6b7280", fontSize: block.style?.fontSize || "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Contact</p>
              <p style={{ fontWeight: "semibold", color: block.style?.color || "#1f2937" }}>{patientData?.contact || patientData?.phone || "N/A"}</p>
            </div>
          </div>
        </div>
      );

    case "medicinesTable":
      const medications = prescriptionData?.medications || [];
      return (
        <div className="w-full h-full overflow-auto p-2">
          <div className="rounded-xl overflow-hidden shadow-sm border" style={{ borderColor: block.style?.bgColor || "#e5e7eb", backgroundColor: block.style?.bgColor || "#ffffff" }}>
            <table className="w-full text-sm" style={{ backgroundColor: block.style?.bgColor || "#ffffff", color: block.style?.color || "#1e293b" }}>
              <thead>
                <tr style={{ backgroundColor: block.style?.bgColor || "#e0e7ff", borderBottom: "1px solid #e5e7eb" }}>
                  <th className="p-3 text-left font-semibold" style={{ color: block.style?.color || "#374151" }}>Medicine Name</th>
                  <th className="p-3 text-left font-semibold" style={{ color: block.style?.color || "#374151" }}>Dosage</th>
                  <th className="p-3 text-left font-semibold" style={{ color: block.style?.color || "#374151" }}>Duration</th>
                  <th className="p-3 text-left font-semibold" style={{ color: block.style?.color || "#374151" }}>Frequency</th>
                  <th className="p-3 text-left font-semibold" style={{ color: block.style?.color || "#374151" }}>Timing</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "#f3f4f6" }}>
                {medications.length > 0 ? (
                  medications.map((row, idx) => (
                    <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? "transparent" : block.style?.bgColor || "#f9fafb" }}>
                      <td className="p-3 font-medium" style={{ color: block.style?.color || "#1f2937" }}>{row.medicine_name || row.name}</td>
                      <td className="p-3" style={{ color: block.style?.color || "#4b5563" }}>{row.dosage}</td>
                      <td className="p-3" style={{ color: block.style?.color || "#4b5563" }}>{row.duration}</td>
                      <td className="p-3" style={{ color: block.style?.color || "#4b5563" }}>{row.frequency}</td>
                      <td className="p-3" style={{ color: block.style?.color || "#4b5563" }}>{row.timing}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="p-3 text-center" style={{ color: block.style?.color || "#6b7280" }}>No medications prescribed</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      );

    case "doctorDetails":
      return (
        <div className="w-full h-full p-3" style={blockStyle}>
          <div style={{ fontWeight: "500", color: block.style?.color || "#1f2937" }}>Dr. {doctorData?.displayName || doctorData?.name || "Unknown"}</div>
          <div style={{ fontSize: block.style?.fontSize ? `calc(${block.style.fontSize} * 0.875)` : "14px", marginTop: "4px", color: block.style?.color || "#6b7280" }}>{doctorData?.specialization || doctorData?.department || "General Medicine"}</div>
          <div style={{ fontSize: block.style?.fontSize ? `calc(${block.style.fontSize} * 0.75)` : "12px", marginTop: "4px", color: block.style?.color || "#9ca3af" }}>{doctorData?.contact || doctorData?.phone || "N/A"}</div>
        </div>
      );

    case "chiefComplaint":
      return (
        <div className="w-full h-full p-3 rounded-lg" style={{ backgroundColor: block.style?.bgColor || "#fef3c7", color: block.style?.color || "#92400e", fontSize: block.style?.fontSize || "16px", fontWeight: block.style?.fontWeight || "normal" }}>
          <div className="flex items-center gap-2 mb-1" style={{ color: block.style?.color || "#92400e", fontWeight: block.style?.fontWeight || "bold" }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Chief Complaint
          </div>
          <p style={{ color: block.style?.color || "#374151" }}>{prescriptionData?.complaint || "No complaint recorded"}</p>
        </div>
      );

    case "advice":
      return (
        <div className="w-full h-full p-3 rounded-lg" style={{ backgroundColor: block.style?.bgColor || "#d1fae5", color: block.style?.color || "#065f46", fontSize: block.style?.fontSize || "16px" }}>
          <div className="flex items-center gap-2 mb-1" style={{ fontWeight: "bold" }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Doctor Notes & Instructions
          </div>
          <p style={{ color: block.style?.color || "#374151" }}>{prescriptionData?.advice || "No additional advice"}</p>
        </div>
      );

    case "signature":
      return (
        <div className="w-full h-full text-right pt-3 mt-2" style={{ borderTop: `2px solid ${block.style?.bgColor || "#e5e7eb"}`, ...blockStyle }}>
          <div style={{ color: block.style?.color || "#1f2937" }}>Dr. {doctorData?.displayName || doctorData?.name || "Unknown"}</div>
          <div style={{ fontSize: block.style?.fontSize ? `calc(${block.style.fontSize} * 0.875)` : "14px", color: block.style?.color || "#6b7280" }}>{doctorData?.specialization || doctorData?.department || "General Medicine"}</div>
          <div style={{ fontSize: block.style?.fontSize ? `calc(${block.style.fontSize} * 0.75)` : "12px", marginTop: "4px", fontStyle: "italic", color: block.style?.color || "#9ca3af" }}>(Digital Signature)</div>
        </div>
      );

    default:
      return null;
  }
};

// Template Preview Component (Read-only)
const TemplatePreview = ({ template, patientData, doctorData, prescriptionData }) => {
  if (!template || !template.design || template.design.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        No template available
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden">
      <div
        className="relative w-[1000px] h-[920px] rounded-lg shadow-md overflow-hidden border border-gray-200 mx-auto"
        style={{ backgroundColor: template.canvasBg || "#ffffff" }}
      >
        {template.design.map((item, index) => (
          <div
            key={index}
            style={{
              position: "absolute",
              left: item.x || 0,
              top: item.y || 0,
              width: item.width || 200,
              height: item.height || 80,
            }}
          >
            <BlockRenderer
              block={item}
              prescriptionData={prescriptionData}
              doctorData={doctorData}
              patientData={patientData}
              onTextChange={() => {}}
              isEditable={false}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// Custom Template Builder (Editable)
const CustomTemplateBuilder = ({ 
  items, 
  setItems, 
  customCanvasBg, 
  setCustomCanvasBg, 
  patient, 
  doctor, 
  currentPrescription,
  onUpdateContent,
  onUpdatePosition,
  selectedItemId,
  setSelectedItemId,
  isEditable
}) => {
  return (
    <div className="relative w-full overflow-hidden">
      <div
        id="customTemplateCanvas"
        className="relative w-[1000px] h-[920px] rounded-lg shadow-md overflow-hidden border border-gray-200 mx-auto"
        style={{ backgroundColor: customCanvasBg }}
      >
        {items.map((item) => (
          <Rnd
            key={item.id}
            size={{ width: item.width, height: item.height }}
            position={{ x: item.x, y: item.y }}
            bounds="parent"
            disableDragging={!isEditable}
            enableResizing={isEditable}
            resizeHandleStyles={{
              bottomRight: { display: isEditable ? 'block' : 'none' },
              bottomLeft: { display: 'none' },
              topRight: { display: 'none' },
              topLeft: { display: 'none' },
            }}
            onClick={() => setSelectedItemId && setSelectedItemId(item.id)}
            onDragStop={(e, d) => onUpdatePosition && onUpdatePosition(item.id, d.x, d.y)}
            onResizeStop={(e, direction, ref, delta, position) =>
              onUpdatePosition && onUpdatePosition(item.id, position.x, position.y, ref.offsetWidth, ref.offsetHeight)
            }
            className={`transition-all duration-200 ${
              selectedItemId === item.id ? "ring-2 ring-blue-500 ring-offset-2 rounded-lg" : ""
            }`}
          >
            <BlockRenderer
              block={item}
              prescriptionData={currentPrescription || {}}
              doctorData={doctor}
              patientData={patient}
              onTextChange={onUpdateContent}
              isEditable={isEditable}
            />
          </Rnd>
        ))}
      </div>
    </div>
  );
};

const PrescriptionTemplate = () => {
  const { bookingId, patientId, doctorId } = useParams();
  const navigate = useNavigate();
  const hospitalId = getHospitalId();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasCustomTemplate, setHasCustomTemplate] = useState(false);
  const [currentPrescription, setCurrentPrescription] = useState(null);
  const [activeTab, setActiveTab] = useState("demo");
  const [isEditMode, setIsEditMode] = useState(false);

  // Fetch real data
  const { data: patientData, isLoading: patientLoading } = useGetPatientByIdQuery(patientId, { skip: !patientId });
  const { data: doctorData, isLoading: doctorLoading } = useGetDoctorByIdQuery(doctorId, { skip: !doctorId });
  const { data: bookingData, isLoading: bookingLoading } = useGetBookingByIdQuery(bookingId, { skip: !bookingId });
  
  // Fetch existing templates with hospitalId
  const { data: templatesResponse, refetch: refetchTemplates } = useGetPrescriptionTemplatesQuery({ hospitalId });

  const [createPrescriptionTemplate] = useCreatePrescriptionTemplateMutation();
  const [updatePrescriptionTemplate] = useUpdatePrescriptionTemplateMutation();
  const [createPrescription] = useCreatePrescriptionMutation();

  // Filter templates by hospital
  const allTemplates = templatesResponse?.data || [];
  
  // Get demo template - either hospital-specific or global fallback
  const demoTemplate = allTemplates.find(t => 
    t.templateType === "demo" && 
    (Number(t.hospitalId) === Number(hospitalId) || t.hospitalId === null || t.hospitalId === 0)
  ) || null;

  // Get custom template for this specific hospital only
  const customTemplate = allTemplates.find(t => 
    t.templateType === "custom" && 
    Number(t.hospitalId) === Number(hospitalId)
  ) || null;

  // Background color for custom templates
  const [customCanvasBg, setCustomCanvasBg] = useState("#ffffff");
  
  const [saved, setSaved] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [items, setItems] = useState([]);
  const [activeView, setActiveView] = useState("custom");

  const fontSizeOptions = [
    { value: "12px", label: "12px" },
    { value: "14px", label: "14px" },
    { value: "16px", label: "16px" },
    { value: "18px", label: "18px" },
    { value: "20px", label: "20px" },
    { value: "24px", label: "24px" },
    { value: "30px", label: "30px" },
  ];

  // Load custom template from backend or initialize with demo template design
  useEffect(() => {
    if (customTemplate) {
      setItems(
        (customTemplate.design || []).map((item, index) => ({
          ...item,
          id: item.id || index,
          text: item.content || item.text || "",
          style: {
            textAlign: item.style?.textAlign || "left",
            bgColor: item.style?.bgColor || "transparent",
            color: item.style?.color || "#1e293b",
            fontSize: item.style?.fontSize || "16px",
            fontWeight: item.style?.fontWeight || "normal",
          },
          editable: true,
        }))
      );
      setCustomCanvasBg(customTemplate.canvasBg || "#ffffff");
      setHasCustomTemplate(true);
    } else if (demoTemplate) {
      // Initialize custom template with demo template design
      setItems(
        (demoTemplate.design || []).map((item, index) => ({
          ...item,
          id: Date.now() + index,
          text: item.content || item.text || "",
          style: {
            textAlign: item.style?.textAlign || "left",
            bgColor: item.style?.bgColor || "transparent",
            color: item.style?.color || "#1e293b",
            fontSize: item.style?.fontSize || "16px",
            fontWeight: item.style?.fontWeight || "normal",
          },
          editable: true,
        }))
      );
      setCustomCanvasBg(demoTemplate.canvasBg || "#ffffff");
      setHasCustomTemplate(false);
    } else {
      // Create default fallback template if nothing exists
      const defaultTemplate = getDefaultTemplate();
      setItems(defaultTemplate.design);
      setCustomCanvasBg(defaultTemplate.bgColor);
      setHasCustomTemplate(false);
    }
  }, [customTemplate, demoTemplate]);

  // Default fallback template
  const getDefaultTemplate = () => {
    return {
      design: [
        {
          id: 1,
          type: "patientGrid",
          x: 20,
          y: 20,
          width: 950,
          height: 150,
          style: { bgColor: "#f8fafc" }
        },
        {
          id: 2,
          type: "doctorDetails",
          x: 20,
          y: 180,
          width: 400,
          height: 80
        },
        {
          id: 3,
          type: "chiefComplaint",
          x: 20,
          y: 270,
          width: 950,
          height: 80,
          style: { bgColor: "#fef3c7" }
        },
        {
          id: 4,
          type: "medicinesTable",
          x: 20,
          y: 360,
          width: 950,
          height: 250,
          style: { bgColor: "#ffffff" }
        },
        {
          id: 5,
          type: "advice",
          x: 20,
          y: 620,
          width: 950,
          height: 100,
          style: { bgColor: "#d1fae5" }
        },
        {
          id: 6,
          type: "signature",
          x: 20,
          y: 730,
          width: 400,
          height: 80
        },
        {
          id: 7,
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

  const updatePosition = (id, x, y, width, height) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id
          ? {
              ...item,
              x,
              y,
              width: width || item.width,
              height: height || item.height,
            }
          : item
      )
    );
  };

  const updateContent = (id, value) => {
    if (!isEditMode) return;
    setItems((prev) =>
      prev.map((item) =>
        item.id === id && item.type === "text"
          ? {
              ...item,
              text: value,
              content: value,
            }
          : item
      )
    );
  };

  const updateStyle = (id, key, value) => {
    if (!isEditMode) return;
    setItems(prev =>
      prev.map(item =>
        item.id === id
          ? {
              ...item,
              style: {
                ...item.style,
                [key]: value
              }
            }
          : item
      )
    );
  };

  // Generic block creator
  const addBlock = (type) => {
    if (!isEditMode) return;
    
    const defaultStyles = {
      textAlign: "left",
      bgColor: "transparent",
      color: "#1e293b",
      fontSize: "16px",
      fontWeight: "normal"
    };

    let block = {
      id: Date.now(),
      type,
      x: 100,
      y: 100,
      width: 300,
      height: 80,
      style: { ...defaultStyles },
      editable: true,
    };

    switch (type) {
      case "text":
        block.text = "New Text";
        break;
      case "prescriptionInfo":
        block.width = 500;
        block.height = 100;
        block.editable = false;
        break;
      case "patientGrid":
        block.width = 900;
        block.height = 110;
        block.editable = false;
        break;
      case "medicinesTable":
        block.width = 900;
        block.height = 220;
        block.editable = false;
        break;
      case "doctorDetails":
        block.width = 400;
        block.height = 100;
        block.editable = false;
        break;
      case "chiefComplaint":
        block.width = 800;
        block.height = 90;
        block.editable = false;
        break;
      case "advice":
        block.width = 800;
        block.height = 90;
        block.editable = false;
        break;
      case "signature":
        block.width = 350;
        block.height = 90;
        block.editable = false;
        break;
      default:
        break;
    }
    
    setItems((prev) => [...prev, block]);
    setSelectedItemId(block.id);
  };

  const deleteItem = (id) => {
    if (!isEditMode) return;
    
    const protectedTypes = ["patientGrid", "medicinesTable"];
    const itemToDelete = items.find((item) => item.id === id);
    
    if (itemToDelete && protectedTypes.includes(itemToDelete.type)) {
      alert("This block cannot be deleted!");
      return;
    }
    
    if (window.confirm(`Delete this ${itemToDelete?.type || "block"}?`)) {
      setItems((prev) => prev.filter((item) => item.id !== id));
      if (selectedItemId === id) setSelectedItemId(null);
    }
  };

  const deleteSelectedItem = () => {
    if (!isEditMode) {
      alert("Enter edit mode to delete blocks");
      return;
    }
    if (selectedItemId) {
      deleteItem(selectedItemId);
    } else {
      alert("Select a block to delete");
    }
  };

  // Save Template - Creates on first save, Updates on subsequent saves
  const saveTemplate = async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      // Clean up items - remove temporary IDs and editable flag
      const designData = items.map(item => {
        const { id, editable, ...cleanBlock } = item;
        return cleanBlock;
      });

      const payload = {
        templateType: "custom",
        hospitalId: Number(hospitalId),
        canvasBg: customCanvasBg,
        design: designData
      };

      let result;
      if (customTemplate) {
        // UPDATE existing custom template
        result = await updatePrescriptionTemplate({
          id: customTemplate.id,
          data: payload,
        }).unwrap();
      } else {
        // CREATE new custom template (first time save)
        result = await createPrescriptionTemplate(payload).unwrap();
      }
      
      // Refetch to get the latest data
      await refetchTemplates();
      setHasCustomTemplate(true);
      
      setSaved(true);
      setIsEditMode(false);
      setSelectedItemId(null);
      setTimeout(() => setSaved(false), 2000);
      
      alert(customTemplate ? "Custom template updated successfully!" : "Custom template created successfully!");
    } catch (error) {
      alert(`Save failed: ${error?.data?.message || error?.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Create prescription with real data - uses custom template design
  const handleCreatePrescription = async (prescriptionFormData) => {
    try {
      // Use custom template if available for this hospital, otherwise demo
      const selectedTemplate = customTemplate || demoTemplate;
      const designToUse = selectedTemplate?.design || getDefaultTemplate().design;

      const prescriptionPayload = {
        bookingId: parseInt(bookingId),
        hospitalId: Number(hospitalId),
        doctorId: parseInt(doctorId),
        userId: patientData?.data?.userId,
        patientId: parseInt(patientId),
        
        complaint: prescriptionFormData.complaint,
        medications: prescriptionFormData.medications,
        investigations: prescriptionFormData.investigations || [],
        advice: prescriptionFormData.advice,
        
        next_consultation: prescriptionFormData.next_consultation,
        empty_stomach: prescriptionFormData.empty_stomach || false,
        
        // Use hospital-specific template
        templateType: customTemplate ? "custom" : "demo",
        canvasBg: customTemplate?.canvasBg || selectedTemplate?.canvasBg || "#ffffff",
        design: designToUse,
        
        temperature: prescriptionFormData.temperature,
        pulse: prescriptionFormData.pulse,
        respiratoryRate: prescriptionFormData.respiratoryRate,
        spo2: prescriptionFormData.spo2,
        height: prescriptionFormData.height,
        weight: prescriptionFormData.weight,
        bmi: prescriptionFormData.bmi,
        waist: prescriptionFormData.waist,
        bsa: prescriptionFormData.bsa
      };

      const result = await createPrescription(prescriptionPayload).unwrap();
      
      if (result.success) {
        setCurrentPrescription(result.data);
        setIsModalOpen(true);
        alert("Prescription created successfully!");
      }
    } catch (error) {
      alert("Failed to create prescription: " + (error?.data?.message || error?.message));
    }
  };

  const toggleEditMode = () => {
    if (!isEditMode) {
      // Enter edit mode
      if (!customTemplate && demoTemplate) {
        // Initialize with demo template if no custom exists
        setItems(
          (demoTemplate.design || []).map((item, index) => ({
            ...item,
            id: Date.now() + index,
            text: item.content || item.text || "",
            style: {
              textAlign: item.style?.textAlign || "left",
              bgColor: item.style?.bgColor || "transparent",
              color: item.style?.color || "#1e293b",
              fontSize: item.style?.fontSize || "16px",
              fontWeight: item.style?.fontWeight || "normal",
            },
            editable: true,
          }))
        );
        setCustomCanvasBg(demoTemplate.canvasBg || "#ffffff");
      }
      setIsEditMode(true);
      setActiveTab("custom");
    } else {
      // Exit edit mode without saving
      if (window.confirm("Exit without saving changes?")) {
        setIsEditMode(false);
        setSelectedItemId(null);
        // Reload custom template or reset
        if (customTemplate) {
          setItems(
            (customTemplate.design || []).map((item, index) => ({
              ...item,
              id: item.id || index,
              text: item.content || item.text || "",
              style: {
                textAlign: item.style?.textAlign || "left",
                bgColor: item.style?.bgColor || "transparent",
                color: item.style?.color || "#1e293b",
                fontSize: item.style?.fontSize || "16px",
                fontWeight: item.style?.fontWeight || "normal",
              },
              editable: true,
            }))
          );
          setCustomCanvasBg(customTemplate.canvasBg || "#ffffff");
        } else if (demoTemplate) {
          setItems(
            (demoTemplate.design || []).map((item, index) => ({
              ...item,
              id: Date.now() + index,
              text: item.content || item.text || "",
              style: {
                textAlign: item.style?.textAlign || "left",
                bgColor: item.style?.bgColor || "transparent",
                color: item.style?.color || "#1e293b",
                fontSize: item.style?.fontSize || "16px",
                fontWeight: item.style?.fontWeight || "normal",
              },
              editable: true,
            }))
          );
          setCustomCanvasBg(demoTemplate.canvasBg || "#ffffff");
        }
      }
    }
  };

  const exportPDF = async () => {
    const input = document.getElementById("customTemplateCanvas");
    if (!input) return;
    try {
      const canvas = await html2canvas(input, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("prescription.pdf");
    } catch {
      alert("PDF export failed");
    }
  };

  const resetToDefault = async () => {
    if (window.confirm("Reset all changes?")) {
      const defaultTemplate = getDefaultTemplate();
      setItems(defaultTemplate.design);
      setCustomCanvasBg(defaultTemplate.bgColor);
      setSelectedItemId(null);
    }
  };

  const selectedItem = items.find((i) => i.id === selectedItemId);

  const handleBgColorChange = (color) => {
    setCustomCanvasBg(color);
  };

  const applyStyleToSelected = (styleKey, styleValue) => {
    if (selectedItemId && selectedItem?.type === "text") {
      updateStyle(selectedItemId, styleKey, styleValue);
    }
  };

  if (patientLoading || doctorLoading || bookingLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading patient data...</p>
        </div>
      </div>
    );
  }

  const patient = patientData?.data || {};
  const doctor = doctorData?.data || {};
  const booking = bookingData?.data || {};

  return (
    <div className="h-full bg-gray-100">
      <div className="p-6">
        <div className="bg-white rounded-xl shadow-lg mb-4 p-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Prescription Templates</h2>
              <p className="text-sm text-gray-500">View and manage your prescription templates</p>
            </div>
            <div className="flex gap-3">
              {!isEditMode ? (
                <button
                  onClick={toggleEditMode}
                  className="bg-[#1C62A0] text-white px-5 py-2 rounded-lg hover:bg-[#1C62A0]/80 transition-all font-medium flex items-center gap-2 shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Edit Custom Template
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={saveTemplate}
                    disabled={isSaving}
                    className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition-all font-medium flex items-center gap-2 shadow-sm"
                  >
                    {isSaving ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {isSaving ? "Saving..." : "Save Template"}
                  </button>
                  <button
                    onClick={toggleEditMode}
                    className="bg-red-500 text-white px-5 py-2 rounded-lg hover:bg-red-600 transition-all font-medium flex items-center gap-2 shadow-sm"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex gap-6 -mb-px">
              <button
                onClick={() => setActiveTab("demo")}
                className={`py-2 px-1 font-medium text-sm border-b-2 transition-all ${
                  activeTab === "demo"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-xs">Default</span>
                  Demo Template
                </span>
              </button>
              <button
                onClick={() => setActiveTab("custom")}
                className={`py-2 px-1 font-medium text-sm border-b-2 transition-all ${
                  activeTab === "custom"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-xs">
                    {isEditMode ? "Editing" : "Hospital"}
                  </span>
                  Custom Template
                </span>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow p-6">
          {/* Demo Template Tab - Read Only */}
          {activeTab === "demo" && (
            <div>
              <h3 className="font-semibold mb-3 text-gray-700">
                Demo Template
              </h3>
              {demoTemplate ? (
                <TemplatePreview
                  template={demoTemplate}
                  patientData={patient}
                  doctorData={doctor}
                />
              ) : (
                <TemplatePreview
                  template={getDefaultTemplate()}
                  patientData={patient}
                  doctorData={doctor}
                />
              )}
            </div>
          )}

          {/* Custom Template Tab - Editable */}
          {activeTab === "custom" && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-700">
                  {isEditMode ? "Editing Custom Template" : "Custom Template"}
                </h3>
                {isEditMode && (
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      Drag to move • Click to select
                    </span>
                  </div>
                )}
              </div>
              
              {items.length > 0 ? (
                <>
                  <CustomTemplateBuilder
                    items={items}
                    setItems={setItems}
                    customCanvasBg={customCanvasBg}
                    setCustomCanvasBg={setCustomCanvasBg}
                    patient={patient}
                    doctor={doctor}
                    currentPrescription={currentPrescription}
                    onUpdateContent={updateContent}
                    onUpdatePosition={updatePosition}
                    selectedItemId={selectedItemId}
                    setSelectedItemId={setSelectedItemId}
                    isEditable={isEditMode}
                  />
                  
                  {isEditMode && (
                    <div className="mt-4 flex flex-wrap gap-2 items-center justify-between border-t pt-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => addBlock("text")}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-sm flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Add Text
                        </button>
                        <button
                          onClick={() => addBlock("doctorDetails")}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-sm flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Add Doctor
                        </button>
                        <button
                          onClick={() => addBlock("patientGrid")}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-sm flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          Add Patient
                        </button>
                        <button
                          onClick={() => addBlock("chiefComplaint")}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-sm flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Add Complaint
                        </button>
                        <button
                          onClick={() => addBlock("medicinesTable")}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-sm flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Add Medicines
                        </button>
                        <button
                          onClick={() => addBlock("advice")}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-sm flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Add Advice
                        </button>
                        <button
                          onClick={() => addBlock("signature")}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-sm flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          Add Signature
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={deleteSelectedItem}
                          className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete Selected
                        </button>
                        <button
                          onClick={resetToDefault}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-sm flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Reset
                        </button>
                        <button
                          onClick={exportPDF}
                          className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-sm flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z" />
                          </svg>
                          Export PDF
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {selectedItem && selectedItem.type === "text" && isEditMode && (
                    <div className="mt-4 flex flex-wrap gap-3 items-center border-t pt-4">
                      <span className="text-sm font-medium text-gray-700">Style Editor:</span>
                      <select
                        value={selectedItem.style?.fontSize || "16px"}
                        onChange={(e) => applyStyleToSelected("fontSize", e.target.value)}
                        className="px-2 py-1 border rounded text-sm"
                      >
                        {fontSizeOptions.map((size) => (
                          <option key={size.value} value={size.value}>
                            {size.label}
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center gap-3">
                        <label className="text-sm font-medium">
                          Template Background
                        </label>
                        <input
                          type="color"
                          value={customCanvasBg}
                          onChange={(e) => handleBgColorChange(e.target.value)}
                          className="w-10 h-10 rounded cursor-pointer"
                        />
                      </div>
                      
                      <button
                        onClick={() => applyStyleToSelected("textAlign", "left")}
                        className={`px-2 py-1 rounded text-sm ${selectedItem.style?.textAlign === "left" ? "bg-blue-100 text-blue-600" : "bg-gray-100"}`}
                      >
                        Left
                      </button>
                      <button
                        onClick={() => applyStyleToSelected("textAlign", "center")}
                        className={`px-2 py-1 rounded text-sm ${selectedItem.style?.textAlign === "center" ? "bg-blue-100 text-blue-600" : "bg-gray-100"}`}
                      >
                        Center
                      </button>
                      <button
                        onClick={() => applyStyleToSelected("textAlign", "right")}
                        className={`px-2 py-1 rounded text-sm ${selectedItem.style?.textAlign === "right" ? "bg-blue-100 text-blue-600" : "bg-gray-100"}`}
                      >
                        Right
                      </button>
                      
                      <input
                        type="color"
                        value={selectedItem.style?.color || "#000000"}
                        onChange={(e) => applyStyleToSelected("color", e.target.value)}
                        className="w-8 h-8 rounded border cursor-pointer"
                        title="Text Color"
                      />
                      
                      <button
                        onClick={() => applyStyleToSelected(
                          "fontWeight",
                          selectedItem.style?.fontWeight === "bold" ? "normal" : "bold"
                        )}
                        className={`px-2 py-1 rounded text-sm ${selectedItem.style?.fontWeight === "bold" ? "bg-blue-100 text-blue-600 font-bold" : "bg-gray-100"}`}
                      >
                        Bold
                      </button>
                      
                      <button
                        onClick={() => deleteItem(selectedItemId)}
                        className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm"
                      >
                        Delete Block
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-20 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                  <p className="text-lg font-medium">No custom template available</p>
                  <p className="text-sm mt-2">Click "Edit Custom Template" to create one from the demo template</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <PrescriptionReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        patient={patient}
        doctor={doctor}
        booking={booking}
        existingPrescription={currentPrescription}
        templateDesign={currentPrescription?.design || customTemplate?.design || demoTemplate?.design || getDefaultTemplate().design}
        templateBgColor={currentPrescription?.canvasBg || customTemplate?.canvasBg || demoTemplate?.canvasBg || "#ffffff"}
        hospitalId={hospitalId}
      />
    </div>
  );
};

export default PrescriptionTemplate;