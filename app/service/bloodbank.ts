// app/service/blood.ts - Blood Bank API service

import { api } from "./api";
import { getHospitalId, getAuthUser } from "../../src/utils/auth";

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
}

export interface GetBloodBankParams {
  id?: string | number;
  hospitalId?: string | number;  // Support for Super Admin to fetch specific hospital
  bloodGroup?: string;  
  search_query?: string;
  minCount?: number;
  maxCount?: number;
}

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
        
        // ✅ FIX: Only add hospitalId if explicitly provided in params
        // Don't auto-inject from auth - let the caller decide
        if (params?.hospitalId) {
          queryParams.append("hospitalId", String(params.hospitalId));
        }

        // Filter by blood group
        if (params?.bloodGroup) {
          queryParams.append("bloodGroup", params.bloodGroup);
        }

        // Search query (searches bloodGroup)
        if (params?.search_query) {
          queryParams.append("search_query", params.search_query);
        }

        // Filter by minimum count
        if (params?.minCount) {
          queryParams.append("minCount", String(params.minCount));
        }

        // Filter by maximum count
        if (params?.maxCount) {
          queryParams.append("maxCount", String(params.maxCount));
        }

        const queryString = queryParams.toString();

        // If ID is provided, get single blood bank record
        if (params?.id) {
          return `/blood-banks/${params.id}${queryString ? `?${queryString}` : ""}`;
        }

        // Otherwise get all blood bank records
        return `/blood-banks${queryString ? `?${queryString}` : ""}`;
      },

      providesTags: (result, error, params) => {
        // If we have a single blood bank, provide a specific tag
        if (params?.id && result?.data && !Array.isArray(result.data)) {
          return [{ type: "BloodBank", id: params.id }];
        }
        // Otherwise provide the general tag
        return ["BloodBank"];
      },
    }),

    // ================= CREATE BLOOD BANK =================
    // Automatically adds hospitalId from authenticated user
    createBloodBank: builder.mutation<
      BloodBankResponse,
      Omit<BloodBank, 'id' | 'hospitalId' | 'createdAt' | 'updatedAt' | 'lastUpdated'>
    >({
      query: (data) => {
        const hospitalId = getHospitalId();
        
        return {
          url: "/blood-banks",
          method: "POST",
          body: {
            bloodGroup: data.bloodGroup,
            count: data.count,
            hospitalId: hospitalId,
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
      query: ({ id, data }) => ({
        url: `/blood-banks/${id}`,
        method: "PUT",
        body: {
          bloodGroup: data.bloodGroup,
          count: data.count,
        },
      }),

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

// ================= EXPORT HOOKS =================

export const {
  useGetBloodBankQuery,
  useCreateBloodBankMutation,
  useUpdateBloodBankMutation,
  useDeleteBloodBankMutation,
} = bloodBankApi;