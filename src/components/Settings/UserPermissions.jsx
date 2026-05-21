// src/components/Settings/UserPermissions.jsx - With search functionality
import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Button, Card, Table, TableHead, TableBody, TableRow, TableHeader, 
  TableCell, Modal, Badge, SearchBar 
} from '../ui';
import { showSuccessToast, showWarningToast, showErrorToast, showAddToast, showDeleteToast } from '../ui/Toast';
import {
  useGetRolesQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
} from "../../../app/service/role";
import { getHospitalId } from '../../utils/auth';

// Filter for admin role by ID (safer than name matching)
const ADMIN_ROLE_ID = 2; // Define admin role ID constant

const NewRoleModal = memo(({
  showNewRoleModal,
  setShowNewRoleModal,
  newRole,
  setNewRole,
  handleNewRoleSubmit,
  isSubmitting
}) => (
  <Modal
    isOpen={showNewRoleModal}
    onClose={() => setShowNewRoleModal(false)}
    title="Create New Role"
    size="md"
  >
    <form onSubmit={handleNewRoleSubmit}>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Role Name <span className="text-red-500">*</span>
        </label>

        <input
          type="text"
          value={newRole.name}
          onChange={(e) =>
            setNewRole((prev) => ({
              ...prev,
              name: e.target.value,
            }))
          }
          placeholder="Enter role name"
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          required
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>

        <textarea
          value={newRole.description}
          onChange={(e) =>
            setNewRole((prev) => ({
              ...prev,
              description: e.target.value,
            }))
          }
          placeholder="Enter role description"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowNewRoleModal(false)}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating..." : "Create Role"}
        </Button>
      </div>
    </form>
  </Modal>
));

const EditRoleModal = memo(({
  showEditRoleModal,
  setShowEditRoleModal,
  editRole,
  setEditRole,
  handleEditRoleSubmit,
  isSubmitting
}) => (
  <Modal isOpen={showEditRoleModal} onClose={() => setShowEditRoleModal(false)} title="Edit Role" size="md">
    <form onSubmit={handleEditRoleSubmit}>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Role Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={editRole.name}
          onChange={(e) => setEditRole(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Enter role name"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={editRole.description}
          onChange={(e) => setEditRole(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Enter role description"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
        />
      </div>
      
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
        <Button type="button" variant="outline" onClick={() => setShowEditRoleModal(false)}>Cancel</Button>
        <Button type="submit" variant="primary" disabled={isSubmitting} loading={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  </Modal>
));

const UserPermissions = () => {
  const navigate = useNavigate();

  // Get hospitalId from auth utility (no localStorage)
  const hospitalId = getHospitalId();
  console.log(hospitalId);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  const {
    data: rolesResponse,
    isLoading,
    refetch,
  } = useGetRolesQuery(hospitalId);

  console.log("Roles response:", rolesResponse);

  const [createRole] = useCreateRoleMutation();
  const [updateRole] = useUpdateRoleMutation();
  const [deleteRole] = useDeleteRoleMutation();

  const [showNewRoleModal, setShowNewRoleModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [newRole, setNewRole] = useState({ name: '', description: '' });
  const [editRole, setEditRole] = useState({ name: '', description: '', originalName: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRefs = useRef({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown !== null) {
        const dropdownElement = dropdownRefs.current[openDropdown];
        if (dropdownElement && !dropdownElement.contains(event.target)) setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  const handleNewRoleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (newRole.name.trim()) {
      try {
        setIsSubmitting(true);

        if (!hospitalId) {
          showErrorToast("Hospital ID is missing. Please log in again.");
          return;
        }

        await createRole({
          name: newRole.name,
          description: newRole.description,
        }).unwrap();

        await refetch();

        showAddToast(`New role "${newRole.name}" created successfully!`);

        setNewRole({
          name: "",
          description: "",
        });

        setShowNewRoleModal(false);
      } catch (error) {
        console.error(error);
        showErrorToast("Failed to create role");
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [newRole, createRole, refetch, hospitalId]);

  const handleEditRoleSubmit = useCallback(async (e) => {
    e.preventDefault();

    // Use ID check instead of name check
    if (selectedRole?.id === ADMIN_ROLE_ID) {
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

      setShowEditRoleModal(false);
      setSelectedRole(null);
      setOpenDropdown(null);
    } catch (error) {
      console.error(error);
      showErrorToast("Failed to update role");
    } finally {
      setIsSubmitting(false);
    }
  }, [editRole, selectedRole, updateRole, refetch]);

  const handleDeleteRole = async () => {
    // Use ID check instead of name check
    if (roleToDelete?.id === ADMIN_ROLE_ID) {
      showWarningToast("Admin role cannot be deleted");
      return;
    }

    try {
      setIsSubmitting(true);

      await deleteRole(roleToDelete?.id).unwrap();

      await refetch();

      showDeleteToast(`Role "${roleToDelete?.name}" deleted successfully!`);

      setShowDeleteModal(false);
      setRoleToDelete(null);
    } catch (error) {
      console.error(error);
      showErrorToast("Failed to delete role");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditModal = useCallback((role) => {
    setSelectedRole(role);
    setEditRole({ 
      name: role.name, 
      description: role.description || '', 
      originalName: role.name 
    });
    setShowEditRoleModal(true);
    setOpenDropdown(null);
  }, []);

  const handleOpenViewModal = useCallback((role) => {
    setSelectedRole(role);
    setShowViewModal(true);
    setOpenDropdown(null);
  }, []);

  const handleOpenPermissionsPage = (role) => {
    navigate(`/permissions/${role.id}`, { state: { from: "User Permissions" } });
    setOpenDropdown(null);
  };

  const toggleDropdown = useCallback((roleId) => setOpenDropdown(openDropdown === roleId ? null : roleId), [openDropdown]);

  // Filter roles based on search term
  const filterRoles = (roles, searchTerm) => {
    if (!searchTerm.trim()) return roles;
    const term = searchTerm.toLowerCase();
    return roles.filter(role => 
      role.name?.toLowerCase().includes(term) ||
      role.description?.toLowerCase().includes(term)
    );
  };

  // Get filtered admin roles
  const filteredAdminRoles = filterRoles(
    rolesResponse?.admin?.filter((admin) => admin?.id === ADMIN_ROLE_ID) || [],
    searchTerm
  );

  // Get filtered hospital roles
  const filteredHospitalRoles = filterRoles(
    rolesResponse?.data || [],
    searchTerm
  );

  const RoleDropdown = ({ role }) => {
    // Don't show dropdown for admin role
    if (role.id === ADMIN_ROLE_ID) {
      return <span className="text-xs text-gray-400">System role</span>;
    }

    return (
      <div className="relative" ref={el => dropdownRefs.current[role.name] = el}>
        <Button variant="ghost" size="sm" onClick={() => toggleDropdown(role.name)} className="p-2">
          <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </Button>
        {openDropdown === role.name && (
          <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
            <button onClick={() => handleOpenViewModal(role)} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              View
            </button>
            <button onClick={() => handleOpenEditModal(role)} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              Edit
            </button>
            <button onClick={() => { setRoleToDelete(role); setShowDeleteModal(true); }} className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              Delete
            </button>
            <button onClick={() => handleOpenPermissionsPage(role)} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-t border-gray-100 mt-1 pt-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              Permissions
            </button>
          </div>
        )}
      </div>
    );
  };

  const ViewRoleModal = memo(() => (
    <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title="View Role Details" size="md">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
          <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded border border-gray-200">
            {selectedRole?.name}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded border border-gray-200">
            {selectedRole?.description || '-'}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Created Date</label>
          <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded border border-gray-200">
            {selectedRole?.createdDate || selectedRole?.createdAt || '-'}
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => setShowViewModal(false)}>Close</Button>
        </div>
      </div>
    </Modal>
  ));

  const DeleteRoleModal = memo(() => (
    <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Role" size="sm" showCloseButton={false}>
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-full bg-red-100">
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M6 7h12M9 7v12m6-12v12M5 7l1-3h12l1 3" /></svg>
        </div>
        <p className="text-sm text-gray-500 mb-6">Are you sure you want to delete <span className="font-medium">{roleToDelete?.name}</span>?</p>
        <div className="flex justify-center gap-3">
          <Button type="button" variant="outline" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDeleteRole} disabled={isSubmitting} loading={isSubmitting}>
            {isSubmitting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </Modal>
  ));

  if (isLoading) {
    return (
      <Card>
        <div className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-gray-500">Loading roles...</p>
        </div>
      </Card>
    );
  }

  // Calculate total roles count
  const hospitalRolesCount = filteredHospitalRoles?.length || 0;
  const adminRolesCount = filteredAdminRoles?.length || 0;
  const totalRoles = adminRolesCount + hospitalRolesCount;
  const totalFilteredRoles = filteredAdminRoles.length + filteredHospitalRoles.length;

  return (
    <>
      <Card>
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Total Roles: {totalFilteredRoles}</h2>
              <p className="text-sm text-gray-500 mt-1">Manage user roles and permissions</p>
            </div>
            <div className="flex gap-3">
              {/* Search Bar */}
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
        
        {/* Show message when no results found */}
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
            {/* Admin Roles Section */}
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
                      {/* No dropdown for admin role */}
                    </TableCell>
                  </tr>
                ))}
              </tbody>
            )}
            
            {/* Hospital Roles Section */}
            {filteredHospitalRoles.length > 0 && (
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredHospitalRoles.map((role) => (
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
                      <RoleDropdown role={role} />
                    </TableCell>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>
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

      <ViewRoleModal />
      <DeleteRoleModal />
    </>
  );
};

export default UserPermissions;