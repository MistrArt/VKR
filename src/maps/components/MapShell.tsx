import React from 'react';
import { AlertCircle, KeyRound, RefreshCw, WifiOff, Gauge } from 'lucide-react';
import { useYandexMapsContext } from '../YandexMapsProvider';
import type { MapLoadErrorKind } from '../mapLoadState';

export interface MapShellProps {
  children: React.ReactNode;
  height?: string;
  className?: string;
  roundedClassName?: string;
  shellRef?: React.RefObject<HTMLDivElement | null>;
}

function errorIcon(kind: MapLoadErrorKind) {
  switch (kind) {
    case 'missing_key':
    case 'invalid_key':
      return KeyRound;
    case 'rate_limit':
      return Gauge;
    case 'network':
      return WifiOff;
    default:
      return AlertCircle;
  }
}

function MapSkeleton() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-50" aria-hidden>
      <div className="absolute inset-0 animate-pulse">
        <div className="absolute top-[18%] left-[22%] h-24 w-24 rounded-full bg-gray-200/90" />
        <div className="absolute top-[42%] left-[48%] h-16 w-16 rounded-full bg-gray-200/80" />
        <div className="absolute bottom-[28%] right-[20%] h-20 w-20 rounded-full bg-gray-200/85" />
        <div className="absolute top-[12%] right-[18%] h-10 w-28 rounded-xl bg-gray-200/70" />
        <div className="absolute bottom-[14%] left-[14%] h-8 w-36 rounded-lg bg-gray-200/60" />
      </div>
    </div>
  );
}

function MapErrorPanel({
  message,
  kind,
  onRetry,
}: {
  message: string;
  kind: MapLoadErrorKind;
  onRetry?: () => void;
}) {
  const Icon = errorIcon(kind);
  const title =
    kind === 'missing_key' || kind === 'invalid_key'
      ? 'Карта недоступна'
      : kind === 'rate_limit'
        ? 'Лимит API'
        : kind === 'network'
          ? 'Нет соединения'
          : 'Ошибка карты';

  return (
    <div
      className="flex h-full min-h-[12rem] flex-col items-center justify-center gap-4 px-6 py-8 text-center"
      role="alert"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm border border-gray-100">
        <Icon className="h-6 w-6 text-gray-500" aria-hidden />
      </div>
      <div className="max-w-md space-y-2">
        <p className="text-sm font-black text-gray-800">{title}</p>
        <p className="text-sm font-medium leading-relaxed text-gray-600">{message}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          Повторить
        </button>
      )}
    </div>
  );
}

export default function MapShell({
  children,
  height = '100%',
  className = '',
  roundedClassName = 'rounded-[2rem]',
  shellRef,
}: MapShellProps) {
  const { ready, error, errorKind, retry } = useYandexMapsContext();

  const shellClass = `relative w-full overflow-hidden ${roundedClassName} ${className}`;

  if (error) {
    const canRetry = errorKind !== 'missing_key';
    return (
      <div
        className={`${shellClass} border border-gray-200 bg-gray-50`}
        style={{ height }}
        aria-label="Ошибка загрузки карты"
      >
        <MapErrorPanel message={error} kind={errorKind ?? 'unknown'} onRetry={canRetry ? retry : undefined} />
      </div>
    );
  }

  if (!ready) {
    return (
      <div
        className={`${shellClass} border border-gray-100 bg-gray-50`}
        style={{ height }}
        aria-busy="true"
        aria-label="Загрузка карты"
      >
        <MapSkeleton />
        <span className="sr-only">Загрузка карты…</span>
      </div>
    );
  }

  return (
    <div ref={shellRef} className={shellClass} style={{ height }}>
      {children}
    </div>
  );
}
