// app/service/api.ts
import {
  createApi,
  fetchBaseQuery,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";

interface RefreshResponse {
  token?: string;
  accessToken?: string;
}

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  credentials: "include",
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("accessToken");
    
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
  
  if (result.error && result.error.status === 401) {
    console.log("🔑 401 detected - Attempting refresh...");
    
    const refreshResult = await baseQuery(
      {
        url: "/hospital/refresh",
        method: "POST",
      },
      api,
      extraOptions
    );
    
    if (refreshResult.data) {
      const refreshData = refreshResult.data as RefreshResponse;
      const newToken = refreshData.token || refreshData.accessToken;
      
      if (newToken) {
        localStorage.setItem("accessToken", newToken);
        
        result = await baseQuery(
          {
            ...(typeof args === "string" ? { url: args } : args),
            headers: {
              ...(typeof args !== "string" ? args.headers : {}),
              Authorization: `Bearer ${newToken}`,
            },
          },
          api,
          extraOptions
        );
      } else {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/sign-in";
      }
    } else {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      window.location.href = "/sign-in";
    }
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
  ],
  endpoints: () => ({}),
});

export default api;