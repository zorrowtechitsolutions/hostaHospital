// src/components/super admin/SuperAdminLayout.jsx
import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Hospitals from './hospitals/Hospitals';
import Categories from './Categories';
import Specialties from './Specialties';
import Ads from './Ads';
import AdminDashboard from './AdminDashboard';
import HospitalDetails from './hospitals/HospitalDetails';
import HospitalPatientsList from './hospitals/HospitalPatientsList';
import HospitalDoctorsList from './hospitals/HospitalDoctorsList';
import HospitalStaffList from './hospitals/HospitalStaffList';
import HospitalAppointmentsList from './hospitals/HospitalAppointmentsList';
import HospitalAmbulancesList from './hospitals/HospitalAmbulancesList';
import HospitalBloodBanksList from './hospitals/HospitalBloodBanksList';
import AddHospital from './hospitals/AddHospital';
import EditHospital from './hospitals/EditHospital';

// Specialty imports
import HospitalsBySpeciality from './speciality/HospitalsBySpeciality';
import DoctorsByHospital from './speciality/DoctorsByHospital';

// Super Permission imports
import SuperPermissionList from './permission/SuperPermissionList';
import SuperUserPermissions from './usermanagment/SuperUserPermissions';

// Hospital Permission imports
import HospitalPermissionList from './permission/HospitalPermissionList';

// User Management imports
import HospitalUsers from './usermanagment/HospitalUsers';
import HospitalUserList from './usermanagment/HospitalUserList';
import HospitalUserPermissions from './usermanagment/HospitalUserPermissions';
import HospitalUserDetails from './usermanagment/HospitalUserDetails';
import HospitalAddUser from './usermanagment/HospitalAddUser';
import HospitalEditUser from './usermanagment/HospitalEditUser';
import SuperUsers from './usermanagment/SuperUsers';
import SuperAddNewUser from './usermanagment/SuperAddNewUser';
import SuperEditUser from './usermanagment/SuperEditUser';
import SuperViewAssignedRoles from './usermanagment/SuperViewAssignedRoles';

// Hospital Roles imports
import HospitalRoles from './permission/HospitalRoles';

const SuperAdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Sidebar width constants
  const SIDEBAR_OPEN_WIDTH = 256; // 64 * 4 = 256px (w-64)
  const SIDEBAR_CLOSED_WIDTH = 80;  // 20 * 4 = 80px (w-20)

  return (
    <div className="flex h-screen bg-[#F8F9FA]">
      {/* Sidebar - fixed position */}
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
       
      {/* Main Content - with margin left to account for fixed sidebar */}
      <div 
        className="flex-1 flex flex-col overflow-hidden transition-all duration-300"
        style={{
          marginLeft: sidebarOpen ? `${SIDEBAR_OPEN_WIDTH}px` : `${SIDEBAR_CLOSED_WIDTH}px`
        }}
      >
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            <Routes>
              {/* Index route - FIXED: Use absolute path */}
              <Route index element={<Navigate to="/super-admin/dashboard" replace />} />
              
              {/* Dashboard */}
              <Route path="dashboard" element={<AdminDashboard />} />
              
              {/* Hospital Routes */}
              <Route path="hospitals" element={<Hospitals />} />
              <Route path="hospitals/:id" element={<HospitalDetails />} />
              <Route path="hospitals/add" element={<AddHospital />} />
              <Route path="hospitals/edit/:id" element={<EditHospital />} />
              <Route path="hospitals/:id/patients" element={<HospitalPatientsList />} />
              <Route path="hospitals/:id/doctors" element={<HospitalDoctorsList />} />
              <Route path="hospitals/:id/staff" element={<HospitalStaffList />} />
              <Route path="hospitals/:id/appointments" element={<HospitalAppointmentsList />} />
              <Route path="hospitals/:id/ambulances" element={<HospitalAmbulancesList />} />
              <Route path="hospitals/:id/blood-banks" element={<HospitalBloodBanksList />} />
              
              {/* Category & Specialty Routes */}
              <Route path="categories" element={<Categories />} />
              <Route path="specialties" element={<Specialties />} />
              <Route path="specialities/:id/hospitals" element={<HospitalsBySpeciality />} />
              <Route path="hospital/:hospitalId/doctors" element={<DoctorsByHospital />} />
              
              {/* Ads Route */}
              <Route path="ads" element={<Ads />} />
              
              {/* ============================================ */}
              {/* SUPER ADMIN PERMISSION ROUTES */}
              {/* ============================================ */}
              {/* List all super admin roles */}
              <Route path="super-permissions" element={<SuperUserPermissions />} />
              {/* Edit permissions for a specific super admin role */}
              <Route path="super-permissions/:roleId" element={<SuperPermissionList />} />
              
              {/* ============================================ */}
              {/* HOSPITAL ROLES ROUTES */}
              {/* ============================================ */}
              {/* List hospital roles */}
              <Route path="hospital-roles/:hospitalId" element={<HospitalRoles />} />
              
              {/* ============================================ */}
              {/* HOSPITAL PERMISSION ROUTES */}
              {/* ============================================ */}
              {/* Edit permissions for a specific hospital role */}
              <Route 
                path="hospital-permissions/:hospitalId/:roleId" 
                element={<HospitalPermissionList />} 
              />
              
              {/* ============================================ */}
              {/* HOSPITAL USER MANAGEMENT ROUTES */}
              {/* ============================================ */}
              {/* Hospital Users - List all hospitals */}
              <Route path="hospital-users" element={<HospitalUsers />} />
              
              {/* Hospital User List - Users of a specific hospital */}
              <Route path="hospital-users/:hospitalId/users" element={<HospitalUserList />} />
              
              {/* Add/Edit/View User */}
              <Route path="hospital-users/:hospitalId/add" element={<HospitalAddUser />} />
              <Route path="hospital-users/:hospitalId/edit/:userId" element={<HospitalEditUser />} />
              <Route path="hospital-users/:hospitalId/user/:userId" element={<HospitalUserDetails />} />
              
              {/* ============================================ */}
              {/* HOSPITAL USER PERMISSIONS ROUTES - UPDATED */}
              {/* ============================================ */}
              {/* List all roles for a hospital (permissions management) */}
              <Route path="hospital-users/:hospitalId/permissions" element={<HospitalUserPermissions />} />
              
              {/* Edit permissions for a specific hospital role */}
              <Route path="hospital-users/:hospitalId/permissions/:roleId" element={<HospitalPermissionList />} />

              {/* ============================================ */}
              {/* LEGACY USER MANAGEMENT ROUTES */}
              {/* ============================================ */}
              <Route path="users" element={<SuperUsers />} />
              <Route path="users/add" element={<SuperAddNewUser />} />
              <Route path="users/edit/:userType" element={<SuperEditUser />} />
              <Route path="users/view-roles" element={<SuperViewAssignedRoles />} />
              
              {/* Revenue & Settings */}
              <Route path="revenue" element={
                <div className="p-6">
                  <h1 className="text-2xl font-bold">Revenue & Reports</h1>
                  <p className="text-gray-500 mt-2">Coming soon...</p>
                </div>
              } />
              <Route path="settings" element={
                <div className="p-6">
                  <h1 className="text-2xl font-bold">Settings</h1>
                  <p className="text-gray-500 mt-2">Coming soon...</p>
                </div>
              } />
              
              {/* Catch all - FIXED: Use absolute path */}
              <Route path="*" element={<Navigate to="/super-admin/dashboard" replace />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLayout;