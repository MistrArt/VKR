import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  useGetFavoritesQuery,
  useGetProfileQuery,
  useLazyGetProfileQuery,
} from '../api';
import { getAccessToken } from '../api/authToken';
import { favoriteToItemId, profileToUser } from '../api/mappers';
import { RootState } from '../store';
import { setLoading, setUser, User } from '../store/authSlice';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch();
  const accessToken =
    useSelector((state: RootState) => state.auth.accessToken) ?? getAccessToken();

  const { data: profile, isError: isProfileError, isFetching: isProfileFetching } =
    useGetProfileQuery(undefined, { skip: !accessToken });

  const { data: favoritesData } = useGetFavoritesQuery(
    { limit: 200, offset: 0 },
    { skip: !accessToken || !profile },
  );

  useEffect(() => {
    dispatch(setLoading(true));

    if (!accessToken) {
      const savedUser = localStorage.getItem('uraltour_user');
      if (savedUser) {
        try {
          const userData: User = JSON.parse(savedUser);
          dispatch(setUser(userData));
        } catch (error) {
          console.error('Error parsing saved user:', error);
          localStorage.removeItem('uraltour_user');
          dispatch(setUser(null));
        }
      } else {
        dispatch(setUser(null));
      }
      dispatch(setLoading(false));
      return;
    }

    if (profile) {
      const favoriteIds =
        favoritesData?.items
          ?.map(favoriteToItemId)
          .filter((id): id is string => Boolean(id)) ?? [];

      dispatch(setUser(profileToUser(profile, favoriteIds)));
      dispatch(setLoading(false));
      return;
    }

    if (accessToken && isProfileFetching) {
      return;
    }

    if (isProfileError && !isProfileFetching) {
      dispatch(setUser(null));
      dispatch(setLoading(false));
    }
  }, [
    accessToken,
    dispatch,
    favoritesData,
    isProfileError,
    isProfileFetching,
    profile,
  ]);

  return <>{children}</>;
};

export function useRefreshSession() {
  const dispatch = useDispatch();
  const [fetchProfile] = useLazyGetProfileQuery();

  return async (favoriteIds: string[] = []) => {
    const profile = await fetchProfile().unwrap();
    const user = profileToUser(profile, favoriteIds);
    dispatch(setUser(user));
    return user;
  };
}
