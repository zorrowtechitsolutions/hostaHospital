// rolePermissionApi.ts
import { api } from "./api";
import { getHospitalId } from "../../src/utils/auth";

// ================= TYPES =================

export interface RolePermission {
  id?: string | number;
  roleId?: string | number;
  permissionIds?: string | number;
  hospitalId?: string | number;
  createdAt?: string;
  updatedAt?: string;
}

export interface RolePermissionResponse {
  success: boolean;
  message?: string;
  data?: RolePermission | RolePermission[];
}

// ================= API =================

export const rolePermissionApi = api.injectEndpoints({
  endpoints: (builder) => ({

    // ================= GET ROLE PERMISSIONS =================
    // Automatically adds hospitalId from authenticated user
    getRolePermissions: builder.query<
      RolePermissionResponse,
      { roleId?: string | number }
    >({
      query: ({ roleId }) => {
        const queryParams = new URLSearchParams();
        
        // Auto-inject hospitalId from auth
        const hospitalId = getHospitalId();
        if (hospitalId) {
          queryParams.append("hospitalId", String(hospitalId));
        }

        if (roleId) {
          queryParams.append("roleId", String(roleId));
        }

        const queryString = queryParams.toString();
        return `/rolepermission${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: ["RolePermission"],
    }),

    // ================= GET ROLE PERMISSION BY ID =================
    getRolePermissionById: builder.query<RolePermissionResponse, string | number>({
      query: (id) => `/rolepermission/${id}`,
      providesTags: (result, error, id) => [{ type: "RolePermission", id }],
    }),

    // ================= CREATE ROLE PERMISSION =================
    // Automatically adds hospitalId from authenticated user
    createRolePermission: builder.mutation<
      RolePermissionResponse,
      {
        roleId: string | number;
        permissionIds: (string | number)[];
      }
    >({
      query: (data) => {
        const hospitalId = getHospitalId();
        
        return {
          url: "/rolepermission",
          method: "POST",
          body: {
            ...data,
            hospitalId: hospitalId, // Auto-inject from auth
          },
        };
      },
      invalidatesTags: ["RolePermission"],
    }),
  }),
});

// ================= EXPORT HOOKS =================
export const {
  useGetRolePermissionsQuery,
  useGetRolePermissionByIdQuery,
  useCreateRolePermissionMutation,
} = rolePermissionApi;