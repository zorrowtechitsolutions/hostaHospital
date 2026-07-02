import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({
  children,
  permissionId = null,
  requireSuperAdmin = false,
}) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#154A7D]"></div>
      </div>
    );
  }

  // Login check
  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace />;
  }

  // Super Admin check
  if (requireSuperAdmin) {
    const roleId = Number(localStorage.getItem("roleId"));
    const userRole = localStorage.getItem("userRole");
    
    if (roleId !== 1 && userRole !== "super_admin") {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Permission check
  if (permissionId) {
    const permissions = JSON.parse(
      localStorage.getItem("permissions") || "[]"
    );

    const hasPermission = permissions.some(
      (item) => item.permissionId === permissionId
    );

    if (!hasPermission) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;