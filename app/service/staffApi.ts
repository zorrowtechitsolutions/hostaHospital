// app/service/staffApi.ts

import { api } from "./api";

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

// ================= API =================

export const staffApi = api.injectEndpoints({
  endpoints: (builder) => ({

    // ================= GET STAFF =================

    getStaff: builder.query<
      StaffResponse,
      {
        id?: string | number;
        hospitalId?: string | number;
      } | void
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();

        if (params?.hospitalId) {
          queryParams.append(
  "id",
  String(params.hospitalId)
);
        }

        const queryString = queryParams.toString();

        return params?.id
          ? `/staff/${params.id}`
          : `/staff${queryString ? `?${queryString}` : ""}`;
      },

      providesTags: ["Staff"],
    }),

    // CREATE STAFF 

    createStaff: builder.mutation<
      StaffResponse,
      Partial<Staff>
    >({
      query: (data) => ({
        url: "/staff",
        method: "POST",
        body: data,
      }),

      invalidatesTags: ["Staff"],
    }),

    // ================= UPDATE STAFF =================

    updateStaff: builder.mutation<
  StaffResponse,
  {
    id: string | number;
    data: Partial<Staff>;
  }
>({
  query: ({ id, data }) => ({
    url: `/staff/${id}`,
    method: "PUT",
    body: data,
  }),

  invalidatesTags: ["Staff"],
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

      invalidatesTags: ["Staff"],
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