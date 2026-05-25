import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, X, Check, Sparkles, MapPin, ExternalLink } from 'lucide-react';
import type { MockItem } from '../data/mockData';
import type { CustomRoute } from '../store/authSlice';
import {
  EXCURSION_DISTRICTS,
  EXCURSION_FEATURES,
  EXCURSION_STYLES,
  EXCURSION_WEEKDAYS,
} from '../data/excursionMeta';
import { formatWeekDaysLabel } from '../utils/excursionSchedule';
import AddressSuggestInput from '../maps/components/AddressSuggestInput';
import PointMap from '../maps/components/PointMap';

export interface PartnerTourFormValues {
  title: string;
  description: string;
  fullDescription: string;
  price: string;
  duration: string;
  selectedDistricts: string[];
  excursionStyles: string[];
  excursionFeatures: string[];
  location: string;
  tourLat: number;
  tourLng: number;
  hasTourCoords: boolean;
  defaultStartTime: string;
  weekDays: number[];
  freeSlots: string;
  language: string;
  phone: string;
  website: string;
  selectedImage: string;
  customImage: string;
  selectedRouteId: string;
}

interface PartnerExcursionFormModalProps {
  open: boolean;
  onClose: () => void;
  editingTour: MockItem | null;
  values: PartnerTourFormValues;
  onChange: (patch: Partial<PartnerTourFormValues>) => void;
  onSaveDraft: (e: React.FormEvent) => void;
  onPublish: (e: React.FormEvent) => void;
  routes: CustomRoute[];
  presetImages: { url: string; name: string }[];
  geocodeLoading: boolean;
  geocodeError: string | null;
  onApplyGeocode: (address: string) => void;
  onCoordsChange: (lat: number, lng: number) => void;
  onOpenRoute?: (routeId: string) => void;
  /** Скрыть «Сохранить черновик» — для уже опубликованных / на модерации туров */
  showDraftSave?: boolean;
}

function toggleInList(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
}

function ChipGroup({
  label,
  options,
  selected,
  onToggle,
  activeClass = 'border-purple-500 bg-purple-50 text-purple-800',
}: {
  label: string;
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
  activeClass?: string;
}) {
  return (
    <div className="space-y-2 md:col-span-2">
      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            className={`px-3 py-2 rounded-xl text-[10px] font-bold border-2 transition-all ${
              selected.includes(opt)
                ? activeClass
                : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function PartnerExcursionFormModal({
  open,
  onClose,
  editingTour,
  values,
  onChange,
  onSaveDraft,
  onPublish,
  routes,
  presetImages,
  geocodeLoading,
  geocodeError,
  onApplyGeocode,
  onCoordsChange,
  onOpenRoute,
  showDraftSave = true,
}: PartnerExcursionFormModalProps) {
  const set = (patch: Partial<PartnerTourFormValues>) => onChange(patch);
  const selectedRoute = routes.find((r) => r.id === values.selectedRouteId);

  const toggleWeekDay = (dow: number) => {
    const next = values.weekDays.includes(dow)
      ? values.weekDays.filter((d) => d !== dow)
      : [...values.weekDays, dow];
    set({ weekDays: next });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[75] flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
          <motion.div
            role="dialog"
            aria-modal
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 p-6 bg-white/95 backdrop-blur-sm">
              <div className="flex items-center gap-3 min-w-0">
                <button type="button" onClick={onClose} className="p-2.5 hover:bg-gray-100 rounded-xl shrink-0">
                  <ArrowLeft className="w-5 h-5 text-gray-500" />
                </button>
                <div className="min-w-0">
                  <h2 className="text-xl font-black text-gray-900 truncate">
                    {editingTour ? `Редактирование: ${editingTour.title}` : 'Новая экскурсия'}
                  </h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                    Карточка как в каталоге для туристов
                  </p>
                </div>
              </div>
              <button type="button" onClick={onClose} className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={onSaveDraft} className="p-6 sm:p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2 bg-blue-50/40 p-5 rounded-3xl border border-blue-50/70">
                  <label className="text-[10px] font-black uppercase tracking-widest text-blue-800 block">
                    Маршрут (из «Мои маршруты»)
                  </label>
                  <select
                    value={values.selectedRouteId}
                    onChange={(e) => {
                      const uid = e.target.value;
                      set({ selectedRouteId: uid });
                      const rt = routes.find((r) => r.id === uid);
                      if (rt) {
                        const patch: Partial<PartnerTourFormValues> = { selectedRouteId: uid };
                        if (!values.location) patch.location = rt.startPoint;
                        if (!values.title) patch.title = `Авторский тур: ${rt.title}`;
                        set(patch);
                      }
                    }}
                    className="w-full px-5 py-3.5 rounded-2xl bg-white border border-blue-100 text-sm font-bold outline-none"
                  >
                    <option value="">— Без привязки —</option>
                    {routes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title}
                      </option>
                    ))}
                  </select>
                  {values.selectedRouteId && selectedRoute && onOpenRoute && (
                    <button
                      type="button"
                      onClick={() => onOpenRoute(values.selectedRouteId)}
                      className="mt-2 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-700 hover:text-blue-900"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Открыть карточку маршрута
                    </button>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Название *</label>
                  <input
                    required
                    type="text"
                    value={values.title}
                    onChange={(e) => set({ title: e.target.value })}
                    className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                <ChipGroup
                  label="Стилистика экскурсии"
                  options={EXCURSION_STYLES}
                  selected={values.excursionStyles}
                  onToggle={(v) => set({ excursionStyles: toggleInList(values.excursionStyles, v) })}
                />

                <ChipGroup
                  label="Особенности экскурсии"
                  options={EXCURSION_FEATURES}
                  selected={values.excursionFeatures}
                  onToggle={(v) => set({ excursionFeatures: toggleInList(values.excursionFeatures, v) })}
                  activeClass="border-blue-500 bg-blue-50 text-blue-800"
                />

                <ChipGroup
                  label="Районы проведения (можно несколько)"
                  options={EXCURSION_DISTRICTS}
                  selected={values.selectedDistricts}
                  onToggle={(v) => set({ selectedDistricts: toggleInList(values.selectedDistricts, v) })}
                  activeClass="border-emerald-500 bg-emerald-50 text-emerald-800"
                />

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Цена (₽)</label>
                  <input
                    required
                    type="number"
                    value={values.price}
                    onChange={(e) => set({ price: e.target.value })}
                    className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Длительность</label>
                  <input
                    type="text"
                    value={values.duration}
                    onChange={(e) => set({ duration: e.target.value })}
                    placeholder="3 часа"
                    className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold outline-none"
                  />
                </div>

                <div className="space-y-3 md:col-span-2">
                  <AddressSuggestInput
                    label="Место встречи"
                    value={values.location}
                    onChange={(v) => set({ location: v })}
                    onSelect={(item) => void onApplyGeocode(item.value)}
                    placeholder="Адрес сбора группы"
                    suggestKey="partner-tour-address-modal"
                    icon={<MapPin className="w-5 h-5" />}
                  />
                  <button
                    type="button"
                    onClick={() => void onApplyGeocode(values.location)}
                    disabled={!values.location.trim() || geocodeLoading}
                    className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase disabled:opacity-50"
                  >
                    {geocodeLoading ? 'Поиск...' : 'На карте'}
                  </button>
                  {geocodeError && <p className="text-xs font-bold text-red-500">{geocodeError}</p>}
                  <div className="h-56 rounded-2xl overflow-hidden border border-gray-100">
                    <PointMap
                      lat={values.tourLat}
                      lng={values.tourLng}
                      height="100%"
                      draggable
                      onCoordsChange={onCoordsChange}
                      preset={values.hasTourCoords ? 'islands#blueIcon' : 'islands#grayIcon'}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Начало экскурсии
                  </label>
                  <input
                    type="time"
                    value={values.defaultStartTime}
                    onChange={(e) => set({ defaultStartTime: e.target.value })}
                    className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold outline-none"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">
                    Дни проведения *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {EXCURSION_WEEKDAYS.map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => toggleWeekDay(value)}
                        className={`px-3 py-2 rounded-xl text-[10px] font-bold border-2 transition-all ${
                          values.weekDays.includes(value)
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                            : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {values.weekDays.length > 0 && (
                    <p className="text-xs font-semibold text-gray-500">
                      Расписание: {formatWeekDaysLabel(values.weekDays)}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Макс. туристов</label>
                  <input
                    type="number"
                    value={values.freeSlots}
                    onChange={(e) => set({ freeSlots: e.target.value })}
                    className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Язык</label>
                  <input
                    type="text"
                    value={values.language}
                    onChange={(e) => set({ language: e.target.value })}
                    className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Телефон</label>
                  <input
                    type="text"
                    value={values.phone}
                    onChange={(e) => set({ phone: e.target.value })}
                    className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Сайт</label>
                  <input
                    type="text"
                    value={values.website}
                    onChange={(e) => set({ website: e.target.value })}
                    className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Краткое описание *</label>
                <input
                  required
                  type="text"
                  value={values.description}
                  onChange={(e) => set({ description: e.target.value })}
                  className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Полное описание / программа
                </label>
                <textarea
                  rows={5}
                  value={values.fullDescription}
                  onChange={(e) => set({ fullDescription: e.target.value })}
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-semibold outline-none"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">Обложка</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {presetImages.map((img) => (
                    <button
                      key={img.url}
                      type="button"
                      onClick={() => set({ selectedImage: img.url, customImage: '' })}
                      className={`relative aspect-video rounded-xl overflow-hidden border-2 ${
                        values.selectedImage === img.url && !values.customImage
                          ? 'border-blue-500'
                          : 'border-transparent opacity-80'
                      }`}
                    >
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Своя ссылка на обложку"
                  value={values.customImage}
                  onChange={(e) => set({ customImage: e.target.value, selectedImage: '' })}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-semibold"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-50">
                <button
                  type="button"
                  onClick={onPublish}
                  className={`px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-xs font-black uppercase flex items-center justify-center gap-2 ${!showDraftSave ? 'flex-1' : ''}`}
                >
                  <Sparkles className="w-4 h-4" /> На модерацию
                </button>
                {showDraftSave && (
                  <button
                    type="submit"
                    className="px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black uppercase flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" /> Черновик
                  </button>
                )}
                <button type="button" onClick={onClose} className="px-6 py-4 bg-gray-100 text-gray-700 rounded-2xl text-xs font-black uppercase">
                  Отмена
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
