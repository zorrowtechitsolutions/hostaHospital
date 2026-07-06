// src/app/service/patients.ts - Add recover endpoint and includeDeleted parameter

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
  name: string;
  bloodGroup?: string;
  gender: string;
  maritalStatus?: string;
  patientType?: string;
  age?: number;
  dob?: string;
  mobileNumber: string;
  emergencyNumber?: string;
  guardianName?: string;
  guardianRelation?: string | null;
  addressLine: string;
  location: Location;
  hospitalId: string | number;
  email?: string;
  userId: string | number;
  profileImage?: string | null;
  occupation?: string | null;
  createdAt?: string;
  updatedAt?: string;
  isDelete?: boolean; // ✅ Add isDelete field
  deleteDate?: string | null; // ✅ Add deleteDate field
}

export interface CreatePatientData {
  name: string;
  bloodGroup?: string;
  gender: string;
  maritalStatus?: string;
  patientType?: string;
  age?: number;
  dob?: string;
  mobileNumber: string;
  emergencyNumber?: string;
  guardianName?: string;
  guardianRelation?: string | null;
  addressLine: string;
  location: Location;
  hospitalId: string | number;
  email?: string;
  userId: string | number;
  profileImage?: string | null;
  occupation?: string | null;
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
      query: (params = {}) => {
        const queryParams = new URLSearchParams();

        if (params.name) {
          queryParams.append("name", params.name);
        }

        if (params.phone) {
          queryParams.append("phone", params.phone);
        }

        if (params.patientId) {
          queryParams.append("patientId", params.patientId);
        }

        if (params.addressLine) {
          queryParams.append("addressLine", params.addressLine);
        }

        if (params.email) {
          queryParams.append("email", params.email);
        }

        if (params.guardianName) {
          queryParams.append("guardianName", params.guardianName);
        }

        if (params.hospitalId) {
          queryParams.append("hospitalId", String(params.hospitalId));
        }

        queryParams.append("page", String(params.page || 1));
        queryParams.append("limit", String(params.limit || 10));

        if (params.search_query) {
          queryParams.append("search_query", params.search_query);

        }

      const url = `/patients?${queryParams.toString()}`;

    console.log("Patients API URL:", url); // 👈 ADD HERe

        // ✅ Add includeDeleted parameter
        if (params.includeDeleted) {
          queryParams.append("includeDeleted", String(params.includeDeleted));
        }

        return `/patients?${queryParams.toString()}`;
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
    // ✅ RECOVER PATIENT (SOFT DELETE)
    // ==============================

    recoverPatient: builder.mutation<
      { success: boolean; message: string; data?: Patient },
      string
    >({
      query: (id) => ({
        url: `/patients/recover/${id}`,
        method: "PUT",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Patient", id },
        "Patient",
      ],
    }),

  }),
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
  useRecoverPatientMutation, // ✅ Export the new hook
} = patientsApi;