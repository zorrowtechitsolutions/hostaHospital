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

// ================= HELPER FUNCTIONS =================

// Helper: Get hospital ID from auth (returns number)
const getHospitalIdFromAuth = (auth: any): number | null => {
  if (!auth) return null;
  
  // Priority 1: Use hospitalId if available (this is the correct hospital ID)
  if (auth.hospitalId) {
    return Number(auth.hospitalId);
  }
  
  return null;
};

// Helper: Get auth ID from auth
const getAuthIdFromAuth = (auth: any): string | null => {
  if (!auth) return null;
  
  // Priority: authId > id
  if (auth.authId) {
    return String(auth.authId);
  }
  
  if (auth.id) {
    return String(auth.id);
  }
  
  return null;
};

// Helper: Convert string | number to number safely
const toNumber = (value: string | number | undefined): number | undefined => {
  if (value === undefined || value === null) return undefined;
  return Number(value);
};

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
        
        // Determine if user is super admin
        const isSuperAdmin = auth?.role === 'super-admin';
        const shouldSkipFilter = params.skipHospitalFilter === true;

        // Get hospital ID using helper
        let hospitalIdToUse = null;
        
        // For non-super-admin users, always filter by hospital if they have one
        if (!isSuperAdmin && !shouldSkipFilter) {
          hospitalIdToUse = getHospitalIdFromAuth(auth);
          
          // If no hospitalId found, try params
          if (!hospitalIdToUse && params.hospitalId) {
            hospitalIdToUse = toNumber(params.hospitalId);
          }
          
          if (hospitalIdToUse) {
            queryParams.append("hospitalId", String(hospitalIdToUse));
          } else {
            console.warn("⚠️ No hospital ID found for filtering ambulances");
          }
        } 
        // Super Admin with specific hospital filter
        else if (isSuperAdmin && params.hospitalId) {
          queryParams.append("hospitalId", String(params.hospitalId));
        }
        // Use provided hospitalId if specified (for cases where we want to override)
        else if (params.hospitalId) {
          queryParams.append("hospitalId", String(params.hospitalId));
        }

        // User ID filter (this should use authId, not hospitalId)
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
        
        // Get hospital ID using helper
        let hospitalId: number | undefined = data.hospitalId;
        
        if (!hospitalId && !isSuperAdmin) {
          // Try to get from auth
          const authHospitalId = getHospitalIdFromAuth(auth);
          if (authHospitalId) {
            hospitalId = authHospitalId;
          }
        }
        
        // Get userId (this is the authId)
        
        return {
          url: "/ambulance",
          method: "POST",
          body: {
            serviceName: data.serviceName,
            phone: data.phone,
            vehicleType: data.vehicleType,
            address: data.address,
            hospitalId: hospitalId,
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
        
        // Get hospital ID using helper
        let hospitalId: number | undefined = data.hospitalId;
        
        if (!hospitalId && !isSuperAdmin) {
          // Try to get from auth
          const authHospitalId = getHospitalIdFromAuth(auth);
          if (authHospitalId) {
            hospitalId = authHospitalId;
          }
        }
        
        // Get userId (this is the authId)
        
        return {
          url: `/ambulance/${id}`,
          method: "PUT",
          body: {
            serviceName: data.serviceName,
            phone: data.phone,
            vehicleType: data.vehicleType,
            address: data.address,
            hospitalId: hospitalId,
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