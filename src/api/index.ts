/**
 * RTK Query API — Travel Ecosystem (http://localhost:8080)
 * Импорт endpoint-файлов регистрирует injectEndpoints.
 */
import './endpoints/authEndpoints';
import './endpoints/placesEndpoints';
import './endpoints/excursionsEndpoints';
import './endpoints/bookingsEndpoints';
import './endpoints/favoritesEndpoints';
import './endpoints/routesEndpoints';
import './endpoints/notificationsEndpoints';

export { apiSlice } from './apiSlice';
export * from './types';
export * from './authToken';

export {
  useRegisterMutation,
  useLoginMutation,
  useGetProfileQuery,
  useLazyGetProfileQuery,
} from './endpoints/authEndpoints';

export {
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
} from './endpoints/placesEndpoints';

export {
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
} from './endpoints/excursionsEndpoints';

export {
  useCreateBookingMutation,
  useGetMyBookingsQuery,
  useLazyGetMyBookingsQuery,
  useUpdateBookingStatusMutation,
} from './endpoints/bookingsEndpoints';

export {
  useGetFavoritesQuery,
  useLazyGetFavoritesQuery,
  useAddFavoriteMutation,
  useRemoveFavoriteMutation,
} from './endpoints/favoritesEndpoints';

export {
  useGetRoutesQuery,
  useLazyGetRoutesQuery,
  useGetRouteByIdQuery,
  useLazyGetRouteByIdQuery,
  useCreateRouteMutation,
  useUpdateRouteMutation,
  useDeleteRouteMutation,
} from './endpoints/routesEndpoints';

export {
  useGetNotificationsQuery,
  useLazyGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from './endpoints/notificationsEndpoints';
