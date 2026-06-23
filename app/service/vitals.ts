import { api } from "./api";

// ================= TYPES =================

export interface VitalPayload {
  patientId: number | string;
  prescriptionId: number | string;

  temperature?: number;
  pulse?: number;
  heartRate?: number;
  respiratoryRate?: number;
  spo2?: number;
  bloodPressure?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  height?: number;
  weight?: number;
  bmi?: number;
  waist?: number;
  bsa?: number;
  notes?: string;
}

export interface VitalResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface VitalsListResponse {
  success: boolean;
  data: VitalRecord[];
  message?: string;
}

export interface VitalRecord {
  id: number;
  patientId: number;
  prescriptionId: number;

  temperature?: number;
  pulse?: number;
  heartRate?: number;
  respiratoryRate?: number;
  spo2?: number;
  bloodPressure?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  height?: number;
  weight?: number;
  bmi?: number;
  waist?: number;
  bsa?: number;

  notes?: string;
  createdAt: string;
  updatedAt: string;

  doctorName?: string;
  doctorSpecialization?: string;
  department?: string;
  patientName?: string;
}

// ================= API =================

export const vitalsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    
    // GET VITALS BY PATIENT + PRESCRIPTION
    getVitalsByPatientId: builder.query<
      VitalsListResponse,
      {
        patientId: string | number;
        prescriptionId: string | number;
      }
    >({
      query: ({ patientId, prescriptionId }) => ({
        url: `/vitals?patientId=${patientId}&prescriptionId=${prescriptionId}`,
        method: "GET",
      }),
      providesTags: ["Vitals"],
    }),

    // GET VITALS
    getVitals: builder.query<
      VitalsListResponse,
      {
        patientId?: string | number;
        prescriptionId?: string | number;
        page?: number;
        limit?: number;
      }
    >({
      query: (params) => {
        let url = "/vitals?";

        const queryParams = new URLSearchParams();

        if (params?.patientId) {
          queryParams.append("patientId", String(params.patientId));
        }

        if (params?.prescriptionId) {
          queryParams.append(
            "prescriptionId",
            String(params.prescriptionId)
          );
        }

        if (params?.page) {
          queryParams.append("page", String(params.page));
        }

        if (params?.limit) {
          queryParams.append("limit", String(params.limit));
        }

        url += queryParams.toString();

        return {
          url,
          method: "GET",
        };
      },
      providesTags: ["Vitals"],
    }),

    // GET SINGLE VITAL
    getVitalById: builder.query<VitalResponse, string | number>({
      query: (id) => ({
        url: `/vitals/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [
        { type: "Vitals", id },
      ],
    }),

    // CREATE VITAL
    createVital: builder.mutation<VitalResponse, VitalPayload>({
      query: (data) => ({
        url: "/vitals",
        method: "POST",
        body: {
          patientId: data.patientId,
          prescriptionId: data.prescriptionId,

          temperature: data.temperature,
          pulse: data.pulse,
          heartRate: data.heartRate,
          respiratoryRate: data.respiratoryRate,
          spo2: data.spo2,
          bloodPressure: data.bloodPressure,
          bloodPressureSystolic: data.bloodPressureSystolic,
          bloodPressureDiastolic: data.bloodPressureDiastolic,
          height: data.height,
          weight: data.weight,
          bmi: data.bmi,
          waist: data.waist,
          bsa: data.bsa,
          notes: data.notes,
        },
      }),
      invalidatesTags: ["Vitals"],
    }),

    // UPDATE VITAL
    updateVital: builder.mutation<
      VitalResponse,
      {
        id: string | number;
        data: Partial<VitalPayload>;
      }
    >({
      query: ({ id, data }) => ({
        url: `/vitals/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Vitals", id },
      ],
    }),

    // DELETE VITAL
    deleteVital: builder.mutation<
      VitalResponse,
      string | number
    >({
      query: (id) => ({
        url: `/vitals/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Vitals"],
    }),
  }),
});

// ================= EXPORTS =================

export const {
  useGetVitalsByPatientIdQuery,
  useGetVitalsQuery,
  useGetVitalByIdQuery,
  useCreateVitalMutation,
  useUpdateVitalMutation,
  useDeleteVitalMutation,
} = vitalsApi;