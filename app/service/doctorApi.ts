// doctorApi.ts
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
    // Automatically adds hospitalId from authenticated user
    // ==============================
    getDoctors: builder.query({
      query: (params) => {
        const auth = getAuthUser();
        const queryParams = new URLSearchParams();
        
        // Automatically add hospitalId from authenticated user
        if (auth?.id) {
          queryParams.append("hospitalId", String(auth.id));
        }
        
        // Optional speciality filter (can be passed from component)
        if (params?.speciality) {
          queryParams.append("speciality", params.speciality);
        }
        
        const queryString = queryParams.toString();
        return `/doctor${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: ["Doctor"],
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
    // Automatically adds hospitalId from authenticated user
    // ==============================
    addNewDoctor: builder.mutation<DoctorAuthResponse, Omit<Doctor, 'hospitalId'>>({
      query: (newDoctor) => {
        const auth = getAuthUser();
        
        return {
          url: "/doctor",
          method: "POST",
          body: {
            ...newDoctor,
            hospitalId: auth?.id, // Automatically add from auth
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
      invalidatesTags: (result, error, { id }) => [{ type: "Doctor", id }],
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
} = doctorApi;