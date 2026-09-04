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
  baseUrl: import.meta.env.VITE_API_URL || "http://localhost:5173/api",
  credentials: "include",

  prepareHeaders: (headers, { endpoint, arg }) => {
    const token = getToken();

    const url =
      typeof arg === "string"
        ? arg
        : arg?.url || "";

    const isRefreshRequest =
      url === "/auth/refresh" ||
      url === "/doctor/refresh" ||
      url === "/hospital/refresh" ||
      url === "/staff/refresh" ||
      publicEndpoints.includes(endpoint as string);

    if (token && !isRefreshRequest) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error?.status !== 401) {
    return result;
  }

  // ----------------------------------------
  // Determine logged-in user's role
  // ----------------------------------------

  const auth = getAuthUser();
  const userRole = localStorage.getItem("userRole");

  const role = auth?.role || userRole;

  // ----------------------------------------
  // Select correct refresh endpoint
  // ----------------------------------------

  let refreshUrl = "/auth/refresh";

  if (role === "doctor") {
    refreshUrl = "/doctor/refresh";
  } else if (role === "staff") {
    refreshUrl = "/staff/refresh";
  } else if (role === "hospital") {
    refreshUrl = "/hospital/refresh";
  } else if (role === "super_admin") {
    refreshUrl = "/auth/refresh";
  }

  // ----------------------------------------
  // Refresh access token
  // ----------------------------------------

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

      // ----------------------------------------
      // Retry original request
      // prepareHeaders() will automatically
      // attach the new access token.
      // ----------------------------------------

      result = await baseQuery(args, api, extraOptions);

      return result;
    }
  }

  // ----------------------------------------
  // Refresh token expired / invalid
  // ----------------------------------------

  clearAuth();

  return {
    error: {
      status: 401,
      data: {
        message: "Session expired. Please login again.",
      },
    },
  };
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
    "Donor",
    "Email",
    "Template",
    "SessionHistory",
  ],

  endpoints: () => ({}),
});

export default api;