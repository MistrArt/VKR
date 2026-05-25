import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { YMaps, useYMaps } from '@pbe/react-yandex-maps';
import {
  classifyMapLoadError,
  loadTimeoutError,
  MAP_LOAD_TIMEOUT_MS,
  missingKeyError,
  type MapLoadErrorKind,
} from './mapLoadState';

export interface YandexMapsContextValue {
  ready: boolean;
  error: string | null;
  errorKind: MapLoadErrorKind | null;
  retry: () => void;
}

const defaultContext: YandexMapsContextValue = {
  ready: false,
  error: null,
  errorKind: null,
  retry: () => {},
};

const YandexMapsContext = createContext<YandexMapsContextValue>(defaultContext);

export function useYandexMapsContext(): YandexMapsContextValue {
  return useContext(YandexMapsContext);
}

function buildYandexMapsQuery() {
  const query: {
    lang: 'ru_RU';
    apikey: string;
    suggest_apikey?: string;
  } = {
    lang: 'ru_RU',
    apikey: import.meta.env.VITE_YANDEX_MAPS_API_KEY ?? '',
  };
  const suggestKey = import.meta.env.VITE_YANDEX_SUGGEST_API_KEY?.trim();
  if (suggestKey) query.suggest_apikey = suggestKey;
  return query;
}

function MapsReadyBridge({
  onReady,
  onError,
}: {
  onReady: () => void;
  onError: (message: string) => void;
}) {
  const ymaps = useYMaps(['Map', 'Placemark', 'Polyline', 'ObjectManager', 'route']);

  useEffect(() => {
    if (!ymaps) return;
    try {
      onReady();
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    }
  }, [ymaps, onReady, onError]);

  return null;
}

function YandexMapsRuntime({
  children,
  loadAttempt,
  onReady,
  onError,
}: {
  children: React.ReactNode;
  loadAttempt: number;
  onReady: () => void;
  onError: (message: string) => void;
}) {
  return (
    <YMaps key={loadAttempt} query={buildYandexMapsQuery()} preload>
      <MapsReadyBridge onReady={onReady} onError={onError} />
      {children}
    </YMaps>
  );
}

export function YandexMapsProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorKind, setErrorKind] = useState<MapLoadErrorKind | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  const apiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY?.trim();
  const hasKey = Boolean(apiKey);

  const applyError = useCallback((raw: string) => {
    const classified = classifyMapLoadError(raw);
    setError(classified.message);
    setErrorKind(classified.kind);
    setReady(false);
  }, []);

  const retry = useCallback(() => {
    setReady(false);
    setError(null);
    setErrorKind(null);
    setLoadAttempt((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!hasKey) {
      const missing = missingKeyError();
      setError(missing.message);
      setErrorKind(missing.kind);
      setReady(false);
    }
  }, [hasKey, loadAttempt]);

  useEffect(() => {
    if (!hasKey || error) return;

    const timeoutId = window.setTimeout(() => {
      if (!ready) {
        const timed = loadTimeoutError();
        setError(timed.message);
        setErrorKind(timed.kind);
      }
    }, MAP_LOAD_TIMEOUT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [hasKey, ready, error, loadAttempt]);

  useEffect(() => {
    if (!hasKey) return;

    const onWindowError = (event: ErrorEvent) => {
      const src = event.filename ?? '';
      const msg = event.message ?? '';
      if (!src.includes('yandex') && !msg.toLowerCase().includes('ymaps')) return;
      applyError(msg || 'Yandex Maps script error');
    };

    window.addEventListener('error', onWindowError);
    return () => window.removeEventListener('error', onWindowError);
  }, [hasKey, loadAttempt, applyError]);

  const handleReady = useCallback(() => {
    setReady(true);
    setError(null);
    setErrorKind(null);
  }, []);

  const contextValue = useMemo<YandexMapsContextValue>(
    () => ({
      ready: ready && !error && hasKey,
      error,
      errorKind,
      retry,
    }),
    [ready, error, errorKind, retry, hasKey],
  );

  return (
    <YandexMapsContext.Provider value={contextValue}>
      {hasKey ? (
        <YandexMapsRuntime
          loadAttempt={loadAttempt}
          onReady={handleReady}
          onError={applyError}
        >
          {children}
        </YandexMapsRuntime>
      ) : (
        children
      )}
    </YandexMapsContext.Provider>
  );
}
