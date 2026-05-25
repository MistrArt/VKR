import { useCallback, useEffect, useRef, useState } from 'react';
import {
  buildRoutePair,
  isEstimatedRoute,
  isStraightLineFallback,
  type BuiltRoute,
} from '../api/route';
import { buildEstimatedRoute } from '../api/estimateRoute';
import { withTimeout } from '../api/withTimeout';

export interface DualRoutesState {
  driving: BuiltRoute | null;
  walking: BuiltRoute | null;
  loading: boolean;
  error: string | null;
  isFallbackGeometry: boolean;
  hint: string | null;
}

const emptyState: DualRoutesState = {
  driving: null,
  walking: null,
  loading: false,
  error: null,
  isFallbackGeometry: false,
  hint: null,
};

const MODE_TIMEOUT_MS = 18_000;

export function useDualRoutes(
  waypoints: [number, number][] | null,
  enabled = true,
): DualRoutesState & { reload: () => void } {
  const [state, setState] = useState<DualRoutesState>(emptyState);
  const [reloadToken, setReloadToken] = useState(0);
  const waypointsKey = waypoints?.map((p) => p.join(',')).join('|') ?? '';
  const requestIdRef = useRef(0);

  const reload = useCallback(() => setReloadToken((n) => n + 1), []);

  useEffect(() => {
    if (!enabled || !waypoints || waypoints.length < 2) {
      setState(emptyState);
      return;
    }

    const requestId = ++requestIdRef.current;
    let cancelled = false;

    const load = async () => {
      setState({
        driving: null,
        walking: null,
        loading: true,
        error: null,
        isFallbackGeometry: false,
        hint: null,
      });

      const pair = await withTimeout(buildRoutePair(waypoints), MODE_TIMEOUT_MS * 2, 'Маршруты')
        .catch(async () => ({
          driving: buildEstimatedRoute(waypoints, 'driving'),
          walking: buildEstimatedRoute(waypoints, 'walking'),
        }));

      const { driving, walking } = pair;
      if (cancelled || requestId !== requestIdRef.current) return;

      const isStraight =
        isStraightLineFallback(driving, waypoints.length) &&
        isStraightLineFallback(walking, waypoints.length);

      const allEstimated = isEstimatedRoute(driving) && isEstimatedRoute(walking);

      const ratio =
        driving.durationSec > 0 && walking.durationSec > 0
          ? walking.durationSec / driving.durationSec
          : 0;

      setState({
        driving,
        walking,
        loading: false,
        error: isStraight ? 'Не удалось получить линию маршрута. Проверьте интернет.' : null,
        isFallbackGeometry: isStraight,
        hint: allEstimated
          ? 'Время приблизительное. На карте — маршрут выбранного способа передвижения.'
          : driving.source === 'osrm'
            ? ratio >= 1.4
              ? 'Маршрут по дорогам (OpenStreetMap)'
              : 'Пешком: оценка по длине пути (профиль пешехода OSRM недоступен)'
            : null,
      });
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [waypointsKey, enabled, reloadToken]);

  return { ...state, reload };
}
