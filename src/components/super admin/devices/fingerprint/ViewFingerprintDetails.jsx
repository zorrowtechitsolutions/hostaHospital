// src/components/super-admin/devices/fingerprint/ViewFingerprintDetails.jsx
import React, { useMemo, useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  ArrowLeft, Fingerprint, User, Building2, Briefcase,
  Calendar, Clock, Cpu, CheckCircle2, AlertCircle, RefreshCcw,
  Trash2, Info, Mail, Phone, MapPin, Loader2,
  ShieldCheck, ShieldAlert, Stethoscope, IdCard,
} from 'lucide-react';

import {
  useGetFingerprintEnrollmentByIdQuery,
  useGetAllFingerprintEnrollmentsQuery,
  useDeactivateFingerprintEnrollmentMutation,
} from '../../../../../app/service/fingerprint';
import { useGetDoctorsQuery } from '../../../../../app/service/doctorApi';
import { useGetStaffQuery } from '../../../../../app/service/staffApi';
import { Button } from '../../../ui';
import { showSuccessToast } from '../../../ui/Toast';
import { Avatar as ShadcnAvatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getS3ImageUrl } from '../../../../../app/service/S3';

const formatDate = (value) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return String(value); }
};

const formatDateOnly = (value) => {
  if (!value) return 'N/A';
  try {
    return new Date(value).toLocaleDateString('en-US', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch { return String(value); }
};

const safeText = (value, fallback = '—') => {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    const joined = value.map((v) => safeText(v, '')).filter(Boolean).join(', ');
    return joined || fallback;
  }
  if (typeof value === 'object') {
    const c = value.name ?? value.label ?? value.title ?? value.displayName ?? value.value ?? value._id ?? value.id;
    if (c !== undefined && c !== null) return safeText(c, fallback);
    return fallback;
  }
  return fallback;
};

const formatAddress = (value, fallback = '—') => {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && !Array.isArray(value)) {
    const parts = [
      value.place || value.line1 || value.street || value.addressLine1,
      value.line2 || value.addressLine2,
      value.district || value.city || value.town,
      value.state, value.country,
      value.pincode || value.zip || value.postalCode,
    ].filter((p) => p !== undefined && p !== null && p !== '');
    return parts.length ? parts.join(', ') : fallback;
  }
  if (Array.isArray(value)) {
    const joined = value.map((v) => formatAddress(v, '')).filter(Boolean).join(', ');
    return joined || fallback;
  }
  return fallback;
};

const ViewFingerprintDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { memberKey } = useParams();

  const stateMember = location.state?.member || null;
  const stateHospitalId = location.state?.hospitalId || null;
  const stateHospitalName = location.state?.hospitalName || null;

  const decodedMemberKey = useMemo(() => {
    if (!memberKey) return null;
    try { return decodeURIComponent(memberKey); } catch { return memberKey; }
  }, [memberKey]);

  const parsedKey = useMemo(() => {
    if (!decodedMemberKey) return null;
    const [rawType, ...rest] = decodedMemberKey.split('-');
    const id = rest.join('-');
    if (!rawType || !id) return null;
    const type =
      rawType.toLowerCase() === 'doctor' ? 'Doctor'
      : rawType.toLowerCase() === 'staff' ? 'Staff'
      : null;
    return type ? { type, id } : null;
  }, [decodedMemberKey]);

  const [member, setMember] = useState(stateMember);

  const hospitalId =
    stateMember?.hospitalId || stateHospitalId || null;
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

  // Fallback: fetch member if not in state
  const { data: doctorsResponse } = useGetDoctorsQuery(
    { page: 1, limit: 1000, hospitalId },
    { skip: !!stateMember || !hospitalId || parsedKey?.type !== 'Doctor' }
  );
  const { data: staffResponse } = useGetStaffQuery(
    { page: 1, limit: 1000, hospitalId },
    { skip: !!stateMember || !hospitalId || parsedKey?.type !== 'Staff' }
  );

  useEffect(() => {
    if (stateMember || !parsedKey || !hospitalId) return;

    if (parsedKey.type === 'Doctor') {
      const doc = (doctorsResponse?.data || []).find(
        (d) => String(d.id || d.doctorNumber || d.authId) === String(parsedKey.id)
      );
      if (doc) {
        setMember({
          key: decodedMemberKey,
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
          designation: doc.designation || doc.qualification || 'Consultant',
          image: doc.image || doc.imageUrl || doc.imageKey || doc.profileImage,
          email: doc.email,
          phone: doc.phone,
          hospitalId: doc.hospitalId || hospitalId,
          hospitalName: doc.hospitalName || doc?.hospital?.name || hospitalName,
          gender: doc.gender,
          dob: doc.dob,
          address: doc.address,
          joiningDate: doc.joiningDate || doc.createdAt,
        });
      }
    } else {
      const st = (staffResponse?.data || []).find(
        (s) => String(s.id || s.staffNumber || s.authId) === String(parsedKey.id)
      );
      if (st) {
        setMember({
          key: decodedMemberKey,
          id: st.id,
          type: 'Staff',
          number: st.staffNumber
            ? `#STF${String(st.staffNumber).padStart(5, '0')}`
            : `#STF${String(st.id || '00000').padStart(5, '0')}`,
          rawNumber: st.staffNumber || st.id,
          name: st.name || `${st.firstName || ''} ${st.lastName || ''}`.trim() || 'N/A',
          department: st.department || st.designation || st.staffType || 'Administration',
          designation: st.designation || st.staffType || 'Staff',
          image: st.profileImage || st.imageUrl || st.imageKey || st.image,
          email: st.email,
          phone: st.phone,
          hospitalId: st.hospitalId || hospitalId,
          hospitalName: st.hospitalName || st?.hospital?.name || hospitalName,
          gender: st.gender,
          dob: st.dob,
          address: st.address,
          joiningDate: st.joiningDate || st.createdAt,
        });
      }
    }
  }, [stateMember, parsedKey, hospitalId, hospitalName, doctorsResponse, staffResponse, decodedMemberKey]);

  // Enrollment lookup
  const shouldLookupEnrollment = !stateMember?.fingerprintId && !!parsedKey;

  const { data: lookupResponse } = useGetAllFingerprintEnrollmentsQuery(
    shouldLookupEnrollment
      ? {
          hospitalId,
          employeeType: parsedKey.type,
          employeeId: parsedKey.id,
          status: 'Active',
          limit: 1,
        }
      : undefined,
    { skip: !shouldLookupEnrollment || !hospitalId }
  );

  const enrollmentId =
    stateMember?.fingerprintId || lookupResponse?.data?.[0]?.id || null;

  const {
    data: enrollmentResponse,
    isLoading: enrollmentLoading,
    isFetching: enrollmentFetching,
    refetch: refetchEnrollment,
  } = useGetFingerprintEnrollmentByIdQuery(
    { id: enrollmentId },
    { skip: !enrollmentId }
  );

  const [deactivateEnrollment, { isLoading: isDeactivating }] =
    useDeactivateFingerprintEnrollmentMutation();

  const enrollment = enrollmentResponse?.data || null;
  const lookupEnrollment = lookupResponse?.data?.[0] || null;

  const display = useMemo(() => {
    return {
      name: enrollment?.employeeName || member?.name || lookupEnrollment?.employeeName || 'N/A',
      employeeType: enrollment?.employeeType || member?.type || lookupEnrollment?.employeeType || '—',
      employeeId: enrollment?.employeeId || member?.id || lookupEnrollment?.employeeId || '—',
      employeeCode: enrollment?.employeeCode || member?.number || lookupEnrollment?.employeeCode || '—',
      department: enrollment?.department || member?.department || lookupEnrollment?.department || '—',
      designation: member?.designation || '—',
      email: member?.email || '—',
      phone: member?.phone || '—',
      address: member?.address || '—',
      image: member?.image || null,
      hospitalName: hospitalName,
      gender: member?.gender || '—',
      dob: member?.dob || null,
      joiningDate: member?.joiningDate || null,
      deviceId: enrollment?.deviceId || member?.fingerprintDevice || '—',
      fingerPosition: enrollment?.fingerPosition || '—',
      fingerprintHash: enrollment?.fingerprintHash || '—',
      templateReference: enrollment?.templateReference || '—',
      quality: enrollment?.quality || '—',
      attempts: enrollment?.attempts ?? '—',
      status: enrollment?.status || (enrollmentId ? 'Active' : 'Not Enrolled'),
      enrolledAt: enrollment?.enrolledAt || member?.fingerprintEnrolledAt || null,
    };
  }, [enrollment, member, lookupEnrollment, enrollmentId, hospitalName]);

  useEffect(() => {
    if (enrollmentId) refetchEnrollment();
  }, [enrollmentId, refetchEnrollment]);

  const isEnrolled = Boolean(enrollmentId) && display.status === 'Active';

  const handleRefresh = async () => {
    if (enrollmentId) await refetchEnrollment();
  };

  const handleRemove = async () => {
    if (!enrollmentId) {
      showSuccessToast('No fingerprint enrolled for this member', 2000);
      return;
    }
    if (!window.confirm(
      `Are you sure you want to remove the fingerprint from ${safeText(display.name, 'this member')}?`
    )) return;

    try {
      await deactivateEnrollment({ id: enrollmentId }).unwrap();
      showSuccessToast(`Fingerprint removed from ${safeText(display.name, 'member')}`, 2500);
      goBack();
    } catch (err) {
      console.error('Failed to remove fingerprint:', err);
    }
  };

  if (!member) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-6">
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Member not found</h2>
          <p className="text-sm text-gray-500 mb-4">Please navigate from the Fingerprints list.</p>
          <Button variant="primary" onClick={goBack}>Go to list</Button>
        </div>
      </div>
    );
  }

  const loading = enrollmentId && enrollmentLoading;
  const displayName = safeText(display.name, 'N/A');
  const avatarInitial = displayName.charAt(0).toUpperCase() || 'U';
  const formattedAddress = formatAddress(display.address, '');
  const isDoctor = safeText(display.employeeType, '').toLowerCase() === 'doctor';

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 font-sans">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Button variant="ghost" size="icon" onClick={goBack} className="p-1 h-auto w-auto hover:bg-gray-200 rounded transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </Button>
          <div className="text-xs text-gray-500 flex flex-wrap items-center">
            <span className="text-gray-700">Super Admin</span>
            <span className="mx-1 text-gray-400">»</span>
            <span className="cursor-pointer hover:text-gray-700" onClick={() => navigate('/super-admin/hospitals')}>Hospitals</span>
            <span className="mx-1 text-gray-400">»</span>
            <span
              className={`truncate max-w-[180px] ${hospitalId ? 'cursor-pointer hover:text-gray-700' : ''}`}
              onClick={() => hospitalId && navigate(`/super-admin/hospitals/${hospitalId}`, { state: { hospitalId, hospitalName } })}
              title={hospitalName}
            >
              {hospitalName}
            </span>
            <span className="mx-1 text-gray-400">»</span>
            <span className="cursor-pointer hover:text-gray-700" onClick={goBack}>Attendance Devices</span>
            <span className="mx-1 text-gray-400">»</span>
            <span>Fingerprint Details</span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Fingerprint Details</h1>
            <p className="text-sm text-gray-500 mt-1">Enrollment and device information for {displayName}</p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={enrollmentFetching || !enrollmentId}
            className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50 h-auto w-auto"
          >
            <RefreshCcw size={16} className={enrollmentFetching ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1 space-y-5">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-blue-500 to-indigo-600" />
            <div className="px-5 pb-5 -mt-12">
              <ShadcnAvatar className="w-24 h-24 rounded-full border-4 border-white shadow-md">
                <AvatarImage src={getS3ImageUrl(display.image)} alt={displayName} className="object-cover" />
                <AvatarFallback className="bg-gray-100 text-gray-500 text-2xl font-semibold">
                  {avatarInitial}
                </AvatarFallback>
              </ShadcnAvatar>

              <div className="mt-3">
                <h2 className="text-lg font-bold text-gray-800 truncate">{displayName}</h2>
                <p className="text-xs text-gray-500 mt-0.5">{safeText(display.employeeCode)}</p>
                <span className={`inline-flex items-center gap-1.5 mt-2 text-xs font-medium px-2.5 py-1 rounded-full ${isDoctor ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>
                  {isDoctor ? <><Stethoscope size={12} /> Doctor</> : <><Briefcase size={12} /> Staff</>}
                </span>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                <StatusPill label="Enrollment" status={display.status} />
                <StatusPill label="Fingerprint" status={isEnrolled ? 'Enrolled' : 'Not Enrolled'} />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <Fingerprint size={16} className="text-indigo-600" />
              <h3 className="text-sm font-semibold text-gray-700">Fingerprint Enrollment</h3>
            </div>
            <div className="p-5">
              {isEnrolled ? (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center">
                      <Fingerprint size={22} className="text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">Finger Position</p>
                      <p className="text-sm font-semibold text-gray-800 truncate">{safeText(display.fingerPosition)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg px-3 py-2 mb-4">
                    <ShieldCheck size={16} />
                    <span className="text-xs font-medium">Fingerprint is active and enrolled</span>
                  </div>

                  <Button
                    variant="outline"
                    fullWidth
                    onClick={handleRemove}
                    disabled={isDeactivating}
                    className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-red-600 border border-red-300 hover:bg-red-50 rounded-lg py-2.5 disabled:opacity-60"
                  >
                    {isDeactivating ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Removing…</>
                    ) : (
                      <><Trash2 size={15} /> Remove Fingerprint</>
                    )}
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center">
                    <ShieldAlert size={22} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">No fingerprint enrolled</p>
                    <p className="text-xs text-gray-500 mt-0.5">This member has no fingerprint on record yet.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-5">
          <DetailSection title="Personal Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <DetailItem icon={<User size={16} className="text-gray-400" />} label="Full Name" value={display.name} />
              <DetailItem icon={<User size={16} className="text-gray-400" />} label="Gender" value={display.gender} />
              <DetailItem icon={<Calendar size={16} className="text-gray-400" />} label="Date of Birth" value={display.dob ? formatDateOnly(display.dob) : 'N/A'} />
              <DetailItem icon={<Mail size={16} className="text-gray-400" />} label="Email" value={display.email} />
              <DetailItem icon={<Phone size={16} className="text-gray-400" />} label="Phone" value={display.phone} />
            </div>
          </DetailSection>

          <DetailSection title="Employment Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <DetailItem icon={<IdCard size={16} className="text-gray-400" />} label="Employee ID" value={display.employeeCode} />
              <DetailItem
                icon={isDoctor ? <Stethoscope size={16} className="text-gray-400" /> : <Briefcase size={16} className="text-gray-400" />}
                label="Role / Type"
                value={display.employeeType}
              />
              <DetailItem icon={<Briefcase size={16} className="text-gray-400" />} label="Designation" value={display.designation} />
              <DetailItem icon={<Stethoscope size={16} className="text-gray-400" />} label="Department" value={display.department} />
              <DetailItem icon={<Building2 size={16} className="text-gray-400" />} label="Hospital" value={display.hospitalName} />
              <DetailItem icon={<Clock size={16} className="text-gray-400" />} label="Joining Date" value={display.joiningDate ? formatDateOnly(display.joiningDate) : 'N/A'} />
            </div>
          </DetailSection>

          <DetailSection title="Fingerprint Information">
            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : isEnrolled ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <DetailItem icon={<Cpu size={16} className="text-gray-400" />} label="Device" value={display.deviceId} mono />
                <DetailItem icon={<Fingerprint size={16} className="text-gray-400" />} label="Finger Position" value={display.fingerPosition} />
                <DetailItem icon={<CheckCircle2 size={16} className="text-gray-400" />} label="Quality" value={display.quality} />
                <DetailItem icon={<RefreshCcw size={16} className="text-gray-400" />} label="Capture Attempts" value={display.attempts} />
                <DetailItem icon={<Clock size={16} className="text-gray-400" />} label="Enrolled At" value={display.enrolledAt ? formatDate(display.enrolledAt) : '—'} />
                <DetailItem icon={<AlertCircle size={16} className="text-gray-400" />} label="Status" value={display.status} />
              </div>
            ) : (
              <div className="flex items-center gap-3 py-2">
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Fingerprint size={18} className="text-amber-600" />
                </div>
                <p className="text-sm text-gray-500">No fingerprint enrollment data available.</p>
              </div>
            )}

            {isEnrolled && safeText(display.fingerprintHash, '') !== '—' && (
              <div className="mt-5 pt-5 border-t border-gray-100">
                <div className="flex items-start gap-2 mb-2">
                  <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-500 leading-relaxed">
                    The fingerprint template is stored as a one-way SHA-256 hash. The raw template never leaves the device.
                  </p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-1">Fingerprint Hash</p>
                  <p className="font-mono text-[12px] text-gray-700 break-all">{safeText(display.fingerprintHash)}</p>
                </div>
              </div>
            )}
          </DetailSection>

          {formattedAddress && formattedAddress !== '—' && (
            <DetailSection title="Address">
              <DetailItem icon={<MapPin size={16} className="text-gray-400" />} label="Address" value={formattedAddress} />
            </DetailSection>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={goBack}
              className="text-sm font-semibold text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-lg px-5 py-2.5"
            >
              Close
            </Button>
            {isEnrolled && (
              <Button
                variant="primary"
                onClick={handleRemove}
                disabled={isDeactivating}
                className="inline-flex items-center gap-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg px-5 py-2.5 disabled:opacity-60"
              >
                {isDeactivating ? (
                  <><Loader2 size={14} className="animate-spin" /> Removing…</>
                ) : (
                  <><Trash2 size={14} /> Remove Fingerprint</>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const DetailSection = ({ title, children }) => (
  <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
    <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
      <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const DetailItem = ({ icon, label, value, mono = false }) => (
  <div className="flex items-start gap-3">
    <div className="mt-0.5 shrink-0">{icon}</div>
    <div className="min-w-0 flex-1">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={['text-sm font-medium text-gray-800 break-words', mono ? 'font-mono text-[13px]' : ''].join(' ')}>
        {safeText(value)}
      </p>
    </div>
  </div>
);

const StatusPill = ({ label, status }) => {
  const isActive = status === 'Active' || status === 'Enrolled';
  const isWarning = status === 'Not Enrolled' || status === 'Inactive';
  const isDanger = status === 'Blacklisted';
  const colorClass = isDanger
    ? 'bg-red-50 text-red-700 border-red-100'
    : isWarning
    ? 'bg-amber-50 text-amber-700 border-amber-100'
    : isActive
    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
    : 'bg-gray-50 text-gray-600 border-gray-100';

  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-gray-500">{label}</span>
      <span className={`inline-flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-full border ${colorClass}`}>
        {status}
      </span>
    </div>
  );
};

export default ViewFingerprintDetails;