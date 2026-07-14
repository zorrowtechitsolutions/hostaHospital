// app/service/patients.ts - Fixed with hospital ID handling for ALL roles

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
  imageKey?: string;
  department?: string;
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
  imageKey?: string;
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

        // 🔥 FIX: Include ALL roles that should be filtered by hospital
        const isSuperAdmin = auth?.role === 'super-admin';
        const isHospitalAdmin = auth?.role === 'hospital' || auth?.roleId === 2;
        const isDoctor = auth?.role === 'doctor' || auth?.roleId === 46;
        const isStaff = auth?.role === 'staff' || auth?.roleId === 3; // ✅ ADDED staff role
        const shouldSkipFilter = params.skipHospitalFilter === true;
        
        // 🔥 FIX: Filter by hospital for ALL hospital-bound users (Doctors, Hospital Admins, AND Staff)
        const shouldFilterByHospital = (isHospitalAdmin || isDoctor || isStaff) && !shouldSkipFilter;

        // 🔥 FIX: Get hospital ID properly for all roles
        let hospitalIdToUse = null;
        
        if (shouldFilterByHospital) {
          // Priority: auth.hospitalId > auth.id > params.hospitalId
          if (auth?.hospitalId) {
            hospitalIdToUse = auth.hospitalId;
          } else if (auth?.id) {
            hospitalIdToUse = auth.id;
          } else {
            hospitalIdToUse = params.hospitalId;
          }
        } 
        // Super Admin with specific hospital filter
        else if (isSuperAdmin && params.hospitalId) {
          hospitalIdToUse = params.hospitalId;
        }
        // Use provided hospitalId if available
        else if (params.hospitalId) {
          hospitalIdToUse = params.hospitalId;
        }

        // Apply the hospital filter if we have a valid ID
        if (hospitalIdToUse && !shouldSkipFilter) {
          queryParams.append("hospitalId", String(hospitalIdToUse));
        } else if (shouldFilterByHospital) {
          console.warn("⚠️ No hospital ID found for filtering patients");
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

        // Patient type filter
        if (params.patientType) {
          queryParams.append("patientType", params.patientType);
        }

        // Include deleted parameter
        if (params.includeDeleted) {
          queryParams.append("includeDeleted", String(params.includeDeleted));
        }

        // Pagination parameters
        queryParams.append("page", String(params.page || 1));
        queryParams.append("limit", String(params.limit || 10));

        const url = `/patients?${queryParams.toString()}`;
        return url;
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
        const isSuperAdmin = auth?.role === 'super-admin';
        const isHospitalAdmin = auth?.role === 'hospital' || auth?.roleId === 2;
        const isDoctor = auth?.role === 'doctor' || auth?.roleId === 46;
        const isStaff = auth?.role === 'staff' || auth?.roleId === 3; // ✅ ADDED staff role
        
        // 🔥 FIX: Use hospitalId for ALL roles
        let hospitalId = newPatient.hospitalId;
        
        if (!hospitalId && !isSuperAdmin) {
          // 🔥 FIX: Priority: auth.hospitalId > auth.id for all roles
          if (auth?.hospitalId) {
            hospitalId = auth.hospitalId;
          } else if (auth?.id && (isHospitalAdmin || isDoctor || isStaff)) {
            hospitalId = auth.id;
          }
        }
        
        return {
          url: "/patients",
          method: "POST",
          body: {
            ...newPatient,
            hospitalId: hospitalId,
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
        const isSuperAdmin = auth?.role === 'super-admin';
        const isHospitalAdmin = auth?.role === 'hospital' || auth?.roleId === 2;
        const isDoctor = auth?.role === 'doctor' || auth?.roleId === 46;
        const isStaff = auth?.role === 'staff' || auth?.roleId === 3; // ✅ ADDED staff role
        
        // 🔥 FIX: Use hospitalId for ALL roles
        let hospitalId = updatePatient.hospitalId;
        
        if (!hospitalId && !isSuperAdmin) {
          // 🔥 FIX: Priority: auth.hospitalId > auth.id for all roles
          if (auth?.hospitalId) {
            hospitalId = auth.hospitalId;
          } else if (auth?.id && (isHospitalAdmin || isDoctor || isStaff)) {
            hospitalId = auth.id;
          }
        }
        
        return {
          url: `/patients/${id}`,
          method: "PUT",
          body: {
            ...updatePatient,
            hospitalId: hospitalId,
          },
        };
      },

invalidatesTags: (result, error, { id }) => [
  { type: "Patient", id },
  "Patient",
],    

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