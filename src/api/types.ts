/** OpenAPI schemas — Travel Ecosystem API v1 */

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

// ——— Auth ———
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken?: string;
  refreshToken?: string;
  email?: string;
  role?: string;
}

export interface UserProfileResponse {
  id?: number;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ——— Places ———
export interface PlaceRequest {
  name: string;
  description?: string;
  category: string;
  address?: string;
  latitude: number;
  longitude: number;
  imageUrl?: string;
  rating?: number;
}

export interface PlaceResponse {
  id?: number;
  name?: string;
  description?: string;
  category?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
  rating?: number;
}

export interface PlaceListResponse {
  items?: PlaceResponse[];
  limit?: number;
  offset?: number;
  totalSize?: number;
}

export interface PlaceSearchParams extends PaginationParams {
  query: string;
  category?: string;
}

export interface PlaceNearbyParams extends PaginationParams {
  lat: number;
  lon: number;
  radius: number;
}

// ——— Excursions ———
export interface ExcursionRequest {
  title: string;
  description?: string;
  duration: number;
  price: number;
  startDate: string;
  endDate: string;
  meetingAddress?: string;
  latitude: number;
  longitude: number;
  maxParticipants: number;
  isPublished?: boolean;
}

export interface ExcursionResponse {
  id?: number;
  title?: string;
  description?: string;
  duration?: number;
  price?: number;
  startDate?: string;
  endDate?: string;
  meetingAddress?: string;
  latitude?: number;
  longitude?: number;
  maxParticipants?: number;
  operatorId?: number;
  operatorName?: string;
  isPublished?: boolean;
}

export interface ExcursionListResponse {
  items?: ExcursionResponse[];
  limit?: number;
  offset?: number;
  totalSize?: number;
}

export interface ExcursionListParams extends PaginationParams {
  from?: string;
  to?: string;
}

// ——— Bookings ———
export interface BookingRequest {
  excursionId: number;
  participantsCount: number;
}

export interface BookingStatusRequest {
  status: string;
}

export interface BookingResponse {
  id?: number;
  excursionId?: number;
  excursionTitle?: string;
  excursionStartDate?: string;
  price?: number;
  participantsCount?: number;
  status?: BookingStatus;
  createdAt?: string;
}

export interface BookingListResponse {
  items?: BookingResponse[];
  limit?: number;
  offset?: number;
  totalSize?: number;
}

// ——— Favorites ———
export interface FavoriteRequest {
  placeId?: number;
  excursionId?: number;
}

export interface FavoriteResponse {
  id?: number;
  type?: string;
  itemId?: number;
  name?: string;
  description?: string;
  createdAt?: string;
}

export interface FavoriteListResponse {
  items?: FavoriteResponse[];
  limit?: number;
  offset?: number;
  totalSize?: number;
}

export interface RemoveFavoriteParams {
  placeId?: number;
  excursionId?: number;
}

// ——— Routes ———
export interface RouteRequest {
  title: string;
  description?: string;
  placeIds: number[];
}

export interface RoutePointResponse {
  placeId?: number;
  placeName?: string;
  latitude?: number;
  longitude?: number;
  orderIndex?: number;
}

export interface RouteResponse {
  id?: number;
  title?: string;
  description?: string;
  userId?: number;
  points?: RoutePointResponse[];
  totalDuration?: number;
  totalDistance?: number;
  createdAt?: string;
}

export interface RouteListResponse {
  items?: RouteResponse[];
  limit?: number;
  offset?: number;
  totalSize?: number;
}

// ——— Notifications ———
export interface NotificationResponse {
  id?: number;
  type?: string;
  title?: string;
  message?: string;
  createdAt?: string;
  read?: boolean;
}

export interface NotificationListResponse {
  items?: NotificationResponse[];
  unreadCount?: number;
  totalSize?: number;
}
