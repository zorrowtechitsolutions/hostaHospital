// src/components/super-admin/devices/Accesscard/AssignAccessCard.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Radio, CreditCard, Building2, Stethoscope, User,
  Mail, Phone, Briefcase, IdCard, AlertCircle,
  RefreshCcw, Ban, CheckCircle2, Calendar, Clock,
} from 'lucide-react';
import { Button } from '../../../ui';
import { showSuccessToast, showErrorToast } from '../../../ui/Toast';
import { Avatar as ShadcnAvatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getS3ImageUrl } from '../../../../../app/service/S3';
import { useGetDoctorsQuery } from '../../../../../app/service/doctorApi';
import { useGetStaffQuery } from '../../../../../app/service/staffApi';
import {
  useAssignRfidCardMutation,
  useGetRfidCardAssignmentsQuery,
  useUpdateRfidCardAssignmentMutation,
  useDeactivateRfidCardAssignmentMutation,
  useActivateRfidCardAssignmentMutation,
} from '../../../../../app/service/accesscard';
import { useGetDevicesQuery } from '../../../../../app/service/device';

const resolveDoctorName = (doc) => {
  if (!doc) return 'N/A';
  if (doc.displayName) return doc.displayName;
  const fullName = `${doc.firstName || ''} ${doc.lastName || ''}`.trim();
  return fullName || doc.name || 'N/A';
};
const resolveDoctorDepartment = (doc) =>
  doc?.department || doc?.specialist || doc?.specialty || doc?.speciality || 'General';
const resolveStaffName = (st) => {
  if (!st) return 'N/A';
  if (st.name) return st.name;
  const fullName = `${st.firstName || ''} ${st.lastName || ''}`.trim();
  return fullName || 'N/A';
};
const resolveStaffDepartment = (st) =>
  st?.department || st?.designation || st?.staffType || 'Administration';

const isValidUid = (v) => {
  const clean = String(v || '').replace(/[\s-]/g, '').trim();
  return /^[A-Z0-9]{6,}$/i.test(clean);
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

const AssignAccessCard = () => {
  const navigate = useNavigate();
  const { memberKey } = useParams();
  const location = useLocation();

  const passedMember = location.state?.member || null;
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

  const [member, setMember] = useState(passedMember);
  const [cardUid, setCardUid] = useState('');
  const [cardStatus, setCardStatus] = useState('Active');
  const [deviceId, setDeviceId] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const hospitalId = member?.hospitalId || stateHospitalId || null;
  const hospitalName =
    member?.hospitalName ||
    member?.hospital?.name ||
    stateHospitalName ||
    'Hospital';

  const backTarget = hospitalId
    ? `/super-admin/hospitals/${hospitalId}/attendance-devices?tab=access-card`
    : '/super-admin/hospitals';

  const goBack = () =>
    navigate(backTarget, { state: { hospitalId, hospitalName } });

  // RTK hooks
  const [assignRfidCard, { isLoading: isAssigning }] = useAssignRfidCardMutation();
  const [updateRfidCard, { isLoading: isUpdating }] = useUpdateRfidCardAssignmentMutation();
  const [deactivateCard, { isLoading: isDeactivating }] = useDeactivateRfidCardAssignmentMutation();
  const [activateCard, { isLoading: isActivating }] = useActivateRfidCardAssignmentMutation();

  const {
    data: existingAssignments,
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

  const existingAssignment = existingAssignments?.data?.[0] || null;

  const { data: devicesResponse, isLoading: devicesLoading } = useGetDevicesQuery(
    { hospitalId },
    { skip: !hospitalId }
  );

  const rfidDevices = useMemo(
    () => (devicesResponse?.data || []).filter(
      (d) => String(d.deviceType || '').toLowerCase().includes('rfid')
    ),
    [devicesResponse]
  );

  const { data: doctorsResponse } = useGetDoctorsQuery(
    { page: 1, limit: 1000, hospitalId },
    { skip: !!passedMember || !hospitalId || parsedKey?.type !== 'Doctor' }
  );
  const { data: staffResponse } = useGetStaffQuery(
    { page: 1, limit: 1000, hospitalId },
    { skip: !!passedMember || !hospitalId || parsedKey?.type !== 'Staff' }
  );

  useEffect(() => {
    if (passedMember || !parsedKey || !hospitalId) return;

    if (parsedKey.type === 'Doctor') {
      const doc = (doctorsResponse?.data || []).find(
        (d) => String(d.id || d.doctorNumber || d.authId) === String(parsedKey.id)
      );
      if (doc) {
        setMember({
          key: decodedMemberKey,
          id: doc.id,
          type: 'Doctor',
          name: resolveDoctorName(doc),
          department: resolveDoctorDepartment(doc),
          designation: doc.designation || doc.qualification || 'Consultant',
          number: doc.doctorNumber
            ? `#DR${String(doc.doctorNumber).padStart(4, '0')}`
            : `#DR${String(doc.id).padStart(4, '0')}`,
          rawNumber: doc.doctorNumber || doc.id,
          image: doc.image || doc.imageUrl || doc.imageKey || doc.profileImage,
          email: doc.email,
          phone: doc.phone,
          hospitalId: doc.hospitalId || hospitalId,
          hospitalName: doc.hospitalName || doc?.hospital?.name || hospitalName,
          employeeCode: doc.doctorNumber || doc.id,
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
          name: resolveStaffName(st),
          department: resolveStaffDepartment(st),
          designation: st.designation || st.staffType || 'Staff',
          number: st.staffNumber
            ? `#STF${String(st.staffNumber).padStart(5, '0')}`
            : `#STF${String(st.id).padStart(5, '0')}`,
          rawNumber: st.staffNumber || st.id,
          image: st.profileImage || st.imageUrl || st.imageKey || st.image,
          email: st.email,
          phone: st.phone,
          hospitalId: st.hospitalId || hospitalId,
          hospitalName: st.hospitalName || st?.hospital?.name || hospitalName,
          employeeCode: st.staffNumber || st.id,
        });
      }
    }
  }, [passedMember, parsedKey, hospitalId, hospitalName, doctorsResponse, staffResponse, decodedMemberKey]);

  useEffect(() => {
    if (existingAssignment?.cardNumber) {
      setCardUid(existingAssignment.cardNumber);
      setCardStatus(existingAssignment.status || 'Active');
      setDeviceId(existingAssignment.deviceId || '');
    }
  }, [existingAssignment]);

  const validate = () => {
    const next = {};
    if (!cardUid.trim()) next.cardUid = 'Access Card UID is required';
    else if (!isValidUid(cardUid))
      next.cardUid = 'Enter a valid UID (e.g. A4-B9-C2-11, A4B9C211 or D3F4V534)';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleAssign = async () => {
    if (!validate()) {
      showErrorToast('Please fix the highlighted fields', 2500);
      return;
    }
    if (!member?.id || !member?.type) {
      showErrorToast('Missing member information', 2500);
      return;
    }

    setSaving(true);
    try {
      if (existingAssignment) {
        await updateRfidCard({
          id: existingAssignment.id,
          body: {
            cardNumber: cardUid.trim().toUpperCase(),
            status: cardStatus,
            deviceId: deviceId || null,
          },
        }).unwrap();
        showSuccessToast(`Card updated to ${cardUid.toUpperCase()} for ${member.name}`, 2500);
      } else {
        await assignRfidCard({
          hospitalId: member.hospitalId || hospitalId,
          employeeId: member.id,
          employeeType: member.type,
          employeeName: member.name,
          employeeCode: member.employeeCode || member.rawNumber || member.id,
          department: member.department,
          cardNumber: cardUid.trim().toUpperCase(),
          deviceId: deviceId || null,
        }).unwrap();
        showSuccessToast(`Card ${cardUid.toUpperCase()} assigned to ${member.name}`, 2500);
      }
      goBack();
    } catch (err) {
      console.error('Assign card failed:', err);
      showErrorToast(
        err?.data?.message || err?.error || 'Failed to assign access card.',
        2500
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async () => {
    if (!existingAssignment?.id) {
      showErrorToast('No card assignment found to revoke', 2500);
      return;
    }
    if (!window.confirm(`Revoke access card from ${member?.name}?`)) return;

    setSaving(true);
    try {
      await deactivateCard(existingAssignment.id).unwrap();
      showSuccessToast(`Card revoked from ${member.name}`, 2500);
      goBack();
    } catch (err) {
      showErrorToast(err?.data?.message || err?.error || 'Failed to revoke card.', 2500);
    } finally {
      setSaving(false);
    }
  };

  const handleReactivate = async () => {
    if (!existingAssignment?.id) {
      showErrorToast('No card assignment found to reactivate', 2500);
      return;
    }
    setSaving(true);
    try {
      await activateCard(existingAssignment.id).unwrap();
      showSuccessToast(`Card reactivated for ${member.name}`, 2500);
      await refetchAssignments();
    } catch (err) {
      showErrorToast(err?.data?.message || err?.error || 'Failed to reactivate card.', 2500);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => goBack();

  if (!member) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-6">
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Member not found</h2>
          <p className="text-sm text-gray-500 mb-4">We couldn't load this employee's profile.</p>
          <Button variant="primary" onClick={handleCancel}>Go Back</Button>
        </div>
      </div>
    );
  }

  const isBusy = saving || isAssigning || isUpdating || isDeactivating || isActivating;
  const hasExistingCard = Boolean(existingAssignment);
  const isCardActive = existingAssignment?.status === 'Active';

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 font-sans">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Button variant="ghost" size="icon" onClick={handleCancel} className="p-1 h-auto w-auto hover:bg-gray-200 rounded">
            <ArrowLeft size={22} className="text-gray-700" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-800">
            {hasExistingCard ? 'Manage Access Card' : 'Assign Access Card'}
          </h1>
        </div>
        <p className="text-sm text-gray-500 ml-10">
          {hasExistingCard
            ? 'Update, deactivate, or reactivate the RFID/NFC card for this employee.'
            : 'Link a physical RFID/NFC card to an employee for attendance tracking.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">Employee Profile</h2>
          </div>

          <div className="p-5">
            <div className="flex gap-4 mb-5">
              <ShadcnAvatar className="w-24 h-24 rounded-full border border-gray-200 shrink-0">
                <AvatarImage src={getS3ImageUrl(member.image)} alt={member.name} className="object-cover" />
                <AvatarFallback className="bg-gray-100 text-gray-500 text-xl font-semibold">
                  {member.name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </ShadcnAvatar>

              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-800 mb-1 truncate">{member.name}</h3>
                <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-md mb-2">
                  {member.type}
                </span>
                <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-1">
                  <Stethoscope size={14} className="text-gray-400 shrink-0" />
                  <span className="truncate">{member.department}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <User size={14} className="text-gray-400 shrink-0" />
                  <span>Employee ID</span>
                </div>
                <div className="text-base font-semibold text-gray-800 ml-5">{member.number}</div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-gray-100">
              <DetailRow icon={<Building2 size={16} className="text-gray-400" />} label="Hospital" value={hospitalName} />
              <DetailRow icon={<Briefcase size={16} className="text-gray-400" />} label="Department" value={member.department} />
              <DetailRow icon={<User size={16} className="text-gray-400" />} label="Role" value={member.type} />
              <DetailRow icon={<Mail size={16} className="text-gray-400" />} label="Email" value={member.email || '—'} />
              <DetailRow icon={<Phone size={16} className="text-gray-400" />} label="Phone" value={member.phone || '—'} />
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center">
                <CreditCard size={16} className="text-white" />
              </div>
              <h2 className="text-sm font-semibold text-gray-700">
                {hasExistingCard ? 'Manage Access Card' : 'Assign Access Card'}
              </h2>
            </div>
            {hasExistingCard && (
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${isCardActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                {isCardActive ? <CheckCircle2 size={12} /> : <Ban size={12} />}
                {existingAssignment.status}
              </span>
            )}
          </div>

          <div className="p-5 space-y-5">
            {hasExistingCard && (
              <div className="bg-blue-50/60 border border-blue-100 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <IdCard size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Currently Assigned</p>
                    <p className="text-sm font-mono font-semibold text-gray-800">
                      {existingAssignment.cardNumber}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar size={12} />
                    <span>Assigned: {formatDate(existingAssignment.assignedAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock size={12} />
                    <span>Updated: {formatDateTime(existingAssignment.updatedAt)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 bg-blue-50/60 border border-blue-100 rounded-lg p-3">
              <Radio className="w-6 h-6 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-800">Card UID</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  The unique ID read from the physical RFID/NFC card.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Access Card UID <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={cardUid}
                  onChange={(e) => {
                    setCardUid(e.target.value.toUpperCase());
                    if (errors.cardUid) setErrors((p) => ({ ...p, cardUid: undefined }));
                  }}
                  placeholder="A4-B9-C2-11 or D3F4V534"
                  className={`w-full h-11 px-4 pr-11 border rounded-lg outline-none text-gray-800 text-sm bg-white transition ${
                    errors.cardUid
                      ? 'border-red-400 focus:ring-2 focus:ring-red-200'
                      : 'border-gray-200 focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent'
                  }`}
                />
                <IdCard size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              {errors.cardUid && <p className="text-xs text-red-500 mt-1">{errors.cardUid}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">RFID Device</label>
              <div className="relative">
                <select
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                  disabled={devicesLoading || !hospitalId}
                  className="w-full h-11 pl-4 pr-10 border border-gray-200 rounded-lg outline-none text-gray-700 text-sm bg-white cursor-pointer focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent appearance-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {!hospitalId
                      ? 'Hospital context missing'
                      : devicesLoading
                      ? 'Loading RFID devices…'
                      : rfidDevices.length === 0
                      ? 'No RFID devices available'
                      : 'Select RFID device (optional)'}
                  </option>
                  {rfidDevices.map((device) => (
                    <option key={device.id ?? device._id ?? device.deviceId} value={device.deviceId}>
                      {device.deviceName} — {device.location}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon />
              </div>
              {!devicesLoading && hospitalId && rfidDevices.length === 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  No RFID devices found for this hospital. Register one from the hospital's Devices page first.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Card Status</label>
                <div className="relative">
                  <select
                    value={cardStatus}
                    onChange={(e) => setCardStatus(e.target.value)}
                    className="w-full h-11 pl-4 pr-10 border border-gray-200 rounded-lg outline-none text-gray-700 text-sm bg-white cursor-pointer focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent appearance-none"
                  >
                    <option value="Active">🟢 Active</option>
                    <option value="Inactive">🔴 Inactive</option>
                  </select>
                  <ChevronDownIcon />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Hospital <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={hospitalName}
                    onChange={() => {}}
                    className="w-full h-11 pl-4 pr-10 border border-gray-200 rounded-lg outline-none text-gray-700 text-sm bg-white cursor-pointer focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent appearance-none"
                  >
                    <option value={hospitalName}>{hospitalName}</option>
                  </select>
                  <ChevronDownIcon />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                <CreditCard size={20} className="text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500">
                  {hasExistingCard ? 'Card assigned to' : 'This card will be assigned to'}
                </p>
                <p className="text-sm font-bold text-gray-800 truncate">
                  {member.name} (ID: {member.number})
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {member.department} &nbsp;•&nbsp; {member.type}
                </p>
                {deviceId && (
                  <p className="text-xs text-blue-600 mt-1 font-medium truncate">Device: {deviceId}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                {hasExistingCard && (
                  <>
                    {isCardActive ? (
                      <Button
                        variant="outline"
                        onClick={handleRevoke}
                        disabled={isBusy}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 border border-red-300 hover:bg-red-50 rounded-lg px-4 py-2.5"
                      >
                        <Ban size={15} /> Deactivate
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={handleReactivate}
                        disabled={isBusy}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 border border-emerald-300 hover:bg-emerald-50 rounded-lg px-4 py-2.5"
                      >
                        <RefreshCcw size={15} /> Reactivate
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => refetchAssignments()}
                      disabled={isBusy || isLoadingAssignments}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 border border-gray-300 hover:bg-gray-50 rounded-lg px-3 py-2.5"
                      title="Refresh card data"
                    >
                      <RefreshCcw size={15} className={isLoadingAssignments ? 'animate-spin' : ''} />
                    </Button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isBusy}
                  className="text-sm font-semibold text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-lg px-5 py-2.5"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleAssign}
                  disabled={isBusy}
                  className="inline-flex items-center gap-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 py-2.5 disabled:opacity-60"
                >
                  <CreditCard size={15} />
                  {saving || isAssigning || isUpdating
                    ? hasExistingCard ? 'Updating…' : 'Assigning…'
                    : hasExistingCard ? 'Update Card' : 'Assign Card'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DetailRow = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="mt-0.5 shrink-0">{icon}</div>
    <div className="flex-1 min-w-0 grid grid-cols-2 gap-2 items-center">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-800 truncate text-right">{value}</span>
    </div>
  </div>
);

const ChevronDownIcon = () => (
  <svg
    className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

export default AssignAccessCard;