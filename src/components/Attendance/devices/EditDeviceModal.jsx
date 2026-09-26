// src/components/devices/EditDevicePage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FileText,
  Save,
  AlertCircle,
  Loader2,
  Upload,
  Image as ImageIcon,
  Trash2,
  MapPin,
  Activity,
  Lock,
  KeyRound,
  Info,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '../../ui/button';
import {
  useUpdateDeviceMutation,
  useGetDeviceByIdQuery,
} from '../../../../app/service/device';
import { getAuthUser } from '../../../utils/auth';
import { showSuccessToast, showErrorToast } from '../../ui/Toast';
import {
  uploadToS3,
  deleteFromS3,
  getS3ImageUrl,
} from '../../../../app/service/S3';

/* ------------------------------------------------------------------ */
/* Option lists                                                        */
/* ------------------------------------------------------------------ */
const LOCATION_OPTIONS = [
  { value: 'Main Entrance', label: 'Main Entrance' },
  { value: 'Staff Lobby', label: 'Staff Lobby' },
  { value: 'Reception', label: 'Reception' },
  { value: 'Ward A', label: 'Ward A' },
  { value: 'Emergency', label: 'Emergency' },
  { value: 'Parking Area', label: 'Parking Area' },
];

const DEVICE_TYPE_OPTIONS = [
  { value: 'rfid', label: 'RFID' },
  { value: 'fingerprint', label: 'Fingerprint' },
  { value: 'face', label: 'Face Recognition' },
];

const STATUS_OPTIONS = [
  { value: 'Active', label: 'Active' },
  { value: 'Disabled', label: 'Disabled' },
];

/* ------------------------------------------------------------------ */
/* Layout primitives                                                   */
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

const EditableField = ({ label, name, value, onChange, placeholder, required, hint, mono, readOnly }) => (
  <div className="mb-4 min-w-0">
    <label className="block text-xs font-medium text-gray-600 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type="text"
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      readOnly={readOnly}
      placeholder={placeholder}
      className={`w-full min-w-0 border border-gray-200 rounded-md px-3 py-2 text-sm ${
        readOnly
          ? 'text-gray-600 bg-gray-50 cursor-not-allowed'
          : 'text-gray-800 bg-gray-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1C62A0]/30 focus:border-[#1C62A0]'
      } transition-all ${mono ? 'font-mono text-xs' : ''}`}
    />
    {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
  </div>
);

const EditableSelect = ({ label, name, value, onChange, options, required, hint }) => (
  <div className="mb-4 min-w-0">
    <label className="block text-xs font-medium text-gray-600 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className="w-full min-w-0 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-800 bg-gray-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1C62A0]/30 focus:border-[#1C62A0] transition-all cursor-pointer"
    >
      {options.map(({ value: v, label: l }) => (
        <option key={v} value={v}>{l}</option>
      ))}
    </select>
    {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
  </div>
);

const ReadOnlyField = ({ label, value, mono, required }) => (
  <div className="mb-4 min-w-0">
    <label className="block text-xs font-medium text-gray-600 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div
      className={`w-full min-w-0 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-600 bg-gray-50 cursor-not-allowed break-all ${
        mono ? 'font-mono text-xs' : ''
      }`}
    >
      {value || '-'}
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/* ImagePanel — large image on top, buttons underneath                 */
/* ------------------------------------------------------------------ */
const ImagePanel = ({
  preview,
  onClick,
  onRemove,
  icon: Icon,
  title,
  uploading,
}) => {
  if (preview) {
    return (
      <div className="w-full min-w-0">
        <div className="relative w-full aspect-square rounded-lg bg-gray-100 border border-gray-200 overflow-hidden">
          <img src={preview} alt={title} className="w-full h-full object-cover" />
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 size={24} className="text-white animate-spin" />
            </div>
          )}
        </div>

        {!uploading && (
          <div className="grid grid-cols-2 gap-2 mt-3">
            <button
              type="button"
              onClick={onClick}
              className="w-full min-w-0 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium transition-colors"
            >
              <Upload size={13} />
              Change
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="w-full min-w-0 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors"
            >
              <Trash2 size={13} />
              Remove
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={uploading}
      className="w-full aspect-square rounded-lg bg-gray-100 border border-gray-200 hover:border-[#1C62A0] hover:bg-blue-50/30 transition-colors flex flex-col items-center justify-center text-gray-400 hover:text-[#1C62A0] disabled:opacity-60 disabled:cursor-wait"
    >
      {uploading ? (
        <Loader2 size={32} className="mb-2 animate-spin" />
      ) : Icon ? (
        <Icon size={48} className="mb-2 opacity-40" />
      ) : (
        <ImageIcon size={48} className="mb-2 opacity-40" />
      )}
      <p className="text-xs font-medium">
        {uploading ? 'Uploading…' : 'Click to upload'}
      </p>
      <p className="text-[10px] mt-0.5">PNG, JPG up to 5MB</p>
    </button>
  );
};

/* ------------------------------------------------------------------ */
/* Main page                                                           */
/* ------------------------------------------------------------------ */
const EditDevicePage = () => {
  const navigate = useNavigate();
  const { id: routeId } = useParams();

  const [formData, setFormData] = useState({
    deviceName: '',
    location: 'Main Entrance',
    deviceType: 'rfid',
    status: 'Active',
    description: '',
  });
  const [errorMessage, setErrorMessage] = useState('');

  const [readerImageKey, setReaderImageKey] = useState(null);
  const [locationImageKey, setLocationImageKey] = useState(null);
  const [readerImageFile, setReaderImageFile] = useState(null);
  const [readerImagePreview, setReaderImagePreview] = useState(null);
  const [locationImageFile, setLocationImageFile] = useState(null);
  const [locationImagePreview, setLocationImagePreview] = useState(null);

  const [uploadingReader, setUploadingReader] = useState(false);
  const [uploadingLocation, setUploadingLocation] = useState(false);

  const [readerRemoved, setReaderRemoved] = useState(false);
  const [locationRemoved, setLocationRemoved] = useState(false);

  const readerInputRef = useRef(null);
  const locationInputRef = useRef(null);

  const [updateDevice, { isLoading: isSubmitting }] = useUpdateDeviceMutation();
  const auth = getAuthUser();

  const {
    data: detailResponse,
    isLoading: isLoadingDevice,
    isError,
  } = useGetDeviceByIdQuery(routeId, { skip: !routeId });

  const device = detailResponse?.data ?? null;

  const hospitalName =
    device?.hospitalName ||
    auth?.hospitalName ||
    auth?.hospital?.name ||
    'Not available';

  const displayDeviceId = device?.deviceId ?? '-';
  const deviceId = device?.id ?? device?._id ?? routeId;

  useEffect(() => {
    if (!device) return;

    const incomingType = device.deviceType ?? 'rfid';

    setFormData({
      deviceName: device.deviceName ?? '',
      location: device.location ?? 'Main Entrance',
      deviceType: DEVICE_TYPE_OPTIONS.some((o) => o.value === incomingType)
        ? incomingType
        : DEVICE_TYPE_OPTIONS[0].value,
      status: device.status ?? 'Active',
      description: device.description ?? '',
    });

    const incomingReaderKey =
      device.readerImageKey ??
      device.deviceImageKey ??
      device.deviceImage ??
      null;

    const incomingLocationKey =
      device.locationImageKey ??
      device.locationImage ??
      null;

    setReaderImageKey(incomingReaderKey);
    setLocationImageKey(incomingLocationKey);

    setReaderImageFile(null);
    setReaderImagePreview(null);
    setLocationImageFile(null);
    setLocationImagePreview(null);

    setReaderRemoved(false);
    setLocationRemoved(false);
    setUploadingReader(false);
    setUploadingLocation(false);

    setErrorMessage('');
  }, [device]);

  useEffect(() => {
    return () => {
      if (readerImagePreview?.startsWith('blob:')) URL.revokeObjectURL(readerImagePreview);
      if (locationImagePreview?.startsWith('blob:')) URL.revokeObjectURL(locationImagePreview);
    };
  }, [readerImagePreview, locationImagePreview]);

  const readerDisplayPreview =
    readerImagePreview ||
    (!readerRemoved && readerImageKey ? getS3ImageUrl(readerImageKey) : null);

  const locationDisplayPreview =
    locationImagePreview ||
    (!locationRemoved && locationImageKey ? getS3ImageUrl(locationImageKey) : null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage('');
  };

  const validateFile = (file) => {
    if (!file.type.startsWith('image/')) {
      showErrorToast('Please select a valid image file.');
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      showErrorToast('Image must be smaller than 5MB.');
      return false;
    }
    return true;
  };

  const handleReaderImageChange = (e) => {
    const f = e.target.files?.[0];
    if (f && validateFile(f)) {
      setReaderImageFile(f);
      setReaderImagePreview(URL.createObjectURL(f));
      setReaderRemoved(false);
    }
    e.target.value = '';
  };

  const handleLocationImageChange = (e) => {
    const f = e.target.files?.[0];
    if (f && validateFile(f)) {
      setLocationImageFile(f);
      setLocationImagePreview(URL.createObjectURL(f));
      setLocationRemoved(false);
    }
    e.target.value = '';
  };

  const handleReaderImageRemove = () => {
    if (readerImagePreview?.startsWith('blob:')) URL.revokeObjectURL(readerImagePreview);
    if (readerImageKey && !readerImageFile) setReaderRemoved(true);
    else setReaderRemoved(false);
    setReaderImageFile(null);
    setReaderImagePreview(null);
  };

  const handleLocationImageRemove = () => {
    if (locationImagePreview?.startsWith('blob:')) URL.revokeObjectURL(locationImagePreview);
    if (locationImageKey && !locationImageFile) setLocationRemoved(true);
    else setLocationRemoved(false);
    setLocationImageFile(null);
    setLocationImagePreview(null);
  };

  const syncImages = async (deviceId) => {
    const tasks = [];

    if (readerImageFile) {
      setUploadingReader(true);
      tasks.push(
        uploadToS3(readerImageFile, null, deviceId, 'device', 'deviceImage')
          .then((res) => {
            setReaderImageKey(res.key);
            setReaderRemoved(false);
          })
          .finally(() => setUploadingReader(false))
      );
    } else if (readerRemoved && readerImageKey) {
      tasks.push(
        deleteFromS3(readerImageKey, deviceId, 'device', 'deviceImage').then(() =>
          setReaderImageKey(null)
        )
      );
    }

    if (locationImageFile) {
      setUploadingLocation(true);
      tasks.push(
        uploadToS3(locationImageFile, null, deviceId, 'device', 'locationImage')
          .then((res) => {
            setLocationImageKey(res.key);
            setLocationRemoved(false);
          })
          .finally(() => setUploadingLocation(false))
      );
    } else if (locationRemoved && locationImageKey) {
      tasks.push(
        deleteFromS3(locationImageKey, deviceId, 'device', 'locationImage').then(
          () => setLocationImageKey(null)
        )
      );
    }

    if (tasks.length === 0) return { ok: true, failed: 0 };

    const results = await Promise.allSettled(tasks);
    const failed = results.filter((r) => r.status === 'rejected').length;
    if (failed > 0) console.error('Some image operations failed:', results);
    return { ok: failed === 0, failed };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!deviceId) {
      setErrorMessage('Missing device id.');
      showErrorToast('Missing device id.');
      return;
    }

    try {
      const payload = {
        deviceName: formData.deviceName.trim(),
        location: formData.location,
        deviceType: formData.deviceType,
        status: formData.status,
        ...(formData.description?.trim()
          ? { description: formData.description.trim() }
          : {}),
      };

      await updateDevice({ id: deviceId, body: payload }).unwrap();

      const { ok, failed } = await syncImages(deviceId);

      if (!ok) {
        showErrorToast(`${failed} image operation(s) failed. Other changes were saved.`);
      } else {
        showSuccessToast(`Device "${payload.deviceName}" updated successfully.`);
      }

      navigate('/attendance/device');
    } catch (err) {
      console.error('Update device failed:', err);
      const msg =
        err?.data?.message ||
        err?.data?.error ||
        err?.message ||
        'Failed to update device. Please try again.';
      setErrorMessage(msg);
      showErrorToast(msg);
    }
  };

  const isBusy = isSubmitting || uploadingReader || uploadingLocation;

  if (isLoadingDevice) {
    return (
      <div className="w-full min-h-screen bg-[#F8FAFC] p-4 md:p-6 flex items-center justify-center">
        <div className="flex flex-col items-center text-gray-400">
          <Loader2 size={36} className="mb-3 animate-spin opacity-60" />
          <p className="text-sm font-medium text-gray-500">Loading device…</p>
        </div>
      </div>
    );
  }

  if (isError || !device) {
    return (
      <div className="w-full min-h-screen bg-[#F8FAFC] p-4 md:p-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <button
              onClick={() => navigate('/attendance/device')}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div className="text-xs text-gray-500">
              <span className="text-gray-700">Attendance Devices</span>
              <span className="mx-1 text-gray-400">»</span>
              <span
                className="cursor-pointer hover:text-gray-700"
                onClick={() => navigate('/attendance/device')}
              >
                Home
              </span>
              <span className="mx-1 text-gray-400">»</span>
              <span>Edit Device</span>
            </div>
          </div>
          <h1 className="text-xl font-bold text-gray-800">Edit Device</h1>
        </div>
        <div className="mt-8 flex flex-col items-center text-gray-400">
          <AlertCircle size={40} className="mb-3 text-rose-400" />
          <p className="text-sm font-medium text-rose-500">Device not found</p>
          <p className="text-xs text-gray-400 mt-1">
            The device you're trying to edit doesn't exist.
          </p>
          <Button className="mt-4" onClick={() => navigate('/attendance/device')}>
            Back to Devices
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen max-w-none bg-[#F8FAFC] p-4 md:p-6 font-sans text-gray-800">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <button
            onClick={() => navigate('/attendance/device')}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div className="text-xs text-gray-500">
            <span className="text-gray-700">Attendance Devices</span>
            <span className="mx-1 text-gray-400">»</span>
            <span
              className="cursor-pointer hover:text-gray-700"
              onClick={() => navigate('/attendance/device')}
            >
              Home
            </span>
            <span className="mx-1 text-gray-400">»</span>
            <span>Edit Device</span>
          </div>
        </div>
        <h1 className="text-xl font-bold text-gray-800">Edit Device</h1>
        <p className="text-sm text-gray-500 mt-1">
          Update the details and images of this device.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-6xl">
        {errorMessage && (
          <div className="flex items-start gap-2 mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-5">
            <Card>
              <CardHeader icon={FileText} title="Device Information" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="md:col-span-2">
                  <EditableField
                    label="Device ID"
                    name="deviceId"
                    value={displayDeviceId}
                    readOnly
                    hint="Device ID cannot be changed after registration"
                    mono
                  />
                  <EditableField
                    label="Device Name"
                    name="deviceName"
                    value={formData.deviceName}
                    onChange={handleChange}
                    placeholder="e.g., Main Entrance Reader"
                    hint="Friendly name for the device"
                    required
                  />
                  <EditableSelect
                    label="Location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    options={LOCATION_OPTIONS}
                    hint="Physical location of the device"
                    required
                  />
                  <ReadOnlyField label="Hospital" value={hospitalName} />
                  <EditableSelect
                    label="Device Type"
                    name="deviceType"
                    value={formData.deviceType}
                    onChange={handleChange}
                    options={DEVICE_TYPE_OPTIONS}
                    hint="RFID / Fingerprint / Face Recognition"
                    required
                  />
                  <EditableSelect
                    label="Status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    options={STATUS_OPTIONS}
                    hint="Enable or disable this device"
                    required
                  />
                </div>

                <div className="flex flex-col items-center justify-start">
                  <input
                    ref={readerInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleReaderImageChange}
                  />
                  <ImagePanel
                    preview={readerDisplayPreview}
                    onClick={() => readerInputRef.current?.click()}
                    onRemove={handleReaderImageRemove}
                    icon={Activity}
                    title="Reader Image"
                    uploading={uploadingReader}
                  />
                  <p className="text-sm font-medium text-gray-800 mt-3 text-center">
                    {formData.deviceName || 'Reader Device'}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1 text-center">
                    Reader Image
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader
                icon={Lock}
                title="Device Authentication"
                right={
                  <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                    <Lock size={12} /> Managed in Device Details
                  </span>
                }
              />
              <p className="text-sm text-gray-600 mb-3">
                API credentials for this device are managed separately. Open the
                device details page to view or regenerate them.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 bg-gray-50 text-xs text-gray-500">
                <KeyRound size={13} /> Credentials unchanged on edit
              </div>
            </Card>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-1 space-y-5">
            <Card>
              <CardHeader icon={Activity} title="Device Status" />
              <div className="flex items-start gap-3">
                <span
                  className={`w-2.5 h-2.5 rounded-full mt-1.5 ${
                    formData.status === 'Active' ? 'bg-green-500' : 'bg-amber-500'
                  }`}
                />
                <div>
                  <p
                    className={`text-sm font-medium ${
                      formData.status === 'Active' ? 'text-green-600' : 'text-amber-600'
                    }`}
                  >
                    {formData.status}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formData.status === 'Active'
                      ? 'The device is enabled and can record attendance.'
                      : 'The device is currently disabled.'}
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader icon={MapPin} title="Device Location" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Location</p>
                    <p className="text-sm font-medium text-gray-800">
                      {formData.location}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-1">Hospital</p>
                    <p className="text-sm font-medium text-gray-800 break-words">
                      {hospitalName}
                    </p>
                  </div>

                  <p className="text-xs text-gray-400 leading-relaxed">
                    Optional — upload a photo of where the device is installed.
                  </p>
                </div>

                <div className="min-w-0">
                  <input
                    ref={locationInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLocationImageChange}
                  />

                  <ImagePanel
                    preview={locationDisplayPreview}
                    onClick={() => locationInputRef.current?.click()}
                    onRemove={handleLocationImageRemove}
                    icon={MapPin}
                    title="Location Image"
                    uploading={uploadingLocation}
                  />

                  <p className="text-[11px] text-gray-400 mt-2 text-center">
                    Location Image
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader
                icon={FileText}
                title={
                  <>
                    Description <span className="text-gray-400 font-normal">(Optional)</span>
                  </>
                }
              />
              <div className="relative">
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  maxLength={500}
                  rows={4}
                  placeholder="Add any additional notes about this device..."
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-800 bg-gray-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1C62A0]/30 focus:border-[#1C62A0] transition-all resize-none"
                />
                <span className="absolute bottom-2 right-3 text-xs text-gray-400">
                  {formData.description.length}/500
                </span>
              </div>
            </Card>

            <Card className="bg-blue-50/40 border-blue-100">
              <div className="flex items-start gap-2">
                <Info size={16} className="text-[#1C62A0] mt-0.5 shrink-0" />
                <p className="text-xs text-gray-600 leading-relaxed">
                  Image changes are uploaded to S3 when you save. Removing an
                  image will permanently delete it from storage.
                </p>
              </div>
            </Card>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pb-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/attendance/device')}
            disabled={isBusy}
            className="px-6 border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isBusy}
            className="flex items-center gap-2 bg-[#1C62A0] hover:bg-[#154a7a] text-white px-6"
          >
            {isBusy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isBusy ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditDevicePage;