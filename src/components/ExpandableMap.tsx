import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Maximize2, Minimize2 } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

const ExpandableMapExpandedContext = createContext(false);

export function useExpandableMapExpanded(): boolean {
  return useContext(ExpandableMapExpandedContext);
}

export interface ExpandableMapProps {
  children: React.ReactNode;
  height?: string;
  className?: string;
  roundedClassName?: string;
  overlay?: React.ReactNode;
}

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function useFocusTrap(containerRef: React.RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    if (!active || !containerRef.current) return;

    const root = containerRef.current;

    const getFocusable = (): HTMLElement[] =>
      Array.from(root.querySelectorAll(FOCUSABLE) as NodeListOf<HTMLElement>).filter(
        (el: HTMLElement) =>
          !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true',
      );

    const focusables = getFocusable();
    (focusables[0] ?? root).focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const list = getFocusable();
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    root.addEventListener('keydown', onKeyDown);
    return () => root.removeEventListener('keydown', onKeyDown);
  }, [active, containerRef]);
}

interface MapPanelProps {
  expanded: boolean;
  height: string;
  className: string;
  roundedClassName: string;
  overlay?: React.ReactNode;
  onExpand: () => void;
  onCollapse: () => void;
  children: React.ReactNode;
}

function MapPanel({
  expanded,
  height,
  className,
  roundedClassName,
  overlay,
  onExpand,
  onCollapse,
  children,
}: MapPanelProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, expanded);

  const collapseButton = (
    <button
      type="button"
      onClick={onCollapse}
      className="absolute top-4 right-4 z-30 flex items-center gap-1.5 px-3 py-2 bg-white/95 hover:bg-white text-gray-700 text-xs font-bold rounded-xl shadow-lg border border-gray-100 backdrop-blur-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      aria-label="Свернуть карту на весь экран"
    >
      <Minimize2 className="w-4 h-4" aria-hidden />
      Свернуть
    </button>
  );

  const expandButton = (
    <button
      type="button"
      onClick={onExpand}
      className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-3 py-2 bg-white/90 hover:bg-white text-gray-700 text-xs font-bold rounded-xl shadow-lg border border-gray-100 backdrop-blur-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      aria-label="Развернуть карту на весь экран"
      aria-expanded={expanded}
    >
      <Maximize2 className="w-4 h-4" aria-hidden />
      Развернуть
    </button>
  );

  return (
    <div
      ref={dialogRef}
      className={
        expanded
          ? `fixed inset-3 sm:inset-5 z-[101] overflow-hidden border border-gray-200 shadow-2xl bg-white ${roundedClassName}`
          : `relative w-full overflow-hidden border border-gray-100 ${roundedClassName} ${className}`
      }
      style={expanded ? undefined : { height }}
      role={expanded ? 'dialog' : undefined}
      aria-modal={expanded ? true : undefined}
      aria-label={expanded ? 'Карта на весь экран' : undefined}
    >
      <div className="absolute inset-0 z-0">{children}</div>
      {expanded ? collapseButton : expandButton}
      {overlay}
    </div>
  );
}

export default function ExpandableMap({
  children,
  height = '500px',
  className = '',
  roundedClassName = 'rounded-[2rem]',
  overlay,
}: ExpandableMapProps) {
  const [expanded, setExpanded] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!expanded) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpanded(false);
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [expanded]);

  const backdropClass = reduceMotion
    ? 'fixed inset-0 z-[100] bg-black/60'
    : 'fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm';

  const backdrop = reduceMotion ? (
    <div className={backdropClass} aria-hidden onClick={() => setExpanded(false)} />
  ) : (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={backdropClass}
      aria-hidden
      onClick={() => setExpanded(false)}
    />
  );

  const panel = (
    <MapPanel
      expanded={expanded}
      height={height}
      className={className}
      roundedClassName={roundedClassName}
      overlay={overlay}
      onExpand={() => setExpanded(true)}
      onCollapse={() => setExpanded(false)}
    >
      {children}
    </MapPanel>
  );

  return (
    <ExpandableMapExpandedContext.Provider value={expanded}>
      <AnimatePresence>
        {expanded &&
          (typeof document !== 'undefined'
            ? createPortal(backdrop, document.body)
            : backdrop)}
      </AnimatePresence>

      {expanded && typeof document !== 'undefined'
        ? createPortal(panel, document.body)
        : panel}
    </ExpandableMapExpandedContext.Provider>
  );
}
