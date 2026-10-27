import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Filter,
  Download,
  MoreVertical,
  Eye,
  RefreshCcw,
  Search,
  ShieldAlert,
  Monitor,
} from "lucide-react";

import { Button, Pagination, SearchBar, CustomSelect } from "../ui";
import { useGetSessionHistoryQuery } from "../../../app/service/sessionHistoryApi";
import { showSuccessToast, showErrorToast } from "../ui/Toast";
import { exportToExcel } from "../../utils/excelExport";
import { getAuthUser } from "../../utils/auth";

import {
  registerAuditEvents,
  unregisterAuditEvents,
} from "../../socket/auditEvents";

// ============================================================
// Constants
// ============================================================
const STATUS_OPTIONS = ["ACTIVE", "INACTIVE", "FAILED"];
const RISK_OPTIONS = ["LOW", "MEDIUM", "HIGH"];

// ============================================================
// Helpers
// ============================================================
const safeToString = (value) => {
  if (value === null || value === undefined) return "";
  return String(value);
};

const formatDateTime = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getInitials = (name) => {
  if (!name) return "U";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
};

const getStatusBadgeClass = (status) => {
  const normalized = safeToString(status).toLowerCase();
  if (["active", "success", "successful"].includes(normalized)) {
    return "bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium";
  }
  if (["inactive", "expired", "logout", "logged_out"].includes(normalized)) {
    return "bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium";
  }
  if (["blocked", "failed", "terminated"].includes(normalized)) {
    return "bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium";
  }
  return "bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-medium";
};

const getRiskBadgeClass = (riskLevel) => {
  const normalized = safeToString(riskLevel).toLowerCase();
  if (normalized === "low") {
    return "bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium";
  }
  if (normalized === "medium") {
    return "bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-medium";
  }
  if (["high", "critical"].includes(normalized)) {
    return "bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium";
  }
  return "bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium";
};

// ============================================================
// Skeleton Loader
// ============================================================
const SkeletonLoader = () => (
  <div className="min-h-screen bg-[#F8F9FA] p-3 sm:p-4 lg:p-6 font-sans">
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="h-7 w-44 bg-gray-200 rounded animate-pulse mt-2" />
      <div className="h-4 w-72 bg-gray-200 rounded animate-pulse mt-2" />
    </div>
    <div className="flex flex-col lg:flex-row justify-between gap-4 mb-6">
      <div className="h-10 w-full lg:w-96 bg-gray-200 rounded-md animate-pulse" />
      <div className="flex gap-2">
        {[1, 2, 3].map((item) => (
          <div key={item} className="w-10 h-10 bg-gray-200 rounded-md animate-pulse" />
        ))}
      </div>
    </div>
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b bg-gray-50">
        <div className="h-5 w-44 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100">
            <tr>
              {Array.from({ length: 10 }).map((_, index) => (
                <th key={index} className="px-6 py-3">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 7 }).map((_, rowIndex) => (
              <tr key={rowIndex} className="border-b border-gray-100">
                {Array.from({ length: 10 }).map((_, cellIndex) => (
                  <td key={cellIndex} className="px-6 py-4">
                    <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// ============================================================
// Session Details Modal — SCROLLABLE BODY
// ============================================================
const SessionDetailsModal = ({ session, onClose }) => {
  if (!session) return null;

  const detailRows = [
    ["Session ID", session.id],
    ["User", session.name],
    ["Role", session.role],
    ["Department", session.department],
    ["Hospital ID", session.hospitalId],
    ["Browser", session.browser || "N/A"],
    ["Browser Version", session.browserVersion || "N/A"],
    ["Operating System", session.operatingSystem || "N/A"],
    ["OS Version", session.osVersion || "N/A"],
    ["Device Type", session.deviceType || "N/A"],
    ["IP Address", session.ipAddress || "N/A"],
    ["Registered Address", session.registeredAddress || "N/A"],
    ["Login Method", session.loginMethod || "N/A"],
    ["Login Time", formatDateTime(session.loginTime)],
    ...(session.logoutTime
      ? [["Logout Time", formatDateTime(session.logoutTime)]]
      : []),
    ["Last Activity", formatDateTime(session.lastActivity)],
    ["Session Duration", session.sessionDuration || "N/A"],
    ["Created At", formatDateTime(session.createdAt)],
    ["Updated At", formatDateTime(session.updatedAt)],
  ];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-xl shadow-xl flex flex-col overflow-hidden">

        {/* Header — fixed, never scrolls */}
        <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-4 border-b">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-gray-800">Session Details</h2>
            <p className="text-xs text-gray-500 mt-1 truncate">Session #{session.id}</p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-6 py-4">
          {/* User summary card */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 shrink-0 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">
                {getInitials(session.name)}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-800 truncate">{session.name}</p>
                <p className="text-sm text-gray-500 truncate">
                  {session.role || "N/A"}
                  {session.department ? ` • ${session.department}` : ""}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <span className={getStatusBadgeClass(session.status)}>
                {session.status || "N/A"}
              </span>
              <span className={getRiskBadgeClass(session.riskLevel)}>
                {session.riskLevel || "N/A"} Risk
              </span>
            </div>
          </div>

          {/* Detail rows */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {detailRows.map(([label, value]) => (
              <div key={label} className="border border-gray-100 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <p className="text-sm font-medium text-gray-800 break-words">
                  {safeToString(value) || "N/A"}
                </p>
              </div>
            ))}
          </div>

          {/* User Agent */}
          <div className="mt-4 border border-gray-100 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">User Agent</p>
            <p className="text-sm text-gray-700 break-all">
              {session.userAgent || "N/A"}
            </p>
          </div>
        </div>

        {/* Footer — fixed, never scrolls */}
        <div className="shrink-0 flex justify-end px-4 sm:px-6 py-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

// ============================================================
// Row Action Menu
// ============================================================
const RowActionMenu = ({ session, onView }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen((value) => !value)}
        className="p-2"
      >
        <MoreVertical size={18} />
      </Button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <button
            onClick={() => {
              onView(session);
              setOpen(false);
            }}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <Eye size={16} />
            View Details
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================================
// Main Component
// ============================================================
const SessionHistory = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navigationHospitalId = location.state?.hospitalId;
  const navigationHospitalName = location.state?.hospitalName;

  const auth = getAuthUser();

  const [selectedHospitalId, setSelectedHospitalId] = useState(
    navigationHospitalId || ""
  );

  const [viewingHospitalName, setViewingHospitalName] = useState(
    navigationHospitalName || ""
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSession, setSelectedSession] = useState(null);

  const itemsPerPage = 10;

  const effectiveHospitalId =
    selectedHospitalId ||
    navigationHospitalId ||
    auth?.hospitalId ||
    undefined;

  useEffect(() => {
    if (navigationHospitalId) {
      window.history.replaceState({}, document.title);
    }
  }, [navigationHospitalId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const {
    data: sessionResponse,
    isLoading,
    isFetching,
    refetch,
  } = useGetSessionHistoryQuery({
    hospitalId: effectiveHospitalId,
    search: debouncedSearch || undefined,
    role: roleFilter || undefined,
    riskLevel: riskFilter || undefined,
    status: statusFilter || undefined,
    department: departmentFilter || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page: currentPage,
    limit: itemsPerPage,
  });

  const sessions = sessionResponse?.data ?? [];
  const totalItems = sessionResponse?.count ?? 0;
  const totalPages = sessionResponse?.totalPages ?? 0;

  const departments = useMemo(
    () =>
      [...new Set(sessions.map((session) => session.department).filter(Boolean))].sort(),
    [sessions]
  );

  const roles = useMemo(
    () =>
      [...new Set(sessions.map((session) => session.role).filter(Boolean))].sort(),
    [sessions]
  );

  const activeFilterCount =
    (roleFilter ? 1 : 0) +
    (statusFilter ? 1 : 0) +
    (riskFilter ? 1 : 0) +
    (departmentFilter ? 1 : 0) +
    (searchTerm ? 1 : 0) +
    (startDate ? 1 : 0) +
    (endDate ? 1 : 0);

  useEffect(() => {
    registerAuditEvents({
      onAuthLogin: ({ message, data }) => {
        if (
          effectiveHospitalId &&
          data?.hospitalId &&
          String(data.hospitalId) !== String(effectiveHospitalId)
        ) {
          return;
        }

        if (message) {
          showSuccessToast(message, 4000);
        }

        refetch();
      },
    });

    return () => unregisterAuditEvents();
  }, [refetch, effectiveHospitalId]);

  const clearFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setRoleFilter("");
    setStatusFilter("");
    setRiskFilter("");
    setDepartmentFilter("");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  const handleRefresh = async () => {
    try {
      await refetch();
      showSuccessToast("Session history refreshed", 2000);
    } catch (error) {
      showErrorToast("Failed to refresh session history", 3000);
    }
  };

  const handleExport = () => {
    if (sessions.length === 0) {
      showErrorToast("No session data available to export", 3000);
      return;
    }

    try {
      const exportData = sessions.map((session) => ({
        "Session ID": session.id,
        "Auth ID": session.authId,
        "Name": session.name,
        "Role": session.role,
        "Department": session.department,
        "Hospital ID": session.hospitalId,
        "Browser": session.browser || "N/A",
        "Browser Version": session.browserVersion || "N/A",
        "Operating System": session.operatingSystem || "N/A",
        "OS Version": session.osVersion || "N/A",
        "Device Type": session.deviceType,
        "IP Address": session.ipAddress,
        "Registered Address": session.registeredAddress,
        "Login Time": formatDateTime(session.loginTime),
        "Logout Time": session.logoutTime
          ? formatDateTime(session.logoutTime)
          : "",
        "Last Activity": formatDateTime(session.lastActivity),
        "Status": session.status,
        "Risk Level": session.riskLevel,
        "Session Duration": session.sessionDuration || "N/A",
        "Login Method": session.loginMethod,
        "User Agent": session.userAgent,
        "Created At": formatDateTime(session.createdAt),
        "Updated At": formatDateTime(session.updatedAt),
      }));

      const dateStr = new Date().toISOString().split("T")[0];
      exportToExcel({
        data: exportData,
        fileName: `session_history_export_${dateStr}`,
        sheetName: "Session History",
        columnWidth: 20,
      });
      showSuccessToast(`Successfully exported ${exportData.length} sessions to Excel!`, 3000);
    } catch (error) {
      console.error("Session export error:", error);
      showErrorToast("Failed to export session history", 3000);
    }
  };

  const handleHospitalChange = (hospitalId, hospitalName) => {
    setSelectedHospitalId(hospitalId);
    setViewingHospitalName(hospitalName || "");
    setCurrentPage(1);
  };

  const handleBackToHospitals = () => {
    navigate("/hospitals");
  };

  if (isLoading) {
    return <SkeletonLoader />;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-3 sm:p-4 lg:p-6 font-sans">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <button
            onClick={handleBackToHospitals}
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
            <span className="text-gray-700">Session History</span>
            <span className="mx-1 text-gray-400">»</span>
            <span>Home</span>
            <span className="mx-1 text-gray-400">»</span>
            <span>Session History</span>
            {viewingHospitalName && (
              <>
                <span className="mx-1 text-gray-400">»</span>
                <span className="text-[#1C62A0] font-medium">
                  {viewingHospitalName}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-800 truncate">
              {viewingHospitalName
                ? `Session History - ${viewingHospitalName}`
                : "Session History"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {viewingHospitalName
                ? `Viewing all sessions for ${viewingHospitalName}`
                : "View and manage user login sessions and activity history"}
            </p>
          </div>

          {viewingHospitalName && (
            <button
              onClick={handleBackToHospitals}
              className="shrink-0 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 self-start sm:self-auto"
            >
              ← Back to Hospitals
            </button>
          )}
        </div>
      </div>

      {/* Search + Actions — mobile stacked, desktop row */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between mb-6">
        <div className="w-full lg:flex-1 lg:max-w-md">
          <SearchBar
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(value) => {
              setSearchTerm(value);
              setCurrentPage(1);
            }}
            onClear={() => {
              setSearchTerm("");
              setDebouncedSearch("");
              setCurrentPage(1);
            }}
            className="w-full"
          />
        </div>

        <div className="flex gap-2 items-center justify-end">
          <button
            onClick={handleRefresh}
            className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50"
            disabled={isFetching}
            title="Refresh"
          >
            <RefreshCcw size={16} className={isFetching ? "animate-spin" : ""} />
          </button>
          <button
            onClick={handleExport}
            className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50"
            title="Export to Excel"
          >
            <Download size={16} />
          </button>
          <button
            onClick={() => setShowFilters((value) => !value)}
            className={`relative p-2 border border-gray-200 rounded-md bg-white ${
              showFilters || activeFilterCount > 0 ? "text-[#1C62A0]" : "text-gray-500"
            } hover:bg-gray-50`}
            title="Toggle Filters"
          >
            <Filter size={16} />
            {activeFilterCount > 0 && !showFilters && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filters Section */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center bg-gray-50">
                <Filter size={18} className="text-[#1C62A0]" />
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-semibold text-gray-800">Filters</h2>
                {activeFilterCount > 0 && (
                  <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-md">
                    {activeFilterCount} Active Filter{activeFilterCount !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
            <button onClick={clearFilters} className="text-sm font-medium text-red-500 hover:text-red-600 self-start sm:self-auto">
              Clear All Filters
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-5">
            <div>
              <CustomSelect
                label="Role"
                value={roleFilter}
                options={[
                  { value: '', label: 'All Roles' },
                  ...roles.map((role) => ({ value: role, label: role }))
                ]}
                onChange={(value) => {
                  setRoleFilter(value);
                  setCurrentPage(1);
                }}
                placeholder="All Roles"
              />
            </div>

            <div>
              <CustomSelect
                label="Status"
                value={statusFilter}
                options={[
                  { value: '', label: 'All Status' },
                  ...STATUS_OPTIONS.map((status) => ({ value: status, label: status }))
                ]}
                onChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
                placeholder="All Status"
              />
            </div>

            <div>
              <CustomSelect
                label="Risk Level"
                value={riskFilter}
                options={[
                  { value: '', label: 'All Risk Levels' },
                  ...RISK_OPTIONS.map((risk) => ({ value: risk, label: risk }))
                ]}
                onChange={(value) => {
                  setRiskFilter(value);
                  setCurrentPage(1);
                }}
                placeholder="All Risk Levels"
              />
            </div>

            <div>
              <CustomSelect
                label="Department"
                value={departmentFilter}
                options={[
                  { value: '', label: 'All Departments' },
                  ...departments.map((dept) => ({ value: dept, label: dept }))
                ]}
                onChange={(value) => {
                  setDepartmentFilter(value);
                  setCurrentPage(1);
                }}
                placeholder="All Departments"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-600">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-12 w-full px-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-[#1C62A0] bg-white text-gray-700"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-600">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-12 w-full px-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-[#1C62A0] bg-white text-gray-700"
              />
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {sessions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <ShieldAlert className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {activeFilterCount > 0 ? "No sessions found" : "No session history available"}
          </h3>
          <p className="text-gray-500 mb-4 px-4">
            {searchTerm
              ? `No results found for "${searchTerm}". Try adjusting your search.`
              : activeFilterCount > 0
              ? "No sessions match the selected filters. Try adjusting your filters."
              : "No session records are available yet."}
          </p>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 px-3 sm:px-6 py-4 border-b bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">
              Total Sessions
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded ml-2">
                {totalItems}
              </span>
              {activeFilterCount > 0 && totalItems > 0 && (
                <span className="text-xs text-gray-400 ml-2">(Filtered)</span>
              )}
            </h2>
            <div className="text-xs text-gray-400">
              Showing {sessions.length} of {totalItems}
            </div>
          </div>

          <div className="flex flex-col min-h-[500px]">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
                  <tr>
                    <th className="px-6 py-3">User</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3">Department</th>
                    <th className="px-6 py-3">Device</th>
                    <th className="px-6 py-3">IP Address</th>
                    <th className="px-6 py-3">Login Time</th>
                    <th className="px-6 py-3">Logout Time</th>
                    <th className="px-6 py-3">Last Activity</th>
                    <th className="px-6 py-3">Risk</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right w-16">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session, index) => (
                    <tr key={session.id || index} className="hover:bg-gray-50 border-b border-gray-100">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 min-w-[190px]">
                          <div className="w-9 h-9 rounded-full bg-blue-50 text-[#1C62A0] flex items-center justify-center text-xs font-semibold">
                            {getInitials(session.name)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{session.name || "N/A"}</p>
                            <p className="text-xs text-gray-400">Session #{session.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-800">{session.role || "N/A"}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{session.department || "N/A"}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 min-w-[170px]">
                          <Monitor size={16} className="text-gray-400" />
                          <div>
                            <p className="text-gray-800">{session.deviceType || "N/A"}</p>
                            <p className="text-xs text-gray-400">
                              {session.browser
                                ? `${session.browser}${session.browserVersion ? ` ${session.browserVersion}` : ""}`
                                : "Browser N/A"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{session.ipAddress || "N/A"}</td>
                      <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{formatDateTime(session.loginTime)}</td>
                      <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                        {session.logoutTime ? formatDateTime(session.logoutTime) : ""}
                      </td>
                      <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{formatDateTime(session.lastActivity)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getRiskBadgeClass(session.riskLevel)}>
                          {session.riskLevel || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusBadgeClass(session.status)}>
                          {session.status || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end">
                          <RowActionMenu session={session} onView={setSelectedSession} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-auto px-6 py-4 bg-gray-50 border-t border-gray-200">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(page) => {
                    setCurrentPage(page);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  itemLabel="sessions"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedSession && (
        <SessionDetailsModal session={selectedSession} onClose={() => setSelectedSession(null)} />
      )}
    </div>
  );
};

export default SessionHistory;