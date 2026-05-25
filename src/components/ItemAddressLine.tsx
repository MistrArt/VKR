import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import type { MockItem } from '../data/mockData';
import { buildCityMapUrl, resolveHasCoordinates } from '../data/catalogMap';
import { formatExcursionMeetingLocation } from '../utils/supportReport';

interface ItemAddressLineProps {
  item: MockItem;
  className?: string;
  showMapLink?: boolean;
}

export default function ItemAddressLine({
  item,
  className = '',
  showMapLink = true,
}: ItemAddressLineProps) {
  if (!item.location) return null;

  const hasCoords = resolveHasCoordinates(item);
  const displayLocation =
    item.category === 'excursions' ? formatExcursionMeetingLocation(item.location) : item.location;

  return (
    <p className={`text-xs text-gray-500 font-semibold flex items-start gap-1.5 leading-snug ${className}`}>
      <MapPin className="w-3.5 h-3.5 shrink-0 text-blue-500 mt-0.5" />
      <span className="line-clamp-2 flex-1 min-w-0">{displayLocation}</span>
      {showMapLink && hasCoords && (
        <Link
          to={buildCityMapUrl({ highlight: item.id, category: item.category })}
          className="shrink-0 text-[10px] font-black text-blue-600 hover:underline uppercase tracking-wide"
          onClick={(e) => e.stopPropagation()}
        >
          На карте
        </Link>
      )}
    </p>
  );
}
