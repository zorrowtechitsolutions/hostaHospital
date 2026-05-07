import React, { useState } from "react";
import { CalendarCheck, Hash } from "lucide-react";
import { Modal, Button, Input, Select } from "../ui";
import { showSuccessToast, showWarningToast } from "../ui/Toast";

const ApproveRequestModal = ({
  onClose,
  onConfirm,
  initialDate = "",
  initialTime = "",
  initialToken = "",
}) => {

  // DEFAULT DATE
  const getDefaultDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  // DEFAULT TIME
  const getDefaultTime = () => {
    const now = new Date();

    let hours = now.getHours();
    let minutes = now.getMinutes();

    if (minutes > 30) hours += 2;
    else hours += 1;

    if (hours >= 24) hours = 9;

    return `${hours.toString().padStart(2, "0")}:00`;
  };

  // STATES
  const [date, setDate] = useState(
    initialDate || getDefaultDate()
  );

  const [time, setTime] = useState(
    initialTime || getDefaultTime()
  );

  // TOKEN STARTS EMPTY
  const [token, setToken] = useState(
    initialToken || ""
  );

  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = new Date()
    .toISOString()
    .split("T")[0];

  // TIME SLOTS
  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00",
  ];

  // CONFIRM FUNCTION
  const handleConfirm = () => {
    if (!date) {
      showWarningToast("Please select appointment date", 3000);
      return;
    }

    if (!time) {
      showWarningToast("Please select appointment time", 3000);
      return;
    }

    if (!token.trim()) {
      showWarningToast("Please enter token number", 3000);
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      onConfirm({
        date,
        time,
        token,
      });

      showSuccessToast(
        `Appointment confirmed for ${date} at ${time} with Token #${token}!`,
        4000,
        {
          'Date': date,
          'Time': time,
          'Token': `#${token}`
        }
      );

      setIsSubmitting(false);
      onClose();
    }, 500);
  };

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
      </div>

      {/* PREVIEW MODE */}
      {!isEditing ? (
        <>
          <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
            {/* TOP HEADER */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-green-800">
                Suggested Schedule
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="text-xs text-blue-600"
              >
                Edit
              </Button>
            </div>

            {/* DETAILS */}
            <div className="space-y-4">
              {/* DATE */}
              <div className="flex items-center gap-2">
                <CalendarCheck size={16} className="text-green-600" />
                <span className="text-sm text-gray-700">
                  <span className="font-medium">Date:</span> {date}
                </span>
              </div>

              {/* TIME */}
              <div className="flex items-center gap-2">
                <CalendarCheck size={16} className="text-green-600" />
                <span className="text-sm text-gray-700">
                  <span className="font-medium">Time:</span> {time}
                </span>
              </div>

              {/* TOKEN INPUT */}
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
                    className="w-full border border-green-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SUMMARY */}
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
      ) : (
        /* EDIT MODE */
        <div className="mt-4 space-y-4">
          <Input
            label="Appointment Date"
            name="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={today}
            required
          />

          <Select
            label="Appointment Time"
            name="time"
            options={timeSlots}
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />

          <Input
            label="Token Number"
            name="token"
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Enter token number"
            required
          />

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsEditing(false)} fullWidth>
              Cancel Edit
            </Button>
            <Button variant="success" onClick={() => setIsEditing(false)} fullWidth>
              Save Changes
            </Button>
          </div>
        </div>
      )}

      {/* FOOTER BUTTONS */}
      <div className="flex justify-center gap-3 mt-5">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="success" onClick={handleConfirm} disabled={isSubmitting} loading={isSubmitting}>
          {isSubmitting ? 'Confirming...' : 'Confirm Appointment'}
        </Button>
      </div>
    </Modal>
  );
};

export default ApproveRequestModal;