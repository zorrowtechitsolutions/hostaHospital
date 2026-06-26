import { api } from "./api";

export const reviewApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getReviews: builder.query({
      query: () => "/review",
      providesTags: ["Reviews"],
    }),
  }),
});

export const {
  useGetReviewsQuery,
} = reviewApi;