import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Navigation, MapPin, Flag } from 'lucide-react';
import type { CustomRoute } from '../store/authSlice';

interface AdminRoutePreviewModalProps {
  route: CustomRoute | null;
  itineraryFallback?: string[];
  onClose: () => void;
}

export default function AdminRoutePreviewModal({
  route,
  itineraryFallback,
  onClose,
}: AdminRoutePreviewModalProps) {
  const points =
    route != null
      ? [route.startPoint, ...route.waypoints, route.endPoint]
      : itineraryFallback ?? [];

  if (route == null && (!itineraryFallback || itineraryFallback.length === 0)) {
    return null;
  }

  const overlay = (
    <AnimatePresence>
      <motion.div
        key="admin-route-preview"
        className="fixed inset-0 z-[1200] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <button
          type="button"
          className="absolute inset-0 w-full h-full bg-slate-950/90 border-0"
          onClick={onClose}
          aria-label="Закрыть"
        />
        <motion.div
          role="dialog"
          aria-modal
          initial={{ scale: 0.94, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.94, opacity: 0 }}
          className="relative z-10 w-full max-w-lg bg-white rounded-[2rem] border border-slate-200 shadow-2xl overflow-hidden pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {route?.title ?? 'Маршрут экскурсии'}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  Маршрут туроператора
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 hover:bg-slate-200 rounded-xl transition-colors"
                aria-label="Закрыть"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {route && (
                <div className="grid grid-cols-1 gap-2 text-xs font-bold text-slate-600">
                  <p className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <span className="text-[9px] font-black uppercase text-slate-400 block">Старт</span>
                      {route.startPoint}
                    </span>
                  </p>
                  {route.waypoints.length > 0 && (
                    <p className="flex items-start gap-2">
                      <Navigation className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>
                        <span className="text-[9px] font-black uppercase text-slate-400 block">
                          Промежуточные ({route.waypoints.length})
                        </span>
                        {route.waypoints.join(' → ')}
                      </span>
                    </p>
                  )}
                  <p className="flex items-start gap-2">
                    <Flag className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span>
                      <span className="text-[9px] font-black uppercase text-slate-400 block">Финиш</span>
                      {route.endPoint}
                    </span>
                  </p>
                </div>
              )}
              {points.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                    Точки по порядку
                  </h4>
                  <ol className="space-y-2 border-l-2 border-blue-200 pl-4">
                    {points.map((point, index) => (
                      <li key={`${point}-${index}`} className="text-sm font-bold text-slate-800">
                        <span className="text-[10px] text-blue-600 font-black mr-2">{index + 1}.</span>
                        {point}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              {route?.completedAt && (
                <p className="text-[10px] font-bold text-emerald-600 uppercase">
                  Маршрут отмечен пройденным: {route.completedAt.slice(0, 10)}
                </p>
              )}
            </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(overlay, document.body);
}
