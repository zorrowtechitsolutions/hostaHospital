// src/components/super-admin/devices/fingerprint/FingerprintEnrollmentModal.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Fingerprint, User, Info, Lightbulb, ArrowRight, ArrowLeft,
  CheckCircle2, Loader2, ScanLine,
} from 'lucide-react';
import { useGetDoctorsQuery } from '../../../../../app/service/doctorApi';
import { useGetStaffQuery } from '../../../../../app/service/staffApi';
import {
  useGetAllFingerprintEnrollmentsQuery,
  useCreateFingerprintEnrollmentMutation,
} from '../../../../../app/service/fingerprint';
import { useGetDevicesQuery } from '../../../../../app/service/device';
import { showSuccessToast, showErrorToast } from '../../../ui/Toast';

const STEPS = [
  { id: 1, label: 'Employee Details' },
  { id: 2, label: 'Capture Fingerprint' },
  { id: 3, label: 'Review & Save' },
];

const Stepper = ({ currentStep }) => (
  <div className="flex items-center justify-between px-10 pt-6 pb-8">
    {STEPS.map((step, idx) => {
      const isActive = step.id === currentStep;
      const isCompleted = step.id < currentStep;
      return (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <div className={[
              'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors',
              isActive || isCompleted ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400',
            ].join(' ')}>
              {step.id}
            </div>
            <span className={[
              'text-xs font-medium whitespace-nowrap',
              isActive || isCompleted ? 'text-gray-800' : 'text-gray-400',
            ].join(' ')}>
              {step.label}
            </span>
          </div>
          {idx < STEPS.length - 1 && (
            <div className={[
              'flex-1 h-px mx-4 mb-6 transition-colors',
              step.id < currentStep ? 'bg-blue-500' : 'bg-gray-200',
            ].join(' ')} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

const Field = ({ label, required, hint, children }) => (
  <div className="mb-4">
    <label className="block text-sm font-semibold text-gray-800 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {hint && <p className="text-xs text-gray-400 mt-1.5">{hint}</p>}
  </div>
);

const inputCls = 'w-full h-11 px-3.5 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition';
const readonlyCls = `${inputCls} bg-gray-50 cursor-not-allowed`;

const CaptureStatus = ({ status }) => {
  const items = [
    { key: 'scanning', label: 'Scanning' },
    { key: 'processing', label: 'Processing' },
    { key: 'complete', label: 'Complete' },
  ];
  return (
    <div className="space-y-2.5 mt-5">
      {items.map((item) => {
        const isActive = status === item.key;
        const isDone =
          (status === 'processing' && item.key === 'scanning') ||
          (status === 'complete' && item.key !== 'complete');
        return (
          <div key={item.key} className="flex items-center gap-3">
            <span className={[
              'w-4 h-4 rounded-full flex items-center justify-center transition-colors',
              isActive || isDone ? 'bg-blue-600' : 'bg-white border-2 border-gray-200',
            ].join(' ')}>
              {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
            </span>
            <span className={[
              'text-sm',
              isActive || isDone ? 'text-gray-800' : 'text-gray-400',
            ].join(' ')}>
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const FingerprintPanel = ({ status, onCapture, deviceSelected }) => {
  const isScanning = status === 'scanning';
  const isProcessing = status === 'processing';
  const isBusy = isScanning || isProcessing;
  const isDisabled = isBusy || status === 'complete' || !deviceSelected;

  return (
    <div className="border border-gray-200 rounded-xl p-6 bg-white flex flex-col">
      <div className="flex items-center gap-2 mb-5">
        <Fingerprint className="w-5 h-5 text-blue-600" />
        <h3 className="text-base font-semibold text-gray-800">Capture Fingerprint</h3>
      </div>

      <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-lg px-3.5 py-3 mb-5">
        <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-800 leading-relaxed">
          Place the finger on the fingerprint scanner and keep it steady until the capture is complete.
        </p>
      </div>

      <div className="border border-gray-200 rounded-xl bg-white p-6 flex flex-col items-center">
        <div className="relative w-32 h-32 flex items-center justify-center mb-4">
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="46" fill="none" stroke="#E5E7EB" strokeWidth="3" />
            <circle
              cx="50" cy="50" r="46" fill="none" stroke="#2563EB" strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 46}
              strokeDashoffset={
                isScanning ? 2 * Math.PI * 46 * 0.35
                : status === 'complete' ? 0
                : 2 * Math.PI * 46
              }
              className="transition-all duration-500"
            />
          </svg>
          <div className="w-24 h-24 rounded-full bg-blue-50/70 flex items-center justify-center">
            <Fingerprint
              className={[
                'w-12 h-12',
                status === 'complete' ? 'text-green-600' : 'text-blue-600',
                isScanning ? 'animate-pulse' : '',
              ].join(' ')}
            />
          </div>
        </div>

        <h4 className="text-sm font-semibold text-gray-800 mb-1">
          {status === 'complete' ? 'Capture complete'
            : isScanning ? 'Scanning…'
            : isProcessing ? 'Processing…'
            : 'Ready to capture'}
        </h4>
        <p className="text-xs text-gray-500 text-center mb-5">
          {isScanning ? 'Hold your finger steady on the device'
            : isProcessing ? 'Extracting fingerprint template…'
            : status === 'complete' ? 'You can now proceed to the next step'
            : !deviceSelected ? 'Select a fingerprint device first'
            : 'Place your finger on the device'}
        </p>

        <button
          type="button"
          onClick={onCapture}
          disabled={isDisabled}
          className="px-5 h-10 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
        >
          {isBusy ? (
            <><Loader2 className="w-4 h-4 animate-spin" />{isScanning ? 'Scanning…' : 'Processing…'}</>
          ) : status === 'complete' ? (
            <><CheckCircle2 className="w-4 h-4" />Captured</>
          ) : (
            <><ScanLine className="w-4 h-4" />Start Capture</>
          )}
        </button>

        <CaptureStatus status={status} />
      </div>

      <div className="flex items-start gap-2.5 bg-blue-50/60 border border-blue-100 rounded-lg px-3.5 py-3 mt-5">
        <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-700 leading-relaxed">
          You can capture the same finger 2–3 times for better accuracy.
        </p>
      </div>
    </div>
  );
};

const FingerprintEnrollmentModal = () => {
  const navigate = useNavigate();
  const { key: rawRouteKey } = useParams();
  const location = useLocation();

  const routeKey = useMemo(() => {
    if (!rawRouteKey) return null;
    try { return decodeURIComponent(rawRouteKey); } catch { return rawRouteKey; }
  }, [rawRouteKey]);

  const stateMember = location.state?.member || null;
  const stateHospitalId = location.state?.hospitalId || null;
  const stateHospitalName = location.state?.hospitalName || null;

  const parsedKey = useMemo(() => {
    if (!routeKey) return null;
    const [rawType, ...rest] = routeKey.split('-');
    const id = rest.join('-');
    if (!rawType || !id) return null;
    const type =
      rawType.toLowerCase() === 'doctor' ? 'Doctor'
      : rawType.toLowerCase() === 'staff' ? 'Staff'
      : null;
    return type ? { type, id } : null;
  }, [routeKey]);

  const hospitalId = stateMember?.hospitalId || stateHospitalId || null;
  const hospitalName =
    stateMember?.hospitalName ||
    stateMember?.hospital?.name ||
    stateHospitalName ||
    'Hospital';

  const backTarget = hospitalId
    ? `/super-admin/hospitals/${hospitalId}/attendance-devices?tab=fingerprint`
    : '/super-admin/hospitals';

  const goBack = () =>
    navigate(backTarget, { state: { hospitalId, hospitalName } });

  const { data: doctorsResponse, isLoading: doctorsLoading } = useGetDoctorsQuery(
    { page: 1, limit: 1000, hospitalId },
    { skip: !!stateMember || !hospitalId || parsedKey?.type !== 'Doctor' }
  );
  const { data: staffResponse, isLoading: staffLoading } = useGetStaffQuery(
    { page: 1, limit: 1000, hospitalId },
    { skip: !!stateMember || !hospitalId || parsedKey?.type !== 'Staff' }
  );

  const { data: enrollmentsResponse } = useGetAllFingerprintEnrollmentsQuery(
    { hospitalId, status: 'Active', limit: 1000 },
    { skip: !hospitalId || !!stateMember }
  );

  const { data: devicesResponse, isLoading: devicesLoading } = useGetDevicesQuery(
    { hospitalId },
    { skip: !hospitalId }
  );

  const fingerprintDevices = useMemo(
    () => (devicesResponse?.data || []).filter(
      (d) => String(d.deviceType || '').toLowerCase().includes('fingerprint')
    ),
    [devicesResponse]
  );

  const resolvedMember = useMemo(() => {
    if (stateMember) return stateMember;
    if (!parsedKey) return null;

    const doctors = doctorsResponse?.data || [];
    const staff = staffResponse?.data || [];
    const enrollments = enrollmentsResponse?.data || [];

    const enrollmentByKey = new Map(
      enrollments.map((e) => [`${e.employeeType}-${e.employeeId}`, e])
    );

    if (parsedKey.type === 'Doctor') {
      const doc = doctors.find(
        (d) => String(d.id || d.doctorNumber || d.authId) === String(parsedKey.id)
      );
      if (!doc) return null;
      const enr = enrollmentByKey.get(`Doctor-${doc.id}`);
      return {
        key: routeKey,
        id: doc.id,
        type: 'Doctor',
        number: doc.doctorNumber
          ? `#DR${String(doc.doctorNumber).padStart(4, '0')}`
          : `#DR${String(doc.id || '0000').padStart(4, '0')}`,
        rawNumber: doc.doctorNumber || doc.id,
        name:
          doc.displayName ||
          `${doc.firstName || ''} ${doc.lastName || ''}`.trim() ||
          doc.name || 'N/A',
        department: doc.department || doc.specialist || doc.specialty || 'General',
        hospitalName: doc.hospitalName || doc?.hospital?.name || hospitalName,
        fingerprintDevice: enr?.deviceId || null,
        fingerprintId: enr?.id || null,
      };
    }

    const st = staff.find(
      (s) => String(s.id || s.staffNumber || s.authId) === String(parsedKey.id)
    );
    if (!st) return null;
    const enr = enrollmentByKey.get(`Staff-${st.id}`);
    return {
      key: routeKey,
      id: st.id,
      type: 'Staff',
      number: st.staffNumber
        ? `#STF${String(st.staffNumber).padStart(5, '0')}`
        : `#STF${String(st.id || '00000').padStart(5, '0')}`,
      rawNumber: st.staffNumber || st.id,
      name: st.name || `${st.firstName || ''} ${st.lastName || ''}`.trim() || 'N/A',
      department: st.department || st.designation || st.staffType || 'Administration',
      hospitalName: st.hospitalName || st?.hospital?.name || hospitalName,
      fingerprintDevice: enr?.deviceId || null,
      fingerprintId: enr?.id || null,
    };
  }, [stateMember, parsedKey, doctorsResponse, staffResponse, enrollmentsResponse, routeKey, hospitalName]);

  const isLoadingMember =
    !stateMember && !resolvedMember && (doctorsLoading || staffLoading);

  const [step, setStep] = useState(1);
  const [status, setStatus] = useState('ready');
  const [fingerPosition, setFingerPosition] = useState('right-thumb');
  const [quality, setQuality] = useState('Good');

  const [form, setForm] = useState({
    hospital: '', employeeType: '', employeeId: '', name: '', department: '', device: '',
  });

  useEffect(() => {
    if (!resolvedMember) return;
    const displayId =
      resolvedMember.number?.replace(/^#/, '') ||
      (resolvedMember.rawNumber != null ? String(resolvedMember.rawNumber) : '');

    setForm({
      hospital: hospitalName,
      employeeType: resolvedMember.type || '',
      employeeId: displayId,
      name: resolvedMember.name || '',
      department: resolvedMember.department || '',
      device: resolvedMember.fingerprintDevice || '',
    });
    setStep(1);
    setStatus('ready');
  }, [resolvedMember, hospitalName]);

  const update = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const [createEnrollment, { isLoading: isSaving }] =
    useCreateFingerprintEnrollmentMutation();

  const handleCapture = async () => {
    if (!form.device) {
      showErrorToast('Please select a fingerprint device first.');
      return;
    }
    if (!resolvedMember?.id) {
      showErrorToast('Employee information is missing.');
      return;
    }
    setStatus('scanning');
    try {
      const fingerprintTemplate = 'MOCK_TEMPLATE::' + Date.now();
      setStatus('processing');

      await createEnrollment({
        hospitalId,
        employeeId: resolvedMember.id,
        employeeType: resolvedMember.type,
        employeeName: resolvedMember.name,
        department: resolvedMember.department,
        deviceId: form.device,
        fingerPosition,
        fingerprintTemplate,
        quality,
        attempts: 1,
      }).unwrap();

      setStatus('complete');
      showSuccessToast('Fingerprint enrolled successfully.');
      setTimeout(() => goBack(), 800);
    } catch (err) {
      console.error('Fingerprint enrollment failed:', err);
      setStatus('ready');
      showErrorToast(
        err?.data?.message || err?.error || 'Failed to enroll fingerprint.'
      );
    }
  };

  const handleCancel = () => goBack();

  const canProceed =
    step === 1 ? Boolean(resolvedMember) && Boolean(form.device)
    : step === 2 ? status === 'complete'
    : false;

  if (isLoadingMember) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-6 flex items-center justify-center">
        <div className="flex flex-col items-center text-gray-400">
          <Loader2 size={36} className="mb-3 animate-spin opacity-60" />
          <p className="text-sm font-medium text-gray-500">Loading member…</p>
        </div>
      </div>
    );
  }

  if (!resolvedMember) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-6">
        <div className="mt-8 flex flex-col items-center text-gray-400">
          <Fingerprint size={40} className="mb-3 text-rose-400" />
          <p className="text-sm font-medium text-rose-500">Member not found</p>
          <button
            onClick={handleCancel}
            className="mt-4 px-4 h-10 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
          >
            Back to Fingerprint List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen max-w-none bg-[#F8FAFC] p-4 md:p-6 font-sans text-gray-800">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <button onClick={handleCancel} className="p-1 hover:bg-gray-200 rounded transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div className="text-xs text-gray-500 flex flex-wrap items-center">
            <span className="text-gray-700">Super Admin</span>
            <span className="mx-1 text-gray-400">»</span>
            <span
              className="cursor-pointer hover:text-gray-700 truncate max-w-[180px]"
              onClick={handleCancel}
              title={hospitalName}
            >
              {hospitalName}
            </span>
            <span className="mx-1 text-gray-400">»</span>
            <span className="cursor-pointer hover:text-gray-700" onClick={handleCancel}>Fingerprints</span>
            <span className="mx-1 text-gray-400">»</span>
            <span>Enroll Fingerprint</span>
          </div>
        </div>
        <h1 className="text-xl font-bold text-gray-800">Fingerprint Enrollment</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 max-w-6xl mx-auto">
        <Stepper currentStep={step} />

        <div className="px-6 pb-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="border border-gray-200 rounded-xl p-6 bg-white">
              <div className="flex items-center gap-2 mb-5">
                <User className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-semibold text-gray-800">Employee Information</h3>
              </div>

              <Field label="Hospital" required>
                <input type="text" value={form.hospital} readOnly className={readonlyCls} />
              </Field>
              <Field label="Employee Type" required>
                <input type="text" value={form.employeeType} readOnly className={readonlyCls} />
              </Field>
              <Field label="Employee ID" required>
                <input type="text" value={form.employeeId} readOnly className={readonlyCls} />
              </Field>
              <Field label="Name" required>
                <input type="text" value={form.name} readOnly className={readonlyCls} />
              </Field>
              <Field label="Department">
                <input type="text" value={form.department} readOnly className={readonlyCls} />
              </Field>

              <Field label="Device" required>
                <select
                  value={form.device}
                  onChange={update('device')}
                  className={inputCls}
                  disabled={devicesLoading}
                >
                  <option value="">
                    {devicesLoading ? 'Loading fingerprint devices...'
                      : fingerprintDevices.length === 0 ? 'No fingerprint devices available'
                      : 'Select fingerprint device'}
                  </option>
                  {fingerprintDevices.map((d) => (
                    <option key={d.id ?? d._id ?? d.deviceId} value={d.deviceId}>
                      {d.deviceName} — {d.location}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Finger Position" required>
                <select
                  value={fingerPosition}
                  onChange={(e) => setFingerPosition(e.target.value)}
                  className={inputCls}
                >
                  <option value="right-thumb">Right Thumb</option>
                  <option value="left-thumb">Left Thumb</option>
                  <option value="right-index">Right Index</option>
                  <option value="left-index">Left Index</option>
                  <option value="right-middle">Right Middle</option>
                  <option value="left-middle">Left Middle</option>
                  <option value="right-ring">Right Ring</option>
                  <option value="left-ring">Left Ring</option>
                  <option value="right-little">Right Little</option>
                  <option value="left-little">Left Little</option>
                </select>
              </Field>

              <Field label="Quality">
                <select
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                  className={inputCls}
                >
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                </select>
              </Field>
            </div>

            <FingerprintPanel
              status={status}
              onCapture={handleCapture}
              deviceSelected={Boolean(form.device)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-white rounded-b-2xl">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSaving}
            className="px-6 h-11 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                className="px-6 h-11 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(3, s + 1))}
              disabled={step >= 3 || !canProceed}
              className="px-6 h-11 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FingerprintEnrollmentModal;