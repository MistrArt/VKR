import { EKATERINBURG_BBOX } from '../constants';
import { getGeocoderKey, yandexFetch } from './client';

export class GeocodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GeocodeError';
  }
}

interface GeocodeResponse {
  response?: {
    GeoObjectCollection?: {
      featureMember?: Array<{
        GeoObject?: {
          Point?: { pos?: string };
          metaDataProperty?: {
            GeocoderMetaData?: { text?: string };
          };
        };
      }>;
    };
  };
  statusCode?: number;
  message?: string;
}

function bboxParam(): string {
  const [[south, west], [north, east]] = EKATERINBURG_BBOX;
  return `${west},${south}~${east},${north}`;
}

function parsePos(pos: string): [number, number] {
  const [lng, lat] = pos.trim().split(/\s+/).map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new GeocodeError('Некорректные координаты в ответе геокодера');
  }
  return [lat, lng];
}

/** Прямое геокодирование адреса → [широта, долгота]. */
export async function geocodeAddress(query: string): Promise<[number, number]> {
  const q = query.trim();
  if (!q) throw new GeocodeError('Адрес не указан');

  const apikey = getGeocoderKey();
  if (!apikey) throw new GeocodeError('Не задан ключ VITE_YANDEX_GEOCODER_API_KEY');

  const params = new URLSearchParams({
    apikey,
    geocode: q.includes('Екатеринбург') ? q : `Екатеринбург, ${q}`,
    format: 'json',
    lang: 'ru_RU',
    results: '1',
    bbox: bboxParam(),
    rspn: '1',
  });

  const data = await yandexFetch<GeocodeResponse>('geocode', params);
  const member = data.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject;
  const pos = member?.Point?.pos;
  if (!pos) {
    throw new GeocodeError(`Адрес не найден: «${q}»`);
  }
  return parsePos(pos);
}

/** Обратное геокодирование [широта, долгота] → текстовый адрес. */
export async function reverseGeocode([lat, lng]: [number, number]): Promise<string> {
  const apikey = getGeocoderKey();
  if (!apikey) throw new GeocodeError('Не задан ключ VITE_YANDEX_GEOCODER_API_KEY');

  const params = new URLSearchParams({
    apikey,
    geocode: `${lng},${lat}`,
    format: 'json',
    lang: 'ru_RU',
    results: '1',
    kind: 'house',
  });

  const data = await yandexFetch<GeocodeResponse>('geocode', params);
  const member = data.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject;
  const text = member?.metaDataProperty?.GeocoderMetaData?.text;
  if (!text) throw new GeocodeError('Не удалось определить адрес по координатам');
  return text;
}
