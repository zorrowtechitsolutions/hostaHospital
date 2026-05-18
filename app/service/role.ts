import { api } from "./api";

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
getRoles: builder.query<
  RoleResponse,
  {
    hospitalId?: string | number;
  }
>({
  query: ({ hospitalId }) => {
    const queryParams = new URLSearchParams();

    if (hospitalId) {
      queryParams.append(
        "hospitalId",
        String(hospitalId)
      );
    }

    const queryString = queryParams.toString();

    return `/role${
      queryString ? `?${queryString}` : ""
    }`;
  },

  providesTags: ["Role"],
}),
    // ================= GET ROLE BY ID =================
getRoleById: builder.query<
  RoleResponse,
  string | number
>({
  query: (hospitalId) => {
    console.log("Hospital ID:", hospitalId);

    return `/role/${hospitalId}`;
  },

  providesTags: ["Role"],
}),

    // ================= CREATE ROLE =================
    createRole: builder.mutation<
      RoleResponse,
      Partial<Role>
    >({
      query: (data) => ({
        url: "/role",
        method: "POST",
        body: data,
      }),

      invalidatesTags: ["Role"],
    }),

    // ================= UPDATE ROLE =================
    updateRole: builder.mutation<
      RoleResponse,
      {
        id: string | number;
        data: Partial<Role>;
      }
    >({
      query: ({ id, data }) => ({
        url: `/role/${id}`,
        method: "PUT",
        body: data,
      }),

      invalidatesTags: (result, error, { id }) => [
        { type: "Role", id },
      ],
    }),

    // ================= DELETE ROLE =================
    deleteRole: builder.mutation<
      { message: string },
      string | number
    >({
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