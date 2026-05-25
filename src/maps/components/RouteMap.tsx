import React, { useEffect, useRef } from 'react';
import { Map, Placemark, Polyline } from '@pbe/react-yandex-maps';
import { Car, Footprints } from 'lucide-react';
import { EKATERINBURG_CENTER, DEFAULT_ZOOM } from '../constants';
import { useYandexMapResize } from '../hooks/useYandexMapResize';
import MapShell from './MapShell';

export interface RouteWaypoint {
  lat: number;
  lng: number;
  label?: string;
}

export type RouteDisplayMode = 'driving' | 'walking';

export interface RouteMapProps {
  startCoords?: [number, number] | null;
  endCoords?: [number, number] | null;
  waypoints: RouteWaypoint[];
  /** Полилиния активного режима (обратная совместимость) */
  routePath?: [number, number][];
  transportMode?: 'driving' | 'walking';
  drivingPath?: [number, number][];
  walkingPath?: [number, number][];
  displayMode?: RouteDisplayMode;
  center?: [number, number];
  zoom?: number;
  height?: string;
  className?: string;
  roundedClassName?: string;
  showLegend?: boolean;
}

const ROUTE_STYLES = {
  driving: {
    strokeColor: '#2563eb',
    strokeWidth: 6,
    strokeOpacity: 0.9,
  },
  walking: {
    strokeColor: '#059669',
    strokeWidth: 5,
    strokeOpacity: 0.85,
    strokeStyle: 'shortdash' as const,
  },
};

export default function RouteMap({
  startCoords,
  endCoords,
  waypoints,
  routePath = [],
  transportMode = 'driving',
  drivingPath,
  walkingPath,
  displayMode,
  center,
  zoom = DEFAULT_ZOOM,
  height = '100%',
  className,
  roundedClassName,
  showLegend = true,
}: RouteMapProps) {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<ymaps.Map | null>(null);
  useYandexMapResize(mapInstanceRef, shellRef);

  const mode: RouteDisplayMode = displayMode ?? transportMode ?? 'driving';
  const activeGeometry =
    mode === 'walking'
      ? walkingPath && walkingPath.length > 1
        ? walkingPath
        : transportMode === 'walking' && routePath.length > 1
          ? routePath
          : []
      : drivingPath && drivingPath.length > 1
        ? drivingPath
        : routePath.length > 1
          ? routePath
          : [];

  const mapCenter = center ?? startCoords ?? EKATERINBURG_CENTER;

  const fitToRoutes = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const coords: [number, number][] = [];
    if (startCoords) coords.push(startCoords);
    if (endCoords) coords.push(endCoords);
    for (const wp of waypoints) coords.push([wp.lat, wp.lng]);
    coords.push(...activeGeometry);
    if (coords.length < 2) return;
    const lats = coords.map((c) => c[0]);
    const lngs = coords.map((c) => c[1]);
    map.setBounds(
      [
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)],
      ],
      { checkZoomRange: true, duration: 300, zoomMargin: 40 },
    );
  };

  useEffect(() => {
    fitToRoutes();
  }, [activeGeometry, mode, startCoords, endCoords, waypoints]);

  const lineStyle = mode === 'walking' ? ROUTE_STYLES.walking : ROUTE_STYLES.driving;
  const LegendIcon = mode === 'walking' ? Footprints : Car;
  const legendLabel = mode === 'walking' ? 'Пешком' : 'На машине';

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
        state={{ center: mapCenter, zoom }}
        width="100%"
        height="100%"
        className="w-full h-full rounded-xl z-0 overflow-hidden"
      >
        {startCoords && (
          <Placemark
            geometry={startCoords}
            properties={{ hintContent: 'Старт' }}
            options={{ preset: 'islands#blueDotIcon' }}
            modules={['geoObject.addon.hint']}
          />
        )}

        {waypoints.map((wp, idx) => (
          <Placemark
            key={`${wp.lat}-${wp.lng}-${idx}`}
            geometry={[wp.lat, wp.lng]}
            properties={wp.label ? { hintContent: `${idx + 1}. ${wp.label}` } : undefined}
            options={{ preset: 'islands#blueIcon' }}
            modules={['geoObject.addon.hint']}
          />
        ))}

        {endCoords && (
          <Placemark
            geometry={endCoords}
            properties={{ hintContent: 'Финиш' }}
            options={{ preset: 'islands#greenDotIcon' }}
            modules={['geoObject.addon.hint']}
          />
        )}

        {activeGeometry.length > 1 && (
          <Polyline geometry={activeGeometry} options={{ ...lineStyle, zIndex: 2 }} />
        )}
      </Map>

      {showLegend && activeGeometry.length > 1 && (
        <div className="absolute top-4 left-4 z-10 pointer-events-none">
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold shadow-lg border ${
              mode === 'walking'
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-blue-600 text-white border-blue-500'
            }`}
          >
            <LegendIcon className="w-3.5 h-3.5 shrink-0" />
            <span>{legendLabel}</span>
          </div>
        </div>
      )}
    </MapShell>
  );
}
