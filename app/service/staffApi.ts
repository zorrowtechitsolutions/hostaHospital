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
}

// ================= API =================

export const staffApi = api.injectEndpoints({
  endpoints: (builder) => ({

    // ================= GET STAFF =================
    // Automatically adds hospitalId from authenticated user
    getStaff: builder.query<
      StaffResponse,
      GetStaffParams | void
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        
        // Auto-inject hospitalId from auth
        const hospitalId = getHospitalId();
        if (hospitalId) {
          queryParams.append("hospitalId", String(hospitalId));
        }

        const queryString = queryParams.toString();

        if (params?.id) {
          return `/staff/${params.id}${queryString ? `?${queryString}` : ""}`;
        }

        return `/staff${queryString ? `?${queryString}` : ""}`;
      },

      providesTags: (result, error, params) => {
        if (params?.id && result?.data && !Array.isArray(result.data)) {
          return [{ type: "Staff", id: params.id }];
        }
        return ["Staff"];
      },
    }),

    // ================= CREATE STAFF =================
    // Automatically adds hospitalId from authenticated user
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

    // ================= LOGIN =================
    loginStaff: builder.mutation<
      StaffResponse,
      {
        email: string;
        password: string;
      }
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

    // ================= LOGIN PHONE =================
    loginStaffPhone: builder.mutation<
      StaffResponse,
      {
        phone: string;
      }
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
      {
        phone: string;
        otp: string;
      }
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

    // ================= REFRESH =================
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
  }),
});

// ================= EXPORT HOOKS =================

export const {
  useGetStaffQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useDeleteStaffMutation,
  useLoginStaffMutation,
  useLoginStaffPhoneMutation,
  useVerifyStaffOtpMutation,
  useRefreshStaffMutation,
  useLogoutStaffMutation,
} = staffApi;