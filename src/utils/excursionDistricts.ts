import type { MockItem } from '../data/mockData';

export function getItemDistricts(item: MockItem): string[] {
  if (item.districts?.length) return item.districts;
  if (item.district?.trim()) return [item.district.trim()];
  return [];
}

export function formatDistrictsLabel(item: MockItem): string {
  const list = getItemDistricts(item);
  return list.length > 0 ? list.join(', ') : 'Екатеринбург';
}
