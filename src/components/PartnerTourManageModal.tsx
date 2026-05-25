import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Edit2,
  Star,
  Clock,
  MapPin,
  Phone,
  Globe,
  Navigation,
  CheckCircle2,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import type { MockItem } from '../data/mockData';
import type { Booking } from '../store/authSlice';
import { enrichItem } from '../data/enrichedItems';
import { formatDistrictsLabel } from '../utils/excursionDistricts';
import TourSchedulePanel from './TourSchedulePanel';
import ItemAddressLine from './ItemAddressLine';
import { formatWeekDaysLabel, inferWeekDaysFromTour } from '../utils/excursionSchedule';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

interface PartnerTourManageModalProps {
  tour: MockItem | null;
  bookings: Booking[];
  initialDateIso?: string | null;
  onClose: () => void;
  onEdit: (tour: MockItem) => void;
}

function statusLabel(status?: MockItem['status']): string {
  if (status === 'active') return 'Опубликован';
  if (status === 'pending') return 'На модерации';
  if (status === 'revision') return 'На доработке';
  if (status === 'rejected') return 'Отклонён';
  if (status === 'draft') return 'Черновик';
  return 'Черновик';
}

export default function PartnerTourManageModal({
  tour,
  bookings,
  initialDateIso,
  onClose,
  onEdit,
}: PartnerTourManageModalProps) {
  const navigate = useNavigate();
  const routes = useSelector((state: RootState) => state.auth.routes);
  const item = useMemo(() => (tour ? enrichItem(tour) : null), [tour]);

  if (!tour || !item) return null;

  const styles = item.theme ?? [];
  const features = item.features ?? [];
  const weekDaysLabel = formatWeekDaysLabel(inferWeekDaysFromTour(item));
  const linkedRoute = item.routeId ? routes.find((r) => r.id === item.routeId) : undefined;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
        <motion.div
          role="dialog"
          aria-modal
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-white rounded-[2rem] border border-gray-100 shadow-2xl"
        >
          <div className="relative h-48 sm:h-56 overflow-hidden rounded-t-[2rem]">
            <img src={item.image} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-2.5 rounded-xl bg-black/40 text-white hover:bg-black/60"
              aria-label="Закрыть"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="absolute bottom-4 left-4 right-4">
              <span className="inline-block px-2.5 py-1 bg-white/90 text-[10px] font-black uppercase rounded-lg text-gray-800 mb-2">
                {statusLabel(item.status)}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">{item.title}</h2>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {(item.status === 'revision' || item.status === 'rejected') && item.moderationComment && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-sm font-semibold text-amber-900">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-1">
                  Комментарий модератора
                </p>
                {item.moderationComment}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
                <span className="bg-purple-50 text-purple-700 font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-xl">
                  Экскурсия • {formatDistrictsLabel(item)}
                </span>
                <span className="bg-yellow-400 text-black font-black text-[10px] px-3 py-1 rounded-xl flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  {item.rating.toFixed(1)} ({item.reviewsCount ?? 0})
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(tour);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-blue-600 hover:text-white text-gray-700 rounded-xl text-xs font-black uppercase transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Редактировать
              </button>
            </div>

            <ItemAddressLine item={item} className="text-sm" showMapLink={false} />

            <div className="flex flex-wrap gap-3 text-xs font-bold text-purple-800 bg-purple-50/30 p-4 rounded-2xl border border-purple-100">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" /> {item.duration || '2–3 часа'}
              </span>
              <span className="text-purple-200">|</span>
              <span>🗣️ {item.language || 'Русский'}</span>
              <span className="text-purple-200">|</span>
              <span>Начало: {item.defaultStartTime || '12:00'}</span>
              {weekDaysLabel && (
                <>
                  <span className="text-purple-200">|</span>
                  <span>Дни: {weekDaysLabel}</span>
                </>
              )}
              <span className="text-purple-200">|</span>
              <span>
                {item.price > 0 ? `${item.price.toLocaleString('ru-RU')} ₽` : 'Бесплатно'} / участник
              </span>
              <span className="text-purple-200">|</span>
              <span>До {item.freeSlots ?? 15} мест</span>
            </div>

            <div>
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                Краткое описание
              </h3>
              <p className="text-sm font-semibold text-gray-700 leading-relaxed">{item.description}</p>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-gray-100">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                Программа и концепция
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed font-medium">
                {item.fullProgram || item.fullDescription || item.description}
              </p>
            </div>

            {styles.length > 0 && (
              <div>
                <h3 className="text-[10px] font-black text-pink-600 uppercase tracking-widest mb-3">
                  Стилистика экскурсии
                </h3>
                <div className="flex flex-wrap gap-2">
                  {styles.map((t) => (
                    <span
                      key={t}
                      className="bg-white border border-purple-100 px-3 py-1.5 rounded-xl text-xs font-bold text-purple-800 shadow-sm"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {features.length > 0 && (
              <div>
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                  Особенности экскурсии
                </h3>
                <div className="flex flex-wrap gap-2">
                  {features.map((f) => (
                    <span
                      key={f}
                      className="bg-purple-50 border border-purple-100 px-3 py-1.5 rounded-xl text-[11px] font-bold text-purple-800"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {item.routeId && linkedRoute && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate(`/plans?tab=my-routes&id=${encodeURIComponent(item.routeId!)}`);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl text-xs font-black uppercase tracking-widest transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Карточка маршрута: {linkedRoute.title}
              </button>
            )}

            {item.itinerary && item.itinerary.length > 0 && (
              <div>
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                  <Navigation className="w-4 h-4 text-purple-600" />
                  Маршрут (ключевые точки)
                </h3>
                <ul className="space-y-2 border-l-2 border-purple-200 pl-4 ml-1">
                  {item.itinerary.map((point, index) => (
                    <li key={index} className="text-xs font-bold text-gray-800">
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <section className="bg-emerald-50/20 p-4 rounded-2xl border border-emerald-50">
                <h4 className="text-[9px] font-black text-emerald-700 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Включено
                </h4>
                <ul className="text-[11px] font-semibold text-gray-600 space-y-1">
                  {(item.included ?? ['Сопровождение гида']).map((x, i) => (
                    <li key={i}>✓ {x}</li>
                  ))}
                </ul>
              </section>
              <section className="bg-red-50/20 p-4 rounded-2xl border border-red-50">
                <h4 className="text-[9px] font-black text-red-700 uppercase tracking-widest mb-2">
                  Ограничения
                </h4>
                <p className="text-[11px] font-semibold text-gray-600">
                  {item.limitations || `Возраст: ${item.ageLimit || '6+'}`}
                </p>
              </section>
            </div>

            <div className="border border-purple-100 rounded-2xl p-5 bg-purple-50/10 space-y-3">
              <h3 className="text-[10px] font-black text-purple-600 uppercase tracking-widest flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Контакты организатора
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold text-gray-700">
                <a
                  href={`tel:${item.contacts?.phone || '+7 (922) 800-44-33'}`}
                  className="flex items-center gap-2 hover:text-purple-600"
                >
                  <Phone className="w-3.5 h-3.5 text-purple-500" />
                  {item.contacts?.phone || '+7 (922) 800-44-33'}
                </a>
                <a
                  href={`https://${item.contacts?.website || 'ural-operator.ru'}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 hover:text-purple-600"
                >
                  <Globe className="w-3.5 h-3.5 text-purple-500" />
                  {item.contacts?.website || 'ural-operator.ru'}
                </a>
              </div>
              {item.tourOperator && (
                <p className="text-xs font-bold text-gray-500">
                  Оператор: <span className="text-gray-800">{item.tourOperator}</span>
                </p>
              )}
            </div>

            <div className="pt-6 border-t border-gray-100 space-y-4">
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Расписание и участники
              </h3>
              <TourSchedulePanel tour={item} bookings={bookings} initialDateIso={initialDateIso} />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
