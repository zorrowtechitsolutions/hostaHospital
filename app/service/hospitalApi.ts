// hospitalApi.ts - COMPLETE VERSION with All User Logout Support

import { api } from "./api";
import { tokenManager } from '../../src/utils/fcmTokenManager';

// ============================================
// TYPE DEFINITIONS
// ============================================

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

export interface FCMTokenData {
  deviceId: string;
  platform: string;
  fcmToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  fcmToken?: FCMTokenData | null;
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

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  success?: boolean;
  message?: string;
  error?: string;
}

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

export interface GetHospitalsParams {
  includeDeleted?: boolean;
  search_query?: string;
  page?: number;
  limit?: number;
}

// User data interface for localStorage
export interface UserData {
  id?: string;
  hospitalId?: string;
  doctorId?: string;
  staffId?: string;
  name?: string;
  email?: string;
  role?: string;
  [key: string]: any;
}

// Auth data interface for localStorage
export interface AuthData {
  id?: string;
  userId?: string;
  hospitalId?: string;
  role?: string;
  [key: string]: any;
}

// Logout Parameters
export interface LogoutParams {
  deviceId?: string;
  role?: string;
  id?: string;
  hospitalId?: string;
  useGlobalEndpoint?: boolean;
}

// ============================================
// API ENDPOINTS
// ============================================

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
    // ✅ SINGLE LOGIN ROUTE - Handles ALL users including Super Admin
    // ============================================
    login: builder.mutation<AuthResponse, LoginCredentials>({
      query: (loginData) => {
        const payload: any = {
          email: loginData.email,
          password: loginData.password,
        };

        if (loginData.fcmToken !== undefined && loginData.fcmToken !== null) {
          payload.fcmToken = loginData.fcmToken;
        } else {
          payload.fcmToken = null;
        }

        return {
          url: `/hospital/g-login`,
          method: "POST",
          body: payload,
        };
      },
      transformResponse: (response: AuthResponse) => {
        const token = response.token || response.accessToken;
        if (token) {
          localStorage.setItem("accessToken", token);
        }
        if (response.refreshToken) {
          localStorage.setItem("refreshToken", response.refreshToken);
        }
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
    // ✅ COMPLETE LOGOUT - Handles ALL user types
    // Hospital: /hospital/logout/{hospitalId}
    // Doctor: /doctor/logout/{doctorId}
    // Staff: /staff/logout/{staffId}
    // Super Admin: /users/logout/{superAdminId}
    // ============================================
    logout: builder.mutation<{ message: string; success?: boolean }, LogoutParams | void>({
      query: (params) => {
        // Get all necessary data from localStorage
        let hospitalId = localStorage.getItem('hospitalId') || '';
        let userRole = localStorage.getItem('userRole') || 'hospital';
        let userId = params?.id || '';
        let userData: UserData = {};
        let authData: AuthData = {};
        
        try {
          const parsedUserData = JSON.parse(localStorage.getItem('userData') || '{}');
          userData = parsedUserData as UserData;
        } catch (e) {
          // Silent fail
        }
        
        try {
          const parsedAuthData = JSON.parse(localStorage.getItem('authData') || '{}');
          authData = parsedAuthData as AuthData;
        } catch (e) {
          // Silent fail
        }
        
        // Try to get hospitalId from authData if not found
        if (!hospitalId) {
          hospitalId = authData?.hospitalId || authData?.id || '';
        }
        
        // Try to get userId from multiple sources
        if (!userId) {
          userId = authData?.id || authData?.userId || authData?.hospitalId || '';
        }
        
        if (!userId) {
          userId = userData?.id || userData?.hospitalId || userData?.doctorId || userData?.staffId || '';
        }
        
        if (!userId) {
          try {
            const user = JSON.parse(localStorage.getItem('user') || '{}') as UserData;
            userId = user?.id || user?.hospitalId || user?.doctorId || user?.staffId || '';
          } catch (e) {
            // Silent fail
          }
        }
        
        if (!userId) {
          userId = hospitalId;
        }
        
        // Get role from params or localStorage
        const role = params?.role || userRole || 'hospital';
        
        // Get device ID from params or localStorage
        const deviceIdValue = params?.deviceId || localStorage.getItem('deviceId') || '';
        
        // Determine which endpoint to use
        const useGlobalEndpoint = params?.useGlobalEndpoint !== undefined 
          ? params.useGlobalEndpoint 
          : (role === 'super_admin');
        
        let url = '';
        let body: any = {};
        
        // ✅ Determine the correct endpoint based on role
        if (useGlobalEndpoint && role === 'super_admin') {
          // ✅ Super Admin logout - Uses /users/logout/{id}
          url = `/users/logout/${userId}`;
          body = {
            deviceId: deviceIdValue,
          };
        } else if (role === 'doctor') {
          // ✅ Doctor logout
          const doctorId = params?.id || userId || '';
          url = `/doctor/logout/${doctorId}`;
          body = {
            deviceId: deviceIdValue,
          };
        } else if (role === 'staff') {
          // ✅ Staff logout
          const staffId = params?.id || userId || '';
          url = `/staff/logout/${staffId}`;
          body = {
            deviceId: deviceIdValue,
          };
        } else {
          // ✅ Hospital logout (default)
          const hospitalIdValue = params?.hospitalId || hospitalId || userId || '';
          url = `/hospital/logout/${hospitalIdValue}`;
          body = {
            deviceId: deviceIdValue,
          };
        }
        
        return {
          url: url,
          method: "POST",
          body: body,
        };
      },
      onQueryStarted: async (params, { queryFulfilled }) => {
        try {
          // Get all necessary data
          let hospitalId = localStorage.getItem('hospitalId') || '';
          let userRole = localStorage.getItem('userRole') || 'hospital';
          let userId = params?.id || '';
          let userData: UserData = {};
          let authData: AuthData = {};
          
          try {
            const parsedUserData = JSON.parse(localStorage.getItem('userData') || '{}');
            userData = parsedUserData as UserData;
          } catch (e) {
            // Silent fail
          }
          
          try {
            const parsedAuthData = JSON.parse(localStorage.getItem('authData') || '{}');
            authData = parsedAuthData as AuthData;
          } catch (e) {
            // Silent fail
          }
          
          if (!hospitalId) {
            hospitalId = authData?.hospitalId || authData?.id || '';
          }
          
          if (!userId) {
            userId = authData?.id || authData?.userId || authData?.hospitalId || '';
          }
          
          if (!userId) {
            userId = userData?.id || userData?.hospitalId || userData?.doctorId || userData?.staffId || '';
          }
          
          if (!userId) {
            try {
              const user = JSON.parse(localStorage.getItem('user') || '{}') as UserData;
              userId = user?.id || user?.hospitalId || user?.doctorId || user?.staffId || '';
            } catch (e) {
              // Silent fail
            }
          }
          
          if (!userId) {
            userId = hospitalId;
          }
          
          const role = params?.role || userRole || 'hospital';
          let deviceIdValue = params?.deviceId || localStorage.getItem('deviceId') || '';
          
          // ✅ Try to get deviceId from IndexedDB if not in localStorage
          if (!deviceIdValue) {
            try {
              const tokens = await tokenManager.getDeviceTokens();
              if (tokens && tokens.length > 0) {
                deviceIdValue = tokens[0].deviceId;
              }
            } catch (error) {
              // Silent fail
            }
          }
          
          const useGlobalEndpoint = params?.useGlobalEndpoint !== undefined 
            ? params.useGlobalEndpoint 
            : (role === 'super_admin');
          
          let url = '';
          let body: any = {};
          
          if (useGlobalEndpoint && role === 'super_admin') {
            // ✅ Super Admin logout
            url = `/users/logout/${userId}`;
            body = { deviceId: deviceIdValue };
          } else if (role === 'doctor') {
            const doctorId = params?.id || userId || '';
            url = `/doctor/logout/${doctorId}`;
            body = { deviceId: deviceIdValue };
          } else if (role === 'staff') {
            const staffId = params?.id || userId || '';
            url = `/staff/logout/${staffId}`;
            body = { deviceId: deviceIdValue };
          } else {
            const hospitalIdValue = params?.hospitalId || hospitalId || userId || '';
            url = `/hospital/logout/${hospitalIdValue}`;
            body = { deviceId: deviceIdValue };
          }
          
          // ✅ Wait for backend to delete FCM token from database
          await queryFulfilled;
          
        } catch (error) {
          // ✅ Even if API fails, we still need to clear local data
          // Check if error is an object with status property
          if (error && typeof error === 'object' && 'status' in error) {
            const err = error as { status?: number };
            if (err.status === 401 || err.status === 403) {
              // Authentication error during logout - likely already logged out
            }
          }
        } finally {
          // ✅ Clear local IndexedDB
          try {
            if (tokenManager && typeof tokenManager.deleteDatabase === 'function') {
              await tokenManager.deleteDatabase();
            }
          } catch (dbError) {
            try {
              if (tokenManager && typeof tokenManager.clearAllDeviceTokens === 'function') {
                await tokenManager.clearAllDeviceTokens();
              }
            } catch (e) {
              // Silent fail
            }
          }
          
          // ✅ Clear ALL localStorage items
          const localStorageItems = [
            'accessToken',
            'refreshToken',
            'roleId',
            'userRole',
            'userData',
            'authData',
            'permissions',
            'deviceId',
            'hospitalId',
            'hospitalInfo',
            'superAdminId',
            'doctorId',
            'staffId',
            'staffNumericId',
            'user',
            'token',
            'refresh_token',
            'profilePicture',
            'userImage'
          ];
          
          localStorageItems.forEach(key => {
            localStorage.removeItem(key);
          });
          
          // ✅ Clear sessionStorage
          sessionStorage.clear();
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

// ============================================
// ✅ EXPORT ALL HOOKS
// ============================================

export const {
  // Auth hooks
  useRegisterMutation,
  useLoginMutation,
  useRequestHospitalOtpMutation,
  useVerifyHospitalOtpMutation,
  useRefreshTokenMutation,
  useLogoutMutation,
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