// app/service/sessionHistory.ts - Session History API service

import { api } from "./api";
import { getAuthUser } from "../../src/utils/auth";

// ================= TYPES =================

export interface SessionData {
  id: number;
  authId: number;
  name: string;
  role: string;
  department: string;
  hospitalId: number;
  browser: string | null;
  browserVersion: string | null;
  operatingSystem: string | null;
  osVersion: string | null;
  deviceType: string;
  userAgent: string;
  ipAddress: string;
  registeredAddress: string;
  loginTime: string;
  lastActivity: string;
  status: string;
  riskLevel: string;
  sessionDuration: string | null;
  loginMethod: string;
  createdAt: string;
  updatedAt: string;
}

export interface SessionHistoryResponse {
  success: boolean;
  count: number;
  totalPages: number;
  currentPage: number;
  data: SessionData[];
}

export interface GetSessionHistoryParams {
  hospitalId?: string | number;
  role?: string;
  status?: string;
  riskLevel?: string;
  department?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// ================= HELPER FUNCTIONS =================

const getHospitalIdFromAuth = (auth: any): number | null => {
  if (!auth) return null;

  if (auth.hospitalId) {
    return Number(auth.hospitalId);
  }

  return null;
};

const getUserRole = (auth: any): string => {
  return String(
    auth?.role ||
    auth?.userType ||
    ""
  ).toLowerCase();
};

const isSuperAdmin = (auth: any): boolean => {
  const role = getUserRole(auth);

  return [
    "superadmin",
    "super_admin",
    "super admin",
  ].includes(role);
};

const isHospitalAdmin = (auth: any): boolean => {
  const role = getUserRole(auth);

  return [
    "hospital",
    "admin",
    "hospital_admin",
    "hospitaladmin",
    "hospital admin",
  ].includes(role);
};

// ================= API =================

export const sessionHistoryApi = api.injectEndpoints({
  endpoints: (builder) => ({

    // ================= GET SESSION HISTORY =================

    getSessionHistory: builder.query<
      SessionHistoryResponse,
      GetSessionHistoryParams | void
    >({
      query: (params: GetSessionHistoryParams = {}) => {

        const queryParams = new URLSearchParams();

        const auth = getAuthUser();

        // =====================================================
        // 1. GET HOSPITAL ID
        // Priority:
        // params.hospitalId → auth.hospitalId
        // =====================================================

        let hospitalId = params.hospitalId;

        if (!hospitalId) {
          const authHospitalId = getHospitalIdFromAuth(auth);

          if (authHospitalId) {
            hospitalId = authHospitalId;
          }
        }

        // =====================================================
        // 2. VALIDATE HOSPITAL ID
        // =====================================================

        if (!hospitalId) {
          console.error(
            "❌ No hospital ID found for session history"
          );

          return {
            url: "/auth/audit-logs/invalid",
            method: "GET",
          };
        }

        const normalizedHospitalId = Number(hospitalId);

        if (
          !Number.isFinite(normalizedHospitalId) ||
          normalizedHospitalId <= 0
        ) {
          console.error(
            "❌ Invalid hospital ID:",
            hospitalId
          );

          return {
            url: "/auth/audit-logs/invalid",
            method: "GET",
          };
        }

        // =====================================================
        // 3. COMMON FILTERS
        // =====================================================

        // Search
        if (params.search?.trim()) {
          queryParams.append(
            "search",
            params.search.trim()
          );
        }

        // Role
        if (params.role) {
          queryParams.append(
            "role",
            params.role
          );
        }

        // Status
        if (params.status) {
          queryParams.append(
            "status",
            params.status
          );
        }

        // Risk Level
        if (params.riskLevel) {
          queryParams.append(
            "riskLevel",
            params.riskLevel
          );
        }

        // Department
        if (params.department) {
          queryParams.append(
            "department",
            params.department
          );
        }

        // Start Date
        if (params.startDate) {
          queryParams.append(
            "startDate",
            params.startDate
          );
        }

        // End Date
        if (params.endDate) {
          queryParams.append(
            "endDate",
            params.endDate
          );
        }

        // Pagination
        if (params.page !== undefined) {
          queryParams.append(
            "page",
            String(params.page)
          );
        }

        if (params.limit !== undefined) {
          queryParams.append(
            "limit",
            String(params.limit)
          );
        }

        // =====================================================
        // 4. BUILD URL BASED ON USER TYPE
        // =====================================================

        let url: string;

        if (isSuperAdmin(auth)) {

          // -------------------------------------------------
          // SUPER ADMIN
          //
          // Backend expects:
          // /auth/audit-logs/0?hospitalId=59
          // -------------------------------------------------

          queryParams.set(
            "hospitalId",
            String(normalizedHospitalId)
          );

          url =
            `/auth/audit-logs/0?${queryParams.toString()}`;

          console.log(
            "🔵 SUPER ADMIN Session History API:",
            url
          );

        } else if (isHospitalAdmin(auth)) {

          // -------------------------------------------------
          // HOSPITAL ADMIN
          //
          // Backend expects:
          // /auth/audit-logs/59
          // -------------------------------------------------

          const queryString =
            queryParams.toString();

          url =
            `/auth/audit-logs/${normalizedHospitalId}` +
            `${queryString ? `?${queryString}` : ""}`;

          console.log(
            "🟢 HOSPITAL ADMIN Session History API:",
            url
          );

        } else {

          // -------------------------------------------------
          // FALLBACK
          // -------------------------------------------------

          console.warn(
            "⚠️ Unknown user role for Session History:",
            getUserRole(auth)
          );

          const queryString =
            queryParams.toString();

          url =
            `/auth/audit-logs/${normalizedHospitalId}` +
            `${queryString ? `?${queryString}` : ""}`;
        }

        return {
          url,
          method: "GET",
        };
      },

      providesTags: (result) => {
        if (result?.data) {
          return [
            {
              type: "SessionHistory",
              id: "LIST",
            },

            ...result.data.map((session) => ({
              type: "SessionHistory" as const,
              id: session.id,
            })),
          ];
        }

        return [
          {
            type: "SessionHistory",
            id: "LIST",
          },
        ];
      },
    }),
  }),
});

export const {
  useGetSessionHistoryQuery,
} = sessionHistoryApi;