// app/service/patients.ts - Fixed with hospital ID handling
import { api } from "./api";
import { getAuthUser } from "../../src/utils/auth";

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
  isDelete?: boolean;
  deleteDate?: string | null;
  isActive?: boolean;
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

export interface GetPatientsParams {
  hospitalId?: string | number;
  name?: string;
  phone?: string;
  patientId?: string;
  addressLine?: string;
  email?: string;
  guardianName?: string;
  gender?: string;
  patientType?: string;
  includeDeleted?: boolean;
  search_query?: string;
  page?: number;
  limit?: number;
  skipHospitalFilter?: boolean;
}

// ==============================
// PATIENTS API
// ==============================

export const patientsApi = api.injectEndpoints({
  endpoints: (builder) => ({

    // ==============================
    // GET ALL PATIENTS - Server-side pagination and filtering
    // ==============================

    getPatients: builder.query({
      query: (params: GetPatientsParams = {}) => {
        const auth = getAuthUser();
        const queryParams = new URLSearchParams();

        // ✅ FIXED: Hospital ID handling - same pattern as doctorApi
        const isHospitalAdmin = auth?.role === 'hospital' || auth?.roleId === 2;
        const shouldSkipFilter = params.skipHospitalFilter === true;
        
        if (isHospitalAdmin && auth?.id && !params.hospitalId && !shouldSkipFilter) {
          queryParams.append("hospitalId", String(auth.id));
        } else if (params.hospitalId) {
          queryParams.append("hospitalId", String(params.hospitalId));
        }

        // Search query
        if (params.search_query) {
          queryParams.append("search_query", params.search_query);
        }

        // Name filter
        if (params.name) {
          queryParams.append("name", params.name);
        }

        // Phone filter
        if (params.phone) {
          queryParams.append("phone", params.phone);
        }

        // Patient ID filter
        if (params.patientId) {
          queryParams.append("patientId", params.patientId);
        }

        // Address line filter
        if (params.addressLine) {
          queryParams.append("addressLine", params.addressLine);
        }

        // Email filter
        if (params.email) {
          queryParams.append("email", params.email);
        }

        // Guardian name filter
        if (params.guardianName) {
          queryParams.append("guardianName", params.guardianName);
        }

        // Gender filter
        if (params.gender) {
          queryParams.append("gender", params.gender);
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

        // Pagination parameters
        queryParams.append("page", String(params.page || 1));
        queryParams.append("limit", String(params.limit || 10));

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
      query: (newPatient) => {
        const auth = getAuthUser();
        
        return {
          url: "/patients",
          method: "POST",
          body: {
            ...newPatient,
            // ✅ FIXED: If hospitalId is not provided, use auth user's ID
            hospitalId: newPatient.hospitalId ?? auth?.id,
          },
        };
      },

      invalidatesTags: ["Patient"],
    }),

    // ==============================
    // UPDATE PATIENT
    // ==============================

    updatePatient: builder.mutation<PatientResponse, { id: string; updatePatient: Partial<CreatePatientData> }>({
      query: ({ id, updatePatient }) => {
        const auth = getAuthUser();
        
        return {
          url: `/patients/${id}`,
          method: "PUT",
          body: {
            ...updatePatient,
            // ✅ FIXED: If hospitalId is not provided, use auth user's ID
            hospitalId: updatePatient.hospitalId ?? auth?.id,
          },
        };
      },

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
    // RECOVER PATIENT (SOFT DELETE)
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
  useRecoverPatientMutation,
} = patientsApi;