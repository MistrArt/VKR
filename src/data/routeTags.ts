import type { MockItem } from './mockTypes';

/** Скрытые теги для подбора маршрута (не показываются пользователю). */
export type RouteTagId =
  | 'history'
  | 'gastronomy'
  | 'art'
  | 'nature'
  | 'active'
  | 'architecture'
  | 'family'
  | 'romantic'
  | 'views'
  | 'museums'
  | 'shopping'
  | 'coffee'
  | 'nightlife'
  | 'local';

/** Подписи скрытых тегов маршрута (для админки и автоподбора). */
export const ROUTE_TAG_OPTIONS: { id: RouteTagId; label: string }[] = [
  { id: 'history', label: 'История' },
  { id: 'museums', label: 'Музеи' },
  { id: 'architecture', label: 'Архитектура' },
  { id: 'art', label: 'Искусство' },
  { id: 'nature', label: 'Природа' },
  { id: 'views', label: 'Панорамы и виды' },
  { id: 'gastronomy', label: 'Гастрономия' },
  { id: 'coffee', label: 'Кофе и сладости' },
  { id: 'family', label: 'С семьёй' },
  { id: 'romantic', label: 'Романтика' },
  { id: 'active', label: 'Активный отдых' },
  { id: 'shopping', label: 'Шопинг' },
  { id: 'nightlife', label: 'Вечерний город' },
  { id: 'local', label: 'Местный колорит' },
];

/** Темы, которые видит пользователь в конструкторе. */
export const AUTO_ROUTE_UI_THEMES = [
  'История',
  'Гастрономия',
  'Искусство',
  'Природа',
  'Архитектура',
  'Музеи',
  'Панорамы',
  'Семейный',
  'Романтика',
  'Активный отдых',
  'Кофе и сладости',
  'Шопинг',
  'Вечерний город',
] as const;

export type AutoRouteUiTheme = (typeof AUTO_ROUTE_UI_THEMES)[number];

/** UI-тема → скрытые теги объекта. */
export const UI_THEME_TO_ROUTE_TAGS: Record<AutoRouteUiTheme, RouteTagId[]> = {
  История: ['history', 'museums', 'architecture', 'local'],
  Гастрономия: ['gastronomy'],
  Искусство: ['art', 'museums'],
  Природа: ['nature', 'views'],
  Архитектура: ['architecture', 'history', 'views'],
  Музеи: ['museums', 'history', 'art'],
  Панорамы: ['views', 'nature', 'architecture'],
  Семейный: ['family', 'nature', 'museums'],
  Романтика: ['romantic', 'views', 'gastronomy'],
  'Активный отдых': ['active', 'nature'],
  'Кофе и сладости': ['coffee', 'gastronomy'],
  Шопинг: ['shopping', 'local'],
  'Вечерний город': ['nightlife', 'romantic', 'gastronomy'],
};

const KEYWORD_TAGS: { tag: RouteTagId; words: string[] }[] = [
  { tag: 'history', words: ['истор', 'музей', 'памятник', 'ленин', 'елецин', 'революц', 'культур'] },
  { tag: 'museums', words: ['музей', 'выставк', 'галере', 'экспозиц'] },
  { tag: 'architecture', words: ['архитект', 'собор', 'храм', 'здание', 'фасад', 'конструктив'] },
  { tag: 'art', words: ['искусств', 'арт', 'стрит', 'граффити', 'театр'] },
  { tag: 'nature', words: ['парк', 'сквер', 'природ', 'сад', 'лес', 'набережн', 'водоём'] },
  { tag: 'views', words: ['панорам', 'вид', 'смотров', 'обзор', 'высот'] },
  { tag: 'gastronomy', words: ['ресторан', 'кухн', 'гастро', 'обед', 'ужин', 'бар', 'паб'] },
  { tag: 'coffee', words: ['кофе', 'кондитер', 'десерт', 'выпечк', 'чай'] },
  { tag: 'family', words: ['дет', 'семей', 'семь'] },
  { tag: 'romantic', words: ['романт', 'уют', 'атмосфер'] },
  { tag: 'active', words: ['актив', 'спорт', 'велосипед', 'прогулк', 'тропа'] },
  { tag: 'shopping', words: ['магазин', 'торгов', 'молл', 'бутик'] },
  { tag: 'nightlife', words: ['ночн', 'клуб', 'вечер', '00:00', 'полноч'] },
  { tag: 'local', words: ['урал', 'екатеринбург', 'местн', 'традиц'] },
];

function textBlob(item: MockItem): string {
  return [
    item.title,
    item.description,
    item.shortDescription,
    item.fullDescription,
    item.atmosphereDescription,
    item.location,
    item.district,
    ...(item.theme ?? []),
    ...(item.cuisines ?? []),
    ...(item.features ?? []),
    item.workingHours,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function tagsFromThemes(item: MockItem): RouteTagId[] {
  const tags = new Set<RouteTagId>();
  for (const t of item.theme ?? []) {
    const lower = t.toLowerCase();
    if (lower.includes('истор') || lower.includes('культур')) tags.add('history');
    if (lower.includes('музей')) tags.add('museums');
    if (lower.includes('архитект')) tags.add('architecture');
    if (lower.includes('выставк')) tags.add('art');
    if (lower.includes('природ') || lower.includes('парк')) tags.add('nature');
    if (lower.includes('промышлен')) tags.add('active');
  }
  return [...tags];
}

/** Назначает скрытые теги месту или ресторану. */
export function deriveRouteTags(item: MockItem): RouteTagId[] {
  if (item.category === 'excursions') return [];

  const tags = new Set<RouteTagId>(tagsFromThemes(item));
  const blob = textBlob(item);

  for (const { tag, words } of KEYWORD_TAGS) {
    if (words.some((w) => blob.includes(w))) tags.add(tag);
  }

  if (item.category === 'restaurants') {
    tags.add('gastronomy');
    if (blob.includes('кофе') || blob.includes('кондитер')) tags.add('coffee');
    if (item.workingHours?.includes('00:00')) tags.add('nightlife');
  }

  if (item.category === 'places') {
    if (!tags.size) tags.add('local');
  }

  if (tags.size === 0) tags.add('local');

  return [...tags];
}

export function itemHasRouteTag(item: MockItem, tag: RouteTagId): boolean {
  return (item.routeTags ?? []).includes(tag);
}

export function matchesUiThemeByTags(item: MockItem, uiTheme: AutoRouteUiTheme): boolean {
  const needed = UI_THEME_TO_ROUTE_TAGS[uiTheme] ?? [];
  const itemTags = item.routeTags ?? [];
  return needed.some((t) => itemTags.includes(t));
}

export function matchesAnyUiTheme(item: MockItem, uiThemes: AutoRouteUiTheme[]): boolean {
  if (uiThemes.length === 0) return true;
  return uiThemes.some((t) => matchesUiThemeByTags(item, t));
}
