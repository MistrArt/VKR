import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Save } from 'lucide-react';
import type { MockItem } from '../data/mockData';
import { ROUTE_TAG_OPTIONS, type RouteTagId } from '../data/routeTags';
import {
  emptyPlaceForm,
  mockItemFromPlaceForm,
  PLACE_DISTRICTS,
  PLACE_SUITABLE_FOR_OPTIONS,
  PLACE_THEME_OPTIONS,
  placeFormFromItem,
  toggleListItem,
  type PlaceFormValues,
} from '../utils/placeCatalogForm';

interface AdminPlaceFormModalProps {
  item: MockItem | null;
  open: boolean;
  onClose: () => void;
  onSave: (item: MockItem) => void;
  onDelete?: (id: string) => void;
}

const fieldClass =
  'w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 font-semibold text-sm';
const labelClass =
  'block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 ml-1';

function ChipPicker({
  label,
  options,
  selected,
  onToggle,
  activeClass = 'border-purple-600 bg-purple-50 text-purple-800',
}: {
  label: string;
  options: readonly { id: string; label: string }[] | readonly string[];
  selected: string[];
  onToggle: (id: string) => void;
  activeClass?: string;
}) {
  const normalized = options.map((o) =>
    typeof o === 'string' ? { id: o, label: o } : o,
  );

  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="flex flex-wrap gap-2">
        {normalized.map((opt) => {
          const active = selected.includes(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onToggle(opt.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                active ? activeClass : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminPlaceFormModal({
  item,
  open,
  onClose,
  onSave,
  onDelete,
}: AdminPlaceFormModalProps) {
  const isEdit = Boolean(item);
  const [form, setForm] = useState<PlaceFormValues>(emptyPlaceForm);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(item ? placeFormFromItem(item) : emptyPlaceForm());
      setError(null);
    }
  }, [open, item]);

  const patch = (p: Partial<PlaceFormValues>) => setForm((prev) => ({ ...prev, ...p }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.image.trim()) {
      setError('Заполните название, краткое описание и URL главного фото.');
      return;
    }
    onSave(mockItemFromPlaceForm(form, item));
    onClose();
  };

  const handleDelete = () => {
    if (!item || !onDelete) return;
    if (!confirm(`Удалить «${item.title}» из каталога?`)) return;
    onDelete(item.id);
    onClose();
  };

  if (!open) return null;

  const overlay = (
    <AnimatePresence>
      <motion.div
        key="admin-place-form"
        className="fixed inset-0 z-[1100] flex items-center justify-center p-3 sm:p-6"
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
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          className="relative z-10 w-full max-w-3xl max-h-[94vh] flex flex-col bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
            <h3 className="text-lg font-black text-slate-900">
              {isEdit ? 'Редактирование места' : 'Новое место'}
            </h3>
            <button type="button" onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            <section className="space-y-4">
              <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">
                Основное (как в карточке)
              </p>
              <div>
                <label className={labelClass}>Название</label>
                <input
                  className={fieldClass}
                  value={form.title}
                  onChange={(e) => patch({ title: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Краткое описание</label>
                <textarea
                  className={`${fieldClass} resize-y min-h-[80px]`}
                  value={form.description}
                  onChange={(e) => patch({ description: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>О локации (полное описание)</label>
                <textarea
                  className={`${fieldClass} resize-y min-h-[100px]`}
                  value={form.fullDescription}
                  onChange={(e) => patch({ fullDescription: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Район</label>
                  <select
                    className={fieldClass}
                    value={form.district}
                    onChange={(e) => patch({ district: e.target.value })}
                  >
                    {PLACE_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Адрес / место на карте</label>
                  <input
                    className={fieldClass}
                    value={form.location}
                    onChange={(e) => patch({ location: e.target.value })}
                    placeholder="Екатеринбург, ул. ..."
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest">
                Медиа и рейтинг
              </p>
              <div>
                <label className={labelClass}>URL главного фото</label>
                <input
                  className={fieldClass}
                  value={form.image}
                  onChange={(e) => patch({ image: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Галерея (по одному URL на строку)</label>
                <textarea
                  className={`${fieldClass} resize-y min-h-[72px] font-mono text-xs`}
                  value={form.galleryLines}
                  onChange={(e) => patch({ galleryLines: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Рейтинг</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    className={fieldClass}
                    value={form.rating}
                    onChange={(e) => patch({ rating: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClass}>Цена (₽)</label>
                  <input
                    type="number"
                    min="0"
                    className={fieldClass}
                    value={form.price}
                    onChange={(e) => patch({ price: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClass}>Число отзывов</label>
                  <input
                    type="number"
                    min="0"
                    className={fieldClass}
                    value={form.reviewsCount}
                    onChange={(e) => patch({ reviewsCount: e.target.value })}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <p className="text-[10px] font-black uppercase text-purple-600 tracking-widest">
                Время и теги
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Время посещения</label>
                  <input
                    className={fieldClass}
                    value={form.visitingTime}
                    onChange={(e) => patch({ visitingTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClass}>Часы работы</label>
                  <input
                    className={fieldClass}
                    value={form.workingHours}
                    onChange={(e) => patch({ workingHours: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Рекомендуемое время (для маршрутов)</label>
                  <input
                    className={fieldClass}
                    value={form.recommendTime}
                    onChange={(e) => patch({ recommendTime: e.target.value })}
                  />
                </div>
              </div>
              <ChipPicker
                label="Тематика и теги"
                options={PLACE_THEME_OPTIONS}
                selected={form.themes}
                onToggle={(id) => patch({ themes: toggleListItem(form.themes, id) })}
                activeClass="border-orange-500 bg-orange-50 text-orange-700"
              />
              <ChipPicker
                label="Подходит для"
                options={PLACE_SUITABLE_FOR_OPTIONS}
                selected={form.suitableFor}
                onToggle={(id) => patch({ suitableFor: toggleListItem(form.suitableFor, id) })}
                activeClass="border-emerald-600 bg-emerald-50 text-emerald-800"
              />
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isOpenNow}
                  onChange={(e) => patch({ isOpenNow: e.target.checked })}
                  className="rounded"
                />
                Сейчас открыто
              </label>
            </section>

            <section className="space-y-4">
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                Координаты и контакты
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Широта</label>
                  <input
                    className={fieldClass}
                    value={form.lat}
                    onChange={(e) => patch({ lat: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClass}>Долгота</label>
                  <input
                    className={fieldClass}
                    value={form.lng}
                    onChange={(e) => patch({ lng: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Телефон</label>
                  <input
                    className={fieldClass}
                    value={form.phone}
                    onChange={(e) => patch({ phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClass}>Сайт</label>
                  <input
                    className={fieldClass}
                    value={form.website}
                    onChange={(e) => patch({ website: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClass}>Соцсеть</label>
                  <input
                    className={fieldClass}
                    value={form.social}
                    onChange={(e) => patch({ social: e.target.value })}
                  />
                </div>
              </div>
              <ChipPicker
                label="Теги маршрута (для автоподбора, скрытые в карточке)"
                options={ROUTE_TAG_OPTIONS}
                selected={form.routeTags}
                onToggle={(id) =>
                  patch({
                    routeTags: toggleListItem(form.routeTags, id as RouteTagId),
                  })
                }
                activeClass="border-blue-600 bg-blue-50 text-blue-800"
              />
            </section>

            {error && (
              <p className="text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">
                {error}
              </p>
            )}
          </form>

          <div className="shrink-0 p-4 border-t border-slate-100 bg-slate-50 flex flex-wrap gap-2">
            <button
              type="submit"
              onClick={handleSubmit}
              className="flex-1 min-w-[140px] py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800"
            >
              <Save className="w-4 h-4" />
              Сохранить
            </button>
            {isEdit && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-5 py-3.5 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-red-600"
              >
                <Trash2 className="w-4 h-4" />
                Удалить
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest"
            >
              Отмена
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(overlay, document.body);
}
