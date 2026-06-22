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
import TopBar from "./pages/TopBar";
import Dashboard from "./pages/Dashboard";
import { ToastProvider } from "./components/ui/Toast";
import ApproveRequestModal from "./components/Requests/ApproveRequestModel";
import RejectRequestModal from "./components/Requests/RejectRequestModel";
import ViewMedicalHistory from "./components/Appointment/ViewMedicalHistory";

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
const CalendarPage = lazy(() => import("./components/Appointment/CalendarPage"));
const LaboratoryRegistrationForm = lazy(() => import("./components/Laborartory/LaboratoryRegistrationForm"));
const NotificationsPage = lazy(() => import("./components/Notification/NotificationsPage"));
const PermissionList = lazy(() => import("./components/Settings/PermissionList"));
const UserPermissions = lazy(() => import("./components/Settings/UserPermissions"));
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

// export const getPresignedUrl = async ({
//   filename,
//   contentType,
//   size,
//   role,
//   id,
// }) => {
//   try {
//     const response = await fetch(
//       "https://zorrowtek.in/api/presignurl",
//       {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },

//         body: JSON.stringify({
//           filename,
//           contentType,
//           size,
//           role,
//           id,
//         }),
//       }
//     );

//     const data = await response.json();

//     console.log("Presigned URL:", data);

//     return data;

//   } catch (error) {
//     console.error(
//       "Presign URL Error:",
//       error
//     );
//   }
// };


function App() {
  const { isAuthenticated, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState("light");
  const location = useLocation();
  const [booking, setBooking] = useState(null);
  const navigate = useNavigate();
  
  // State for modals from Chrome notifications
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

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

  // 🚫 Do nothing if not logged in
  useEffect(() => {
    if (!isAuthenticated) return;

    console.log("🔔 Initializing notifications...");

    requestNotificationPermission();
    generateToken();

    // ✅ store unsubscribe function
    const unsubscribe = listenMessages((payload) => {
      console.log("📩 Notification received:", payload);

      const title =
        payload?.notification?.title || payload?.data?.title;

      const body =
        payload?.notification?.body || payload?.data?.body;

      setBooking({ title, body });
    });

    // ✅ CLEANUP (very important)
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isAuthenticated]);

  // ✅ Handle service worker messages to open modals
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
    console.log("App - isAuthenticated:", isAuthenticated, "Path:", location.pathname, "Loading:", loading);
  }, [isAuthenticated, location.pathname, loading]);

  if (loading) {
    return <PageLoader />;
  }

  // If not authenticated, show login/register pages with ToastProvider
  if (!isAuthenticated) {
    console.log("Rendering PUBLIC routes");
    return (  
      <ToastProvider>
        <Suspense
          fallback={
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="h-64 rounded-2xl bg-white border border-gray-100 animate-pulse"
                />
              ))}
            </div>
          }
        >
          <Routes>
            <Route path="/register" element={<Register />} />
            <Route path="/sign-in" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="*" element={<Navigate to="/sign-in" replace />} />
          </Routes>
        </Suspense>
      </ToastProvider>
    );
  }
 
  // If authenticated, show main app
  console.log("Rendering PROTECTED routes");
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
                // TODO: Call your API to confirm appointment
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
                // TODO: Call your API to reject request
                setShowRejectModal(false);
                setSelectedRequestId(null);
                setRejectReason("");
                alert("Request rejected successfully!");
              }}
              reason={rejectReason}
              setReason={setRejectReason}
            />
          )}
          
          {/* REMOVED p-4 padding from here */}
          <div className="flex-1 overflow-y-auto">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/patients" element={<Patients />} />
                <Route path="/add-patient" element={<AddPatient />} />
                <Route path="/edit-patient/:id" element={<EditPatientModal />} />
                <Route path="/patients/:id" element={<PatientDetails />} />
                <Route path="/requests" element={<RequestsTable />} />
                <Route path="/staffs" element={<Staffs />} />
                <Route path="/add-staff" element={<AddStaff />} />
                <Route path="/edit-staff/:id" element={<EditStaff />} />
                <Route path="/lab/results" element={<AllLabResults />} />
                <Route path="/lab/tests" element={<LabTests />} />
                <Route path="/lab/results/add" element={<AddEditLabResults />} />
                <Route path="/lab/results/edit/:id" element={<AddEditLabResults />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/doctors" element={<Doctors />} />
                <Route path="/add-doctor" element={<AddDoctor />} />
                <Route path="/edit-doctor/:id" element={<EditDoctor />} />
                <Route path="/doctor/:id" element={<ViewDoctor />} />
                <Route path="/pharmacy" element={<Pharmacy />} />
                <Route path="/product/:id" element={<ViewProduct />} />
                <Route path="/appointments/consultation" element={<Consultation />} />
                <Route path="/appointments/medical-history" element={<ViewMedicalHistory />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/laboratory" element={<LaboratoryRegistrationForm />} />
                <Route path="/roles" element={<UserPermissions />} />
                <Route path="/permissions/:roleId" element={<PermissionList />} /> 
                <Route path="/visits" element={<Visits />} />
                <Route path="/appointments" element={<Appointments />} />
                <Route path="/email" element={<EmailTemplates />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/ambulance" element={<Ambulance />} />
                <Route path="/blood" element={<BloodBank />} />
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

// import React from 'react'
// import { Uploader } from './components/web/Uploader'

// function App() {
//   return (
//     <div>
//       <Uploader />
//     </div>
//   )
// }

// export default App