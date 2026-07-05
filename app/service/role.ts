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

    getRoleById: builder.query<RoleResponse, string | number>({
      query: (id) => `/role/${id}`,
      providesTags: (result, error, id) => [{ type: "Role", id }],
    }),

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

    deleteRole: builder.mutation<{ message: string }, string | number>({
      query: (id) => ({
        url: `/role/${id}`,
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