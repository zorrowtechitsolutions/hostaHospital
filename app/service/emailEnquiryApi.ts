// src/app/service/emailEnquiryApi.ts
import { api } from "./api";

export interface CreateEnquiryRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface EnquiryResponse {
  success: boolean;
  message: string;
  data?: {
    id?: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    status?: string;
    createdAt?: string;
  };
}

export const emailEnquiryApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createEnquiry: builder.mutation<EnquiryResponse, CreateEnquiryRequest>({
      query: (data) => ({
        url: "/email-enquiry",
        method: "POST",
        body: data,
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useCreateEnquiryMutation,
} = emailEnquiryApi;