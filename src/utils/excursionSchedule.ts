import type { MockItem } from '../data/mockData';

const MS_PER_DAY = 86_400_000;

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function isOnOrAfterToday(iso: string): boolean {
  return parseISODate(iso).getTime() >= startOfToday().getTime();
}

function datesBetweenInclusive(startIso: string, endIso: string): string[] {
  const result: string[] = [];
  let cursor = parseISODate(startIso);
  const end = parseISODate(endIso);
  while (cursor.getTime() <= end.getTime()) {
    result.push(toISODate(cursor));
    cursor = new Date(cursor.getTime() + MS_PER_DAY);
  }
  return result;
}

const WEEKDAY_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'] as const;

function weekdaySortKey(dow: number): number {
  return dow === 0 ? 7 : dow;
}

export function formatWeekDaysLabel(weekDays: number[]): string {
  if (!weekDays.length) return '';
  const unique = [...new Set(weekDays)];
  unique.sort((a, b) => weekdaySortKey(a) - weekdaySortKey(b));
  return unique.map((d) => WEEKDAY_SHORT[d] ?? '?').join(', ');
}

export function generateDatesFromWeekDays(weekDays: number[], daysAhead = 56): string[] {
  if (!weekDays.length) return [];
  const allowed = new Set(weekDays);
  const today = startOfToday();
  const result: string[] = [];
  for (let i = 0; i < daysAhead; i++) {
    const day = new Date(today.getTime() + i * MS_PER_DAY);
    if (allowed.has(day.getDay())) result.push(toISODate(day));
  }
  return result;
}

export function inferWeekDaysFromTour(tour: MockItem): number[] {
  if (tour.weekDays?.length) return tour.weekDays;
  return [6, 0];
}

function schedulePatternForItem(item: MockItem): (day: Date) => boolean {
  if (item.weekDays?.length) {
    const allowed = new Set(item.weekDays);
    return (day: Date) => allowed.has(day.getDay());
  }
  const seed = item.id.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const mode = seed % 3;
  return (day: Date) => {
    const dow = day.getDay();
    if (mode === 0) return dow === 0 || dow === 6;
    if (mode === 1) return dow === 2 || dow === 4;
    return dow !== 1;
  };
}

function generatePatternDates(item: MockItem, daysAhead = 56): string[] {
  if (item.weekDays?.length) {
    return generateDatesFromWeekDays(item.weekDays, daysAhead);
  }
  const today = startOfToday();
  const matches = schedulePatternForItem(item);
  const result: string[] = [];
  for (let i = 0; i < daysAhead; i++) {
    const day = new Date(today.getTime() + i * MS_PER_DAY);
    if (matches(day)) result.push(toISODate(day));
  }
  return result;
}

export function getExcursionAvailableDates(item: MockItem): string[] {
  if (item.weekDays?.length) {
    const fromWeek = generateDatesFromWeekDays(item.weekDays);
    if (fromWeek.length) return fromWeek;
  }

  if (item.availableDates?.length) {
    return item.availableDates.filter(isOnOrAfterToday);
  }

  const isoInDates = item.dates?.find((d) => /^\d{4}-\d{2}-\d{2}/.test(d));
  if (isoInDates) {
    const start = isoInDates.slice(0, 10);
    const end = item.dates?.find((d, i) => i > 0 && /^\d{4}-\d{2}-\d{2}/.test(d))?.slice(0, 10) || start;
    return datesBetweenInclusive(start, end).filter(isOnOrAfterToday);
  }

  return generatePatternDates(item);
}

export function getExcursionStartTime(item: MockItem, dateIso: string): string {
  if (item.defaultStartTime) return item.defaultStartTime;
  const dow = parseISODate(dateIso).getDay();
  if (dow === 0 || dow === 6) return '11:00';
  if (dow === 2 || dow === 4) return '19:00';
  return '12:00';
}

export function formatExcursionDateLong(iso: string): string {
  return parseISODate(iso).toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatExcursionDateShort(iso: string): string {
  return parseISODate(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  });
}

export function formatBookingDateTime(item: MockItem, dateIso: string): string {
  const time = getExcursionStartTime(item, dateIso);
  return `${formatExcursionDateLong(dateIso)}, ${time}`;
}
