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
  createdAt?: string;
  updatedAt?: string;
}

export interface AmbulanceResponse {
  success: boolean;
  message: string;
  data?: Ambulance | Ambulance[];
}

export interface GetAmbulanceParams {
  id?: string | number;
}

// ================= API =================

export const ambulanceApi = api.injectEndpoints({
  endpoints: (builder) => ({

    // ================= GET AMBULANCES =================
    // Automatically adds hospitalId from authenticated user
    getAmbulance: builder.query<
      AmbulanceResponse,
      GetAmbulanceParams | void
    >({
      query: (params) => {
        const auth = getAuthUser();
        const queryParams = new URLSearchParams();

        // Automatically add hospitalId from authenticated user
        if (auth?.id) {
          queryParams.append("hospitalId", String(auth.id));
        }

        const queryString = queryParams.toString();

        // If ID is provided, get single ambulance
        if (params?.id) {
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