// src/components/users/Users.jsx - Simplified with only User Type and Actions
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Plus,
  Filter,
  Download,
  Edit,
  Users as UsersIcon,
  RefreshCcw,
  Trash2,
  X,
  Loader2
} from 'lucide-react';

import {
  Button,
  Card,
  Pagination,
  SearchBar
} from '../ui';

import DeleteModal from '../patients/DeleteModel';

import {
  showSuccessToast,
  showErrorToast,
  showWarningToast
} from '../ui/Toast';

import { useGetDoctorsQuery } from '../../../app/service/doctorApi';
import { useGetStaffQuery } from '../../../app/service/staffApi';
import { useGetRolePermissionsQuery, useDeleteRolePermissionMutation } from '../../../app/service/rolePermission';
import { useGetRolesQuery } from '../../../app/service/role';

// Skeleton Loader Component
const SkeletonLoader = () => (
  <div className="bg-white rounded-xl shadow-sm p-6">
    <div className="px-6 py-4 border-b bg-gray-50">
      <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-6 py-4"><div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div></th>
            <th className="px-6 py-4"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div></th>
          </tr>
        </thead>
        <tbody>
          {[...Array(5)].map((_, i) => (
            <tr key={i} className="border-b border-gray-100">
              <td className="px-6 py-4"><div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div></td>
              <td className="px-6 py-4"><div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const Users = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const itemsPerPage = 10;

  // Fetch doctors and staff from API
  const { 
    data: doctorsData, 
    isLoading: doctorsLoading,
    refetch: refetchDoctors 
  } = useGetDoctorsQuery({ limit: 100 });
  
  const { 
    data: staffData, 
    isLoading: staffLoading,
    refetch: refetchStaff 
  } = useGetStaffQuery({ limit: 100 });
  
  const { 
    data: rolePermissions,
    isLoading: permissionsLoading,
    refetch: refetchPermissions
  } = useGetRolePermissionsQuery({});
  
  // Delete role permission mutation
  const [deleteRolePermission, { isLoading: isDeletingPermission }] = useDeleteRolePermissionMutation();
  
  // Fetch roles from API to get dynamic role names
  const { 
    data: rolesData, 
    isLoading: rolesLoading,
    refetch: refetchRoles
  } = useGetRolesQuery({ limit: 100 });

  const isLoading = doctorsLoading || staffLoading || permissionsLoading || rolesLoading;

  // Transform API data to aggregated user format by type
  const transformToUsers = () => {
    const aggregatedUsers = [];
    
    if (doctorsData?.data?.length > 0 || doctorsData?.length > 0) {
      aggregatedUsers.push({
        id: "doctor_type",
        userType: "Doctor",
        count: doctorsData?.data?.length || doctorsData?.length || 0
      });
    }
    
    if (staffData?.data?.length > 0 || staffData?.length > 0) {
      aggregatedUsers.push({
        id: "staff_type",
        userType: "Staff",
        count: staffData?.data?.length || staffData?.length || 0
      });
    }
    
    return aggregatedUsers;
  };

  // Update users when data changes
  useEffect(() => {
    if (!isLoading) {
      const transformedUsers = transformToUsers();
      setUsers(transformedUsers);
    }
  }, [doctorsData, staffData, isLoading]);

  // Check if a new user was added via navigation state
  useEffect(() => {
    if (location.state?.newUser) {
      refetchDoctors();
      refetchStaff();
      refetchPermissions();
      refetchRoles();
      showSuccessToast(`${location.state.newUser.name} has been added successfully!`, 3000);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname, refetchDoctors, refetchStaff, refetchPermissions, refetchRoles]);

  // Check if a user was updated via navigation state
  useEffect(() => {
    if (location.state?.updatedUser) {
      refetchDoctors();
      refetchStaff();
      refetchPermissions();
      refetchRoles();
      showSuccessToast(`${location.state.updatedUser.name} has been updated successfully!`, 3000);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname, refetchDoctors, refetchStaff, refetchPermissions, refetchRoles]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, userTypeFilter]);

  const getUserTypes = () => {
    return [...new Set(users.map(u => u.userType).filter(Boolean))];
  };

  const getFilteredUsers = () => {
    let filtered = [...users];
    
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.userType?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (userTypeFilter !== 'all') {
      filtered = filtered.filter(user => user.userType === userTypeFilter);
    }
    
    return filtered;
  };

  const filteredUsers = getFilteredUsers();
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const clearAllFilters = () => {
    setUserTypeFilter('all');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      refetchDoctors(),
      refetchStaff(),
      refetchPermissions(),
      refetchRoles()
    ]);
    setIsRefreshing(false);
    showSuccessToast("Refreshed user list", 2000);
  };

  const handleExportJSON = () => {
    const exportData = getFilteredUsers().map(user => ({
      'User Type': user.userType,
      'Count': user.count || 'N/A'
    }));
    
    const link = document.createElement('a');
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    link.href = URL.createObjectURL(blob);
    link.download = `users_export_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    showSuccessToast(`Exported ${exportData.length} user records`, 2000);
  };

  const handleExportCSV = () => {
    const exportData = getFilteredUsers();
    const headers = ['User Type', 'Count'];
    const csvRows = [
      headers.join(','),
      ...exportData.map(user => 
        [
          `"${user.userType}"`,
          `"${user.count || 'N/A'}"`
        ].join(',')
      )
    ];
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    showSuccessToast(`Exported ${exportData.length} user records as CSV`, 2000);
  };

  // ✅ REMOVED: handleImport function

  const handleEditUser = (user) => {
    navigate(`/edit-user/${user.userType.toLowerCase()}`);
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (userToDelete) {
      try {
        const permissions = rolePermissions?.data || [];
        let permissionId = null;
        
        if (Array.isArray(permissions)) {
          const permission = permissions.find(perm => {
            if (userToDelete.userType === 'Doctor' && perm.userType === 'doctor') {
              return true;
            }
            if (userToDelete.userType === 'Staff' && perm.userType === 'staff') {
              return true;
            }
            return false;
          });
          permissionId = permission?.id;
        }
        
        if (permissionId) {
          await deleteRolePermission(permissionId).unwrap();
          showSuccessToast(`${userToDelete.userType} role permission has been removed successfully!`, 3000);
        } else {
          showWarningToast(`No permission found for ${userToDelete.userType}.`, 3000);
        }
        
        await Promise.all([
          refetchDoctors(),
          refetchStaff(),
          refetchPermissions(),
          refetchRoles()
        ]);
        
        setShowDeleteModal(false);
        setUserToDelete(null);
      } catch (error) {
        const errorMessage = error?.data?.message || 'Failed to remove user permission. Please try again.';
        showErrorToast(errorMessage, 4000);
      }
    }
  };
  
  const getActiveFilterCount = () =>
    [
      userTypeFilter !== 'all',
      !!searchTerm
    ].filter(Boolean).length;

  const activeFilterCount = getActiveFilterCount();

  if (isLoading) {
    return <SkeletonLoader />;
  }

  return (
    <>
      <div className="min-h-screen bg-[#F8F9FA] p-6 font-sans">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <button
              onClick={() => navigate('/users')}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="text-xs text-gray-500">
              <span className="text-gray-700">Users</span>
              <span className="mx-1 text-gray-400">»</span>
              <span>Home</span>
              <span className="mx-1 text-gray-400">»</span>
              <span>Users</span>
            </div>
          </div>
          <h1 className="text-xl font-bold text-gray-800">Users</h1>
          <p className="text-sm text-gray-500 mt-1">Manage doctors and staff accounts</p>
        </div>

        {/* Search and Action Buttons Row */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="flex-1 max-w-md">
            {/* ✅ Replaced custom SearchBar with UI library SearchBar */}
            <SearchBar 
              placeholder="Search by user type..." 
              value={searchTerm} 
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              onClear={() => {
                setSearchTerm('');
                setCurrentPage(1);
              }}
              className="w-full"
            />
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <Button variant="outline" size="sm" onClick={handleRefresh} title="Refresh" disabled={isRefreshing}>
              <RefreshCcw size={16} className={isRefreshing ? "animate-spin" : ""} />
            </Button>
            
            {/* ✅ IMPORT BUTTON REMOVED */}
            
            <Button variant="outline" size="sm" onClick={handleExportCSV} title="Export CSV">
              <Download size={16} />
            </Button>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowFilters(prev => !prev)}
              className={`relative ${showFilters || activeFilterCount > 0 ? 'text-[#1C62A0]' : 'text-gray-500'}`}
              title="Toggle Filters"
            >
              <Filter size={16} />
              {activeFilterCount > 0 && !showFilters && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* FILTER SECTION */}
        {showFilters && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center bg-gray-50">
                  <Filter size={18} className="text-[#1C62A0]" />
                </div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-semibold text-gray-800">Filters</h2>
                  {activeFilterCount > 0 && (
                    <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-md">
                      {activeFilterCount} Active Filter{activeFilterCount !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={clearAllFilters} className="text-sm font-medium text-red-500 hover:text-red-600">
                Clear All Filters
              </button>
            </div>

            <div className="grid grid-cols-1 gap-5">
              <select
                value={userTypeFilter}
                onChange={(e) => setUserTypeFilter(e.target.value)}
                className="h-12 px-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1C62A0] bg-white"
              >
                <option value="all">All User Types</option>
                {getUserTypes().map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* User Table */}
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <Card className="bg-white rounded-xl shadow-sm p-6">
            <div className="px-6 py-4 border-b bg-gray-50">
              <h2 className="text-sm font-semibold text-gray-700">
                All Users
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded ml-2">{filteredUsers.length}</span>
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="w-[50%] px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Type</th>
                    <th className="w-[50%] px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{user.userType}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="p-2 rounded-lg text-green-600 hover:bg-green-50 transition-all duration-200"
                            title="Edit User"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(user)}
                            className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-all duration-200"
                            title="Delete User"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 px-6 py-3 bg-white border-t rounded-b-lg">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={filteredUsers.length}
                  itemsPerPage={itemsPerPage}
                  itemLabel="user types"
                />
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteModal 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
        onConfirm={handleConfirmDelete} 
        title="Delete User" 
        message="Are you sure you want to remove this user type? This action will revoke all permissions for all users of this type and cannot be undone." 
        itemName={userToDelete?.userType} 
      />
    </>
  );
};

export default Users;