// app/service/speciality.ts - Speciality API service
import { api } from "./api";

export interface Speciality {
  id?: number;
  name: string;
  imageUrl?: string;
  isActive?: boolean;
  isDelete?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SpecialityResponse {
  success: boolean;
  message: string;
  data?: Speciality | Speciality[];
  count?: number;
  error?: any;
  status?: string;
}

export interface GetSpecialityParams {
  id?: string | number;
  name?: string;
  search_query?: string;
  page?: number;
  limit?: number;
}

export const specialityApi = api.injectEndpoints({
  overrideExisting: false,
  
  endpoints: (builder) => ({

    getSpecialities: builder.query<SpecialityResponse, GetSpecialityParams | void>({
      query: (params: GetSpecialityParams = {}) => {
        const queryParams = new URLSearchParams();
        
        if (params?.name) {
          queryParams.append("name", params.name);
        }

        if (params?.search_query) {
          queryParams.append("search_query", params.search_query);
        }

        if (params?.page) {
          queryParams.append("page", String(params.page));
        }

        if (params?.limit) {
          queryParams.append("limit", String(params.limit));
        }

        const queryString = queryParams.toString();
        const url = queryString ? `/speciality?${queryString}` : "/speciality";
        
        if (params?.id) {
          return `/speciality/${params.id}`;
        }

        return url;
      },

      providesTags: (result, error, params) => {
        if (params?.id && result?.data && !Array.isArray(result.data)) {
          return [{ type: "speciality" as const, id: params.id }];
        }
        return ["speciality"];
      },
    }),

    registerSpeciality: builder.mutation<
      SpecialityResponse,
      { name: string; imageUrl?: string; isActive?: boolean }
    >({
      query: (data) => {
        const requestBody = {
          name: data.name,
          imageUrl: data.imageUrl || null,
          isActive: data.isActive !== undefined ? data.isActive : true,
        };
        
        return {
          url: "/speciality",
          method: "POST",
          body: requestBody,
        };
      },

      invalidatesTags: ["speciality"],
    }),

    updateSpeciality: builder.mutation<
      SpecialityResponse,
      {
        id: string | number;
        data: Partial<Omit<Speciality, 'id' | 'createdAt' | 'updatedAt'>>;
      }
    >({
      query: ({ id, data }) => {
        const requestBody = {
          name: data.name,
          imageUrl: data.imageUrl !== undefined ? data.imageUrl : null,
          isActive: data.isActive,
        };
        
        return {
          url: `/speciality/${id}`,
          method: "PUT",
          body: requestBody,
        };
      },

      invalidatesTags: (result, error, { id }) => [
        { type: "speciality" as const, id },
        "speciality",
      ],
    }),

    deleteSpeciality: builder.mutation<
      SpecialityResponse,
      string | number
    >({
      query: (id) => ({
        url: `/speciality/${id}`,
        method: "DELETE",
      }),

      invalidatesTags: (result, error, id) => [
        { type: "speciality" as const, id },
        "speciality",
      ],
    }),
  }),
});

export const {
  useGetSpecialitiesQuery,
  useRegisterSpecialityMutation,
  useUpdateSpecialityMutation,
  useDeleteSpecialityMutation,
} = specialityApi;