// src/components/attendance/EmployeeAttendance.jsx
import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  XCircle,
  RefreshCcw,
  Loader2,
  Calendar,
  LayoutGrid,
  List,
  Filter,
} from "lucide-react";
import { useGetAttendancesQuery } from "../../../app/service/attendance";
import { useGetDoctorByIdQuery } from "../../../app/service/doctorApi";
import { useGetStaffByIdQuery } from "../../../app/service/staffApi";

import ExcelExportButton from "../ui/ExcelExportButton";

// ============================================================
// MONTHS
// ============================================================
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// ============================================================
// HELPERS
// ============================================================
const extractRole = (details, fallback = "Employee") => {
  if (!details) return fallback;
  if (details.role && typeof details.role === "string") return details.role;
  if (details.designation) return details.designation;
  if (details.employeeType) return details.employeeType;
  if (details.jobTitle) return details.jobTitle;
  if (details.position) return details.position;
  if (details.speciality) return details.speciality;
  if (details.specialty) return details.specialty;
  if (details.department) return details.department;
  if (Array.isArray(details.roles) && details.roles.length > 0) {
    const r = details.roles[0];
    if (typeof r === "string") return r;
    if (r?.name) return r.name;
    if (r?.title) return r.title;
    if (r?.roleName) return r.roleName;
  }
  if (details.roles && typeof details.roles === "object") {
    if (details.roles.name) return details.roles.name;
    if (details.roles.title) return details.roles.title;
  }
  if (details.roleId && typeof details.roleId === "object") {
    if (details.roleId.name) return details.roleId.name;
    if (details.roleId.title) return details.roleId.title;
  }
  return fallback;
};

const extractPhone = (details) => {
  if (!details) return null;
  return (
    details.phone ||
    details.phoneNumber ||
    details.mobile ||
    details.mobileNumber ||
    details.mobile_number ||
    details.contact ||
    details.contactNumber ||
    details.contact_no ||
    details.phone_no ||
    null
  );
};

const extractEmail = (details) => {
  if (!details) return null;
  return (
    details.email ||
    details.emailId ||
    details.email_id ||
    details.emailAddress ||
    details.email_address ||
    null
  );
};

const extractImage = (details) => {
  if (!details) return null;
  return (
    details.imageUrl ||
    details.image ||
    details.profileImage ||
    details.profile_image ||
    details.photo ||
    details.profilePicture ||
    details.profile_picture ||
    details.avatar ||
    null
  );
};

const extractName = (details) => {
  if (!details) return null;
  if (details.name) return details.name;
  if (details.displayName) return details.displayName;
  if (details.firstName || details.lastName) {
    return `${details.firstName || ""} ${details.lastName || ""}`.trim();
  }
  return null;
};

const toLocalDateKey = (value) => {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const formatFullDate = (value) => {
  if (!value) return "N/A";
  try {
    return new Date(value).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "N/A";
  }
};

const formatFullTime = (value) => {
  if (!value) return "N/A";
  if (
    typeof value === "string" &&
    (value.includes("AM") || value.includes("PM"))
  )
    return value;
  try {
    return new Date(value).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return value || "N/A";
  }
};

// ============================================================
// ✅ STATUS MAP — identical to Attendance.jsx
//    These are the CANONICAL statuses stored in the DB.
//    Both files MUST use the same strings to stay consistent.
// ============================================================
const CANONICAL_STATUSES = {
  Present: "Present",
  Late: "Late",
  Absent: "Absent",
  "On Leave": "On Leave",
  "Half Day": "Half Day",
  "Early Departure": "Early Departure",
  "Shift Completed": "Shift Completed",
  verified: "Present",
  checked_in: "Present",
  checked_out: "Shift Completed",
};

const normalizeStatus = (raw) => {
  if (!raw) return "Present";
  return CANONICAL_STATUSES[raw] || raw;
};

// ============================================================
// ✅ STATUS BADGE — copied exactly from Attendance.jsx
//    getStatusBadge + getStatusDot
// ============================================================
const getStatusBadge = (status) => {
  switch (status) {
    case "Present":
      return "bg-green-50 text-green-700 border-green-200";
    case "Late":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "Absent":
      return "bg-red-50 text-red-700 border-red-200";
    case "On Leave":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "Half Day":
      return "bg-orange-50 text-orange-700 border-orange-200";
    case "Early Departure":
      return "bg-sky-50 text-sky-700 border-sky-200";
    case "Shift Completed":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
};

const getStatusDot = (status) => {
  switch (status) {
    case "Present":
      return "bg-green-500";
    case "Late":
      return "bg-amber-500";
    case "Absent":
      return "bg-red-500";
    case "On Leave":
      return "bg-purple-500";
    case "Half Day":
      return "bg-orange-500";
    case "Early Departure":
      return "bg-sky-500";
    case "Shift Completed":
      return "bg-emerald-500";
    default:
      return "bg-gray-500";
  }
};

// ============================================================
// COMPONENT
// ============================================================
const EmployeeAttendance = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { employeeName } = location.state || {};

  // ============================================================
  // STATE
  // ============================================================
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthOpen, setMonthOpen] = useState(false);
  const [yearOpen, setYearOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem("employeeAttendanceViewMode") || "grid";
  });
  const itemsPerPage = 9;

  const monthRef = useRef(null);
  const yearRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("employeeAttendanceViewMode", viewMode);
  }, [viewMode]);

  // ============================================================
  // API — Attendance
  // ============================================================
  const {
    data: attendanceResponse,
    isLoading: attendanceLoading,
    isFetching: attendanceFetching,
    isError,
    refetch,
  } = useGetAttendancesQuery({
    employeeId: id || undefined,
    skipHospitalFilter: false,
  });

  const attendanceData = attendanceResponse?.data ?? [];

  // ============================================================
  // EMPLOYEE TYPE DETECTION
  // ============================================================
  const { employeeType } = useMemo(() => {
    if (!Array.isArray(attendanceData) || !attendanceData.length) {
      return { employeeType: null };
    }

    const rec = attendanceData.find((att) => {
      const userId =
        att.userId?._id || att.userId || att.employeeId || att.roleId;
      return String(userId) === String(id);
    });

    if (!rec) return { employeeType: null };

    let type = rec.employeeType || rec.userId?.employeeType || null;

    if (!type) {
      const roleStr = extractRole(rec.userId, null);
      if (roleStr) {
        const lower = String(roleStr).toLowerCase();
        if (lower.includes("doctor") || lower.includes("dr")) type = "doctor";
        else if (
          lower.includes("nurse") ||
          lower.includes("staff") ||
          lower.includes("admin")
        )
          type = "staff";
      }
    }

    return {
      employeeType: type ? String(type).toLowerCase() : null,
    };
  }, [attendanceData, id]);

  // ============================================================
  // DOCTOR API
  // ============================================================
  const shouldFetchDoctor =
    !!id && (employeeType === "doctor" || employeeType === null);

  const { data: doctorResponse, isLoading: doctorLoading } =
    useGetDoctorByIdQuery(id, {
      skip: !shouldFetchDoctor,
    });

  // ============================================================
  // STAFF API
  // ============================================================
  const shouldFetchStaff =
    !!id && (employeeType === "staff" || employeeType === null);

  const { data: staffResponse, isLoading: staffLoading } =
    useGetStaffByIdQuery(id, {
      skip: !shouldFetchStaff,
    });

  // ============================================================
  // UNIFIED EMPLOYEE DETAILS
  // ============================================================
  const employeeDetails = useMemo(() => {
    const doctor = doctorResponse?.doctor || doctorResponse?.data || null;
    const staff = staffResponse?.data || null;

    if (doctor && !Array.isArray(doctor)) {
      return {
        type: "Doctor",
        name: extractName(doctor) || employeeName || "Doctor",
        role: extractRole(doctor, "Doctor"),
        phone: extractPhone(doctor),
        email: extractEmail(doctor),
        image: extractImage(doctor),
        raw: doctor,
      };
    }

    if (staff && !Array.isArray(staff)) {
      return {
        type: "Staff",
        name: extractName(staff) || employeeName || "Staff",
        role: extractRole(staff, "Staff"),
        phone: extractPhone(staff),
        email: extractEmail(staff),
        image: extractImage(staff),
        raw: staff,
      };
    }

    if (Array.isArray(attendanceData) && attendanceData.length) {
      const rec = attendanceData.find((att) => {
        const userId =
          att.userId?._id || att.userId || att.employeeId || att.roleId;
        return String(userId) === String(id);
      });

      if (rec) {
        const merged =
          rec.userId && typeof rec.userId === "object"
            ? { ...rec, ...rec.userId }
            : rec;

        return {
          type: merged.employeeType || "Employee",
          name: extractName(merged) || employeeName || "Employee",
          role: extractRole(merged, "Employee"),
          phone: extractPhone(merged),
          email: extractEmail(merged),
          image: extractImage(merged),
          raw: merged,
        };
      }
    }

    return null;
  }, [doctorResponse, staffResponse, attendanceData, id, employeeName]);

  // ============================================================
  // EMPLOYEE FILTER
  // ============================================================
  const employeeAttendances = useMemo(() => {
    if (!Array.isArray(attendanceData)) return [];
    return attendanceData.filter((att) => {
      const userId =
        att.userId?._id || att.userId || att.employeeId || att.roleId;
      return String(userId) === String(id);
    });
  }, [attendanceData, id]);

  // ============================================================
  // FILTER BY MONTH + YEAR
  // ============================================================
  const filteredAttendances = useMemo(() => {
    return employeeAttendances.filter((att) => {
      const src = att.date || att.createdAt || att.timestamp;
      if (!src) return false;
      const d = new Date(src);
      if (isNaN(d.getTime())) return false;
      return (
        d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear
      );
    });
  }, [employeeAttendances, selectedMonth, selectedYear]);

  // ============================================================
  // NORMALIZE ROW
  // ============================================================
  const normalizeRow = useCallback((row, index) => {
    const formatShortTime = (value) => {
      if (!value) return "--:--";
      if (typeof value === "string" && value.includes(":")) {
        const parts = value.split(":");
        if (
          parts.length >= 2 &&
          !value.includes("AM") &&
          !value.includes("PM")
        ) {
          return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
        }
      }
      try {
        const d = new Date(value);
        if (isNaN(d.getTime())) return "--:--";
        const h = String(d.getHours()).padStart(2, "0");
        const m = String(d.getMinutes()).padStart(2, "0");
        return `${h}:${m}`;
      } catch {
        return "--:--";
      }
    };

    const checkInShort = formatShortTime(row.checkInTime || row.firstIn);
    const checkOutShort = formatShortTime(row.checkOutTime || row.lastOut);

    const formatDateLong = (value) => {
      if (!value) return "-";
      try {
        return new Date(value).toLocaleDateString("en-US", {
          month: "long",
          day: "2-digit",
          year: "numeric",
        });
      } catch {
        return "-";
      }
    };

    const dateSource =
      row.date ||
      row.timestamp ||
      row.checkInTime ||
      row.checkOutTime ||
      row.createdAt;
    const dateLong = formatDateLong(dateSource);
    const dateKey = toLocalDateKey(dateSource);

    // ✅ Use the same canonical status mapping as Attendance.jsx
    const status = normalizeStatus(row.status);

    return {
      id: row.id || row._id || index,
      dateLong,
      dateKey,
      checkInShort,
      checkOutShort,
      status,
      raw: row,
    };
  }, []);

  const normalizedData = useMemo(
    () => filteredAttendances.map((row, i) => normalizeRow(row, i)),
    [filteredAttendances, normalizeRow]
  );

  // ============================================================
  // FILTERS
  // ============================================================
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, dateFilter]);

  const filteredData = useMemo(() => {
    return normalizedData.filter((row) => {
      const matchesStatus =
        statusFilter === "all" || row.status === statusFilter;
      const matchesDate = !dateFilter || row.dateKey === dateFilter;
      return matchesStatus && matchesDate;
    });
  }, [normalizedData, statusFilter, dateFilter]);

  const totalItems = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  // ============================================================
  // HANDLERS
  // ============================================================
  const handlePageChange = useCallback(
    (page) => {
      if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [totalPages]
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setStatusFilter("all");
    setDateFilter("");
    setCurrentPage(1);
    try {
      await refetch();
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  }, [refetch]);

  const clearAllFilters = useCallback(() => {
    setStatusFilter("all");
    setDateFilter("");
    setCurrentPage(1);
  }, []);

  const getActiveFilterCount = useCallback(() => {
    return [statusFilter !== "all", !!dateFilter].filter(Boolean).length;
  }, [statusFilter, dateFilter]);

  // ============================================================
  // EXPORT DATA
  // ============================================================
  const getExportData = useCallback(() => {
    const rowsToExport = filteredData;

    return rowsToExport.map((row) => {
      const raw = row.raw || {};
      return {
        "Employee Name": employeeDetails?.name || employeeName || "N/A",
        "Employee Type": employeeDetails?.type || "Employee",
        Role: employeeDetails?.role || "N/A",
        Phone: employeeDetails?.phone || "N/A",
        Email: employeeDetails?.email || "N/A",
        Date: formatFullDate(
          raw.date ||
            raw.timestamp ||
            raw.checkInTime ||
            raw.checkOutTime ||
            raw.createdAt
        ),
        "Check In Time": formatFullTime(raw.checkInTime || raw.firstIn),
        "Check Out Time": formatFullTime(raw.checkOutTime || raw.lastOut),
        "Working Hours": raw.duration || raw.totalHours || "N/A",
        Shift: raw.shift || "Shift 1",
        Status: row.status,
      };
    });
  }, [filteredData, employeeDetails, employeeName]);

  // ============================================================
  // DROPDOWN OUTSIDE CLICK
  // ============================================================
  useEffect(() => {
    const handler = (e) => {
      if (monthRef.current && !monthRef.current.contains(e.target))
        setMonthOpen(false);
      if (yearRef.current && !yearRef.current.contains(e.target))
        setYearOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ============================================================
  // LOADING
  // ============================================================
  const showLoading =
    attendanceLoading ||
    (attendanceFetching && !attendanceResponse) ||
    doctorLoading ||
    staffLoading;

  if (showLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-6 font-sans text-gray-800">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
            <div className="h-5 w-40 bg-gray-200 rounded mb-6"></div>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gray-200"></div>
              <div className="flex-1 space-y-3">
                <div className="h-5 w-48 bg-gray-200 rounded"></div>
                <div className="h-3 w-64 bg-gray-100 rounded"></div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-center py-20">
              <Loader2
                size={36}
                className="animate-spin text-emerald-500 opacity-70"
              />
              <span className="ml-3 text-sm text-gray-500">
                Loading employee attendance...
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================
  const displayName = employeeDetails?.name || employeeName || "Employee";
  const employeeRole = employeeDetails?.role || "Employee";
  const employeePhone = employeeDetails?.phone || null;
  const employeeEmail = employeeDetails?.email || null;
  const employeeImage = employeeDetails?.image || null;
  const employeeTypeLabel = employeeDetails?.type || "Employee";
  const activeFilterCount = getActiveFilterCount();

  const exportFileName = `employee_attendance_${(displayName || "employee")
    .replace(/\s+/g, "_")
    .toLowerCase()}_${MONTHS[selectedMonth - 1]}_${selectedYear}`;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-6 font-sans text-gray-800">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* HEADER: Back + Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
            aria-label="Go back"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </button>
          <div className="text-xs text-gray-500">
            <span className="text-gray-700">Attendance</span>
            <span className="mx-1 text-gray-400">»</span>
            <span>Home</span>
            <span className="mx-1 text-gray-400">»</span>
            <span className="text-gray-700">{displayName}</span>
          </div>
        </div>

        {/* DETAIL EMPLOYEE CARD */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 md:p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 bg-emerald-500 rounded-full"></div>
            <h1 className="text-lg md:text-xl font-semibold text-gray-900">
              Detail Employee
            </h1>
            {employeeDetails?.type && (
              <span className="text-[10px] font-semibold px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                {employeeTypeLabel}
              </span>
            )}
          </div>

          <div className="flex flex-col md:flex-row md:items-start gap-5">
            <div className="flex-shrink-0">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-gray-100 bg-gray-100">
                {employeeImage ? (
                  <img
                    src={employeeImage}
                    alt={displayName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      e.currentTarget.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center text-3xl font-semibold text-gray-400 bg-gray-100">${displayName
                        ?.charAt(0)
                        ?.toUpperCase() || "E"}</div>`;
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-semibold text-gray-400">
                    {displayName?.charAt(0)?.toUpperCase() || "E"}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">
                {displayName}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-gray-500 mb-1">
                    Role
                  </p>
                  <p className="text-sm text-gray-800 capitalize">
                    {employeeRole}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-wider text-gray-500 mb-1">
                    Phone Number
                  </p>
                  <p className="text-sm text-gray-800">
                    {employeePhone || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-wider text-gray-500 mb-1">
                    Email Address
                  </p>
                  <p className="text-sm text-gray-800 truncate">
                    {employeeEmail || "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ATTENDANCE HISTORY */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 md:p-6">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-emerald-500 rounded-full"></div>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                Attendance History
              </h2>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* View toggle */}
              <div className="flex border border-gray-200 rounded-md bg-white">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-l-md transition-colors ${
                    viewMode === "grid"
                      ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white"
                      : "text-gray-400 hover:bg-gray-50"
                  }`}
                  aria-label="Grid view"
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-r-md transition-colors ${
                    viewMode === "list"
                      ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white"
                      : "text-gray-400 hover:bg-gray-50"
                  }`}
                  aria-label="List view"
                >
                  <List size={16} />
                </button>
              </div>

              {/* Refresh */}
              <button
                onClick={handleRefresh}
                className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50 transition-colors"
                disabled={isRefreshing || attendanceFetching}
                title="Refresh"
              >
                <RefreshCcw
                  size={16}
                  className={
                    isRefreshing || attendanceFetching ? "animate-spin" : ""
                  }
                />
              </button>

              {/* Excel Export */}
              <ExcelExportButton
                data={getExportData()}
                fileName={exportFileName}
                sheetName="Attendance"
                className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50 transition-colors"
              />

              {/* Filter button */}
              <button
                onClick={() => setShowFilters((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-2 border rounded-md text-sm transition-colors ${
                  showFilters
                    ? "border-emerald-500 text-emerald-700 bg-emerald-50"
                    : "border-gray-200 text-gray-500 bg-white hover:bg-gray-50"
                }`}
                title="Toggle Filters"
              >
                <Filter size={16} />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="ml-1 bg-emerald-500 text-white text-[10px] font-semibold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Month picker */}
              <div className="relative" ref={monthRef}>
                <button
                  onClick={() => {
                    setMonthOpen(!monthOpen);
                    setYearOpen(false);
                  }}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 text-xs text-gray-600 hover:bg-gray-100 flex items-center gap-1.5"
                >
                  <Calendar size={12} />
                  {MONTHS[selectedMonth - 1].slice(0, 3)} {selectedYear}
                </button>
                {monthOpen && (
                  <div className="absolute top-full right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                    {MONTHS.map((m, i) => (
                      <div
                        key={m}
                        onClick={() => {
                          setSelectedMonth(i + 1);
                          setMonthOpen(false);
                        }}
                        className={`px-3 py-2 text-xs cursor-pointer hover:bg-gray-50 ${
                          selectedMonth === i + 1
                            ? "bg-emerald-50 text-emerald-700 font-medium"
                            : "text-gray-700"
                        }`}
                      >
                        {m}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Year picker */}
              <div className="relative" ref={yearRef}>
                <button
                  onClick={() => {
                    setYearOpen(!yearOpen);
                    setMonthOpen(false);
                  }}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 text-xs text-gray-600 hover:bg-gray-100"
                >
                  {selectedYear}
                </button>
                {yearOpen && (
                  <div className="absolute top-full right-0 mt-1 w-24 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                    {Array.from({ length: 11 }, (_, i) => 2020 + i).map((y) => (
                      <div
                        key={y}
                        onClick={() => {
                          setSelectedYear(y);
                          setYearOpen(false);
                        }}
                        className={`px-3 py-2 text-xs cursor-pointer hover:bg-gray-50 ${
                          selectedYear === y
                            ? "bg-emerald-50 text-emerald-700 font-medium"
                            : "text-gray-700"
                        }`}
                      >
                        {y}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* FILTER PANEL */}
          {showFilters && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-emerald-600" />
                  <h3 className="text-sm font-semibold text-gray-800">
                    Filters
                  </h3>
                  {activeFilterCount > 0 && (
                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                      {activeFilterCount} active
                    </span>
                  )}
                </div>
                <button
                  onClick={clearAllFilters}
                  className="text-xs font-medium text-rose-500 hover:text-rose-600"
                >
                  Clear all
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-1.5">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    {/* ✅ Same option labels as Attendance.jsx */}
                    <option value="all">All Status</option>
                    <option value="Present">Present</option>
                    <option value="Late">Late</option>
                    <option value="Early Departure">Early Departure</option>
                    <option value="Shift Completed">Shift Completed</option>
                    <option value="Half Day">Half Day</option>
                    <option value="Absent">Absent</option>
                    <option value="On Leave">On Leave</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-1.5">
                    Specific Date
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={dateFilter}
                      onChange={(e) => {
                        setDateFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                    />
                    {dateFilter && (
                      <button
                        onClick={() => {
                          setDateFilter("");
                          setCurrentPage(1);
                        }}
                        className="px-3 py-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-100 text-xs"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Grid OR list */}
          {isError ? (
            <div className="text-center py-12">
              <XCircle
                size={40}
                className="mx-auto mb-3 text-rose-400 opacity-70"
              />
              <p className="text-sm text-rose-500">
                Failed to load attendance records
              </p>
            </div>
          ) : paginatedData.length > 0 ? (
            <>
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {paginatedData.map((row) => (
                    <div
                      key={row.id}
                      className="bg-gray-50 border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:bg-white transition-colors"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Calendar size={12} />
                          <span className="text-gray-800 font-medium">
                            {row.dateLong}
                          </span>
                        </div>

                        {/* ✅ Status badge — same as Attendance.jsx */}
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold border ${getStatusBadge(
                            row.status
                          )}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full mr-1.5 ${getStatusDot(
                              row.status
                            )}`}
                          ></span>
                          {row.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">
                            Check In Time
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {row.checkInShort}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">
                            Check Out Time
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {row.checkOutShort}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-gray-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
                      <tr>
                        <th className="px-4 py-3 font-medium">Date</th>
                        <th className="px-4 py-3 font-medium">Check In</th>
                        <th className="px-4 py-3 font-medium">Check Out</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.map((row) => (
                        <tr
                          key={row.id}
                          className="border-t border-gray-100 hover:bg-gray-50"
                        >
                          <td className="px-4 py-3 text-gray-800">
                            {row.dateLong}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {row.checkInShort}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {row.checkOutShort}
                          </td>
                          <td className="px-4 py-3">
                            {/* ✅ Status badge — same as Attendance.jsx */}
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold border ${getStatusBadge(
                                row.status
                              )}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full mr-1.5 ${getStatusDot(
                                  row.status
                                )}`}
                              ></span>
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {totalPages > 1 && (
                <div className="mt-6 flex justify-center">
                  <LightPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Calendar
                size={40}
                className="mx-auto mb-3 text-gray-300 opacity-80"
              />
              <p className="text-sm text-gray-500">
                No attendance records found
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Try a different month or clear your filters
              </p>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="mt-4 text-sm text-emerald-600 hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// PAGINATION
// ============================================================
const LightPagination = ({ currentPage, totalPages, onPageChange }) => {
  const pages = [];
  const maxVisible = 5;
  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else if (currentPage <= 3) {
    for (let i = 1; i <= 4; i++) pages.push(i);
    pages.push("...");
    pages.push(totalPages);
  } else if (currentPage >= totalPages - 2) {
    pages.push(1);
    pages.push("...");
    for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    pages.push("...");
    for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
    pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center gap-1.5">
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={i} className="px-2 text-xs text-gray-400">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`min-w-[28px] h-7 rounded-md text-xs font-medium transition-colors ${
              currentPage === p
                ? "bg-white text-gray-900 border border-gray-300 shadow-sm"
                : "text-gray-500 hover:text-gray-900 hover:bg-white border border-transparent"
            }`}
          >
            {p}
          </button>
        )
      )}
    </div>
  );
};

export default EmployeeAttendance;