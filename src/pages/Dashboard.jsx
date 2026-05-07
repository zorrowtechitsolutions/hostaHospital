import React, { useState, useRef, useEffect } from "react";
import { 
  Users, Calendar, Stethoscope, MoreVertical, Check, X
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import ApproveRequestModal from "@/components/Requests/ApproveRequestModel";
import RejectRequestModal from "@/components/Requests/RejectRequestModel";

// DateDropdown component integrated directly
const DateDropdown = () => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("3 Apr 26 - 3 Apr 26");
  const ref = useRef(null);

  const options = [
    "Today",
    "Yesterday",
    "Last 7 Days",
    "Last 30 Days",
    "This Month",
    "Last Month",
    "Custom Range",
  ];

  useEffect(() => {
    const close = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-xs bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <Calendar size={14} />
        {selected}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden z-50">
          {options.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                setSelected(item);
                setOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-purple-600 hover:text-white transition-colors"
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// DashboardPanels Component
const DashboardPanels = () => {
  const navigate = useNavigate();
  const reports = [
    ['David Marshall', 'Hemoglobin', '💧'],
    ['Thomas McLean', 'X Ray', '🟢'],
    ['Greta Kinney', 'MRI Scan', '🧠'],
    ['Larry Wilburn', 'Blood Test', '🧪'],
    ['Reyan Verol', 'CT Scan', '📋']
  ];

  const doctors = [
    ['Dr. William Harrison', 'Cardiology', 'Available'],
    ['Dr. Victoria Adams', 'Urology', 'Unavailable'],
    ['Dr. Jonathan Bennett', 'Radiology', 'Available'],
    ['Dr. Natalie Brooks', 'ENT Surgery', 'Available'],
    ['Dr. Samuel Reed', 'Dermatology', 'Available']
  ];

  return (
<div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6 mt-6">
        {/* Patient Reports */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700">
        <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">Patient Reports</h2>
          <button 
            onClick={() => navigate('/lab/results')}
            className="border border-slate-200 dark:border-gray-600 rounded-lg px-3 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            View All
          </button>
        </div>
        <div className="p-4 space-y-3">
          {reports.map(([name, type, icon]) => (
            <div key={name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-gray-700 flex items-center justify-center text-sm">{icon}</div>
                <div>
                  <p className="font-semibold text-sm text-gray-800 dark:text-white">{name}</p>
                  <p className="text-xs text-slate-500 dark:text-gray-400">{type}</p>
                </div>
              </div>
              <button className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-600 transition-colors text-xs">
                ⬇
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Patient Visits */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700">
        <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">Patient Visits</h2>
          <button 
            onClick={() => navigate('/visits')}
            className="border border-slate-200 dark:border-gray-600 rounded-lg px-3 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            View All
          </button>
        </div>
        <div className="p-4 text-center">
          <div className="w-32 h-32 mx-auto rounded-full border-[8px] border-dashed border-blue-400 flex items-center justify-center text-center">
            <div>
              <p className="text-xs text-slate-500 dark:text-gray-400">Total Patients</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">90%</p>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-left">
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400"><span>Male</span><span>69%</span></div>
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400"><span>Female</span><span>56%</span></div>
          </div>
        </div>
      </div>

      {/* Doctors */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700">
        <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">Doctors</h2>
          <button 
            onClick={() => navigate('/doctors')}
            className="border border-slate-200 dark:border-gray-600 rounded-lg px-3 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            View All
          </button>
        </div>
        <div className="p-4 space-y-3">
          {doctors.map(([name, dept, status]) => (
            <div key={name} className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-sm text-gray-800 dark:text-white">{name}</p>
                <p className="text-xs text-slate-500 dark:text-gray-400">{dept}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                status === 'Available' 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              }`}>
                {status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// DepartmentAndPatientRecord Component
const DepartmentAndPatientRecord = () => {
  const navigate = useNavigate();
  const departments = [
    ['Cardiology', '#2F80ED'],
    ['Neurology', '#111827'],
    ['Dermatology', '#7C3AED'],
    ['Orthopedics', '#F97316'],
    ['Urology', '#FBBF24'],
    ['Radiology', '#4338CA']
  ];

  const records = [
    ['James Carter', 'Male', 'Cardiology', '17 Jun 2025'],
    ['Emily Davis', 'Female', 'Urology', '10 Jun 2025'],
    ['Michael John', 'Male', 'Radiology', '22 May 2025'],
    ['Olivia Miller', 'Female', 'ENT Surgery', '15 May 2025'],
    ['David Smith', 'Male', 'Dermatology', '30 Apr 2025']
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-6">
      {/* Top Departments */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700">
        <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">Top Departments</h2>
          <button 
            onClick={() => navigate('/appointments')}
            className="border border-slate-200 dark:border-gray-600 rounded-lg px-3 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            View All
          </button>
        </div>

        <div className="p-4">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="w-40 h-40 rounded-full border-[10px] border-dashed border-blue-400 flex items-center justify-center text-center">
              <div>
                <p className="text-xs text-slate-500 dark:text-gray-400">Appointments</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">3656</p>
              </div>
            </div>

            <div className="space-y-2">
              {departments.map(([name, color]) => (
                <div key={name} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 mt-6 border border-slate-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="p-3 text-center border-r border-slate-200 dark:border-gray-700">
              <p className="text-lg font-bold text-gray-800 dark:text-white">$2512.32</p>
              <p className="text-xs text-slate-500 dark:text-gray-400">Revenue Generated</p>
            </div>
            <div className="p-3 text-center">
              <p className="text-lg font-bold text-gray-800 dark:text-white">3125+</p>
              <p className="text-xs text-slate-500 dark:text-gray-400">Appointments last month</p>
            </div>
          </div>
        </div>
      </div>

      {/* Patient Record */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700">
        <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">Patient Record</h2>
          <button 
            onClick={() => navigate('/patients')}
            className="border border-slate-200 dark:border-gray-600 rounded-lg px-3 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            View All
          </button>
        </div>

        <div className="p-4 overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100 dark:bg-gray-700 text-slate-800 dark:text-gray-200">
                <th className="p-2 text-xs">Patient Name</th>
                <th className="p-2 text-xs">Diagnosis</th>
                <th className="p-2 text-xs">Department</th>
                <th className="p-2 text-xs">Last Visit</th>
              </tr>
            </thead>
            <tbody>
              {records.map(([name, diagnosis, dept, date]) => (
                <tr key={name} className="border-b border-slate-200 dark:border-gray-700">
                  <td className="p-2 font-medium text-sm text-gray-800 dark:text-white">{name}</td>
                  <td className="p-2 text-xs text-gray-600 dark:text-gray-400">{diagnosis}</td>
                  <td className="p-2">
                    <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400 text-xs">{dept}</span>
                  </td>
                  <td className="p-2 text-xs text-gray-600 dark:text-gray-400">{date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// LatestAppointments Component
const LatestAppointments = () => {
  const navigate = useNavigate();
  const appointments = [
    ['#PT0025', 'James Carter', 'Visit', 'Dr. Andrew Clark', '17 Jun 2025', 'Inprogress'],
    ['#PT0024', 'Emily Davis', 'Consultation', 'Dr. Katherine Brooks', '10 Jun 2025', 'Inprogress'],
    ['#PT0023', 'Michael Johnson', 'Visit', 'Dr. Benjamin Harris', '22 May 2025', 'Completed'],
    ['#PT0022', 'Olivia Miller', 'Consultation', 'Dr. Laura Mitchell', '15 May 2025', 'Completed'],
    ['#PT0021', 'David Smith', 'Consultation', 'Dr. Christopher Lewis', '30 Apr 2025', 'Completed']
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">Latest Appointments</h2>
        <button 
          onClick={() => navigate('/appointments')}
          className="border border-slate-200 dark:border-gray-600 rounded-lg px-3 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          View All
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="bg-slate-100 dark:bg-gray-700 text-slate-800 dark:text-gray-200">
              <th className="p-2 text-xs">Patient ID</th>
              <th className="p-2 text-xs">Patient Name</th>
              <th className="p-2 text-xs">Session</th>
              <th className="p-2 text-xs">Doctor</th>
              <th className="p-2 text-xs">Date</th>
              <th className="p-2 text-xs">Status</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map(([id, patient, session, doctor, date, status]) => (
              <tr key={id} className="border-b border-slate-200 dark:border-gray-700">
                <td className="p-2 font-medium text-xs text-gray-800 dark:text-white">{id}</td>
                <td className="p-2 text-xs text-gray-600 dark:text-gray-400">{patient}</td>
                <td className="p-2 text-xs text-gray-600 dark:text-gray-400">{session}</td>
                <td className="p-2 text-xs text-gray-600 dark:text-gray-400">{doctor}</td>
                <td className="p-2 text-xs text-gray-600 dark:text-gray-400">{date}</td>
                <td className="p-2">
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${
                    status === 'Completed'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                  }`}>
                    {status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Main Dashboard Component
export default function Dashboard() {
  const navigate = useNavigate();

  // Modal States
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const stats = [
    {
      title: "Patients",
      value: "108",
      icon: Users,
      color: "bg-blue-500",
      change: "+20%",
      changeColor: "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30",
      path: "/patients",
    },
    {
      title: "Appointments",
      value: "658",
      icon: Calendar,
      color: "bg-orange-500",
      change: "-15%",
      changeColor: "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30",
      path: "/appointments",
    },
    {
      title: "Doctors",
      value: "565",
      icon: Stethoscope,
      color: "bg-purple-500",
      change: "+18%",
      changeColor: "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30",
      path: "/doctors",
    },
  ];

  const appointmentRequests = [
    { id: 1, name: "Dominic Foster", dept: "Urology", date: "12 Aug 2025", time: "11:35 PM" },
    { id: 2, name: "Charlotte Bennett", dept: "Cardiology", date: "06 Aug 2025", time: "09:58 AM" },
    { id: 3, name: "Ethan Sullivan", dept: "Dermatology", date: "01 Aug 2025", time: "12:10 PM" },
    { id: 4, name: "Brianna Thompson", dept: "ENT Surgery", date: "26 Jul 2025", time: "02:30 PM" },
    { id: 5, name: "Michael Rodriguez", dept: "Neurology", date: "20 Jul 2025", time: "01:45 PM" },
  ];

  const allAppointments = ["Urology", "Cardiology", "Dermatology", "ENT Surgery"];

  // Handle Approve
  const handleApproveClick = (request) => {
    setSelectedRequest(request);
    setShowApproveModal(true);
  };

  const handleConfirmApprove = (appointmentData) => {
    console.log("Appointment confirmed:", appointmentData, "for request:", selectedRequest);
    alert(`Appointment confirmed for ${selectedRequest?.name} on ${appointmentData.date} at ${appointmentData.time} with Token #${appointmentData.token}`);
    setShowApproveModal(false);
    setSelectedRequest(null);
  };

  // Handle Reject
  const handleRejectClick = (request) => {
    setSelectedRequest(request);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const handleConfirmReject = () => {
    console.log("Request rejected with reason:", rejectReason, "for request:", selectedRequest);
    alert(`Request for ${selectedRequest?.name} has been rejected. Reason: ${rejectReason || "No reason provided"}`);
    setShowRejectModal(false);
    setSelectedRequest(null);
    setRejectReason("");
  };

  return (
    <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen transition-all duration-300">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-white">
            Welcome, Admin
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Today you have 10 visits •{" "}
            <button 
              onClick={() => navigate("/visits")}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              View Details
            </button>
          </p>
        </div>

        {/* Date Dropdown - Replaces Search Bar */}
        <DateDropdown />
      </div>

      {/* Stats Cards - 3 cards only */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {stats.map((item, index) => (
          <div
            key={index}
            onClick={() => navigate(item.path)}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex justify-between items-start mb-3">
              <div className={`${item.color} p-2 rounded-lg`}>
                <item.icon className="text-white" size={18} />
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${item.changeColor}`}>
                {item.change}
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">{item.value}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.title}</p>
            <div className="mt-3 h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${item.color.replace('bg-', 'bg-')}`}
                style={{ width: `${Math.abs(parseInt(item.change)) * 2}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Section - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Appointment Requests Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="font-semibold text-sm text-gray-800 dark:text-white">Appointment Request</h3>
            <button 
              onClick={() => navigate("/requests")}
              className="text-purple-600 dark:text-purple-400 hover:text-purple-700 text-xs font-medium"
            >
              View All →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="text-left p-3 text-xs font-medium text-gray-500 dark:text-gray-400">Patient Name</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-500 dark:text-gray-400">Department</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-500 dark:text-gray-400">Date</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-500 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {appointmentRequests.map((request, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="p-3">
                      <p className="font-medium text-gray-800 dark:text-white text-sm">{request.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{request.time}</p>
                    </td>
                    <td className="p-3">
                      <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                        {request.dept}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-gray-600 dark:text-gray-300">{request.date}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleApproveClick(request)}
                          className="p-1 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-100 transition-colors"
                          title="Approve Request"
                        >
                          <Check size={14} />
                        </button>
                        <button 
                          onClick={() => handleRejectClick(request)}
                          className="p-1 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors"
                          title="Reject Request"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column - Patients Statistics & All Appointments */}
        <div className="space-y-5">
          {/* Patients Statistics */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="font-semibold text-sm text-gray-800 dark:text-white">Patients Statistics</h3>
              <button 
                onClick={() => navigate("/patients")}
                className="text-purple-600 dark:text-purple-400 hover:text-purple-700 text-xs font-medium"
              >
                View All →
              </button>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Patients</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-white">480</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">New (96)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">Old (384)</span>
                  </div>
                </div>
              </div>
              {/* Bar Chart Visualization */}
              <div className="space-y-2">
                {['Jan', 'Feb', 'Mar', 'Apr'].map((month, idx) => {
                  const percentages = [45, 62, 78, 54];
                  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500'];
                  return (
                    <div key={month}>
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                        <span>{month}</span>
                        <span>{percentages[idx]} patients</span>
                      </div>
                      <div className="h-5 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                        <div className={`h-full ${colors[idx]} rounded-lg`} style={{ width: `${percentages[idx]}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* All Appointments Categories */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-sm text-gray-800 dark:text-white">All Appointments</h3>
            </div>
            <div className="p-3 grid grid-cols-2 gap-2">
              {allAppointments.map((appt, idx) => (
                <div
                  key={idx}
                  onClick={() => navigate("/appointments")}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{appt}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">→</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Panels Row */}
      <DashboardPanels />

      {/* Department and Patient Record Row */}
      <DepartmentAndPatientRecord />

      {/* Latest Appointments */}
      <LatestAppointments />

      {/* Modals */}
      {showApproveModal && (
        <ApproveRequestModal
          onClose={() => {
            setShowApproveModal(false);
            setSelectedRequest(null);
          }}
          onConfirm={handleConfirmApprove}
        />
      )}

      {showRejectModal && (
        <RejectRequestModal
          onClose={() => {
            setShowRejectModal(false);
            setSelectedRequest(null);
            setRejectReason("");
          }}
          onConfirm={handleConfirmReject}
          reason={rejectReason}
          setReason={setRejectReason}
        />
      )}
    </div>
  );
}