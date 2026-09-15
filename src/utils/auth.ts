// src/utils/auth.ts

import { jwtDecode } from "jwt-decode";

export interface JwtPayload {
  id: number;

  name?: string;

  hospitalName?: string;

  email?: string;

  role: string;

  roleId: number;

  hospitalId?: number;

  doctorId?: number;

  staffId?: number;

  superadminId?: number;

  userId?: number;

  iat: number;

  exp: number;
}

/*
|--------------------------------------------------------------------------
| Get Access Token
|--------------------------------------------------------------------------
*/

export const getToken = (): string | null => {
  return localStorage.getItem("accessToken");
};

/*
|--------------------------------------------------------------------------
| Save Access Token
|--------------------------------------------------------------------------
*/

export const setToken = (token: string): void => {
  localStorage.setItem("accessToken", token);
};

/*
|--------------------------------------------------------------------------
| Remove Access Token
|--------------------------------------------------------------------------
*/

export const clearToken = (): void => {
  localStorage.removeItem("accessToken");
};

/*
|--------------------------------------------------------------------------
| Decode Token
|--------------------------------------------------------------------------
*/

export const decodeToken = (
  token?: string | null
): JwtPayload | null => {
  const accessToken = token || getToken();

  if (!accessToken) {
    return null;
  }

  try {
    return jwtDecode<JwtPayload>(accessToken);
  } catch (error) {
    console.error(
      "Failed to decode token:",
      error
    );

    return null;
  }
};

/*
|--------------------------------------------------------------------------
| Get Auth User
|--------------------------------------------------------------------------
*/

export const getAuthUser = (): JwtPayload | null => {
  const authData =
    localStorage.getItem("authData");

  if (authData) {
    try {
      return JSON.parse(authData);
    } catch {
      return decodeToken();
    }
  }

  return decodeToken();
};

/*
|--------------------------------------------------------------------------
| Get Hospital ID
|--------------------------------------------------------------------------
*/

export const getHospitalId = (): number | null => {
  const auth = getAuthUser();

  if (!auth?.hospitalId) {
    return null;
  }

  const hospitalId = Number(
    auth.hospitalId
  );

  return Number.isNaN(hospitalId)
    ? null
    : hospitalId;
};

/*
|--------------------------------------------------------------------------
| Get Hospital Name
|--------------------------------------------------------------------------
*/

export const getHospitalName = (): string | null => {
  const auth = getAuthUser();

  return auth?.hospitalName || null;
};

/*
|--------------------------------------------------------------------------
| Get User Name
|--------------------------------------------------------------------------
*/

export const getUserName = (): string | null => {
  const auth = getAuthUser();

  return auth?.name || null;
};

/*
|--------------------------------------------------------------------------
| Get User Email
|--------------------------------------------------------------------------
*/

export const getUserEmail = (): string | null => {
  const auth = getAuthUser();

  return auth?.email || null;
};

/*
|--------------------------------------------------------------------------
| Get User Role
|--------------------------------------------------------------------------
*/

export const getUserRole = (): string | null => {
  const auth = getAuthUser();

  return auth?.role || null;
};

/*
|--------------------------------------------------------------------------
| Get User Role ID
|--------------------------------------------------------------------------
*/

export const getUserRoleId = (): number | null => {
  const auth = getAuthUser();

  return auth?.roleId ?? null;
};

/*
|--------------------------------------------------------------------------
| User Type Checks
|--------------------------------------------------------------------------
*/

export const isDoctor = (): boolean => {
  const role = getUserRole();

  return role === "doctor";
};

export const isStaff = (): boolean => {
  const role = getUserRole();

  return role === "staff";
};

export const isHospitalAdmin = (): boolean => {
  const role = getUserRole();

  return (
    role === "hospital" ||
    role === "admin"
  );
};

export const isSuperAdmin = (): boolean => {
  const roleId = getUserRoleId();

  return roleId === 1;
};

/*
|--------------------------------------------------------------------------
| Authentication Check
|--------------------------------------------------------------------------
*/

export const isAuthenticated = (): boolean => {
  return !!getToken();
};

/*
|--------------------------------------------------------------------------
| Get Token Expiry
|--------------------------------------------------------------------------
*/

export const getTokenExpiry = (): number | null => {
  const token = getToken();

  if (!token) {
    return null;
  }

  try {
    const decoded = decodeToken(token);

    if (!decoded?.exp) {
      return null;
    }

    return decoded.exp * 1000;
  } catch {
    return null;
  }
};

/*
|--------------------------------------------------------------------------
| Check Token Expired
|--------------------------------------------------------------------------
|
| Returns true if:
|   - no token exists
|   - token has no exp claim
|   - token is expired
|   - token will expire within the next 5 seconds
|
| The 5-second safety buffer prevents sending a token
| that would expire mid-flight.
|
*/

const EXPIRY_BUFFER_MS = 5_000;

export const isTokenExpired = (): boolean => {
  const expiry = getTokenExpiry();

  if (!expiry) {
    return true;
  }

  return expiry < Date.now() + EXPIRY_BUFFER_MS;
};

/*
|--------------------------------------------------------------------------
| Clear Authentication
|--------------------------------------------------------------------------
|
| Removes all localStorage + sessionStorage auth keys.
|
| NOTE:
| The real refreshToken lives in an HttpOnly cookie
| and CANNOT be cleared from JavaScript. Only the
| backend can clear it, via /auth/logout responding with:
|
|   Set-Cookie: refreshToken=; Max-Age=0
|
| The refreshToken / refresh_token entries below are only
| for cleaning up legacy localStorage values.
|
*/

export const clearAuth = (): void => {

  /*
   * Access token
   */
  clearToken();

  /*
   * Authentication data
   */
  localStorage.removeItem(
    "authData"
  );

  localStorage.removeItem(
    "permissions"
  );

  localStorage.removeItem(
    "userData"
  );

  localStorage.removeItem(
    "userRole"
  );

  localStorage.removeItem(
    "roleId"
  );

  /*
   * Hospital data
   */
  localStorage.removeItem(
    "hospitalInfo"
  );

  localStorage.removeItem(
    "hospitalName"
  );

  localStorage.removeItem(
    "hospitalId"
  );

  /*
   * User IDs
   */
  localStorage.removeItem(
    "authId"
  );

  localStorage.removeItem(
    "userId"
  );

  localStorage.removeItem(
    "doctorId"
  );

  localStorage.removeItem(
    "staffId"
  );

  localStorage.removeItem(
    "superAdminId"
  );

  /*
   * Device data
   */
  localStorage.removeItem(
    "deviceId"
  );

  /*
   * Old token keys
   */
  localStorage.removeItem(
    "token"
  );

  /*
   * Refresh token keys
   *
   * The actual refresh token should be
   * managed by the backend as an
   * HttpOnly cookie.
   *
   * These are removed only for compatibility
   * with old localStorage data.
   */
  localStorage.removeItem(
    "refreshToken"
  );

  localStorage.removeItem(
    "refresh_token"
  );

  /*
   * Profile images
   */
  localStorage.removeItem(
    "profilePicture"
  );

  localStorage.removeItem(
    "userImage"
  );

  /*
   * Clear session storage
   */
  sessionStorage.clear();
};