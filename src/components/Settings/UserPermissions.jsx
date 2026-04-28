import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const UserPermissions = () => {

const navigate = useNavigate();

  // State for roles data
  const [roles, setRoles] = useState([
    { name: 'Owner', createdDate: '22 Jun 2025', status: 'Active' },
    { name: 'Admin', createdDate: '17 Jun 2025', status: 'Active' },
    { name: 'Patient', createdDate: '10 Jun 2025', status: 'Inactive' },
    { name: 'Doctor', createdDate: '22 May 2025', status: 'Active' },
    { name: 'Nurse', createdDate: '15 May 2025', status: 'Inactive' },
    { name: 'Supervisor', createdDate: '30 Apr 2025', status: 'Active' },
    { name: 'Pharmacist', createdDate: '15 Jan 2025', status: 'Inactive' },
  ]);

  // State for modals
  const [showNewRoleModal, setShowNewRoleModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [newRole, setNewRole] = useState({ name: '', status: 'Active' });
  const [editRole, setEditRole] = useState({ name: '', status: 'Active', originalName: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
const [roleToDelete, setRoleToDelete] = useState(null);
  
  // 3-dots dropdown menu state
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRefs = useRef({});

  // Permissions state for each role
  const [rolePermissions, setRolePermissions] = useState({
    Owner: ['all_access', 'manage_users', 'manage_roles', 'view_reports', 'edit_settings'],
    Admin: ['manage_users', 'view_reports', 'edit_settings'],
    Doctor: ['view_patients', 'create_appointments', 'view_reports'],
    Patient: ['view_profile', 'book_appointment'],
    Nurse: ['view_patients', 'update_records'],
    Supervisor: ['view_reports', 'approve_requests', 'manage_staff'],
    Pharmacist: ['view_inventory', 'manage_medicines'],
  });

  // Available permissions list
  const availablePermissions = [
    { id: 'all_access', label: 'All Access', description: 'Full system access' },
    { id: 'manage_users', label: 'Manage Users', description: 'Create, edit, delete users' },
    { id: 'manage_roles', label: 'Manage Roles', description: 'Create and edit roles' },
    { id: 'view_reports', label: 'View Reports', description: 'Access all reports' },
    { id: 'edit_settings', label: 'Edit Settings', description: 'Modify system settings' },
    { id: 'view_patients', label: 'View Patients', description: 'See patient information' },
    { id: 'create_appointments', label: 'Create Appointments', description: 'Schedule appointments' },
    { id: 'view_profile', label: 'View Profile', description: 'View own profile' },
    { id: 'book_appointment', label: 'Book Appointment', description: 'Book medical appointments' },
    { id: 'update_records', label: 'Update Records', description: 'Modify patient records' },
    { id: 'approve_requests', label: 'Approve Requests', description: 'Approve pending requests' },
    { id: 'manage_staff', label: 'Manage Staff', description: 'Manage staff members' },
    { id: 'view_inventory', label: 'View Inventory', description: 'See pharmacy inventory' },
    { id: 'manage_medicines', label: 'Manage Medicines', description: 'Add/edit medicines' },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown !== null) {
        const dropdownElement = dropdownRefs.current[openDropdown];
        if (dropdownElement && !dropdownElement.contains(event.target)) {
          setOpenDropdown(null);
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  const handleNewRoleSubmit = useCallback((e) => {
    e.preventDefault();
    if (newRole.name.trim()) {
      const now = new Date();
      const formattedDate = now.toLocaleString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      setRoles(prev => [
        ...prev,
        {
          name: newRole.name,
          createdDate: formattedDate,
          status: newRole.status
        }
      ]);
      setRolePermissions(prev => ({
        ...prev,
        [newRole.name]: []
      }));
      setNewRole({ name: '', status: 'Active' });
      setShowNewRoleModal(false);
      alert(`New role "${newRole.name}" created successfully!`);
    }
  }, [newRole]);

  const handleEditRoleSubmit = useCallback((e) => {
    e.preventDefault();
    if (editRole.name.trim()) {
      setRoles(prev => prev.map(role => 
        role.name === editRole.originalName 
          ? { ...role, name: editRole.name, status: editRole.status }
          : role
      ));
      // Update permissions key if name changed
      if (editRole.name !== editRole.originalName) {
        setRolePermissions(prev => {
          const newPermissions = { ...prev };
          newPermissions[editRole.name] = newPermissions[editRole.originalName];
          delete newPermissions[editRole.originalName];
          return newPermissions;
        });
      } else {
        setRoles(prev => prev.map(role => 
          role.name === editRole.originalName 
            ? { ...role, status: editRole.status }
            : role
        ));
      }
      setShowEditRoleModal(false);
      setSelectedRole(null);
      setOpenDropdown(null);
      alert(`Role "${editRole.name}" updated successfully!`);
    }
  }, [editRole]);

const handleDeleteRole = () => {
  setRoles(prev => prev.filter(r => r.name !== roleToDelete));

  setRolePermissions(prev => {
    const newPermissions = { ...prev };
    delete newPermissions[roleToDelete];
    return newPermissions;
  });

  setShowDeleteModal(false);
  setRoleToDelete(null);
};

const handleOpenEditModal = useCallback((role) => {
    setSelectedRole(role);
    setEditRole({
      name: role.name,
      status: role.status,
      originalName: role.name
    });
    setShowEditRoleModal(true);
    setOpenDropdown(null);
  }, []);

const handleOpenPermissionsPage = (role) => {
navigate(`/permissions/${role.name}`, {
  state: { from: "User Permissions" }
});
  setOpenDropdown(null);
};


  const handlePermissionToggle = useCallback((permissionId) => {
    if (!selectedRole) return;
    setRolePermissions(prev => {
      const currentPermissions = prev[selectedRole.name] || [];
      if (currentPermissions.includes(permissionId)) {
        return {
          ...prev,
          [selectedRole.name]: currentPermissions.filter(p => p !== permissionId)
        };
      } else {
        return {
          ...prev,
          [selectedRole.name]: [...currentPermissions, permissionId]
        };
      }
    });
  }, [selectedRole]);

  const handleSavePermissions = useCallback(() => {
    setShowPermissionsModal(false);
    alert(`Permissions for "${selectedRole?.name}" updated successfully!`);
  }, [selectedRole]);

  const handleNewRoleNameChange = useCallback((e) => {
    setNewRole(prev => ({ ...prev, name: e.target.value }));
  }, []);

  const handleNewRoleStatusChange = useCallback((e) => {
    setNewRole(prev => ({ ...prev, status: e.target.value }));
  }, []);

  const handleEditRoleNameChange = useCallback((e) => {
    setEditRole(prev => ({ ...prev, name: e.target.value }));
  }, []);

  const handleEditRoleStatusChange = useCallback((e) => {
    setEditRole(prev => ({ ...prev, status: e.target.value }));
  }, []);

  const handleOpenModal = useCallback(() => {
    setNewRole({ name: '', status: 'Active' });
    setShowNewRoleModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowNewRoleModal(false);
    setShowEditRoleModal(false);
    setShowPermissionsModal(false);
    setNewRole({ name: '', status: 'Active' });
    setEditRole({ name: '', status: 'Active', originalName: '' });
    setSelectedRole(null);
  }, []);

  const toggleDropdown = useCallback((roleId) => {
    setOpenDropdown(openDropdown === roleId ? null : roleId);
  }, [openDropdown]);

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Total Roles: {roles.length}</h2>
              <p className="text-sm text-gray-500 mt-1">Manage user roles and permissions</p>
            </div>
            <button
              onClick={handleOpenModal}
              className="px-4 py-2 bg-[#1C62A0] hover:bg-[#1C62A0]/90 text-white font-medium rounded-lg transition-colors shadow-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Role
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {roles.map((role, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{role.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{role.createdDate}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      role.status === 'Active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {role.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="relative" ref={el => dropdownRefs.current[role.name] = el}>
                      <button
                        onClick={() => toggleDropdown(role.name)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none"
                      >
                        <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                      
                      {openDropdown === role.name && (
                        <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 animate-fadeIn">
                          <button
                            onClick={() => handleOpenEditModal(role)}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                          <button
                            onClick={() => {
  setRoleToDelete(role.name);
  setShowDeleteModal(true);
}}

                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                          <button
                            onClick={() => handleOpenPermissionsPage(role)}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 border-t border-gray-100 mt-1 pt-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Permissions
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Role Modal */}
      {showNewRoleModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleCloseModal} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="px-6 pt-5 pb-4">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Create New Role</h2>
                <p className="text-sm text-gray-500 mb-6">Add a new role to the system</p>
                
                <form onSubmit={handleNewRoleSubmit}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newRole.name}
                      onChange={handleNewRoleNameChange}
                      placeholder="Enter role name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#1C62A0] focus:border-[#1C62A0] outline-none"
                      required
                      autoFocus
                    />
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Default Status
                    </label>
                    <select
                      value={newRole.status}
                      onChange={handleNewRoleStatusChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#1C62A0] focus:border-[#1C62A0] outline-none"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-white bg-[#1C62A0] rounded-lg hover:bg-[#1C62A0]/90 transition"
                    >
                      Create Role
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {showEditRoleModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleCloseModal} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="px-6 pt-5 pb-4">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Edit Role</h2>
                <p className="text-sm text-gray-500 mb-6">Modify role details</p>
                
                <form onSubmit={handleEditRoleSubmit}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editRole.name}
                      onChange={handleEditRoleNameChange}
                      placeholder="Enter role name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#1C62A0] focus:border-[#1C62A0] outline-none"
                      required
                    />
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={editRole.status}
                      onChange={handleEditRoleStatusChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#1C62A0] focus:border-[#1C62A0] outline-none"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-white bg-[#1C62A0] rounded-lg hover:bg-[#1C62A0]/90 transition"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center">

    {/* BACKDROP */}
    <div
      className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      onClick={() => setShowDeleteModal(false)}
    />

    {/* MODAL */}
    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 text-center">

      <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-full bg-red-100">
        <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeWidth="2" d="M6 7h12M9 7v12m6-12v12M5 7l1-3h12l1 3" />
        </svg>
      </div>

      <h2 className="text-lg font-semibold text-gray-800 mb-2">
        Delete Role
      </h2>

      <p className="text-sm text-gray-500 mb-6">
        Are you sure you want to delete{" "}
        <span className="font-medium">{roleToDelete}</span>?
      </p>

      <div className="flex justify-center gap-3">
        <button
          onClick={() => setShowDeleteModal(false)}
          className="px-4 py-2 hover:bg-gray-50 rounded-lg text-gray-600"
        >
          Cancel
        </button>

        <button
          onClick={handleDeleteRole}
          className="px-4 py-2 bg-red-500 text-white rounded-lg"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
)}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.15s ease-out;
        }
      `}</style>
    </>
  );
};

export default UserPermissions;