import React, { useState } from "react";

const EditVisitModal = ({ isOpen, onClose, visitData, onSave }) => {
  const [formData, setFormData] = useState({
    patient: visitData?.patient || "James Carter",
    patientType: visitData?.patientType || "Out Patient",
    department: visitData?.department || "Anaesthesiology",
    doctor: visitData?.doctor || "Dr. Andrew Clark",
    date: visitData?.date || "2025-01-16",
    time: visitData?.time || "08:17",
    reason: visitData?.reason || "Fever, Headache",
    payment: visitData?.payment || "Cash"
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSave) {
      onSave(formData);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999]">
      <div className="bg-white w-[720px] rounded-xl shadow-xl">
        {/* HEADER */}
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Edit Visit</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-800 text-white hover:bg-gray-700 transition"
          >
            ×
          </button>
        </div>

        {/* BODY FORM */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 grid grid-cols-2 gap-4 text-sm">
            {/* Select Patient */}
            <div>
              <label className="block mb-1 text-gray-600">Select Patient</label>
              <select
                name="patient"
                value={formData.patient}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>James Carter</option>
                <option>Emily Rodriguez</option>
                <option>Michael Chen</option>
                <option>Sophia Martinez</option>
              </select>
            </div>

            {/* Patient Type */}
            <div>
              <label className="block mb-1 text-gray-600">Patient Type</label>
              <select
                name="patientType"
                value={formData.patientType}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>Out Patient</option>
                <option>In Patient</option>
              </select>
            </div>

            {/* Department */}
            <div>
              <label className="block mb-1 text-gray-600">Select Department *</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>Anaesthesiology</option>
                <option>Cardiology</option>
                <option>Dental Surgery</option>
                <option>Dermatology</option>
                <option>ENT Surgery</option>
                <option>General Medicine</option>
                <option>Neurology</option>
                <option>Ophthalmology</option>
                <option>Orthopaedics</option>
                <option>Paediatrics</option>
                <option>Radiology</option>
              </select>
            </div>

            {/* Doctor */}
            <div>
              <label className="block mb-1 text-gray-600">Select Doctor *</label>
              <select
                name="doctor"
                value={formData.doctor}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>Dr. Andrew Clark</option>
                <option>Dr. Katherine Brooks</option>
                <option>Dr. Benjamin Harris</option>
                <option>Dr. Laura Mitchell</option>
                <option>Dr. Christopher Lewis</option>
                <option>Dr. Sarah Wilson</option>
                <option>Dr. Jonathan Adams</option>
              </select>
            </div>

            {/* Date of Visit */}
            <div>
              <label className="block mb-1 text-gray-600">Date of Visit</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Time of Visit */}
            <div>
              <label className="block mb-1 text-gray-600">Time of Visit</label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Reason */}
            <div className="col-span-1">
              <label className="block mb-1 text-gray-600">Reason</label>
              <input
                type="text"
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                placeholder="Enter reason for visit"
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Mode of Payment */}
            <div>
              <label className="block mb-1 text-gray-600">Mode of Payment</label>
              <select
                name="payment"
                value={formData.payment}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>Cash</option>
                <option>Card</option>
                <option>Insurance</option>
                <option>Online</option>
              </select>
            </div>
          </div>

          {/* FOOTER BUTTONS */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#1C62A0] text-white rounded-md hover:bg-[#154d82] transition"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditVisitModal;