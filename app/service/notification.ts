// src/app/service/notification.ts
import { api } from './api';

export interface Notification {
  id: number;
  title?: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  role?: string;
  hospitalId?: number;
  isRead?: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: number;
  userIds?: number[];
  hospitalIds?: number[];
  doctorIds?: number[];
  staffIds?: number[];
  pharmacyIds?: number[];
  labIds?: number[];
  superAdminIds?: number[];
  userReadStatus?: Record<string, boolean>;
  hospitalReadStatus?: Record<string, boolean>;
  doctorReadStatus?: Record<string, boolean>;
  staffReadStatus?: Record<string, boolean>;
  pharmacyReadStatus?: Record<string, boolean>;
  labReadStatus?: Record<string, boolean>;
  superAdminReadStatus?: Record<string, boolean>;
}

export interface CreateNotificationRequest {
  userIds?: number[];
  hospitalIds?: number[];
  doctorIds?: number[];
  staffIds?: number[];
  pharmacyIds?: number[];
  labIds?: number[];
  superAdminIds?: number[];
  message: string;
}

export interface UpdateNotificationRequest {
  title?: string;
  message?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  isRead?: boolean;
  hospitalReadStatus?: Record<string, boolean>;
}

export interface GetNotificationsParams {
  page?: number;
  limit?: number;
  role?: string;
  hospitalId?: number;
  isRead?: boolean;
}

export interface NotificationsResponse {
  success: boolean;
  data: Notification[] | { rows: Notification[]; count?: number };
  total: number;
  page: number;
  totalPages: number;
  pagination?: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

export interface SingleNotificationResponse {
  success: boolean;
  data: Notification;
}

export interface MarkReadResponse {
  success: boolean;
  message: string;
  data: {
    updatedCount: number;
  };
}

export interface RoleNotificationsResponse {
  success: boolean;
  data: Notification[] | { rows: Notification[]; count?: number };
  count?: number;
  error?: null;
}

export interface ToggleNotificationStatusResponse {
  success: boolean;
  message: string;
  notificationEnabled: boolean;
}

export const notificationApi = api.injectEndpoints({
  endpoints: (builder) => ({

    getNotifications: builder.query<NotificationsResponse, GetNotificationsParams>({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.limit) queryParams.append('limit', params.limit.toString());
        if (params.role) queryParams.append('role', params.role);
        if (params.hospitalId) queryParams.append('hospitalId', params.hospitalId.toString());
        if (params.isRead !== undefined) queryParams.append('isRead', params.isRead.toString());

        const queryString = queryParams.toString();
        return `/notification${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...(Array.isArray(result.data)
                ? result.data.map(({ id }) => ({ type: 'Notification' as const, id }))
                : []),
              { type: 'Notifications', id: 'LIST' },
            ]
          : [{ type: 'Notifications', id: 'LIST' }],
    }),

    getNotificationById: builder.query<SingleNotificationResponse, number>({
      query: (id) => `/notification/${id}`,
      providesTags: (result, error, id) => [{ type: 'Notification', id }],
    }),

    getNotificationsByRole: builder.query<
      NotificationsResponse,
      { role: string; id: number; page?: number; limit?: number }
    >({
      query: ({ role, id, page = 1, limit = 10 }) => ({
        url: `/notification/${role}/${id}`,
        method: "GET",
        params: { page, limit },
      }),
      providesTags: [{ type: "Notifications", id: "BY_ROLE" }],
    }),

    getReadNotifications: builder.query<RoleNotificationsResponse, { role: string; id: number }>({
      query: ({ role, id }) => `/notification/read/${role}/${id}`,
      providesTags: [{ type: 'Notifications', id: 'READ' }],
    }),

    getUnreadNotifications: builder.query<RoleNotificationsResponse, { role: string; id: number }>({
      query: ({ role, id }) => `/notification/unread/${role}/${id}`,
      providesTags: [{ type: 'Notifications', id: 'UNREAD' }],
    }),

    createNotification: builder.mutation<SingleNotificationResponse, CreateNotificationRequest>({
      query: (body) => ({
        url: '/notification',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Notifications', id: 'LIST' }],
    }),

    updateNotification: builder.mutation<SingleNotificationResponse, { id: number; body: UpdateNotificationRequest }>({
      query: ({ id, body }) => ({
        url: `/notification/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Notification', id },
        { type: 'Notifications', id: 'LIST' }
      ],
    }),

    markNotificationAsRead: builder.mutation<
      SingleNotificationResponse,
      { notificationId: number; role: string; userId: number }
    >({
      query: ({ notificationId, role, userId }) => ({
        url: `/notification/read/${role}/${userId}/${notificationId}`,
        method: 'PUT',
      }),
      invalidatesTags: (result, error, { notificationId }) => [
        { type: 'Notification', notificationId },
        { type: 'Notifications', id: 'LIST' },
        { type: 'Notifications', id: 'READ' },
        { type: 'Notifications', id: 'UNREAD' },
        { type: 'Notifications', id: 'BY_ROLE' },
      ],
    }),

    markAllNotificationsAsRead: builder.mutation<
      MarkReadResponse,
      { role: string; userId: number }
    >({
      query: ({ role, userId }) => ({
        url: `/notification/read-all/${role}/${userId}`,
        method: 'PUT',
      }),
      invalidatesTags: [
        { type: 'Notifications', id: 'LIST' },
        { type: 'Notifications', id: 'READ' },
        { type: 'Notifications', id: 'UNREAD' },
        { type: 'Notifications', id: 'BY_ROLE' },
      ],
    }),

    deleteNotification: builder.mutation<
      { success: boolean; message: string },
      { id: number; role: string; userId: number }
    >({
      query: ({ id, role, userId }) => ({
        url: `/notification/${id}/${role}/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Notification', id },
        { type: 'Notifications', id: 'LIST' },
        { type: 'Notifications', id: 'BY_ROLE' },
      ],
    }),

    deleteAllNotifications: builder.mutation<
      { success: boolean; message: string; data: { deletedCount: number } },
      { role: string; userId: number }
    >({
      query: ({ role, userId }) => ({
        url: `/notification/delete-all/${role}/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: [
        { type: 'Notifications', id: 'LIST' },
        { type: 'Notifications', id: 'BY_ROLE' },
      ],
    }),

    toggleNotificationStatus: builder.mutation<
      ToggleNotificationStatusResponse,
      void
    >({
      query: () => ({
        url: 'auth/notification/toggle',
        method: 'PUT',
      }),
      invalidatesTags: [
        { type: 'Notifications', id: 'LIST' },
      ],
    }),

  }),
  overrideExisting: false,
});

export const {
  useGetNotificationsQuery,
  useGetNotificationByIdQuery,
  useGetNotificationsByRoleQuery,
  useGetReadNotificationsQuery,
  useGetUnreadNotificationsQuery,
  useCreateNotificationMutation,
  useUpdateNotificationMutation,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useDeleteNotificationMutation,
  useDeleteAllNotificationsMutation,
  useToggleNotificationStatusMutation,
} = notificationApi;