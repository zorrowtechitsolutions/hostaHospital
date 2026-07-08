// app/service/permission.ts
import { api } from "./api";
import { getHospitalId } from "../../src/utils/auth";

// ================= TYPES =================

export interface Permission {
  id: number;
  name: string;
  module: string;
  action: string;
  description?: string;
  hospitalId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PermissionResponse {
  success: boolean;
  message?: string;
  data?: Permission[];
}

// ================= API =================

export const permissionApi = api.injectEndpoints({
  endpoints: (builder) => ({
    
    // ✅ UPDATED: Get permissions with limit support
    getPermissions: builder.query<PermissionResponse, { limit?: number; module?: string }>({
      query: ({ limit, module }) => {
        const queryParams = new URLSearchParams();
        
        const hospitalId = getHospitalId();
        if (hospitalId) {
          queryParams.append("hospitalId", String(hospitalId));
        }

        // ✅ Add limit if provided
        if (limit) {
          queryParams.append("limit", String(limit));
        }

        // ✅ Add module filter if provided
        if (module) {
          queryParams.append("module", module);
        }

        const queryString = queryParams.toString();
        return `/permission${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: ["Permission"],
    }),

    // Get permission by ID
    getPermissionById: builder.query<PermissionResponse, string | number>({
      query: (id: string | number) => {
        const queryParams = new URLSearchParams();
        
        const hospitalId = getHospitalId();
        if (hospitalId) {
          queryParams.append("hospitalId", String(hospitalId));
        }

        const queryString = queryParams.toString();
        return `/permission/${id}${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: (result, error, id) => [{ type: "Permission", id }],
    }),

    // Create permission
    createPermission: builder.mutation<PermissionResponse, Partial<Permission>>({
      query: (body) => {
        const hospitalId = getHospitalId();
        return {
          url: "/permission",
          method: "POST",
          body: {
            ...body,
            hospitalId: hospitalId,
          },
        };
      },
      invalidatesTags: ["Permission"],
    }),

    // Update permission
    updatePermission: builder.mutation<PermissionResponse, { id: string | number; data: Partial<Permission> }>({
      query: ({ id, data }) => {
        const hospitalId = getHospitalId();
        return {
          url: `/permission/${id}`,
          method: "PUT",
          body: {
            ...data,
            hospitalId: hospitalId,
          },
        };
      },
      invalidatesTags: (result, error, { id }) => [{ type: "Permission", id }, "Permission"],
    }),

    // Delete permission
    deletePermission: builder.mutation<{ success: boolean; message?: string }, string | number>({
      query: (id: string | number) => {
        const hospitalId = getHospitalId();
        const queryParams = new URLSearchParams();
        if (hospitalId) {
          queryParams.append("hospitalId", String(hospitalId));
        }
        const queryString = queryParams.toString();
        return {
          url: `/permission/${id}${queryString ? `?${queryString}` : ""}`,
          method: "DELETE",
        };
      },
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