// src/components/leave/MyLeaveRequests.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Plus,
  Bell,
  HelpCircle,
  Phone,
  FilePlus,
  Trash2,
} from 'lucide-react';
import { Breadcrumb } from '../ui/Breadcrumb';
import { Pagination, SearchBar, Modal, Button } from '../ui';
import MiniCalendar from './MiniCalendar';

// ✅ API
import {
  useGetLeaveRequestsQuery,
  useGetLeaveStatsQuery,
  useCancelLeaveRequestMutation,
  useDeleteLeaveRequestMutation,
} from '../../../app/service/leaverequest';
import { getAuthUser } from '../../utils/auth';

// ============================================================
// HELPERS
// ============================================================
const LEAVE_TYPES = [
  { label: 'Casual', color: 'bg-blue-100 text-blue-700' },
  { label: 'Sick', color: 'bg-red-100 text-red-700' },
  { label: 'Maternity', color: 'bg-purple-100 text-purple-700' },
  { label: 'Annual', color: 'bg-green-100 text-green-700' },
];

const getStatusBadge = (status) => {
  switch (status) {
    case 'Approved':  return 'bg-green-50 text-green-700 border-green-200';
    case 'Pending':   return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Rejected':  return 'bg-red-50 text-red-700 border-red-200';
    case 'Cancelled': return 'bg-slate-100 text-slate-600 border-slate-300';
    default:          return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

const getStatusDot = (status) => {
  switch (status) {
    case 'Approved':  return 'bg-green-500';
    case 'Pending':   return 'bg-amber-500';
    case 'Rejected':  return 'bg-red-500';
    case 'Cancelled': return 'bg-slate-400';
    default:          return 'bg-gray-500';
  }
};

const getLeaveTypeBadge = (type) => {
  const found = LEAVE_TYPES.find(
    (t) => t.label.toLowerCase() === (type || '').toLowerCase()
  );
  return found ? found.color : 'bg-slate-100 text-slate-700';
};

const toISO = (str) => {
  if (!str) return null;
  const d = new Date(str);
  if (isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const formatDate = (v) =>
  v
    ? new Date(v).toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '-';

const mapRow = (r) => ({
  id: r.id ?? r._id,
  name: r.employeeName || 'You',
  type: r.leaveType,
  start: formatDate(r.startDate),
  end: formatDate(r.endDate),
  startISO: toISO(r.startDate),
  endISO: toISO(r.endDate),
  days: r.totalDays,
  reason: r.reason,
  status: r.status,
  appliedOn: formatDate(r.appliedAt || r.createdAt),
  adminComments: r.adminComments,
});

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
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg bg-blue-500">
              {record.name?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="font-semibold text-gray-800">{record.name}</p>
              <p className="text-xs text-slate-500">Leave Request</p>
            </div>
          </div>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadge(record.status)}`}>
            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${getStatusDot(record.status)}`}></span>
            {record.status}
          </span>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Leave Information</h4>
          <div className="bg-slate-50 rounded-lg p-4 text-sm space-y-3 border border-slate-100">
            <div className="flex justify-between">
              <span className="text-slate-500">Leave Type</span>
              <span className="font-medium">{record.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date Range</span>
              <span className="font-medium">{record.start} → {record.end}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Days</span>
              <span className="font-medium">{record.days} Days</span>
            </div>
            <div className="pt-2 border-t flex flex-col gap-1 border-slate-200">
              <span className="text-slate-500">Reason</span>
              <span className="font-medium text-slate-700">{record.reason}</span>
            </div>
            {record.adminComments && (
              <div className="pt-2 border-t flex flex-col gap-1 border-slate-200">
                <span className="text-slate-500">Admin Comments</span>
                <span className="font-medium text-slate-700">{record.adminComments}</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Request Information</h4>
          <div className="text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Applied On</span>
              <span className="font-medium">{record.appliedOn}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t mt-4">
        <Button variant="secondary" onClick={onClose}>Close</Button>
      </div>
    </Modal>
  );
};

// ============================================================
// CANCEL CONFIRM MODAL
// ============================================================
const CancelConfirmModal = ({ isOpen, onClose, record, onConfirm, isLoading }) => {
  if (!isOpen || !record) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cancel Leave Request" size="sm">
      <div className="flex items-start gap-3">
        <div className="bg-red-50 p-2.5 rounded-lg flex-shrink-0">
          <XCircle className="text-red-600 w-5 h-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-700">
            Are you sure you want to cancel this leave request?
          </p>
          <div className="mt-3 bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Type</span>
              <span className="font-medium">{record.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Dates</span>
              <span className="font-medium">{record.start} → {record.end}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Days</span>
              <span className="font-medium">{record.days}</span>
            </div>
          </div>
          <p className="text-xs text-red-500 mt-3">This action cannot be undone.</p>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t mt-4">
        <Button variant="secondary" onClick={onClose} disabled={isLoading}>
          Keep Request
        </Button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className="bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors"
        >
          {isLoading ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Cancelling...
            </>
          ) : (
            'Yes, Cancel'
          )}
        </button>
      </div>
    </Modal>
  );
};

// ============================================================
// DELETE CONFIRM MODAL
// ============================================================
const DeleteConfirmModal = ({ isOpen, onClose, record, onConfirm, isLoading }) => {
  if (!isOpen || !record) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Leave Request" size="sm">
      <div className="flex items-start gap-3">
        <div className="bg-red-50 p-2.5 rounded-lg flex-shrink-0">
          <Trash2 className="text-red-600 w-5 h-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-700">
            Are you sure you want to permanently delete this leave request?
          </p>
          <div className="mt-3 bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Type</span>
              <span className="font-medium">{record.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Dates</span>
              <span className="font-medium">{record.start} → {record.end}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Days</span>
              <span className="font-medium">{record.days}</span>
            </div>
          </div>
          <p className="text-xs text-red-500 mt-3">
            This action is permanent and cannot be undone.
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t mt-4">
        <Button variant="secondary" onClick={onClose} disabled={isLoading}>
          Keep Request
        </Button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className="bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors"
        >
          {isLoading ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Deleting...
            </>
          ) : (
            'Yes, Delete'
          )}
        </button>
      </div>
    </Modal>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const MyLeaveRequests = () => {
  const navigate = useNavigate();
  const auth = getAuthUser();
  const employeeId = auth?.employeeId ?? auth?.id ?? auth?.userId ?? auth?.doctorId;

  const [activeTab, setActiveTab] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [detailsRecord, setDetailsRecord] = useState(null);

  // ✅ Cancel + Delete state
  const [cancelRecord, setCancelRecord] = useState(null);
  const [deleteRecord, setDeleteRecord] = useState(null);

  const tabs = ['All', 'Pending', 'Approved', 'Rejected', 'Cancelled'];

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, typeFilter, debouncedSearch]);

  const queryParams = {
    employeeId,
    page: currentPage,
    limit: itemsPerPage,
    ...(activeTab !== 'All' ? { status: activeTab } : {}),
    ...(typeFilter !== 'all' ? { leaveType: typeFilter } : {}),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  };

  const {
    data: listRes,
    isLoading: showLoading,
    isError,
    isFetching,
    refetch,
  } = useGetLeaveRequestsQuery(queryParams, { skip: !employeeId });

  const { data: statsRes } = useGetLeaveStatsQuery(
    { employeeId },
    { skip: !employeeId }
  );

  // ✅ Mutations
  const [cancelLeaveRequest, { isLoading: isCancelling }] =
    useCancelLeaveRequestMutation();
  const [deleteLeaveRequest, { isLoading: isDeleting }] =
    useDeleteLeaveRequestMutation();

  const rows = useMemo(
    () => (Array.isArray(listRes?.data) ? listRes.data.map(mapRow) : []),
    [listRes]
  );

  const totalItems = listRes?.count ?? rows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const stats = statsRes?.data ?? { total: 0, pending: 0, approved: 0, rejected: 0 };

  const calendarLeaves = useMemo(
    () => rows.map((r) => ({ start: r.startISO, end: r.endISO, status: r.status })),
    [rows]
  );

  const recentActivity = useMemo(() => {
    return rows.slice(0, 4).map((r) => ({
      id: r.id,
      type: r.status.toLowerCase(),
      text: `Your leave request for ${r.start} – ${r.end} (${r.type}) is ${r.status.toLowerCase()}.`,
      time: r.appliedOn,
    }));
  }, [rows]);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'pending':   return <Clock size={16} className="text-amber-500" />;
      case 'approved':  return <CheckCircle2 size={16} className="text-green-500" />;
      case 'rejected':  return <XCircle size={16} className="text-red-500" />;
      case 'cancelled': return <XCircle size={16} className="text-slate-400" />;
      default:          return <Mail size={16} className="text-blue-500" />;
    }
  };

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
    setActiveTab('All');
    setTypeFilter('all');
    setCurrentPage(1);
    await refetch();
    setIsRefreshing(false);
  };

  const handleExport = () => {
    if (rows.length === 0) return;
    const headers = ['Leave Type', 'Start', 'End', 'Days', 'Reason', 'Status', 'Applied On'];
    const csvRows = rows.map((r) => [r.type, r.start, r.end, r.days, r.reason, r.status, r.appliedOn]);
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
    a.download = `my_leaves_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCalendarDayClick = (isoDate) => {
    const match = rows.find((r) => isoDate >= r.startISO && isoDate <= r.endISO);
    if (match) setDetailsRecord(match);
  };

  // ✅ Cancel handler
  const handleConfirmCancel = async () => {
    if (!cancelRecord) return;
    try {
      await cancelLeaveRequest(cancelRecord.id).unwrap();
      setCancelRecord(null);
      refetch();
    } catch (err) {
      console.error('Cancel failed:', err);
    }
  };

  // ✅ Delete handler
  const handleConfirmDelete = async () => {
    if (!deleteRecord) return;
    try {
      await deleteLeaveRequest(deleteRecord.id).unwrap();
      setDeleteRecord(null);
      refetch();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const userName = auth?.name || auth?.employeeName || 'User';

  return (
    <div className="w-full min-h-screen max-w-none bg-[#F8FAFC] p-4 md:p-6 font-sans text-gray-800">
      <Breadcrumb
        items={[
          { label: 'Hospital', path: '/hospital' },
          { label: 'Leave Management', path: '/leave' },
          { label: 'My Leave Requests', path: '/leave/my-requests' },
        ]}
      />

      <div className="flex justify-between items-start mb-6 -mt-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            Good Morning, {userName} !
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Here's your leave management overview and recent updates.
          </p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-gray-700">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#FFFBF0] border border-[#FDE6B4] p-4 rounded-xl flex items-center gap-4 shadow-sm">
          <div className="bg-[#FDE6B4] p-3 rounded-lg text-[#D97706]"><Calendar size={20} /></div>
          <div>
            <p className="text-sm text-slate-600 font-medium">Total Requests</p>
            <p className="text-xl font-bold text-gray-800">{stats.total}</p>
          </div>
        </div>
        <div className="bg-[#F0F7FF] border border-[#BEE3F8] p-4 rounded-xl flex items-center gap-4 shadow-sm">
          <div className="bg-[#BEE3F8] p-3 rounded-lg text-[#2563EB]"><Clock size={20} /></div>
          <div>
            <p className="text-sm text-slate-600 font-medium">Pending</p>
            <p className="text-xl font-bold text-gray-800">{stats.pending}</p>
          </div>
        </div>
        <div className="bg-[#F0FDF4] border border-[#BBF7D0] p-4 rounded-xl flex items-center gap-4 shadow-sm">
          <div className="bg-[#BBF7D0] p-3 rounded-lg text-[#16A34A]"><CheckCircle2 size={20} /></div>
          <div>
            <p className="text-sm text-slate-600 font-medium">Approved</p>
            <p className="text-xl font-bold text-gray-800">{stats.approved}</p>
          </div>
        </div>
        <div className="bg-[#FEF2F2] border border-[#FECACA] p-4 rounded-xl flex items-center gap-4 shadow-sm">
          <div className="bg-[#FECACA] p-3 rounded-lg text-[#DC2626]"><XCircle size={20} /></div>
          <div>
            <p className="text-sm text-slate-600 font-medium">Rejected</p>
            <p className="text-xl font-bold text-gray-800">{stats.rejected}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-white border border-gray-200 p-1 rounded-lg shadow-sm">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    activeTab === tab
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex flex-1 gap-3 w-full lg:w-auto flex-wrap items-center">
              <SearchBar
                placeholder="Search by date, type or reason..."
                value={searchTerm}
                onChange={handleSearchChange}
                onClear={handleClearSearch}
                className="flex-1 min-w-[250px] max-w-sm"
              />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-600 bg-white focus:outline-none focus:ring-1 focus:ring-[#1C62A0] shadow-sm cursor-pointer"
              >
                <option value="all">All Leave Types</option>
                {LEAVE_TYPES.map((t) => (
                  <option key={t.label} value={t.label}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 flex-wrap items-center">
              <button
                onClick={handleRefresh}
                className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50 transition-colors"
                title="Refresh"
              >
                <RefreshCcw size={16} className={isRefreshing || isFetching ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={handleExport}
                className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50 transition-colors"
                title="Export to Excel"
              >
                <Download size={16} />
              </button>
            </div>
          </div>

          <div className="w-full max-w-none bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
            <div className="flex flex-col min-h-[500px]">
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse min-w-[1250px]">
                  <thead>
                    <tr className="border-b border-gray-200 text-xs text-gray-500 bg-gray-50/50">
                      <th className="px-4 py-3 font-medium w-12 whitespace-nowrap">#</th>
                      <th className="px-4 py-3 font-medium min-w-[120px] whitespace-nowrap">Leave Type</th>
                      <th className="px-4 py-3 font-medium min-w-[140px] whitespace-nowrap">Start Date</th>
                      <th className="px-4 py-3 font-medium min-w-[140px] whitespace-nowrap">End Date</th>
                      <th className="px-4 py-3 font-medium min-w-[80px] whitespace-nowrap">Days</th>
                      <th className="px-4 py-3 font-medium min-w-[200px] whitespace-nowrap">Reason</th>
                      <th className="px-4 py-3 font-medium min-w-[140px] whitespace-nowrap">Status</th>
                      <th className="px-4 py-3 font-medium min-w-[140px] whitespace-nowrap">Applied On</th>
                      <th className="px-4 py-3 font-medium min-w-[230px] whitespace-nowrap text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {showLoading ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-12 text-center">
                          <div className="flex flex-col items-center justify-center text-gray-400">
                            <Loader2 size={36} className="mb-3 animate-spin opacity-60" />
                            <p className="text-sm font-medium text-gray-500">Loading leave requests...</p>
                          </div>
                        </td>
                      </tr>
                    ) : isError ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-12 text-center">
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
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${getLeaveTypeBadge(row.type)}`}>
                              {row.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{row.start}</td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{row.end}</td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{row.days}</td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap truncate max-w-[220px]" title={row.reason}>
                            {row.reason}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${getStatusBadge(row.status)}`}>
                              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 flex-shrink-0 ${getStatusDot(row.status)}`}></span>
                              {row.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{row.appliedOn}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => setDetailsRecord(row)}
                                className="text-blue-600 hover:bg-blue-50 px-2.5 py-1 rounded border border-blue-200 text-xs font-medium transition-colors"
                              >
                                View
                              </button>

                              {row.status === 'Pending' && (
                                <button
                                  onClick={() => setCancelRecord(row)}
                                  className="text-amber-600 hover:bg-amber-50 px-2.5 py-1 rounded border border-amber-200 text-xs font-medium transition-colors flex items-center gap-1"
                                >
                                  <XCircle size={12} /> Cancel
                                </button>
                              )}

                              {(row.status === 'Pending' || row.status === 'Cancelled') && (
                                <button
                                  onClick={() => setDeleteRecord(row)}
                                  className="text-red-600 hover:bg-red-50 px-2.5 py-1 rounded border border-red-200 text-xs font-medium transition-colors flex items-center gap-1"
                                >
                                  <Trash2 size={12} /> Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className="px-4 py-12 text-center">
                          <div className="flex flex-col items-center justify-center text-gray-400">
                            <Search size={40} className="mb-3 opacity-50" />
                            <p className="text-sm font-medium text-gray-500">No leave requests found</p>
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

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Bell size={16} className="text-slate-500" /> Recent Activity
            </h3>
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-slate-400">No recent activity yet.</p>
              ) : (
                recentActivity.map((act) => (
                  <div key={act.id} className="flex items-start gap-3 text-sm">
                    <div className="mt-0.5">{getActivityIcon(act.type)}</div>
                    <div className="flex-1">
                      <p className="text-gray-700">{act.text}</p>
                    </div>
                    <div className="text-xs text-slate-400 whitespace-nowrap">{act.time}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-50 p-2.5 rounded-lg">
                <FilePlus className="text-blue-600 w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Apply for Leave</h3>
                <p className="text-xs text-slate-500">Request a new leave by filling the form.</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/leave/add')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Plus size={16} /> New Leave Request
            </button>
          </div>

          <MiniCalendar leaves={calendarLeaves} onDayClick={handleCalendarDayClick} />
        </div>
      </div>

      <LeaveDetailsModal
        isOpen={Boolean(detailsRecord)}
        onClose={() => setDetailsRecord(null)}
        record={detailsRecord}
      />

      {/* ✅ Cancel Confirmation Modal */}
      <CancelConfirmModal
        isOpen={Boolean(cancelRecord)}
        onClose={() => setCancelRecord(null)}
        record={cancelRecord}
        onConfirm={handleConfirmCancel}
        isLoading={isCancelling}
      />

      {/* ✅ Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteRecord)}
        onClose={() => setDeleteRecord(null)}
        record={deleteRecord}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default MyLeaveRequests;