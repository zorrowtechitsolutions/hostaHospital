// src/components/AccessCards/ViewAccessCardDetails.jsx
import React, { useState, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  ArrowLeft, IdCard, CreditCard, Building2, Stethoscope, User,
  Mail, Phone, Briefcase, Clock, Calendar, MapPin,
  ShieldCheck, ShieldAlert, AlertCircle, CheckCircle2,
  RefreshCcw, Ban, History, Radio,
} from 'lucide-react';
import { Button, Modal } from '../../ui';
import { showSuccessToast, showErrorToast } from '../../ui/Toast';
import {
  Avatar as ShadcnAvatar,
  AvatarImage,
  AvatarFallback,
} from '@/components/ui/avatar';
import { getS3ImageUrl } from '../../../../app/service/S3';
import { getAuthUser } from '../../../utils/auth';
import {
  useGetRfidCardAssignmentsQuery,
  useDeactivateRfidCardAssignmentMutation,
  useActivateRfidCardAssignmentMutation,
} from '../../../../app/service/accesscard';
import { useGetDevicesQuery } from '../../../../app/service/device';

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
const getHospitalId = () => {
  const stored = localStorage.getItem('hospitalId');
  if (stored) return stored;
  const authUser = getAuthUser();
  return authUser?.hospitalId || null;
};

const resolveHospitalName = (member) => {
  if (member?.hospitalName) return member.hospitalName;
  if (member?.hospital?.name) return member.hospital.name;
  const id = member?.hospitalId || getHospitalId();
  return id ? `Hospital (ID: ${id})` : 'N/A';
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

const formatShiftTime = (time) => {
  if (!time) return '';
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
};

// ------------------------------------------------------------
// Component
// ------------------------------------------------------------
const ViewAccessCardDetails = () => {
  const navigate = useNavigate();
  const { memberKey } = useParams();
  const location = useLocation();

  const member = location.state?.member || null;

  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [showReactivateConfirm, setShowReactivateConfirm] = useState(false);

  const hospitalId = getHospitalId();

  // ----------------------------------------------------------
  // RTK Query hooks
  // ----------------------------------------------------------
  const {
    data: assignmentsResponse,
    isLoading: isLoadingAssignments,
    refetch: refetchAssignments,
  } = useGetRfidCardAssignmentsQuery(
    {
      hospitalId: member?.hospitalId || hospitalId,
      employeeId: member?.id,
      employeeType: member?.type,
    },
    { skip: !member?.id || !member?.type }
  );

  const [deactivateCard, { isLoading: isRevoking }] =
    useDeactivateRfidCardAssignmentMutation();
  const [activateCard, { isLoading: isReactivating }] =
    useActivateRfidCardAssignmentMutation();

  const assignment = assignmentsResponse?.data?.[0] || null;
  const hasCard = Boolean(assignment?.cardNumber);
  const isActive = assignment?.status === 'Active';

  // ----------------------------------------------------------
  // Device lookup — resolve assignment.deviceId → device object
  // ----------------------------------------------------------
  const { data: devicesResponse, isLoading: isLoadingDevices } =
    useGetDevicesQuery(
      {
        hospitalId: member?.hospitalId || hospitalId,
        status: 'Active',
      },
      { skip: !hospitalId || !assignment?.deviceId }
    );

  const linkedDevice = useMemo(() => {
    if (!assignment?.deviceId) return null;
    const all = devicesResponse?.data || [];
    return (
      all.find((d) => d.deviceId === assignment.deviceId) ||
      all.find((d) => String(d.id) === String(assignment.deviceId)) ||
      all.find((d) => d._id === assignment.deviceId) ||
      null
    );
  }, [devicesResponse, assignment?.deviceId]);

  // ----------------------------------------------------------
  // Derived values
  // ----------------------------------------------------------
  const cardUid = assignment?.cardNumber || member?.accessCardUid || null;

  // ----------------------------------------------------------
  // Handlers
  // ----------------------------------------------------------
  const handleGoBack = () => navigate(-1);

  const handleRevoke = async () => {
    if (!assignment?.id) {
      showErrorToast('No card assignment found to revoke', 2500);
      return;
    }

    try {
      await deactivateCard(assignment.id).unwrap();
      showSuccessToast(`Card deactivated for ${member.name}`, 2500);
      setShowRevokeConfirm(false);
      await refetchAssignments();
    } catch (err) {
      showErrorToast(
        err?.data?.message || err?.error || 'Failed to revoke card.',
        2500
      );
    }
  };

  const handleReactivate = async () => {
    if (!assignment?.id) {
      showErrorToast('No card assignment found to reactivate', 2500);
      return;
    }

    try {
      await activateCard(assignment.id).unwrap();
      showSuccessToast(`Card reactivated for ${member.name}`, 2500);
      setShowReactivateConfirm(false);
      await refetchAssignments();
    } catch (err) {
      showErrorToast(
        err?.data?.message || err?.error || 'Failed to reactivate card.',
        2500
      );
    }
  };

  // ----------------------------------------------------------
  // Guard: member missing
  // ----------------------------------------------------------
  if (!member) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-6">
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-800 mb-1">
            Member not found
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            We couldn't load this employee's profile.
          </p>
          <Button variant="primary" onClick={handleGoBack}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const isDoctor = member.type === 'Doctor';
  const isBusy = isRevoking || isReactivating;

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 font-sans">
      {/* Header / Breadcrumb */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleGoBack}
            className="p-1 h-auto w-auto hover:bg-gray-200 rounded transition-colors"
            title="Go back"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </Button>
          <div className="text-xs text-gray-500">
            <span className="text-gray-700">Access Cards</span>
            <span className="mx-1 text-gray-400">»</span>
            <span
              className="cursor-pointer hover:text-gray-700"
              onClick={() => navigate('/attendance/access-card')}
            >
              Home
            </span>
            <span className="mx-1 text-gray-400">»</span>
            <span>View Details</span>
          </div>
        </div>
        <h1 className="text-xl font-bold text-gray-800">Member Details</h1>
        <p className="text-sm text-gray-500 mt-1">
          Full profile and access card information
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* LEFT COLUMN: Profile Card */}
        <div className="lg:col-span-1 space-y-5">
          {/* Profile */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-blue-500 to-indigo-600" />
            <div className="px-5 pb-5 -mt-12">
              <ShadcnAvatar className="w-24 h-24 rounded-full border-4 border-white shadow-md">
                <AvatarImage
                  src={getS3ImageUrl(member.image)}
                  alt={member.name}
                  className="object-cover"
                />
                <AvatarFallback className="bg-gray-100 text-gray-500 text-2xl font-semibold">
                  {member.name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </ShadcnAvatar>

              <div className="mt-3">
                <h2 className="text-lg font-bold text-gray-800 truncate">
                  {member.name}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {member.number}
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

              {/* Quick status row */}
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                <StatusPill label="Account" status={member.status} />
                <StatusPill
                  label="Access Card"
                  status={hasCard ? 'Assigned' : 'Not Assigned'}
                  tone={hasCard ? 'success' : 'warning'}
                />
                {hasCard && (
                  <StatusPill
                    label="Card Status"
                    status={assignment?.status || 'Active'}
                    tone={isActive ? 'success' : 'danger'}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Access Card Summary — read-only + deactivate/reactivate only */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard size={16} className="text-indigo-600" />
                <h3 className="text-sm font-semibold text-gray-700">
                  Access Card
                </h3>
              </div>
              {hasCard && (
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  {isActive ? (
                    <CheckCircle2 size={10} />
                  ) : (
                    <Ban size={10} />
                  )}
                  {assignment?.status}
                </span>
              )}
            </div>
            <div className="p-5">
              {isLoadingAssignments ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-12 bg-gray-100 rounded-lg"></div>
                  <div className="h-8 bg-gray-100 rounded-lg"></div>
                </div>
              ) : hasCard ? (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center">
                      <IdCard size={22} className="text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">Card UID</p>
                      <p className="text-sm font-mono font-semibold text-gray-800 truncate">
                        {cardUid}
                      </p>
                    </div>
                  </div>

                  {/* Card metadata */}
                  <div className="space-y-2 mb-4 text-xs">
                    {assignment?.assignedAt && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar size={12} />
                        <span>Assigned: {formatDate(assignment.assignedAt)}</span>
                      </div>
                    )}
                    {assignment?.updatedAt && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock size={12} />
                        <span>Updated: {formatDateTime(assignment.updatedAt)}</span>
                      </div>
                    )}
                  </div>

                  {/* Linked RFID Device */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Radio size={14} className="text-indigo-600" />
                      <p className="text-xs font-semibold text-gray-700">
                        Linked RFID Device
                      </p>
                    </div>

                    {!assignment?.deviceId ? (
                      <p className="text-xs text-gray-400 italic">
                        No device linked to this card
                      </p>
                    ) : isLoadingDevices ? (
                      <p className="text-xs text-gray-400">Loading device…</p>
                    ) : linkedDevice ? (
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {linkedDevice.deviceName || 'Unnamed device'}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <MapPin size={11} className="text-gray-400 shrink-0" />
                          <span className="truncate">
                            {linkedDevice.location || 'Unknown location'}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 font-mono truncate">
                          ID: {linkedDevice.deviceId}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-xs text-amber-600 font-medium">
                          Device not found in active list
                        </p>
                        <p className="text-[11px] text-gray-400 font-mono truncate">
                          ID: {assignment.deviceId}
                        </p>
                      </div>
                    )}
                  </div>

                  <div
                    className={`flex items-center gap-2 border rounded-lg px-3 py-2 mb-4 ${
                      isActive
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                        : 'bg-red-50 border-red-100 text-red-700'
                    }`}
                  >
                    {isActive ? (
                      <>
                        <ShieldCheck size={16} />
                        <span className="text-xs font-medium">
                          Card is active and linked
                        </span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert size={16} />
                        <span className="text-xs font-medium">
                          Card is deactivated
                        </span>
                      </>
                    )}
                  </div>

                  {/* Action buttons — Deactivate / Reactivate only */}
                  <div className="space-y-2">
                    {isActive ? (
                      <Button
                        variant="outline"
                        fullWidth
                        onClick={() => setShowRevokeConfirm(true)}
                        disabled={isBusy}
                        className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-red-600 border border-red-300 hover:bg-red-50 rounded-lg py-2.5"
                      >
                        <Ban size={15} /> Deactivate Card
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        fullWidth
                        onClick={() => setShowReactivateConfirm(true)}
                        disabled={isBusy}
                        className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-emerald-600 border border-emerald-300 hover:bg-emerald-50 rounded-lg py-2.5"
                      >
                        <RefreshCcw size={15} /> Reactivate Card
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center">
                      <ShieldAlert size={22} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        No card assigned
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        This member has no access card yet.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Details */}
        <div className="lg:col-span-2 space-y-5">
          {/* Personal Information */}
          <DetailSection title="Personal Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <DetailItem
                icon={<User size={16} className="text-gray-400" />}
                label="Full Name"
                value={member.name}
              />
              <DetailItem
                icon={<User size={16} className="text-gray-400" />}
                label="Gender"
                value={member.gender || 'N/A'}
              />
              <DetailItem
                icon={<Calendar size={16} className="text-gray-400" />}
                label="Date of Birth"
                value={formatDate(member.dob)}
              />
              <DetailItem
                icon={<Mail size={16} className="text-gray-400" />}
                label="Email"
                value={member.email || 'N/A'}
              />
              <DetailItem
                icon={<Phone size={16} className="text-gray-400" />}
                label="Phone"
                value={member.phone || 'N/A'}
              />
            </div>
          </DetailSection>

          {/* Employment Information */}
          <DetailSection title="Employment Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <DetailItem
                icon={<IdCard size={16} className="text-gray-400" />}
                label="Employee ID"
                value={member.number}
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
                value={member.type}
              />
              <DetailItem
                icon={<Briefcase size={16} className="text-gray-400" />}
                label="Designation"
                value={member.designation || 'N/A'}
              />
              <DetailItem
                icon={<Stethoscope size={16} className="text-gray-400" />}
                label="Department"
                value={member.department || 'N/A'}
              />
              <DetailItem
                icon={<Building2 size={16} className="text-gray-400" />}
                label="Hospital"
                value={resolveHospitalName(member)}
              />
              <DetailItem
                icon={<Clock size={16} className="text-gray-400" />}
                label="Joining Date"
                value={formatDate(member.joiningDate)}
              />
              {member.shiftStartTime && member.shiftEndTime && (
                <DetailItem
                  icon={<Clock size={16} className="text-gray-400" />}
                  label="Shift Timing"
                  value={`${formatShiftTime(member.shiftStartTime)} → ${formatShiftTime(member.shiftEndTime)}`}
                />
              )}
            </div>
          </DetailSection>

          {/* Address */}
          {member.address && (
            <DetailSection title="Address">
              <DetailItem
                icon={<MapPin size={16} className="text-gray-400" />}
                label="Address"
                value={
                  typeof member.address === 'string'
                    ? member.address
                    : [
                        member.address?.place,
                        member.address?.district,
                        member.address?.state,
                        member.address?.country,
                        member.address?.pincode,
                      ]
                        .filter(Boolean)
                        .join(', ') || 'N/A'
                }
              />
            </DetailSection>
          )}

          {/* Card History (placeholder for future) */}
          {hasCard && (
            <DetailSection title="Card History">
              <div className="text-center py-6 text-gray-400">
                <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Card history tracking coming soon</p>
                <p className="text-xs mt-1">
                  Track all assignments, deactivations, and reactivations
                </p>
              </div>
            </DetailSection>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleGoBack}
              className="text-sm font-semibold text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-lg px-5 py-2.5"
            >
              Close
            </Button>
          </div>
        </div>
      </div>

      {/* Revoke Confirm Modal */}
      <Modal
        isOpen={showRevokeConfirm}
        onClose={() => setShowRevokeConfirm(false)}
        title="Deactivate Access Card"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-lg p-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-800">
                Are you sure?
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                This will deactivate the access card{' '}
                <span className="font-mono font-semibold">{cardUid}</span> from{' '}
                <strong>{member.name}</strong>. Attendance tracking for this card
                will stop immediately.
              </p>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowRevokeConfirm(false)}
              disabled={isRevoking}
              className="text-sm font-semibold text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-lg px-4 py-2"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleRevoke}
              disabled={isRevoking}
              className="inline-flex items-center gap-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 disabled:opacity-60"
            >
              <Ban size={14} />
              {isRevoking ? 'Deactivating…' : 'Deactivate Card'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reactivate Confirm Modal */}
      <Modal
        isOpen={showReactivateConfirm}
        onClose={() => setShowReactivateConfirm(false)}
        title="Reactivate Access Card"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 rounded-lg p-3">
            <RefreshCcw className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-800">
                Confirm reactivation
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                This will reactivate the access card{' '}
                <span className="font-mono font-semibold">{cardUid}</span> for{' '}
                <strong>{member.name}</strong>. Attendance tracking will resume.
              </p>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowReactivateConfirm(false)}
              disabled={isReactivating}
              className="text-sm font-semibold text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-lg px-4 py-2"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleReactivate}
              disabled={isReactivating}
              className="inline-flex items-center gap-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2 disabled:opacity-60"
            >
              <RefreshCcw size={14} />
              {isReactivating ? 'Reactivating…' : 'Reactivate Card'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// ------------------------------------------------------------
// Sub-components
// ------------------------------------------------------------
const DetailSection = ({ title, children }) => (
  <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
    <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
      <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const DetailItem = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="mt-0.5 shrink-0">{icon}</div>
    <div className="min-w-0 flex-1">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-800 break-words">
        {value || '—'}
      </p>
    </div>
  </div>
);

const StatusPill = ({ label, status, tone }) => {
  const isActive =
    status === 'Active' || status === 'Assigned' || tone === 'success';
  const isWarning =
    status === 'Not Assigned' || status === 'Inactive' || tone === 'warning';
  const isDanger = status === 'Blacklisted' || tone === 'danger';

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

export default ViewAccessCardDetails;