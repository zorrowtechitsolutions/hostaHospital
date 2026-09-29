// src/components/super-admin/devices/Accesscard/ViewAccessCardDetails.jsx
import React, { useState, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  ArrowLeft, IdCard, CreditCard, Building2, Stethoscope, User,
  Mail, Phone, Briefcase, Clock, Calendar, MapPin,
  ShieldCheck, ShieldAlert, AlertCircle, CheckCircle2,
  RefreshCcw, Ban, History, Radio,
} from 'lucide-react';
import { Button, Modal } from '../../../ui';
import { showSuccessToast, showErrorToast } from '../../../ui/Toast';
import { Avatar as ShadcnAvatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getS3ImageUrl } from '../../../../../app/service/S3';
import {
  useGetRfidCardAssignmentsQuery,
  useDeactivateRfidCardAssignmentMutation,
  useActivateRfidCardAssignmentMutation,
} from '../../../../../app/service/accesscard';
import { useGetDevicesQuery } from '../../../../../app/service/device';
import { useGetDoctorsQuery } from '../../../../../app/service/doctorApi';
import { useGetStaffQuery } from '../../../../../app/service/staffApi';

const resolveDoctorName = (doc) => {
  if (!doc) return 'N/A';
  if (doc.displayName) return doc.displayName;
  const fullName = `${doc.firstName || ''} ${doc.lastName || ''}`.trim();
  return fullName || doc.name || 'N/A';
};

const resolveStaffName = (st) => {
  if (!st) return 'N/A';
  if (st.name) return st.name;
  const fullName = `${st.firstName || ''} ${st.lastName || ''}`.trim();
  return fullName || 'N/A';
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch { return dateStr; }
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleString('en-US', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return dateStr; }
};

const formatShiftTime = (time) => {
  if (!time) return '';
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 || 12;
  return `${String(h).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
};

const ViewAccessCardDetails = () => {
  const navigate = useNavigate();
  const { memberKey } = useParams();
  const location = useLocation();

  const stateMember = location.state?.member || null;
  const stateHospitalId = location.state?.hospitalId || null;
  const stateHospitalName = location.state?.hospitalName || null;

  const [member, setMember] = useState(stateMember);

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
    if (!type) return null;
    return { type, id };
  }, [decodedMemberKey]);

  const hospitalId =
    stateMember?.hospitalId || stateHospitalId || null;
  const hospitalName =
    stateMember?.hospitalName ||
    stateMember?.hospital?.name ||
    stateHospitalName ||
    'Hospital';

  const backTarget = hospitalId
    ? `/super-admin/hospitals/${hospitalId}/attendance-devices?tab=access-card`
    : '/super-admin/hospitals';

  const goBack = () => {
    navigate(backTarget, { state: { hospitalId, hospitalName } });
  };

  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [showReactivateConfirm, setShowReactivateConfirm] = useState(false);

  // Fallback fetch if no member in state
  const { data: doctorsResponse } = useGetDoctorsQuery(
    { page: 1, limit: 1000, hospitalId },
    { skip: !!stateMember || !hospitalId || !parsedKey || parsedKey.type !== 'Doctor' }
  );
  const { data: staffResponse } = useGetStaffQuery(
    { page: 1, limit: 1000, hospitalId },
    { skip: !!stateMember || !hospitalId || !parsedKey || parsedKey.type !== 'Staff' }
  );

  React.useEffect(() => {
    if (stateMember) return;
    if (!parsedKey || !hospitalId) return;

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
          name: resolveDoctorName(doc),
          department: doc.department || doc.specialist || doc.specialty || 'General',
          designation: doc.designation || doc.qualification || 'Consultant',
          image: doc.image || doc.imageUrl || doc.imageKey || doc.profileImage,
          email: doc.email,
          phone: doc.phone,
          hospitalId: doc.hospitalId || hospitalId,
          hospitalName: doc.hospitalName || doc?.hospital?.name || hospitalName,
          gender: doc.gender,
          dob: doc.dob,
          qualification: doc.qualification,
          address: doc.address,
          joiningDate: doc.joiningDate || doc.createdAt,
          shiftStartTime: doc.shiftStartTime,
          shiftEndTime: doc.shiftEndTime,
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
          name: resolveStaffName(st),
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
          shiftStartTime: st.shiftStartTime,
          shiftEndTime: st.shiftEndTime,
        });
      }
    }
  }, [stateMember, parsedKey, hospitalId, hospitalName, doctorsResponse, staffResponse, decodedMemberKey]);

  // RTK Query — assignment + devices
  const {
    data: assignmentsResponse,
    isLoading: isLoadingAssignments,
    refetch: refetchAssignments,
  } = useGetRfidCardAssignmentsQuery(
    {
      hospitalId,
      employeeId: member?.id,
      employeeType: member?.type,
    },
    { skip: !member?.id || !member?.type || !hospitalId }
  );

  const [deactivateCard, { isLoading: isRevoking }] =
    useDeactivateRfidCardAssignmentMutation();
  const [activateCard, { isLoading: isReactivating }] =
    useActivateRfidCardAssignmentMutation();

  const assignment = assignmentsResponse?.data?.[0] || null;
  const hasCard = Boolean(assignment?.cardNumber);
  const isActive = assignment?.status === 'Active';

  const { data: devicesResponse, isLoading: isLoadingDevices } =
    useGetDevicesQuery(
      { hospitalId },
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

  const cardUid = assignment?.cardNumber || member?.accessCardUid || null;

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
      showErrorToast(err?.data?.message || err?.error || 'Failed to revoke card.', 2500);
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
      showErrorToast(err?.data?.message || err?.error || 'Failed to reactivate card.', 2500);
    }
  };

  if (!member) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-6">
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Member not found</h2>
          <p className="text-sm text-gray-500 mb-4">Unable to load this employee's profile.</p>
          <Button variant="primary" onClick={goBack}>Go Back</Button>
        </div>
      </div>
    );
  }

  const isDoctor = member.type === 'Doctor';
  const isBusy = isRevoking || isReactivating;

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 font-sans">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={goBack}
            className="p-1 h-auto w-auto hover:bg-gray-200 rounded transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </Button>
          <div className="text-xs text-gray-500 flex flex-wrap items-center">
            <span className="text-gray-700">Super Admin</span>
            <span className="mx-1 text-gray-400">»</span>
            <span className="cursor-pointer hover:text-gray-700" onClick={() => navigate('/super-admin/hospitals')}>Hospitals</span>
            <span className="mx-1 text-gray-400">»</span>
            <span
              className="cursor-pointer hover:text-gray-700 truncate max-w-[180px]"
              onClick={() => hospitalId && navigate(`/super-admin/hospitals/${hospitalId}`, { state: { hospitalId, hospitalName } })}
              title={hospitalName}
            >
              {hospitalName}
            </span>
            <span className="mx-1 text-gray-400">»</span>
            <span className="cursor-pointer hover:text-gray-700" onClick={goBack}>Attendance Devices</span>
            <span className="mx-1 text-gray-400">»</span>
            <span>View Details</span>
          </div>
        </div>
        <h1 className="text-xl font-bold text-gray-800">Member Details</h1>
        <p className="text-sm text-gray-500 mt-1">Full profile and access card information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1 space-y-5">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-blue-500 to-indigo-600" />
            <div className="px-5 pb-5 -mt-12">
              <ShadcnAvatar className="w-24 h-24 rounded-full border-4 border-white shadow-md">
                <AvatarImage src={getS3ImageUrl(member.image)} alt={member.name} className="object-cover" />
                <AvatarFallback className="bg-gray-100 text-gray-500 text-2xl font-semibold">
                  {member.name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </ShadcnAvatar>

              <div className="mt-3">
                <h2 className="text-lg font-bold text-gray-800 truncate">{member.name}</h2>
                <p className="text-xs text-gray-500 mt-0.5">{member.number}</p>

                <span className={`inline-flex items-center gap-1.5 mt-2 text-xs font-medium px-2.5 py-1 rounded-full ${isDoctor ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>
                  {isDoctor ? <><Stethoscope size={12} /> Doctor</> : <><Briefcase size={12} /> Staff</>}
                </span>
              </div>

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

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard size={16} className="text-indigo-600" />
                <h3 className="text-sm font-semibold text-gray-700">Access Card</h3>
              </div>
              {hasCard && (
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                  {isActive ? <CheckCircle2 size={10} /> : <Ban size={10} />}
                  {assignment?.status}
                </span>
              )}
            </div>
            <div className="p-5">
              {isLoadingAssignments ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-12 bg-gray-100 rounded-lg" />
                  <div className="h-8 bg-gray-100 rounded-lg" />
                </div>
              ) : hasCard ? (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center">
                      <IdCard size={22} className="text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">Card UID</p>
                      <p className="text-sm font-mono font-semibold text-gray-800 truncate">{cardUid}</p>
                    </div>
                  </div>

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

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Radio size={14} className="text-indigo-600" />
                      <p className="text-xs font-semibold text-gray-700">Linked RFID Device</p>
                    </div>
                    {!assignment?.deviceId ? (
                      <p className="text-xs text-gray-400 italic">No device linked to this card</p>
                    ) : isLoadingDevices ? (
                      <p className="text-xs text-gray-400">Loading device…</p>
                    ) : linkedDevice ? (
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {linkedDevice.deviceName || 'Unnamed device'}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <MapPin size={11} className="text-gray-400 shrink-0" />
                          <span className="truncate">{linkedDevice.location || 'Unknown location'}</span>
                        </div>
                        <p className="text-[11px] text-gray-400 font-mono truncate">ID: {linkedDevice.deviceId}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-amber-600 font-medium">Device not found in active list</p>
                    )}
                  </div>

                  <div className={`flex items-center gap-2 border rounded-lg px-3 py-2 mb-4 ${isActive ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                    {isActive ? (
                      <><ShieldCheck size={16} /><span className="text-xs font-medium">Card is active and linked</span></>
                    ) : (
                      <><ShieldAlert size={16} /><span className="text-xs font-medium">Card is deactivated</span></>
                    )}
                  </div>

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
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center">
                    <ShieldAlert size={22} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">No card assigned</p>
                    <p className="text-xs text-gray-500 mt-0.5">This member has no access card yet.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-5">
          <DetailSection title="Personal Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <DetailItem icon={<User size={16} className="text-gray-400" />} label="Full Name" value={member.name} />
              <DetailItem icon={<User size={16} className="text-gray-400" />} label="Gender" value={member.gender || 'N/A'} />
              <DetailItem icon={<Calendar size={16} className="text-gray-400" />} label="Date of Birth" value={formatDate(member.dob)} />
              <DetailItem icon={<Mail size={16} className="text-gray-400" />} label="Email" value={member.email || 'N/A'} />
              <DetailItem icon={<Phone size={16} className="text-gray-400" />} label="Phone" value={member.phone || 'N/A'} />
            </div>
          </DetailSection>

          <DetailSection title="Employment Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <DetailItem icon={<IdCard size={16} className="text-gray-400" />} label="Employee ID" value={member.number} />
              <DetailItem
                icon={isDoctor ? <Stethoscope size={16} className="text-gray-400" /> : <Briefcase size={16} className="text-gray-400" />}
                label="Role / Type"
                value={member.type}
              />
              <DetailItem icon={<Briefcase size={16} className="text-gray-400" />} label="Designation" value={member.designation || 'N/A'} />
              <DetailItem icon={<Stethoscope size={16} className="text-gray-400" />} label="Department" value={member.department || 'N/A'} />
              <DetailItem icon={<Building2 size={16} className="text-gray-400" />} label="Hospital" value={hospitalName} />
              <DetailItem icon={<Clock size={16} className="text-gray-400" />} label="Joining Date" value={formatDate(member.joiningDate)} />
              {member.shiftStartTime && member.shiftEndTime && (
                <DetailItem
                  icon={<Clock size={16} className="text-gray-400" />}
                  label="Shift Timing"
                  value={`${formatShiftTime(member.shiftStartTime)} → ${formatShiftTime(member.shiftEndTime)}`}
                />
              )}
            </div>
          </DetailSection>

          {member.address && (
            <DetailSection title="Address">
              <DetailItem
                icon={<MapPin size={16} className="text-gray-400" />}
                label="Address"
                value={
                  typeof member.address === 'string'
                    ? member.address
                    : [member.address?.place, member.address?.district, member.address?.state, member.address?.country, member.address?.pincode]
                        .filter(Boolean).join(', ') || 'N/A'
                }
              />
            </DetailSection>
          )}

          {hasCard && (
            <DetailSection title="Card History">
              <div className="text-center py-6 text-gray-400">
                <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Card history tracking coming soon</p>
              </div>
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
          </div>
        </div>
      </div>

      <Modal
        isOpen={showRevokeConfirm}
        onClose={() => setShowRevokeConfirm(false)}
        title="Deactivate Access Card"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Deactivate <span className="font-mono font-semibold">{cardUid}</span> for <strong>{member.name}</strong>?
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowRevokeConfirm(false)} disabled={isRevoking}>Cancel</Button>
            <Button
              variant="primary"
              onClick={handleRevoke}
              disabled={isRevoking}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isRevoking ? 'Deactivating…' : 'Deactivate'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showReactivateConfirm}
        onClose={() => setShowReactivateConfirm(false)}
        title="Reactivate Access Card"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Reactivate <span className="font-mono font-semibold">{cardUid}</span> for <strong>{member.name}</strong>?
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowReactivateConfirm(false)} disabled={isReactivating}>Cancel</Button>
            <Button
              variant="primary"
              onClick={handleReactivate}
              disabled={isReactivating}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isReactivating ? 'Reactivating…' : 'Reactivate'}
            </Button>
          </div>
        </div>
      </Modal>
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

const DetailItem = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="mt-0.5 shrink-0">{icon}</div>
    <div className="min-w-0 flex-1">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-800 break-words">{value || '—'}</p>
    </div>
  </div>
);

const StatusPill = ({ label, status, tone }) => {
  const isActive = status === 'Active' || status === 'Assigned' || tone === 'success';
  const isWarning = status === 'Not Assigned' || status === 'Inactive' || tone === 'warning';
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
      <span className={`inline-flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-full border ${colorClass}`}>
        {status}
      </span>
    </div>
  );
};

export default ViewAccessCardDetails;