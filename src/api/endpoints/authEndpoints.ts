import { apiSlice } from '../apiSlice';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  UserProfileResponse,
} from '../types';
import { setAuthTokens } from '../authToken';
import { setAuthTokensAction } from '../../store/authSlice';

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (body) => ({
        url: '/api/auth/register',
        method: 'POST',
        body,
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.accessToken) {
            setAuthTokens(data.accessToken, data.refreshToken);
            dispatch(
              setAuthTokensAction({
                accessToken: data.accessToken ?? null,
                refreshToken: data.refreshToken ?? null,
              }),
            );
          }
        } catch {
          /* handled by caller */
        }
      },
    }),
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (body) => ({
        url: '/api/auth/login',
        method: 'POST',
        body,
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.accessToken) {
            setAuthTokens(data.accessToken, data.refreshToken);
            dispatch(
              setAuthTokensAction({
                accessToken: data.accessToken ?? null,
                refreshToken: data.refreshToken ?? null,
              }),
            );
          }
        } catch {
          /* handled by caller */
        }
      },
      invalidatesTags: ['Profile'],
    }),
    getProfile: builder.query<UserProfileResponse, void>({
      query: () => '/api/auth/profile',
      providesTags: ['Profile'],
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useGetProfileQuery,
  useLazyGetProfileQuery,
} = authApi;
