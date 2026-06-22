// src/components/MyProfile/Profile.jsx
import React from "react";
import { useAuth } from "../../context/AuthContext";

import HospitalProfile from "./HospitalProfile";
import DoctorProfile from "./DoctorProfile";
import StaffProfile from "./StaffProfile";

const Profile = () => {
  const { user } = useAuth();
  
  // Debug logs
  console.log("🔍 PROFILE ROUTER LOADED");
  console.log("📌 User Role:", user?.role);
  console.log("👤 User Data:", user);

  if (user?.role === "doctor") {
    console.log("✅ Rendering DOCTOR Profile");
    return <DoctorProfile />;
  }
  
  if (user?.role === "staff") {
    console.log("✅ Rendering STAFF Profile");
    return <StaffProfile />;
  }

  console.log("✅ Rendering HOSPITAL Profile (default)");
  return <HospitalProfile />;
};

export default Profile;