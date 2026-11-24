
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface PostOffice {
  Name: string;
  District: string;
  State: string;
  Pincode: string;
  Block?: string;
  Country?: string;
}

export interface PincodeResponse {
  Status: string;
  Message: string;
  PostOffice: PostOffice[] | null;
}

export const pincodeApi = createApi({
  reducerPath: "pincodeApi",

  baseQuery: fetchBaseQuery({
    baseUrl: "https://api.postalpincode.in/",
  }),

  endpoints: (builder) => ({
    getPincode: builder.query<PincodeResponse[], string>({
      query: (pincode) => `pincode/${pincode}`,
      keepUnusedDataFor: 300,
    }),
  }),
});

export const {
  useGetPincodeQuery,
} = pincodeApi;
