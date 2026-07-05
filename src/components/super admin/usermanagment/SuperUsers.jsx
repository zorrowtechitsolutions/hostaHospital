// src/components/super admin/usermanagment/SuperUsers.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users as UsersIcon, Eye, Edit, Search, RefreshCcw, Plus, Loader2 } from 'lucide-react';
import { Card, Button, Pagination } from '../../ui';
import { useGetDoctorsQuery } from '../../../../app/service/doctorApi';
import { useGetStaffQuery } from '../../../../app/service/staffApi';
import { showSuccessToast } from '../../ui/Toast';

const SuperUsers = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: doctorsData, isLoading: loadingDoctors, refetch: refetchDoctors } = useGetDoctorsQuery();
  const { data: staffData, isLoading: loadingStaff, refetch: refetchStaff } = useGetStaffQuery();

  const doctors = doctorsData?.data || doctorsData?.doctors || doctorsData || [];
  const staff = staffData?.data || staffData?.staff || staffData || [];

  const users = [
    { 
      id: 'doctor_type', 
      userType: 'Doctor', 
      count: doctors.length, 
      route: '/super-admin/users/view-roles', 
      state: { userType: 'Doctor' } 
    },
    { 
      id: 'staff_type', 
      userType: 'Staff', 
      count: staff.length, 
      route: '/super-admin/users/view-roles', 
      state: { userType: 'Staff' } 
    }
  ];

  const filteredUsers = users.filter(user => 
    user.userType.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const handleRefresh = async () => {
    await Promise.all([refetchDoctors(), refetchStaff()]);
    showSuccessToast("Refreshed user list", 2000);
  };

  if (loadingDoctors || loadingStaff) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-6 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#1C62A0]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage doctors and staff accounts across all hospitals</p>
        </div>
        <Button onClick={() => navigate('/super-admin/users/add')} className="flex items-center gap-2">
          <Plus size={16} /> Add User
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by user type..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent outline-none" 
          />
        </div>
        <Button variant="outline" onClick={handleRefresh}>
          <RefreshCcw size={16} />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paginatedUsers.map((user) => (
          <Card key={user.id} className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <UsersIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{user.userType}</h3>
                  <p className="text-sm text-gray-500">
                    {user.count} {user.count === 1 ? 'user' : 'users'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => navigate(user.route, { state: user.state })} 
                  className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-all duration-200" 
                  title="View Users"
                >
                  <Eye size={16} />
                </button>
                <button 
                  onClick={() => navigate(`/super-admin/users/edit/${user.userType.toLowerCase()}`)} 
                  className="p-2 rounded-lg text-green-600 hover:bg-green-50 transition-all duration-200" 
                  title="Edit"
                >
                  <Edit size={16} />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-6">
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
    </div>
  );
};

export default SuperUsers;