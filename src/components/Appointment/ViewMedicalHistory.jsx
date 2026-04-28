// ViewMedicalHistory.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

const ViewMedicalHistory = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const handleShowCalendar = () => {
    onClose(); // Close the modal
    navigate("/calendar"); // Navigate to calendar page
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop with fade animation */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out z-40"
        style={{ animation: 'fadeIn 0.3s ease-in-out' }}
        onClick={onClose}
      />
      
      {/* Modal with scale/fade animation */}
      <div 
        className="fixed inset-0 flex items-center justify-center z-50 p-4"
        style={{ animation: 'modalPopIn 0.3s ease-out' }}
      >
        <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide">
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
            <h2 className="text-lg font-semibold text-gray-800">Medical History</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Modal Body */}
          <div className="px-6 py-4 space-y-6">
            {/* Patient Info Row */}
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <div>
                <p className="text-xs text-gray-500">Department</p>
                <p className="text-sm font-medium text-gray-800">Cardiology</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Date</p>
                <p className="text-sm font-medium text-gray-800">25 Jan 2025, 07:00 PM</p>
              </div>
              <button className="text-xs text-[#1C62A0] hover:underline">
                Edit
              </button>
            </div>

            {/* Show Calendar Button */}
            <div>
              <button
                onClick={handleShowCalendar}
                className="w-full py-3 bg-gradient-to-r from-[#1C62A0] to-[#3a8bc4] hover:from-[#155a8a] hover:to-[#2e7ab3] text-white rounded-xl transition-all text-sm font-medium flex items-center justify-center gap-2 shadow-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                View Full Calendar
              </button>
            </div>

            {/* Past Complaint */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#1C62A0] rounded-full"></span>
                Past Complaint
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-800">Throat Pain</p>
                <p className="text-xs text-gray-400 mt-1">25 Jan 2024 (2 years ago)</p>
              </div>
            </div>

            {/* Assessment */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#1C62A0] rounded-full"></span>
                Assessment
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p className="text-sm text-gray-700">
                  1. Applying a cool compress to the forehead or the back of the neck may provide some relief.
                </p>
                <p className="text-sm text-gray-700">
                  2. Keep an eye on the person's symptoms and seek medical attention if the fever persists.
                </p>
              </div>
            </div>

            {/* Notes */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#1C62A0] rounded-full"></span>
                Notes
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  If the fever is accompanied by other worrisome symptoms, consult with a healthcare professional.
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
                    <tr className="border-t border-gray-200">
                      <td className="py-2 px-4 text-gray-700">Paracetamol</td>
                      <td className="py-2 px-4 text-gray-700">500 mg</td>
                      <td className="py-2 px-4 text-gray-700">5 days</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end sticky bottom-0 bg-white">
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-[#1C62A0] hover:bg-[#5685ab] text-white rounded-lg transition-colors text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes modalPopIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  );
};

export default ViewMedicalHistory;