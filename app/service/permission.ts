// app/service/permission.ts

import { api } from "./api";

export const permissionApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get all permissions
    getPermissions: builder.query({
      query: () => "/permission",
      providesTags: ["Permission"],
    }),

    // Get permission by ID
    getPermissionById: builder.query({
      query: (id: string) => `/permission/${id}`,
      providesTags: (result, error, id) => [{ type: "Permission", id }],
    }),

    // Create new permission
    createPermission: builder.mutation({
      query: (body) => ({
        url: "/permission",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Permission"],
    }),

    // Update permission
    updatePermission: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/permission/${id}`,
        method: "PUT", // or "PATCH" if you prefer partial updates
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Permission", id }, "Permission"],
    }),

    // Delete permission
    deletePermission: builder.mutation({
      query: (id: string) => ({
        url: `/permission/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [{ type: "Permission", id }, "Permission"],
    }),
  }),
});

// Export all hooks
export const {
  useGetPermissionsQuery,
  useGetPermissionByIdQuery,
  useCreatePermissionMutation,
  useUpdatePermissionMutation,
  useDeletePermissionMutation,
} = permissionApi;