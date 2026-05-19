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
}

export interface RoleResponse {
  success: boolean;
  message?: string;
  data?: Role | Role[];
}

// ================= API =================

export const roleApi = api.injectEndpoints({
  endpoints: (builder) => ({

    // ================= GET ROLES =================
    // Automatically adds hospitalId from authenticated user
    getRoles: builder.query<RoleResponse, void | { hospitalId?: string | number }>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        
        // Use hospitalId from params or auto-inject from auth
        let hospitalId = getHospitalId();
        console.log(hospitalId , "hello");
        console.log(getHospitalId(), "kooi");
        
        
        
        if (hospitalId) {
          console.log(hospitalId, "hii");
          
          queryParams.append("hospitalId", String(hospitalId));
        }

        const queryString = queryParams.toString();
        return `/role${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: ["Role"],
    }),

    // ================= GET ROLE BY ID =================
    getRoleById: builder.query<RoleResponse, string | number>({
      query: (id) => `/role/${id}`,
      providesTags: (result, error, id) => [{ type: "Role", id }],
    }),

    // ================= CREATE ROLE =================
    // Automatically adds hospitalId from authenticated user
    createRole: builder.mutation<RoleResponse, Omit<Role, 'id' | 'hospitalId'>>({
      query: (data) => {
        const hospitalId = getHospitalId();
        
        return {
          url: "/role",
          method: "POST",
          body: {
            ...data,
            hospitalId: hospitalId, // Auto-inject from auth
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