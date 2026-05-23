import type {
  BookingResponse,
  ExcursionResponse,
  FavoriteResponse,
  NotificationResponse,
  PlaceResponse,
  UserProfileResponse,
} from './types';
import type { Booking, BookingStatus, User, UserRole } from '../store/authSlice';
import type { Category, MockItem } from '../data/mockData';

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800&auto=format&fit=crop';

export type CatalogRef = { kind: 'place' | 'excursion'; id: number };

export function toPlaceItemId(id: number): string {
  return `place-${id}`;
}

export function toExcursionItemId(id: number): string {
  return `excursion-${id}`;
}

export function parseCatalogItemId(itemId: string): CatalogRef | null {
  const placeMatch = itemId.match(/^place-(\d+)$/);
  if (placeMatch) return { kind: 'place', id: Number(placeMatch[1]) };

  const excursionMatch = itemId.match(/^excursion-(\d+)$/);
  if (excursionMatch) return { kind: 'excursion', id: Number(excursionMatch[1]) };

  if (/^\d+$/.test(itemId)) {
    return { kind: 'place', id: Number(itemId) };
  }

  return null;
}

export function mapApiRole(role?: string): UserRole {
  const normalized = (role ?? '').toUpperCase();
  if (normalized.includes('ADMIN')) return 'admin';
  if (normalized.includes('PARTNER') || normalized.includes('OPERATOR')) return 'partner';
  return 'tourist';
}

function mapPlaceCategory(category?: string): Category {
  const value = (category ?? '').toLowerCase();
  if (value.includes('restaurant') || value.includes('cafe') || value.includes('food')) {
    return 'restaurants';
  }
  return 'places';
}

export function placeToMockItem(place: PlaceResponse): MockItem {
  const id = place.id ?? 0;
  return {
    id: toPlaceItemId(id),
    title: place.name ?? 'Без названия',
    description: place.description ?? '',
    category: mapPlaceCategory(place.category),
    lat: place.latitude ?? 56.8389,
    lng: place.longitude ?? 60.6057,
    image: place.imageUrl ?? PLACEHOLDER_IMAGE,
    rating: place.rating ?? 0,
    price: 0,
    location: place.address,
    status: 'active',
  };
}

function isoDatePart(value?: string): string | undefined {
  if (!value) return undefined;
  return value.slice(0, 10);
}

function buildAvailableDates(start?: string, end?: string): string[] | undefined {
  const startIso = isoDatePart(start);
  const endIso = isoDatePart(end) || startIso;
  if (!startIso) return undefined;

  const result: string[] = [];
  const cursor = new Date(startIso + 'T12:00:00');
  const endDate = new Date((endIso || startIso) + 'T12:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  while (cursor.getTime() <= endDate.getTime()) {
    if (cursor.getTime() >= today.getTime()) {
      const y = cursor.getFullYear();
      const m = String(cursor.getMonth() + 1).padStart(2, '0');
      const d = String(cursor.getDate()).padStart(2, '0');
      result.push(`${y}-${m}-${d}`);
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return result.length > 0 ? result : undefined;
}

export function excursionToMockItem(excursion: ExcursionResponse): MockItem {
  const id = excursion.id ?? 0;
  const availableDates = buildAvailableDates(excursion.startDate, excursion.endDate);

  return {
    id: toExcursionItemId(id),
    title: excursion.title ?? 'Экскурсия',
    description: excursion.description ?? '',
    category: 'excursions',
    lat: excursion.latitude ?? 56.8389,
    lng: excursion.longitude ?? 60.6057,
    image: PLACEHOLDER_IMAGE,
    rating: 4.8,
    price: excursion.price ?? 0,
    partnerId: excursion.operatorId != null ? String(excursion.operatorId) : undefined,
    status: excursion.isPublished ? 'active' : 'pending',
    duration: excursion.duration != null ? `${excursion.duration} ч` : undefined,
    tourOperator: excursion.operatorName,
    freeSlots: excursion.maxParticipants,
    availableDates,
    dates: excursion.startDate ? [excursion.startDate] : undefined,
    location: excursion.meetingAddress,
  };
}

export function favoriteToItemId(favorite: FavoriteResponse): string | null {
  const type = (favorite.type ?? '').toUpperCase();
  if (favorite.itemId == null) return null;
  if (type.includes('EXCURSION')) return toExcursionItemId(favorite.itemId);
  return toPlaceItemId(favorite.itemId);
}

export function profileToUser(
  profile: UserProfileResponse,
  favoriteIds: string[] = [],
): User {
  const firstName = profile.firstName ?? '';
  const lastName = profile.lastName ?? '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

  return {
    id: profile.id != null ? String(profile.id) : 'user-unknown',
    name: fullName || profile.email?.split('@')[0] || 'Пользователь',
    email: profile.email ?? '',
    role: mapApiRole(profile.role),
    favorites: favoriteIds,
    routes: [],
    bookings: [],
    notifications: [],
  };
}

export function apiBookingToAppBooking(booking: BookingResponse, user: User): Booking {
  const apiStatus = (booking.status ?? 'PENDING').toUpperCase();
  let status: BookingStatus = 'pending';
  if (apiStatus === 'CONFIRMED') status = 'confirmed';
  if (apiStatus === 'CANCELLED' || apiStatus === 'DECLINED') status = 'declined';

  return {
    id: String(booking.id ?? ''),
    itemId: booking.excursionId != null ? toExcursionItemId(booking.excursionId) : '',
    itemTitle: booking.excursionTitle ?? 'Экскурсия',
    touristId: user.id,
    touristName: user.name,
    partnerId: user.role === 'partner' ? user.id : 'partner-api',
    status,
    date: booking.excursionStartDate
      ? new Date(booking.excursionStartDate).toLocaleDateString()
      : new Date().toLocaleDateString(),
    createdAt: booking.createdAt ?? new Date().toISOString(),
  };
}

export function appBookingStatusToApi(status: BookingStatus): string {
  if (status === 'confirmed') return 'CONFIRMED';
  if (status === 'declined') return 'CANCELLED';
  return 'PENDING';
}

export function apiNotificationToApp(notification: NotificationResponse) {
  return {
    id: String(notification.id ?? Math.random().toString(36).slice(2)),
    type: 'system' as const,
    title: notification.title ?? 'Уведомление',
    message: notification.message ?? '',
    isRead: Boolean(notification.read),
    createdAt: notification.createdAt ?? new Date().toISOString(),
    link: '/profile',
  };
}

export function parseDurationHours(value: string): number {
  const match = value.match(/(\d+)/);
  return match ? Number(match[1]) : 3;
}
