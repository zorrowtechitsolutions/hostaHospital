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

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  credentials: "include",
  prepareHeaders: (headers) => {
    const token = getToken();
    if (token) {
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
    // Get user role to determine refresh endpoint
    const auth = getAuthUser();
    
    let refreshUrl = "/hospital/refresh";
    
    if (auth?.role === "doctor") {
      refreshUrl = "/doctor/refresh";
    } else if (auth?.role === "staff") {
      refreshUrl = "/staff/refresh";
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

        if (data.refreshToken) {
          localStorage.setItem("refreshToken", data.refreshToken);
        }

        // Retry original request with new token
        result = await baseQuery(args, api, extraOptions);
        return result;
      }
    }

    // Refresh failed - clear auth and return error
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
    "Users"
  ],
  endpoints: () => ({}),
});

export default api;