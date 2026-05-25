export type Category = 'places' | 'excursions' | 'restaurants';

export interface MockItem {
  id: string;
  title: string;
  description: string;
  category: Category;
  lat: number;
  lng: number;
  /** Вычисляется в enrichItem: можно ли показывать объект на карте. */
  hasCoordinates?: boolean;
  image: string;
  rating: number;
  price: number;
  partnerId?: string;
  status?: 'active' | 'pending' | 'rejected' | 'archived';
  createdAt?: string;

  location?: string;
  district?: string;
  reviewsCount?: number;
  shortDescription?: string;
  isOpenNow?: boolean;
  images?: string[];
  fullDescription?: string;
  workingHours?: string;
  contacts?: {
    phone: string;
    website: string;
    social?: string;
  };
  suitableFor?: string[];

  theme?: string[];
  recommendTime?: string;
  visitingTime?: string;

  cuisines?: string[];
  averageCheck?: number;
  menu?: { name: string; price: number }[];
  features?: string[];
  atmosphereDescription?: string;
  popularDishes?: { name: string; price: number; desc?: string }[];

  tourOperator?: string;
  duration?: string;
  dates?: string[];
  availableDates?: string[];
  defaultStartTime?: string;
  freeSlots?: number;
  routePoints?: string[];
  itinerary?: string[];
  routeId?: string;
  included?: string[];
  language?: string;
  limitations?: string;
  fullProgram?: string;
  ageLimit?: string;

  reviews?: {
    author: string;
    rating: number;
    text: string;
    date: string;
    avatar?: string;
  }[];
}
