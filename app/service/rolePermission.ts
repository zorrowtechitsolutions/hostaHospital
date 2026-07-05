// rolePermissionApi.ts
import { api } from "./api";
import { getHospitalId } from "../../src/utils/auth";

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

export interface AssignDoctorPermissionData {
  hospitalId: number;
  roleId: number;
  userType: "doctor";
  doctorIds: Array<{
    id: number;
    roleId: number;
  }>;
}

export interface AssignStaffPermissionData {
  hospitalId: number;
  roleId: number;
  userType: "staff";
  staffIds: Array<{
    id: number;
    roleId: number;
  }>;
}

export type AssignPermissionData = AssignDoctorPermissionData | AssignStaffPermissionData;

export interface AssignPermissionResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export const rolePermissionApi = api.injectEndpoints({
  endpoints: (builder) => ({

    getRolePermissions: builder.query<
      RolePermissionResponse,
      { roleId?: string | number }
    >({
      query: ({ roleId }) => {
        const queryParams = new URLSearchParams();
        
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

    getRolePermissionById: builder.query<RolePermissionResponse, string | number>({
      query: (id) => `/rolepermission/${id}`,
      providesTags: (result, error, id) => [{ type: "RolePermission", id }],
    }),

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
            hospitalId: hospitalId,
          },
        };
      },
      invalidatesTags: ["RolePermission"],
    }),

    assignPermissions: builder.mutation<
      AssignPermissionResponse,
      AssignPermissionData
    >({
      query: (data) => ({
        url: "/rolepermission",
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["RolePermission"],
    }),

    updateRolePermission: builder.mutation<
      RolePermissionResponse,
      {
        id: string | number;
        roleId?: string | number;
        permissionIds?: (string | number)[];
      }
    >({
      query: ({ id, ...data }) => {
        const hospitalId = getHospitalId();
        
        return {
          url: `/rolepermission/${id}`,
          method: "PUT",
          body: {
            ...data,
            hospitalId: hospitalId,
          },
        };
      },
      invalidatesTags: (result, error, { id }) => [
        { type: "RolePermission", id },
        "RolePermission",
      ],
    }),

    deleteRolePermission: builder.mutation<
      { success: boolean; message?: string },
      string | number
    >({
      query: (id) => ({
        url: `/rolepermission/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "RolePermission", id },
        "RolePermission",
      ],
    }),
  }),
});

export const {
  useGetRolePermissionsQuery,
  useGetRolePermissionByIdQuery,
  useCreateRolePermissionMutation,
  useAssignPermissionsMutation,
  useUpdateRolePermissionMutation,
  useDeleteRolePermissionMutation,
} = rolePermissionApi;