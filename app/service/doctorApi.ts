// src/app/service/doctorApi.ts
import { api } from "./api";
import { getAuthUser, JwtPayload } from "../../src/utils/auth";

// ==============================
// TYPES
// ==============================

export interface Doctor {
  id?: string;
  authId?: string;        // User ID from Auth table
  userId?: string;        // Alias for authId
  name: string;
  email: string;
  password?: string;
  phone?: string;
  speciality?: string;
  qualification?: string;
  experience?: number;
  gender?: string;
  image?: string;
  about?: string;
  hospitalId?: string;
  hospitalName?: string;
  createdAt?: string;
  updatedAt?: string;
  appointmentCount?: number;
  autoDecline?: number;
  status?: string | boolean;
  isDelete?: boolean;
  isActive?: boolean;
}

export interface LoginDoctorData {
  email: string;
  password: string;
  fcmToken?: string;
}

export interface DoctorAuthResponse {
  success?: boolean;
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  doctor?: Doctor;
  data?: Doctor;
  message?: string;
  error?: string;
  authId?: string;
  hospitalId?: string;
  role?: string;
}

export interface GetDoctorsParams {
  hospitalId?: string | number;
  name?: string;
  speciality?: string;
  status?: string | number | boolean;
  search_query?: string;
  page?: number;
  limit?: number;
  skipHospitalFilter?: boolean;
}

type AddDoctorPayload = Omit<Doctor, "hospitalId"> & {
  hospitalId?: number | string;
};

export interface Department {
  id: string;
  name: string;
  description?: string;
  hospitalId?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface SpecialityResponse {
  success?: boolean;
  message?: string;
  data?: {
    count: number;
    rows: Department[];
  };
}

// ============================================
// AUTH / PASSWORD MANAGEMENT TYPES
// ============================================

export interface SendOtpData {
  email: string;
}

export interface VerifyOtpData {
  email: string;
  otp: string;
}

export interface ResetPasswordData {
  email: string;
  newPassword: string;
}

interface ChangePasswordData {
  doctorId: string;
  newPassword: string;
  confirmPassword: string;
}

export interface OtpResponse {
  success?: boolean;
  message?: string;
  error?: string;
}

export interface ResetPasswordResponse {
  success?: boolean;
  message?: string;
  error?: string;
}

export interface ChangePasswordResponse {
  success?: boolean;
  message?: string;
  error?: string;
}

// ============================================
// HELPER: Store dual IDs in localStorage
// ============================================

const storeDoctorIds = (response: DoctorAuthResponse) => {
  const token = response.token || response.accessToken;
  if (token) {
    localStorage.setItem("accessToken", token);
  }
  if (response.refreshToken) {
    localStorage.setItem("refreshToken", response.refreshToken);
  }

  const doctor = response.doctor || response.data;
  
  let authId = response.authId || '';
  
  if (!authId && doctor) {
    authId = doctor.authId || doctor.userId || doctor.id || '';
  }
  
  if (authId) {
    localStorage.setItem("authId", authId);
    localStorage.setItem("userId", authId);
    localStorage.setItem("doctorId", authId);
  }

  let hospitalId = response.hospitalId || '';
  
  if (!hospitalId && doctor?.hospitalId) {
    hospitalId = String(doctor.hospitalId);
  }
  
  if (hospitalId) {
    localStorage.setItem("hospitalId", hospitalId);
  }

  const role = response.role || 'doctor';
  localStorage.setItem("userRole", role);

  const userData = {
    authId: authId,
    hospitalId: hospitalId,
    id: doctor?.id || authId,
    name: doctor?.name || '',
    email: doctor?.email || '',
    role: role,
  };
  localStorage.setItem("userData", JSON.stringify(userData));
  
  const authData = {
    authId: authId,
    hospitalId: hospitalId,
    id: doctor?.id || authId,
    role: role,
  };
  localStorage.setItem("authData", JSON.stringify(authData));

  console.log('✅ Doctor IDs stored:', { authId, hospitalId });
};

// ============================================
// HELPER: Get current user with proper IDs from JWT
// ============================================

const getCurrentUser = (): JwtPayload | null => {
  const auth = getAuthUser();
  if (!auth) return null;
  return auth;
};

// ============================================
// HELPER: Get hospitalId from JWT or localStorage
// ============================================

const getHospitalId = (): string | null => {
  const auth = getAuthUser();
  
  if (auth?.hospitalId) {
    return String(auth.hospitalId);
  }
  
  const hospitalId = localStorage.getItem('hospitalId');
  if (hospitalId) {
    return hospitalId;
  }
  
  return null;
};

// ============================================
// HELPER: Get authId (user ID) from JWT or localStorage
// ============================================

const getAuthId = (): string | null => {
  const auth = getAuthUser();
  
  if (auth?.id) {
    return String(auth.id);
  }
  
  const authId = localStorage.getItem('authId');
  if (authId) {
    return authId;
  }
  
  return null;
};

// ============================================
// HELPER: Get stored IDs from localStorage
// ============================================

const getStoredIds = () => {
  const authId = localStorage.getItem('authId') || '';
  const hospitalId = localStorage.getItem('hospitalId') || '';
  return { authId, hospitalId };
};

export const doctorApi = api.injectEndpoints({
  endpoints: (builder) => ({

    // ============================================
    // GET DOCTORS - /doctor with hospital filtering
    // ============================================
    getDoctors: builder.query({
      query: (params: GetDoctorsParams = {}) => {
        const auth = getCurrentUser();
        const queryParams = new URLSearchParams();

        const shouldSkipFilter = params.skipHospitalFilter === true;
        const shouldFilterByHospital = !shouldSkipFilter;

        if (shouldFilterByHospital) {
          const hospitalId = getHospitalId();
          if (hospitalId) {
            queryParams.append("hospitalId", String(hospitalId));
          }
        } else if (params.hospitalId) {
          queryParams.append("hospitalId", String(params.hospitalId));
        }

        if (params.name) {
          queryParams.append("name", params.name);
        }

        if (params.speciality) {
          queryParams.append("speciality", params.speciality);
        }

        if (params.status !== undefined && params.status !== null && params.status !== '') {
          queryParams.append("status", String(params.status));
        }

        if (params.search_query) {
          queryParams.append("search_query", params.search_query);
        }

        queryParams.append("page", String(params.page || 1));
        queryParams.append("limit", String(params.limit || 10));

        const url = `/doctor?${queryParams.toString()}`;
        return url;
      },
      providesTags: ["Doctor"],
    }),

    // ============================================
    // GET SPECIALITIES - /speciality
    // ============================================
    getSpecialities: builder.query<SpecialityResponse, void>({
      query: () => {
        return `/speciality`;
      },
      providesTags: ["speciality"],
    }),

    // ============================================
    // GET DOCTOR BY ID - /doctor/:id
    // ============================================
    getDoctorById: builder.query<DoctorAuthResponse, string>({
      query: (id) => `/doctor/${id}`,
      providesTags: (result, error, id) => [{ type: "Doctor", id }],
    }),

    // ============================================
    // LOGIN DOCTOR - /doctor/login
    // ============================================
    loginDoctor: builder.mutation<DoctorAuthResponse, LoginDoctorData>({
      query: (logUser) => ({
        url: "/doctor/login",
        method: "POST",
        body: logUser,
      }),

      transformResponse: (response: DoctorAuthResponse) => {
        storeDoctorIds(response);
        return response;
      },

      invalidatesTags: ["Doctor"],
    }),

    // ============================================
    // LOGOUT DOCTOR - /doctor/logout/:authId
    // ============================================
    logoutDoctor: builder.mutation<{ message: string }, { deviceId?: string } | void>({
      query: (params) => {
        const { authId } = getStoredIds();
        
        let url = `/doctor/logout/${authId || 'unknown'}`;
        let body: any = {
          deviceId: params?.deviceId || localStorage.getItem('deviceId') || '',
        };
        
        return {
          url: url,
          method: "POST",
          body: body,
        };
      },

      onQueryStarted: async (_arg, { queryFulfilled }) => {
        try {
          await queryFulfilled;
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          const localStorageItems = [
            'accessToken',
            'refreshToken',
            'roleId',
            'userRole',
            'userData',
            'authData',
            'permissions',
            'deviceId',
            'hospitalId',
            'authId',
            'userId',
            'doctorId',
            'staffId',
            'staffNumericId',
            'user',
            'token',
            'refresh_token'
          ];
          
          localStorageItems.forEach(key => {
            localStorage.removeItem(key);
          });
          
          sessionStorage.clear();
        }
      },
    }),

    // ============================================
    // REFRESH DOCTOR TOKEN
    // ============================================
    refreshDoctor: builder.mutation<DoctorAuthResponse, void>({
      query: () => ({
        url: "/auth/refresh",
        method: "POST",
      }),

      transformResponse: (response: DoctorAuthResponse) => {
        const token = response.token || response.accessToken;
        if (token) {
          localStorage.setItem("accessToken", token);
        }
        if (response.refreshToken) {
          localStorage.setItem("refreshToken", response.refreshToken);
        }
        return response;
      },

      invalidatesTags: ["Doctor"],
    }),

    // ============================================
    // SEND OTP - /doctor/auth/send-otp
    // ============================================
    sendDoctorOtp: builder.mutation<OtpResponse, SendOtpData>({
      query: (otpData) => ({
        url: `auth/send-otp`,
        method: "POST",
        body: otpData,
      }),
      transformResponse: (response: OtpResponse) => {
        return response;
      },
      transformErrorResponse: (response: { status: number; data?: any }) => {
        return {
          status: response.status,
          message: response.data?.message || "Failed to send OTP",
        };
      },
    }),

    // ============================================
    // VERIFY OTP - /doctor/auth/verify-otp
    // ============================================
    verifyDoctorOtp: builder.mutation<OtpResponse, VerifyOtpData>({
      query: (otpData) => ({
        url: `auth/verify-otp`,
        method: "POST",
        body: otpData,
      }),
      transformResponse: (response: OtpResponse) => {
        return response;
      },
      transformErrorResponse: (response: { status: number; data?: any }) => {
        return {
          status: response.status,
          message: response.data?.message || "Invalid OTP",
        };
      },
    }),

    // ============================================
    // RESET PASSWORD - /doctor/auth/reset-password
    // ============================================
    resetDoctorPassword: builder.mutation<ResetPasswordResponse, ResetPasswordData>({
      query: (resetData) => ({
        url: `auth/reset-password`,
        method: "POST",
        body: resetData,
      }),
      transformResponse: (response: ResetPasswordResponse) => {
        return response;
      },
      transformErrorResponse: (response: { status: number; data?: any }) => {
        return {
          status: response.status,
          message: response.data?.message || "Failed to reset password",
        };
      },
    }),

    // ============================================
    // CHANGE PASSWORD - /doctor/auth/change-password/:authId
    // ============================================
    changeDoctorPassword: builder.mutation<
  ChangePasswordResponse,
  ChangePasswordData
>({
  query: ({ doctorId, newPassword, confirmPassword }) => ({
    url: `/doctor/auth/change-password/${doctorId}`,
    method: "PUT",
    body: {
      newPassword,
      confirmPassword,
    },
  }),
  invalidatesTags: ["Doctor"],
}),

    // ============================================
    // ADD NEW DOCTOR - /doctor (POST)
    // ============================================
    addNewDoctor: builder.mutation<DoctorAuthResponse, AddDoctorPayload>({
      query: ({ hospitalId, ...newDoctor }) => {
        const auth = getCurrentUser();
        const defaultHospitalId = getHospitalId();

        return {
          url: "/doctor",
          method: "POST",
          body: {
            ...newDoctor,
            hospitalId: hospitalId ?? defaultHospitalId ?? auth?.id,
            hospitalName: newDoctor.hospitalName ?? auth?.hospitalName ?? "",
          },
        };
      },
      invalidatesTags: ["Doctor"],
    }),

    // ============================================
    // UPDATE DOCTOR - /doctor/:id (PUT)
    // ============================================
    updateDoctor: builder.mutation<Doctor, { id: string; updateDoctor: Partial<Doctor> }>({
      query: ({ id, updateDoctor }) => ({
        url: `/doctor/${id}`,
        method: "PUT",
        body: updateDoctor,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Doctor", id },
        "Doctor",
      ],
    }),

    // ============================================
    // DELETE DOCTOR - /doctor/:id (DELETE)
    // ============================================
    deleteDoctor: builder.mutation<{ message: string }, string>({
      query: (doctorId) => ({
        url: `/doctor/${doctorId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, doctorId) => [
        { type: "Doctor", doctorId },
        "Doctor",
      ],
    }),

    // ============================================
    // RECOVER DOCTOR - /doctor/recover/:id
    // ============================================
    recoverDoctor: builder.mutation<{ message: string }, string>({
      query: (doctorId) => ({
        url: `/doctor/recover/${doctorId}`,
        method: "PUT",
      }),
      invalidatesTags: (result, error, doctorId) => [
        { type: "Doctor", doctorId },
        "Doctor",
      ],
    }),
  }),

  overrideExisting: false,
});

export const {
  useGetDoctorsQuery,
  useGetDoctorByIdQuery,
  useLoginDoctorMutation,
  useLogoutDoctorMutation,
  useRefreshDoctorMutation,
  useAddNewDoctorMutation,
  useUpdateDoctorMutation,
  useDeleteDoctorMutation,
  useRecoverDoctorMutation,
  useGetSpecialitiesQuery,
  useSendDoctorOtpMutation,
  useVerifyDoctorOtpMutation,
  useResetDoctorPasswordMutation,
  useChangeDoctorPasswordMutation,
} = doctorApi;