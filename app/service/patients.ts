// src/app/service/patients.ts

import { api } from "./api";

// ==============================
// TYPES
// ==============================

export interface Location {
  country: string;
  state: string;
  district: string;
  place: string;
  pincode: number;
}

export interface Patient {
  id?: string;
  _id?: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  bloodGroup: string;
  gender: string;
  maritalStatus?: string;
  patientType?: string;
  age: number;
  dob: string;
  mobileNumber: string;
  emergencyNumber?: string;
  guardianName?: string;
  guardianRelation?: string | null;
  addressLine1: string;
  addressLine2?: string;
  location: Location;
  hospitalId: string | number;
  referredBy?: string | null;
  department?: string;
  referredOn?: string | null;
  notes?: string;
  email?: string;
  userId: string | number;
  profileImage?: string | null;
  height?: number | null;
  weight?: number | null;
  bloodPressure?: string | null;
  allergies?: string | null;
  chronicConditions?: string | null;
  occupation?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePatientData {
  firstName: string;
  lastName: string;
  bloodGroup: string;
  gender: string;
  maritalStatus?: string;
  patientType?: string;
  age: number;
  dob: string;
  mobileNumber: string;
  emergencyNumber?: string;
  guardianName?: string;
  addressLine1: string;
  addressLine2?: string;
  location: Location;
  hospitalId: string | number;
  referredBy?: string | null;
  department?: string;
  referredOn?: string | null;
  notes?: string;
  email?: string;
  userId: string | number;
  profileImage?: string | null;
  height?: number | null;
  weight?: number | null;
  bloodPressure?: string | null;
  allergies?: string | null;
  chronicConditions?: string | null;
  occupation?: string | null;
  guardianRelation?: string | null;
  middleName?: string | null;
}

export interface PatientResponse {
  success?: boolean;
  message?: string;
  data?: Patient;
  error?: string;
}

export interface LoginPatientData {
  email: string;
  password: string;
  mobileNumber?: string;
}

export interface PatientAuthResponse {
  success?: boolean;
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  patient?: Patient;
  data?: Patient;
  message?: string;
  error?: string;
}

// ==============================
// PATIENTS API
// ==============================

export const patientsApi = api.injectEndpoints({
  endpoints: (builder) => ({

    // ==============================
    // GET ALL PATIENTS
    // ==============================

    getPatients: builder.query({
      query: (params) => {
        const queryParams = new URLSearchParams();
        
        if (params?.hospitalId) {
          queryParams.append("hospitalId", String(params.hospitalId));
        }
        
        if (params?.search) {
          queryParams.append("search", params.search);
        }
        
        if (params?.page) {
          queryParams.append("page", String(params.page));
        }
        
        if (params?.limit) {
          queryParams.append("limit", String(params.limit));
        }
        
        const queryString = queryParams.toString();
        return `/patients${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: ["Patient"],
    }),

    // ==============================
    // GET SINGLE PATIENT
    // ==============================

    getPatientById: builder.query<PatientResponse, string>({
      query: (id) => `/patients/${id}`,
      providesTags: (result, error, id) => [{ type: "Patient", id }],
    }),

    // ==============================
    // CREATE NEW PATIENT
    // ==============================

    createPatient: builder.mutation<PatientResponse, CreatePatientData>({
      query: (newPatient) => ({
        url: "/patients",
        method: "POST",
        body: newPatient,
      }),

      invalidatesTags: ["Patient"],
    }),

    // ==============================
    // UPDATE PATIENT
    // ==============================

    updatePatient: builder.mutation<PatientResponse, { id: string; updatePatient: Partial<CreatePatientData> }>({
      query: ({ id, updatePatient }) => ({
        url: `/patients/${id}`,
        method: "PUT",
        body: updatePatient,
      }),

      invalidatesTags: (result, error, { id }) => [{ type: "Patient", id }],
    }),

    // ==============================
    // DELETE PATIENT
    // ==============================

    deletePatient: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/patients/${id}`,
        method: "DELETE",
      }),

      invalidatesTags: ["Patient"],
    }),

    // ==============================
    // LOGIN PATIENT (for patient portal)
    // ==============================

    loginPatient: builder.mutation<PatientAuthResponse, LoginPatientData>({
      query: (loginData) => ({
        url: "/patients/login",
        method: "POST",
        body: loginData,
      }),

      transformResponse: (response: PatientAuthResponse) => {
        const token = response.token || response.accessToken;

        if (token) {
          localStorage.setItem("patientAccessToken", token);
        }

        if (response.refreshToken) {
          localStorage.setItem("patientRefreshToken", response.refreshToken);
        }

        return response;
      },

      invalidatesTags: ["Patient"],
    }),

    // ==============================
    // LOGOUT PATIENT
    // ==============================

    logoutPatient: builder.mutation<{ message: string }, { patientId: string }>({
      query: ({ patientId }) => ({
        url: `/patients/logout/${patientId}`,
        method: "PUT",
      }),

      onQueryStarted: async (_arg, { queryFulfilled }) => {
        try {
          await queryFulfilled;
          localStorage.removeItem("patientAccessToken");
          localStorage.removeItem("patientRefreshToken");
        } catch (error) {
          console.error("Logout error:", error);
        }
      },
    }),

  }),

  overrideExisting: false,
});

// ==============================
// EXPORT HOOKS
// ==============================

export const {
  useGetPatientsQuery,
  useGetPatientByIdQuery,
  useCreatePatientMutation,
  useUpdatePatientMutation,
  useDeletePatientMutation,
  useLoginPatientMutation,
  useLogoutPatientMutation,
} = patientsApi;