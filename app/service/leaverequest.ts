import { api } from "./api";
import { getAuthUser } from "../../src/utils/auth";

// ==============================
// TYPES
// ==============================

export interface LeaveRequest {
  id?: string | number;
  _id?: string;
  hospitalId: string | number;
  employeeId: string | number;
  employeeType?: string;
  employeeName?: string;
  employeeEmail?: string;
  department?: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reasonCategory?: string;
  reason: string;
  additionalDetails?: string | null;
  handoverToId?: string | number | null;
  handoverToName?: string | null;
  handoverToType?: string | null;
  handoverNotes?: string | null;
  isConfirmed?: boolean;
  status: "Pending" | "Approved" | "Rejected" | "Cancelled";
  adminComments?: string | null;
  actionBy?: string | number | null;
  actionByName?: string | null;
  actionDate?: string | null;
  appliedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface GetLeaveRequestsParams {
  hospitalId?: string | number;
  employeeId?: string | number;
  employeeType?: string;
  department?: string;
  leaveType?: string;
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  date?: string;
  page?: number;
  limit?: number;
  skipHospitalFilter?: boolean;
}

export interface LeaveRequestResponse {
  success?: boolean;
  message?: string;
  count?: number;
  status?: string;
  data?: LeaveRequest | LeaveRequest[];
  error?: string;
}

export interface LeaveStatsResponse {
  success?: boolean;
  data?: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  error?: string;
}

export interface CreateLeaveRequestPayload {
  hospitalId?: string | number;
  employeeId: string | number;
  employeeType?: string;
  employeeName?: string;
  employeeEmail?: string;
  department?: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays?: number;
  reasonCategory?: string;
  reason: string;
  additionalDetails?: string;
  handoverToId?: string | number;
  handoverToName?: string;
  handoverToType?: string;
  handoverNotes?: string;
  isConfirmed?: boolean;
}

export interface UpdateLeaveStatusPayload {
  id: string | number;
  status: "Approved" | "Rejected" | "Pending" | "Cancelled";
  adminComments?: string;
  actionByName?: string;
  actionBy?: string | number;
}

export interface UpdateLeaveRequestPayload {
  id: string | number;
  data: Partial<LeaveRequest>;
}

// ==============================
// HELPER
// ==============================

const getHospitalIdFromAuth = (auth: any): string | number | null => {
  if (!auth) return null;
  if (auth.hospitalId) return auth.hospitalId;
  return null;
};

// ==============================
// LEAVE REQUEST API
// ==============================

export const leaveRequestApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // ==============================
    // GET ALL LEAVE REQUESTS
    // GET /leave-requests
    // ==============================

    getLeaveRequests: builder.query<
      LeaveRequestResponse,
      GetLeaveRequestsParams
    >({
      query: (params: GetLeaveRequestsParams = {}) => {
        const auth = getAuthUser();
        const queryParams = new URLSearchParams();

        const isSuperAdmin = auth?.role === "super-admin";
        const shouldSkipFilter = params.skipHospitalFilter === true;

        let hospitalIdToUse: any = null;

        if (!isSuperAdmin && !shouldSkipFilter) {
          hospitalIdToUse = getHospitalIdFromAuth(auth);
          if (!hospitalIdToUse) hospitalIdToUse = params.hospitalId;
          if (hospitalIdToUse)
            queryParams.append("hospitalId", String(hospitalIdToUse));
        } else if (isSuperAdmin && params.hospitalId) {
          queryParams.append("hospitalId", String(params.hospitalId));
        } else if (params.hospitalId) {
          queryParams.append("hospitalId", String(params.hospitalId));
        }

        if (params.employeeId)
          queryParams.append("employeeId", String(params.employeeId));
        if (params.employeeType)
          queryParams.append("employeeType", params.employeeType);
        if (params.department)
          queryParams.append("department", params.department);
        if (params.leaveType)
          queryParams.append("leaveType", params.leaveType);
        if (params.status && params.status !== "All")
          queryParams.append("status", params.status);
        if (params.search?.trim())
          queryParams.append("search", params.search.trim());

        if (params.startDate && params.endDate) {
          queryParams.append("startDate", params.startDate);
          queryParams.append("endDate", params.endDate);
        } else if (params.date) {
          queryParams.append("date", params.date);
        }

        if (params.page) queryParams.append("page", String(params.page));
        if (params.limit) queryParams.append("limit", String(params.limit));

        const queryString = queryParams.toString();
        return `/leave-requests${queryString ? `?${queryString}` : ""}`;
      },

      providesTags: ["LeaveRequest"],
    }),

    // ==============================
    // GET LEAVE STATS
    // GET /leave-requests/stats
    // ==============================

    getLeaveStats: builder.query<
      LeaveStatsResponse,
      {
        hospitalId?: string | number;
        employeeId?: string | number;
        employeeType?: string;
      }
    >({
      query: (params = {}) => {
        const auth = getAuthUser();
        const queryParams = new URLSearchParams();
        const isSuperAdmin = auth?.role === "super-admin";

        if (!isSuperAdmin) {
          const hospitalId = params.hospitalId ?? getHospitalIdFromAuth(auth);
          if (hospitalId)
            queryParams.append("hospitalId", String(hospitalId));
        } else if (params.hospitalId) {
          queryParams.append("hospitalId", String(params.hospitalId));
        }

        if (params.employeeId)
          queryParams.append("employeeId", String(params.employeeId));
        if (params.employeeType)
          queryParams.append("employeeType", params.employeeType);

        const queryString = queryParams.toString();
        return `/leave-requests/stats${queryString ? `?${queryString}` : ""}`;
      },

      providesTags: ["LeaveRequest"],
    }),

    // ==============================
    // GET LEAVE REQUEST BY ID
    // GET /leave-requests/:id
    // ==============================

    getLeaveRequestById: builder.query<LeaveRequestResponse, string | number>({
      query: (id) => `/leave-requests/${id}`,
      providesTags: (_result, _error, id) => [
        { type: "LeaveRequest", id },
      ],
    }),

    // ==============================
    // CREATE LEAVE REQUEST
    // POST /leave-requests
    // ==============================

    createLeaveRequest: builder.mutation<
      LeaveRequestResponse,
      CreateLeaveRequestPayload
    >({
      query: (body) => {
        const auth = getAuthUser();
        const hospitalId = body.hospitalId ?? getHospitalIdFromAuth(auth);

        if (!hospitalId) {
          throw new Error(
            "hospitalId is missing. Please log in again or contact support."
          );
        }

        return {
          url: "/leave-requests",
          method: "POST",
          body: {
            ...body,
            hospitalId: Number(hospitalId),
            employeeId: Number(body.employeeId),
          },
        };
      },
      invalidatesTags: ["LeaveRequest"],
    }),

    // ==============================
    // UPDATE LEAVE STATUS (ADMIN)
    // PUT /leave-requests/:id
    // ==============================

    updateLeaveStatus: builder.mutation<
      LeaveRequestResponse,
      UpdateLeaveStatusPayload
    >({
      query: ({ id, ...data }) => ({
        // ⚠️ If your router uses "/status" suffix, change to:
        // url: `/leave-requests/${id}/status`,
        url: `/leave-requests/${id}/status`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "LeaveRequest",
        { type: "LeaveRequest", id },
      ],
    }),

    // ==============================
    // UPDATE LEAVE REQUEST
    // PUT /leave-requests/:id
    // ==============================

    updateLeaveRequest: builder.mutation<
      LeaveRequestResponse,
      UpdateLeaveRequestPayload
    >({
      query: ({ id, data }) => ({
        url: `/leave-requests/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "LeaveRequest",
        { type: "LeaveRequest", id },
      ],
    }),

    // ==============================
    // CANCEL LEAVE REQUEST
    // PUT /leave-requests/:id
    // ==============================

    cancelLeaveRequest: builder.mutation<
      LeaveRequestResponse,
      string | number
    >({
      query: (id) => ({
        // ⚠️ If your router uses "/cancel" suffix, change to:
        // url: `/leave-requests/${id}/cancel`,
        url: `/leave-requests/${id}`,
        method: "PUT",
        body: { status: "Cancelled" },
      }),
      invalidatesTags: (_result, _error, id) => [
        "LeaveRequest",
        { type: "LeaveRequest", id },
      ],
    }),

    // ==============================
    // DELETE LEAVE REQUEST
    // DELETE /leave-requests/:id
    // ==============================

    deleteLeaveRequest: builder.mutation<
      LeaveRequestResponse,
      string | number
    >({
      query: (id) => ({
        url: `/leave-requests/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        "LeaveRequest",
        { type: "LeaveRequest", id },
      ],
    }),
  }),
});

// ==============================
// EXPORT HOOKS
// ==============================

export const {
  useGetLeaveRequestsQuery,
  useGetLeaveStatsQuery,
  useGetLeaveRequestByIdQuery,
  useCreateLeaveRequestMutation,
  useUpdateLeaveStatusMutation,
  useUpdateLeaveRequestMutation,
  useCancelLeaveRequestMutation,
  useDeleteLeaveRequestMutation,
} = leaveRequestApi;