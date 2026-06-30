import { api } from "./api";
import { getHospitalId } from "../../src/utils/auth";

// ================= TYPES =================

export interface PrescriptionPayload {
  bookingId: number | string;
  doctorId: number | string;

  patientId?: number | string | null;
  userId?: number | string | null;

  prescribedBy?: string;        // ✅ ADDED - Backend expects this field
  doctorName?: string;          // Keep for frontend display
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
}

export interface PrescriptionResponse {
  success: boolean;
  message: string;
  data?: any;
}

// ================= API =================

export const prescriptionApi = api.injectEndpoints({
  endpoints: (builder) => ({

    // CREATE PRESCRIPTION
    createPrescription: builder.mutation<
      PrescriptionResponse,
      PrescriptionPayload
    >({
      query: (data) => {
        const hospitalId = getHospitalId();

        const payload = {
          bookingId: data.bookingId,
          hospitalId,
          doctorId: data.doctorId,

          // ✅ Send BOTH doctorName AND prescribedBy
          prescribedBy: data.doctorName || data.prescribedBy,  // Backend expects this
          doctorName: data.doctorName,                         // For frontend display
          doctorSpecialization: data.doctorSpecialization,

          patientId: data.patientId,
          userId: data.userId,

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

        console.log("🚀 Prescription Payload:");
        console.log(JSON.stringify(payload, null, 2));

        return {
          url: "/prescription",
          method: "POST",
          body: payload,
        };
      },
      invalidatesTags: ["Prescription"],
    }),

    // GET ALL PRESCRIPTIONS
    getPrescriptions: builder.query({
      query: (params) => {
        const hospitalId = getHospitalId();
        
        let url = `/prescription?hospitalId=${hospitalId}`;
        
        if (params?.patientId) {
          url += `&patientId=${params.patientId}`;
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
        
        return {
          url,
          method: "GET",
        };
      },
      providesTags: ["Prescription"],
    }),

    // GET SINGLE PRESCRIPTION BY ID
    getPrescriptionById: builder.query({
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
    updatePrescription: builder.mutation({
      query: ({ id, data }) => {
        const hospitalId = getHospitalId();

        return {
          url: `/prescription/${id}`,
          method: "PUT",
          body: {
            hospitalId: hospitalId,
            ...data,
          },
        };
      },
      invalidatesTags: (result, error, { id }) => [{ type: "Prescription", id }],
    }),

    // DELETE PRESCRIPTION
    deletePrescription: builder.mutation({
      query: (id) => {
        const hospitalId = getHospitalId();

        return {
          url: `/prescription/${id}?hospitalId=${hospitalId}`,
          method: "DELETE",
        };
      },
      invalidatesTags: ["Prescription"],
    }),
  }),
});

export const {
  useCreatePrescriptionMutation,
  useGetPrescriptionsQuery,
  useGetPrescriptionByIdQuery,
  useUpdatePrescriptionMutation,
  useDeletePrescriptionMutation,
} = prescriptionApi;