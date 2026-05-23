import { apiSlice } from '../apiSlice';
import type {
  FavoriteListResponse,
  FavoriteRequest,
  FavoriteResponse,
  PaginationParams,
  RemoveFavoriteParams,
} from '../types';

export const favoritesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getFavorites: builder.query<FavoriteListResponse, PaginationParams | void>({
      query: (params) => ({
        url: '/api/favorites',
        params: params || {},
      }),
      providesTags: (result) =>
        result?.items
          ? [
              ...result.items.map((item) => ({ type: 'Favorites' as const, id: item.id })),
              { type: 'Favorites', id: 'LIST' },
            ]
          : [{ type: 'Favorites', id: 'LIST' }],
    }),
    addFavorite: builder.mutation<FavoriteResponse, FavoriteRequest>({
      query: (body) => ({
        url: '/api/favorites',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Favorites', id: 'LIST' }],
    }),
    removeFavorite: builder.mutation<void, RemoveFavoriteParams>({
      query: (params) => ({
        url: '/api/favorites',
        method: 'DELETE',
        params,
      }),
      invalidatesTags: [{ type: 'Favorites', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetFavoritesQuery,
  useLazyGetFavoritesQuery,
  useAddFavoriteMutation,
  useRemoveFavoriteMutation,
} = favoritesApi;
