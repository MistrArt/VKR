import { apiSlice } from '../apiSlice';
import type {
  PaginationParams,
  RouteListResponse,
  RouteRequest,
  RouteResponse,
} from '../types';

export const routesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getRoutes: builder.query<RouteListResponse, PaginationParams | void>({
      query: (params) => ({
        url: '/api/routes',
        params: params || {},
      }),
      providesTags: (result) =>
        result?.items
          ? [
              ...result.items.map((item) => ({ type: 'Routes' as const, id: item.id })),
              { type: 'Routes', id: 'LIST' },
            ]
          : [{ type: 'Routes', id: 'LIST' }],
    }),
    getRouteById: builder.query<RouteResponse, number>({
      query: (id) => `/api/routes/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Routes', id }],
    }),
    createRoute: builder.mutation<RouteResponse, RouteRequest>({
      query: (body) => ({
        url: '/api/routes',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Routes', id: 'LIST' }],
    }),
    updateRoute: builder.mutation<RouteResponse, { id: number; body: RouteRequest }>({
      query: ({ id, body }) => ({
        url: `/api/routes/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Routes', id },
        { type: 'Routes', id: 'LIST' },
      ],
    }),
    deleteRoute: builder.mutation<void, number>({
      query: (id) => ({
        url: `/api/routes/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Routes', id },
        { type: 'Routes', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetRoutesQuery,
  useLazyGetRoutesQuery,
  useGetRouteByIdQuery,
  useLazyGetRouteByIdQuery,
  useCreateRouteMutation,
  useUpdateRouteMutation,
  useDeleteRouteMutation,
} = routesApi;
