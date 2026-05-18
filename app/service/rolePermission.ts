import { api } from "./api";

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
    getRolePermissions: builder.query<
      RolePermissionResponse,
      {
        hospitalId?: string | number;
        roleId?: string | number;
      }
    >({
      query: ({ hospitalId, roleId }) => {
        const queryParams = new URLSearchParams();

        if (hospitalId) {
          queryParams.append(
            "hospitalId",
            String(hospitalId)
          );
        }

        if (roleId) {
          queryParams.append(
            "roleId",
            String(roleId)
          );
        }

        const queryString = queryParams.toString();

        return `/rolepermission${
          queryString ? `?${queryString}` : ""
        }`;
      },

      providesTags: ["RolePermission"],
    }), 

    // ================= GET ROLE PERMISSION BY ID =================
    getRolePermissionById: builder.query<
      RolePermissionResponse,
      string | number
    >({
      query: (id) => `/rolepermission/${id}`,

      providesTags: (result, error, id) => [
        { type: "RolePermission", id },
      ],
    }),

    // ================= CREATE ROLE PERMISSION =================
    createRolePermission: builder.mutation<
      RolePermissionResponse,
      {
        roleId: string | number;
        permissionIds: (string | number)[];
        hospitalId?: string | number;
      }
    >({
      query: (data) => ({
        url: "/rolepermission",
        method: "POST",
        body: data,
      }),

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