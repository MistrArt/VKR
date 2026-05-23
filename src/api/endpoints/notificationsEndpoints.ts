import { apiSlice } from '../apiSlice';
import type {
  NotificationListResponse,
  NotificationResponse,
  PaginationParams,
} from '../types';

export const notificationsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<NotificationListResponse, PaginationParams | void>({
      query: (params) => ({
        url: '/api/notifications',
        params: params || {},
      }),
      providesTags: (result) =>
        result?.items
          ? [
              ...result.items.map((item) => ({ type: 'Notifications' as const, id: item.id })),
              { type: 'Notifications', id: 'LIST' },
            ]
          : [{ type: 'Notifications', id: 'LIST' }],
    }),
    markNotificationRead: builder.mutation<NotificationResponse, number>({
      query: (id) => ({
        url: `/api/notifications/${id}/read`,
        method: 'PUT',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Notifications', id },
        { type: 'Notifications', id: 'LIST' },
      ],
    }),
    markAllNotificationsRead: builder.mutation<void, void>({
      query: () => ({
        url: '/api/notifications/read-all',
        method: 'PUT',
      }),
      invalidatesTags: [{ type: 'Notifications', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useLazyGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = notificationsApi;
