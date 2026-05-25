import { buildRouteViaOsrm, osrmDurationsFromOrigin } from './osrm';
import {
  buildEstimatedRoute,
  buildWalkingFromDrivingRoute,
  estimateDurationBetween,
} from './estimateRoute';
import { ensureRealisticWalkingRoute } from './segmentTransit';
import { buildRouteViaYmaps, waitForYmaps } from './routeYmaps';

export { buildSegmentTransitLegs, getRouteModeTotals } from './segmentTransit';
export type { RouteModeTotals, SegmentTransitLeg } from './segmentTransit';

export type RouteMode = 'driving' | 'walking';

export type RouteSource = 'osrm' | 'ymaps' | 'estimated';

export interface BuiltRouteLeg {
  geometry: [number, number][];
  durationSec: number;
  distanceM: number;
}

export interface BuiltRoute {
  geometry: [number, number][];
  durationSec: number;
  distanceM: number;
  legs: BuiltRouteLeg[];
  source: RouteSource;
}

async function buildDrivingRoute(waypoints: [number, number][]): Promise<BuiltRoute> {
  try {
    return await buildRouteViaOsrm(waypoints, 'driving');
  } catch {
    if (waypoints.length === 2) {
      const ymaps = await waitForYmaps(3_000);
      if (ymaps) {
        const viaYmaps = await buildRouteViaYmaps(waypoints, 'driving');
        return { ...viaYmaps, source: 'ymaps' };
      }
    }
    return buildEstimatedRoute(waypoints, 'driving');
  }
}

async function buildWalkingRoute(
  waypoints: [number, number][],
  drivingHint?: BuiltRoute,
): Promise<BuiltRoute> {
  try {
    return await buildRouteViaOsrm(waypoints, 'walking');
  } catch {
    if (drivingHint && drivingHint.source === 'osrm') {
      return buildWalkingFromDrivingRoute(drivingHint, waypoints);
    }
    try {
      const driving = drivingHint ?? (await buildRouteViaOsrm(waypoints, 'driving'));
      return buildWalkingFromDrivingRoute(driving, waypoints);
    } catch {
      return buildEstimatedRoute(waypoints, 'walking');
    }
  }
}

/** Авто + пешком за один проход (без двойного запроса driving). */
export async function buildRoutePair(waypoints: [number, number][]): Promise<{
  driving: BuiltRoute;
  walking: BuiltRoute;
}> {
  const driving = await buildDrivingRoute(waypoints);
  const walkingRaw = await buildWalkingRoute(waypoints, driving);
  const walking = ensureRealisticWalkingRoute(walkingRaw, driving, waypoints);
  return { driving, walking };
}

export async function fetchSegmentDurations(
  origin: [number, number],
  destinations: [number, number][],
  mode: RouteMode,
): Promise<number[]> {
  if (destinations.length === 0) return [];

  const osrm = await osrmDurationsFromOrigin(origin, destinations, mode);
  if (osrm.some((d) => Number.isFinite(d) && d > 0 && d !== Infinity)) {
    return osrm.map((d) => (d === Infinity ? 0 : d));
  }

  return destinations.map((dest) => estimateDurationBetween(origin, dest, mode));
}

export function isEstimatedRoute(route: BuiltRoute): boolean {
  return route.source === 'estimated';
}

export function isStraightLineFallback(route: BuiltRoute, pointCount: number): boolean {
  return isEstimatedRoute(route) && route.geometry.length === pointCount;
}

export function formatRouteDuration(seconds: number): string {
  if (seconds <= 0) return '—';
  if (seconds < 60) return `~${seconds} сек`;
  if (seconds < 3600) return `~${Math.round(seconds / 60)} мин`;
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return m > 0 ? `~${h} ч ${m} мин` : `~${h} ч`;
}

export function formatRouteDistance(meters: number): string {
  if (meters <= 0) return '—';
  if (meters < 1000) return `~${meters} м`;
  return `~${(meters / 1000).toFixed(1)} км`;
}
