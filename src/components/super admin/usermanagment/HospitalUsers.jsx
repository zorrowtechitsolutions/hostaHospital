// src/components/superadmin/usermanagement/HospitalUsers.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  Search, 
  ArrowLeft,
  Shield,
  Eye,
  Edit,
  Trash2,
  Loader2
} from 'lucide-react';
import { Card, Button, Badge, Pagination } from '../../ui';
import { useGetAllHospitalsQuery } from '../../../../app/service/hospitalApi';
import { useGetDoctorsQuery } from '../../../../app/service/doctorApi';
import { useGetStaffQuery } from '../../../../app/service/staffApi';

const HospitalUsers = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const { data: hospitalsData, isLoading: loadingHospitals } = useGetAllHospitalsQuery();
  const { data: doctorsData } = useGetDoctorsQuery();
  const { data: staffData } = useGetStaffQuery();

  const hospitals = hospitalsData?.data || hospitalsData || [];
  const doctors = doctorsData?.data || [];
  const staff = staffData?.data || [];

  const hospitalsWithCounts = hospitals.map(hospital => ({
    ...hospital,
    doctorCount: doctors.filter(d => d.hospitalId === hospital.id).length,
    staffCount: staff.filter(s => s.hospitalId === hospital.id).length,
    totalUsers: doctors.filter(d => d.hospitalId === hospital.id).length + 
                staff.filter(s => s.hospitalId === hospital.id).length
  }));

  const filteredHospitals = hospitalsWithCounts.filter(hospital =>
    hospital.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hospital.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedHospitals = filteredHospitals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredHospitals.length / itemsPerPage);

  const handleHospitalClick = (hospital) => {
    navigate(`/super-admin/hospital-users/${hospital.id}/permissions`, {
      state: { 
        hospitalName: hospital.name,
        hospitalId: hospital.id 
      }
    });
  };

  if (loadingHospitals) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-6 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#1C62A0]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6">
      <div className="mb-6">
        <button 
          onClick={() => navigate('/super-admin/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} /> Back to Dashboard
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Hospital Users Management</h1>
            <p className="text-sm text-gray-500 mt-1">Select a hospital to manage its users and permissions</p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search hospitals by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedHospitals.map((hospital) => (
          <Card 
            key={hospital.id} 
            className="p-6 hover:shadow-lg transition-all cursor-pointer"
            onClick={() => handleHospitalClick(hospital)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{hospital.name}</h3>
                  <p className="text-xs text-gray-500">ID: {hospital.id}</p>
                </div>
              </div>
              <Badge variant={hospital.status === 'active' ? 'success' : 'warning'}>
                {hospital.status === 'active' ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            <div className="space-y-2 mb-4">
              <p className="text-sm text-gray-600 truncate">{hospital.email}</p>
              {hospital.phone && <p className="text-sm text-gray-600">{hospital.phone}</p>}
            </div>

            <div className="border-t pt-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Users size={14} className="text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">{hospital.totalUsers}</span>
                  <span className="text-xs text-gray-500">Total Users</span>
                </div>
                <div className="flex items-center gap-1">
                  <Shield size={14} className="text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">{hospital.doctorCount + hospital.staffCount}</span>
                  <span className="text-xs text-gray-500">With Roles</span>
                </div>
              </div>
              <Button size="sm" variant="outline" className="flex items-center gap-1">
                <Eye size={14} /> View Users
              </Button>
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
            totalItems={filteredHospitals.length}
            itemsPerPage={itemsPerPage}
            itemLabel="hospitals"
          />
        </div>
      )}

      {filteredHospitals.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hospitals found</h3>
          <p className="text-gray-500">Try adjusting your search</p>
        </div>
      )}
    </div>
  );
};

export default HospitalUsers;