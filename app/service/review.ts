import { api } from "./api";

export const reviewApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getReviews: builder.query({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();

        if (params.hospitalId) {
          searchParams.append("hospitalId", params.hospitalId);
        }

        if (params.doctorId) {
          searchParams.append("doctorId", params.doctorId);
        }

        return `/review?${searchParams.toString()}`;
      },
      providesTags: ["Reviews"],
    }),
  }),
});

export const { useGetReviewsQuery } = reviewApi;