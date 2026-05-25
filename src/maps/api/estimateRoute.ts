import { haversineMeters } from '../../utils/geo';
import type { BuiltRoute, BuiltRouteLeg, RouteMode } from './route';

/** Пешком путь обычно длиннее и медленнее, чем на машине по тем же точкам. */
const MODE_PARAMS: Record<
  RouteMode,
  { speedKmh: number; pathFactor: number; minLegSec: number }
> = {
  driving: { speedKmh: 30, pathFactor: 1.4, minLegSec: 30 },
  walking: { speedKmh: 4.5, pathFactor: 1.55, minLegSec: 45 },
};

export function estimatePathMeters(straightM: number, mode: RouteMode): number {
  return Math.round(straightM * MODE_PARAMS[mode].pathFactor);
}

export function estimateSegmentDurationMeters(distanceM: number, mode: RouteMode): number {
  const { speedKmh, pathFactor, minLegSec } = MODE_PARAMS[mode];
  const adjustedM = distanceM * pathFactor;
  const sec = (adjustedM / 1000 / speedKmh) * 3600;
  return Math.max(minLegSec, Math.round(sec));
}

export function buildEstimatedRoute(waypoints: [number, number][], mode: RouteMode): BuiltRoute {
  const legs: BuiltRouteLeg[] = [];
  let durationSec = 0;
  let distanceM = 0;

  for (let i = 0; i < waypoints.length - 1; i++) {
    const from = waypoints[i];
    const to = waypoints[i + 1];
    const straight = haversineMeters(from[0], from[1], to[0], to[1]);
    const pathM = estimatePathMeters(straight, mode);
    const legDuration = estimateSegmentDurationMeters(straight, mode);
    legs.push({
      geometry: [from, to],
      durationSec: legDuration,
      distanceM: pathM,
    });
    durationSec += legDuration;
    distanceM += pathM;
  }

  const geometry: [number, number][] = [];
  for (const leg of legs) {
    for (const pt of leg.geometry) {
      const prev = geometry[geometry.length - 1];
      if (!prev || prev[0] !== pt[0] || prev[1] !== pt[1]) {
        geometry.push(pt);
      }
    }
  }

  return {
    geometry,
    durationSec,
    distanceM,
    legs,
    source: 'estimated',
  };
}

/** Пеший маршрут по длинам участков авто (если OSRM foot недоступен). */
export function buildWalkingFromDrivingRoute(
  driving: BuiltRoute,
  waypoints: [number, number][],
): BuiltRoute {
  const legs: BuiltRouteLeg[] = driving.legs.map((leg, i) => {
    const from = waypoints[i];
    const to = waypoints[i + 1];
    const straight = haversineMeters(from[0], from[1], to[0], to[1]);
    const walkDist =
      leg.distanceM > 0 ? Math.round(leg.distanceM * 1.12) : estimatePathMeters(straight, 'walking');
    const walkSec =
      leg.durationSec > 0
        ? Math.max(90, Math.round(leg.durationSec * 5.5))
        : estimateSegmentDurationMeters(straight, 'walking');

    return {
      geometry: leg.geometry.length >= 2 ? leg.geometry : [from, to],
      durationSec: walkSec,
      distanceM: walkDist,
    };
  });

  if (legs.length === 0 && waypoints.length >= 2) {
    const count = waypoints.length - 1;
    const weights = waypoints.slice(0, -1).map((from, i) => {
      const to = waypoints[i + 1];
      return haversineMeters(from[0], from[1], to[0], to[1]);
    });
    const sum = weights.reduce((a, b) => a + b, 0) || 1;
    const distributed: BuiltRouteLeg[] = waypoints.slice(0, -1).map((from, i) => {
      const to = waypoints[i + 1];
      const share = weights[i] / sum;
      const dSec = Math.round(driving.durationSec * share);
      const dDist = Math.round(driving.distanceM * share);
      return {
        geometry: [from, to],
        durationSec: dSec > 0 ? Math.max(90, Math.round(dSec * 5.5)) : estimateSegmentDurationMeters(weights[i], 'walking'),
        distanceM: dDist > 0 ? Math.round(dDist * 1.15) : estimatePathMeters(weights[i], 'walking'),
      };
    });
    const geometry =
      driving.geometry.length >= 2 ? driving.geometry : mergeLegGeometries(distributed);
    return {
      geometry,
      durationSec: distributed.reduce((s, l) => s + l.durationSec, 0),
      distanceM: distributed.reduce((s, l) => s + l.distanceM, 0),
      legs: distributed,
      source: 'estimated',
    };
  }

  const geometry =
    driving.geometry.length >= 2 ? driving.geometry : mergeLegGeometries(legs);

  return {
    geometry,
    durationSec: legs.reduce((s, l) => s + l.durationSec, 0),
    distanceM: legs.reduce((s, l) => s + l.distanceM, 0),
    legs,
    source: 'estimated',
  };
}

function mergeLegGeometries(legs: BuiltRouteLeg[]): [number, number][] {
  const geometry: [number, number][] = [];
  for (const leg of legs) {
    for (const pt of leg.geometry) {
      const prev = geometry[geometry.length - 1];
      if (!prev || prev[0] !== pt[0] || prev[1] !== pt[1]) geometry.push(pt);
    }
  }
  return geometry;
}

export function estimateDurationBetween(
  from: [number, number],
  to: [number, number],
  mode: RouteMode,
): number {
  const straight = haversineMeters(from[0], from[1], to[0], to[1]);
  return estimateSegmentDurationMeters(straight, mode);
}
