// src/components/super-admin/usermanagement/HospitalUserDetails.jsx
import React, { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Calendar,
  User,
  Shield,
  Activity,
  Clock,
  Loader2,
  Edit,
  Trash2
} from 'lucide-react';
import { Card, Button, Badge } from '../../ui';
import { showSuccessToast, showErrorToast } from '../../ui/Toast';
import {
  useGetDoctorByIdQuery,
  useDeleteDoctorMutation
} from '../../../../app/service/doctorApi';
import {
  useGetStaffByIdQuery,
  useDeleteStaffMutation
} from '../../../../app/service/staffApi';

const HospitalUserDetails = () => {
  const navigate = useNavigate();
  const { hospitalId, userId } = useParams();
  const location = useLocation();
  const { hospitalName, userType, userData } = location.state || {};

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Fetch user details if not passed via state
  const { data: doctorData, isLoading: doctorLoading } = useGetDoctorByIdQuery(userId, {
    skip: userType !== 'doctor' || userData
  });
  
  const { data: staffData, isLoading: staffLoading } = useGetStaffByIdQuery(userId, {
    skip: userType !== 'staff' || userData
  });

  const [deleteDoctor] = useDeleteDoctorMutation();
  const [deleteStaff] = useDeleteStaffMutation();

  const user = userData || doctorData?.data || staffData?.data || null;
  const isLoading = doctorLoading || staffLoading;

  const handleEdit = () => {
    navigate(`/super-admin/hospital-users/${hospitalId}/edit/${userId}`, {
      state: {
        hospitalName,
        userType,
        userData: user
      }
    });
  };

  const handleDelete = async () => {
    try {
      if (userType === 'doctor') {
        await deleteDoctor(userId).unwrap();
      } else {
        await deleteStaff(userId).unwrap();
      }
      showSuccessToast('User deleted successfully');
      navigate(`/super-admin/hospital-users/${hospitalId}/users`, {
        state: { hospitalName }
      });
    } catch (error) {
      console.error('Delete error:', error);
      showErrorToast('Failed to delete user');
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-6 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#1C62A0]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-6">
        <div className="text-center py-12">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">User not found</h3>
          <Button onClick={() => navigate(`/super-admin/hospital-users/${hospitalId}/users`)}>
            Back to Users
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 font-sans">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <button
            onClick={() => navigate(`/super-admin/hospital-users/${hospitalId}/users`, { state: { hospitalName } })}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div className="text-xs text-gray-500">
            <span className="text-gray-700">Hospital Users</span>
            <span className="mx-1 text-gray-400">»</span>
            <span>{hospitalName}</span>
            <span className="mx-1 text-gray-400">»</span>
            <span>User Details</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              userType === 'doctor' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
            }`}>
              <span className="text-xl font-semibold">{getInitials(user.name)}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{user.name}</h1>
              <p className="text-sm text-gray-500 mt-1">
                {userType === 'doctor' ? 'Doctor' : 'Staff'} • ID: {user.id}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Edit size={16} className="mr-1" /> Edit
            </Button>
            <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)}>
              <Trash2 size={16} className="mr-1" /> Delete
            </Button>
          </div>
        </div>
      </div>

      {/* User Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User size={18} className="text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-800">Personal Information</h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500">Full Name</p>
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-sm text-gray-900">{user.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Phone</p>
              <p className="text-sm text-gray-900">{user.phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">User Type</p>
              <Badge variant={userType === 'doctor' ? 'info' : 'purple'}>
                {userType === 'doctor' ? 'Doctor' : 'Staff'}
              </Badge>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Shield size={18} className="text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-800">Role & Status</h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500">Role</p>
              <p className="text-sm font-medium text-gray-900">
                {user.role || (userType === 'doctor' ? 'Doctor' : 'Staff')}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Status</p>
              <Badge variant={user.status === 'active' || user.isActive ? 'success' : 'warning'}>
                {user.status === 'active' || user.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-gray-500">Hospital</p>
              <p className="text-sm text-gray-900">{hospitalName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Hospital ID</p>
              <p className="text-sm text-gray-900">{hospitalId}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock size={18} className="text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-800">Timeline</h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500">Joined</p>
              <p className="text-sm text-gray-900">
                {new Date(user.createdAt || user.createdDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Last Updated</p>
              <p className="text-sm text-gray-900">
                {new Date(user.updatedAt || user.updatedDate).toLocaleDateString()}
              </p>
            </div>
            {userType === 'doctor' && user.speciality && (
              <div>
                <p className="text-xs text-gray-500">Speciality</p>
                <p className="text-sm text-gray-900">{user.speciality}</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Activity Section */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Activity size={18} className="text-orange-600" />
          </div>
          <h3 className="font-semibold text-gray-800">Recent Activity</h3>
        </div>
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">No recent activity to display</p>
          <p className="text-xs mt-1">Activity tracking will be available soon</p>
        </div>
      </Card>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-96 p-6">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-full bg-red-100">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Deletion</h3>
              <p className="text-sm text-gray-600 mb-2">
                Are you sure you want to delete <span className="font-semibold">{user.name}</span>?
              </p>
              <p className="text-xs text-gray-500 mb-6">
                This action cannot be undone. All associated data will be permanently removed.
              </p>
              <div className="flex justify-center gap-3">
                <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={handleDelete}>
                  Delete User
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalUserDetails;