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
  templateId?: number;
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

export interface SaveDraftRequest {
  recipients: EmailRecipient[] | string[];
  subject: string;
  message: string;
  templateId?: number;
}

export interface UpdateDraftRequest {
  recipients?: EmailRecipient[] | string[];
  subject?: string;
  message?: string;
  templateId?: number;
  scheduledAt?: string;
}

// ================= HELPER FUNCTIONS =================

const getHospitalIdFromAuth = (auth: any): number | null => {
  if (!auth) return null;
  
  if (auth.hospitalId) {
    return Number(auth.hospitalId);
  }
  
  return null;
};

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

const toNumber = (value: string | number | undefined): number | undefined => {
  if (value === undefined || value === null) return undefined;
  return Number(value);
};

const formatRecipients = (recipients: EmailRecipient[] | string[]): any[] => {
  return recipients.map(recipient => {
    if (typeof recipient === 'string') {
      return { email: recipient };
    }
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
        
        let hospitalId: number | undefined;
        
        if (!isSuperAdmin) {
          const authHospitalId = getHospitalIdFromAuth(auth);
          if (authHospitalId) {
            hospitalId = authHospitalId;
          }
        }
        
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
        
        let hospitalId: number | undefined;
        
        if (!isSuperAdmin) {
          const authHospitalId = getHospitalIdFromAuth(auth);
          if (authHospitalId) {
            hospitalId = authHospitalId;
          }
        }
        
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
        
        let hospitalId: number | undefined;
        
        if (!isSuperAdmin) {
          const authHospitalId = getHospitalIdFromAuth(auth);
          if (authHospitalId) {
            hospitalId = authHospitalId;
          }
        }
        
        const updateData: any = {
          status: 'draft',
        };

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

    // ================= UNARCHIVE EMAIL =================
    // Unarchives an email and sets its status to 'draft'
    unarchiveEmail: builder.mutation<
      EmailResponse,
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
        
        return {
          url: `/email/unarchive/${id}`,
          method: "PATCH",
          body: {
            hospitalId: hospitalId,
            isArchived: false,
            status: 'draft', // When unarchived, set status to draft
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
          } else {
            console.warn("⚠️ No hospital ID found for filtering emails");
          }
        } 
        else if (isSuperAdmin && params.hospitalId) {
          queryParams.append("hospitalId", String(params.hospitalId));
        }
        else if (params.hospitalId) {
          queryParams.append("hospitalId", String(params.hospitalId));
        }

        if (params.createdBy) {
          queryParams.append("createdBy", String(params.createdBy));
        }

        if (params.status && params.status !== 'all') {
          queryParams.append("status", params.status);
        }

        if (params.subject) {
          queryParams.append("subject", params.subject);
        }

        if (params.recipient) {
          queryParams.append("recipient", params.recipient);
        }

        if (params.templateId) {
          queryParams.append("templateId", params.templateId);
        }

        if (params.search_query) {
          queryParams.append("search_query", params.search_query);
        }

        if (params.startDate) {
          queryParams.append("startDate", params.startDate);
        }

        if (params.endDate) {
          queryParams.append("endDate", params.endDate);
        }

        if (params.isArchived !== undefined) {
          queryParams.append("isArchived", String(params.isArchived));
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
  useUnarchiveEmailMutation, // ✅ New hook for unarchive
} = emailApi;