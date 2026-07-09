import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button, Card } from "../ui";
import {
  useGetPrescriptionsQuery,
} from "../../../app/service/prescription";

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

const CalendarPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const doctorName = location.state?.doctorName;
  const departmentName = location.state?.department;
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get patientId from location state or from URL params and extract numeric ID
  const rawPatientId = location.state?.patientId || new URLSearchParams(location.search).get('patientId');
  const patientId = extractNumericId(rawPatientId);

  const {
    data: prescriptionData,
    isLoading,
    error,
  } = useGetPrescriptionsQuery(
    {
      patientId,
      page: 1,
      limit: 100,
    },
    {
      skip: !patientId,
    }
  );

  // Doctor ID to Department mapping (temporary fix)
  const doctorDepartmentMap = {
    10: "Ortho",
    // Add more mappings as needed
  };

  // Create a timezone-safe date formatter
  const formatDateKey = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Create visit records from prescription data
  const createVisitRecords = () => {
    const records = {};
    
    if (!prescriptionData) {
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
    } else if (prescriptionData.patient && Array.isArray(prescriptionData.patient.prescriptions)) {
      prescriptions = prescriptionData.patient.prescriptions;
    }

    prescriptions.forEach((prescription, index) => {
      // Try to find the date field
      const dateField = prescription.createdAt || prescription.date || prescription.visitDate || prescription.prescriptionDate || prescription.updatedAt;
      
      if (dateField) {
        const dateKey = formatDateKey(dateField);
        
        // Get department from various possible locations
        let department = "-";
        if (prescription.department) {
          department = prescription.department;
        } else if (prescription.doctorDepartment) {
          department = prescription.doctorDepartment;
        } else if (prescription.doctor?.department) {
          department = prescription.doctor.department;
        } else if (prescription.specialization) {
          department = prescription.specialization;
        } else if (prescription.doctor?.specialization) {
          department = prescription.doctor.specialization;
        } else if (prescription.booking?.department) {
          department = prescription.booking.department;
        } else if (prescription.doctorId && doctorDepartmentMap[prescription.doctorId]) {
          department = doctorDepartmentMap[prescription.doctorId];
        }
        
        // Get medications with proper field mapping
        let medications = prescription.medications || prescription.medicines || prescription.prescriptionItems || [];
        if (!Array.isArray(medications)) {
          medications = [];
        }
        
        // Map medication fields for consistent display
        const mappedMedications = medications.map(med => ({
          name: med.medicineName || med.name || med.drugName || med.medication || med.itemName || med.medicine_name || med.medication_name || "Unknown",
          dosage: med.dosage || med.dose || med.strength || med.quantity || med.dosage_amount || med.dosage_value || "",
          duration: med.duration || med.frequency || med.period || med.days || med.duration_days || med.frequency_days || "",
          // Keep original fields
          ...med
        }));
        
        records[dateKey] = {
          complaint: prescription.complaint || prescription.chiefComplaint || prescription.symptoms || prescription.reason || prescription.presentingComplaint || "-",
          assessment: prescription.assessment || prescription.diagnosis || prescription.plan || prescription.assessmentPlan || "-",
          notes: prescription.advice || prescription.notes || prescription.note || prescription.doctorNotes || prescription.additionalNotes || "-",
          medications: mappedMedications,
          doctor: doctorName || prescription.doctorName || prescription.doctor?.name || "-",
          department: departmentName || department || "-",
          createdAt: dateField,
          doctorId: prescription.doctorId,
          bookingId: prescription.bookingId,
          nextConsultation: prescription.next_consultation,
          emptyStomach: prescription.empty_stomach,
          // Store the full prescription for debugging
          _raw: prescription
        };
      }
    });

    return records;
  };

  const [visitRecords, setVisitRecords] = useState({});

  // Update visit records when prescription data changes
  useEffect(() => {
    const records = createVisitRecords();
    setVisitRecords(records);
    
    // If there are records and no date is selected, select the first one
    const dates = Object.keys(records);
    if (dates.length > 0 && !selectedDate) {
      setSelectedDate(new Date(dates[0]));
    }
  }, [prescriptionData]);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const weekdays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

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

  const isVisitedDate = (date) => {
    if (!date) return false;
    const dateString = formatDateKey(date);
    const hasRecord = visitRecords[dateString] !== undefined;
    return hasRecord;
  };

  const getVisitDetails = (date) => {
    if (!date) return null;
    const dateString = formatDateKey(date);
    const details = visitRecords[dateString];
    return details;
  };

  const isToday = (date) => {
    if (!date) return false;
    return formatDateKey(date) === formatDateKey(today);
  };

  const isFutureDate = (date) => {
    if (!date) return false;
    return date > today;
  };

  const handleDateClick = (date) => {
    if (date && !isFutureDate(date)) {
      setSelectedDate(date);
    }
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1);
    const currentDate = new Date();
    if (nextMonth.getFullYear() < currentDate.getFullYear() || 
        (nextMonth.getFullYear() === currentDate.getFullYear() && nextMonth.getMonth() <= currentDate.getMonth())) {
      setCurrentMonth(nextMonth);
    }
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  const days = getDaysInMonth(currentMonth);
  const selectedVisitDetails = selectedDate ? getVisitDetails(selectedDate) : null;

  // Helper to format medications for display
  const getMedicationsDisplay = (medications) => {
    if (!medications || medications.length === 0) return ["No medications prescribed"];
    return medications.map((med) => {
      const name = med.name || med.medicineName || med.drugName || med.medication || med.itemName || 
                   med.medicine_name || med.medication_name || "Unknown";
      const dosage = med.dosage || med.dose || med.strength || med.quantity || 
                     med.dosage_amount || med.dosage_value || "";
      const duration = med.duration || med.frequency || med.period || med.days || 
                       med.duration_days || med.frequency_days || "";
      return `${name} ${dosage} ${duration}`.trim();
    });
  };

  // If no patientId, show error
  if (!patientId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-lg max-w-md">
          <div className="text-center">
            <div className="text-yellow-500 text-4xl mb-3">⚠️</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">History Not Found</h3>
            <p className="text-sm text-gray-600">No visit history available for the selected patient.</p>
            <button 
              onClick={() => navigate(-1)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600">Loading visit records...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-lg max-w-md">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-3">⚠️</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Error Loading Data</h3>
            <p className="text-sm text-gray-600">Unable to load visit history. Please try again later.</p>
            <button 
              onClick={() => navigate(-1)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="p-2">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Visit History Calendar</h1>
                <p className="text-sm text-gray-500">
                  {Object.keys(visitRecords).length} total visits
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              Back to Consultation
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar Section */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              {/* Calendar Header */}
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <Button variant="ghost" size="sm" onClick={goToPreviousMonth} className="p-2">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Button>
                <h2 className="text-lg font-semibold text-gray-900">
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={goToNextMonth}
                  disabled={currentMonth.getMonth() >= today.getMonth() && currentMonth.getFullYear() >= today.getFullYear()}
                  className={currentMonth.getMonth() >= today.getMonth() && currentMonth.getFullYear() >= today.getFullYear() ? 'opacity-50 cursor-not-allowed' : ''}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </div>

              {/* Weekday Headers */}
              <div className="grid grid-cols-7 border-b border-gray-200">
                {weekdays.map(day => (
                  <div key={day} className="py-3 text-center">
                    <span className="text-xs font-medium text-gray-500">{day}</span>
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7">
                {days.map((date, index) => {
                  const isVisited = date && isVisitedDate(date);
                  const isSelected = date && selectedDate && 
                    formatDateKey(date) === formatDateKey(selectedDate);
                  const today_date = date && isToday(date);
                  const future = date && isFutureDate(date);
                  
                  return (
                    <div
                      key={index}
                      onClick={() => handleDateClick(date)}
                      className={`
                        min-h-[100px] p-2 border-b border-r border-gray-100 transition-all
                        ${future ? 'bg-gray-50 cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-blue-50'}
                        ${isSelected ? 'bg-blue-100 ring-2 ring-blue-500 ring-inset' : ''}
                      `}
                    >
                      {date && (
                        <div className="flex flex-col h-full">
                          <div className="flex justify-between items-start">
                            <span className={`
                              text-sm font-medium inline-flex items-center justify-center w-7 h-7 rounded-full
                              ${today_date ? 'bg-blue-600 text-white' : 'text-gray-700'}
                              ${future ? 'text-gray-400' : ''}
                            `}>
                              {date.getDate()}
                            </span>
                            {isVisited && !future && <div className="w-2 h-2 bg-green-500 rounded-full"></div>}
                          </div>
                          {isVisited && !future && (
                            <div className="mt-1">
                              <span className="text-[10px] text-green-600 font-medium">✓ Visited</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Today Button */}
              <div className="px-6 py-4 border-t border-gray-200 flex justify-center">
                <Button variant="ghost" size="sm" onClick={goToToday} className="text-blue-600">
                  Today
                </Button>
              </div>
            </Card>
          </div>

          {/* Right Panel - Visit Details */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <style>{`.sticky > div::-webkit-scrollbar { display: none; }`}</style>
              <div className="px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white sticky top-0">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Visit Details
                </h3>
              </div>
              
              <div className="p-5">
                {selectedDate ? (
                  selectedVisitDetails ? (
                    <div className="space-y-4">
                      <div className="text-center pb-4 border-b border-gray-100">
                        <p className="text-2xl font-bold text-gray-900">{selectedDate.getDate()} {monthNames[selectedDate.getMonth()]}</p>
                        <p className="text-sm text-gray-500 mt-1">{selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        {selectedVisitDetails.createdAt && (
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(selectedVisitDetails.createdAt).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-4">
                        {/* Complaint */}
                        <div className="bg-red-50 rounded-lg p-3">
                          <p className="text-xs font-semibold text-red-600 mb-2 flex items-center gap-1">
                            <span>🩺</span> Complaint
                          </p>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {selectedVisitDetails.complaint || "No complaint recorded"}
                          </p>
                        </div>

                        {/* Assessment */}
                        {selectedVisitDetails.assessment && selectedVisitDetails.assessment !== "-" && (
                          <div className="bg-blue-50 rounded-lg p-3">
                            <p className="text-xs font-semibold text-blue-600 mb-2 flex items-center gap-1">
                              <span>📋</span> Assessment & Plan
                            </p>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {selectedVisitDetails.assessment}
                            </p>
                          </div>
                        )}

                        {/* Notes / Advice */}
                        {selectedVisitDetails.notes && selectedVisitDetails.notes !== "-" && (
                          <div className="bg-yellow-50 rounded-lg p-3">
                            <p className="text-xs font-semibold text-yellow-600 mb-2 flex items-center gap-1">
                              <span>📝</span> Notes / Advice
                            </p>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {selectedVisitDetails.notes}
                            </p>
                          </div>
                        )}

                        {/* Medications */}
                        <div className="bg-green-50 rounded-lg p-3">
                          <p className="text-xs font-semibold text-green-600 mb-2 flex items-center gap-1">
                            <span>💊</span> Prescribed Medications
                          </p>
                          <ul className="space-y-1">
                            {getMedicationsDisplay(selectedVisitDetails.medications).map((med, idx) => (
                              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                <span className="text-green-600 mt-0.5">•</span>
                                <span className="leading-relaxed">{med}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Next Consultation */}
                        {selectedVisitDetails.nextConsultation && (
                          <div className="bg-purple-50 rounded-lg p-3">
                            <p className="text-xs font-semibold text-purple-600 mb-2 flex items-center gap-1">
                              <span>📅</span> Next Consultation
                            </p>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {new Date(selectedVisitDetails.nextConsultation).toLocaleDateString('en-US', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        )}

                        {/* Empty Stomach */}
                        {selectedVisitDetails.emptyStomach !== undefined && (
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
                              <span>🍽️</span> Take on Empty Stomach
                            </p>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {selectedVisitDetails.emptyStomach ? "Yes" : "No"}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 text-sm">No visit record for this date</p>
                      <p className="text-xs text-gray-400 mt-1">Select a different date</p>
                    </div>
                  )
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm">Select a date to view visit details</p>
                    <p className="text-xs text-gray-400 mt-1">Click on any date with a green dot</p>
                  </div>
                )}
              </div>

              {/* Legend */}
              <div className="px-5 py-4 border-t border-gray-200 bg-gray-50 sticky bottom-0">
                <p className="text-xs font-medium text-gray-700 mb-3">Legend</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-gray-600">Date with visit record</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                    <span className="text-xs text-gray-600">Today</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-blue-100 ring-2 ring-blue-500 ring-inset rounded"></div>
                    <span className="text-xs text-gray-600">Selected date</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div>
                    <span className="text-xs text-gray-400">Future date (disabled)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;