// leaveTemplateApi.ts
import { api } from "./api";
import { getAuthUser } from "../../src/utils/auth";

// ==============================
// TYPES
// ==============================

export type EmployeeType = "Doctor" | "Staff" | "System";

export interface LeaveTemplate {
  id?: string | number;
  hospitalId?: string | number | null;
  employeeId?: string | number | null;
  employeeType?: EmployeeType;
  templateName: string;
  reasonCategory: string;
  templateText: string;
  placeholders?: string[];
  isPredefined?: boolean;
  isRecommended?: boolean;
  icon?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface GetLeaveTemplatesParams {
  hospitalId?: string | number;
  employeeId?: string | number;
  isPredefined?: boolean;
  reasonCategory?: string;
  search?: string;
}

export interface LeaveTemplateResponse {
  success?: boolean;
  message?: string;
  count?: number;
  data?: LeaveTemplate | LeaveTemplate[];
  error?: string;
}

export interface CreateLeaveTemplatePayload {
  hospitalId?: string | number;
  employeeId?: string | number;
  employeeType?: EmployeeType;
  templateName: string;
  reasonCategory: string;
  templateText: string;
  placeholders?: string[];
  isPredefined?: boolean;
  isRecommended?: boolean;
  icon?: string;
}

export interface DuplicateLeaveTemplatePayload {
  id: string | number;
  employeeId: string | number;
  employeeType?: EmployeeType;
  templateName?: string;
}

export interface UpdateLeaveTemplatePayload {
  id: string | number;
  data: Partial<LeaveTemplate>;
}

// ==============================
// HELPERS
// ==============================

const getHospitalIdFromAuth = (auth: any): string | number | null => {
  if (!auth) return null;
  if (auth.hospitalId) return auth.hospitalId;
  return null;
};

interface EmployeeInfo {
  employeeId: number | null;
  employeeType: EmployeeType;
  isEmployee: boolean;
}

/**
 * Resolves the backend-accepted employee identity from auth.
 *
 * Backend accepts ONLY: "Doctor" | "Staff" | "Admin" | "System"
 *
 * Never pass auth.role / auth.roleName / auth.userType directly —
 * map explicitly.
 *
 *   Doctor  → doctorId present
 *   Staff   → staffId present
 *   System  → hospital login (no doctorId / staffId)
 */
const getEmployeeInfoFromAuth = (auth: any): EmployeeInfo => {
  if (!auth) {
    return {
      employeeId: null,
      employeeType: "System",
      isEmployee: false,
    };
  }

  // Doctor
  const doctorId = auth.doctorId ?? localStorage.getItem("doctorId");

  if (doctorId) {
    return {
      employeeId: Number(doctorId),
      employeeType: "Doctor",
      isEmployee: true,
    };
  }

  // Staff
  const staffId = auth.staffId ?? localStorage.getItem("staffId");

  if (staffId) {
    return {
      employeeId: Number(staffId),
      employeeType: "Staff",
      isEmployee: true,
    };
  }

  // Hospital / System login
  return {
    employeeId: null,
    employeeType: "System",
    isEmployee: false,
  };
};

// ==============================
// LEAVE TEMPLATE API
// ==============================

export const leaveTemplateApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // ==============================
    // GET ALL LEAVE TEMPLATES
    // GET /leave-templates
    //
    // Hospital     → predefined only  (isPredefined=true)
    // Doctor/Staff → own custom only  (employeeId + isPredefined=false)
    //                (predefined fetched separately via
    //                 getPredefinedLeaveTemplates)
    // ==============================

    getLeaveTemplates: builder.query<
      LeaveTemplateResponse,
      GetLeaveTemplatesParams
    >({
      query: (params: GetLeaveTemplatesParams = {}) => {
        const auth = getAuthUser();
        const queryParams = new URLSearchParams();

        const hospitalId =
          params.hospitalId ?? getHospitalIdFromAuth(auth);

        if (hospitalId) {
          queryParams.append("hospitalId", String(hospitalId));
        }

        const employeeInfo = getEmployeeInfoFromAuth(auth);

        if (employeeInfo.isEmployee) {
          // =====================================
          // DOCTOR / STAFF
          // Own custom templates only
          // =====================================

          queryParams.append(
            "employeeId",
            String(employeeInfo.employeeId)
          );

          queryParams.append("isPredefined", "false");
        } else {
          // =====================================
          // HOSPITAL / SYSTEM
          // Predefined templates only
          // =====================================

          queryParams.append("isPredefined", "true");
        }

        if (
          params.reasonCategory &&
          params.reasonCategory !== "All Templates"
        ) {
          queryParams.append(
            "reasonCategory",
            params.reasonCategory
          );
        }

        if (params.search?.trim()) {
          queryParams.append("search", params.search.trim());
        }

        const queryString = queryParams.toString();

        return `/leave-templates${
          queryString ? `?${queryString}` : ""
        }`;
      },

      providesTags: ["LeaveTemplate"],
    }),

    // ==============================
    // GET PREDEFINED TEMPLATES ONLY
    // GET /leave-templates/predefined
    //
    // Used by Doctor/Staff to fetch the shared predefined
    // templates alongside their own custom ones.
    // ==============================

    getPredefinedLeaveTemplates: builder.query<
      LeaveTemplateResponse,
      { reasonCategory?: string }
    >({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();

        if (
          params.reasonCategory &&
          params.reasonCategory !== "All Templates"
        ) {
          queryParams.append(
            "reasonCategory",
            params.reasonCategory
          );
        }

        const queryString = queryParams.toString();

        return `/leave-templates/predefined${
          queryString ? `?${queryString}` : ""
        }`;
      },
      providesTags: ["LeaveTemplate"],
    }),

    // ==============================
    // GET TEMPLATE BY ID
    // GET /leave-templates/:id
    // ==============================

    getLeaveTemplateById: builder.query<
      LeaveTemplateResponse,
      string | number
    >({
      query: (id) => `/leave-templates/${id}`,
      providesTags: (_result, _error, id) => [
        { type: "LeaveTemplate", id },
      ],
    }),

    // ==============================
    // CREATE LEAVE TEMPLATE
    // POST /leave-templates
    //
    // Doctor/Staff → isPredefined: false  (custom template)
    // Hospital     → isPredefined: true   (predefined template)
    //
    // employeeType is always one of:
    //   "Doctor" | "Staff" | "Admin" | "System"
    // ==============================

    createLeaveTemplate: builder.mutation<
      LeaveTemplateResponse,
      CreateLeaveTemplatePayload
    >({
      query: (body) => {
        const auth = getAuthUser();

        const hospitalId =
          body.hospitalId ?? getHospitalIdFromAuth(auth);

        const employeeInfo = getEmployeeInfoFromAuth(auth);

        const finalPayload = {
          ...body,

          hospitalId: hospitalId
            ? Number(hospitalId)
            : null,

          employeeId: employeeInfo.employeeId,
          employeeType: employeeInfo.employeeType,

          isPredefined: employeeInfo.isEmployee
            ? false
            : true,

          isRecommended: body.isRecommended ?? false,
        };

       

        return {
          url: "/leave-templates",
          method: "POST",
          body: finalPayload,
        };
      },

      invalidatesTags: ["LeaveTemplate"],
    }),

    // ==============================
    // DUPLICATE TEMPLATE (Copy to My Templates)
    // POST /leave-templates/:id/duplicate
    // ==============================

    duplicateLeaveTemplate: builder.mutation<
      LeaveTemplateResponse,
      DuplicateLeaveTemplatePayload
    >({
      query: ({ id, ...data }) => ({
        url: `/leave-templates/${id}/duplicate`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["LeaveTemplate"],
    }),

    // ==============================
    // UPDATE LEAVE TEMPLATE
    // PUT /leave-templates/:id
    //
    // Only custom templates owned by the employee are editable.
    // ==============================

    updateLeaveTemplate: builder.mutation<
      LeaveTemplateResponse,
      UpdateLeaveTemplatePayload
    >({
      query: ({ id, data }) => ({
        url: `/leave-templates/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "LeaveTemplate",
        { type: "LeaveTemplate", id },
      ],
    }),

    // ==============================
    // DELETE LEAVE TEMPLATE
    // DELETE /leave-templates/:id
    // ==============================

    deleteLeaveTemplate: builder.mutation<
      LeaveTemplateResponse,
      string | number
    >({
      query: (id) => ({
        url: `/leave-templates/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["LeaveTemplate"],
    }),
  }),
});

// ==============================
// EXPORT HOOKS
// ==============================

export const {
  useGetLeaveTemplatesQuery,
  useGetPredefinedLeaveTemplatesQuery,
  useGetLeaveTemplateByIdQuery,
  useCreateLeaveTemplateMutation,
  useDuplicateLeaveTemplateMutation,
  useUpdateLeaveTemplateMutation,
  useDeleteLeaveTemplateMutation,
} = leaveTemplateApi;