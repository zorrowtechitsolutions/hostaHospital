// src/components/attendance/Attendance.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  XCircle,
  Search,
  Download,
  LogIn,
  ScanFace,
  CreditCard,
  Clock,
  RefreshCcw,
  Loader2,
  LogOut,
} from 'lucide-react';
import { Breadcrumb } from '../ui/Breadcrumb';
import { Pagination, SearchBar } from '../ui';
import { useGetAttendancesQuery } from '../../../app/service/attendance';

const Attendance = () => {
  const navigate = useNavigate();

  // ============================================================
  // STATE MANAGEMENT
  // ============================================================
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [attTypeFilter, setAttTypeFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ============================================================
  // API (server-side filters — method stays frontend-only)
  // ============================================================
  const {
    data: attendanceResponse,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetAttendancesQuery({
    today: true,
    search: searchTerm || undefined,
    department: deptFilter !== 'all' ? deptFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    type:
      attTypeFilter === 'Check In'
        ? 'check-in'
        : attTypeFilter === 'Check Out'
          ? 'check-out'
          : undefined,
  });

  const attendanceData = attendanceResponse?.data ?? [];

  // ============================================================
  // NORMALIZE ROW
  // ============================================================
  const normalizeRow = (row, index) => {
    const name = row.name || 'Unknown';
    const role =
      row.employeeType ||
      (Array.isArray(row.roles) ? row.roles[0] : row.roles) ||
      'Staff';
    const dept = row.department || '-';

    let attType = '-';
    if (row.type === 'check-in') attType = 'Check In';
    else if (row.type === 'check-out') attType = 'Check Out';

    const method = row.method || '-';

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

    const dateSource =
      row.date || row.timestamp || row.checkInTime || row.checkOutTime;
    const date = formatDate(dateSource);

    const duration = row.duration || '-';

    const statusMap = {
      Present: 'Present',
      Late: 'Late',
      Absent: 'Absent',
      'On Leave': 'On Leave',
      'Half Day': 'Half Day',
      'Early Departure': 'Early Departure',
      'Shift Completed': 'Shift Completed',
      verified: 'Present',
      checked_in: 'Present',
      checked_out: 'Shift Completed',
    };
    const status = statusMap[row.status] || row.status || 'Present';

    // ✅ Grab the employee id from every possible field
    const employeeId =
      row.userId?._id || row.userId || row.employeeId || row.roleId || null;

    return {
      id: row.id || row._id || index,
      employeeId,
      name,
      role,
      dept,
      attType,
      method,
      date,
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
  // FRONTEND-ONLY FILTER: Method
  // ============================================================
  const filteredData = useMemo(() => {
    return normalizedData.filter((row) => {
      const matchesMethod =
        methodFilter === 'all' || row.method === methodFilter;
      return matchesMethod;
    });
  }, [normalizedData, methodFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, deptFilter, statusFilter, methodFilter, attTypeFilter]);

  const totalItems = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // ============================================================
  // ✅ Navigate to employee detail
  // ============================================================
  const handleEmployeeClick = (row) => {
    if (!row.employeeId) {
      console.warn('No employee id available for row:', row);
      return;
    }
    navigate(`/attendance/employee/${row.employeeId}`, {
      state: { employeeName: row.name },
    });
  };

  // ============================================================
  // HANDLERS (unchanged)
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

  // Badge helpers — unchanged
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Present': return 'bg-green-50 text-green-700 border-green-200';
      case 'Late': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Absent': return 'bg-red-50 text-red-700 border-red-200';
      case 'On Leave': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Half Day': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Early Departure': return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Shift Completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusDot = (status) => {
    switch (status) {
      case 'Present': return 'bg-green-500';
      case 'Late': return 'bg-amber-500';
      case 'Absent': return 'bg-red-500';
      case 'On Leave': return 'bg-purple-500';
      case 'Half Day': return 'bg-orange-500';
      case 'Early Departure': return 'bg-sky-500';
      case 'Shift Completed': return 'bg-emerald-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'Check In': return 'bg-green-50 text-green-700';
      case 'Check Out': return 'bg-blue-50 text-blue-700';
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
      case 'Half Day': return 'bg-orange-500';
      case 'Early Departure': return 'bg-sky-500';
      case 'Shift Completed': return 'bg-emerald-500';
      default: return 'bg-gray-500';
    }
  };

  const departments = [
    ...new Set(
      normalizedData.map((row) => row.dept).filter((d) => d && d !== '-')
    ),
  ];

  const showLoading = isLoading || (isFetching && !attendanceResponse);

  // ============================================================
  // RENDER (only Name cell changed — rest identical)
  // ============================================================
  return (
    <div className="w-full min-h-screen max-w-none bg-[#F8FAFC] p-4 md:p-6 font-sans text-gray-800">
      <Breadcrumb
        items={[
          { label: 'Hospital', path: '/hospital' },
          { label: 'Attendance', path: '/attendance' },
        ]}
      />

      <p className="text-sm text-gray-500 mb-6 -mt-3">
        Track and manage attendance for all hospital roles assigned to your
        hospital.
      </p>

      {/* Filters toolbar — unchanged */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
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
            <option value="Early Departure">Early Departure</option>
            <option value="Shift Completed">Shift Completed</option>
            <option value="Half Day">Half Day</option>
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
        </div>

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

      {/* Table */}
      <div className="w-full max-w-none bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="border-b border-gray-200 text-xs text-gray-500 bg-gray-50/50">
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Date</th>
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
                  <td colSpan={11} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <Loader2 size={36} className="mb-3 animate-spin opacity-60" />
                      <p className="text-sm font-medium text-gray-500">
                        Loading attendance records...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-rose-400">
                      <XCircle size={40} className="mb-3 opacity-70" />
                      <p className="text-sm font-medium text-rose-500">
                        Failed to load attendance records
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Please check your connection and try again
                      </p>
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((row, index) => (
                  <tr
                    key={row.id}
                    className="border-b border-gray-100 hover:bg-gray-50/80 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-500">
                      {startIndex + index + 1}
                    </td>

                    {/* ✅ Clickable Name cell */}
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleEmployeeClick(row)}
                        className="flex items-center gap-3 text-left group cursor-pointer"
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-xs ${getAvatarColor(row.status)}`}
                        >
                          {row.name.split(' ')[1]?.charAt(0) || row.name.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-800 group-hover:text-[#1C62A0] group-hover:underline transition-colors">
                          {row.name}
                        </span>
                      </button>
                    </td>

                    <td className="px-4 py-3 text-gray-600">{row.role}</td>
                    <td className="px-4 py-3 text-gray-600">{row.dept}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {row.date}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-md text-[11px] font-medium tracking-wide ${getTypeBadge(row.attType)}`}
                      >
                        {row.attType === 'Check In' && <LogIn size={12} className="mr-1" />}
                        {row.attType === 'Check Out' && <LogOut size={12} className="mr-1" />}
                        {row.attType}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      {row.method !== '-' ? (
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-md text-[11px] font-medium tracking-wide ${getMethodBadge(row.method)}`}
                        >
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
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadge(row.status)}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full mr-1.5 ${getStatusDot(row.status)}`}
                        ></span>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <Search size={40} className="mb-3 opacity-50" />
                      <p className="text-sm font-medium text-gray-500">
                        No attendance records found
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Try adjusting your search or filter criteria
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

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