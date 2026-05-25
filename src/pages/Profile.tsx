import React, { useEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useGetMyBookingsQuery } from '../api';
import { getAccessToken } from '../api/authToken';
import { apiBookingToAppBooking } from '../api/mappers';
import { RootState } from '../store';
import {
  logout,
  updateUser,
  updateBookingStatus,
  removeVisitedPlace,
  BookingStatus,
} from '../store/authSlice';
import { enrichItem } from '../data/enrichedItems';
import CatalogItemDetailModal from '../components/CatalogItemDetailModal';
import SupportFormSection, { type SupportFormValues } from '../components/SupportFormSection';
import FaqPanel from '../components/FaqPanel';
import { TOURIST_FAQ } from '../data/supportFaq';
import type { MockItem } from '../data/mockData';
import { TOURIST_SUPPORT_TYPES } from '../utils/supportReport';
import { submitUserComplaint } from '../utils/adminComplaints';
import { 
  LogOut, 
  Settings, 
  User as UserIcon, 
  MapPin, 
  Star, 
  BarChart3, 
  ArrowLeft, 
  Save, 
  HelpCircle, 
  Loader2,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  Bell,
  Heart,
  Route,
  Compass,
  Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { markNotificationAsRead, clearNotifications, addNotification, toggleFavorite } from '../store/authSlice';
import TourCard from '../components/TourCard';
import AdminDashboard from './AdminDashboard';
import PartnerDashboard from './PartnerDashboard';
import ProfileHeaderCard from '../components/ProfileHeaderCard';
import { formatBirthDateRu, formatGender } from '../utils/profileDisplay';
import { getPartnerRoleLabel } from '../utils/partnerRoleLabels';
import { Plus } from 'lucide-react';

export default function Profile() {
  const user = useSelector((state: RootState) => state.auth.user);
  const catalogItems = useSelector((state: RootState) => state.auth.items);
  const accessToken =
    useSelector((state: RootState) => state.auth.accessToken) ?? getAccessToken();
  const dispatch = useDispatch();
  const { data: apiBookingsData } = useGetMyBookingsQuery(
    { limit: 100, offset: 0 },
    { skip: !accessToken || !user },
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'bookings' | 'notifications' | 'management' | 'my-tours' | 'routes' | 'support' | 'faq'
  >('overview');
  const [adventureDetailItem, setAdventureDetailItem] = useState<MockItem | null>(null);

  const enrichedCatalogItems = useMemo(
    () => catalogItems.map(enrichItem),
    [catalogItems],
  );

  const visitedAdventures = useMemo(() => {
    const visits = user?.visitedPlaces ?? [];
    return visits
      .map((visit) => {
        const item = enrichedCatalogItems.find((i) => i.id === visit.itemId);
        if (!item) return null;
        return { visit, item };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [user?.visitedPlaces, enrichedCatalogItems]);
  const [showHistory, setShowHistory] = useState(false);

  // Support form state
  const bookings = useMemo(() => {
    if (!user) return [];
    const fromApi =
      apiBookingsData?.items?.map((booking) => apiBookingToAppBooking(booking, user)) ?? [];
    if (fromApi.length > 0) return fromApi;
    return user.bookings || [];
  }, [apiBookingsData, user]);

  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [supportForm, setSupportForm] = useState<SupportFormValues>({
    email: user?.email || '',
    type: 'appeal',
    message: '',
  });
  const [supportSuccess, setSupportSuccess] = useState(false);

  const applySupportReport = (report: {
    itemId: string;
    itemTitle: string;
    type: SupportFormValues['type'];
    message: string;
  }) => {
    setSupportForm((prev) => ({
      ...prev,
      type: report.type,
      message: report.message,
      relatedItemId: report.itemId,
      relatedItemTitle: report.itemTitle,
    }));
    setActiveTab('support');
    setIsSupportOpen(true);
  };

  useEffect(() => {
    const state = location.state as {
      activeTab?: string;
      supportReport?: {
        itemId: string;
        itemTitle: string;
        type: SupportFormValues['type'];
        message: string;
      };
    } | null;
    if (state?.supportReport) {
      applySupportReport(state.supportReport);
      window.history.replaceState({}, document.title);
    } else if (state?.activeTab === 'support') {
      setActiveTab('support');
      setIsSupportOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    const itemId = searchParams.get('itemId');
    const itemTitle = searchParams.get('itemTitle');
    const type = searchParams.get('type') as SupportFormValues['type'] | null;
    if (tab === 'faq') {
      setActiveTab('faq');
      setIsSupportOpen(false);
    } else if (tab === 'support') {
      setActiveTab('support');
      setIsSupportOpen(true);
      if (itemId && itemTitle && type) {
        setSupportForm((prev) => ({
          ...prev,
          type,
          relatedItemId: itemId,
          relatedItemTitle: decodeURIComponent(itemTitle),
          message: prev.message || `Жалоба на: «${decodeURIComponent(itemTitle)}» (ID: ${itemId}).\n\nОпишите проблему:`,
        }));
      }
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !supportForm.message.trim()) return;
    setLoading(true);
    setTimeout(() => {
      submitUserComplaint({
        authorRole: 'tourist',
        authorName: user.name,
        authorEmail: supportForm.email || user.email,
        type: supportForm.type,
        message: supportForm.message,
        relatedItemId: supportForm.relatedItemId,
        relatedItemTitle: supportForm.relatedItemTitle,
      });
      setLoading(false);
      setSupportSuccess(true);
      setSupportForm((prev) => ({ ...prev, message: '' }));
      setTimeout(() => setSupportSuccess(false), 5000);
    }, 600);
  };

  const simulateNotification = (type: 'booking') => {
    dispatch(addNotification({
      id: Math.random().toString(36).substr(2, 9),
      type,
      title: 'Уведомление о бронировании',
      message: 'Это тестовое уведомление о статусе вашей заявки.',
      isRead: false,
      createdAt: new Date().toISOString(),
      link: '/profile'
    }));
  };

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    birthDate: '',
    gender: '',
    passport: '',
    diplomas: '',
  });

  if (!user) return null;

  const handleLogout = async () => {
    try {
      localStorage.removeItem('uraltour_user');
      dispatch(logout());
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Если пользователь администратор, показываем только Dashboard без стандартной обертки профиля
  if (user.role === 'admin') {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  // Если пользователь партнер, показываем кабинет управления экскурсиями
  if (user.role === 'partner') {
    return <PartnerDashboard onLogout={handleLogout} />;
  }

  // Filter bookings:
  // - Tourists see their own bookings
  // - Partners see bookings for their items
  // - Admins see everything (for demo)
  const filteredBookings = (user.role === 'tourist' 
    ? bookings.filter(b => b.touristId === user.id)
    : (user.role as string) === 'partner'
    ? bookings.filter(b => b.partnerId === user.id)
    : bookings).filter(b => {
      const isPast = new Date(b.date) < new Date(new Date().setHours(0,0,0,0));
      return showHistory ? isPast : !isPast;
    });

  const handleUpdateBooking = (id: string, status: BookingStatus) => {
    dispatch(updateBookingStatus({ id, status, actor: 'partner' }));
  };

  const openSettings = () => {
    setFormData({
      name: user.name || '',
      phone: user.phone || '',
      birthDate: user.birthDate || '',
      gender: user.gender || '',
      passport: user.passport || '',
      diplomas: user.diplomas || '',
    });
    setIsSettingsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const updatedUser = { ...user, ...formData };
      localStorage.setItem('uraltour_user', JSON.stringify(updatedUser));
      dispatch(updateUser(formData));
      setIsSettingsOpen(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Администратор';
      case 'partner':
        return getPartnerRoleLabel(user?.partnerType);
      default:
        return 'Путешественник';
    }
  };

  if (isSettingsOpen) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-16 sm:pb-0">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Настройки профиля</h1>
          <button 
            onClick={() => setIsSettingsOpen(false)} 
            className="text-gray-500 hover:text-gray-700 flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Назад в профиль
          </button>
        </div>
        
        <p className="text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full inline-block">
          Демо-режим: изменения сохраняются локально
        </p>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Личная информация */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Личная информация</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ФИО</label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Дата рождения</label>
                <input 
                  type="date" 
                  name="birthDate" 
                  value={formData.birthDate} 
                  onChange={handleChange} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Пол</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                >
                  <option value="">Не указан</option>
                  <option value="male">Мужской</option>
                  <option value="female">Женский</option>
                  <option value="other">Другой</option>
                </select>
              </div>
            </div>
          </div>

          {/* Контакты */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Контакты</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Номер телефона</label>
                <input 
                  type="tel" 
                  name="phone" 
                  value={formData.phone} 
                  onChange={handleChange} 
                  placeholder="+7 (999) 000-00-00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email (только чтение)</label>
                <input 
                  type="email" 
                  name="email" 
                  value={user.email} 
                  disabled
                  className="w-full px-3 py-2 border border-gray-200 bg-gray-50 text-gray-500 rounded-lg outline-none cursor-not-allowed" 
                />
              </div>
            </div>
          </div>

          {/* Документы */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Документы</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Паспорт (серия и номер)</label>
                <input 
                  type="text" 
                  name="passport" 
                  value={formData.passport} 
                  onChange={handleChange} 
                  placeholder="1234 567890"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                />
              </div>
              {user.role !== 'tourist' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Квалификация / Данные</label>
                  <textarea 
                    name="diplomas" 
                    value={formData.diplomas} 
                    onChange={handleChange} 
                    rows={3} 
                    placeholder="Например: Диплом гида-переводчика №123456, Сертификат экскурсовода..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none" 
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button 
              type="button" 
              onClick={() => setIsSettingsOpen(false)} 
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Отмена
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Сохранить изменения
            </button>
          </div>
        </form>
      </div>
    );
  }

  const openFaq = () => {
    setIsSupportOpen(false);
    setActiveTab('faq');
  };

  if (isSupportOpen) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-16 sm:pb-0">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Поддержка пользователей</h1>
          <button 
            onClick={() => setIsSupportOpen(false)} 
            className="text-gray-500 hover:text-gray-700 flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Назад в профиль
          </button>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <SupportFormSection
            typeOptions={TOURIST_SUPPORT_TYPES}
            form={supportForm}
            onChange={(patch) => setSupportForm((prev) => ({ ...prev, ...patch }))}
            onSubmit={handleSupportSubmit}
            onOpenFaq={openFaq}
            loading={loading}
            success={supportSuccess}
            title="Поддержка пользователей"
          />
        </div>
      </div>
    );
  }

  if (activeTab === 'faq') {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-16 sm:pb-0">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Популярные вопросы</h1>
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className="text-gray-500 hover:text-gray-700 flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Назад в профиль
          </button>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <FaqPanel audience="tourist" entries={TOURIST_FAQ} />
          <button
            type="button"
            onClick={() => {
              setActiveTab('support');
              setIsSupportOpen(true);
            }}
            className="mt-8 text-blue-600 font-bold text-sm hover:underline inline-flex items-center gap-1"
          >
            Не нашли ответ? Написать в поддержку <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16 sm:pb-0">
      <ProfileHeaderCard
        avatarUrl={user.avatar}
        avatarAlt={user.name}
        title={user.name || 'Путешественник'}
        details={[
          { label: 'Email', value: user.email },
          ...(user.phone ? [{ label: 'Телефон', value: user.phone }] : []),
          { label: 'Дата рождения', value: formatBirthDateRu(user.birthDate) },
          { label: 'Пол', value: formatGender(user.gender) },
        ]}
        roleBadge={getRoleLabel(user.role)}
        actions={[
          {
            key: 'settings',
            label: 'Настройки',
            icon: <Settings className="h-4 w-4" />,
            onClick: openSettings,
          },
          {
            key: 'support',
            label: 'Поддержка',
            icon: <HelpCircle className="h-4 w-4" />,
            onClick: () => setIsSupportOpen(true),
          },
          {
            key: 'logout',
            label: 'Выйти',
            icon: <LogOut className="h-4 w-4" />,
            onClick: handleLogout,
            variant: 'danger',
          },
        ]}
      />

      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Обзор
        </button>
        <button 
          onClick={() => setActiveTab('bookings')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'bookings' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Бронирования
          {user.role !== 'tourist' && filteredBookings.filter(b => b.status === 'pending').length > 0 && (
            <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] animate-pulse">
              {filteredBookings.filter(b => b.status === 'pending').length}
            </span>
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' ? (
          <motion.div 
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {user.role === 'tourist' ? (
              <div className="md:col-span-2 space-y-6">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                        <MapPin className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">Ваши приключения</h3>
                        <p className="text-sm text-gray-500 font-medium">История посещенных локаций</p>
                      </div>
                    </div>
                    <div className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
                      {visitedAdventures.length === 0
                        ? '0 посещений'
                        : visitedAdventures.length === 1
                          ? '1 посещение'
                          : visitedAdventures.length >= 2 && visitedAdventures.length <= 4
                            ? `${visitedAdventures.length} посещения`
                            : `${visitedAdventures.length} посещений`}
                    </div>
                  </div>

                  {visitedAdventures.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                      <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-bold text-sm">
                        Пока нет посещений. Отметьте маршрут как пройденный в разделе «Планы».
                      </p>
                      <Link
                        to="/plans?tab=my-routes"
                        className="inline-block mt-4 text-blue-600 text-xs font-black uppercase tracking-widest hover:underline"
                      >
                        Мои маршруты
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {visitedAdventures.map(({ visit, item }) => (
                        <div
                          key={visit.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => setAdventureDetailItem(item)}
                          onKeyDown={(e) => e.key === 'Enter' && setAdventureDetailItem(item)}
                          className="group relative rounded-2xl overflow-hidden aspect-[4/3] border border-gray-100 cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all"
                        >
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              dispatch(removeVisitedPlace(visit.id));
                            }}
                            className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-red-600 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                            title="Удалить из приключений"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <div className="absolute bottom-4 left-4 right-4">
                            <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest mb-1">
                              {new Date(visit.visitedAt).toLocaleDateString('ru-RU', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })}
                            </p>
                            <h4 className="text-white font-bold text-sm leading-tight">{item.title}</h4>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-blue-600 p-8 rounded-3xl shadow-xl shadow-blue-500/20 text-white flex flex-col sm:flex-row items-center justify-between gap-6 overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Compass className="w-48 h-48" />
                  </div>
                  <div className="relative z-10 text-center sm:text-left">
                    <h3 className="text-2xl font-black mb-2">Готовы к новым открытиям?</h3>
                    <p className="text-blue-100 font-medium">Спланируйте свой следующий маршрут сегодня</p>
                  </div>
                  <Link to="/plans?tab=constructor" className="relative z-10 px-8 py-4 bg-white text-blue-600 rounded-2xl font-black shadow-lg hover:shadow-white/20 transition-all active:scale-95">
                    Собрать маршрут
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                      <BarChart3 className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Посещаемость экскурсий</h3>
                  </div>
                  <ul className="space-y-3 mt-2">
                    <li className="flex justify-between items-center border-b border-gray-50 pb-2">
                      <span className="text-sm text-gray-700">Обзорная экскурсия</span>
                      <span className="font-bold text-gray-900">25 чел.</span>
                    </li>
                    <li className="flex justify-between items-center border-b border-gray-50 pb-2">
                      <span className="text-sm text-gray-700">Стрит-арт Екатеринбурга</span>
                      <span className="font-bold text-gray-900">23 чел.</span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Тайны старого Урала</span>
                      <span className="font-bold text-gray-900">12 чел.</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Действия (Демо)</h3>
                  </div>
                  <div className="space-y-2">
                    <button 
                      onClick={() => simulateNotification('booking')}
                      className="w-full py-2 px-4 bg-gray-50 hover:bg-gray-100 rounded-xl text-xs font-black uppercase tracking-widest text-gray-600 transition-colors"
                    >
                      Симулировать уведомление
                    </button>
                  </div>
                  <Link to="/partner" className="mt-4 block w-full py-2 px-4 border border-blue-600 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors text-center">
                    Управление экскурсиями
                  </Link>
                </div>
              </>
            )}
          </motion.div>
        ) : activeTab === 'bookings' ? (
          <motion.div 
            key="bookings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900">Бронирования</h3>
              <div className="flex bg-gray-100 p-1 rounded-xl">
                <button 
                  onClick={() => setShowHistory(false)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${!showHistory ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
                >
                  Активные
                </button>
                <button 
                  onClick={() => setShowHistory(true)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${showHistory ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
                >
                  История
                </button>
              </div>
            </div>

            {filteredBookings.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-gray-500 font-bold">Бронирований пока нет</p>
                <Link to="/search?category=excursions" className="mt-4 inline-block text-blue-600 font-bold text-sm hover:underline">
                  Найти что-нибудь интересное
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredBookings.map((booking) => (
                  <div key={booking.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                        <MapPin className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-black text-gray-900">{booking.itemTitle}</h4>
                        <div className="flex flex-col gap-1 mt-1">
                          <div className="flex items-center gap-3 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {booking.date}</span>
                            {user.role !== 'tourist' && <span className="flex items-center gap-1"><UserIcon className="w-3 h-3" /> {booking.touristName}</span>}
                          </div>
                          {user.role !== 'tourist' && (
                            <p className="text-[10px] text-blue-600 font-bold flex items-center gap-2">
                              <span>Тел: {booking.touristPhone || '+7 (9XX) XXX-XX-XX'}</span>
                              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                              <span>Email: {booking.touristEmail || 'traveler@example.com'}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 ${
                        booking.status === 'confirmed' ? 'bg-green-50 text-green-600' :
                        booking.status === 'declined' ? 'bg-red-50 text-red-600' :
                        'bg-yellow-50 text-yellow-600'
                      }`}>
                        {booking.status === 'confirmed' ? <CheckCircle2 className="w-3 h-3" /> :
                         booking.status === 'declined' ? <XCircle className="w-3 h-3" /> :
                         <Clock className="w-3 h-3" />}
                        {booking.status === 'confirmed'
                          ? 'Подтверждено'
                          : booking.status === 'declined'
                            ? booking.declinedBy === 'tourist'
                              ? 'Вы отказались'
                              : 'Отклонено организатором'
                            : 'Ожидает подтверждения'}
                      </div>

                      {user.role === 'tourist' && booking.status === 'pending' && !showHistory && (
                        <button
                          onClick={() => dispatch(updateBookingStatus({ id: booking.id, status: 'declined', actor: 'tourist' }))}
                          className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          Отказаться
                        </button>
                      )}

                      {user.role !== 'tourist' && booking.status === 'pending' && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleUpdateBooking(booking.id, 'confirmed')}
                            className="p-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20"
                            title="Подтвердить"
                          >
                            <CheckCircle2 className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleUpdateBooking(booking.id, 'declined')}
                            className="p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                            title="Отклонить"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ) : activeTab === 'support' ? (
          <motion.div 
            key="support"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <SupportFormSection
                typeOptions={TOURIST_SUPPORT_TYPES}
                form={supportForm}
                onChange={(patch) => setSupportForm((prev) => ({ ...prev, ...patch }))}
                onSubmit={handleSupportSubmit}
                onOpenFaq={openFaq}
                loading={loading}
                success={supportSuccess}
                title="Поддержка пользователей"
              />
            </div>
          </motion.div>
        ) : activeTab === 'routes' ? (
          <motion.div 
            key="routes"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900">Мои маршруты</h3>
              <Link to="/plans?tab=constructor" className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 transition-all">
                <Plus className="w-4 h-4" /> Создать новый
              </Link>
            </div>
            
            {(!user.routes || user.routes.length === 0) ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Route className="w-8 h-8 text-gray-200" />
                </div>
                <p className="text-gray-500 font-bold">У вас пока нет созданных маршрутов</p>
                <Link to="/plans?tab=constructor" className="mt-4 inline-block text-blue-600 font-bold text-sm hover:underline">
                  Спланировать путешествие
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {user.routes.map(route => (
                   <div key={route.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-lg transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <Route className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-black text-gray-900 group-hover:text-blue-600 transition-colors">{route.title}</h4>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                          {route.waypoints.length} точек • Создан {new Date(route.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <Link 
                        to={`/plans?tab=my-routes&id=${route.id}`}
                        className="px-4 py-2 bg-gray-50 text-blue-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                      >
                        Открыть
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ) : activeTab === 'my-tours' ? (
          <motion.div 
            key="partner-tours"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900">Мои экскурсии и туры</h3>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 transition-all">
                <Plus className="w-4 h-4" /> Добавить
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {catalogItems.filter(item => item.partnerId === user.id).map(item => (
                <TourCard key={item.id} item={item} />
              ))}
              {/* Dummy data if none strictly match partnerId */}
              {catalogItems.filter(item => item.partnerId === user.id).length === 0 && catalogItems.slice(0, 2).map(item => (
                <TourCard key={item.id} item={item} />
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="notifications"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900">Уведомления</h3>
              {user.notifications && user.notifications.length > 0 && (
                <button 
                  onClick={() => dispatch(clearNotifications())}
                  className="text-xs font-black text-blue-600 uppercase tracking-widest hover:blue-700"
                >
                  Очистить всё
                </button>
              )}
            </div>
            
            {(!user.notifications || user.notifications.length === 0) ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-gray-200" />
                </div>
                <p className="text-gray-500 font-bold">Нет новых уведомлений</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {user.notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`bg-white p-6 rounded-3xl shadow-sm border border-gray-100 transition-all ${!notif.isRead ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                    onClick={() => dispatch(markNotificationAsRead(notif.id))}
                  >
                    <div className="flex gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                        notif.type === 'booking' ? 'bg-blue-50 text-blue-600' :
                        'bg-gray-50 text-gray-600'
                      }`}>
                        {notif.type === 'booking' ? <Calendar className="w-6 h-6" /> :
                         <Bell className="w-6 h-6" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-black text-gray-900 text-lg leading-tight">{notif.title}</h4>
                          <span className="text-xs font-bold text-gray-400">
                            {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-gray-500 font-medium leading-relaxed mb-4">
                          {notif.message}
                        </p>
                        <div className="flex items-center justify-between">
                          {!notif.isRead ? (
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-md">Новое</span>
                          ) : (
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-md">Прочитано</span>
                          )}
                          {notif.link && (
                            <Link to={notif.link} className="flex items-center gap-1 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">
                              Перейти к разделу <ChevronRight className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <CatalogItemDetailModal
        item={adventureDetailItem}
        onClose={() => setAdventureDetailItem(null)}
        catalogItems={enrichedCatalogItems}
      />
    </div>
  );
}
