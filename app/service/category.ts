// app/service/category.ts - Category API service (GET only, no hospitalId)

import { api } from "./api";

// ================= TYPES =================

export interface Category {
  id?: string | number;
  _id?: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive?: boolean;
  parentCategoryId?: string | number | null;
  subCategories?: Category[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryResponse {
  success: boolean;
  message: string;
  data?: Category | Category[];
  pagination?: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface GetCategoryParams {
  id?: string | number;
  name?: string;
  search_query?: string;
  isActive?: boolean;
  parentCategoryId?: string | number | null;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ================= API =================

export const categoryApi = api.injectEndpoints({
  endpoints: (builder) => ({

    // ================= GET CATEGORIES =================
    getCategory: builder.query<
      CategoryResponse,
      GetCategoryParams | void
    >({
      query: (params: GetCategoryParams = {}) => {
        const queryParams = new URLSearchParams();

        // Filter by name
        if (params?.name) {
          queryParams.append("name", params.name);
        }

        // Search query (searches name and description)
        if (params?.search_query) {
          queryParams.append("search_query", params.search_query);
        }

        // Filter by active status
        if (params?.isActive !== undefined) {
          queryParams.append("isActive", String(params.isActive));
        }

        // Filter by parent category (for subcategories)
        if (params?.parentCategoryId !== undefined) {
          queryParams.append("parentCategoryId", String(params.parentCategoryId));
        }

        // Pagination
        if (params?.page) {
          queryParams.append("page", String(params.page));
        }
        if (params?.limit) {
          queryParams.append("limit", String(params.limit));
        }

        // Sorting
        if (params?.sortBy) {
          queryParams.append("sortBy", params.sortBy);
        }
        if (params?.sortOrder) {
          queryParams.append("sortOrder", params.sortOrder);
        }

        const queryString = queryParams.toString();

        // If ID is provided, get single category
        if (params?.id) {
          return `/categories/${params.id}${queryString ? `?${queryString}` : ""}`;
        }

        // Otherwise get all categories
        return `/categories${queryString ? `?${queryString}` : ""}`;
      },

      providesTags: (result, error, params) => {
        // If we have a single category, provide a specific tag
        if (params?.id && result?.data && !Array.isArray(result.data)) {
          return [{ type: "Category", id: params.id }];
        }
        // Otherwise provide the general tag
        return ["Category"];
      },
    }),
  }),
});

// ================= EXPORT HOOKS =================

export const {
  useGetCategoryQuery,
} = categoryApi;