// app/service/donor.ts - Donor API service (Basic CRUD)

import { api } from "./api";

// ================= TYPES =================

export interface Donor {
  id?: string | number;
  _id?: string;
  userId?: string | number;
  name: string;
  phone: string;
  dateOfBirth: string;
  bloodGroup: string;
  address: {
    place: string;
    pincode: number;
    district?: string;
    state?: string;
    country?: string;
    [key: string]: any;
  };
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface DonorRegistrationData {
  name: string;
  phone: string;
  dateOfBirth: string;
  bloodGroup: string;
  address: {
    place: string;
    pincode: string;
    district?: string;
    state?: string;
    country?: string;
  };
  userId?: string | number;
}

export interface DonorUpdateData {
  name?: string;
  phone?: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  address?: {
    place?: string;
    pincode?: string;
    district?: string;
    state?: string;
    country?: string;
  };
}

export interface DonorResponse {
  success: boolean;
  message: string;
  data?: Donor | Donor[];
  token?: string;
  pagination?: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
  };
  error?: {
    code: string;
    details?: any;
  } | null;
}

export interface GetDonorParams {
  id?: string | number;
  userId?: string | number;
  bloodGroup?: string;
  search_query?: string;
  name?: string;
  place?: string;
  pincode?: string;
  district?: string;
  state?: string;
  country?: string;
  page?: number;
  limit?: number;
}

export interface PhoneLoginData {
  phone: string;
}

export interface OtpVerificationData {
  phone: string;
  otp: string;
}

// ================= API =================

export const donorApi = api.injectEndpoints({
  endpoints: (builder) => ({

    // ================= CREATE DONOR =================
    createDonor: builder.mutation<
      DonorResponse,
      DonorRegistrationData
    >({
      query: (data) => ({
        url: "/donors",
        method: "POST",
        body: {
          name: data.name,
          phone: data.phone,
          dateOfBirth: data.dateOfBirth,
          bloodGroup: data.bloodGroup,
          address: data.address,
          userId: data.userId,
        },
      }),

      invalidatesTags: ["Donor"],
    }),

    // ================= GET ALL DONORS =================
    getDonors: builder.query<
      DonorResponse,
      GetDonorParams | void
    >({
      query: (params: GetDonorParams = {}) => {
        const queryParams = new URLSearchParams();

        // User ID filter
        if (params.userId) {
          queryParams.append("userId", String(params.userId));
        }

        // Blood group filter
        if (params.bloodGroup) {
          queryParams.append("bloodGroup", params.bloodGroup);
        }

        // Name filter
        if (params.name) {
          queryParams.append("name", params.name);
        }

        // Address filters
        if (params.place) {
          queryParams.append("place", params.place);
        }

        if (params.pincode) {
          queryParams.append("pincode", params.pincode);
        }

        if (params.district) {
          queryParams.append("district", params.district);
        }

        if (params.state) {
          queryParams.append("state", params.state);
        }

        if (params.country) {
          queryParams.append("country", params.country);
        }

        // Search query
        if (params.search_query) {
          queryParams.append("search_query", params.search_query);
        }

        // Pagination parameters
        if (params.page) {
          queryParams.append("page", String(params.page));
        }

        if (params.limit) {
          queryParams.append("limit", String(params.limit));
        }

        const queryString = queryParams.toString();
        return `/donors${queryString ? `?${queryString}` : ""}`;
      },

      providesTags: ["Donor"],
    }),

    // ================= GET DONOR BY ID =================
    getDonorById: builder.query<
      DonorResponse,
      string | number
    >({
      query: (id) => `/donors/${id}`,

      providesTags: (result, error, id) => [{ type: "Donor", id }],
    }),

    // ================= UPDATE DONOR =================
    updateDonor: builder.mutation<
      DonorResponse,
      {
        id: string | number;
        data: DonorUpdateData;
      }
    >({
      query: ({ id, data }) => ({
        url: `/donors/${id}`,
        method: "PUT",
        body: data,
      }),

      invalidatesTags: (result, error, { id }) => [
        { type: "Donor", id },
        "Donor",
      ],
    }),

    // ================= DELETE DONOR =================
    deleteDonor: builder.mutation<
      { message: string },
      string | number
    >({
      query: (id) => ({
        url: `/donors/${id}`,
        method: "DELETE",
      }),

      invalidatesTags: (result, error, id) => [
        { type: "Donor", id },
        "Donor",
      ],
    }),
  }),
});

// ================= EXPORT HOOKS =================

export const {
  useCreateDonorMutation,
  useGetDonorsQuery,
  useGetDonorByIdQuery,
  useUpdateDonorMutation,
  useDeleteDonorMutation,
} = donorApi;