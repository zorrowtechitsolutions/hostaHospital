// src/components/devices/RegisterDevicePage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useRegisterDeviceMutation } from '../../../../app/service/device';
import { getAuthUser } from '../../../utils/auth';
import { showSuccessToast, showErrorToast } from '../../ui/Toast';
import { CredentialsView } from './credentials/DeviceCredentialsModal';

/* --------------------------- Constants --------------------------- */
const DEVICE_TYPE_OPTIONS = [
  { value: 'rfid', label: 'RFID' },
  { value: 'fingerprint', label: 'Fingerprint' },
  { value: 'face', label: 'Face Recognition' },
];

const LOCATION_OPTIONS = [
  { value: 'Main Entrance', label: 'Main Entrance' },
  { value: 'Staff Lobby', label: 'Staff Lobby' },
  { value: 'Reception', label: 'Reception' },
  { value: 'Ward A', label: 'Ward A' },
  { value: 'Emergency', label: 'Emergency' },
  { value: 'Parking Area', label: 'Parking Area' },
];

/* --------------------------- Primitives --------------------------- */
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

const EditableField = ({ label, name, value, onChange, placeholder, required, hint, mono }) => (
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
      placeholder={placeholder}
      className={`w-full min-w-0 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-800 bg-gray-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1C62A0]/30 focus:border-[#1C62A0] transition-all ${
        mono ? 'font-mono text-xs' : ''
      }`}
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
          <img
            src={preview}
            alt={title}
            className="w-full h-full object-cover"
          />

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

      <p className="text-[10px] mt-0.5">
        PNG, JPG up to 5MB
      </p>
    </button>
  );
};

/* --------------------------- Main page ---------------------------- */
const RegisterDevicePage = () => {
  const navigate = useNavigate();

  const initialFormData = {
    deviceId: '',
    deviceName: '',
    location: 'Main Entrance',
    hospitalId: '',
    deviceType: 'rfid',
    description: '',
  };

  const [formData, setFormData] = useState(initialFormData);
  const [errorMessage, setErrorMessage] = useState('');
  const [credentials, setCredentials] = useState(null);

  // Kept for local preview UX only — not sent to backend (JSON contract)
  const [readerImageFile, setReaderImageFile] = useState(null);
  const [readerImagePreview, setReaderImagePreview] = useState(null);
  const [locationImageFile, setLocationImageFile] = useState(null);
  const [locationImagePreview, setLocationImagePreview] = useState(null);

  const readerInputRef = useRef(null);
  const locationInputRef = useRef(null);

  const [registerDevice, { isLoading: isSubmitting }] = useRegisterDeviceMutation();
  const auth = getAuthUser();

  const hospitalName = auth?.hospitalName || auth?.hospital?.name || 'Not available';

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      hospitalId:
        auth?.hospitalId ||
        (auth?.hospital?.id ? String(auth.hospital.id) : ''),
    }));
  }, []);

  useEffect(() => {
    return () => {
      if (readerImagePreview?.startsWith('blob:')) URL.revokeObjectURL(readerImagePreview);
      if (locationImagePreview?.startsWith('blob:')) URL.revokeObjectURL(locationImagePreview);
    };
  }, [readerImagePreview, locationImagePreview]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage('');
  };

  const validateAndPreview = (file, setFile, setPreview) => {
    if (!file.type.startsWith('image/')) {
      showErrorToast('Please select a valid image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showErrorToast('Image must be smaller than 5MB.');
      return;
    }
    setFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleReaderImageChange = (e) => {
    const f = e.target.files?.[0];
    if (f) validateAndPreview(f, setReaderImageFile, setReaderImagePreview);
    e.target.value = '';
  };

  const handleLocationImageChange = (e) => {
    const f = e.target.files?.[0];
    if (f) validateAndPreview(f, setLocationImageFile, setLocationImagePreview);
    e.target.value = '';
  };

  const handleReaderImageRemove = () => {
    if (readerImagePreview?.startsWith('blob:')) URL.revokeObjectURL(readerImagePreview);
    setReaderImageFile(null);
    setReaderImagePreview(null);
  };

  const handleLocationImageRemove = () => {
    if (locationImagePreview?.startsWith('blob:')) URL.revokeObjectURL(locationImagePreview);
    setLocationImageFile(null);
    setLocationImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.hospitalId) {
      setErrorMessage('Hospital is required. Please log in with a valid hospital account.');
      showErrorToast('Hospital is required. Please log in with a valid hospital account.');
      return;
    }

    try {
      // JSON payload (backend contract is JSON, not multipart)
      const payload = {
        hospitalId: Number(formData.hospitalId),
        deviceId: formData.deviceId.trim(),
        deviceName: formData.deviceName.trim(),
        location: formData.location,
        deviceType: formData.deviceType,
      };

      // Only include description if backend supports it
      if (formData.description?.trim()) {
        payload.description = formData.description.trim();
      }

      const response = await registerDevice(payload).unwrap();

      const creds = {
        deviceId: response?.data?.deviceId || formData.deviceId.trim(),
        deviceName: response?.data?.deviceName || formData.deviceName.trim(),
        apiKey: response?.credentials?.apiKey || '',
        secretKey: response?.credentials?.secretKey || '',
        warning: response?.credentials?.warning || '',
      };

      setCredentials(creds);
      showSuccessToast(`Device "${creds.deviceName}" registered successfully.`);
    } catch (err) {
      console.error('Register device failed:', err);
      const msg =
        err?.data?.message ||
        err?.data?.error ||
        err?.message ||
        'Failed to register device. Please try again.';
      setErrorMessage(msg);
      showErrorToast(msg);
    }
  };

  /* Show credentials after successful registration */
  if (credentials) {
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
              <span>Register New Device</span>
            </div>
          </div>
          <h1 className="text-xl font-bold text-gray-800">Device Registered</h1>
          <p className="text-sm text-gray-500 mt-1">
            Save the credentials below — they will only be shown once.
          </p>
        </div>

        <div className="max-w-6xl">
          <CredentialsView
            credentials={credentials}
            onFinish={() => navigate('/attendance/device')}
          />
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
            <span>Register New Device</span>
          </div>
        </div>
        <h1 className="text-xl font-bold text-gray-800">Register Attendance Device</h1>
        <p className="text-sm text-gray-500 mt-1">
          Add a new attendance tracking device to your hospital system.
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
                    value={formData.deviceId}
                    onChange={handleChange}
                    placeholder="e.g., RFID-ENTRANCE-01"
                    hint="Unique ID for this device"
                    required
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
                  <ReadOnlyField label="Hospital" value={hospitalName} required />
                  <EditableSelect
                    label="Device Type"
                    name="deviceType"
                    value={formData.deviceType}
                    onChange={handleChange}
                    options={DEVICE_TYPE_OPTIONS}
                    hint="RFID / Fingerprint / Face Recognition"
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
                    preview={readerImagePreview}
                    onClick={() => readerInputRef.current?.click()}
                    onRemove={handleReaderImageRemove}
                    icon={Activity}
                    title="Reader Image"
                  />
                  <p className="text-sm font-medium text-gray-800 mt-3 text-center">
                    {formData.deviceName || 'Reader Device'}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1 text-center">Reader Image</p>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader
                icon={Lock}
                title="Device Authentication"
                right={
                  <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                    <Lock size={12} /> Generated on submit
                  </span>
                }
              />
              <p className="text-sm text-gray-600 mb-3">
                API credentials for this device will be generated automatically after you register.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 bg-gray-50 text-xs text-gray-500">
                <KeyRound size={13} /> No credentials yet
              </div>
            </Card>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-1 space-y-5">
            <Card>
              <CardHeader icon={Activity} title="Device Status" />
              <div className="flex items-start gap-3">
                <span className="w-2.5 h-2.5 rounded-full mt-1.5 bg-amber-500" />
                <div>
                  <p className="text-sm font-medium text-amber-600">Pending Registration</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Device will become Active after successful registration.
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader icon={MapPin} title="Device Location" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                {/* Location details */}
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

                {/* Location image */}
                <div className="min-w-0">
                  <input
                    ref={locationInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLocationImageChange}
                  />

                  <ImagePanel
                    preview={locationImagePreview}
                    onClick={() => locationInputRef.current?.click()}
                    onRemove={handleLocationImageRemove}
                    icon={MapPin}
                    title="Location Image"
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
                  After registering, you will receive the device's API key and secret.
                  Keep them safe — they will only be shown once.
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
            disabled={isSubmitting}
            className="px-6 border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-[#1C62A0] hover:bg-[#154a7a] text-white px-6"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isSubmitting ? 'Registering...' : 'Register Device'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RegisterDevicePage;