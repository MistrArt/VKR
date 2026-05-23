import type { MockItem } from './mockTypes';

/** Объекты, отображаемые на общих картах (главная, каталог «На карте»). */
export function isMapCatalogItem(item: MockItem): boolean {
  return item.category === 'places' || item.category === 'restaurants';
}
