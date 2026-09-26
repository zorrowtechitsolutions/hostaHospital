// src/components/devices/Device.jsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; // ✅ CHANGED: added
import {
  XCircle,
  Search,
  Plus,
  Loader2,
  MoreHorizontal,
  Eye,
  Edit,
  Power,
  UserX,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Info,
} from 'lucide-react';
import { Breadcrumb } from '../../ui/Breadcrumb';
import { Pagination, SearchBar } from '../../ui';
import { Button } from '../../ui/button';
// ✅ CHANGED: removed EditDeviceModal import (no more edit modal)
// ✅ CHANGED: removed RegisterDeviceModal import (already gone)
import DeviceDetails from './DeviceDetails';
import DeviceCredentialsModal from './credentials/DeviceCredentialsModal';
import DeleteModal from '../../patients/DeleteModel';
import {
  useGetDevicesQuery,
  useUnregisterDeviceMutation,
  usePermanentlyDeleteDeviceMutation,
  useUpdateDeviceMutation,
  useRestoreDeviceMutation,
} from '../../../../app/service/device';
import { showSuccessToast, showErrorToast } from '../../ui/Toast';

/* ------------------------------------------------------------------ */
/* Popup: Confirm dialog (replaces window.confirm)                     */
/* ------------------------------------------------------------------ */
const ConfirmModal = ({
  isOpen,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loading = false,
  variant = 'danger',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={loading ? undefined : onCancel}
      />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm p-5">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-9 h-9 shrink-0 rounded-full bg-amber-50 flex items-center justify-center">
            <AlertTriangle size={18} className="text-amber-600" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            {message && (
              <p className="text-sm text-gray-600 mt-1 break-words">{message}</p>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-3.5 py-2 rounded-md border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {cancelLabel}
          </button>

          {isDanger ? (
            <button
              onClick={onConfirm}
              disabled={loading}
              className="px-3.5 py-2 rounded-md text-sm bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {confirmLabel}
            </button>
          ) : (
            <Button
              onClick={onConfirm}
              disabled={loading}
              className="flex items-center gap-1.5"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {confirmLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Popup: Alert message (replaces window.alert)                        */
/* ------------------------------------------------------------------ */
const AlertModal = ({ isOpen, type = 'info', title, message, onClose }) => {
  if (!isOpen) return null;

  const config = {
    success: {
      Icon: CheckCircle2,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
      btn: 'bg-green-600 hover:bg-green-700 text-white',
      defaultTitle: 'Success',
    },
    error: {
      Icon: AlertCircle,
      iconBg: 'bg-red-50',
      iconColor: 'text-red-600',
      btn: 'bg-red-600 hover:bg-red-700 text-white',
      defaultTitle: 'Error',
    },
    warning: {
      Icon: AlertTriangle,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      btn: 'bg-amber-600 hover:bg-amber-700 text-white',
      defaultTitle: 'Warning',
    },
    info: {
      Icon: Info,
      iconBg: 'bg-blue-50',
      iconColor: 'text-[#1C62A0]',
      btn: 'bg-[#1C62A0] hover:bg-[#154a7a] text-white',
      defaultTitle: 'Notice',
    },
  };

  const { Icon, iconBg, iconColor, btn, defaultTitle } =
    config[type] || config.info;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm p-5">
        <div className="flex items-start gap-3 mb-5">
          <div
            className={`w-9 h-9 shrink-0 rounded-full ${iconBg} flex items-center justify-center`}
          >
            <Icon size={18} className={iconColor} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-900">
              {title || defaultTitle}
            </h3>
            {message && (
              <p className="text-sm text-gray-600 mt-1 break-words">{message}</p>
            )}
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className={`px-3.5 py-2 rounded-md text-sm ${btn}`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */
const Device = () => {
  const navigate = useNavigate(); // ✅ CHANGED: used for register + edit navigation

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [openDropdownId, setOpenDropdownId] = useState(null);
  const dropdownRef = useRef(null);

  // ✅ CHANGED: removed isModalOpen (register modal)
  // ✅ CHANGED: removed isEditModalOpen + deviceToEdit (edit modal)

  // Selected device for the details view
  const [selectedDevice, setSelectedDevice] = useState(null);

  // Restore credentials (shown after successful restore)
  const [restoredCredentials, setRestoredCredentials] = useState(null);

  /* ── Popup state ── */
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    variant: 'danger',
    action: null,
  });
  const [alertState, setAlertState] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
  });
  const [deviceToDelete, setDeviceToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const showAlert = (type, message, title) =>
    setAlertState({ isOpen: true, type, message, title });

  const openConfirm = ({
    title,
    message,
    confirmLabel,
    variant = 'danger',
    action,
  }) =>
    setConfirmState({
      isOpen: true,
      title,
      message,
      confirmLabel: confirmLabel || 'Confirm',
      variant,
      action,
    });

  const closeConfirm = () =>
    setConfirmState((s) => ({ ...s, isOpen: false, action: null }));

  const handleConfirmClick = async () => {
    const action = confirmState.action;
    if (!action) return closeConfirm();
    try {
      await action();
    } finally {
      closeConfirm();
    }
  };

  // ============================================================
  // API
  // ============================================================
  const {
    data: deviceResponse,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetDevicesQuery({
    search: searchTerm || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    type: typeFilter !== 'all' ? typeFilter : undefined,
    location: locationFilter !== 'all' ? locationFilter : undefined,
  });

  const [unregisterDevice, { isLoading: isUnregistering }] =
    useUnregisterDeviceMutation();
  const [permanentlyDeleteDevice, { isLoading: isDeleting }] =
    usePermanentlyDeleteDeviceMutation();
  const [updateDevice, { isLoading: isUpdatingStatus }] =
    useUpdateDeviceMutation();
  const [restoreDevice, { isLoading: isRestoring }] =
    useRestoreDeviceMutation();

  const deviceData = deviceResponse?.data ?? [];

  // ============================================================
  // NORMALIZE ROW (matches backend fields)
  // ============================================================
  const normalizeRow = (row, index) => {
    const formatDate = (value) => {
      if (!value) return '-';
      try {
        return new Date(value).toLocaleString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
      } catch {
        return '-';
      }
    };

    return {
      id: row.id ?? row._id ?? index,
      name: row.deviceName || 'Unknown Device',
      deviceId: row.deviceId || '-',
      type: row.deviceType || '-',
      location: row.location || '-',
      status: row.status || 'Unregistered',
      createdAt: formatDate(row.createdAt),
      raw: row,
    };
  };

  const normalizedData = useMemo(
    () => deviceData.map((row, i) => normalizeRow(row, i)),
    [deviceData]
  );

  const filteredData = useMemo(() => normalizedData, [normalizedData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter, locationFilter]);

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

  // ✅ CHANGED: navigate to the standalone register page
  const handleRegisterDevice = () => {
    navigate('/devices/register');
  };

  // ✅ CHANGED: navigate to the standalone edit page instead of opening a modal
  const handleEdit = (row) => {
    setOpenDropdownId(null);
    navigate(`/devices/edit/${row.id}`);
  };

  // ✅ CHANGED: removed handleDeviceUpdated (no longer needed — the edit page handles refetch)

  // ── Unregister (soft delete) — confirm popup + toast ──
  const doUnregister = async (row) => {
    try {
      const res = await unregisterDevice(row.id).unwrap();
      setOpenDropdownId(null);
      if (res?.success === false) {
        showAlert(
          'error',
          res?.error || res?.message || 'Failed to unregister device.'
        );
        return;
      }
      showSuccessToast(`"${row.name}" unregistered successfully.`);
      refetch();
    } catch (err) {
      console.error('Unregister failed:', err);
      showErrorToast(
        err?.data?.message || err?.data?.error || 'Failed to unregister device.'
      );
    }
  };

  const handleUnregister = (row) => {
    openConfirm({
      title: 'Unregister device?',
      message: `"${row.name}" will be removed from your hospital system and its credentials revoked.`,
      confirmLabel: 'Unregister',
      variant: 'danger',
      action: () => doUnregister(row),
    });
  };

  // ── Enable (Disabled → Active) — uses PUT /devices/:id ──
  const doEnable = async (row) => {
    try {
      const res = await updateDevice({
        id: row.id,
        body: { status: 'Active' },
      }).unwrap();
      setOpenDropdownId(null);
      if (res?.success === false) {
        showAlert(
          'error',
          res?.error || res?.message || 'Failed to enable device.'
        );
        return;
      }
      showSuccessToast(`"${row.name}" enabled successfully.`);
      refetch();
    } catch (err) {
      console.error('Enable failed:', err);
      showErrorToast(
        err?.data?.message || err?.data?.error || 'Failed to enable device.'
      );
    }
  };

  const handleEnable = (row) => {
    openConfirm({
      title: 'Enable device?',
      message: `"${row.name}" will be re-enabled and allowed to connect again.`,
      confirmLabel: 'Enable',
      variant: 'primary',
      action: () => doEnable(row),
    });
  };

  // ── Disable (Active → Disabled) — uses PUT /devices/:id ──
  const doDisable = async (row) => {
    try {
      const res = await updateDevice({
        id: row.id,
        body: { status: 'Disabled' },
      }).unwrap();
      setOpenDropdownId(null);
      if (res?.success === false) {
        showAlert(
          'error',
          res?.error || res?.message || 'Failed to disable device.'
        );
        return;
      }
      showSuccessToast(`"${row.name}" disabled successfully.`);
      refetch();
    } catch (err) {
      console.error('Disable failed:', err);
      showErrorToast(
        err?.data?.message || err?.data?.error || 'Failed to disable device.'
      );
    }
  };

  const handleDisable = (row) => {
    openConfirm({
      title: 'Disable device?',
      message: `"${row.name}" will be disabled and will no longer be able to connect.`,
      confirmLabel: 'Disable',
      variant: 'danger',
      action: () => doDisable(row),
    });
  };

  // ── Restore (Unregistered → Active) — uses PUT /devices/:id/restore ──
  const doRestore = async (row) => {
    try {
      const res = await restoreDevice(row.id).unwrap();
      setOpenDropdownId(null);

      if (res?.success === false) {
        showAlert(
          'error',
          res?.error || res?.message || 'Failed to restore device.'
        );
        return;
      }

      showSuccessToast(`"${row.name}" restored successfully.`);

      // 🆕 Show the NEW credentials returned by the restore endpoint
      const creds = res?.credentials;
      if (creds?.apiKey || creds?.secretKey) {
        setRestoredCredentials({
          deviceId: res?.data?.deviceId || row.deviceId,
          deviceName: res?.data?.deviceName || row.name,
          apiKey: creds.apiKey || '',
          secretKey: creds.secretKey || '',
          warning:
            creds.warning ||
            'These are new credentials. The previous ones are no longer valid.',
        });
      }

      refetch();
    } catch (err) {
      console.error('Restore failed:', err);
      showErrorToast(
        err?.data?.message || err?.data?.error || 'Failed to restore device.'
      );
    }
  };

  const handleRestore = (row) => {
    openConfirm({
      title: 'Restore device?',
      message: `"${row.name}" will be restored and reconnected to your hospital system.`,
      confirmLabel: 'Restore',
      variant: 'primary',
      action: () => doRestore(row),
    });
  };

  // ── Open the shared DeleteModal for permanent delete ──
  const handleDelete = (row) => {
    // Guard: only unregistered devices can be permanently deleted
    if (row.status !== 'Unregistered') return;
    setDeviceToDelete(row);
    setShowDeleteModal(true);
    setOpenDropdownId(null);
  };

  // Called by DeleteModal after successful delete
  const handleDeleteConfirm = async () => {
    if (!deviceToDelete) return;
    try {
      await permanentlyDeleteDevice(deviceToDelete.id).unwrap();
      showSuccessToast(`"${deviceToDelete.name}" deleted permanently.`);
      setShowDeleteModal(false);
      setDeviceToDelete(null);
      refetch();
    } catch (err) {
      console.error('Delete failed:', err);
      showErrorToast(
        err?.data?.message || err?.data?.error || 'Failed to delete device.'
      );
      throw err;
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (id) =>
    setOpenDropdownId(openDropdownId === id ? null : id);

  const handleViewDetails = (row) => {
    setSelectedDevice(row);
    setOpenDropdownId(null);
  };

  // ============================================================
  // BADGE HELPERS
  // ============================================================
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-50 text-green-700 border-green-200';
      case 'Disabled': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Unregistered': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusDot = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-500';
      case 'Disabled': return 'bg-amber-500';
      case 'Unregistered': return 'bg-gray-400';
      default: return 'bg-gray-500';
    }
  };

  // ============================================================
  // DERIVED FILTER OPTIONS
  // ============================================================
  const locations = [
    ...new Set(normalizedData.map((r) => r.location).filter((l) => l && l !== '-')),
  ];
  const deviceTypes = [
    ...new Set(normalizedData.map((r) => r.type).filter((t) => t && t !== '-')),
  ];

  const showLoading = isLoading || (isFetching && !deviceResponse);

  // ============================================================
  // DETAILS VIEW — short-circuits the list
  // ============================================================
  if (selectedDevice) {
    return (
      <DeviceDetails
        device={selectedDevice}
        onBack={() => setSelectedDevice(null)}
      />
    );
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="w-full min-h-screen max-w-none bg-[#F8FAFC] p-4 md:p-6 font-sans text-gray-800">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Hospital', path: '/hospital' },
          { label: 'Attendance Devices', path: '/devices' },
        ]}
      />

      {/* Subtitle only */}
      <div className="mb-4">
        <p className="text-sm text-gray-500">
          Manage your hospital's Attendance physical devices
        </p>
      </div>

      {/* Search + Filters + Register Button */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
        <div className="flex flex-1 gap-3 w-full xl:w-auto flex-wrap items-center">
          <SearchBar
            placeholder="Search by device name, ID or location..."
            value={searchTerm}
            onChange={handleSearchChange}
            onClear={handleClearSearch}
            className="flex-1 min-w-[250px] max-w-sm"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-600 bg-white focus:outline-none focus:ring-1 focus:ring-[#1C62A0] shadow-sm cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="Disabled">Disabled</option>
            <option value="Unregistered">Unregistered</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-600 bg-white focus:outline-none focus:ring-1 focus:ring-[#1C62A0] shadow-sm cursor-pointer"
          >
            <option value="all">All Device Types</option>
            {deviceTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-600 bg-white focus:outline-none focus:ring-1 focus:ring-[#1C62A0] shadow-sm cursor-pointer"
          >
            <option value="all">All Locations</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>

        <Button
          onClick={handleRegisterDevice}
          className="flex items-center gap-2 whitespace-nowrap"
        >
          <Plus size={16} />
          Register New Device
        </Button>
      </div>

      {/* Table */}
      <div className="w-full max-w-none bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col min-h-[500px]">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b border-gray-200 text-xs text-gray-500 bg-gray-50/50">
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Device Name</th>
                  <th className="px-4 py-3 font-medium">Device ID</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Created At</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {showLoading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <Loader2 size={36} className="mb-3 animate-spin opacity-60" />
                        <p className="text-sm font-medium text-gray-500">Loading devices...</p>
                      </div>
                    </td>
                  </tr>
                ) : isError ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-rose-400">
                        <XCircle size={40} className="mb-3 opacity-70" />
                        <p className="text-sm font-medium text-rose-500">Failed to load devices</p>
                        <p className="text-xs text-gray-400 mt-1">Please check your connection and try again</p>
                      </div>
                    </td>
                  </tr>
                ) : paginatedData.length > 0 ? (
                  paginatedData.map((row, index) => (
                    <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-3 text-gray-500">{startIndex + index + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{row.name}</td>
                      <td className="px-4 py-3 text-gray-600 font-mono text-xs">{row.deviceId}</td>
                      <td className="px-4 py-3 text-gray-600">{row.type}</td>
                      <td className="px-4 py-3 text-gray-600">{row.location}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadge(row.status)}`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${getStatusDot(row.status)}`}></span>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{row.createdAt}</td>
                      <td className="px-4 py-3 text-right relative">
                        <button
                          onClick={() => toggleDropdown(row.id)}
                          className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          <MoreHorizontal size={18} />
                        </button>

                        {openDropdownId === row.id && (
                          <div
                            ref={dropdownRef}
                            className="absolute right-4 top-10 z-20 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 text-left"
                          >
                            {row.status === 'Unregistered' ? (
                              /* ── Unregistered: Restore + Delete ── */
                              <>
                                <button
                                  onClick={() => handleRestore(row)}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  <Power size={14} className="text-green-500" /> Restore
                                </button>
                                <button
                                  onClick={() => handleDelete(row)}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 size={14} /> Delete
                                </button>
                              </>
                            ) : (
                              /* ── Active / Disabled: full menu ── */
                              <>
                                <button
                                  onClick={() => handleViewDetails(row)}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  <Eye size={14} className="text-gray-400" /> View Details
                                </button>

                                {/* Edit — disabled when device is not Active */}
                                <button
                                  onClick={() => handleEdit(row)}
                                  disabled={row.status !== 'Active'}
                                  className={`w-full flex items-center gap-2 px-4 py-2 text-sm ${
                                    row.status !== 'Active'
                                      ? 'text-gray-300 cursor-not-allowed'
                                      : 'text-gray-700 hover:bg-gray-50'
                                  }`}
                                >
                                  <Edit
                                    size={14}
                                    className={row.status !== 'Active' ? 'text-gray-300' : 'text-gray-400'}
                                  />
                                  Edit
                                </button>

                                {/* Toggle: Disable (Active) / Enable-Connect (Disabled) */}
                                {row.status === 'Active' ? (
                                  <button
                                    onClick={() => handleDisable(row)}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                  >
                                    <Power size={14} className="text-amber-500" /> Disable
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleEnable(row)}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                  >
                                    <Power size={14} className="text-green-500" /> Enable / Connect
                                  </button>
                                )}

                                <button
                                  onClick={() => handleUnregister(row)}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  <UserX size={14} className="text-gray-400" /> Unregister
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <Search size={40} className="mb-3 opacity-50" />
                        <p className="text-sm font-medium text-gray-500">No devices found</p>
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
            <div className="mt-auto px-6 py-4 bg-gray-50 border-t border-gray-200">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                itemLabel="devices"
              />
            </div>
          )}
        </div>
      </div>

      {/* ✅ CHANGED: RegisterDeviceModal removed — now on its own route (/devices/register) */}
      {/* ✅ CHANGED: EditDeviceModal removed — now on its own route (/devices/edit/:id) */}

      {/* ── Restore Credentials Modal (shows NEW api key after restore) ── */}
      <DeviceCredentialsModal
        isOpen={!!restoredCredentials}
        credentials={restoredCredentials}
        title="Device Restored Successfully"
        subtitle="New credentials have been generated. Save them now — the Secret Key will not be shown again."
        onClose={() => setRestoredCredentials(null)}
      />

      {/* ── Global Delete Confirmation Modal ── */}
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeviceToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Device"
        message={
          deviceToDelete
            ? `Are you sure you want to permanently delete "${deviceToDelete.name}"? This action cannot be undone.`
            : 'Are you sure you want to delete this device?'
        }
        itemName={deviceToDelete?.name}
        confirmLabel="Delete"
        loading={isDeleting}
      />

      {/* ── Confirm popup (replaces window.confirm) ── */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel}
        variant={confirmState.variant}
        loading={isUnregistering || isUpdatingStatus || isRestoring}
        onConfirm={handleConfirmClick}
        onCancel={closeConfirm}
      />

      {/* ── Alert popup (replaces window.alert) ── */}
      <AlertModal
        isOpen={alertState.isOpen}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
        onClose={() => setAlertState((s) => ({ ...s, isOpen: false }))}
      />
    </div>
  );
};

export default Device;