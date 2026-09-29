// src/components/super-admin/devices/HospitalAssignAccessCardList.jsx
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Download, RefreshCcw, Filter, IdCard,
  MoreVertical, Users as UsersIcon, Eye,
  Stethoscope, Briefcase, Ban, CheckCircle2,
  ShieldCheck, ShieldAlert,
} from 'lucide-react';
import { useGetDoctorsQuery } from '../../../../app/service/doctorApi';
import { useGetStaffQuery } from '../../../../app/service/staffApi';
import {
  useGetRfidCardAssignmentsQuery,
  useDeactivateRfidCardAssignmentMutation,
  useActivateRfidCardAssignmentMutation,
} from '../../../../app/service/accesscard';
import { Button, Pagination, SearchBar, FilterBar, Modal } from '../../ui';
import { showSuccessToast, showErrorToast } from '../../ui/Toast';
import { Avatar as ShadcnAvatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getS3ImageUrl } from '../../../../app/service/S3';

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

// ------------------------------------------------------------
// Action Menu
// ------------------------------------------------------------
const MemberActionMenu = React.memo(
  ({ member, onView, onAssign, onRevoke, onReactivate }) => {
    const hasCard = Boolean(member.accessCardUid);
    const isActive = member.cardStatus === 'Active';

    return (
      <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1">
        {!hasCard && (
          <button
            type="button"
            onClick={() => onAssign(member)}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <IdCard className="w-4 h-4" />
            Assign Card
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

        {hasCard && (
          <>
            {isActive ? (
              <button
                type="button"
                onClick={() => onRevoke(member)}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Ban className="w-4 h-4" />
                Deactivate Card
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onReactivate(member)}
                className="w-full text-left px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 flex items-center gap-2"
              >
                <RefreshCcw className="w-4 h-4" />
                Reactivate Card
              </button>
            )}
          </>
        )}
      </div>
    );
  }
);

MemberActionMenu.displayName = 'MemberActionMenu';

// ------------------------------------------------------------
// Main Component
// ------------------------------------------------------------
const HospitalAssignAccessCardList = ({
  embedded = false,
  hospitalId: hospitalIdProp = null,
  hospitalName: hospitalNameProp = null,
  hideBackButton = false,
  basePath = '/super-admin/device/access-card',
} = {}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeMenu, setActiveMenu] = useState(null);
  const itemsPerPage = 10;

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    action: null,
    member: null,
  });

  // Super Admin: hospital context comes from props (from tabs) or router state
  const hospitalId = hospitalIdProp || location.state?.hospitalId || null;
  const hospitalName =
    hospitalNameProp || location.state?.hospitalName || 'Hospital';

  // Navigation context forwarded to detail pages
  const navContext = useMemo(
    () => ({ hospitalId, hospitalName }),
    [hospitalId, hospitalName]
  );

  // ----------------------------------------------------------
  // Queries — skip if no hospitalId
  // ----------------------------------------------------------
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
    data: assignmentsResponse,
    isLoading: assignmentsLoading,
    isFetching: assignmentsFetching,
    refetch: refetchAssignments,
  } = useGetRfidCardAssignmentsQuery({ hospitalId }, { skip: !hospitalId });

  const [deactivateCard, { isLoading: isDeactivating }] =
    useDeactivateRfidCardAssignmentMutation();
  const [activateCard, { isLoading: isActivating }] =
    useActivateRfidCardAssignmentMutation();

  const loading = hospitalId && (doctorsLoading || staffLoading || assignmentsLoading);
  const isFetching = doctorsFetching || staffFetching || assignmentsFetching;

  // ----------------------------------------------------------
  // Assignment lookup
  // ----------------------------------------------------------
  const assignmentMap = useMemo(() => {
    const map = new Map();
    (assignmentsResponse?.data || []).forEach((assignment) => {
      const key = `${assignment.employeeType?.toLowerCase()}-${assignment.employeeId}`;
      map.set(key, assignment);
    });
    return map;
  }, [assignmentsResponse]);

  // ----------------------------------------------------------
  // Normalize members
  // ----------------------------------------------------------
  const members = useMemo(() => {
    const doctorsList = (doctorsResponse?.data || []).map((doc) => {
      const key = `doctor-${doc.id || doc.doctorNumber || doc.authId}`;
      const assignment = assignmentMap.get(`doctor-${doc.id}`);
      return {
        key,
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
        qualification: doc.qualification,
        experience: doc.experience,
        address: doc.address,
        joiningDate: doc.joiningDate || doc.createdAt,
        shiftStartTime: doc.shiftStartTime,
        shiftEndTime: doc.shiftEndTime,
        accessCardUid: assignment?.cardNumber || null,
        cardStatus: assignment?.status || null,
        assignmentId: assignment?.id || null,
        assignedAt: assignment?.assignedAt,
        status: doc.isDelete ? 'Blacklisted' : doc.isActive ? 'Active' : 'Inactive',
      };
    });

    const staffList = (staffResponse?.data || []).map((st) => {
      const key = `staff-${st.id || st.staffNumber || st.authId}`;
      const assignment = assignmentMap.get(`staff-${st.id}`);
      return {
        key,
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
        shiftStartTime: st.shiftStartTime,
        shiftEndTime: st.shiftEndTime,
        jobType: st.jobType,
        staffType: st.staffType,
        accessCardUid: assignment?.cardNumber || null,
        cardStatus: assignment?.status || null,
        assignmentId: assignment?.id || null,
        assignedAt: assignment?.assignedAt,
        status: st.isDelete ? 'Blacklisted' : st.isActive ? 'Active' : 'Inactive',
      };
    });

    return [...doctorsList, ...staffList];
  }, [doctorsResponse, staffResponse, assignmentMap, hospitalId, hospitalName]);

  // ----------------------------------------------------------
  // Filtering
  // ----------------------------------------------------------
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
    if (statusFilter !== 'all') {
      if (statusFilter === 'assigned') result = result.filter((m) => m.accessCardUid);
      else if (statusFilter === 'not-assigned') result = result.filter((m) => !m.accessCardUid);
      else if (statusFilter === 'active') result = result.filter((m) => m.cardStatus === 'Active');
      else if (statusFilter === 'inactive') result = result.filter((m) => m.cardStatus === 'Inactive');
    }
    if (hasSearchTerm) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter((m) =>
        [m.number, m.name, m.department, m.designation, m.email, m.phone, m.accessCardUid]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(q))
      );
    }
    return result.sort((a, b) => Number(a.rawNumber ?? 0) - Number(b.rawNumber ?? 0));
  }, [members, typeFilter, departmentFilter, statusFilter, searchTerm, hasSearchTerm]);

  const totalFilteredItems = filteredMembers.length;
  const totalPages = Math.ceil(totalFilteredItems / itemsPerPage);
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredMembers.slice(start, start + itemsPerPage);
  }, [filteredMembers, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, departmentFilter, statusFilter]);

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

  // ----------------------------------------------------------
  // Handlers
  // ----------------------------------------------------------
  const handleRefresh = useCallback(async () => {
    setSearchTerm('');
    setTypeFilter('all');
    setDepartmentFilter('');
    setStatusFilter('all');
    setCurrentPage(1);
    setActiveMenu(null);
    try {
      await Promise.all([refetchDoctors(), refetchStaff(), refetchAssignments()]);
      showSuccessToast('Refreshed members list', 2000);
    } catch (err) {
      console.error('Refresh failed:', err);
    }
  }, [refetchDoctors, refetchStaff, refetchAssignments]);

  const handleClearFilters = useCallback(() => {
    setTypeFilter('all');
    setDepartmentFilter('');
    setStatusFilter('all');
    setSearchTerm('');
    setCurrentPage(1);
  }, []);

  const handleViewDetails = useCallback(
    (member) => {
      setActiveMenu(null);

      if (!member?.key) {
        console.error('Cannot open access-card details: missing member.key', member);
        return;
      }

      navigate(`${basePath}/view/${encodeURIComponent(member.key)}`, {
        state: { member, ...navContext },
      });
    },
    [navigate, basePath, navContext]
  );

  const handleAssignCard = useCallback(
    (member) => {
      setActiveMenu(null);

      if (!member?.key) {
        console.error('Cannot assign access card: missing member.key', member);
        return;
      }

      navigate(`${basePath}/assign/${encodeURIComponent(member.key)}`, {
        state: { member, ...navContext },
      });
    },
    [navigate, basePath, navContext]
  );

  const handleRevokeCard = useCallback((member) => {
    setActiveMenu(null);
    setConfirmModal({ isOpen: true, action: 'deactivate', member });
  }, []);

  const handleReactivateCard = useCallback((member) => {
    setActiveMenu(null);
    setConfirmModal({ isOpen: true, action: 'reactivate', member });
  }, []);

  const handleConfirmAction = async () => {
    const { action, member } = confirmModal;
    if (!member?.assignmentId) {
      showErrorToast('No card assignment found', 2500);
      setConfirmModal({ isOpen: false, action: null, member: null });
      return;
    }
    try {
      if (action === 'deactivate') {
        await deactivateCard(member.assignmentId).unwrap();
        showSuccessToast(`Card deactivated for ${member.name}`, 2500);
      } else if (action === 'reactivate') {
        await activateCard(member.assignmentId).unwrap();
        showSuccessToast(`Card reactivated for ${member.name}`, 2500);
      }
      await refetchAssignments();
    } catch (err) {
      console.error('Action failed:', err);
      showErrorToast(
        err?.data?.message || err?.error || 'Action failed. Please try again.',
        2500
      );
    } finally {
      setConfirmModal({ isOpen: false, action: null, member: null });
    }
  };

  const toggleMenu = useCallback((id, e) => {
    e.stopPropagation();
    setActiveMenu((prev) => (prev === id ? null : id));
  }, []);

  const activeFilterCount =
    (typeFilter !== 'all' ? 1 : 0) +
    (departmentFilter ? 1 : 0) +
    (statusFilter !== 'all' ? 1 : 0) +
    (hasSearchTerm ? 1 : 0);

  const hasActiveFilters = activeFilterCount > 0;

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const stats = useMemo(() => {
    const totalCards = members.filter((m) => m.accessCardUid).length;
    const activeCards = members.filter((m) => m.cardStatus === 'Active').length;
    const inactiveCards = members.filter((m) => m.cardStatus === 'Inactive').length;
    return {
      doctors: members.filter((m) => m.type === 'Doctor').length,
      staff: members.filter((m) => m.type === 'Staff').length,
      total: members.length,
      totalCards,
      activeCards,
      inactiveCards,
      notAssigned: members.length - totalCards,
    };
  }, [members]);

  const outerCls = embedded ? 'p-0' : 'min-h-screen bg-[#F8F9FA] p-6 font-sans';

  // Missing-hospital guard
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

  // Loading
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

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------
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
              <span className="text-gray-700">Access Cards</span>
              <span className="mx-1 text-gray-400">»</span>
              <span>Home</span>
            </div>
          </div>
          <h1 className="text-xl font-bold text-gray-800">Assign Access Card</h1>
        </div>
      )}

      {/* Quick stats */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="bg-white border border-gray-200 text-sm px-3 py-1.5 rounded-md shadow-sm flex items-center gap-2">
          <Stethoscope size={14} className="text-blue-500" /> Doctors: {stats.doctors}
        </span>
        <span className="bg-white border border-gray-200 text-sm px-3 py-1.5 rounded-md shadow-sm flex items-center gap-2">
          <Briefcase size={14} className="text-emerald-500" /> Staff: {stats.staff}
        </span>
        <span className="bg-white border border-gray-200 text-sm px-3 py-1.5 rounded-md shadow-sm flex items-center gap-2">
          <IdCard size={14} className="text-indigo-500" /> Total: {stats.total}
        </span>
        <span className="bg-white border border-gray-200 text-sm px-3 py-1.5 rounded-md shadow-sm flex items-center gap-2">
          <ShieldCheck size={14} className="text-green-600" /> Active: {stats.activeCards}
        </span>
        <span className="bg-white border border-gray-200 text-sm px-3 py-1.5 rounded-md shadow-sm flex items-center gap-2">
          <ShieldAlert size={14} className="text-red-500" /> Inactive: {stats.inactiveCards}
        </span>
        <span className="bg-white border border-gray-200 text-sm px-3 py-1.5 rounded-md shadow-sm flex items-center gap-2">
          <Ban size={14} className="text-amber-500" /> Not Assigned: {stats.notAssigned}
        </span>
      </div>

      {/* Search + actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="flex flex-1 gap-3 w-full lg:w-auto">
          <SearchBar
            placeholder="Search by name, number, department, card UID..."
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

      {/* Filters */}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-12 px-6 border border-gray-200 rounded-xl text-gray-700 text-sm bg-white cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="assigned">Card Assigned</option>
              <option value="not-assigned">Not Assigned</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      )}

      {/* Table */}
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
                    <th className="px-6 py-3.5 font-medium">Access Card</th>
                    <th className="px-6 py-3.5 font-medium">Status</th>
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
                        {member.accessCardUid ? (
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full font-mono">
                              <IdCard size={12} />
                              {member.accessCardUid}
                            </span>
                            {member.assignedAt && (
                              <span className="text-xs text-gray-400">
                                {formatDate(member.assignedAt)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-xs font-medium px-2.5 py-1 rounded-full">
                            Not Assigned
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {member.accessCardUid ? (
                          member.cardStatus === 'Active' ? (
                            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium px-2.5 py-1 rounded-full">
                              <CheckCircle2 size={12} /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 text-xs font-medium px-2.5 py-1 rounded-full">
                              <Ban size={12} /> Inactive
                            </span>
                          )
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
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
                              onAssign={handleAssignCard}
                              onRevoke={handleRevokeCard}
                              onReactivate={handleReactivateCard}
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

      {/* Confirm modal */}
      <Modal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, action: null, member: null })}
        title={confirmModal.action === 'deactivate' ? 'Deactivate Access Card' : 'Reactivate Access Card'}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {confirmModal.action === 'deactivate'
              ? `Deactivate the access card for ${confirmModal.member?.name}?`
              : `Reactivate the access card for ${confirmModal.member?.name}?`}
          </p>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setConfirmModal({ isOpen: false, action: null, member: null })}
              disabled={isDeactivating || isActivating}
            >
              Cancel
            </Button>
            <button
              type="button"
              onClick={handleConfirmAction}
              disabled={isDeactivating || isActivating}
              className={`text-sm font-semibold text-white rounded-lg px-4 py-2 disabled:opacity-60 ${
                confirmModal.action === 'deactivate'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isDeactivating || isActivating ? 'Please wait…' : 'Confirm'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default HospitalAssignAccessCardList;