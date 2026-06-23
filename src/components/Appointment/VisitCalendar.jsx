// src/components/Appointment/VisitCalendar.jsx
import React, { useState, useEffect } from "react";
import { Button, Card } from "../ui";
import { useGetPrescriptionsQuery } from "../../../app/service/prescription";

// Helper function to extract numeric ID from string
const extractNumericId = (id) => {
  if (!id) return null;
  if (typeof id === 'number') return id;
  if (typeof id === 'string') {
    // Remove any non-numeric characters (like #PT0001 -> 1)
    const numericMatch = id.match(/\d+/);
    return numericMatch ? parseInt(numericMatch[0]) : null;
  }
  return null;
};

// Helper to format date consistently
const formatDateKey = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const VisitCalendar = ({ 
  patientId, 
  onDateSelect, 
  selectedDate: externalSelectedDate,
  doctorName,
  department 
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(externalSelectedDate || null);
  const [visitRecords, setVisitRecords] = useState({});

  // Extract numeric ID from patientId
  const numericPatientId = extractNumericId(patientId);

  console.log("VisitCalendar - Patient ID:", patientId);
  console.log("VisitCalendar - Numeric Patient ID:", numericPatientId);

  const {
    data: prescriptionData,
    isLoading,
    error,
  } = useGetPrescriptionsQuery(
    {
      patientId: numericPatientId,
      page: 1,
      limit: 100,
    },
    {
      skip: !numericPatientId,
    }
  );

  // Create visit records from prescription data
  const createVisitRecords = () => {
    const records = {};
    
    if (!prescriptionData) {
      console.log("No prescription data available");
      return records;
    }

    // Extract prescriptions from various possible data structures
    let prescriptions = [];
    
    if (Array.isArray(prescriptionData)) {
      prescriptions = prescriptionData;
    } else if (prescriptionData.data && Array.isArray(prescriptionData.data)) {
      prescriptions = prescriptionData.data;
    } else if (prescriptionData.prescriptions && Array.isArray(prescriptionData.prescriptions)) {
      prescriptions = prescriptionData.prescriptions;
    } else if (prescriptionData.result && Array.isArray(prescriptionData.result)) {
      prescriptions = prescriptionData.result;
    }

    prescriptions.forEach((prescription) => {
      // Try to find the date field
      const dateField = prescription.createdAt || prescription.date || prescription.visitDate || prescription.prescriptionDate || prescription.updatedAt;
      
      if (dateField) {
        const dateKey = formatDateKey(dateField);
        
        // Get medications
        let medications = prescription.medications || prescription.medicines || prescription.prescriptionItems || [];
        if (!Array.isArray(medications)) {
          medications = [];
        }
        
        // Map medication fields for consistent display
        const mappedMedications = medications.map(med => ({
          name: med.medicineName || med.name || med.drugName || med.medication || med.itemName || 
                med.medicine_name || med.medication_name || "Unknown",
          dosage: med.dosage || med.dose || med.strength || med.quantity || 
                  med.dosage_amount || med.dosage_value || "",
          duration: med.duration || med.frequency || med.period || med.days || 
                    med.duration_days || med.frequency_days || "",
        }));
        
        records[dateKey] = {
          complaint: prescription.complaint || prescription.chiefComplaint || prescription.symptoms || "-",
          assessment: prescription.assessment || prescription.diagnosis || prescription.plan || "-",
          notes: prescription.advice || prescription.notes || prescription.note || prescription.doctorNotes || "-",
          medications: mappedMedications,
          doctor: doctorName || prescription.doctorName || prescription.doctor?.name || "-",
          department: department || prescription.department || prescription.doctorDepartment || "-",
          createdAt: dateField,
          nextConsultation: prescription.next_consultation,
          emptyStomach: prescription.empty_stomach,
        };
      }
    });

    return records;
  };

  // Update visit records when prescription data changes
  useEffect(() => {
    if (prescriptionData) {
      const records = createVisitRecords();
      setVisitRecords(records);
    }
  }, [prescriptionData]);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
    for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i));
    return days;
  };

  const days = getDaysInMonth(currentMonth);
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const goToPreviousMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  const goToNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  const goToToday = () => { 
    setCurrentMonth(new Date()); 
    const today = new Date();
    setSelectedDate(today); 
    if (onDateSelect) onDateSelect(today); 
  };

  const isVisitedDate = (date) => {
    if (!date) return false;
    const dateString = formatDateKey(date);
    return visitRecords[dateString] !== undefined;
  };

  const isSelectedDate = (date) => {
    if (!date || !selectedDate) return false;
    return formatDateKey(date) === formatDateKey(selectedDate);
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return formatDateKey(date) === formatDateKey(today);
  };

  const handleDateClick = (date) => {
    if (date) {
      setSelectedDate(date);
      if (onDateSelect) {
        const dateKey = formatDateKey(date);
        const record = visitRecords[dateKey];
        onDateSelect(date, record);
      }
    }
  };

  // Get visit details for the selected date
  const getVisitDetails = (date) => {
    if (!date) return null;
    const dateKey = formatDateKey(date);
    return visitRecords[dateKey] || null;
  };

  const selectedVisitDetails = selectedDate ? getVisitDetails(selectedDate) : null;

  // If no patientId, show message
  if (!patientId) {
    return (
      <Card className="p-4">
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">No patient selected</p>
          <p className="text-xs text-gray-400 mt-1">Please select a patient to view their visits</p>
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center py-4">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-600 ml-2">Loading visits...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4">
        <div className="text-center py-4">
          <p className="text-sm text-red-500">Error loading visit history</p>
          <p className="text-xs text-gray-400 mt-1">Please try again later</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <Button variant="ghost" size="sm" onClick={goToPreviousMonth} className="p-1">←</Button>
        <h4 className="text-md font-semibold text-gray-800">{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h4>
        <Button variant="ghost" size="sm" onClick={goToNextMonth} className="p-1">→</Button>
      </div>

      <div className="flex justify-between items-center mb-3">
        <span className="text-xs text-gray-500">
          {Object.keys(visitRecords).length} visit{Object.keys(visitRecords).length !== 1 ? 's' : ''}
        </span>
        <Button variant="ghost" size="sm" onClick={goToToday} className="text-xs text-[#1C62A0]">Today</Button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekdays.map(day => <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">{day}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => {
          const isVisited = date && isVisitedDate(date);
          const isSelected = date && isSelectedDate(date);
          const today = date && isToday(date);
          
          // Get visit count for the day
          let visitCount = 0;
          if (date) {
            const dateKey = formatDateKey(date);
            if (visitRecords[dateKey]) visitCount = 1;
          }
          
          return (
            <div 
              key={index} 
              onClick={() => handleDateClick(date)} 
              className={`relative aspect-square flex items-center justify-center rounded-lg cursor-pointer transition-all 
                ${!date ? 'invisible' : ''} 
                ${isSelected ? 'bg-[#1C62A0] text-white ring-2 ring-[#1C62A0] ring-offset-1' : 'hover:bg-gray-100'} 
                ${isVisited && !isSelected ? 'bg-green-100 hover:bg-green-200' : ''} 
                ${today && !isSelected ? 'ring-2 ring-[#1C62A0] ring-offset-1' : ''}
              `}
            >
              <span className={`text-sm ${isSelected ? 'text-white font-semibold' : 'text-gray-700'}`}>
                {date ? date.getDate() : ''}
              </span>
              {isVisited && !isSelected && (
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                </div>
              )}
              {isVisited && !isSelected && visitCount > 1 && (
                <div className="absolute -top-1 -right-1">
                  <span className="text-[8px] bg-green-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
                    {visitCount}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Visit Details for Selected Date */}
      {selectedVisitDetails && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <h5 className="text-xs font-semibold text-gray-700 mb-2">Visit Details</h5>
          <div className="space-y-1 text-xs">
            {selectedVisitDetails.complaint && selectedVisitDetails.complaint !== "-" && (
              <p><span className="font-medium text-gray-600">Complaint:</span> {selectedVisitDetails.complaint}</p>
            )}
            {selectedVisitDetails.assessment && selectedVisitDetails.assessment !== "-" && (
              <p><span className="font-medium text-gray-600">Assessment:</span> {selectedVisitDetails.assessment}</p>
            )}
            {selectedVisitDetails.notes && selectedVisitDetails.notes !== "-" && (
              <p><span className="font-medium text-gray-600">Advice:</span> {selectedVisitDetails.notes}</p>
            )}
            {selectedVisitDetails.medications && selectedVisitDetails.medications.length > 0 && (
              <div>
                <span className="font-medium text-gray-600">Medications:</span>
                <ul className="list-disc list-inside ml-2 mt-1">
                  {selectedVisitDetails.medications.slice(0, 3).map((med, idx) => (
                    <li key={idx} className="text-gray-700">
                      {med.name} {med.dosage} {med.duration}
                    </li>
                  ))}
                  {selectedVisitDetails.medications.length > 3 && (
                    <li className="text-gray-500">+{selectedVisitDetails.medications.length - 3} more</li>
                  )}
                </ul>
              </div>
            )}
            {selectedVisitDetails.doctor && selectedVisitDetails.doctor !== "-" && (
              <p><span className="font-medium text-gray-600">Doctor:</span> {selectedVisitDetails.doctor}</p>
            )}
            {selectedVisitDetails.department && selectedVisitDetails.department !== "-" && (
              <p><span className="font-medium text-gray-600">Department:</span> {selectedVisitDetails.department}</p>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
          <span className="text-gray-600">Visited Date</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 ring-2 ring-[#1C62A0] ring-offset-1 rounded"></div>
          <span className="text-gray-600">Today</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-[#1C62A0] rounded"></div>
          <span className="text-gray-600">Selected Date</span>
        </div>
      </div>
    </Card>
  );
};

export default VisitCalendar;