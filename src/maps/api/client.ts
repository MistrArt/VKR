/**
 * Общий HTTP-клиент для API Яндекса (геокодер, саджест, маршрутизатор).
 * При CORS включите VITE_YANDEX_GEO_PROXY=true — запросы пойдут через /api/geo/* (см. docs/geo-proxy-spring.md).
 */

export type YandexGeoService = 'geocode' | 'suggest' | 'route';

const DIRECT_BASE: Record<YandexGeoService, string> = {
  geocode: 'https://geocode-maps.yandex.ru/v1/',
  suggest: 'https://suggest-maps.yandex.ru/v1/suggest',
  route: 'https://api.routing.yandex.net/v2/route',
};

const useProxy = import.meta.env.VITE_YANDEX_GEO_PROXY === 'true';
const useDevProxy = import.meta.env.DEV && !useProxy;

const DEV_PROXY_BASE: Record<YandexGeoService, string> = {
  geocode: '/dev-yandex/geocode',
  suggest: '/dev-yandex/suggest',
  route: '/dev-yandex/route',
};

export function yandexApiUrl(service: YandexGeoService, params: URLSearchParams): string {
  if (useProxy) {
    return `/api/geo/${service}?${params.toString()}`;
  }
  if (useDevProxy) {
    return `${DEV_PROXY_BASE[service]}?${params.toString()}`;
  }
  const base = DIRECT_BASE[service];
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

export async function yandexFetch<T>(
  service: YandexGeoService,
  params: URLSearchParams,
  init?: RequestInit,
): Promise<T> {
  const url = yandexApiUrl(service, params);
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Yandex ${service} HTTP ${res.status}${body ? `: ${body.slice(0, 200)}` : ''}`);
  }
  return res.json() as Promise<T>;
}

export function getGeocoderKey(): string | undefined {
  return (
    import.meta.env.VITE_YANDEX_GEOCODER_API_KEY?.trim() ||
    import.meta.env.VITE_YANDEX_MAPS_API_KEY?.trim() ||
    undefined
  );
}

export function getSuggestKey(): string | undefined {
  return (
    import.meta.env.VITE_YANDEX_SUGGEST_API_KEY?.trim() ||
    import.meta.env.VITE_YANDEX_GEOCODER_API_KEY?.trim() ||
    undefined
  );
}
