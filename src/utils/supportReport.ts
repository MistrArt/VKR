import type { Category, MockItem } from '../data/mockData';

export type TouristSupportType = 'appeal' | 'complaint_object' | 'complaint_excursion';
export type PartnerSupportType =
  | 'appeal'
  | 'complaint_object'
  | 'complaint_excursion'
  | 'complaint_platform';

export type SupportType = TouristSupportType | PartnerSupportType;

export interface SupportReportTarget {
  itemId: string;
  itemTitle: string;
  category: Category;
}

export function getComplaintTypeForCategory(category: Category): TouristSupportType {
  if (category === 'excursions') return 'complaint_excursion';
  return 'complaint_object';
}

export function buildReportMessage(target: SupportReportTarget): string {
  const kind =
    target.category === 'excursions'
      ? 'экскурсию'
      : target.category === 'restaurants'
        ? 'ресторан'
        : 'место';
  return `Жалоба на ${kind}: «${target.itemTitle}» (ID: ${target.itemId}).\n\nОпишите проблему:`;
}

/** Адрес места встречи для экскурсий (подпись «место встречи»). */
export function formatExcursionMeetingLocation(location?: string): string | null {
  if (!location) return null;
  const normalized = location.replace(/\(место сбора\)/gi, '(место встречи)');
  if (/место встречи/i.test(normalized)) return normalized;
  return `${normalized} (место встречи)`;
}

export function getItemMeetingLocation(item: MockItem): string | null {
  if (item.category !== 'excursions' || !item.location) return null;
  return formatExcursionMeetingLocation(item.location);
}

export const TOURIST_SUPPORT_TYPES: { id: TouristSupportType; label: string }[] = [
  { id: 'appeal', label: 'Вопрос' },
  { id: 'complaint_object', label: 'Жалоба на объект' },
  { id: 'complaint_excursion', label: 'Жалоба на экскурсию' },
];

export const PARTNER_SUPPORT_TYPES: { id: PartnerSupportType; label: string }[] = [
  { id: 'appeal', label: 'Вопрос' },
  { id: 'complaint_object', label: 'Жалоба на объект' },
  { id: 'complaint_excursion', label: 'Жалоба на экскурсию' },
  { id: 'complaint_platform', label: 'Проблема с сервисом' },
];
