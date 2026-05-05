// src/components/Requests/ApproveRequestModal.jsx - Refactored
import React, { useState } from "react";
import { CalendarCheck } from "lucide-react";
import { Modal, Button, Input, Select } from "../ui";

const ApproveRequestModal = ({ onClose, onConfirm, initialDate = "", initialTime = "" }) => {
  const getDefaultDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getDefaultTime = () => {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    if (minutes > 30) hours += 2;
    else hours += 1;
    if (hours >= 24) hours = 9;
    return `${hours.toString().padStart(2, '0')}:00`;
  };

  const [date, setDate] = useState(initialDate || getDefaultDate());
  const [time, setTime] = useState(initialTime || getDefaultTime());
  const [isEditing, setIsEditing] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const timeSlots = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"];

  return (
    <Modal isOpen={true} onClose={onClose} title="Approve Appointment Request" size="sm" showCloseButton={false}>
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-green-100 p-3 rounded-full">
            <CalendarCheck className="text-green-600" size={28} />
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-1">Review and confirm appointment details</p>
      </div>

      {!isEditing ? (
        <>
          <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-green-800">Suggested Schedule</span>
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="text-xs text-blue-600">Edit</Button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2"><CalendarCheck size={16} className="text-green-600" /><span className="text-sm text-gray-700"><span className="font-medium">Date:</span> {date}</span></div>
              <div className="flex items-center gap-2"><CalendarCheck size={16} className="text-green-600" /><span className="text-sm text-gray-700"><span className="font-medium">Time:</span> {time}</span></div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 text-center">Appointment will be scheduled for <span className="font-medium text-gray-700">{date}</span> at <span className="font-medium text-gray-700">{time}</span></p>
          </div>
        </>
      ) : (
        <div className="mt-4 space-y-4">
          <Input label="Appointment Date" name="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} min={today} required />
          <Select label="Appointment Time" name="time" options={timeSlots} value={time} onChange={(e) => setTime(e.target.value)} required />
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsEditing(false)} fullWidth>Cancel Edit</Button>
            <Button variant="success" onClick={() => setIsEditing(false)} fullWidth>Save Changes</Button>
          </div>
        </div>
      )}

      <div className="flex justify-center gap-3 mt-5">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button variant="success" onClick={() => { if (!date) { alert("Please select an appointment date"); return; } if (!time) { alert("Please select an appointment time"); return; } onConfirm({ date, time }); }}>Confirm Appointment</Button>
      </div>
    </Modal>
  );
};

export default ApproveRequestModal;