// src/components/MyProfile/Profile.jsx
import React from "react";
import { useAuth } from "../../context/AuthContext";

import HospitalProfile from "./HospitalProfile";
import DoctorProfile from "./DoctorProfile";
import StaffProfile from "./StaffProfile";

const Profile = () => {
  const { user } = useAuth();


  return (
    <div>

      {user?.role === "doctor" && <DoctorProfile />}
      {user?.role === "staff" && <StaffProfile />}
      {user?.role === "hospital" && <HospitalProfile />}
    </div>
  );
};

export default Profile;