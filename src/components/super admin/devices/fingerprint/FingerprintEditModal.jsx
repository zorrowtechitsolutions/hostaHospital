// src/components/super-admin/devices/fingerprint/FingerprintEditModal.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Fingerprint, User, Info, Lightbulb, ArrowLeft, Loader2, Save,
} from 'lucide-react';
import { useGetDoctorsQuery } from '../../../../../app/service/doctorApi';
import { useGetStaffQuery } from '../../../../../app/service/staffApi';
import {
  useGetAllFingerprintEnrollmentsQuery,
  useUpdateFingerprintEnrollmentMutation,
} from '../../../../../app/service/fingerprint';
import { useGetDevicesQuery } from '../../../../../app/service/device';
import { showSuccessToast, showErrorToast } from '../../../ui/Toast';

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

const FingerprintEditModal = () => {
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

  const { data: enrollmentsResponse, isLoading: enrollmentsLoading } =
    useGetAllFingerprintEnrollmentsQuery(
      { hospitalId, limit: 1000 },
      { skip: !hospitalId }
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
    const doctors = doctorsResponse?.data || [];
    const staff = staffResponse?.data || [];
    const enrollments = enrollmentsResponse?.data || [];

    const enrollmentByKey = new Map(
      enrollments.map((e) => [`${e.employeeType}-${e.employeeId}`, e])
    );

    if (stateMember) {
      const enr = enrollmentByKey.get(`${stateMember.type}-${stateMember.id}`);
      return { ...stateMember, enrollment: enr || null };
    }

    if (!parsedKey) return null;

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
        fingerprintId: enr?.id || null,
        enrollment: enr || null,
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
      fingerprintId: enr?.id || null,
      enrollment: enr || null,
    };
  }, [stateMember, parsedKey, doctorsResponse, staffResponse, enrollmentsResponse, routeKey, hospitalName]);

  const isLoadingMember =
    !stateMember && !resolvedMember && (doctorsLoading || staffLoading);
  const isLoadingEnrollment =
    !stateMember && !resolvedMember && enrollmentsLoading;

  const [form, setForm] = useState({
    hospital: '',
    employeeType: '',
    employeeId: '',
    name: '',
    department: '',
    deviceId: '',
    fingerPosition: 'Right Thumb',
    quality: '',
    attempts: 1,
    status: 'Active',
  });

  useEffect(() => {
    if (!resolvedMember) return;

    const enr = resolvedMember.enrollment || null;
    const displayId =
      resolvedMember.number?.replace(/^#/, '') ||
      (resolvedMember.rawNumber != null ? String(resolvedMember.rawNumber) : '');

    setForm({
      hospital: hospitalName,
      employeeType: resolvedMember.type || '',
      employeeId: displayId,
      name: resolvedMember.name || '',
      department: resolvedMember.department || '',
      deviceId: enr?.deviceId || resolvedMember.fingerprintDevice || '',
      fingerPosition: enr?.fingerPosition || 'Right Thumb',
      quality: enr?.quality || '',
      attempts: enr?.attempts ?? 1,
      status: enr?.status || 'Active',
    });
  }, [resolvedMember, hospitalName]);

  const update = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const [updateEnrollment, { isLoading: isSaving }] =
    useUpdateFingerprintEnrollmentMutation();

  const handleSave = async (e) => {
    e.preventDefault();

    if (!resolvedMember?.fingerprintId) {
      showErrorToast('No enrollment found to update.');
      return;
    }
    if (!form.deviceId) {
      showErrorToast('Please select a fingerprint device.');
      return;
    }

    try {
      await updateEnrollment({
        id: resolvedMember.fingerprintId,
        deviceId: form.deviceId,
        fingerPosition: form.fingerPosition,
        quality: form.quality || undefined,
        attempts: Number(form.attempts) || undefined,
        status: form.status,
      }).unwrap();

      showSuccessToast('Fingerprint enrollment updated successfully.');
      setTimeout(() => goBack(), 800);
    } catch (err) {
      console.error('Update failed:', err);
      showErrorToast(
        err?.data?.message || err?.error || 'Failed to update fingerprint.'
      );
    }
  };

  const handleCancel = () => goBack();

  if (isLoadingMember || isLoadingEnrollment) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-6 flex items-center justify-center">
        <div className="flex flex-col items-center text-gray-400">
          <Loader2 size={36} className="mb-3 animate-spin opacity-60" />
          <p className="text-sm font-medium text-gray-500">Loading enrollment…</p>
        </div>
      </div>
    );
  }

  if (!resolvedMember || !resolvedMember.fingerprintId) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-6">
        <div className="mt-8 flex flex-col items-center text-gray-400">
          <Fingerprint size={40} className="mb-3 text-rose-400" />
          <p className="text-sm font-medium text-rose-500">Enrollment not found</p>
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
              onClick={() => hospitalId && navigate(`/super-admin/hospitals/${hospitalId}`, { state: { hospitalId, hospitalName } })}
              title={hospitalName}
            >
              {hospitalName}
            </span>
            <span className="mx-1 text-gray-400">»</span>
            <span className="cursor-pointer hover:text-gray-700" onClick={handleCancel}>Fingerprints</span>
            <span className="mx-1 text-gray-400">»</span>
            <span>Edit Fingerprint</span>
          </div>
        </div>
        <h1 className="text-xl font-bold text-gray-800">Edit Fingerprint Enrollment</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 max-w-6xl mx-auto">
        <form onSubmit={handleSave}>
          <div className="px-6 py-6">
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
              </div>

              <div className="border border-gray-200 rounded-xl p-6 bg-white">
                <div className="flex items-center gap-2 mb-5">
                  <Fingerprint className="w-5 h-5 text-blue-600" />
                  <h3 className="text-base font-semibold text-gray-800">Fingerprint Details</h3>
                </div>

                <Field label="Device" required>
                  <select
                    value={form.deviceId}
                    onChange={update('deviceId')}
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
                  <select value={form.fingerPosition} onChange={update('fingerPosition')} className={inputCls}>
                    <option>Right Thumb</option>
                    <option>Right Index</option>
                    <option>Right Middle</option>
                    <option>Right Ring</option>
                    <option>Right Little</option>
                    <option>Left Thumb</option>
                    <option>Left Index</option>
                    <option>Left Middle</option>
                    <option>Left Ring</option>
                    <option>Left Little</option>
                  </select>
                </Field>

                <Field label="Quality">
                  <input type="text" value={form.quality} onChange={update('quality')} className={inputCls} placeholder="e.g. 85" />
                </Field>

                <Field label="Attempts">
                  <input type="number" min={1} value={form.attempts} onChange={update('attempts')} className={inputCls} />
                </Field>

                <Field label="Status" required>
                  <select value={form.status} onChange={update('status')} className={inputCls}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </Field>

                <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-lg px-3.5 py-3 mt-2">
                  <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-800 leading-relaxed">
                    The raw fingerprint template cannot be edited here. To re-capture, deactivate this enrollment and enroll again.
                  </p>
                </div>
              </div>
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
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 h-11 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {isSaving ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Saving…</>
              ) : (
                <><Save className="w-4 h-4" />Save Changes</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FingerprintEditModal;