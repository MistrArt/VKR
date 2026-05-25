import { EKATERINBURG_BBOX } from '../constants';
import { getSuggestKey, yandexFetch } from './client';

export interface SuggestItem {
  /** Текст для поля ввода */
  value: string;
  title: string;
  subtitle?: string;
  /** URI для точного геокодирования (опционально) */
  uri?: string;
}

export interface SuggestOptions {
  /** Ограничивающий bbox [[юг, запад], [север, восток]] — по умолчанию Екб */
  bbox?: [[number, number], [number, number]];
  results?: number;
}

interface SuggestResponse {
  results?: Array<{
    title?: { text?: string };
    subtitle?: { text?: string };
    address?: { formatted_address?: string };
    uri?: string;
  }>;
}

function bboxToParam(bbox: [[number, number], [number, number]]): string {
  const [[south, west], [north, east]] = bbox;
  return `${west},${south}~${east},${north}`;
}

/** Запрос подсказок адреса (без debounce). */
export async function fetchSuggest(
  q: string,
  options: SuggestOptions = {},
): Promise<SuggestItem[]> {
  const text = q.trim();
  if (!text) return [];

  const apikey = getSuggestKey();
  if (!apikey) return [];

  const bbox = options.bbox ?? EKATERINBURG_BBOX;
  const params = new URLSearchParams({
    apikey,
    text,
    lang: 'ru',
    results: String(options.results ?? 5),
    bbox: bboxToParam(bbox),
    print_address: '1',
    types: 'geo,house,street',
  });

  try {
    const data = await yandexFetch<SuggestResponse>('suggest', params);
    return (data.results ?? []).map((r) => {
      const title = r.title?.text ?? '';
      const subtitle = r.subtitle?.text;
      const value = r.address?.formatted_address ?? title;
      return { value, title, subtitle, uri: r.uri };
    });
  } catch {
    return [];
  }
}

const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Debounced-обёртка над fetchSuggest (300 ms по умолчанию).
 * Отменяет предыдущий таймер для того же ключа (например id поля).
 */
export function fetchSuggestDebounced(
  q: string,
  options: SuggestOptions & { debounceMs?: number; key?: string } = {},
): Promise<SuggestItem[]> {
  const ms = options.debounceMs ?? 300;
  const key = options.key ?? 'default';

  return new Promise((resolve) => {
    const prev = debounceTimers.get(key);
    if (prev) clearTimeout(prev);

    debounceTimers.set(
      key,
      setTimeout(async () => {
        debounceTimers.delete(key);
        resolve(await fetchSuggest(q, options));
      }, ms),
    );
  });
}
