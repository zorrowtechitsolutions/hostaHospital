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

    getAmbulance: builder.query<
      AmbulanceResponse,
      GetAmbulanceParams | void
    >({
      query: (params: GetAmbulanceParams = {}) => {
        const queryParams = new URLSearchParams();

        if (params.hospitalId) {
          queryParams.append("hospitalId", String(params.hospitalId));
        }

        if (params.userId) {
          queryParams.append("userId", String(params.userId));
        }

        if (params.name) {
          queryParams.append("name", params.name);
        }

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

        if (params.vehicleType) {
          queryParams.append("vehicleType", params.vehicleType);
        }

        if (params.search_query) {
          queryParams.append("search_query", params.search_query);
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