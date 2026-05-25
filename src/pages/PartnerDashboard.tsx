import React, { useState, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { 
  Plus, 
  Star, 
  Calendar, 
  MessageSquare, 
  Compass, 
  ShieldCheck, 
  Users, 
  ArrowUpRight, 
  TrendingUp,
  MoreVertical,
  Phone,
  Mail,
  Check,
  X,
  Edit2,
  Trash2,
  Eye,
  Settings,
  Bell,
  FileText,
  Sliders,
  Globe,
  Clock,
  ArrowLeft,
  ChevronRight,
  HelpCircle,
  Sparkles,
  LogOut,
  Award,
  Building,
  User as UserIcon,
  UserCheck,
  Upload,
  CheckCircle2,
  Loader2,
  MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  updateBookingStatus, 
  BookingStatus, 
  addMockItem, 
  updateMockItem, 
  deleteMockItem, 
  updateUser,
  AppNotification
} from '../store/authSlice';
import { MockItem, Category } from '../data/mockData';
import {
  useCreateExcursionMutation,
  useDeleteExcursionMutation,
  useGetMyExcursionsQuery,
  usePublishExcursionMutation,
  useUpdateBookingStatusMutation,
  useUpdateExcursionMutation,
} from '../api';
import { getAccessToken } from '../api/authToken';
import {
  excursionToMockItem,
  parseCatalogItemId,
  parseDurationHours,
  appBookingStatusToApi,
} from '../api/mappers';
import AddressSuggestInput from '../maps/components/AddressSuggestInput';
import PointMap from '../maps/components/PointMap';
import { useGeocode } from '../maps/hooks/useGeocode';
import { EKATERINBURG_CENTER } from '../maps/constants';

const PRESET_IMAGES = [
  { url: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800", name: "Природа и Горы Урала" },
  { url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=800", name: "Реки и Озера" },
  { url: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=800", name: "Исторические улочки" },
  { url: "https://images.unsplash.com/photo-1527631746610-bca00a040d60?q=80&w=800", name: "Активный пеший тур" },
  { url: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800", name: "Культура и Музеи" },
  { url: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=800", name: "Гастрономия Урала" }
];

const DISTRICTS = ['Центральный', 'Октябрьский', 'Ленинский', 'Чкаловский', 'ВИЗ', 'Академический', 'Уралмаш'];

interface PartnerDashboardProps {
  onLogout?: () => void;
}

export default function PartnerDashboard({ onLogout }: PartnerDashboardProps = {}) {
  const user = useSelector((state: RootState) => state.auth.user);
  const items = useSelector((state: RootState) => state.auth.items || []);
  const bookings = useSelector((state: RootState) => state.auth.bookings || []);
  const routes = useSelector((state: RootState) => state.auth.routes || []);
  const accessToken =
    useSelector((state: RootState) => state.auth.accessToken) ?? getAccessToken();
  const dispatch = useDispatch();

  const { data: myExcursionsData, refetch: refetchMyExcursions } = useGetMyExcursionsQuery(
    { limit: 100, offset: 0 },
    { skip: !accessToken },
  );
  const [createExcursion] = useCreateExcursionMutation();
  const [updateExcursion] = useUpdateExcursionMutation();
  const [deleteExcursion] = useDeleteExcursionMutation();
  const [publishExcursion] = usePublishExcursionMutation();
  const [updateBookingStatusApi] = useUpdateBookingStatusMutation();

  // Selected tab
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'tours'>('overview');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  // Support form state
  const [supportForm, setSupportForm] = useState({
    email: user?.email || '',
    type: 'appeal' as 'appeal' | 'complaint_object' | 'complaint_excursion',
    message: ''
  });
  const [supportSuccess, setSupportSuccess] = useState(false);
  const [supportLoading, setSupportLoading] = useState(false);

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSupportLoading(true);
    // Simulate API call
    setTimeout(() => {
      setSupportLoading(false);
      setSupportSuccess(true);
      setSupportForm(prev => ({ ...prev, message: '' }));
      setTimeout(() => setSupportSuccess(false), 5000);
    }, 1000);
  };

  // Tour management modes
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTour, setEditingTour] = useState<MockItem | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [category, setCategory] = useState<Category>('excursions');
  const [price, setPrice] = useState('2000');
  const [duration, setDuration] = useState('3 часа');
  const [district, setDistrict] = useState('Центральный');
  const [location, setLocation] = useState('');
  const [tourLat, setTourLat] = useState(EKATERINBURG_CENTER[0]);
  const [tourLng, setTourLng] = useState(EKATERINBURG_CENTER[1]);
  const [hasTourCoords, setHasTourCoords] = useState(false);
  const { geocode, loading: geocodeLoading, error: geocodeError } = useGeocode();
  const [workingHours, setWorkingHours] = useState('По записи');
  const [dates, setDates] = useState('Каждые выходные');
  const [freeSlots, setFreeSlots] = useState('15');
  const [language, setLanguage] = useState('Русский');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [selectedImage, setSelectedImage] = useState(PRESET_IMAGES[0].url);
  const [customImage, setCustomImage] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState('');

  // Settings profile form states
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '+7 (922) 800-44-33');
  const [profileCompany, setProfileCompany] = useState(user?.passport || 'УралТур Оператор'); // reuse passport or empty for company name
  const [profileBio, setProfileBio] = useState(user?.diplomas || 'Сертифицированный организатор экскурсий и этно-туров по Среднему Уралу.');
  const [partnerType, setPartnerType] = useState<'individual' | 'company'>(user?.partnerType || 'company');
  const [certificates, setCertificates] = useState<{ id: string; title: string; fileUrl: string; uploadDate: string }[]>(
    user?.certificates || [
      { 
        id: 'cert-1', 
        title: 'Аттестат экскурсовода (гида) Свердловской области №044-У', 
        fileUrl: 'https://images.unsplash.com/photo-1589330694653-ded6df53f6ee?auto=format&fit=crop&w=800&q=80', 
        uploadDate: '12.03.2025' 
      },
      { 
        id: 'cert-2', 
        title: 'Диплом о профессиональной переподготовке по направлению «Краеведение и туризм Урала»', 
        fileUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80', 
        uploadDate: '10.11.2024' 
      }
    ]
  );
  const [newCertTitle, setNewCertTitle] = useState('');
  const [newCertUrl, setNewCertUrl] = useState('');
  const [isAddingCert, setIsAddingCert] = useState(false);

  // Notification search filter
  const [notificationFilter, setNotificationFilter] = useState<'all' | 'unread'>('all');

  // Bookings filter state
  const [bookingFilterStatus, setBookingFilterStatus] = useState<'all' | 'pending' | 'confirmed' | 'declined'>('all');

  // Overview report sorting state
  const [overviewSortBy, setOverviewSortBy] = useState<'bookings' | 'views' | 'rating' | 'date'>('bookings');

  if (user?.role !== 'partner' && user?.role !== 'admin') {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white border border-gray-100 rounded-3xl text-center shadow-lg">
        <HelpCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-black text-gray-900">Доступ запрещен</h2>
        <p className="text-gray-500 mt-2 text-sm font-semibold">Личный кабинет организатора доступен только пользователям с ролью «Партнер».</p>
      </div>
    );
  }

  const apiTours = useMemo(
    () => myExcursionsData?.items?.map(excursionToMockItem) ?? [],
    [myExcursionsData],
  );

  // Get tours owned by this partner, or fallback to general excursions so the partner dashboard is populated initially
  const myTours = useMemo(() => {
    if (apiTours.length > 0) return apiTours;
    return items.filter(item => item.partnerId === user?.id || (item.category === 'excursions' && (!item.partnerId || item.partnerId === 'admin-id')));
  }, [apiTours, items, user?.id]);

  const myTourIds = useMemo(() => new Set(myTours.map(t => t.id)), [myTours]);

  // Bookings made for partner's tours, or assigned directly to user ID
  const myBookings = useMemo(() => {
    return bookings.filter(b => myTourIds.has(b.itemId) || b.partnerId === user?.id);
  }, [bookings, myTourIds, user?.id]);

  const filteredBookings = useMemo(() => {
    if (bookingFilterStatus === 'all') return myBookings;
    return myBookings.filter(b => b.status === bookingFilterStatus);
  }, [myBookings, bookingFilterStatus]);

  // Calculate dynamic statistics
  const stats = useMemo(() => {
    const totalBookingsCount = myBookings.length;
    const pendingBookingsCount = myBookings.filter(b => b.status === 'pending').length;
    
    const confirmedBks = myBookings.filter(b => b.status === 'confirmed');
    
    // Revenue based on dynamic booking cost
    const revenueSum = confirmedBks.reduce((sum, b) => {
      const tour = myTours.find(t => t.id === b.itemId) || items.find(t => t.id === b.itemId);
      const tourPrice = tour ? tour.price : 2500;
      return sum + tourPrice;
    }, 0);

    // Sum of ratings
    const ratingsArray = myTours.filter(t => t.rating > 0).map(t => t.rating);
    const avgRating = ratingsArray.length > 0 
      ? (ratingsArray.reduce((s, r) => s + r, 0) / ratingsArray.length).toFixed(2) 
      : "4.85";

    // Estimated tourists headcount
    const totalTouristsCount = totalBookingsCount * 2 + 5; 

    return {
      revenue: revenueSum,
      totalBookings: totalBookingsCount,
      pendingBookings: pendingBookingsCount,
      avgRating: avgRating,
      tourists: totalTouristsCount
    };
  }, [myBookings, myTours, items]);

  // Tour detailed report with views, bookings, etc.
  const tourReport = useMemo(() => {
    return myTours.map(tour => {
      // Deterministic views based on tour ID characters code sum
      const idSum = tour.id.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
      const views = (idSum % 450) + 180; // 180 - 630 views
      
      const tourBookings = myBookings.filter(b => b.itemId === tour.id);
      const bookingsCount = tourBookings.length;
      const declinesCount = tourBookings.filter(b => b.status === 'declined').length;
      const rating = tour.rating || 5.0;
      const reviewsCount = tour.reviewsCount || (idSum % 6) + 1;
      
      // Calculate realistic creation date
      let createdAt = tour.createdAt;
      if (!createdAt) {
        const daysAgo = (idSum % 25) + 5;
        const creationDate = new Date(Date.now() - daysAgo * 24 * 3600 * 1000);
        createdAt = creationDate.toISOString();
      }
      
      const conversion = views > 0 ? ((bookingsCount / views) * 100) : 0;

      return {
        ...tour,
        views,
        bookingsCount,
        declinesCount,
        rating,
        reviewsCount,
        createdAt,
        conversion
      };
    }).sort((a, b) => {
      if (overviewSortBy === 'bookings') {
        return b.bookingsCount - a.bookingsCount;
      } else if (overviewSortBy === 'views') {
        return b.views - a.views;
      } else if (overviewSortBy === 'rating') {
        return b.rating - a.rating;
      } else if (overviewSortBy === 'date') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });
  }, [myTours, myBookings, overviewSortBy]);

  // Handle Booking actions
  const handleUpdateStatus = async (id: string, status: BookingStatus) => {
    const numericId = Number(id);
    if (accessToken && !Number.isNaN(numericId)) {
      try {
        await updateBookingStatusApi({
          id: numericId,
          body: { status: appBookingStatusToApi(status) },
        }).unwrap();
      } catch {
        /* local fallback */
      }
    }
    dispatch(updateBookingStatus({ id, status }));
  };

  const applyAddressGeocode = useCallback(
    async (address: string) => {
      const trimmed = address.trim();
      if (!trimmed) return;
      const coords = await geocode(trimmed);
      if (coords) {
        setTourLat(coords[0]);
        setTourLng(coords[1]);
        setHasTourCoords(true);
      }
    },
    [geocode],
  );

  const handleTourCoordsChange = useCallback((lat: number, lng: number) => {
    setTourLat(lat);
    setTourLng(lng);
    setHasTourCoords(true);
  }, []);

  // Open edit form
  const handleOpenEdit = (tour: MockItem) => {
    setEditingTour(tour);
    setTitle(tour.title);
    setDescription(tour.description);
    setFullDescription(tour.fullDescription || '');
    setCategory(tour.category);
    setPrice(tour.price.toString());
    setDuration(tour.duration || '3 часа');
    setDistrict(tour.district || 'Центральный');
    setLocation(tour.location || '');
    if (tour.hasCoordinates) {
      setTourLat(tour.lat);
      setTourLng(tour.lng);
      setHasTourCoords(true);
    } else {
      setTourLat(EKATERINBURG_CENTER[0]);
      setTourLng(EKATERINBURG_CENTER[1]);
      setHasTourCoords(false);
    }
    setWorkingHours(tour.workingHours || 'По записи');
    setDates(tour.dates ? tour.dates[0] : 'Каждые выходные');
    setFreeSlots(tour.freeSlots ? tour.freeSlots.toString() : '15');
    setLanguage(tour.language || 'Русский');
    setPhone(tour.contacts?.phone || '');
    setWebsite(tour.contacts?.website || '');
    setSelectedImage(tour.image);
    setCustomImage('');
    setSelectedRouteId(tour.routeId || '');
    setIsFormOpen(true);
  };

  // Open creation form
  const handleOpenCreate = () => {
    setEditingTour(null);
    setTitle('');
    setDescription('');
    setFullDescription('');
    setCategory('excursions');
    setPrice('2000');
    setDuration('3 часа');
    setDistrict('Центральный');
    setLocation('');
    setTourLat(EKATERINBURG_CENTER[0]);
    setTourLng(EKATERINBURG_CENTER[1]);
    setHasTourCoords(false);
    setWorkingHours('По записи');
    setDates('Каждые выходные');
    setFreeSlots('15');
    setLanguage('Русский');
    setPhone(user?.phone || '');
    setWebsite('');
    setSelectedImage(PRESET_IMAGES[0].url);
    setCustomImage('');
    setSelectedRouteId('');
    setIsFormOpen(true);
  };

  const buildExcursionRequest = (tourData: MockItem, submitToModeration: boolean) => {
    const today = new Date();
    const end = new Date(today);
    end.setMonth(end.getMonth() + 1);

    return {
      title: tourData.title,
      description: tourData.description,
      duration: parseDurationHours(tourData.duration ?? '3 часа'),
      price: tourData.price,
      startDate: today.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      meetingAddress: tourData.location,
      latitude: tourData.lat,
      longitude: tourData.lng,
      maxParticipants: tourData.freeSlots ?? 15,
      isPublished: submitToModeration,
    };
  };

  // Submit form handler
  const handleSaveTour = async (e: React.FormEvent, submitToModeration: boolean) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert("Пожалуйста, заполните название и краткое описание");
      return;
    }

    const finalImage = customImage.trim() !== '' ? customImage.trim() : selectedImage;
    const tourStatus = submitToModeration ? 'pending' : (editingTour ? editingTour.status || 'draft' : 'draft');

    let finalItinerary: string[] | undefined;
    if (selectedRouteId) {
      const activeRoute = routes.find(r => r.id === selectedRouteId);
      if (activeRoute) {
        finalItinerary = [activeRoute.startPoint, ...activeRoute.waypoints, activeRoute.endPoint];
      }
    }

    const tourData: MockItem = {
      id: editingTour ? editingTour.id : 'tour-' + Math.random().toString(36).substr(2, 9),
      title: title.trim(),
      description: description.trim(),
      fullDescription: fullDescription.trim() || `${description.trim()} Увлекательный авторский тур по самым ярким локациям.`,
      category: category,
      price: Number(price) || 0,
      lat: hasTourCoords ? tourLat : (editingTour?.lat ?? EKATERINBURG_CENTER[0]),
      lng: hasTourCoords ? tourLng : (editingTour?.lng ?? EKATERINBURG_CENTER[1]),
      hasCoordinates: hasTourCoords,
      image: finalImage,
      rating: editingTour?.rating || 5.0,
      partnerId: user?.id || 'partner-1',
      tourOperator: profileCompany || user?.passport || 'УралТур Оператор',
      status: tourStatus,
      createdAt: editingTour?.createdAt || new Date().toISOString(),
      district: district,
      location: location.trim() || `${district} район, Екатеринбург`,
      workingHours: workingHours.trim(),
      duration: duration.trim(),
      dates: [dates.trim()],
      freeSlots: Number(freeSlots) || 12,
      language: language,
      reviewsCount: editingTour?.reviewsCount || 0,
      itinerary: finalItinerary || editingTour?.itinerary,
      routePoints: finalItinerary || editingTour?.routePoints,
      routeId: selectedRouteId || undefined,
      contacts: {
        phone: phone.trim() || user?.phone || '+7 (922) 800-44-33',
        website: website.trim() || 'ural-operator.ru'
      }
    };

    const excursionBody = buildExcursionRequest(tourData, submitToModeration);
    const existingRef = editingTour ? parseCatalogItemId(editingTour.id) : null;

    if (accessToken) {
      try {
        if (existingRef?.kind === 'excursion') {
          await updateExcursion({ id: existingRef.id, body: excursionBody }).unwrap();
        } else {
          await createExcursion(excursionBody).unwrap();
        }
        await refetchMyExcursions();
        alert(`Тур "${title}" сохранён на сервере.${submitToModeration ? ' Отправлен на модерацию.' : ''}`);
        setIsFormOpen(false);
        setEditingTour(null);
        return;
      } catch {
        /* fallback to local storage below */
      }
    }

    if (editingTour) {
      dispatch(updateMockItem(tourData));
      alert(`Тур "${title}" сохранён локально.${submitToModeration ? ' Отправлен на повторную модерацию.' : ''}`);
    } else {
      dispatch(addMockItem(tourData));
      alert(`Тур "${title}" создан локально (сервер недоступен).`);
    }

    setIsFormOpen(false);
    setEditingTour(null);
  };

  // Delete Tour Handler
  const handleDelete = async (id: string) => {
    if (!confirm("Вы действительно хотите удалить этот тур со всей историей?")) return;

    const ref = parseCatalogItemId(id);
    if (accessToken && ref?.kind === 'excursion') {
      try {
        await deleteExcursion(ref.id).unwrap();
        await refetchMyExcursions();
        alert('Тур успешно удалён');
        return;
      } catch {
        /* fallback */
      }
    }

    dispatch(deleteMockItem(id));
    alert('Тур удалён локально');
  };

  // Simulate Instant Approval (Admin helper for partner demonstration)
  const handleApproveInstantly = async (tour: MockItem) => {
    const ref = parseCatalogItemId(tour.id);
    if (accessToken && ref?.kind === 'excursion') {
      try {
        await publishExcursion(ref.id).unwrap();
        await refetchMyExcursions();
        alert(`Тур "${tour.title}" опубликован на сервере.`);
        return;
      } catch {
        /* fallback */
      }
    }

    const approvedTour = { ...tour, status: 'active' as const };
    dispatch(updateMockItem(approvedTour));
    alert(`[Демонстрация] Тур "${tour.title}" опубликован локально.`);
  };

  // Switch status from Draft to Pending (Publish attempt)
  const handleSendToModeration = async (tour: MockItem) => {
    const ref = parseCatalogItemId(tour.id);
    if (accessToken && ref?.kind === 'excursion') {
      try {
        await publishExcursion(ref.id).unwrap();
        await refetchMyExcursions();
        alert(`Тур "${tour.title}" отправлен на модерацию.`);
        return;
      } catch {
        /* fallback */
      }
    }

    const updatingTour = { ...tour, status: 'pending' as const };
    dispatch(updateMockItem(updatingTour));
    alert(`Тур "${tour.title}" отправлен на модерацию (локально).`);
  };

  // Save Settings handler
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(updateUser({
      name: profileName,
      email: profileEmail,
      phone: profilePhone,
      passport: profileCompany, // reuse fields cleanly
      diplomas: profileBio,
      partnerType: partnerType,
      certificates: certificates
    }));
    alert("Данные профиля успешно сохранены!");
  };

  if (isSettingsOpen) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 py-10 px-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-5">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Настройки профиля</h1>
            <p className="text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full inline-block mt-2 font-semibold">
              Демо-режим: изменения сохраняются локально
            </p>
          </div>
          <button 
            type="button"
            onClick={() => setIsSettingsOpen(false)} 
            className="text-gray-500 hover:text-gray-700 flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Назад в профиль
          </button>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm space-y-6">
          <div className="border-b border-gray-100 pb-5">
            <h2 className="text-xl font-black text-gray-900">
              {partnerType === 'company' ? 'Профиль туристической компании' : 'Личный профиль профессионального гида'}
            </h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
              {partnerType === 'company' 
                ? 'Отображается на карточке экскурсии в качестве компании-организатора' 
                : 'Отображается на детальной странице в качестве сертифицированного гида'}
            </p>
          </div>

          <form onSubmit={(e) => { handleSaveSettings(e); setIsSettingsOpen(false); }} className="space-y-6">
            
            {/* Account Type Toggle */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">Тип аккаунта организатора</label>
              <div className="grid grid-cols-2 gap-3 p-1 bg-gray-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setPartnerType('individual')}
                  className={`py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider transition-all ${
                    partnerType === 'individual'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  Частный гид
                </button>
                <button
                  type="button"
                  onClick={() => setPartnerType('company')}
                  className={`py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider transition-all ${
                    partnerType === 'company'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Building className="w-4 h-4" />
                  Компания / Оператор
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Company Display Name */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">
                  {partnerType === 'company' ? 'Наименование туроператора / юрлицо' : 'Имя гида / Творческий бренд'}
                </label>
                <input 
                  type="text"
                  className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all"
                  value={profileCompany}
                  placeholder={partnerType === 'company' ? 'Уральский Экскурсионный Клуб' : 'Гид Александр / UralGuide'}
                  onChange={(e) => setProfileCompany(e.target.value)}
                />
              </div>

              {/* Manager Name */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">
                  {partnerType === 'company' ? 'ФИО руководителя / представителя' : 'Полное ФИО для документов'}
                </label>
                <input 
                  type="text"
                  className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all"
                  value={profileName}
                  placeholder="Алексеев В.И."
                  onChange={(e) => setProfileName(e.target.value)}
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">
                  {partnerType === 'company' ? 'Контактный телефон компании' : 'Мобильный телефон гида'}
                </label>
                <input 
                  type="text"
                  className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all"
                  value={profilePhone}
                  placeholder="+7 (343) 222-11-00"
                  onChange={(e) => setProfilePhone(e.target.value)}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">
                  {partnerType === 'company' ? 'Контактный email оператора' : 'Личный email гида'}
                </label>
                <input 
                  type="email"
                  className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all"
                  value={profileEmail}
                  placeholder="operator@ural.ru"
                  onChange={(e) => setProfileEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Company Bio & focus */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">
                {partnerType === 'company' ? 'О компании / Направления туризма (био)' : 'О себе / Личные компетенции и достижения (резюме)'}
              </label>
              <textarea 
                rows={4}
                className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-semibold focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all"
                value={profileBio}
                placeholder="Напишите подробный рассказ о себе или о ваших авторских направлениях туризма..."
                onChange={(e) => setProfileBio(e.target.value)}
              />
            </div>

            {/* Certificates / Diplomas Section */}
            <div className="pt-6 border-t border-gray-100 space-y-4">
              <div>
                <h3 className="text-sm font-black text-gray-900 flex items-center gap-2 uppercase tracking-wide">
                  <Award className="w-5 h-5 text-blue-600 animate-pulse" />
                  Документы и Сертификаты
                </h3>
                <p className="text-[10px] text-gray-400 font-bold block mt-1 uppercase tracking-widest">
                  Аттестаты экскурсовода, дипломы уральских ВУЗов и аккредитации Минтуризма РФ
                </p>
              </div>

              {/* Certificates List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {certificates.map((cert) => (
                  <div key={cert.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-start gap-3 relative group">
                    <div className="p-2.5 bg-blue-100/50 text-blue-600 rounded-xl">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-gray-900 line-clamp-2 pr-6 leading-normal">{cert.title}</h4>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[9px] font-extrabold text-gray-400 uppercase">Загружено: {cert.uploadDate}</span>
                        <span className="text-[10px] text-gray-300">•</span>
                        <a 
                          href={cert.fileUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-0.5"
                        >
                          Просмотр <ArrowUpRight className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCertificates(certificates.filter(c => c.id !== cert.id));
                      }}
                      className="absolute right-3 top-3 p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {certificates.length === 0 && (
                  <div className="md:col-span-2 text-center py-8 text-gray-400 font-bold bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-xs">
                    Список документов пуст. Прикрепите лицензии для повышения доверия!
                  </div>
                )}
              </div>

              {/* Upload Form */}
              {!isAddingCert ? (
                <button
                  type="button"
                  onClick={() => setIsAddingCert(true)}
                  className="px-5 py-3 w-full border border-dashed border-blue-200 hover:border-blue-400 text-blue-600 rounded-2xl text-xs font-black uppercase tracking-wider bg-blue-50/10 hover:bg-blue-50/30 transition-all flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Загрузить новый сертификат / диплом
                </button>
              ) : (
                <div className="p-5 bg-blue-50/20 border border-blue-100 rounded-2xl space-y-4">
                  <h4 className="text-xs font-black text-blue-800 uppercase tracking-wider">Прикрепить сертификат/диплом</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-gray-500">Название документа *</label>
                      <input 
                        type="text"
                        placeholder="Например: Лицензия гида №123-У"
                        className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-100 text-xs font-bold outline-none focus:ring-4 focus:ring-blue-100 text-gray-800"
                        value={newCertTitle}
                        onChange={(e) => setNewCertTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-gray-500">Ссылка на документ или скан (URL) *</label>
                      <input 
                        type="text"
                        placeholder="https://images.unsplash.com/photo-..."
                        className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-100 text-xs font-bold outline-none focus:ring-4 focus:ring-blue-100 text-gray-800"
                        value={newCertUrl}
                        onChange={(e) => setNewCertUrl(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2.5 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCert(false);
                        setNewCertTitle('');
                        setNewCertUrl('');
                      }}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                    >
                      Отмена
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!newCertTitle.trim()) {
                          alert("Введите название документа");
                          return;
                        }
                        const finalUrl = newCertUrl.trim() || 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80';
                        const newCert = {
                          id: 'cert-' + Date.now(),
                          title: newCertTitle.trim(),
                          fileUrl: finalUrl,
                          uploadDate: new Date().toLocaleDateString('ru-RU')
                        };
                        setCertificates([...certificates, newCert]);
                        setNewCertTitle('');
                        setNewCertUrl('');
                        setIsAddingCert(false);
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                    >
                      Принять файл
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Submit settings button */}
            <div className="pt-4 border-t border-gray-50 flex justify-end">
              <button
                type="submit"
                className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all"
              >
                Сохранить изменения
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (isSupportOpen) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 py-10 px-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Поддержка пользователей</h1>
          <button 
            type="button"
            onClick={() => setIsSupportOpen(false)} 
            className="text-gray-500 hover:text-gray-700 flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Назад в профиль
          </button>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Поддержка пользователей</h3>
                <p className="text-sm text-gray-500 font-medium">Мы всегда на связи, чтобы помочь вам</p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col gap-1 max-w-sm">
              <span className="text-xs font-black text-gray-900">Часто задаваемые вопросы</span>
              <a href="/help" className="text-blue-600 font-bold text-xs hover:underline inline-flex items-center gap-1">
                Перейти в FAQ <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {supportSuccess && (
            <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-2xl flex items-center gap-3 border border-green-100">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-bold">Ваше обращение успешно отправлено! Мы ответим вам в ближайшее время.</span>
            </div>
          )}

          <form onSubmit={handleSupportSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Тип обращения</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { id: 'appeal', label: 'Вопрос' },
                  { id: 'complaint_object', label: 'Жалоба на объект' },
                  { id: 'complaint_excursion', label: 'Жалоба на экскурсию' }
                ].map(type => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSupportForm(prev => ({ ...prev, type: type.id as any }))}
                    className={`px-4 py-3 rounded-xl text-xs font-bold border-2 transition-all ${
                      supportForm.type === type.id 
                        ? 'border-blue-600 bg-blue-50 text-blue-600' 
                        : 'border-gray-50 bg-gray-50 text-gray-400'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Ваш Email для ответа</label>
                <input 
                  type="email" 
                  value={supportForm.email}
                  onChange={(e) => setSupportForm(prev => ({ ...prev, email: e.target.value }))}
                  required
                  placeholder="example@mail.ru"
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Текст обращения</label>
              <textarea 
                value={supportForm.message}
                onChange={(e) => setSupportForm(prev => ({ ...prev, message: e.target.value }))}
                required
                placeholder="Опишите вашу проблему или задайте вопрос..."
                rows={5}
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium resize-none text-sm"
              />
            </div>

            <button 
              type="submit"
              disabled={supportLoading || !supportForm.message}
              className="w-full sm:w-auto px-12 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-wider transition-all active:scale-95 shadow-xl shadow-blue-500/10 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3"
            >
              {supportLoading && <Loader2 className="w-5 h-5 animate-spin" />}
              Отправить
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* HEADER SECTION — как у туриста (Profile.tsx) */}
      <div className="max-w-3xl mx-auto w-full">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
            <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0 overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="h-full w-full rounded-full object-cover" />
              ) : (
                <UserIcon className="h-12 w-12" />
              )}
            </div>
            <div className="text-center sm:text-left flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 truncate">
                {profileCompany || user?.name || 'Партнёр'}
              </h1>
              <p className="text-gray-500">{user?.email}</p>
              {profilePhone && <p className="text-gray-500 text-sm mt-1">{profilePhone}</p>}
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2">
                Партнер
              </span>
            </div>
            <div className="flex flex-wrap gap-3 w-full sm:w-auto justify-center sm:justify-end">
              <button
                type="button"
                onClick={() => { setIsSettingsOpen(true); setIsFormOpen(false); }}
                className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Settings className="h-4 w-4 mr-2" />
                Настройки
              </button>
              <button
                type="button"
                onClick={() => { setIsSupportOpen(true); setIsFormOpen(false); }}
                className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                Поддержка
              </button>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Выйти
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* TABS MENU */}
      <div className="flex bg-gray-100 p-1.5 rounded-2xl max-w-xl mx-auto overflow-x-auto shadow-inner border border-gray-200/50">
        <button 
          onClick={() => { setActiveTab('overview'); setIsFormOpen(false); }}
          className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2 flex-1 justify-center ${activeTab === 'overview' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          Обзор
        </button>
        <button 
          onClick={() => { setActiveTab('tours'); setIsFormOpen(false); }}
          className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2 flex-1 justify-center ${activeTab === 'tours' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Compass className="w-3.5 h-3.5" />
          Мои туры ({myTours.length})
        </button>
        <button 
          onClick={() => { setActiveTab('bookings'); setIsFormOpen(false); }}
          className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2 flex-1 justify-center ${activeTab === 'bookings' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Calendar className="w-3.5 h-3.5" />
          Заявки {stats.pendingBookings > 0 && (
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping shrink-0" />
          )}
        </button>
      </div>

      {/* DYNAMIC FORM VIEW (CREATE / EDIT) */}
      <AnimatePresence mode="wait">
        {isFormOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-lg space-y-6"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-5">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsFormOpen(false)}
                  className="p-2.5 hover:bg-gray-100 rounded-xl transition-all"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-500" />
                </button>
                <div>
                  <h2 className="text-xl font-black text-gray-900">
                    {editingTour ? `Редактирование: ${editingTour.title}` : 'Создание нового тура / экскурсии'}
                  </h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Форма на публикацию</p>
                </div>
              </div>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="w-10 h-10 rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all flex items-center justify-center font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => handleSaveTour(e, false)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Select route from My Routes */}
                <div className="space-y-2 md:col-span-2 bg-blue-50/40 p-5 rounded-3xl border border-blue-50/70">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-blue-800">Маршрут экскурсии (из «Мои маршруты»)</label>
                    <span className="text-[9px] text-blue-600 bg-blue-100/60 px-2 py-0.5 rounded-full font-extrabold uppercase">Опционально</span>
                  </div>
                  <select 
                    value={selectedRouteId}
                    onChange={(e) => {
                      const uid = e.target.value;
                      setSelectedRouteId(uid);
                      if (uid) {
                        const rt = routes.find(r => r.id === uid);
                        if (rt) {
                          if (!location) {
                            setLocation(rt.startPoint);
                          }
                          if (!title) {
                            setTitle(`Авторский тур: ${rt.title}`);
                          }
                        }
                      }
                    }}
                    className="w-full px-5 py-3.5 rounded-2xl bg-white border border-blue-100 text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none transition-all text-gray-800"
                  >
                    <option value="">-- Без привязки к готовому маршруту --</option>
                    {routes.map(r => (
                      <option key={r.id} value={r.id}>{r.title} ({r.startPoint} ➔ {r.endPoint})</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-blue-500 font-semibold mt-1.5 px-1">Если выбран готовый маршрут, его ключевые точки отобразятся в карточке экскурсии в каталоге.</p>
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Название тура/мероприятия *</label>
                  <input 
                    type="text"
                    required
                    placeholder="Напр: Легенды старого Сысертского завода"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all"
                  />
                </div>

                {/* Category selector */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Категория</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Category)}
                    className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all"
                  >
                    <option value="excursions">Экскурсия / Этно-тур</option>
                    <option value="places">Место</option>
                    <option value="restaurants">Ресторан / Трактир</option>
                  </select>
                </div>

                {/* Price */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Цена участия (₽)</label>
                  <input 
                    type="number"
                    required
                    placeholder="2500"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all"
                  />
                </div>

                {/* Duration */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Длительность</label>
                  <input 
                    type="text"
                    placeholder="Напр: 4 часа, 2 дня"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all"
                  />
                </div>

                {/* District selection */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Район проведения</label>
                  <select 
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all"
                  >
                    {DISTRICTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                    <option value="Свердловская область">Пригород (Область)</option>
                  </select>
                </div>

                {/* Location + map */}
                <div className="space-y-3 md:col-span-2">
                  <AddressSuggestInput
                    label="Точный адрес отправки / старт"
                    value={location}
                    onChange={setLocation}
                    onSelect={(item) => void applyAddressGeocode(item.value)}
                    placeholder="Напр: Екатеринбург, Толмачева 20"
                    suggestKey="partner-tour-address"
                    icon={<MapPin className="w-5 h-5" />}
                  />
                  <div className="flex flex-wrap items-center gap-2 ml-2">
                    <button
                      type="button"
                      onClick={() => void applyAddressGeocode(location)}
                      disabled={!location.trim() || geocodeLoading}
                      className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-blue-100 disabled:opacity-50 transition-all"
                    >
                      {geocodeLoading ? 'Поиск координат...' : 'Определить на карте'}
                    </button>
                    {hasTourCoords && (
                      <span className="text-[10px] font-bold text-gray-400 tabular-nums">
                        {tourLat.toFixed(5)}, {tourLng.toFixed(5)}
                      </span>
                    )}
                  </div>
                  {geocodeError && (
                    <p className="text-xs font-bold text-red-500 ml-2">{geocodeError}</p>
                  )}
                  <div className="h-56 rounded-2xl overflow-hidden border border-gray-100">
                    <PointMap
                      lat={tourLat}
                      lng={tourLng}
                      height="100%"
                      draggable
                      onCoordsChange={handleTourCoordsChange}
                      preset={hasTourCoords ? 'islands#blueIcon' : 'islands#grayIcon'}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold ml-2 uppercase tracking-widest">
                    Клик по карте или перетаскивание маркера задаёт точку сбора группы
                  </p>
                </div>

                {/* Working hours / presets */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Время отправления</label>
                  <input 
                    type="text"
                    placeholder="Напр: Каждую субботу в 12:00"
                    value={workingHours}
                    onChange={(e) => setWorkingHours(e.target.value)}
                    className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all"
                  />
                </div>

                {/* Custom list of dates */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Регулярность туров</label>
                  <input 
                    type="text"
                    placeholder="Напр: 22-25 Май, Сб-Вс"
                    value={dates}
                    onChange={(e) => setDates(e.target.value)}
                    className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all"
                  />
                </div>

                {/* Maximum slots */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Максимум туристов в группе</label>
                  <input 
                    type="number"
                    placeholder="15"
                    value={freeSlots}
                    onChange={(e) => setFreeSlots(e.target.value)}
                    className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all"
                  />
                </div>

                {/* Language */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Язык проведения</label>
                  <input 
                    type="text"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all"
                  />
                </div>

                {/* Contact phone */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Контактный телефон гида</label>
                  <input 
                    type="text"
                    placeholder="+7 (922) 111-22-33"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all"
                  />
                </div>

                {/* Contact site */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Официальный сайт</label>
                  <input 
                    type="text"
                    placeholder="ural-tours-guide.ru"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Descriptions */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">Краткое описание (в витрину)</label>
                <input 
                  type="text"
                  required
                  placeholder="Одно предложение с ключевой ценностью..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">Полное описание и программа экскурсии</label>
                <textarea 
                  rows={5}
                  placeholder="Распишите детальную концепцию, достопримечательности, что включено в стоимость (обед, музейный билет)..."
                  value={fullDescription}
                  onChange={(e) => setFullDescription(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-semibold focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all"
                />
              </div>

              {/* COVER IMAGE CHOICE */}
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">Обложка тура</label>
                
                {/* Image presets grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {PRESET_IMAGES.map((img) => (
                    <button
                      key={img.url}
                      type="button"
                      onClick={() => { setSelectedImage(img.url); setCustomImage(''); }}
                      className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all ${
                        selectedImage === img.url && customImage === '' ? 'border-blue-500 scale-95 shadow-md shadow-blue-500/10' : 'border-transparent opacity-80 hover:opacity-100'
                      }`}
                    >
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-end p-2">
                        <span className="text-[9px] font-bold text-white leading-tight truncate w-full text-left">{img.name}</span>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-[10px] font-bold text-gray-400">ИЛИ Своя ссылка на картинку:</div>
                  <input 
                    type="text"
                    placeholder="https://images.unsplash.com/..."
                    value={customImage}
                    onChange={(e) => { setCustomImage(e.target.value); setSelectedImage(''); }}
                    className="flex-1 px-4 py-2 bg-gray-50 hover:bg-white border border-gray-100 rounded-xl text-xs font-semibold outline-none transition-all"
                  />
                </div>
              </div>

              {/* ACTIONS */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-50">
                <button
                  type="button"
                  onClick={(e) => handleSaveTour(e, true)}
                  className="px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md shadow-purple-500/10"
                >
                  <Sparkles className="w-4 h-4" />
                  Опубликовать (Отправить на модерацию)
                </button>
                <button
                  type="submit"
                  className="px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Сохранить как черновик
                </button>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl text-xs font-black uppercase tracking-wider transition-all"
                >
                  Отмена
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RENDER ACTIVE TAB STATES */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25 }}
        >
          {/* TAB 1: OVERVIEW & SALES GRAPH */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              
              {/* STATS BENTO CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                
                {/* Stat 1: Total Tours */}
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                        <Compass className="w-5 h-5 animate-spin-slow" />
                      </div>
                      <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">Каталог</span>
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">Всего туров</p>
                    <p className="text-3xl font-black text-gray-900 font-mono">{tourReport.length} <span className="text-sm font-bold text-gray-400">шт</span></p>
                  </div>
                  <p className="text-[9px] font-semibold text-gray-400 mt-4">Количество ваших активных и созданных экскурсий</p>
                </div>

                {/* Stat 2: Total Views */}
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                        <Eye className="w-5 h-5" />
                      </div>
                      <span className="text-[9px] font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-100">Охват</span>
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">Всего просмотров</p>
                    <p className="text-3xl font-black text-gray-900 font-mono">
                      {tourReport.reduce((acc, t) => acc + t.views, 0).toLocaleString()} <span className="text-sm font-bold text-gray-400">раз</span>
                    </p>
                  </div>
                  <p className="text-[9px] font-semibold text-gray-400 mt-4">Суммарный интерес туристов к карточкам туров</p>
                </div>

                {/* Stat 3: Total Bookings */}
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                        <Calendar className="w-5 h-5" />
                      </div>
                      {stats.pendingBookings > 0 && (
                        <span className="text-[9px] font-black text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-lg border border-yellow-100">{stats.pendingBookings} новые</span>
                      )}
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">Всего броней</p>
                    <p className="text-3xl font-black text-gray-900 font-mono">
                      {tourReport.reduce((acc, t) => acc + t.bookingsCount, 0)} <span className="text-sm font-bold text-gray-400">шт</span>
                    </p>
                  </div>
                  <p className="text-[9px] font-semibold text-gray-400 mt-4">Общее число оформленных билетов и заявок</p>
                </div>

                {/* Stat 4: Excursions Average Rating */}
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-yellow-50 text-yellow-500 rounded-2xl">
                        <Star className="w-5 h-5 fill-current" />
                      </div>
                      <span className="text-[9px] font-black text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-lg border border-yellow-100">Рейтинг</span>
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">Рейтинг отзывов</p>
                    <p className="text-3xl font-black text-gray-900 font-mono">{stats.avgRating} <span className="text-sm font-bold text-gray-400">/ 5</span></p>
                  </div>
                  <p className="text-[9px] font-semibold text-gray-400 mt-4">Среднее арифметическое оценок ваших туров</p>
                </div>

                {/* Stat 5: Overall Revenue */}
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-between font-sans">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <span className="text-[9px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-lg border border-green-100">Выручка</span>
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">Суммарный доход</p>
                    <p className="text-3xl font-black text-gray-900 font-mono text-emerald-600">{stats.revenue.toLocaleString()} ₽</p>
                  </div>
                  <p className="text-[9px] font-semibold text-gray-400 mt-4">Рассчитано на основе подтвержденных оплаченных заявок</p>
                </div>
              </div>

              {/* TOUR ANALYTICS LIST SECTION */}
              <div id="tour-analytics-section" className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-5">
                  <div>
                    <h2 className="text-xl font-black text-gray-900">Индивидуальный отчёт по каждому созданному туру</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                      Детализированный анализ вовлеченности туристов и воронки продаж
                    </p>
                  </div>
                  
                  {/* Sorting dropdown */}
                  <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100 shrink-0">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 whitespace-nowrap">Сортировать по:</span>
                    <select
                      value={overviewSortBy}
                      onChange={(e) => setOverviewSortBy(e.target.value as any)}
                      className="bg-transparent border-none text-xs font-bold text-blue-600 focus:ring-0 outline-none cursor-pointer"
                    >
                      <option value="bookings">Бронированиям</option>
                      <option value="views">Просмотрам</option>
                      <option value="rating">Рейтингу</option>
                      <option value="date">Дате создания</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  {tourReport.map((t) => (
                    <div key={t.id} className="p-5 bg-gray-50/40 rounded-2xl border border-gray-100/70 hover:border-blue-100 hover:bg-blue-50/10 transition-all flex flex-col md:flex-row justify-between gap-5">
                      
                      {/* Tour title and creation date */}
                      <div className="flex gap-4 items-start md:w-1/3">
                        <div className="h-14 w-14 shrink-0 rounded-xl overflow-hidden border border-gray-100">
                          <img src={t.image} alt={t.title} className="h-full w-full object-cover" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-black text-gray-900 leading-tight line-clamp-2">{t.title}</h4>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
                              Создан: {new Date(t.createdAt).toLocaleDateString('ru-RU')}
                            </span>
                            {t.status === 'active' && (
                              <span className="text-[9px] font-black uppercase tracking-wider text-green-600 bg-green-50 px-2 py-0.5 rounded-md">Активен</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Main Metrics list */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
                        
                        {/* Views */}
                        <div className="space-y-1 text-center md:text-left">
                          <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 block">Просмотры</span>
                          <span className="text-base font-black text-gray-800 font-mono flex items-center justify-center md:justify-start gap-1">
                            <Eye className="w-3.5 h-3.5 text-gray-400" /> {t.views}
                          </span>
                        </div>

                        {/* Bookings */}
                        <div className="space-y-1 text-center md:text-left">
                          <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 block">Бронирования</span>
                          <span className="text-base font-black text-blue-600 font-mono flex items-center justify-center md:justify-start gap-1">
                            <Calendar className="w-3.5 h-3.5 text-blue-400" /> {t.bookingsCount}
                          </span>
                        </div>

                        {/* Rating & Reviews */}
                        <div className="space-y-1 text-center md:text-left">
                          <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 block">Рейтинг / Отзывы</span>
                          <div className="flex items-center justify-center md:justify-start gap-1 font-mono text-xs">
                            <span className="text-sm font-black text-yellow-600 flex items-center gap-0.5">
                              ★ {t.rating.toFixed(1)}
                            </span>
                            <span className="text-gray-300">•</span>
                            <span className="text-gray-500 font-bold">{t.reviewsCount} отзыв(ов)</span>
                          </div>
                        </div>

                        {/* Conversion */}
                        <div className="space-y-1 text-center md:text-right">
                          <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 block">Конверсия</span>
                          <span className="text-base font-black text-emerald-600 font-mono block">
                            {t.conversion.toFixed(1)}%
                          </span>
                        </div>

                      </div>

                      {/* Warnings / Failures (declines, if any) */}
                      <div className="flex items-center justify-center md:justify-end shrink-0 md:w-36 border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
                        {t.declinesCount > 0 ? (
                          <div className="px-3 py-1.5 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider">
                            <X className="w-3.5 h-3.5 stroke-[3px]" /> {t.declinesCount} отказ(ов)
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Отказов нет</span>
                        )}
                      </div>

                    </div>
                  ))}

                  {tourReport.length === 0 && (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                      <p className="text-sm font-bold text-gray-500">У вас пока нет созданных экскурсий в кабинете</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EXCURSIONS MANAGEMENT LIST */}
          {activeTab === 'tours' && (
            <div className="space-y-6">
              
              {/* Ближайшее расписание туров */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-6">
                <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/10">
                  <div>
                    <h2 className="text-lg font-black text-gray-900">Ближайшее расписание туров</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Запланированные даты проведения ваших экскурсий</p>
                  </div>
                  <Calendar className="w-5 h-5 text-blue-500" />
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {myTours.slice(0, 3).map((tour, index) => {
                      const colors = index === 0 
                        ? { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' } 
                        : index === 1 
                        ? { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100' } 
                        : { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100' };
                      return (
                        <div key={tour.id} className="flex gap-4 items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100/60 min-w-0">
                          <div className="flex gap-3 items-center min-w-0">
                            <div className={`p-3 ${colors.bg} ${colors.text} rounded-xl flex flex-col items-center justify-center font-mono min-w-[50px] shrink-0 border ${colors.border}`}>
                              <span className="text-[9px] font-black uppercase">Май</span>
                              <span className="text-sm font-black text-gray-800 leading-none">{23 + index * 2}</span>
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-black text-gray-900 text-sm truncate">{tour.title}</h4>
                              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-2 mt-1 truncate">
                                <span className="flex items-center gap-1 shrink-0"><Clock className="w-3 h-3 text-blue-500" /> {tour.duration || '3 часа'}</span>
                                <span className="truncate">• {tour.district}</span>
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="px-2 py-1 bg-yellow-50 text-yellow-700 text-[10px] font-black rounded-lg">
                              {tour.freeSlots || 15} мест
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {myTours.length === 0 && (
                      <div className="col-span-1 md:col-span-3 text-center text-gray-400 font-bold py-4">
                        У вас пока нет активных туров в расписании
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex-wrap gap-4">
                <div>
                  <h2 className="text-xl font-black text-gray-900">Каталог ваших экскурсий</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Создание, редактирование и статус публикации</p>
                </div>
                <button 
                  onClick={handleOpenCreate}
                  className="px-4 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-blue-100 flex items-center gap-2 transition-transform active:scale-95"
                >
                  <Plus className="w-4 h-4" /> Добавить экскурсию
                </button>
              </div>

              {/* TOURS LIST GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myTours.map((tour) => {
                  const isPending = tour.status === 'pending';
                  const isActive = tour.status === 'active' || !tour.status;
                  const isRejected = tour.status === 'rejected';
                  const isDraft = tour.status === 'draft';

                  return (
                    <div 
                      key={tour.id} 
                      className={`bg-white rounded-[2.5rem] border border-gray-100 p-6 flex flex-col justify-between shadow-sm transition-all hover:shadow-md relative overflow-hidden ${
                        isPending ? 'ring-2 ring-yellow-400/20' : ''
                      }`}
                    >
                      <div>
                        {/* Status absolute badge */}
                        <div className="flex justify-between items-start gap-3 mb-4">
                          <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg border ${
                            isActive ? 'bg-green-50 border-green-100 text-green-700' :
                            isPending ? 'bg-yellow-50 border-yellow-100 text-yellow-700' :
                            isRejected ? 'bg-red-50 border-red-100 text-red-700' :
                            'bg-gray-50 border-gray-100 text-gray-600'
                          }`}>
                            {isActive ? 'Опубликован (Актив)' : 
                             isPending ? 'На модерации' : 
                             isRejected ? 'Отклонен' : 'Черновик'}
                          </span>
                          <span className="text-xs font-black text-blue-600 font-mono">
                            {tour.price === 0 ? 'Бесплатно' : `${tour.price} ₽`}
                          </span>
                        </div>

                        {/* Image preview */}
                        <div className="aspect-video w-full rounded-2xl overflow-hidden mb-4 bg-gray-50 border border-gray-100">
                          <img src={tour.image} alt="" className="w-full h-full object-cover" />
                        </div>

                        <h3 className="text-base font-black text-gray-900 leading-snug line-clamp-1">{tour.title}</h3>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1.5 font-medium leading-relaxed">{tour.description}</p>

                        {/* Badges block */}
                        <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                          <div className="flex items-center gap-1.5 bg-gray-50 p-2 rounded-xl border border-gray-50">
                            <Clock className="w-3.5 h-3.5 text-blue-500" />
                            <span>{tour.duration || '3 часа'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 bg-gray-50 p-2 rounded-xl border border-gray-50 truncate">
                            <Users className="w-3.5 h-3.5 text-blue-500" />
                            <span>До {tour.freeSlots || 15} мест</span>
                          </div>
                        </div>
                      </div>

                      {/* CARD ACTIONS */}
                      <div className="border-t border-gray-50 mt-5 pt-4 space-y-2">
                        {/* Action Buttons */}
                        <div className="flex items-center justify-between gap-2">
                          <button
                            onClick={() => handleOpenEdit(tour)}
                            className="flex-1 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-colors"
                            title="Редактировать параметры тура"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Изменить
                          </button>
                          <button
                            onClick={() => handleDelete(tour.id)}
                            className="p-2.5 rounded-xl bg-red-50 hover:bg-red-500 hover:text-white text-red-500 transition-colors"
                            title="Удалить тур"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Admin Simulation helper to make it extremely easy to demonstrate active states */}
                        {isPending && (
                          <button
                            onClick={() => handleApproveInstantly(tour)}
                            className="w-full py-2 rounded-xl bg-green-50 hover:bg-green-600 text-green-700 hover:text-white border border-green-200 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all shadow-sm"
                          >
                            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                            Одобрить сразу (Демо-Админ)
                          </button>
                        )}

                        {isDraft && (
                          <button
                            onClick={() => handleSendToModeration(tour)}
                            className="w-full py-2 rounded-xl bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white border border-purple-200 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            Отправить на публикацию
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {myTours.length === 0 && (
                  <div className="col-span-full bg-white p-12 text-center rounded-[2.5rem] border border-gray-100 shadow-sm space-y-3">
                    <Compass className="w-16 h-16 text-gray-300 mx-auto" />
                    <h3 className="text-lg font-black text-gray-900">У вас пока нет туров</h3>
                    <p className="text-sm text-gray-500 max-w-sm mx-auto">Создайте свою первую индивидуальную или групповую экскурсию с помощью кнопки «Создать тур».</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: BOOKINGS APPLICATIONS RECEIVED */}
          {activeTab === 'bookings' && (
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-gray-900">Управление заявками</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Клиенты забронировавшие участие в ваших турах</p>
                </div>
                
                {/* Bookings filter tabs */}
                <div className="flex bg-gray-100 p-1 rounded-2xl shrink-0">
                  <button 
                    onClick={() => setBookingFilterStatus('all')}
                    className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${bookingFilterStatus === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Все ({myBookings.length})
                  </button>
                  <button 
                    onClick={() => setBookingFilterStatus('pending')}
                    className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${bookingFilterStatus === 'pending' ? 'bg-white text-yellow-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Ожидают ({myBookings.filter(b => b.status === 'pending').length})
                  </button>
                  <button 
                    onClick={() => setBookingFilterStatus('confirmed')}
                    className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${bookingFilterStatus === 'confirmed' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Принятые
                  </button>
                </div>
              </div>

              {/* TABLE CONTAINER FOR BOOKING HEADS */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-gray-50 bg-gray-50/50">
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Целевой тур и дата проведения</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Контактная карточка туриста</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Стоимость</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Статус решения</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Управление</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredBookings.map((booking) => {
                      const itemDetails = items.find(i => i.id === booking.itemId);
                      const displayPrice = itemDetails ? itemDetails.price : 2000;

                      return (
                        <tr key={booking.id} className="hover:bg-gray-50/30 transition-colors group">
                          
                          {/* Tour details */}
                          <td className="px-8 py-6">
                            <h4 className="font-black text-gray-900 mb-1.5">{booking.itemTitle}</h4>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider flex items-center gap-1 bg-blue-50/50 px-2 py-0.5 rounded border border-blue-100">
                                <Calendar className="w-3 h-3" /> {booking.date}
                              </span>
                              <span className="text-[9px] font-bold text-gray-400">ID: {booking.id}</span>
                            </div>
                          </td>

                          {/* Client Contacts details */}
                          <td className="px-8 py-6">
                            <p className="text-sm font-black text-gray-900 leading-tight mb-1">{booking.touristName}</p>
                            <div className="flex flex-col gap-1 text-[10px] font-bold text-gray-400">
                              <a href={`tel:${booking.touristPhone || '+79123456789'}`} className="flex items-center gap-1 hover:text-blue-500 transition-colors">
                                <Phone className="w-3 h-3" /> {booking.touristPhone || '+79123456789'}
                              </a>
                              <a href={`mailto:${booking.touristEmail || 'tourist@demo-ural.ru'}`} className="flex items-center gap-1 hover:text-blue-500 transition-colors">
                                <Mail className="w-3 h-3" /> {booking.touristEmail || 'tourist@demo-ural.ru'}
                              </a>
                            </div>
                          </td>

                          {/* Price */}
                          <td className="px-8 py-6">
                            <span className="font-mono text-xs font-black text-gray-700">{displayPrice.toLocaleString()} ₽</span>
                          </td>

                          {/* Status Badge */}
                          <td className="px-8 py-6">
                            <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${
                              booking.status === 'confirmed' ? 'bg-green-50 border-green-100 text-green-700' :
                              booking.status === 'pending' ? 'bg-yellow-50 border-yellow-100 text-yellow-700' :
                              'bg-red-50 border-red-100 text-red-700'
                            }`}>
                              {booking.status === 'confirmed' ? 'Подтвержден' : 
                               booking.status === 'pending' ? 'Ожидание' : 'Отклонено'}
                            </span>
                          </td>

                          {/* Action triggers */}
                          <td className="px-8 py-6">
                            <div className="flex items-center justify-end gap-2">
                              {booking.status === 'pending' ? (
                                <>
                                  <button 
                                    onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
                                    className="w-9 h-9 bg-green-50 border border-green-100 text-green-600 rounded-xl flex items-center justify-center hover:bg-green-600 hover:text-white transition-all shadow-sm"
                                    title="Подтвердить участие"
                                  >
                                    <Check className="w-4.5 h-4.5" />
                                  </button>
                                  <button 
                                    onClick={() => handleUpdateStatus(booking.id, 'declined')}
                                    className="w-9 h-9 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                    title="Отклонить заявку"
                                  >
                                    <X className="w-4.5 h-4.5" />
                                  </button>
                                </>
                              ) : (
                                <span className="text-[10px] text-gray-400 font-bold">Действия завершены</span>
                              )}
                              <button className="w-9 h-9 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-all">
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredBookings.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-8 py-16 text-center text-gray-400 font-bold">
                          Заявок данной категории не обнаружено
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

    </div>
  );
}
