// app/service/blood.ts - Blood Bank API service with Hospital Filter for ALL roles

import { api } from "./api";
import { getAuthUser } from "../../src/utils/auth";

// ================= TYPES =================

export interface BloodBank {
  id?: string | number;
  _id?: string;
  bloodGroup: string;
  count: number;
  hospitalId?: string | number;
  lastUpdated?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BloodBankResponse {
  success: boolean;
  message: string;
  data?: BloodBank | BloodBank[];
  pagination?: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
  };
}

export interface GetBloodBankParams {
  id?: string | number;
  hospitalId?: string | number;
  bloodGroup?: string;
  search_query?: string;
  minCount?: number;
  maxCount?: number;
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

export const bloodBankApi = api.injectEndpoints({
  endpoints: (builder) => ({

    // ================= GET BLOOD BANKS =================
    getBloodBank: builder.query<
      BloodBankResponse,
      GetBloodBankParams | void
    >({
      query: (params: GetBloodBankParams = {}) => {
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
            console.warn("⚠️ No hospital ID found for filtering blood banks");
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

        // Blood group filter
        if (params.bloodGroup) {
          queryParams.append("bloodGroup", params.bloodGroup);
        }

        // Search query
        if (params.search_query) {
          queryParams.append("search_query", params.search_query);
        }

        // Count filters
        if (params.minCount !== undefined && params.minCount !== null) {
          queryParams.append("minCount", String(params.minCount));
        }

        if (params.maxCount !== undefined && params.maxCount !== null) {
          queryParams.append("maxCount", String(params.maxCount));
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
          url = `/blood-banks/${params.id}${queryString ? `?${queryString}` : ""}`;
        } else {
          url = `/blood-banks${queryString ? `?${queryString}` : ""}`;
        }
        
        return url;
      },

      providesTags: (result, error, params) => {
        if (params?.id && result?.data && !Array.isArray(result.data)) {
          return [{ type: "BloodBank", id: params.id }];
        }
        return ["BloodBank"];
      },
    }),

    // ================= CREATE BLOOD BANK =================
    createBloodBank: builder.mutation<
  BloodBankResponse,
  Omit<BloodBank, 'id' | 'createdAt' | 'updatedAt' | 'lastUpdated'>
>({
  query: (data) => {
    const auth = getAuthUser();

    // Explicit hospitalId from Super Admin page first.
    // Otherwise use logged-in user's hospital.
    const hospitalId =
      data.hospitalId !== undefined &&
      data.hospitalId !== null &&
      data.hospitalId !== ""
        ? Number(data.hospitalId)
        : getHospitalIdFromAuth(auth);

    return {
      url: "/blood-banks",
      method: "POST",
      body: {
        bloodGroup: data.bloodGroup,
        count: Number(data.count),
        hospitalId,
      },
    };
  },

  invalidatesTags: ["BloodBank"],
}),

    // ================= UPDATE BLOOD BANK =================
    updateBloodBank: builder.mutation<
      BloodBankResponse,
      {
        id: string | number;
        data: Partial<Omit<BloodBank, 'id' | 'hospitalId' | 'createdAt' | 'updatedAt'>>;
      }
    >({
      query: ({ id, data }) => {
        const auth = getAuthUser();
        const isSuperAdmin = auth?.role === 'super-admin';
        
        // Get hospital ID using helper
        let hospitalId: number | undefined;
        
        if (!isSuperAdmin) {
          // Try to get from auth
          const authHospitalId = getHospitalIdFromAuth(auth);
          if (authHospitalId) {
            hospitalId = authHospitalId;
          }
        }
        
        return {
          url: `/blood-banks/${id}`,
          method: "PUT",
          body: {
            bloodGroup: data.bloodGroup,
            count: data.count,
            hospitalId: hospitalId,
          },
        };
      },

      invalidatesTags: (result, error, { id }) => [
        { type: "BloodBank", id },
        "BloodBank",
      ],
    }),

    // ================= DELETE BLOOD BANK =================
    deleteBloodBank: builder.mutation<
      { message: string },
      string | number
    >({
      query: (id) => ({
        url: `/blood-banks/${id}`,
        method: "DELETE",
      }),

      invalidatesTags: (result, error, id) => [
        { type: "BloodBank", id },
        "BloodBank",
      ],
    }),
  }),
});

export const {
  useGetBloodBankQuery,
  useCreateBloodBankMutation,
  useUpdateBloodBankMutation,
  useDeleteBloodBankMutation,
} = bloodBankApi;