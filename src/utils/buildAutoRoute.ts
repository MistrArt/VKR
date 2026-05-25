import type { Category, MockItem } from '../data/mockTypes';
import { resolveHasCoordinates } from '../data/catalogMap';
import { enrichItem } from '../data/enrichedItems';
import {
  AUTO_ROUTE_UI_THEMES,
  matchesAnyUiTheme,
  type AutoRouteUiTheme,
} from '../data/routeTags';
import { haversineMeters } from './geo';

export { AUTO_ROUTE_UI_THEMES };
export type { AutoRouteUiTheme };

export type ActivityLevel = 'low' | 'medium' | 'high';
export type TimePreference = 'morning' | 'evening' | 'full';

/** Места и рестораны; экскурсии не участвуют в автомаршруте. */
export const AUTO_ROUTE_CATEGORIES: Category[] = ['places', 'restaurants'];

export interface AutoRoutePrefs {
  themes: AutoRouteUiTheme[];
  activity: ActivityLevel;
  time: TimePreference;
}

export interface BuildAutoRouteResult {
  waypointIds: string[];
  candidatesCount: number;
  targetCount: number;
}

const ACTIVITY_POINTS: Record<ActivityLevel, { min: number; max: number }> = {
  low: { min: 2, max: 3 },
  medium: { min: 3, max: 4 },
  high: { min: 4, max: 5 },
};

const TIME_FACTOR: Record<TimePreference, number> = {
  morning: 0.75,
  evening: 0.75,
  full: 1,
};

function isActiveStatus(item: MockItem): boolean {
  if (!item.status) return true;
  return item.status !== 'archived' && item.status !== 'rejected';
}

export function getTargetWaypointCount(prefs: AutoRoutePrefs): number {
  const { min, max } = ACTIVITY_POINTS[prefs.activity];
  const perDay = Math.round((min + max) / 2);
  const raw = Math.round(perDay * TIME_FACTOR[prefs.time]);
  return Math.max(1, raw);
}

export function filterAutoRouteCandidates(
  items: MockItem[],
  prefs: AutoRoutePrefs,
): MockItem[] {
  return items
    .map(enrichItem)
    .filter((item) => AUTO_ROUTE_CATEGORIES.includes(item.category))
    .filter(resolveHasCoordinates)
    .filter(isActiveStatus)
    .filter((item) => matchesAnyUiTheme(item, prefs.themes));
}

function scoreCandidate(item: MockItem, start: [number, number], themes: AutoRouteUiTheme[]): number {
  const dist = haversineMeters(start[0], start[1], item.lat, item.lng);
  let score = dist;
  if (themes.length > 0 && matchesAnyUiTheme(item, themes)) {
    score -= 8_000;
  }
  score -= (item.rating ?? 0) * 500;
  return score;
}

function pickWaypoints(
  candidates: MockItem[],
  targetCount: number,
  start: [number, number],
  themes: AutoRouteUiTheme[],
  excludeIds: Set<string>,
): MockItem[] {
  const pool = candidates.filter((c) => !excludeIds.has(c.id));
  if (pool.length === 0) return [];

  const sorted = [...pool].sort(
    (a, b) => scoreCandidate(a, start, themes) - scoreCandidate(b, start, themes),
  );

  const picked: MockItem[] = [];
  const useDiversity = new Set(sorted.map((i) => i.category)).size > 1;

  while (picked.length < targetCount && sorted.length > 0) {
    const lastCat = picked.length > 0 ? picked[picked.length - 1].category : null;
    const pickedIds = new Set(picked.map((p) => p.id));

    let chosen: MockItem | undefined;

    if (useDiversity && lastCat) {
      chosen = sorted.find((c) => !pickedIds.has(c.id) && c.category !== lastCat);
    }
    if (!chosen) {
      chosen = sorted.find((c) => !pickedIds.has(c.id));
    }
    if (!chosen) break;

    picked.push(chosen);
  }

  return picked;
}

export function buildAutoRoute(
  items: MockItem[],
  prefs: AutoRoutePrefs,
  startCoords: [number, number],
  options?: { excludeIds?: string[]; appendTo?: string[] },
): BuildAutoRouteResult {
  const candidates = filterAutoRouteCandidates(items, prefs);
  const targetCount = getTargetWaypointCount(prefs);
  const exclude = new Set([...(options?.excludeIds ?? []), ...(options?.appendTo ?? [])]);

  const picked = pickWaypoints(candidates, targetCount, startCoords, prefs.themes, exclude);
  const append = options?.appendTo ?? [];
  const waypointIds = [...append, ...picked.map((p) => p.id)];

  return {
    waypointIds,
    candidatesCount: candidates.length,
    targetCount,
  };
}

export function buildAutoRouteTitle(prefs: AutoRoutePrefs, startPoint: string): string {
  const themePart =
    prefs.themes.length > 0 ? prefs.themes.slice(0, 2).join(', ') : 'разнообразный';
  return `Маршрут: ${themePart} · от ${startPoint}`;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  places: 'Место',
  excursions: 'Экскурсия',
  restaurants: 'Ресторан',
};
