import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { addBooking } from '../store/authSlice';
import { useCreateBookingMutation } from '../api';
import { parseCatalogItemId } from '../api/mappers';
import { MockItem } from '../data/mockData';
import { getGuideProfileForExcursion } from '../data/guideProfiles';
import ExcursionDateCalendar from './ExcursionDateCalendar';
import GuideProfileModal from './GuideProfileModal';
import ExpandableMap from './ExpandableMap';
import ItemAddressLine from './ItemAddressLine';
import {
  formatBookingDateTime,
  getExcursionAvailableDates,
  getExcursionStartTime,
} from '../utils/excursionSchedule';
import { motion, AnimatePresence } from 'motion/react';
import { YMaps, Map, Placemark } from '@pbe/react-yandex-maps';
import {
  MapPin,
  Star,
  X,
  CheckCircle2,
  Clock,
  Utensils,
  User,
  MessagesSquare,
  Navigation,
  Globe,
  Phone,
  Check,
} from 'lucide-react';

export interface CatalogItemDetailModalProps {
  item: MockItem | null;
  onClose: () => void;
  catalogItems?: MockItem[];
  onSelectItem?: (item: MockItem) => void;
}

export default function CatalogItemDetailModal({
  item,
  onClose,
  catalogItems = [],
  onSelectItem,
}: CatalogItemDetailModalProps) {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [createBooking] = useCreateBookingMutation();

  const [activePhoto, setActivePhoto] = useState<string | null>(null);
  const [newReviewAuthor, setNewReviewAuthor] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewText, setNewReviewText] = useState('');
  const [customReviews, setCustomReviews] = useState<
    Record<string, { author: string; rating: number; text: string; date: string }[]>
  >({});
  const [excursionBookingDate, setExcursionBookingDate] = useState<string | null>(null);
  const [guideProfileOpen, setGuideProfileOpen] = useState(false);

  const canBookExcursion = user?.role !== 'partner';

  const excursionAvailableDates = useMemo(() => {
    if (!item || item.category !== 'excursions') return [];
    return getExcursionAvailableDates(item);
  }, [item]);

  const excursionGuideProfile = useMemo(() => {
    if (!item || item.category !== 'excursions') return null;
    return getGuideProfileForExcursion(item, user?.role === 'partner' ? user : null);
  }, [item, user]);

  const excursionStartTime = useMemo(() => {
    if (!item || !excursionBookingDate) return undefined;
    return getExcursionStartTime(item, excursionBookingDate);
  }, [item, excursionBookingDate]);

  useEffect(() => {
    if (item) {
      setActivePhoto(null);
      setNewReviewAuthor(user?.name || '');
      setNewReviewRating(5);
      setNewReviewText('');
      setExcursionBookingDate(null);
      setGuideProfileOpen(false);
    }
  }, [item, user]);

  const handleAddReview = (itemId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewText || !newReviewAuthor) return;

    const reviewObj = {
      author: newReviewAuthor,
      rating: newReviewRating,
      text: newReviewText,
      date: new Date().toLocaleDateString(),
    };

    setCustomReviews((prev) => {
      const current = prev[itemId] || [];
      return { ...prev, [itemId]: [reviewObj, ...current] };
    });

    setNewReviewText('');
    alert('Спасибо! Ваш отзыв был успешно отправлен и добавлен на страницу.');
  };

  const categoryBadgeLabel =
    item?.category === 'places'
      ? 'Место'
      : item?.category === 'restaurants'
        ? 'Ресторан'
        : 'Экскурсия';

  return (
    <>      {/* Detail Modal */}
      <AnimatePresence>
        {item && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => onClose()}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              className="bg-white w-full max-w-6xl h-[92vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row relative"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => onClose()}
                className="absolute top-6 right-6 z-30 p-3 bg-black/50 hover:bg-black/75 text-white rounded-2xl transition-all shadow-xl backdrop-blur-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* LEFT COLUMN: Media Gallery, switcher and interactive Map */}
              <div className="md:w-[42%] flex flex-col justify-between bg-slate-50 border-r border-gray-100 p-8 h-[380px] md:h-auto overflow-y-auto custom-scrollbar">
                <div className="space-y-6">
                  <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden shadow-md">
                    <img 
                      src={activePhoto || item.image} 
                      alt={item.title} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    <div className="absolute bottom-5 left-5 right-5 text-white">
                      <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg">
                        {categoryBadgeLabel}
                      </span>
                    </div>
                  </div>

                  {/* Thumbnails strip */}
                  {item.images && item.images.length > 0 && (
                    <div>
                      <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2.5">Галерея фото ({item.images.length})</span>
                      <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1">
                        {item.images.map((imgUrl, i) => (
                          <button
                            key={i}
                            onClick={() => setActivePhoto(imgUrl)}
                            className={`w-16 h-12 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                              (activePhoto || item.image) === imgUrl ? 'border-blue-600 scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                            }`}
                          >
                            <img src={imgUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Left side integrated map */}
                <div className="mt-6">
                  <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    {item.category === 'excursions' ? 'Место сбора' : 'Геолокация объекта'}
                  </span>
                  <ExpandableMap
                    height="11rem"
                    roundedClassName="rounded-[2rem]"
                    className="bg-gray-200 border-gray-100 shadow-sm"
                    renderMap={() => (
                      <YMaps>
                        <Map
                          defaultState={{ center: [item.lat || 56.8389, item.lng || 60.6057], zoom: 14 }}
                          width="100%"
                          height="100%"
                          options={{
                            suppressMapOpenBlock: true,
                            yandexMapDisablePoiInteractivity: true,
                          }}
                        >
                          <Placemark geometry={[item.lat || 56.8389, item.lng || 60.6057]} />
                        </Map>
                      </YMaps>
                    )}
                  />
                  <p className="text-[11px] font-bold text-gray-500 mt-2 text-center truncate">{item.location || 'Урал, Екатеринбург'}</p>
                </div>
              </div>

              {/* RIGHT COLUMN: Specific Segmented Detailed Breakdown */}
              <div className="md:w-[58%] overflow-y-auto p-10 md:p-14 custom-scrollbar flex flex-col justify-between">
                <div>
                  {/* CATEGORY A: PLACES / ROUTES DETAILS */}
                  {item.category === 'places' && (
                    <div className="space-y-8">
                      {/* Place Header */}
                      <div>
                        <div className="flex items-center gap-2.5 mb-2">
                          <span className="bg-emerald-50 text-emerald-700 font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-xl">
                            {item.district || 'Центральный район'}
                          </span>
                          <span className="bg-yellow-400 text-black font-black text-[10px] px-3 py-1 rounded-xl flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            {item.rating.toFixed(1)} ({item.reviewsCount || 23})
                          </span>
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2">{item.title}</h2>
                        <ItemAddressLine item={item} className="mb-3 text-sm" />
                        <p className="text-gray-500 font-semibold leading-relaxed text-base">{item.description}</p>
                      </div>

                      {/* Full description */}
                      <div className="bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">О локации</h3>
                        <p className="text-gray-700 text-sm leading-relaxed font-medium">
                          {item.fullDescription || `${item.title} — одно из самых известных знаковых пространств уральской столицы. Здесь можно ощутить историческую глубину Свердловска-Екатеринбурга, увидеть старинную индустриализацию и познакомиться с современной городской культурой.`}
                        </p>
                      </div>

                      {/* Quick specifications grid */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-emerald-50/20 p-5 rounded-3xl border border-emerald-50">
                          <span className="block text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Время посещения
                          </span>
                          <p className="font-bold text-gray-900 text-sm">{item.visitingTime || '30 - 60 минут'}</p>
                        </div>
                        <div className="bg-blue-50/20 p-5 rounded-3xl border border-blue-50">
                          <span className="block text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Часы работы
                          </span>
                          <p className="font-bold text-gray-900 text-sm">{item.workingHours || 'Круглосуточно'}</p>
                        </div>
                        <div className="bg-pink-50/20 p-5 rounded-3xl border border-pink-50 col-span-2">
                          <span className="block text-[9px] font-black text-pink-600 uppercase tracking-widest mb-1.5">Тематика и теги</span>
                          <div className="flex flex-wrap gap-1.5">
                            {item.theme && item.theme.map(t => (
                              <span key={t} className="bg-white border border-gray-100 px-2.5 py-1 rounded-xl text-xs font-bold text-gray-600 shadow-sm">{t}</span>
                            ))}
                            <span className="bg-white border border-gray-100 px-2.5 py-1 rounded-xl text-xs font-bold text-gray-600 shadow-sm">Для всей семьи</span>
                          </div>
                        </div>
                      </div>

                      {/* Recommendations block: 2 other local Places */}
                      <div>
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3.5">Рядом в этом районе</h3>
                        <div className="grid grid-cols-2 gap-4">
                          {catalogItems
                            .filter(x => x.category === 'places' && x.id !== item.id)
                            .slice(0, 2)
                            .map(rec => (
                              <div 
                                key={rec.id}
                                onClick={() => onSelectItem?.(rec)}
                                className="bg-white border border-slate-100 p-3 rounded-2xl hover:border-blue-500 cursor-pointer transition-all flex items-center gap-3.5"
                              >
                                <img src={rec.image} className="w-12 h-12 object-cover rounded-xl shrink-0" referrerPolicy="no-referrer" alt="" />
                                <div className="truncate">
                                  <h4 className="font-bold text-gray-900 text-xs truncate">{rec.title}</h4>
                                  <span className="text-[10px] text-gray-400 font-medium">{rec.district}</span>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CATEGORY B: RESTAURANTS DETAILS */}
                  {item.category === 'restaurants' && (
                    <div className="space-y-8">
                      {/* Restaurant Header */}
                      <div>
                        <div className="flex items-center gap-2.5 mb-2">
                          <span className="bg-orange-50 text-orange-700 font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-xl">
                            Ресторан • {item.district || 'Центр'}
                          </span>
                          <span className="bg-red-50 text-red-600 font-black text-[10px] px-3 py-1 rounded-xl flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            {item.rating.toFixed(1)} ({item.reviewsCount || 18})
                          </span>
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2">{item.title}</h2>
                        <ItemAddressLine item={item} className="mb-2 text-sm" />
                        <h4 className="text-gray-400 font-black text-xs uppercase tracking-wider mb-3">
                          Кухня: {item.cuisines?.join(', ')} • Средний чек: <span className="text-gray-900">~ {item.averageCheck || 1500} ₽</span>
                        </h4>
                        <p className="text-gray-500 font-semibold leading-relaxed text-base">{item.description}</p>
                      </div>

                      {/* Atmosphere description */}
                      <div className="bg-orange-50/15 p-6 rounded-[2.5rem] border border-orange-100/30">
                        <h3 className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1.5">Об атмосфере заведения</h3>
                        <p className="text-gray-700 text-sm leading-relaxed font-semibold">
                          {item.atmosphereDescription || 'Эксклюзивный уральский ресторан с авторским меню. Изысканная подача блюд из локальных фермерских продуктов высшего качества, авторские десерты и уютная обстановка оставят приятные воспоминания.'}
                        </p>
                      </div>

                      {/* Menu selection list */}
                      {item.popularDishes && item.popularDishes.length > 0 && (
                        <div>
                          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3.5 flex items-center gap-1.5">
                            <Utensils className="w-4 h-4 text-orange-500" /> Популярные блюда и цены
                          </h3>
                          <div className="space-y-2.5">
                            {item.popularDishes.map((dish, i) => (
                              <div key={i} className="flex justify-between items-center bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                                <div>
                                  <h4 className="font-bold text-gray-900 text-xs">{dish.name}</h4>
                                  <p className="text-[10px] text-gray-400">{dish.desc || 'Фирменное уральское блюдо из свежих продуктов'}</p>
                                </div>
                                <span className="bg-orange-50 text-orange-700 text-xs font-black px-3 py-1 rounded-lg shrink-0">
                                  {dish.price} ₽
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Facilities checkmarks grid */}
                      <div>
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Особенности заведения</h3>
                        <div className="grid grid-cols-2 gap-2.5">
                          {(item.features || ['Wi-Fi', 'Летняя веранда', 'Детское меню', 'Оплата картой']).map(feat => (
                            <div key={feat} className="flex items-center gap-2 text-xs font-bold text-gray-600 bg-slate-50 p-2.5 rounded-xl border border-gray-100">
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Contacts info */}
                      <div className="border border-slate-100 rounded-3xl p-6 grid grid-cols-2 gap-4 text-xs font-bold text-gray-600 bg-white">
                        <div>
                          <span className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Связь</span>
                          <a href={`tel:${item.contacts?.phone || '+7 (343) 123-45-67'}`} className="flex items-center gap-1.5 hover:text-blue-600">
                            <Phone className="w-3.5 h-3.5 text-orange-500" />
                            {item.contacts?.phone || '+7 (343) 123-45-67'}
                          </a>
                        </div>
                        <div>
                          <span className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Сайт</span>
                          <a href={`https://${item.contacts?.website || 'urltour.ru'}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-blue-600">
                            <Globe className="w-3.5 h-3.5 text-orange-500" />
                            {item.contacts?.website || 'ural-rest.ru'}
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CATEGORY C: EXCURSIONS DETAILS */}
                  {item.category === 'excursions' && (
                    <div className="space-y-8">
                      {/* Excursion Header */}
                      <div>
                        <div className="flex items-center gap-2.5 mb-2">
                          <span className="bg-purple-50 text-purple-700 font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-xl">
                            Экскурсия • {item.district || 'Екатеринбург'}
                          </span>
                          <span className="bg-yellow-400 text-black font-black text-[10px] px-3 py-1 rounded-xl flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            {item.rating.toFixed(1)} ({item.reviewsCount || 34})
                          </span>
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2">{item.title}</h2>
                        <ItemAddressLine item={item} className="mb-3 text-sm" />

                        <div className="flex items-center gap-3.5 text-xs font-bold text-gray-500 mb-4 bg-purple-50/20 p-3 rounded-2xl border border-purple-50">
                          <span className="flex items-center gap-1 text-purple-700">🕒 Длительность: {item.duration || '2 часа'}</span>
                          <span className="text-gray-300">|</span>
                          <span className="flex items-center gap-1 text-purple-700">🗣️ Язык: {item.language || 'Русский'}</span>
                          <span className="text-gray-300">|</span>
                          <span className="flex items-center gap-1 text-orange-600">👥 Свободно мест: {item.freeSlots || 8} из 12</span>
                        </div>
                      </div>

                      {/* Organiser / guide widget */}
                      <div className="flex items-center justify-between border-2 border-slate-50 p-4 rounded-3xl bg-slate-50/50 gap-3">
                        <button
                          type="button"
                          onClick={() => setGuideProfileOpen(true)}
                          className="flex items-center gap-3 text-left group flex-1 min-w-0 rounded-2xl -m-1 p-1 hover:bg-white/80 transition-colors"
                        >
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center font-bold text-purple-700 text-sm shrink-0 group-hover:ring-2 group-hover:ring-purple-300 transition-all">
                            {(excursionGuideProfile?.displayName || item.tourOperator || 'ГД').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="block text-[8px] font-black text-purple-500 uppercase">Экскурсовод</span>
                            <h4 className="font-bold text-gray-900 text-sm truncate group-hover:text-purple-700 transition-colors">
                              {excursionGuideProfile?.displayName || item.tourOperator || 'Екатеринбург Тур Груп'}
                            </h4>
                            <span className="text-[10px] font-bold text-purple-600 group-hover:underline">
                              Профиль гида →
                            </span>
                          </div>
                        </button>
                        <Link to="/support" className="text-xs font-black text-blue-600 hover:underline shrink-0">
                          Support
                        </Link>
                      </div>

                      {/* Contacts info for excursions */}
                      <div className="border border-purple-100 rounded-3xl p-6 space-y-3 bg-purple-50/10">
                        <h3 className="text-[10px] font-black text-purple-600 uppercase tracking-widest flex items-center gap-2">
                          <Phone className="w-4 h-4 text-purple-500" />
                          Контакты для связи с организатором
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold text-gray-700">
                          <a href={`tel:${item.contacts?.phone || '+7 (922) 800-44-33'}`} className="flex items-center gap-2 hover:text-purple-600 transition-colors">
                            <Phone className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                            <span>Тел: {item.contacts?.phone || '+7 (922) 800-44-33'}</span>
                          </a>
                          <a href={`https://${item.contacts?.website || 'urltour.ru'}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-purple-600 transition-colors">
                            <Globe className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                            <span>Сайт: {item.contacts?.website || 'ural-operator.ru'}</span>
                          </a>
                        </div>
                      </div>

                      {/* Full description */}
                      <div className="bg-slate-50 p-6 rounded-[2rem] border border-gray-100">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Программа и концепция</h3>
                        <p className="text-gray-700 text-sm leading-relaxed font-medium">
                          {item.fullProgram || `Это детальная авторская экскурсия-приключение от сертифицированного гида. Мы в деталях пройдем по центральным городским улочкам, отгадаем вековые шифры зодчества, познакомимся с тайнами уральских купцов и золотой лихорадки на Урале.`}
                        </p>
                      </div>

                      {/* Itinerary points checklist */}
                      {item.itinerary && item.itinerary.length > 0 && (
                        <div>
                          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                            <Navigation className="w-4 h-4 text-purple-600" /> Маршрут экскурсии (ключевые точки)
                          </h3>
                          <div className="space-y-2 border-l-2 border-purple-200 pl-4 ml-2">
                            {item.itinerary.map((point, index) => (
                              <div key={index} className="relative">
                                <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-purple-600 border border-white"></div>
                                <h4 className="font-bold text-xs text-gray-900">{point}</h4>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Included checklist */}
                      <div className="grid grid-cols-2 gap-4">
                        <section className="bg-emerald-50/20 p-5 rounded-3xl border border-emerald-50">
                          <h4 className="text-[9px] font-black text-emerald-700 uppercase tracking-widest mb-2 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Включено
                          </h4>
                          <ul className="text-[11px] font-semibold text-gray-600 space-y-1">
                            {item.included ? item.included.map((x, i) => <li key={i}>✓ {x}</li>) : (
                              <>
                                <li>✓ Сопровождение гида</li>
                                <li>✓ Буклет с картой</li>
                                <li>✓ Чай из самовара</li>
                              </>
                            )}
                          </ul>
                        </section>
                        <section className="bg-red-50/20 p-5 rounded-3xl border border-red-50">
                          <h4 className="text-[9px] font-black text-red-700 uppercase tracking-widest mb-2">Ограничения</h4>
                          <ul className="text-[11px] font-semibold text-gray-600 space-y-1">
                            <li>⚠️ Возраст: {item.ageLimit || '6+'}</li>
                            <li>⚠️ Продолжительная ходьба</li>
                          </ul>
                        </section>
                      </div>

                      {canBookExcursion ? (
                        <ExcursionDateCalendar
                          availableDates={excursionAvailableDates}
                          selectedDate={excursionBookingDate}
                          onSelectDate={setExcursionBookingDate}
                          startTime={excursionStartTime}
                        />
                      ) : (
                        <div className="rounded-[2rem] border border-gray-100 bg-gray-50 p-5 text-center">
                          <p className="text-sm font-bold text-gray-600">
                            Бронирование доступно только туристам. Управляйте экскурсиями в личном кабинете партнёра.
                          </p>
                        </div>
                      )}

                      <div className="bg-purple-50/40 p-6 rounded-[2rem] border border-purple-100 flex flex-wrap justify-between items-center gap-4">
                        <div>
                          <span className="block text-[8px] font-black text-purple-700 uppercase tracking-widest mb-1">Стоимость</span>
                          <span className="font-black text-gray-900 text-lg">
                            {item.price > 0 ? `${item.price.toLocaleString('ru-RU')} ₽` : 'Бесплатно'}
                          </span>
                          <span className="block text-[10px] font-bold text-gray-500 mt-0.5">за участника</span>
                        </div>
                        <div className="text-right">
                          <span className="block text-[8px] font-black text-purple-700 uppercase tracking-widest mb-1">Свободно мест</span>
                          <span className="bg-purple-600 text-white text-[10px] font-black px-2.5 py-1 rounded-xl">
                            {item.freeSlots || 6} из 12
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CUSTOM INTEGRAL REVIEWS SEGMENT (SHOWN FOR ALL) */}
                  <div className="mt-12 pt-10 border-t border-gray-100 space-y-8">
                    <div>
                      <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                        <MessagesSquare className="w-5 h-5 text-blue-600" />
                        Отзывы путешественников ({((item.reviews || []).length + (customReviews[item.id] || []).length)})
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">Оценки основаны на реальных впечатлениях туристов</p>
                    </div>

                    {/* Review Feed list */}
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {/* Enjected custom reviews entered inside this browser session! */}
                      {customReviews[item.id] && customReviews[item.id].map((rev, i) => (
                        <div key={`custom-${i}`} className="bg-blue-50/30 p-5 rounded-[2rem] border border-blue-50/50 space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-black text-gray-900 flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-blue-600" /> {rev.author} (Я)
                            </span>
                            <span className="text-gray-400 font-bold">{rev.date}</span>
                          </div>
                          <div className="flex gap-1">
                            {Array.from({ length: rev.rating }).map((_, rIdx) => (
                              <Star key={rIdx} className="w-3 h-3 text-yellow-500 fill-current" />
                            ))}
                          </div>
                          <p className="text-xs text-gray-700 font-semibold leading-relaxed">{rev.text}</p>
                        </div>
                      ))}

                      {/* Base default items */}
                      {item.reviews && item.reviews.map((rev, i) => (
                        <div key={i} className="bg-gray-50 p-5 rounded-[2rem] border border-slate-100 space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-black text-gray-800 flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-gray-400" /> {rev.author}
                            </span>
                            <span className="text-gray-400 font-bold">{rev.date}</span>
                          </div>
                          <div className="flex gap-1">
                            {Array.from({ length: rev.rating }).map((_, rIdx) => (
                              <Star key={rIdx} className="w-3 h-3 text-yellow-400 fill-current" />
                            ))}
                          </div>
                          <p className="text-xs text-slate-600 font-medium leading-relaxed">{rev.text}</p>
                        </div>
                      ))}

                      {(!item.reviews || item.reviews.length === 0) && (!customReviews[item.id] || customReviews[item.id].length === 0) && (
                        <p className="text-center py-6 text-xs font-bold text-gray-400">Пока нет отзывов. Станьте первым, кто оставит свое мнение!</p>
                      )}
                    </div>

                    {/* Create review interactive form */}
                    <form onSubmit={(e) => handleAddReview(item.id, e)} className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 space-y-4">
                      <h4 className="text-xs font-black text-gray-700 uppercase tracking-widest">Оставить свой отзыв</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Имя автора</label>
                          <input 
                            type="text" 
                            required
                            placeholder="Например, Александр"
                            value={newReviewAuthor}
                            onChange={(e) => setNewReviewAuthor(e.target.value)}
                            className="bg-white border border-gray-200 outline-none p-3.5 rounded-xl text-xs font-bold text-gray-800 w-full"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Ваша оценка</label>
                          <select
                            value={newReviewRating}
                            onChange={(e) => setNewReviewRating(parseInt(e.target.value))}
                            className="bg-white border border-gray-200 outline-none p-3.5 rounded-xl text-xs font-black text-gray-800 w-full cursor-pointer"
                          >
                            <option value="5">⭐⭐⭐⭐⭐ (5 баллов)</option>
                            <option value="4">⭐⭐⭐⭐ (4 балла)</option>
                            <option value="3">⭐⭐⭐ (3 балла)</option>
                            <option value="2">⭐⭐ (2 балла)</option>
                            <option value="1">⭐ (1 балл)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Текст отзыва</label>
                        <textarea 
                          rows={3}
                          required
                          placeholder="Поделитесь вашими впечатлениями, уютом, советами туристам..."
                          value={newReviewText}
                          onChange={(e) => setNewReviewText(e.target.value)}
                          className="bg-white border border-gray-200 outline-none p-4 rounded-xl text-xs font-bold text-gray-800 w-full resize-none leading-relaxed"
                        />
                      </div>

                      <button 
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-xs font-black transition-all shadow-md active:scale-95"
                      >
                        Опубликовать отзыв
                      </button>
                    </form>
                  </div>
                </div>

                {/* BOTTOM PRIMARY BUTTON GROUP AND CTA TRIGGERS */}
                {item.category === 'excursions' && canBookExcursion && (
                  <div className="mt-10 pt-8 border-t border-gray-100 space-y-3">
                    {!excursionBookingDate && (
                      <p className="text-center text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-100 rounded-xl py-2 px-3">
                        Выберите дату в календаре выше, чтобы забронировать экскурсию
                      </p>
                    )}
                    {excursionBookingDate && (
                      <p className="text-center text-[11px] font-semibold text-purple-800 bg-purple-50 border border-purple-100 rounded-xl py-2 px-3">
                        {formatBookingDateTime(item, excursionBookingDate)}
                      </p>
                    )}
                    <button 
                      disabled={!excursionBookingDate}
                      onClick={async () => {
                        if (!excursionBookingDate) return;

                        if (!user) {
                          navigate('/auth', { state: { from: location } });
                          return;
                        }

                        const bookingDateLabel = formatBookingDateTime(item, excursionBookingDate);

                        const ref = parseCatalogItemId(item.id);
                        if (ref?.kind === 'excursion') {
                          try {
                            await createBooking({
                              excursionId: ref.id,
                              participantsCount: 1,
                            }).unwrap();
                            alert(`Успешно! Заявка на ${bookingDateLabel} отправлена. Статус — в личном кабинете.`);
                            onClose();
                            return;
                          } catch {
                            /* fallback to local booking below */
                          }
                        }

                        const newBooking = {
                          id: Math.random().toString(36).substr(2, 9),
                          itemId: item.id,
                          itemTitle: item.title,
                          touristId: user.id,
                          touristName: user.name,
                          partnerId: item.partnerId || 'admin-id',
                          status: 'pending' as const,
                          date: bookingDateLabel,
                          createdAt: new Date().toISOString()
                        };

                        dispatch(addBooking(newBooking));
                        alert(`Заявка на ${bookingDateLabel} сохранена локально (сервер недоступен).`);
                        onClose();
                      }}
                      className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:shadow-none disabled:hover:translate-y-0 text-white rounded-2xl font-black text-xs shadow-md shadow-blue-500/20 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Забронировать тур
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <GuideProfileModal
        profile={guideProfileOpen ? excursionGuideProfile : null}
        onClose={() => setGuideProfileOpen(false)}
      />
    </>
  );
}
