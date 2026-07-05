// app/service/category.ts - Category API service
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

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive?: boolean;
  parentCategoryId?: string | number | null;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive?: boolean;
  parentCategoryId?: string | number | null;
}

// ================= API =================

export const categoryApi = api.injectEndpoints({
  endpoints: (builder) => ({

    getCategory: builder.query<
      CategoryResponse,
      GetCategoryParams | void
    >({
      query: (params: GetCategoryParams = {}) => {
        const queryParams = new URLSearchParams();

        if (params?.name) {
          queryParams.append("name", params.name);
        }

        if (params?.search_query) {
          queryParams.append("search_query", params.search_query);
        }

        if (params?.isActive !== undefined) {
          queryParams.append("isActive", String(params.isActive));
        }

        if (params?.parentCategoryId !== undefined) {
          queryParams.append("parentCategoryId", String(params.parentCategoryId));
        }

        if (params?.page) {
          queryParams.append("page", String(params.page));
        }
        if (params?.limit) {
          queryParams.append("limit", String(params.limit));
        }

        if (params?.sortBy) {
          queryParams.append("sortBy", params.sortBy);
        }
        if (params?.sortOrder) {
          queryParams.append("sortOrder", params.sortOrder);
        }

        const queryString = queryParams.toString();

        if (params?.id) {
          return `/category/${params.id}${queryString ? `?${queryString}` : ""}`;
        }

        return `/category${queryString ? `?${queryString}` : ""}`;
      },

      providesTags: (result, error, params) => {
        if (params?.id && result?.data && !Array.isArray(result.data)) {
          return [{ type: "Category", id: params.id }];
        }
        return ["Category"];
      },
    }),

    getCategoryById: builder.query<
      CategoryResponse,
      string | number
    >({
      query: (id) => `/category/${id}`,
      providesTags: (result, error, id) => [{ type: "Category", id }],
    }),

    createCategory: builder.mutation<
      CategoryResponse,
      CreateCategoryRequest
    >({
      query: (categoryData) => ({
        url: "/category",
        method: "POST",
        body: categoryData,
      }),
      invalidatesTags: ["Category"],
    }),

    updateCategory: builder.mutation<
      CategoryResponse,
      { id: string | number; data: UpdateCategoryRequest }
    >({
      query: ({ id, data }) => ({
        url: `/category/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Category", id },
        "Category",
      ],
    }),

    deleteCategory: builder.mutation<
      CategoryResponse,
      string | number
    >({
      query: (id) => ({
        url: `/category/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Category", id },
        "Category",
      ],
    }),
  }),
});

export const {
  useGetCategoryQuery,
  useGetCategoryByIdQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoryApi;