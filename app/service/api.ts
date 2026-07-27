// src/app/service/api.ts
import {
  createApi,
  fetchBaseQuery,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";

import { getToken, clearAuth, getAuthUser } from "../../src/utils/auth";

interface RefreshResponse {
  token?: string;
  accessToken?: string;
  refreshToken?: string;
}

// ✅ Define public endpoints that should NOT include Authorization header
const publicEndpoints = [
  // Auth endpoints
  "login",
  "register",
  "forgotPassword",
  "resetPassword",
  "verifyEmail",
  "sendOtp",
  "verifyOtp",
  "requestHospitalOtp",
  "verifyHospitalOtp",
  
  // Public hospital endpoints
  "getAllHospitals",
  "getHospitalById",
  
  // Public category endpoints
  "getCategories",
  "getCategoryById",
  
  // Health check / public info
  "healthCheck",
  "getPublicInfo",
];

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  credentials: "include",
  prepareHeaders: (headers, { endpoint }) => {
    const token = getToken();

    // ✅ Only add Authorization header for non-public endpoints
    if (token && !publicEndpoints.includes(endpoint as string)) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    headers.set("Content-Type", "application/json");

    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  // ✅ Handle 401 Unauthorized - Token expired
  if (result.error?.status === 401) {
    // Get user role to determine refresh endpoint
    const auth = getAuthUser();
    const userRole = localStorage.getItem("userRole");
    
    // Determine refresh URL based on role
    let refreshUrl = "/auth/refresh";
    
    if (auth?.role === "doctor" || userRole === "doctor") {
      refreshUrl = "/auth/refresh";
    } else if (auth?.role === "staff" || userRole === "staff") {
      refreshUrl = "/auth/refresh";
    } else if (auth?.role === "super_admin" || userRole === "super_admin") {
      refreshUrl = "/auth/refresh";
    }

    const refreshResult = await baseQuery(
      {
        url: refreshUrl,
        method: "POST",
      },
      api,
      extraOptions
    );

    if (refreshResult.data) {
      const data = refreshResult.data as RefreshResponse;
      const newToken = data.token || data.accessToken;

      if (newToken) {
        localStorage.setItem("accessToken", newToken);

        // ✅ Retry original request with new token
        if (args && typeof args === 'object' && 'headers' in args) {
          args.headers = {
            ...args.headers,
            'Authorization': `Bearer ${newToken}`,
          };
        }

        result = await baseQuery(args, api, extraOptions);
        return result;
      }
    }

    // ❌ Refresh failed - clear auth and return error
    console.error("❌ Token refresh failed, logging out...");
    clearAuth();

    // Dispatch logout action if needed
    // api.dispatch(logout());

    return {
      error: {
        status: 401,
        data: {
          message: "Session expired. Please login again.",
        },
      },
    };
  }

  return result;
};

export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Hospital",
    "Staff",
    "Patient",
    "Appointment",
    "Doctor",
    "Department",
    "Ambulance",
    "BloodBank",
    "Booking",
    "Role",
    "RolePermission",
    "S3",
    "Prescription",
    "speciality",
    "Vitals",
    "PrescriptionTemplate",
    "Permission",
    "Notification",
    "Notifications",
    "Ads",
    "Document",
    "LabResult",
    "Reviews",
    "Category",
    "emailEnquiry",
    "Users"
  ],
  endpoints: () => ({}),
});

export default api;