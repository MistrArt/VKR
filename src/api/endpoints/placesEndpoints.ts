import { apiSlice } from '../apiSlice';
import type {
  PaginationParams,
  PlaceListResponse,
  PlaceNearbyParams,
  PlaceRequest,
  PlaceResponse,
  PlaceSearchParams,
} from '../types';

const placeListTags = (result: PlaceListResponse | undefined) =>
  result?.items
    ? [
        ...result.items.map((item) => ({ type: 'Places' as const, id: item.id })),
        { type: 'Places' as const, id: 'LIST' },
      ]
    : [{ type: 'Places' as const, id: 'LIST' }];

export const placesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllPlaces: builder.query<PlaceListResponse, PaginationParams | void>({
      query: (params) => ({
        url: '/api/places/all',
        params: params || {},
      }),
      providesTags: (result) => placeListTags(result),
    }),
    searchPlaces: builder.query<PlaceListResponse, PlaceSearchParams>({
      query: ({ query, category, limit, offset }) => ({
        url: '/api/places/search',
        params: { query, category, limit, offset },
      }),
      providesTags: (result) => placeListTags(result),
    }),
    getPlacesNearby: builder.query<PlaceListResponse, PlaceNearbyParams>({
      query: ({ lat, lon, radius, limit, offset }) => ({
        url: '/api/places/nearby',
        params: { lat, lon, radius, limit, offset },
      }),
      providesTags: (result) => placeListTags(result),
    }),
    getAttractions: builder.query<PlaceListResponse, PaginationParams | void>({
      query: (params) => ({
        url: '/api/places/attractions',
        params: params || {},
      }),
      providesTags: (result) => placeListTags(result),
    }),
    getMuseums: builder.query<PlaceListResponse, PaginationParams | void>({
      query: (params) => ({
        url: '/api/places/museums',
        params: params || {},
      }),
      providesTags: (result) => placeListTags(result),
    }),
    getRestaurants: builder.query<PlaceListResponse, PaginationParams | void>({
      query: (params) => ({
        url: '/api/places/restaurants',
        params: params || {},
      }),
      providesTags: (result) => placeListTags(result),
    }),
    getPlaceById: builder.query<PlaceResponse, number>({
      query: (id) => `/api/places/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Places', id }],
    }),
    createPlace: builder.mutation<PlaceResponse, PlaceRequest>({
      query: (body) => ({
        url: '/api/places',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Places', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetAllPlacesQuery,
  useLazyGetAllPlacesQuery,
  useSearchPlacesQuery,
  useLazySearchPlacesQuery,
  useGetPlacesNearbyQuery,
  useLazyGetPlacesNearbyQuery,
  useGetAttractionsQuery,
  useLazyGetAttractionsQuery,
  useGetMuseumsQuery,
  useLazyGetMuseumsQuery,
  useGetRestaurantsQuery,
  useLazyGetRestaurantsQuery,
  useGetPlaceByIdQuery,
  useLazyGetPlaceByIdQuery,
  useCreatePlaceMutation,
} = placesApi;
