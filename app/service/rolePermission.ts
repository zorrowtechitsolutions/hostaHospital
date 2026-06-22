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

// New types for assign/unassign doctor/staff permissions
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

    // ================= ASSIGN PERMISSIONS TO DOCTORS/STAFF =================
    // PATCH endpoint for assigning doctor or staff permissions
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

    // ================= UPDATE ROLE PERMISSION =================
    // PUT endpoint for updating existing role permission
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

    // ================= DELETE ROLE PERMISSION =================
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

// ================= EXPORT HOOKS =================
export const {
  useGetRolePermissionsQuery,
  useGetRolePermissionByIdQuery,
  useCreateRolePermissionMutation,
  useAssignPermissionsMutation,        // NEW - for PATCH endpoint
  useUpdateRolePermissionMutation,     // NEW - for PUT endpoint
  useDeleteRolePermissionMutation,     // NEW - for DELETE endpoint
} = rolePermissionApi;