// src/components/attendance/ManualAttendance.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  XCircle,
  Search,
  Download,
  RefreshCcw,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Calendar,
} from 'lucide-react';
import { Breadcrumb } from '../ui/Breadcrumb';
import { Pagination, SearchBar, Modal, Button, CustomSelect } from '../ui';
import {
  useGetAttendancesQuery,
  useCreateAttendanceMutation,
  useCreateManualAttendanceMutation,
  useUpdateAttendanceMutation,
  useDeleteAttendanceMutation,
} from '../../../app/service/attendance';
import {
  showSuccessToast,
  showErrorToast,
} from '../ui/Toast';
import { useGetDoctorsQuery } from '../../../app/service/doctorApi';
import { useGetStaffQuery } from '../../../app/service/staffApi';

// ============================================================
// HELPERS
// ============================================================
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

const toLocalISO = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const to24 = (value) => {
  if (!value) return '';
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  } catch {
    return '';
  }
};

const getTodayISO = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const STATUS_OPTIONS = [
  'Present',
  'Late',
  'Early Departure',
  'Shift Completed',
  'Half Day',
  'Absent',
  'On Leave',
];

const MANUAL_METHODS = ['Manual', 'Punch In'];

// ============================================================
// BADGE HELPERS
// ============================================================
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

// ============================================================
// ADD / EDIT MODAL
// ============================================================
const ManualAttendanceModal = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  employees,
  isLoading,
}) => {
  const isEdit = Boolean(initialData?.id);

  const [form, setForm] = useState({
    employeeValue: '', // composite "Doctor:<id>" | "Staff:<id>"
    date: getTodayISO(),
    checkInTime: '09:00',
    checkOutTime: '18:00',
    status: 'Present',
    method: 'Manual',
    notes: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    if (isEdit && initialData) {
      const employeeType = initialData.employeeType || 'Staff';
      setForm({
        employeeValue: initialData.employeeId
          ? `${employeeType}:${initialData.employeeId}`
          : '',
        date: initialData.dateISO || getTodayISO(),
        checkInTime: initialData.checkIn24 || '09:00',
        checkOutTime: initialData.checkOut24 || '18:00',
        status: initialData.status || 'Present',
        method: 'Manual',
        notes: initialData.notes || '',
      });
    } else {
      setForm({
        employeeValue: '',
        date: getTodayISO(),
        checkInTime: '09:00',
        checkOutTime: '18:00',
        status: 'Present',
        method: 'Manual',
        notes: '',
      });
    }
    setErrors({});
  }, [isOpen, isEdit, initialData]);

  const validate = () => {
    const e = {};
    if (!form.employeeValue) e.employeeValue = 'Please select an employee';
    if (!form.date) e.date = 'Date is required';
    if (!form.status) e.status = 'Status is required';
    if (
      form.status !== 'Absent' &&
      form.status !== 'On Leave' &&
      !form.checkInTime
    ) {
      e.checkInTime = 'Check-in time is required';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSave({ ...form, method: 'Manual' });
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Manual Attendance' : 'Add Manual Attendance'}
      size="md"
    >
      <div className="space-y-4">
        {/* ✅ Employee — CustomSelect */}
        <div>
          <CustomSelect
            label="Employee"
            value={form.employeeValue}
            options={employees.map((emp) => ({
              value: `${emp.type}:${emp.id}`,
              label: emp.label
            }))}
            onChange={(value) => handleChange('employeeValue', value)}
            placeholder="Select employee…"
            error={errors.employeeValue}
            touched={true}
            required
            disabled={isEdit}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type="date"
                value={form.date}
                onChange={(e) => handleChange('date', e.target.value)}
                className={`w-full h-11 pl-9 pr-4 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent ${
                  errors.date ? 'border-red-300' : 'border-gray-200'
                }`}
              />
            </div>
            {errors.date && (
              <p className="text-xs text-red-500 mt-1">{errors.date}</p>
            )}
          </div>

          {/* ✅ Status — CustomSelect */}
          <div>
            <CustomSelect
              label="Status"
              value={form.status}
              options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
              onChange={(value) => handleChange('status', value)}
              placeholder="Select status"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Check-In Time
            </label>
            <input
              type="time"
              value={form.checkInTime}
              onChange={(e) => handleChange('checkInTime', e.target.value)}
              disabled={form.status === 'Absent' || form.status === 'On Leave'}
              className={`w-full h-11 px-4 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent ${
                errors.checkInTime ? 'border-red-300' : 'border-gray-200'
              } ${
                form.status === 'Absent' || form.status === 'On Leave'
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
            />
            {errors.checkInTime && (
              <p className="text-xs text-red-500 mt-1">{errors.checkInTime}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Check-Out Time
            </label>
            <input
              type="time"
              value={form.checkOutTime}
              onChange={(e) => handleChange('checkOutTime', e.target.value)}
              disabled={form.status === 'Absent' || form.status === 'On Leave'}
              className={`w-full h-11 px-4 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent ${
                form.status === 'Absent' || form.status === 'On Leave'
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
            />
          </div>
        </div>

        {/* Method is fixed to Manual */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Method
          </label>
          <input
            type="text"
            value="Manual"
            readOnly
            disabled
            className="w-full h-11 px-4 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 outline-none cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Notes (optional)
          </label>
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="e.g. Forgot to punch in, corrected by admin…"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent resize-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            disabled={isLoading}
            loading={isLoading}
          >
            {isEdit ? 'Update Attendance' : 'Add Attendance'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// ============================================================
// DELETE CONFIRM MODAL
// ============================================================
const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  record,
  isLoading,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900">
              Delete attendance record?
            </h3>
          </div>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed mb-6">
          This will permanently delete the attendance record for{' '}
          <strong>{record?.name}</strong> on{' '}
          <strong>{record?.date}</strong>. This action cannot be undone.
        </p>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={onConfirm}
            disabled={isLoading}
            loading={isLoading}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const ManualAttendance = () => {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [showModal, setShowModal] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [deleteRecord, setDeleteRecord] = useState(null);

  const {
    data: attendanceResponse,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetAttendancesQuery({
    search: searchTerm || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    date: dateFilter || undefined,
    limit: 1000,
  });

  const { data: doctorsResponse } = useGetDoctorsQuery({ page: 1, limit: 1000 });
  const { data: staffResponse } = useGetStaffQuery({ page: 1, limit: 1000 });

  const [createAttendance, { isLoading: isCreating }] =
    useCreateAttendanceMutation();
  const [createManualAttendance, { isLoading: isCreatingManual }] =
    useCreateManualAttendanceMutation();
  const [updateAttendance, { isLoading: isUpdating }] =
    useUpdateAttendanceMutation();
  const [deleteAttendance, { isLoading: isDeleting }] =
    useDeleteAttendanceMutation();

  const attendanceData = attendanceResponse?.data ?? [];

  const employeeOptions = useMemo(() => {
    const doctors = (doctorsResponse?.data || []).map((d) => ({
      id: d._id ?? d.id,
      label: `${
        d.displayName ||
        `${d.firstName || ''} ${d.lastName || ''}`.trim() ||
        d.name ||
        'Doctor'
      } — #DR${String(d.doctorNumber || d.id).padStart(4, '0')}`,
      type: 'Doctor',
      department: d.department || '',
    }));

    const staff = (staffResponse?.data || []).map((s) => ({
      id: s._id ?? s.id,
      label: `${
        s.name ||
        `${s.firstName || ''} ${s.lastName || ''}`.trim() ||
        'Staff'
      } — #STF${String(s.staffNumber || s.id).padStart(5, '0')}`,
      type: 'Staff',
      department: s.department || '',
    }));

    return [...doctors, ...staff];
  }, [doctorsResponse, staffResponse]);

  const normalizeRow = (row, index) => {
    const name = row.name || 'Unknown';

    const role =
      row.employeeType ||
      (Array.isArray(row.roles) ? row.roles[0] : row.roles) ||
      'Staff';

    const dept = row.department || '-';
    const method = row.method || 'Manual';

    const checkIn = formatTime(row.checkInTime);
    const checkOut = formatTime(row.checkOutTime);

    const dateSource =
      row.date || row.timestamp || row.checkInTime || row.checkOutTime;

    const date = formatDate(dateSource);
    const dateISO = toLocalISO(dateSource);
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

    const employeeId =
      row.employeeId ??
      row.userId?._id ??
      row.userId ??
      row.roleId ??
      null;

    const employeeType =
      row.employeeType ||
      (row.doctorId ? 'Doctor' : null) ||
      (row.staffId ? 'Staff' : null) ||
      (String(role).toLowerCase().includes('doctor') ? 'Doctor' : 'Staff');

    return {
      id: row.id || row._id || index,
      employeeId,
      employeeType,
      name,
      role,
      dept,
      method,
      date,
      dateISO,
      checkIn,
      checkOut,
      checkIn24: to24(row.checkInTime),
      checkOut24: to24(row.checkOutTime),
      duration,
      status,
      notes: row.notes || '',
      raw: row,
    };
  };

  const normalizedData = useMemo(
    () =>
      attendanceData
        .filter((row) => MANUAL_METHODS.includes(row.method || 'Manual'))
        .map((row, i) => normalizeRow(row, i)),
    [attendanceData]
  );

  const filteredData = useMemo(() => {
    return normalizedData.filter((row) => {
      const matchesDept = deptFilter === 'all' || row.dept === deptFilter;
      return matchesDept;
    });
  }, [normalizedData, deptFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, deptFilter, statusFilter, dateFilter]);

  const totalItems = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleAddClick = () => {
    setEditRecord(null);
    setShowModal(true);
  };

  const handleEditClick = (row) => {
    setEditRecord(row);
    setShowModal(true);
  };

  const handleDeleteClick = (row) => {
    setDeleteRecord(row);
  };

  const handleEmployeeClick = (row) => {
    if (!row.employeeId) {
      console.warn('No employee id available for row:', row);
      return;
    }
    navigate(`/attendance/employee/${row.employeeId}`, {
      state: { employeeName: row.name },
    });
  };

  const handleSave = async (form) => {
    try {
      const [employeeType, employeeIdRaw] = (form.employeeValue || '').split(':');
      const employeeId = employeeIdRaw || '';

      const employee = employeeOptions.find(
        (e) =>
          e.type === employeeType &&
          String(e.id) === String(employeeId)
      );

      if (!employee) {
        showErrorToast('Please select a valid employee.', 3000);
        return;
      }

      if (editRecord?.id) {
        const checkInISO = form.checkInTime
          ? new Date(`${form.date}T${form.checkInTime}:00`).toISOString()
          : undefined;

        const checkOutISO = form.checkOutTime
          ? new Date(`${form.date}T${form.checkOutTime}:00`).toISOString()
          : undefined;

        await updateAttendance({
          id: editRecord.id,
          data: {
            date: form.date,
            status: form.status,
            method: 'Manual',
            checkInTime: checkInISO,
            checkOutTime: checkOutISO,
            notes: form.notes,
            employeeType: employee.type,
          },
        }).unwrap();

        showSuccessToast('Attendance updated successfully', 2500);
      } else {
        await createManualAttendance({
          employeeId: employee.id,
          employeeType: employee.type,
          date: form.date,
          checkInTime: form.checkInTime,
          checkOutTime: form.checkOutTime,
          status: form.status,
          method: 'Manual',
          notes: form.notes,
          department: employee?.department || undefined,
        }).unwrap();

        showSuccessToast('Manual attendance added successfully', 2500);
      }

      setShowModal(false);
      setEditRecord(null);
      await refetch();
    } catch (err) {
      console.error('Save failed:', err);
      showErrorToast(
        err?.data?.message || 'Failed to save attendance. Please try again.',
        3000
      );
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteRecord?.id) return;
    try {
      await deleteAttendance(deleteRecord.id).unwrap();
      showSuccessToast('Attendance record deleted successfully', 2500);
      setDeleteRecord(null);
      await refetch();
    } catch (err) {
      console.error('Delete failed:', err);
      showErrorToast(
        err?.data?.message || 'Failed to delete attendance. Please try again.',
        3000
      );
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
    setDateFilter('');
    setCurrentPage(1);
    try {
      await refetch();
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  const handleExport = () => {
    // TODO: wire up your excel export util
  };

  const departments = [
    ...new Set(
      normalizedData.map((row) => row.dept).filter((d) => d && d !== '-')
    ),
  ];

  const showLoading = isLoading || (isFetching && !attendanceResponse);

  return (
    <div className="w-full min-h-screen max-w-none bg-[#F8FAFC] p-4 md:p-6 font-sans text-gray-800">
      <Breadcrumb
        items={[
          { label: 'Hospital', path: '/hospital' },
          { label: 'Attendance', path: '/attendance' },
          { label: 'Manual Attendance', path: '/attendance/manual' },
        ]}
      />

      {/* ─────────────── TOOLBAR ─────────────── */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <div className="flex-1 min-w-[220px]">
          <SearchBar
            placeholder="Search..."
            value={searchTerm}
            onChange={handleSearchChange}
            onClear={handleClearSearch}
          />
        </div>

        {/* ✅ Department filter — CustomSelect */}
        <div className="w-full sm:w-48 -mt-1">
          <CustomSelect
            label=""
            value={deptFilter}
            options={[
              { value: 'all', label: 'All Departments' },
              ...departments.map((dept) => ({ value: dept, label: dept }))
            ]}
            onChange={(value) => setDeptFilter(value)}
            placeholder="All Departments"
          />
        </div>

        {/* ✅ Status filter — CustomSelect */}
        <div className="w-full sm:w-44 -mt-1">
          <CustomSelect
            label=""
            value={statusFilter}
            options={[
              { value: 'all', label: 'All Status' },
              ...STATUS_OPTIONS.map((s) => ({ value: s, label: s }))
            ]}
            onChange={(value) => setStatusFilter(value)}
            placeholder="All Status"
          />
        </div>

        {/* Date filter — native date input is fine on mobile */}
        <div className="relative">
          <Calendar
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="h-9 border border-gray-200 rounded-md pl-8 pr-2.5 text-sm text-gray-600 bg-white focus:outline-none focus:ring-1 focus:ring-[#1C62A0] shadow-sm cursor-pointer"
          />
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            type="button"
            variant="primary"
            onClick={handleAddClick}
            className="inline-flex items-center gap-2 h-9"
          >
            <Plus size={16} />
            Add Attendance
          </Button>

          <button
            onClick={handleRefresh}
            className="p-2 h-9 w-9 flex items-center justify-center border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50 transition-colors"
            title="Refresh"
          >
            <RefreshCcw
              size={16}
              className={isRefreshing ? 'animate-spin' : ''}
            />
          </button>

          <button
            onClick={handleExport}
            className="p-2 h-9 w-9 flex items-center justify-center border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50 transition-colors"
            title="Export to Excel"
          >
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="w-full max-w-none bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
        <div className="flex flex-col min-h-[500px]">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b border-gray-200 text-xs text-gray-500 bg-gray-50/50">
                  <th className="px-4 py-3 font-medium w-12 whitespace-nowrap">#</th>
                  <th className="px-4 py-3 font-medium min-w-[200px] whitespace-nowrap">Name</th>
                  <th className="px-4 py-3 font-medium min-w-[120px] whitespace-nowrap">Role</th>
                  <th className="px-4 py-3 font-medium min-w-[140px] whitespace-nowrap">Department</th>
                  <th className="px-4 py-3 font-medium min-w-[120px] whitespace-nowrap">Date</th>
                  <th className="px-4 py-3 font-medium min-w-[110px] whitespace-nowrap">Check In</th>
                  <th className="px-4 py-3 font-medium min-w-[110px] whitespace-nowrap">Check Out</th>
                  <th className="px-4 py-3 font-medium min-w-[100px] whitespace-nowrap">Duration</th>
                  <th className="px-4 py-3 font-medium min-w-[150px] whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 font-medium min-w-[120px] whitespace-nowrap text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {showLoading ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <Loader2 size={36} className="mb-3 animate-spin opacity-60" />
                        <p className="text-sm font-medium text-gray-500">
                          Loading manual attendance records...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : isError ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center">
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
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {startIndex + index + 1}
                      </td>

                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleEmployeeClick(row)}
                          className="flex items-center gap-3 text-left group cursor-pointer min-w-0"
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-xs flex-shrink-0 ${getAvatarColor(row.status)}`}
                          >
                            {row.name.split(' ')[1]?.charAt(0) || row.name.charAt(0)}
                          </div>
                          <span className="font-medium text-gray-800 group-hover:text-[#1C62A0] group-hover:underline transition-colors whitespace-nowrap">
                            {row.name}
                          </span>
                        </button>
                      </td>

                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{row.role}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{row.dept}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{row.date}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{row.checkIn}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{row.checkOut}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{row.duration}</td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${getStatusBadge(row.status)}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full mr-1.5 flex-shrink-0 ${getStatusDot(row.status)}`}
                          ></span>
                          {row.status}
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleEditClick(row)}
                            className="w-8 h-8 flex items-center justify-center rounded-md text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            title="Edit"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(row)}
                            className="w-8 h-8 flex items-center justify-center rounded-md text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <Search size={40} className="mb-3 opacity-50" />
                        <p className="text-sm font-medium text-gray-500">
                          No manual attendance records found
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Click <strong>Add Attendance</strong> to create one, or
                          adjust your filters
                        </p>
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
                itemLabel="attendance records"
              />
            </div>
          )}
        </div>
      </div>

      <ManualAttendanceModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditRecord(null);
        }}
        onSave={handleSave}
        initialData={editRecord}
        employees={employeeOptions}
        isLoading={isCreating || isCreatingManual || isUpdating}
      />

      <DeleteConfirmModal
        isOpen={Boolean(deleteRecord)}
        onClose={() => setDeleteRecord(null)}
        onConfirm={handleConfirmDelete}
        record={deleteRecord}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default ManualAttendance;