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

// UPDATED GetDoctorsParams interface
export interface GetDoctorsParams {
  hospitalId?: string | number;
  name?: string;
  speciality?: string;
  status?: string | number | boolean;
  search_query?: string;
  page?: number;
  limit?: number;
  skipHospitalFilter?: boolean; // ADD THIS - Allows Super Admin to bypass hospital filter
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

    // ==============================
    // GET DOCTORS
    // FIXED: Only auto-inject hospitalId for hospital users, not Super Admin
    // ==============================
    getDoctors: builder.query({
      query: (params: GetDoctorsParams = {}) => {
        const auth = getAuthUser();
        const queryParams = new URLSearchParams();

        // DEBUG: Log auth info
        console.log('===== GET DOCTORS QUERY =====');
        console.log('Auth user:', auth);
        console.log('Auth role:', auth?.role);
        console.log('Auth roleId:', auth?.roleId);
        console.log('Params received:', params);

        // FIX: Only auto-inject hospitalId for Hospital users (not Super Admin)
        // Check if user has hospital role (roleId === 2 or role === 'hospital')
        const isHospitalAdmin = auth?.role === 'hospital' || auth?.roleId === 2;
        const shouldSkipFilter = params.skipHospitalFilter === true;
        
        console.log('Is Hospital Admin:', isHospitalAdmin);
        console.log('Should skip filter:', shouldSkipFilter);
        
        // Only add hospitalId automatically if:
        // 1. User is a hospital admin (not Super Admin)
        // 2. No hospitalId was explicitly passed in params
        // 3. skipHospitalFilter is not true
        if (isHospitalAdmin && auth?.id && !params.hospitalId && !shouldSkipFilter) {
          queryParams.append("hospitalId", String(auth.id));
          console.log(`Auto-added hospitalId: ${auth.id} (hospital admin)`);
        } else if (params.hospitalId) {
          queryParams.set("hospitalId", String(params.hospitalId));
          console.log(`Using explicit hospitalId: ${params.hospitalId}`);
        } else if (shouldSkipFilter) {
          console.log('Skipping hospital filter (Super Admin mode)');
        } else {
          console.log('No hospital filter applied');
        }

        // filters (all supported by backend)
        if (params.name) {
          queryParams.append("name", params.name);
        }

        if (params.speciality) {
          queryParams.append("speciality", params.speciality);
          console.log(`Filtering by speciality: ${params.speciality}`);
        }

        if (params.status !== undefined) {
          queryParams.append("status", String(params.status));
        }

        if (params.search_query) {
          queryParams.append("search_query", params.search_query);
        }

        // pagination
        queryParams.append("page", String(params.page || 1));
        queryParams.append("limit", String(params.limit || 10));

        const finalUrl = `/doctor?${queryParams.toString()}`;
        console.log('Final URL:', finalUrl);
        console.log('================================');
        
        return finalUrl;
      },
      providesTags: ["Doctor"],
    }),

    // ==============================
    // GET SPECIALITIES
    // ==============================
    getSpecialities: builder.query<SpecialityResponse, void>({
      query: () => {
        const queryParams = new URLSearchParams();
        return `/speciality?${queryParams.toString()}`;
      },
      providesTags: ["speciality"],
    }),

    // ==============================
    // GET DOCTOR BY ID
    // ==============================
    getDoctorById: builder.query<DoctorAuthResponse, string>({
      query: (id) => `/doctor/${id}`,
      providesTags: (result, error, id) => [{ type: "Doctor", id }],
    }),

    // ==============================
    // LOGIN DOCTOR
    // ==============================
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

    // ==============================
    // LOGOUT DOCTOR
    // ==============================
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
          console.error("Logout error:", error);
        }
      },
    }),

    // ==============================
    // ADD NEW DOCTOR
    // ==============================
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

    // ==============================
    // UPDATE DOCTOR
    // ==============================
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

    // ==============================
    // DELETE DOCTOR
    // ==============================
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
  }),

  overrideExisting: false,
});

// ==============================
// EXPORT HOOKS
// ==============================

export const {
  useGetDoctorsQuery,
  useGetDoctorByIdQuery,
  useLoginDoctorMutation,
  useLogoutDoctorMutation,
  useAddNewDoctorMutation,
  useUpdateDoctorMutation,
  useDeleteDoctorMutation,
  useGetSpecialitiesQuery, 
} = doctorApi;