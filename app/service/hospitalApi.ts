// hospitalApi.ts - COMPLETE VERSION with Super Admin FCM Token Handling

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
  fcmToken?: FCMTokenData | null;  // ✅ Allow null for Super Admin
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
        // ✅ For Super Admin, ensure fcmToken is null
        // The Login component will determine if this is a Super Admin login
        // and set fcmToken accordingly
        
        const payload: any = {
          email: loginData.email,
          password: loginData.password,
        };

        // ✅ Only include fcmToken if it exists and is not null
        if (loginData.fcmToken !== undefined && loginData.fcmToken !== null) {
          payload.fcmToken = loginData.fcmToken;
        } else {
          // ✅ Explicitly set fcmToken to null for Super Admin
          payload.fcmToken = null;
        }

        console.log('📤 Login request payload:', {
          email: payload.email,
          password: '******',
          fcmToken: payload.fcmToken === null ? 'null (Super Admin)' : 'present'
        });

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
    // ✅ LOGOUT - Uses hospital ID in URL, deviceId in body
    // ============================================
    logout: builder.mutation<{ message: string }, string | void>({
      query: (deviceId) => {
        // ✅ Get hospital ID from localStorage
        let hospitalId = localStorage.getItem('hospitalId') || '';
        
        if (!hospitalId) {
          try {
            const authData = JSON.parse(localStorage.getItem('authData') || '{}');
            hospitalId = authData?.hospitalId || authData?.id || '';
          } catch (e) {
            console.warn('⚠️ Could not get hospitalId from authData');
          }
        }
        
        // ✅ Get device ID
        const deviceIdValue = deviceId || localStorage.getItem('deviceId') || '';
        
        console.log('📤 Logout request:');
        console.log('  URL: /hospital/logout/' + hospitalId);
        console.log('  Body:', { deviceId: deviceIdValue });
        
        return {
          url: `/hospital/logout/${hospitalId}`,
          method: "POST",
          body: {
            deviceId: deviceIdValue,
          },
        };
      },
      onQueryStarted: async (deviceId, { queryFulfilled }) => {
        try {
          // Get hospital ID
          let hospitalId = localStorage.getItem('hospitalId') || '';
          
          if (!hospitalId) {
            try {
              const authData = JSON.parse(localStorage.getItem('authData') || '{}');
              hospitalId = authData?.hospitalId || authData?.id || '';
            } catch (e) {
              console.warn('⚠️ Could not get hospitalId from authData');
            }
          }
          
          // Get device ID
          let deviceIdValue = deviceId || localStorage.getItem('deviceId') || '';
          
          // ✅ Try to get deviceId from IndexedDB if not in localStorage
          if (!deviceIdValue) {
            try {
              const tokens = await tokenManager.getDeviceTokens();
              if (tokens && tokens.length > 0) {
                deviceIdValue = tokens[0].deviceId;
                console.log('🔍 Device ID from IndexedDB:', deviceIdValue);
              }
            } catch (error) {
              console.warn('⚠️ Could not get deviceId from IndexedDB:', error);
            }
          }
          
          console.log('📤 Sending logout request to backend:');
          console.log('  URL: /hospital/logout/' + hospitalId);
          console.log('  Body:', { deviceId: deviceIdValue });
          
          // ✅ Wait for backend to delete FCM token from database
          const response = await queryFulfilled;
          console.log('✅ Backend logout response:', response.data);
          
          // ✅ Clear local IndexedDB
          console.log('🔍 Clearing local IndexedDB...');
          try {
            await tokenManager.deleteDatabase();
            console.log('✅ IndexedDB database deleted successfully');
          } catch (dbError) {
            console.warn('⚠️ Could not delete IndexedDB:', dbError);
            try {
              await tokenManager.clearAllDeviceTokens();
              console.log('✅ IndexedDB tokens cleared');
            } catch (e) {
              console.warn('⚠️ Could not clear tokens:', e);
            }
          }
          
          // ✅ Clear ALL localStorage items
          console.log('🔍 Clearing localStorage...');
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
            'refresh_token'
          ];
          
          localStorageItems.forEach(key => {
            localStorage.removeItem(key);
          });
          console.log('✅ localStorage cleared');
          
          // ✅ Clear sessionStorage
          sessionStorage.clear();
          console.log('✅ sessionStorage cleared');
          
          console.log('✅ Logout complete - backend and local data cleared');
          
        } catch (error) {
          console.error('❌ Logout error:', error);
          
          // ✅ Even if API fails, clear local data
          try {
            await tokenManager.deleteDatabase();
            console.log('✅ IndexedDB deleted despite API error');
          } catch (dbError) {
            console.warn('⚠️ Could not delete IndexedDB:', dbError);
          }
          
          const localStorageItems = [
            'accessToken', 'refreshToken', 'roleId', 'userRole',
            'userData', 'authData', 'permissions', 'deviceId',
            'hospitalId', 'hospitalInfo', 'superAdminId', 'doctorId',
            'staffId', 'staffNumericId', 'user', 'token', 'refresh_token'
          ];
          localStorageItems.forEach(key => localStorage.removeItem(key));
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