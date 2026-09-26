// app/service/fingerprint.ts

import { api } from "./api";

// ==============================
// TYPES
// ==============================

export interface CreateFingerprintEnrollmentPayload {
  hospitalId: string | number;
  employeeId: string | number;
  employeeType: string;
  employeeName: string;
  employeeCode?: string;
  department?: string;
  deviceId?: string;
  deviceDbId?: string | number;
  fingerPosition?: string;
  fingerprintHash?: string;
  fingerprintTemplate?: string;
  templateReference?: string;
  quality?: string;
  attempts?: number;
}

export interface FingerprintEnrollmentResponse {
  success?: boolean;
  message?: string;
  data?: {
    id?: string | number;
    hospitalId?: string | number;
    employeeId?: string | number;
    employeeType?: string;
    employeeName?: string;
    employeeCode?: string;
    department?: string;
    deviceId?: string;
    deviceDbId?: string | number;
    fingerPosition?: string;
    fingerprintHash?: string;
    templateReference?: string;
    quality?: string;
    attempts?: number;
    status?: string;
    enrolledAt?: string;
    [key: string]: any;
  };
  error?: string;
}

export interface GetFingerprintEnrollmentsPayload {
  hospitalId?: string | number;
  employeeId?: string | number;
  employeeType?: string;
  deviceId?: string;
  status?: string;
  page?: number;
  limit?: number;
  search_query?: string;
  [key: string]: any;
}

export interface FingerprintEnrollmentListResponse {
  success?: boolean;
  message?: string;
  data?: any[];
  pagination?: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
  };
  error?: string;
}

export interface GetFingerprintEnrollmentByIdPayload {
  id: string | number;
}

export interface UpdateFingerprintEnrollmentPayload {
  id: string | number;
  hospitalId?: string | number;
  employeeId?: string | number;
  employeeType?: string;
  employeeName?: string;
  employeeCode?: string;
  department?: string;
  deviceId?: string;
  deviceDbId?: string | number;
  fingerPosition?: string;
  fingerprintHash?: string;
  fingerprintTemplate?: string;
  templateReference?: string;
  quality?: string;
  attempts?: number;
  status?: string;
}

export interface DeactivateFingerprintEnrollmentPayload {
  id: string | number;
}

export interface ActivateFingerprintEnrollmentPayload {
  id: string | number;
}

// ==============================
// FINGERPRINT ENROLLMENT API
// ==============================

export const fingerprintApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // ==============================
    // CREATE FINGERPRINT ENROLLMENT
    // POST /fingerprint-enrollments
    // ==============================

    createFingerprintEnrollment: builder.mutation<
      FingerprintEnrollmentResponse,
      CreateFingerprintEnrollmentPayload
    >({
      query: (payload) => ({
        url: `/fingerprint-enrollments`,
        method: "POST",
        body: payload,
      }),

      invalidatesTags: ["Fingerprint", "Role"],
    }),

    // ==============================
    // GET ALL WITH FILTERS (PAGINATED)
    // GET /fingerprint-enrollments?hospitalId=62&employeeType=doctor
    // ==============================

    getAllFingerprintEnrollments: builder.query<
      FingerprintEnrollmentListResponse,
      GetFingerprintEnrollmentsPayload
    >({
      query: (params) => ({
        url: `/fingerprint-enrollments`,
        method: "GET",
        params,
      }),

      providesTags: ["Fingerprint"],
    }),

    // ==============================
    // GET SINGLE BY ID
    // GET /fingerprint-enrollments/:id
    // ==============================

    getFingerprintEnrollmentById: builder.query<
      FingerprintEnrollmentResponse,
      GetFingerprintEnrollmentByIdPayload
    >({
      query: ({ id }) => ({
        url: `/fingerprint-enrollments/${id}`,
        method: "GET",
      }),

      providesTags: ["Fingerprint"],
    }),

    // ==============================
    // UPDATE FINGERPRINT ENROLLMENT
    // PUT /fingerprint-enrollments/:id
    // ==============================

    updateFingerprintEnrollment: builder.mutation<
      FingerprintEnrollmentResponse,
      UpdateFingerprintEnrollmentPayload
    >({
      query: ({ id, ...body }) => ({
        url: `/fingerprint-enrollments/${id}`,
        method: "PUT",
        body,
      }),

      invalidatesTags: ["Fingerprint", "Role"],
    }),

    // ==============================
    // DEACTIVATE FINGERPRINT ENROLLMENT
    // PUT /fingerprint-enrollments/:id/deactivate
    // ==============================

    deactivateFingerprintEnrollment: builder.mutation<
      FingerprintEnrollmentResponse,
      DeactivateFingerprintEnrollmentPayload
    >({
      query: ({ id }) => ({
        url: `/fingerprint-enrollments/${id}/deactivate`,
        method: "PUT",
      }),

      invalidatesTags: ["Fingerprint", "Role"],
    }),

    // ==============================
    // ACTIVATE FINGERPRINT ENROLLMENT
    // PUT /fingerprint-enrollments/:id/activate
    // ==============================

    activateFingerprintEnrollment: builder.mutation<
      FingerprintEnrollmentResponse,
      ActivateFingerprintEnrollmentPayload
    >({
      query: ({ id }) => ({
        url: `/fingerprint-enrollments/${id}/activate`,
        method: "PUT",
      }),

      invalidatesTags: ["Fingerprint", "Role"],
    }),
  }),
});

// ==============================
// EXPORT HOOKS
// ==============================

export const {
  useCreateFingerprintEnrollmentMutation,
  useGetAllFingerprintEnrollmentsQuery,
  useGetFingerprintEnrollmentByIdQuery,
  useUpdateFingerprintEnrollmentMutation,
  useDeactivateFingerprintEnrollmentMutation,
  useActivateFingerprintEnrollmentMutation,
} = fingerprintApi;