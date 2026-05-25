import { fetchSegmentDurations } from '../api/route';
import { estimateDurationBetween } from '../api/estimateRoute';
import type { RouteMode } from '../api/route';

export interface WaypointNode {
  id: string;
  lat: number;
  lng: number;
}

/** Жадная оптимизация порядка точек (OSRM Table или оценка по расстоянию). */
export async function optimizeWaypointOrder(
  start: [number, number],
  nodes: WaypointNode[],
  mode: RouteMode = 'driving',
): Promise<string[]> {
  if (nodes.length <= 1) return nodes.map((n) => n.id);

  const optimized: string[] = [];
  let currentPos = start;
  const remaining = [...nodes];

  while (remaining.length > 0) {
    const dests = remaining.map((n) => [n.lat, n.lng] as [number, number]);
    const durations = await fetchSegmentDurations(currentPos, dests, mode);

    let bestIdx = 0;
    let bestCost = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const fromOsrm = durations[i];
      const cost =
        fromOsrm != null && fromOsrm > 0 && fromOsrm !== Infinity
          ? fromOsrm
          : estimateDurationBetween(currentPos, dests[i], mode);
      if (cost < bestCost) {
        bestCost = cost;
        bestIdx = i;
      }
    }

    const best = remaining.splice(bestIdx, 1)[0];
    optimized.push(best.id);
    currentPos = [best.lat, best.lng];
  }

  return optimized;
}
