// hospitalApi.ts - COMPLETE CLEAN VERSION WITH FIXED LOGOUT
// Working-hours conversion logic in the API layer

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
  authId?: string;
  userId?: string;
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
  workingHourType?: string;
  workingHoursData?: any[];
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
  authId?: string;
  hospitalId?: string;
  id?: string;
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

export interface UserData {
  id?: string;
  authId?: string;
  hospitalId?: string;
  doctorId?: string;
  staffId?: string;
  name?: string;
  email?: string;
  role?: string;
  [key: string]: any;
}

export interface AuthData {
  id?: string;
  authId?: string;
  hospitalId?: string;
  role?: string;
  [key: string]: any;
}

export interface LogoutParams {
  deviceId?: string;
  role?: string;
  authId?: string;
  hospitalId?: string;
  useGlobalEndpoint?: boolean;
}

// ============================================
// TYPE GUARD FUNCTIONS
// ============================================

const isHospital = (data: any): data is Hospital => {
  return !!data && typeof data === 'object' && 'authId' in data;
};

const isSuperAdmin = (data: any): data is SuperAdmin => {
  return !!data && typeof data === 'object' && 'role' in data && !('authId' in data);
};

// ============================================
// WORKING HOURS CONVERSION HELPER
// ============================================

const DAYS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

const convertWorkingHoursToApi = (workingHours: any) => {
  if (!workingHours) return [];

  return DAYS.map(day => ({
    day: day.label,
    opening_time: workingHours[day.key]?.open || "09:00 AM",
    closing_time: workingHours[day.key]?.close || "06:00 PM",
    is_holiday: workingHours[day.key]?.closed || false,
  }));
};

// ============================================
// HELPER: Store dual IDs in localStorage
// ============================================

const storeUserIds = (response: AuthResponse) => {
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

  // Extract and store authId (from Auth table)
  let authId = response.authId || '';
  
  if (!authId && response.user?.id) {
    authId = response.user.id.toString();
  }
  
  if (!authId && response.data) {
    if (isHospital(response.data)) {
      authId = response.data.authId || response.data.userId || '';
    }
  }
  
  if (!authId && response.hospital) {
    authId = response.hospital.authId || response.hospital.userId || '';
  }
  
  if (!authId && response.id) {
    authId = response.id.toString();
  }
  
  if (authId) {
    localStorage.setItem("authId", authId);
    localStorage.setItem("userId", authId);
  }

  // Extract and store hospitalId (from Hospital table)
  let hospitalId = response.hospitalId || '';
  
  if (!hospitalId && response.hospital?.id) {
    hospitalId = response.hospital.id;
  }
  
  if (!hospitalId && response.data) {
    if (isHospital(response.data)) {
      hospitalId = response.data.id || '';
    }
  }
  
  // Ensure hospitalId is a string
  hospitalId = hospitalId?.toString() || '';
  
  if (hospitalId) {
    localStorage.setItem("hospitalId", hospitalId);
  }

  if (response.role) {
    localStorage.setItem("userRole", response.role);
  }

  const userData: UserData = {
    authId: authId,
    hospitalId: hospitalId,
    name: response.hospital?.name || 
          (isHospital(response.data) ? response.data.name : '') ||
          response.user?.name || 
          '',
    email: response.hospital?.email || 
           (isHospital(response.data) ? response.data.email : '') ||
           response.user?.email || 
           '',
    role: response.role || 'hospital',
  };
  
  localStorage.setItem("userData", JSON.stringify(userData));
  
  const authData: AuthData = {
    authId: authId,
    hospitalId: hospitalId,
    role: response.role || 'hospital',
  };
  
  localStorage.setItem("authData", JSON.stringify(authData));

};

const getStoredIds = () => {
  const authId = localStorage.getItem('authId') || '';
  const hospitalId = localStorage.getItem('hospitalId') || '';
  return { authId, hospitalId };
};

// ============================================
// ✅ API ENDPOINTS - Clean RESTful routes
// ============================================

export const hospitalApi = api.injectEndpoints({
  endpoints: (builder) => ({

    // ============================================
    // ✅ REGISTER - /hospital (POST)
    // ============================================
    register: builder.mutation<AuthResponse, RegisterData>({
      query: (hospitalData) => {
        const body: any = {
          name: hospitalData.name,
          email: hospitalData.email,
          password: hospitalData.password,
          phone: hospitalData.phone,
        };
        
        // Optional fields
        if (hospitalData.address) body.address = hospitalData.address;
        if (hospitalData.type) body.type = hospitalData.type;
        if (hospitalData.emergencyContact) body.emergencyContact = hospitalData.emergencyContact;
        if (hospitalData.latitude) body.latitude = hospitalData.latitude;
        if (hospitalData.longitude) body.longitude = hospitalData.longitude;
        if (hospitalData.about) body.about = hospitalData.about;
        
        // Working Hours - Convert if needed
        const workingHourType = hospitalData.workingHourType || 'normal';
        let workingHoursData = hospitalData.workingHoursData;
        
        // Automatically convert from frontend format if workingHours is provided
        if (!workingHoursData && hospitalData.workingHours) {
          workingHoursData = convertWorkingHoursToApi(hospitalData.workingHours);
        }
        
        if (workingHoursData && workingHoursData.length > 0) {
          if (workingHourType === 'normal') {
            body.working_hours_general = workingHoursData;
            body.working_hours_clinic = [];
            body.working_hours_clinic_nobreak = [];
          } else if (workingHourType === 'clinic') {
            body.working_hours_clinic = workingHoursData;
            body.working_hours_general = [];
            body.working_hours_clinic_nobreak = [];
          } else if (workingHourType === 'clinic-break') {
            body.working_hours_clinic_nobreak = workingHoursData;
            body.working_hours_general = [];
            body.working_hours_clinic = [];
          }
        } else {
          // Fallback - empty arrays
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
        storeUserIds(response);
        return response;
      },
      invalidatesTags: ["Hospital"],
    }),

    // ============================================
    // ✅ LOGIN - /auth/login
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
          url: `/auth/login`,
          method: "POST",
          body: payload,
        };
      },
      transformResponse: (response: AuthResponse) => {
        storeUserIds(response);
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
        url: `/auth/login/phone`,
        method: "POST",
        body: phoneData,
      }),
    }),

    verifyHospitalOtp: builder.mutation<AuthResponse, OtpData>({
      query: (otpData) => ({
        url: `/auth/otp`,
        method: "POST",
        body: otpData,
      }),
      transformResponse: (response: AuthResponse) => {
        storeUserIds(response);
        return response;
      },
      invalidatesTags: ["Hospital"],
    }),

    // ============================================
    // REFRESH TOKEN
    // ============================================
    refreshToken: builder.mutation<AuthResponse, void>({
      query: () => ({
        url: `/auth/refresh`,
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
    // ✅ LOGOUT - FIXED
    // ============================================
    logout: builder.mutation<{ message: string; success?: boolean }, LogoutParams | void>({
      query: (params) => {
        let { authId, hospitalId } = getStoredIds();
        
        if (params?.authId) authId = params.authId;
        if (params?.hospitalId) hospitalId = params.hospitalId;
        
        // Fallback: try to get authId from localStorage
        if (!authId) {
          try {
            const userData = JSON.parse(localStorage.getItem('userData') || '{}') as UserData;
            authId = userData.authId || userData.id || '';
          } catch (e) {}
        }
        
        if (!authId) {
          try {
            const authData = JSON.parse(localStorage.getItem('authData') || '{}') as AuthData;
            authId = authData.authId || authData.id || '';
          } catch (e) {}
        }
        
        // Get role from localStorage
        const role = params?.role || localStorage.getItem('userRole') || 'hospital';
        
        // Get deviceId
        const deviceId = params?.deviceId || localStorage.getItem('deviceId') || '';
        
        // Build URL with authId
        let url = `/auth/logout/${authId || 'unknown'}`;
        
        // Send all required fields in the body
        let body: any = {
          id: Number(authId),      // Convert to number as backend expects
          role: role,                    // Include role
          deviceId: deviceId             // Include deviceId
        };
        
        return {
          url: url,
          method: "POST",
          body: body,
        };
      },
      onQueryStarted: async (params, { queryFulfilled }) => {
        try {
          await queryFulfilled;
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // Clear all localStorage items
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
            'authId',
            'userId',
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
          
          try {
            if (tokenManager && typeof tokenManager.deleteDatabase === 'function') {
              await tokenManager.deleteDatabase();
            }
          } catch (dbError) {}
        }
      },
    }),

    // ============================================
    // CHANGE PASSWORD
    // ============================================
    changePassword: builder.mutation<ChangePasswordResponse, ChangePasswordData>({
      query: ({ currentPassword, newPassword }) => {
        return {
          url: `/auth/change-password`,
          method: "PUT",
          body: { currentPassword, newPassword },
        };
      },
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
        url: `/auth/send-otp`,
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
        url: `/auth/verify-otp`,
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
        url: `/auth/reset-password`,
        method: "POST",
        body: resetData, // { email, newPassword }
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
    // ✅ HOSPITAL OPERATIONS - Clean RESTful routes
    // ============================================
    
    // Get all hospitals - /hospital
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

    // Get hospital by ID - /hospital/:id
    getHospitalById: builder.query<Hospital, string>({
      query: (id) => ({
        url: `/hospital/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "Hospital", id }],
      transformResponse: (response: { data?: Hospital } | Hospital) => {
        if (response && 'data' in response && response.data) {
          return response.data;
        }
        return response as Hospital;
      },
    }),

    // Get current hospital - /hospital/current
    getCurrentHospital: builder.query<Hospital, void>({
      query: () => {
        const hospitalId = localStorage.getItem('hospitalId') || '';
        return {
          url: `/hospital/${hospitalId}`,
          method: "GET",
        };
      },
      providesTags: ["Hospital"],
      transformResponse: (response: { data?: Hospital } | Hospital) => {
        if (response && 'data' in response && response.data) {
          return response.data;
        }
        return response as Hospital;
      },
    }),

    // ✅ UPDATE Hospital - /hospital/:id (PUT)
    // Automatically converts workingHours from Settings.jsx format
    updateHospital: builder.mutation<Hospital, { id: string; updateHospital: any }>({
      query: ({ id, updateHospital }) => {
        const body: any = {
          name: updateHospital.name,
          email: updateHospital.email,
          type: updateHospital.type,
          phone: updateHospital.phone,
        };

        // Optional fields
        if (updateHospital.address) {
          body.address = updateHospital.address;
        }

        if (updateHospital.emergencyContact) {
          body.emergencyContact = updateHospital.emergencyContact;
        }

        if (updateHospital.latitude !== undefined) {
          body.latitude = updateHospital.latitude;
        }

        if (updateHospital.longitude !== undefined) {
          body.longitude = updateHospital.longitude;
        }

        if (updateHospital.about) {
          body.about = updateHospital.about;
        }

        // ---------- Working Hours ----------
        // Determine which type of working hours to use
        const workingHourType = updateHospital.workingHourType || "normal";

        let workingHoursData = updateHospital.workingHoursData;

        // Automatically convert from Settings.jsx format (workingHours)
        if (!workingHoursData && updateHospital.workingHours) {
          workingHoursData = convertWorkingHoursToApi(
            updateHospital.workingHours
          );
        }

        if (workingHoursData && workingHoursData.length > 0) {
          if (workingHourType === "normal") {
            body.working_hours_general = workingHoursData;
            body.working_hours_clinic = [];
            body.working_hours_clinic_nobreak = [];
          } else if (workingHourType === "clinic") {
            body.working_hours_clinic = workingHoursData;
            body.working_hours_general = [];
            body.working_hours_clinic_nobreak = [];
          } else if (workingHourType === "clinic-break") {
            body.working_hours_clinic_nobreak = workingHoursData;
            body.working_hours_general = [];
            body.working_hours_clinic = [];
          }
        } else {
          // If no working hours provided, preserve existing data
          // by sending empty arrays (backend will handle this)
          body.working_hours_general = [];
          body.working_hours_clinic = [];
          body.working_hours_clinic_nobreak = [];
        }


        return {
          url: `/hospital/${id}`,
          method: "PUT",
          body: body,
        };
      },
      invalidatesTags: (result, error, { id }) => [
        { type: "Hospital", id },
        "Hospital",
      ],
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

    // DELETE Hospital - /hospital/:id (DELETE)
    deleteHospital: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/hospital/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Hospital"],
    }),

    // RECOVER Hospital - /hospital/recover/:id
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
  useGetCurrentHospitalQuery,
  useUpdateHospitalMutation,
  useDeleteHospitalMutation,
  useRecoverHospitalMutation,
} = hospitalApi;