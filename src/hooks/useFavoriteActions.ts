import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  useAddFavoriteMutation,
  useGetFavoritesQuery,
  useRemoveFavoriteMutation,
} from '../api';
import { getAccessToken } from '../api/authToken';
import { favoriteToItemId, parseCatalogItemId } from '../api/mappers';
import { RootState } from '../store';
import { setUserFavorites, toggleFavorite } from '../store/authSlice';

export function useFavoriteActions() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const accessToken =
    useSelector((state: RootState) => state.auth.accessToken) ?? getAccessToken();

  const useApi = Boolean(accessToken && user);
  const { data: favoritesData } = useGetFavoritesQuery(
    { limit: 200, offset: 0 },
    { skip: !useApi },
  );
  const [addFavorite] = useAddFavoriteMutation();
  const [removeFavorite] = useRemoveFavoriteMutation();

  const favoriteIdsFromApi =
    favoritesData?.items
      ?.map(favoriteToItemId)
      .filter((id): id is string => Boolean(id)) ?? [];

  const isFavorite = useCallback(
    (itemId: string) => {
      if (useApi && favoriteIdsFromApi.length > 0) {
        return favoriteIdsFromApi.includes(itemId);
      }
      return Boolean(user?.favorites?.includes(itemId));
    },
    [favoriteIdsFromApi, useApi, user?.favorites],
  );

  const toggle = useCallback(
    async (itemId: string) => {
      if (!user) {
        navigate('/auth');
        return;
      }

      const ref = parseCatalogItemId(itemId);
      const currentlyFavorite = isFavorite(itemId);

      if (useApi && ref) {
        try {
          if (currentlyFavorite) {
            await removeFavorite(
              ref.kind === 'place' ? { placeId: ref.id } : { excursionId: ref.id },
            ).unwrap();
          } else {
            await addFavorite(
              ref.kind === 'place' ? { placeId: ref.id } : { excursionId: ref.id },
            ).unwrap();
          }

          const nextFavorites = currentlyFavorite
            ? (user.favorites ?? []).filter((id) => id !== itemId)
            : [...(user.favorites ?? []), itemId];
          dispatch(setUserFavorites(nextFavorites));
          return;
        } catch (error) {
          console.warn('Favorites API unavailable, using local state', error);
        }
      }

      dispatch(toggleFavorite(itemId));
    },
    [addFavorite, dispatch, isFavorite, navigate, removeFavorite, useApi, user],
  );

  return { toggle, isFavorite, favoriteIdsFromApi };
}
