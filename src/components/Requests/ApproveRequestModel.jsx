// ApproveRequestModal.jsx
import { useState, useEffect } from "react";
import { CalendarCheck, Hash } from "lucide-react";
import { Modal, Button, Input, Select } from "../ui";
import { showWarningToast, showErrorToast } from "../ui/Toast";

// Constants moved outside component
const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00",
];

const getDefaultDate = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split("T")[0];
};

const getDefaultTime = () => {
  const now = new Date();
  let hours = now.getHours();
  const minutes = now.getMinutes();

  hours += minutes > 30 ? 2 : 1;

  if (hours >= 24) hours = 9;

  return `${hours.toString().padStart(2, "0")}:00`;
};

// Reusable Info Row Component
const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-2">
    <Icon size={16} className="text-green-600" />
    <span className="text-sm text-gray-700">
      <span className="font-medium">{label}:</span> {value}
    </span>
  </div>
);

// Validation helper
const validateForm = (date, time, token, showWarningToast) => {
  if (!date) {
    showWarningToast('Please select appointment date', 3000);
    return false;
  }

  if (!time) {
    showWarningToast('Please select appointment time', 3000);
    return false;
  }

  if (!token?.trim()) {
    showWarningToast('Please enter token number', 3000);
    return false;
  }

  return true;
};

const ApproveRequestModal = ({
  onClose,
  onConfirm,
  bookingId,
  requestData,
  initialDate = "",
  initialTime = "",
  initialToken = "",
  isLoading = false, // Add loading prop from parent
}) => {
  // States
  const [date, setDate] = useState(initialDate || getDefaultDate());
  const [time, setTime] = useState(initialTime || getDefaultTime());
  const [token, setToken] = useState(initialToken || "");
  const [isEditing, setIsEditing] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  // Validate bookingId on mount (only for warning, not API call)
  useEffect(() => {
    if (!bookingId) {
      showErrorToast("Booking ID is missing. Cannot approve appointment.", 5000);
    }
  }, [bookingId]);

  // Handle confirm - only calls parent's onConfirm (no API here)
  const handleConfirm = () => {
    if (!bookingId) {
      showErrorToast("Booking ID is missing. Please refresh and try again.", 5000);
      return;
    }

    if (!validateForm(date, time, token, showWarningToast)) return;

    // Pass data to parent component to handle API call
    if (onConfirm) {
      onConfirm({
        date,
        time,
        token: token.trim(),
      });
    }

    onClose();
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
  };

  // Preview Mode
  const PreviewMode = () => (
    <>
      <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-green-800">
            Suggested Schedule
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
          <InfoRow icon={CalendarCheck} label="Time" value={time} />

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
          <span className="font-medium text-gray-700">{time}</span>{" "}
          {token && (
            <>with Token <span className="font-medium text-gray-700">#{token}</span></>
          )}
        </p>
      </div>
    </>
  );

  // Edit Mode
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

      <Select
        label="Appointment Time"
        name="time"
        options={TIME_SLOTS}
        value={time}
        onChange={(e) => setTime(e.target.value)}
        required
        disabled={isLoading}
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
        <Button 
          variant="outline" 
          onClick={() => setIsEditing(false)} 
          fullWidth
          disabled={isLoading}
        >
          Cancel Edit
        </Button>
        <Button 
          variant="success" 
          onClick={handleSaveEdit} 
          fullWidth
          disabled={isLoading}
        >
          Save Changes
        </Button>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Approve Appointment Request"
      size="sm"
      showCloseButton={false}
    >
      {/* HEADER */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-green-100 p-3 rounded-full">
            <CalendarCheck className="text-green-600" size={28} />
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Review and confirm appointment details
        </p>
        {requestData?.patientName && (
          <p className="text-xs text-gray-400 mt-2">
            Patient: {requestData.patientName}
          </p>
        )}
        {bookingId && (
          <p className="text-xs text-gray-400 mt-1">
            Booking ID: {bookingId}
          </p>
        )}
      </div>

      {/* MODE SELECTION */}
      {!isEditing ? <PreviewMode /> : <EditMode />}

      {/* FOOTER BUTTONS */}
      <div className="flex justify-center gap-3 mt-5">
        <Button variant="outline" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button variant="success" onClick={handleConfirm} disabled={isLoading} loading={isLoading}>
          {isLoading ? 'Confirming...' : 'Confirm Appointment'}
        </Button>
      </div>
    </Modal>
  );
};

export default ApproveRequestModal;