// src/components/attendance/Attendance.jsx
import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  CalendarDays,
  Search,
  Download,
  LogIn,
  ScanFace,
  CreditCard,
  TrendingUp,
  TrendingDown,
  RefreshCcw,
  Loader2,
} from 'lucide-react';
import { Breadcrumb } from '../ui/Breadcrumb';
import { Pagination, SearchBar } from '../ui';
import { useGetAttendancesQuery } from '../../../app/service/attendance';

const Attendance = () => {
  // ============================================================
  // STATE MANAGEMENT
  // ============================================================
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [attTypeFilter, setAttTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ============================================================
  // API
  // ============================================================
  const {
    data: attendanceResponse,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetAttendancesQuery({});

  const attendanceData = attendanceResponse?.data ?? [];

  // ============================================================
  // NORMALIZE API ROW → DISPLAY ROW
  // ============================================================
  const normalizeRow = (row, index) => {
    const name = row.name || 'Unknown';
    const role = row.employeeType || (Array.isArray(row.roles) ? row.roles[0] : row.roles) || 'Staff';
    const dept = row.department || '-';

    // Attendance type label
    let attType = '-';
    if (row.type === 'check-in') attType = 'Check In';
    else if (row.type === 'check-out') attType = 'Check Out';

    // Method
    const method = row.method || '-';

    // Times
    const formatTime = (value) => {
      if (!value) return '-';
      try {
        return new Date(value).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
      } catch {
        return '-';
      }
    };
    const checkIn = formatTime(row.checkInTime);
    const checkOut = formatTime(row.checkOutTime);

    // Duration
    const duration = row.duration || '-';

    // Status mapping (backend status → display status)
    const statusMap = {
      Present: 'Present',
      Late: 'Late',
      verified: 'Present',
      'Early Departure': 'Present',
      'Shift Completed': 'Present',
    };
    const status = statusMap[row.status] || row.status || 'Present';

    return {
      id: row.id || row._id || index,
      name,
      role,
      dept,
      attType,
      method,
      checkIn,
      checkOut,
      duration,
      status,
      raw: row,
    };
  };

  const normalizedData = useMemo(
    () => attendanceData.map((row, i) => normalizeRow(row, i)),
    [attendanceData]
  );

  // ============================================================
  // FILTERING & PAGINATION LOGIC
  // ============================================================

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, deptFilter, statusFilter, methodFilter, attTypeFilter, dateFilter]);

  const filteredData = useMemo(() => {
    return normalizedData.filter((row) => {
      const searchLower = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !searchLower ||
        row.name.toLowerCase().includes(searchLower) ||
        row.dept.toLowerCase().includes(searchLower) ||
        row.role.toLowerCase().includes(searchLower);

      const matchesDept = deptFilter === 'all' || row.dept === deptFilter;
      const matchesStatus = statusFilter === 'all' || row.status === statusFilter;
      const matchesMethod = methodFilter === 'all' || row.method === methodFilter;
      const matchesAttType = attTypeFilter === 'all' || row.attType === attTypeFilter;

      const matchesDate =
        !dateFilter ||
        (row.raw?.date && row.raw.date.slice(0, 10) === dateFilter) ||
        (row.raw?.timestamp && new Date(row.raw.timestamp).toISOString().slice(0, 10) === dateFilter);

      return (
        matchesSearch &&
        matchesDept &&
        matchesStatus &&
        matchesMethod &&
        matchesAttType &&
        matchesDate
      );
    });
  }, [normalizedData, searchTerm, deptFilter, statusFilter, methodFilter, attTypeFilter, dateFilter]);

  const totalItems = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // ============================================================
  // HANDLERS
  // ============================================================

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setSearchTerm('');
    setDeptFilter('all');
    setStatusFilter('all');
    setMethodFilter('all');
    setAttTypeFilter('all');
    setDateFilter('');
    setCurrentPage(1);
    try {
      await refetch();
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  const handleExport = () => {
    console.log('Exporting:', filteredData.length, 'records');
  };

  // ============================================================
  // BADGE HELPERS
  // ============================================================
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Present': return 'bg-green-50 text-green-700 border-green-200';
      case 'Late': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Absent': return 'bg-red-50 text-red-700 border-red-200';
      case 'On Leave': return 'bg-purple-50 text-purple-700 border-purple-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusDot = (status) => {
    switch (status) {
      case 'Present': return 'bg-green-500';
      case 'Late': return 'bg-amber-500';
      case 'Absent': return 'bg-red-500';
      case 'On Leave': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'Check In': return 'bg-green-50 text-green-700';
      case 'Check Out': return 'bg-blue-50 text-blue-700';
      case 'Absent': return 'bg-red-50 text-red-700';
      case 'On Leave': return 'bg-purple-50 text-purple-700';
      case 'Late': return 'bg-amber-50 text-amber-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  const getMethodBadge = (method) => {
    switch (method) {
      case 'Face': return 'bg-blue-50 text-blue-700';
      case 'Access Card': return 'bg-emerald-50 text-emerald-700';
      case 'Punch In': return 'bg-purple-50 text-purple-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  const getAvatarColor = (status) => {
    switch (status) {
      case 'Present': return 'bg-blue-500';
      case 'Late': return 'bg-indigo-500';
      case 'Absent': return 'bg-blue-700';
      case 'On Leave': return 'bg-cyan-500';
      default: return 'bg-gray-500';
    }
  };

  // ============================================================
  // KPI CARDS (derived from API data)
  // ============================================================
  const totalCount = normalizedData.length;
  const presentCount = normalizedData.filter((r) => r.status === 'Present').length;
  const lateCount = normalizedData.filter((r) => r.status === 'Late').length;
  const absentCount = normalizedData.filter((r) => r.status === 'Absent').length;
  const leaveCount = normalizedData.filter((r) => r.status === 'On Leave').length;

  const pct = (n) => (totalCount ? Math.round((n / totalCount) * 100) : 0);

  const kpiCards = [
    { id: 'total', label: 'Total Assigned Roles', value: String(totalCount), subtext: `Doctors ${normalizedData.filter(r => r.role === 'Doctor').length} | Nurses ${normalizedData.filter(r => r.role === 'Nurse').length} | Others ${normalizedData.filter(r => r.role !== 'Doctor' && r.role !== 'Nurse').length}`, icon: Users, iconBg: 'from-indigo-500 to-blue-500', cardBg: 'from-indigo-50/80 to-white', border: 'border-indigo-100', progress: 100, progressColor: 'bg-gradient-to-r from-indigo-500 to-blue-500', trend: '+3', trendUp: true },
    { id: 'present', label: 'Present', value: String(presentCount), subtext: `${pct(presentCount)}% of total`, icon: CheckCircle2, iconBg: 'from-emerald-500 to-green-500', cardBg: 'from-emerald-50/80 to-white', border: 'border-emerald-100', progress: pct(presentCount), progressColor: 'bg-gradient-to-r from-emerald-500 to-green-500', trend: '+5%', trendUp: true },
    { id: 'late', label: 'Late', value: String(lateCount), subtext: `${pct(lateCount)}% of total`, icon: Clock, iconBg: 'from-amber-500 to-orange-500', cardBg: 'from-amber-50/80 to-white', border: 'border-amber-100', progress: pct(lateCount), progressColor: 'bg-gradient-to-r from-amber-500 to-orange-500', trend: '-2%', trendUp: false },
    { id: 'absent', label: 'Absent', value: String(absentCount), subtext: `${pct(absentCount)}% of total`, icon: XCircle, iconBg: 'from-rose-500 to-red-500', cardBg: 'from-rose-50/80 to-white', border: 'border-rose-100', progress: pct(absentCount), progressColor: 'bg-gradient-to-r from-rose-500 to-red-500', trend: '+1%', trendUp: false },
    { id: 'leave', label: 'On Leave', value: String(leaveCount), subtext: `${pct(leaveCount)}% of total`, icon: CalendarDays, iconBg: 'from-purple-500 to-fuchsia-500', cardBg: 'from-purple-50/80 to-white', border: 'border-purple-100', progress: pct(leaveCount), progressColor: 'bg-gradient-to-r from-purple-500 to-fuchsia-500', trend: '0%', trendUp: true },
  ];

  const departments = [...new Set(normalizedData.map((row) => row.dept).filter((d) => d && d !== '-'))];

  // ============================================================
  // RENDER
  // ============================================================
  const showLoading = isLoading || (isFetching && !attendanceResponse);

  return (
    <div className="w-full min-h-screen max-w-none bg-[#F8FAFC] p-4 md:p-6 font-sans text-gray-800">

      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Hospital', path: '/hospital' },
          { label: 'Attendance', path: '/attendance' },
        ]}
      />

      {/* Subtitle */}
      <p className="text-sm text-gray-500 mb-6 -mt-3">
        Track and manage attendance for all hospital roles assigned to your hospital.
      </p>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              className={`relative overflow-hidden bg-gradient-to-br ${card.cardBg} border ${card.border} rounded-xl p-4 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_25px_-5px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 transition-all duration-300 min-h-[110px] flex flex-col justify-between group`}
            >
              <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br ${card.iconBg} opacity-[0.08] group-hover:opacity-[0.15] transition-opacity duration-300`}></div>

              <div className="flex justify-between items-start mb-2 relative z-10">
                <div className={`bg-gradient-to-br ${card.iconBg} p-2 rounded-lg text-white shadow-md`}>
                  <Icon size={16} strokeWidth={2.5} />
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                  card.trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                }`}>
                  {card.trendUp ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                  {card.trend}
                </div>
              </div>

              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-0.5 relative z-10">
                {card.label}
              </p>

              <p className="text-2xl font-bold text-gray-900 mb-1.5 relative z-10 leading-none">
                {card.value}
              </p>

              <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden mb-1.5 relative z-10">
                <div
                  className={`h-full ${card.progressColor} rounded-full transition-all duration-500`}
                  style={{ width: `${card.progress}%` }}
                ></div>
              </div>

              <p className="text-[10px] text-gray-400 leading-tight relative z-10 truncate">
                {card.subtext}
              </p>
            </div>
          );
        })}
      </div>

      {/* SEARCH + FILTERS TOOLBAR */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">

        {/* Left: Search + Filters */}
        <div className="flex flex-1 gap-3 w-full lg:w-auto flex-wrap items-center">
          <SearchBar
            placeholder="Search by name, department, role..."
            value={searchTerm}
            onChange={handleSearchChange}
            onClear={handleClearSearch}
            className="flex-1 min-w-[250px] max-w-sm"
          />

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-600 bg-white focus:outline-none focus:ring-1 focus:ring-[#1C62A0] shadow-sm cursor-pointer"
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-600 bg-white focus:outline-none focus:ring-1 focus:ring-[#1C62A0] shadow-sm cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="Present">Present</option>
            <option value="Late">Late</option>
            <option value="Absent">Absent</option>
            <option value="On Leave">On Leave</option>
          </select>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-600 bg-white focus:outline-none focus:ring-1 focus:ring-[#1C62A0] shadow-sm cursor-pointer"
          >
            <option value="all">All Methods</option>
            <option value="Face">Face</option>
            <option value="Access Card">Access Card</option>
            <option value="Punch In">Punch In</option>
          </select>

          <select
            value={attTypeFilter}
            onChange={(e) => setAttTypeFilter(e.target.value)}
            className="border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-600 bg-white focus:outline-none focus:ring-1 focus:ring-[#1C62A0] shadow-sm cursor-pointer"
          >
            <option value="all">All Attendance Types</option>
            <option value="Check In">Check In</option>
            <option value="Check Out">Check Out</option>
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="border border-gray-200 rounded-md px-3 py-2 text-sm bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#1C62A0] shadow-sm cursor-pointer"
          />
        </div>

        {/* Right: Action Buttons */}
        <div className="flex gap-2 flex-wrap items-center">
          <button
            onClick={handleRefresh}
            className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50 transition-colors"
            title="Refresh"
          >
            <RefreshCcw size={16} className={isRefreshing ? 'animate-spin' : ''} />
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

      {/* TABLE CARD */}
      <div className="w-full max-w-none bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-gray-200 text-xs text-gray-500 bg-gray-50/50">
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Attendance Type</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium">Check In</th>
                <th className="px-4 py-3 font-medium">Check Out</th>
                <th className="px-4 py-3 font-medium">Duration</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {showLoading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <Loader2 size={36} className="mb-3 animate-spin opacity-60" />
                      <p className="text-sm font-medium text-gray-500">Loading attendance records...</p>
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-rose-400">
                      <XCircle size={40} className="mb-3 opacity-70" />
                      <p className="text-sm font-medium text-rose-500">Failed to load attendance records</p>
                      <p className="text-xs text-gray-400 mt-1">Please check your connection and try again</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((row, index) => (
                  <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3 text-gray-500">{startIndex + index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-xs ${getAvatarColor(row.status)}`}>
                          {row.name.split(' ')[1]?.charAt(0) || row.name.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-800">{row.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{row.role}</td>
                    <td className="px-4 py-3 text-gray-600">{row.dept}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-[11px] font-medium tracking-wide ${getTypeBadge(row.attType)}`}>
                        {row.attType === 'Check In' && <LogIn size={12} className="mr-1" />}
                        {row.attType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {row.method !== '-' ? (
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-[11px] font-medium tracking-wide ${getMethodBadge(row.method)}`}>
                          {row.method === 'Face' && <ScanFace size={12} className="mr-1" />}
                          {row.method === 'Access Card' && <CreditCard size={12} className="mr-1" />}
                          {row.method === 'Punch In' && <Clock size={12} className="mr-1" />}
                          {row.method}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-center block w-full">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{row.checkIn}</td>
                    <td className="px-4 py-3 text-gray-600">{row.checkOut}</td>
                    <td className="px-4 py-3 text-gray-600">{row.duration}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadge(row.status)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${getStatusDot(row.status)}`}></span>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <Search size={40} className="mb-3 opacity-50" />
                      <p className="text-sm font-medium text-gray-500">No attendance records found</p>
                      <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filter criteria</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!showLoading && !isError && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            itemLabel="attendance records"
          />
        )}
      </div>
    </div>
  );
};

export default Attendance;