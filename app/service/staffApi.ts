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
}

export interface StaffResponse {
  success: boolean;
  message: string;
  data?: Staff | Staff[];
  token?: string;
  refreshToken?: string;
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

// ✅ FIX 1: Updated ChangePasswordRequest with confirmPassword
export interface ChangePasswordRequest {
  staffId: number;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;  // ✅ Added confirmPassword
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
    // GET /staff
    getStaff: builder.query<
      StaffResponse,
      GetStaffParams | void
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        const hospitalId = getHospitalId();

        if (hospitalId) {
          queryParams.append("hospitalId", String(hospitalId));
        }
        
        if (params?.hospitalId) {
          queryParams.set("hospitalId", String(params.hospitalId));
        }

        // filters
        if (params?.name) queryParams.append("name", params.name);
        if (params?.gender) queryParams.append("gender", params.gender);
        if (params?.phone) queryParams.append("phone", params.phone);
        if (params?.status) queryParams.append("status", params.status);
        if (params?.designation) queryParams.append("designation", params.designation);
        if (params?.staffType) queryParams.append("staffType", params.staffType);
        if (params?.email) queryParams.append("email", params.email);
        if (params?.staffId) queryParams.append("staffId", params.staffId);
        if (params?.search_query) queryParams.append("search_query", params.search_query);

        // pagination
        if (params?.page) queryParams.append("page", String(params.page));
        if (params?.limit) queryParams.append("limit", String(params.limit));

        return `/staff?${queryParams.toString()}`;
      },
      providesTags: ["Staff"]
    }),

    // ================= GET STAFF BY ID =================
    // GET /staff/:id
    getStaffById: builder.query<
      StaffResponse,
      number | string
    >({
      query: (id) => `/staff/${id}`,
      providesTags: ["Staff"],
    }),

    // ================= CREATE STAFF =================
    // POST /staff
    createStaff: builder.mutation<
      StaffResponse,
      Omit<Staff, 'id' | 'hospitalId' | 'createdAt' | 'updatedAt'>
    >({
      query: (data) => {
        const hospitalId = getHospitalId();
        
        return {
          url: "/staff",
          method: "POST",
          body: {
            ...data,
            hospitalId: hospitalId, // Auto-inject from auth
          },
        };
      },
      invalidatesTags: ["Staff"],
    }),

    // ================= UPDATE STAFF =================
    // PUT /staff/:id
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
    // DELETE /staff/:id
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

    // ================= LOGIN WITH EMAIL =================
    // POST /staff/login
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
    // POST /staff/login/phone
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
    // POST /staff/otp
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
    // POST /staff/refresh
    refreshStaff: builder.mutation<
      StaffResponse,
      void
    >({
      query: () => ({
        url: "/staff/refresh",
        method: "POST",
      }),
      transformResponse: (response: StaffResponse) => {
        const token = response.token;
        if (token) {
          localStorage.setItem("accessToken", token);
        }
        return response;
      },
    }),

    // ================= LOGOUT =================
    // POST /staff/logout
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
        } catch (error) {
          console.error("Logout error:", error);
        }
      },
    }),

    // ================= SEND OTP FOR PASSWORD RESET =================
    // POST /staff/auth/send-otp
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
    // POST /staff/auth/verify-otp
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
    // POST /staff/auth/reset-password
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
    // ✅ FIX 2: Updated with confirmPassword in the request body
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
          confirmPassword: data.confirmPassword,  // ✅ Added confirmPassword
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
  
  // DELETE
  useDeleteStaffMutation,
} = staffApi;