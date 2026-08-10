// app/service/email-template.ts - Updated to match backend response

import { api } from "./api";
import { getAuthUser } from "../../src/utils/auth";

// ================= TYPES =================

export interface EmailTemplateVariable {
  name: string;
  description?: string;
  defaultValue?: string;
  required?: boolean;
}

// Updated to match backend response
export interface EmailTemplate {
  id?: number;
  templateName: string;  // Changed from 'name'
  subject: string;
  message: string;       // Changed from 'body'
  category?: string;
  status?: 'Active' | 'Inactive' | 'Draft';
  variables?: EmailTemplateVariable[];
  hospitalId?: number;
  createdBy?: string | number;
  isSystem?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TemplateResponse {
  success: boolean;
  message: string;
  data?: EmailTemplate | EmailTemplate[];
  pagination?: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

export interface GetTemplateParams {
  id?: string | number;
  hospitalId?: string | number;
  createdBy?: string | number;
  category?: string;
  status?: 'Active' | 'Inactive' | 'Draft' | 'all';
  name?: string;
  search_query?: string;
  isSystem?: boolean;
  page?: number;
  limit?: number;
  skipHospitalFilter?: boolean;
}

// Updated to match backend expectations
export interface CreateTemplateRequest {
  templateName: string;
  subject: string;
  message: string;
  category?: string;
  status?: 'Active' | 'Inactive' | 'Draft';
  variables?: EmailTemplateVariable[];
}

export interface UpdateTemplateRequest {
  templateName?: string;
  subject?: string;
  message?: string;
  category?: string;
  status?: 'Active' | 'Inactive' | 'Draft';
  variables?: EmailTemplateVariable[];
}

// ================= API =================

export const templateApi = api.injectEndpoints({
  endpoints: (builder) => ({

    // ================= CREATE TEMPLATE =================
    createTemplate: builder.mutation<
      TemplateResponse,
      CreateTemplateRequest
    >({
      query: (data) => {
        const auth = getAuthUser();
        const isSuperAdmin = auth?.role === 'super-admin';
        
        let hospitalId: number | undefined;
        
        if (!isSuperAdmin) {
          const authHospitalId = getHospitalIdFromAuth(auth);
          if (authHospitalId) {
            hospitalId = authHospitalId;
          }
        }
        
        const userId = getAuthIdFromAuth(auth);
        
        return {
          url: "/email/templates",
          method: "POST",
          body: {
            hospitalId: hospitalId,
            createdBy: userId,
            templateName: data.templateName,
            subject: data.subject,
            message: data.message,
            category: data.category,
            status: data.status || 'Active',
            variables: data.variables,
          },
        };
      },

      invalidatesTags: ["Template"],
    }),

    // ================= GET TEMPLATES =================
    getTemplates: builder.query<
      TemplateResponse,
      GetTemplateParams | void
    >({
      query: (params: GetTemplateParams = {}) => {
        const queryParams = new URLSearchParams();

        const auth = getAuthUser();
        const isSuperAdmin = auth?.role === 'super-admin';
        const shouldSkipFilter = params.skipHospitalFilter === true;

        let hospitalIdToUse = null;
        
        if (!isSuperAdmin && !shouldSkipFilter) {
          hospitalIdToUse = getHospitalIdFromAuth(auth);
          if (!hospitalIdToUse && params.hospitalId) {
            hospitalIdToUse = toNumber(params.hospitalId);
          }
          if (hospitalIdToUse) {
            queryParams.append("hospitalId", String(hospitalIdToUse));
          }
        } else if (isSuperAdmin && params.hospitalId) {
          queryParams.append("hospitalId", String(params.hospitalId));
        } else if (params.hospitalId) {
          queryParams.append("hospitalId", String(params.hospitalId));
        }

        if (params.createdBy) {
          queryParams.append("createdBy", String(params.createdBy));
        }

        if (params.category) {
          queryParams.append("category", params.category);
        }

        if (params.status && params.status !== 'all') {
          queryParams.append("status", params.status);
        }

        if (params.name) {
          queryParams.append("name", params.name);
        }

        if (params.search_query) {
          queryParams.append("search_query", params.search_query);
        }

        if (params.isSystem !== undefined) {
          queryParams.append("isSystem", String(params.isSystem));
        }

        if (params.page) {
          queryParams.append("page", String(params.page));
        }

        if (params.limit) {
          queryParams.append("limit", String(params.limit));
        }

        const queryString = queryParams.toString();

        let url;
        if (params.id) {
          url = `/email/templates/${params.id}${queryString ? `?${queryString}` : ""}`;
        } else {
          url = `/email/templates${queryString ? `?${queryString}` : ""}`;
        }
        
        return url;
      },

      providesTags: (result, error, params) => {
        if (params?.id && result?.data && !Array.isArray(result.data)) {
          return [{ type: "Template", id: params.id }];
        }
        return ["Template"];
      },
    }),

    // ================= GET TEMPLATE BY ID =================
    getTemplateById: builder.query<
      TemplateResponse,
      string | number
    >({
      query: (id) => {
        const auth = getAuthUser();
        const isSuperAdmin = auth?.role === 'super-admin';
        
        const queryParams = new URLSearchParams();
        
        let hospitalId: number | undefined;
        
        if (!isSuperAdmin) {
          const authHospitalId = getHospitalIdFromAuth(auth);
          if (authHospitalId) {
            hospitalId = authHospitalId;
          }
        }
        
        if (hospitalId) {
          queryParams.append("hospitalId", String(hospitalId));
        }
        
        const queryString = queryParams.toString();
        
        return {
          url: `/email/templates/${id}${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },

      providesTags: (result, error, id) => [{ type: "Template", id }],
    }),

    // ================= UPDATE TEMPLATE =================
    updateTemplate: builder.mutation<
      TemplateResponse,
      {
        id: string | number;
        data: UpdateTemplateRequest;
      }
    >({
      query: ({ id, data }) => {
        const auth = getAuthUser();
        const isSuperAdmin = auth?.role === 'super-admin';
        
        let hospitalId: number | undefined;
        
        if (!isSuperAdmin) {
          const authHospitalId = getHospitalIdFromAuth(auth);
          if (authHospitalId) {
            hospitalId = authHospitalId;
          }
        }
        
        const updateData: any = {};

        if (data.templateName !== undefined) updateData.templateName = data.templateName;
        if (data.subject !== undefined) updateData.subject = data.subject;
        if (data.message !== undefined) updateData.message = data.message;
        if (data.category !== undefined) updateData.category = data.category;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.variables !== undefined) updateData.variables = data.variables;
        if (hospitalId) updateData.hospitalId = hospitalId;
        
        return {
          url: `/email/templates/${id}`,
          method: "PUT",
          body: updateData,
        };
      },

      invalidatesTags: (result, error, { id }) => [
        { type: "Template", id },
        "Template",
      ],
    }),

    // ================= DELETE TEMPLATE =================
    deleteTemplate: builder.mutation<
      { success: boolean; message: string },
      string | number
    >({
      query: (id) => {
        const auth = getAuthUser();
        const isSuperAdmin = auth?.role === 'super-admin';
        
        let hospitalId: number | undefined;
        
        if (!isSuperAdmin) {
          const authHospitalId = getHospitalIdFromAuth(auth);
          if (authHospitalId) {
            hospitalId = authHospitalId;
          }
        }
        
        const queryParams = new URLSearchParams();
        if (hospitalId) {
          queryParams.append("hospitalId", String(hospitalId));
        }
        
        const queryString = queryParams.toString();
        
        return {
          url: `/email/templates/${id}${queryString ? `?${queryString}` : ""}`,
          method: "DELETE",
        };
      },

      invalidatesTags: (result, error, id) => [
        { type: "Template", id },
        "Template",
      ],
    }),
  }),
});

// ================= HELPER FUNCTIONS =================

// Helper: Get hospital ID from auth (returns number)
const getHospitalIdFromAuth = (auth: any): number | null => {
  if (!auth) return null;
  
  if (auth.hospitalId) {
    return Number(auth.hospitalId);
  }
  
  return null;
};

// Helper: Get auth ID from auth
const getAuthIdFromAuth = (auth: any): string | null => {
  if (!auth) return null;
  
  if (auth.authId) {
    return String(auth.authId);
  }
  
  if (auth.id) {
    return String(auth.id);
  }
  
  return null;
};

// Helper: Convert string | number to number safely
const toNumber = (value: string | number | undefined): number | undefined => {
  if (value === undefined || value === null) return undefined;
  return Number(value);
};

// ================= EXPORT HOOKS =================

export const {
  useCreateTemplateMutation,
  useGetTemplatesQuery,
  useGetTemplateByIdQuery,
  useUpdateTemplateMutation,
  useDeleteTemplateMutation,
} = templateApi;