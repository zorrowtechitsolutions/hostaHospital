// app/service/rfidCardAssignment.ts

import { api } from "./api";

// ============================================================
// TYPES
// ============================================================

export type RfidCardStatus = "Active" | "Inactive";

export interface RfidCardAssignment {
  id: string | number;

  hospitalId: string | number;
  employeeId: string | number;
  employeeType: string;

  employeeName: string;
  employeeCode: string;
  department?: string;

  deviceId: string;
  deviceDbId: string | number;

  cardNumber: string;

  status: RfidCardStatus;
  assignedAt?: string;

  createdAt?: string;
  updatedAt?: string;

  [key: string]: any;
}

// ============================================================
// ASSIGN RFID CARD
// POST /rfid-card-assignment
// ============================================================

export interface AssignRfidCardPayload {
  hospitalId: string | number;
  employeeId: string | number;
  employeeType: string;

  employeeName: string;
  employeeCode: string;
  department?: string;

  // Backend accepts either deviceDbId or deviceId
  deviceId?: string;
  deviceDbId?: string | number;

  cardNumber: string;
}

// ============================================================
// GET RFID CARD ASSIGNMENTS
// GET /rfid-card-assignment
// ============================================================

export interface GetRfidCardAssignmentsParams {
  hospitalId?: string | number;
  employeeId?: string | number;
  employeeType?: string;
  deviceId?: string;
  status?: RfidCardStatus;
  cardNumber?: string;
}

// ============================================================
// UPDATE RFID CARD ASSIGNMENT
// PUT /rfid-card-assignment/:id
// ============================================================

export interface UpdateRfidCardAssignmentPayload {
  id: string | number;

  body: Partial<{
    hospitalId: string | number;
    employeeId: string | number;
    employeeType: string;

    employeeName: string;
    employeeCode: string;
    department: string;

    deviceId: string;
    deviceDbId: string | number;

    cardNumber: string;
    status: RfidCardStatus;

    assignedAt: string;
  }>;
}

// ============================================================
// COMMON RESPONSES
// ============================================================

export interface RfidCardAssignmentResponse {
  success?: boolean;
  message?: string;
  data?: RfidCardAssignment;
  error?: string;
}

export interface RfidCardAssignmentsResponse {
  success?: boolean;
  message?: string;
  data?: RfidCardAssignment[];
  error?: string;
}

// ============================================================
// RFID CARD ASSIGNMENT API
// ============================================================

export const rfidCardAssignmentApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // ========================================================
    // ASSIGN RFID CARD
    // POST /rfid-card-assignment
    // ========================================================

    assignRfidCard: builder.mutation<
      RfidCardAssignmentResponse,
      AssignRfidCardPayload
    >({
      query: (body) => ({
        url: "/rfid-card-assignments",
        method: "POST",
        body: {
          ...body,
          cardNumber: body.cardNumber.trim(),
        },
      }),

      invalidatesTags: ["AccessCard"],
    }),

    // ========================================================
    // GET ALL RFID CARD ASSIGNMENTS
    // GET /rfid-card-assignment
    //
    // Query params:
    // hospitalId
    // employeeId
    // employeeType
    // deviceId
    // status
    // cardNumber
    // ========================================================

    getRfidCardAssignments: builder.query<
  RfidCardAssignmentsResponse,
  GetRfidCardAssignmentsParams
>({
  query: (params = {}) => ({
    url: "/rfid-card-assignments",
    method: "GET",
    params,
  }),

  providesTags: ["AccessCard"],
}),

    // ========================================================
    // GET RFID CARD ASSIGNMENT BY ID
    // GET /rfid-card-assignment/:id
    // ========================================================

    getRfidCardAssignmentById: builder.query<
      RfidCardAssignmentResponse,
      string | number
    >({
      query: (id) => ({
        url: `/rfid-card-assignments/${id}`,
        method: "GET",
      }),

      providesTags: ["AccessCard"],
    }),

    // ========================================================
    // UPDATE RFID CARD ASSIGNMENT
    // PUT /rfid-card-assignment/:id
    // ========================================================

    updateRfidCardAssignment: builder.mutation<
      RfidCardAssignmentResponse,
      UpdateRfidCardAssignmentPayload
    >({
      query: ({ id, body }) => ({
        url: `/rfid-card-assignments/${id}`,
        method: "PUT",
        body,
      }),

      invalidatesTags: ["AccessCard"],
    }),

    // ========================================================
    // DEACTIVATE RFID CARD ASSIGNMENT
    // PATCH /rfid-card-assignment/:id/deactivate
    // ========================================================

    deactivateRfidCardAssignment: builder.mutation<
      RfidCardAssignmentResponse,
      string | number
    >({
      query: (id) => ({
        url: `/rfid-card-assignments/${id}/deactivate`,
        method: "PUT",
      }),

      invalidatesTags: ["AccessCard"],
    }),

    // ========================================================
    // ACTIVATE RFID CARD ASSIGNMENT
    // PATCH /rfid-card-assignment/:id/activate
    // ========================================================

    activateRfidCardAssignment: builder.mutation<
      RfidCardAssignmentResponse,
      string | number
    >({
      query: (id) => ({
        url: `/rfid-card-assignments/${id}/activate`,
        method: "PUT",
      }),

      invalidatesTags: ["AccessCard"],
    }),
  }),

  overrideExisting: false,
});

// ============================================================
// EXPORT HOOKS
// ============================================================

export const {
  useAssignRfidCardMutation,
  useGetRfidCardAssignmentsQuery,
  useGetRfidCardAssignmentByIdQuery,
  useUpdateRfidCardAssignmentMutation,
  useDeactivateRfidCardAssignmentMutation,
  useActivateRfidCardAssignmentMutation,
} = rfidCardAssignmentApi;