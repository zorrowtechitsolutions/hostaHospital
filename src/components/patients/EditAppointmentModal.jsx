import React, { useState, useEffect } from "react";
import { X, Calendar, Clock, User, Stethoscope, CreditCard, FileText } from "lucide-react";

const EditAppointmentModal = ({ isOpen, onClose, appointment, patient, onSave, allPatients = [] }) => {
  const [form, setForm] = useState({
    patientId: appointment?.patientId || patient?.id || "",
    patientName: appointment?.patientName || patient?.name || "",
    patientType: appointment?.patientType || "In Patient",
    department: appointment?.department || "",
    doctor: appointment?.doctorName || "",
    mode: appointment?.consultationMode || "In Person",
    date: appointment?.appointmentDate || "",
    startTime: appointment?.startTime || "",
    endTime: appointment?.endTime || "",
    reason: appointment?.reason || "",
    notes: appointment?.notes || "",
    payment: appointment?.paymentMethod || "Card"
  });

  const [errors, setErrors] = useState({});

  // Get all patients for dropdown (combine outpatient and inpatient)
  const getAllPatients = () => {
    if (allPatients && allPatients.length > 0) {
      return allPatients;
    }
    // Fallback mock data if no patients passed
    return [
      { id: "PT0025", name: "James Carter", type: "Out Patient" },
      { id: "PT0026", name: "Emily Rodriguez", type: "Out Patient" },
      { id: "PT0029", name: "Sophia Martinez", type: "Out Patient" },
      { id: "PT0027", name: "Michael Chen", type: "In Patient" },
      { id: "PT0028", name: "Lisa Wong", type: "In Patient" },
      { id: "PT0030", name: "David Thompson", type: "In Patient" }
    ];
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value
    });
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.department) newErrors.department = "Department is required";
    if (!form.doctor) newErrors.doctor = "Doctor is required";
    if (!form.date) newErrors.date = "Date is required";
    if (!form.startTime) newErrors.startTime = "Start time is required";
    if (!form.endTime) newErrors.endTime = "End time is required";
    if (!form.reason) newErrors.reason = "Reason is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const updatedData = {
        patientId: form.patientId,
        patientName: form.patientName,
        patientType: form.patientType,
        department: form.department,
        doctor: form.doctor,
        consultationMode: form.mode,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        reason: form.reason,
        notes: form.notes,
        paymentMethod: form.payment
      };
      onSave(updatedData);
      onClose();
    }
  };

  const handlePatientChange = (e) => {
    const selectedPatientId = e.target.value;
    const selectedPatient = getAllPatients().find(p => p.id === selectedPatientId);
    if (selectedPatient) {
      setForm({
        ...form,
        patientId: selectedPatient.id,
        patientName: selectedPatient.name,
        patientType: selectedPatient.type || "Out Patient"
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999]">
      <div className="bg-white w-[600px] rounded-xl shadow-xl max-h-[90vh] overflow-y-auto hide-scrollbar">
        {/* Hide Scrollbar Styles */}
        <style jsx>{`
          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        
        {/* Header */}
        <div className="flex justify-between items-center border-b px-6 py-4 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-gray-800">
            Edit Appointment
          </h2>
          <button
            onClick={onClose}
            className="bg-gray-800 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-gray-700 transition"
          >
            <X size={14} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Patient + Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Select Patient
              </label>
              <select
                name="patientId"
                value={form.patientId}
                onChange={handlePatientChange}
                className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Patient</option>
                {getAllPatients().map(pat => (
                  <option key={pat.id} value={pat.id}>
                    {pat.name} ({pat.id})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Patient Type
              </label>
              <select
                name="patientType"
                value={form.patientType}
                onChange={handleChange}
                className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>In Patient</option>
                <option>Out Patient</option>
              </select>
            </div>
          </div>

          {/* Department + Doctor */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Select Department *
              </label>
              <select
                name="department"
                value={form.department}
                onChange={handleChange}
                className={`w-full mt-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.department ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select Department</option>
                <option value="Anaesthesiology">Anaesthesiology</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Dental Surgery">Dental Surgery</option>
                <option value="Dermatology">Dermatology</option>
                <option value="ENT Surgery">ENT Surgery</option>
                <option value="General Medicine">General Medicine</option>
                <option value="Neurology">Neurology</option>
                <option value="Ophthalmology">Ophthalmology</option>
                <option value="Orthopaedics">Orthopaedics</option>
                <option value="Paediatrics">Paediatrics</option>
                <option value="Radiology">Radiology</option>
              </select>
              {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Select Doctor *
              </label>
              <select
                name="doctor"
                value={form.doctor}
                onChange={handleChange}
                className={`w-full mt-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.doctor ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select Doctor</option>
                <option value="Dr. Andrew Clark">Dr. Andrew Clark</option>
                <option value="Dr. Katherine Brooks">Dr. Katherine Brooks</option>
                <option value="Dr. Benjamin Harris">Dr. Benjamin Harris</option>
                <option value="Dr. Laura Mitchell">Dr. Laura Mitchell</option>
                <option value="Dr. Christopher Lewis">Dr. Christopher Lewis</option>
                <option value="Dr. Sarah Wilson">Dr. Sarah Wilson</option>
                <option value="Dr. Michael Lee">Dr. Michael Lee</option>
                <option value="Dr. Emily Chen">Dr. Emily Chen</option>
                <option value="Dr. Robert Johnson">Dr. Robert Johnson</option>
                <option value="Dr. Maria Garcia">Dr. Maria Garcia</option>
                <option value="Dr. James Wilson">Dr. James Wilson</option>
              </select>
              {errors.doctor && <p className="text-red-500 text-xs mt-1">{errors.doctor}</p>}
            </div>
          </div>

          {/* Consultation Mode */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Preferred Mode of Consultation *
            </label>
            <select
              name="mode"
              value={form.mode}
              onChange={handleChange}
              className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>In Person</option>
              <option>Video</option>
              <option>Phone</option>
            </select>
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Date *
              </label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                className={`w-full mt-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.date ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Start Time *
              </label>
              <input
                type="time"
                name="startTime"
                value={form.startTime}
                onChange={handleChange}
                className={`w-full mt-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.startTime ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.startTime && <p className="text-red-500 text-xs mt-1">{errors.startTime}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                End Time *
              </label>
              <input
                type="time"
                name="endTime"
                value={form.endTime}
                onChange={handleChange}
                className={`w-full mt-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.endTime ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.endTime && <p className="text-red-500 text-xs mt-1">{errors.endTime}</p>}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Reason *
            </label>
            <input
              type="text"
              name="reason"
              value={form.reason}
              onChange={handleChange}
              className={`w-full mt-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.reason ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter reason for appointment"
            />
            {errors.reason && <p className="text-red-500 text-xs mt-1">{errors.reason}</p>}
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Quick Notes
            </label>
            <textarea
              name="notes"
              rows="3"
              value={form.notes}
              onChange={handleChange}
              className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Provide detailed instructions on how to use prescribed medications..."
            />
          </div>

          {/* Payment */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Mode of Payment
            </label>
            <select
              name="payment"
              value={form.payment}
              onChange={handleChange}
              className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>Card</option>
              <option>Cash</option>
              <option>Insurance</option>
              <option>Online</option>
            </select>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#1C62A0] text-white rounded-lg hover:bg-[#154d82] transition"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAppointmentModal;