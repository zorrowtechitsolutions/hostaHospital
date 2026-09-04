// src/components/super-admin/SuperAdminLayout.jsx

import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar'; // ✅ Import TopBar
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

// ✅ Doctor Details import
import DoctorDetails from './hospitals/Doctors/DoctorDetails';

// ✅ Staff imports
import StaffDetails from './hospitals/staff/staffDetails';
import AddStaff from './hospitals/Staff/AddStaff';
import EditStaff from './hospitals/Staff/EditStaff';

// Ambulance imports
import AddAmbulance from '../Ambulance/AddAmbulanceModal';
import EditAmbulance from '../Ambulance/EditAmbulanceModal';
import Ambulance from './phone/ambulance/Ambulance';
import AmbulanceDetails from './phone/ambulance/AmbulanceDetails';

// ✅ Blood Bank imports
import AddBloodBank from './hospitals/bloodbank/AddBloodBank';
import EditBloodBank from './hospitals/bloodbank/EditBloodBank';
import BloodBankDetails from './hospitals/bloodbank/BloodBankDetails';

// ✅ Patient imports
import AddPatient from './hospitals/patients/AddPatients';
import EditPatient from './hospitals/patients/EditPatient';
import PatientDetails from './hospitals/patients/PatientsDetails';

// ✅ Blood Donor imports
import BloodDonors from './phone/blooddonor/BloodDonors';
import DonorDetails from './phone/blooddonor/DonorDetails';

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

// User Management (RTK Query)
import UsersList from './users/userslist';
import EditDoctor from './hospitals/Doctors/EditDoctor';
import AddDoctor from './hospitals/Doctors/AddDoctor';

// ✅ Notification imports
import NotificationsPage from './notification/NotificationsPage';
import RecentAppointments from './RecentAppointments';
import RecentActivity from './RecentActivity';
import SuperAdminAuditLog from './auditlogs/SuperAdminAuditLog';
import HospitalSessionHistory from './auditlogs/HospitalSessionHistory';

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
        {/* ✅ TopBar Component - Now visible */}
        <TopBar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        <div className="flex-1 overflow-auto">
          <div className="p-6">
            <Routes>
              <Route index element={<Navigate to="/super-admin/dashboard" replace />} />
              
              {/* Dashboard */}
              <Route path="dashboard" element={<AdminDashboard />} />
              
              {/* ✅ Notification Route */}
              <Route path="notifications" element={<NotificationsPage />} />

              {/* recent activity and recent appointments Routes */}
              <Route path="appointments" element={<RecentAppointments />} />
              <Route path="activity" element={<RecentActivity />} />
              
              {/* Hospital Routes */}
              <Route path="hospitals" element={<Hospitals />} />
              <Route path="hospitals/:id" element={<HospitalDetails />} />
              <Route path="hospitals/add" element={<AddHospital />} />
              <Route path="hospitals/edit/:id" element={<EditHospital />} />
              
              {/* Hospital List Routes - Nested under hospital */}
              <Route path="hospitals/:id/patients" element={<HospitalPatientsList />} />
              <Route path="hospitals/:id/doctors" element={<HospitalDoctorsList />} />
              <Route path="hospitals/:id/staff" element={<HospitalStaffList />} />
              <Route path="hospitals/:id/appointments" element={<HospitalAppointmentsList />} />
              <Route path="hospitals/:id/visits" element={<HospitalVisitList />} />
              <Route path="hospitals/:id/ambulances" element={<HospitalAmbulancesList />} />
              <Route path="hospitals/:id/blood-banks" element={<HospitalBloodBanksList />} />
              <Route path="hospitals/:id/notifications" element={<HospitalNotificationList />} />
              
              {/* ✅ Patient CRUD Routes - Nested under hospital */}
              <Route path="hospitals/:id/patients/add" element={<AddPatient />} />
              <Route path="hospitals/:id/patients/edit/:patientId" element={<EditPatient />} />
              <Route path="hospitals/:id/patients/:patientId" element={<PatientDetails />} />
              
              {/* ✅ Blood Bank Routes */}
              <Route path="blood-bank" element={<HospitalBloodBanksList />} />
              <Route path="blood-bank/add" element={<AddBloodBank />} />
              <Route path="blood-bank/edit/:id" element={<EditBloodBank />} />
              <Route path="blood-bank/:id" element={<BloodBankDetails />} />
              
              {/* ✅ Blood Donor Routes */}
              <Route path="blood-donors" element={<BloodDonors />} />
              <Route path="blood-donors/:id" element={<DonorDetails />} />

              {/* ✅ Audit Logs Routes */}
              <Route path="audit-logs" element={<SuperAdminAuditLog />} />
              <Route path="hospitals/:id/sessions" element={<HospitalSessionHistory />} />
              
              
              {/* ✅ Ambulance Routes */}
              <Route path="ambulance" element={<Ambulance />} />
              <Route path="ambulance/:id" element={<AmbulanceDetails />} />
              
              {/* ✅ Doctor Routes */}
              <Route path="hospitals/:id/doctors/edit/:doctorId" element={<EditDoctor />} />
              <Route path="hospitals/:id/doctors/add" element={<AddDoctor />} />
              <Route path="/doctors/:id" element={<DoctorDetails />} />
              
              {/* ✅ Staff Routes */}
              <Route path="staff/:id" element={<StaffDetails />} />
              <Route path="staff/add" element={<AddStaff />} />
              <Route path="staff/edit/:id" element={<EditStaff />} />
              
              {/* Ambulance Routes - Add/Edit */}
              <Route path="ambulance/add" element={<AddAmbulance />} />
              <Route path="ambulance/edit/:id" element={<EditAmbulance />} />
              
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
              <Route path="users" element={<UsersList />} />
              
              {/* Legacy User Management Routes */}
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