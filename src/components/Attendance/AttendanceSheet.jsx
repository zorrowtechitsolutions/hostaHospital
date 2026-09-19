// src/components/attendance/AttendanceSheet.jsx
import React, { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import {
  Search,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Calendar,
  Loader2,
  Filter,
  Users as UsersIcon,
  CircleMinus,
  CircleCheck,
  CircleX,
  Sparkles,
} from "lucide-react";

import { useGetAttendancesQuery } from '../../../app/service/attendance';

// ============================================================
// 🎯 ATTENDANCE STATUS ICON — Premium status-chip style
// ============================================================
const AttendanceStatusIcon = ({ status, size = "md" }) => {
  const sizeMap = {
    sm: "w-5 h-5 p-1",
    md: "w-7 h-7 p-1.5",
    lg: "w-8 h-8 p-2",
  };
  const common = `${sizeMap[size] || sizeMap.md} rounded-full transition-all duration-200`;

  switch (status) {
    case "Weekend":
      return (
        <div className={`${common} bg-gray-100 ring-1 ring-gray-200`}>
          <CircleMinus
            className="w-full h-full text-gray-500"
            strokeWidth={2.2}
          />
        </div>
      );

    case "Present":
      return (
        <div className={`${common} bg-emerald-50 ring-1 ring-emerald-100`}>
          <CircleCheck
            className="w-full h-full text-emerald-600"
            strokeWidth={2.2}
          />
        </div>
      );

    case "Leave":
      return (
        <div className={`${common} bg-orange-50 ring-1 ring-orange-100`}>
          <CircleX
            className="w-full h-full text-orange-500"
            strokeWidth={2.2}
          />
        </div>
      );

    case "Holiday":
      return (
        <div className={`${common} bg-amber-50 ring-1 ring-amber-100`}>
          <Sparkles
            className="w-full h-full text-amber-500"
            strokeWidth={2.2}
          />
        </div>
      );

    default:
      return null;
  }
};

// ============================================================
// 🎯 LEGEND ITEMS
// ============================================================
const LEGEND_ITEMS = [
  { status: "Weekend", label: "Weekend" },
  { status: "Present", label: "Present" },
  { status: "Leave", label: "Leave" },
  { status: "Holiday", label: "Holiday" },
];

// ============================================================
// 🎯 STATUS NORMALIZER
// API is the source of truth — no assumptions about weekends.
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
      return "Present";

    case "leave":
    case "on leave":
    case "approved leave":
      return "Leave";

    case "holiday":
    case "public holiday":
      return "Holiday";

    case "weekend":
    case "week off":
      return "Weekend";

    default:
      return null;
  }
};

// ============================================================
// COMPONENT
// ============================================================
const AttendanceSheet = () => {
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

  const yearRef = useRef(null);
  const monthRef = useRef(null);
  const tableContainerRef = useRef(null);

  // ============================================================
  // API CALL
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

  const attendanceData = useMemo(() => {
    if (!attendanceResponse) return [];
    if (Array.isArray(attendanceResponse)) return attendanceResponse;
    if (Array.isArray(attendanceResponse.data)) return attendanceResponse.data;
    return [];
  }, [attendanceResponse]);

  useEffect(() => {
    if (!isFetching) {
      const timer = setTimeout(() => setIsRefreshing(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isFetching]);

  // ============================================================
  // EMPLOYEES — derived from attendance records
  // ============================================================
  const employees = useMemo(() => {
    const map = new Map();
    if (!Array.isArray(attendanceData)) return [];

    attendanceData.forEach((att) => {
      const id = att.employeeId || att.roleId;
      if (id && !map.has(id)) {
        map.set(id, {
          id,
          name: att.name || att.employeeName || "Unknown",
        });
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      String(a.name).localeCompare(String(b.name))
    );
  }, [attendanceData]);

  // ============================================================
  // GROUP BY USER + DAY (for the selected month)
  // ============================================================
  const attendanceByUserAndDate = useMemo(() => {
    const map = new Map();
    if (!Array.isArray(attendanceData)) return map;

    attendanceData.forEach((att) => {
      const userId = att.employeeId || att.roleId;
      if (!userId) return;

      const dateSrc = att.date || att.createdAt || att.timestamp;
      if (!dateSrc) return;

      const d = new Date(dateSrc);
      if (isNaN(d.getTime())) return;

      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const day = d.getDate();

      if (year === parseInt(selectedYear) && month === parseInt(selectedMonth)) {
        const key = `${userId}_${day}`;
        const normalized =
          normalizeStatus(att.status) || normalizeStatus(att.type);

        // Prefer the check-in record; otherwise accept the first non-null one
        if (!map.has(key) || att.type === "check-in") {
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
  // ✅ API IS THE SOURCE OF TRUTH
  //    No automatic Sunday → Weekend. No assumptions.
  // ============================================================
  const getAttendanceStatus = (employeeId, day) => {
    const found = attendanceByUserAndDate.get(`${employeeId}_${day}`);
    return found?.status || null;
  };

  // ============================================================
  // CALENDAR HELPERS
  // ============================================================
  const getDaysInMonth = (year, month) => new Date(year, month, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month - 1, 1).getDay();

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
  const filteredEmployees = useMemo(() => {
    if (!Array.isArray(employees)) return [];
    return employees.filter((emp) =>
      String(emp.name).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentEmployees = filteredEmployees.slice(startIndex, startIndex + itemsPerPage);
  const startRecord = filteredEmployees.length > 0 ? startIndex + 1 : 0;
  const endRecord = Math.min(startIndex + itemsPerPage, filteredEmployees.length);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const getPageNumbers = () => {
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
    return pages;
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
    setCurrentPage(1);
    try {
      await refetch();
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  const exportToExcel = () => {
    if (!filteredEmployees.length) return;

    const exportData = filteredEmployees.map((emp) => {
      const row = { "Employee Name": emp.name };
      for (let day = 1; day <= daysInMonth; day++) {
        const status = getAttendanceStatus(emp.id, day);
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
  if (isLoading) {
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
              <div key={i} className="w-10 h-10 bg-gray-200 rounded-md animate-pulse"></div>
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
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-200 rounded transition-colors">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
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

      {/* Search and Actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="flex flex-1 gap-3 w-full lg:w-auto">
          <div className="flex-1 max-w-sm relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search employee..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent bg-white"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X size={16} className="text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isFetching}
            className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={16} className={isRefreshing || isFetching ? "animate-spin" : ""} />
          </button>
          <button
            onClick={exportToExcel}
            className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50"
            title="Export to Excel"
          >
            <Download size={16} />
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50"
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
              <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
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
                  className={`transition-transform ${showYearDropdown ? "rotate-180" : ""}`}
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
              <label className="block text-xs font-medium text-gray-600 mb-1">Month</label>
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
                  className={`transition-transform ${showMonthDropdown ? "rotate-180" : ""}`}
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

      {/* ✅ Attendance Status Legend — uses same AttendanceStatusIcon component */}
      <div className="flex flex-wrap items-center justify-end gap-6 mb-6">
        {LEGEND_ITEMS.map((item) => (
          <div key={item.status} className="flex items-center gap-2">
            <AttendanceStatusIcon status={item.status} />
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
            {searchTerm ? 'No employees found' : 'No attendance data available'}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm
              ? `No results found for "${searchTerm}". Try adjusting your search.`
              : 'No attendance records for the selected period.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">
              Total Employees
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded ml-2">{filteredEmployees.length}</span>
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
                    <th className="px-4 py-3 text-left sticky left-0 bg-gray-100 z-20 min-w-[180px] font-semibold text-gray-700 text-xs uppercase">
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
                            {/* ✅ Fixed: index already includes the pad offset */}
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
                        className="px-4 py-3 font-medium sticky left-0 bg-white z-30 border-r border-gray-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]"
                        style={{
                          minWidth: "180px",
                          maxWidth: "220px",
                          wordBreak: "break-word",
                          whiteSpace: "normal",
                          overflowWrap: "break-word",
                        }}
                      >
                        <div className="break-words whitespace-normal text-gray-800">
                          {employee.name}
                        </div>
                      </td>
                      {calendarDays.map((day, index) => {
                        if (!day) return null;
                        const status = getAttendanceStatus(employee.id, day);

                        return (
                          <td
                            key={index}
                            className="px-2 py-3 text-center border-l border-gray-100"
                          >
                            <div className="inline-flex items-center justify-center">
                              {status && <AttendanceStatusIcon status={status} />}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-auto px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-sm text-gray-500">
                    Showing {startRecord} to {endRecord} of {filteredEmployees.length} employees
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm"
                    >
                      <ChevronLeft size={16} />
                      Previous
                    </button>

                    <div className="flex gap-1">
                      {getPageNumbers().map((page, index) =>
                        page === "..." ? (
                          <span key={index} className="px-3 py-1.5 text-gray-400">
                            ...
                          </span>
                        ) : (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-1.5 border rounded-lg text-sm transition-colors ${
                              currentPage === page
                                ? "bg-[#1C62A0] text-white border-[#1C62A0]"
                                : "border-gray-300 hover:bg-white text-gray-700"
                            }`}
                          >
                            {page}
                          </button>
                        )
                      )}
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm"
                    >
                      Next
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceSheet;