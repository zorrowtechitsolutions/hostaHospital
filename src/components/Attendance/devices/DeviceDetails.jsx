// src/components/devices/DeviceDetails.jsx
import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Info,
  Copy,
  Eye,
  EyeOff,
  X,
  MapPin,
  Activity,
  Power,
  AlertTriangle,
  Lock,
  KeyRound,
  Trash2,
  FileText,
  Check,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../../ui/button';
import {
  useGetDeviceByIdQuery,
  useRegenerateCredentialsMutation,
  useUnregisterDeviceMutation,
} from '../../../../app/service/device';
import { getAuthUser } from '../../../utils/auth';
import CredentialsDrawer from './credentials/CredentialsDrawer';
import { getS3ImageUrl } from '../../../../app/service/S3';

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */
const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl border border-gray-200 shadow-sm p-5 ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ icon: Icon, title, right }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center">
        {Icon && <Icon size={15} className="text-[#1C62A0]" />}
      </div>
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
    </div>
    {right}
  </div>
);

const Field = ({ label, value, mono, copyable }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <div className="mb-4 min-w-0">
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <div className="relative min-w-0">
        <div
          className={`w-full min-w-0 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-800 bg-gray-50/60 ${
            mono ? 'font-mono text-xs' : ''
          } ${copyable ? 'pr-10' : ''} break-all overflow-hidden`}
        >
          {value || '-'}
        </div>
        {copyable && (
          <button
            onClick={handleCopy}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
            title="Copy"
          >
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
          </button>
        )}
      </div>
    </div>
  );
};

const StatusPill = ({ status }) => {
  const styles = {
    Active: 'bg-green-50 text-green-700 border-green-200',
    Online: 'bg-green-50 text-green-700 border-green-200',
    Disabled: 'bg-amber-50 text-amber-700 border-amber-200',
    Unregistered: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  const dot = {
    Active: 'bg-green-500',
    Online: 'bg-green-500',
    Disabled: 'bg-amber-500',
    Unregistered: 'bg-gray-400',
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
        styles[status] || styles.Unregistered
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dot[status] || 'bg-gray-400'}`} />
      {status}
    </span>
  );
};

/* ------------------------------------------------------------------ */
/* Popup: Confirm dialog                                               */
/* ------------------------------------------------------------------ */
const ConfirmModal = ({
  isOpen,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={loading ? undefined : onCancel}
      />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm p-5">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-9 h-9 shrink-0 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle size={18} className="text-red-600" />
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
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-3.5 py-2 rounded-md bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Popup: Alert message                                                */
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

  const { Icon, iconBg, iconColor, btn, defaultTitle } = config[type] || config.info;

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
/* Popup: Image lightbox                                               */
/* ------------------------------------------------------------------ */
const ImageLightbox = ({ src, alt, onClose }) => {
  if (!src) return null;
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
        aria-label="Close image"
      >
        <X size={22} />
      </button>
      <img
        src={src}
        alt={alt || 'preview'}
        className="relative max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
      />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */
const DeviceDetails = ({ device, onBack }) => {
  const deviceId =
    device?.id ?? device?.raw?.id ?? device?.raw?._id ?? device?._id;

  const {
    data: detailResponse,
    isLoading: isLoadingDetail,
    isFetching: isFetchingDetail,
    isError: isDetailError,
    error: detailError,
  } = useGetDeviceByIdQuery(deviceId, { skip: !deviceId });

  const apiDevice = detailResponse?.data ?? device?.raw ?? device ?? {};
  const auth = getAuthUser();

  const data = useMemo(() => {
    const d = apiDevice;
    const hospitalName =
      d.hospitalName ||
      device?.raw?.hospitalName ||
      auth?.hospitalName ||
      auth?.hospital?.name ||
      'Hospital';

    /* ---- S3 image keys ---- */
    // Backend may return either the new per-image fields or the legacy `locationImage`.
    const readerImageKey =
      d.readerImageKey ??
      d.deviceImageKey ??
      d.deviceImage ??
      null;

    const locationImageKey =
      d.locationImageKey ??
      d.locationImage ??
      null;

    return {
      id: d.id ?? d._id ?? deviceId,
      deviceId: d.deviceId ?? '-',
      name: d.deviceName ?? d.name ?? 'Unknown Device',
      type: d.deviceType ?? d.type ?? '-',
      status: d.status ?? 'Unregistered',
      hospitalName,
      location: d.location ?? '-',
      address: d.address ?? d.location ?? '—',
      // ✅ Convert S3 keys → full URLs
      readerImage: getS3ImageUrl(readerImageKey),
      locationImage: getS3ImageUrl(locationImageKey),
      apiKey: d.apiKey ?? '',
      secretKey: d.secretKey ?? '',
      createdAt: d.createdAt ?? null,
    };
  }, [apiDevice, device, deviceId, auth]);

  /* ── UI state ── */
  const [showCredentials, setShowCredentials] = useState(false);
  const [freshCredentials, setFreshCredentials] = useState(null);

  /* ── Popup state ── */
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    action: null,
  });
  const [alertState, setAlertState] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
  });
  const [lightbox, setLightbox] = useState({ isOpen: false, src: '', alt: '' });

  const showAlert = (type, message, title) =>
    setAlertState({ isOpen: true, type, message, title });

  const openConfirm = ({ title, message, confirmLabel, action }) =>
    setConfirmState({
      isOpen: true,
      title,
      message,
      confirmLabel: confirmLabel || 'Confirm',
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

  const [regenerateCredentials, { isLoading: isRegenerating }] =
    useRegenerateCredentialsMutation();
  const [unregisterDevice, { isLoading: isUnregistering }] =
    useUnregisterDeviceMutation();

  /* ── Regenerate ── */
  const doRegenerate = async () => {
    try {
      const res = await regenerateCredentials(data.id).unwrap();
      const creds = res?.credentials;

      if (creds?.apiKey && creds?.secretKey) {
        setFreshCredentials(creds);
        if (creds.warning) {
          showAlert('warning', creds.warning, 'Heads up');
        } else {
          showAlert('success', 'New credentials generated successfully.');
        }
      } else if (res?.error) {
        showAlert('error', res.error);
      }
    } catch (err) {
      showAlert(
        'error',
        err?.data?.message || err?.data?.error || 'Failed to regenerate credentials.'
      );
    }
  };

  const handleRegenerate = () => {
    openConfirm({
      title: 'Regenerate credentials?',
      message:
        'The old API key and secret will stop working immediately. The device will need the new keys to communicate.',
      confirmLabel: 'Regenerate',
      action: doRegenerate,
    });
  };

  /* ── Unregister ── */
  const doUnregister = async () => {
    try {
      const res = await unregisterDevice(data.id).unwrap();
      if (res?.success === false) {
        showAlert(
          'error',
          res?.error || res?.message || 'Failed to unregister device.'
        );
        return;
      }
      showAlert('success', `"${data.name}" has been unregistered.`);
      setTimeout(() => onBack?.(), 800);
    } catch (err) {
      showAlert(
        'error',
        err?.data?.message || err?.data?.error || 'Failed to unregister device.'
      );
    }
  };

  const handleUnregister = () => {
    openConfirm({
      title: 'Unregister device?',
      message: `"${data.name}" will be removed from your hospital system and its credentials revoked.`,
      confirmLabel: 'Unregister',
      action: doUnregister,
    });
  };

  const displayApiKey = freshCredentials?.apiKey || data.apiKey || '';
  const displaySecretKey = freshCredentials?.secretKey || data.secretKey || '';

  const openLightbox = (src, alt) => {
    if (!src) return;
    setLightbox({ isOpen: true, src, alt });
  };

  const showLoading =
    (isLoadingDetail || isFetchingDetail) && !apiDevice?.deviceId;

  if (showLoading) {
    return (
      <div className="w-full min-h-screen bg-[#F8FAFC] p-6 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#1C62A0]" />
      </div>
    );
  }

  if (isDetailError && !apiDevice?.deviceId) {
    return (
      <div className="w-full min-h-screen bg-[#F8FAFC] p-6 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-6 text-center max-w-md">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-800 mb-1">Failed to load device</h3>
          <p className="text-sm text-gray-500 mb-4">
            {detailError?.data?.message || 'The device could not be fetched.'}
          </p>
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-md bg-[#1C62A0] text-white text-sm hover:bg-[#154a7a]"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] p-4 md:p-6 font-sans text-gray-800">

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <button
            onClick={onBack}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div className="text-xs text-gray-500">
            <span className="text-gray-700">RFID Devices</span>
            <span className="mx-1 text-gray-400">»</span>
            <span>Home</span>
            <span className="mx-1 text-gray-400">»</span>
            <span>{data.name || 'Device Details'}</span>
          </div>
        </div>
        <h1 className="text-xl font-bold text-gray-800">{data.name || 'Device Details'}</h1>
        <p className="text-sm text-gray-500 mt-0.5 truncate">
          {data.deviceId} · {data.location}
        </p>
      </div>

      {/* Grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <CardHeader icon={FileText} title="Device Information" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-2 space-y-1">
                <Field label="Device ID *" value={data.deviceId} copyable mono />
                <Field label="Device Name *" value={data.name} />
                <Field label="Location *" value={data.location} />
                <Field label="Hospital *" value={data.hospitalName} />
                <Field label="Device Type *" value={data.type} />
              </div>

              {/* ✅ Reader image panel — uses data.readerImage (S3 URL) */}
              <div className="flex flex-col items-center justify-start">
                <button
                  type="button"
                  onClick={() => openLightbox(data.readerImage, data.name)}
                  disabled={!data.readerImage}
                  className={`w-full aspect-square rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center ${
                    data.readerImage
                      ? 'cursor-zoom-in hover:opacity-95 transition-opacity'
                      : 'cursor-default'
                  }`}
                  title={data.readerImage ? 'Click to view image' : ''}
                >
                  {data.readerImage ? (
                    <img
                      src={data.readerImage}
                      alt={data.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center text-gray-400">
                      <Activity size={48} className="mx-auto mb-2 opacity-40" />
                      <p className="text-xs">RFID Reader Device</p>
                    </div>
                  )}
                </button>
                <p className="text-sm font-medium text-gray-800 mt-3">{data.name}</p>
                <div className="mt-2">
                  <StatusPill status={data.status} />
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader
              icon={Lock}
              title="Device Authentication"
              right={
                <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                  <Lock size={12} /> Credentials Hidden
                </span>
              }
            />
            <p className="text-sm text-gray-600 mb-4">
              API credentials are used by this device to securely communicate with Hosta backend.
            </p>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => setShowCredentials(true)}
            >
              <KeyRound size={14} /> Manage Credentials
            </Button>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-1 space-y-5">
          <Card>
            <CardHeader icon={Activity} title="Device Status" />
            <div className="flex items-start gap-3">
              <span
                className={`w-2.5 h-2.5 rounded-full mt-1.5 ${
                  data.status === 'Active' ? 'bg-green-500' : 'bg-amber-500'
                }`}
              />
              <div>
                <p
                  className={`text-sm font-medium ${
                    data.status === 'Active' ? 'text-green-600' : 'text-amber-600'
                  }`}
                >
                  {data.status === 'Active' ? 'Online' : data.status}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {data.status === 'Active'
                    ? 'The device is connected and working properly.'
                    : 'The device is not currently active.'}
                </p>
              </div>
            </div>
          </Card>

          {/* ✅ Redesigned Device Location card — matches Edit / Register pages */}
          <Card>
            <CardHeader icon={MapPin} title="Device Location" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
              {/* Location details */}
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Location</p>
                  <p className="text-sm font-medium text-gray-800">
                    {data.location}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Address</p>
                  <p className="text-sm font-medium text-gray-800 break-words">
                    {data.address}
                  </p>
                </div>
              </div>

              {/* Location image */}
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => openLightbox(data.locationImage, 'Device location')}
                  disabled={!data.locationImage}
                  className={`w-full aspect-square rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center ${
                    data.locationImage
                      ? 'cursor-zoom-in hover:opacity-95 transition-opacity'
                      : 'cursor-default'
                  }`}
                  title={data.locationImage ? 'Click to view image' : ''}
                >
                  {data.locationImage ? (
                    <img
                      src={data.locationImage}
                      alt="location"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center text-gray-400">
                      <MapPin size={48} className="mx-auto mb-2 opacity-40" />
                      <p className="text-xs">Location Image</p>
                    </div>
                  )}
                </button>

                <p className="text-[11px] text-gray-400 mt-2 text-center">
                  Location Image
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader icon={Power} title="Control" />
            <button
              onClick={handleUnregister}
              disabled={isUnregistering || data.status === 'Unregistered'}
              className="flex items-center gap-2 px-4 py-2 rounded-md border border-red-200 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUnregistering ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Trash2 size={14} />
              )}
              {isUnregistering ? 'Unregistering…' : 'Unregister Device'}
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Unregistering will remove this device from your hospital system.
            </p>
          </Card>
        </div>
      </div>

      {/* ─── Credentials Drawer (shared component) ─── */}
      <CredentialsDrawer
        isOpen={showCredentials}
        onClose={() => setShowCredentials(false)}
        deviceId={data.deviceId}
        apiKey={displayApiKey}
        secretKey={displaySecretKey}
        onRegenerate={handleRegenerate}
        isRegenerating={isRegenerating}
        defaultReveal={!!freshCredentials}
      />

      {/* Popups */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel}
        loading={isRegenerating || isUnregistering}
        onConfirm={handleConfirmClick}
        onCancel={closeConfirm}
      />

      <AlertModal
        isOpen={alertState.isOpen}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
        onClose={() => setAlertState((s) => ({ ...s, isOpen: false }))}
      />

      {lightbox.isOpen && (
        <ImageLightbox
          src={lightbox.src}
          alt={lightbox.alt}
          onClose={() => setLightbox({ isOpen: false, src: '', alt: '' })}
        />
      )}
    </div>
  );
};

export default DeviceDetails;