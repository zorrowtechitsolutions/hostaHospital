// src/components/Settings/UserPermissions.jsx - With toast notifications
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Button, Card, Table, TableHead, TableBody, TableRow, TableHeader, 
  TableCell, Modal, Input, Select, Badge, Alert 
} from '../ui';
import { showSuccessToast, showWarningToast, showErrorToast, showAddToast, showDeleteToast } from '../ui/Toast';

const UserPermissions = () => {
  const navigate = useNavigate();

  const [roles, setRoles] = useState([
    { name: 'Owner', createdDate: '22 Jun 2025', status: 'Active' },
    { name: 'Admin', createdDate: '17 Jun 2025', status: 'Active' },
    { name: 'Patient', createdDate: '10 Jun 2025', status: 'Inactive' },
    { name: 'Doctor', createdDate: '22 May 2025', status: 'Active' },
    { name: 'Nurse', createdDate: '15 May 2025', status: 'Inactive' },
    { name: 'Supervisor', createdDate: '30 Apr 2025', status: 'Active' },
    { name: 'Pharmacist', createdDate: '15 Jan 2025', status: 'Inactive' },
  ]);

  const [showNewRoleModal, setShowNewRoleModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [newRole, setNewRole] = useState({ name: '', status: 'Active' });
  const [editRole, setEditRole] = useState({ name: '', status: 'Active', originalName: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRefs = useRef({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [rolePermissions, setRolePermissions] = useState({
    Owner: ['all_access', 'manage_users', 'manage_roles', 'view_reports', 'edit_settings'],
    Admin: ['manage_users', 'view_reports', 'edit_settings'],
    Doctor: ['view_patients', 'create_appointments', 'view_reports'],
    Patient: ['view_profile', 'book_appointment'],
    Nurse: ['view_patients', 'update_records'],
    Supervisor: ['view_reports', 'approve_requests', 'manage_staff'],
    Pharmacist: ['view_inventory', 'manage_medicines'],
  });

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

  const handleNewRoleSubmit = useCallback((e) => {
    e.preventDefault();
    if (newRole.name.trim()) {
      setIsSubmitting(true);
      
      setTimeout(() => {
        const formattedDate = new Date().toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
        setRoles(prev => [...prev, { name: newRole.name, createdDate: formattedDate, status: newRole.status }]);
        setRolePermissions(prev => ({ ...prev, [newRole.name]: [] }));
        
        showAddToast(
          `New role "${newRole.name}" created successfully!`,
          4000,
          {
            'Role': newRole.name,
            'Status': newRole.status,
            'Created': formattedDate
          }
        );
        
        setNewRole({ name: '', status: 'Active' });
        setShowNewRoleModal(false);
        setIsSubmitting(false);
      }, 500);
    }
  }, [newRole]);

  const handleEditRoleSubmit = useCallback((e) => {
    e.preventDefault();
    if (editRole.name.trim()) {
      setIsSubmitting(true);
      
      setTimeout(() => {
        setRoles(prev => prev.map(role => 
          role.name === editRole.originalName 
            ? { ...role, name: editRole.name, status: editRole.status } 
            : role
        ));
        
        if (editRole.name !== editRole.originalName) {
          setRolePermissions(prev => {
            const newPermissions = { ...prev };
            newPermissions[editRole.name] = newPermissions[editRole.originalName];
            delete newPermissions[editRole.originalName];
            return newPermissions;
          });
        }
        
        showSuccessToast(
          `Role "${editRole.name}" updated successfully!`,
          4000,
          {
            'Role': editRole.name,
            'Status': editRole.status
          }
        );
        
        setShowEditRoleModal(false);
        setSelectedRole(null);
        setOpenDropdown(null);
        setIsSubmitting(false);
      }, 500);
    }
  }, [editRole]);

  const handleDeleteRole = () => {
    setIsSubmitting(true);
    
    setTimeout(() => {
      setRoles(prev => prev.filter(r => r.name !== roleToDelete));
      setRolePermissions(prev => {
        const newPermissions = { ...prev };
        delete newPermissions[roleToDelete];
        return newPermissions;
      });
      
      showDeleteToast(
        `Role "${roleToDelete}" has been deleted successfully!`,
        4000,
        {
          'Role': roleToDelete,
          'Status': 'Deleted'
        }
      );
      
      setShowDeleteModal(false);
      setRoleToDelete(null);
      setIsSubmitting(false);
    }, 500);
  };

  const handleOpenEditModal = useCallback((role) => {
    setSelectedRole(role);
    setEditRole({ name: role.name, status: role.status, originalName: role.name });
    setShowEditRoleModal(true);
    setOpenDropdown(null);
  }, []);

  const handleOpenPermissionsPage = (role) => {
    navigate(`/permissions/${role.name}`, { state: { from: "User Permissions" } });
    setOpenDropdown(null);
  };

  const toggleDropdown = useCallback((roleId) => setOpenDropdown(openDropdown === roleId ? null : roleId), [openDropdown]);

  const RoleDropdown = ({ role }) => (
    <div className="relative" ref={el => dropdownRefs.current[role.name] = el}>
      <Button variant="ghost" size="sm" onClick={() => toggleDropdown(role.name)} className="p-2">
        <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </Button>
      {openDropdown === role.name && (
        <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
          <button onClick={() => handleOpenEditModal(role)} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            Edit
          </button>
          <button onClick={() => { setRoleToDelete(role.name); setShowDeleteModal(true); }} className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
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

  const NewRoleModal = () => (
    <Modal isOpen={showNewRoleModal} onClose={() => setShowNewRoleModal(false)} title="Create New Role" size="md">
      <form onSubmit={handleNewRoleSubmit}>
        <Input 
          label="Role Name" 
          value={newRole.name} 
          onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))} 
          placeholder="Enter role name" 
          required 
          autoFocus 
        />
        <Select 
          label="Default Status" 
          value={newRole.status} 
          onChange={(e) => setNewRole(prev => ({ ...prev, status: e.target.value }))} 
          options={['Active', 'Inactive']} 
          className="mt-4" 
        />
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => setShowNewRoleModal(false)}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={isSubmitting} loading={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Role'}
          </Button>
        </div>
      </form>
    </Modal>
  );

  const EditRoleModal = () => (
    <Modal isOpen={showEditRoleModal} onClose={() => setShowEditRoleModal(false)} title="Edit Role" size="md">
      <form onSubmit={handleEditRoleSubmit}>
        <Input 
          label="Role Name" 
          value={editRole.name} 
          onChange={(e) => setEditRole(prev => ({ ...prev, name: e.target.value }))} 
          placeholder="Enter role name" 
          required 
        />
        <Select 
          label="Status" 
          value={editRole.status} 
          onChange={(e) => setEditRole(prev => ({ ...prev, status: e.target.value }))} 
          options={['Active', 'Inactive']} 
          className="mt-4" 
        />
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => setShowEditRoleModal(false)}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={isSubmitting} loading={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );

  const DeleteRoleModal = () => (
    <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Role" size="sm" showCloseButton={false}>
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-full bg-red-100">
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M6 7h12M9 7v12m6-12v12M5 7l1-3h12l1 3" /></svg>
        </div>
        <p className="text-sm text-gray-500 mb-6">Are you sure you want to delete <span className="font-medium">{roleToDelete}</span>?</p>
        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDeleteRole} disabled={isSubmitting} loading={isSubmitting}>
            {isSubmitting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </Modal>
  );

  return (
    <>
      <Card>
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Total Roles: {roles.length}</h2>
              <p className="text-sm text-gray-500 mt-1">Manage user roles and permissions</p>
            </div>
            <Button variant="primary" onClick={() => setShowNewRoleModal(true)} className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              New Role
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <TableHeader>Role</TableHeader>
                <TableHeader>Created Date</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Actions</TableHeader>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {roles.map((role, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="whitespace-nowrap"><div className="text-sm font-medium text-gray-900">{role.name}</div></TableCell>
                  <TableCell className="whitespace-nowrap"><div className="text-sm text-gray-500">{role.createdDate}</div></TableCell>
                  <TableCell className="whitespace-nowrap"><Badge variant={role.status === 'Active' ? 'success' : 'danger'}>{role.status}</Badge></TableCell>
                  <TableCell className="whitespace-nowrap"><RoleDropdown role={role} /></TableCell>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <NewRoleModal />
      <EditRoleModal />
      <DeleteRoleModal />
    </>
  );
};

export default UserPermissions;