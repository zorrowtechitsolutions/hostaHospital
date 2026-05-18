// doctorApi.ts

import { api } from "./api";

// ==============================
// TYPES
// ==============================

export interface Doctor {
  id?: string;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  specialty?: string;
  qualification?: string;
  experience?: number;
  gender?: string;
  image?: string;
  about?: string;
  hospitalId?: string;
  createdAt?: string;
  updatedAt?: string;

  // appointment fields
  appointmentCount?: number;
  autoDecline?: number;
}

export interface LoginDoctorData {
  email: string;
  password: string;
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

// ==============================
// DOCTOR API
// ==============================

export const doctorApi = api.injectEndpoints({
  endpoints: (builder) => ({

    // ==============================
    // GET DOCTORS
    // ==============================

// app/service/doctorApi.js
    getDoctors: builder.query({
      query: (params) => {
        const queryParams = new URLSearchParams();
        
        if (params?.hospitalId) {
          queryParams.append("hospitalId", String(params.hospitalId));
        }
        
        if (params?.speciality) {
          queryParams.append("speciality", params.speciality);
        }
        
        const queryString = queryParams.toString();
        return `/doctor${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: ["Doctor"],
    }),

    // ==============================
    // LOGIN DOCTOR
    // ==============================

    loginDoctor: builder.mutation<
      DoctorAuthResponse,
      LoginDoctorData
    >({
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
          localStorage.setItem(
            "refreshToken",
            response.refreshToken
          );
        }

        return response;
      },

      invalidatesTags: ["Doctor"],
    }),

    // ==============================
    // LOGOUT DOCTOR
    // ==============================

    logoutDoctor: builder.mutation<
      { message: string },
      { hospitalId: string }
    >({
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

    addNewDoctor: builder.mutation<
      DoctorAuthResponse,
      Doctor
    >({
      query: (newDoctor) => ({
        url: "/doctor",
        method: "POST",
        body: newDoctor,
      }),

      invalidatesTags: ["Doctor"],
    }),

    // ==============================
    // UPDATE DOCTOR
    // ==============================

    updateDoctor: builder.mutation<
      Doctor,
      {id: string; updateDoctor: Partial<Doctor> }
    >({
      query: ({id, updateDoctor }) => ({
        url: `/doctor/${id}`,
        method: "PUT",
        body: updateDoctor,
      }),

      invalidatesTags: ["Doctor"],
    }),

    // ==============================
    // DELETE DOCTOR
    // ==============================

    deleteDoctor: builder.mutation<
      { message: string },
      string
    >({
      query: (hospitalId) => ({
        url: `/doctor/${hospitalId}`,
        method: "DELETE",
      }),

      invalidatesTags: ["Doctor"],
    }),
  }),

  overrideExisting: false,
});

// ==============================
// EXPORT HOOKS
// ==============================

export const {
  useGetDoctorsQuery,
  useLoginDoctorMutation,
  useLogoutDoctorMutation,
  useAddNewDoctorMutation,
  useUpdateDoctorMutation,
  useDeleteDoctorMutation,
} = doctorApi;