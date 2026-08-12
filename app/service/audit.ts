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

// Helper: Get hospital ID from auth (returns number)
const getHospitalIdFromAuth = (auth: any): number | null => {
  if (!auth) return null;
  
  // Priority 1: Use hospitalId if available
  if (auth.hospitalId) {
    return Number(auth.hospitalId);
  }
  
  return null;
};

// Helper: Convert string | number to number safely
const toNumber = (value: string | number | undefined): number | undefined => {
  if (value === undefined || value === null) return undefined;
  return Number(value);
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
        
        // Get hospital ID - Priority: params > auth
        let hospitalId = params.hospitalId;
        
        if (!hospitalId) {
          const authHospitalId = getHospitalIdFromAuth(auth);
          if (authHospitalId) {
            hospitalId = authHospitalId;
          }
        }

        // If no hospitalId found, throw error or return empty
        if (!hospitalId) {
          console.error("❌ No hospital ID found for session history");
          return { url: '/auth/audit-logs/invalid', method: 'GET' };
        }

        // Search filter
        if (params.search?.trim()) {
          queryParams.append("search", params.search.trim());
        }

        // Role filter
        if (params.role) {
          queryParams.append("role", params.role);
        }

        // Status filter
        if (params.status) {
          queryParams.append("status", params.status);
        }

        // Risk level filter
        if (params.riskLevel) {
          queryParams.append("riskLevel", params.riskLevel);
        }

        // Department filter
        if (params.department) {
          queryParams.append("department", params.department);
        }

        // Date filters
        if (params.startDate) {
          queryParams.append("startDate", params.startDate);
        }

        if (params.endDate) {
          queryParams.append("endDate", params.endDate);
        }

        // Pagination parameters
        if (params.page !== undefined) {
          queryParams.append("page", String(params.page));
        }

        if (params.limit !== undefined) {
          queryParams.append("limit", String(params.limit));
        }

        const queryString = queryParams.toString();
        const url = `/auth/audit-logs/${hospitalId}${queryString ? `?${queryString}` : ""}`;
        
        console.log("📡 Fetching session history:", url);
        return url;
      },

      providesTags: (result) => {
        if (result?.data) {
          return [
            { type: "SessionHistory", id: "LIST" },
            ...result.data.map((session) => ({ 
              type: "SessionHistory" as const, 
              id: session.id 
            })),
          ];
        }
        return [{ type: "SessionHistory", id: "LIST" }];
      },
    }),
  }),
});

export const {
  useGetSessionHistoryQuery,
} = sessionHistoryApi;