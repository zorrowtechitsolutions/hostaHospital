// src/components/MyProfile/Profile.jsx
import React from "react";
import { useAuth } from "../../context/AuthContext";

import HospitalProfile from "./HospitalProfile";
import DoctorProfile from "./DoctorProfile";
import StaffProfile from "./StaffProfile";

const Profile = () => {
  const { user } = useAuth();

  if (user?.role === "doctor") {
    return <DoctorProfile />;
  }
  
  if (user?.role === "staff") {
    return <StaffProfile />;
  }

  return <HospitalProfile />;
};

export default Profile;