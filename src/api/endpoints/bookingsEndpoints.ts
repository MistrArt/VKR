import { apiSlice } from '../apiSlice';
import type {
  BookingListResponse,
  BookingRequest,
  BookingResponse,
  BookingStatusRequest,
  PaginationParams,
} from '../types';

export const bookingsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createBooking: builder.mutation<BookingResponse, BookingRequest>({
      query: (body) => ({
        url: '/api/bookings',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Bookings', id: 'MY' }, 'Notifications'],
    }),
    getMyBookings: builder.query<BookingListResponse, PaginationParams | void>({
      query: (params) => ({
        url: '/api/bookings/my',
        params: params || {},
      }),
      providesTags: (result) =>
        result?.items
          ? [
              ...result.items.map((item) => ({ type: 'Bookings' as const, id: item.id })),
              { type: 'Bookings', id: 'MY' },
            ]
          : [{ type: 'Bookings', id: 'MY' }],
    }),
    updateBookingStatus: builder.mutation<
      BookingResponse,
      { id: number; body: BookingStatusRequest }
    >({
      query: ({ id, body }) => ({
        url: `/api/bookings/${id}/status`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Bookings', id },
        { type: 'Bookings', id: 'MY' },
        'Notifications',
      ],
    }),
  }),
});

export const {
  useCreateBookingMutation,
  useGetMyBookingsQuery,
  useLazyGetMyBookingsQuery,
  useUpdateBookingStatusMutation,
} = bookingsApi;
