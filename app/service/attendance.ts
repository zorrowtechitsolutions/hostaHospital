// app/service/attendance.ts

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
  data?: Attendance[];
  error?: string;
}

// ==============================
// HELPER: Get hospital ID from auth
// ==============================

const getHospitalIdFromAuth = (auth: any): string | number | null => {
  if (!auth) return null;

  // Priority 1: Use hospitalId if available (this is the correct hospital ID)
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
    // GET ALL ATTENDANCES - Server-side filtering
    // ==============================

    getAttendances: builder.query<AttendanceResponse, GetAttendancesParams>({
      query: (params: GetAttendancesParams = {}) => {
        const auth = getAuthUser();
        const queryParams = new URLSearchParams();

        // Determine if user is super admin
        const isSuperAdmin = auth?.role === "super-admin";
        const shouldSkipFilter = params.skipHospitalFilter === true;

        // Get hospital ID using helper
        let hospitalIdToUse = null;

        // For non-super-admin users, always filter by hospital if they have one
        if (!isSuperAdmin && !shouldSkipFilter) {
          hospitalIdToUse = getHospitalIdFromAuth(auth);

          // If no hospitalId found, try params
          if (!hospitalIdToUse) {
            hospitalIdToUse = params.hospitalId;
          }

          if (hospitalIdToUse) {
            queryParams.append("hospitalId", String(hospitalIdToUse));
          } else {
            console.warn("⚠️ No hospital ID found for filtering attendances");
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

        // Employee ID filter (backend also accepts roleId)
        if (params.employeeId) {
          queryParams.append("employeeId", String(params.employeeId));
        }

        // Role ID filter (backend also accepts employeeId)
        if (params.roleId) {
          queryParams.append("roleId", String(params.roleId));
        }

        // Employee type filter
        if (params.employeeType) {
          queryParams.append("employeeType", params.employeeType);
        }

        // ✅ Search filter (name / employeeType)
        if (params.search?.trim()) {
          queryParams.append("search", params.search.trim());
        }

        // ✅ Today filter (IST day range)
        if (params.today === true) {
          queryParams.append("today", "true");
        }

        // ✅ Date filter (specific day)
        if (params.date) {
          queryParams.append("date", params.date);
        }

        // Status filter
        if (params.status) {
          queryParams.append("status", params.status);
        }

        // Type filter (check-in / check-out)
        if (params.type) {
          queryParams.append("type", params.type);
        }

        // Department filter
        if (params.department) {
          queryParams.append("department", params.department);
        }

        // Pagination parameters (optional, backend currently returns all)
        if (params.page) {
          queryParams.append("page", String(params.page));
        }
        if (params.limit) {
          queryParams.append("limit", String(params.limit));
        }

        const url = `/attendances?${queryParams.toString()}`;
        return url;
      },

      providesTags: ["Attendance"],
    }),
  }),
});

// ==============================
// EXPORT HOOKS
// ==============================

export const { useGetAttendancesQuery } = attendanceApi;