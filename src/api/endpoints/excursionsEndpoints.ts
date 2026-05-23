import { apiSlice } from '../apiSlice';
import type {
  ExcursionListParams,
  ExcursionListResponse,
  ExcursionRequest,
  ExcursionResponse,
  PaginationParams,
} from '../types';

const excursionListTags = (result: ExcursionListResponse | undefined) =>
  result?.items
    ? [
        ...result.items.map((item) => ({ type: 'Excursions' as const, id: item.id })),
        { type: 'Excursions' as const, id: 'LIST' },
      ]
    : [{ type: 'Excursions' as const, id: 'LIST' }];

export const excursionsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getExcursions: builder.query<ExcursionListResponse, ExcursionListParams | void>({
      query: (params) => ({
        url: '/api/excursions',
        params: params || {},
      }),
      providesTags: (result) => excursionListTags(result),
    }),
    getMyExcursions: builder.query<ExcursionListResponse, PaginationParams | void>({
      query: (params) => ({
        url: '/api/excursions/my',
        params: params || {},
      }),
      providesTags: [{ type: 'Excursions', id: 'MY' }],
    }),
    getExcursionById: builder.query<ExcursionResponse, number>({
      query: (id) => `/api/excursions/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Excursions', id }],
    }),
    createExcursion: builder.mutation<ExcursionResponse, ExcursionRequest>({
      query: (body) => ({
        url: '/api/excursions',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'Excursions', id: 'LIST' },
        { type: 'Excursions', id: 'MY' },
      ],
    }),
    updateExcursion: builder.mutation<ExcursionResponse, { id: number; body: ExcursionRequest }>({
      query: ({ id, body }) => ({
        url: `/api/excursions/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Excursions', id },
        { type: 'Excursions', id: 'LIST' },
        { type: 'Excursions', id: 'MY' },
      ],
    }),
    deleteExcursion: builder.mutation<void, number>({
      query: (id) => ({
        url: `/api/excursions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Excursions', id },
        { type: 'Excursions', id: 'LIST' },
        { type: 'Excursions', id: 'MY' },
      ],
    }),
    publishExcursion: builder.mutation<ExcursionResponse, number>({
      query: (id) => ({
        url: `/api/excursions/${id}/publish`,
        method: 'PATCH',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Excursions', id },
        { type: 'Excursions', id: 'LIST' },
        { type: 'Excursions', id: 'MY' },
      ],
    }),
    registerExcursionView: builder.mutation<void, number>({
      query: (id) => ({
        url: `/api/excursions/${id}/view`,
        method: 'POST',
      }),
    }),
  }),
});

export const {
  useGetExcursionsQuery,
  useLazyGetExcursionsQuery,
  useGetMyExcursionsQuery,
  useLazyGetMyExcursionsQuery,
  useGetExcursionByIdQuery,
  useLazyGetExcursionByIdQuery,
  useCreateExcursionMutation,
  useUpdateExcursionMutation,
  useDeleteExcursionMutation,
  usePublishExcursionMutation,
  useRegisterExcursionViewMutation,
} = excursionsApi;
