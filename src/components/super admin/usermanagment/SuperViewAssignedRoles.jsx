// src/components/super admin/usermanagment/SuperViewAssignedRoles.jsx
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Search, Loader2, Shield } from 'lucide-react';
import { Card, Badge, Pagination } from '../../ui';
import { useGetDoctorsQuery } from '../../../../app/service/doctorApi';
import { useGetStaffQuery } from '../../../../app/service/staffApi';
import { useGetRolesQuery } from '../../../../app/service/role';

const SuperViewAssignedRoles = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userType } = location.state || {};
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: doctorsData, isLoading: loadingDoctors } = useGetDoctorsQuery({ limit: 1000 });
  const { data: staffData, isLoading: loadingStaff } = useGetStaffQuery({ limit: 1000 });
  const { data: rolesData } = useGetRolesQuery({ limit: 1000 });

  const roles = rolesData?.data || [];
  const getRoleName = (roleId) => roles.find(r => r.id === roleId)?.name || 'No Role';

  let users = [];
  if (userType === 'Doctor') users = doctorsData?.data || [];
  if (userType === 'Staff') users = staffData?.data || [];

  const filteredUsers = users.filter(user => (user.displayName || user.name || '').toLowerCase().includes(searchTerm.toLowerCase()));
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  if (loadingDoctors || loadingStaff) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-10 w-10 animate-spin text-[#1C62A0]" /></div>;

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6">
      <button onClick={() => navigate('/super-admin/users')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"><ArrowLeft size={20} /> Back</button>
      <h1 className="text-2xl font-bold text-gray-800">{userType} Roles</h1>
      
      <div className="mb-6 mt-4"><div className="relative max-w-md"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} /><input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg" /></div></div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedUsers.map((user) => {
          const roleName = getRoleName(user.roleId);
          return (
            <Card key={user.id} className="p-4">
              <div className="flex items-start gap-3"><div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center"><User className="w-5 h-5 text-gray-600" /></div><div><h3 className="font-semibold">{user.displayName || user.name}</h3><Badge className="mt-1">{roleName}</Badge></div></div>
            </Card>
          );
        })}
      </div>
      {totalPages > 1 && <div className="mt-6"><Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={filteredUsers.length} itemsPerPage={itemsPerPage} itemLabel="users" /></div>}
    </div>
  );
};

export default SuperViewAssignedRoles;