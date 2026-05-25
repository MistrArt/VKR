import type { MockItem } from '../data/mockTypes';
import type { Category } from '../data/mockTypes';

const CATEGORY_PRESETS: Record<Category, string> = {
  places: 'islands#greenParkIcon',
  restaurants: 'islands#orangeFoodIcon',
  excursions: 'islands#violetIcon',
};

export function getPlacemarkPreset(
  item: MockItem,
  options?: { selected?: boolean; hovered?: boolean },
): string {
  if (options?.selected) return 'islands#redIcon';
  if (options?.hovered) return 'islands#redDotIcon';
  return CATEGORY_PRESETS[item.category] ?? 'islands#grayIcon';
}

export const CLUSTER_PRESET = 'islands#invertedVioletClusterIcons';
