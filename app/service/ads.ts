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
        console.log("🚀 ADS REQUEST");
        console.log("🔑 TOKEN:", getToken());
        console.log("📦 PARAMS:", params);
        
        const auth = getAuthUser();
        const queryParams = new URLSearchParams();
        
        console.log("👤 AUTH USER:", auth);
        console.log("👤 AUTH ROLE:", auth?.role);
        console.log("👤 AUTH ROLE ID:", auth?.roleId);
        
        // FIX: Only auto-inject hospitalId for Hospital Admins, not Super Admin
        const isHospitalAdminUser = isHospitalAdmin();
        const isSuperAdminUser = isSuperAdmin();
        
        console.log("🏥 Is Hospital Admin:", isHospitalAdminUser);
        console.log("👑 Is Super Admin:", isSuperAdminUser);
        
        // Priority 1: Use explicit hospitalId from params
        if (params?.hospitalId) {
          queryParams.append("hospitalId", String(params.hospitalId));
          console.log(`📌 Using explicit hospitalId: ${params.hospitalId}`);
        }
        // Priority 2: Only auto-inject for Hospital Admins (not Super Admin)
        else if (isHospitalAdminUser && auth?.id) {
          queryParams.append("hospitalId", String(auth.id));
          console.log(`🏥 Auto-injected hospitalId for hospital admin: ${auth.id}`);
        }
        // Priority 3: Super Admin sees all ads (no hospital filter)
        else if (isSuperAdminUser) {
          console.log("👑 Super Admin - No hospital filter (seeing all ads)");
        }
        // Priority 4: Fallback to getHospitalId() only if not Super Admin
        else {
          const fallbackHospitalId = getHospitalId();
          if (fallbackHospitalId && !isSuperAdminUser) {
            queryParams.append("hospitalId", String(fallbackHospitalId));
            console.log(`🔄 Fallback hospitalId: ${fallbackHospitalId}`);
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
        
        console.log("🌐 FINAL URL:", url);
        
        // If ID is provided, get single ad
        if (params?.id) {
          const singleUrl = `/ads/${params.id}${queryString ? `?${queryString}` : ""}`;
          console.log("📍 SINGLE AD URL:", singleUrl);
          return singleUrl;
        }

        // Otherwise get all ads
        console.log("📋 ALL ADS URL:", url);
        return url;
      },

      providesTags: (result, error, params) => {
        console.log("🏷️ PROVIDES TAGS - result:", result, "error:", error, "params:", params);
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
        
        console.log("📝 CREATE AD REQUEST");
        console.log("👤 AUTH USER:", auth);
        console.log("📦 DATA:", data);
        
        // Determine which hospitalId to use
        let hospitalId = data.hospitalId;
        
        // If no hospitalId provided in data, use the authenticated user's hospitalId
        if (!hospitalId) {
          if (isHospitalAdminUser && auth?.id) {
            hospitalId = auth.id;
            console.log(`🏥 Using authenticated hospital admin ID: ${hospitalId}`);
          } else if (isSuperAdminUser) {
            console.log("⚠️ Super Admin creating ad - hospitalId is required!");
            // Super Admin must provide hospitalId in the data
            throw new Error("Super Admin must select a hospital when creating an ad");
          }
        }
        
        console.log("🏥 FINAL HOSPITAL ID:", hospitalId);
        
        const requestBody = {
          imageUrl: data.imageUrl,
          startDate: data.startDate,
          endDate: data.endDate,
          kilometer: data.kilometer,
          isActive: data.isActive,
          hospitalId: hospitalId,
        };
        
        console.log("📤 REQUEST BODY:", requestBody);
        
        return {
          url: "/ads",
          method: "POST",
          body: requestBody,
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
        console.log("✏️ UPDATE AD REQUEST");
        console.log("🆔 AD ID:", id);
        console.log("📦 UPDATE DATA:", data);
        
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
        
        console.log("📤 REQUEST BODY:", requestBody);
        
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
        console.log("🗑️ DELETE AD REQUEST");
        console.log("🆔 AD ID:", id);
        
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