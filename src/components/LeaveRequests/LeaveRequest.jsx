// src/components/leave/LeaveRequests.jsx
import React, { useState, useMemo, useEffect } from 'react';
import {
  XCircle,
  Search,
  Download,
  RefreshCcw,
  Loader2,
  Calendar,
  CheckCircle2,
  Clock,
  Mail,
  ChevronRight,
  Check,
  X,
  Filter,
  TrendingUp,
  Inbox,
  ArrowUpRight,
} from 'lucide-react';
import { Breadcrumb } from '../ui/Breadcrumb';
import { Pagination, SearchBar, Modal, Button, FilterBar } from '../ui';
import CustomSelect from '../ui/CustomSelect';
import { showSuccessToast, showErrorToast } from '../ui/Toast';

// ✅ API
import {
  useGetLeaveRequestsQuery,
  useGetLeaveStatsQuery,
  useUpdateLeaveStatusMutation,
} from '../../../app/service/leaverequest';

// ============================================================
// HELPERS
// ============================================================
const formatDate = (value) => {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '-';
  }
};

const LEAVE_TYPES = [
  { label: 'Casual', color: 'bg-blue-100 text-blue-700' },
  { label: 'Sick', color: 'bg-red-100 text-red-700' },
  { label: 'Maternity', color: 'bg-purple-100 text-purple-700' },
  { label: 'Annual', color: 'bg-green-100 text-green-700' },
];

const STATUS_OPTIONS = ['Pending', 'Approved', 'Rejected'];

const DEPT_FILTER_OPTIONS = [
  { value: 'all', label: 'All Departments' },
  { value: 'Doctor', label: 'Doctor' },
  { value: 'Staff', label: 'Staff' },
];

const LEAVE_TYPE_FILTER_OPTIONS = [
  { value: 'all', label: 'All Leave Types' },
  ...LEAVE_TYPES.map((t) => ({ value: t.label, label: t.label })),
];

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All Status' },
  ...STATUS_OPTIONS.map((s) => ({ value: s, label: s })),
];

const getStatusBadge = (status) => {
  switch (status) {
    case 'Approved': return 'bg-green-50 text-green-700 border-green-200';
    case 'Pending': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Rejected': return 'bg-red-50 text-red-700 border-red-200';
    default: return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

const getStatusDot = (status) => {
  switch (status) {
    case 'Approved': return 'bg-green-500';
    case 'Pending': return 'bg-amber-500';
    case 'Rejected': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};

const getLeaveTypeBadge = (type) => {
  const found = LEAVE_TYPES.find(
    (t) => t.label.toLowerCase() === (type || '').toLowerCase()
  );
  return found ? found.color : 'bg-slate-100 text-slate-700';
};

const getAvatarColor = (role) => {
  return role === 'Doctor' ? 'bg-[#8B5CF6]' : 'bg-[#14B8A6]';
};

const mapRow = (r) => ({
  id: r.id,
  name: r.employeeName || 'Employee',
  email: r.employeeEmail || '',
  initial: (r.employeeName || 'E')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase(),
  role: r.employeeType || 'Staff',
  type: r.leaveType,
  start: formatDate(r.startDate),
  end: formatDate(r.endDate),
  days: r.totalDays,
  status: r.status,
  reason: r.reason,
  submittedAt: r.appliedAt ? new Date(r.appliedAt).toLocaleString() : '-',
  messageId: `LR-${r.id}`,
  raw: r,
});

// ============================================================
// 📊 STATS CARD (professional KPI card)
// ============================================================
const StatCard = ({
  label,
  value,
  icon: Icon,
  accent,
  total,
  suffix = 'requests',
}) => {
  const pct =
    total && total > 0 ? Math.round((Number(value) / Number(total)) * 100) : 0;

  return (
    <div className="group relative bg-white rounded-2xl border border-gray-200/80 shadow-[0_1px_2px_rgba(16,24,40,0.04)] hover:shadow-[0_8px_24px_-8px_rgba(16,24,40,0.12)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
      {/* subtle accent strip */}
      <div className={`absolute inset-x-0 top-0 h-1 ${accent.bar}`} />

      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-gray-500">
              {label}
            </p>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-[28px] leading-none font-bold text-gray-900 tabular-nums">
                {value ?? 0}
              </span>
              <span className="text-xs text-gray-400 font-medium">{suffix}</span>
            </div>
          </div>

          <div
            className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center ${accent.iconBg} ${accent.iconColor} ring-1 ${accent.iconRing}`}
          >
            <Icon size={20} strokeWidth={2.2} />
          </div>
        </div>

        {/* progress line (only when we have a sensible total) */}
        {total > 0 && (
          <div className="mt-4">
            <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
              <div
                className={`h-full rounded-full ${accent.bar}`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="text-gray-400 font-medium">
                {pct}% of total
              </span>
              {accent.trendLabel && (
                <span
                  className={`inline-flex items-center gap-0.5 font-semibold ${accent.trendColor}`}
                >
                  <ArrowUpRight size={11} strokeWidth={2.5} />
                  {accent.trendLabel}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// DETAILS MODAL
// ============================================================
const LeaveDetailsModal = ({ isOpen, onClose, record }) => {
  if (!isOpen || !record) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Leave Request Details" size="md">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${getAvatarColor(
                record.role
              )}`}
            >
              {record.initial}
            </div>
            <div>
              <p className="font-semibold text-gray-800">{record.name}</p>
              <p className="text-xs text-slate-500">
                {record.role} | {record.email}
              </p>
            </div>
          </div>
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadge(
              record.status
            )}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full mr-1.5 ${getStatusDot(
                record.status
              )}`}
            ></span>
            {record.status}
          </span>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            Leave Information
          </h4>
          <div className="bg-slate-50 rounded-lg p-4 text-sm space-y-3 border border-slate-100">
            <div className="flex justify-between">
              <span className="text-slate-500">Leave Type</span>
              <span className="font-medium">{record.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date Range</span>
              <span className="font-medium">
                {record.start} → {record.end}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Days</span>
              <span className="font-medium">{record.days} Days</span>
            </div>
            <div className="pt-2 border-t flex flex-col gap-1 border-slate-200">
              <span className="text-slate-500">Reason</span>
              <span className="font-medium text-slate-700">
                {record.reason || '-'}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            Request Information
          </h4>
          <div className="text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Submitted At</span>
              <span className="font-medium">{record.submittedAt}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t mt-4">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
};

// ============================================================
// APPROVE / REJECT MODAL
// ============================================================
const ApproveRejectModal = ({
  isOpen,
  onClose,
  onSave,
  record,
  isLoading,
}) => {
  const [decision, setDecision] = useState('approve');
  const [comments, setComments] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDecision('approve');
      setComments('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen || !record) return null;

  const handleSubmit = () => {
    if (decision === 'reject' && !comments.trim()) {
      setError('Please provide a reason for rejection.');
      return;
    }
    onSave({
      id: record.id,
      status: decision === 'approve' ? 'Approved' : 'Rejected',
      comments,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Approve / Reject Leave Request"
      size="md"
    >
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${getAvatarColor(
              record.role
            )}`}
          >
            {record.initial}
          </div>
          <div>
            <p className="font-semibold text-gray-800">{record.name}</p>
            <p className="text-xs text-slate-500">
              {record.role} | {record.email}
            </p>
          </div>
        </div>

        <div className="bg-slate-50 border rounded-lg p-4 text-sm space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-0.5 sm:gap-0">
            <span className="text-slate-500 text-xs sm:text-sm">Leave Type</span>
            <span className="col-span-1 sm:col-span-2 font-medium text-sm">{record.type}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-0.5 sm:gap-0">
            <span className="text-slate-500 text-xs sm:text-sm">Date Range</span>
            <span className="col-span-1 sm:col-span-2 font-medium text-sm">
              {record.start} → {record.end}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-0.5 sm:gap-0">
            <span className="text-slate-500 text-xs sm:text-sm">Total Days</span>
            <span className="col-span-1 sm:col-span-2 font-medium text-sm">{record.days} Days</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-0.5 sm:gap-0">
            <span className="text-slate-500 text-xs sm:text-sm">Reason</span>
            <span className="col-span-1 sm:col-span-2 font-medium text-sm">{record.reason}</span>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Decision</h4>
          <div className="space-y-3">
            <label
              className={`border rounded-lg p-3 flex items-start gap-3 cursor-pointer transition-colors ${
                decision === 'approve'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="decision"
                checked={decision === 'approve'}
                onChange={() => setDecision('approve')}
                className="mt-1 w-4 h-4 text-green-600 focus:ring-green-500"
              />
              <div>
                <p
                  className={`font-medium text-sm flex items-center gap-1 ${
                    decision === 'approve' ? 'text-green-700' : 'text-gray-700'
                  }`}
                >
                  <Check size={16} /> Approve Request
                </p>
                <p
                  className={`text-xs mt-0.5 ${
                    decision === 'approve' ? 'text-green-600' : 'text-slate-500'
                  }`}
                >
                  The employee will receive a confirmation email.
                </p>
              </div>
            </label>

            <label
              className={`border rounded-lg p-3 flex items-start gap-3 cursor-pointer transition-colors ${
                decision === 'reject'
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="decision"
                checked={decision === 'reject'}
                onChange={() => setDecision('reject')}
                className="mt-1 w-4 h-4 text-red-600 focus:ring-red-500"
              />
              <div>
                <p
                  className={`font-medium text-sm flex items-center gap-1 ${
                    decision === 'reject' ? 'text-red-600' : 'text-gray-700'
                  }`}
                >
                  <X size={16} /> Reject Request
                </p>
                <p
                  className={`text-xs mt-0.5 ${
                    decision === 'reject' ? 'text-red-500' : 'text-slate-500'
                  }`}
                >
                  Please provide a reason for rejection.
                </p>
              </div>
            </label>
          </div>

          <div className="mt-4">
            <label className="text-xs font-medium text-slate-600 mb-1 block">
              Comments{' '}
              <span className="text-slate-400 font-normal">
                (required for rejection)
              </span>
            </label>
            <textarea
              value={comments}
              onChange={(e) => {
                setComments(e.target.value);
                if (error) setError('');
              }}
              className={`w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1C62A0] resize-none h-20 ${
                error ? 'border-red-300' : 'border-gray-200'
              }`}
              placeholder="e.g. Insufficient staff coverage during the requested dates..."
            ></textarea>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t mt-4">
        <Button variant="secondary" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={isLoading}
          loading={isLoading}
        >
          Submit
        </Button>
      </div>
    </Modal>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const LeaveRequests = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [detailsRecord, setDetailsRecord] = useState(null);
  const [actionRecord, setActionRecord] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, deptFilter, typeFilter, statusFilter, dateFilter]);

  const queryParams = {
    page: currentPage,
    limit: itemsPerPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(deptFilter !== 'all' ? { employeeType: deptFilter } : {}),
    ...(typeFilter !== 'all' ? { leaveType: typeFilter } : {}),
    ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
    ...(dateFilter ? { date: dateFilter } : {}),
  };

  const {
    data: listRes,
    isLoading: showLoading,
    isError,
    isFetching,
    refetch,
  } = useGetLeaveRequestsQuery(queryParams);

  const { data: statsRes } = useGetLeaveStatsQuery({});

  const [updateStatus, { isLoading: isUpdating }] = useUpdateLeaveStatusMutation();

  const rows = useMemo(
    () => (Array.isArray(listRes?.data) ? listRes.data.map(mapRow) : []),
    [listRes]
  );

  const totalItems = listRes?.count ?? rows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const stats = statsRes?.data ?? { total: 0, pending: 0, approved: 0, rejected: 0 };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSearchChange = (value) => setSearchTerm(value);

  const handleClearSearch = () => setSearchTerm('');

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setSearchTerm('');
    setDebouncedSearch('');
    setDeptFilter('all');
    setTypeFilter('all');
    setStatusFilter('all');
    setDateFilter('');
    setCurrentPage(1);
    await refetch();
    setIsRefreshing(false);
  };

  const handleExport = () => {
    if (rows.length === 0) {
      showErrorToast('No data available to export', 2500);
      return;
    }
    const headers = ['Employee', 'Email', 'Role', 'Leave Type', 'Start', 'End', 'Days', 'Status', 'Reason'];
    const csvRows = rows.map((r) => [
      r.name, r.email, r.role, r.type, r.start, r.end, r.days, r.status, r.reason || '',
    ]);
    const csv = [
      headers.join(','),
      ...csvRows.map((r) =>
        r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leave_requests_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showSuccessToast(`Exported ${csvRows.length} leave requests`, 2500);
  };

  const handleSaveDecision = async ({ id, status, comments }) => {
    try {
      await updateStatus({
        id,
        status,
        adminComments: comments || undefined,
      }).unwrap();
      showSuccessToast(`Leave request ${status.toLowerCase()} successfully`, 2500);
      setActionRecord(null);
    } catch (err) {
      console.error('Update failed:', err);
      showErrorToast(err?.data?.message || 'Failed to update leave request.', 3000);
    }
  };

  const activeFilterCount = [
    deptFilter !== 'all',
    typeFilter !== 'all',
    statusFilter !== 'all',
    !!dateFilter,
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setDeptFilter('all');
    setTypeFilter('all');
    setStatusFilter('all');
    setDateFilter('');
    setSearchTerm('');
    setDebouncedSearch('');
    setCurrentPage(1);
  };

  // ============================================================
  // STATS CONFIG — drives the 4 KPI cards
  // ============================================================
  const statCards = [
    {
      key: 'total',
      label: 'Total Requests',
      value: stats.total,
      icon: Inbox,
      accent: {
        bar: 'bg-gradient-to-r from-[#1C62A0] to-[#3B8FD4]',
        iconBg: 'bg-blue-50',
        iconColor: 'text-[#1C62A0]',
        iconRing: 'ring-blue-100',
        trendLabel: 'All time',
        trendColor: 'text-[#1C62A0]',
      },
    },
    {
      key: 'pending',
      label: 'Pending',
      value: stats.pending,
      icon: Clock,
      accent: {
        bar: 'bg-gradient-to-r from-amber-400 to-amber-500',
        iconBg: 'bg-amber-50',
        iconColor: 'text-amber-600',
        iconRing: 'ring-amber-100',
        trendLabel: 'Awaiting review',
        trendColor: 'text-amber-600',
      },
    },
    {
      key: 'approved',
      label: 'Approved',
      value: stats.approved,
      icon: CheckCircle2,
      accent: {
        bar: 'bg-gradient-to-r from-emerald-400 to-emerald-600',
        iconBg: 'bg-emerald-50',
        iconColor: 'text-emerald-600',
        iconRing: 'ring-emerald-100',
        trendLabel: 'Approved',
        trendColor: 'text-emerald-600',
      },
    },
    {
      key: 'rejected',
      label: 'Rejected',
      value: stats.rejected,
      icon: XCircle,
      accent: {
        bar: 'bg-gradient-to-r from-rose-400 to-rose-500',
        iconBg: 'bg-rose-50',
        iconColor: 'text-rose-600',
        iconRing: 'ring-rose-100',
        trendLabel: 'Declined',
        trendColor: 'text-rose-600',
      },
    },
  ];

  return (
    <div className="w-full min-h-screen max-w-none bg-[#F8FAFC] p-4 md:p-6 font-sans text-gray-800">
      <Breadcrumb
        items={[
          { label: 'Hospital', path: '/hospital' },
          { label: 'Leave Management', path: '/leave' },
          { label: 'Leave Requests', path: '/leave/requests' },
        ]}
      />

      <p className="text-sm text-gray-500 mb-6 -mt-3">
        View and manage leave requests from staff and doctors. Requests can also be received via email.
      </p>

      {/* ─────────────── KPI STATS CARDS ─────────────── */}
      {/* FIX: Forces a 2x2 grid on smaller screens (grid-cols-2), and 4 columns on extra large screens (xl:grid-cols-4) */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {statCards.map((card) => (
          <StatCard
            key={card.key}
            label={card.label}
            value={card.value}
            icon={card.icon}
            accent={card.accent}
            total={stats.total}
            suffix={
              card.key === 'total'
                ? 'requests'
                : card.key === 'pending'
                ? 'awaiting'
                : card.key === 'approved'
                ? 'approved'
                : 'rejected'
            }
          />
        ))}
      </div>

      {/* ─────────────── SEARCH + ACTION BUTTONS ROW ─────────────── */}
      <div className="flex flex-row justify-between items-center gap-3 mb-6 w-full">
        
        {/* Search */}
        <div className="w-full max-w-[320px] xl:max-w-[400px]">
          <SearchBar
            placeholder="Search employees, doctors, or leave requests..."
            value={searchTerm}
            onChange={handleSearchChange}
            onClear={handleClearSearch}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            title="Refresh"
            disabled={isFetching}
            className="shrink-0"
          >
            <RefreshCcw size={16} className={isRefreshing || isFetching ? 'animate-spin' : ''} />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            title="Download"
            className="shrink-0"
          >
            <Download size={16} />
          </Button>

          <FilterBar
            onClick={() => setShowFilters((prev) => !prev)}
            isOpen={showFilters}
            activeFilterCount={activeFilterCount}
            title="Toggle Filters"
            className="shrink-0"
          />
        </div>
      </div>

      {/* ─────────────── FILTER PANEL ─────────────── */}
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
                    {activeFilterCount} Active Filter{activeFilterCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={clearAllFilters}
              className="text-sm font-medium text-red-500 hover:text-red-600"
            >
              Clear All Filters
            </button>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">

            <CustomSelect
              label="Department"
              value={deptFilter}
              options={DEPT_FILTER_OPTIONS}
              onChange={(value) => setDeptFilter(value)}
              placeholder="All Departments"
            />

            <CustomSelect
              label="Leave Type"
              value={typeFilter}
              options={LEAVE_TYPE_FILTER_OPTIONS}
              onChange={(value) => setTypeFilter(value)}
              placeholder="All Leave Types"
            />

            <CustomSelect
              label="Status"
              value={statusFilter}
              options={STATUS_FILTER_OPTIONS}
              onChange={(value) => setStatusFilter(value)}
              placeholder="All Status"
            />

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Date
              </label>

              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full h-12 px-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1C62A0]"
              />
            </div>

          </div>
        </div>
      )}

      {/* TABLE */}
      <div className="w-full max-w-none bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
        <div className="flex flex-col min-h-[500px]">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b border-gray-200 text-xs text-gray-500 bg-gray-50/50">
                  <th className="px-4 py-3 font-medium w-12 whitespace-nowrap">#</th>
                  <th className="px-4 py-3 font-medium min-w-[200px] whitespace-nowrap">Employee</th>
                  <th className="px-4 py-3 font-medium min-w-[100px] whitespace-nowrap">Role</th>
                  <th className="px-4 py-3 font-medium min-w-[120px] whitespace-nowrap">Leave Type</th>
                  <th className="px-4 py-3 font-medium min-w-[200px] whitespace-nowrap">Date Range</th>
                  <th className="px-4 py-3 font-medium min-w-[80px] whitespace-nowrap">Days</th>
                  <th className="px-4 py-3 font-medium min-w-[120px] whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 font-medium min-w-[200px] whitespace-nowrap text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {showLoading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <Loader2 size={36} className="mb-3 animate-spin opacity-60" />
                        <p className="text-sm font-medium text-gray-500">Loading leave requests...</p>
                      </div>
                    </td>
                  </tr>
                ) : isError ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-rose-400">
                        <XCircle size={40} className="mb-3 opacity-70" />
                        <p className="text-sm font-medium text-rose-500">Failed to load leave requests</p>
                      </div>
                    </td>
                  </tr>
                ) : rows.length > 0 ? (
                  rows.map((row, index) => (
                    <tr
                      key={row.id}
                      className="border-b border-gray-100 hover:bg-gray-50/80 transition-colors"
                    >
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-xs flex-shrink-0 ${getAvatarColor(row.role)}`}
                          >
                            {row.initial}
                          </div>
                          <p className="font-medium text-gray-800 whitespace-nowrap">{row.name}</p>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{row.role}</td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${getLeaveTypeBadge(row.type)}`}>
                          {row.type}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {row.start}
                          <ChevronRight size={14} className="text-slate-400" />
                          {row.end}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{row.days}</td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${getStatusBadge(row.status)}`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 flex-shrink-0 ${getStatusDot(row.status)}`}></span>
                          {row.status}
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setDetailsRecord(row)}
                            className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded border border-blue-200 text-xs font-medium transition-colors"
                          >
                            View
                          </button>
                          {row.status === 'Pending' && (
                            <>
                              <button
                                onClick={() => setActionRecord(row)}
                                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => setActionRecord(row)}
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <Search size={40} className="mb-3 opacity-50" />
                        <p className="text-sm font-medium text-gray-500">No leave requests found</p>
                        <p className="text-xs text-gray-400 mt-1">Adjust your filters or search criteria</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {!showLoading && !isError && (
            <div className="mt-auto px-6 py-4 bg-gray-50 border-t border-gray-200">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                itemLabel="leave requests"
              />
            </div>
          )}
        </div>
      </div>

      <LeaveDetailsModal
        isOpen={Boolean(detailsRecord)}
        onClose={() => setDetailsRecord(null)}
        record={detailsRecord}
      />

      <ApproveRejectModal
        isOpen={Boolean(actionRecord)}
        onClose={() => setActionRecord(null)}
        onSave={handleSaveDecision}
        record={actionRecord}
        isLoading={isUpdating}
      />
    </div>
  );
};

export default LeaveRequests;