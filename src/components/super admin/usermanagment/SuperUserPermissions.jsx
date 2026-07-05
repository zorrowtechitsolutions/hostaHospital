// src/components/super admin/usermanagment/SuperUserPermissions.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, Edit, Trash2, Search, Plus, Key, X } from 'lucide-react';
import { Card, Button, Badge, Pagination, Table, TableHead, TableBody, TableRow, TableHeader, TableCell, SearchBar, Modal } from '../../ui';
import { 
  useGetPermissionsQuery, 
  useDeletePermissionMutation,
  useCreatePermissionMutation,
  useUpdatePermissionMutation
} from '../../../../app/service/permission';
import { showSuccessToast, showErrorToast } from '../../ui/Toast';
import { socket } from '../../../socket/socket';
import { registerPermissionEvents, unregisterPermissionEvents } from '../../../socket/permissionEvents';

const SuperUserPermissions = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    module: '',
    action: ''
  });
  const itemsPerPage = 10;

  const [eventsRegistered, setEventsRegistered] = useState(false);

  const { data: permissionsData, isLoading, refetch } = useGetPermissionsQuery();
  const [deletePermission] = useDeletePermissionMutation();
  const [createPermission] = useCreatePermissionMutation();
  const [updatePermission] = useUpdatePermissionMutation();

  const permissions = permissionsData?.data || [];

  // Register socket event listeners
  useEffect(() => {
    registerPermissionEvents({
      onPermissionRegistered: () => {
        showSuccessToast(`New permission created!`, 3000);
        refetch();
      },
      onPermissionUpdated: () => {
        showSuccessToast(`Permission updated!`, 3000);
        refetch();
      },
      onPermissionDeleted: () => {
        showSuccessToast(`Permission deleted!`, 3000);
        refetch();
      }
    });

    setEventsRegistered(true);

    return () => {
      unregisterPermissionEvents();
      setEventsRegistered(false);
    };
  }, [refetch]);

  // Listen for socket connection
  useEffect(() => {
    const handleConnect = () => {
      if (!eventsRegistered) {
        registerPermissionEvents({
          onPermissionRegistered: () => {
            showSuccessToast(`New permission created!`, 3000);
            refetch();
          },
          onPermissionUpdated: () => {
            showSuccessToast(`Permission updated!`, 3000);
            refetch();
          },
          onPermissionDeleted: () => {
            showSuccessToast(`Permission deleted!`, 3000);
            refetch();
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

  const filteredPermissions = permissions.filter(permission => 
    permission.module?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.action?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedPermissions = filteredPermissions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredPermissions.length / itemsPerPage);

  const handleDelete = async (permission) => {
    if (window.confirm(`Are you sure you want to delete permission "${permission.module} - ${permission.action}"?`)) {
      try { 
        await deletePermission(permission.id).unwrap(); 
        
        socket.emit("permission_event", {
          event: "PERMISSION_DELETED",
          data: {
            permissionId: permission.id,
            module: permission.module,
            action: permission.action,
            timestamp: new Date().toISOString()
          }
        });
        
        showSuccessToast(`Permission deleted successfully`); 
        refetch(); 
      } 
      catch (error) { 
        showErrorToast(error?.data?.message || 'Failed to delete permission'); 
      }
    }
  };

  const handleAddPermission = () => {
    setFormData({
      module: '',
      action: ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await createPermission(formData).unwrap();
      
      socket.emit("permission_event", {
        event: "PERMISSION_REGISTERED",
        data: {
          permissionId: result.data?.id || result.id,
          module: formData.module,
          action: formData.action,
          timestamp: new Date().toISOString()
        }
      });
      
      showSuccessToast('Permission created successfully');
      setIsModalOpen(false);
      refetch();
    } catch (error) {
      showErrorToast(error?.data?.message || 'Failed to create permission');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getActionBadgeVariant = (action) => {
    const actionMap = {
      'create': 'success',
      'edit': 'warning',
      'update': 'warning',
      'delete': 'danger',
      'view': 'info',
      'read': 'info'
    };
    return actionMap[action?.toLowerCase()] || 'secondary';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Super User Permissions</h1>
          <p className="text-sm text-gray-500 mt-1">Manage system permissions</p>
          <div className="mt-2">
            <span className="text-sm text-gray-500">
              Total Permissions: <span className="font-semibold text-gray-700">{permissions.length}</span>
            </span>
          </div>
        </div>

        <div className="mb-4 flex justify-between items-center flex-wrap gap-3">
          <div>
            <span className="text-xs text-gray-400">
              Last updated: {new Date().toLocaleDateString()}
            </span>
          </div>
          <Button
            variant="primary"
            onClick={handleAddPermission}
            className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Plus size={16} />
            Add Permission
          </Button>
        </div>

        <SearchBar 
          placeholder="Search permissions by module or action..." 
          value={searchTerm} 
          onChange={setSearchTerm} 
          className="mb-5 w-96" 
        />

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Module</TableHeader>
                  <TableHeader>Action</TableHeader>
                  <TableHeader className="text-center">Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedPermissions.length > 0 ? (
                  paginatedPermissions.map((permission) => (
                    <TableRow key={permission.id} className="hover:bg-gray-50 transition">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Key className="w-5 h-5 text-purple-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-800 capitalize">
                            {permission.module}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeVariant(permission.action)}>
                          {permission.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleDelete(permission)} 
                            className="p-1.5 rounded text-red-600 hover:bg-red-50 transition"
                            title="Delete permission"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan="3" className="px-6 py-12 text-center text-gray-500">
                      {searchTerm ? `No permissions found matching "${searchTerm}"` : 'No permissions available'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {totalPages > 1 && (
          <div className="mt-6">
            <Pagination 
              currentPage={currentPage} 
              totalPages={totalPages} 
              onPageChange={setCurrentPage} 
              totalItems={filteredPermissions.length} 
              itemsPerPage={itemsPerPage} 
              itemLabel="permissions" 
            />
          </div>
        )}

        {/* Add Permission Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Add New Permission"
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Module <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="module"
                value={formData.module}
                onChange={handleInputChange}
                placeholder="e.g., users, products, orders"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Action <span className="text-red-500">*</span>
              </label>
              <select
                name="action"
                value={formData.action}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select action</option>
                <option value="create">Create</option>
                <option value="read">Read</option>
                <option value="view">View</option>
                <option value="update">Update</option>
                <option value="edit">Edit</option>
                <option value="delete">Delete</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Create Permission
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};

export default SuperUserPermissions;