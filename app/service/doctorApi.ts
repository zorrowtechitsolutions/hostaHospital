// src/app/service/doctorApi.ts
import { api } from "./api";
import { getAuthUser } from "../../src/utils/auth";

// ==============================
// TYPES
// ==============================

export interface Doctor {
  id?: string;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  speciality?: string;
  qualification?: string;
  experience?: number;
  gender?: string;
  image?: string;
  about?: string;
  hospitalId?: string;
  hospitalName?: string;
  createdAt?: string;
  updatedAt?: string;
  appointmentCount?: number;
  autoDecline?: number;
  status?: string | boolean;
}

export interface LoginDoctorData {
  email: string;
  password: string;
  fcmToken?: string;
}

export interface DoctorAuthResponse {
  success?: boolean;
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  doctor?: Doctor;
  data?: Doctor;
  message?: string;
  error?: string;
}

export interface GetDoctorsParams {
  hospitalId?: string | number;
  name?: string;
  speciality?: string;
  status?: string | number | boolean;
  search_query?: string;
  page?: number;
  limit?: number;
  skipHospitalFilter?: boolean;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  hospitalId?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface SpecialityResponse {
  success?: boolean;
  message?: string;
  data?: {
    count: number;
    rows: Department[];
  };
}

export const doctorApi = api.injectEndpoints({
  endpoints: (builder) => ({

    getDoctors: builder.query({
      query: (params: GetDoctorsParams = {}) => {
        const auth = getAuthUser();
        const queryParams = new URLSearchParams();

        const isHospitalAdmin = auth?.role === 'hospital' || auth?.roleId === 2;
        const shouldSkipFilter = params.skipHospitalFilter === true;
        
        if (isHospitalAdmin && auth?.id && !params.hospitalId && !shouldSkipFilter) {
          queryParams.append("hospitalId", String(auth.id));
        } else if (params.hospitalId) {
          queryParams.append("hospitalId", String(params.hospitalId));
        }

        if (params.name) {
          queryParams.append("name", params.name);
        }

        if (params.speciality) {
          queryParams.append("speciality", params.speciality);
        }

        if (params.status !== undefined) {
          queryParams.append("status", String(params.status));
        }

        if (params.search_query) {
          queryParams.append("search_query", params.search_query);
        }

        queryParams.append("page", String(params.page || 1));
        queryParams.append("limit", String(params.limit || 10));

        return `/doctor?${queryParams.toString()}`;
      },
      providesTags: ["Doctor"],
    }),

    getSpecialities: builder.query<SpecialityResponse, void>({
      query: () => {
        const queryParams = new URLSearchParams();
        return `/speciality?${queryParams.toString()}`;
      },
      providesTags: ["speciality"],
    }),

    getDoctorById: builder.query<DoctorAuthResponse, string>({
      query: (id) => `/doctor/${id}`,
      providesTags: (result, error, id) => [{ type: "Doctor", id }],
    }),

    loginDoctor: builder.mutation<DoctorAuthResponse, LoginDoctorData>({
      query: (logUser) => ({
        url: "/doctor/login",
        method: "POST",
        body: logUser,
      }),

      transformResponse: (response: DoctorAuthResponse) => {
        const token = response.token || response.accessToken;

        if (token) {
          localStorage.setItem("accessToken", token);
        }

        if (response.refreshToken) {
          localStorage.setItem("refreshToken", response.refreshToken);
        }

        return response;
      },

      invalidatesTags: ["Doctor"],
    }),

    logoutDoctor: builder.mutation<{ message: string }, { hospitalId: string }>({
      query: ({ hospitalId }) => ({
        url: `/doctor/logout/${hospitalId}`,
        method: "PUT",
      }),

      onQueryStarted: async (_arg, { queryFulfilled }) => {
        try {
          await queryFulfilled;
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
        } catch (error) {
          // Error handled silently
        }
      },
    }),

    refreshDoctor: builder.mutation<DoctorAuthResponse, void>({
      query: () => ({
        url: "/doctor/refresh",
        method: "POST",
      }),

      transformResponse: (response: DoctorAuthResponse) => {
        const token = response.token || response.accessToken;

        if (token) {
          localStorage.setItem("accessToken", token);
        }

        if (response.refreshToken) {
          localStorage.setItem("refreshToken", response.refreshToken);
        }

        return response;
      },

      invalidatesTags: ["Doctor"],
    }),

    addNewDoctor: builder.mutation<DoctorAuthResponse, Omit<Doctor, 'hospitalId'>>({
      query: (newDoctor) => {
        const auth = getAuthUser();
        
        return {
          url: "/doctor",
          method: "POST",
          body: {
            ...newDoctor,
            hospitalId: auth?.id,
            hospitalName: auth?.name ?? "",
          },
        };
      },
      invalidatesTags: ["Doctor"],
    }),

    updateDoctor: builder.mutation<Doctor, { id: string; updateDoctor: Partial<Doctor> }>({
      query: ({ id, updateDoctor }) => ({
        url: `/doctor/${id}`,
        method: "PUT",
        body: updateDoctor,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Doctor", id },
        "Doctor",
      ],
    }),

    deleteDoctor: builder.mutation<{ message: string }, string>({
      query: (doctorId) => ({
        url: `/doctor/${doctorId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, doctorId) => [
        { type: "Doctor", doctorId },
        "Doctor",
      ],
    }),

    recoverDoctor: builder.mutation<{ message: string }, string>({
      query: (doctorId) => ({
        url: `/doctor/recover/${doctorId}`,
        method: "PUT",
      }),
      invalidatesTags: (result, error, doctorId) => [
        { type: "Doctor", doctorId },
        "Doctor",
      ],
    }),
  }),

  overrideExisting: false,
});

export const {
  useGetDoctorsQuery,
  useGetDoctorByIdQuery,
  useLoginDoctorMutation,
  useLogoutDoctorMutation,
  useRefreshDoctorMutation,
  useAddNewDoctorMutation,
  useUpdateDoctorMutation,
  useDeleteDoctorMutation,
  useRecoverDoctorMutation,
  useGetSpecialitiesQuery,
} = doctorApi;