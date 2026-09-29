// src/components/super-admin/devices/HospitalAssignFingerprintList.jsx
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Download, RefreshCcw, Filter, Fingerprint,
  MoreVertical, Users as UsersIcon, Eye,
  Stethoscope, Briefcase, CheckCircle2, Pencil,
  Power, PowerOff, AlertTriangle,
} from 'lucide-react';
import { useGetDoctorsQuery } from '../../../../app/service/doctorApi';
import { useGetStaffQuery } from '../../../../app/service/staffApi';
import {
  useGetAllFingerprintEnrollmentsQuery,
  useDeactivateFingerprintEnrollmentMutation,
  useActivateFingerprintEnrollmentMutation,
} from '../../../../app/service/fingerprint';
import { Button, Pagination, SearchBar, FilterBar } from '../../ui';
import { showSuccessToast, showErrorToast } from '../../ui/Toast';
import { Avatar as ShadcnAvatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getS3ImageUrl } from '../../../../app/service/S3';
import {
  registerFingerprintEvents,
  unregisterFingerprintEvents,
} from '../../../socket/fingerprintEvents';

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
const resolveDoctorName = (doc) => {
  if (!doc) return 'N/A';
  if (doc.displayName) return doc.displayName;
  const fullName = `${doc.firstName || ''} ${doc.lastName || ''}`.trim();
  if (fullName) return fullName;
  return doc.name || 'N/A';
};

const resolveDoctorDepartment = (doc) => {
  if (!doc) return 'General';
  return doc.department || doc.specialist || doc.specialty || doc.speciality || 'General';
};

const resolveDoctorDesignation = (doc) => {
  if (!doc) return 'Consultant';
  return doc.designation || doc.qualification || 'Consultant';
};

const resolveStaffName = (st) => {
  if (!st) return 'N/A';
  if (st.name) return st.name;
  const fullName = `${st.firstName || ''} ${st.lastName || ''}`.trim();
  return fullName || 'N/A';
};

const resolveStaffDepartment = (st) => {
  if (!st) return 'Administration';
  return st.department || st.designation || st.staffType || 'Administration';
};

const resolveStaffDesignation = (st) => {
  if (!st) return 'Staff';
  return st.designation || st.staffType || 'Staff';
};

// ------------------------------------------------------------
// Confirm Modal
// ------------------------------------------------------------
const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape' && !loading) onCancel();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, loading, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !loading) onCancel();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          </div>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed mb-6">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-60 flex items-center gap-2"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------
// Action Menu
// ------------------------------------------------------------
const MemberActionMenu = React.memo(
  ({ member, onView, onEnroll, onEdit, onActivate, onDeactivate }) => {
    const hasFingerprint = Boolean(member.fingerprintId);
    const isActive = (member.fingerprintStatus || '').toLowerCase() === 'active';
    const isInactive = hasFingerprint && !isActive;

    return (
      <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1">
        {!hasFingerprint && (
          <button
            type="button"
            onClick={() => onEnroll(member)}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <Fingerprint className="w-4 h-4" />
            Enroll Fingerprint
          </button>
        )}

        <button
          type="button"
          onClick={() => onView(member)}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <Eye className="w-4 h-4" />
          View Details
        </button>

        {hasFingerprint && (
          <button
            type="button"
            onClick={() => onEdit(member)}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <Pencil className="w-4 h-4" />
            Edit Fingerprint
          </button>
        )}

        {isInactive && (
          <button
            type="button"
            onClick={() => onActivate(member)}
            className="w-full text-left px-4 py-2 text-sm text-emerald-700 hover:bg-emerald-50 flex items-center gap-2"
          >
            <Power className="w-4 h-4" />
            Activate Fingerprint
          </button>
        )}

        {isActive && (
          <button
            type="button"
            onClick={() => onDeactivate(member)}
            className="w-full text-left px-4 py-2 text-sm text-amber-700 hover:bg-amber-50 flex items-center gap-2"
          >
            <PowerOff className="w-4 h-4" />
            Deactivate Fingerprint
          </button>
        )}
      </div>
    );
  }
);

MemberActionMenu.displayName = 'MemberActionMenu';

// ------------------------------------------------------------
// Main
// ------------------------------------------------------------
const HospitalAssignFingerprintList = ({
  embedded = false,
  hospitalId: hospitalIdProp = null,
  hospitalName: hospitalNameProp = null,
  hideBackButton = false,
  basePath = '/super-admin/device/fingerprint',
} = {}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [activeMenu, setActiveMenu] = useState(null);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    member: null,
    loading: false,
  });

  const hospitalId = hospitalIdProp || location.state?.hospitalId || null;
  const hospitalName =
    hospitalNameProp || location.state?.hospitalName || 'Hospital';

  const navContext = useMemo(
    () => ({ hospitalId, hospitalName }),
    [hospitalId, hospitalName]
  );

  const {
    data: doctorsResponse,
    isLoading: doctorsLoading,
    isFetching: doctorsFetching,
    refetch: refetchDoctors,
  } = useGetDoctorsQuery({ page: 1, limit: 1000, hospitalId }, { skip: !hospitalId });

  const {
    data: staffResponse,
    isLoading: staffLoading,
    isFetching: staffFetching,
    refetch: refetchStaff,
  } = useGetStaffQuery({ page: 1, limit: 1000, hospitalId }, { skip: !hospitalId });

  const {
    data: enrollmentsResponse,
    isLoading: enrollmentsLoading,
    isFetching: enrollmentsFetching,
    refetch: refetchEnrollments,
  } = useGetAllFingerprintEnrollmentsQuery(
    { hospitalId, limit: 1000 },
    { skip: !hospitalId }
  );

  const [deactivateEnrollment] = useDeactivateFingerprintEnrollmentMutation();
  const [activateEnrollment] = useActivateFingerprintEnrollmentMutation();

  const loading = hospitalId && (doctorsLoading || staffLoading || enrollmentsLoading);
  const isFetching = doctorsFetching || staffFetching || enrollmentsFetching;

  // Real-time fingerprint events
  useEffect(() => {
    if (!hospitalId) return;

    const refreshAll = async () => {
      try {
        await Promise.all([refetchDoctors(), refetchStaff(), refetchEnrollments()]);
      } catch (err) {
        console.error('Refresh after fingerprint event failed:', err);
      }
    };

    registerFingerprintEvents({
      onRegistered: async ({ message, data }) => {
        if (data?.hospitalId && String(data.hospitalId) !== String(hospitalId)) return;
        showSuccessToast(message || 'Fingerprint registered', 3000);
        await refreshAll();
      },
      onUpdated: async ({ message, data }) => {
        if (data?.hospitalId && String(data.hospitalId) !== String(hospitalId)) return;
        showSuccessToast(message || 'Fingerprint updated', 3000);
        await refreshAll();
      },
      onDeactivated: async ({ message, data }) => {
        if (data?.hospitalId && String(data.hospitalId) !== String(hospitalId)) return;
        showSuccessToast(message || 'Fingerprint deactivated', 3000);
        await refreshAll();
      },
      onActivated: async ({ message, data }) => {
        if (data?.hospitalId && String(data.hospitalId) !== String(hospitalId)) return;
        showSuccessToast(message || 'Fingerprint activated', 3000);
        await refreshAll();
      },
    });

    return () => {
      unregisterFingerprintEvents();
    };
  }, [refetchDoctors, refetchStaff, refetchEnrollments, hospitalId]);

  const enrollmentsByEmployee = useMemo(() => {
    const map = new Map();
    (enrollmentsResponse?.data || []).forEach((e) => {
      map.set(`${e.employeeType}-${e.employeeId}`, e);
    });
    return map;
  }, [enrollmentsResponse]);

  const members = useMemo(() => {
    const doctorsList = (doctorsResponse?.data || []).map((doc) => {
      const enrollment = enrollmentsByEmployee.get(`Doctor-${doc.id}`);
      return {
        key: `doctor-${doc.id || doc.doctorNumber || doc.authId}`,
        id: doc.id,
        type: 'Doctor',
        number: doc.doctorNumber
          ? `#DR${String(doc.doctorNumber).padStart(4, '0')}`
          : `#DR${String(doc.id || '0000').padStart(4, '0')}`,
        rawNumber: doc.doctorNumber || doc.id,
        name: resolveDoctorName(doc),
        department: resolveDoctorDepartment(doc),
        designation: resolveDoctorDesignation(doc),
        image: doc.image || doc.imageUrl || doc.imageKey || doc.profileImage || null,
        email: doc.email,
        phone: doc.phone,
        hospitalId: doc.hospitalId || hospitalId,
        hospitalName: doc.hospitalName || doc?.hospital?.name || hospitalName,
        gender: doc.gender,
        dob: doc.dob,
        address: doc.address,
        joiningDate: doc.joiningDate || doc.createdAt,
        fingerprintId: enrollment?.id || null,
        fingerprintStatus: enrollment?.status || null,
        fingerprintEnrolledAt: enrollment?.enrolledAt || null,
        fingerprintDevice: enrollment?.deviceId || null,
        fingerprintFingerPosition: enrollment?.fingerPosition || null,
        fingerprintQuality: enrollment?.quality || null,
        fingerprintAttempts: enrollment?.attempts || null,
        status: doc.isDelete ? 'Blacklisted' : doc.isActive ? 'Active' : 'Inactive',
      };
    });

    const staffList = (staffResponse?.data || []).map((st) => {
      const enrollment = enrollmentsByEmployee.get(`Staff-${st.id}`);
      return {
        key: `staff-${st.id || st.staffNumber || st.authId}`,
        id: st.id,
        type: 'Staff',
        number: st.staffNumber
          ? `#STF${String(st.staffNumber).padStart(5, '0')}`
          : `#STF${String(st.id || '00000').padStart(5, '0')}`,
        rawNumber: st.staffNumber || st.id,
        name: resolveStaffName(st),
        department: resolveStaffDepartment(st),
        designation: resolveStaffDesignation(st),
        image: st.profileImage || st.imageUrl || st.imageKey || st.image || null,
        email: st.email,
        phone: st.phone,
        hospitalId: st.hospitalId || hospitalId,
        hospitalName: st.hospitalName || st?.hospital?.name || hospitalName,
        gender: st.gender,
        dob: st.dob,
        address: st.address,
        joiningDate: st.joiningDate || st.createdAt,
        fingerprintId: enrollment?.id || null,
        fingerprintStatus: enrollment?.status || null,
        fingerprintEnrolledAt: enrollment?.enrolledAt || null,
        fingerprintDevice: enrollment?.deviceId || null,
        fingerprintFingerPosition: enrollment?.fingerPosition || null,
        fingerprintQuality: enrollment?.quality || null,
        fingerprintAttempts: enrollment?.attempts || null,
        status: st.isDelete ? 'Blacklisted' : st.isActive ? 'Active' : 'Inactive',
      };
    });

    return [...doctorsList, ...staffList];
  }, [doctorsResponse, staffResponse, enrollmentsByEmployee, hospitalId, hospitalName]);

  const hasSearchTerm = searchTerm && searchTerm.trim().length >= 2;

  const filteredMembers = useMemo(() => {
    let result = [...members];
    if (typeFilter !== 'all') {
      result = result.filter((m) => m.type.toLowerCase() === typeFilter.toLowerCase());
    }
    if (departmentFilter) {
      result = result.filter(
        (m) => m.department?.toLowerCase() === departmentFilter.toLowerCase()
      );
    }
    if (hasSearchTerm) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter((m) =>
        [m.number, m.name, m.department, m.designation, m.email, m.phone]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(q))
      );
    }
    return result.sort((a, b) => Number(a.rawNumber ?? 0) - Number(b.rawNumber ?? 0));
  }, [members, typeFilter, departmentFilter, searchTerm, hasSearchTerm]);

  const totalFilteredItems = filteredMembers.length;
  const totalPages = Math.ceil(totalFilteredItems / itemsPerPage);

  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredMembers.slice(start, start + itemsPerPage);
  }, [filteredMembers, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, departmentFilter]);

  const departments = useMemo(() => {
    const set = new Set(members.map((m) => m.department).filter(Boolean));
    return [...set].sort();
  }, [members]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeMenu !== null && !event.target.closest('.menu-container')) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeMenu]);

  const handleRefresh = useCallback(async () => {
    setSearchTerm('');
    setTypeFilter('all');
    setDepartmentFilter('');
    setCurrentPage(1);
    setActiveMenu(null);
    try {
      await Promise.all([refetchDoctors(), refetchStaff(), refetchEnrollments()]);
      showSuccessToast('Refreshed members list', 2000);
    } catch (err) {
      console.error('Refresh failed:', err);
    }
  }, [refetchDoctors, refetchStaff, refetchEnrollments]);

  const handleClearFilters = useCallback(() => {
    setTypeFilter('all');
    setDepartmentFilter('');
    setSearchTerm('');
    setCurrentPage(1);
  }, []);

  const handleViewDetails = useCallback(
    (member) => {
      setActiveMenu(null);

      if (!member?.key) {
        console.error('Cannot open fingerprint details: missing member.key', member);
        return;
      }

      navigate(`${basePath}/view/${encodeURIComponent(member.key)}`, {
        state: { member, ...navContext },
      });
    },
    [navigate, basePath, navContext]
  );

  const handleEnrollFingerprint = useCallback(
    (member) => {
      setActiveMenu(null);

      if (!member?.key) {
        console.error('Cannot enroll fingerprint: missing member.key', member);
        return;
      }

      navigate(`${basePath}/enroll/${encodeURIComponent(member.key)}`, {
        state: { member, ...navContext },
      });
    },
    [navigate, basePath, navContext]
  );

  const handleEditFingerprint = useCallback(
    (member) => {
      setActiveMenu(null);

      if (!member?.key) {
        console.error('Cannot edit fingerprint: missing member.key', member);
        return;
      }

      navigate(`${basePath}/edit/${encodeURIComponent(member.key)}`, {
        state: { member, ...navContext },
      });
    },
    [navigate, basePath, navContext]
  );

  const handleActivateFingerprint = useCallback(
    async (member) => {
      setActiveMenu(null);
      if (!member.fingerprintId) {
        showErrorToast('No fingerprint found for this member');
        return;
      }
      try {
        await activateEnrollment({ id: member.fingerprintId }).unwrap();
        showSuccessToast(`Fingerprint activated for ${member.name}`, 2500);
        await Promise.all([refetchDoctors(), refetchStaff(), refetchEnrollments()]);
      } catch (err) {
        console.error('Failed to activate fingerprint:', err);
        showErrorToast('Failed to activate fingerprint. Please try again.');
      }
    },
    [activateEnrollment, refetchDoctors, refetchStaff, refetchEnrollments]
  );

  const handleDeactivateFingerprint = useCallback((member) => {
    setActiveMenu(null);
    if (!member.fingerprintId) {
      showErrorToast('No fingerprint enrolled for this member');
      return;
    }
    setConfirmModal({ isOpen: true, member, loading: false });
  }, []);

  const confirmDeactivate = useCallback(async () => {
    const member = confirmModal.member;
    if (!member) return;
    setConfirmModal((prev) => ({ ...prev, loading: true }));

    try {
      await deactivateEnrollment({ id: member.fingerprintId }).unwrap();
      showSuccessToast(`Fingerprint deactivated for ${member.name}`, 2500);
      await Promise.all([refetchDoctors(), refetchStaff(), refetchEnrollments()]);
      setConfirmModal({ isOpen: false, member: null, loading: false });
    } catch (err) {
      console.error('Failed to deactivate fingerprint:', err);
      showErrorToast('Failed to deactivate fingerprint. Please try again.');
      setConfirmModal((prev) => ({ ...prev, loading: false }));
    }
  }, [confirmModal.member, deactivateEnrollment, refetchDoctors, refetchStaff, refetchEnrollments]);

  const cancelDeactivate = useCallback(() => {
    if (confirmModal.loading) return;
    setConfirmModal({ isOpen: false, member: null, loading: false });
  }, [confirmModal.loading]);

  const toggleMenu = useCallback((id, e) => {
    e.stopPropagation();
    setActiveMenu((prev) => (prev === id ? null : id));
  }, []);

  const activeFilterCount =
    (typeFilter !== 'all' ? 1 : 0) +
    (departmentFilter ? 1 : 0) +
    (hasSearchTerm ? 1 : 0);

  const hasActiveFilters = activeFilterCount > 0;

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const outerCls = embedded ? 'p-0' : 'min-h-screen bg-[#F8F9FA] p-6 font-sans';

  if (!hospitalId) {
    return (
      <div className={outerCls}>
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Hospital not selected</h3>
          <p className="text-gray-500">Please open this page from a specific hospital.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={outerCls}>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={outerCls}>
      {!embedded && !hideBackButton && (
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="p-1 h-auto w-auto hover:bg-gray-200 rounded transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </Button>
            <div className="text-xs text-gray-500">
              <span className="text-gray-700">Fingerprint</span>
              <span className="mx-1 text-gray-400">»</span>
              <span>Home</span>
            </div>
          </div>
          <h1 className="text-xl font-bold text-gray-800">Assign Fingerprint</h1>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="bg-white border border-gray-200 text-sm px-3 py-1.5 rounded-md shadow-sm flex items-center gap-2">
          <Stethoscope size={14} className="text-blue-500" /> Doctors: {members.filter((m) => m.type === 'Doctor').length}
        </span>
        <span className="bg-white border border-gray-200 text-sm px-3 py-1.5 rounded-md shadow-sm flex items-center gap-2">
          <Briefcase size={14} className="text-emerald-500" /> Staff: {members.filter((m) => m.type === 'Staff').length}
        </span>
        <span className="bg-white border border-gray-200 text-sm px-3 py-1.5 rounded-md shadow-sm flex items-center gap-2">
          <UsersIcon size={14} className="text-indigo-500" /> Total: {members.length}
        </span>
        <span className="bg-white border border-gray-200 text-sm px-3 py-1.5 rounded-md shadow-sm flex items-center gap-2">
          <CheckCircle2 size={14} className="text-green-600" /> Enrolled: {members.filter((m) => m.fingerprintId).length}
        </span>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="flex flex-1 gap-3 w-full lg:w-auto">
          <SearchBar
            placeholder="Search by name, number, department..."
            value={searchTerm}
            onChange={(val) => setSearchTerm(val)}
            onClear={() => setSearchTerm('')}
            className="flex-1 max-w-md"
          />
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isFetching}
            title="Refresh"
            className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50 h-auto w-auto"
          >
            <RefreshCcw size={16} className={isFetching ? 'animate-spin' : ''} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            title="Export"
            onClick={() => {}}
            className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50 h-auto w-auto"
          >
            <Download size={16} />
          </Button>
          <FilterBar
            onClick={() => setShowFilters(!showFilters)}
            isOpen={showFilters}
            activeFilterCount={activeFilterCount}
          />
        </div>
      </div>

      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
            </div>
            <Button variant="link" onClick={handleClearFilters} className="text-sm text-red-600 h-auto p-0">
              Clear All
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full h-12 px-6 border border-gray-200 rounded-xl text-gray-700 text-sm bg-white cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="doctor">Doctor</option>
              <option value="staff">Staff</option>
            </select>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full h-12 px-6 border border-gray-200 rounded-xl text-gray-700 text-sm bg-white cursor-pointer"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {filteredMembers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {hasSearchTerm || hasActiveFilters ? 'No members found' : 'No members available'}
          </h3>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">
              Hospital Members
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded ml-2">
                {totalFilteredItems}
              </span>
            </h2>
          </div>

          <div className="flex flex-col min-h-[500px]">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-600 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5 font-medium"># Employee ID</th>
                    <th className="px-6 py-3.5 font-medium">Name</th>
                    <th className="px-6 py-3.5 font-medium">Type</th>
                    <th className="px-6 py-3.5 font-medium">Department</th>
                    <th className="px-6 py-3.5 font-medium">Fingerprint</th>
                    <th className="px-6 py-3.5 font-medium text-center w-16">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedMembers.map((member) => (
                    <tr key={member.key} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-800">{member.number}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <ShadcnAvatar className="w-8 h-8 rounded-full">
                            <AvatarImage src={getS3ImageUrl(member.image)} alt={member.name} />
                            <AvatarFallback className="bg-gray-200 text-gray-600 text-xs font-medium">
                              {member.name?.charAt(0)?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </ShadcnAvatar>
                          <div>
                            <span
                              onClick={() => handleViewDetails(member)}
                              className="font-medium text-gray-800 cursor-pointer hover:text-[#1C62A0] transition-colors"
                            >
                              {member.name}
                            </span>
                            {member.email && (
                              <p className="text-xs text-gray-400">{member.email}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {member.type === 'Doctor' ? (
                          <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
                            <Stethoscope size={12} /> Doctor
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium px-2.5 py-1 rounded-full">
                            <Briefcase size={12} /> Staff
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{member.department}</td>
                      <td className="px-6 py-4">
                        {member.fingerprintId ? (
                          (member.fingerprintStatus || '').toLowerCase() === 'active' ? (
                            <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">
                              <CheckCircle2 size={12} /> Enrolled
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-full">
                              <PowerOff size={12} /> Inactive
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-xs font-medium px-2.5 py-1 rounded-full">
                            <Fingerprint size={12} /> Not Enrolled
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center relative menu-container">
                        <div className="flex justify-center">
                          <button
                            type="button"
                            onClick={(e) => toggleMenu(member.key, e)}
                            className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 transition-colors"
                          >
                            <MoreVertical size={18} />
                          </button>

                          {activeMenu === member.key && (
                            <MemberActionMenu
                              member={member}
                              onView={handleViewDetails}
                              onEnroll={handleEnrollFingerprint}
                              onEdit={handleEditFingerprint}
                              onActivate={handleActivateFingerprint}
                              onDeactivate={handleDeactivateFingerprint}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-auto px-6 py-4 bg-gray-50 border-t border-gray-200">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  totalItems={totalFilteredItems}
                  itemsPerPage={itemsPerPage}
                  itemLabel="members"
                />
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Deactivate fingerprint?"
        message={
          confirmModal.member
            ? `"${confirmModal.member.name}" will no longer be able to use their fingerprint to check in or out until it is activated again.`
            : ''
        }
        confirmText="Deactivate"
        cancelText="Cancel"
        onConfirm={confirmDeactivate}
        onCancel={cancelDeactivate}
        loading={confirmModal.loading}
      />
    </div>
  );
};

export default HospitalAssignFingerprintList;