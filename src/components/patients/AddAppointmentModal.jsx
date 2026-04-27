import React, { useState } from "react";
import { X, Calendar, Clock, DollarSign, FileText, User, Stethoscope } from "lucide-react";

const AddAppointmentModal = ({ isOpen, onClose, patient, onSave }) => {
  const [formData, setFormData] = useState({
    patientType: "",
    preferredMode: "",
    date: "",
    startTime: "",
    endTime: "",
    reason: "",
    quickNotes: "",
    paymentMethod: "",
    selectDoctor: ""
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const appointmentData = {
      id: `APT${Math.floor(Math.random() * 10000)}`,
      patientId: patient?.id || "PT0025",
      patientName: patient?.name || "James Carter",
      doctorName: formData.selectDoctor,
      department: patient?.department || "Cardiology",
      appointmentDate: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      status: "Upcoming",
      fee: "$350",
      duration: "1 hour",
      reason: formData.reason,
      notes: formData.quickNotes,
      paymentMethod: formData.paymentMethod,
      patientType: formData.patientType,
      preferredMode: formData.preferredMode,
      avatar: patient?.imageUrl || "https://randomuser.me/api/portraits/men/32.jpg"
    };
    
    if (onSave) {
      onSave(appointmentData);
    }
    onClose();
  };

  // Mock doctors list
  const doctorsList = [
    "Dr. Andrew Clark (Cardiology)",
    "Dr. Sarah Wilson (Cardiology)",
    "Dr. Michael Lee (Neurology)",
    "Dr. Emily Chen (Pulmonology)",
    "Dr. Robert Johnson (Surgery)",
    "Dr. Maria Garcia (Pulmonology)",
    "Dr. James Wilson (Cardiology)",
    "Dr. Katherine Brooks (Dental)",
    "Dr. Benjamin Harris (Dermatology)",
    "Dr. Laura Mitchell (ENT)"
  ];

  const reasonsList = [
    "General Checkup",
    "Follow-up Visit",
    "Emergency",
    "Consultation",
    "Vaccination",
    "Test Results Review",
    "Surgery Follow-up",
    "New Symptoms"
  ];

  const paymentMethods = [
    "Cash",
    "Card",
    "Insurance",
    "Online Transfer",
    "Check"
  ];

  const patientTypes = [
    "Out Patient",
    "In Patient",
    "Emergency",
    "New Patient",
    "Follow-up Patient"
  ];

  const consultationModes = [
    "In-person",
    "Video Call",
    "Phone Call",
    "Home Visit"
  ];

  // Get today's date for min attribute
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <style jsx>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Schedule Appointment</h2>
            <p className="text-sm text-gray-500 mt-1">
              For {patient?.name || "James Carter"} (#{patient?.id || "PT0025"})
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Patient Info Summary */}
        <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
          <div className="flex items-center gap-4">
            <img 
              src={patient?.imageUrl || "https://randomuser.me/api/portraits/men/32.jpg"} 
              alt={patient?.name} 
              className="w-12 h-12 rounded-full object-cover border-2 border-blue-200"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-gray-600 bg-white px-2 py-0.5 rounded">
                  {patient?.id || "PT0025"}
                </span>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  Last Visit: {patient?.lastVisitDisplay || "17 Jun 2025"}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900">{patient?.name || "James Carter"}</h3>
              <p className="text-xs text-gray-600">{patient?.gender || "Male"} • {patient?.age || 45} years</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Two Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Patient Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Patient Type <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.patientType}
                onChange={(e) => setFormData({...formData, patientType: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">Select Patient Type</option>
                {patientTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Preferred Mode of Consultation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Mode of Consultation <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.preferredMode}
                onChange={(e) => setFormData({...formData, preferredMode: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">Select Mode</option>
                {consultationModes.map(mode => (
                  <option key={mode} value={mode}>{mode}</option>
                ))}
              </select>
            </div>

            {/* Select Doctor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Doctor <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.selectDoctor}
                onChange={(e) => setFormData({...formData, selectDoctor: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">Select Doctor</option>
                {doctorsList.map(doctor => (
                  <option key={doctor} value={doctor}>{doctor}</option>
                ))}
              </select>
            </div>

            {/* Reason for Visit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Visit <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">Select Reason</option>
                {reasonsList.map(reason => (
                  <option key={reason} value={reason}>{reason}</option>
                ))}
              </select>
            </div>

            {/* Appointment Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Appointment Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="date"
                  required
                  min={today}
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="time"
                  required
                  value={formData.startTime}
                  onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            {/* End Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="time"
                  required
                  value={formData.endTime}
                  onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Mode of Payment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mode of Payment <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  required
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">Select Payment Method</option>
                  {paymentMethods.map(method => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Notes - Full Width */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Notes
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                <textarea
                  rows="3"
                  value={formData.quickNotes}
                  onChange={(e) => setFormData({...formData, quickNotes: e.target.value})}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Additional information about the appointment..."
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Appointment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAppointmentModal;