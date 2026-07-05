// app/service/ambulance.ts - Ambulance API service with server-side pagination

import { api } from "./api";
import { getAuthUser } from "../../src/utils/auth";

// ================= TYPES =================

export interface AmbulanceAddress {
  country?: string;
  state?: string;
  district?: string;
  place?: string;
  pincode?: number | string;
}

export interface Ambulance {
  id?: number;
  serviceName: string;
  phone: string;
  vehicleType: string;
  address?: AmbulanceAddress;
  hospitalId?: number;
  userId?: string | number;
  name?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AmbulanceResponse {
  success: boolean;
  message: string;
  data?: Ambulance | Ambulance[];
  pagination?: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
  };
}

export interface GetAmbulanceParams {
  id?: string | number;
  userId?: string | number;
  hospitalId?: string | number;
  name?: string;
  country?: string;
  state?: string;
  district?: string;
  place?: string;
  pincode?: string | number;
  vehicleType?: string;
  search_query?: string;
  page?: number;
  limit?: number;
  skipHospitalFilter?: boolean; // ✅ ADDED: Allow skipping hospital filter for Super Admin
}

// ================= API =================

export const ambulanceApi = api.injectEndpoints({
  endpoints: (builder) => ({

    // ================= GET AMBULANCES =================
    getAmbulance: builder.query<
      AmbulanceResponse,
      GetAmbulanceParams | void
    >({
      query: (params: GetAmbulanceParams = {}) => {
        const queryParams = new URLSearchParams();

        // ✅ Only auto-inject hospitalId if skipHospitalFilter is false
        const skipHospitalFilter = params.skipHospitalFilter === true;
        
        if (!skipHospitalFilter) {
          const auth = getAuthUser();
          if (auth?.id) {
            queryParams.append("hospitalId", String(auth.id));
          }
        }

        // Override hospitalId if provided in params (takes precedence)
        if (params.hospitalId) {
          queryParams.append("hospitalId", String(params.hospitalId));
        }

        // User ID filter
        if (params.userId) {
          queryParams.append("userId", String(params.userId));
        }

        // Name filter
        if (params.name) {
          queryParams.append("name", params.name);
        }

        // Address filters
        if (params.country) {
          queryParams.append("country", params.country);
        }

        if (params.state) {
          queryParams.append("state", params.state);
        }

        if (params.district) {
          queryParams.append("district", params.district);
        }

        if (params.place) {
          queryParams.append("place", params.place);
        }

        if (params.pincode) {
          queryParams.append("pincode", String(params.pincode));
        }

        // Vehicle type filter
        if (params.vehicleType) {
          queryParams.append("vehicleType", params.vehicleType);
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

        if (params.id) {
          return `/ambulance/${params.id}${queryString ? `?${queryString}` : ""}`;
        }

        return `/ambulance${queryString ? `?${queryString}` : ""}`;
      },

      providesTags: (result, error, params) => {
        if (params?.id && result?.data && !Array.isArray(result.data)) {
          return [{ type: "Ambulance", id: params.id }];
        }
        return ["Ambulance"];
      },
    }),

    // ================= CREATE AMBULANCE =================
    createAmbulance: builder.mutation<
      AmbulanceResponse,
      Omit<Ambulance, 'id' | 'hospitalId' | 'createdAt' | 'updatedAt'>
    >({
      query: (data) => {
        const auth = getAuthUser();
        
        return {
          url: "/ambulance",
          method: "POST",
          body: {
            serviceName: data.serviceName,
            phone: data.phone,
            vehicleType: data.vehicleType,
            address: data.address,
            hospitalId: auth?.id,
            userId: data.userId,
            name: data.name,
          },
        };
      },

      invalidatesTags: ["Ambulance"],
    }),

    updateAmbulance: builder.mutation<
      AmbulanceResponse,
      {
        id: string | number;
        data: Partial<Omit<Ambulance, 'id' | 'hospitalId'>>;
      }
    >({
      query: ({ id, data }) => ({
        url: `/ambulance/${id}`,
        method: "PUT",
        body: {
          serviceName: data.serviceName,
          phone: data.phone,
          vehicleType: data.vehicleType,
          address: data.address,
          userId: data.userId,
          name: data.name,
        },
      }),

      invalidatesTags: (result, error, { id }) => [
        { type: "Ambulance", id },
        "Ambulance",
      ],
    }),

    deleteAmbulance: builder.mutation<
      { message: string },
      string | number
    >({
      query: (id) => ({
        url: `/ambulance/${id}`,
        method: "DELETE",
      }),

      invalidatesTags: (result, error, id) => [
        { type: "Ambulance", id },
        "Ambulance",
      ],
    }),
  }),
});

export const {
  useGetAmbulanceQuery,
  useCreateAmbulanceMutation,
  useUpdateAmbulanceMutation,
  useDeleteAmbulanceMutation,
} = ambulanceApi;