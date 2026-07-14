// app/service/ambulance.ts - Ambulance API service with Hospital Filter for ALL roles

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
  skipHospitalFilter?: boolean;
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

        const auth = getAuthUser();
        
        // 🔥 FIX: Include ALL roles that should be filtered by hospital
        const isSuperAdmin = auth?.role === 'super-admin';
        const isHospitalAdmin = auth?.role === 'hospital' || auth?.roleId === 2;
        const isDoctor = auth?.role === 'doctor' || auth?.roleId === 46;
        const isStaff = auth?.role === 'staff' || auth?.roleId === 3; // ✅ ADDED staff role
        const skipHospitalFilter = params.skipHospitalFilter === true;
        
        // 🔥 FIX: Filter by hospital for ALL hospital-bound users (Doctors, Hospital Admins, AND Staff)
        const shouldFilterByHospital = (isHospitalAdmin || isDoctor || isStaff) && !skipHospitalFilter;

        // 🔥 FIX: Get hospital ID properly for all roles
        let hospitalIdToUse = null;
        
        if (shouldFilterByHospital) {
          // Priority: auth.hospitalId > auth.id > params.hospitalId
          if (auth?.hospitalId) {
            hospitalIdToUse = auth.hospitalId;
          } else if (auth?.id) {
            hospitalIdToUse = auth.id;
          } else {
            hospitalIdToUse = params.hospitalId;
          }
          
          if (hospitalIdToUse) {
            queryParams.append("hospitalId", String(hospitalIdToUse));
          } else {
            console.warn(`⚠️ No hospital ID found for ${auth?.role} ambulance filtering`);
          }
        } 
        // Super Admin with specific hospital filter
        else if (isSuperAdmin && params.hospitalId) {
          queryParams.append("hospitalId", String(params.hospitalId));
        }
        // Use provided hospitalId if specified
        else if (params.hospitalId) {
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
        if (params.vehicleType && params.vehicleType !== 'all') {
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

        let url;
        if (params.id) {
          url = `/ambulance/${params.id}${queryString ? `?${queryString}` : ""}`;
        } else {
          url = `/ambulance${queryString ? `?${queryString}` : ""}`;
        }
        
        return url;
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
      Omit<Ambulance, 'id' | 'createdAt' | 'updatedAt'>
    >({
      query: (data) => {
        const auth = getAuthUser();
        const isSuperAdmin = auth?.role === 'super-admin';
        const isHospitalAdmin = auth?.role === 'hospital' || auth?.roleId === 2;
        const isDoctor = auth?.role === 'doctor' || auth?.roleId === 46;
        const isStaff = auth?.role === 'staff' || auth?.roleId === 3; // ✅ ADDED staff role
        
        // 🔥 FIX: Use hospitalId for ALL roles
        let hospitalId = data.hospitalId;
        
        if (!hospitalId && !isSuperAdmin) {
          // 🔥 FIX: Priority: auth.hospitalId > auth.id for all roles
          if (auth?.hospitalId) {
            hospitalId = auth.hospitalId;
          } else if (auth?.id && (isHospitalAdmin || isDoctor || isStaff)) {
            hospitalId = auth.id;
          }
        }
        
        return {
          url: "/ambulance",
          method: "POST",
          body: {
            serviceName: data.serviceName,
            phone: data.phone,
            vehicleType: data.vehicleType,
            address: data.address,
            hospitalId: hospitalId,
            userId: data.userId || auth?.id,
            name: data.name,
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
        data: Partial<Omit<Ambulance, 'id' | 'createdAt' | 'updatedAt'>>;
      }
    >({
      query: ({ id, data }) => {
        const auth = getAuthUser();
        const isSuperAdmin = auth?.role === 'super-admin';
        const isHospitalAdmin = auth?.role === 'hospital' || auth?.roleId === 2;
        const isDoctor = auth?.role === 'doctor' || auth?.roleId === 46;
        const isStaff = auth?.role === 'staff' || auth?.roleId === 3; // ✅ ADDED staff role
        
        // 🔥 FIX: Use hospitalId for ALL roles
        let hospitalId = data.hospitalId;
        
        if (!hospitalId && !isSuperAdmin) {
          // 🔥 FIX: Priority: auth.hospitalId > auth.id for all roles
          if (auth?.hospitalId) {
            hospitalId = auth.hospitalId;
          } else if (auth?.id && (isHospitalAdmin || isDoctor || isStaff)) {
            hospitalId = auth.id;
          }
        }
        
        return {
          url: `/ambulance/${id}`,
          method: "PUT",
          body: {
            serviceName: data.serviceName,
            phone: data.phone,
            vehicleType: data.vehicleType,
            address: data.address,
            hospitalId: hospitalId,
            userId: data.userId || auth?.id,
            name: data.name,
          },
        };
      },

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
      query: (id) => {
        return {
          url: `/ambulance/${id}`,
          method: "DELETE",
        };
      },

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