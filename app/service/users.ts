// app/service/users.ts - User Management API service

import { api } from "./api";
import { getAuthUser, getToken } from "../../src/utils/auth";

// ================= TYPES =================

export interface User {
  id?: number;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  role?: string;
  roleId?: number;
  hospitalId?: number;
  isActive?: boolean;
  isDelete?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserResponse {
  success: boolean;
  message: string;
  data?: User | User[];
  pagination?: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
  };
}

export interface GetUsersParams {
  id?: string | number;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  roleId?: number;
  hospitalId?: string | number;
  isActive?: boolean;
  search_query?: string;
  page?: number;
  limit?: number;
  includeDeleted?: boolean; // NEW
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: string;
  roleId?: number;
  hospitalId?: number;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
  role?: string;
  roleId?: number;
  hospitalId?: number;
  isActive?: boolean;
}

// Helper to check if user is Super Admin
const isSuperAdmin = (): boolean => {
  const auth = getAuthUser();
  return auth?.role === 'super_admin' || auth?.roleId === 1;
};

// Helper to check if user is Hospital Admin
const isHospitalAdmin = (): boolean => {
  const auth = getAuthUser();
  return auth?.role === 'hospital' || auth?.roleId === 2;
};

// ================= API =================

export const usersApi = api.injectEndpoints({
  endpoints: (builder) => ({

    // ================= GET ALL USERS =================
    getUsers: builder.query<UserResponse, GetUsersParams | void>({
      query: (params: GetUsersParams = {}) => {
        console.log("👥 GET USERS REQUEST");
        console.log("🔑 TOKEN:", getToken());
        console.log("📦 PARAMS:", params);
        
        const auth = getAuthUser();
        const queryParams = new URLSearchParams();
        
        console.log("👤 AUTH USER:", auth);
        console.log("👤 AUTH ROLE:", auth?.role);
        
        const isSuperAdminUser = isSuperAdmin();
        const isHospitalAdminUser = isHospitalAdmin();
        
        console.log("👑 Is Super Admin:", isSuperAdminUser);
        console.log("🏥 Is Hospital Admin:", isHospitalAdminUser);
        
        // Super Admin sees all users, Hospital Admin sees only their hospital users
        if (!isSuperAdminUser) {
          // For Hospital Admin, auto-inject hospitalId
          if (isHospitalAdminUser && auth?.id) {
            queryParams.append("hospitalId", String(auth.id));
            console.log(`🏥 Auto-injected hospitalId for hospital admin: ${auth.id}`);
          } else {
            // For other roles, use hospitalId from params or auth
            const hospitalId = params.hospitalId || auth?.hospitalId;
            if (hospitalId) {
              queryParams.append("hospitalId", String(hospitalId));
            }
          }
        } else {
          console.log("👑 Super Admin - Seeing all users (no hospital filter)");
        }

        // Override hospitalId if provided in params (takes precedence)
        if (params.hospitalId) {
          queryParams.set("hospitalId", String(params.hospitalId));
        }

        // Name filter
        if (params.name) {
          queryParams.append("name", params.name);
        }

        // Email filter
        if (params.email) {
          queryParams.append("email", params.email);
        }

        // Phone filter
        if (params.phone) {
          queryParams.append("phone", params.phone);
        }

        // Role filter
        if (params.role) {
          queryParams.append("role", params.role);
        }

        // Role ID filter
        if (params.roleId) {
          queryParams.append("roleId", String(params.roleId));
        }

        // Active status filter
        if (params.isActive !== undefined) {
          queryParams.append("isActive", String(params.isActive));
        }

        // Search query
        if (params.search_query) {
          queryParams.append("search_query", params.search_query);
        }

        // Pagination
        if (params.page) {
          queryParams.append("page", String(params.page));
        }

        if (params.limit) {
          queryParams.append("limit", String(params.limit));
        }

        // NEW: Include deleted users
        if (params.includeDeleted) {
          queryParams.append("includeDeleted", String(params.includeDeleted));
        }

        const queryString = queryParams.toString();
        const url = queryString ? `/users?${queryString}` : "/users";
        
        console.log("🌐 FINAL URL:", url);
        
        // If ID is provided, get single user
        if (params.id) {
          const singleUrl = `/users/${params.id}${queryString ? `?${queryString}` : ""}`;
          console.log("📍 SINGLE USER URL:", singleUrl);
          return singleUrl;
        }

        console.log("📋 ALL USERS URL:", url);
        return url;
      },

      providesTags: (result, error, params) => {
        if (params?.id && result?.data && !Array.isArray(result.data)) {
          return [{ type: "Users", id: params.id }];
        }
        return ["Users"];
      },
    }),

    // ================= GET USER BY ID =================
    getUserById: builder.query<UserResponse, string | number>({
      query: (id) => {
        console.log(`📍 GET USER BY ID: ${id}`);
        return `/users/${id}`;
      },
      providesTags: (result, error, id) => [{ type: "Users", id }],
    }),

    // ================= CREATE USER =================
    createUser: builder.mutation<UserResponse, CreateUserData>({
      query: (data) => {
        console.log("📝 CREATE USER REQUEST");
        console.log("📦 DATA:", data);
        
        const auth = getAuthUser();
        const isSuperAdminUser = isSuperAdmin();
        const isHospitalAdminUser = isHospitalAdmin();
        
        let hospitalId = data.hospitalId;
        
        // If no hospitalId provided, use the authenticated user's hospitalId
        if (!hospitalId) {
          if (isHospitalAdminUser && auth?.id) {
            hospitalId = auth.id;
            console.log(`🏥 Using authenticated hospital admin ID: ${hospitalId}`);
          } else if (isSuperAdminUser) {
            console.log("⚠️ Super Admin creating user - hospitalId may be required");
            // Super Admin can create users without hospitalId (system users)
          }
        }
        
        console.log("🏥 FINAL HOSPITAL ID:", hospitalId);
        
        const requestBody: any = {
          name: data.name,
          email: data.email,
          password: data.password,
          phone: data.phone || "",
          role: data.role || "user",
        };
        
        if (hospitalId) {
          requestBody.hospitalId = hospitalId;
        }
        
        if (data.roleId) {
          requestBody.roleId = data.roleId;
        }
        
        console.log("📤 REQUEST BODY:", requestBody);
        
        return {
          url: "/users",
          method: "POST",
          body: requestBody,
        };
      },

      invalidatesTags: ["Users"],
    }),

    // ================= UPDATE USER =================
    updateUser: builder.mutation<UserResponse, { id: string | number; data: UpdateUserData }>({
      query: ({ id, data }) => {
        console.log("✏️ UPDATE USER REQUEST");
        console.log("🆔 USER ID:", id);
        console.log("📦 UPDATE DATA:", data);
        
        const requestBody: any = {};
        
        if (data.name) requestBody.name = data.name;
        if (data.email) requestBody.email = data.email;
        if (data.password) requestBody.password = data.password;
        if (data.phone !== undefined) requestBody.phone = data.phone;
        if (data.role) requestBody.role = data.role;
        if (data.roleId !== undefined) requestBody.roleId = data.roleId;
        if (data.hospitalId !== undefined) requestBody.hospitalId = data.hospitalId;
        if (data.isActive !== undefined) requestBody.isActive = data.isActive;
        
        console.log("📤 REQUEST BODY:", requestBody);
        
        return {
          url: `/users/${id}`,
          method: "PUT",
          body: requestBody,
        };
      },

      invalidatesTags: (result, error, { id }) => [
        { type: "Users", id },
        "Users",
      ],
    }),

    // ================= DELETE USER =================
    deleteUser: builder.mutation<{ message: string }, string | number>({
      query: (id) => {
        console.log("🗑️ DELETE USER REQUEST");
        console.log("🆔 USER ID:", id);
        
        return {
          url: `/users/${id}`,
          method: "DELETE",
        };
      },

      invalidatesTags: (result, error, id) => [
        { type: "Users", id },
        "Users",
      ],
    }),

    // ================= RECOVER USER =================
    recoverUser: builder.mutation<
      { success: boolean; message: string; data?: User },
      string | number
    >({
      query: (id) => {
        console.log("♻️ RECOVER USER REQUEST");
        console.log("🆔 USER ID:", id);
        
        return {
          url: `/users/recover/${id}`,
          method: "PUT",
        };
      },

      invalidatesTags: (result, error, id) => [
        { type: "Users", id },
        "Users",
      ],
    }),
  }),
});

// ================= EXPORT HOOKS =================

export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useRecoverUserMutation,
} = usersApi;