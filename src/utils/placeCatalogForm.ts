import type { MockItem } from '../data/mockData';
import { hasMapCoordinates } from '../data/catalogMap';
import type { RouteTagId } from '../data/routeTags';

/** Тематика в карточке места (как в каталоге). */
export const PLACE_THEME_OPTIONS = [
  'История и культура',
  'Архитектура',
  'Природа и парки',
  'Музеи',
  'Выставки',
  'Стрит-арт',
  'Промышленный туризм',
  'Советское наследие',
] as const;

/** «Подходит для» в карточке и фильтрах. */
export const PLACE_SUITABLE_FOR_OPTIONS = [
  'С детьми',
  'Для молодёжи',
  'Для пожилых',
  'Универсально',
] as const;

export const PLACE_DISTRICTS = [
  'Центральный',
  'Октябрьский',
  'Ленинский',
  'Чкаловский',
  'ВИЗ',
  'Академический',
  'Уралмаш',
  'Орджоникидзевский',
] as const;

export interface PlaceFormValues {
  title: string;
  description: string;
  fullDescription: string;
  location: string;
  district: string;
  lat: string;
  lng: string;
  image: string;
  galleryLines: string;
  rating: string;
  price: string;
  reviewsCount: string;
  workingHours: string;
  visitingTime: string;
  recommendTime: string;
  themes: string[];
  suitableFor: string[];
  routeTags: RouteTagId[];
  phone: string;
  website: string;
  social: string;
  isOpenNow: boolean;
}

export const emptyPlaceForm = (): PlaceFormValues => ({
  title: '',
  description: '',
  fullDescription: '',
  location: '',
  district: 'Центральный',
  lat: '56.8389',
  lng: '60.6057',
  image: '',
  galleryLines: '',
  rating: '4.5',
  price: '0',
  reviewsCount: '25',
  workingHours: 'Ежедневно 09:00 – 22:00',
  visitingTime: '30 – 60 минут',
  recommendTime: '1–2 часа',
  themes: [],
  suitableFor: ['Универсально'],
  routeTags: ['local'],
  phone: '',
  website: '',
  social: '',
  isOpenNow: true,
});

function linesToList(raw: string): string[] {
  return raw
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function toggleListItem<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

export function placeFormFromItem(item: MockItem): PlaceFormValues {
  return {
    title: item.title,
    description: item.description,
    fullDescription: item.fullDescription ?? '',
    location: item.location ?? '',
    district: item.district ?? 'Центральный',
    lat: String(item.lat),
    lng: String(item.lng),
    image: item.image,
    galleryLines: (item.images ?? []).join('\n'),
    rating: String(item.rating),
    price: String(item.price),
    reviewsCount: String(item.reviewsCount ?? 25),
    workingHours: item.workingHours ?? '',
    visitingTime: item.visitingTime ?? '',
    recommendTime: item.recommendTime ?? '',
    themes: [...(item.theme ?? [])],
    suitableFor: [...(item.suitableFor ?? [])],
    routeTags: [...(item.routeTags ?? [])] as RouteTagId[],
    phone: item.contacts?.phone ?? '',
    website: item.contacts?.website ?? '',
    social: item.contacts?.social ?? '',
    isOpenNow: item.isOpenNow ?? true,
  };
}

export function mockItemFromPlaceForm(
  values: PlaceFormValues,
  existing?: MockItem | null,
): MockItem {
  const lat = Number(values.lat.replace(',', '.'));
  const lng = Number(values.lng.replace(',', '.'));
  const gallery = linesToList(values.galleryLines);
  const image = values.image.trim();
  const theme = values.themes.length > 0 ? values.themes : undefined;
  const suitableFor = values.suitableFor.length > 0 ? values.suitableFor : undefined;
  const routeTags = values.routeTags.length > 0 ? values.routeTags : undefined;

  const item: MockItem = {
    id: existing?.id ?? `place-${Date.now()}`,
    title: values.title.trim(),
    description: values.description.trim(),
    fullDescription: values.fullDescription.trim() || undefined,
    category: 'places',
    lat: Number.isFinite(lat) ? lat : 56.8389,
    lng: Number.isFinite(lng) ? lng : 60.6057,
    image,
    images: gallery.length > 0 ? gallery : image ? [image] : undefined,
    rating: Number(values.rating) || 4.5,
    price: Number(values.price) || 0,
    reviewsCount: Number(values.reviewsCount) || 0,
    partnerId: existing?.partnerId ?? 'admin-id',
    status: 'active',
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    location: values.location.trim() || undefined,
    district: values.district.trim() || 'Центральный',
    workingHours: values.workingHours.trim() || undefined,
    visitingTime: values.visitingTime.trim() || undefined,
    recommendTime: values.recommendTime.trim() || undefined,
    theme,
    suitableFor,
    routeTags,
    isOpenNow: values.isOpenNow,
    contacts:
      values.phone.trim() || values.website.trim() || values.social.trim()
        ? {
            phone: values.phone.trim() || '+7 (343) 000-00-00',
            website: values.website.trim() || 'uraltour.ru',
            social: values.social.trim() || undefined,
          }
        : undefined,
  };

  item.hasCoordinates = hasMapCoordinates(item);
  return item;
}
