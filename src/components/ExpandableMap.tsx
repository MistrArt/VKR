import React, { useEffect, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export interface ExpandableMapProps {
  renderMap: () => React.ReactNode;
  height?: string;
  className?: string;
  roundedClassName?: string;
  overlay?: React.ReactNode;
}

export default function ExpandableMap({
  renderMap,
  height = '500px',
  className = '',
  roundedClassName = 'rounded-[2rem]',
  overlay,
}: ExpandableMapProps) {
  const [expanded, setExpanded] = useState(false);

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

  const collapseButton = (
    <button
      type="button"
      onClick={() => setExpanded(false)}
      className="absolute top-4 right-4 z-30 flex items-center gap-1.5 px-3 py-2 bg-white/95 hover:bg-white text-gray-700 text-xs font-bold rounded-xl shadow-lg border border-gray-100 backdrop-blur-sm transition-colors"
      aria-label="Свернуть карту"
    >
      <Minimize2 className="w-4 h-4" />
      Свернуть
    </button>
  );

  const expandButton = (
    <button
      type="button"
      onClick={() => setExpanded(true)}
      className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-3 py-2 bg-white/90 hover:bg-white text-gray-700 text-xs font-bold rounded-xl shadow-lg border border-gray-100 backdrop-blur-sm transition-colors"
      aria-label="Развернуть карту"
    >
      <Maximize2 className="w-4 h-4" />
      Развернуть
    </button>
  );

  return (
    <>
      <div
        className={`relative w-full overflow-hidden border border-gray-100 ${roundedClassName} ${className}`}
        style={{ height }}
      >
        {!expanded && (
          <>
            <div className="absolute inset-0 z-0">{renderMap()}</div>
            {expandButton}
            {overlay}
          </>
        )}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col bg-black/60 backdrop-blur-sm p-3 sm:p-5"
            role="dialog"
            aria-modal="true"
            aria-label="Карта на весь экран"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="relative flex-1 min-h-0 rounded-2xl overflow-hidden border border-gray-200 shadow-2xl bg-white"
            >
              <div className="absolute inset-0 z-0">{renderMap()}</div>
              {collapseButton}
              {overlay}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
