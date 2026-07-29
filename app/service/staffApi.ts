// src/app/service/staffApi.ts

import { api } from "./api";
import { getAuthUser, JwtPayload } from "../../src/utils/auth";

// ================= TYPES =================

export interface StaffAddress {
  country?: string;
  state?: string;
  district?: string;
  place?: string;
  pincode?: number | string;
}

export interface Staff {
  id?: number;
  authId?: string;
  userId?: string;
  name: string;
  email: string;
  password?: string;
  phone: string;
  hospitalId?: number;
  designation?: string;
  joiningDate?: string;
  jobType?: string;
  staffType?: string;
  dob?: string;
  gender?: string;
  hospitalName?: string;
  knowLanguages?: string[];
  qualification?: string;
  address?: StaffAddress;
  profileImage?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
  isDelete?: boolean;
  deleteDate?: string | null;
}

export interface StaffResponse {
  success: boolean;
  message: string;
  data?: Staff | Staff[];
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  pagination?: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
  };
  authId?: string;
  hospitalId?: string;
  role?: string;
}

export interface GetStaffParams {
  id?: string | number;
  hospitalId?: string | number;
  page?: number;
  limit?: number;
  name?: string;
  gender?: string;
  phone?: string;
  status?: string;
  designation?: string;
  staffType?: string;
  email?: string;
  staffId?: string;
  search_query?: string;
  includeDeleted?: boolean;
  skipHospitalFilter?: boolean;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export interface SendOtpRequest {
  email: string;
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

export interface LoginRequest {
  email: string;
  password: string;
  fcmToken?: string;
}

export interface LoginPhoneRequest {
  phone: string;
}

export interface VerifyOtpRequest {
  phone: string;
  otp: string;
}

export interface CreateStaffData {
  name: string;
  email: string;
  password: string;
  phone: string;
  designation: string;
  hospitalId?: number;
  roleId?: number;
  joiningDate?: string;
  jobType?: string;
  staffType?: string;
  dob?: string;
  gender?: string;
  hospitalName?: string;
  knowLanguages?: string[];
  qualification?: string;
  address?: StaffAddress;
  profileImage?: string;
  imageKey?: string;
  status?: string;
}

// ============================================
// HELPER: Store dual IDs in localStorage
// ============================================

const storeStaffIds = (response: StaffResponse) => {
  const token = response.token || response.accessToken;
  if (token) {
    localStorage.setItem("accessToken", token);
  }
  if (response.refreshToken) {
    localStorage.setItem("refreshToken", response.refreshToken);
  }

  const staff = response.data as Staff;
  
  let authId = response.authId || '';
  
  if (!authId && staff) {
    authId = staff.authId || staff.userId || String(staff.id || '');
  }
  
  if (authId) {
    localStorage.setItem("authId", authId);
    localStorage.setItem("userId", authId);
    localStorage.setItem("staffId", authId);
  }

  let hospitalId = response.hospitalId || '';
  
  if (!hospitalId && staff?.hospitalId) {
    hospitalId = String(staff.hospitalId);
  }
  
  if (hospitalId) {
    localStorage.setItem("hospitalId", hospitalId);
  }

  const role = response.role || 'staff';
  localStorage.setItem("userRole", role);

  const userData = {
    authId: authId,
    hospitalId: hospitalId,
    id: staff?.id || authId,
    name: staff?.name || '',
    email: staff?.email || '',
    role: role,
  };
  localStorage.setItem("userData", JSON.stringify(userData));
  
  const authData = {
    authId: authId,
    hospitalId: hospitalId,
    id: staff?.id || authId,
    role: role,
  };
  localStorage.setItem("authData", JSON.stringify(authData));

  console.log('✅ Staff IDs stored:', { authId, hospitalId });
};

// ============================================
// HELPER: Get current user with proper IDs from JWT
// ============================================

const getCurrentUser = (): JwtPayload | null => {
  const auth = getAuthUser();
  if (!auth) return null;
  return auth;
};

// ============================================
// HELPER: Get hospitalId from JWT or localStorage
// ============================================

const getHospitalId = (): string | null => {
  const auth = getAuthUser();
  
  if (auth?.hospitalId) {
    return String(auth.hospitalId);
  }
  
  const hospitalId = localStorage.getItem('hospitalId');
  if (hospitalId) {
    return hospitalId;
  }
  
  return null;
};

// ============================================
// HELPER: Get authId (user ID) from JWT or localStorage
// ============================================

const getAuthId = (): string | null => {
  const auth = getAuthUser();
  
  if (auth?.id) {
    return String(auth.id);
  }
  
  const authId = localStorage.getItem('authId');
  if (authId) {
    return authId;
  }
  
  return null;
};

// ============================================
// HELPER: Get stored IDs from localStorage
// ============================================

const getStoredIds = () => {
  const authId = localStorage.getItem('authId') || '';
  const hospitalId = localStorage.getItem('hospitalId') || '';
  return { authId, hospitalId };
};

// ================= API =================

export const staffApi = api.injectEndpoints({
  endpoints: (builder) => ({

    // ================= GET ALL STAFF =================
    getStaff: builder.query<
      StaffResponse,
      GetStaffParams | void
    >({
      query: (params) => {
        const auth = getCurrentUser();
        const queryParams = new URLSearchParams();
        
        const shouldSkipFilter = params?.skipHospitalFilter === true;
        const shouldFilterByHospital = !shouldSkipFilter;

        if (shouldFilterByHospital) {
          const hospitalId = getHospitalId();
          if (hospitalId) {
            queryParams.append("hospitalId", String(hospitalId));
          } else {
            console.warn("⚠️ No hospital ID found for filtering");
          }
        } else if (params?.hospitalId) {
          queryParams.append("hospitalId", String(params.hospitalId));
        }

        if (params?.name) queryParams.append("name", params.name);
        if (params?.gender) queryParams.append("gender", params.gender);
        if (params?.phone) queryParams.append("phone", params.phone);
        if (params?.status) queryParams.append("status", params.status);
        if (params?.designation) queryParams.append("designation", params.designation);
        if (params?.staffType) queryParams.append("staffType", params.staffType);
        if (params?.email) queryParams.append("email", params.email);
        if (params?.staffId) queryParams.append("staffId", params.staffId);
        if (params?.search_query) queryParams.append("search_query", params.search_query);
        if (params?.includeDeleted) queryParams.append("includeDeleted", String(params.includeDeleted));

        if (params?.page) queryParams.append("page", String(params.page));
        if (params?.limit) queryParams.append("limit", String(params.limit));

        const url = `/staff?${queryParams.toString()}`;
        return url;
      },
      providesTags: ["Staff"],
      transformResponse: (response: StaffResponse) => {
        return response;
      },
    }),

    // ================= GET STAFF BY ID =================
    getStaffById: builder.query<
      StaffResponse,
      number | string
    >({
      query: (id) => `/staff/${id}`,
      providesTags: ["Staff"],
    }),

    // ================= CREATE STAFF =================
    createStaff: builder.mutation<
      StaffResponse,
      CreateStaffData
    >({
      query: (data) => {
        const auth = getCurrentUser();
        const isSuperAdmin = auth?.role === 'super-admin' || auth?.roleId === 1;
        
        let hospitalId = data.hospitalId;
        
        if (!hospitalId && !isSuperAdmin) {
          const defaultHospitalId = getHospitalId();
          hospitalId = defaultHospitalId ? Number(defaultHospitalId) : undefined;
        }
        
        return {
          url: "/staff",
          method: "POST",
          body: {
            ...data,
            hospitalId: hospitalId,
          },
        };
      },
      invalidatesTags: ["Staff"],
    }),

    // ================= UPDATE STAFF =================
    updateStaff: builder.mutation<
      StaffResponse,
      {
        id: string | number;
        data: Partial<Omit<Staff, 'id' | 'hospitalId'>>;
      }
    >({
      query: ({ id, data }) => ({
        url: `/staff/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Staff", id },
        "Staff",
      ],
    }),

    // ================= DELETE STAFF =================
    deleteStaff: builder.mutation<
      { message: string },
      string | number
    >({
      query: (id) => ({
        url: `/staff/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Staff", id },
        "Staff",
      ],
    }),

    // ================= RECOVER STAFF =================
    recoverStaff: builder.mutation<
      { success: boolean; message: string; data?: Staff },
      string | number
    >({
      query: (id) => ({
        url: `/staff/recover/${id}`,
        method: "PUT",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Staff", id },
        "Staff",
      ],
    }),

    // ================= LOGIN WITH EMAIL =================
    loginStaff: builder.mutation<
      StaffResponse,
      LoginRequest
    >({
      query: (data) => ({
        url: "/auth/login",
        method: "POST",
        body: data,
      }),
      transformResponse: (response: StaffResponse) => {
        storeStaffIds(response);
        return response;
      },
    }),

    // ================= LOGIN WITH PHONE =================
    loginStaffPhone: builder.mutation<
      StaffResponse,
      LoginPhoneRequest
    >({
      query: (data) => ({
        url: "/auth/login/phone",
        method: "POST",
        body: data,
      }),
      transformResponse: (response: StaffResponse) => {
        storeStaffIds(response);
        return response;
      },
    }),

    // ================= VERIFY OTP =================
    verifyStaffOtp: builder.mutation<
      StaffResponse,
      VerifyOtpRequest
    >({
      query: (data) => ({
        url: "/auth/otp",
        method: "POST",
        body: data,
      }),
      transformResponse: (response: StaffResponse) => {
        storeStaffIds(response);
        return response;
      },
    }),

    // ================= REFRESH TOKEN =================
    refreshStaff: builder.mutation<
      StaffResponse,
      void
    >({
      query: () => ({
        url: "/auth/refresh",
        method: "POST",
      }),
      transformResponse: (response: StaffResponse) => {
        const token = response.token || response.accessToken;
        if (token) {
          localStorage.setItem("accessToken", token);
        } else {
          console.warn("⚠️ No token received from refresh endpoint");
        }
        
        if (response.refreshToken) {
          localStorage.setItem("refreshToken", response.refreshToken);
        }
        
        if (response.authId) {
          localStorage.setItem("authId", response.authId);
        }
        if (response.hospitalId) {
          localStorage.setItem("hospitalId", response.hospitalId);
        }
        
        return response;
      },
      invalidatesTags: ["Staff"],
    }),

    // ================= LOGOUT =================
    logoutStaff: builder.mutation<
      { message: string },
      { deviceId?: string } | void
    >({
      query: (params) => {
        const { authId } = getStoredIds();
        
        let url = `/auth/logout/${authId || 'unknown'}`;
        let body: any = {
          deviceId: params?.deviceId || localStorage.getItem('deviceId') || '',
        };
        
        return {
          url: url,
          method: "POST",
          body: body,
        };
      },
      onQueryStarted: async (_arg, { queryFulfilled }) => {
        try {
          await queryFulfilled;
        } catch (error) {
          console.error("Logout error:", error);
        } finally {
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
          
          sessionStorage.clear();
        }
      },
    }),

    // ================= SEND OTP FOR PASSWORD RESET =================
    sendStaffOtp: builder.mutation<
      { success: boolean; message: string },
      SendOtpRequest
    >({
      query: (data) => ({
        url: "/auth/send-otp",
        method: "POST",
        body: data,
      }),
    }),

    // ================= VERIFY OTP FOR PASSWORD RESET =================
    verifyStaffOtpForReset: builder.mutation<
      StaffResponse,
      {
        email: string;
        otp: string;
      }
    >({
      query: (data) => ({
        url: "/auth/verify-otp",
        method: "POST",
        body: data,
      }),
      transformResponse: (response: StaffResponse) => {
        const token = response.token || response.accessToken;
        if (token) {
          localStorage.setItem("accessToken", token);
        }
        if (response.refreshToken) {
          localStorage.setItem("refreshToken", response.refreshToken);
        }
        if (response.authId) {
          localStorage.setItem("authId", response.authId);
        }
        if (response.hospitalId) {
          localStorage.setItem("hospitalId", response.hospitalId);
        }
        return response;
      },
    }),

    // ================= RESET PASSWORD (with OTP) =================
    resetStaffPassword: builder.mutation<
      { success: boolean; message: string },
      ResetPasswordRequest
    >({
      query: (data) => ({
        url: "/auth/reset-password",
        method: "POST",
        body: data,
      }),
    }),

    // ================= CHANGE PASSWORD (with current password) =================
    // Updated to match doctor implementation
    changeStaffPassword: builder.mutation<ChangePasswordResponse, ChangePasswordData>({
      query: ({ currentPassword, newPassword }) => {
        const authId = getAuthId(); // Using helper function like doctor API
        return {
          url: `/auth/change-password/${authId}`,
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
      invalidatesTags: ["Staff"], // Changed from "Hospital" to "Staff"
    }),
  }),
});

// ================= EXPORT HOOKS =================

export const {
  // GET
  useGetStaffQuery,
  useGetStaffByIdQuery,
  
  // POST
  useCreateStaffMutation,
  useLoginStaffMutation,
  useLoginStaffPhoneMutation,
  useVerifyStaffOtpMutation,
  useRefreshStaffMutation,
  useLogoutStaffMutation,
  useSendStaffOtpMutation,
  useVerifyStaffOtpForResetMutation,
  useResetStaffPasswordMutation,
  
  // PUT
  useUpdateStaffMutation,
  useChangeStaffPasswordMutation, // Make sure this is exported
  useRecoverStaffMutation,
  
  // DELETE
  useDeleteStaffMutation,
} = staffApi;