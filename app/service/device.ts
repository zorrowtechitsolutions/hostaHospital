// app/service/device.ts

import { api } from "./api";
import { getAuthUser } from "../../src/utils/auth";

// ==============================
// TYPES
// ==============================

export interface RfidDevice {
  id?: string | number;
  _id?: string;
  hospitalId: string | number;
  deviceId: string;
  deviceName: string;
  location: string;
  locationImage?: string | null;
  deviceType: string; // "RFID" | "NFC" | "Biometric"
  status?: string; // "Active" | "Disabled" | "Unregistered"
  apiKey?: string;
  unregisteredAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface GetDevicesParams {
  hospitalId?: string | number;
  status?: string;
  type?: string;
  location?: string;
  search?: string;
  page?: number;
  limit?: number;
  skipHospitalFilter?: boolean;
}

export interface DevicesResponse {
  success?: boolean;
  message?: string;
  data?: RfidDevice[];
  error?: string;
}

// Register device payload
export interface RegisterDevicePayload {
  hospitalId: number;
  deviceId: string;
  deviceName: string;
  location: string;
  locationImage?: string;
  deviceType: "face" | "rfid" | "fingerprint";
  description?: string;
}

// Credentials returned on register / restore / regenerate
export interface DeviceCredentials {
  apiKey: string;
  secretKey: string;
  warning?: string;
}

export interface RegisterDeviceResponse {
  success?: boolean;
  message?: string;
  data?: RfidDevice;
  credentials?: DeviceCredentials;
  error?: string;
}

// Update device payload
export interface UpdateDevicePayload {
  deviceName?: string;
  location?: string;
  locationImage?: string;
  deviceType?: string;
  status?: string;
}

export interface UpdateDeviceResponse {
  success?: boolean;
  message?: string;
  data?: RfidDevice;
  error?: string;
}

export interface GenericDeviceResponse {
  success?: boolean;
  message?: string;
  data?: RfidDevice;
  credentials?: DeviceCredentials;
  error?: string;
}

// ==============================
// HELPER: Get hospital ID from auth
// ==============================

const getHospitalIdFromAuth = (auth: any): string | number | null => {
  if (!auth) return null;

  // Priority 1: Use hospitalId if available (this is the correct hospital ID)
  if (auth.hospitalId) {
    return auth.hospitalId;
  }

  return null;
};

// ==============================
// DEVICE API
// ==============================

export const deviceApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // ==============================
    // GET ALL DEVICES - Server-side filtering
    // ==============================

    getDevices: builder.query<DevicesResponse, GetDevicesParams>({
      query: (params: GetDevicesParams = {}) => {
        const auth = getAuthUser();
        const queryParams = new URLSearchParams();

        // Determine if user is super admin
        const isSuperAdmin = auth?.role === "super-admin";
        const shouldSkipFilter = params.skipHospitalFilter === true;

        // Get hospital ID using helper
        let hospitalIdToUse = null;

        // For non-super-admin users, always filter by hospital if they have one
        if (!isSuperAdmin && !shouldSkipFilter) {
          hospitalIdToUse = getHospitalIdFromAuth(auth);

          if (!hospitalIdToUse) {
            hospitalIdToUse = params.hospitalId;
          }

          if (hospitalIdToUse) {
            queryParams.append("hospitalId", String(hospitalIdToUse));
          } else {
            console.warn("⚠️ No hospital ID found for filtering devices");
          }
        }
        // Super Admin with specific hospital filter
        else if (isSuperAdmin && params.hospitalId) {
          queryParams.append("hospitalId", String(params.hospitalId));
        }
        // Use provided hospitalId if specified
        else if (params.hospitalId) {
          queryParams.append("hospitalId", String(params.hospitalId));
        }

        // Status filter (Active / Disabled / Unregistered)
        if (params.status) {
          queryParams.append("status", params.status);
        }

        // Device type filter (RFID / NFC / Biometric)
        if (params.type) {
          queryParams.append("type", params.type);
        }

        // Location filter
        if (params.location) {
          queryParams.append("location", params.location);
        }

        // Search filter (name / deviceId / location)
        if (params.search?.trim()) {
          queryParams.append("search", params.search.trim());
        }

        // Pagination (optional, backend currently returns all)
        if (params.page) {
          queryParams.append("page", String(params.page));
        }
        if (params.limit) {
          queryParams.append("limit", String(params.limit));
        }

        const url = `/devices?${queryParams.toString()}`;
        return url;
      },

      providesTags: ["Device"],
    }),

    // ==============================
    // GET SINGLE DEVICE BY ID
    // ==============================

    getDeviceById: builder.query<GenericDeviceResponse, string | number>({
      query: (id) => `/devices/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Device", id }],
    }),

    // ==============================
    // REGISTER NEW DEVICE
    // ==============================

    registerDevice: builder.mutation<
      RegisterDeviceResponse,
      RegisterDevicePayload
    >({
      query: (body) => ({
        url: `/devices/register`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Device"],
    }),

    // ==============================
    // UPDATE DEVICE
    // ==============================

    updateDevice: builder.mutation<
      UpdateDeviceResponse,
      { id: string | number; body: UpdateDevicePayload }
    >({
      query: ({ id, body }) => ({
        url: `/devices/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Device"],
    }),

    // ==============================
    // UNREGISTER DEVICE (Soft delete)
    // ==============================

    unregisterDevice: builder.mutation<GenericDeviceResponse, string | number>({
      query: (id) => ({
        url: `/devices/${id}/unregister`,
        method: "PUT",
      }),
      invalidatesTags: ["Device"],
    }),

    // ==============================
    // RESTORE DEVICE (with new credentials)
    // ==============================

    restoreDevice: builder.mutation<GenericDeviceResponse, string | number>({
      query: (id) => ({
        url: `/devices/${id}/restore`,
        method: "PUT",
      }),
      invalidatesTags: ["Device"],
    }),

    // ==============================
    // PERMANENTLY DELETE DEVICE
    // Only allowed for unregistered devices
    // ==============================

    permanentlyDeleteDevice: builder.mutation<
      GenericDeviceResponse,
      string | number
    >({
      query: (id) => ({
        url: `/devices/${id}/permanent`,
        method: "DELETE",
      }),
      invalidatesTags: ["Device"],
    }),

    // ==============================
    // REGENERATE CREDENTIALS
    // For Active / Disabled devices only
    // ==============================

    regenerateCredentials: builder.mutation<
      GenericDeviceResponse,
      string | number
    >({
      query: (id) => ({
        url: `/devices/${id}/regenerate-credentials`,
        method: "PUT",
      }),
      invalidatesTags: ["Device"],
    }),
  }),
});

// ==============================
// EXPORT HOOKS
// ==============================

export const {
  useGetDevicesQuery,
  useGetDeviceByIdQuery,
  useRegisterDeviceMutation,
  useUpdateDeviceMutation,
  useUnregisterDeviceMutation,
  useRestoreDeviceMutation,
  usePermanentlyDeleteDeviceMutation,
  useRegenerateCredentialsMutation,
} = deviceApi;