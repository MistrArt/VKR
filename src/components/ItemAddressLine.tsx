import { MapPin } from 'lucide-react';
import type { MockItem } from '../data/mockData';

interface ItemAddressLineProps {
  item: MockItem;
  className?: string;
}

export default function ItemAddressLine({ item, className = '' }: ItemAddressLineProps) {
  if (!item.location) return null;

  return (
    <p className={`text-xs text-gray-500 font-semibold flex items-start gap-1.5 leading-snug ${className}`}>
      <MapPin className="w-3.5 h-3.5 shrink-0 text-blue-500 mt-0.5" />
      <span className="line-clamp-2">{item.location}</span>
    </p>
  );
}
