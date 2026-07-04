// app/service/staffApi.ts

import { api } from "./api";
import { getHospitalId } from "../../src/utils/auth";

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
  refreshToken?: string;
  pagination?: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
  };
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
}

// Password Reset Request Types
export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export interface SendOtpRequest {
  email: string;
}

export interface ChangePasswordRequest {
  staffId: number;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Login Types
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

// ================= API =================

export const staffApi = api.injectEndpoints({
  endpoints: (builder) => ({

    // ================= GET ALL STAFF =================
    getStaff: builder.query<
      StaffResponse,
      GetStaffParams | void
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        const hospitalId = getHospitalId(); // ✅ Get hospital ID from auth

        // ✅ Always include hospitalId if available
        if (hospitalId) {
          queryParams.append("hospitalId", String(hospitalId));
        }
        
        // Allow override if explicitly passed in params
        if (params?.hospitalId) {
          queryParams.set("hospitalId", String(params.hospitalId));
        }

        // Filters
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

        // Pagination
        if (params?.page) queryParams.append("page", String(params.page));
        if (params?.limit) queryParams.append("limit", String(params.limit));

        const url = `/staff?${queryParams.toString()}`;
        console.log('📡 Fetching staff with URL:', url); // Debug log
        return url;
      },
      providesTags: ["Staff"],
      transformResponse: (response: StaffResponse) => {
        console.log('✅ Staff API Response:', response);
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
      Omit<Staff, 'id' | 'hospitalId' | 'createdAt' | 'updatedAt'>
    >({
      query: (data) => {
        const hospitalId = getHospitalId();
        
        // ✅ Ensure hospitalId is included
        if (!hospitalId) {
          console.warn('⚠️ No hospitalId found when creating staff');
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
        url: "/staff/login",
        method: "POST",
        body: data,
      }),
      transformResponse: (response: StaffResponse) => {
        const token = response.token;
        if (token) {
          localStorage.setItem("accessToken", token);
        }
        return response;
      },
    }),

    // ================= LOGIN WITH PHONE =================
    loginStaffPhone: builder.mutation<
      StaffResponse,
      LoginPhoneRequest
    >({
      query: (data) => ({
        url: "/staff/login/phone",
        method: "POST",
        body: data,
      }),
    }),

    // ================= VERIFY OTP =================
    verifyStaffOtp: builder.mutation<
      StaffResponse,
      VerifyOtpRequest
    >({
      query: (data) => ({
        url: "/staff/otp",
        method: "POST",
        body: data,
      }),
      transformResponse: (response: StaffResponse) => {
        const token = response.token;
        if (token) {
          localStorage.setItem("accessToken", token);
        }
        return response;
      },
    }),

    // ================= REFRESH TOKEN =================
    refreshStaff: builder.mutation<
      StaffResponse,
      void
    >({
      query: () => ({
        url: "/staff/refresh",
        method: "POST",
      }),
      transformResponse: (response: StaffResponse) => {
        console.log("🔄 Staff token refresh initiated...");
        
        const token = response.token;
        if (token) {
          localStorage.setItem("accessToken", token);
          console.log("✅ Staff token refreshed successfully");
        } else {
          console.warn("⚠️ No token received from refresh endpoint");
        }
        
        if (response.refreshToken) {
          localStorage.setItem("refreshToken", response.refreshToken);
        }
        
        return response;
      },
      invalidatesTags: ["Staff"],
    }),

    // ================= LOGOUT =================
    logoutStaff: builder.mutation<
      { message: string },
      void
    >({
      query: () => ({
        url: "/staff/logout",
        method: "POST",
      }),
      onQueryStarted: async (_arg, { queryFulfilled }) => {
        try {
          await queryFulfilled;
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          console.log("🔴 Staff logged out");
        } catch (error) {
          console.error("Logout error:", error);
        }
      },
    }),

    // ================= SEND OTP FOR PASSWORD RESET =================
    sendStaffOtp: builder.mutation<
      { success: boolean; message: string },
      SendOtpRequest
    >({
      query: (data) => ({
        url: "/staff/auth/send-otp",
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
        url: "/staff/auth/verify-otp",
        method: "POST",
        body: data,
      }),
      transformResponse: (response: StaffResponse) => {
        const token = response.token;
        if (token) {
          localStorage.setItem("accessToken", token);
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
        url: "/staff/auth/reset-password",
        method: "POST",
        body: data,
      }),
    }),

    // ================= CHANGE PASSWORD (with current password) =================
    changeStaffPassword: builder.mutation<
      { success: boolean; message: string },
      ChangePasswordRequest
    >({
      query: (data) => ({
        url: "/staff/auth/change-password",
        method: "PUT",
        body: {
          staffId: data.staffId,
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
          confirmPassword: data.confirmPassword,
        },
      }),
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
  useChangeStaffPasswordMutation,
  useRecoverStaffMutation,
  
  // DELETE
  useDeleteStaffMutation,
} = staffApi;