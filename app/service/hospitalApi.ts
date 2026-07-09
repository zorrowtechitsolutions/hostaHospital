// hospitalApi.ts - COMPLETE VERSION with Working Hours Support

import { api } from "./api";
import { tokenManager } from '../../src/utils/fcmTokenManager';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface WorkingHours {
  monday: { open: string; close: string; closed: boolean };
  tuesday: { open: string; close: string; closed: boolean };
  wednesday: { open: string; close: string; closed: boolean };
  thursday: { open: string; close: string; closed: boolean };
  friday: { open: string; close: string; closed: boolean };
  saturday: { open: string; close: string; closed: boolean };
  sunday: { open: string; close: string; closed: boolean };
}

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
  workingHours?: WorkingHours;
  working_hours_general?: any[];
  working_hours_clinic?: any[];
  working_hours_clinic_nobreak?: any[];
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

// ✅ UPDATED RegisterData interface with new fields
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
  workingHours?: WorkingHours;
  workingHourType?: string;  // ✅ Added
  workingHoursData?: any[];  // ✅ Added for API-formatted data
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
// WORKING HOURS HELPER FUNCTIONS (Internal)
// ============================================

/**
 * Convert "10:00" to "10:00 AM" format
 */
const convertTo12HourFormat = (time: string | undefined): string => {
  if (!time) return '09:00 AM';
  
  // If already in 12-hour format, return as is
  if (time.includes('AM') || time.includes('PM')) {
    return time;
  }
  
  const parts = time.split(':');
  if (parts.length < 2) return '09:00 AM';
  
  const hours = parseInt(parts[0], 10);
  const minutes = parts[1] || '00';
  
  if (isNaN(hours)) return '09:00 AM';
  
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
};

/**
 * Convert "10:00 AM" to "10:00" format
 */
const convertTo24HourFormat = (time: string | undefined): string => {
  if (!time) return '09:00';
  
  // If already in 24-hour format, return as is
  if (!time.includes('AM') && !time.includes('PM')) {
    return time;
  }
  
  const parts = time.split(' ');
  if (parts.length < 2) return '09:00';
  
  const timePart = parts[0];
  const period = parts[1];
  const timeParts = timePart.split(':');
  
  if (timeParts.length < 2) return '09:00';
  
  let hours = parseInt(timeParts[0], 10);
  const minutes = timeParts[1] || '00';
  
  if (isNaN(hours)) return '09:00';
  
  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

/**
 * Map frontend working hours object to API array format
 */
const mapFrontendToApiWorkingHours = (frontendHours: WorkingHours | null | undefined): any[] => {
  if (!frontendHours) return [];
  
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  return days.map(day => {
    const dayData = frontendHours[day as keyof WorkingHours];
    return {
      day: day,
      is_holiday: dayData?.closed || false,
      opening_time: convertTo24HourFormat(dayData?.open || '09:00 AM'),
      closing_time: convertTo24HourFormat(dayData?.close || '06:00 PM'),
    };
  });
};

// ============================================
// API ENDPOINTS
// ============================================

export const hospitalApi = api.injectEndpoints({
  endpoints: (builder) => ({

    // ============================================
    // ✅ REGISTER - Hospital Registration (UPDATED)
    // ============================================
    register: builder.mutation<AuthResponse, RegisterData>({
      query: (hospitalData) => {
        const body: any = {
          name: hospitalData.name,
          email: hospitalData.email,
          password: hospitalData.password,
          phone: hospitalData.phone,
        };
        
        if (hospitalData.address) body.address = hospitalData.address;
        if (hospitalData.type) body.type = hospitalData.type;
        if (hospitalData.emergencyContact) body.emergencyContact = hospitalData.emergencyContact;
        if (hospitalData.latitude) body.latitude = hospitalData.latitude;
        if (hospitalData.longitude) body.longitude = hospitalData.longitude;
        if (hospitalData.about) body.about = hospitalData.about;
        
        // ✅ NEW: Send ONLY the selected working hours type data
        const workingHourType = hospitalData.workingHourType || 'normal';
        
        if (hospitalData.workingHoursData && hospitalData.workingHoursData.length > 0) {
          // Send ONLY the selected type based on workingHourType
          if (workingHourType === 'normal') {
            body.working_hours_general = hospitalData.workingHoursData;
            body.working_hours_clinic = [];
            body.working_hours_clinic_nobreak = [];
          } else if (workingHourType === 'clinic') {
            body.working_hours_clinic = hospitalData.workingHoursData;
            body.working_hours_general = [];
            body.working_hours_clinic_nobreak = [];
          } else if (workingHourType === 'clinic-break') {
            body.working_hours_clinic_nobreak = hospitalData.workingHoursData;
            body.working_hours_general = [];
            body.working_hours_clinic = [];
          }
        } else if (hospitalData.workingHours) {
          // Fallback: use the old method if workingHoursData is not provided
          const apiWorkingHours = mapFrontendToApiWorkingHours(hospitalData.workingHours);
          body.working_hours_general = apiWorkingHours;
          body.working_hours_clinic = apiWorkingHours;
          body.working_hours_clinic_nobreak = apiWorkingHours;
        } else {
          // Send empty arrays if no working hours data
          body.working_hours_general = [];
          body.working_hours_clinic = [];
          body.working_hours_clinic_nobreak = [];
        }
        
        return {
          url: `/hospital`,
          method: "POST",
          body: body,
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
    // ============================================
    logout: builder.mutation<{ message: string; success?: boolean }, LogoutParams | void>({
      query: (params) => {
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
        const deviceIdValue = params?.deviceId || localStorage.getItem('deviceId') || '';
        const useGlobalEndpoint = params?.useGlobalEndpoint !== undefined 
          ? params.useGlobalEndpoint 
          : (role === 'super_admin');
        
        let url = '';
        let body: any = {};
        
        if (useGlobalEndpoint && role === 'super_admin') {
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
        
        return {
          url: url,
          method: "POST",
          body: body,
        };
      },
      onQueryStarted: async (params, { queryFulfilled }) => {
        try {
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
          
          await queryFulfilled;
          
        } catch (error) {
          if (error && typeof error === 'object' && 'status' in error) {
            const err = error as { status?: number };
            if (err.status === 401 || err.status === 403) {
              // Authentication error during logout - likely already logged out
            }
          }
        } finally {
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
      query: (newHospital) => {
        const body: any = {
          name: newHospital.name,
          email: newHospital.email,
          password: newHospital.password,
          phone: newHospital.phone,
        };
        
        if (newHospital.address) body.address = newHospital.address;
        if (newHospital.type) body.type = newHospital.type;
        if (newHospital.emergencyContact) body.emergencyContact = newHospital.emergencyContact;
        if (newHospital.latitude) body.latitude = newHospital.latitude;
        if (newHospital.longitude) body.longitude = newHospital.longitude;
        if (newHospital.about) body.about = newHospital.about;
        
        // ✅ NEW: Send ONLY the selected working hours type data
        const workingHourType = newHospital.workingHourType || 'normal';
        
        if (newHospital.workingHoursData && newHospital.workingHoursData.length > 0) {
          if (workingHourType === 'normal') {
            body.working_hours_general = newHospital.workingHoursData;
            body.working_hours_clinic = [];
            body.working_hours_clinic_nobreak = [];
          } else if (workingHourType === 'clinic') {
            body.working_hours_clinic = newHospital.workingHoursData;
            body.working_hours_general = [];
            body.working_hours_clinic_nobreak = [];
          } else if (workingHourType === 'clinic-break') {
            body.working_hours_clinic_nobreak = newHospital.workingHoursData;
            body.working_hours_general = [];
            body.working_hours_clinic = [];
          }
        } else if (newHospital.workingHours) {
          // Fallback: use the old method
          const apiWorkingHours = mapFrontendToApiWorkingHours(newHospital.workingHours);
          body.working_hours_general = apiWorkingHours;
          body.working_hours_clinic = apiWorkingHours;
          body.working_hours_clinic_nobreak = apiWorkingHours;
        } else {
          body.working_hours_general = [];
          body.working_hours_clinic = [];
          body.working_hours_clinic_nobreak = [];
        }
        
        return {
          url: `/hospital`,
          method: "POST",
          body: body,
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
        return response;
      },
      invalidatesTags: ["Hospital"],
    }),

    // ✅ UPDATED: Include workingHours in the update with proper API format
    updateHospital: builder.mutation<Hospital, { id: string; updateHospital: any }>({
      query: ({ id, updateHospital }) => {
        const body: any = {
          name: updateHospital.name,
          email: updateHospital.email,
          type: updateHospital.type,
          phone: updateHospital.phone,
        };
        
        if (updateHospital.address) {
          body.address = updateHospital.address;
        }
        
        // ✅ NEW: Handle working hours update based on type
        if (updateHospital.workingHoursData && updateHospital.workingHoursData.length > 0) {
          const workingHourType = updateHospital.workingHourType || 'normal';
          
          if (workingHourType === 'normal') {
            body.working_hours_general = updateHospital.workingHoursData;
            body.working_hours_clinic = [];
            body.working_hours_clinic_nobreak = [];
          } else if (workingHourType === 'clinic') {
            body.working_hours_clinic = updateHospital.workingHoursData;
            body.working_hours_general = [];
            body.working_hours_clinic_nobreak = [];
          } else if (workingHourType === 'clinic-break') {
            body.working_hours_clinic_nobreak = updateHospital.workingHoursData;
            body.working_hours_general = [];
            body.working_hours_clinic = [];
          }
        } else if (updateHospital.workingHours) {
          // Fallback: use the old method
          const apiWorkingHours = mapFrontendToApiWorkingHours(updateHospital.workingHours);
          body.working_hours_general = apiWorkingHours;
          body.working_hours_clinic = apiWorkingHours;
          body.working_hours_clinic_nobreak = apiWorkingHours;
        }
        
        // Include any other fields that might be in the update
        if (updateHospital.emergencyContact) body.emergencyContact = updateHospital.emergencyContact;
        if (updateHospital.latitude !== undefined) body.latitude = updateHospital.latitude;
        if (updateHospital.longitude !== undefined) body.longitude = updateHospital.longitude;
        if (updateHospital.about) body.about = updateHospital.about;
        
        return {
          url: `/hospital/${id}`,
          method: "PUT",
          body: body,
        };
      },
      invalidatesTags: (result, error, { id }) => [{ type: "Hospital", id }],
      transformResponse: (response: Hospital) => {
        return response;
      },
      transformErrorResponse: (response: { status: number; data?: any }) => {
        return {
          status: response.status,
          message: response.data?.message || "Failed to update hospital",
        };
      },
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