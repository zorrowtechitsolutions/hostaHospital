// roleApi.ts
import { api } from "./api";
import { getHospitalId } from "../../src/utils/auth";

// ================= TYPES =================

export interface Role {
  id?: string | number;
  _id?: string;
  name: string;
  status?: string;
  createdDate?: string;
  createdAt?: string;
  updatedAt?: string;
  description?: string;
}

export interface RoleResponse {
  success: boolean;
  message?: string;
  data?: Role | Role[];
  admin?: Role[];
  pagination?: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// ================= API =================

export const roleApi = api.injectEndpoints({
  endpoints: (builder) => ({

    // ================= GET ROLES =================
    // ENHANCED: Supports pagination, search, labId, pharmacyId filters
    getRoles: builder.query<
      any,
      {
        hospitalId?: string | number;
        page?: number;
        limit?: number;
        search_query?: string;
        labId?: string | number;
        pharmacyId?: string | number;
      } | void
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();

        // Get hospitalId from params or auto-inject from auth
        const hospitalId = params?.hospitalId || getHospitalId();

        console.log("getRoles - hospitalId:", hospitalId);
        console.log("getRoles - params:", params);

        if (hospitalId) {
          queryParams.append("hospitalId", String(hospitalId));
        }

        // Add labId if provided
        if (params?.labId) {
          queryParams.append("labId", String(params.labId));
        }

        // Add pharmacyId if provided
        if (params?.pharmacyId) {
          queryParams.append("pharmacyId", String(params.pharmacyId));
        }

        // Add pagination parameters
        if (params?.page) {
          queryParams.append("page", String(params.page));
        } else {
          queryParams.append("page", "1");
        }

        if (params?.limit) {
          queryParams.append("limit", String(params.limit));
        } else {
          queryParams.append("limit", "10");
        }

        // Add search query if provided
        if (params?.search_query) {
          queryParams.append("search_query", params.search_query);
        }

        const queryString = queryParams.toString();
        
        console.log("getRoles - URL:", queryString ? `/role?${queryString}` : `/role`);
        
        // Return correct URL based on whether query params exist
        return queryString ? `/role?${queryString}` : `/role`;
      },
      providesTags: ["Role"],
    }),

    // ================= GET ROLE BY ID =================
    getRoleById: builder.query<RoleResponse, string | number>({
      query: (id) => `/role/${id}`,
      providesTags: (result, error, id) => [{ type: "Role", id }],
    }),

    // ================= CREATE ROLE =================
    createRole: builder.mutation<RoleResponse, Omit<Role, 'id' | 'hospitalId'>>({
      query: (data) => {
        const hospitalId = getHospitalId();
        
        return {
          url: "/role",
          method: "POST",
          body: {
            ...data,
            hospitalId: hospitalId,
          },
        };
      },
      invalidatesTags: ["Role"],
    }),

    // ================= UPDATE ROLE =================
    updateRole: builder.mutation<
      RoleResponse,
      {
        id: string | number;
        data: Partial<Omit<Role, 'hospitalId'>>;
      }
    >({
      query: ({ id, data }) => ({
        url: `/role/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Role", id }],
    }),

    // ================= DELETE ROLE =================
    deleteRole: builder.mutation<{ message: string }, string | number>({
      query: (id) => ({
        url: `/role/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Role"],
    }),
  }),
});

// ================= EXPORT HOOKS =================
export const {
  useGetRolesQuery,
  useGetRoleByIdQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
} = roleApi;