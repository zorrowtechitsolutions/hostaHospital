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
import HospitalVisitList from './hospitals/HospitalVisitList';
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
import HospitalUserPermissions from './usermanagment/HospitalUserPermissions';
import HospitalUserDetails from './usermanagment/HospitalUserDetails';
import HospitalAddUser from './usermanagment/HospitalAddUser';
import HospitalEditUser from './usermanagment/HospitalEditUser';
import SuperAddNewUser from './usermanagment/SuperAddNewUser';
import SuperEditUser from './usermanagment/SuperEditUser';
import SuperViewAssignedRoles from './usermanagment/SuperViewAssignedRoles';

// Hospital Roles imports
import HospitalRoles from './permission/HospitalRoles';
import HospitalNotificationList from './hospitals/notification/HospitalNotificationList';

// Patient imports
import AddPatient from './hospitals/patients/AddPatients';
import EditPatient from './hospitals/patients/EditPatients';
import PatientDetails from './hospitals/patients/PatientsDetails';

// User Management (RTK Query)
import UsersList from './users/userslist';

const SuperAdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const SIDEBAR_OPEN_WIDTH = 256;
  const SIDEBAR_CLOSED_WIDTH = 80;

  return (
    <div className="flex h-screen bg-[#F8F9FA]">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
       
      <div 
        className="flex-1 flex flex-col overflow-hidden transition-all duration-300"
        style={{
          marginLeft: sidebarOpen ? `${SIDEBAR_OPEN_WIDTH}px` : `${SIDEBAR_CLOSED_WIDTH}px`
        }}
      >
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            <Routes>
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
              <Route path="hospitals/:id/visits" element={<HospitalVisitList />} />
              <Route path="hospitals/:id/ambulances" element={<HospitalAmbulancesList />} />
              <Route path="hospitals/:id/blood-banks" element={<HospitalBloodBanksList />} />
              <Route path="hospitals/:id/notifications" element={<HospitalNotificationList />} />
              
              {/* Patient Routes */}
              <Route path="patients/add" element={<AddPatient/>} />
              <Route path="patients/edit/:id" element={<EditPatient />} />
              <Route path="patients/:id" element={<PatientDetails />} />
              
              {/* Category & Specialty Routes */}
              <Route path="categories" element={<Categories />} />
              <Route path="specialties" element={<Specialties />} />
              <Route path="specialities/:id/hospitals" element={<HospitalsBySpeciality />} />
              <Route path="hospital/:hospitalId/doctors" element={<DoctorsByHospital />} />
              
              {/* Ads Route */}
              <Route path="ads" element={<Ads />} />
              
              {/* Super Admin Permission Routes */}
              <Route path="super-permissions" element={<SuperUserPermissions />} />
              <Route path="super-permissions/:roleId" element={<SuperPermissionList />} />
              
              {/* Hospital Roles Routes */}
              <Route path="hospital-roles/:hospitalId" element={<HospitalRoles />} />
              
              {/* Hospital Permission Routes */}
              <Route 
                path="hospital-permissions/:hospitalId/:roleId" 
                element={<HospitalPermissionList />} 
              />
              
              {/* Hospital User Management Routes */}
              <Route path="hospital-users" element={<HospitalUsers />} />
              <Route path="hospital-users/:hospitalId/add" element={<HospitalAddUser />} />
              <Route path="hospital-users/:hospitalId/edit/:userId" element={<HospitalEditUser />} />
              <Route path="hospital-users/:hospitalId/user/:userId" element={<HospitalUserDetails />} />
              
              {/* Hospital User Permissions Routes */}
              <Route path="hospital-users/:hospitalId/permissions" element={<HospitalUserPermissions />} />
              <Route path="hospital-users/:hospitalId/permissions/:roleId" element={<HospitalPermissionList />} />

              {/* ===== SUPER ADMIN USER MANAGEMENT (RTK QUERY) ===== */}
              {/* Main Users List - Super Admin sees ALL users */}
              <Route path="users" element={<UsersList />} />
              
              {/* Legacy User Management Routes (keep for backward compatibility) */}
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
              
              {/* Catch all */}
              <Route path="*" element={<Navigate to="/super-admin/dashboard" replace />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLayout;