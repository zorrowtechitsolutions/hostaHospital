// App.jsx
import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth, AuthProvider } from "./context/AuthContext";

import {
  generateToken,
  listenMessages,
  requestNotificationPermission,
} from "./notification/firebase";
import { useNavigate } from "react-router-dom";

import Sidebar from "./pages/Sidebar";
import TopBar from "./pages/Topbar";
import Dashboard from "./pages/Dashboard";
import { ToastProvider } from "./components/ui/Toast";

// ✅ Global reusable Button
import { Button } from "./components/ui/button";

import ApproveRequestModal from "./components/Requests/ApproveRequestModel";
import RejectRequestModal from "./components/Requests/RejectRequestModel";
import HelpSupport from "./components/help/HelpSupport";
import ProtectedRoute from "./context/ProtectedRoute";
import Users from "./components/usermanagment/Users";
import AddNewUser from "./components/usermanagment/AddNewUser";
import EditUser from "./components/usermanagment/EditUser";
import SuperAdminLayout from "./components/super admin/SuperAdminLayout";
import HospitalHomePage from "./Authentication/HospitalHomePage";

// Import socket
import { initSocket } from './socket/socket';
import EmailComposer from "./components/Notification/EmailNotification";
import EditEmailTemplate from "./components/Notification/EditEmailTemplate";
import CreateEmailTemplate from "./components/Notification/CreateEmailTemplate";
import ViewEmailTemplate from "./components/Notification/ViewEmailTemplate";
import EmailTemplates from "./components/Notification/EmailTemplates"
import SessionHistory from "./components/auditlogin/SessionHistory";
import EmailHistory from "./components/Notification/EmailHistory";

// Direct imports (replacing lazy loading)
import Patients from "./components/patients/Patients";
import PatientDetails from "./components/patients/PatientDetails";
import RequestsTable from "./components/Requests/RequestTable";
import EditPatientModal from "./components/patients/EditPatientModal";
import Staffs from "./components/staffs/Staffs";
import AddStaff from "./components/staffs/AddStaff";
import EditStaff from "./components/staffs/EditStaff";
import AllLabResults from "./components/Laborartory/AllLabResults";
import LabTests from "./components/Laborartory/LabTests";
import AddEditLabResults from "./components/Laborartory/AddEditLabResults";
import Register from "./Authentication/Register";
import Login from "./Authentication/Login";
import Settings from "./components/Settings/Settings";
import Doctors from "./components/Doctor/Doctors";
import AddDoctor from "./components/Doctor/AddDoctors";
import EditDoctor from "./components/Doctor/EditDoctor";
import Pharmacy from "./components/Pharmacy/Pharmacy";
import ViewDoctor from "./components/Doctor/ViewDoctor";
import ViewProduct from "./components/Pharmacy/ViewProduct";
import Consultation from "./components/Appointment/Consultation";
import ViewMedicalHistory from "./components/Appointment/ViewMedicalHistory";
import CalendarPage from "./components/Appointment/CalendarPage";
import LaboratoryRegistrationForm from "./components/Laborartory/LaboratoryRegistrationForm";
import NotificationsPage from "./components/Notification/NotificationsPage";
import PermissionList from "./components/usermanagment/PermissionList";
import UserPermissions from "./components/usermanagment/UserPermissions";
import Visits from "./components/visits/Visits";
import Appointments from "./components/Appointment/Appointment";
import Profile from "./components/MyProfile/Profile";
import AddPatient from "./components/patients/AddPatientModal";
import ForgotPassword from "./Authentication/ForgotPassword";
import Ambulance from "./components/Ambulance/Ambulance";
import BloodBank from "./components/BloodBank/BloodBank";
import Attendance from "./components/Attendance/Attendance";
import AttendanceSheet from "./components/Attendance/AttendanceSheet";
import EmployeeAttendance from "./components/Attendance/EmployeeAttendance";
// import Payslips from "./components/Payroll/PaySlip";
// import SalarySlipTemplate from "./components/Settings/SalarySlipTemplate";
import Device from "./components/Attendance/devices/RFIDDevices";
import AssignAccessCardList from "./components/Attendance/Access card/AssignAccessCardList";
import AssignAccessCard from "./components/Attendance/Access card/AssignAccessCard";
import ViewAccessCardDetails from "./components/Attendance/Access card/ViewAccessCardDetails";
import AssignFingerprintList from "./components/Attendance/Fingerprint/AssignFingerPrintList";
import RegisterDeviceModal from "./components/Attendance/devices/RegisterDeviceModal";
import EditDeviceModal from "./components/Attendance/devices/EditDeviceModal";
import FingerprintEnrollmentModal from "./components/Attendance/Fingerprint/FingerprintEnrollmentModal";
import ViewFingerprintDetails from "./components/Attendance/Fingerprint/ViewFingerprintDetails";
import FingerprintEditModal from "./components/Attendance/Fingerprint/FingerprintEditModal";
import HolidayManagement from "./components/Attendance/HolidayManagement";
import ManualAttendance from "./components/Attendance/ManualAttendance";
import LeaveRequests from "./components/LeaveRequests/LeaveRequest";
import MyLeaveRequests from "./components/LeaveRequests/MyLeaveRequests";
import AddLeaveRequest from "./components/LeaveRequests/AddLeaveRequest";
import LeaveTemplates from "./components/LeaveRequests/LeaveTemplates";
import CreateLeaveTemplate from "./components/LeaveRequests/CreateLeaveTemplate";
import EditLeaveTemplate from "./components/LeaveRequests/EditLeaveTemplate";
import ViewLeaveTemplate from "./components/LeaveRequests/ViewLeaveTemplate";

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1C62A0] mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

function App() {
  const { isAuthenticated, loading } = useAuth();

  // ✅ FIX 1: Start closed on small screens, open on desktop
  const [sidebarOpen, setSidebarOpen] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 1024 : true
  );

  const [theme, setTheme] = useState("light");
  const location = useLocation();
  const [booking, setBooking] = useState(null);
  const navigate = useNavigate();

  // ✅ STEP 3 — CONNECT SOCKET ONCE ONLY
  useEffect(() => {
    const socketInstance = initSocket();
    return () => {
      // disconnectSocket();
    };
  }, []);

  // State for modals from Chrome notifications
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  // Check if user is Super Admin
  const roleId = Number(localStorage.getItem("roleId"));
  const isSuperAdmin = roleId === 1;

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const initNotifications = async () => {
      await requestNotificationPermission();
      const token = await generateToken();
    };

    initNotifications();

    const unsubscribe = listenMessages((payload) => {
      const title = payload?.notification?.title || payload?.data?.title;
      const body = payload?.notification?.body || payload?.data?.body;
      setBooking({ title, body });
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isAuthenticated]);

  // Handle service worker messages to open modals
  useEffect(() => {
    const handleServiceWorkerMessage = (event) => {
      if (event.data && event.data.action === "openApproveModal") {
        setShowApproveModal(true);
      } else if (event.data && event.data.action === "openRejectModal") {
        setShowRejectModal(true);
      }
    };

    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener("message", handleServiceWorkerMessage);
    }

    const urlParams = new URLSearchParams(location.search);
    const action = urlParams.get('action');
    const modal = urlParams.get('modal');

    if (action === 'approve' && modal === 'approve') {
      setShowApproveModal(true);
      window.history.replaceState({}, '', window.location.pathname);
    } else if (action === 'reject' && modal === 'reject') {
      setShowRejectModal(true);
      window.history.replaceState({}, '', window.location.pathname);
    }

    return () => {
      if (navigator.serviceWorker) {
        navigator.serviceWorker.removeEventListener("message", handleServiceWorkerMessage);
      }
    };
  }, [location.search]);

  if (loading) {
    return <PageLoader />;
  }

  // If not authenticated, show login/register pages with ToastProvider
  if (!isAuthenticated) {
    return (
      <ToastProvider>
        <Routes>
          <Route path="/" element={<HospitalHomePage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/sign-in" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    );
  }

  // SUPER ADMIN RENDERING
  if (isSuperAdmin) {
    return (
      <ToastProvider>
        <Routes>
          <Route
            path="/super-admin/*"
            element={
              <ProtectedRoute requireSuperAdmin={true}>
                <SuperAdminLayout />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/super-admin/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/super-admin/dashboard" replace />} />
        </Routes>
      </ToastProvider>
    );
  }

  // HOSPITAL ADMIN / DOCTOR / STAFF RENDERING
  return (
    <ToastProvider>
      <div className="flex h-screen bg-gray-50 font-sans">
        <Sidebar sidebarOpen={sidebarOpen} />

        {/* ✅ FIX: Mobile backdrop — tapping outside closes the sidebar */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-10 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ✅ FIX: Content pushes only on lg+; overlays on mobile */}
        <div
          className={`flex-1 flex flex-col transition-all duration-300 min-w-0 ml-0 ${
            sidebarOpen ? "lg:ml-64" : "lg:ml-20"
          }`}
        >
          <TopBar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            theme={theme}
            setTheme={setTheme}
          />

          {booking && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-xl shadow-xl w-[350px] text-center">
                <h3 className="text-lg font-semibold mb-2">{booking.title}</h3>
                <p className="text-gray-500 mb-4">{booking.body}</p>

                <div className="flex gap-3 justify-center">
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => setBooking(null)}
                  >
                    Cancel
                  </Button>

                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => {
                      setBooking(null);
                      navigate("/requests");
                    }}
                  >
                    Accept
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Approve Request Modal from Chrome Notification */}
          {showApproveModal && (
            <ApproveRequestModal
              onClose={() => {
                setShowApproveModal(false);
                setSelectedRequestId(null);
              }}
              onConfirm={(data) => {
                setShowApproveModal(false);
                setSelectedRequestId(null);
                alert("Appointment confirmed successfully!");
              }}
            />
          )}

          {/* Reject Request Modal from Chrome Notification */}
          {showRejectModal && (
            <RejectRequestModal
              onClose={() => {
                setShowRejectModal(false);
                setSelectedRequestId(null);
                setRejectReason("");
              }}
              onConfirm={() => {
                setShowRejectModal(false);
                setSelectedRequestId(null);
                setRejectReason("");
                alert("Request rejected successfully!");
              }}
              reason={rejectReason}
              setReason={setRejectReason}
            />
          )}

          {/* ✅ FIX 2: Added overflow-x-hidden and min-w-0 */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
            <Routes>
              {/* Public routes within authenticated area */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* Dashboard - No specific permission needed, just authentication */}
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Settings - No specific permission needed */}
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/help" element={<HelpSupport />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route
                path="/audit-login"
                element={
                  <ProtectedRoute permissionId={106}>
                    <SessionHistory />
                  </ProtectedRoute>
                } />
              <Route
                path="/email-notifications"
                element={
                  <ProtectedRoute permissionId={99}>
                    <EmailComposer />
                  </ProtectedRoute>} />
              <Route path="/email-history" element={<EmailHistory />} />
              <Route path="/email-templates/edit/:id" element={
                <ProtectedRoute permissionId={104}>
                  <EditEmailTemplate />
                </ProtectedRoute>
              } />
              <Route path="/email-templates/create" element={
                <ProtectedRoute permissionId={102}>
                  <CreateEmailTemplate />
                </ProtectedRoute>
              } />
              <Route path="/email-templates/view/:id" element={
                <ProtectedRoute permissionId={103}>
                  <ViewEmailTemplate />
                </ProtectedRoute>
              } />
              <Route path="/email-templates" element={
                <ProtectedRoute permissionId={103}>
                  <EmailTemplates />
                </ProtectedRoute>
              } />

              <Route path="/calendar" element={<CalendarPage />} />

              {/* Attendance routes */}
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/attendance/sheet" element={<AttendanceSheet />} />
              <Route path="/attendance/employee/:id" element={<EmployeeAttendance />} />
              <Route path="/attendance/device" element={<Device />} />
              <Route path="/devices/register" element={<RegisterDeviceModal />} />
              <Route path="/devices/edit/:id" element={<EditDeviceModal />} />
              <Route path="/attendance/access-card" element={<AssignAccessCardList />} />
              <Route path="/attendance/access-card/assign/:memberKey" element={<AssignAccessCard />} />
              <Route path="/attendance/access-card/view/:memberKey" element={<ViewAccessCardDetails />} />
              <Route path="/attendance/fingerprint" element={<AssignFingerprintList />} />
              <Route path="/attendance/fingerprint/enroll/:key" element={<FingerprintEnrollmentModal />} />
              <Route path="/attendance/fingerprint/view/:memberKey" element={<ViewFingerprintDetails />} />
              <Route path="/attendance/fingerprint/edit/:key" element={<FingerprintEditModal />} />
              <Route path="/attendance/manual" element={<ManualAttendance />} />

              {/* PayRoll routes (commented out) */}
              {/* <Route path="/payroll/payslips" element={<Payslips/>} />
              <Route path="/salary-slip/template" element={<SalarySlipTemplate/>} /> */}

              {/* Doctor routes */}
              <Route path="/doctors" element={
                <ProtectedRoute permissionId={2}><Doctors /></ProtectedRoute>
              } />
              <Route path="/add-doctor" element={
                <ProtectedRoute permissionId={1}><AddDoctor /></ProtectedRoute>
              } />
              <Route path="/edit-doctor/:id" element={
                <ProtectedRoute permissionId={3}><EditDoctor /></ProtectedRoute>
              } />
              <Route path="/doctor/:id" element={
                <ProtectedRoute permissionId={2}><ViewDoctor /></ProtectedRoute>
              } />

              {/* Patient routes */}
              <Route path="/patients" element={
                <ProtectedRoute permissionId={14}><Patients /></ProtectedRoute>
              } />
              <Route path="/add-patient" element={
                <ProtectedRoute permissionId={13}><AddPatient /></ProtectedRoute>
              } />
              <Route path="/edit-patient/:id" element={
                <ProtectedRoute permissionId={15}><EditPatientModal /></ProtectedRoute>
              } />
              <Route path="/patients/:id" element={
                <ProtectedRoute permissionId={14}><PatientDetails /></ProtectedRoute>
              } />

              {/* Staff routes */}
              <Route path="/staffs" element={
                <ProtectedRoute permissionId={10}><Staffs /></ProtectedRoute>
              } />
              <Route path="/add-staff" element={
                <ProtectedRoute permissionId={9}><AddStaff /></ProtectedRoute>
              } />
              <Route path="/edit-staff/:id" element={
                <ProtectedRoute permissionId={11}><EditStaff /></ProtectedRoute>
              } />

              {/* Lab routes */}
              <Route path="/lab/results" element={
                <ProtectedRoute permissionId={82}><AllLabResults /></ProtectedRoute>
              } />
              <Route path="/lab/tests" element={
                <ProtectedRoute permissionId={82}><LabTests /></ProtectedRoute>
              } />
              <Route path="/lab/results/add" element={
                <ProtectedRoute permissionId={81}><AddEditLabResults /></ProtectedRoute>
              } />
              <Route path="/lab/results/edit/:id" element={
                <ProtectedRoute permissionId={83}><AddEditLabResults /></ProtectedRoute>
              } />
              <Route path="/laboratory" element={
                <ProtectedRoute permissionId={22}><LaboratoryRegistrationForm /></ProtectedRoute>
              } />

              {/* Ambulance route */}
              <Route path="/ambulance" element={
                <ProtectedRoute permissionId={30}><Ambulance /></ProtectedRoute>
              } />

              {/* Blood Bank route */}
              <Route path="/blood" element={
                <ProtectedRoute permissionId={26}><BloodBank /></ProtectedRoute>
              } />

              {/* Pharmacy route */}
              <Route path="/pharmacy" element={
                <ProtectedRoute permissionId={54}><Pharmacy /></ProtectedRoute>
              } />
              <Route path="/product/:id" element={
                <ProtectedRoute permissionId={54}><ViewProduct /></ProtectedRoute>
              } />

              {/* Appointment/Consultation routes */}
              <Route path="/appointments/consultation" element={
                <ProtectedRoute permissionId={34}><Consultation /></ProtectedRoute>
              } />
              <Route path="/appointments/medical-history" element={
                <ProtectedRoute permissionId={34}><ViewMedicalHistory /></ProtectedRoute>
              } />
              <Route path="/appointments" element={
                <ProtectedRoute permissionId={34}><Appointments /></ProtectedRoute>
              } />

              {/* Role & Permission routes */}
              <Route path="/roles" element={
                <ProtectedRoute permissionId={58}><UserPermissions /></ProtectedRoute>
              } />
              <Route path="/permissions/:roleId" element={
                <ProtectedRoute permissionId={58}><PermissionList /></ProtectedRoute>
              } />

              {/* User management routes */}
              <Route path="/users" element={
                <ProtectedRoute permissionId={58}><Users /></ProtectedRoute>
              } />
              <Route path="/add-user" element={
                <ProtectedRoute permissionId={58}><AddNewUser /></ProtectedRoute>
              } />
              <Route path="/edit-user/:id" element={
                <ProtectedRoute permissionId={58}><EditUser /></ProtectedRoute>
              } />

              {/* Visits */}
              <Route path="/visits" element={
                <ProtectedRoute permissionId={34}><Visits /></ProtectedRoute>
              } />

              {/* Requests */}
              <Route path="/requests" element={<RequestsTable />} />

              {/* Leave Requests */}
              <Route path="/leave-requests" element={<LeaveRequests />} />
              <Route path="/my-leave-requests" element={<MyLeaveRequests />} />
              <Route path="/leave/add" element={<AddLeaveRequest />} />
              <Route path="/leave-templates" element={<LeaveTemplates />} />
              <Route path="/leave-templates/create" element={<CreateLeaveTemplate />} />
              <Route path="/leave-templates/edit/:id" element={<EditLeaveTemplate />} />
              <Route path="/leave-templates/view/:id" element={<ViewLeaveTemplate />} />

              {/* Holiday management routes */}
              <Route path="/attendance/holidays" element={<HolidayManagement />} />

              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}

export default function AppWrapper() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}