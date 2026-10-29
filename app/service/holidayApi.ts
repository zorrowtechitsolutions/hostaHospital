// src/redux/api/holiday.api.ts
import { api } from "./api";
import { getAuthUser } from "../../src/utils/auth";

// ==============================
// TYPES
// ==============================

export interface Holiday {
  id?: string | number;
  _id?: string;
  hospitalId: string | number;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  repeatsAnnually?: boolean;
  isActive?: boolean;
  type?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface GetHolidaysParams {
  hospitalId?: string | number;
  isActive?: boolean | string;
  search?: string;
  page?: number;
  limit?: number;
  skipHospitalFilter?: boolean;
}

export interface HolidayResponse {
  success?: boolean;
  message?: string;
  status?: string;
  data?: Holiday | Holiday[];
  error?: string;
}

export interface CreateHolidayPayload {
  hospitalId?: string | number;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  repeatsAnnually?: boolean;
  isActive?: boolean;
  type?: string;
}

export interface UpdateHolidayPayload {
  id: string | number;
  data: Partial<Holiday>;
}

// ==============================
// HELPER — same as Ambulance
// ==============================

const getHospitalIdFromAuth = (auth: any): number | null => {
  if (!auth) return null;

  if (auth.hospitalId) {
    return Number(auth.hospitalId);
  }

  return null;
};

// ==============================
// HOLIDAY API
// ==============================

export const holidayApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // ==============================
    // GET ALL HOLIDAYS
    // GET /holidays
    // ==============================

    getHolidays: builder.query<
      HolidayResponse,
      GetHolidaysParams
    >({
      query: (params: GetHolidaysParams = {}) => {
        const auth = getAuthUser();
        const queryParams = new URLSearchParams();

        const isSuperAdmin = auth?.role === "super-admin";
        const shouldSkipFilter = params.skipHospitalFilter === true;

        let hospitalIdToUse: number | null = null;

        if (!isSuperAdmin && !shouldSkipFilter) {
          hospitalIdToUse = getHospitalIdFromAuth(auth);

          if (!hospitalIdToUse && params.hospitalId) {
            hospitalIdToUse = Number(params.hospitalId);
          }

          if (hospitalIdToUse) {
            queryParams.append("hospitalId", String(hospitalIdToUse));
          }
        } else if (isSuperAdmin && params.hospitalId) {
          queryParams.append("hospitalId", String(params.hospitalId));
        } else if (params.hospitalId) {
          queryParams.append("hospitalId", String(params.hospitalId));
        }

        if (params.isActive !== undefined && params.isActive !== "") {
          queryParams.append("isActive", String(params.isActive));
        }

        if (params.search?.trim()) {
          queryParams.append("search", params.search.trim());
        }

        if (params.page) {
          queryParams.append("page", String(params.page));
        }

        if (params.limit) {
          queryParams.append("limit", String(params.limit));
        }

        const queryString = queryParams.toString();

        return `/holidays${queryString ? `?${queryString}` : ""}`;
      },

      providesTags: ["Holiday"],
    }),

    // ==============================
    // CREATE HOLIDAY
    // POST /holidays
    // ==============================

    createHoliday: builder.mutation<
      HolidayResponse,
      CreateHolidayPayload
    >({
      query: (data) => {
        const auth = getAuthUser();
        const isSuperAdmin = auth?.role === "super-admin";

        let hospitalId: number | undefined = data.hospitalId
          ? Number(data.hospitalId)
          : undefined;

        if (!hospitalId && !isSuperAdmin) {
          const authHospitalId = getHospitalIdFromAuth(auth);

          if (authHospitalId) {
            hospitalId = authHospitalId;
          }
        }


        return {
          url: "/holidays",
          method: "POST",
          body: {
            name: data.name,
            description: data.description,
            startDate: data.startDate,
            endDate: data.endDate,
            repeatsAnnually: data.repeatsAnnually,
            isActive: data.isActive,
            type: data.type,
            hospitalId: hospitalId,
          },
        };
      },

      invalidatesTags: ["Holiday"],
    }),

    // ==============================
    // GET HOLIDAY BY ID
    // GET /holidays/:id
    // ==============================

    getHolidayById: builder.query<
      HolidayResponse,
      string | number
    >({
      query: (id) => `/holidays/${id}`,

      providesTags: (_result, _error, id) => [
        { type: "Holiday", id },
      ],
    }),

    // ==============================
    // UPDATE HOLIDAY
    // PUT /holidays/:id
    // ==============================

    updateHoliday: builder.mutation<
      HolidayResponse,
      UpdateHolidayPayload
    >({
      query: ({ id, data }) => {
        const auth = getAuthUser();
        const isSuperAdmin = auth?.role === "super-admin";

        let hospitalId: number | undefined = data.hospitalId
          ? Number(data.hospitalId)
          : undefined;

        if (!hospitalId && !isSuperAdmin) {
          const authHospitalId = getHospitalIdFromAuth(auth);

          if (authHospitalId) {
            hospitalId = authHospitalId;
          }
        }


        return {
          url: `/holidays/${id}`,
          method: "PUT",
          body: {
            name: data.name,
            description: data.description,
            startDate: data.startDate,
            endDate: data.endDate,
            repeatsAnnually: data.repeatsAnnually,
            isActive: data.isActive,
            type: data.type,
            hospitalId: hospitalId,
          },
        };
      },

      invalidatesTags: (_result, _error, { id }) => [
        "Holiday",
        { type: "Holiday", id },
      ],
    }),

    // ==============================
    // DELETE HOLIDAY
    // DELETE /holidays/:id
    // ==============================

    deleteHoliday: builder.mutation<
      HolidayResponse,
      string | number
    >({
      query: (id) => ({
        url: `/holidays/${id}`,
        method: "DELETE",
      }),

      invalidatesTags: (_result, _error, id) => [
        "Holiday",
        { type: "Holiday", id },
      ],
    }),
  }),
});

// ==============================
// EXPORT HOOKS
// ==============================

export const {
  useGetHolidaysQuery,
  useCreateHolidayMutation,
  useGetHolidayByIdQuery,
  useUpdateHolidayMutation,
  useDeleteHolidayMutation,
} = holidayApi;