// src/components/Appointment/ViewMedicalHistory.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui";
import {
  useGetPrescriptionsQuery,
} from "../../../app/service/prescription";
// Import your doctor API service if available
// import { useGetDoctorQuery } from "../../../app/service/doctor";

const ViewMedicalHistory = ({
  isOpen,
  onClose,
  patientId,
  department,
  doctorName
}) => {
  const navigate = useNavigate();

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

  // Log the API response to see exact structure
  console.log("ViewMedicalHistory - PATIENT ID:", patientId);
  console.log("ViewMedicalHistory - FULL PRESCRIPTION DATA:", JSON.stringify(prescriptionData, null, 2));

  // Extract prescriptions from response
  let prescriptions = [];
  if (Array.isArray(prescriptionData)) {
    prescriptions = prescriptionData;
  } else if (prescriptionData?.data && Array.isArray(prescriptionData.data)) {
    prescriptions = prescriptionData.data;
  } else if (prescriptionData?.prescriptions && Array.isArray(prescriptionData.prescriptions)) {
    prescriptions = prescriptionData.prescriptions;
  }
  
  // Sort prescriptions by date (newest first)
  const sortedPrescriptions = [...prescriptions].sort((a, b) => {
    const dateA = new Date(a.createdAt || a.date || a.visitDate || 0);
    const dateB = new Date(b.createdAt || b.date || b.visitDate || 0);
    return dateB - dateA;
  });
  
  const latestRecord = sortedPrescriptions[0] || {};

  console.log("LATEST RECORD:", latestRecord);
  console.log("ALL FIELDS IN LATEST RECORD:", Object.keys(latestRecord));

  // Helper to get field value with fallbacks
  const getField = (record, fieldNames, defaultValue = "-") => {
    for (const field of fieldNames) {
      const value = record[field];
      if (value !== undefined && value !== null && value !== "") {
        return value;
      }
    }
    return defaultValue;
  };

  // Helper to get nested field value
  const getNestedField = (record, path, defaultValue = "-") => {
    const value = path.split('.').reduce((obj, key) => {
      if (obj && obj[key] !== undefined && obj[key] !== null) {
        return obj[key];
      }
      return undefined;
    }, record);
    
    return value !== undefined && value !== null && value !== "" ? value : defaultValue;
  };

  const handleShowCalendar = () => {
    onClose();
navigate("/calendar", {
  state: {
    patientId,
    doctorName,
    department
  }
});
  };

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out z-40 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600">Loading medical history...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out z-40 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 max-w-md">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-3">⚠️</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Error Loading Data</h3>
            <p className="text-sm text-gray-600">Unable to load medical history. Please try again later.</p>
            <button 
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out z-40" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <style>{`.overflow-y-auto::-webkit-scrollbar { display: none; }`}</style>
          
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
            <h2 className="text-lg font-semibold text-gray-800">Medical History</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">✕</button>
          </div>

          <div className="px-6 py-4 space-y-6">
            {/* Department and Date */}
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <div>
                <p className="text-xs text-gray-500">Department</p>
<p className="text-sm font-medium text-gray-800">
  {department || "-"}
</p>
</div>
              <div>
                <p className="text-xs text-gray-500">Date</p>
                <p className="text-sm font-medium text-gray-800">
                  {latestRecord?.createdAt || latestRecord?.date || latestRecord?.visitDate || latestRecord?.prescriptionDate
                    ? new Date(latestRecord.createdAt || latestRecord.date || latestRecord.visitDate || latestRecord.prescriptionDate).toLocaleString('en-US', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })
                    : "-"}
                </p>
              </div>
            </div>

            {/* Calendar Button */}
            <div>
              <Button onClick={handleShowCalendar} variant="primary" fullWidth className="py-3 bg-gradient-to-r from-[#1C62A0] to-[#3a8bc4]">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                View Full Calendar
              </Button>
            </div>

            {/* Past Complaint */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#1C62A0] rounded-full"></span>
                Past Complaint
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-800">
                  {getField(latestRecord, ['chiefComplaint', 'complaint', 'symptoms', 'reason', 'presentingComplaint'], "-")}
                </p>
                {latestRecord?.createdAt && (
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(latestRecord.createdAt).toLocaleDateString('en-US', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                )}
              </div>
            </div>


            {/* Advice (since your data has this field) */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#1C62A0] rounded-full"></span>
                Advice
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  {getField(latestRecord, ['advice', 'notes', 'note', 'doctorNotes', 'additionalNotes'], "-")}
                </p>
              </div>
            </div>

            {/* Previous Medications */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#1C62A0] rounded-full"></span>
                Previous Medications
              </h3>
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="text-left py-2 px-4 font-medium text-gray-600 text-xs">Medicine</th>
                      <th className="text-left py-2 px-4 font-medium text-gray-600 text-xs">Dosage</th>
                      <th className="text-left py-2 px-4 font-medium text-gray-600 text-xs">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(latestRecord?.medications || latestRecord?.medicines || latestRecord?.prescriptionItems || []).map((med, index) => {
                      // Log medication structure to see what fields are available
                      console.log(`Medication ${index}:`, med);
                      return (
                        <tr key={index} className="border-t border-gray-200">
                          <td className="py-2 px-4 text-gray-700">
                            {med.medicineName || med.name || med.drugName || med.medication || med.itemName || 
                             med.medicine_name || med.medication_name || "-"}
                          </td>
                          <td className="py-2 px-4 text-gray-700">
                            {med.dosage || med.dose || med.strength || med.quantity || 
                             med.dosage_amount || med.dosage_value || "-"}
                          </td>
                          <td className="py-2 px-4 text-gray-700">
                            {med.duration || med.frequency || med.period || med.days || 
                             med.duration_days || med.frequency_days || "-"}
                          </td>
                        </tr>
                      );
                    })}
                    {(latestRecord?.medications || latestRecord?.medicines || latestRecord?.prescriptionItems || []).length === 0 && (
                      <tr className="border-t border-gray-200">
                        <td colSpan="3" className="py-2 px-4 text-gray-500 text-center">
                          No medications prescribed
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Next Consultation (since your data has this field) */}
            {latestRecord?.next_consultation && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#1C62A0] rounded-full"></span>
                  Next Consultation
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    {new Date(latestRecord.next_consultation).toLocaleDateString('en-US', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-end sticky bottom-0 bg-white">
            <Button variant="primary" onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewMedicalHistory;