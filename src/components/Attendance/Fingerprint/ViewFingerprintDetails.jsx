// src/components/Attendance/Fingerprint/ViewFingerprintDetails.jsx
import React, { useMemo, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  ArrowLeft, Fingerprint, User, Building2, Briefcase, Hash,
  Calendar, Clock, Cpu, CheckCircle2, AlertCircle, RefreshCcw,
  Trash2, Info, Mail, Phone, MapPin, Loader2, BadgeCheck,
  ShieldCheck, ShieldAlert, Stethoscope, IdCard,
} from 'lucide-react';

import {
  useGetFingerprintEnrollmentByIdQuery,
  useGetAllFingerprintEnrollmentsQuery,
  useDeactivateFingerprintEnrollmentMutation,
} from '../../../../app/service/fingerprint';
import { Button } from '../../ui';
import { showSuccessToast } from '../../ui/Toast';
import {
  Avatar as ShadcnAvatar,
  AvatarImage,
  AvatarFallback,
} from '@/components/ui/avatar';
import { getS3ImageUrl } from '../../../../app/service/S3';

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
const formatDate = (value) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(value);
  }
};

const formatDateOnly = (value) => {
  if (!value) return 'N/A';
  try {
    return new Date(value).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return String(value);
  }
};

/**
 * Safely convert any value (string, number, object, array, null) to a
 * renderable string. Prevents "Objects are not valid as a React child"
 * crashes when the API returns populated/nested fields.
 */
const safeText = (value, fallback = '—') => {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  if (Array.isArray(value)) {
    const joined = value
      .map((v) => safeText(v, ''))
      .filter(Boolean)
      .join(', ');
    return joined || fallback;
  }

  if (typeof value === 'object') {
    const candidate =
      value.name ??
      value.label ??
      value.title ??
      value.displayName ??
      value.value ??
      value._id ??
      value.id;
    if (candidate !== undefined && candidate !== null) {
      return safeText(candidate, fallback);
    }
    return fallback;
  }

  return fallback;
};

/**
 * Format an address value (object or string) into a readable one-liner.
 */
const formatAddress = (value, fallback = '—') => {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'string') return value;

  if (typeof value === 'object' && !Array.isArray(value)) {
    const parts = [
      value.place || value.line1 || value.street || value.addressLine1,
      value.line2 || value.addressLine2,
      value.district || value.city || value.town,
      value.state,
      value.country,
      value.pincode || value.zip || value.postalCode,
    ]
      .map((p) => (typeof p === 'string' ? p.trim() : p))
      .filter((p) => p !== undefined && p !== null && p !== '');

    if (parts.length) return parts.join(', ');
    return fallback;
  }

  if (Array.isArray(value)) {
    const joined = value
      .map((v) => formatAddress(v, ''))
      .filter(Boolean)
      .join(', ');
    return joined || fallback;
  }

  return fallback;
};

/**
 * Parse a member key like "doctor-123" or "staff-456"
 * into { type: 'Doctor' | 'Staff', id: string }.
 */
const parseMemberKey = (key) => {
  if (!key) return null;
  const [rawType, ...rest] = String(key).split('-');
  const id = rest.join('-');
  if (!rawType || !id) return null;
  const type =
    rawType.toLowerCase() === 'doctor'
      ? 'Doctor'
      : rawType.toLowerCase() === 'staff'
      ? 'Staff'
      : null;
  if (!type) return null;
  return { type, id };
};

// ------------------------------------------------------------
// Sub-components (mirrors ViewAccessCardDetails)
// ------------------------------------------------------------
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
      <p
        className={[
          'text-sm font-medium text-gray-800 break-words',
          mono ? 'font-mono text-[13px]' : '',
        ].join(' ')}
      >
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
      <span
        className={`inline-flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-full border ${colorClass}`}
      >
        {isActive && !isWarning && !isDanger && <CheckCircle2 size={11} />}
        {isWarning && <AlertCircle size={11} />}
        {isDanger && <ShieldAlert size={11} />}
        {status}
      </span>
    </div>
  );
};

// ------------------------------------------------------------
// Main
// ------------------------------------------------------------
const ViewFingerprintDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { memberKey } = useParams();

  const memberFromState = location.state?.member || null;
  const parsedKey = useMemo(() => parseMemberKey(memberKey), [memberKey]);

  const member = useMemo(() => {
    if (memberFromState) return memberFromState;
    if (!parsedKey) return null;
    return {
      key: memberKey,
      id: parsedKey.id,
      type: parsedKey.type,
      name: 'Loading…',
      fingerprintId: null,
    };
  }, [memberFromState, parsedKey, memberKey]);

  // Fallback lookup
  const shouldLookupEnrollment =
    !memberFromState?.fingerprintId && !!parsedKey;

  const { data: lookupResponse } = useGetAllFingerprintEnrollmentsQuery(
    shouldLookupEnrollment
      ? {
          employeeType: parsedKey.type,
          employeeId: parsedKey.id,
          status: 'Active',
          limit: 1,
        }
      : undefined,
    { skip: !shouldLookupEnrollment }
  );

  const enrollmentId =
    memberFromState?.fingerprintId ||
    lookupResponse?.data?.[0]?.id ||
    null;

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
      name:
        enrollment?.employeeName ||
        memberFromState?.name ||
        lookupEnrollment?.employeeName ||
        'N/A',
      employeeType:
        enrollment?.employeeType ||
        memberFromState?.type ||
        lookupEnrollment?.employeeType ||
        '—',
      employeeId:
        enrollment?.employeeId ||
        memberFromState?.id ||
        lookupEnrollment?.employeeId ||
        '—',
      employeeCode:
        enrollment?.employeeCode ||
        memberFromState?.number ||
        lookupEnrollment?.employeeCode ||
        '—',
      department:
        enrollment?.department ||
        memberFromState?.department ||
        lookupEnrollment?.department ||
        '—',
      designation: memberFromState?.designation || '—',
      email: memberFromState?.email || '—',
      phone: memberFromState?.phone || '—',
      address: memberFromState?.address || '—',
      image: memberFromState?.image || null,
      hospitalName: memberFromState?.hospitalName || '—',
      gender: memberFromState?.gender || '—',
      dob: memberFromState?.dob || null,
      joiningDate: memberFromState?.joiningDate || null,
      deviceId:
        enrollment?.deviceId ||
        memberFromState?.fingerprintDevice ||
        '—',
      fingerPosition: enrollment?.fingerPosition || '—',
      fingerprintHash: enrollment?.fingerprintHash || '—',
      templateReference: enrollment?.templateReference || '—',
      quality: enrollment?.quality || '—',
      attempts: enrollment?.attempts ?? '—',
      status:
        enrollment?.status ||
        (enrollmentId ? 'Active' : 'Not Enrolled'),
      enrolledAt:
        enrollment?.enrolledAt ||
        memberFromState?.fingerprintEnrolledAt ||
        null,
    };
  }, [enrollment, memberFromState, lookupEnrollment, enrollmentId]);

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

    const confirmed = window.confirm(
      `Are you sure you want to remove the fingerprint from ${safeText(
        display.name,
        'this member'
      )}? This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await deactivateEnrollment({ id: enrollmentId }).unwrap();
      showSuccessToast(
        `Fingerprint removed from ${safeText(display.name, 'member')}`,
        2500
      );
      navigate('/attendance/fingerprint/assign');
    } catch (err) {
      console.error('Failed to remove fingerprint:', err);
    }
  };

  // --------------------------------------------------------
  // Guard: nothing to show
  // --------------------------------------------------------
  if (!member) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-6">
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-800 mb-1">
            Member not found
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Please navigate here from the Assign Fingerprint list.
          </p>
          <Button
            variant="primary"
            onClick={() => navigate('/attendance/fingerprint/assign')}
          >
            Go to list
          </Button>
        </div>
      </div>
    );
  }

  const loading = enrollmentId && enrollmentLoading;
  const displayName = safeText(display.name, 'N/A');
  const avatarInitial = displayName.charAt(0).toUpperCase() || 'U';
  const formattedAddress = formatAddress(display.address, '');

  const isDoctor =
    safeText(display.employeeType, '').toLowerCase() === 'doctor';

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 font-sans">
      {/* ------------------------------------------------
          Header / Breadcrumb
      ------------------------------------------------ */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="p-1 h-auto w-auto hover:bg-gray-200 rounded transition-colors"
            title="Go back"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </Button>
          <div className="text-xs text-gray-500">
            <span className="text-gray-700">Fingerprint</span>
            <span className="mx-1 text-gray-400">»</span>
            <span
              className="cursor-pointer hover:text-gray-700"
              onClick={() => navigate('/attendance/fingerprint/assign')}
            >
              Home
            </span>
            <span className="mx-1 text-gray-400">»</span>
            <span>View Details</span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              Fingerprint Details
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Enrollment and device information for {displayName}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={enrollmentFetching || !enrollmentId}
              title="Refresh"
              className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50 h-auto w-auto"
            >
              <RefreshCcw
                size={16}
                className={enrollmentFetching ? 'animate-spin' : ''}
              />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ------------------------------------------------
            LEFT COLUMN: Profile Card + Fingerprint Summary
        ------------------------------------------------ */}
        <div className="lg:col-span-1 space-y-5">
          {/* Profile */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-blue-500 to-indigo-600" />
            <div className="px-5 pb-5 -mt-12">
              <ShadcnAvatar className="w-24 h-24 rounded-full border-4 border-white shadow-md">
                <AvatarImage
                  src={getS3ImageUrl(display.image)}
                  alt={displayName}
                  className="object-cover"
                />
                <AvatarFallback className="bg-gray-100 text-gray-500 text-2xl font-semibold">
                  {avatarInitial}
                </AvatarFallback>
              </ShadcnAvatar>

              <div className="mt-3">
                <h2 className="text-lg font-bold text-gray-800 truncate">
                  {displayName}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {safeText(display.employeeCode)}
                </p>

                <span
                  className={`inline-flex items-center gap-1.5 mt-2 text-xs font-medium px-2.5 py-1 rounded-full ${
                    isDoctor
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {isDoctor ? (
                    <>
                      <Stethoscope size={12} /> Doctor
                    </>
                  ) : (
                    <>
                      <Briefcase size={12} /> Staff
                    </>
                  )}
                </span>
              </div>

              {/* Quick status */}
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                <StatusPill label="Enrollment" status={display.status} />
                <StatusPill
                  label="Fingerprint"
                  status={isEnrolled ? 'Enrolled' : 'Not Enrolled'}
                />
              </div>
            </div>
          </div>

          {/* Fingerprint Summary — with Remove action */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <Fingerprint size={16} className="text-indigo-600" />
              <h3 className="text-sm font-semibold text-gray-700">
                Fingerprint Enrollment
              </h3>
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
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {safeText(display.fingerPosition)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg px-3 py-2 mb-4">
                    <ShieldCheck size={16} />
                    <span className="text-xs font-medium">
                      Fingerprint is active and enrolled
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    fullWidth
                    onClick={handleRemove}
                    disabled={isDeactivating}
                    className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-red-600 border border-red-300 hover:bg-red-50 rounded-lg py-2.5 disabled:opacity-60"
                  >
                    {isDeactivating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Removing…
                      </>
                    ) : (
                      <>
                        <Trash2 size={15} /> Remove Fingerprint
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center">
                    <ShieldAlert size={22} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      No fingerprint enrolled
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      This member has no fingerprint on record yet.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ------------------------------------------------
            RIGHT COLUMN: Details
        ------------------------------------------------ */}
        <div className="lg:col-span-2 space-y-5">
          {/* Personal Information */}
          <DetailSection title="Personal Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <DetailItem
                icon={<User size={16} className="text-gray-400" />}
                label="Full Name"
                value={display.name}
              />
              <DetailItem
                icon={<User size={16} className="text-gray-400" />}
                label="Gender"
                value={display.gender}
              />
              <DetailItem
                icon={<Calendar size={16} className="text-gray-400" />}
                label="Date of Birth"
                value={display.dob ? formatDateOnly(display.dob) : 'N/A'}
              />
              <DetailItem
                icon={<Mail size={16} className="text-gray-400" />}
                label="Email"
                value={display.email}
              />
              <DetailItem
                icon={<Phone size={16} className="text-gray-400" />}
                label="Phone"
                value={display.phone}
              />
            </div>
          </DetailSection>

          {/* Employment Information */}
          <DetailSection title="Employment Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <DetailItem
                icon={<IdCard size={16} className="text-gray-400" />}
                label="Employee ID"
                value={display.employeeCode}
              />
              <DetailItem
                icon={
                  isDoctor ? (
                    <Stethoscope size={16} className="text-gray-400" />
                  ) : (
                    <Briefcase size={16} className="text-gray-400" />
                  )
                }
                label="Role / Type"
                value={display.employeeType}
              />
              <DetailItem
                icon={<Briefcase size={16} className="text-gray-400" />}
                label="Designation"
                value={display.designation}
              />
              <DetailItem
                icon={<Stethoscope size={16} className="text-gray-400" />}
                label="Department"
                value={display.department}
              />
              <DetailItem
                icon={<Building2 size={16} className="text-gray-400" />}
                label="Hospital"
                value={display.hospitalName}
              />
              <DetailItem
                icon={<Clock size={16} className="text-gray-400" />}
                label="Joining Date"
                value={display.joiningDate ? formatDateOnly(display.joiningDate) : 'N/A'}
              />
            </div>
          </DetailSection>

          {/* Fingerprint Information */}
          <DetailSection title="Fingerprint Information">
            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="h-12 bg-gray-100 rounded animate-pulse"
                  />
                ))}
              </div>
            ) : isEnrolled ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <DetailItem
                  icon={<Cpu size={16} className="text-gray-400" />}
                  label="Device"
                  value={display.deviceId}
                  mono
                />
                <DetailItem
                  icon={<Fingerprint size={16} className="text-gray-400" />}
                  label="Finger Position"
                  value={display.fingerPosition}
                />
                <DetailItem
                  icon={<CheckCircle2 size={16} className="text-gray-400" />}
                  label="Quality"
                  value={display.quality}
                />
                <DetailItem
                  icon={<RefreshCcw size={16} className="text-gray-400" />}
                  label="Capture Attempts"
                  value={display.attempts}
                />
                <DetailItem
                  icon={<Clock size={16} className="text-gray-400" />}
                  label="Enrolled At"
                  value={display.enrolledAt ? formatDate(display.enrolledAt) : '—'}
                />
                <DetailItem
                  icon={<AlertCircle size={16} className="text-gray-400" />}
                  label="Status"
                  value={display.status}
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 py-2">
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Fingerprint size={18} className="text-amber-600" />
                </div>
                <p className="text-sm text-gray-500">
                  No fingerprint enrollment data available.
                </p>
              </div>
            )}

            {isEnrolled && safeText(display.fingerprintHash, '') !== '—' && (
              <div className="mt-5 pt-5 border-t border-gray-100">
                <div className="flex items-start gap-2 mb-2">
                  <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-500 leading-relaxed">
                    The fingerprint template is stored as a one-way SHA-256
                    hash. The raw template never leaves the device.
                  </p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-1">
                    Fingerprint Hash
                  </p>
                  <p className="font-mono text-[12px] text-gray-700 break-all">
                    {safeText(display.fingerprintHash)}
                  </p>
                </div>
              </div>
            )}

            {isEnrolled && safeText(display.templateReference, '') !== '—' && (
              <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-1">
                  Template Reference
                </p>
                <p className="font-mono text-[12px] text-gray-700 break-all">
                  {safeText(display.templateReference)}
                </p>
              </div>
            )}
          </DetailSection>

          {/* Address */}
          {formattedAddress && formattedAddress !== '—' && (
            <DetailSection title="Address">
              <DetailItem
                icon={<MapPin size={16} className="text-gray-400" />}
                label="Address"
                value={formattedAddress}
              />
            </DetailSection>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
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
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Removing…
                  </>
                ) : (
                  <>
                    <Trash2 size={14} /> Remove Fingerprint
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewFingerprintDetails;