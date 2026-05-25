import type { BuiltRoute, BuiltRouteLeg, RouteMode } from './route';
import { withTimeout } from './withTimeout';

const OSRM_TIMEOUT_MS = 12_000;
const OSRM_BASE = import.meta.env.DEV ? '/osrm' : 'https://router.project-osrm.org';

type OsrmProfile = 'driving' | 'foot' | 'walking';

interface OsrmLeg {
  distance: number;
  duration: number;
}

interface OsrmRoute {
  distance: number;
  duration: number;
  geometry: { coordinates: [number, number][] };
  legs: OsrmLeg[];
}

interface OsrmResponse {
  code: string;
  message?: string;
  routes?: OsrmRoute[];
}

function profilesForMode(mode: RouteMode): OsrmProfile[] {
  return mode === 'walking' ? ['foot', 'walking'] : ['driving'];
}

function coordsPath(waypoints: [number, number][]): string {
  return waypoints.map(([lat, lng]) => `${lng},${lat}`).join(';');
}

function decodeGeometry(coordinates: [number, number][]): [number, number][] {
  return coordinates.map(([lng, lat]) => [lat, lng]);
}

function legGeometry(
  full: [number, number][],
  from: [number, number],
  to: [number, number],
): [number, number][] {
  const fromIdx = full.findIndex((p) => Math.abs(p[0] - from[0]) < 1e-5 && Math.abs(p[1] - from[1]) < 1e-5);
  const toIdx = full.findIndex(
    (p, i) => i > fromIdx && Math.abs(p[0] - to[0]) < 1e-5 && Math.abs(p[1] - to[1]) < 1e-5,
  );
  if (fromIdx >= 0 && toIdx > fromIdx) {
    return full.slice(fromIdx, toIdx + 1);
  }
  return [from, to];
}

async function fetchOsrmRoute(
  waypoints: [number, number][],
  profile: OsrmProfile,
): Promise<BuiltRoute> {
  const url =
    `${OSRM_BASE}/route/v1/${profile}/${coordsPath(waypoints)}` +
    '?overview=full&geometries=geojson&steps=false&continue_straight=true';

  const res = await withTimeout(fetch(url), OSRM_TIMEOUT_MS, 'OSRM');
  if (!res.ok) {
    throw new Error(`OSRM HTTP ${res.status}`);
  }

  const data = (await res.json()) as OsrmResponse;
  if (data.code !== 'Ok' || !data.routes?.[0]) {
    throw new Error(data.message ?? 'OSRM: маршрут не построен');
  }

  const route = data.routes[0];
  const geometry = decodeGeometry(route.geometry.coordinates);
  if (geometry.length < 2) {
    throw new Error('OSRM: пустая геометрия');
  }

  const osrmLegs = route.legs ?? [];
  const legs: BuiltRouteLeg[] =
    osrmLegs.length > 0
      ? osrmLegs.map((leg, i) => {
          const from = waypoints[i];
          const to = waypoints[i + 1];
          return {
            geometry: legGeometry(geometry, from, to),
            durationSec: Math.round(leg.duration),
            distanceM: Math.round(leg.distance),
          };
        })
      : waypoints.slice(0, -1).map((from, i) => ({
          geometry: legGeometry(geometry, from, waypoints[i + 1]),
          durationSec: 0,
          distanceM: 0,
        }));

  return {
    geometry,
    durationSec: Math.round(route.duration),
    distanceM: Math.round(route.distance),
    legs,
    source: 'osrm',
  };
}

export async function buildRouteViaOsrm(
  waypoints: [number, number][],
  mode: RouteMode,
): Promise<BuiltRoute> {
  if (waypoints.length < 2) {
    return { geometry: waypoints, durationSec: 0, distanceM: 0, legs: [], source: 'estimated' };
  }

  let lastError: Error | null = null;
  for (const profile of profilesForMode(mode)) {
    try {
      return await fetchOsrmRoute(waypoints, profile);
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
    }
  }

  throw lastError ?? new Error('OSRM недоступен');
}

export async function osrmDurationsFromOrigin(
  origin: [number, number],
  destinations: [number, number][],
  mode: RouteMode,
): Promise<number[]> {
  if (destinations.length === 0) return [];

  const points = [origin, ...destinations];
  const coords = coordsPath(points);
  const destIdx = destinations.map((_, i) => i + 1).join(';');

  for (const profile of profilesForMode(mode)) {
    const url =
      `${OSRM_BASE}/table/v1/${profile}/${coords}` +
      `?sources=0&destinations=${destIdx}&annotations=duration`;

    try {
      const res = await withTimeout(fetch(url), 8_000, 'OSRM Table');
      if (!res.ok) continue;
      const data = (await res.json()) as { code: string; durations?: number[][] };
      if (data.code !== 'Ok' || !data.durations?.[0]) continue;
      const row = data.durations[0].map((d) =>
        d != null && d >= 0 ? Math.round(d) : Infinity,
      );
      if (row.some((d) => d !== Infinity)) return row;
    } catch {
      /* следующий профиль */
    }
  }

  return destinations.map(() => Infinity);
}
