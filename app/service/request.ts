// app/service/request.ts - Booking/Request API service
// UPDATED: completeBooking now uses bookingNumber as the primary identifier

import { api } from "./api";
import { getHospitalId, getAuthUser } from "../../src/utils/auth";

export type BookingStatus = 
  | "pending" 
  | "accepted" 
  | "declined" 
  | "rejected" 
  | "completed" 
  | "cancel";

export interface BookingRequest {
  id?: string | number;
  _id?: string;
  
  // ✅ bookingNumber is the primary identifier for all operations
  bookingNumber?: number;
  
  userId?: number | string;
  patient_name?: string;
  patient_dob?: string;
  patient_place?: string;
  patient_phone?: string;
  doctorId?: string | number;
  displayName?: string;
  department?: string;
  booking_date?: string;
  consulting_time?: string;
  reason?: string;
  status?: BookingStatus;
  patient_age?: number;
  patient_gender?: string;
  booking_status?: string;
  patientId?: string;
  patientName?: string;
  contact?: string;
  doctorName?: string;
  doctorSpecialty?: string;
  appointmentDate?: string;
  hospitalId?: string | number;
  hospitalName?: string;
  token?: string | number;  // ✅ Backend generates this
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApproveBookingData {
  date: string;
  consulting_time: string;
  // ❌ NO token field - backend generates it
  notes?: string;
}

export interface RejectBookingData {
  reason: string;
}

export interface BookingResponse {
  success: boolean;
  message: string;
  data?: BookingRequest | BookingRequest[];
  pagination?: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface GetBookingsParams {
  id?: string | number;
  bookingNumber?: number;
  userId?: string | number;
  hospitalId?: string | number;
  doctorId?: string | number;
  department?: string;
  phone?: string;
  status?: BookingStatus;
  doctor_name?: string;
  patient_name?: string;
  gender?: string;
  startDate?: string;
  endDate?: string;
  date?: string;
  search_query?: string;
  page?: number;
  limit?: number;
  skipHospitalFilter?: boolean;
}

export const bookingApi = api.injectEndpoints({
  overrideExisting: false,
  endpoints: (builder) => ({

    getBookings: builder.query<
      BookingResponse,
      GetBookingsParams
    >({
      query: (
        params: GetBookingsParams = {}
      ) => {
        const queryParams = new URLSearchParams();
        
        const skipHospitalFilter = params.skipHospitalFilter === true;
        
        if (!skipHospitalFilter) {
          const hospitalId = getHospitalId();
          if (hospitalId) {
            queryParams.append("hospitalId", String(hospitalId));
          }
        }

        if (params.hospitalId) {
          queryParams.set("hospitalId", String(params.hospitalId));
        }

        if (params.bookingNumber) {
          queryParams.append("bookingNumber", String(params.bookingNumber));
        }

        if (params.userId) {
          queryParams.append("userId", String(params.userId));
        }

        if (params.doctorId) {
          queryParams.append("doctorId", String(params.doctorId));
        }

        if (params.department) {
          queryParams.append("department", params.department);
        }

        if (params.phone) {
          queryParams.append("phone", params.phone);
        }

        if (params.status) {
          queryParams.append("status", params.status);
        }

        if (params.doctor_name) {
          queryParams.append("doctor_name", params.doctor_name);
        }

        if (params.patient_name) {
          queryParams.append("patient_name", params.patient_name);
        }

        if (params.gender) {
          queryParams.append("gender", params.gender);
        }

        if (params.startDate) {
          queryParams.append("startDate", params.startDate);
        }

        if (params.endDate) {
          queryParams.append("endDate", params.endDate);
        }

        if (params.date) {
          queryParams.append("date", params.date);
        }

        if (params.search_query) {
          queryParams.append("search_query", params.search_query);
        }

        queryParams.append("page", String(params.page || 1));
        queryParams.append("limit", String(params.limit || 10));

        if (params.id) {
          return `/booking/${params.id}?${queryParams.toString()}`;
        }

        return `/booking?${queryParams.toString()}`;
      },

      // ✅ providesTags with proper bookingNumber tracking
      providesTags: (result) => {
        const bookings = Array.isArray(result?.data)
          ? result.data
          : [];

        return [
          { type: "Booking", id: "LIST" },
          ...bookings
            .filter((booking) => booking.bookingNumber)
            .map((booking) => ({
              type: "Booking" as const,
              id: `number-${booking.bookingNumber}`,
            })),
        ];
      },
      
      transformResponse: (response: any) => {
        if (response && response.data) {
          return response;
        }
        
        if (Array.isArray(response)) {
          return {
            success: true,
            message: 'Bookings fetched successfully',
            data: response,
            pagination: {
              totalItems: response.length,
              totalPages: 1,
              currentPage: 1,
              limit: response.length,
              hasNextPage: false,
              hasPreviousPage: false
            }
          };
        }
        
        if (response && response.bookings && Array.isArray(response.bookings)) {
          return {
            success: true,
            message: 'Bookings fetched successfully',
            data: response.bookings,
            pagination: response.pagination || {
              totalItems: response.bookings.length,
              totalPages: 1,
              currentPage: 1,
              limit: response.bookings.length,
              hasNextPage: false,
              hasPreviousPage: false
            }
          };
        }
        
        if (response && response.rows && Array.isArray(response.rows)) {
          return {
            success: true,
            message: 'Bookings fetched successfully',
            data: response.rows,
            pagination: {
              totalItems: response.count || response.rows.length,
              totalPages: Math.ceil((response.count || response.rows.length) / 10),
              currentPage: 1,
              limit: 10,
              hasNextPage: false,
              hasPreviousPage: false
            }
          };
        }
        
        return response;
      },
    }),

    // ✅ Get by bookingNumber - route: /booking/{bookingNumber}
    getBookingByNumber: builder.query<BookingResponse, number>({
      query: (bookingNumber) => `/booking/${bookingNumber}`,
      providesTags: (result, error, bookingNumber) => [{ type: "Booking", id: `number-${bookingNumber}` }],
    }),

    // Keep this for backward compatibility but prefer bookingNumber
    getBookingById: builder.query<BookingResponse, string | number>({
      query: (id) => `/booking/${id}`,
      providesTags: (result, error, id) => [{ type: "Booking", id }],
    }),

    createBooking: builder.mutation<
      BookingResponse,
      Partial<BookingRequest>
    >({
      query: (data) => {
        const hospitalId = data.hospitalId ?? getHospitalId();

        const authUser = getAuthUser();

        const hospitalName =
          data.hospitalName ??
          authUser?.hospitalName ??
          (authUser?.name !== "Super Admin" ? authUser?.name : "");

        return {
          url: "/booking",
          method: "POST",
          body: {
            patient_name: data.patient_name,
            patient_dob: data.patient_dob,
            patient_place: data.patient_place,
            patient_phone: data.patient_phone,
            patient_age: data.patient_age,
            patient_gender: data.patient_gender,

            doctorId: data.doctorId,
            displayName: data.displayName,
            department: data.department,

            booking_date: data.booking_date,
            consulting_time: data.consulting_time,
            token: data.token,

            status: data.status || "accepted",
            booking_status: data.booking_status,

            hospitalId: hospitalId !== undefined && hospitalId !== null ? Number(hospitalId) : undefined,

            hospitalName: hospitalName,

            patientId: data.patientId,
            
            bookingNumber: data.bookingNumber,
          },
        };
      },

      invalidatesTags: ["Booking"],
    }),
    
    // ✅ APPROVE - route: /booking/{bookingNumber}
    // ✅ NO token in request - backend generates it
    approveBooking: builder.mutation<
      BookingResponse,
      {
        bookingNumber: number;
        data: ApproveBookingData;
      }
    >({
      query: ({ bookingNumber, data }) => ({
        url: `/booking/${bookingNumber}`, // ✅ Route: /booking/1001
        method: "PUT",
        body: {
          date: data.date,
          consulting_time: data.consulting_time,
          notes: data.notes || "",
          status: "accepted",
          // ❌ NO token - backend generates it
        },
      }),
      invalidatesTags: (result, error, { bookingNumber }) => [
        { type: "Booking", id: "LIST" },
        { type: "Booking", id: `number-${bookingNumber}` },
      ],
    }),

    // ✅ REJECT - route: /booking/{bookingNumber}
    rejectBooking: builder.mutation<
      BookingResponse,
      {
        bookingNumber: number;
        data: RejectBookingData;
      }
    >({
      query: ({ bookingNumber, data }) => ({
        url: `/booking/${bookingNumber}`, // ✅ Route: /booking/1001
        method: "PUT",
        body: {
          rejectionReason: data.reason,
          status: "declined",
        },
      }),
      invalidatesTags: (result, error, { bookingNumber }) => [
        { type: "Booking", id: "LIST" },
        { type: "Booking", id: `number-${bookingNumber}` },
      ],
    }),

    // ✅ CANCEL - route: /booking/{bookingNumber}/cancel
    cancelBooking: builder.mutation<
      BookingResponse,
      {
        bookingNumber: number;
        reason?: string;
      }
    >({
      query: ({ bookingNumber, reason }) => ({
        url: `/booking/${bookingNumber}/cancel`, // ✅ Route: /booking/1001/cancel
        method: "PUT",
        body: {
          reason: reason || "Cancelled by hospital",
          status: "cancel",
        },
      }),
      invalidatesTags: (result, error, { bookingNumber }) => [
        { type: "Booking", id: "LIST" },
        { type: "Booking", id: `number-${bookingNumber}` },
      ],
    }),

    // ✅ COMPLETE - route: /booking/{bookingNumber}/complete
    // ✅ FIXED: Uses bookingNumber as the primary identifier
    completeBooking: builder.mutation<
      BookingResponse,
      {
        bookingNumber: string | number;  // ✅ Changed from 'id' to 'bookingNumber'
        notes?: string;
      }
    >({
      query: ({ bookingNumber, notes }) => ({
        url: `/booking/${bookingNumber}/complete`, // ✅ Route: /booking/1/complete
        method: "PUT",
        body: {
          notes,
          status: "completed",
        },
      }),
      invalidatesTags: (result, error, { bookingNumber }) => [
        { type: "Booking", id: "LIST" },
        { type: "Booking", id: `number-${bookingNumber}` }, // ✅ Proper cache invalidation
      ],
    }),

    // ✅ UPDATE - route: /booking/{bookingNumber}
    updateBooking: builder.mutation<
      BookingResponse,
      {
        bookingNumber: number;
        data: Partial<Omit<BookingRequest, 'hospitalId' | 'hospitalName'>>;
      }
    >({
      query: ({ bookingNumber, data }) => ({
        url: `/booking/${bookingNumber}`, // ✅ Route: /booking/1001
        method: "PUT",
        body: {
          patient_name: data.patient_name,
          patient_phone: data.patient_phone,
          doctorId: data.doctorId,
          booking_date: data.booking_date,
          consulting_time: data.consulting_time,
          reason: data.reason,
          status: data.status,
          token: data.token,
          bookingNumber: data.bookingNumber,
        },
      }),
      invalidatesTags: (result, error, { bookingNumber }) => [
        { type: "Booking", id: "LIST" },
        { type: "Booking", id: `number-${bookingNumber}` },
      ],
    }),

    // ✅ DELETE - route: /booking/{bookingNumber}
    deleteBooking: builder.mutation<
      { message: string },
      number // bookingNumber
    >({
      query: (bookingNumber) => ({
        url: `/booking/${bookingNumber}`, // ✅ Route: /booking/1001
        method: "DELETE",
      }),
      invalidatesTags: ["Booking"],
    }),

    getBookingsByStatus: builder.query<
      BookingResponse,
      {
        doctorId?: string | number;
        status: BookingStatus;
        skipHospitalFilter?: boolean;
        bookingNumber?: number;
      }
    >({
      query: ({ doctorId, status, skipHospitalFilter, bookingNumber }) => {
        const queryParams = new URLSearchParams();
        
        if (!skipHospitalFilter) {
          const hospitalId = getHospitalId();
          if (hospitalId) {
            queryParams.append("hospitalId", String(hospitalId));
          }
        }
        
        if (doctorId) {
          queryParams.append("doctorId", String(doctorId));
        }
        
        if (bookingNumber) {
          queryParams.append("bookingNumber", String(bookingNumber));
        }
        
        queryParams.append("status", status);
        
        return `/booking?${queryParams.toString()}`;
      },
      providesTags: ["Booking"],
    }),
  }),
});

export const {
  useGetBookingsQuery,
  useGetBookingByIdQuery,
  useGetBookingByNumberQuery,
  useCreateBookingMutation,
  useApproveBookingMutation,
  useRejectBookingMutation,
  useCancelBookingMutation,
  useCompleteBookingMutation,  // ✅ Now uses bookingNumber
  useUpdateBookingMutation,
  useDeleteBookingMutation,
  useGetBookingsByStatusQuery,
} = bookingApi;