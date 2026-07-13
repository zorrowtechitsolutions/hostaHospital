// rolePermissionApi.ts
import { api } from "./api";
import { getAuthUser } from "../../src/utils/auth";

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
  // ✅ Add this to override existing endpoints
  overrideExisting: true,
  endpoints: (builder) => ({

    // ==============================
    // GET ROLE PERMISSIONS
    // ==============================
    getRolePermissions: builder.query<
      RolePermissionResponse,
      { roleId?: string | number; hospitalId?: string | number; limit?: number }
    >({
      query: ({ roleId, hospitalId, limit }) => {
        const auth = getAuthUser();
        const queryParams = new URLSearchParams();

        // 🔥 Check user role - only Super Admin or Hospital Admin
        const isSuperAdmin = auth?.role === 'super-admin' || auth?.roleId === 1;
        const isHospitalAdmin = auth?.role === 'hospital' || auth?.roleId === 2;

        // 🔥 Determine which hospital ID to use
        let finalHospitalId = null;

        if (isSuperAdmin) {
          // 🔥 Super Admin: Use hospitalId from params (passed from URL)
          finalHospitalId = hospitalId;
        } else if (isHospitalAdmin) {
          // 🔥 Hospital Admin: Use hospitalId from auth context
          // Priority: params.hospitalId > auth.hospitalId > auth.id
          finalHospitalId = hospitalId || auth?.hospitalId || auth?.id;
        } else if (hospitalId) {
          // 🔥 Fallback: Use provided hospitalId if available
          finalHospitalId = hospitalId;
        }

        // ✅ Add hospitalId to query params if available
        if (finalHospitalId) {
          queryParams.append("hospitalId", String(finalHospitalId));
        }

        // ✅ Add roleId if provided
        if (roleId) {
          queryParams.append("roleId", String(roleId));
        }

        // ✅ Add limit if provided
        if (limit) {
          queryParams.append("limit", String(limit));
        }

        const queryString = queryParams.toString();
        
        return `/rolepermission${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: ["RolePermission"],
    }),

    // ==============================
    // GET ROLE PERMISSION BY ID
    // ==============================
    getRolePermissionById: builder.query<RolePermissionResponse, string | number>({
      query: (id) => `/rolepermission/${id}`,
      providesTags: (result, error, id) => [{ type: "RolePermission", id }],
    }),

    // ==============================
    // CREATE ROLE PERMISSION
    // ==============================
    createRolePermission: builder.mutation<
      RolePermissionResponse,
      {
        roleId: string | number;
        permissionIds: (string | number)[];
        hospitalId?: string | number;
      }
    >({
      query: (data) => {
        const auth = getAuthUser();
        
        // 🔥 Check user role - only Super Admin or Hospital Admin
        const isSuperAdmin = auth?.role === 'super-admin' || auth?.roleId === 1;
        const isHospitalAdmin = auth?.role === 'hospital' || auth?.roleId === 2;

        // 🔥 Determine which hospital ID to use
        let finalHospitalId = null;

        if (isSuperAdmin) {
          // 🔥 Super Admin: Use hospitalId from data (passed from component)
          finalHospitalId = data.hospitalId;
        } else if (isHospitalAdmin) {
          // 🔥 Hospital Admin: Use hospitalId from auth context
          // Priority: data.hospitalId > auth.hospitalId > auth.id
          finalHospitalId = data.hospitalId || auth?.hospitalId || auth?.id;
        } else if (data.hospitalId) {
          // 🔥 Fallback: Use provided hospitalId if available
          finalHospitalId = data.hospitalId;
        }

        const payload = {
          roleId: data.roleId,
          permissionIds: data.permissionIds,
          hospitalId: finalHospitalId,
        };

        return {
          url: "/rolepermission",
          method: "POST",
          body: payload,
        };
      },
      invalidatesTags: ["RolePermission"],
    }),

    // ==============================
    // ASSIGN PERMISSIONS (Bulk)
    // ==============================
    assignPermissions: builder.mutation<
      AssignPermissionResponse,
      AssignPermissionData
    >({
      query: (data) => {
        const auth = getAuthUser();
        
        return {
          url: "/rolepermission",
          method: "PATCH",
          body: data,
        };
      },
      invalidatesTags: ["RolePermission"],
    }),

    // ==============================
    // UPDATE ROLE PERMISSION
    // ==============================
    updateRolePermission: builder.mutation<
      RolePermissionResponse,
      {
        id: string | number;
        roleId?: string | number;
        permissionIds?: (string | number)[];
        hospitalId?: string | number;
      }
    >({
      query: ({ id, ...data }) => {
        const auth = getAuthUser();
        
        // 🔥 Check user role - only Super Admin or Hospital Admin
        const isSuperAdmin = auth?.role === 'super-admin' || auth?.roleId === 1;
        const isHospitalAdmin = auth?.role === 'hospital' || auth?.roleId === 2;

        // 🔥 Determine which hospital ID to use
        let finalHospitalId = null;

        if (isSuperAdmin) {
          // 🔥 Super Admin: Use hospitalId from data (passed from component)
          finalHospitalId = data.hospitalId;
        } else if (isHospitalAdmin) {
          // 🔥 Hospital Admin: Use hospitalId from auth context
          // Priority: data.hospitalId > auth.hospitalId > auth.id
          finalHospitalId = data.hospitalId || auth?.hospitalId || auth?.id;
        } else if (data.hospitalId) {
          // 🔥 Fallback: Use provided hospitalId if available
          finalHospitalId = data.hospitalId;
        }

        const payload = {
          ...data,
          hospitalId: finalHospitalId,
        };

        return {
          url: `/rolepermission/${id}`,
          method: "PUT",
          body: payload,
        };
      },
      invalidatesTags: (result, error, { id }) => [
        { type: "RolePermission", id },
        "RolePermission",
      ],
    }),

    // ==============================
    // DELETE ROLE PERMISSION
    // ==============================
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