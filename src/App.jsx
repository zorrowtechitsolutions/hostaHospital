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
import TopBar from "./pages/TopBar";
import Dashboard from "./pages/Dashboard";
import Patients from "./components/patients/Patients";
import PatientDetails from "./components/patients/PatientDetails";
import RequestsTable from "./components/Requests/RequestTable";
import AddPatientModal from "./components/patients/AddPatientModal";
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
import PermissionList from "./components/Settings/PermissionList";
import UserPermissions from "./components/Settings/UserPermissions";
import Visits from "./components/visits/Visits";
import Appointments from "./components/Appointment/Appointment";
import ApproveRequestModal from "./components/Requests/ApproveRequestModel";
import RejectRequestModal from "./components/Requests/RejectRequestModel";
import Specialities from "./components/specialities/Specialities";
import { ToastProvider } from "./components/ui/Toast";
import EmailTemplates from "./components/Settings/Email";
import Profile from "./components/MyProfile/Profile";

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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show login/register pages
  if (!isAuthenticated) {
    console.log("Rendering PUBLIC routes");
    return (  
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/sign-in" element={<Login />} />
        <Route path="*" element={<Navigate to="/sign-in" replace />} />
      </Routes>
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
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/patients" element={<Patients />} />
              <Route path="/add-patient" element={<AddPatientModal />} />
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
              <Route path="/permissions/:roleName" element={<PermissionList />} /> 
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
              <Route path="/visits" element={<Visits/>} />
              <Route path="/appointments" element={<Appointments/>} />
              <Route path="/specialities" element={<Specialities />} />
              <Route path="/email" element={<EmailTemplates/>} />
              <Route path="/profile" element={<Profile/>} />
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