import {
  createApi,
  fetchBaseQuery,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";

interface RefreshResponse {
  token?: string;
  accessToken?: string;
}

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  credentials: "include",
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("accessToken");
    
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    
    headers.set("Content-Type", "application/json");
    
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);
  
  if (result.error && result.error.status === 401) {
    console.log("🔑 401 detected - Attempting refresh...");
    
    const refreshResult = await baseQuery(
      {
        url: "/hospital/refresh",
        method: "POST",
      },
      api,
      extraOptions
    );
    
    if (refreshResult.data) {
      const refreshData = refreshResult.data as RefreshResponse;
      const newToken = refreshData.token || refreshData.accessToken;
      
      if (newToken) {
        localStorage.setItem("accessToken", newToken);
        
        result = await baseQuery(
          {
            ...(typeof args === "string" ? { url: args } : args),
            headers: {
              ...(typeof args !== "string" ? args.headers : {}),
              Authorization: `Bearer ${newToken}`,
            },
          },
          api,
          extraOptions
        );
      } else {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/sign-in";
      }
    } else {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      window.location.href = "/sign-in";
    }
  }
  
  return result;
};

export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Hospital",
    "Staff",
    "Patient",
    "Appointment",
    "Doctor",
    "Department",
    "Booking",
    "Role",
    "RolePermission"
  ],
  endpoints: () => ({}),
});

// ================= BOOKING TYPES =================

export interface BookingRequest {
  id?: string | number;
  _id?: string;
  patientId?: string;
  patientName?: string;
  age?: number;
  contact?: string;
  gender?: string;
  doctorId?: string | number;
  doctorName?: string;
  doctorSpecialty?: string;
  department?: string;
  appointmentDate?: string;
  time?: string;
  reason?: string;
  status?: "pending" | "approved" | "rejected" | "cancelled";
  avatar?: string;
  email?: string;
  hospitalId?: string | number;
  token?: string | number;
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApproveBookingData {
  date: string;
  time: string;
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

// ================= BOOKING API ENDPOINTS =================

export const bookingApi = api.injectEndpoints({
  endpoints: (builder) => ({

    // GET BOOKINGS USING DOCTOR ID
    getBookingsByDoctor: builder.query<
      BookingResponse,
      { 
        doctorId: string | number; 
        status?: "pending" | "approved" | "rejected" | "cancelled";
        date?: string;
      }
    >({
      query: ({ doctorId, status, date }) => {
        const queryParams = new URLSearchParams();
        
        if (status) {
          queryParams.append("status", status);
        }
        
        if (date) {
          queryParams.append("date", date);
        }
        
        const queryString = queryParams.toString();
        return `/booking/doctor/${doctorId}${queryString ? `?${queryString}` : ""}`;
      },
      
      providesTags: (result, error, { doctorId }) => [
        { type: "Booking", id: `doctor-${doctorId}` }
      ],
    }),

    // APPROVE BOOKING
    approveBooking: builder.mutation<
      BookingResponse,
      {
        id: string | number;
        data: ApproveBookingData;
      }
    >({
      query: ({ id, data }) => ({
        url: `/booking/${id}/approve`,
        method: "PUT",
        body: {
          date: data.date,
          time: data.time,
          token: data.token,
          notes: data.notes,
        },
      }),

      invalidatesTags: (result, error, { id }) => [
        { type: "Booking", id }
      ],
    }),

    // REJECT BOOKING
    rejectBooking: builder.mutation<
      BookingResponse,
      {
        id: string | number;
        data: RejectBookingData;
      }
    >({
      query: ({ id, data }) => ({
        url: `/booking/${id}/reject`,
        method: "PUT",
        body: {
          reason: data.reason,
        },
      }),

      invalidatesTags: (result, error, { id }) => [
        { type: "Booking", id }
      ],
    }),
  }),
});

// ================= EXPORT HOOKS =================

export const {
  useGetBookingsByDoctorQuery,
  useApproveBookingMutation,
  useRejectBookingMutation,
} = bookingApi;

export default api;