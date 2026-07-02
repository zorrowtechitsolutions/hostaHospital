// src/utils/auth.ts
import { jwtDecode } from "jwt-decode";

export interface JwtPayload {
  id: number;
  name: string;
  hospitalName?: string;
  email?: string;
  role: string;
  roleId: number;
  hospitalId?: number;
  doctorId?: number;
  staffId?: number;
  iat: number;
  exp: number;
}

// ================= TOKEN MANAGEMENT =================

export const getToken = (): string | null => {
  return localStorage.getItem("accessToken");
};

export const setToken = (token: string): void => {
  localStorage.setItem("accessToken", token);
};

export const clearToken = (): void => {
  localStorage.removeItem("accessToken");
};

// ================= DECODE TOKEN =================

export const decodeToken = (token?: string | null): JwtPayload | null => {
  try {
    const tokenToDecode = token || getToken();
    if (!tokenToDecode) {
      console.warn("⚠️ No token provided for decoding");
      return null;
    }

    // Method 1: Using jwtDecode library (preferred)
    try {
      const decoded = jwtDecode<JwtPayload>(tokenToDecode);
      console.log("📋 Decoded token (jwtDecode):", decoded);
      return decoded;
    } catch (jwtError) {
      console.warn("⚠️ jwtDecode failed, trying manual decode:", jwtError);
    }

    // Method 2: Manual decode (fallback)
    try {
      const parts = tokenToDecode.split(".");
      if (parts.length !== 3) {
        console.error("❌ Invalid token format: expected 3 parts");
        return null;
      }

      const payload = parts[1];
      const decodedString = atob(payload);
      const decoded = JSON.parse(decodedString);
      console.log("📋 Decoded token (manual):", decoded);
      return decoded as JwtPayload;
    } catch (manualError) {
      console.error("❌ Manual token decode failed:", manualError);
      return null;
    }
  } catch (error) {
    console.error("❌ Token decode error:", error);
    return null;
  }
};

// ================= AUTH USER =================

export const getAuthUser = (): JwtPayload | null => {
  // ✅ First use authData saved during login (has complete user info)
  const authData = localStorage.getItem("authData");

  if (authData) {
    try {
      const parsed = JSON.parse(authData);
      console.log("📋 getAuthUser: Using authData:", parsed);
      return parsed;
    } catch (err) {
      console.error("❌ Invalid authData:", err);
    }
  }

  // ✅ Fallback to JWT decode
  return decodeToken();
};

// ================= HOSPITAL ID HELPER - FIXED =================

export const getHospitalId = (): number | string | null => {
  const auth = getAuthUser();
  
  // ✅ For doctors and staff, use hospitalId from authData
  // ✅ Fallback to id if hospitalId is not available
  return auth?.hospitalId || auth?.id || null;
};

// ================= USER ROLE HELPERS =================

export const getUserRole = (): string | null => {
  const auth = getAuthUser();
  return auth?.role || null;
};

export const getUserRoleId = (): number | null => {
  const auth = getAuthUser();
  return auth?.roleId || null;
};

export const getUserName = (): string | null => {
  const auth = getAuthUser();
  return auth?.name || null;
};

export const getUserEmail = (): string | null => {
  const auth = getAuthUser();
  return auth?.email || null;
};

export const getHospitalName = (): string | null => {
  const auth = getAuthUser();
  return auth?.hospitalName || null;
};

// ================= CHECK IF USER IS DOCTOR =================

export const isDoctor = (): boolean => {
  const role = getUserRole();
  return role === 'doctor';
};

export const isStaff = (): boolean => {
  const role = getUserRole();
  return role === 'staff';
};

export const isHospitalAdmin = (): boolean => {
  const role = getUserRole();
  return role === 'hospital' || role === 'admin';
};

export const isSuperAdmin = (): boolean => {
  const roleId = getUserRoleId();
  return roleId === 1;
};

// ================= AUTH CHECK =================

export const isAuthenticated = (): boolean => {
  const token = getToken();
  if (!token) return false;

  try {
    const decoded = decodeToken(token);
    if (!decoded) return false;
    
    const isExpired = decoded.exp * 1000 < Date.now();
    if (isExpired) {
      console.warn("⏰ Token has expired");
    }
    return !isExpired;
  } catch {
    return false;
  }
};

// ================= TOKEN EXPIRY CHECK =================

export const getTokenExpiry = (): number | null => {
  const token = getToken();
  if (!token) return null;

  try {
    const decoded = decodeToken(token);
    if (!decoded) return null;
    return decoded.exp * 1000; // Convert to milliseconds
  } catch {
    return null;
  }
};

export const isTokenExpired = (): boolean => {
  const expiry = getTokenExpiry();
  if (!expiry) return true;
  return expiry < Date.now();
};

// ================= CLEAR ALL AUTH DATA =================

export const clearAuth = (): void => {
  console.log("🧹 Clearing auth data...");
  
  clearToken();
  localStorage.removeItem("authData");
  localStorage.removeItem("permissions");
  localStorage.removeItem("userData");
  localStorage.removeItem("userRole");
  localStorage.removeItem("roleId");
  localStorage.removeItem("hospitalInfo");
  localStorage.removeItem("hospitalName");
  localStorage.removeItem("doctorId");
  localStorage.removeItem("staffId");
  localStorage.removeItem("superAdminId");
  localStorage.removeItem("refreshToken");
  
  // Optional: Clear session storage
  sessionStorage.clear();
  
  console.log("✅ Auth data cleared successfully");
  
  // Redirect to login page
  window.location.href = "/sign-in";
};

// ================= LOGGING HELPER =================

export const logTokenDetails = (): void => {
  const token = getToken();
  if (!token) {
    console.log("❌ No token found");
    return;
  }

  console.log("🔑 Token Details:");
  console.log("📝 Token:", token.substring(0, 50) + "...");
  
  const decoded = decodeToken(token);
  if (decoded) {
    console.log("📋 Decoded Payload:", decoded);
    console.log("⏰ Expires:", new Date(decoded.exp * 1000).toLocaleString());
    console.log("🕐 Current:", new Date().toLocaleString());
    console.log("⏳ Expired:", decoded.exp * 1000 < Date.now());
  }
};

// ================= DEBUG FUNCTION =================

export const debugAuth = (): void => {
  console.log("=== AUTH DEBUG ===");
  console.log("🔑 Token exists:", !!getToken());
  console.log("👤 Auth User:", getAuthUser());
  console.log("🏥 Hospital ID:", getHospitalId());
  console.log("🎭 User Role:", getUserRole());
  console.log("🔢 Role ID:", getUserRoleId());
  console.log("📧 User Email:", getUserEmail());
  console.log("👤 User Name:", getUserName());
  console.log("🏥 Hospital Name:", getHospitalName());
  console.log("✅ Authenticated:", isAuthenticated());
  console.log("🔐 Token Expired:", isTokenExpired());
  console.log("👨‍⚕️ Is Doctor:", isDoctor());
  console.log("🛡️ Is Super Admin:", isSuperAdmin());
  
  // Log token details
  logTokenDetails();
  console.log("=== END AUTH DEBUG ===");
};