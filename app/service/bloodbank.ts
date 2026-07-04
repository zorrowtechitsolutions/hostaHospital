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
  hospitalId?: string | number;
  bloodGroup?: string;
  search_query?: string;
  minCount?: number;
  maxCount?: number;
}

// ================= API =================

export const bloodBankApi = api.injectEndpoints({
  endpoints: (builder) => ({

    getBloodBank: builder.query<
      BloodBankResponse,
      GetBloodBankParams | void
    >({
      query: (params: GetBloodBankParams = {}) => {
        const queryParams = new URLSearchParams();
        
        if (params?.hospitalId) {
          queryParams.append("hospitalId", String(params.hospitalId));
        }

        if (params?.bloodGroup) {
          queryParams.append("bloodGroup", params.bloodGroup);
        }

        if (params?.search_query) {
          queryParams.append("search_query", params.search_query);
        }

        if (params?.minCount) {
          queryParams.append("minCount", String(params.minCount));
        }

        if (params?.maxCount) {
          queryParams.append("maxCount", String(params.maxCount));
        }

        const queryString = queryParams.toString();

        if (params?.id) {
          return `/blood-banks/${params.id}${queryString ? `?${queryString}` : ""}`;
        }

        return `/blood-banks${queryString ? `?${queryString}` : ""}`;
      },

      providesTags: (result, error, params) => {
        if (params?.id && result?.data && !Array.isArray(result.data)) {
          return [{ type: "BloodBank", id: params.id }];
        }
        return ["BloodBank"];
      },
    }),

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