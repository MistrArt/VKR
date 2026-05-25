import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Map, ObjectManager, Placemark, Polyline } from '@pbe/react-yandex-maps';
import type { RouteDisplayMode } from './RouteMap';
import type { MockItem } from '../../data/mockTypes';
import { resolveHasCoordinates } from '../../data/catalogMap';
import { EKATERINBURG_CENTER, DEFAULT_ZOOM } from '../constants';
import { CLUSTER_PRESET, getPlacemarkPreset } from '../catalogMarkers';
import { useYandexMapResize } from '../hooks/useYandexMapResize';
import MapShell from './MapShell';

const CLUSTER_THRESHOLD = 20;

export interface CatalogMapProps {
  items: MockItem[];
  selectedId?: string;
  /** Несколько выбранных объектов (конструктор маршрутов). */
  selectedIds?: string[];
  hoveredId?: string;
  startCoords?: [number, number] | null;
  endCoords?: [number, number] | null;
  /** При изменении — плавный panTo к объекту (клик в списке на Search). */
  focusItemId?: string;
  onSelect: (id: string) => void;
  fitBoundsOnItemsChange?: boolean;
  center?: [number, number];
  zoom?: number;
  height?: string;
  className?: string;
  roundedClassName?: string;
  mapOptions?: Record<string, unknown>;
  /** Пеший и автомобильный маршрут по выбранным точкам (конструктор) */
  drivingPath?: [number, number][];
  walkingPath?: [number, number][];
  routeDisplayMode?: RouteDisplayMode;
}

function isItemSelected(
  itemId: string,
  selectedId?: string,
  selectedIds?: string[],
): boolean {
  if (selectedIds?.length) return selectedIds.includes(itemId);
  return itemId === selectedId;
}

function buildFeatureCollection(
  items: MockItem[],
  selectedId?: string,
  selectedIds?: string[],
  hoveredId?: string,
) {
  return {
    type: 'FeatureCollection' as const,
    features: items.map((item) => ({
      type: 'Feature' as const,
      id: item.id,
      geometry: {
        type: 'Point' as const,
        coordinates: [item.lat, item.lng] as [number, number],
      },
      properties: {
        hintContent: item.title,
      },
      options: {
        preset: getPlacemarkPreset(item, {
          selected: isItemSelected(item.id, selectedId, selectedIds),
          hovered: item.id === hoveredId && !isItemSelected(item.id, selectedId, selectedIds),
        }),
      },
    })),
  };
}

export default function CatalogMap({
  items,
  selectedId,
  selectedIds,
  hoveredId,
  focusItemId,
  onSelect,
  startCoords,
  endCoords,
  fitBoundsOnItemsChange = false,
  center = EKATERINBURG_CENTER,
  zoom = DEFAULT_ZOOM,
  height = '100%',
  className,
  roundedClassName,
  mapOptions,
  drivingPath,
  walkingPath,
  routeDisplayMode = 'driving',
}: CatalogMapProps) {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<ymaps.Map | null>(null);
  const objectManagerRef = useRef<ymaps.ObjectManager | null>(null);

  useYandexMapResize(mapInstanceRef, shellRef);

  const mapItems = useMemo(() => items.filter(resolveHasCoordinates), [items]);
  const useClustering = mapItems.length > CLUSTER_THRESHOLD;

  const featureCollection = useMemo(
    () => buildFeatureCollection(mapItems, selectedId, selectedIds, hoveredId),
    [mapItems, selectedId, selectedIds, hoveredId],
  );

  const fitMapToItems = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map || mapItems.length === 0) return;

    const lats = mapItems.map((i) => i.lat);
    const lngs = mapItems.map((i) => i.lng);
    const bounds: [[number, number], [number, number]] = [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)],
    ];
    map.setBounds(bounds, { checkZoomRange: true, duration: 300 });
  }, [mapItems]);

  useEffect(() => {
    if (fitBoundsOnItemsChange) fitMapToItems();
  }, [fitBoundsOnItemsChange, fitMapToItems]);

  useEffect(() => {
    if (!focusItemId || !mapInstanceRef.current) return;
    const item = mapItems.find((i) => i.id === focusItemId);
    if (!item) return;
    mapInstanceRef.current.panTo([item.lat, item.lng], { duration: 300, flying: true });
  }, [focusItemId, mapItems]);

  useEffect(() => {
    const om = objectManagerRef.current;
    if (!om || !useClustering) return;

    const handler = (e: ymaps.IEvent) => {
      const objectId = e.get('objectId');
      if (objectId != null) onSelect(String(objectId));
    };

    om.objects.events.add('click', handler);
    return () => {
      om.objects.events.remove('click', handler);
    };
  }, [onSelect, useClustering]);

  const placemarks = mapItems.map((item) => (
    <Placemark
      key={item.id}
      geometry={[item.lat, item.lng]}
      properties={{ hintContent: item.title }}
      options={{
        preset: getPlacemarkPreset(item, {
          selected: isItemSelected(item.id, selectedId, selectedIds),
          hovered: item.id === hoveredId && !isItemSelected(item.id, selectedId, selectedIds),
        }),
      }}
      onClick={() => onSelect(item.id)}
      modules={['geoObject.addon.hint']}
    />
  ));

  return (
    <MapShell
      shellRef={shellRef}
      height={height}
      className={className}
      roundedClassName={roundedClassName}
    >
      <Map
        instanceRef={(ref) => {
          mapInstanceRef.current = ref;
        }}
        defaultState={{ center, zoom }}
        width="100%"
        height="100%"
        options={{
          yandexMapDisablePoiInteractivity: true,
          ...mapOptions,
        }}
      >
        {useClustering ? (
          <ObjectManager
            instanceRef={(ref) => {
              objectManagerRef.current = ref;
            }}
            options={{ clusterize: true, gridSize: 64 }}
            objects={{
              openBalloonOnClick: false,
              hideIconOnBalloonOpen: false,
            }}
            clusters={{
              preset: CLUSTER_PRESET,
              hideIconOnBalloonOpen: false,
            }}
            features={featureCollection}
            modules={['objectManager.addon.objectsHint']}
          />
        ) : (
          placemarks
        )}
        {startCoords && (
          <Placemark
            geometry={startCoords}
            properties={{ hintContent: 'Старт' }}
            options={{ preset: 'islands#blueDotIcon' }}
            modules={['geoObject.addon.hint']}
          />
        )}
        {endCoords && (
          <Placemark
            geometry={endCoords}
            properties={{ hintContent: 'Финиш' }}
            options={{ preset: 'islands#greenDotIcon' }}
            modules={['geoObject.addon.hint']}
          />
        )}

        {routeDisplayMode === 'walking' && walkingPath && walkingPath.length > 1 && (
            <Polyline
              geometry={walkingPath}
              options={{
                strokeColor: '#059669',
                strokeWidth: 4,
                strokeOpacity: 0.85,
                strokeStyle: 'shortdash',
                zIndex: 1,
              }}
            />
          )}

        {routeDisplayMode === 'driving' && drivingPath && drivingPath.length > 1 && (
            <Polyline
              geometry={drivingPath}
              options={{
                strokeColor: '#2563eb',
                strokeWidth: 5,
                strokeOpacity: 0.9,
                zIndex: 2,
              }}
            />
          )}
      </Map>
    </MapShell>
  );
}
