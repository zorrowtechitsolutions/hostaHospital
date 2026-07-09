import { api } from "./api";
import { getHospitalId } from "../../src/utils/auth";

// ================= TYPES =================

export interface PrescriptionTemplatePayload {
  bgColor?: string;
  textColor?: string;
  textAlign?: string;
  fontWeight?: string;
  fontSize?: string;
  editable?: boolean;

  height: number;
  width: number;
  y: number;
  x: number;

  content: string;
  type: string;
  templateType: string;
}

export interface PrescriptionTemplateResponse {
  success: boolean;
  message: string;
  data?: any;
}

// ================= API =================

export const prescriptionTemplateApi = api.injectEndpoints({
  endpoints: (builder) => ({

    // CREATE PRESCRIPTION TEMPLATE
    createPrescriptionTemplate: builder.mutation<
      PrescriptionTemplateResponse,
      PrescriptionTemplatePayload
    >({
      query: (data) => ({
        url: "/prescription-template",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["PrescriptionTemplate"],
    }),

    // GET ALL PRESCRIPTION TEMPLATES - FIXED to get all templates
    getPrescriptionTemplates: builder.query({
      query: (params) => {
        // Get ALL templates without filtering by hospitalId on backend
        let url = `/prescription-template`;
        
        if (params?.specialty) {
          url += `?specialty=${params.specialty}`;
        }
        if (params?.isDefault) {
          url += `${url.includes('?') ? '&' : '?'}isDefault=${params.isDefault}`;
        }
        if (params?.page) {
          url += `${url.includes('?') ? '&' : '?'}page=${params.page}`;
        }
        if (params?.limit) {
          url += `${url.includes('?') ? '&' : '?'}limit=${params.limit}`;
        }
        
        
        return {
          url,
          method: "GET",
        };
      },
      providesTags: ["PrescriptionTemplate"],
    }),

    // GET SINGLE PRESCRIPTION TEMPLATE BY ID
    getPrescriptionTemplateById: builder.query({
      query: (id) => {
        const hospitalId = getHospitalId();
        
        return {
          url: `/prescription-template/${id}?hospitalId=${hospitalId}`,
          method: "GET",
        };
      },
      providesTags: (result, error, id) => [{ type: "PrescriptionTemplate", id }],
    }),

    // UPDATE/EDIT PRESCRIPTION TEMPLATE
    updatePrescriptionTemplate: builder.mutation({
      query: ({ id, data }) => {
        const hospitalId = getHospitalId();
        return {
          url: `/prescription-template/${id}?hospitalId=${hospitalId}`,
          method: "PUT",
          body: data,
        };
      },
      invalidatesTags: ["PrescriptionTemplate"],
    }),

    // DELETE PRESCRIPTION TEMPLATE
    deletePrescriptionTemplate: builder.mutation({
      query: (id) => {
        const hospitalId = getHospitalId();

        return {
          url: `/prescription-template/${id}?hospitalId=${hospitalId}`,
          method: "DELETE",
        };
      },
      invalidatesTags: ["PrescriptionTemplate"],
    }),

    // SET DEFAULT TEMPLATE
    setDefaultTemplate: builder.mutation({
      query: ({ id, specialty }) => {
        const hospitalId = getHospitalId();

        return {
          url: `/prescription-template/${id}/set-default`,
          method: "POST",
          body: {
            hospitalId: hospitalId,
            specialty: specialty || "General",
          },
        };
      },
      invalidatesTags: ["PrescriptionTemplate"],
    }),
  }),
});

// Export hooks
export const {
  useCreatePrescriptionTemplateMutation,
  useGetPrescriptionTemplatesQuery,
  useGetPrescriptionTemplateByIdQuery,
  useUpdatePrescriptionTemplateMutation,
  useDeletePrescriptionTemplateMutation,
  useSetDefaultTemplateMutation,
} = prescriptionTemplateApi;