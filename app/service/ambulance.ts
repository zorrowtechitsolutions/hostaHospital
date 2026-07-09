// app/service/ambulance.ts - Ambulance API service with Hospital Filter for Doctors
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
        const isHospitalAdmin = auth?.role === 'hospital' || auth?.roleId === 2;
        const isDoctor = auth?.role === 'doctor' || auth?.roleId === 46;
        const isSuperAdmin = auth?.role === 'super-admin';
        const skipHospitalFilter = params.skipHospitalFilter === true;
        
        // 🔥 FIX: Apply hospital filter for doctors AND hospital admins
        const shouldFilterByHospital = (isHospitalAdmin || isDoctor) && !skipHospitalFilter;

        console.log("🚑 Ambulance API - Full Auth:", auth);
        console.log("🚑 Ambulance API - User Role:", auth?.role, "RoleId:", auth?.roleId);
        console.log("👨‍⚕️ Ambulance API - Is Doctor:", isDoctor);
        console.log("🏥 Ambulance API - Is Hospital Admin:", isHospitalAdmin);
        console.log("👑 Ambulance API - Is Super Admin:", isSuperAdmin);
        console.log("🔒 Ambulance API - Should Filter By Hospital:", shouldFilterByHospital);
        console.log("📋 Ambulance API - Auth ID (Doctor ID):", auth?.id);
        console.log("📋 Ambulance API - Auth Hospital ID:", auth?.hospitalId);

        // 🔥 CRITICAL FIX: Use hospitalId, NOT auth.id
        let hospitalIdToUse = null;
        
        if (shouldFilterByHospital) {
          // 🔥 FIX: Priority: params.hospitalId > auth.hospitalId > auth.id
          // For doctors, auth.hospitalId contains the actual hospital ID
          hospitalIdToUse = params.hospitalId || auth?.hospitalId || auth?.id;
          
          if (hospitalIdToUse) {
            queryParams.append("hospitalId", String(hospitalIdToUse));
            console.log("🔒 Doctor/Hospital Admin - Filtering ambulances by hospital ID:", hospitalIdToUse);
          } else {
            console.warn("⚠️ No hospital ID found for ambulance filtering - will not apply filter");
          }
        } else if (params.hospitalId) {
          // Use provided hospitalId if specified (for super admin)
          queryParams.append("hospitalId", String(params.hospitalId));
          console.log("📋 Using provided hospital ID:", params.hospitalId);
        } else {
          console.log("📋 No hospital filter applied - showing all ambulances");
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
        
        console.log('📡 Ambulance API Request URL:', url);
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
        const isHospitalAdmin = auth?.role === 'hospital' || auth?.roleId === 2;
        const isDoctor = auth?.role === 'doctor' || auth?.roleId === 46;
        
        // 🔥 FIX: Use hospitalId, NOT auth.id
        let hospitalId = data.hospitalId;
        
        if (!hospitalId && (isHospitalAdmin || isDoctor)) {
          // 🔥 FIX: Priority: auth.hospitalId > auth.id
          hospitalId = auth?.hospitalId || auth?.id;
        }
        
        console.log("🚑 CREATE AMBULANCE - Auth ID (Doctor ID):", auth?.id);
        console.log("🚑 CREATE AMBULANCE - Auth Hospital ID:", auth?.hospitalId);
        console.log("🚑 CREATE AMBULANCE - Provided hospitalId:", data.hospitalId);
        console.log("🚑 CREATE AMBULANCE - Final hospitalId:", hospitalId);
        
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
        const isHospitalAdmin = auth?.role === 'hospital' || auth?.roleId === 2;
        const isDoctor = auth?.role === 'doctor' || auth?.roleId === 46;
        
        // 🔥 FIX: Use hospitalId, NOT auth.id
        let hospitalId = data.hospitalId;
        
        if (!hospitalId && (isHospitalAdmin || isDoctor)) {
          // 🔥 FIX: Priority: auth.hospitalId > auth.id
          hospitalId = auth?.hospitalId || auth?.id;
        }
        
        console.log("🚑 UPDATE AMBULANCE - ID:", id);
        console.log("🚑 UPDATE AMBULANCE - Auth ID (Doctor ID):", auth?.id);
        console.log("🚑 UPDATE AMBULANCE - Auth Hospital ID:", auth?.hospitalId);
        console.log("🚑 UPDATE AMBULANCE - Provided hospitalId:", data.hospitalId);
        console.log("🚑 UPDATE AMBULANCE - Final hospitalId:", hospitalId);
        
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
        console.log("🚑 DELETE AMBULANCE - ID:", id);
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