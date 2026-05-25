import { useEffect, type RefObject } from 'react';
import { useExpandableMapExpanded } from '../../components/ExpandableMap';

export function useYandexMapResize(
  mapRef: RefObject<ymaps.Map | null>,
  containerRef?: RefObject<HTMLElement | null>,
) {
  const expanded = useExpandableMapExpanded();

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const fit = () => {
      try {
        map.container.fitToViewport();
      } catch {
        /* карта ещё не готова */
      }
    };

    const raf = requestAnimationFrame(fit);
    const t = window.setTimeout(fit, 200);

    const el = containerRef?.current;
    const ro = el ? new ResizeObserver(() => fit()) : null;
    if (el && ro) ro.observe(el);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t);
      ro?.disconnect();
    };
  }, [expanded, mapRef, containerRef]);
}
