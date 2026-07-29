// rolePermissionApi.ts
import { api } from "./api";
import { getAuthUser } from "../../src/utils/auth";

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
  pagination?: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
  };
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

export interface GetRolePermissionParams {
  id?: string | number;
  roleId?: string | number;
  hospitalId?: string | number;
  limit?: number;
  skipHospitalFilter?: boolean;
}

// ================= HELPER FUNCTIONS =================

// Helper: Get hospital ID from auth (returns number)
const getHospitalIdFromAuth = (auth: any): number | null => {
  if (!auth) return null;
  
  // Priority 1: Use hospitalId if available (this is the correct hospital ID)
  if (auth.hospitalId) {
    return Number(auth.hospitalId);
  }
  
  // Priority 2: Use id as fallback
  if (auth.id) {
    return Number(auth.id);
  }
  
  return null;
};

// Helper: Convert string | number to number safely
const toNumber = (value: string | number | undefined): number | undefined => {
  if (value === undefined || value === null) return undefined;
  return Number(value);
};

// ================= API =================

export const rolePermissionApi = api.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({

    // ==============================
    // GET ROLE PERMISSIONS
    // ==============================
    getRolePermissions: builder.query<
      RolePermissionResponse,
      GetRolePermissionParams | void
    >({
      query: (params: GetRolePermissionParams = {}) => {
        const auth = getAuthUser();
        const queryParams = new URLSearchParams();

        // Determine if user is super admin
        const isSuperAdmin = auth?.role === 'super-admin' || auth?.roleId === 1;
        const isHospitalAdmin = auth?.role === 'hospital' || auth?.roleId === 2;
        const shouldSkipFilter = params.skipHospitalFilter === true;

        // Get hospital ID using helper
        let hospitalIdToUse = null;

        // For non-super-admin users, always filter by hospital if they have one
        if (!isSuperAdmin && !shouldSkipFilter) {
          hospitalIdToUse = getHospitalIdFromAuth(auth);
          
          // If no hospitalId found, try params
          if (!hospitalIdToUse && params.hospitalId) {
            hospitalIdToUse = toNumber(params.hospitalId);
          }
          
          if (hospitalIdToUse) {
            queryParams.append("hospitalId", String(hospitalIdToUse));
          } else {
            console.warn("⚠️ No hospital ID found for filtering role permissions");
          }
        } 
        // Super Admin with specific hospital filter
        else if (isSuperAdmin && params.hospitalId) {
          queryParams.append("hospitalId", String(params.hospitalId));
        }
        // Use provided hospitalId if specified (for cases where we want to override)
        else if (params.hospitalId) {
          queryParams.append("hospitalId", String(params.hospitalId));
        }

        // ✅ Add roleId if provided
        if (params.roleId) {
          queryParams.append("roleId", String(params.roleId));
        }

        // ✅ Add limit if provided
        if (params.limit) {
          queryParams.append("limit", String(params.limit));
        }

        const queryString = queryParams.toString();
        
        let url;
        if (params.id) {
          url = `/rolepermission/${params.id}${queryString ? `?${queryString}` : ""}`;
        } else {
          url = `/rolepermission${queryString ? `?${queryString}` : ""}`;
        }
        
        return url;
      },
      providesTags: (result, error, params) => {
        if (params?.id && result?.data && !Array.isArray(result.data)) {
          return [{ type: "RolePermission", id: params.id }];
        }
        return ["RolePermission"];
      },
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
        
        // Determine if user is super admin
        const isSuperAdmin = auth?.role === 'super-admin' || auth?.roleId === 1;
        const isHospitalAdmin = auth?.role === 'hospital' || auth?.roleId === 2;

        // Get hospital ID using helper
        let hospitalId: number | undefined;

        if (isSuperAdmin) {
          // Super Admin: Use hospitalId from data (passed from component)
          if (data.hospitalId) {
            hospitalId = toNumber(data.hospitalId);
          }
        } else if (isHospitalAdmin) {
          // Hospital Admin: Use hospitalId from auth context
          const authHospitalId = getHospitalIdFromAuth(auth);
          if (authHospitalId) {
            hospitalId = authHospitalId;
          } else if (data.hospitalId) {
            hospitalId = toNumber(data.hospitalId);
          }
        } else {
          // Fallback: Use provided hospitalId if available
          if (data.hospitalId) {
            hospitalId = toNumber(data.hospitalId);
          }
        }

        const payload = {
          roleId: data.roleId,
          permissionIds: data.permissionIds,
          hospitalId: hospitalId,
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
        
        // Get hospital ID from auth if not provided
        let hospitalId = data.hospitalId;
        if (!hospitalId) {
          const authHospitalId = getHospitalIdFromAuth(auth);
          if (authHospitalId) {
            hospitalId = authHospitalId;
          }
        }

        // Ensure hospitalId is a number
        const finalHospitalId = toNumber(hospitalId);

        return {
          url: "/rolepermission",
          method: "PATCH",
          body: {
            ...data,
            hospitalId: finalHospitalId,
          },
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
        
        // Determine if user is super admin
        const isSuperAdmin = auth?.role === 'super-admin' || auth?.roleId === 1;
        const isHospitalAdmin = auth?.role === 'hospital' || auth?.roleId === 2;

        // Get hospital ID using helper
        let hospitalId: number | undefined;

        if (isSuperAdmin) {
          // Super Admin: Use hospitalId from data (passed from component)
          if (data.hospitalId) {
            hospitalId = toNumber(data.hospitalId);
          }
        } else if (isHospitalAdmin) {
          // Hospital Admin: Use hospitalId from auth context
          const authHospitalId = getHospitalIdFromAuth(auth);
          if (authHospitalId) {
            hospitalId = authHospitalId;
          } else if (data.hospitalId) {
            hospitalId = toNumber(data.hospitalId);
          }
        } else {
          // Fallback: Use provided hospitalId if available
          if (data.hospitalId) {
            hospitalId = toNumber(data.hospitalId);
          }
        }

        const payload = {
          ...data,
          hospitalId: hospitalId,
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