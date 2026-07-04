// app/service/ads.ts - Ads API service
import { api } from "./api";
import { getAuthUser, getHospitalId, getToken } from "../../src/utils/auth";

// ================= TYPES =================

export interface Ad {
  id?: number;
  imageUrl: string;
  startDate: string;
  endDate: string;
  kilometer: number;
  hospitalId?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdResponse {
  success: boolean;
  message: string;
  data?: Ad | Ad[];
  pagination?: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
  };
}

export interface GetAdParams {
  id?: string | number;
  hospitalId?: string | number;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
  search_query?: string;
  page?: number;
  limit?: number;
}

// Helper to check if user is Super Admin
const isSuperAdmin = (): boolean => {
  const auth = getAuthUser();
  return auth?.role === 'super_admin' || auth?.roleId === 1;
};

// Helper to check if user is Hospital Admin
const isHospitalAdmin = (): boolean => {
  const auth = getAuthUser();
  return auth?.role === 'hospital' || auth?.roleId === 2;
};

// ================= API =================

export const adsApi = api.injectEndpoints({
  endpoints: (builder) => ({

    // ================= GET ADS =================
    getAds: builder.query<AdResponse, GetAdParams | void>({
      query: (params: GetAdParams = {}) => {
        const auth = getAuthUser();
        const queryParams = new URLSearchParams();
        
        const isHospitalAdminUser = isHospitalAdmin();
        const isSuperAdminUser = isSuperAdmin();
        
        // Priority 1: Use explicit hospitalId from params
        if (params?.hospitalId) {
          queryParams.append("hospitalId", String(params.hospitalId));
        }
        // Priority 2: Only auto-inject for Hospital Admins (not Super Admin)
        else if (isHospitalAdminUser && auth?.id) {
          queryParams.append("hospitalId", String(auth.id));
        }
        // Priority 3: Super Admin sees all ads (no hospital filter)
        // Priority 4: Fallback to getHospitalId() only if not Super Admin
        else {
          const fallbackHospitalId = getHospitalId();
          if (fallbackHospitalId && !isSuperAdminUser) {
            queryParams.append("hospitalId", String(fallbackHospitalId));
          }
        }

        // Filter by active status
        if (params?.isActive !== undefined) {
          queryParams.append("isActive", String(params.isActive));
        }

        // Date filters
        if (params?.startDate) {
          queryParams.append("startDate", params.startDate);
        }

        if (params?.endDate) {
          queryParams.append("endDate", params.endDate);
        }

        // Search query
        if (params?.search_query) {
          queryParams.append("search_query", params.search_query);
        }

        // Pagination
        if (params?.page) {
          queryParams.append("page", String(params.page));
        }

        if (params?.limit) {
          queryParams.append("limit", String(params.limit));
        }

        const queryString = queryParams.toString();
        const url = queryString ? `/ads?${queryString}` : "/ads";
        
        // If ID is provided, get single ad
        if (params?.id) {
          return `/ads/${params.id}${queryString ? `?${queryString}` : ""}`;
        }

        return url;
      },

      providesTags: (result, error, params) => {
        if (params?.id && result?.data && !Array.isArray(result.data)) {
          return [{ type: "Ads", id: params.id }];
        }
        return ["Ads"];
      },
    }),

    // ================= CREATE AD =================
    createAd: builder.mutation<
      AdResponse,
      Omit<Ad, 'id' | 'createdAt' | 'updatedAt'>
    >({
      query: (data) => {
        const auth = getAuthUser();
        const isHospitalAdminUser = isHospitalAdmin();
        const isSuperAdminUser = isSuperAdmin();
        
        let hospitalId = data.hospitalId;
        
        if (!hospitalId) {
          if (isHospitalAdminUser && auth?.id) {
            hospitalId = auth.id;
          } else if (isSuperAdminUser) {
            throw new Error("Super Admin must select a hospital when creating an ad");
          }
        }
        
        return {
          url: "/ads",
          method: "POST",
          body: {
            imageUrl: data.imageUrl,
            startDate: data.startDate,
            endDate: data.endDate,
            kilometer: data.kilometer,
            isActive: data.isActive,
            hospitalId: hospitalId,
          },
        };
      },

      invalidatesTags: ["Ads"],
    }),

    // ================= UPDATE AD =================
    updateAd: builder.mutation<
      AdResponse,
      {
        id: string | number;
        data: Partial<Omit<Ad, 'id' | 'createdAt' | 'updatedAt'>>;
      }
    >({
      query: ({ id, data }) => {
        const requestBody: any = {
          imageUrl: data.imageUrl,
          startDate: data.startDate,
          endDate: data.endDate,
          kilometer: data.kilometer,
          isActive: data.isActive,
        };

        if (data.hospitalId) {
          requestBody.hospitalId = data.hospitalId;
        }
        
        return {
          url: `/ads/${id}`,
          method: "PUT",
          body: requestBody,
        };
      },

      invalidatesTags: (result, error, { id }) => [
        { type: "Ads", id },
        "Ads",
      ],
    }),

    // ================= DELETE AD =================
    deleteAd: builder.mutation<
      { message: string },
      string | number
    >({
      query: (id) => {
        return {
          url: `/ads/${id}`,
          method: "DELETE",
        };
      },

      invalidatesTags: (result, error, id) => [
        { type: "Ads", id },
        "Ads",
      ],
    }),
  }),
});

// ================= EXPORT HOOKS =================

export const {
  useGetAdsQuery,
  useCreateAdMutation,
  useUpdateAdMutation,
  useDeleteAdMutation,
} = adsApi;