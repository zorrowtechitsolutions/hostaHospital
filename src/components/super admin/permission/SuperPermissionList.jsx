// src/components/super admin/permission/SuperPermissionList.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Card, Modal, Input, Alert, SearchBar } from "../../ui";
import { showSuccessToast, showErrorToast, showWarningToast } from "../../ui/Toast";
import { 
  useCreateRolePermissionMutation, 
  useGetRolePermissionsQuery 
} from "../../../../app/service/rolePermission";
import { 
  useGetPermissionsQuery,
  useCreatePermissionMutation,
  useUpdatePermissionMutation,
  useDeletePermissionMutation
} from "../../../../app/service/permission";
import { Plus, Edit, Trash2, Eye, RefreshCw, Search, X } from 'lucide-react';

// ✅ Import socket
import { socket } from '../../../socket/socket';
// ✅ Import socket event listeners
import { registerPermissionEvents, unregisterPermissionEvents } from '../../../socket/permissionEvents';
import { registerRolePermissionEvents, unregisterRolePermissionEvents } from '../../../socket/rolePermissionEvents';

const SuperPermissionList = () => {
  const { roleId } = useParams();
  const navigate = useNavigate();
  
  // Main state
  const [mainModules, setMainModules] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Permission management modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState(null);
  
  // Permission form state
  const [formData, setFormData] = useState({
    module: '',
    action: '',
    description: ''
  });
  const [formErrors, setFormErrors] = useState({});

  // ✅ Track if events are registered
  const [eventsRegistered, setEventsRegistered] = useState(false);

  // API Hooks
  const [createRolePermission] = useCreateRolePermissionMutation();
  const { data: permissionsData, isLoading: isLoadingPermissions, refetch: refetchPermissions } = useGetPermissionsQuery();
  const { data: permissionData, refetch: refetchRolePermissions } = useGetRolePermissionsQuery({ roleId });
  
  // Permission CRUD hooks
  const [createPermission, { isLoading: isCreating }] = useCreatePermissionMutation();
  const [updatePermission, { isLoading: isUpdating }] = useUpdatePermissionMutation();
  const [deletePermission, { isLoading: isDeleting }] = useDeletePermissionMutation();

  const ACTIONS = ['create', 'edit', 'delete', 'view', 'manage'];

  // ✅ Register socket event listeners for permission events
  useEffect(() => {
    console.log("🔄 Registering permission event listeners for Super Permission...");
    console.log("📡 Socket connected:", socket.connected);
    
    // Register permission events
    registerPermissionEvents({
      onPermissionRegistered: (data) => {
        console.log("🔑 NEW PERMISSION REGISTERED:", data);
        showSuccessToast(`New permission "${data.module || 'Permission'}" created!`, 3000);
        refetchPermissions();
      },
      
      onPermissionUpdated: (data) => {
        console.log("✏️ PERMISSION UPDATED:", data);
        showSuccessToast(`Permission "${data.module || 'Permission'}" updated!`, 3000);
        refetchPermissions();
      },
      
      onPermissionDeleted: (data) => {
        console.log("🗑️ PERMISSION DELETED:", data);
        showSuccessToast(`Permission deleted!`, 3000);
        refetchPermissions();
      }
    });

    // Register role permission events
    registerRolePermissionEvents({
      onRolePermissionUpdated: (data) => {
        console.log("🔐 ROLE PERMISSION UPDATED:", data);
        showSuccessToast(`Role permissions updated!`, 3000);
        refetchRolePermissions();
        // Also refetch permissions to get latest data
        refetchPermissions();
      }
    });

    setEventsRegistered(true);

    return () => {
      console.log("🧹 Unregistering permission events for Super Permission...");
      unregisterPermissionEvents();
      unregisterRolePermissionEvents();
      setEventsRegistered(false);
    };
  }, [refetchPermissions, refetchRolePermissions]);

  // ✅ Listen for socket connection/disconnection
  useEffect(() => {
    const handleConnect = () => {
      console.log("✅ Socket CONNECTED - Permission events will work!");
      if (!eventsRegistered) {
        registerPermissionEvents({
          onPermissionRegistered: (data) => {
            console.log("🔑 NEW PERMISSION REGISTERED (reconnect):", data);
            showSuccessToast(`New permission created!`, 3000);
            refetchPermissions();
          },
          onPermissionUpdated: (data) => {
            console.log("✏️ PERMISSION UPDATED (reconnect):", data);
            showSuccessToast(`Permission updated!`, 3000);
            refetchPermissions();
          },
          onPermissionDeleted: (data) => {
            console.log("🗑️ PERMISSION DELETED (reconnect):", data);
            showSuccessToast(`Permission deleted!`, 3000);
            refetchPermissions();
          }
        });
        registerRolePermissionEvents({
          onRolePermissionUpdated: (data) => {
            console.log("🔐 ROLE PERMISSION UPDATED (reconnect):", data);
            showSuccessToast(`Role permissions updated!`, 3000);
            refetchRolePermissions();
            refetchPermissions();
          }
        });
        setEventsRegistered(true);
      }
    };

    const handleDisconnect = () => {
      console.log("❌ Socket DISCONNECTED - Permission events won't work!");
      setEventsRegistered(false);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [refetchPermissions, refetchRolePermissions, eventsRegistered]);

  // ✅ Log all socket events for debugging
  useEffect(() => {
    const handleAnyEvent = (event, ...args) => {
      console.log(`📡 ALL SOCKET EVENTS - PERMISSION/SUPER: ${event}:`, args);
    };

    socket.onAny(handleAnyEvent);

    return () => {
      socket.offAny(handleAnyEvent);
    };
  }, []);

  // Build modules from permissions
  useEffect(() => {
    if (!permissionsData?.data?.length) return;
    
    const modulesMap = new Map();
    permissionsData.data.forEach((permission) => {
      const moduleName = permission.module;
      const action = permission.action;
      if (!moduleName || !action) return;
      
      if (!modulesMap.has(moduleName)) {
        modulesMap.set(moduleName, {
          id: moduleName,
          name: moduleName.charAt(0).toUpperCase() + moduleName.slice(1),
          createId: null, 
          editId: null, 
          deleteId: null, 
          viewId: null,
          create: false, 
          edit: false, 
          delete: false, 
          view: false,
          permissions: []
        });
      }
      
      const module = modulesMap.get(moduleName);
      module.permissions.push(permission);
      
      switch (action.toLowerCase()) {
        case "create": module.createId = permission.id; break;
        case "edit": module.editId = permission.id; break;
        case "delete": module.deleteId = permission.id; break;
        case "view": module.viewId = permission.id; break;
        default: break;
      }
    });
    
    setMainModules(Array.from(modulesMap.values()));
  }, [permissionsData]);

  // Apply assigned permissions
  useEffect(() => {
    if (permissionData?.data && mainModules.length > 0) {
      const assignedIds = permissionData.data.map(item => Number(item.permissionId));
      setMainModules(prev => prev.map(module => ({
        ...module,
        create: module.createId ? assignedIds.includes(Number(module.createId)) : false,
        edit: module.editId ? assignedIds.includes(Number(module.editId)) : false,
        delete: module.deleteId ? assignedIds.includes(Number(module.deleteId)) : false,
        view: module.viewId ? assignedIds.includes(Number(module.viewId)) : false,
      })));
    }
  }, [permissionData, mainModules.length]);

  // Filter modules
  const filteredModules = mainModules.filter(module => 
    module.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Toggle permission
  const togglePermission = (moduleIndex, permissionType) => {
    setMainModules(prev => prev.map((mod, mi) => 
      mi === moduleIndex ? { ...mod, [permissionType]: !mod[permissionType] } : mod
    ));
  };

  // Toggle allow all
  const toggleAllowAll = (moduleIndex) => {
    setMainModules(prev => prev.map((mod, mi) => {
      if (mi === moduleIndex) {
        const allChecked = mod.create && mod.edit && mod.delete && mod.view;
        return { 
          ...mod, 
          create: !allChecked, 
          edit: !allChecked, 
          delete: !allChecked, 
          view: !allChecked 
        };
      }
      return mod;
    }));
  };

  // Check if all permissions are checked
  const isAllChecked = (module) => module.create && module.edit && module.delete && module.view;

  // Save role permissions
  const handleSave = async () => {
    setIsSaving(true);
    const permissionIds = mainModules.flatMap(mod => {
      const ids = [];
      if (mod.create && mod.createId) ids.push(mod.createId);
      if (mod.edit && mod.editId) ids.push(mod.editId);
      if (mod.delete && mod.deleteId) ids.push(mod.deleteId);
      if (mod.view && mod.viewId) ids.push(mod.viewId);
      return ids;
    });
    
    try {
      await createRolePermission({ roleId: Number(roleId), permissionIds }).unwrap();
      
      // ✅ Emit socket event for role permission updated
      socket.emit("role_permission_event", {
        event: "ROLEPERMISSION_UPDATED",
        data: {
          roleId: Number(roleId),
          permissionIds: permissionIds,
          count: permissionIds.length,
          timestamp: new Date().toISOString()
        }
      });
      
      showSuccessToast("Permissions saved successfully!");
      refetchRolePermissions();
    } catch (error) {
      showErrorToast(error?.data?.message || "Failed to save permissions");
    } finally {
      setIsSaving(false);
    }
  };

  // ============ PERMISSION CRUD OPERATIONS ============

  // Reset form
  const resetForm = () => {
    setFormData({ module: '', action: '', description: '' });
    setFormErrors({});
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!formData.module.trim()) errors.module = 'Module is required';
    if (!formData.action.trim()) errors.action = 'Action is required';
    if (!formData.description.trim()) errors.description = 'Description is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Create Permission
  const handleCreatePermission = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const result = await createPermission(formData).unwrap();
      
      // ✅ Emit socket event for permission registered
      socket.emit("permission_event", {
        event: "PERMISSION_REGISTERED",
        data: {
          permissionId: result.data?.id || result.id,
          module: formData.module,
          action: formData.action,
          description: formData.description,
          timestamp: new Date().toISOString()
        }
      });
      
      showSuccessToast(`Permission created successfully!`, 4000);
      setShowCreateModal(false);
      resetForm();
      refetchPermissions();
    } catch (error) {
      console.error('Create error:', error);
      showErrorToast(error?.data?.message || 'Failed to create permission', 4000);
    }
  };

  // Update Permission
  const handleUpdatePermission = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await updatePermission({
        id: selectedPermission.id,
        ...formData
      }).unwrap();
      
      // ✅ Emit socket event for permission updated
      socket.emit("permission_event", {
        event: "PERMISSION_UPDATED",
        data: {
          permissionId: selectedPermission.id,
          module: formData.module,
          action: formData.action,
          description: formData.description,
          timestamp: new Date().toISOString()
        }
      });
      
      showSuccessToast(`Permission updated successfully!`, 4000);
      setShowEditModal(false);
      setSelectedPermission(null);
      resetForm();
      refetchPermissions();
    } catch (error) {
      console.error('Update error:', error);
      showErrorToast(error?.data?.message || 'Failed to update permission', 4000);
    }
  };

  // Delete Permission
  const handleDeletePermission = async () => {
    if (!selectedPermission) return;

    try {
      await deletePermission(selectedPermission.id).unwrap();
      
      // ✅ Emit socket event for permission deleted
      socket.emit("permission_event", {
        event: "PERMISSION_DELETED",
        data: {
          permissionId: selectedPermission.id,
          module: selectedPermission.module,
          action: selectedPermission.action,
          timestamp: new Date().toISOString()
        }
      });
      
      showSuccessToast(`Permission deleted successfully!`, 4000);
      setShowDeleteModal(false);
      setSelectedPermission(null);
      refetchPermissions();
    } catch (error) {
      console.error('Delete error:', error);
      showErrorToast(error?.data?.message || 'Failed to delete permission', 4000);
    }
  };

  // Open edit modal
  const openEditModal = (permission) => {
    setSelectedPermission(permission);
    setFormData({
      module: permission.module || '',
      action: permission.action || '',
      description: permission.description || ''
    });
    setShowEditModal(true);
  };

  // Open delete modal
  const openDeleteModal = (permission) => {
    setSelectedPermission(permission);
    setShowDeleteModal(true);
  };

  // Open view modal
  const openViewModal = (permission) => {
    setSelectedPermission(permission);
    setShowViewModal(true);
  };

  // ============ MODALS ============

  // Create Permission Modal
  const CreateModal = () => (
    <Modal isOpen={showCreateModal} onClose={() => { setShowCreateModal(false); resetForm(); }} title="Create New Permission" size="md">
      <form onSubmit={handleCreatePermission}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Module *</label>
            <input
              type="text"
              name="module"
              value={formData.module}
              onChange={handleInputChange}
              placeholder="e.g., users, patients, appointments"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#1C62A0] ${
                formErrors.module ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {formErrors.module && <p className="mt-1 text-sm text-red-500">{formErrors.module}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Action *</label>
            <select
              name="action"
              value={formData.action}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#1C62A0] ${
                formErrors.action ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select action</option>
              {ACTIONS.map(action => (
                <option key={action} value={action}>
                  {action.charAt(0).toUpperCase() + action.slice(1)}
                </option>
              ))}
            </select>
            {formErrors.action && <p className="mt-1 text-sm text-red-500">{formErrors.action}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe what this permission allows"
              rows="3"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#1C62A0] resize-none ${
                formErrors.description ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {formErrors.description && <p className="mt-1 text-sm text-red-500">{formErrors.description}</p>}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => { setShowCreateModal(false); resetForm(); }}>Cancel</Button>
          <Button 
            type="submit" 
            variant="primary"
            disabled={isCreating}
            loading={isCreating}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {isCreating ? 'Creating...' : 'Create Permission'}
          </Button>
        </div>
      </form>
    </Modal>
  );

  // Edit Permission Modal
  const EditModal = () => (
    <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelectedPermission(null); resetForm(); }} title="Edit Permission" size="md">
      <form onSubmit={handleUpdatePermission}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Module *</label>
            <input
              type="text"
              name="module"
              value={formData.module}
              onChange={handleInputChange}
              placeholder="e.g., users, patients, appointments"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#1C62A0] ${
                formErrors.module ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {formErrors.module && <p className="mt-1 text-sm text-red-500">{formErrors.module}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Action *</label>
            <select
              name="action"
              value={formData.action}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#1C62A0] ${
                formErrors.action ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select action</option>
              {ACTIONS.map(action => (
                <option key={action} value={action}>
                  {action.charAt(0).toUpperCase() + action.slice(1)}
                </option>
              ))}
            </select>
            {formErrors.action && <p className="mt-1 text-sm text-red-500">{formErrors.action}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe what this permission allows"
              rows="3"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#1C62A0] resize-none ${
                formErrors.description ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {formErrors.description && <p className="mt-1 text-sm text-red-500">{formErrors.description}</p>}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => { setShowEditModal(false); setSelectedPermission(null); resetForm(); }}>Cancel</Button>
          <Button 
            type="submit" 
            variant="primary"
            disabled={isUpdating}
            loading={isUpdating}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {isUpdating ? 'Updating...' : 'Update Permission'}
          </Button>
        </div>
      </form>
    </Modal>
  );

  // Delete Permission Modal
  const DeleteModal = () => (
    <Modal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setSelectedPermission(null); }} title="Delete Permission" size="md">
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-semibold text-red-800 mb-2 text-sm">⚠️ Warning: Delete Permission</h3>
          <p className="text-sm text-red-700">
            Are you sure you want to delete this permission? This action cannot be undone.
          </p>
          {selectedPermission && (
            <div className="mt-3 p-3 bg-white rounded-md border border-red-100">
              <p className="text-sm font-medium text-gray-800">
                Module: <span className="font-normal">{selectedPermission.module}</span>
              </p>
              <p className="text-sm font-medium text-gray-800">
                Action: <span className="font-normal">{selectedPermission.action}</span>
              </p>
              <p className="text-sm font-medium text-gray-800">
                Description: <span className="font-normal">{selectedPermission.description}</span>
              </p>
            </div>
          )}
        </div>

        <Alert 
          type="error" 
          message="Deleting this permission will remove it from all roles that have it assigned." 
          className="mb-2"
        />

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
          <Button variant="outline" onClick={() => { setShowDeleteModal(false); setSelectedPermission(null); }}>Cancel</Button>
          <Button
            onClick={handleDeletePermission}
            disabled={isDeleting}
            loading={isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {isDeleting ? 'Deleting...' : 'Delete Permission'}
          </Button>
        </div>
      </div>
    </Modal>
  );

  // View Permission Modal
  const ViewModal = () => (
    <Modal isOpen={showViewModal} onClose={() => { setShowViewModal(false); setSelectedPermission(null); }} title="Permission Details" size="md">
      {selectedPermission && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500">Permission ID</label>
              <p className="text-sm font-semibold text-gray-800">#{selectedPermission.id}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500">Module</label>
              <p className="text-sm font-semibold text-gray-800">{selectedPermission.module}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500">Action</label>
              <p className="text-sm font-semibold text-gray-800">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  selectedPermission.action === 'create' ? 'bg-green-100 text-green-700' :
                  selectedPermission.action === 'edit' ? 'bg-blue-100 text-blue-700' :
                  selectedPermission.action === 'delete' ? 'bg-red-100 text-red-700' :
                  selectedPermission.action === 'view' ? 'bg-purple-100 text-purple-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {selectedPermission.action.charAt(0).toUpperCase() + selectedPermission.action.slice(1)}
                </span>
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500">Created At</label>
              <p className="text-sm text-gray-600">{selectedPermission.createdAt ? new Date(selectedPermission.createdAt).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Description</label>
            <p className="text-sm text-gray-700 mt-1">{selectedPermission.description}</p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => { setShowViewModal(false); setSelectedPermission(null); }}>Close</Button>
            <Button 
              variant="primary"
              onClick={() => { setShowViewModal(false); openEditModal(selectedPermission); }}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
            >
              Edit Permission
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );

  // Loading state
  if (isLoadingPermissions) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button 
            onClick={() => navigate('/super-admin/super-permissions')} 
            className="text-sm text-gray-600 hover:text-gray-900 mb-3 flex items-center gap-1"
          >
            ← Back to Permissions
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Role Permissions</h1>
          <p className="text-sm text-gray-500 mt-1">Configure permissions for Role ID: {roleId}</p>
        </div>

        {/* Search and Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search modules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1C62A0]"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => refetchPermissions()}
              className="flex items-center gap-2"
            >
              <RefreshCw size={16} /> Refresh
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
            >
              <Plus size={16} /> Create Permission
            </Button>
          </div>
        </div>

        {/* Permissions Table with Checkboxes */}
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <TableHeader className="text-left">Module</TableHeader>
                  <TableHeader className="text-center">Create</TableHeader>
                  <TableHeader className="text-center">Edit</TableHeader>
                  <TableHeader className="text-center">Delete</TableHeader>
                  <TableHeader className="text-center">View</TableHeader>
                  <TableHeader className="text-center">Allow All</TableHeader>
                  <TableHeader className="text-center">Actions</TableHeader>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredModules.length > 0 ? (
                  filteredModules.map((module, mi) => (
                    <tr key={module.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell>
                        <span className="font-medium text-gray-800">{module.name}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <input 
                          type="checkbox" 
                          checked={module.create} 
                          onChange={() => togglePermission(mi, "create")}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          disabled={!module.createId}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <input 
                          type="checkbox" 
                          checked={module.edit} 
                          onChange={() => togglePermission(mi, "edit")}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          disabled={!module.editId}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <input 
                          type="checkbox" 
                          checked={module.delete} 
                          onChange={() => togglePermission(mi, "delete")}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          disabled={!module.deleteId}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <input 
                          type="checkbox" 
                          checked={module.view} 
                          onChange={() => togglePermission(mi, "view")}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          disabled={!module.viewId}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <input 
                          type="checkbox" 
                          checked={isAllChecked(module)} 
                          onChange={() => toggleAllowAll(mi)}
                          className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                          disabled={!module.createId && !module.editId && !module.deleteId && !module.viewId}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              const perm = module.permissions?.[0];
                              if (perm) openViewModal(perm);
                            }}
                            className="p-1 hover:bg-blue-100 rounded-full transition-colors text-blue-600"
                            title="View Details"
                            disabled={!module.permissions?.length}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => {
                              const perm = module.permissions?.[0];
                              if (perm) openEditModal(perm);
                            }}
                            className="p-1 hover:bg-yellow-100 rounded-full transition-colors text-yellow-600"
                            title="Edit Permission"
                            disabled={!module.permissions?.length}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => {
                              const perm = module.permissions?.[0];
                              if (perm) openDeleteModal(perm);
                            }}
                            className="p-1 hover:bg-red-100 rounded-full transition-colors text-red-600"
                            title="Delete Permission"
                            disabled={!module.permissions?.length}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </TableCell>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      {searchTerm ? `No modules found matching "${searchTerm}"` : 'No permissions found. Create your first permission!'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Footer */}
        <div className="mt-4 flex justify-between items-center">
          <span className="text-sm text-gray-500">
            Total Modules: <span className="font-semibold">{filteredModules.length}</span>
            {searchTerm && ` (filtered from ${mainModules.length})`}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate('/super-admin/super-permissions')}>Cancel</Button>
          <Button 
            variant="primary" 
            onClick={handleSave} 
            disabled={isSaving} 
            loading={isSaving}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {isSaving ? 'Saving...' : 'Save Permissions'}
          </Button>
        </div>
      </div>

      {/* Modals */}
      <CreateModal />
      <EditModal />
      <DeleteModal />
      <ViewModal />
    </div>
  );
};

export default SuperPermissionList;