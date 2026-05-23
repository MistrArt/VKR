import { useMemo } from 'react';
import { mockItems, MockItem } from '../../data/mockData';
import { useGetAllPlacesQuery, useGetExcursionsQuery } from '../index';
import { excursionToMockItem, placeToMockItem } from '../mappers';

export function useCatalogItems() {
  const placesQuery = useGetAllPlacesQuery({ limit: 200, offset: 0 });
  const excursionsQuery = useGetExcursionsQuery({ limit: 200, offset: 0 });

  const items = useMemo<MockItem[]>(() => {
    const places = placesQuery.data?.items?.map(placeToMockItem) ?? [];
    const excursions = excursionsQuery.data?.items?.map(excursionToMockItem) ?? [];
    const merged = [...places, ...excursions];

    if (merged.length > 0) {
      return merged;
    }

    if (placesQuery.isError && excursionsQuery.isError) {
      return mockItems;
    }

    return [];
  }, [placesQuery.data, excursionsQuery.data, placesQuery.isError, excursionsQuery.isError]);

  const isLoading = placesQuery.isLoading || excursionsQuery.isLoading;
  const isApiConnected = items.length > 0 && !(placesQuery.isError && excursionsQuery.isError);
  const isFallback = placesQuery.isError && excursionsQuery.isError;

  return {
    items,
    isLoading,
    isApiConnected,
    isFallback,
    refetch: () => {
      placesQuery.refetch();
      excursionsQuery.refetch();
    },
  };
}
