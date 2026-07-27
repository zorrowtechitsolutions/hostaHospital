// roleApi.ts
import { api } from "./api";
import { getHospitalId } from "../../src/utils/auth";

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

export const roleApi = api.injectEndpoints({
  endpoints: (builder) => ({

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

        const hospitalId = params?.hospitalId || getHospitalId();

        if (hospitalId) {
          queryParams.append("hospitalId", String(hospitalId));
        }

        if (params?.labId) {
          queryParams.append("labId", String(params.labId));
        }

        if (params?.pharmacyId) {
          queryParams.append("pharmacyId", String(params.pharmacyId));
        }

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

        if (params?.search_query) {
          queryParams.append("search_query", params.search_query);
        }

        const queryString = queryParams.toString();
        
        return queryString ? `/role?${queryString}` : `/role`;
      },
      providesTags: ["Role"],
    }),

    // Updated: Get role by ID using the new route pattern
    getRoleById: builder.query<RoleResponse, { id: string | number; roles: string | number }>({
      query: ({ id, roles }) => `/${id}/role/${roles}`,
      providesTags: (result, error, { roles }) => [{ type: "Role", id: roles }],
    }),

    // Updated: Create role (POST)
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

    // Updated: Update role using the new route pattern
    updateRole: builder.mutation<
      RoleResponse,
      {
        id: string | number;
        roles: string | number;
        data: Partial<Omit<Role, 'hospitalId'>>;
      }
    >({
      query: ({ id, roles, data }) => ({
        url: `/${id}/role/${roles}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { roles }) => [{ type: "Role", id: roles }],
    }),

    // Updated: Delete role using the new route pattern
    deleteRole: builder.mutation<
      { message: string }, 
      { id: string | number; roles: string | number }
    >({
      query: ({ id, roles }) => ({
        url: `/${id}/role/${roles}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Role"],
    }),
  }),
});

export const {
  useGetRolesQuery,
  useGetRoleByIdQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
} = roleApi;