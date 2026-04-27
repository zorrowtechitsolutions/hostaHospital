import { CalendarCheck } from "lucide-react";
import { useState, useEffect } from "react";

const ApproveRequestModal = ({ onClose, onConfirm, initialDate = "", initialTime = "" }) => {
  // Set default date to tomorrow (avoid same day appointments)
  const getDefaultDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Set default time to next hour
  const getDefaultTime = () => {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    
    // Round to next hour
    if (minutes > 30) {
      hours += 2;
    } else {
      hours += 1;
    }
    
    // Handle day wrap
    if (hours >= 24) {
      hours = 9; // Default to 9 AM next day
    }
    
    return `${hours.toString().padStart(2, '0')}:00`;
  };

  const [date, setDate] = useState(initialDate || getDefaultDate());
  const [time, setTime] = useState(initialTime || getDefaultTime());
  const [isEditing, setIsEditing] = useState(false);

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0];

  // Available time slots
  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00"
  ];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[450px] rounded-xl shadow-lg p-6">

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="bg-green-100 p-3 rounded-full">
            <CalendarCheck className="text-green-600" size={28} />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-lg font-semibold text-gray-800 text-center">
          Approve Appointment Request
        </h2>

        {/* Subtitle */}
        <p className="text-sm text-gray-500 mt-1 text-center">
          Review and confirm appointment details
        </p>

        {/* Suggested Date/Time Display */}
        {!isEditing && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-green-800">Suggested Schedule</span>
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Edit
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CalendarCheck size={16} className="text-green-600" />
                <span className="text-sm text-gray-700">
                  <span className="font-medium">Date:</span> {date}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarCheck size={16} className="text-green-600" />
                <span className="text-sm text-gray-700">
                  <span className="font-medium">Time:</span> {time}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Edit Mode - Date & Time Inputs */}
        {isEditing && (
          <div className="mt-4 text-left space-y-4">
            {/* Date */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Appointment Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={today}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">Minimum date: {today}</p>
            </div>

            {/* Time - Dropdown with time slots */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Appointment Time <span className="text-red-500">*</span>
              </label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              >
                {timeSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot} {slot < "12:00" ? "AM" : "PM"}
                  </option>
                ))}
              </select>
            </div>

            {/* Action buttons in edit mode */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel Edit
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}

        {/* Preview Section (when not editing) */}
        {!isEditing && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 text-center">
              Appointment will be scheduled for <span className="font-medium text-gray-700">{date}</span> at <span className="font-medium text-gray-700">{time}</span>
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-center gap-3 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={() => {
              if (!date) {
                alert("Please select an appointment date");
                return;
              }
              if (!time) {
                alert("Please select an appointment time");
                return;
              }
              onConfirm({ date, time });
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
          >
            Confirm Appointment
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApproveRequestModal;