import React from 'react';
import { Compass, MapPin, Utensils } from 'lucide-react';
import type { Category } from '../../data/mockTypes';

const LEGEND_ITEMS: {
  id: Category;
  label: string;
  icon: typeof MapPin;
  chipClass: string;
  dotClass: string;
}[] = [
  {
    id: 'places',
    label: 'Места',
    icon: MapPin,
    chipClass: 'bg-blue-50 text-blue-700 border-blue-200',
    dotClass: 'bg-emerald-500',
  },
  {
    id: 'excursions',
    label: 'Экскурсии',
    icon: Compass,
    chipClass: 'bg-purple-50 text-purple-700 border-purple-200',
    dotClass: 'bg-violet-500',
  },
  {
    id: 'restaurants',
    label: 'Рестораны',
    icon: Utensils,
    chipClass: 'bg-orange-50 text-orange-700 border-orange-200',
    dotClass: 'bg-orange-500',
  },
];

export interface MapCategoryLegendProps {
  activeCategory?: Category;
  onCategoryChange?: (category: Category) => void;
  showCounts?: Record<Category, number>;
  /** Подмножество категорий (по умолчанию — все из легенды). */
  categories?: Category[];
  className?: string;
}

export default function MapCategoryLegend({
  activeCategory,
  onCategoryChange,
  showCounts,
  categories,
  className = '',
}: MapCategoryLegendProps) {
  const items = categories
    ? LEGEND_ITEMS.filter((item) => categories.includes(item.id))
    : LEGEND_ITEMS;

  return (
    <div
      className={`flex flex-wrap items-center gap-2 pointer-events-auto ${className}`}
      role={onCategoryChange ? 'tablist' : undefined}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeCategory === item.id;
        const count = showCounts?.[item.id];

        const chip = (
          <>
            <span className={`w-2 h-2 rounded-full shrink-0 ${item.dotClass}`} aria-hidden />
            <Icon className="w-3.5 h-3.5 shrink-0 opacity-70" />
            <span>{item.label}</span>
            {count != null && (
              <span className="text-[10px] font-black opacity-60 tabular-nums">{count}</span>
            )}
          </>
        );

        const baseClass = `inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
          isActive ? item.chipClass + ' ring-2 ring-offset-1 ring-blue-300/50' : 'bg-white/80 text-gray-600 border-white/60 hover:bg-white'
        }`;

        if (onCategoryChange) {
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onCategoryChange(item.id)}
              className={baseClass}
            >
              {chip}
            </button>
          );
        }

        return (
          <span key={item.id} className={baseClass}>
            {chip}
          </span>
        );
      })}
    </div>
  );
}
