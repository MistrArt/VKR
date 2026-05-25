import React, { useMemo, useState } from 'react';
import { Calendar, Mail, Phone, Users } from 'lucide-react';
import type { MockItem } from '../data/mockData';
import type { Booking } from '../store/authSlice';
import ExcursionDateCalendar from './ExcursionDateCalendar';
import {
  formatExcursionDateLong,
  getExcursionAvailableDates,
  getExcursionStartTime,
  parseISODate,
} from '../utils/excursionSchedule';
import { normalizeBookingDateIso } from '../utils/bookingDate';

function bookingsForDate(bookings: Booking[], tourId: string, dateIso: string): Booking[] {
  return bookings.filter((b) => {
    if (b.itemId !== tourId) return false;
    return normalizeBookingDateIso(b.date) === dateIso;
  });
}

interface TourSchedulePanelProps {
  tour: MockItem;
  bookings: Booking[];
  initialDateIso?: string | null;
}

export default function TourSchedulePanel({
  tour,
  bookings,
  initialDateIso,
}: TourSchedulePanelProps) {
  const availableDates = useMemo(() => getExcursionAvailableDates(tour), [tour]);

  const [selectedDate, setSelectedDate] = useState<string | null>(() => {
    if (initialDateIso && availableDates.includes(initialDateIso)) return initialDateIso;
    return availableDates[0] ?? null;
  });

  const dayBookings = useMemo(() => {
    if (!selectedDate) return [];
    return bookingsForDate(bookings, tour.id, selectedDate);
  }, [tour.id, bookings, selectedDate]);

  const activeParticipants = dayBookings.filter(
    (b) => b.status === 'confirmed' || b.status === 'pending',
  );

  const startTime = selectedDate ? getExcursionStartTime(tour, selectedDate) : undefined;

  return (
    <div className="space-y-6">
      <ExcursionDateCalendar
        availableDates={availableDates}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        startTime={startTime}
      />

      {selectedDate && (
        <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-5 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-black text-gray-900">
                  {formatExcursionDateLong(selectedDate)}
                </p>
                {startTime && (
                  <p className="text-xs font-semibold text-gray-500">Начало в {startTime}</p>
                )}
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl text-xs font-black">
              <Users className="w-4 h-4" />
              {activeParticipants.length} из {tour.freeSlots ?? 15} мест
            </span>
          </div>

          {activeParticipants.length === 0 ? (
            <p className="text-sm font-bold text-gray-400 text-center py-6">
              На эту дату пока нет записавшихся участников
            </p>
          ) : (
            <ul className="space-y-3">
              {activeParticipants.map((b) => (
                <li
                  key={b.id}
                  className="p-4 bg-white rounded-2xl border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-black text-gray-900 text-sm">{b.touristName}</p>
                    <span
                      className={`inline-block mt-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        b.status === 'confirmed'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-yellow-50 text-yellow-700'
                      }`}
                    >
                      {b.status === 'confirmed' ? 'Подтверждён' : 'Ожидает'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 text-xs font-bold text-gray-500">
                    <a
                      href={`tel:${b.touristPhone || '+79123456789'}`}
                      className="flex items-center gap-1.5 hover:text-blue-600"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      {b.touristPhone || '+7 (912) 345-67-89'}
                    </a>
                    <a
                      href={`mailto:${b.touristEmail || 'tourist@demo-ural.ru'}`}
                      className="flex items-center gap-1.5 hover:text-blue-600"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      {b.touristEmail || 'tourist@demo-ural.ru'}
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
