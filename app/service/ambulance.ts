// app/service/ambulance.ts - Ambulance API service

import { api } from "./api";

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

// ================= API =================

export const ambulanceApi = api.injectEndpoints({
  endpoints: (builder) => ({

    // ================= GET AMBULANCES =================

    getAmbulance: builder.query<
      AmbulanceResponse,
      {
        id?: string | number;
        hospitalId?: string | number;
      } | void
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();

        if (params?.hospitalId) {
          queryParams.append("hospitalId", String(params.hospitalId));
        }

        const queryString = queryParams.toString();

        return params?.id
          ? `/ambulance/${params.id}`
          : `/ambulance${queryString ? `?${queryString}` : ""}`;
      },

      providesTags: ["Ambulance"],
    }),

    // ================= CREATE AMBULANCE =================

    createAmbulance: builder.mutation<
      AmbulanceResponse,
      Partial<Ambulance>
    >({
      query: (data) => ({
        url: "/ambulance",
        method: "POST",
        body: {
          serviceName: data.serviceName,
          phone: data.phone,
          vehicleType: data.vehicleType,
          address: data.address,
          hospitalId: data.hospitalId,
        },
      }),

      invalidatesTags: ["Ambulance"],
    }),

    // ================= UPDATE AMBULANCE =================

    updateAmbulance: builder.mutation<
      AmbulanceResponse,
      {
        id: string | number;
        data: Partial<Ambulance>;
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

      invalidatesTags: ["Ambulance"],
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