// src/components/Appointment/ViewMedicalHistory.jsx - Refactored
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Modal } from "../ui";

const ViewMedicalHistory = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const handleShowCalendar = () => {
    onClose();
    navigate("/calendar");
  };

  if (!isOpen) return null;

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
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <div><p className="text-xs text-gray-500">Department</p><p className="text-sm font-medium text-gray-800">Cardiology</p></div>
              <div><p className="text-xs text-gray-500">Date</p><p className="text-sm font-medium text-gray-800">25 Jan 2025, 07:00 PM</p></div>
              <Button variant="ghost" size="sm" className="text-xs">Edit</Button>
            </div>

            <div>
              <Button onClick={handleShowCalendar} variant="primary" fullWidth className="py-3 bg-gradient-to-r from-[#1C62A0] to-[#3a8bc4]">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                View Full Calendar
              </Button>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#1C62A0] rounded-full"></span>Past Complaint</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-800">Throat Pain</p>
                <p className="text-xs text-gray-400 mt-1">25 Jan 2024 (2 years ago)</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#1C62A0] rounded-full"></span>Assessment</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p className="text-sm text-gray-700">1. Applying a cool compress to the forehead or the back of the neck may provide some relief.</p>
                <p className="text-sm text-gray-700">2. Keep an eye on the person's symptoms and seek medical attention if the fever persists.</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#1C62A0] rounded-full"></span>Notes</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700">If the fever is accompanied by other worrisome symptoms, consult with a healthcare professional.</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#1C62A0] rounded-full"></span>Previous Medications</h3>
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100"><tr><th className="text-left py-2 px-4 font-medium text-gray-600 text-xs">Medicine</th><th className="text-left py-2 px-4 font-medium text-gray-600 text-xs">Dosage</th><th className="text-left py-2 px-4 font-medium text-gray-600 text-xs">Duration</th></tr></thead>
                  <tbody><tr className="border-t border-gray-200"><td className="py-2 px-4 text-gray-700">Paracetamol</td><td className="py-2 px-4 text-gray-700">500 mg</td><td className="py-2 px-4 text-gray-700">5 days</td></tr></tbody>
                </table>
              </div>
            </div>
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