// src/app/service/notification.ts
import { api } from './api';

// ==============================
// TYPES
// ==============================

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
  
  // Arrays for different user types
  userIds?: number[];
  hospitalIds?: number[];
  doctorIds?: number[];
  staffIds?: number[];
  pharmacyIds?: number[];
  labIds?: number[];
  superAdminIds?: number[];
  
  // Read status objects
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
  data: Notification[];
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
  data: Notification[];
  count?: number;
  error?: null;
}

// ==============================
// NOTIFICATION API
// ==============================

export const notificationApi = api.injectEndpoints({
  endpoints: (builder) => ({

    // ==============================
    // GET ALL NOTIFICATIONS
    // GET /notification?hospitalId=3
    // GET /notification?page=1&limit=10
    // ==============================
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
              ...result.data.map(({ id }) => ({ type: 'Notification' as const, id })),
              { type: 'Notifications', id: 'LIST' },
            ]
          : [{ type: 'Notifications', id: 'LIST' }],
    }),

    // ==============================
    // GET NOTIFICATION BY ID
    // GET /notification/1
    // ==============================
    getNotificationById: builder.query<SingleNotificationResponse, number>({
      query: (id) => `/notification/${id}`,
      providesTags: (result, error, id) => [{ type: 'Notification', id }],
    }),

    // ==============================
    // GET NOTIFICATIONS BY ROLE
    // GET /notification/role/hospital
    // ==============================
    getNotificationsByRole: builder.query<NotificationsResponse, { role: string; page?: number; limit?: number }>({
      query: ({ role, page, limit }) => {
        const queryParams = new URLSearchParams();
        if (page) queryParams.append('page', page.toString());
        if (limit) queryParams.append('limit', limit.toString());
        const queryString = queryParams.toString();
        return `/notification/role/${role}${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: [{ type: 'Notifications', id: 'BY_ROLE' }],
    }),

    // ==============================
    // GET NOTIFICATIONS BY HOSPITAL
    // GET /notification/hospital/8
    // ==============================
    getNotificationsByHospital: builder.query<NotificationsResponse, { hospitalId: number; page?: number; limit?: number }>({
      query: ({ hospitalId, page, limit }) => {
        const queryParams = new URLSearchParams();
        if (page) queryParams.append('page', page.toString());
        if (limit) queryParams.append('limit', limit.toString());
        const queryString = queryParams.toString();
        return `/notification/hospital/${hospitalId}${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: [{ type: 'Notifications', id: 'BY_HOSPITAL' }],
    }),

    // ==============================
    // GET READ NOTIFICATIONS BY ROLE
    // GET /notification/read/hospital/3
    // ==============================
    getReadNotifications: builder.query<RoleNotificationsResponse, { role: string; id: number }>({
      query: ({ role, id }) => `/notification/read/${role}/${id}`,
      providesTags: [{ type: 'Notifications', id: 'READ' }],
    }),

    // ==============================
    // GET UNREAD NOTIFICATIONS BY ROLE
    // GET /notification/unread/hospital/3
    // ==============================
    getUnreadNotifications: builder.query<RoleNotificationsResponse, { role: string; id: number }>({
      query: ({ role, id }) => `/notification/unread/${role}/${id}`,
      providesTags: [{ type: 'Notifications', id: 'UNREAD' }],
    }),

    // ==============================
    // CREATE NOTIFICATION
    // POST /notification
    // ==============================
    createNotification: builder.mutation<SingleNotificationResponse, CreateNotificationRequest>({
      query: (body) => ({
        url: '/notification',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Notifications', id: 'LIST' }],
    }),

    // ==============================
    // UPDATE NOTIFICATION
    // PUT /notification/1
    // ==============================
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

    // ==============================
    // MARK NOTIFICATION AS READ
    // PUT /notification/read/:role/:userId/:notificationId
    // ==============================
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
      ],
    }),

    // ==============================
    // MARK ALL NOTIFICATIONS AS READ FOR HOSPITAL
    // PUT /notification/read-all/hospital/8
    // ==============================
    markAllNotificationsAsReadByHospital: builder.mutation<
      MarkReadResponse,
      { hospitalId: number; notificationIds: number[] }
    >({
      query: ({ hospitalId, notificationIds }) => ({
        url: `/notification/read-all/hospital/${hospitalId}`,
        method: 'PUT',
        body: { notificationIds },
      }),
      invalidatesTags: [
        { type: 'Notifications', id: 'LIST' },
        { type: 'Notifications', id: 'READ' },
        { type: 'Notifications', id: 'UNREAD' },
        { type: 'Notifications', id: 'BY_HOSPITAL' },
      ],
    }),

    // ==============================
    // MARK ALL NOTIFICATIONS AS READ FOR ROLE
    // PUT /notification/read-all/:role/:userId
    // ==============================
    markAllNotificationsAsRead: builder.mutation<
      MarkReadResponse,
      { role: string; userId: number; notificationIds: number[] }
    >({
      query: ({ role, userId, notificationIds }) => ({
        url: `/notification/read-all/${role}/${userId}`,
        method: 'PUT',
        body: { notificationIds },
      }),
      invalidatesTags: [
        { type: 'Notifications', id: 'LIST' },
        { type: 'Notifications', id: 'READ' },
        { type: 'Notifications', id: 'UNREAD' },
        { type: 'Notifications', id: 'BY_ROLE' },
        { type: 'Notifications', id: 'BY_HOSPITAL' },
      ],
    }),

    // ==============================
    // DELETE NOTIFICATION
    // DELETE /notification/1
    // ==============================
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

    // ==============================
    // DELETE ALL NOTIFICATIONS FOR HOSPITAL
    // DELETE /notification/hospital/8
    // ==============================
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
  overrideExisting: false,
});

// ==============================
// EXPORT HOOKS
// ==============================

export const {
  // GET
  useGetNotificationsQuery,
  useGetNotificationByIdQuery,
  useGetNotificationsByRoleQuery,
  useGetNotificationsByHospitalQuery,
  useGetReadNotificationsQuery,
  useGetUnreadNotificationsQuery,
  
  // POST
  useCreateNotificationMutation,
  
  // PUT
  useUpdateNotificationMutation,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useMarkAllNotificationsAsReadByHospitalMutation,
  
  // DELETE
  useDeleteNotificationMutation,
  useDeleteNotificationsByHospitalMutation,
} = notificationApi;