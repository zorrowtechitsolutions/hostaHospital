// app/service/speciality.ts - Speciality API service
import { api } from "./api";

// ================= TYPES =================

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

// ================= API =================

export const specialityApi = api.injectEndpoints({
  // ✅ Add this to prevent the override error
  overrideExisting: false,
  
  endpoints: (builder) => ({

    // ================= GET SPECIALITIES =================
    getSpecialities: builder.query<SpecialityResponse, GetSpecialityParams | void>({
      query: (params: GetSpecialityParams = {}) => {
        console.log("🚀 SPECIALITIES REQUEST");
        console.log("📦 PARAMS:", params);
        
        const queryParams = new URLSearchParams();
        
        // Filter by name
        if (params?.name) {
          queryParams.append("name", params.name);
        }

        // Search query
        if (params?.search_query) {
          queryParams.append("search_query", params.search_query);
        }

        // Pagination (if your backend supports it)
        if (params?.page) {
          queryParams.append("page", String(params.page));
        }

        if (params?.limit) {
          queryParams.append("limit", String(params.limit));
        }

        const queryString = queryParams.toString();
        const url = queryString ? `/speciality?${queryString}` : "/speciality";
        
        console.log("🌐 REQUEST URL:", url);
        
        // If ID is provided, get single speciality
        if (params?.id) {
          const singleUrl = `/speciality/${params.id}`;
          console.log("📍 SINGLE SPECIALITY URL:", singleUrl);
          return singleUrl;
        }

        // Otherwise get all specialities
        console.log("📋 ALL SPECIALITIES URL:", url);
        return url;
      },

      providesTags: (result, error, params) => {
        if (params?.id && result?.data && !Array.isArray(result.data)) {
          return [{ type: "speciality" as const, id: params.id }];
        }
        return ["speciality"];
      },
    }),

    // ================= REGISTER SPECIALITY =================
    registerSpeciality: builder.mutation<
      SpecialityResponse,
      { name: string; imageUrl?: string; isActive?: boolean }
    >({
      query: (data) => {
        console.log("📝 REGISTER SPECIALITY REQUEST");
        console.log("📦 DATA:", data);
        
        const requestBody = {
          name: data.name,
          imageUrl: data.imageUrl || null,
          isActive: data.isActive !== undefined ? data.isActive : true,
        };
        
        console.log("📤 REQUEST BODY:", requestBody);
        
        return {
          url: "/speciality",
          method: "POST",
          body: requestBody,
        };
      },

      invalidatesTags: ["speciality"],
    }),

    // ================= UPDATE SPECIALITY =================
    updateSpeciality: builder.mutation<
      SpecialityResponse,
      {
        id: string | number;
        data: Partial<Omit<Speciality, 'id' | 'createdAt' | 'updatedAt'>>;
      }
    >({
      query: ({ id, data }) => {
        console.log("✏️ UPDATE SPECIALITY REQUEST");
        console.log("🆔 SPECIALITY ID:", id);
        console.log("📦 UPDATE DATA:", data);
        
        const requestBody = {
          name: data.name,
          imageUrl: data.imageUrl !== undefined ? data.imageUrl : null,
          isActive: data.isActive,
        };
        
        console.log("📤 REQUEST BODY:", requestBody);
        
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

    // ================= DELETE SPECIALITY =================
    deleteSpeciality: builder.mutation<
      SpecialityResponse,
      string | number
    >({
      query: (id) => {
        console.log("🗑️ DELETE SPECIALITY REQUEST");
        console.log("🆔 SPECIALITY ID:", id);
        
        return {
          url: `/speciality/${id}`,
          method: "DELETE",
        };
      },

      invalidatesTags: (result, error, id) => [
        { type: "speciality" as const, id },
        "speciality",
      ],
    }),
  }),
});

// ================= EXPORT HOOKS =================

export const {
  useGetSpecialitiesQuery,
  useRegisterSpecialityMutation,
  useUpdateSpecialityMutation,
  useDeleteSpecialityMutation,
} = specialityApi;