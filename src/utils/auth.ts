// src/utils/auth.ts
import { jwtDecode } from "jwt-decode";

export interface JwtPayload {
  id: number;
  name: string;
  hospitalName?: string;
  email?: string;
  role: string;
  roleId: number;
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

// ================= AUTH USER (FROM JWT) =================

export const getAuthUser = (): JwtPayload | null => {
  const token = getToken();

  if (!token) return null;

  try {
    const decoded = jwtDecode<JwtPayload>(token);
    return decoded;
  } catch (error) {
    console.error("Invalid token:", error);
    clearToken();
    return null;
  }
};

// ================= HOSPITAL ID HELPER =================

export const getHospitalId = (): number | string | null => {
  const auth = getAuthUser();
  return auth?.id || null;
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

export const getUserRole = (): string | null => {
  const auth = getAuthUser();
  return auth?.role || null;
};

export const getUserEmail = (): string | null => {
  const auth = getAuthUser();
  return auth?.email || null;
};

// ================= AUTH CHECK =================

export const isAuthenticated = (): boolean => {
  const token = getToken();
  if (!token) return false;

  try {
    const decoded = jwtDecode<JwtPayload>(token);
    const isExpired = decoded.exp * 1000 < Date.now();
    return !isExpired;
  } catch {
    return false;
  }
};

// ================= CLEAR ALL AUTH DATA =================

export const clearAuth = (): void => {
  clearToken();
  // Redirect to login page
  window.location.href = "/sign-in";
};