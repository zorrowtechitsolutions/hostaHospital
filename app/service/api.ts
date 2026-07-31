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
}

const publicEndpoints = [
  "loginDoctor",
  "loginHospital",
  "loginSuperAdmin",
  "refreshDoctor",
  "refreshHospital",
  "refreshStaff",
  "registerHospital",
  "forgotPassword",
  "resetPassword",
  "verifyEmail",
];

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  credentials: "include",
  prepareHeaders: (headers, { endpoint }) => {
    const token = getToken();

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

  if (result.error?.status === 401) {
    const auth = getAuthUser();
    const userRole = localStorage.getItem("userRole");

    let refreshUrl = "/hospital/refresh";

    if (auth?.role === "doctor" || userRole === "doctor") {
      refreshUrl = "/doctor/refresh";
    } else if (auth?.role === "staff" || userRole === "staff") {
      refreshUrl = "/staff/refresh";
    } else if (
      auth?.role === "super_admin" ||
      userRole === "super_admin"
    ) {
      refreshUrl = "/super-admin/refresh";
    }

    console.log("🔄 Refresh URL:", refreshUrl);

    const refreshResult = await baseQuery(
      {
        url: refreshUrl,
        method: "POST",
      },
      api,
      extraOptions
    );

    console.log("✅ Refresh Result:", refreshResult);

    if (refreshResult.data) {
      const data = refreshResult.data as RefreshResponse;
      const newToken = data.token || data.accessToken;

      if (newToken) {
        console.log("✅ New Access Token received");

        localStorage.setItem("accessToken", newToken);

        result = await baseQuery(args, api, extraOptions);

        return result;
      }
    }

    console.error("❌ Refresh failed");
    clearAuth();

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
    "Users",
  ],
  endpoints: () => ({}),
});

export default api;