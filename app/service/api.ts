import {
  createApi,
  fetchBaseQuery,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";

import {
  getToken,
  setToken,
  clearAuth,
  isTokenExpired,
} from "../../src/utils/auth";

/*
|--------------------------------------------------------------------------
| Base Query
|--------------------------------------------------------------------------
*/

const baseQuery = fetchBaseQuery({
  baseUrl:
    import.meta.env.VITE_API_URL ||
    "http://localhost:5173/api",

  /*
   * IMPORTANT:
   * This allows the browser to send the HttpOnly
   * refreshToken cookie to /auth/refresh.
   */
  credentials: "include",

  prepareHeaders: (headers, { arg }) => {
    const token = getToken();

    const url =
      typeof arg === "string"
        ? arg
        : arg?.url || "";

    /*
     * These requests don't need the access token.
     */
    const isPublicRequest =
      url === "/auth/login" ||
      url === "/auth/login/phone" ||
      url === "/auth/refresh" ||
      url === "/auth/otp" ||
      url === "/auth/send-otp" ||
      url === "/auth/verify-otp" ||
      url === "/auth/reset-password";

    /*
     * Add access token to protected requests.
     */
    if (token && !isPublicRequest) {
      headers.set(
        "Authorization",
        `Bearer ${token}`
      );
    }

    return headers;
  },
});


/*
|--------------------------------------------------------------------------
| Refresh Response
|--------------------------------------------------------------------------
*/

interface RefreshResponse {
  accessToken?: string;
  token?: string;
}


/*
|--------------------------------------------------------------------------
| Public (auth) request URLs
|--------------------------------------------------------------------------
*/

const PUBLIC_AUTH_URLS = [
  "/auth/login",
  "/auth/login/phone",
  "/auth/refresh",
  "/auth/otp",
  "/auth/send-otp",
  "/auth/verify-otp",
  "/auth/reset-password",
];

const isPublicAuthUrl = (
  url: string | undefined
): boolean => {
  if (!url) return false;
  return PUBLIC_AUTH_URLS.includes(url);
};


/*
|--------------------------------------------------------------------------
| Base Query With Reauthentication
|--------------------------------------------------------------------------
|
| Flow (proactive + reactive):
|
| Request starts
|   ├── token valid ──→ API
|   └── token expired
|          ↓
|       refresh
|          ↓
|       API
|
| Plus reactive safety net:
|
| API
|  ↓
| 401
|  ↓
| refresh
|  ↓
| retry API
|
|--------------------------------------------------------------------------
*/

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (
  args,
  api,
  extraOptions
) => {
  const requestUrl =
    typeof args === "string"
      ? args
      : args.url;

  /*
  |--------------------------------------------------------------------------
  | Never refresh auth endpoints
  |--------------------------------------------------------------------------
  */

  if (isPublicAuthUrl(requestUrl)) {
    return baseQuery(
      args,
      api,
      extraOptions
    );
  }

  /*
  |--------------------------------------------------------------------------
  | 1. Check access token BEFORE request
  |--------------------------------------------------------------------------
  */

  const token = getToken();

  if (token && isTokenExpired()) {
    console.log(
      "⏰ Access token already expired. Refreshing..."
    );

    const refreshResult =
      await baseQuery(
        {
          url: "/auth/refresh",
          method: "POST",
        },
        api,
        extraOptions
      );

    if (refreshResult.data) {
      const data =
        refreshResult.data as RefreshResponse;

      const newAccessToken =
        data.accessToken ||
        data.token;

      if (newAccessToken) {
        console.log(
          "✅ Access token refreshed before request"
        );

        setToken(newAccessToken);
      } else {
        console.log(
          "❌ Refresh response has no access token"
        );

        clearAuth();

        return {
          error: {
            status: 401,
            data: {
              message:
                "Session expired. Please login again.",
            },
          },
        };
      }
    } else {
      console.log(
        "❌ Refresh request failed"
      );

      clearAuth();

      return {
        error: {
          status: 401,
          data: {
            message:
              "Session expired. Please login again.",
          },
        },
      };
    }
  }

  /*
  |--------------------------------------------------------------------------
  | 2. Make original request
  |--------------------------------------------------------------------------
  */

  let result = await baseQuery(
    args,
    api,
    extraOptions
  );

  /*
  |--------------------------------------------------------------------------
  | 3. Request succeeded
  |--------------------------------------------------------------------------
  */

  if (!result.error) {
    return result;
  }

  /*
  |--------------------------------------------------------------------------
  | 4. If not 401, return original error
  |--------------------------------------------------------------------------
  */

  if (result.error.status !== 401) {
    return result;
  }

  /*
  |--------------------------------------------------------------------------
  | 5. Access token rejected by backend
  |--------------------------------------------------------------------------
  */

  console.log(
    "🔄 API returned 401. Trying refresh..."
  );

  /*
  |--------------------------------------------------------------------------
  | 6. Refresh using HttpOnly cookie
  |--------------------------------------------------------------------------
  */

  const refreshResult =
    await baseQuery(
      {
        url: "/auth/refresh",
        method: "POST",
      },
      api,
      extraOptions
    );

  /*
  |--------------------------------------------------------------------------
  | 7. Refresh successful
  |--------------------------------------------------------------------------
  */

  if (refreshResult.data) {
    const data =
      refreshResult.data as RefreshResponse;

    const newAccessToken =
      data.accessToken ||
      data.token;

    if (newAccessToken) {
      console.log(
        "✅ New access token received"
      );

      setToken(newAccessToken);

      /*
      |--------------------------------------------------------------------------
      | 8. Retry original request
      |--------------------------------------------------------------------------
      */

      console.log(
        "🔁 Retrying original request..."
      );

      result = await baseQuery(
        args,
        api,
        extraOptions
      );

      return result;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | 9. Refresh failed
  |--------------------------------------------------------------------------
  */

  console.log(
    "❌ Refresh failed. Logging out."
  );

  clearAuth();

  return {
    error: {
      status: 401,
      data: {
        message:
          "Session expired. Please login again.",
      },
    },
  };
};


/*
|--------------------------------------------------------------------------
| API
|--------------------------------------------------------------------------
*/

export const api = createApi({

  reducerPath: "api",

  baseQuery:
    baseQueryWithReauth,

  tagTypes: [
    "Hospital",
    "Staff",
    "Patient",
    "Appointment",
    "Doctor",
    "Department",
    "Ambulance",
    "BloodBank",
    "Booking",
    "Role",
    "RolePermission",
    "S3",
    "Prescription",
    "speciality",
    "Vitals",
    "PrescriptionTemplate",
    "Permission",
    "Notification",
    "Notifications",
    "Ads",
    "Document",
    "LabResult",
    "Reviews",
    "Category",
    "emailEnquiry",
    "Users",
    "Donor",
    "Email",
    "Template",
    "SessionHistory",
  ],

  endpoints: () => ({}),
});


export default api;