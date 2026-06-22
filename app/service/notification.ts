// src/app/service/notification.ts
import { api } from './api';

// Types
export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  role?: string;
  hospitalId?: number;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: number;
}

export interface CreateNotificationRequest {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  role?: string;
  hospitalId?: number;
}

export interface UpdateNotificationRequest {
  title?: string;
  message?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  role?: string;
  hospitalId?: number;
  isRead?: boolean;
}

export interface GetNotificationsParams {
  page?: number;
  role?: string;
  hospitalId?: number;
  isRead?: boolean;
}

export interface NotificationsResponse {
  success: boolean;
  data: Notification[];
  total: number;
  page: number;
  totalPages: number;
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

// Inject notification endpoints into the existing API
export const notificationApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // GET /notification - Get all notifications with filters
    getNotifications: builder.query<NotificationsResponse, GetNotificationsParams>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.role) queryParams.append('role', params.role);
        if (params.hospitalId) queryParams.append('hospitalId', params.hospitalId.toString());
        if (params.isRead !== undefined) queryParams.append('isRead', params.isRead.toString());
        
        const queryString = queryParams.toString();
        return `/notification${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: (result) => 
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Notification' as const, id })),
              { type: 'Notifications', id: 'LIST' },
            ]
          : [{ type: 'Notifications', id: 'LIST' }],
    }),

    // GET /notification/:id - Get single notification by ID
    getNotificationById: builder.query<SingleNotificationResponse, number>({
      query: (id) => `/notification/${id}`,
      providesTags: (result, error, id) => [{ type: 'Notification', id }],
    }),

    // GET /notification/role/:role - Get notifications by role
    getNotificationsByRole: builder.query<NotificationsResponse, { role: string; page?: number; limit?: number }>({
      query: ({ role, page, limit }) => {
        const queryParams = new URLSearchParams();
        if (page) queryParams.append('page', page.toString());
        const queryString = queryParams.toString();
        return `/notification/role/${role}${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: [{ type: 'Notifications', id: 'BY_ROLE' }],
    }),

    // GET /notification/hospital/:hospitalId - Get notifications by hospital
    getNotificationsByHospital: builder.query<NotificationsResponse, { hospitalId: number; page?: number; limit?: number }>({
      query: ({ hospitalId, page, limit }) => {
        const queryParams = new URLSearchParams();
        if (page) queryParams.append('page', page.toString());
        const queryString = queryParams.toString();
        return `/notification/hospital/${hospitalId}${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: [{ type: 'Notifications', id: 'BY_HOSPITAL' }],
    }),

    // POST /notification - Create new notification
    createNotification: builder.mutation<SingleNotificationResponse, CreateNotificationRequest>({
      query: (body) => ({
        url: '/notification',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Notifications', id: 'LIST' }],
    }),

    // PUT /notification/:id - Update notification by ID
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

    // PUT /notification/read/:role/:hospitalId - Mark notifications as read by role and hospital
    markNotificationsAsReadByRoleAndHospital: builder.mutation<
      MarkReadResponse,
      { role: string; hospitalId: number }
    >({
      query: ({ role, hospitalId }) => ({
        url: `/notification/read/${role}/${hospitalId}`,
        method: 'PUT',
      }),
      invalidatesTags: [
        { type: 'Notifications', id: 'LIST' }, 
        { type: 'Notifications', id: 'BY_ROLE' }, 
        { type: 'Notifications', id: 'BY_HOSPITAL' }
      ],
    }),

    // PUT /notification/read-all/hospital/:hospitalId - Mark all notifications as read for a hospital
    markAllNotificationsAsReadByHospital: builder.mutation<
  MarkReadResponse,
  {
    hospitalId: number;
    notificationIds: number[];
  }
>({
  query: ({ hospitalId, notificationIds }) => ({
    url: `/notification/read-all/hospital/${hospitalId}`,
    method: 'PUT',
    body: {
      notificationIds,
    },
  }),
}),

    // DELETE /notification/:id - Delete notification by ID
    deleteNotification: builder.mutation<{ success: boolean; message: string }, number>({
      query: (id) => ({
        url: `/notification/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Notification', id }, 
        { type: 'Notifications', id: 'LIST' }
      ],
    }),

    // DELETE /notification/hospital/:hospitalId - Delete all notifications for a hospital
    deleteNotificationsByHospital: builder.mutation<{ success: boolean; message: string; data: { deletedCount: number } }, number>({
      query: (hospitalId) => ({
        url: `/notification/hospital/${hospitalId}`,
        method: 'DELETE',
      }),
      invalidatesTags: [
        { type: 'Notifications', id: 'LIST' }, 
        { type: 'Notifications', id: 'BY_HOSPITAL' }
      ],
    }),
  }),
});

// Export hooks
export const {
  useGetNotificationsQuery,
  useGetNotificationByIdQuery,
  useGetNotificationsByRoleQuery,
  useGetNotificationsByHospitalQuery,
  useCreateNotificationMutation,
  useUpdateNotificationMutation,
  useMarkNotificationsAsReadByRoleAndHospitalMutation,
  useMarkAllNotificationsAsReadByHospitalMutation,
  useDeleteNotificationMutation,
  useDeleteNotificationsByHospitalMutation,
} = notificationApi;