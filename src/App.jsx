import { useState } from "react";
import { Routes, Route } from "react-router-dom";

import Sidebar from "./pages/Sidebar";
import TopBar from "./pages/TopBar";

import Dashboard from "./pages/Dashboard";
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
import LaboratoryRegistrationForm from "./components/Laboratory/LaboratoryRegistrationForm";
import NotificationsPage from "./components/Notification/NotificationsPage";
import PermissionList from "./components/Settings/PermissionList";
import UserPermissions from "./components/Settings/UserPermissions";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState("light");

  return (
<div className="flex h-screen bg-gray-50 font-sans">
  <Sidebar sidebarOpen={sidebarOpen} />

  <div
    className={`flex-1 flex flex-col transition-all duration-300 ${
      sidebarOpen ? "ml-64" : "ml-20"
    }`}
  >
    <TopBar
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
      theme={theme}
      setTheme={setTheme}
    />

    {/* FIXED */}
    <div className="flex-1 pt-16 overflow-y-auto">
      <Routes>
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
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
      </Routes>
    </div>
  </div>
</div>

);
}

export default App;