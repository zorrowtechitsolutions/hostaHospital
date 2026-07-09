// src/components/Requests/ApproveRequestModal.jsx - With Every Minute Time Slots
import { useState } from "react";
import { CalendarCheck, Hash } from "lucide-react";
import { Modal, Button, Input, Select } from "../ui";
import { showWarningToast } from "../ui/Toast";

// Generate all time slots from 00:00 to 23:59 (every minute)
const generateAllTimeSlots = () => {
  const slots = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute++) {
      const hourStr = hour.toString().padStart(2, "0");
      const minuteStr = minute.toString().padStart(2, "0");
      slots.push(`${hourStr}:${minuteStr}`);
    }
  }
  return slots;
};

const TIME_SLOTS = generateAllTimeSlots();

// Helper function to format time for display with AM/PM
const formatTimeDisplay = (time24h) => {
  if (!time24h) return "";
  
  // If it already has AM/PM, return as is
  if (time24h.includes("AM") || time24h.includes("PM")) {
    return time24h;
  }
  
  const [hours, minutes] = time24h.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour === 0 ? 12 : (hour > 12 ? hour - 12 : hour);
  return `${hour12}:${minutes} ${ampm}`;
};

// Helper function to convert display time back to 24-hour format
const convertTo24Hour = (timeDisplay) => {
  if (!timeDisplay) return "";
  
  // If it's already in 24-hour format (no AM/PM), return as is
  if (!timeDisplay.includes("AM") && !timeDisplay.includes("PM")) {
    return timeDisplay;
  }
  
  const [time, modifier] = timeDisplay.split(" ");
  let [hours, minutes] = time.split(":");
  
  // Handle 12 AM (midnight)
  if (hours === "12" && modifier === "AM") {
    hours = "00";
  }
  // Handle 12 PM (noon)
  else if (hours === "12" && modifier === "PM") {
    hours = "12";
  }
  // Handle PM times (except 12 PM)
  else if (modifier === "PM") {
    hours = String(parseInt(hours, 10) + 12);
  }
  
  return `${hours.padStart(2, "0")}:${minutes}`;
};

const getDefaultDate = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split("T")[0];
};

const getDefaultTime = () => {
  const now = new Date();
  let hours = now.getHours();
  const minutes = now.getMinutes();
  // Add 1 hour and round to nearest minute
  hours += 1;
  if (hours >= 24) hours = 9;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
};

const InfoRow = ({ icon: Icon, label, value }) => {
  // Format time for display if it's a time value
  const displayValue = label === "Consulting Time" ? formatTimeDisplay(value) : value;
  
  return (
    <div className="flex items-center gap-2">
      <Icon size={16} className="text-green-600" />
      <span className="text-sm text-gray-700">
        <span className="font-medium">{label}:</span> {displayValue}
      </span>
    </div>
  );
};

const validateForm = (date, consulting_time, token) => {
  if (!date) {
    showWarningToast('Please select appointment date', 3000);
    return false;
  }
  if (!consulting_time) {
    showWarningToast('Please select appointment time', 3000);
    return false;
  }
  if (!token?.trim()) {
    showWarningToast('Please enter token number', 3000);
    return false;
  }
  return true;
};

// Virtualized Select component for large lists
const VirtualizedSelect = ({ label, options, value, onChange, required, disabled, renderOption }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    return options.filter(option => {
      const displayText = renderOption ? renderOption(option) : option;
      return displayText.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [options, searchTerm, renderOption]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayValue = value ? (renderOption ? renderOption(value) : value) : "";

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          type="text"
          value={isOpen ? searchTerm : displayValue}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            setSearchTerm("");
          }}
          placeholder="Search time..."
          disabled={disabled}
          className="w-full px-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2"
        >
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <div
                key={index}
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                  setSearchTerm("");
                }}
                className={`px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors ${
                  option === value ? "bg-blue-50 text-blue-600" : "text-gray-700"
                }`}
              >
                {renderOption ? renderOption(option) : option}
              </div>
            ))
          ) : (
            <div className="px-4 py-3 text-center text-gray-500">
              No matching times found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ApproveRequestModal = ({
  onClose,
  onConfirm,
  requestData,
  initialDate = "",
  initialTime = "",
  initialToken = "",
  isLoading = false,
}) => {
  const [date, setDate] = useState(initialDate || getDefaultDate());
  const [consulting_time, setConsultingTime] = useState(initialTime || getDefaultTime());
  const [token, setToken] = useState(initialToken || "");
  const [isEditing, setIsEditing] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const handleConfirm = async () => {
    if (!validateForm(date, consulting_time, token)) return;

    if (onConfirm) {
      onConfirm({
        booking_date: date,
        consulting_time: consulting_time, // Already in 24-hour format
        token: token.trim(),
      });
    }

    onClose();
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
  };

  const PreviewMode = () => (
    <>
      <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-green-800">
            Schedule Details
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="text-xs text-blue-600"
            disabled={isLoading}
          >
            Edit
          </Button>
        </div>

        <div className="space-y-4">
          <InfoRow icon={CalendarCheck} label="Date" value={date} />
          <InfoRow icon={CalendarCheck} label="Consulting Time" value={consulting_time} />

          <div className="flex items-start gap-2">
            <Hash size={16} className="text-green-600 mt-3" />
            <div className="w-full">
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Token Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter token number"
                autoFocus
                disabled={isLoading}
                className="w-full border border-green-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                required
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-500 text-center">
          Appointment scheduled for{" "}
          <span className="font-medium text-gray-700">{date}</span> at{" "}
          <span className="font-medium text-gray-700">{formatTimeDisplay(consulting_time)}</span>{" "}
          {token && (
            <>with Token <span className="font-medium text-gray-700">#{token}</span></>
          )}
        </p>
      </div>
    </>
  );

  const EditMode = () => (
    <div className="mt-4 space-y-4">
      <Input
        label="Appointment Date"
        name="date"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        min={today}
        required
        disabled={isLoading}
      />

      <VirtualizedSelect
        label="Appointment Time"
        options={TIME_SLOTS}
        value={consulting_time}
        onChange={(value) => setConsultingTime(value)}
        required
        disabled={isLoading}
        renderOption={(option) => formatTimeDisplay(option)}
      />

      <Input
        label="Token Number"
        name="token"
        type="text"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="Enter token number"
        required
        disabled={isLoading}
      />

      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={() => setIsEditing(false)} fullWidth disabled={isLoading}>
          Cancel Edit
        </Button>
        <Button variant="success" onClick={handleSaveEdit} fullWidth disabled={isLoading}>
          Save Changes
        </Button>
      </div>
    </div>
  );

  return (
    <Modal isOpen={true} onClose={onClose} title="Confirm Appointment" size="sm" showCloseButton={false}>
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-green-100 p-3 rounded-full">
            <CalendarCheck className="text-green-600" size={28} />
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Confirm appointment details
        </p>
        {requestData?.patient_name && (
          <p className="text-xs text-gray-400 mt-2">
            Patient: {requestData.patient_name}
          </p>
        )}
        {requestData?.displayName && (
          <p className="text-xs text-gray-400 mt-1">
            Doctor: {requestData.displayName}
          </p>
        )}
      </div>

      {!isEditing ? <PreviewMode /> : <EditMode />}

      <div className="flex justify-center gap-3 mt-5">
        <Button variant="outline" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button variant="success" onClick={handleConfirm} disabled={isLoading} loading={isLoading}>
          {isLoading ? 'Creating...' : 'Confirm Appointment'}
        </Button>
      </div>
    </Modal>
  );
};

// Add missing imports
import { useRef, useMemo, useEffect } from "react";

export default ApproveRequestModal;