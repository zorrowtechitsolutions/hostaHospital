// app/service/request.ts - Booking/Request API service

import { api } from "./api";
import { getHospitalId, getAuthUser } from "../../src/utils/auth";

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
  patient_age?: number;
  patient_gender?: string;
  booking_status?: string;
  // Keep old fields for backward compatibility (optional)
  patientId?: string;
  patientName?: string;
  contact?: string;
  doctorName?: string;
  doctorSpecialty?: string;
  appointmentDate?: string;
  hospitalId?: string | number;
  hospitalName?: string;
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
  pagination?: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// ENHANCED GetBookingsParams with all filter options
export interface GetBookingsParams {
  id?: string | number;
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
  skipHospitalFilter?: boolean; // ✅ NEW: Allow skipping hospital filter
}

// ================= API =================

export const bookingApi = api.injectEndpoints({
  overrideExisting: false,
  endpoints: (builder) => ({

    // ================= GET BOOKINGS =================
    getBookings: builder.query<
      BookingResponse,
      GetBookingsParams
    >({
      query: (
        params: GetBookingsParams = {}
      ) => {
        const queryParams = new URLSearchParams();
        
        // ✅ FIX: Only auto-inject hospitalId if not skipped
        // Check if we should skip hospital filter
        const skipHospitalFilter = params.skipHospitalFilter === true;
        
        if (!skipHospitalFilter) {
          // Auto-inject hospitalId from auth (for hospital users)
          const hospitalId = getHospitalId();
          if (hospitalId) {
            queryParams.append("hospitalId", String(hospitalId));
          }
        }

        // Override if params has hospitalId (takes precedence)
        if (params.hospitalId) {
          queryParams.set("hospitalId", String(params.hospitalId));
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

        // Pagination
        queryParams.append("page", String(params.page || 1));
        queryParams.append("limit", String(params.limit || 10));

        // If fetching single booking by ID
        if (params.id) {
          return `/booking/${params.id}?${queryParams.toString()}`;
        }

        const url = `/booking?${queryParams.toString()}`;
        console.log('📡 GET BOOKINGS URL:', url);
        console.log('📡 GET BOOKINGS PARAMS:', queryParams.toString());
        
        return url;
      },

      providesTags: (result, error, params) => {
        if (params?.id && result?.data && !Array.isArray(result.data)) {
          return [{ type: "Booking", id: params.id }];
        }
        return ["Booking"];
      },
      
      // ✅ Add transformResponse to handle different response structures
      transformResponse: (response: any) => {
        console.log('📊 Transform Response - Raw:', response);
        
        // If response already has the expected structure
        if (response && response.data) {
          return response;
        }
        
        // If response is an array, wrap it
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
        
        // If response has bookings property
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
        
        // If response has rows property (sequelize format)
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

    // ================= GET BOOKING BY ID =================
    getBookingById: builder.query<BookingResponse, string | number>({
      query: (id) => `/booking/${id}`,
      providesTags: (result, error, id) => [{ type: "Booking", id }],
    }),

    // ================= CREATE BOOKING =================
    createBooking: builder.mutation<
      BookingResponse,
      Partial<Omit<BookingRequest, 'hospitalId' | 'hospitalName'>>
    >({
      query: (data) => {
        const hospitalId = getHospitalId();
        const authUser = getAuthUser();
        const hospitalName = authUser?.name || authUser?.hospitalName || '';
        
        console.log("🏥 Creating booking with:", {
          hospitalId,
          hospitalName,
          data
        });
        
        return {
          url: "/booking",
          method: "POST",
          body: {
            userId: data.userId,
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
            hospitalId: hospitalId,
            hospitalName: hospitalName,
            patientId: data.patientId
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
      query: ({ id, data }) => {
        console.log("Approving booking with data:", data);
        return {
          url: `/booking/${id}`,
          method: "PUT",
          body: {
            date: data.date,
            consulting_time: data.consulting_time,
            token: data.token,
            notes: data.notes,
            status: "accepted",
          },
        };
      },
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
        data: Partial<Omit<BookingRequest, 'hospitalId' | 'hospitalName'>>;
      }
    >({
      query: ({ id, data }) => {
        console.log(data, "Updating booking with data:");
        return {
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
        };
      },
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
    getBookingsByStatus: builder.query<
      BookingResponse,
      {
        doctorId?: string | number;
        status: BookingStatus;
        skipHospitalFilter?: boolean;
      }
    >({
      query: ({ doctorId, status, skipHospitalFilter }) => {
        const queryParams = new URLSearchParams();
        
        // Only add hospitalId if not skipped
        if (!skipHospitalFilter) {
          const hospitalId = getHospitalId();
          if (hospitalId) {
            queryParams.append("hospitalId", String(hospitalId));
          }
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