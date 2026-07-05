// components/UsersList.jsx - Cards View with Recover Functionality
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useRecoverUserMutation,
} from '../../../../app/service/users';
import {
  Plus,
  RefreshCw,
  Upload,
  Users as UsersIcon,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  Building,
  CheckCircle,
  XCircle,
  Calendar,
  RotateCcw
} from 'lucide-react';

import {
  Button,
  Card,
  SearchBar,
  Modal,
} from '../../ui';

import DeleteModal from '../../patients/DeleteModel';

import { showSuccessToast, showErrorToast } from '../../ui/Toast';

import {
  Avatar,
  AvatarImage,
  AvatarFallback
} from "@/components/ui/avatar";

const UsersList = () => {
  const navigate = useNavigate();
  
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  
  // State for create/update form
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'user',
    roleId: '',
    hospitalId: '',
    isActive: true,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Get auth user from localStorage/session
  const [authUser, setAuthUser] = useState(null);
  
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('authUser') || 'null');
    setAuthUser(user);
  }, []);

  // Check if user is Super Admin
  const isSuperAdmin = authUser?.role === 'super_admin' || authUser?.roleId === 1;
  const isHospitalAdmin = authUser?.role === 'hospital' || authUser?.roleId === 2;

  // Build query params - No pagination, get all users
  const queryParams = {
    search_query: searchTerm?.trim() || undefined,
    limit: 1000, // Get all users
    includeDeleted: showDeleted,
  };

  // RTK Query hooks
  const { 
    data: usersData, 
    isLoading, 
    error, 
    refetch,
    isFetching,
  } = useGetUsersQuery(queryParams, {
    refetchOnMountOrArgChange: true,
  });

  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();
  const [recoverUser, { isLoading: isRecovering }] = useRecoverUserMutation();

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      role: 'user',
      roleId: '',
      hospitalId: '',
      isActive: true,
    });
    setIsEditing(false);
    setSelectedUser(null);
    setShowForm(false);
  };

  // Handle edit user
  const handleEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: '',
      phone: user.phone || '',
      role: user.role || 'user',
      roleId: user.roleId || '',
      hospitalId: user.hospitalId || '',
      isActive: user.isActive !== undefined ? user.isActive : true,
    });
    setIsEditing(true);
    setShowForm(true);
  };

  // Handle delete click
  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  // Handle recover user
  const handleRecoverUser = async (user) => {
    try {
      await recoverUser(user.id).unwrap();
      showSuccessToast(
        `${user.name} recovered successfully!`,
        2000
      );
      refetch();
    } catch (error) {
      showErrorToast(
        error?.data?.message ||
        "Failed to recover user",
        3000
      );
    }
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    
    try {
      await deleteUser(userToDelete.id).unwrap();
      showSuccessToast(`${userToDelete.name} has been deleted successfully!`, 2000);
      setShowDeleteModal(false);
      setUserToDelete(null);
      refetch();
    } catch (err) {
      console.error('Delete failed:', err);
      showErrorToast(err?.data?.message || 'Failed to delete user', 3000);
    }
  };

  // Handle form submit (create or update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (isEditing && selectedUser) {
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password;
        }
        
        await updateUser({ 
          id: selectedUser.id, 
          data: updateData 
        }).unwrap();
        showSuccessToast('User updated successfully!', 2000);
      } else {
        await createUser(formData).unwrap();
        showSuccessToast('User created successfully!', 2000);
      }
      
      resetForm();
      refetch();
    } catch (err) {
      console.error('Operation failed:', err);
      showErrorToast(err?.data?.message || err?.message || 'Something went wrong', 3000);
    }
  };

  const handleRefresh = () => {
    refetch();
    showSuccessToast("Refreshed user list", 2000);
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        showSuccessToast(`Successfully imported ${importedData.length} users!`, 3000);
        refetch();
      } catch {
        showErrorToast('Error parsing JSON file. Please make sure it\'s a valid JSON file.', 3000);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // View Details
  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  // User Details Modal
  const UserDetailsModal = ({ user, onClose }) => {
    if (!user) return null;
    
    return (
      <Modal isOpen={showDetailsModal} onClose={onClose} title="User Details" size="lg">
        <div className="flex items-center gap-4 mb-6">
          <Avatar className="w-16 h-16">
            <AvatarFallback className="text-xl font-medium bg-blue-100 text-blue-600">
              {user.name?.charAt(0)?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-800 text-lg">{user.name}</h3>
              <span className="text-xs text-gray-500">#{user.id}</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500">Email</label>
            <p className="text-sm text-gray-800">{user.email}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Phone</label>
            <p className="text-sm text-gray-800">{user.phone || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Role</label>
            <p className="text-sm text-gray-800">{user.role}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Hospital ID</label>
            <p className="text-sm text-gray-800">{user.hospitalId || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Status</label>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              user.isDelete 
                ? 'bg-gray-100 text-gray-700'
                : user.isActive 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {user.isDelete ? (
                <RotateCcw size={12} className="text-gray-500" />
              ) : user.isActive ? (
                <CheckCircle size={12} className="text-green-500" />
              ) : (
                <XCircle size={12} className="text-red-500" />
              )}
              {user.isDelete ? 'Blacklisted' : user.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Created At</label>
            <p className="text-sm text-gray-800">
              {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose} fullWidth>Close</Button>
          <Button variant="primary" onClick={() => { handleEdit(user); onClose(); }} fullWidth>
            Edit User
          </Button>
        </div>
      </Modal>
    );
  };

  // Row Action Menu - UPDATED: Only show Recover for deleted users
  const UserActionMenu = ({ user }) => {
    const [showMenu, setShowMenu] = useState(false);
    
    return (
      <div className="relative inline-block">
        <button 
          onClick={() => setShowMenu(prev => !prev)} 
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <MoreVertical size={18} className="text-gray-500" />
        </button>
        {showMenu && (
          <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            {/* For deleted users - show only Recover */}
            {user.isDelete ? (
              <button 
                onClick={() => { 
                  handleRecoverUser(user); 
                  setShowMenu(false); 
                }} 
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-green-600 hover:bg-gray-100 rounded-lg"
              >
                <RotateCcw size={16} /> Recover User
              </button>
            ) : (
              // For active users - show View, Edit, and Delete
              <>
                <button 
                  onClick={() => { 
                    handleViewDetails(user); 
                    setShowMenu(false); 
                  }} 
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg"
                >
                  <Eye size={16} /> View Details
                </button>
                <button 
                  onClick={() => { 
                    handleEdit(user); 
                    setShowMenu(false); 
                  }} 
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Edit size={16} /> Edit
                </button>
                <div className="border-t border-gray-100 my-1"></div>
                <button 
                  onClick={() => { 
                    handleDeleteClick(user); 
                    setShowMenu(false); 
                  }} 
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 rounded-b-lg"
                >
                  <Trash2 size={16} /> Delete
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  // Get users array
  const users = [...(usersData?.data || usersData?.users || [])]
    .sort(
      (a, b) =>
        new Date(a.createdAt) - new Date(b.createdAt)
    );
  const totalItems = users.length;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-6 font-sans">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-7 w-32 bg-gray-200 rounded animate-pulse mt-2"></div>
        </div>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="h-10 w-64 bg-gray-200 rounded-md animate-pulse"></div>
          <div className="flex gap-2">
            <div className="w-10 h-10 bg-gray-200 rounded-md animate-pulse"></div>
            <div className="w-10 h-10 bg-gray-200 rounded-md animate-pulse"></div>
            <div className="w-10 h-10 bg-gray-200 rounded-md animate-pulse"></div>
            <div className="w-28 h-10 bg-gray-200 rounded-md animate-pulse"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse min-h-[200px]">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-5 w-40 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 w-24 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-4 w-full bg-gray-200 rounded"></div>
                <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-6 font-sans">
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-semibold">Error loading users</p>
          <p>{error?.data?.message || error?.message || 'Unknown error'}</p>
          <button 
            onClick={refetch}
            className="mt-3 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#F8F9FA] p-6 font-sans">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="p-1">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Button>
            <div className="text-xs text-gray-500">
              <span className="text-gray-700">Users</span>
              <span className="mx-1 text-gray-400">»</span>
              <span>Home</span>
              <span className="mx-1 text-gray-400">»</span>
              <span>Users</span>
            </div>
          </div>
          <h1 className="text-xl font-bold text-gray-800">
            Users
            {isSuperAdmin && (
              <span className="ml-2 text-sm bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-medium">
                Super Admin View
              </span>
            )}
            {isHospitalAdmin && (
              <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                Hospital Admin View
              </span>
            )}
          </h1>
        </div>

        {/* Search and Action Buttons Row */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="flex-1 max-w-md">
            <SearchBar 
              placeholder="Search by name, email, or phone..." 
              value={searchTerm} 
              onChange={setSearchTerm} 
              onClear={() => setSearchTerm('')} 
            />
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <Button variant="outline" size="sm" onClick={handleRefresh} title="Refresh" disabled={isFetching}>
              <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
            </Button>
            
            <input type="file" onChange={handleImport} accept=".json" className="hidden" id="import-file" />
            <label htmlFor="import-file" className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50 cursor-pointer" title="Import">
              <Upload size={16} />
            </label>
            <Button 
              onClick={() => {
                resetForm();
                setShowForm(true);
              }} 
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Plus size={16} /> New User
            </Button>
          </div>
        </div>

        {/* Users Cards Grid */}
        {users.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-sm text-gray-500">Try adjusting your search</p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-500">
              Showing {totalItems} user{totalItems !== 1 ? 's' : ''}
              {showDeleted && <span className="ml-2 text-amber-600">(including deleted)</span>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
              {users.map((user) => (
                <Card
                  key={user.id}
                  className={`bg-white rounded-xl border ${
                    user.isDelete
                      ? 'border-gray-300 opacity-75'
                      : 'border-gray-200'
                  } shadow-sm overflow-hidden`}
                >
                  <div className="p-6">
                    {/* Header - Avatar and Action Menu */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-14 h-14">
                          <AvatarFallback className={`text-xl font-medium ${user.isDelete ? 'bg-gray-200 text-gray-500' : 'bg-blue-100 text-blue-600'}`}>
                            {user.name?.charAt(0)?.toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className={`font-semibold text-base truncate max-w-[180px] ${user.isDelete ? 'text-gray-500' : 'text-gray-800'}`}>
                            {user.name}
                          </h3>
                          <p className="text-xs text-gray-500">ID: #{user.id}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <UserActionMenu user={user} />
                      </div>
                    </div>

                    {/* User Details */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <Mail size={16} className="text-gray-400 flex-shrink-0" />
                        <span className={`truncate ${user.isDelete ? 'line-through text-gray-400' : ''}`}>{user.email}</span>
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <Phone size={16} className="text-gray-400 flex-shrink-0" />
                          <span className={user.isDelete ? 'line-through text-gray-400' : ''}>{user.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <Building size={16} className="text-gray-400 flex-shrink-0" />
                        <span className={`capitalize ${user.isDelete ? 'line-through text-gray-400' : ''}`}>{user.role || 'User'}</span>
                      </div>
                      {user.hospitalId && (
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <span className={`text-xs bg-gray-100 px-2.5 py-1 rounded-md ${user.isDelete ? 'text-gray-400' : ''}`}>
                            Hospital: {user.hospitalId}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Calendar size={14} />
                        <span>
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      {/* Status */}
                      <div className="flex items-center gap-1.5">
                        {user.isDelete ? (
                          <>
                            <RotateCcw size={14} className="text-gray-500" />
                            <span className="text-xs text-gray-500 font-medium">
                              Blacklisted
                            </span>
                          </>
                        ) : user.isActive ? (
                          <>
                            <CheckCircle size={14} className="text-green-500" />
                            <span className="text-xs text-gray-500 font-medium">
                              Active
                            </span>
                          </>
                        ) : (
                          <>
                            <XCircle size={14} className="text-red-500" />
                            <span className="text-xs text-gray-500 font-medium">
                              Inactive
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* User Details Modal */}
      {showDetailsModal && selectedUser && (
        <UserDetailsModal user={selectedUser} onClose={() => setShowDetailsModal(false)} />
      )}

      {/* Create/Edit User Modal */}
      {showForm && (
        <Modal 
          isOpen={showForm} 
          onClose={resetForm} 
          title={isEditing ? 'Edit User' : 'Create New User'}
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isEditing ? 'Password (leave blank to keep current)' : 'Password *'}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="user">User</option>
                <option value="hospital">Hospital Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hospital ID
              </label>
              <input
                type="number"
                name="hospitalId"
                value={formData.hospitalId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Active
              </label>
            </div>
            
            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isCreating || isUpdating}
                className="flex items-center gap-2"
              >
                {isCreating || isUpdating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  isEditing ? 'Update User' : 'Create User'
                )}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteModal 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
        onConfirm={handleConfirmDelete} 
        title="Delete User" 
        message="Are you sure you want to delete this user? This action cannot be undone." 
        itemName={userToDelete?.name} 
      />
    </>
  );
};

export default UsersList;