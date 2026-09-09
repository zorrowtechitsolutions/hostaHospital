// prescription.js - Complete with ONLY patientNumber support (no DB id fallback)

import { api } from "./api";
import { getHospitalId } from "../../src/utils/auth";

// ================= TYPES =================

export interface PrescriptionPayload {
  bookingId: number | string;
  doctorId: number | string;

  // ✅ ONLY patientNumber - DO NOT use database ID
  patientNumber?: number | string | null;
  userId?: number | string | null;

  // ✅ PATIENT DETAILS - Backend field names
  patientName?: string;
  age?: number | string;
  contact?: string;
  gender?: string;
  
  hospitalName?: string;
  prescribedBy?: string;
  doctorName?: string;
  doctorSpecialization?: string;
  type?: string;

  complaint: string;
  medications: any;
  investigations: any;
  advice: string;

  design?: any[];
  canvasBg?: string;
  templateType?: string;  

  next_consultation?: string;
  empty_stomach?: boolean;

  temperature?: number;
  pulse?: number;
  respiratoryRate?: number;
  spo2?: number;
  height?: number;
  weight?: number;
  bmi?: number;
  waist?: number;
  bsa?: number;

  hospitalId?: number | string;
  
  // ✅ Additional fields that may come from API
  id?: number;
  createdAt?: string;
  updatedAt?: string;
  isDelete?: boolean;
  status?: string;
}

export interface PrescriptionResponse {
  success: boolean;
  message: string;
  data?: PrescriptionPayload | PrescriptionPayload[] | any;
  error?: string | null;
}

// ✅ Typed list response
export interface PrescriptionListResponse {
  success: boolean;
  message?: string;
  data: PrescriptionPayload[];
  pagination?: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
  error?: string | null;
}

// ✅ Query params - ONLY patientNumber, NO patientId
export interface GetPrescriptionsParams {
  patientNumber?: number | string;  // ✅ This is the business patient number
  doctorId?: number | string;
  bookingId?: number | string;
  page?: number;
  limit?: number;
  status?: string;
  search_query?: string;
  hospitalId?: number | string;
}

// ================= API =================

export const prescriptionApi = api.injectEndpoints({
  endpoints: (builder) => ({

    // ✅ CREATE PRESCRIPTION - ONLY patientNumber
    createPrescription: builder.mutation<
      PrescriptionResponse,
      PrescriptionPayload
    >({
      query: (data) => {
        const hospitalId = getHospitalId();

        // ✅ CRITICAL: ONLY use patientNumber - NEVER fallback to database ID
        // If patientNumber is missing, the backend will handle it
        const patientIdentifier = data.patientNumber;

        // ✅ Warn if patientNumber is missing
        if (!patientIdentifier) {
          console.warn("⚠️ patientNumber is missing in prescription payload!");
        }

        const payload = {
          bookingId: data.bookingId,
          hospitalId,
          doctorId: data.doctorId,

          // Doctor fields
          prescribedBy: data.doctorName || data.prescribedBy,
          doctorName: data.doctorName,
          doctorSpecialization: data.doctorSpecialization,

          // ✅ PATIENT DETAILS - Using exact backend field names
          patientName: data.patientName,
          age: data.age,
          contact: data.contact,
          gender: data.gender,

          // ✅ CRITICAL: This is Patient Number, NOT DB patient.id
          patientId: patientIdentifier,  // Backend expects patientNumber here

          userId: data.userId,

          hospitalName: data.hospitalName,

          complaint: data.complaint,
          medications: data.medications,
          investigations: data.investigations,
          advice: data.advice,

          templateType: data.templateType,
          canvasBg: data.canvasBg,
          design: data.design,

          next_consultation: data.next_consultation,
          empty_stomach: data.empty_stomach,

          temperature: data?.temperature || 0,
          pulse: data?.pulse || 0,
          respiratoryRate: data?.respiratoryRate || 0,
          spo2: data?.spo2 || 0,
          height: data?.height || 0,
          weight: data?.weight || 0,
          bmi: data?.bmi || 0,
          waist: data?.waist || 0,
          bsa: data?.bsa || 0,
        };

        console.log("📋 Creating prescription with patientNumber:", {
          patientNumber: patientIdentifier,
          patientName: data.patientName,
          bookingId: data.bookingId,
        });

        return {
          url: "/prescription",
          method: "POST",
          body: payload,
        };
      },
      invalidatesTags: ["Prescription"],
    }),

    // ✅ GET ALL PRESCRIPTIONS - ONLY patientNumber (NO database ID)
    getPrescriptions: builder.query<
      PrescriptionListResponse,
      GetPrescriptionsParams
    >({
      query: (params = {}) => {
        const hospitalId = getHospitalId();
        
        let url = `/prescription?hospitalId=${hospitalId}`;
        
        // ✅ IMPORTANT: ONLY use patientNumber - NO patientId fallback
        // patientNumber is the business patient number (e.g., 2, not 81)
        if (params.patientNumber !== undefined && params.patientNumber !== null) {
          url += `&patientId=${encodeURIComponent(String(params.patientNumber))}`;
          console.log("📋 Fetching prescriptions for patientNumber:", params.patientNumber);
        } else {
          console.warn("⚠️ patientNumber is missing in getPrescriptions query!");
        }
        
        if (params?.doctorId) {
          url += `&doctorId=${params.doctorId}`;
        }
        if (params?.bookingId) {
          url += `&bookingId=${params.bookingId}`;
        }
        if (params?.page) {
          url += `&page=${params.page}`;
        }
        if (params?.limit) {
          url += `&limit=${params.limit}`;
        }
        if (params?.status) {
          url += `&status=${params.status}`;
        }
        if (params?.search_query) {
          url += `&search_query=${encodeURIComponent(params.search_query)}`;
        }
        
        console.log("📋 Prescriptions URL:", url);
        
        return {
          url,
          method: "GET",
        };
      },
      providesTags: ["Prescription"],
      
      // ✅ Transform response to ensure consistent data shape
      transformResponse: (response: any): PrescriptionListResponse => {
        // If response already has the right shape
        if (response && response.success !== undefined && response.data !== undefined) {
          // Ensure data is always an array
          if (!Array.isArray(response.data)) {
            return {
              ...response,
              data: response.data ? [response.data] : [],
            };
          }
          return response;
        }
        
        // If response is an array directly
        if (Array.isArray(response)) {
          return {
            success: true,
            message: 'Prescriptions fetched successfully',
            data: response,
          };
        }
        
        // If response has rows (Sequelize format)
        if (response && response.rows && Array.isArray(response.rows)) {
          return {
            success: true,
            message: 'Prescriptions fetched successfully',
            data: response.rows,
            pagination: {
              totalItems: response.count || response.rows.length,
              totalPages: Math.ceil((response.count || response.rows.length) / 10),
              currentPage: 1,
              limit: 10,
            },
          };
        }
        
        // Fallback: return empty array
        return {
          success: false,
          message: 'Unexpected response format',
          data: [],
          error: 'Invalid response structure',
        };
      },
    }),

    // GET SINGLE PRESCRIPTION BY ID
    getPrescriptionById: builder.query<
      PrescriptionResponse,
      string | number
    >({
      query: (id) => {
        const hospitalId = getHospitalId();
        
        return {
          url: `/prescription/${id}?hospitalId=${hospitalId}`,
          method: "GET",
        };
      },
      providesTags: (result, error, id) => [{ type: "Prescription", id }],
    }),

    // UPDATE/EDIT PRESCRIPTION
    updatePrescription: builder.mutation<
      PrescriptionResponse,
      { id: string | number; data: Partial<PrescriptionPayload> }
    >({
      query: ({ id, data }) => {
        const hospitalId = getHospitalId();

        // ✅ If patientNumber is provided, use it as patientId
        const updateData: any = {
          ...data,
          hospitalId: hospitalId,
        };
        
        // ✅ ONLY use patientNumber if available
        if (data.patientNumber) {
          updateData.patientId = data.patientNumber;
          delete updateData.patientNumber;
        }

        return {
          url: `/prescription/${id}`,
          method: "PUT",
          body: updateData,
        };
      },
      invalidatesTags: (result, error, { id }) => [{ type: "Prescription", id }],
    }),

    // DELETE PRESCRIPTION
    deletePrescription: builder.mutation<
      { success: boolean; message: string },
      string | number
    >({
      query: (id) => {
        const hospitalId = getHospitalId();

        return {
          url: `/prescription/${id}?hospitalId=${hospitalId}`,
          method: "DELETE",
        };
      },
      invalidatesTags: ["Prescription"],
    }),

    // RECOVER PRESCRIPTION
    recoverPrescription: builder.mutation<
      { success: boolean; message: string; data?: PrescriptionPayload },
      string | number
    >({
      query: (id) => {
        const hospitalId = getHospitalId();

        return {
          url: `/prescription/recover/${id}?hospitalId=${hospitalId}`,
          method: "PUT",
        };
      },
      invalidatesTags: (result, error, id) => [{ type: "Prescription", id }, "Prescription"],
    }),
  }),
});

export const {
  useCreatePrescriptionMutation,
  useGetPrescriptionsQuery,
  useGetPrescriptionByIdQuery,
  useUpdatePrescriptionMutation,
  useDeletePrescriptionMutation,
  useRecoverPrescriptionMutation,
} = prescriptionApi;