// app/service/ambulance.ts - Ambulance API service

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
}

// ✅ UPDATED - GetAmbulanceParams with userId field
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
}

// ================= API =================

export const ambulanceApi = api.injectEndpoints({
  endpoints: (builder) => ({

    // ================= GET AMBULANCES =================
    // Automatically adds hospitalId from authenticated user
    // ✅ UPDATED with proper typing
    getAmbulance: builder.query<
      AmbulanceResponse,
      GetAmbulanceParams | void
    >({
      // ✅ CHANGED: Added proper typing for params
      query: (params: GetAmbulanceParams = {}) => {
        const auth = getAuthUser();
        const queryParams = new URLSearchParams();

        // Auto-inject hospitalId from auth (matches backend)
        if (auth?.id) {
          queryParams.append("hospitalId", String(auth.id));
        }

        // Override hospitalId if provided in params
        if (params.hospitalId) {
          queryParams.set("hospitalId", String(params.hospitalId));
        }

        // ✅ ADDED - User ID filter (matches backend)
        if (params.userId) {
          queryParams.append("userId", String(params.userId));
        }

        // Name filter (matches backend)
        if (params.name) {
          queryParams.append("name", params.name);
        }

        // Address filters (matches backend)
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

        // Vehicle type filter (matches backend)
        if (params.vehicleType) {
          queryParams.append("vehicleType", params.vehicleType);
        }

        // Search query (matches backend)
        if (params.search_query) {
          queryParams.append("search_query", params.search_query);
        }

        const queryString = queryParams.toString();

        // If ID is provided, get single ambulance
        if (params.id) {
          return `/ambulance/${params.id}${queryString ? `?${queryString}` : ""}`;
        }

        // Otherwise get all ambulances for the hospital
        return `/ambulance${queryString ? `?${queryString}` : ""}`;
      },

      providesTags: (result, error, params) => {
        // If we have a single ambulance, provide a specific tag
        if (params?.id && result?.data && !Array.isArray(result.data)) {
          return [{ type: "Ambulance", id: params.id }];
        }
        // Otherwise provide the general tag
        return ["Ambulance"];
      },
    }),

    // ================= CREATE AMBULANCE =================
    // Automatically adds hospitalId from authenticated user
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
            hospitalId: auth?.id, // Automatically add from auth
            userId: data.userId, // if provided
            name: data.name, // if provided
          },
        };
      },

      invalidatesTags: ["Ambulance"],
    }),

    // ================= UPDATE AMBULANCE =================
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

    // ================= DELETE AMBULANCE =================
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

// ================= EXPORT HOOKS =================
export const {
  useGetAmbulanceQuery,
  useCreateAmbulanceMutation,
  useUpdateAmbulanceMutation,
  useDeleteAmbulanceMutation,
} = ambulanceApi;