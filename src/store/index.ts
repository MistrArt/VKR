import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { apiSlice } from '../api';
import authReducer from './authSlice';

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

/**
 * Пример использования RTK Query:
 *
 * import { useGetAllPlacesQuery, useLoginMutation } from '@/api';
 * import { useDispatch } from 'react-redux';
 * import { setAuthTokensAction } from './authSlice';
 *
 * const { data, isLoading } = useGetAllPlacesQuery({ limit: 20, offset: 0 });
 * const [login] = useLoginMutation();
 * const dispatch = useDispatch();
 *
 * const onLogin = async () => {
 *   const result = await login({ email, password }).unwrap();
 *   dispatch(setAuthTokensAction({
 *     accessToken: result.accessToken ?? null,
 *     refreshToken: result.refreshToken ?? null,
 *   }));
 * };
 */
