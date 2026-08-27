// SuperAdminAuditLog.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Filter,
  Download,
  MoreVertical,
  Eye,
  RefreshCcw,
  Search,
  ShieldAlert,
  Monitor,
  User,
  Clock3,
  MapPin,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Button, SearchBar } from "../../ui";
import { useGetSessionHistoryQuery } from "../../../../app/service/sessionHistoryApi";
import { showSuccessToast, showErrorToast } from "../../ui/Toast";
import { exportToExcel } from "../../../utils/excelExport";

// ============================================================
// Global Pagination Component
// ============================================================

const GlobalPagination = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  itemLabel = "items",
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust if at beginning
      if (currentPage <= 3) {
        endPage = Math.min(totalPages - 1, 4);
      }
      
      // Adjust if at end
      if (currentPage >= totalPages - 2) {
        startPage = Math.max(2, totalPages - 3);
      }
      
      // Add ellipsis if needed
      if (startPage > 2) {
        pages.push("...");
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Add ellipsis if needed
      if (endPage < totalPages - 1) {
        pages.push("...");
      }
      
      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  if (totalItems === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-white border-t border-gray-200 rounded-b-xl">
      {/* Items info */}
      <div className="text-sm text-gray-600 order-2 sm:order-1">
        Showing <span className="font-medium">{startItem}</span> to{" "}
        <span className="font-medium">{endItem}</span> of{" "}
        <span className="font-medium">{totalItems}</span> {itemLabel}
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-1 order-1 sm:order-2">
        {/* Previous button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`p-2 rounded-lg border transition-colors ${
            currentPage === 1
              ? "border-gray-200 text-gray-300 cursor-not-allowed"
              : "border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400"
          }`}
          aria-label="Previous page"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => (
            <React.Fragment key={index}>
              {page === "..." ? (
                <span className="px-2 text-gray-400">…</span>
              ) : (
                <button
                  onClick={() => onPageChange(page)}
                  className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === page
                      ? "bg-[#1C62A0] text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Next button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-lg border transition-colors ${
            currentPage === totalPages
              ? "border-gray-200 text-gray-300 cursor-not-allowed"
              : "border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400"
          }`}
          aria-label="Next page"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

// ============================================================
// Constants
// ============================================================

const STATUS_OPTIONS = [
  "ACTIVE",
  "INACTIVE",
  "EXPIRED",
  "REVOKED",
  "FAILED",
];

const RISK_OPTIONS = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
];

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

const formatDate = (value) => {
  if (!value) return "N/A";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
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

  if (normalized === "active" || normalized === "success") {
    return "bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium";
  }

  if (normalized === "inactive" || normalized === "expired") {
    return "bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium";
  }

  if (normalized === "revoked" || normalized === "failed") {
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

  if (normalized === "high") {
    return "bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium";
  }

  if (normalized === "critical") {
    return "bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium animate-pulse";
  }

  return "bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium";
};

const getActionIcon = (action) => {
  const normalized = safeToString(action).toLowerCase();
  
  if (normalized.includes("login") || normalized.includes("signin")) {
    return <CheckCircle size={16} className="text-green-500" />;
  }
  if (normalized.includes("logout") || normalized.includes("signout")) {
    return <XCircle size={16} className="text-red-500" />;
  }
  if (normalized.includes("failed") || normalized.includes("error")) {
    return <AlertTriangle size={16} className="text-red-500" />;
  }
  return <Activity size={16} className="text-blue-500" />;
};

// ============================================================
// Skeleton Loader
// ============================================================

const SkeletonLoader = () => (
  <div className="min-h-screen bg-[#F8F9FA] p-6 font-sans">
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
          <div
            key={item}
            className="w-10 h-10 bg-gray-200 rounded-md animate-pulse"
          />
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
              {Array.from({ length: 9 }).map((_, index) => (
                <th key={index} className="px-6 py-3">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {Array.from({ length: 7 }).map((_, rowIndex) => (
              <tr key={rowIndex} className="border-b border-gray-100">
                {Array.from({ length: 9 }).map((_, cellIndex) => (
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
// Session Details Modal
// ============================================================

const SessionDetailsModal = ({ session, onClose }) => {
  if (!session) return null;

  const detailRows = [
    ["Session ID", session.id],
    ["Auth ID", session.authId],
    ["User", session.name],
    ["Role", session.role],
    ["Department", session.department],
    ["Hospital ID", session.hospitalId],
    ["Action", session.action],
    ["Browser", session.browser || "N/A"],
    ["Browser Version", session.browserVersion || "N/A"],
    ["Operating System", session.operatingSystem || "N/A"],
    ["OS Version", session.osVersion || "N/A"],
    ["Device Type", session.deviceType || "N/A"],
    ["IP Address", session.ipAddress || "N/A"],
    ["Registered Address", session.registeredAddress || "N/A"],
    ["Login Method", session.loginMethod || "N/A"],
    ["Login Time", formatDateTime(session.loginTime)],
    ["Last Activity", formatDateTime(session.lastActivity)],
    ["Session Duration", session.sessionDuration || "N/A"],
    ["Created At", formatDateTime(session.createdAt)],
    ["Updated At", formatDateTime(session.updatedAt)],
  ];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Session Details
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Session #{session.id}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
          >
            ×
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">
                {getInitials(session.name)}
              </div>

              <div>
                <p className="font-semibold text-gray-800">{session.name}</p>
                <p className="text-sm text-gray-500">
                  {session.role || "N/A"}
                  {session.department ? ` • ${session.department}` : ""}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={getStatusBadgeClass(session.status)}>
                {session.status || "N/A"}
              </span>
              <span className={getRiskBadgeClass(session.riskLevel)}>
                {session.riskLevel || "N/A"} Risk
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {detailRows.map(([label, value]) => (
              <div
                key={label}
                className="border border-gray-100 rounded-lg p-3"
              >
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <p className="text-sm font-medium text-gray-800 break-words">
                  {safeToString(value) || "N/A"}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 border border-gray-100 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">User Agent</p>
            <p className="text-sm text-gray-700 break-all">
              {session.userAgent || "N/A"}
            </p>
          </div>
        </div>

        <div className="flex justify-end px-6 py-4 border-t bg-gray-50">
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

const SuperAdminAuditLog = () => {
  // Search state with debounce
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [hospitalIdFilter, setHospitalIdFilter] = useState("");
  
  // Date filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSession, setSelectedSession] = useState(null);

  const itemsPerPage = 10;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setCurrentPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch data with backend filters
  const {
    data: sessionResponse,
    isLoading,
    isFetching,
    refetch,
  } = useGetSessionHistoryQuery({
    // Search: for searching name/details
    search: debouncedSearch || undefined,
    
    // Independent filters
    role: roleFilter || undefined,
    riskLevel: riskFilter || undefined,
    status: statusFilter || undefined,
    department: departmentFilter || undefined,
    hospitalId: hospitalIdFilter || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page: currentPage,
    limit: itemsPerPage,
  });

  // Use backend response values
  const sessions = sessionResponse?.data ?? [];
  const totalItems = sessionResponse?.count ?? 0;
  const totalPages = sessionResponse?.totalPages ?? 0;

  // Get unique values for filters from current page data
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

  // Count active filters
  const activeFilterCount =
    (roleFilter ? 1 : 0) +
    (statusFilter ? 1 : 0) +
    (riskFilter ? 1 : 0) +
    (departmentFilter ? 1 : 0) +
    (hospitalIdFilter ? 1 : 0) +
    (searchTerm ? 1 : 0) +
    (startDate ? 1 : 0) +
    (endDate ? 1 : 0);

  const clearFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setRoleFilter("");
    setStatusFilter("");
    setRiskFilter("");
    setDepartmentFilter("");
    setHospitalIdFilter("");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  const handleRefresh = async () => {
    try {
      await refetch();
      showSuccessToast("Audit logs refreshed", 2000);
    } catch (error) {
      showErrorToast("Failed to refresh audit logs", 3000);
    }
  };

  const handleExport = () => {
    if (sessions.length === 0) {
      showErrorToast("No audit data available to export", 3000);
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
        "Action": session.action || "N/A",
        "Browser": session.browser || "N/A",
        "Browser Version": session.browserVersion || "N/A",
        "Operating System": session.operatingSystem || "N/A",
        "OS Version": session.osVersion || "N/A",
        "Device Type": session.deviceType,
        "IP Address": session.ipAddress,
        "Registered Address": session.registeredAddress,
        "Login Time": formatDateTime(session.loginTime),
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
        fileName: `audit_logs_export_${dateStr}`,
        sheetName: "Audit Logs",
        columnWidth: 20,
      });

      showSuccessToast(
        `Successfully exported ${exportData.length} audit logs to Excel!`,
        3000
      );
    } catch (error) {
      console.error("Audit export error:", error);
      showErrorToast("Failed to export audit logs", 3000);
    }
  };

  // Handle page change with smooth scroll
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (isLoading) {
    return <SkeletonLoader />;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 font-sans">
      {/* Breadcrumb */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <button
            onClick={() => window.history.back()}
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
            <span className="text-gray-700">Audit Logs</span>
            <span className="mx-1 text-gray-400">»</span>
            <span>Home</span>
            <span className="mx-1 text-gray-400">»</span>
            <span>Audit Logs</span>
          </div>
        </div>

        <h1 className="text-xl font-bold text-gray-800">Audit Logs</h1>

        <p className="text-sm text-gray-500 mt-1">
          Monitor all user activities and session history across hospitals
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-800">{totalItems}</p>
            </div>
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
              <Activity size={20} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Sessions</p>
              <p className="text-2xl font-bold text-green-600">
                {sessions.filter(s => s.status?.toLowerCase() === 'active').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
              <CheckCircle size={20} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">High Risk</p>
              <p className="text-2xl font-bold text-orange-600">
                {sessions.filter(s => s.riskLevel?.toLowerCase() === 'high' || s.riskLevel?.toLowerCase() === 'critical').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center">
              <AlertTriangle size={20} className="text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Failed Attempts</p>
              <p className="text-2xl font-bold text-red-600">
                {sessions.filter(s => s.status?.toLowerCase() === 'failed').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
              <XCircle size={20} className="text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search + Actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="flex flex-1 gap-3 w-full lg:w-auto">
          <SearchBar
            placeholder="Search by name or action..."
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
            className="flex-1 max-w-md"
          />
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <button
            onClick={handleRefresh}
            className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50"
            disabled={isFetching}
            title="Refresh"
          >
            <RefreshCcw
              size={16}
              className={isFetching ? "animate-spin" : ""}
            />
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
              showFilters || activeFilterCount > 0
                ? "text-[#1C62A0]"
                : "text-gray-500"
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

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center bg-gray-50">
                <Filter size={18} className="text-[#1C62A0]" />
              </div>

              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-gray-800">
                  Filters
                </h2>

                {activeFilterCount > 0 && (
                  <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-md">
                    {activeFilterCount} Active Filter
                    {activeFilterCount !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={clearFilters}
              className="text-sm font-medium text-red-500 hover:text-red-600"
            >
              Clear All Filters
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {/* Hospital ID Filter (Super Admin Only) */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-600">
                Hospital ID
              </label>
              <input
                type="number"
                value={hospitalIdFilter}
                onChange={(e) => {
                  setHospitalIdFilter(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Enter hospital ID"
                className="h-12 w-full px-4 border border-gray-200 rounded-xl
                           outline-none focus:ring-2 focus:ring-[#1C62A0]
                           focus:border-[#1C62A0] bg-white text-gray-700"
              />
            </div>

            {/* Role Filter */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-600">
                Role
              </label>
              <select
                value={roleFilter}
                onChange={(event) => {
                  setRoleFilter(event.target.value);
                  setCurrentPage(1);
                }}
                className="h-12 w-full px-4 border border-gray-200 rounded-xl
                           outline-none focus:ring-2 focus:ring-[#1C62A0]
                           focus:border-[#1C62A0] bg-white text-gray-700"
              >
                <option value="">All Roles</option>
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-600">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  setCurrentPage(1);
                }}
                className="h-12 w-full px-4 border border-gray-200 rounded-xl
                           outline-none focus:ring-2 focus:ring-[#1C62A0]
                           focus:border-[#1C62A0] bg-white text-gray-700"
              >
                <option value="">All Status</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {/* Risk Level Filter */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-600">
                Risk Level
              </label>
              <select
                value={riskFilter}
                onChange={(event) => {
                  setRiskFilter(event.target.value);
                  setCurrentPage(1);
                }}
                className="h-12 w-full px-4 border border-gray-200 rounded-xl
                           outline-none focus:ring-2 focus:ring-[#1C62A0]
                           focus:border-[#1C62A0] bg-white text-gray-700"
              >
                <option value="">All Risk Levels</option>
                {RISK_OPTIONS.map((risk) => (
                  <option key={risk} value={risk}>
                    {risk}
                  </option>
                ))}
              </select>
            </div>

            {/* Department Filter */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-600">
                Department
              </label>
              <select
                value={departmentFilter}
                onChange={(event) => {
                  setDepartmentFilter(event.target.value);
                  setCurrentPage(1);
                }}
                className="h-12 w-full px-4 border border-gray-200 rounded-xl
                           outline-none focus:ring-2 focus:ring-[#1C62A0]
                           focus:border-[#1C62A0] bg-white text-gray-700"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date Filter */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-600">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-12 w-full px-4 border border-gray-200 rounded-xl
                           outline-none focus:ring-2 focus:ring-[#1C62A0]
                           focus:border-[#1C62A0] bg-white text-gray-700"
              />
            </div>

            {/* End Date Filter */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-600">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-12 w-full px-4 border border-gray-200 rounded-xl
                           outline-none focus:ring-2 focus:ring-[#1C62A0]
                           focus:border-[#1C62A0] bg-white text-gray-700"
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
            {activeFilterCount > 0
              ? "No audit logs found"
              : "No audit logs available"}
          </h3>

          <p className="text-gray-500 mb-4">
            {searchTerm
              ? `No results found for "${searchTerm}". Try adjusting your search.`
              : activeFilterCount > 0
              ? "No logs match the selected filters. Try adjusting your filters."
              : "No audit records are available yet."}
          </p>

          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
          {/* Table Header */}
          <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
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
                    <th className="px-6 py-3">Login Method</th>
                    <th className="px-6 py-3">Device</th>
                    <th className="px-6 py-3">IP Address</th>
                    <th className="px-6 py-3">Login Time</th>
                    <th className="px-6 py-3">Last Activity</th>
                    <th className="px-6 py-3">Risk</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right w-16">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {sessions.map((session, index) => (
                    <tr
                      key={session.id || index}
                      className="hover:bg-gray-50 border-b border-gray-100"
                    >
                      {/* User */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 min-w-[190px]">
                          <div className="w-9 h-9 rounded-full bg-blue-50 text-[#1C62A0] flex items-center justify-center text-xs font-semibold">
                            {getInitials(session.name)}
                          </div>

                          <div>
                            <p className="font-medium text-gray-800">
                              {session.name || "N/A"}
                            </p>
                            <p className="text-xs text-gray-400">
                              {session.department || "No department"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-800">
                          {session.role || "N/A"}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getActionIcon(session.action || session.loginMethod)}
                          <span className="text-gray-700">
                            {session.action || session.loginMethod || "N/A"}
                          </span>
                        </div>
                      </td>

                      {/* Device */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 min-w-[170px]">
                          <Monitor size={16} className="text-gray-400" />
                          <div>
                            <p className="text-gray-800">
                              {session.deviceType || "N/A"}
                            </p>
                            <p className="text-xs text-gray-400">
                              {session.browser
                                ? `${session.browser}${session.browserVersion ? ` ${session.browserVersion}` : ""}`
                                : "Browser N/A"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* IP */}
                      <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                        {session.ipAddress || "N/A"}
                      </td>

                      {/* Login Time */}
                      <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                        {formatDateTime(session.loginTime)}
                      </td>

                      {/* Last Activity */}
                      <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                        {formatDateTime(session.lastActivity)}
                      </td>

                      {/* Risk */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getRiskBadgeClass(session.riskLevel)}>
                          {session.riskLevel || "N/A"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusBadgeClass(session.status)}>
                          {session.status || "N/A"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end">
                          <RowActionMenu
                            session={session}
                            onView={setSelectedSession}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Global Pagination */}
            <GlobalPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              itemLabel="logs"
            />
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedSession && (
        <SessionDetailsModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </div>
  );
};

export default SuperAdminAuditLog;