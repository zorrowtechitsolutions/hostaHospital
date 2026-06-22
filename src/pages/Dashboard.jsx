import React, { useState, useRef, useEffect, useMemo } from "react";
import { 
  Users, Calendar, Stethoscope, MoreVertical, Check, X, Droplet, User, Clock
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import ApproveRequestModal from "@/components/Requests/ApproveRequestModel";
import RejectRequestModal from "@/components/Requests/RejectRequestModel";
import { useGetPatientsQuery } from "../../app/service/patients";
import { useGetBookingsQuery } from "../../app/service/request";
import { useGetDoctorsQuery } from "../../app/service/doctorApi";
import { useGetBloodBankQuery } from "../../app/service/bloodbank";
import { showSuccessToast, showErrorToast } from "../components/ui/Toast";
import { getHospitalId } from "../utils/auth";

// Helper function to get department consistently
const getDepartment = (booking) => {
  return booking.doctor_department ||
         booking.department ||
         booking.doctor?.department ||
         "General";
};

// Helper function to format date
const formatVisitDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString("en-US", { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    }
  } catch (error) {
    return "N/A";
  }
};

// DateDropdown component integrated directly
const DateDropdown = () => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("Today");
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
  
  const hospitalId = getHospitalId();
  
  const { data: patientsData } = useGetPatientsQuery(
    { hospitalId },
    { refetchOnMountOrArgChange: true }
  );
  const patients = patientsData?.data || [];
  
  const { data: doctorsData } = useGetDoctorsQuery(
    { hospitalId },
    { refetchOnMountOrArgChange: true }
  );
  const doctors = doctorsData?.data || [];
  
  const { data: bloodBankData } = useGetBloodBankQuery();
  const bloodStocks = bloodBankData?.data || [];

  const { data: bookingsData } = useGetBookingsQuery({ status: "accepted", limit: 10 });
  const bookings = bookingsData?.data || [];

  const recentVisits = useMemo(() => {
    return bookings.slice(0, 5).map((booking) => ({
      id: booking.id || booking._id,
      name: booking.patient_name || booking.patientName || "Unknown Patient",
      date: formatVisitDate(booking.booking_date || booking.date),
      doctor: booking.doctor_name || booking.displayName || "Doctor",
      department: getDepartment(booking),
      rawDate: booking.booking_date || booking.date,
      time: booking.consulting_time || booking.time || "",
    }));
  }, [bookings]);

  const doctorsList = doctors.slice(0, 5).map((doctor) => [
    doctor.displayName || doctor.name,
    doctor.department || doctor.specialist || "General",
    doctor.isActive ? "Available" : "Unavailable"
  ]);

  const getStockColor = (count) => {
    if (count === 0) return "text-red-600 bg-red-50 dark:bg-red-900/20";
    if (count < 10) return "text-orange-600 bg-orange-50 dark:bg-orange-900/20";
    if (count < 30) return "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20";
    return "text-green-600 bg-green-50 dark:bg-green-900/20";
  };

  const totalVisits = bookings.length;
  const thisMonthVisits = bookings.filter(b => {
    if (!b.booking_date) return false;
    const date = new Date(b.booking_date);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6 mt-6">
      {/* Blood Bank Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700">
        <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Droplet size={18} className="text-red-500" />
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Blood Bank</h2>
          </div>
          <button 
            onClick={() => navigate('/blood-bank')}
            className="border border-slate-200 dark:border-gray-600 rounded-lg px-3 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            View All
          </button>
        </div>
        <div className="p-4 space-y-3">
          {bloodStocks.slice(0, 5).map((stock) => {
            const isLowStock = stock.count < 10;
            return (
              <div key={stock.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${getStockColor(stock.count)}`}>
                    <Droplet size={14} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-800 dark:text-white">{stock.bloodGroup}</p>
                    <p className="text-xs text-slate-500 dark:text-gray-400">
                      {stock.count} units • Last updated: {stock.updatedAt?.split('T')[0] || 'N/A'}
                    </p>
                  </div>
                </div>
                {isLowStock && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                    Low Stock
                  </span>
                )}
              </div>
            );
          })}
          {bloodStocks.length === 0 && (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
              No blood stock data available
            </div>
          )}
        </div>
      </div>

      {/* Patient Visits - Connected to API */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700">
        <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <User size={18} className="text-blue-500" />
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Patient Visits</h2>
          </div>
          <button 
            onClick={() => navigate('/visits')}
            className="border border-slate-200 dark:border-gray-600 rounded-lg px-3 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            View All
          </button>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalVisits}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Total Visits</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{thisMonthVisits}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">This Month</p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Recent Visits
            </p>
            {recentVisits.length > 0 ? (
              recentVisits.map((visit) => (
                <div 
                  key={visit.id} 
                  onClick={() => navigate(`/visits`)}
                  className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-medium">
                      {visit.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-white">{visit.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{visit.doctor} • {visit.department}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={12} className="text-gray-400" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">{visit.date}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                No recent visits
              </div>
            )}
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
          {doctorsList.map(([name, dept, status]) => (
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
  
  const hospitalId = getHospitalId();
  
  const { data: bookingsData } = useGetBookingsQuery({ limit: 100 });
  const bookings = bookingsData?.data || [];

  const { data: patientsData } = useGetPatientsQuery(
    { hospitalId, limit: 5 },
    { refetchOnMountOrArgChange: true }
  );
  const patients = patientsData?.data || [];

  const departmentStats = useMemo(() => {
    const stats = {};
    bookings.forEach((booking) => {
      const dept = getDepartment(booking);
      if (dept) {
        stats[dept] = (stats[dept] || 0) + 1;
      }
    });
    
    return Object.entries(stats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name, count }));
  }, [bookings]);

  const departmentColors = ['#2F80ED', '#111827', '#7C3AED', '#F97316', '#FBBF24', '#4338CA'];

  const records = patients.slice(0, 5).map((patient) => [
    patient.name,
    patient.gender || "Male",
    patient.department || "General",
    patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : "N/A"
  ]);

  const totalAppointments = bookings.length;
  const lastMonthAppointments = bookings.filter(b => {
    if (!b.booking_date) return false;
    const date = new Date(b.booking_date);
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    return date >= lastMonth && date <= lastMonthEnd;
  }).length;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-6">
      {/* Top Departments - Connected to API */}
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
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{totalAppointments}</p>
              </div>
            </div>

            <div className="space-y-2 flex-1">
              {departmentStats.length > 0 ? (
                departmentStats.map((dept, index) => (
                  <div key={dept.name} className="flex items-center gap-2">
                    <span 
                      className="w-3 h-3 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: departmentColors[index % departmentColors.length] }}
                    ></span>
                    <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{dept.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{dept.count}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                  No department data available
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 mt-6 border border-slate-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="p-3 text-center border-r border-slate-200 dark:border-gray-700">
              <p className="text-lg font-bold text-gray-800 dark:text-white">{totalAppointments}</p>
              <p className="text-xs text-slate-500 dark:text-gray-400">Total Appointments</p>
            </div>
            <div className="p-3 text-center">
              <p className="text-lg font-bold text-gray-800 dark:text-white">{lastMonthAppointments}+</p>
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
  
  const { data: bookingsResponse } = useGetBookingsQuery({ limit: 5 });
  const bookings = bookingsResponse?.data || [];
  
  const acceptedAppointments = bookings.filter(b => b.status === 'accepted').slice(0, 5);
  
  const appointments = acceptedAppointments.map((booking, idx) => {
    const department = getDepartment(booking);
    return [
      `#PT${String(booking.userId || idx + 1).padStart(4, '0')}`,
      booking.patient_name || "Patient",
      "Visit",
      booking.doctor_name || booking.displayName || "Doctor",
      department,
      booking.booking_date ? new Date(booking.booking_date).toLocaleDateString() : "N/A",
      "Inprogress"
    ];
  });

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
              <th className="p-2 text-xs">Department</th>
              <th className="p-2 text-xs">Date</th>
              <th className="p-2 text-xs">Status</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map(([id, patient, session, doctor, department, date, status]) => (
              <tr key={id} className="border-b border-slate-200 dark:border-gray-700">
                <td className="p-2 font-medium text-xs text-gray-800 dark:text-white">{id}</td>
                <td className="p-2 text-xs text-gray-600 dark:text-gray-400">{patient}</td>
                <td className="p-2 text-xs text-gray-600 dark:text-gray-400">{session}</td>
                <td className="p-2 text-xs text-gray-600 dark:text-gray-400">{doctor}</td>
                <td className="p-2">
                  <span className="px-2 py-0.5 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs">
                    {department}
                  </span>
                </td>
                <td className="p-2 text-xs text-gray-600 dark:text-gray-400">{date}</td>
                <td className="p-2">
                  <span className="px-2 py-0.5 rounded-lg text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
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

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const hospitalId = getHospitalId();

  const { data: patientsData } = useGetPatientsQuery(
    { hospitalId },
    { refetchOnMountOrArgChange: true }
  );
  const { data: appointmentsData } = useGetBookingsQuery({});
  const { data: doctorsData } = useGetDoctorsQuery(
    { hospitalId },
    { refetchOnMountOrArgChange: true }
  );

  const totalPatients = patientsData?.pagination?.totalItems || 0;
  const totalAppointments = appointmentsData?.pagination?.totalItems || 0;
  const totalDoctors = doctorsData?.pagination?.totalItems || 0;
  
  const { data: pendingRequestsData, refetch: refetchPending } = useGetBookingsQuery({ status: "pending", limit: 5 });
  const appointmentRequests = pendingRequestsData?.data || [];

  const bookings = appointmentsData?.data || [];
  
  const appointmentDepartments = [
    ...new Set(
      bookings
        .map(
          (booking) =>
            booking.doctor_department ||
            booking.department ||
            booking.doctor?.department
        )
        .filter(Boolean)
    ),
  ];

  const patientStats = useMemo(() => {
    const patients = patientsData?.data || [];
    const total = patients.length;
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newPatients = patients.filter(p => {
      if (!p.createdAt) return false;
      const createdDate = new Date(p.createdAt);
      return createdDate >= thirtyDaysAgo;
    }).length;
    
    const oldPatients = total - newPatients;
    
    const monthlyData = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const now = new Date();
    for (let i = 3; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = monthNames[month.getMonth()];
      monthlyData[monthName] = 0;
    }
    
    patients.forEach(p => {
      if (!p.createdAt) return;
      const createdDate = new Date(p.createdAt);
      const monthName = monthNames[createdDate.getMonth()];
      if (monthlyData[monthName] !== undefined) {
        monthlyData[monthName]++;
      }
    });
    
    const chartMonths = Object.keys(monthlyData);
    const chartValues = Object.values(monthlyData);
    const maxValue = Math.max(...chartValues, 1);
    const chartColors = ['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500'];
    
    const chartData = chartMonths.map((month, idx) => ({
      month,
      count: chartValues[idx] || 0,
      percentage: Math.round((chartValues[idx] || 0) / maxValue * 100) || 0,
      color: chartColors[idx % chartColors.length]
    }));

    return {
      total,
      newPatients,
      oldPatients,
      chartData
    };
  }, [patientsData]);

  const stats = [
    {
      title: "Patients",
      value: totalPatients.toString(),
      icon: Users,
      color: "bg-blue-500",
      changeColor: "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30",
      path: "/patients",
    },
    {
      title: "Appointments",
      value: totalAppointments.toString(),
      icon: Calendar,
      color: "bg-orange-500",
      changeColor: "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30",
      path: "/appointments",
    },
    {
      title: "Doctors",
      value: totalDoctors.toString(),
      icon: Stethoscope,
      color: "bg-purple-500",
      changeColor: "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30",
      path: "/doctors",
    },
  ];

  const handleApproveClick = (request) => {
    setSelectedRequest(request);
    setShowApproveModal(true);
  };

  const handleConfirmApprove = async (appointmentData) => {
    showSuccessToast(
      `Appointment confirmed for ${selectedRequest?.patient_name}`,
      4000,
      {
        'Patient': selectedRequest?.patient_name,
        'Date': appointmentData.date,
        'Time': appointmentData.consulting_time,
        'Token': `#${appointmentData.token}`
      }
    );
    setShowApproveModal(false);
    setSelectedRequest(null);
    await refetchPending();
  };

  const handleRejectClick = (request) => {
    setSelectedRequest(request);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const handleConfirmReject = async () => {
    showErrorToast(
      `Request for ${selectedRequest?.patient_name} has been rejected.`,
      4000,
      {
        'Patient': selectedRequest?.patient_name,
        'Reason': rejectReason || "No reason provided"
      }
    );
    setShowRejectModal(false);
    setSelectedRequest(null);
    setRejectReason("");
    await refetchPending();
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
            Today you have {appointmentRequests.length} visits •{" "}
            <button 
              onClick={() => navigate("/visits")}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              View Details
            </button>
          </p>
        </div>

        <DateDropdown />
      </div>

      {/* Stats Cards */}
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
                {appointmentRequests.map((request, idx) => {
                  const department = getDepartment(request);
                  return (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="p-3">
                        <p className="font-medium text-gray-800 dark:text-white text-sm">{request.patient_name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{request.consulting_time || "N/A"}</p>
                      </td>
                      <td className="p-3">
                        <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                          {department}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-gray-600 dark:text-gray-300">
                        {request.booking_date ? new Date(request.booking_date).toLocaleDateString() : "N/A"}
                      </td>
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column - Patients Statistics & All Appointments */}
        <div className="space-y-5">
          {/* Patients Statistics - Connected to Real API */}
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
                  <p className="text-xl font-bold text-gray-800 dark:text-white">{patientStats.total}</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">New ({patientStats.newPatients})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">Old ({patientStats.oldPatients})</span>
                  </div>
                </div>
              </div>
              {/* Bar Chart Visualization - From Real Data */}
              <div className="space-y-2">
                {patientStats.chartData.map((data, idx) => (
                  <div key={data.month}>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                      <span>{data.month}</span>
                      <span>{data.count} patients</span>
                    </div>
                    <div className="h-5 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                      <div 
                        className={`h-full ${data.color} rounded-lg transition-all duration-500`} 
                        style={{ width: `${data.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* All Appointments Categories - Dynamic from API */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-sm text-gray-800 dark:text-white">All Appointments</h3>
            </div>
            <div className="p-3 grid grid-cols-2 gap-2">
              {appointmentDepartments.length > 0 ? (
                appointmentDepartments.slice(0, 8).map((department, idx) => (
                  <div
                    key={idx}
                    onClick={() =>
                      navigate("/appointments", {
                        state: { department },
                      })
                    }
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {department}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      →
                    </span>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                  No departments found
                </div>
              )}
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