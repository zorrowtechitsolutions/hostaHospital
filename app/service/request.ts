// app/service/request.ts - Booking/Request API service

import { api } from "./api";
import { getHospitalId } from "../../src/utils/auth";

// ================= TYPES =================

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
  userId?: number | string;
  
  // Patient fields (snake_case for backend)
  patient_name?: string;
  patient_dob?: string;
  patient_place?: string;
  patient_phone?: string;
  
  // Doctor fields
  doctorId?: string | number;
  displayName?: string;
  department?: string;
  
  // Appointment fields
  booking_date?: string;
  consulting_time?: string;
  reason?: string;
  status?: BookingStatus;
  
  // Keep old fields for backward compatibility (optional)
  patientId?: string;
  patientName?: string;
  age?: number;
  contact?: string;
  gender?: string;
  doctorName?: string;
  doctorSpecialty?: string;
  appointmentDate?: string;
  hospitalId?: string | number;
  token?: string | number;
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApproveBookingData {
  date: string;
  consulting_time: string;
  token: string | number;
  notes?: string;
}

export interface RejectBookingData {
  reason: string;
}

export interface BookingResponse {
  success: boolean;
  message: string;
  data?: BookingRequest | BookingRequest[];
}

export interface GetBookingsParams {
  id?: string | number;
  doctorId?: string | number;
  status?: BookingStatus;
}

// ================= API =================

export const bookingApi = api.injectEndpoints({
  endpoints: (builder) => ({

    // ================= GET BOOKINGS =================
    // Automatically adds hospitalId from authenticated user
    getBookings: builder.query<
      BookingResponse,
      GetBookingsParams | void
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        
        // Auto-inject hospitalId from auth
        const hospitalId = getHospitalId();
        if (hospitalId) {
          queryParams.append("hospitalId", String(hospitalId));
        }

        if (params?.doctorId) {
          queryParams.append("doctorId", String(params.doctorId));
        }

        if (params?.status) {
          queryParams.append("status", params.status);
        }

        const queryString = queryParams.toString();

        if (params?.id) {
          return `/booking/${params.id}${queryString ? `?${queryString}` : ""}`;
        }

        return `/booking${queryString ? `?${queryString}` : ""}`;
      },

      providesTags: (result, error, params) => {
        if (params?.id && result?.data && !Array.isArray(result.data)) {
          return [{ type: "Booking", id: params.id }];
        }
        return ["Booking"];
      },
    }),

    // ================= GET BOOKING BY ID =================
    getBookingById: builder.query<BookingResponse, string | number>({
      query: (id) => `/booking/${id}`,
      providesTags: (result, error, id) => [{ type: "Booking", id }],
    }),

    // ================= CREATE BOOKING =================
    // Automatically adds hospitalId from authenticated user
    createBooking: builder.mutation<
      BookingResponse,
      Partial<Omit<BookingRequest, 'hospitalId'>>
    >({
      query: (data) => {
        const hospitalId = getHospitalId();
        
        return {
          url: "/booking",
          method: "POST",
body: {
  userId: data.userId,
  patient_name: data.patient_name,
  patient_dob: data.patient_dob,
  patient_place: data.patient_place,
  patient_phone: data.patient_phone,
  doctorId: data.doctorId,
  displayName: data.displayName,
  department: data.department,
  booking_date: data.booking_date,
  consulting_time: data.consulting_time,  // ✅ This is included
  token: data.token,                       // ✅ This is included
  reason: data.reason,
  status: data.status || "accepted",
  hospitalId: hospitalId
},
};
      },
      invalidatesTags: ["Booking"],
    }),

    // ================= APPROVE BOOKING =================
    approveBooking: builder.mutation<
      BookingResponse,
      {
        id: string | number;
        data: ApproveBookingData;
      }
    >({
      query: ({ id, data }) => (
        console.log("Approving booking with data:", data), {
        url: `/booking/${id}`,
        method: "PUT",
        body: {
          date: data.date,
          consulting_time: data.consulting_time,
          token: data.token,
          notes: data.notes,
          status: "accepted",
        },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Booking", id },
        "Booking",
      ],
    }),

    // ================= REJECT BOOKING =================
    rejectBooking: builder.mutation<
      BookingResponse,
      {
        id: string | number;
        data: RejectBookingData;
      }
    >({
      query: ({ id, data }) => ({
        url: `/booking/${id}`,
        method: "PUT",
        body: {
      rejectionReason: data.reason,
      status: "declined",
    },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Booking", id },
        "Booking",
      ],
    }),

    // ================= CANCEL BOOKING =================
    cancelBooking: builder.mutation<
      BookingResponse,
      {
        id: string | number;
        reason?: string;
      }
    >({
      query: ({ id, reason }) => ({
        url: `/booking/${id}/cancel`,
        method: "PUT",
        body: {
          reason: reason || "Cancelled by hospital",
          status: "cancel",
        },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Booking", id },
        "Booking",
      ],
    }),

    // ================= COMPLETE BOOKING =================
    completeBooking: builder.mutation<
      BookingResponse,
      {
        id: string | number;
        notes?: string;
      }
    >({
      query: ({ id, notes }) => ({
        url: `/booking/${id}/complete`,
        method: "PUT",
        body: {
          notes: notes,
          status: "completed",
        },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Booking", id },
        "Booking",
      ],
    }),

    // ================= UPDATE BOOKING =================
    updateBooking: builder.mutation<
      BookingResponse,
      {
        id: string | number;
        data: Partial<Omit<BookingRequest, 'hospitalId'>>;
      }
    >({
      query: ({ id, data }) => (
        console.log(data, "Updating booking with data:"),
        {
        url: `/booking/${id}`,
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
        },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Booking", id },
        "Booking",
      ],
    }),

    // ================= DELETE BOOKING =================
    deleteBooking: builder.mutation<
      { message: string },
      string | number
    >({
      query: (id) => ({
        url: `/booking/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Booking"],
    }),

    // ================= GET BOOKINGS BY STATUS =================
    // Automatically adds hospitalId from authenticated user
    getBookingsByStatus: builder.query<
      BookingResponse,
      {
        doctorId?: string | number;
        status: BookingStatus;
      }
    >({
      query: ({ doctorId, status }) => {
        const queryParams = new URLSearchParams();
        
        // Auto-inject hospitalId from auth
        const hospitalId = getHospitalId();
        if (hospitalId) {
          queryParams.append("hospitalId", String(hospitalId));
        }
        
        if (doctorId) {
          queryParams.append("doctorId", String(doctorId));
        }
        
        queryParams.append("status", status);
        
        return `/booking?${queryParams.toString()}`;
      },
      providesTags: ["Booking"],
    }),
  }),
});

// ================= EXPORT HOOKS =================

export const {
  useGetBookingsQuery,
  useGetBookingByIdQuery,
  useCreateBookingMutation,
  useApproveBookingMutation,
  useRejectBookingMutation,
  useCancelBookingMutation,
  useCompleteBookingMutation,
  useUpdateBookingMutation,
  useDeleteBookingMutation,
  useGetBookingsByStatusQuery,
} = bookingApi;