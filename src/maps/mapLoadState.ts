/** Категории ошибок загрузки JavaScript API Яндекс.Карт */
export type MapLoadErrorKind =
  | 'missing_key'
  | 'invalid_key'
  | 'network'
  | 'rate_limit'
  | 'unknown';

export interface MapLoadError {
  kind: MapLoadErrorKind;
  message: string;
}

const MISSING_KEY_MSG =
  'Не задан ключ VITE_YANDEX_MAPS_API_KEY. Скопируйте .env.example в .env.local и укажите ключ JavaScript API.';

export function missingKeyError(): MapLoadError {
  return { kind: 'missing_key', message: MISSING_KEY_MSG };
}

/** Классификация по тексту ошибки / HTTP (скрипт API, fetch гео-сервисов). */
export function classifyMapLoadError(raw: string): MapLoadError {
  const text = raw.toLowerCase();

  if (
    text.includes('apikey') ||
    text.includes('api key') ||
    text.includes('invalid key') ||
    text.includes('неверн') ||
    text.includes('referer') ||
    text.includes('forbidden') ||
    text.includes('http 403') ||
    text.includes('401')
  ) {
    return {
      kind: 'invalid_key',
      message:
        'Ключ Яндекс.Карт отклонён. Проверьте VITE_YANDEX_MAPS_API_KEY, пакет JavaScript API и ограничение Referer (localhost:3000, 127.0.0.1, домен продакшена).',
    };
  }

  if (
    text.includes('429') ||
    text.includes('quota') ||
    text.includes('limit') ||
    text.includes('лимит') ||
    text.includes('rate')
  ) {
    return {
      kind: 'rate_limit',
      message:
        'Превышен лимит запросов к API Яндекса. Подождите или проверьте тариф в кабинете developer.tech.yandex.ru.',
    };
  }

  if (
    text.includes('network') ||
    text.includes('fetch') ||
    text.includes('timeout') ||
    text.includes('таймаут') ||
    text.includes('failed to load') ||
    text.includes('не удалось') ||
    text.includes('offline') ||
    text.includes('http 5')
  ) {
    return {
      kind: 'network',
      message:
        'Не удалось загрузить карты. Проверьте интернет, VPN и доступ к api-maps.yandex.ru, затем нажмите «Повторить».',
    };
  }

  return {
    kind: 'unknown',
    message: raw.trim() || 'Не удалось инициализировать Яндекс.Карты.',
  };
}

export function loadTimeoutError(): MapLoadError {
  return classifyMapLoadError('timeout: failed to load yandex maps script');
}

export const MAP_LOAD_TIMEOUT_MS = 25_000;
