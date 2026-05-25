import type { BuiltRoute, BuiltRouteLeg, RouteMode } from './route';
import { withTimeout } from './withTimeout';

const YMAPS_ROUTE_TIMEOUT_MS = 8_000;

type YmapsPath = {
  geometry: { getCoordinates: () => number[][] };
};

type YmapsRouteLike = {
  getPaths: () => { each: (cb: (path: YmapsPath) => void) => void };
  getJamsTime?: () => number;
  getTime?: () => number;
  getLength?: () => number;
};

type YmapsApi = {
  ready: Promise<unknown>;
  route: (
    points: [number, number][],
    options: { routingMode: string; mapStateAutoApply: boolean },
  ) => Promise<YmapsRouteLike>;
};

function getYmaps(): YmapsApi | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as unknown as Window & { ymaps?: YmapsApi }).ymaps;
}

export async function waitForYmaps(timeoutMs = 5_000): Promise<YmapsApi | null> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const ymaps = getYmaps();
    if (ymaps) {
      await ymaps.ready;
      return ymaps;
    }
    await new Promise((r) => setTimeout(r, 80));
  }
  return null;
}

export async function buildRouteViaYmaps(
  waypoints: [number, number][],
  mode: RouteMode,
): Promise<Omit<BuiltRoute, 'source'>> {
  const ymaps = await waitForYmaps();
  if (!ymaps) throw new Error('Yandex Maps JS API не загружен');

  const routingMode = mode === 'walking' ? 'pedestrian' : 'auto';
  const route = (await withTimeout(
    ymaps.route(
      waypoints.map(([lat, lng]) => [lat, lng]),
      { routingMode, mapStateAutoApply: false },
    ),
    YMAPS_ROUTE_TIMEOUT_MS,
    'Яндекс.Карты',
  )) as YmapsRouteLike;

  const geometry: [number, number][] = [];
  route.getPaths().each((path) => {
    for (const c of path.geometry.getCoordinates()) {
      if (c.length < 2) continue;
      const pair: [number, number] = [c[0], c[1]];
      const prev = geometry[geometry.length - 1];
      if (!prev || prev[0] !== pair[0] || prev[1] !== pair[1]) geometry.push(pair);
    }
  });

  if (geometry.length < 2) throw new Error('Пустой маршрут');

  const durationSec = Math.round(route.getJamsTime?.() ?? route.getTime?.() ?? 0);
  const distanceM = Math.round(route.getLength?.() ?? 0);
  const legs: BuiltRouteLeg[] =
    waypoints.length === 2
      ? [{ geometry, durationSec, distanceM }]
      : [];

  return { geometry, durationSec, distanceM, legs };
}
