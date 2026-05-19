// app/service/blood.ts - Blood Bank API service

import { api } from "./api";
import { getHospitalId } from "../../src/utils/auth";

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
}

// ================= API =================

export const bloodBankApi = api.injectEndpoints({
  endpoints: (builder) => ({

    // ================= GET BLOOD BANKS =================
    // Automatically adds hospitalId from authenticated user
    getBloodBank: builder.query<
      BloodBankResponse,
      GetBloodBankParams | void
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        
        // Auto-inject hospitalId from auth
        const hospitalId = getHospitalId();
        if (hospitalId) {
          queryParams.append("hospitalId", String(hospitalId));
        }

        const queryString = queryParams.toString();

        // If ID is provided, get single blood bank record
        if (params?.id) {
          return `/blood-banks/${params.id}${queryString ? `?${queryString}` : ""}`;
        }

        // Otherwise get all blood bank records for the hospital
        return `/blood-banks${queryString ? `?${queryString}` : ""}`;
      },

      providesTags: (result, error, params) => {
        // If we have a single record, provide a specific tag
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
      Omit<BloodBank, 'id' | 'hospitalId' | 'createdAt' | 'updatedAt'>
    >({
      query: (data) => {
        const hospitalId = getHospitalId();
        
        return {
          url: "/blood-banks",
          method: "POST",
          body: {
            bloodGroup: data.bloodGroup,
            count: data.count,
            hospitalId: hospitalId, // Auto-inject from auth
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
        data: Partial<Omit<BloodBank, 'id' | 'hospitalId'>>;
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