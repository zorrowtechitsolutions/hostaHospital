// hospitalApi.ts - SINGLE LOGIN ROUTE (Removed Super Admin separate endpoint)
import { api } from "./api";
import { tokenManager } from '../../src/utils/fcmTokenManager';

// Type definitions
export interface Hospital {
  id: string;
  name: string;
  email: string;
  phone?: string;
  type?: string;
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
  lastPasswordChange?: string;
  isActive?: boolean;
  isDelete?: boolean;
  deleteDate?: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
  fcmToken?: string;
  deviceId?: string;
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

// Change password types
export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  success?: boolean;
  message?: string;
  error?: string;
}

// Forgot Password / Reset Password types
export interface SendOtpData {
  email: string;
}

export interface VerifyOtpData {
  email: string;
  otp: string;
}

export interface ResetPasswordData {
  email: string;
  newPassword: string;
}

export interface OtpResponse {
  success?: boolean;
  message?: string;
  error?: string;
}

export interface ResetPasswordResponse {
  success?: boolean;
  message?: string;
  error?: string;
}

// Super Admin Types - Still needed for response handling
export interface SuperAdmin {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  roleId?: number;
  createdAt?: string;
}

export interface AuthResponse {
  success?: boolean;
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  data?: Hospital | SuperAdmin;
  hospital?: Hospital;
  user?: SuperAdmin;
  message?: string;
  error?: string;
  roleId?: number;
  role?: string;
  roleDetected?: string;
  hospitals?: any[];
}

// Hospital List Response with Pagination
export interface HospitalListResponse {
  success?: boolean;
  data?: Hospital[];
  pagination?: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
  };
}

// Get Hospitals Params
export interface GetHospitalsParams {
  includeDeleted?: boolean;
  search_query?: string;
  page?: number;
  limit?: number;
}

export const hospitalApi = api.injectEndpoints({
  endpoints: (builder) => ({

    // ============================================
    // ✅ REGISTER - Hospital Registration
    // ============================================
    register: builder.mutation<AuthResponse, RegisterData>({
      query: (hospitalData) => ({
        url: `/hospital`,
        method: "POST",
        body: hospitalData,
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

    // ============================================
    // ✅ SINGLE LOGIN ROUTE - Handles ALL users
    // Super Admin, Hospital Admin, Doctor, Staff
    // ALL use the SAME endpoint: /hospital/g-login
    // ============================================
    login: builder.mutation<AuthResponse, LoginCredentials>({
      query: (loginData) => ({
        url: `/hospital/g-login`,  // ✅ SINGLE endpoint for ALL users
        method: "POST",
        body: loginData,  // { email, password, fcmToken?, deviceId? }
      }),
      transformResponse: (response: AuthResponse) => {
        const token = response.token || response.accessToken;
        if (token) {
          localStorage.setItem("accessToken", token);
        }
        if (response.refreshToken) {
          localStorage.setItem("refreshToken", response.refreshToken);
        }
        // ✅ Store roleId for role detection
        if (response.roleId !== undefined) {
          localStorage.setItem("roleId", String(response.roleId));
        }
        return response;
      },
      transformErrorResponse: (response: { status: number; data?: any }) => {
        return {
          status: response.status,
          message: response.data?.message || "Login failed",
        };
      },
      invalidatesTags: ["Hospital"],
    }),

    // ============================================
    // PHONE LOGIN - OTP
    // ============================================
    requestHospitalOtp: builder.mutation<{ message: string }, PhoneLoginData>({
      query: (phoneData) => ({
        url: `/hospital/login/phone`,
        method: "POST",
        body: phoneData,
      }),
    }),

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

    // ============================================
    // REFRESH TOKEN
    // ============================================
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

    // ============================================
    // LOGOUT - Clear all local data
    // ============================================
    logout: builder.mutation<{ message: string }, string | void>({
      query: (deviceId) => ({
        url: deviceId ? `/hospital/logout/${deviceId}` : `/hospital/logout`,
        method: "POST",
      }),
      onQueryStarted: async (_arg, { queryFulfilled }) => {
        try {
          await queryFulfilled;
          // ✅ Clear all local storage
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("roleId");
          localStorage.removeItem("userRole");
          localStorage.removeItem("userData");
          localStorage.removeItem("authData");
          localStorage.removeItem("permissions");
          localStorage.removeItem("deviceId");
          localStorage.removeItem("hospitalInfo");
          localStorage.removeItem("superAdminId");
          localStorage.removeItem("doctorId");
          localStorage.removeItem("staffId");
          
          // ✅ Clear IndexedDB tokens
          try {
            await tokenManager.clearAllDeviceTokens();
            console.log('✅ IndexedDB tokens cleared on logout');
          } catch (dbError) {
            console.warn('⚠️ Could not clear IndexedDB tokens:', dbError);
          }
        } catch (error) {
          console.error('❌ Logout error:', error);
        }
      },
    }),

    // ============================================
    // CHANGE PASSWORD
    // ============================================
    changePassword: builder.mutation<ChangePasswordResponse, ChangePasswordData>({
      query: ({ currentPassword, newPassword }) => ({
        url: `/hospital/auth/change-password`,
        method: "PUT",
        body: { currentPassword, newPassword },
      }),
      transformResponse: (response: ChangePasswordResponse) => {
        return response;
      },
      transformErrorResponse: (response: { status: number; data?: any }) => {
        return {
          status: response.status,
          message: response.data?.message || "Failed to change password",
        };
      },
      invalidatesTags: ["Hospital"],
    }),

    // ============================================
    // FORGOT PASSWORD / RESET PASSWORD
    // ============================================
    sendOtp: builder.mutation<OtpResponse, SendOtpData>({
      query: (otpData) => ({
        url: `/hospital/auth/send-otp`,
        method: "POST",
        body: otpData,
      }),
      transformResponse: (response: OtpResponse) => {
        return response;
      },
      transformErrorResponse: (response: { status: number; data?: any }) => {
        return {
          status: response.status,
          message: response.data?.message || "Failed to send OTP",
        };
      },
    }),

    verifyOtp: builder.mutation<OtpResponse, VerifyOtpData>({
      query: (otpData) => ({
        url: `/hospital/auth/verify-otp`,
        method: "POST",
        body: otpData,
      }),
      transformResponse: (response: OtpResponse) => {
        return response;
      },
      transformErrorResponse: (response: { status: number; data?: any }) => {
        return {
          status: response.status,
          message: response.data?.message || "Invalid OTP",
        };
      },
    }),

    resetPassword: builder.mutation<ResetPasswordResponse, ResetPasswordData>({
      query: (resetData) => ({
        url: `/hospital/auth/reset-password`,
        method: "POST",
        body: resetData,
      }),
      transformResponse: (response: ResetPasswordResponse) => {
        return response;
      },
      transformErrorResponse: (response: { status: number; data?: any }) => {
        return {
          status: response.status,
          message: response.data?.message || "Failed to reset password",
        };
      },
    }),

    // ============================================
    // HOSPITAL MANAGEMENT
    // ============================================
    getAllHospitals: builder.query<HospitalListResponse | Hospital[], GetHospitalsParams | void>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        
        if (params?.includeDeleted !== undefined) {
          queryParams.append("includeDeleted", String(params.includeDeleted));
        }
        
        if (params?.search_query) {
          queryParams.append("search_query", params.search_query);
        }
        
        if (params?.page) {
          queryParams.append("page", String(params.page));
        }
        
        if (params?.limit) {
          queryParams.append("limit", String(params.limit));
        }
        
        const url = `/hospital${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        return url;
      },
      providesTags: ["Hospital"],
      transformResponse: (response: HospitalListResponse | Hospital[]) => {
        if (response && 'pagination' in response) {
          return response;
        }
        if (Array.isArray(response)) {
          return {
            data: response,
            pagination: {
              totalItems: response.length,
              totalPages: 1,
              currentPage: 1,
              itemsPerPage: response.length
            }
          };
        }
        return response;
      },
    }),

    getHospitalById: builder.query<{ data?: Hospital } | Hospital, string>({
      query: (id) => `/hospital/${id}`,
      providesTags: (result, error, id) => [{ type: "Hospital", id }],
      transformResponse: (response: { data?: Hospital } | Hospital) => {
        if (response && 'data' in response && response.data) {
          return response.data;
        }
        return response as Hospital;
      },
    }),

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

    updateHospital: builder.mutation<Hospital, { id: string; updateHospital: any }>({
      query: ({ id, updateHospital }) => ({
        url: `/hospital/${id}`,
        method: "PUT",
        body: updateHospital,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Hospital", id }],
    }),

    deleteHospital: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/hospital/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Hospital"],
    }),

    recoverHospital: builder.mutation<
      { success: boolean; message: string; data?: Hospital },
      string
    >({
      query: (id) => ({
        url: `/hospital/recover/${id}`,
        method: "PUT",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Hospital", id },
        "Hospital",
      ],
      transformResponse: (response: { success: boolean; message: string; data?: Hospital }) => {
        return response;
      },
      transformErrorResponse: (response: { status: number; data?: any }) => {
        return {
          status: response.status,
          message: response.data?.message || "Failed to recover hospital",
        };
      },
    }),
  }),
});

// ✅ Export ALL hooks - Only ONE login mutation
export const {
  // Auth hooks
  useRegisterMutation,
  useLoginMutation,        // ✅ SINGLE login for ALL users
  useRequestHospitalOtpMutation,
  useVerifyHospitalOtpMutation,
  useRefreshTokenMutation,
  useLogoutMutation,       // ✅ Renamed from logoutHospital
  useChangePasswordMutation,
  
  // Forgot Password hooks
  useSendOtpMutation,
  useVerifyOtpMutation,
  useResetPasswordMutation,
  
  // Hospital management hooks
  useGetAllHospitalsQuery,
  useGetHospitalByIdQuery,
  useAddNewHospitalMutation,
  useUpdateHospitalMutation,
  useDeleteHospitalMutation,
  useRecoverHospitalMutation,
} = hospitalApi;