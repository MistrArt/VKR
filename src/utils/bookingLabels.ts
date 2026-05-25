import type { Booking } from '../store/authSlice';

/** Турист сам отказался от экскурсии. */
export function isBookingDeclinedByTourist(booking: Booking): boolean {
  return booking.status === 'declined' && booking.declinedBy === 'tourist';
}

/** Партнёр отклонил заявку. */
export function isBookingDeclinedByPartner(booking: Booking): boolean {
  return booking.status === 'declined' && booking.declinedBy !== 'tourist';
}

export function getPartnerBookingStatusLabel(booking: Booking): string {
  if (booking.status === 'confirmed') return 'Подтверждён';
  if (booking.status === 'pending') return 'Ожидает';
  if (isBookingDeclinedByTourist(booking)) return 'Отказ клиента';
  if (isBookingDeclinedByPartner(booking)) return 'Отклонено вами';
  return 'Отклонено';
}

export function getPartnerBookingStatusClass(booking: Booking): string {
  if (booking.status === 'confirmed') return 'bg-green-50 border-green-100 text-green-700';
  if (booking.status === 'pending') return 'bg-yellow-50 border-yellow-100 text-yellow-700';
  if (isBookingDeclinedByTourist(booking)) return 'bg-orange-50 border-orange-100 text-orange-700';
  return 'bg-red-50 border-red-100 text-red-700';
}
