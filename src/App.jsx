// App.jsx
import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth, AuthProvider } from "./context/AuthContext";

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

function App() {
  const { isAuthenticated, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState("light");
  const location = useLocation();

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
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/sign-in" replace />} />
      </Routes>
    );
  }

  // If authenticated, show main app
  console.log("Rendering PROTECTED routes");
  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <Sidebar sidebarOpen={sidebarOpen} />
      
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <TopBar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          theme={theme}
          setTheme={setTheme}
        />
        
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
            <Route path="/settings" element={<Settings />} />
            <Route path="/roles" element={<UserPermissions />} />
            <Route path="/permissions/:roleName" element={<PermissionList />} /> 
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
            <Route path="/visits" element={<Visits/>} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default function AppWrapper() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}