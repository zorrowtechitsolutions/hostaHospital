// src/components/superadmin/usermanagement/HospitalUserPermissions.jsx
import React, { useState, useCallback, useRef, useEffect, memo, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Check,
  X,
  Calendar,
  Stethoscope,
  Filter,
  RefreshCcw,
  Download,
  Upload,
  Users as UsersIcon,
  Phone,
  Trash2,
  MoreVertical,
  Eye,
  Edit,
  Shield,
  ArrowLeft,
  Building2
} from "lucide-react";
import { 
  Button, Card, Table, TableHead, TableBody, TableRow, TableHeader, 
  TableCell, Modal, Badge, SearchBar, Pagination 
} from '../../ui';
import { showSuccessToast, showWarningToast, showErrorToast, showAddToast, showDeleteToast } from '../../ui/Toast';
import {
  useGetRolesQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
} from "../../../../app/service/role";
import { socket } from '../../../socket/socket';
import { registerRoleEvents, unregisterRoleEvents } from '../../../socket/roleEvents';

// Constants
const ADMIN_ROLE_ID = 2;
const ITEMS_PER_PAGE = 5;
const dropdownItemClass = "w-full px-4 py-2 text-left text-sm flex items-center gap-2";
const iconButtonClass = "p-2 border border-gray-200 rounded-md bg-white hover:bg-gray-50";

// Helper functions
const getCreatedDate = (role) => role?.createdDate || role?.createdAt || '-';
const isAdminRole = (role) => role?.id === ADMIN_ROLE_ID;

// Helper to update role form fields
const updateRoleField = (setter) => (field) => (value) => {
  setter(prev => ({
    ...prev,
    [field]: value
  }));
};

// Modal Footer Component
const ModalFooter = ({ onCancel, onSubmit, isSubmitting, submitText = "Save", cancelText = "Cancel" }) => (
  <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
    <Button type="button" variant="outline" onClick={onCancel}>
      {cancelText}
    </Button>
    <Button type="submit" variant="primary" disabled={isSubmitting} loading={isSubmitting || undefined}>
      {isSubmitting ? 'Processing...' : submitText}
    </Button>
  </div>
);

// Role Form Modal
const RoleFormModal = memo(({
  isOpen,
  onClose,
  title,
  roleData,
  onFieldChange,
  onSubmit,
  isSubmitting
}) => {
  const handleFieldChange = (field) => (e) => {
    onFieldChange(field)(e.target.value);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <form onSubmit={onSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={roleData.name}
            onChange={handleFieldChange('name')}
            placeholder="Enter role name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={roleData.description}
            onChange={handleFieldChange('description')}
            placeholder="Enter role description"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
          />
        </div>

        <ModalFooter
          onCancel={onClose}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          submitText={title === "Create New Role" ? "Create Role" : "Save Changes"}
        />
      </form>
    </Modal>
  );
});

// View Role Modal
const ViewRoleModal = memo(({ isOpen, onClose, role }) => {
  if (!role) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="View Role Details" size="md">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
          <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded border border-gray-200">
            {role.name}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded border border-gray-200">
            {role.description || '-'}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Created Date</label>
          <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded border border-gray-200">
            {getCreatedDate(role)}
          </div>
        </div>
        <ModalFooter onCancel={onClose} onSubmit={() => {}} submitText="Close" />
      </div>
    </Modal>
  );
});

// Delete Role Modal
const DeleteRoleModal = memo(({ isOpen, onClose, role, onConfirm, isDeleting }) => {
  if (!role) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Role" size="sm" showCloseButton={false}>
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-full bg-red-100">
          <Trash2 className="w-6 h-6 text-red-500" />
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Are you sure you want to delete <span className="font-medium">{role.name}</span>?
        </p>
        <div className="flex justify-center gap-3">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm} disabled={isDeleting} loading={isDeleting || undefined}>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </Modal>
  );
});

// Role Dropdown Component
const RoleDropdown = memo(({ role, onView, onEdit, onDelete, onPermissions }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isAdminRole(role)) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen)} className={iconButtonClass}>
        <MoreVertical size={18} />
      </Button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
          <button onClick={() => { onView(role); setIsOpen(false); }} className={`${dropdownItemClass} text-gray-700 hover:bg-gray-50`}>
            <Eye size={16} /> View
          </button>
          <button onClick={() => { onEdit(role); setIsOpen(false); }} className={`${dropdownItemClass} text-gray-700 hover:bg-gray-50`}>
            <Edit size={16} /> Edit
          </button>
          <button onClick={() => { onDelete(role); setIsOpen(false); }} className={`${dropdownItemClass} text-red-600 hover:bg-red-50`}>
            <Trash2 size={16} /> Delete
          </button>
          <div className="border-t border-gray-100 my-1"></div>
          <button onClick={() => { onPermissions(role); setIsOpen(false); }} className={`${dropdownItemClass} text-gray-700 hover:bg-gray-50`}>
            <Shield size={16} /> Permissions
          </button>
        </div>
      )}
    </div>
  );
});

// Loading Skeleton Component
const RoleSkeleton = () => (
  <div className="min-h-screen bg-[#F8F9FA] p-6 font-sans">
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-1">
        <div className="p-1 w-9 h-9 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <div className="h-7 w-48 bg-gray-200 rounded animate-pulse mt-2"></div>
      <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mt-1"></div>
    </div>
    <Card className="min-h-[400px] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#1C62A0]"></div>
        <p className="mt-3 text-gray-500">Loading roles...</p>
      </div>
    </Card>
  </div>
);

// NewRoleModal Component
const NewRoleModal = memo(({ showNewRoleModal, setShowNewRoleModal, newRole, setNewRole, handleNewRoleSubmit, isSubmitting }) => {
  const updateNewRoleField = (field) => (value) => {
    setNewRole(prev => ({ ...prev, [field]: value }));
  };

  return (
    <RoleFormModal
      isOpen={showNewRoleModal}
      onClose={() => setShowNewRoleModal(false)}
      title="Create New Role"
      roleData={newRole}
      onFieldChange={updateNewRoleField}
      onSubmit={handleNewRoleSubmit}
      isSubmitting={isSubmitting}
    />
  );
});

// EditRoleModal Component
const EditRoleModal = memo(({ showEditRoleModal, setShowEditRoleModal, editRole, setEditRole, handleEditRoleSubmit, isSubmitting }) => {
  const updateEditRoleField = (field) => (value) => {
    setEditRole(prev => ({ ...prev, [field]: value }));
  };

  return (
    <RoleFormModal
      isOpen={showEditRoleModal}
      onClose={() => setShowEditRoleModal(false)}
      title="Edit Role"
      roleData={editRole}
      onFieldChange={updateEditRoleField}
      onSubmit={handleEditRoleSubmit}
      isSubmitting={isSubmitting}
    />
  );
});

const HospitalUserPermissions = () => {
  const navigate = useNavigate();
  const { hospitalId } = useParams();
  const location = useLocation();
  const hospitalName = location.state?.hospitalName || 'Hospital';

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = ITEMS_PER_PAGE;

  const [eventsRegistered, setEventsRegistered] = useState(false);

  const {
    data,
    isLoading,
    refetch,
    error,
  } = useGetRolesQuery({ hospitalId });
  
  const rolesResponse = data ?? error?.data ?? {};

  const [createRole] = useCreateRoleMutation();
  const [updateRole] = useUpdateRoleMutation();
  const [deleteRole] = useDeleteRoleMutation();

  const [showNewRoleModal, setShowNewRoleModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [openDropdown, setOpenDropdown] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const dropdownRefs = useRef({});

  const [newRole, setNewRole] = useState({ name: '', description: '' });
  const [editRole, setEditRole] = useState({ name: '', description: '' });

  // Register socket event listeners
  useEffect(() => {
    registerRoleEvents({
      onRoleRegistered: async () => {
        showSuccessToast(`New role registered!`, 3000);
        await refetch();
      },
      onRoleUpdated: async () => {
        showSuccessToast(`Role updated!`, 3000);
        await refetch();
      },
      onRoleDeleted: async () => {
        showSuccessToast(`Role deleted!`, 3000);
        await refetch();
      }
    });

    setEventsRegistered(true);

    return () => {
      unregisterRoleEvents();
      setEventsRegistered(false);
    };
  }, [refetch]);

  // Listen for socket connection
  useEffect(() => {
    const handleConnect = () => {
      if (!eventsRegistered) {
        registerRoleEvents({
          onRoleRegistered: async () => {
            showSuccessToast(`New role registered!`, 3000);
            await refetch();
          },
          onRoleUpdated: async () => {
            showSuccessToast(`Role updated!`, 3000);
            await refetch();
          },
          onRoleDeleted: async () => {
            showSuccessToast(`Role deleted!`, 3000);
            await refetch();
          }
        });
        setEventsRegistered(true);
      }
    };

    socket.on("connect", handleConnect);

    return () => {
      socket.off("connect", handleConnect);
    };
  }, [refetch, eventsRegistered]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const closeEditModal = () => {
    setShowEditRoleModal(false);
    setSelectedRole(null);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedRole(null);
  };

  const closeDeleteModal = () => {
    setRoleToDelete(null);
    setShowDeleteModal(false);
  };

  const updateNewRoleField = updateRoleField(setNewRole);
  const updateEditRoleField = updateRoleField(setEditRole);

  const handleNewRoleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (!newRole.name.trim()) {
      showWarningToast("Role name is required");
      return;
    }

    try {
      setIsSubmitting(true);
      await createRole({
        name: newRole.name,
        description: newRole.description,
        hospitalId: Number(hospitalId),
      }).unwrap();

      await refetch();
      showAddToast(`New role "${newRole.name}" created successfully!`);
      
      setNewRole({ name: "", description: "" });
      setShowNewRoleModal(false);
      setCurrentPage(1);
    } catch (error) {
      showErrorToast(error?.data?.message || "Failed to create role");
    } finally {
      setIsSubmitting(false);
    }
  }, [newRole, createRole, refetch, hospitalId]);

  const handleEditRoleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (isAdminRole(selectedRole)) {
      showWarningToast("Admin role cannot be edited");
      return;
    }

    try {
      setIsSubmitting(true);
      await updateRole({
        id: selectedRole?.id,
        data: {
          name: editRole.name,
          description: editRole.description,
        },
      }).unwrap();

      await refetch();
      showSuccessToast(`Role "${editRole.name}" updated successfully!`);
      
      closeEditModal();
      setCurrentPage(1);
    } catch (error) {
      showErrorToast(error?.data?.message || "Failed to update role");
    } finally {
      setIsSubmitting(false);
    }
  }, [editRole, selectedRole, updateRole, refetch]);

  const handleDeleteRole = useCallback(async () => {
    if (isAdminRole(roleToDelete)) {
      showWarningToast("Admin role cannot be deleted");
      closeDeleteModal();
      return;
    }

    try {
      setIsSubmitting(true);
      await deleteRole(roleToDelete?.id).unwrap();
      await refetch();
      
      showDeleteToast(`Role "${roleToDelete?.name}" deleted successfully!`);
      closeDeleteModal();
      setCurrentPage(1);
    } catch (error) {
      showErrorToast(error?.data?.message || "Failed to delete role");
    } finally {
      setIsSubmitting(false);
    }
  }, [roleToDelete, deleteRole, refetch]);

  const handleOpenEditModal = useCallback((role) => {
    setSelectedRole(role);
    setEditRole({ 
      name: role.name, 
      description: role.description || ''
    });
    setShowEditRoleModal(true);
  }, []);

  const handleOpenViewModal = useCallback((role) => {
    setSelectedRole(role);
    setShowViewModal(true);
  }, []);

  const handleOpenDeleteModal = useCallback((role) => {
    setRoleToDelete(role);
    setShowDeleteModal(true);
  }, []);

  const handleOpenPermissionsPage = useCallback((role) => {
    navigate(
      `/super-admin/hospital-users/${hospitalId}/permissions/${role.id}`,
      {
        state: {
          hospitalName,
          roleName: role.name,
        },
      }
    );
    setOpenDropdown(null);
  }, [navigate, hospitalId, hospitalName]);

  const handleBack = () => {
    navigate('/super-admin/hospital-users', {
      state: { 
        hospitalName: hospitalName,
        from: "HospitalUserPermissions"
      }
    });
  };

  const toggleDropdown = useCallback((roleId) => setOpenDropdown(openDropdown === roleId ? null : roleId), [openDropdown]);

  const filterRoles = (roles, searchTerm) => {
    if (!searchTerm.trim()) return roles;
    const term = searchTerm.toLowerCase();
    return roles.filter(role => 
      role.name?.toLowerCase().includes(term) ||
      role.description?.toLowerCase().includes(term)
    );
  };

  const filteredAdminRoles = filterRoles(
    (rolesResponse?.admin || []).filter(
      role => role?.id === ADMIN_ROLE_ID && role?.name === "Admin"
    ),
    searchTerm
  );

  const filteredHospitalRoles = filterRoles(
    rolesResponse?.data || [],
    searchTerm
  );

  const totalHospitalRoles = filteredHospitalRoles.length;
  const totalPages = Math.ceil(totalHospitalRoles / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedHospitalRoles = filteredHospitalRoles.slice(startIndex, startIndex + itemsPerPage);

  const totalFilteredRoles = filteredAdminRoles.length + filteredHospitalRoles.length;

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  if (isLoading) {
    return <RoleSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 font-sans">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <button
            onClick={handleBack}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div className="text-xs text-gray-500">
            <span className="text-gray-700">Hospital Users</span>
            <span className="mx-1 text-gray-400">»</span>
            <span>{hospitalName}</span>
            <span className="mx-1 text-gray-400">»</span>
            <span>User Permissions</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">User Permissions</h1>
            <p className="text-sm text-gray-500 mt-1">Manage roles and permissions for {hospitalName}</p>
          </div>
        </div>
      </div>

      <Card>
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Total Roles: {totalFilteredRoles}</h2>
              <p className="text-sm text-gray-500 mt-1">Manage user roles and permissions</p>
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by role name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 px-4 py-2 pl-10 pr-4 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <svg 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
              </div>
              <Button type="button" variant="primary" onClick={() => setShowNewRoleModal(true)} className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                New Role
              </Button>
            </div>
          </div>
        </div>
        
        {totalFilteredRoles === 0 && searchTerm && (
          <div className="p-8 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-gray-500">No roles found matching "{searchTerm}"</p>
            <button 
              onClick={() => setSearchTerm('')} 
              className="mt-2 text-sm text-blue-600 hover:text-blue-700"
            >
              Clear search
            </button>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <TableHeader>Role</TableHeader>
                <TableHeader>Description</TableHeader>
                <TableHeader>Created Date</TableHeader>
                <TableHeader>Actions</TableHeader>
              </tr>
            </thead>
            {filteredAdminRoles.length > 0 && (
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAdminRoles.map((admin) => (
                  <tr key={admin?.id} className="hover:bg-gray-50 transition-colors">
                    <TableCell className="whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {admin?.name}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {admin?.description || "-"}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {admin?.createdDate || admin?.createdAt || "-"}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className="text-xs text-gray-400">System role</span>
                    </TableCell>
                  </tr>
                ))}
              </tbody>
            )}
            
            {paginatedHospitalRoles.length > 0 && (
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedHospitalRoles.map((role) => (
                  <tr key={role?.id} className="hover:bg-gray-50 transition-colors">
                    <TableCell className="whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {role?.name}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {role?.description || "-"}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {role?.createdDate || role?.createdAt || "-"}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <RoleDropdown 
                        role={role}
                        onView={handleOpenViewModal}
                        onEdit={handleOpenEditModal}
                        onDelete={handleOpenDeleteModal}
                        onPermissions={handleOpenPermissionsPage}
                      />
                    </TableCell>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>

        {totalHospitalRoles > 0 && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalItems={totalHospitalRoles}
              itemsPerPage={itemsPerPage}
              itemLabel="hospital roles"
            />
          </div>
        )}

        {totalFilteredRoles === 0 && !searchTerm && (
          <div className="p-8 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <p className="text-gray-500">{rolesResponse?.message || "No roles found"}</p>
          </div>
        )}
      </Card>

      <NewRoleModal
        showNewRoleModal={showNewRoleModal}
        setShowNewRoleModal={setShowNewRoleModal}
        newRole={newRole}
        setNewRole={setNewRole}
        handleNewRoleSubmit={handleNewRoleSubmit}
        isSubmitting={isSubmitting}
      />
      <EditRoleModal
        showEditRoleModal={showEditRoleModal}
        setShowEditRoleModal={setShowEditRoleModal}
        editRole={editRole}
        setEditRole={setEditRole}
        handleEditRoleSubmit={handleEditRoleSubmit}
        isSubmitting={isSubmitting}
      />

      <ViewRoleModal
        isOpen={showViewModal}
        onClose={closeViewModal}
        role={selectedRole}
      />

      <DeleteRoleModal
        isOpen={roleToDelete !== null}
        onClose={closeDeleteModal}
        role={roleToDelete}
        onConfirm={handleDeleteRole}
        isDeleting={isSubmitting}
      />
    </div>
  );
};

export default HospitalUserPermissions;