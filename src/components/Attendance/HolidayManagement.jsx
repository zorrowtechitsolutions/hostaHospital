// src/components/attendance/HolidayManagement.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Download,
  RefreshCcw,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  PartyPopper,
  Sparkles,
  Sun,
  Flag,
} from 'lucide-react';
import { Breadcrumb } from '../ui/Breadcrumb';
import { Pagination, SearchBar, Modal, Button, CustomSelect } from '../ui';
import {
  showSuccessToast,
  showErrorToast,
} from '../ui/Toast';
import {
  useGetHolidaysQuery,
  useCreateHolidayMutation,
  useUpdateHolidayMutation,
  useDeleteHolidayMutation,
} from '../../../app/service/holidayApi';

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

const toISODate = (value) => {
  if (!value) return '';
  try {
    return new Date(value).toISOString().split('T')[0];
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

const HOLIDAY_TYPES = [
  'Public Holiday',
  'National Holiday',
  'Religious Holiday',
  'Festival',
  'Company Holiday',
  'Optional Holiday',
  'Other',
];

const getTypeBadge = (type) => {
  switch (type) {
    case 'Public Holiday': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'National Holiday': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'Religious Holiday': return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'Festival': return 'bg-pink-50 text-pink-700 border-pink-200';
    case 'Company Holiday': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Optional Holiday': return 'bg-amber-50 text-amber-700 border-amber-200';
    default: return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

const getTypeIcon = (type) => {
  switch (type) {
    case 'Festival': return <PartyPopper size={12} />;
    case 'National Holiday': return <Flag size={12} />;
    case 'Optional Holiday': return <Sun size={12} />;
    default: return <Sparkles size={12} />;
  }
};

// ============================================================
// ADD / EDIT MODAL
// ============================================================
const HolidayModal = ({ isOpen, onClose, onSave, initialData, isLoading }) => {
  const isEdit = Boolean(initialData?.id);

  const [form, setForm] = useState({
    name: '',
    date: getTodayISO(),
    endDate: '',
    type: 'Public Holiday',
    description: '',
    isRecurring: false,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    if (isEdit && initialData) {
      setForm({
        name: initialData.name || '',
        date: initialData.dateISO || getTodayISO(),
        endDate: initialData.endDateISO || '',
        type: initialData.type || 'Public Holiday',
        description: initialData.description || '',
        isRecurring: Boolean(initialData.isRecurring),
      });
    } else {
      setForm({
        name: '',
        date: getTodayISO(),
        endDate: '',
        type: 'Public Holiday',
        description: '',
        isRecurring: false,
      });
    }
    setErrors({});
  }, [isOpen, isEdit, initialData]);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Holiday name is required';
    if (!form.date) e.date = 'Start date is required';
    if (form.endDate && form.endDate < form.date) {
      e.endDate = 'End date cannot be before start date';
    }
    if (!form.type) e.type = 'Holiday type is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSave(form);
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Holiday' : 'Add Holiday'}
      size="md"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Holiday Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="e.g. Diwali, Independence Day…"
            className={`w-full h-11 px-4 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent ${
              errors.name ? 'border-red-300' : 'border-gray-200'
            }`}
          />
          {errors.name && (
            <p className="text-xs text-red-500 mt-1">{errors.name}</p>
          )}
        </div>

        {/* ✅ Holiday Type — CustomSelect */}
        <div>
          <CustomSelect
            label="Holiday Type"
            value={form.type}
            options={HOLIDAY_TYPES.map((t) => ({ value: t, label: t }))}
            onChange={(value) => handleChange('type', value)}
            placeholder="Select holiday type"
            error={errors.type}
            touched={true}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Start Date <span className="text-red-500">*</span>
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

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              End Date (optional)
            </label>
            <div className="relative">
              <Calendar
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type="date"
                value={form.endDate}
                min={form.date}
                onChange={(e) => handleChange('endDate', e.target.value)}
                className={`w-full h-11 pl-9 pr-4 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent ${
                  errors.endDate ? 'border-red-300' : 'border-gray-200'
                }`}
              />
            </div>
            {errors.endDate && (
              <p className="text-xs text-red-500 mt-1">{errors.endDate}</p>
            )}
            <p className="text-[11px] text-gray-400 mt-1">
              Leave empty for a single-day holiday
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="isRecurring"
            type="checkbox"
            checked={form.isRecurring}
            onChange={(e) => handleChange('isRecurring', e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-[#1C62A0] focus:ring-[#1C62A0] cursor-pointer"
          />
          <label
            htmlFor="isRecurring"
            className="text-sm text-gray-700 cursor-pointer select-none"
          >
            Repeats every year on this date
          </label>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Description (optional)
          </label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Additional notes about this holiday…"
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
            {isEdit ? 'Update Holiday' : 'Add Holiday'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// ============================================================
// DELETE CONFIRM MODAL
// ============================================================
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, holiday, isLoading }) => {
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
              Delete holiday?
            </h3>
          </div>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed mb-6">
          This will permanently delete <strong>{holiday?.name}</strong> on{' '}
          <strong>{holiday?.date}</strong>. Any existing attendance records for
          this date will not be affected. This action cannot be undone.
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
            Delete Holiday
          </Button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const HolidayManagement = () => {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState(String(new Date().getFullYear()));
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const {
    data: holidaysResponse,
    isLoading,
    isFetching,
    refetch,
  } = useGetHolidaysQuery({
    year: yearFilter || undefined,
    skipHospitalFilter: false,
  });

  const [createHoliday, { isLoading: isCreating }] = useCreateHolidayMutation();
  const [updateHoliday, { isLoading: isUpdating }] = useUpdateHolidayMutation();
  const [deleteHolidayApi, { isLoading: isDeleting }] = useDeleteHolidayMutation();

  const [showModal, setShowModal] = useState(false);
  const [editHoliday, setEditHoliday] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const normalizeRow = (row, index) => {
    const dateSource = row.startDate || row.date || row.holidayDate;
    const endSource = row.endDate;

    return {
      id: row.id || row._id || index,
      name: row.name || row.title || 'Untitled Holiday',
      type: row.type || row.holidayType || 'Public Holiday',
      date: formatDate(dateSource),
      dateISO: toISODate(dateSource),
      endDate: endSource ? formatDate(endSource) : '-',
      endDateISO: endSource ? toISODate(endSource) : '',
      description: row.description || row.notes || '',
      isRecurring: Boolean(row.repeatsAnnually ?? row.isRecurring ?? row.recurring),
      createdBy: row.createdBy?.name || row.createdBy || '-',
      createdAt: formatDate(row.createdAt),
      raw: row,
    };
  };

  const holidays = useMemo(() => {
    const list = Array.isArray(holidaysResponse?.data)
      ? holidaysResponse.data
      : holidaysResponse?.data
      ? [holidaysResponse.data]
      : [];
    return list.map((row, i) => normalizeRow(row, i));
  }, [holidaysResponse]);

  const filteredData = useMemo(() => {
    let result = [...holidays];

    if (typeFilter !== 'all') {
      result = result.filter((h) => h.type === typeFilter);
    }

    if (searchTerm && searchTerm.trim().length >= 2) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter((h) =>
        [h.name, h.type, h.description]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(q))
      );
    }

    return result.sort((a, b) => {
      if (!a.dateISO) return 1;
      if (!b.dateISO) return -1;
      return a.dateISO.localeCompare(b.dateISO);
    });
  }, [holidays, typeFilter, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, yearFilter]);

  const totalItems = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleAddClick = () => {
    setEditHoliday(null);
    setShowModal(true);
  };

  const handleEditClick = (row) => {
    setEditHoliday(row);
    setShowModal(true);
  };

  const handleDeleteClick = (row) => {
    setDeleteTarget(row);
  };

  const handleSave = async (form) => {
    try {
      const payload = {
        name: form.name.trim(),
        startDate: new Date(form.date).toISOString(),
        endDate: form.endDate
          ? new Date(form.endDate).toISOString()
          : new Date(form.date).toISOString(),
        type: form.type,
        description: form.description?.trim() || '',
        repeatsAnnually: Boolean(form.isRecurring),
        isActive: true,
      };

      if (editHoliday?.id) {
        await updateHoliday({
          id: editHoliday.id,
          data: payload,
        }).unwrap();
        showSuccessToast('Holiday updated successfully', 2500);
      } else {
        await createHoliday(payload).unwrap();
        showSuccessToast('Holiday added successfully', 2500);
      }

      setShowModal(false);
      setEditHoliday(null);
    } catch (err) {
      console.error('Save failed:', err);
      showErrorToast(
        err?.data?.message || 'Failed to save holiday. Please try again.',
        3000
      );
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget?.id) return;

    try {
      await deleteHolidayApi(deleteTarget.id).unwrap();
      showSuccessToast('Holiday deleted successfully', 2500);
      setDeleteTarget(null);
    } catch (err) {
      console.error('Delete failed:', err);
      showErrorToast(
        err?.data?.message || 'Failed to delete holiday. Please try again.',
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
    setSearchTerm('');
    setTypeFilter('all');
    setYearFilter(String(new Date().getFullYear()));
    setCurrentPage(1);

    try {
      await refetch().unwrap();
      showSuccessToast('Refreshed holidays list', 2000);
    } catch (err) {
      showErrorToast('Failed to refresh holidays', 2500);
    }
  };

  const handleExport = () => {
    if (filteredData.length === 0) {
      showErrorToast('No data available to export', 2500);
      return;
    }

    const headers = ['Holiday Name', 'Type', 'Start Date', 'End Date', 'Recurring', 'Description'];
    const rows = filteredData.map((h) => [
      h.name,
      h.type,
      h.date,
      h.endDate,
      h.isRecurring ? 'Yes' : 'No',
      h.description || '',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `holidays_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showSuccessToast(`Exported ${rows.length} holidays`, 2500);
  };

  const showLoading = isLoading;
  const isSaving = isCreating || isUpdating;

  const stats = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const thisYear = holidays.filter(
      (h) => h.dateISO && h.dateISO.startsWith(String(currentYear))
    ).length;
    const upcoming = holidays.filter(
      (h) => h.dateISO && h.dateISO >= getTodayISO()
    ).length;
    return { total: holidays.length, thisYear, upcoming };
  }, [holidays]);

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 7 }, (_, i) => String(currentYear - 3 + i));
  }, []);

  return (
    <div className="w-full min-h-screen max-w-none bg-[#F8FAFC] p-4 md:p-6 font-sans text-gray-800">
      <Breadcrumb
        items={[
          { label: 'Hospital', path: '/hospital' },
          { label: 'Attendance', path: '/attendance' },
          { label: 'Holidays', path: '/attendance/holidays' },
        ]}
      />

      <p className="text-sm text-gray-500 mb-6 -mt-3">
        Store and manage the list of public, religious, and company holidays.
        Attendance sheets automatically mark these dates as holidays.
      </p>

      {/* Stats chips */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="bg-white border border-gray-200 text-sm px-3 py-1.5 rounded-md shadow-sm flex items-center gap-2">
          <Calendar size={14} className="text-indigo-500" />
          Total Holidays: {stats.total}
        </span>
        <span className="bg-white border border-gray-200 text-sm px-3 py-1.5 rounded-md shadow-sm flex items-center gap-2">
          <Flag size={14} className="text-blue-500" />
          This Year: {stats.thisYear}
        </span>
        <span className="bg-white border border-gray-200 text-sm px-3 py-1.5 rounded-md shadow-sm flex items-center gap-2">
          <Sparkles size={14} className="text-emerald-500" />
          Upcoming: {stats.upcoming}
        </span>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <div className="flex-1 min-w-[220px]">
          <SearchBar
            placeholder="Search holiday by name…"
            value={searchTerm}
            onChange={handleSearchChange}
            onClear={handleClearSearch}
          />
        </div>

        {/* ✅ Type filter — CustomSelect */}
        <div className="w-full sm:w-44 -mt-1">
          <CustomSelect
            label=""
            value={typeFilter}
            options={[
              { value: 'all', label: 'All Types' },
              ...HOLIDAY_TYPES.map((t) => ({ value: t, label: t }))
            ]}
            onChange={(value) => setTypeFilter(value)}
            placeholder="All Types"
          />
        </div>

        {/* ✅ Year filter — CustomSelect */}
        <div className="w-full sm:w-32 -mt-1">
          <CustomSelect
            label=""
            value={yearFilter}
            options={[
              { value: '', label: 'All Years' },
              ...yearOptions.map((y) => ({ value: y, label: y }))
            ]}
            onChange={(value) => setYearFilter(value)}
            placeholder="All Years"
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
            Add Holiday
          </Button>

          <button
            onClick={handleRefresh}
            className="p-2 h-9 w-9 flex items-center justify-center border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50 transition-colors"
            title="Refresh"
          >
            <RefreshCcw size={16} className={isFetching ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={handleExport}
            className="p-2 h-9 w-9 flex items-center justify-center border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50 transition-colors"
            title="Export"
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
                  <th className="px-4 py-3 font-medium min-w-[220px] whitespace-nowrap">Holiday Name</th>
                  <th className="px-4 py-3 font-medium min-w-[180px] whitespace-nowrap">Type</th>
                  <th className="px-4 py-3 font-medium min-w-[140px] whitespace-nowrap">Start Date</th>
                  <th className="px-4 py-3 font-medium min-w-[140px] whitespace-nowrap">End Date</th>
                  <th className="px-4 py-3 font-medium min-w-[120px] whitespace-nowrap">Recurring</th>
                  <th className="px-4 py-3 font-medium min-w-[200px] whitespace-nowrap">Description</th>
                  <th className="px-4 py-3 font-medium min-w-[140px] whitespace-nowrap text-center">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {showLoading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <Loader2 size={36} className="mb-3 animate-spin opacity-60" />
                        <p className="text-sm font-medium text-gray-500">
                          Loading holidays...
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
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                            <Calendar size={14} className="text-indigo-500" />
                          </div>
                          <span className="font-medium text-gray-800 whitespace-nowrap">
                            {row.name}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border whitespace-nowrap ${getTypeBadge(
                            row.type
                          )}`}
                        >
                          {getTypeIcon(row.type)}
                          {row.type}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {row.date}
                      </td>

                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {row.endDate}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {row.isRecurring ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                            <RefreshCcw size={11} />
                            Yearly
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-gray-600">
                        <span
                          className="block truncate max-w-[220px]"
                          title={row.description}
                        >
                          {row.description || '—'}
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
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <Calendar size={40} className="mb-3 opacity-50" />
                        <p className="text-sm font-medium text-gray-500">
                          No holidays found
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Click <strong>Add Holiday</strong> to store one
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {!showLoading && (
            <div className="mt-auto px-6 py-4 bg-gray-50 border-t border-gray-200">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                itemLabel="holidays"
              />
            </div>
          )}
        </div>
      </div>

      <HolidayModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditHoliday(null);
        }}
        onSave={handleSave}
        initialData={editHoliday}
        isLoading={isSaving}
      />

      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        holiday={deleteTarget}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default HolidayManagement;