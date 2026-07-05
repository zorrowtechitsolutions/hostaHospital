// app/service/permission.ts
import { api } from "./api";

export const permissionApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPermissions: builder.query({
      query: () => "/permission",
      providesTags: ["Permission"],
    }),

    getPermissionById: builder.query({
      query: (id: string) => `/permission/${id}`,
      providesTags: (result, error, id) => [{ type: "Permission", id }],
    }),

    createPermission: builder.mutation({
      query: (body) => ({
        url: "/permission",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Permission"],
    }),

    updatePermission: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/permission/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Permission", id }, "Permission"],
    }),

    deletePermission: builder.mutation({
      query: (id: string) => ({
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