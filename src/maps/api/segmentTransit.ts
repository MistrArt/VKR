import { haversineMeters } from '../../utils/geo';
import type { BuiltRoute, RouteMode } from './route';
import { buildWalkingFromDrivingRoute } from './estimateRoute';

const WALK_TIME_FACTOR = 5.5;
const WALK_DIST_FACTOR = 1.15;
const MIN_WALK_TO_DRIVE_RATIO = 2.2;
/** Выше ~6.5 км/ч для «пешком» — скорее всего подставлены данные авто. */
const WALK_MAX_SPEED_KMH = 6.5;

export interface SegmentTransitLeg {
  drivingSec: number;
  walkingSec: number;
  drivingDist: number;
  walkingDist: number;
}

export interface RouteModeTotals {
  durationSec: number;
  distanceM: number;
}

function walkingSpeedKmh(route: BuiltRoute): number {
  if (route.durationSec <= 0 || route.distanceM <= 0) return 0;
  return route.distanceM / 1000 / (route.durationSec / 3600);
}

function routesNeedWalkingFix(driving: BuiltRoute, walking: BuiltRoute): boolean {
  if (driving.durationSec <= 0) return walkingSpeedKmh(walking) > WALK_MAX_SPEED_KMH;

  if (walking.durationSec <= driving.durationSec * MIN_WALK_TO_DRIVE_RATIO) {
    return true;
  }

  if (Math.abs(walking.durationSec - driving.durationSec) < 45) {
    return true;
  }

  if (walkingSpeedKmh(walking) > WALK_MAX_SPEED_KMH) {
    return true;
  }

  return false;
}

export function ensureRealisticWalkingRoute(
  walking: BuiltRoute,
  driving: BuiltRoute,
  waypoints: [number, number][],
): BuiltRoute {
  if (!routesNeedWalkingFix(driving, walking)) {
    return walking;
  }
  return buildWalkingFromDrivingRoute(driving, waypoints);
}

function legShareWeights(waypoints: [number, number][]): number[] {
  const weights: number[] = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    weights.push(
      haversineMeters(
        waypoints[i][0],
        waypoints[i][1],
        waypoints[i + 1][0],
        waypoints[i + 1][1],
      ),
    );
  }
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum <= 0) return weights.map(() => 1 / weights.length);
  return weights.map((w) => w / sum);
}

function pickLegMetrics(
  route: BuiltRoute,
  index: number,
  segmentCount: number,
  waypoints: [number, number][],
): { durationSec: number; distanceM: number } {
  const leg = route.legs[index];
  if (leg && (leg.durationSec > 0 || leg.distanceM > 0)) {
    return { durationSec: leg.durationSec, distanceM: leg.distanceM };
  }

  const weights = legShareWeights(waypoints);
  const w = weights[index] ?? 1 / segmentCount;
  return {
    durationSec: Math.round(route.durationSec * w),
    distanceM: Math.round(route.distanceM * w),
  };
}

function walkingFromDrivingSegment(
  drivingSec: number,
  drivingDist: number,
): { walkingSec: number; walkingDist: number } {
  if (drivingSec <= 0 && drivingDist <= 0) {
    return { walkingSec: 0, walkingDist: 0 };
  }
  return {
    walkingSec: drivingSec > 0 ? Math.max(90, Math.round(drivingSec * WALK_TIME_FACTOR)) : 0,
    walkingDist: drivingDist > 0 ? Math.round(drivingDist * WALK_DIST_FACTOR) : 0,
  };
}

export function buildSegmentTransitLegs(
  waypoints: [number, number][],
  driving: BuiltRoute,
  walking: BuiltRoute,
): SegmentTransitLeg[] {
  const count = Math.max(0, waypoints.length - 1);
  if (count === 0) return [];

  const realisticWalking = ensureRealisticWalkingRoute(walking, driving, waypoints);

  return Array.from({ length: count }, (_, i) => {
    const d = pickLegMetrics(driving, i, count, waypoints);
    const w = pickLegMetrics(realisticWalking, i, count, waypoints);

    let walkingSec = w.durationSec;
    let walkingDist = w.distanceM;

    if (d.durationSec > 0 && walkingSec < d.durationSec * MIN_WALK_TO_DRIVE_RATIO) {
      const derived = walkingFromDrivingSegment(d.durationSec, d.distanceM);
      walkingSec = derived.walkingSec;
      walkingDist = derived.walkingDist;
    } else if (d.distanceM > 0 && walkingDist > 0 && walkingDist < d.distanceM * 1.05) {
      walkingDist = Math.round(d.distanceM * WALK_DIST_FACTOR);
    }

    return {
      drivingSec: d.durationSec,
      walkingSec,
      drivingDist: d.distanceM,
      walkingDist,
    };
  });
}

/** Итог в шапке карты — сумма участков (совпадает со списком слева). */
export function getRouteModeTotals(
  waypoints: [number, number][],
  driving: BuiltRoute,
  walking: BuiltRoute,
  mode: RouteMode,
): RouteModeTotals {
  const segments = buildSegmentTransitLegs(waypoints, driving, walking);

  if (mode === 'walking') {
    const durationSec = segments.reduce((s, leg) => s + leg.walkingSec, 0);
    const distanceM = segments.reduce((s, leg) => s + leg.walkingDist, 0);
    if (durationSec > 0) {
      return { durationSec, distanceM: distanceM || walking.distanceM };
    }
    const fixed = ensureRealisticWalkingRoute(walking, driving, waypoints);
    return { durationSec: fixed.durationSec, distanceM: fixed.distanceM };
  }

  const durationSec = segments.reduce((s, leg) => s + leg.drivingSec, 0);
  const distanceM = segments.reduce((s, leg) => s + leg.drivingDist, 0);
  return {
    durationSec: durationSec || driving.durationSec,
    distanceM: distanceM || driving.distanceM,
  };
}
