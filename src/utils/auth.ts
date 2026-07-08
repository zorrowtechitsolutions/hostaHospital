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
  userId?: number;
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
      return null;
    }

    try {
      const decoded = jwtDecode<JwtPayload>(tokenToDecode);
      return decoded;
    } catch {
      try {
        const parts = tokenToDecode.split(".");
        if (parts.length !== 3) {
          return null;
        }

        const payload = parts[1];
        const decodedString = atob(payload);
        const decoded = JSON.parse(decodedString);
        return decoded as JwtPayload;
      } catch {
        return null;
      }
    }
  } catch {
    return null;
  }
};

// ================= AUTH USER =================

export const getAuthUser = (): JwtPayload | null => {
  const authData = localStorage.getItem("authData");

  if (authData) {
    try {
      const parsed = JSON.parse(authData);
      return parsed;
    } catch {
      return decodeToken();
    }
  }

  return decodeToken();
};

// ================= HOSPITAL ID HELPER =================

export const getHospitalId = (): number | string | null => {
  const auth = getAuthUser();
  return auth?.hospitalId || auth?.id || null;
};

// ================= HOSPITAL NAME HELPER =================

export const getHospitalName = (): string | null => {
  const auth = getAuthUser();
  return auth?.hospitalName || null;
};

// ================= USER INFO HELPERS =================

export const getUserName = (): string | null => {
  const auth = getAuthUser();
  return auth?.name || null;
};

export const getUserEmail = (): string | null => {
  const auth = getAuthUser();
  return auth?.email || null;
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

// ================= USER TYPE CHECKS =================

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
    return decoded.exp * 1000 >= Date.now();
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
    return decoded.exp * 1000;
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
  sessionStorage.clear();
  
  window.location.href = "/sign-in";
};