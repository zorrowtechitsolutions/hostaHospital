import { api } from "./api";
import { getAuthUser } from "../../src/utils/auth";

// ==============================
// TYPES
// ==============================

export interface Attendance {
  id?: string;
  _id?: string;
  hospitalId: string | number;
  employeeId: string | number;
  employeeType?: string;
  roleId?: string | number;
  name?: string;
  type: string; // "check-in" | "check-out"
  attendanceType?: string;
  date?: string;
  checkInTime?: string;
  checkOutTime?: string;
  timestamp: string;
  latitude?: number;
  longitude?: number;
  selfie_url?: string | null;
  status?: string;
  method?: string;
  roles?: any;
  department?: string;
  duration?: string;
  deviceId?: string;
  cardNumber?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface GetAttendancesParams {
  hospitalId?: string | number;
  employeeId?: string | number;
  roleId?: string | number;
  employeeType?: string;
  status?: string;
  type?: string;
  department?: string;
  search?: string;
  today?: boolean;
  date?: string;
  page?: number;
  limit?: number;
  skipHospitalFilter?: boolean;
}

export interface AttendanceResponse {
  success?: boolean;
  message?: string;
  status?: string;
  data?: Attendance | Attendance[];
  error?: string;
}

export interface CreateAttendancePayload {
  hospitalId?: string | number;
  employeeId: string | number;
  employeeType?: string;
  roleId?: string | number;
  type: "check-in" | "check-out";
  latitude?: number;
  longitude?: number;
  image?: string;
  selfie_url?: string | null;
  method?: string;
  roles?: any;
  department?: string;
  location?: {
    lat?: number;
    lng?: number;
  };
  cardNumber?: string;
}

export interface CreateManualAttendancePayload {
  hospitalId?: string | number;
  employeeId: string | number;
  employeeType?: string;
  date?: string;
  checkInTime?: string;
  checkOutTime?: string;
  status?: string;
  method?: string;
  notes?: string;
  department?: string;
}

export interface UpdateAttendancePayload {
  id: string | number;
  data: Partial<Attendance>;
}

export interface DailyStatusResponse {
  success?: boolean;
  hasCheckedIn?: boolean;
  hasCheckedOut?: boolean;
  message?: string;
}

export interface RfidAttendancePayload {
  accessCardUid: string;
  type: "check-in" | "check-out";
  latitude?: number;
  longitude?: number;
}

export interface FingerprintAttendancePayload {
  fingerprintTemplate?: string;
  fingerprintHash?: string;
  templateReference?: string;
  type: "check-in" | "check-out";
}

// ==============================
// HELPER
// ==============================

const getHospitalIdFromAuth = (auth: any): string | number | null => {
  if (!auth) return null;

  if (auth.hospitalId) {
    return auth.hospitalId;
  }

  return null;
};

// ==============================
// ATTENDANCE API
// ==============================

export const attendanceApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // ==============================
    // GET ALL ATTENDANCES
    // GET /attendances
    // ==============================

    getAttendances: builder.query<
      AttendanceResponse,
      GetAttendancesParams
    >({
      query: (params: GetAttendancesParams = {}) => {
        const auth = getAuthUser();
        const queryParams = new URLSearchParams();

        const isSuperAdmin = auth?.role === "super-admin";
        const shouldSkipFilter = params.skipHospitalFilter === true;

        let hospitalIdToUse = null;

        if (!isSuperAdmin && !shouldSkipFilter) {
          hospitalIdToUse = getHospitalIdFromAuth(auth);

          if (!hospitalIdToUse) {
            hospitalIdToUse = params.hospitalId;
          }

          if (hospitalIdToUse) {
            queryParams.append(
              "hospitalId",
              String(hospitalIdToUse)
            );
          }
        } else if (isSuperAdmin && params.hospitalId) {
          queryParams.append(
            "hospitalId",
            String(params.hospitalId)
          );
        } else if (params.hospitalId) {
          queryParams.append(
            "hospitalId",
            String(params.hospitalId)
          );
        }

        if (params.employeeId) {
          queryParams.append(
            "employeeId",
            String(params.employeeId)
          );
        }

        if (params.roleId) {
          queryParams.append(
            "roleId",
            String(params.roleId)
          );
        }

        if (params.employeeType) {
          queryParams.append(
            "employeeType",
            params.employeeType
          );
        }

        if (params.search?.trim()) {
          queryParams.append(
            "search",
            params.search.trim()
          );
        }

        if (params.today === true) {
          queryParams.append("today", "true");
        }

        if (params.date) {
          queryParams.append("date", params.date);
        }

        if (params.status) {
          queryParams.append("status", params.status);
        }

        if (params.type) {
          queryParams.append("type", params.type);
        }

        if (params.department) {
          queryParams.append(
            "department",
            params.department
          );
        }

        if (params.page) {
          queryParams.append(
            "page",
            String(params.page)
          );
        }

        if (params.limit) {
          queryParams.append(
            "limit",
            String(params.limit)
          );
        }

        const queryString = queryParams.toString();

        return `/attendances${queryString ? `?${queryString}` : ""}`;
      },

      providesTags: ["Attendance"],
    }),

    // ==============================
    // CREATE ATTENDANCE
    // POST /attendances
    // ==============================

    createAttendance: builder.mutation<
      AttendanceResponse,
      CreateAttendancePayload
    >({
      query: (body) => ({
        url: "/attendances",
        method: "POST",
        body,
      }),

      invalidatesTags: ["Attendance"],
    }),

    // ==============================
    // CREATE MANUAL ATTENDANCE
    // POST /attendances/manual
    // ==============================

    createManualAttendance: builder.mutation<
      AttendanceResponse,
      CreateManualAttendancePayload
    >({
      query: (body) => {
        const auth = getAuthUser();
        const hospitalId =
          body.hospitalId ?? getHospitalIdFromAuth(auth);

        if (!hospitalId) {
          throw new Error(
            "hospitalId is missing. Please log in again or contact support."
          );
        }

        return {
          url: "/attendances/manual",
          method: "POST",
          body: {
            ...body,
            hospitalId: Number(hospitalId),
            employeeId: Number(body.employeeId),
          },
        };
      },

      invalidatesTags: ["Attendance"],
    }),

    // ==============================
    // GET DAILY STATUS
    // GET /attendances/daily-status
    // ==============================

    getDailyStatus: builder.query<
      DailyStatusResponse,
      {
        employeeId?: string | number;
        roleId?: string | number;
      }
    >({
      query: ({ employeeId, roleId }) => {
        const params = new URLSearchParams();

        if (employeeId) {
          params.append(
            "employeeId",
            String(employeeId)
          );
        }

        if (roleId) {
          params.append(
            "roleId",
            String(roleId)
          );
        }

        const queryString = params.toString();

        return `/attendances/daily-status${
          queryString ? `?${queryString}` : ""
        }`;
      },

      providesTags: ["Attendance"],
    }),

    // ==============================
    // GET ATTENDANCE BY ID
    // GET /attendances/:id
    // ==============================

    getAttendanceById: builder.query<
      AttendanceResponse,
      string | number
    >({
      query: (id) => `/attendances/${id}`,

      providesTags: (_result, _error, id) => [
        { type: "Attendance", id },
      ],
    }),

    // ==============================
    // UPDATE ATTENDANCE
    // PUT /attendances/:id
    // ==============================

    updateAttendance: builder.mutation<
      AttendanceResponse,
      UpdateAttendancePayload
    >({
      query: ({ id, data }) => ({
        url: `/attendances/${id}`,
        method: "PUT",
        body: data,
      }),

      invalidatesTags: (_result, _error, { id }) => [
        "Attendance",
        { type: "Attendance", id },
      ],
    }),

    // ==============================
    // DELETE ATTENDANCE
    // DELETE /attendances/:id
    // ==============================

    deleteAttendance: builder.mutation<
      AttendanceResponse,
      string | number
    >({
      query: (id) => ({
        url: `/attendances/${id}`,
        method: "DELETE",
      }),

      invalidatesTags: (_result, _error, id) => [
        "Attendance",
        { type: "Attendance", id },
      ],
    }),

    // ==============================
    // RFID ATTENDANCE
    // POST /attendances/rfid
    // ==============================

    createRfidAttendance: builder.mutation<
      AttendanceResponse,
      RfidAttendancePayload
    >({
      query: (body) => ({
        url: "/attendances/rfid",
        method: "POST",
        body,
      }),

      invalidatesTags: ["Attendance"],
    }),

    // ==============================
    // FINGERPRINT ATTENDANCE
    // POST /attendances/fingerprint
    // ==============================

    createFingerprintAttendance: builder.mutation<
      AttendanceResponse,
      FingerprintAttendancePayload
    >({
      query: (body) => ({
        url: "/attendances/fingerprint",
        method: "POST",
        body,
      }),

      invalidatesTags: ["Attendance"],
    }),
  }),
});

// ==============================
// EXPORT HOOKS
// ==============================

export const {
  useGetAttendancesQuery,
  useCreateAttendanceMutation,
  useCreateManualAttendanceMutation,
  useGetDailyStatusQuery,
  useGetAttendanceByIdQuery,
  useUpdateAttendanceMutation,
  useDeleteAttendanceMutation,
  useCreateRfidAttendanceMutation,
  useCreateFingerprintAttendanceMutation,
} = attendanceApi;