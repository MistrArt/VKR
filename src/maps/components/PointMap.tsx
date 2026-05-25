import React from 'react';
import { Map, Placemark } from '@pbe/react-yandex-maps';
import MapShell from './MapShell';

export interface PointMapProps {
  lat: number;
  lng: number;
  center?: [number, number];
  zoom?: number;
  height?: string;
  className?: string;
  roundedClassName?: string;
  /** Preset иконки маркера (например islands#greenParkIcon). */
  preset?: string;
  draggable?: boolean;
  onCoordsChange?: (lat: number, lng: number) => void;
}

function clampZoom(zoom: number): number {
  return Math.min(16, Math.max(14, zoom));
}

export default function PointMap({
  lat,
  lng,
  center,
  zoom = 15,
  height = '100%',
  className,
  roundedClassName,
  preset = 'islands#blueIcon',
  draggable = false,
  onCoordsChange,
}: PointMapProps) {
  const mapCenter = center ?? [lat, lng];
  const mapZoom = clampZoom(zoom);

  const handleMapClick = (e: ymaps.IEvent) => {
    if (!onCoordsChange) return;
    const coords = e.get('coords') as number[] | undefined;
    if (coords && coords.length >= 2) {
      onCoordsChange(coords[0], coords[1]);
    }
  };

  const handleDragEnd = (e: ymaps.IEvent) => {
    if (!onCoordsChange) return;
    const target = e.get('target') as ymaps.Placemark | undefined;
    const coords = target?.geometry?.getCoordinates?.() as number[] | undefined;
    if (coords && coords.length >= 2) {
      onCoordsChange(coords[0], coords[1]);
    }
  };

  return (
    <MapShell height={height} className={className} roundedClassName={roundedClassName}>
      <Map
        defaultState={{ center: mapCenter, zoom: mapZoom }}
        width="100%"
        height="100%"
        onClick={onCoordsChange ? handleMapClick : undefined}
        options={{
          suppressMapOpenBlock: true,
          yandexMapDisablePoiInteractivity: true,
        }}
      >
        <Placemark
          geometry={[lat, lng]}
          options={{ preset, draggable: draggable && Boolean(onCoordsChange) }}
          onDragEnd={draggable && onCoordsChange ? handleDragEnd : undefined}
        />
      </Map>
    </MapShell>
  );
}
