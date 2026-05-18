// app/service/blood.ts - Blood Bank API service

import { api } from "./api";

// ================= TYPES =================

export interface BloodBank {
  id?: string | number;
  _id?: string;
  bloodGroup: string;
  count: number;
  hospitalId?: string | number;
  status?: "excellent" | "sufficient" | "moderate" | "low" | "critical";
  lastUpdated?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BloodBankResponse {
  success: boolean;
  message: string;
  data?: BloodBank | BloodBank[];
}

// ================= API =================

export const bloodBankApi = api.injectEndpoints({
  endpoints: (builder) => ({

    // ================= GET BLOOD BANKS =================

    getBloodBank: builder.query<
      BloodBankResponse,
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
          ? `/blood-banks/${params.id}`
          : `/blood-banks${queryString ? `?${queryString}` : ""}`;
      },

      providesTags: ["BloodBank"],
    }),

    // ================= CREATE BLOOD BANK =================

    createBloodBank: builder.mutation<
      BloodBankResponse,
      Partial<BloodBank>
    >({
      query: (data) => ({
        url: "/blood-banks",
        method: "POST",
        body: {
          bloodGroup: data.bloodGroup,
          count: data.count,
          hospitalId: data.hospitalId,
        },
      }),

      invalidatesTags: ["BloodBank"],
    }),

    // ================= UPDATE BLOOD BANK =================

    updateBloodBank: builder.mutation<
      BloodBankResponse,
      {
        id: string | number;
        data: Partial<BloodBank>;
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

      invalidatesTags: ["BloodBank"],
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