import { api } from "./api";
import { getHospitalId } from "../../src/utils/auth";

// ================= TYPES =================

export interface PrescriptionPayload {
  bookingId: number | string;
  doctorId: number | string;
  patientId: number | string;

  complaint: string;
  medications: string;
  investigations: string;
  advice: string;

  next_consultation?: string;
  empty_stomach?: boolean;

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

        return {
          url: "/prescription",
          method: "POST",
          body: {
            bookingId: data.bookingId,
            hospitalId: hospitalId,

            doctorId: data.doctorId,
            patientId: data.patientId,

            complaint: data.complaint,

            medications: data.medications,
            investigations: data.investigations,
            advice: data.advice,

            next_consultation: data.next_consultation,
            empty_stomach: data.empty_stomach,
          },
        };
      },

      invalidatesTags: ["Prescription"],
    }),
  }),
});

export const {
  useCreatePrescriptionMutation,
} = prescriptionApi;