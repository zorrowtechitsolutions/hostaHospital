// app/service/email.ts - Email API service with Hospital Filter for ALL roles

import { api } from "./api";
import { getAuthUser } from "../../src/utils/auth";

// ================= TYPES =================

export interface EmailRecipient {
  email?: string;
  name?: string;
  roleId?: number;
  all?: boolean;
  userIds?: number[];
  doctorId?: number;
  staffId?: number;
  id?: number;
  _id?: string;
}

export interface EmailNotification {
  id?: number;
  hospitalId?: number;
  createdBy?: string | number;
  recipients: EmailRecipient[] | string[];
  subject: string;
  message: string;
  templateId?: number;  // ✅ FIXED: Changed from string to number
  status?: 'draft' | 'sent' | 'scheduled' | 'failed' | 'queued';
  scheduledAt?: string;
  sentAt?: string;
  isArchived?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmailResponse {
  success: boolean;
  message: string;
  data?: EmailNotification | EmailNotification[];
  pagination?: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

export interface GetEmailParams {
  id?: string | number;
  hospitalId?: string | number;
  createdBy?: string | number;
  status?: 'draft' | 'sent' | 'scheduled' | 'failed' | 'queued' | 'all';
  subject?: string;
  recipient?: string;
  templateId?: string;
  search_query?: string;
  startDate?: string;
  endDate?: string;
  isArchived?: boolean;
  page?: number;
  limit?: number;
  skipHospitalFilter?: boolean;
}

export interface SendEmailRequest {
  recipients: EmailRecipient[];
  subject: string;
  message: string;
  templateId?: number;
  scheduledAt?: string;
}

// ✅ FIXED: Changed templateId from string to number
export interface SaveDraftRequest {
  recipients: EmailRecipient[] | string[];
  subject: string;
  message: string;
  templateId?: number;  // ✅ Now number, not string
}

// ✅ FIXED: Changed templateId from string to number
export interface UpdateDraftRequest {
  recipients?: EmailRecipient[] | string[];
  subject?: string;
  message?: string;
  templateId?: number;  // ✅ Now number, not string
  scheduledAt?: string;
}

// ================= HELPER FUNCTIONS =================

// Helper: Get hospital ID from auth (returns number)
const getHospitalIdFromAuth = (auth: any): number | null => {
  if (!auth) return null;
  
  // Priority 1: Use hospitalId if available (this is the correct hospital ID)
  if (auth.hospitalId) {
    return Number(auth.hospitalId);
  }
  
  return null;
};

// Helper: Get auth ID from auth
const getAuthIdFromAuth = (auth: any): string | null => {
  if (!auth) return null;
  
  // Priority: authId > id
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

// Helper: Format email addresses for API - Now returns objects as-is
const formatRecipients = (recipients: EmailRecipient[] | string[]): any[] => {
  return recipients.map(recipient => {
    if (typeof recipient === 'string') {
      return { email: recipient };
    }
    // Return the object as-is (already has roleId, userIds, etc.)
    return recipient;
  });
};

// ================= API =================

export const emailApi = api.injectEndpoints({
  endpoints: (builder) => ({

    // ================= SEND EMAIL =================
    sendEmail: builder.mutation<
      EmailResponse,
      SendEmailRequest
    >({
      query: (data) => {
        const auth = getAuthUser();
        const isSuperAdmin = auth?.role === 'super-admin';
        
        // Get hospital ID using helper
        let hospitalId: number | undefined;
        
        if (!isSuperAdmin) {
          const authHospitalId = getHospitalIdFromAuth(auth);
          if (authHospitalId) {
            hospitalId = authHospitalId;
          }
        }
        
        // Get userId (this is the authId)
        const userId = getAuthIdFromAuth(auth);
        
        return {
          url: "/email/send-email",
          method: "POST",
          body: {
            hospitalId: hospitalId,
            createdBy: userId,
            recipients: formatRecipients(data.recipients),
            subject: data.subject,
            message: data.message,
            templateId: data.templateId,
            scheduledAt: data.scheduledAt,
          },
        };
      },

      invalidatesTags: ["Email"],
    }),

    // ================= SAVE DRAFT =================
    saveDraft: builder.mutation<
      EmailResponse,
      SaveDraftRequest
    >({
      query: (data) => {
        const auth = getAuthUser();
        const isSuperAdmin = auth?.role === 'super-admin';
        
        // Get hospital ID using helper
        let hospitalId: number | undefined;
        
        if (!isSuperAdmin) {
          const authHospitalId = getHospitalIdFromAuth(auth);
          if (authHospitalId) {
            hospitalId = authHospitalId;
          }
        }
        
        // Get userId (this is the authId)
        const userId = getAuthIdFromAuth(auth);
        
        return {
          url: "/email/draft",
          method: "POST",
          body: {
            hospitalId: hospitalId,
            createdBy: userId,
            recipients: formatRecipients(data.recipients),
            subject: data.subject,
            message: data.message,
            templateId: data.templateId,
            status: 'draft',
          },
        };
      },

      invalidatesTags: ["Email"],
    }),

    // ================= SEND DRAFT =================
    sendDraft: builder.mutation<
      EmailResponse,
      {
        id: string | number;
        scheduledAt?: string;
      }
    >({
      query: ({ id, scheduledAt }) => {
        const auth = getAuthUser();
        const isSuperAdmin = auth?.role === 'super-admin';
        
        // Get hospital ID using helper
        let hospitalId: number | undefined;
        
        if (!isSuperAdmin) {
          const authHospitalId = getHospitalIdFromAuth(auth);
          if (authHospitalId) {
            hospitalId = authHospitalId;
          }
        }
        
        return {
          url: `/email/send-draft/${id}`,
          method: "POST",
          body: {
            hospitalId: hospitalId,
            scheduledAt: scheduledAt,
          },
        };
      },

      invalidatesTags: (result, error, { id }) => [
        { type: "Email", id },
        "Email",
      ],
    }),

    // ================= UPDATE DRAFT =================
    updateDraft: builder.mutation<
      EmailResponse,
      {
        id: string | number;
        data: UpdateDraftRequest;
      }
    >({
      query: ({ id, data }) => {
        const auth = getAuthUser();
        const isSuperAdmin = auth?.role === 'super-admin';
        
        // Get hospital ID using helper
        let hospitalId: number | undefined;
        
        if (!isSuperAdmin) {
          const authHospitalId = getHospitalIdFromAuth(auth);
          if (authHospitalId) {
            hospitalId = authHospitalId;
          }
        }
        
        // Prepare update data
        const updateData: any = {
          status: 'draft',
        };

        // Only include fields that are provided
        if (data.recipients) updateData.recipients = formatRecipients(data.recipients);
        if (data.subject) updateData.subject = data.subject;
        if (data.message) updateData.message = data.message;
        if (data.templateId !== undefined && data.templateId !== null) updateData.templateId = data.templateId;
        if (data.scheduledAt) updateData.scheduledAt = data.scheduledAt;
        if (hospitalId) updateData.hospitalId = hospitalId;
        
        return {
          url: `/email/${id}`,
          method: "PUT",
          body: updateData,
        };
      },

      invalidatesTags: (result, error, { id }) => [
        { type: "Email", id },
        "Email",
      ],
    }),

    // ================= DELETE DRAFT =================
    deleteDraft: builder.mutation<
      { success: boolean; message: string },
      string | number
    >({
      query: (id) => {
        const auth = getAuthUser();
        const isSuperAdmin = auth?.role === 'super-admin';
        
        // Get hospital ID using helper
        let hospitalId: number | undefined;
        
        if (!isSuperAdmin) {
          const authHospitalId = getHospitalIdFromAuth(auth);
          if (authHospitalId) {
            hospitalId = authHospitalId;
          }
        }
        
        return {
          url: `/email/${id}`,
          method: "DELETE",
          body: {
            hospitalId: hospitalId,
          },
        };
      },

      invalidatesTags: (result, error, id) => [
        { type: "Email", id },
        "Email",
      ],
    }),

    // ================= DUPLICATE EMAIL =================
    duplicateEmail: builder.mutation<
      EmailResponse,
      string | number
    >({
      query: (id) => {
        const auth = getAuthUser();
        const isSuperAdmin = auth?.role === 'super-admin';
        
        // Get hospital ID using helper
        let hospitalId: number | undefined;
        
        if (!isSuperAdmin) {
          const authHospitalId = getHospitalIdFromAuth(auth);
          if (authHospitalId) {
            hospitalId = authHospitalId;
          }
        }
        
        return {
          url: `/email/duplicate/${id}`,
          method: "POST",
          body: {
            hospitalId: hospitalId,
          },
        };
      },

      invalidatesTags: ["Email"],
    }),

    // ================= RESEND EMAIL =================
    resendEmail: builder.mutation<
      EmailResponse,
      {
        id: string | number;
        recipients?: EmailRecipient[] | string[];
        scheduledAt?: string;
      }
    >({
      query: ({ id, recipients, scheduledAt }) => {
        const auth = getAuthUser();
        const isSuperAdmin = auth?.role === 'super-admin';
        
        // Get hospital ID using helper
        let hospitalId: number | undefined;
        
        if (!isSuperAdmin) {
          const authHospitalId = getHospitalIdFromAuth(auth);
          if (authHospitalId) {
            hospitalId = authHospitalId;
          }
        }
        
        const body: any = {
          hospitalId: hospitalId,
        };
        
        if (recipients) body.recipients = formatRecipients(recipients);
        if (scheduledAt) body.scheduledAt = scheduledAt;
        
        return {
          url: `/email/resend/${id}`,
          method: "POST",
          body: body,
        };
      },

      invalidatesTags: (result, error, { id }) => [
        { type: "Email", id },
        "Email",
      ],
    }),

    // ================= ARCHIVE EMAIL =================
    archiveEmail: builder.mutation<
      { success: boolean; message: string; data?: EmailNotification },
      string | number
    >({
      query: (id) => {
        const auth = getAuthUser();
        const isSuperAdmin = auth?.role === 'super-admin';
        
        // Get hospital ID using helper
        let hospitalId: number | undefined;
        
        if (!isSuperAdmin) {
          const authHospitalId = getHospitalIdFromAuth(auth);
          if (authHospitalId) {
            hospitalId = authHospitalId;
          }
        }
        
        return {
          url: `/email/archive/${id}`,
          method: "PATCH",
          body: {
            hospitalId: hospitalId,
            isArchived: true,
          },
        };
      },

      invalidatesTags: (result, error, id) => [
        { type: "Email", id },
        "Email",
      ],
    }),

    // ================= GET EMAILS =================
    getEmails: builder.query<
      EmailResponse,
      GetEmailParams | void
    >({
      query: (params: GetEmailParams = {}) => {
        const queryParams = new URLSearchParams();

        const auth = getAuthUser();
        
        // Determine if user is super admin
        const isSuperAdmin = auth?.role === 'super-admin';
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
            console.warn("⚠️ No hospital ID found for filtering emails");
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

        // CreatedBy filter (this should use authId, not hospitalId)
        if (params.createdBy) {
          queryParams.append("createdBy", String(params.createdBy));
        }

        // Status filter
        if (params.status && params.status !== 'all') {
          queryParams.append("status", params.status);
        }

        // Subject filter
        if (params.subject) {
          queryParams.append("subject", params.subject);
        }

        // Recipient filter
        if (params.recipient) {
          queryParams.append("recipient", params.recipient);
        }

        // Template ID filter
        if (params.templateId) {
          queryParams.append("templateId", params.templateId);
        }

        // Search query
        if (params.search_query) {
          queryParams.append("search_query", params.search_query);
        }

        // Date filters
        if (params.startDate) {
          queryParams.append("startDate", params.startDate);
        }

        if (params.endDate) {
          queryParams.append("endDate", params.endDate);
        }

        // Archived filter
        if (params.isArchived !== undefined) {
          queryParams.append("isArchived", String(params.isArchived));
        }

        // Pagination parameters
        if (params.page) {
          queryParams.append("page", String(params.page));
        }

        if (params.limit) {
          queryParams.append("limit", String(params.limit));
        }

        const queryString = queryParams.toString();

        let url;
        if (params.id) {
          url = `/email/${params.id}${queryString ? `?${queryString}` : ""}`;
        } else {
          url = `/email${queryString ? `?${queryString}` : ""}`;
        }
        
        return url;
      },

      providesTags: (result, error, params) => {
        if (params?.id && result?.data && !Array.isArray(result.data)) {
          return [{ type: "Email", id: params.id }];
        }
        return ["Email"];
      },
    }),
  }),
});

// ================= EXPORT HOOKS =================

export const {
  useGetEmailsQuery,
  useSendEmailMutation,
  useSaveDraftMutation,
  useSendDraftMutation,
  useUpdateDraftMutation,
  useDeleteDraftMutation,
  useDuplicateEmailMutation,
  useResendEmailMutation,
  useArchiveEmailMutation,
} = emailApi;