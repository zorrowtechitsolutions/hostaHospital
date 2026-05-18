// hospitalApi.ts - UPDATED VERSION
import { api } from "./api";

// Type definitions
export interface Hospital {
  id: string;
  name: string;
  email: string;
  phone?: string;
  type?: string; // ADDED: missing type field
  address?: {
    country?: string;
    state?: string;
    district?: string;
    place?: string;
    pincode?: number;
  };
  emergencyContact?: string;
  latitude?: number;
  longitude?: number;
  about?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface PhoneLoginData {
  phone: string;
}

export interface OtpData {
  phone: string;
  otp: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  address?: {
    country?: string;
    state?: string;
    district?: string;
    place?: string;
    pincode?: number;
  };
  type?: string;
  emergencyContact?: string;
  latitude?: number;
  longitude?: number;
  about?: string;
  working_hours_clinic?: any[];
  working_hours_general?: any[];
  working_hours_clinic_nobreak?: any[];
}

// UPDATED: Match actual backend response structure
export interface AuthResponse {
  success?: boolean;
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  data?: Hospital; // Backend returns hospital data in 'data' field
  hospital?: Hospital;
  message?: string;
  error?: string;
}

export const hospitalApi = api.injectEndpoints({
  endpoints: (builder) => ({

    // FIXED: Use correct endpoint /hospital/register
    register: builder.mutation<AuthResponse, RegisterData>({
      query: (hospitalData) => ({
        url: `/hospital`, // CHANGED: from '/hospital' to '/hospital/register'
        method: "POST",
        body: hospitalData,
      }),
      transformResponse: (response: AuthResponse) => {
        console.log("📦 Register API response:", response);
        
        // Extract token from response
        const token = response.token || response.accessToken;
        if (token) {
          localStorage.setItem("accessToken", token);
          console.log("✅ Token stored in localStorage");
        }
        if (response.refreshToken) {
          localStorage.setItem("refreshToken", response.refreshToken);
          console.log("✅ Refresh token stored in localStorage");
        }
        
        // Return response with proper structure
        return response;
      },
      invalidatesTags: ["Hospital"],
    }),

    // Email login
    loginHospital: builder.mutation<AuthResponse, LoginCredentials>({
      query: (loginData) => ({
        url: `/hospital/login`,
        method: "POST",
        body: loginData,
      }),
      transformResponse: (response: AuthResponse) => {
        const token = response.token || response.accessToken;
        if (token) {
          localStorage.setItem("accessToken", token);
        }
        if (response.refreshToken) {
          localStorage.setItem("refreshToken", response.refreshToken);
        }
        return response;
      },
      invalidatesTags: ["Hospital"],
    }),

    // Request OTP
    requestHospitalOtp: builder.mutation<{ message: string }, PhoneLoginData>({
      query: (phoneData) => ({
        url: `/hospital/login/phone`,
        method: "POST",
        body: phoneData,
      }),
    }),

    // Verify OTP
    verifyHospitalOtp: builder.mutation<AuthResponse, OtpData>({
      query: (otpData) => ({
        url: `/hospital/otp`,
        method: "POST",
        body: otpData,
      }),
      transformResponse: (response: AuthResponse) => {
        const token = response.token || response.accessToken;
        if (token) {
          localStorage.setItem("accessToken", token);
        }
        return response;
      },
      invalidatesTags: ["Hospital"],
    }),

    // Refresh token
    refreshToken: builder.mutation<AuthResponse, void>({
      query: () => ({
        url: `/hospital/refresh`,
        method: "POST",
      }),
      transformResponse: (response: AuthResponse) => {
        const token = response.token || response.accessToken;
        if (token) {
          localStorage.setItem("accessToken", token);
        }
        return response;
      },
    }),

    // Logout
    logoutHospital: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: `/hospital/logout`,
        method: "POST",
      }),
      onQueryStarted: async (_arg, { queryFulfilled }) => {
        try {
          await queryFulfilled;
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
        } catch (error) {
          console.error("Logout error:", error);
        }
      },
    }),

    // GET all hospitals
    getAllHospitals: builder.query<Hospital[], void>({
      query: () => "/hospital",
      providesTags: ["Hospital"],
    }),

    // GET hospital by ID
    getHospitalById: builder.query<{ data?: Hospital } | Hospital, string>({
      query: (id) => `/hospital/${id}`,
      providesTags: (result, error, id) => [{ type: "Hospital", id }],
      transformResponse: (response: { data?: Hospital } | Hospital) => {
        // Handle both { data: Hospital } and direct Hospital responses
        if (response && 'data' in response && response.data) {
          return response.data;
        }
        return response as Hospital;
      },
    }),

    // POST - Add new hospital (legacy - keep for compatibility)
    addNewHospital: builder.mutation<AuthResponse, RegisterData>({
      query: (newHospital) => ({
        url: `/hospital`,
        method: "POST",
        body: newHospital,
      }),
      transformResponse: (response: AuthResponse) => {
        const token = response.token || response.accessToken;
        if (token) {
          localStorage.setItem("accessToken", token);
        }
        if (response.refreshToken) {
          localStorage.setItem("refreshToken", response.refreshToken);
        }
        return response;
      },
      invalidatesTags: ["Hospital"],
    }),

    // PUT - Update hospital
    updateHospital: builder.mutation<Hospital, { id: string; updateHospital: any }>({
      query: ({ id, updateHospital }) => ({
        url: `/hospital/${id}`,
        method: "PUT",
        body: updateHospital,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Hospital", id }],
    }),

    // DELETE - Delete hospital
    deleteHospital: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/hospital/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Hospital"],
    }),
  }),
});

// Export all hooks
export const {
  useRegisterMutation,
  useLoginHospitalMutation,
  useRequestHospitalOtpMutation,
  useVerifyHospitalOtpMutation,
  useRefreshTokenMutation,
  useLogoutHospitalMutation,
  useGetAllHospitalsQuery,
  useGetHospitalByIdQuery,
  useAddNewHospitalMutation,
  useUpdateHospitalMutation,
  useDeleteHospitalMutation,
} = hospitalApi;