import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
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
  setUserNotifications,
} from '../store/authSlice';
import {
  getPartnerBookingStatusClass,
  getPartnerBookingStatusLabel,
  isBookingDeclinedByPartner,
  isBookingDeclinedByTourist,
} from '../utils/bookingLabels';
import PartnerTourManageModal from '../components/PartnerTourManageModal';
import PartnerExcursionFormModal, { type PartnerTourFormValues } from '../components/PartnerExcursionFormModal';
import { mergePartnerNotifications } from '../utils/partnerNotifications';
import {
  formatWeekDaysLabel,
  generateDatesFromWeekDays,
  getExcursionAvailableDates,
  inferWeekDaysFromTour,
  parseISODate,
} from '../utils/excursionSchedule';
import { normalizeBookingDateIso } from '../utils/bookingDate';
import { MockItem } from '../data/mockData';
import { formatDistrictsLabel } from '../utils/excursionDistricts';
import { getPartnerRoleLabel } from '../utils/partnerRoleLabels';
import SupportFormSection, { type SupportFormValues } from '../components/SupportFormSection';
import FaqPanel from '../components/FaqPanel';
import { PARTNER_FAQ } from '../data/supportFaq';
import { PARTNER_SUPPORT_TYPES } from '../utils/supportReport';
import { submitUserComplaint } from '../utils/adminComplaints';
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
import ProfileHeaderCard from '../components/ProfileHeaderCard';
import { formatBirthDateRu, formatGender } from '../utils/profileDisplay';

const PRESET_IMAGES = [
  { url: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800", name: "Природа и Горы Урала" },
  { url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=800", name: "Реки и Озера" },
  { url: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=800", name: "Исторические улочки" },
  { url: "https://images.unsplash.com/photo-1527631746610-bca00a040d60?q=80&w=800", name: "Активный пеший тур" },
  { url: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800", name: "Культура и Музеи" },
  { url: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=800", name: "Гастрономия Урала" }
];

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
  const [isFaqOpen, setIsFaqOpen] = useState(false);

  // Support form state
  const routerLocation = useLocation();
  const navigate = useNavigate();

  const [supportForm, setSupportForm] = useState<SupportFormValues>({
    email: user?.email || '',
    type: 'appeal',
    message: '',
  });
  const [supportSuccess, setSupportSuccess] = useState(false);
  const [supportLoading, setSupportLoading] = useState(false);

  useEffect(() => {
    const state = routerLocation.state as {
      openSupport?: boolean;
      supportReport?: {
        itemId: string;
        itemTitle: string;
        type: SupportFormValues['type'];
        message: string;
      };
    } | null;
    if (state?.openSupport || state?.supportReport) {
      setIsSupportOpen(true);
      setIsFormOpen(false);
      if (state.supportReport) {
        setSupportForm((prev) => ({
          ...prev,
          type: state.supportReport!.type,
          message: state.supportReport!.message,
          relatedItemId: state.supportReport!.itemId,
          relatedItemTitle: state.supportReport!.itemTitle,
        }));
      }
      window.history.replaceState({}, document.title);
    }
  }, [routerLocation.state]);

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !supportForm.message.trim()) return;
    setSupportLoading(true);
    setTimeout(() => {
      submitUserComplaint({
        authorRole: 'partner',
        authorName: user.name,
        authorEmail: supportForm.email || user.email,
        type: supportForm.type,
        message: supportForm.message,
        relatedItemId: supportForm.relatedItemId,
        relatedItemTitle: supportForm.relatedItemTitle,
      });
      setSupportLoading(false);
      setSupportSuccess(true);
      setSupportForm((prev) => ({ ...prev, message: '' }));
      setTimeout(() => setSupportSuccess(false), 5000);
    }, 600);
  };

  // Tour management modes
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTour, setEditingTour] = useState<MockItem | null>(null);
  const [tourDetailModal, setTourDetailModal] = useState<{
    tour: MockItem;
    initialDateIso?: string | null;
  } | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [price, setPrice] = useState('2000');
  const [duration, setDuration] = useState('3 часа');
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>(['Центральный']);
  const [excursionStyles, setExcursionStyles] = useState<string[]>([]);
  const [excursionFeatures, setExcursionFeatures] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [tourLat, setTourLat] = useState(EKATERINBURG_CENTER[0]);
  const [tourLng, setTourLng] = useState(EKATERINBURG_CENTER[1]);
  const [hasTourCoords, setHasTourCoords] = useState(false);
  const { geocode, loading: geocodeLoading, error: geocodeError } = useGeocode();
  const [defaultStartTime, setDefaultStartTime] = useState('12:00');
  const [weekDays, setWeekDays] = useState<number[]>([6, 0]);
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
  const [profileBirthDate, setProfileBirthDate] = useState(user?.birthDate || '');
  const [profileGender, setProfileGender] = useState(user?.gender || '');
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

  useEffect(() => {
    if (!user?.id || user.role !== 'partner') return;
    const merged = mergePartnerNotifications(user.id, user.notifications ?? []);
    if (merged.length !== (user.notifications?.length ?? 0)) {
      dispatch(setUserNotifications(merged));
    }
  }, [user?.id, user?.role, dispatch]);

  const openTourDetail = (tour: MockItem, initialDateIso?: string | null) => {
    setTourDetailModal({ tour, initialDateIso });
    setIsFormOpen(false);
  };

  const resetCreateForm = () => {
    setTitle('');
    setDescription('');
    setFullDescription('');
    setPrice('2000');
    setDuration('3 часа');
    setSelectedDistricts(['Центральный']);
    setExcursionStyles([]);
    setExcursionFeatures([]);
    setLocation('');
    setTourLat(EKATERINBURG_CENTER[0]);
    setTourLng(EKATERINBURG_CENTER[1]);
    setHasTourCoords(false);
    setDefaultStartTime('12:00');
    setWeekDays([6, 0]);
    setFreeSlots('15');
    setLanguage('Русский');
    setPhone(user?.phone || '');
    setWebsite('');
    setSelectedImage(PRESET_IMAGES[0].url);
    setCustomImage('');
    setSelectedRouteId('');
  };

  const loadTourIntoForm = (tour: MockItem) => {
    setTitle(tour.title);
    setDescription(tour.description);
    setFullDescription(tour.fullDescription || tour.fullProgram || '');
    setPrice(tour.price.toString());
    setDuration(tour.duration || '3 часа');
    setSelectedDistricts(
      tour.districts?.length ? tour.districts : tour.district ? [tour.district] : ['Центральный'],
    );
    setExcursionStyles(tour.theme ?? []);
    setExcursionFeatures(tour.features ?? []);
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
    setDefaultStartTime(tour.defaultStartTime || '12:00');
    setWeekDays(inferWeekDaysFromTour(tour));
    setFreeSlots(tour.freeSlots ? tour.freeSlots.toString() : '15');
    setLanguage(tour.language || 'Русский');
    setPhone(tour.contacts?.phone || '');
    setWebsite(tour.contacts?.website || '');
    setSelectedImage(tour.image);
    setCustomImage('');
    setSelectedRouteId(tour.routeId || '');
  };

  // Bookings filter state
  const [bookingFilterStatus, setBookingFilterStatus] = useState<
    'all' | 'pending' | 'confirmed' | 'tourist_declined' | 'partner_declined'
  >('all');

  const [tourFilterTab, setTourFilterTab] = useState<'active' | 'archived' | 'draft'>('active');

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

  const filteredTours = useMemo(() => {
    switch (tourFilterTab) {
      case 'archived':
        return myTours.filter((t) => t.status === 'archived');
      case 'draft':
        return myTours.filter((t) => t.status === 'draft');
      default:
        return myTours.filter(
          (t) =>
            t.status === 'active' ||
            t.status === 'pending' ||
            t.status === 'revision' ||
            t.status === 'rejected' ||
            !t.status,
        );
    }
  }, [myTours, tourFilterTab]);

  const showDraftSaveInForm = !editingTour || editingTour.status === 'draft';

  // Bookings made for partner's tours, or assigned directly to user ID
  const myBookings = useMemo(() => {
    return bookings.filter(b => myTourIds.has(b.itemId) || b.partnerId === user?.id);
  }, [bookings, myTourIds, user?.id]);

  const filteredBookings = useMemo(() => {
    switch (bookingFilterStatus) {
      case 'pending':
        return myBookings.filter((b) => b.status === 'pending');
      case 'confirmed':
        return myBookings.filter((b) => b.status === 'confirmed');
      case 'tourist_declined':
        return myBookings.filter(isBookingDeclinedByTourist);
      case 'partner_declined':
        return myBookings.filter(isBookingDeclinedByPartner);
      default:
        return myBookings;
    }
  }, [myBookings, bookingFilterStatus]);

  const upcomingSchedule = useMemo(() => {
    const slots: { tour: MockItem; dateIso: string; count: number }[] = [];
    const scheduledTours = myTours.filter((t) => t.status === 'active' || !t.status);
    for (const tour of scheduledTours) {
      const dates = getExcursionAvailableDates(tour).slice(0, 2);
      for (const dateIso of dates) {
        const count = myBookings.filter((b) => {
          if (b.itemId !== tour.id) return false;
          if (b.status === 'declined') return false;
          return normalizeBookingDateIso(b.date) === dateIso;
        }).length;
        slots.push({ tour, dateIso, count });
        if (slots.length >= 6) break;
      }
      if (slots.length >= 6) break;
    }
    return slots.slice(0, 6);
  }, [myTours, myBookings]);

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
    dispatch(updateBookingStatus({ id, status, actor: 'partner' }));
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
    setTourDetailModal(null);
    setEditingTour(tour);
    loadTourIntoForm(tour);
    setIsFormOpen(true);
  };

  const handleOpenCreate = () => {
    setTourDetailModal(null);
    setEditingTour(null);
    resetCreateForm();
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
    if (selectedDistricts.length === 0) {
      alert('Выберите хотя бы один район проведения');
      return;
    }
    if (weekDays.length === 0) {
      alert('Выберите хотя бы один день недели для проведения экскурсии');
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

    const districtsList =
      selectedDistricts.length > 0 ? selectedDistricts : ['Центральный'];
    const districtLabel = districtsList.join(', ');

    const tourData: MockItem = {
      id: editingTour ? editingTour.id : 'tour-' + Math.random().toString(36).substr(2, 9),
      title: title.trim(),
      description: description.trim(),
      fullDescription: fullDescription.trim() || `${description.trim()} Увлекательный авторский тур по самым ярким локациям.`,
      fullProgram: fullDescription.trim(),
      category: 'excursions',
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
      district: districtLabel,
      districts: districtsList,
      location: location.trim() || `Екатеринбург, ${districtsList[0]} район`,
      defaultStartTime: defaultStartTime.trim() || '12:00',
      duration: duration.trim(),
      weekDays: [...weekDays],
      dates: [formatWeekDaysLabel(weekDays)],
      availableDates: generateDatesFromWeekDays(weekDays),
      freeSlots: Number(freeSlots) || 12,
      language: language,
      theme: excursionStyles.length > 0 ? excursionStyles : undefined,
      features: excursionFeatures.length > 0 ? excursionFeatures : undefined,
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
        closeExcursionForm();
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

    closeExcursionForm();
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

  const tourFormValues: PartnerTourFormValues = {
    title,
    description,
    fullDescription,
    price,
    duration,
    selectedDistricts,
    excursionStyles,
    excursionFeatures,
    location,
    tourLat,
    tourLng,
    hasTourCoords,
    defaultStartTime,
    weekDays,
    freeSlots,
    language,
    phone,
    website,
    selectedImage,
    customImage,
    selectedRouteId,
  };

  const patchTourForm = (patch: Partial<PartnerTourFormValues>) => {
    if (patch.title !== undefined) setTitle(patch.title);
    if (patch.description !== undefined) setDescription(patch.description);
    if (patch.fullDescription !== undefined) setFullDescription(patch.fullDescription);
    if (patch.price !== undefined) setPrice(patch.price);
    if (patch.duration !== undefined) setDuration(patch.duration);
    if (patch.selectedDistricts !== undefined) setSelectedDistricts(patch.selectedDistricts);
    if (patch.excursionStyles !== undefined) setExcursionStyles(patch.excursionStyles);
    if (patch.excursionFeatures !== undefined) setExcursionFeatures(patch.excursionFeatures);
    if (patch.location !== undefined) setLocation(patch.location);
    if (patch.tourLat !== undefined) setTourLat(patch.tourLat);
    if (patch.tourLng !== undefined) setTourLng(patch.tourLng);
    if (patch.hasTourCoords !== undefined) setHasTourCoords(patch.hasTourCoords);
    if (patch.defaultStartTime !== undefined) setDefaultStartTime(patch.defaultStartTime);
    if (patch.weekDays !== undefined) setWeekDays(patch.weekDays);
    if (patch.freeSlots !== undefined) setFreeSlots(patch.freeSlots);
    if (patch.language !== undefined) setLanguage(patch.language);
    if (patch.phone !== undefined) setPhone(patch.phone);
    if (patch.website !== undefined) setWebsite(patch.website);
    if (patch.selectedImage !== undefined) setSelectedImage(patch.selectedImage);
    if (patch.customImage !== undefined) setCustomImage(patch.customImage);
    if (patch.selectedRouteId !== undefined) setSelectedRouteId(patch.selectedRouteId);
  };

  const closeExcursionForm = () => {
    setIsFormOpen(false);
    setEditingTour(null);
  };

  // Save Settings handler
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(updateUser({
      name: profileName,
      email: profileEmail,
      phone: profilePhone,
      birthDate: profileBirthDate,
      gender: profileGender,
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

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">
                  Дата рождения
                </label>
                <input
                  type="date"
                  className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all"
                  value={profileBirthDate}
                  onChange={(e) => setProfileBirthDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">
                  Пол
                </label>
                <select
                  className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all"
                  value={profileGender}
                  onChange={(e) => setProfileGender(e.target.value)}
                >
                  <option value="">Не указан</option>
                  <option value="male">Мужской</option>
                  <option value="female">Женский</option>
                  <option value="other">Другой</option>
                </select>
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

  const openPartnerFaq = () => {
    setIsSupportOpen(false);
    setIsFaqOpen(true);
  };

  if (isFaqOpen) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 py-10 px-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Популярные вопросы</h1>
          <button
            type="button"
            onClick={() => setIsFaqOpen(false)}
            className="text-gray-500 hover:text-gray-700 flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Назад в кабинет
          </button>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <FaqPanel audience="partner" entries={PARTNER_FAQ} />
          <button
            type="button"
            onClick={() => {
              setIsFaqOpen(false);
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

        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <SupportFormSection
            typeOptions={PARTNER_SUPPORT_TYPES}
            form={supportForm}
            onChange={(patch) => setSupportForm((prev) => ({ ...prev, ...patch }))}
            onSubmit={handleSupportSubmit}
            onOpenFaq={openPartnerFaq}
            loading={supportLoading}
            success={supportSuccess}
            title="Поддержка партнёров"
            subtitle="Вопросы по турам, заявкам и работе платформы"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* HEADER SECTION */}
      <div className="max-w-3xl mx-auto w-full">
        <ProfileHeaderCard
          avatarUrl={user?.avatar}
          avatarAlt={profileName}
          title={profileName || user?.name || 'Партнёр'}
          subtitle={profileCompany || undefined}
          details={[
            { label: 'Email', value: profileEmail || user?.email || '—' },
            { label: 'Телефон', value: profilePhone || '—' },
            { label: 'Дата рождения', value: formatBirthDateRu(profileBirthDate) },
            { label: 'Пол', value: formatGender(profileGender) },
          ]}
          roleBadge={getPartnerRoleLabel(user?.partnerType)}
          actions={[
            {
              key: 'settings',
              label: 'Настройки',
              icon: <Settings className="h-4 w-4" />,
              onClick: () => {
                setIsSettingsOpen(true);
                setIsFormOpen(false);
              },
            },
            {
              key: 'support',
              label: 'Поддержка',
              icon: <HelpCircle className="h-4 w-4" />,
              onClick: () => {
                setIsSupportOpen(true);
                setIsFormOpen(false);
              },
            },
            ...(onLogout
              ? [
                  {
                    key: 'logout',
                    label: 'Выйти',
                    icon: <LogOut className="h-4 w-4" />,
                    onClick: onLogout,
                    variant: 'danger' as const,
                  },
                ]
              : []),
          ]}
        />
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
          Мои туры
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
                    {upcomingSchedule.map((slot, index) => {
                      const d = parseISODate(slot.dateIso);
                      const colors = index % 3 === 0
                        ? { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' }
                        : index % 3 === 1
                        ? { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100' }
                        : { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100' };
                      return (
                        <button
                          key={`${slot.tour.id}-${slot.dateIso}`}
                          type="button"
                          onClick={() => openTourDetail(slot.tour, slot.dateIso)}
                          className="flex gap-4 items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100/60 min-w-0 text-left w-full hover:border-blue-200 hover:bg-blue-50/20 transition-all cursor-pointer group"
                        >
                          <div className="flex gap-3 items-center min-w-0">
                            <div className={`p-3 ${colors.bg} ${colors.text} rounded-xl flex flex-col items-center justify-center font-mono min-w-[50px] shrink-0 border ${colors.border}`}>
                              <span className="text-[9px] font-black uppercase">
                                {d.toLocaleDateString('ru-RU', { month: 'short' })}
                              </span>
                              <span className="text-sm font-black text-gray-800 leading-none">{d.getDate()}</span>
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-black text-gray-900 text-sm truncate group-hover:text-blue-700">{slot.tour.title}</h4>
                              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-2 mt-1 truncate">
                                <span className="flex items-center gap-1 shrink-0"><Clock className="w-3 h-3 text-blue-500" /> {slot.tour.duration || '3 часа'}</span>
                                <span className="truncate">• {slot.count} записано</span>
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="px-2 py-1 bg-yellow-50 text-yellow-700 text-[10px] font-black rounded-lg">
                              {slot.count}/{slot.tour.freeSlots || 15}
                            </span>
                            <ChevronRight className="w-4 h-4 text-gray-300 ml-auto mt-1 group-hover:text-blue-500" />
                          </div>
                        </button>
                      );
                    })}
                    {upcomingSchedule.length === 0 && (
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

              <div className="flex flex-wrap bg-gray-100 p-1 rounded-2xl gap-0.5">
                <button
                  type="button"
                  onClick={() => setTourFilterTab('active')}
                  className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${tourFilterTab === 'active' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Активные
                </button>
                <button
                  type="button"
                  onClick={() => setTourFilterTab('archived')}
                  className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${tourFilterTab === 'archived' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Архив
                </button>
                <button
                  type="button"
                  onClick={() => setTourFilterTab('draft')}
                  className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${tourFilterTab === 'draft' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Черновик
                </button>
              </div>

              {/* TOURS LIST GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTours.map((tour) => {
                  const isPending = tour.status === 'pending';
                  const isRevision = tour.status === 'revision';
                  const isActive = tour.status === 'active' || (!tour.status && tour.status !== 'draft');
                  const isRejected = tour.status === 'rejected';
                  const isDraft = tour.status === 'draft';
                  const isArchived = tour.status === 'archived';

                  return (
                    <div 
                      key={tour.id} 
                      className={`bg-white rounded-[2.5rem] border border-gray-100 p-6 flex flex-col justify-between shadow-sm transition-all hover:shadow-md relative overflow-hidden ${
                        isPending ? 'ring-2 ring-yellow-400/20' : ''
                      }`}
                    >
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => openTourDetail(tour)}
                        onKeyDown={(e) => e.key === 'Enter' && openTourDetail(tour)}
                        className="cursor-pointer"
                      >
                        {/* Status absolute badge */}
                        <div className="flex justify-between items-start gap-3 mb-4">
                          <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg border ${
                            isActive ? 'bg-green-50 border-green-100 text-green-700' :
                            isPending ? 'bg-yellow-50 border-yellow-100 text-yellow-700' :
                            isRevision ? 'bg-amber-50 border-amber-100 text-amber-800' :
                            isRejected ? 'bg-red-50 border-red-100 text-red-700' :
                            isArchived ? 'bg-slate-50 border-slate-100 text-slate-600' :
                            'bg-gray-50 border-gray-100 text-gray-600'
                          }`}>
                            {isActive ? 'Опубликован (Актив)' : 
                             isPending ? 'На модерации' : 
                             isRevision ? 'На доработке' :
                             isRejected ? 'Отклонен' :
                             isArchived ? 'В архиве' : 'Черновик'}
                          </span>
                          <span className="text-xs font-black text-blue-600 font-mono">
                            {tour.price === 0 ? 'Бесплатно' : `${tour.price} ₽`}
                          </span>
                        </div>

                        {/* Image preview */}
                        <div className="aspect-video w-full rounded-2xl overflow-hidden mb-4 bg-gray-50 border border-gray-100">
                          <img src={tour.image} alt="" className="w-full h-full object-cover" />
                        </div>

                        <h3 className="text-base font-black text-gray-900 leading-snug line-clamp-1 pr-8">{tour.title}</h3>
                        <p className="text-[9px] font-bold text-purple-600 mt-1 truncate">
                          {formatDistrictsLabel(tour)}
                        </p>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1.5 font-medium leading-relaxed">{tour.description}</p>
                        {(isRevision || isRejected) && tour.moderationComment && (
                          <p className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-100 rounded-xl p-2 mt-2 line-clamp-3">
                            Модератор: {tour.moderationComment}
                          </p>
                        )}

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
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleOpenEdit(tour); }}
                            className="flex-1 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-colors"
                            title="Редактировать параметры тура"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Изменить
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); void handleDelete(tour.id); }}
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

                {filteredTours.length === 0 && (
                  <div className="col-span-full bg-white p-12 text-center rounded-[2.5rem] border border-gray-100 shadow-sm space-y-3">
                    <Compass className="w-16 h-16 text-gray-300 mx-auto" />
                    <h3 className="text-lg font-black text-gray-900">
                      {tourFilterTab === 'draft'
                        ? 'Черновиков пока нет'
                        : tourFilterTab === 'archived'
                        ? 'В архиве пока ничего нет'
                        : tourFilterTab === 'active'
                        ? 'Активных туров пока нет'
                        : 'У вас пока нет туров'}
                    </h3>
                    <p className="text-sm text-gray-500 max-w-sm mx-auto">
                      {tourFilterTab === 'draft'
                        ? 'Сохраните экскурсию как черновик при создании — она появится здесь.'
                        : tourFilterTab === 'active'
                        ? 'Создайте экскурсию и отправьте её на модерацию — после одобрения она появится здесь.'
                        : 'Переключите вкладку или создайте новую экскурсию.'}
                    </p>
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
                <div className="flex flex-wrap bg-gray-100 p-1 rounded-2xl gap-0.5 max-w-full">
                  <button 
                    type="button"
                    onClick={() => setBookingFilterStatus('all')}
                    className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${bookingFilterStatus === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Все ({myBookings.length})
                  </button>
                  <button 
                    type="button"
                    onClick={() => setBookingFilterStatus('pending')}
                    className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${bookingFilterStatus === 'pending' ? 'bg-white text-yellow-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Ожидают ({myBookings.filter((b) => b.status === 'pending').length})
                  </button>
                  <button 
                    type="button"
                    onClick={() => setBookingFilterStatus('confirmed')}
                    className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${bookingFilterStatus === 'confirmed' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Принятые ({myBookings.filter((b) => b.status === 'confirmed').length})
                  </button>
                  <button 
                    type="button"
                    onClick={() => setBookingFilterStatus('tourist_declined')}
                    className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${bookingFilterStatus === 'tourist_declined' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Отказы ({myBookings.filter(isBookingDeclinedByTourist).length})
                  </button>
                  <button 
                    type="button"
                    onClick={() => setBookingFilterStatus('partner_declined')}
                    className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${bookingFilterStatus === 'partner_declined' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Отклонены ({myBookings.filter(isBookingDeclinedByPartner).length})
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
                            <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${getPartnerBookingStatusClass(booking)}`}>
                              {getPartnerBookingStatusLabel(booking)}
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

      <PartnerExcursionFormModal
        open={isFormOpen}
        onClose={closeExcursionForm}
        editingTour={editingTour}
        values={tourFormValues}
        onChange={patchTourForm}
        onSaveDraft={(e) => void handleSaveTour(e, false)}
        onPublish={(e) => void handleSaveTour(e, true)}
        routes={routes}
        presetImages={PRESET_IMAGES}
        geocodeLoading={geocodeLoading}
        geocodeError={geocodeError}
        onApplyGeocode={(address) => void applyAddressGeocode(address)}
        onCoordsChange={handleTourCoordsChange}
        onOpenRoute={(routeId) => {
          closeExcursionForm();
          navigate(`/plans?tab=my-routes&id=${encodeURIComponent(routeId)}`);
        }}
        showDraftSave={showDraftSaveInForm}
      />

      {tourDetailModal && (
        <PartnerTourManageModal
          tour={tourDetailModal.tour}
          bookings={myBookings}
          initialDateIso={tourDetailModal.initialDateIso}
          onClose={() => setTourDetailModal(null)}
          onEdit={handleOpenEdit}
        />
      )}

    </div>
  );
}
