// src/components/super admin/permission/HospitalRoles.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  Search, 
  Edit, 
  Trash2, 
  Shield, 
  Key,
  Loader2,
  Building2,
  Eye,
  Plus
} from 'lucide-react';
import { Card, Button, Badge, Pagination } from '../../ui';
import { useGetRolesQuery, useDeleteRoleMutation } from '../../../../app/service/role';
import { showSuccessToast, showErrorToast } from '../../ui/Toast';
import DeleteModal from '../../patients/DeleteModel';

const HospitalRoles = () => {
  const { hospitalId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const hospitalName = location.state?.hospitalName || 'Hospital';

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const itemsPerPage = 10;

  const { data: rolesData, isLoading, refetch } = useGetRolesQuery({ 
    hospitalId: hospitalId,
    limit: 100
  });
  const [deleteRole] = useDeleteRoleMutation();

  const roles = rolesData?.data || [];

  // Filter roles
  const filteredRoles = roles.filter(role =>
    role.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedRoles = filteredRoles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredRoles.length / itemsPerPage);

  // Get role badge color
  const getRoleBadgeColor = (roleName) => {
    if (roleName === 'Admin') return 'bg-purple-100 text-purple-800';
    if (roleName === 'Doctor') return 'bg-blue-100 text-blue-800';
    if (roleName === 'Receptionist') return 'bg-yellow-100 text-yellow-800';
    if (roleName === 'Nurse') return 'bg-pink-100 text-pink-800';
    if (roleName === 'Pharmacist') return 'bg-indigo-100 text-indigo-800';
    if (roleName === 'Lab Technician') return 'bg-orange-100 text-orange-800';
    if (roleName === 'Staff') return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-600';
  };

  const handleViewRole = (role) => {
    // View role details - could navigate to role details page
    navigate(`/super-admin/hospital-roles/${hospitalId}/view/${role.id}`, {
      state: { role, hospitalName }
    });
  };

  const handleEditRole = (role) => {
    navigate(`/super-admin/hospital-roles/${hospitalId}/edit/${role.id}`, {
      state: { role, hospitalName }
    });
  };

  const handlePermissions = (role) => {
    navigate(
      `/super-admin/hospital-permissions/${hospitalId}/${role.id}`,
      {
        state: { 
          roleName: role.name,
          hospitalName 
        }
      }
    );
  };

  const handleDeleteRole = async () => {
    if (roleToDelete) {
      try {
        await deleteRole(roleToDelete.id).unwrap();
        showSuccessToast(`Role "${roleToDelete.name}" deleted successfully!`);
        refetch();
        setShowDeleteModal(false);
        setRoleToDelete(null);
      } catch (error) {
        showErrorToast(error?.data?.message || 'Failed to delete role');
      }
    }
  };

  const handleAddRole = () => {
    navigate(`/super-admin/hospital-roles/${hospitalId}/add`, {
      state: { hospitalId, hospitalName }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-6 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#1C62A0]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6">
      {/* Header */}
      <div className="mb-6">
        <button 
          onClick={() => navigate('/super-admin/hospital-users')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} /> Back to Hospitals
        </button>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{hospitalName}</h1>
              <p className="text-sm text-gray-500 mt-1">Manage hospital roles and permissions</p>
            </div>
          </div>
          <Button onClick={handleAddRole} className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
            <Plus size={16} /> Add Role
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search roles by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1C62A0]"
          />
        </div>
      </div>

      {/* Roles Grid - Like Hospital Admin UserPermissions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedRoles.map((role) => {
          const badgeColor = getRoleBadgeColor(role.name);
          
          return (
            <Card key={role.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <Shield className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{role.name}</h3>
                    <p className="text-xs text-gray-500">ID: {role.id}</p>
                    <div className="mt-1">
                      <Badge className={badgeColor}>
                        <Shield size={12} className="inline mr-1" />
                        {role.name}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleViewRole(role)}
                    className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                    title="View Details"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => handleEditRole(role)}
                    className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                    title="Edit Role"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handlePermissions(role)}
                    className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 transition-colors"
                    title="Manage Permissions"
                  >
                    <Key size={16} />
                  </button>
                  <button
                    onClick={() => { setRoleToDelete(role); setShowDeleteModal(true); }}
                    className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete Role"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              {role.description && (
                <p className="text-xs text-gray-500 mt-2">{role.description}</p>
              )}
              {role.createdAt && (
                <p className="text-xs text-gray-400 mt-1">
                  Created: {new Date(role.createdAt).toLocaleDateString()}
                </p>
              )}
            </Card>
          );
        })}
      </div>

      {filteredRoles.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No roles found
          </h3>
          <p className="text-gray-500">
            Click "Add Role" to create a new role for this hospital
          </p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredRoles.length}
            itemsPerPage={itemsPerPage}
            itemLabel="roles"
          />
        </div>
      )}

      {/* Delete Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteRole}
        title="Delete Role"
        message={`Are you sure you want to delete the role "${roleToDelete?.name}"? This will remove all permissions assigned to this role.`}
        itemName={roleToDelete?.name}
      />
    </div>
  );
};

export default HospitalRoles;