// app/service/permission.ts
import { api } from "./api";

// ================= TYPES =================

export interface Permission {
  id: number;
  name: string;
  module: string;
  action: string;
  description?: string;
  hospitalId?: number; // Keep for type compatibility, but not used in queries
  createdAt?: string;
  updatedAt?: string;
}

export interface PermissionResponse {
  success: boolean;
  message?: string;
  data?: Permission[];
  pagination?: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
  };
}

// ================= API =================

export const permissionApi = api.injectEndpoints({
  endpoints: (builder) => ({
    
    // ✅ Get permissions with pagination support (NO hospitalId)
    getPermissions: builder.query<PermissionResponse, { 
      limit?: number; 
      module?: string;
      page?: number;
      search?: string;
    } | void>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        
        // ✅ Safe destructuring with default empty object
        const { limit, module, page, search } = params || {};

        // ✅ Add limit if provided
        if (limit) {
          queryParams.append("limit", String(limit));
        }

        // ✅ Add page if provided
        if (page) {
          queryParams.append("page", String(page));
        }

        // ✅ Add module filter if provided
        if (module) {
          queryParams.append("module", module);
        }

        // ✅ Add search filter if provided
        if (search) {
          queryParams.append("search", search);
        }

        const queryString = queryParams.toString();
        return `/permission${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: ["Permission"],
      transformResponse: (response: PermissionResponse) => {
        // Ensure pagination data is properly structured
        if (response.data && Array.isArray(response.data)) {
          return {
            ...response,
            pagination: response.pagination || {
              totalItems: response.data.length,
              totalPages: 1,
              currentPage: 1,
              itemsPerPage: response.data.length
            }
          };
        }
        return response;
      },
    }),

    // ✅ Get permission by ID (NO hospitalId)
    getPermissionById: builder.query<PermissionResponse, string | number>({
      query: (id: string | number) => {
        return `/permission/${id}`;
      },
      providesTags: (result, error, id) => [{ type: "Permission", id }],
    }),

    // ✅ Create permission (NO hospitalId)
    createPermission: builder.mutation<PermissionResponse, Partial<Permission>>({
      query: (body) => ({
        url: "/permission",
        method: "POST",
        body: body,
      }),
      invalidatesTags: ["Permission"],
    }),

    // ✅ Update permission (NO hospitalId)
    updatePermission: builder.mutation<PermissionResponse, { id: string | number; data: Partial<Permission> }>({
      query: ({ id, data }) => ({
        url: `/permission/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Permission", id }, "Permission"],
    }),

    // ✅ Delete permission (NO hospitalId)
    deletePermission: builder.mutation<{ success: boolean; message?: string }, string | number>({
      query: (id: string | number) => ({
        url: `/permission/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [{ type: "Permission", id }, "Permission"],
    }),
  }),
});

export const {
  useGetPermissionsQuery,
  useGetPermissionByIdQuery,
  useCreatePermissionMutation,
  useUpdatePermissionMutation,
  useDeletePermissionMutation,
} = permissionApi;