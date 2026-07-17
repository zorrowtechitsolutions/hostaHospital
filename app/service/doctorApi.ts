// src/app/service/doctorApi.ts
import { api } from "./api";
import { getAuthUser } from "../../src/utils/auth";

// ==============================
// TYPES
// ==============================

export interface Doctor {
  id?: string;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  speciality?: string;
  qualification?: string;
  experience?: number;
  gender?: string;
  image?: string;
  about?: string;
  hospitalId?: string;
  hospitalName?: string;
  createdAt?: string;
  updatedAt?: string;
  appointmentCount?: number;
  autoDecline?: number;
  status?: string | boolean;
  isDelete?: boolean;
  isActive?: boolean;
}

export interface LoginDoctorData {
  email: string;
  password: string;
  fcmToken?: string;
}

export interface DoctorAuthResponse {
  success?: boolean;
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  doctor?: Doctor;
  data?: Doctor;
  message?: string;
  error?: string;
}

export interface GetDoctorsParams {
  hospitalId?: string | number;
  name?: string;
  speciality?: string;
  status?: string | number | boolean;
  search_query?: string;
  page?: number;
  limit?: number;
  skipHospitalFilter?: boolean;
}

type AddDoctorPayload = Omit<Doctor, "hospitalId"> & {
  hospitalId?: number | string;
};

export interface Department {
  id: string;
  name: string;
  description?: string;
  hospitalId?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface SpecialityResponse {
  success?: boolean;
  message?: string;
  data?: {
    count: number;
    rows: Department[];
  };
}

// ============================================
// AUTH / PASSWORD MANAGEMENT TYPES
// ============================================

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

export interface ChangePasswordData {
  currentPassword: string;
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

export interface ChangePasswordResponse {
  success?: boolean;
  message?: string;
  error?: string;
}

export const doctorApi = api.injectEndpoints({
  endpoints: (builder) => ({

    getDoctors: builder.query({
      query: (params: GetDoctorsParams = {}) => {
        const auth = getAuthUser();
        const queryParams = new URLSearchParams();

        // 🎯 ROLE DEFINITIONS - ALL users should be filtered by hospital
        const isHospitalAdmin = auth?.role === 'hospital' || auth?.roleId === 2;
        const isDoctor = auth?.role === 'doctor' || auth?.roleId === 46;
        const isStaff = auth?.role === 'staff' || auth?.roleId === 3;
        const isSuperAdmin = auth?.role === 'super-admin';
        const shouldSkipFilter = params.skipHospitalFilter === true;
        
        // 🔥 FIX: Filter by hospital for ALL hospital-bound users (Doctors, Hospital Admins, AND Staff)
        // Staff should ONLY see their own hospital's data
        const shouldFilterByHospital = (isHospitalAdmin || isDoctor || isStaff) && !shouldSkipFilter;

        if (shouldFilterByHospital && auth?.id) {
          // Use hospitalId from auth for all hospital-bound users
          const hospitalId = auth?.hospitalId || auth?.id;
          queryParams.append("hospitalId", String(hospitalId));
        } else if (isSuperAdmin && params.hospitalId) {
          // Super Admin can filter by specific hospital
          queryParams.append("hospitalId", String(params.hospitalId));
        } else if (params.hospitalId && !shouldFilterByHospital) {
          // Use provided hospitalId if user is not hospital-bound
          queryParams.append("hospitalId", String(params.hospitalId));
        } 

        // Add other filters
        if (params.name) {
          queryParams.append("name", params.name);
        }

        if (params.speciality) {
          queryParams.append("speciality", params.speciality);
        }

        if (params.status !== undefined && params.status !== null && params.status !== '') {
          queryParams.append("status", String(params.status));
        }

        if (params.search_query) {
          queryParams.append("search_query", params.search_query);
        }

        // Always add pagination
        queryParams.append("page", String(params.page || 1));
        queryParams.append("limit", String(params.limit || 10));

        const url = `/doctor?${queryParams.toString()}`;
        return url;
      },
      providesTags: ["Doctor"],
    }),

    getSpecialities: builder.query<SpecialityResponse, void>({
      query: () => {
        const queryParams = new URLSearchParams();
        return `/speciality?${queryParams.toString()}`;
      },
      providesTags: ["speciality"],
    }),

    getDoctorById: builder.query<DoctorAuthResponse, string>({
      query: (id) => `/doctor/${id}`,
      providesTags: (result, error, id) => [{ type: "Doctor", id }],
    }),

    // ============================================
    // AUTH ENDPOINTS
    // ============================================

    loginDoctor: builder.mutation<DoctorAuthResponse, LoginDoctorData>({
      query: (logUser) => ({
        url: "/doctor/login",
        method: "POST",
        body: logUser,
      }),

      transformResponse: (response: DoctorAuthResponse) => {
        const token = response.token || response.accessToken;

        if (token) {
          localStorage.setItem("accessToken", token);
        }

        if (response.refreshToken) {
          localStorage.setItem("refreshToken", response.refreshToken);
        }

        return response;
      },

      invalidatesTags: ["Doctor"],
    }),

    logoutDoctor: builder.mutation<{ message: string }, { hospitalId: string }>({
      query: ({ hospitalId }) => ({
        url: `/doctor/logout/${hospitalId}`,
        method: "PUT",
      }),

      onQueryStarted: async (_arg, { queryFulfilled }) => {
        try {
          await queryFulfilled;
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
        } catch (error) {
          // Error handled silently
        }
      },
    }),

    refreshDoctor: builder.mutation<DoctorAuthResponse, void>({
      query: () => ({
        url: "/doctor/refresh",
        method: "POST",
      }),

      transformResponse: (response: DoctorAuthResponse) => {
        const token = response.token || response.accessToken;

        if (token) {
          localStorage.setItem("accessToken", token);
        }

        if (response.refreshToken) {
          localStorage.setItem("refreshToken", response.refreshToken);
        }

        return response;
      },

      invalidatesTags: ["Doctor"],
    }),

    // ============================================
    // FORGOT PASSWORD / RESET PASSWORD ENDPOINTS
    // ============================================

    sendDoctorOtp: builder.mutation<OtpResponse, SendOtpData>({
      query: (otpData) => ({
        url: `/doctor/auth/send-otp`,
        method: "POST",
        body: otpData,
        // No authentication required
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

    verifyDoctorOtp: builder.mutation<OtpResponse, VerifyOtpData>({
      query: (otpData) => ({
        url: `/doctor/auth/verify-otp`,
        method: "POST",
        body: otpData,
        // No authentication required
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

    resetDoctorPassword: builder.mutation<ResetPasswordResponse, ResetPasswordData>({
      query: (resetData) => ({
        url: `/doctor/auth/reset-password`,
        method: "POST",
        body: resetData,
        // No authentication required - this endpoint is public
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
    // CHANGE PASSWORD ENDPOINT (Requires Authentication)
    // ============================================

    changeDoctorPassword: builder.mutation<ChangePasswordResponse, ChangePasswordData>({
      query: ({ currentPassword, newPassword }) => ({
        url: `/doctor/auth/change-password`,
        method: "PUT",
        body: { currentPassword, newPassword },
        // This endpoint requires authentication
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
      invalidatesTags: ["Doctor"],
    }),

    // ============================================
    // CRUD ENDPOINTS
    // ============================================

    addNewDoctor: builder.mutation<DoctorAuthResponse, AddDoctorPayload>({
      query: ({ hospitalId, ...newDoctor }) => {
        const auth = getAuthUser();

        return {
          url: "/doctor",
          method: "POST",
          body: {
            ...newDoctor,
            hospitalId: hospitalId ?? auth?.id,
            hospitalName: newDoctor.hospitalName ?? auth?.name ?? "",
          },
        };
      },
      invalidatesTags: ["Doctor"],
    }),

    updateDoctor: builder.mutation<Doctor, { id: string; updateDoctor: Partial<Doctor> }>({
      query: ({ id, updateDoctor }) => ({
        url: `/doctor/${id}`,
        method: "PUT",
        body: updateDoctor,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Doctor", id },
        "Doctor",
      ],
    }),

    deleteDoctor: builder.mutation<{ message: string }, string>({
      query: (doctorId) => ({
        url: `/doctor/${doctorId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, doctorId) => [
        { type: "Doctor", doctorId },
        "Doctor",
      ],
    }),

    recoverDoctor: builder.mutation<{ message: string }, string>({
      query: (doctorId) => ({
        url: `/doctor/recover/${doctorId}`,
        method: "PUT",
      }),
      invalidatesTags: (result, error, doctorId) => [
        { type: "Doctor", doctorId },
        "Doctor",
      ],
    }),
  }),

  overrideExisting: false,
});

export const {
  useGetDoctorsQuery,
  useGetDoctorByIdQuery,
  useLoginDoctorMutation,
  useLogoutDoctorMutation,
  useRefreshDoctorMutation,
  useAddNewDoctorMutation,
  useUpdateDoctorMutation,
  useDeleteDoctorMutation,
  useRecoverDoctorMutation,
  useGetSpecialitiesQuery,
  // Auth hooks
  useSendDoctorOtpMutation,
  useVerifyDoctorOtpMutation,
  useResetDoctorPasswordMutation,
  useChangeDoctorPasswordMutation,
} = doctorApi;