import type { Category, MockItem } from './mockTypes';
import { EKATERINBURG_CENTER } from '../maps/constants';

const COORD_EPS = 1e-4;

/** Категории, отображаемые на общей карте города (без экскурсий). */
export const MAP_CATALOG_CATEGORIES = ['places', 'restaurants'] as const;

export type MapCatalogCategory = (typeof MAP_CATALOG_CATEGORIES)[number];

/** Ссылка на интерактивную карту на главной. */
export function buildCityMapUrl(options?: {
  highlight?: string;
  category?: Category;
}): string {
  const params = new URLSearchParams();
  if (options?.highlight) params.set('highlight', options.highlight);
  const cat = options?.category;
  if (cat && MAP_CATALOG_CATEGORIES.includes(cat as MapCatalogCategory)) {
    params.set('category', cat);
  }
  const qs = params.toString();
  return `/${qs ? `?${qs}` : ''}#map`;
}

export function isMapCatalogItem(item: MockItem): boolean {
  return MAP_CATALOG_CATEGORIES.includes(item.category as (typeof MAP_CATALOG_CATEGORIES)[number]);
}

function coordsMatchFallback(lat: number, lng: number): boolean {
  return (
    Math.abs(lat - EKATERINBURG_CENTER[0]) < COORD_EPS &&
    Math.abs(lng - EKATERINBURG_CENTER[1]) < COORD_EPS
  );
}

/** Есть ли у объекта координаты для отображения на карте (список не фильтруется). */
export function hasMapCoordinates(item: MockItem): boolean {
  if (!Number.isFinite(item.lat) || !Number.isFinite(item.lng)) return false;
  if (item.lat < -90 || item.lat > 90 || item.lng < -180 || item.lng > 180) return false;
  const hasAddress = Boolean(item.location?.trim());
  if (coordsMatchFallback(item.lat, item.lng) && !hasAddress) return false;
  return true;
}

export function resolveHasCoordinates(item: MockItem): boolean {
  return item.hasCoordinates ?? hasMapCoordinates(item);
}

/** Объекты для карты: нужная категория + валидные координаты. */
export function getMapCatalogItems(items: MockItem[]): MockItem[] {
  return items.filter(isMapCatalogItem).filter(resolveHasCoordinates);
}
