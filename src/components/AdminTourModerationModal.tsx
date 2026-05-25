import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Star,
  Clock,
  MapPin,
  Phone,
  Globe,
  Navigation,
  CheckCircle2,
  Mail,
  RotateCcw,
  Check,
  Eye,
  User,
  ExternalLink,
} from 'lucide-react';
import type { MockItem } from '../data/mockData';
import type { MockUser } from '../data/mockData';
import { RootState } from '../store';
import { enrichItem } from '../data/enrichedItems';
import { formatDistrictsLabel } from '../utils/excursionDistricts';
import ItemAddressLine from './ItemAddressLine';
import { formatWeekDaysLabel, inferWeekDaysFromTour } from '../utils/excursionSchedule';
import CatalogItemDetailModal from './CatalogItemDetailModal';
import AdminRoutePreviewModal from './AdminRoutePreviewModal';
import {
  applyModerationToTour,
  resolvePartnerEmail,
  sendModerationEmailToPartner,
  type ModerationAction,
} from '../utils/tourModeration';

interface AdminTourModerationModalProps {
  tour: MockItem | null;
  users: MockUser[];
  onClose: () => void;
  onApply: (updated: MockItem) => void;
}

export default function AdminTourModerationModal({
  tour,
  users,
  onClose,
  onApply,
}: AdminTourModerationModalProps) {
  const routes = useSelector((state: RootState) => state.auth.routes) ?? [];
  const [comment, setComment] = useState('');
  const [catalogPreviewOpen, setCatalogPreviewOpen] = useState(false);
  const [routePreviewOpen, setRoutePreviewOpen] = useState(false);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);

  const item = useMemo(() => (tour ? enrichItem(tour) : null), [tour]);
  const linkedRoute = useMemo(
    () => (tour?.routeId ? routes.find((r) => r.id === tour.routeId) : undefined),
    [tour?.routeId, routes],
  );

  const partner = useMemo(
    () => users.find((u) => u.id === tour?.partnerId),
    [users, tour?.partnerId],
  );
  const partnerEmail = tour ? resolvePartnerEmail(tour, users) : '';

  if (!tour || !item) return null;

  const styles = item.theme ?? [];
  const features = item.features ?? [];
  const weekDaysLabel = formatWeekDaysLabel(inferWeekDaysFromTour(item));
  const hasRoute = Boolean(linkedRoute || (item.itinerary && item.itinerary.length > 0));

  const runAction = (action: ModerationAction, requireComment: boolean) => {
    if (requireComment && !comment.trim()) {
      setEmailStatus('Укажите комментарий для туроператора.');
      return;
    }
    const updated = applyModerationToTour(tour, action, comment);
    const shouldEmail =
      action !== 'publish' || comment.trim().length > 0;
    if (shouldEmail && partnerEmail) {
      sendModerationEmailToPartner({
        tour: updated,
        partnerEmail,
        action,
        comment,
      });
      setEmailStatus(`Письмо подготовлено для ${partnerEmail} (откроется почтовый клиент).`);
    } else if (action === 'publish') {
      setEmailStatus('Тур опубликован без отправки письма.');
    }
    onApply(updated);
    onClose();
  };

  const sendCommentOnly = () => {
    if (!comment.trim()) {
      setEmailStatus('Введите текст комментария.');
      return;
    }
    sendModerationEmailToPartner({
      tour,
      partnerEmail,
      action: 'revision',
      comment,
    });
    const updated: MockItem = {
      ...tour,
      moderationComment: comment.trim(),
      moderationCommentAt: new Date().toISOString(),
      moderationEmailSentAt: new Date().toISOString(),
    };
    onApply(updated);
    setEmailStatus(`Комментарий отправлен на ${partnerEmail}.`);
  };

  const moderationOverlay = (
    <AnimatePresence>
      <motion.div
        key="admin-tour-moderation"
        className="fixed inset-0 z-[1100] flex items-center justify-center p-4 sm:p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <button
          type="button"
          className="absolute inset-0 w-full h-full bg-slate-950/90 border-0 cursor-default"
          onClick={onClose}
          aria-label="Закрыть"
        />
        <motion.div
          role="dialog"
          aria-modal
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          className="relative z-10 w-full max-w-4xl max-h-[94vh] flex flex-col bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
            <div className="relative h-44 sm:h-52 shrink-0 overflow-hidden">
              <img src={item.image} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent" />
              <button
                type="button"
                onClick={onClose}
                className="absolute top-4 right-4 p-2.5 rounded-xl bg-black/40 text-white hover:bg-black/60"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-6 right-6">
                <span className="inline-block px-2.5 py-1 bg-yellow-400 text-[10px] font-black uppercase rounded-lg text-black mb-2">
                  На модерации
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">{item.title}</h2>
                {partner && (
                  <p className="text-xs font-bold text-slate-300 mt-1 flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    {partner.name} · {partnerEmail}
                  </p>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCatalogPreviewOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl text-[10px] font-black uppercase tracking-widest"
                >
                  <Eye className="w-4 h-4" />
                  Карточка как в каталоге
                </button>
                {hasRoute && (
                  <button
                    type="button"
                    onClick={() => setRoutePreviewOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {linkedRoute ? `Маршрут: ${linkedRoute.title}` : 'Точки маршрута'}
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-purple-50 text-purple-700 font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-xl">
                  Экскурсия · {formatDistrictsLabel(item)}
                </span>
                <span className="bg-yellow-400 text-black font-black text-[10px] px-3 py-1 rounded-xl flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  {item.rating.toFixed(1)}
                </span>
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
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Краткое описание (от туроператора)
                </h3>
                <p className="text-sm font-semibold text-slate-700 leading-relaxed">{item.description}</p>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Программа и концепция
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed font-medium">
                  {item.fullProgram || item.fullDescription || item.description}
                </p>
              </div>

              {styles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {styles.map((t) => (
                    <span
                      key={t}
                      className="bg-white border border-purple-100 px-3 py-1.5 rounded-xl text-xs font-bold text-purple-800"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {features.length > 0 && (
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
              )}

              {item.itinerary && item.itinerary.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                    <Navigation className="w-4 h-4 text-purple-600" />
                    Маршрут (ключевые точки)
                  </h3>
                  <ul className="space-y-2 border-l-2 border-purple-200 pl-4">
                    {item.itinerary.map((point, index) => (
                      <li key={index} className="text-xs font-bold text-slate-800">
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <section className="bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100">
                  <h4 className="text-[9px] font-black text-emerald-700 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Включено
                  </h4>
                  <ul className="text-[11px] font-semibold text-slate-600 space-y-1">
                    {(item.included ?? ['Сопровождение гида']).map((x, i) => (
                      <li key={i}>✓ {x}</li>
                    ))}
                  </ul>
                </section>
                <section className="bg-red-50/30 p-4 rounded-2xl border border-red-100">
                  <h4 className="text-[9px] font-black text-red-700 uppercase tracking-widest mb-2">
                    Ограничения
                  </h4>
                  <p className="text-[11px] font-semibold text-slate-600">
                    {item.limitations || `Возраст: ${item.ageLimit || '6+'}`}
                  </p>
                </section>
              </div>

              <div className="border border-slate-200 rounded-2xl p-5 space-y-2">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Контакты в карточке
                </h3>
                <p className="text-xs font-bold text-slate-700">{item.contacts?.phone}</p>
                <p className="text-xs font-bold text-slate-700">{item.contacts?.website}</p>
                {item.tourOperator && (
                  <p className="text-xs text-slate-500">
                    Оператор: <span className="font-bold text-slate-800">{item.tourOperator}</span>
                  </p>
                )}
              </div>

              <div className="border-t border-slate-100 pt-6 space-y-3">
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Комментарий модератора (отправится на {partnerEmail})
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  placeholder="Укажите, что нужно исправить: фото, описание, адрес сбора, расписание..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-50 resize-y"
                />
                <button
                  type="button"
                  onClick={sendCommentOnly}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl"
                >
                  <Mail className="w-4 h-4" />
                  Отправить комментарий на почту
                </button>
                {emailStatus && (
                  <p className="text-xs font-bold text-slate-500">{emailStatus}</p>
                )}
              </div>
            </div>

            <div className="shrink-0 p-4 sm:p-6 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => runAction('revision', true)}
                className="flex-1 py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                На доработку
              </button>
              <button
                type="button"
                onClick={() => runAction('reject', false)}
                className="flex-1 py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Отклонить
              </button>
              <button
                type="button"
                onClick={() => runAction('publish', false)}
                className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Опубликовать
              </button>
            </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return (
    <>
      {createPortal(moderationOverlay, document.body)}

      {catalogPreviewOpen && (
        <CatalogItemDetailModal
          item={item}
          catalogItems={[item]}
          onClose={() => setCatalogPreviewOpen(false)}
        />
      )}

      {routePreviewOpen && (
        <AdminRoutePreviewModal
          route={linkedRoute ?? null}
          itineraryFallback={item.itinerary}
          onClose={() => setRoutePreviewOpen(false)}
        />
      )}
    </>
  );
}
