// src/components/attendance/AttendanceSheet.jsx
import React, { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import {
  Search,
  RefreshCw,
  Download,
  X,
  Calendar,
  Filter,
  Users as UsersIcon,
  ChevronDown,
  CheckCircle,
  XCircle,
  CalendarCheck,
} from "lucide-react";

import { Pagination, SearchBar, useDebounce } from '../ui';
import { useGetAttendancesQuery } from '../../../app/service/attendance';
import { useGetHolidaysQuery } from "../../../app/service/holidayApi";
import { showSuccessToast, showWarningToast } from '../ui/Toast';

// ✅ Real-time attendance events
import {
  registerAttendanceEvents,
  unregisterAttendanceEvents,
} from '../../socket/attendanceEvents';

// ============================================================
// 🎯 ATTENDANCE ICON CONFIG  (Apollo style — 3 statuses)
// ============================================================
const attendanceIcons = {
  present: {
    icon: CheckCircle,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    label: "Present",
  },
  absent: {
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-50",
    label: "Absent",
  },
  holiday: {
    icon: CalendarCheck,
    color: "text-amber-500",
    bg: "bg-amber-50",
    label: "Holiday",
  },
};

// ============================================================
// 🎯 ATTENDANCE STATUS ICON COMPONENT
// ============================================================
const AttendanceStatusIcon = ({ status, size = "md" }) => {
  const item = attendanceIcons[String(status || "").toLowerCase()];

  if (!item) return null;

  const Icon = item.icon;

  const sizeMap = {
    sm: { wrap: "w-7 h-7", icon: 16 },
    md: { wrap: "w-9 h-9", icon: 20 },
    lg: { wrap: "w-10 h-10", icon: 22 },
  };
  const dims = sizeMap[size] || sizeMap.md;

  return (
    <div
      title={item.label}
      className={`${dims.wrap} rounded-full flex items-center justify-center ${item.bg} transition-all duration-200`}
    >
      <Icon size={dims.icon} strokeWidth={2} className={item.color} />
    </div>
  );
};

// ============================================================
// 🎯 LEGEND ITEMS  (3 statuses)
// ============================================================
const LEGEND_ITEMS = [
  { status: "Present", label: "Present" },
  { status: "Absent", label: "Absent" },
  { status: "Holiday", label: "Holiday" },
];

// ============================================================
// 🎯 STATUS NORMALIZER  (everything → Present | Absent | Holiday)
// ============================================================
const normalizeStatus = (rawStatus) => {
  if (!rawStatus) return null;
  const s = String(rawStatus).toLowerCase().trim();

  switch (s) {
    case "present":
    case "check-in":
    case "check-out":
    case "checked-in":
    case "checked-out":
    case "wfh":
    case "work from home":
    case "od":
    case "on duty":
    case "leave":
    case "on leave":
    case "approved leave":
    case "half-day":
    case "half day":
      return "Present";

    case "absent":
    case "abs":
    case "no show":
    case "no-show":
    case "weekend":
    case "week off":
    case "week-off":
      return "Absent";

    case "holiday":
    case "public holiday":
      return "Holiday";

    default:
      if (typeof console !== "undefined") {
        console.warn(`[AttendanceSheet] Unmapped attendance status: "${rawStatus}"`);
      }
      return null;
  }
};

// ============================================================
// 🎯 STATUS PRIORITY  (higher wins when merging same-day records)
// ============================================================
const STATUS_PRIORITY = {
  Present: 1,
  Absent: 2,
  Holiday: 3,
};

// ============================================================
// 🎯 EMPLOYEE TYPE RESOLVER
// ============================================================
const getEmployeeType = (att) => {
  if (att?.employeeType) return att.employeeType;
  if (att?.doctorId) return "Doctor";
  if (att?.staffId) return "Staff";
  return "Staff";
};

// Stable composite key: "Doctor:12" / "Staff:12"
const getEmployeeKey = (att) => {
  const id = att?.employeeId || att?.roleId;
  if (!id) return null;
  return `${getEmployeeType(att)}:${id}`;
};

// ============================================================
// COMPONENT
// ============================================================
const AttendanceSheet = ({ holidayDates = [] }) => {
  const navigate = useNavigate();
  const now = new Date();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState(now.getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((now.getMonth() + 1).toString());
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const itemsPerPage = 10;

  // ✅ Debounce search (500ms) — avoids re-filtering per keystroke
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const yearRef = useRef(null);
  const monthRef = useRef(null);
  const tableContainerRef = useRef(null);

  // ============================================================
  // API CALLS
  // ============================================================
  const {
    data: attendanceResponse,
    isLoading,
    isFetching,
    refetch,
  } = useGetAttendancesQuery({
    page: 1,
    limit: 1000,
  });

  const {
    data: holidayResponse,
    isLoading: isHolidayLoading,
  } = useGetHolidaysQuery({
    page: 1,
    limit: 1000,
  });

  /* ============================================================
     ✅ REAL-TIME ATTENDANCE EVENTS
     ============================================================ */
  useEffect(() => {
    registerAttendanceEvents({
      onRegistered: () => refetch(),
      onUpdated: () => refetch(),
      onDeleted: () => refetch(),
    });

    return () => unregisterAttendanceEvents();
  }, [refetch]);

  const attendanceData = useMemo(() => {
    if (!attendanceResponse) return [];
    if (Array.isArray(attendanceResponse)) return attendanceResponse;
    if (Array.isArray(attendanceResponse.data)) return attendanceResponse.data;
    return [];
  }, [attendanceResponse]);

  const holidays = useMemo(() => {
    if (Array.isArray(holidayResponse?.data)) {
      return holidayResponse.data;
    }
    if (holidayResponse?.data) {
      return [holidayResponse.data];
    }
    return [];
  }, [holidayResponse]);

  useEffect(() => {
    if (!isFetching) {
      const timer = setTimeout(() => setIsRefreshing(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isFetching]);

  // ============================================================
  // HOLIDAY SET — API + PARENT PROP
  // ============================================================
  const holidaySet = useMemo(() => {
    const set = new Set();

    const year = Number(selectedYear);
    const month = Number(selectedMonth);

    const allHolidays = [
      ...holidays,
      ...(holidayDates || []).map((date) => ({
        startDate: date,
        endDate: date,
        repeatsAnnually: false,
      })),
    ];

    const parseDate = (value) => {
      if (!value) return null;
      const dateString = String(value).split("T")[0];
      const [y, m, d] = dateString.split("-").map(Number);
      if (!y || !m || !d) return null;
      return { year: y, month: m, day: d };
    };

    const daysInMonth = new Date(year, month, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const currentKey = `${year}-${String(month).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;

      const isHoliday = allHolidays.some((holiday) => {
        if (holiday.isActive === false) return false;

        const start = parseDate(holiday.startDate);
        const end = parseDate(holiday.endDate);
        if (!start || !end) return false;

        if (holiday.repeatsAnnually) {
          const currentMonthDay = month * 100 + day;
          const startMonthDay = start.month * 100 + start.day;
          const endMonthDay = end.month * 100 + end.day;

          if (startMonthDay <= endMonthDay) {
            return (
              currentMonthDay >= startMonthDay &&
              currentMonthDay <= endMonthDay
            );
          }
          return (
            currentMonthDay >= startMonthDay ||
            currentMonthDay <= endMonthDay
          );
        }

        const current = new Date(year, month - 1, day).getTime();
        const startTime = new Date(start.year, start.month - 1, start.day).getTime();
        const endTime = new Date(end.year, end.month - 1, end.day).getTime();

        return current >= startTime && current <= endTime;
      });

      if (isHoliday) {
        set.add(currentKey);
      }
    }

    return set;
  }, [holidays, holidayDates, selectedYear, selectedMonth]);

  // ============================================================
  // EMPLOYEES  (type-aware key)
  // ============================================================
  const employees = useMemo(() => {
    const map = new Map();
    if (!Array.isArray(attendanceData)) return [];

    attendanceData.forEach((att) => {
      const key = getEmployeeKey(att);
      if (!key) return;

      const employeeId = att.employeeId || att.roleId;
      const employeeType = getEmployeeType(att);

      if (!map.has(key)) {
        map.set(key, {
          id: key,
          employeeId,
          employeeType,
          name: att.name || att.employeeName || "Unknown",
        });
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      String(a.name).localeCompare(String(b.name))
    );
  }, [attendanceData]);

  // ============================================================
  // GROUP BY USER + DAY  (priority-based merge)
  // ============================================================
  const attendanceByUserAndDate = useMemo(() => {
    const map = new Map();
    if (!Array.isArray(attendanceData)) return map;

    attendanceData.forEach((att) => {
      const userKey = getEmployeeKey(att);
      if (!userKey) return;

      const dateSrc = att.date || att.createdAt || att.timestamp;
      if (!dateSrc) return;

      const d = new Date(dateSrc);
      if (isNaN(d.getTime())) return;

      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const day = d.getDate();

      if (year === parseInt(selectedYear) && month === parseInt(selectedMonth)) {
        const key = `${userKey}_${day}`;
        const normalized =
          normalizeStatus(att.status) || normalizeStatus(att.type);

        if (!normalized) return;

        const existing = map.get(key);
        const newPriority = STATUS_PRIORITY[normalized] ?? 0;
        const existingPriority = existing
          ? STATUS_PRIORITY[existing.status] ?? 0
          : -1;

        const shouldSet =
          !existing ||
          newPriority > existingPriority ||
          (newPriority === existingPriority && att.type === "check-in");

        if (shouldSet) {
          map.set(key, {
            status: normalized,
            rawStatus: att.status,
            shift: att.shift,
            firstIn: att.checkInTime,
            lastOut: att.checkOutTime,
            totalHours: att.duration,
          });
        }
      }
    });

    return map;
  }, [attendanceData, selectedYear, selectedMonth]);

  // ============================================================
  // STATUS RESOLVER  (3-status fallback chain)
  // ============================================================
  const getAttendanceStatus = (employee, day) => {
    if (!employee) return null;

    const key = `${employee.id}_${day}`;
    const found = attendanceByUserAndDate.get(key);
    if (found?.status) return found.status;

    const year = parseInt(selectedYear);
    const month = parseInt(selectedMonth);

    const isoKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
      2,
      "0"
    )}`;
    if (holidaySet.has(isoKey)) return "Holiday";

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cellDate = new Date(year, month - 1, day);
    if (cellDate < today) {
      return "Absent";
    }

    return null;
  };

  // ============================================================
  // CALENDAR HELPERS
  // ============================================================
  const getDaysInMonth = (year, month) => new Date(year, month, 0).getDate();
  const getFirstDayOfMonth = (year, month) =>
    new Date(year, month - 1, 1).getDay();

  const daysInMonth = getDaysInMonth(parseInt(selectedYear), parseInt(selectedMonth));
  const firstDay = getFirstDayOfMonth(parseInt(selectedYear), parseInt(selectedMonth));
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  const yearOptions = [];
  const currentYear = new Date().getFullYear();
  for (let i = currentYear - 2; i <= currentYear + 2; i++) {
    yearOptions.push({ value: i.toString(), label: i.toString() });
  }

  const monthOptions = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const getSelectedYearLabel = () =>
    yearOptions.find((o) => o.value === selectedYear)?.label || "Select Year";

  const getSelectedMonthLabel = () =>
    monthOptions.find((o) => o.value === selectedMonth)?.label || "Select Month";

  // ============================================================
  // FILTER + PAGINATION
  // ============================================================
  // ✅ Filter uses the debounced term
  const filteredEmployees = useMemo(() => {
    if (!Array.isArray(employees)) return [];

    const search = debouncedSearchTerm.trim().toLowerCase();
    if (!search) return employees;

    return employees.filter((emp) =>
      String(emp.name).toLowerCase().includes(search)
    );
  }, [employees, debouncedSearchTerm]);

  // ✅ Reset page when debounced search term actually changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  const totalItems = filteredEmployees.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentEmployees = filteredEmployees.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // ============================================================
  // DROPDOWN OUTSIDE CLICK
  // ============================================================
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (yearRef.current && !yearRef.current.contains(event.target)) {
        setShowYearDropdown(false);
      }
      if (monthRef.current && !monthRef.current.contains(event.target)) {
        setShowMonthDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ============================================================
  // REFRESH + EXPORT
  // ============================================================
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setSearchTerm("");
    setCurrentPage(1);   // keep — instant pagination reset alongside refresh
    try {
      await refetch();
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  const exportToExcel = () => {
    if (!filteredEmployees.length) return;

    const exportData = filteredEmployees.map((emp) => {
      const row = {
        "Employee Name": emp.name,
        Type: emp.employeeType,
      };
      for (let day = 1; day <= daysInMonth; day++) {
        const status = getAttendanceStatus(emp, day);
        row[`Day ${day}`] = status || "";
      }
      return row;
    });

    const headers = Object.keys(exportData[0]);
    const csvData = [
      headers.join(","),
      ...exportData.map((row) =>
        headers.map((header) => `"${row[header] || ""}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvData], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_sheet_${getSelectedMonthLabel()}_${selectedYear}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // ============================================================
  // LOADING STATE
  // ============================================================
  if (isLoading || isHolidayLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-6 font-sans">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-7 w-32 bg-gray-200 rounded animate-pulse mt-2"></div>
        </div>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="flex-1 max-w-md">
            <div className="h-10 w-full bg-gray-200 rounded-md animate-pulse"></div>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-10 h-10 bg-gray-200 rounded-md animate-pulse"
              ></div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
            <div className="h-5 w-40 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100">
                <tr>
                  {[...Array(6)].map((_, i) => (
                    <th key={i} className="px-6 py-3">
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
              <div className="flex gap-2">
                <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 font-sans">
      {/* Breadcrumb */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <button
            onClick={() => navigate(-1)}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
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
            <span>Attendance Sheet</span>
          </div>
        </div>
        <h1 className="text-xl font-bold text-gray-800">Attendance Sheet</h1>
        <p className="text-sm text-gray-500 mt-1">
          View and manage employee attendance
        </p>
      </div>

      {/* ─────────────── SEARCH + ACTION BUTTONS ROW ─────────────── */}
      <div className="flex flex-row justify-between items-center gap-3 mb-6 w-full">
        {/* Search */}
        <div className="w-full max-w-[320px] xl:max-w-[400px]">
          <SearchBar
            placeholder="Search employee..."
            value={searchTerm}
            onChange={setSearchTerm}
            onClear={() => setSearchTerm("")}
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isFetching}
            className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            title="Refresh"
          >
            <RefreshCw
              size={16}
              className={isRefreshing || isFetching ? "animate-spin" : ""}
            />
          </button>

          <button
            onClick={exportToExcel}
            className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50 shrink-0"
            title="Export to Excel"
          >
            <Download size={16} />
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50 shrink-0"
            title="Toggle Filters"
          >
            <Filter size={16} />
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Year */}
            <div className="relative" ref={yearRef}>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Year
              </label>
              <button
                onClick={() => setShowYearDropdown(!showYearDropdown)}
                className="w-full h-12 px-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent text-gray-700 text-sm bg-white flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <Calendar size={16} className="text-gray-500" />
                  {getSelectedYearLabel()}
                </span>
                <ChevronDown
                  size={14}
                  className={`transition-transform ${
                    showYearDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>
              {showYearDropdown && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  {yearOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSelectedYear(option.value);
                        setShowYearDropdown(false);
                        setCurrentPage(1);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                        selectedYear === option.value
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-700"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Month */}
            <div className="relative" ref={monthRef}>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Month
              </label>
              <button
                onClick={() => setShowMonthDropdown(!showMonthDropdown)}
                className="w-full h-12 px-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent text-gray-700 text-sm bg-white flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <Calendar size={16} className="text-gray-500" />
                  {getSelectedMonthLabel()}
                </span>
                <ChevronDown
                  size={14}
                  className={`transition-transform ${
                    showMonthDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>
              {showMonthDropdown && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                  {monthOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSelectedMonth(option.value);
                        setShowMonthDropdown(false);
                        setCurrentPage(1);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                        selectedMonth === option.value
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-700"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-end gap-6 mb-6">
        {LEGEND_ITEMS.map((item) => (
          <div key={item.status} className="flex items-center gap-2">
            <AttendanceStatusIcon status={item.status} size="sm" />
            <span className="text-sm font-semibold text-gray-600">
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Table */}
      {filteredEmployees.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? "No employees found" : "No attendance data available"}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm
              ? `No results found for "${searchTerm}". Try adjusting your search.`
              : "No attendance records for the selected period."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">
              Total Employees
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded ml-2">
                {filteredEmployees.length}
              </span>
              {searchTerm && (
                <span className="text-xs text-gray-400 ml-2">(Filtered)</span>
              )}
            </h2>
          </div>

          <div className="flex flex-col min-h-[500px]">
            <div
              ref={tableContainerRef}
              className="overflow-x-auto flex-1 scrollbar-hide"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                WebkitOverflowScrolling: "touch",
              }}
            >
              <style>{`
                .scrollbar-hide::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              <table className="w-full text-sm border-collapse">
                <thead className="bg-gray-100 sticky top-0">
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left bg-gray-100 min-w-[180px] lg:sticky lg:left-0 lg:z-20 font-semibold text-gray-700 text-xs uppercase">
                      Employee Name
                    </th>
                    {calendarDays.map(
                      (day, index) =>
                        day && (
                          <th
                            key={index}
                            className="px-2 py-3 text-center min-w-[52px] border-l border-gray-200"
                          >
                            <div className="text-sm font-medium text-gray-700">
                              {day}
                            </div>
                            <div className="text-[10px] text-gray-400 mt-0.5">
                              {weekdays[index % 7]}
                            </div>
                          </th>
                        )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {currentEmployees.map((employee, idx) => (
                    <tr
                      key={employee.id}
                      className={`border-b border-gray-100 ${
                        idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      <td
                        className="px-4 py-3 font-medium bg-white border-r border-gray-100 lg:sticky lg:left-0 lg:z-20"
                        style={{
                          minWidth: "180px",
                          maxWidth: "220px",
                          wordBreak: "break-word",
                          whiteSpace: "normal",
                          overflowWrap: "break-word",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/attendance/employee/${employee.employeeId}`,
                              {
                                state: {
                                  employeeName: employee.name,
                                  employeeType: employee.employeeType,
                                },
                              }
                            )
                          }
                          className="break-words whitespace-normal text-left text-gray-800 hover:text-[#1C62A0] hover:underline transition-colors cursor-pointer w-full"
                          title={`View attendance for ${employee.name}`}
                        >
                          {employee.name}
                        </button>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          {employee.employeeType}
                        </div>
                      </td>
                      {calendarDays.map((day, index) => {
                        if (!day) return null;
                        const status = getAttendanceStatus(employee, day);

                        return (
                          <td
                            key={index}
                            className="px-2 py-3 text-center border-l border-gray-100"
                          >
                            <div className="inline-flex items-center justify-center">
                              {status && (
                                <AttendanceStatusIcon status={status} />
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ✅ Pagination — always visible, sticks to bottom */}
            <div className="mt-auto px-6 py-4 bg-gray-50 border-t border-gray-200">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                itemLabel="employees"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceSheet;