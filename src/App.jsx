// App.jsx
import { useState, useEffect, Suspense, lazy } from "react";
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
// Lazy load components
const Patients = lazy(() => import("./components/patients/Patients"));
const PatientDetails = lazy(() => import("./components/patients/PatientDetails"));
const RequestsTable = lazy(() => import("./components/Requests/RequestTable"));
const EditPatientModal = lazy(() => import("./components/patients/EditPatientModal"));
const Staffs = lazy(() => import("./components/staffs/Staffs"));
const AddStaff = lazy(() => import("./components/staffs/AddStaff"));
const EditStaff = lazy(() => import("./components/staffs/EditStaff"));
const AllLabResults = lazy(() => import("./components/Laborartory/AllLabResults"));
const LabTests = lazy(() => import("./components/Laborartory/LabTests"));
const AddEditLabResults = lazy(() => import("./components/Laborartory/AddEditLabResults"));
const Register = lazy(() => import("./Authentication/Register"));
const Login = lazy(() => import("./Authentication/Login"));
const Settings = lazy(() => import("./components/Settings/Settings"));
const Doctors = lazy(() => import("./components/Doctor/Doctors"));
const AddDoctor = lazy(() => import("./components/Doctor/AddDoctors"));
const EditDoctor = lazy(() => import("./components/Doctor/EditDoctor"));
const Pharmacy = lazy(() => import("./components/Pharmacy/Pharmacy"));
const ViewDoctor = lazy(() => import("./components/Doctor/ViewDoctor"));
const ViewProduct = lazy(() => import("./components/Pharmacy/ViewProduct"));
const Consultation = lazy(() => import("./components/Appointment/Consultation"));
const ViewMedicalHistory = lazy(() => import("./components/Appointment/ViewMedicalHistory"));
const CalendarPage = lazy(() => import("./components/Appointment/CalendarPage"));
const LaboratoryRegistrationForm = lazy(() => import("./components/Laborartory/LaboratoryRegistrationForm"));
const NotificationsPage = lazy(() => import("./components/Notification/NotificationsPage"));
const PermissionList = lazy(() => import("./components/usermanagment/PermissionList"));
const UserPermissions = lazy(() => import("./components/usermanagment/UserPermissions"));
const Visits = lazy(() => import("./components/visits/Visits"));
const Appointments = lazy(() => import("./components/Appointment/Appointment"));
const EmailTemplates = lazy(() => import("./components/Settings/Email"));
const Profile = lazy(() => import("./components/MyProfile/Profile"));
const AddPatient = lazy(() => import("./components/patients/AddPatientModal"));
const ForgotPassword = lazy(() => import("./Authentication/ForgotPassword"));
const Ambulance = lazy(() => import("./components/Ambulance/Ambulance"));
const BloodBank = lazy(() => import("./components/BloodBank/BloodBank"));

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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState("light");
  const location = useLocation();
  const [booking, setBooking] = useState(null);
  const navigate = useNavigate();

 // ✅ STEP 3 — CONNECT SOCKET ONCE ONLY
  useEffect(() => {
    // ✅ Initialize socket connection when app loads
    const socketInstance = initSocket();
    
    console.log("📡 Socket initialized:", socketInstance);

    // ✅ Cleanup on unmount
    return () => {
      console.log("🧹 Cleaning up socket...");
      // Optionally disconnect, but you might want to keep it connected
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

    console.log("🔔 Initializing notifications...");

    const initNotifications = async () => {
      await requestNotificationPermission();
      const token = await generateToken();
      console.log("🔥 FCM TOKEN:", token);
    };

    initNotifications();

    const unsubscribe = listenMessages((payload) => {
      console.log("📩 Notification received:", payload);

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
        console.log("📱 Opening Approve Request Modal from notification");
        setShowApproveModal(true);
      } else if (event.data && event.data.action === "openRejectModal") {
        console.log("📱 Opening Reject Request Modal from notification");
        setShowRejectModal(true);
      }
    };

    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener("message", handleServiceWorkerMessage);
    }

    // Also check URL params for when app was closed
    const urlParams = new URLSearchParams(location.search);
    const action = urlParams.get('action');
    const modal = urlParams.get('modal');
    
    if (action === 'approve' && modal === 'approve') {
      setShowApproveModal(true);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (action === 'reject' && modal === 'reject') {
      setShowRejectModal(true);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }

    return () => {
      if (navigator.serviceWorker) {
        navigator.serviceWorker.removeEventListener("message", handleServiceWorkerMessage);
      }
    };
  }, [location.search]);

  // Log auth state for debugging
  useEffect(() => {
    console.log("App - isAuthenticated:", isAuthenticated, "Path:", location.pathname, "Loading:", loading, "isSuperAdmin:", isSuperAdmin);
  }, [isAuthenticated, location.pathname, loading, isSuperAdmin]);

  if (loading) {
    return <PageLoader />;
  }

  // If not authenticated, show login/register pages with ToastProvider
  if (!isAuthenticated) {
    console.log("Rendering PUBLIC routes");
    return (  
      <ToastProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Home page for non-authenticated users */}
            <Route path="/" element={<HospitalHomePage />} />
            <Route path="/register" element={<Register />} />
            <Route path="/sign-in" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ToastProvider>
    );
  }

  // SUPER ADMIN RENDERING - If Super Admin, render Super Admin layout only
  if (isSuperAdmin) {
    console.log("Rendering SUPER ADMIN routes - isSuperAdmin:", isSuperAdmin);
    return (
      <ToastProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route
              path="/super-admin/*"
              element={
                <ProtectedRoute requireSuperAdmin={true}>
                  <SuperAdminLayout />
                </ProtectedRoute>
              }
            />
            {/* Redirect root to super admin dashboard */}
            <Route path="/" element={<Navigate to="/super-admin/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/super-admin/dashboard" replace />} />
          </Routes>
        </Suspense>
      </ToastProvider>
    );
  }

  // HOSPITAL ADMIN / DOCTOR / STAFF RENDERING
  console.log("Rendering HOSPITAL routes");
  return (
    <ToastProvider>
      <div className="flex h-screen bg-gray-50 font-sans">
        <Sidebar sidebarOpen={sidebarOpen} />
        
        <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
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
                  <button
                    className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg text-sm font-medium transition-colors"
                    onClick={() => setBooking(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-[#3d79ad] hover:bg-[#2c5a7d] text-white rounded-lg text-sm font-medium transition-colors"
                    onClick={() => {
                      setBooking(null);
                      navigate("/requests");
                    }}
                  >
                    Accept
                  </button>
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
                console.log("Appointment confirmed:", data, "for request:", selectedRequestId);
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
                console.log("Request rejected with reason:", rejectReason, "for request:", selectedRequestId);
                setShowRejectModal(false);
                setSelectedRequestId(null);
                setRejectReason("");
                alert("Request rejected successfully!");
              }}
              reason={rejectReason}
              setReason={setRejectReason}
            />
          )}
          
          <div className="flex-1 overflow-y-auto">
            <Suspense fallback={<PageLoader />}>
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
                <Route path="/calendar" element={<CalendarPage />} />
                
                {/* Doctor routes with permission checks */}
                <Route 
                  path="/doctors" 
                  element={
                    <ProtectedRoute permissionId={2}>
                      <Doctors />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/add-doctor" 
                  element={
                    <ProtectedRoute permissionId={3}>
                      <AddDoctor />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/edit-doctor/:id" 
                  element={
                    <ProtectedRoute permissionId={4}>
                      <EditDoctor />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/doctor/:id" 
                  element={
                    <ProtectedRoute permissionId={5}>
                      <ViewDoctor />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Patient routes with permission checks */}
                <Route 
                  path="/patients" 
                  element={
                    <ProtectedRoute >
                      <Patients />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/add-patient" 
                  element={
                    <ProtectedRoute >
                      <AddPatient />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/edit-patient/:id" 
                  element={
                    <ProtectedRoute >
                      <EditPatientModal />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/patients/:id" 
                  element={
                    <ProtectedRoute >
                      <PatientDetails />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Staff routes with permission checks */}
                <Route 
                  path="/staffs" 
                  element={
                    <ProtectedRoute permissionId={10}>
                      <Staffs />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/add-staff" 
                  element={
                    <ProtectedRoute permissionId={11}>
                      <AddStaff />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/edit-staff/:id" 
                  element={
                    <ProtectedRoute permissionId={12}>
                      <EditStaff />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Lab routes with permission checks */}
                <Route 
                  path="/lab/results" 
                  element={
                    <ProtectedRoute permissionId={22}>
                      <AllLabResults />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/lab/tests" 
                  element={
                    <ProtectedRoute permissionId={22}>
                      <LabTests />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/lab/results/add" 
                  element={
                    <ProtectedRoute permissionId={22}>
                      <AddEditLabResults />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/lab/results/edit/:id" 
                  element={
                    <ProtectedRoute permissionId={22}>
                      <AddEditLabResults />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/laboratory" 
                  element={
                    <ProtectedRoute permissionId={22}>
                      <LaboratoryRegistrationForm />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Ambulance route */}
                <Route 
                  path="/ambulance" 
                  element={
                    <ProtectedRoute permissionId={46}>
                      <Ambulance />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Blood Bank route */}
                <Route 
                  path="/blood" 
                  element={
                    <ProtectedRoute permissionId={26}>
                      <BloodBank />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Other protected routes without specific permission IDs */}
                <Route path="/requests" element={<RequestsTable />} />
                <Route path="/pharmacy" element={<Pharmacy />} />
                <Route path="/product/:id" element={<ViewProduct />} />
                <Route path="/appointments/consultation" element={<Consultation />} />
                <Route path="/appointments/medical-history" element={<ViewMedicalHistory />} />
                <Route path="/roles" element={<UserPermissions/>} />
                <Route path="/permissions/:roleId" element={<PermissionList />} /> 
                <Route path="/users" element={<Users />} /> 
                <Route path="/add-user" element={<AddNewUser />} />
                <Route path="/edit-user/:id" element={<EditUser />} />
                <Route path="/visits" element={<Visits />} />
                <Route path="/appointments" element={<Appointments />} />
                <Route path="/email" element={<EmailTemplates />} />
                
                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Suspense>
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
