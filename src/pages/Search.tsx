import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { toggleFavorite, addBooking, addRoute } from '../store/authSlice';
import { 
  Search as SearchIcon, 
  MapPin, 
  Star, 
  X, 
  Heart, 
  Share2, 
  Info,
  CheckCircle2,
  SlidersHorizontal,
  ChevronDown,
  Calendar,
  List,
  Map as MapIcon,
  Clock,
  Compass,
  Utensils,
  ChevronRight,
  User,
  MessagesSquare,
  Sparkles,
  BookOpen,
  Navigation,
  Globe,
  Phone,
  Check,
  Award,
  DollarSign
} from 'lucide-react';
import { Category, MockItem } from '../data/mockData';
import { enrichItem } from '../data/enrichedItems';
import { motion, AnimatePresence } from 'motion/react';
import { YMaps, Map, Placemark } from '@pbe/react-yandex-maps';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') as Category | 'all';
  const favoritesParam = searchParams.get('favorites') === 'true';
  const qParam = searchParams.get('q') || '';
  
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>(categoryParam || 'all');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(favoritesParam);
  const [searchQuery, setSearchQuery] = useState(qParam);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  // Sync category from URL
  useEffect(() => {
    if (categoryParam) {
      setActiveCategory(categoryParam);
    }
  }, [categoryParam]);

  // Sync search from URL (Global search)
  useEffect(() => {
    if (qParam !== searchQuery) {
      setSearchQuery(qParam);
    }
  }, [qParam]);
  
  // Advanced filters state
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [priceRangeType, setPriceRangeType] = useState<'all' | 'free' | 'paid'>('all');
  const [priceRangeValue, setPriceRangeValue] = useState<[number, number]>([0, 10000]);
  const [minRating, setMinRating] = useState(0);
  const [isOpenNow, setIsOpenNow] = useState(false);
  const [suitableFor, setSuitableFor] = useState<string[]>([]);
  
  // Category specific filters
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]); // Places
  const [visitTime, setVisitTime] = useState<string[]>([]); // Places
  const [selectedTourTypes, setSelectedTourTypes] = useState<string[]>([]); // Excursions
  const [tourLanguages, setTourLanguages] = useState<string[]>([]); // Excursions
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]); // Restaurants
  const [avgCheck, setAvgCheck] = useState<string[]>([]); // Restaurants
  const [features, setFeatures] = useState<string[]>([]); // Restaurants

  const [selectedItem, setSelectedItem] = useState<MockItem | null>(null);
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'center' | 'price_asc'>('popular');
  const [isSortOpen, setIsSortOpen] = useState(false);

  const districts = ['Центральный', 'Октябрьский', 'Ленинский', 'Чкаловский', 'ВИЗ', 'Академический', 'Уралмаш'];
  const audiences = ['С детьми', 'Для пожилых', 'Для молодёжи', 'Универсально'];
  
  const sortOptions = [
    { id: 'popular', name: 'По популярности' },
    { id: 'rating', name: 'По рейтингу' },
    { id: 'center', name: 'Ближе к центру' },
    { id: 'price_asc', name: 'Сначала дешевые' },
  ];

  const sortLabel = useMemo(() => {
    return sortOptions.find(o => o.id === sortBy)?.name;
  }, [sortBy]);

  // City center for distance sorting
  const cityCenter = [56.8389, 60.6057];
  const getDistance = (lat: number, lng: number) => {
    return Math.sqrt(Math.pow(lat - cityCenter[0], 2) + Math.pow(lng - cityCenter[1], 2));
  };

  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Interactive detail views states
  const [activePhoto, setActivePhoto] = useState<string | null>(null);
  const [newReviewAuthor, setNewReviewAuthor] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewText, setNewReviewText] = useState('');
  const [customReviews, setCustomReviews] = useState<Record<string, { author: string; rating: number; text: string; date: string }[]>>({});

  useEffect(() => {
    if (selectedItem) {
      setActivePhoto(null);
      setNewReviewAuthor(user?.name || '');
      setNewReviewRating(5);
      setNewReviewText('');
    }
  }, [selectedItem, user]);

  const handleAddReview = (itemId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewText || !newReviewAuthor) return;
    
    const reviewObj = {
      author: newReviewAuthor,
      rating: newReviewRating,
      text: newReviewText,
      date: new Date().toLocaleDateString()
    };
    
    setCustomReviews(prev => {
      const current = prev[itemId] || [];
      return {
        ...prev,
        [itemId]: [reviewObj, ...current]
      };
    });
    
    setNewReviewText('');
    alert('Спасибо! Ваш отзыв был успешно отправлен и добавлен на страницу.');
  };

  const categories = [
    { id: 'all', name: 'Все объекты' },
    { id: 'places', name: 'Достопримечательности' },
    { id: 'excursions', name: 'Экскурсии' },
    { id: 'restaurants', name: 'Рестораны' },
  ];

  const pageTitle = useMemo(() => {
    switch (activeCategory) {
      case 'places': return 'Достопримечательности';
      case 'excursions': return 'Экспозиции и туры';
      case 'restaurants': return 'Рестораны и кафе';
      default: return 'Места и события';
    }
  }, [activeCategory]);

  const searchPlaceholder = useMemo(() => {
    switch (activeCategory) {
      case 'places': return 'Найти парк, музей или памятник...';
      case 'excursions': return 'Поиск туров и прогулок...';
      case 'restaurants': return 'Найти ресторан или кафе...';
      default: return 'Найти место, событие или город...';
    }
  }, [activeCategory]);

  const items = useSelector((state: RootState) => state.auth.items);

  const enrichedMockItems = useMemo(() => {
    // Only show active or unmoderated items to public tourists
    const publicItems = items.filter(item => !item.status || item.status === 'active');
    return publicItems.map(enrichItem);
  }, [items]);

  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return enrichedMockItems.filter(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5);
  }, [searchQuery, enrichedMockItems]);

  const filteredItems = useMemo(() => {
    const filtered = enrichedMockItems.filter(item => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      if (!matchesCategory) return false;

      const matchesSearch = !searchQuery || 
                            item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.description.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      const matchesFavorites = !showOnlyFavorites || (user?.favorites && user.favorites.includes(item.id));
      if (!matchesFavorites) return false;
      
      const priceMatches = priceRangeType === 'all' || 
                          (priceRangeType === 'free' && item.price === 0) || 
                          (priceRangeType === 'paid' && item.price > 0 && item.price >= priceRangeValue[0] && item.price <= priceRangeValue[1]);
      if (!priceMatches) return false;
      
      const matchesRating = item.rating >= minRating;
      if (!matchesRating) return false;

      // Simulated district check
      if (selectedDistricts.length > 0 && !selectedDistricts.some(d => (item.location && item.location.includes(d)) || item.district === d)) {
        return false;
      }

      // Category specific filters (simulated since mock data is generic)
      if (activeCategory === 'places' && selectedThemes.length > 0) {
        // In real app: if (!selectedThemes.includes(item.theme)) return false;
      }

      if (activeCategory === 'restaurants' && selectedCuisines.length > 0) {
        // In real app: if (!selectedCuisines.includes(item.cuisine)) return false;
      }

      return true;
    });

    // Apply sorting
    return [...filtered].sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'center') {
        return getDistance(a.lat, a.lng) - getDistance(b.lat, b.lng);
      }
      return b.rating * 0.5 - a.rating * 0.5; // popular mock
    });
  }, [activeCategory, searchQuery, showOnlyFavorites, user?.favorites, priceRangeType, priceRangeValue, minRating, sortBy, selectedDistricts]);

  const handleToggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    dispatch(toggleFavorite(id));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Page Title */}
      <div className="mb-10">
        <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight">{pageTitle}</h1>
      </div>

      {/* Main Search Bar (Russpass Style) */}
      <div className="bg-gray-50 p-2.5 rounded-[2.5rem] mb-12 shadow-sm border border-gray-100 flex flex-col md:flex-row items-stretch gap-2.5 relative z-30">
        <div className="flex-[3] bg-white rounded-[2rem] px-8 py-5 flex items-center gap-4 group focus-within:ring-2 focus-within:ring-blue-100 transition-all border border-gray-100/50 relative">
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => searchQuery.trim() && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="w-full outline-none text-gray-900 font-medium placeholder:text-gray-400 bg-transparent text-lg"
          />
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute left-0 right-0 top-full mt-2 bg-white border border-gray-100 rounded-[2rem] shadow-2xl z-50 overflow-hidden max-h-80 overflow-y-auto"
              >
                {suggestions.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => {
                      setSearchQuery(item.title);
                      setShowSuggestions(false);
                    }}
                    className="flex items-center gap-4 p-5 hover:bg-blue-50/50 cursor-pointer transition-colors border-b border-gray-50 last:border-0"
                  >
                    {item.image && (
                      <img src={item.image} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1 text-left">
                      <p className="text-sm font-black text-gray-900 truncate">{item.title}</p>
                      <p className="text-[10px] text-gray-400 font-extrabold uppercase mt-1">
                        {item.category === 'places' ? 'Место' : item.category === 'restaurants' ? 'Ресторан' : 'Экскурсия'}
                      </p>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <button className="bg-[#FFD700] hover:bg-[#FFC700] text-gray-900 px-16 py-5 rounded-[2rem] font-black text-lg transition-all active:scale-95 shadow-lg shadow-yellow-500/10">
          Найти
        </button>
      </div>

      {/* Categories & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2.5 px-7 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 hover:border-gray-300 transition-all shadow-sm"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Фильтры
          </button>

          <div className="relative">
            <button 
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="flex items-center gap-2.5 px-7 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 hover:border-gray-300 transition-all shadow-sm group"
            >
              <span className="text-gray-400 font-medium mr-1 tracking-tight">{sortLabel}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {isSortOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50"
                >
                  {sortOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => {
                        setSortBy(option.id as any);
                        setIsSortOpen(false);
                      }}
                      className={`w-full text-left px-5 py-3 text-sm font-bold transition-all ${
                        sortBy === option.id 
                          ? 'bg-blue-50 text-blue-600' 
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {option.name}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200 shadow-inner">
          <button 
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2.5 px-8 py-3 rounded-xl text-sm font-black transition-all ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <List className="w-4 h-4" />
            Списком
          </button>
          <button 
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-2.5 px-8 py-3 rounded-xl text-sm font-black transition-all ${viewMode === 'map' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <MapIcon className="w-4 h-4" />
            На карте
          </button>
        </div>
      </div>

      {/* Category Selection Tabs */}
      <div className="flex overflow-x-auto scrolbar-hide gap-3 mb-10 pb-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setActiveCategory(cat.id as any);
              const newParams = new URLSearchParams(searchParams);
              if (cat.id === 'all') {
                newParams.delete('category');
              } else {
                newParams.set('category', cat.id);
              }
              setSearchParams(newParams);
              setSearchQuery(''); // Clear local search on category switch for better UX
            }}
            className={`px-8 py-4 rounded-[2rem] font-bold text-sm transition-all whitespace-nowrap border-2 ${
              activeCategory === cat.id 
                ? 'border-blue-600 bg-blue-50 text-blue-600' 
                : 'border-transparent bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {viewMode === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredItems.map((item) => {
            const isFav = user?.favorites?.includes(item.id);

            // CATEGORY 1: Places (Достопримечательность)
            if (item.category === 'places' || item.category === 'routes') {
              return (
                <div 
                  key={item.id} 
                  onClick={() => setSelectedItem(item)}
                  className="group cursor-pointer bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img 
                        src={item.image} 
                        alt={item.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                        referrerPolicy="no-referrer"
                      />
                      
                      {/* Badges Overlay */}
                      <div className="absolute top-5 left-5 flex flex-col gap-2">
                        <div className="bg-[#008080] text-white px-3.5 py-1.5 rounded-xl text-xs font-black shadow-lg flex items-center gap-1.5">
                          <Star className="w-3.5 h-3.5 fill-current text-yellow-300" />
                          <span>{item.rating.toFixed(1)}</span>
                          <span className="text-gray-200 text-[10px] font-bold">({item.reviewsCount})</span>
                        </div>
                        {item.isOpenNow && (
                          <div className="bg-emerald-500 text-white px-3.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg">
                            Открыто сейчас
                          </div>
                        )}
                      </div>

                      <button 
                        onClick={(e) => handleToggleFavorite(e, item.id)}
                        className={`absolute top-5 right-5 p-3 rounded-full backdrop-blur-md transition-all z-10 ${
                          isFav 
                            ? 'bg-red-50 text-red-500 shadow-lg shadow-red-500/20' 
                            : 'bg-white/35 text-white hover:bg-white/60 hover:text-red-500 hover:scale-110'
                        }`}
                      >
                        <Heart className={`w-5 h-5 ${isFav ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    <div className="p-7 pb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">
                          Место • {item.district}
                        </span>
                        {item.theme && item.theme.slice(0, 1).map(t => (
                          <span key={t} className="bg-gray-50 text-gray-500 px-2 py-1 rounded-lg text-[9px] font-bold">
                            {t}
                          </span>
                        ))}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors line-clamp-1">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed h-11 mb-2 font-medium">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="p-7 pt-0">
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                      <div>
                        <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Посещение</span>
                        <span className="font-bold text-gray-900 text-sm">
                          {item.price === 0 ? 'Бесплатно' : `от ${item.price} ₽`}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => {
                            handleToggleFavorite(e, item.id);
                            if (!user) {
                              navigate('/auth');
                              return;
                            }
                            alert(isFav ? `Объект "${item.title}" удален из избранного` : `Объект "${item.title}" добавлен в избранное`);
                          }}
                          className={`px-3.5 py-2.5 rounded-xl border transition-all flex items-center justify-center ${
                            isFav 
                              ? 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100' 
                              : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100 hover:text-red-500'
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!user) {
                              navigate('/auth');
                              return;
                            }
                            // Add to route helper injection
                            dispatch(addRoute({
                              id: Math.random().toString(36).substr(2, 9),
                              title: `Маршрут: ${item.title}`,
                              startPoint: item.title,
                              endPoint: 'Финал',
                              waypoints: [item.title],
                              createdAt: new Date().toLocaleDateString()
                            }));
                            alert(`Объект "${item.title}" успешно добавлен в ваши маршруты! Вы можете просмотреть его в профиле.`);
                          }}
                          className="px-4 py-2.5 bg-gray-50 text-gray-700 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-black transition-all border border-gray-100 flex items-center gap-1.5"
                        >
                          <Compass className="w-3.5 h-3.5" />
                          В маршрут
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // CATEGORY 2: Restaurants & Cafes (Ресторан / Кафе)
            if (item.category === 'restaurants') {
              return (
                <div 
                  key={item.id} 
                  onClick={() => setSelectedItem(item)}
                  className="group cursor-pointer bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img 
                        src={item.image} 
                        alt={item.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                        referrerPolicy="no-referrer"
                      />
                      
                      {/* Badges Overlay */}
                      <div className="absolute top-5 left-5 flex flex-col gap-2">
                        <div className="bg-[#CB4154] text-white px-3.5 py-1.5 rounded-xl text-xs font-black shadow-lg flex items-center gap-1.5">
                          <Star className="w-3.5 h-3.5 fill-current text-yellow-300" />
                          <span>{item.rating.toFixed(1)}</span>
                          <span className="text-gray-200 text-[10px] font-bold">({item.reviewsCount})</span>
                        </div>
                        {item.isOpenNow && (
                          <div className="bg-emerald-500 text-white px-3.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg">
                            Открыто сейчас
                          </div>
                        )}
                      </div>

                      <button 
                        onClick={(e) => handleToggleFavorite(e, item.id)}
                        className={`absolute top-5 right-5 p-3 rounded-full backdrop-blur-md transition-all z-10 ${
                          isFav 
                            ? 'bg-red-50 text-red-500 shadow-lg shadow-red-500/20' 
                            : 'bg-white/35 text-white hover:bg-white/60 hover:text-red-500 hover:scale-110'
                        }`}
                      >
                        <Heart className={`w-5 h-5 ${isFav ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    <div className="p-7 pb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">
                          Ресторан • {item.district}
                        </span>
                        {item.cuisines && item.cuisines.slice(0, 1).map(c => (
                          <span key={c} className="bg-gray-50 text-gray-500 px-2 py-1 rounded-lg text-[9px] font-bold">
                            {c} кухня
                          </span>
                        ))}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors line-clamp-1">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed h-11 mb-2 font-medium">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="p-7 pt-0">
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                      <div>
                        <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Средний чек</span>
                        <span className="font-bold text-gray-900 text-sm">
                          ~ {item.averageCheck || item.price || 1500} ₽
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => {
                            handleToggleFavorite(e, item.id);
                            if (!user) {
                              navigate('/auth');
                              return;
                            }
                            alert(isFav ? `Ресторан "${item.title}" удален из избранного` : `Ресторан "${item.title}" добавлен в избранное!`);
                          }}
                          className={`px-3.5 py-2.5 rounded-xl text-xs font-black transition-all border flex items-center gap-1.5 ${
                            isFav 
                              ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' 
                              : 'bg-gray-50 border-gray-100 text-gray-700 hover:bg-gray-100 hover:text-red-300'
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                          {isFav ? 'В избранном' : 'В избранное'}
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!user) {
                              navigate('/auth');
                              return;
                            }
                            dispatch(addRoute({
                              id: Math.random().toString(36).substr(2, 9),
                              title: `Обед: ${item.title}`,
                              startPoint: item.title,
                              endPoint: 'Финал',
                              waypoints: [item.title],
                              createdAt: new Date().toLocaleDateString()
                            }));
                            alert(`Заведение "${item.title}" успешно добавлено в маршрут!`);
                          }}
                          className="px-3.5 py-2.5 bg-gray-50 hover:bg-orange-50 hover:text-orange-700 text-gray-700 rounded-xl text-xs font-black transition-all border border-gray-100 flex items-center gap-1.5"
                        >
                          <Compass className="w-3.5 h-3.5" />
                          В маршрут
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // CATEGORY 3: Tours & Excursions (Экскурсия / Тур)
            return (
              <div 
                key={item.id} 
                onClick={() => setSelectedItem(item)}
                className="group cursor-pointer bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img 
                      src={item.image} 
                      alt={item.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Badges Overlay */}
                    <div className="absolute top-5 left-5 flex flex-col gap-2">
                      <div className="bg-purple-600 text-white px-3.5 py-1.5 rounded-xl text-xs font-black shadow-lg flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 fill-current text-yellow-300" />
                        <span>{item.rating.toFixed(1)}</span>
                        <span className="text-gray-200 text-[10px] font-bold">({item.reviewsCount || 42})</span>
                      </div>
                      {item.freeSlots !== undefined && (
                        <div className="bg-orange-500 text-white px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg">
                          Свободно мест: {item.freeSlots}
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={(e) => handleToggleFavorite(e, item.id)}
                      className={`absolute top-5 right-5 p-3 rounded-full backdrop-blur-md transition-all z-10 ${
                        isFav 
                          ? 'bg-red-50 text-red-500 shadow-lg shadow-red-500/20' 
                          : 'bg-white/35 text-white hover:bg-white/60 hover:text-red-500 hover:scale-110'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${isFav ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <div className="p-7 pb-4">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="bg-purple-50 text-purple-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">
                        Экскурсия • {item.district}
                      </span>
                      <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-purple-500" />
                        {item.duration || '2 часа'}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1 leading-tight group-hover:text-purple-600 transition-colors line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-gray-400 font-bold mb-3">
                      Организатор: <span className="text-gray-600">{item.tourOperator || 'Екатеринбургское бюро'}</span>
                    </p>
                    
                    <div className="flex items-center gap-2 text-gray-600 text-xs font-bold bg-gray-50 p-2.5 rounded-2xl border border-gray-100">
                      <Calendar className="w-4 h-4 text-purple-600 shrink-0" />
                      <span className="truncate">{item.dates ? item.dates[0] : 'Ближайшие даты указаны в описании'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-7 pt-0">
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                    <div>
                      <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5 font-sans">Стоимость</span>
                      <span className="font-bold text-gray-900 text-sm">
                        от {item.price} ₽
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => {
                          handleToggleFavorite(e, item.id);
                          if (!user) {
                            navigate('/auth');
                            return;
                          }
                          alert(isFav ? `Экскурсия "${item.title}" удалена из избранного` : `Экскурсия "${item.title}" добавлена в избранное`);
                        }}
                        className={`px-3.5 py-2.5 rounded-xl border transition-all flex items-center justify-center ${
                          isFav 
                            ? 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100' 
                            : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100 hover:text-red-500'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItem(item);
                        }}
                        className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-blue-500/15"
                      >
                        Забронировать
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="h-[70vh] bg-gray-100 rounded-[3rem] overflow-hidden border border-gray-200 shadow-inner relative">
          <YMaps>
            <Map 
              defaultState={{ center: [56.8389, 60.6057], zoom: 12 }}
              width="100%"
              height="100%"
              options={{
                suppressMapOpenBlock: true,
                yandexMapDisablePoiInteractivity: false
              }}
            >
              {filteredItems.map(item => (
                <Placemark 
                  key={item.id}
                  geometry={[item.lat, item.lng]} 
                  properties={{
                    hintContent: item.title,
                    balloonContent: `
                      <div style="padding: 10px; width: 220px;">
                        <img src="${item.image}" style="width: 100%; border-radius: 12px; margin-bottom: 8px;" />
                        <h4 style="margin: 0 0 4px 0; font-weight: bold; font-family: sans-serif;">${item.title}</h4>
                        <p style="margin: 0; color: #666; font-size: 12px;">${item.location}</p>
                        <div style="margin-top: 5px; color: #008080; font-weight: bold;">${item.rating.toFixed(1)} ★</div>
                      </div>
                    `
                  }}
                  options={{
                    preset: item.category === 'places' ? 'islands#greenParkIcon' : 
                            item.category === 'excursions' ? 'islands#blueEducationIcon' : 
                            'islands#orangeFoodIcon'
                  }}
                  onClick={() => setSelectedItem(item)}
                />
              ))}
            </Map>
          </YMaps>
          
          {/* Map Overlay Stats */}
          <div className="absolute top-8 left-8 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-gray-100">
            <p className="text-sm font-bold text-gray-900">
              Найдено на карте: <span className="text-blue-600">{filteredItems.length}</span>
            </p>
          </div>
        </div>
      )}

      {filteredItems.length === 0 && (
        <div className="py-24 text-center">
          <div className="mb-8 inline-flex p-8 bg-gray-50 rounded-full text-gray-300">
            <SearchIcon className="w-16 h-16" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-3">Ничего не найдено</h2>
          <p className="text-gray-500 font-medium text-lg">Попробуйте изменить параметры поиска или фильтры</p>
          <button 
            onClick={() => {
              setSearchQuery('');
              setActiveCategory('all');
              setPriceRangeType('all');
              setMinRating(0);
            }}
            className="mt-10 px-10 py-5 bg-blue-600 text-white rounded-[2rem] font-bold shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
          >
            Сбросить все фильтры
          </button>
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              className="bg-white w-full max-w-6xl h-[92vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row relative"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedItem(null)}
                className="absolute top-6 right-6 z-30 p-3 bg-black/50 hover:bg-black/75 text-white rounded-2xl transition-all shadow-xl backdrop-blur-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* LEFT COLUMN: Media Gallery, switcher and interactive Map */}
              <div className="md:w-[42%] flex flex-col justify-between bg-slate-50 border-r border-gray-100 p-8 h-[380px] md:h-auto overflow-y-auto custom-scrollbar">
                <div className="space-y-6">
                  <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden shadow-md">
                    <img 
                      src={activePhoto || selectedItem.image} 
                      alt={selectedItem.title} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    <div className="absolute bottom-5 left-5 right-5 text-white">
                      <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg">
                        {selectedItem.category === 'places' ? 'Достопримечательность' : selectedItem.category === 'restaurants' ? 'Ресторан' : 'Экскурсия'}
                      </span>
                    </div>
                  </div>

                  {/* Thumbnails strip */}
                  {selectedItem.images && selectedItem.images.length > 0 && (
                    <div>
                      <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2.5">Галерея фото ({selectedItem.images.length})</span>
                      <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1">
                        {selectedItem.images.map((imgUrl, i) => (
                          <button
                            key={i}
                            onClick={() => setActivePhoto(imgUrl)}
                            className={`w-16 h-12 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                              (activePhoto || selectedItem.image) === imgUrl ? 'border-blue-600 scale-105' : 'border-transparent opacity-70 hover:opacity-100'
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
                    Геолокация объекта
                  </span>
                  <div className="h-44 bg-gray-200 rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm relative">
                    <YMaps>
                      <Map 
                        defaultState={{ center: [selectedItem.lat || 56.8389, selectedItem.lng || 60.6057], zoom: 14 }}
                        width="100%"
                        height="100%"
                        options={{
                          suppressMapOpenBlock: true,
                          yandexMapDisablePoiInteractivity: true
                        }}
                      >
                        <Placemark geometry={[selectedItem.lat || 56.8389, selectedItem.lng || 60.6057]} />
                      </Map>
                    </YMaps>
                  </div>
                  <p className="text-[11px] font-bold text-gray-500 mt-2 text-center truncate">{selectedItem.location || 'Урал, Екатеринбург'}</p>
                </div>
              </div>

              {/* RIGHT COLUMN: Specific Segmented Detailed Breakdown */}
              <div className="md:w-[58%] overflow-y-auto p-10 md:p-14 custom-scrollbar flex flex-col justify-between">
                <div>
                  {/* CATEGORY A: PLACES / ROUTES DETAILS */}
                  {(selectedItem.category === 'places' || selectedItem.category === 'routes') && (
                    <div className="space-y-8">
                      {/* Place Header */}
                      <div>
                        <div className="flex items-center gap-2.5 mb-2">
                          <span className="bg-emerald-50 text-emerald-700 font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-xl">
                            {selectedItem.district || 'Центральный район'}
                          </span>
                          <span className="bg-yellow-400 text-black font-black text-[10px] px-3 py-1 rounded-xl flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            {selectedItem.rating.toFixed(1)} ({selectedItem.reviewsCount || 23})
                          </span>
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-3">{selectedItem.title}</h2>
                        <p className="text-gray-500 font-semibold leading-relaxed text-base">{selectedItem.description}</p>
                      </div>

                      {/* Full description */}
                      <div className="bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">О локации</h3>
                        <p className="text-gray-700 text-sm leading-relaxed font-medium">
                          {selectedItem.fullDescription || `${selectedItem.title} — одно из самых известных знаковых пространств уральской столицы. Здесь можно ощутить историческую глубину Свердловска-Екатеринбурга, увидеть старинную индустриализацию и познакомиться с современной городской культурой.`}
                        </p>
                      </div>

                      {/* Quick specifications grid */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-emerald-50/20 p-5 rounded-3xl border border-emerald-50">
                          <span className="block text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Время посещения
                          </span>
                          <p className="font-bold text-gray-900 text-sm">{selectedItem.visitingTime || '30 - 60 минут'}</p>
                        </div>
                        <div className="bg-blue-50/20 p-5 rounded-3xl border border-blue-50">
                          <span className="block text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Часы работы
                          </span>
                          <p className="font-bold text-gray-900 text-sm">{selectedItem.workingHours || 'Круглосуточно'}</p>
                        </div>
                        <div className="bg-pink-50/20 p-5 rounded-3xl border border-pink-50 col-span-2">
                          <span className="block text-[9px] font-black text-pink-600 uppercase tracking-widest mb-1.5">Тематика и теги</span>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedItem.theme && selectedItem.theme.map(t => (
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
                          {enrichedMockItems
                            .filter(x => x.category === 'places' && x.id !== selectedItem.id)
                            .slice(0, 2)
                            .map(rec => (
                              <div 
                                key={rec.id}
                                onClick={() => setSelectedItem(rec)}
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
                  {selectedItem.category === 'restaurants' && (
                    <div className="space-y-8">
                      {/* Restaurant Header */}
                      <div>
                        <div className="flex items-center gap-2.5 mb-2">
                          <span className="bg-orange-50 text-orange-700 font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-xl">
                            Ресторан • {selectedItem.district || 'Центр'}
                          </span>
                          <span className="bg-red-50 text-red-600 font-black text-[10px] px-3 py-1 rounded-xl flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            {selectedItem.rating.toFixed(1)} ({selectedItem.reviewsCount || 18})
                          </span>
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2">{selectedItem.title}</h2>
                        <h4 className="text-gray-400 font-black text-xs uppercase tracking-wider mb-3">
                          Кухня: {selectedItem.cuisines?.join(', ')} • Средний чек: <span className="text-gray-900">~ {selectedItem.averageCheck || 1500} ₽</span>
                        </h4>
                        <p className="text-gray-500 font-semibold leading-relaxed text-base">{selectedItem.description}</p>
                      </div>

                      {/* Atmosphere description */}
                      <div className="bg-orange-50/15 p-6 rounded-[2.5rem] border border-orange-100/30">
                        <h3 className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1.5">Об атмосфере заведения</h3>
                        <p className="text-gray-700 text-sm leading-relaxed font-semibold">
                          {selectedItem.atmosphereDescription || 'Эксклюзивный уральский ресторан с авторским меню. Изысканная подача блюд из локальных фермерских продуктов высшего качества, авторские десерты и уютная обстановка оставят приятные воспоминания.'}
                        </p>
                      </div>

                      {/* Menu selection list */}
                      {selectedItem.popularDishes && selectedItem.popularDishes.length > 0 && (
                        <div>
                          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3.5 flex items-center gap-1.5">
                            <Utensils className="w-4 h-4 text-orange-500" /> Популярные блюда и цены
                          </h3>
                          <div className="space-y-2.5">
                            {selectedItem.popularDishes.map((dish, i) => (
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
                          {(selectedItem.features || ['Wi-Fi', 'Летняя веранда', 'Детское меню', 'Оплата картой']).map(feat => (
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
                          <a href={`tel:${selectedItem.contacts?.phone || '+7 (343) 123-45-67'}`} className="flex items-center gap-1.5 hover:text-blue-600">
                            <Phone className="w-3.5 h-3.5 text-orange-500" />
                            {selectedItem.contacts?.phone || '+7 (343) 123-45-67'}
                          </a>
                        </div>
                        <div>
                          <span className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Сайт</span>
                          <a href={`https://${selectedItem.contacts?.website || 'urltour.ru'}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-blue-600">
                            <Globe className="w-3.5 h-3.5 text-orange-500" />
                            {selectedItem.contacts?.website || 'ural-rest.ru'}
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CATEGORY C: EXCURSIONS DETAILS */}
                  {selectedItem.category === 'excursions' && (
                    <div className="space-y-8">
                      {/* Excursion Header */}
                      <div>
                        <div className="flex items-center gap-2.5 mb-2">
                          <span className="bg-purple-50 text-purple-700 font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-xl">
                            Экскурсия • {selectedItem.district || 'Екатеринбург'}
                          </span>
                          <span className="bg-yellow-400 text-black font-black text-[10px] px-3 py-1 rounded-xl flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            {selectedItem.rating.toFixed(1)} ({selectedItem.reviewsCount || 34})
                          </span>
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2">{selectedItem.title}</h2>
                        
                        <div className="flex items-center gap-3.5 text-xs font-bold text-gray-500 mb-4 bg-purple-50/20 p-3 rounded-2xl border border-purple-50">
                          <span className="flex items-center gap-1 text-purple-700">🕒 Длительность: {selectedItem.duration || '2 часа'}</span>
                          <span className="text-gray-300">|</span>
                          <span className="flex items-center gap-1 text-purple-700">🗣️ Язык: {selectedItem.language || 'Русский'}</span>
                          <span className="text-gray-300">|</span>
                          <span className="flex items-center gap-1 text-orange-600">👥 Свободно мест: {selectedItem.freeSlots || 8} из 12</span>
                        </div>
                      </div>

                      {/* Organiser widget */}
                      <div className="flex items-center justify-between border-2 border-slate-50 p-4 rounded-3xl bg-slate-50/50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center font-bold text-purple-700 text-sm">
                            {selectedItem.tourOperator?.slice(0, 2) || 'ГД'}
                          </div>
                          <div>
                            <span className="block text-[8px] font-black text-purple-500 uppercase">Организатор</span>
                            <h4 className="font-bold text-gray-900 text-sm">{selectedItem.tourOperator || 'Екатеринбург Тур Груп'}</h4>
                          </div>
                        </div>
                        <Link to="/support" className="text-xs font-black text-blue-600 hover:underline">Написать support</Link>
                      </div>

                      {/* Contacts info for excursions */}
                      <div className="border border-purple-100 rounded-3xl p-6 space-y-3 bg-purple-50/10">
                        <h3 className="text-[10px] font-black text-purple-600 uppercase tracking-widest flex items-center gap-2">
                          <Phone className="w-4 h-4 text-purple-500" />
                          Контакты для связи с организатором
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold text-gray-700">
                          <a href={`tel:${selectedItem.contacts?.phone || '+7 (922) 800-44-33'}`} className="flex items-center gap-2 hover:text-purple-600 transition-colors">
                            <Phone className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                            <span>Тел: {selectedItem.contacts?.phone || '+7 (922) 800-44-33'}</span>
                          </a>
                          <a href={`https://${selectedItem.contacts?.website || 'urltour.ru'}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-purple-600 transition-colors">
                            <Globe className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                            <span>Сайт: {selectedItem.contacts?.website || 'ural-operator.ru'}</span>
                          </a>
                        </div>
                      </div>

                      {/* Full description */}
                      <div className="bg-slate-50 p-6 rounded-[2rem] border border-gray-100">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Программа и концепция</h3>
                        <p className="text-gray-700 text-sm leading-relaxed font-medium">
                          {selectedItem.fullProgram || `Это детальная авторская экскурсия-приключение от сертифицированного гида. Мы в деталях пройдем по центральным городским улочкам, отгадаем вековые шифры зодчества, познакомимся с тайнами уральских купцов и золотой лихорадки на Урале.`}
                        </p>
                      </div>

                      {/* Itinerary points checklist */}
                      {selectedItem.itinerary && selectedItem.itinerary.length > 0 && (
                        <div>
                          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                            <Navigation className="w-4 h-4 text-purple-600" /> Маршрут экскурсии (ключевые точки)
                          </h3>
                          <div className="space-y-2 border-l-2 border-purple-200 pl-4 ml-2">
                            {selectedItem.itinerary.map((point, index) => (
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
                            {selectedItem.included ? selectedItem.included.map((x, i) => <li key={i}>✓ {x}</li>) : (
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
                            <li>⚠️ Возраст: {selectedItem.ageLimit || '6+'}</li>
                            <li>⚠️ Продолжительная ходьба</li>
                          </ul>
                        </section>
                      </div>

                      {/* Price / Dates widget */}
                      <div className="bg-purple-50/40 p-6 rounded-[2rem] border border-purple-100 flex justify-between items-center">
                        <div>
                          <span className="block text-[8px] font-black text-purple-700 uppercase tracking-widest mb-1">Ближайшее начало</span>
                          <span className="font-bold text-gray-900 text-xs">
                            🕒 {selectedItem.dates ? selectedItem.dates[0] : 'Завтра в 12:00'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="block text-[8px] font-black text-purple-700 uppercase tracking-widest mb-1">Осталось мест</span>
                          <span className="bg-purple-600 text-white text-[10px] font-black px-2.5 py-1 rounded-xl">
                            {selectedItem.freeSlots || 6} мест
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
                        Отзывы путешественников ({((selectedItem.reviews || []).length + (customReviews[selectedItem.id] || []).length)})
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">Оценки основаны на реальных впечатлениях туристов</p>
                    </div>

                    {/* Review Feed list */}
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {/* Enjected custom reviews entered inside this browser session! */}
                      {customReviews[selectedItem.id] && customReviews[selectedItem.id].map((rev, i) => (
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
                      {selectedItem.reviews && selectedItem.reviews.map((rev, i) => (
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

                      {(!selectedItem.reviews || selectedItem.reviews.length === 0) && (!customReviews[selectedItem.id] || customReviews[selectedItem.id].length === 0) && (
                        <p className="text-center py-6 text-xs font-bold text-gray-400">Пока нет отзывов. Станьте первым, кто оставит свое мнение!</p>
                      )}
                    </div>

                    {/* Create review interactive form */}
                    <form onSubmit={(e) => handleAddReview(selectedItem.id, e)} className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 space-y-4">
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
                {selectedItem.category === 'excursions' && (
                  <div className="mt-10 pt-8 border-t border-gray-100">
                    <button 
                      onClick={() => {
                        if (!user) {
                          navigate('/auth', { state: { from: location } });
                          return;
                        }
                        
                        const newBooking = {
                          id: Math.random().toString(36).substr(2, 9),
                          itemId: selectedItem.id,
                          itemTitle: selectedItem.title,
                          touristId: user.id,
                          touristName: user.name,
                          partnerId: selectedItem.partnerId || 'admin-id',
                          status: 'pending' as const,
                          date: new Date().toLocaleDateString(),
                          createdAt: new Date().toISOString()
                        };
                        
                        dispatch(addBooking(newBooking));
                        alert('Успешно! Ваша заявка отправлена партнеру. Вы можете отслеживать ее статус в Личном кабинете.');
                        setSelectedItem(null);
                      }}
                      className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs shadow-md shadow-blue-500/20 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
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

      {/* Mobile Filters Drawer Overlay */}
      <AnimatePresence>
        {isFilterOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-white overflow-y-auto px-6 py-12"
          >
            <div className="max-w-2xl mx-auto pb-20">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-4xl font-black">Фильтры</h2>
                <button onClick={() => setIsFilterOpen(false)} className="p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Left Column: Common Filters */}
                <div className="space-y-10">
                  <section>
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Район города</h3>
                    <div className="flex flex-wrap gap-2">
                      {districts.map(d => (
                        <button
                          key={d}
                          onClick={() => setSelectedDistricts(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])}
                          className={`px-4 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${selectedDistricts.includes(d) ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-50 bg-gray-50 text-gray-500'}`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Стоимость</h3>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {(['all', 'free', 'paid'] as const).map(p => (
                        <button
                          key={p}
                          onClick={() => setPriceRangeType(p)}
                          className={`py-3 rounded-xl text-xs font-bold border-2 transition-all ${priceRangeType === p ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-50 bg-gray-50 text-gray-500'}`}
                        >
                          {p === 'all' ? 'Все' : p === 'free' ? '0 ₽' : 'Платно'}
                        </button>
                      ))}
                    </div>
                    {priceRangeType === 'paid' && (
                      <div className="px-2">
                        <input 
                          type="range" 
                          min="0" 
                          max="10000" 
                          step="500"
                          value={priceRangeValue[1]}
                          onChange={(e) => setPriceRangeValue([0, parseInt(e.target.value)])}
                          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-400">
                          <span>0 ₽</span>
                          <span>до {priceRangeValue[1]} ₽</span>
                        </div>
                      </div>
                    )}
                  </section>

                  <section>
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Аудитория</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {audiences.map(a => (
                        <button
                          key={a}
                          onClick={() => setSuitableFor(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a])}
                          className={`px-4 py-3 rounded-xl text-xs font-bold border-2 transition-all ${suitableFor.includes(a) ? 'border-green-600 bg-green-50 text-green-600' : 'border-gray-50 bg-gray-50 text-gray-500'}`}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  </section>
                </div>

                {/* Right Column: Category Specifics */}
                <div className="space-y-10">
                  {activeCategory === 'places' && (
                    <>
                      <section>
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Тематика</h3>
                        <div className="flex flex-wrap gap-2">
                          {['История', 'Архитектура', 'Стрит-арт', 'Природа', 'Советское'].map(t => (
                            <button
                              key={t}
                              onClick={() => setSelectedThemes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}
                              className={`px-4 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${selectedThemes.includes(t) ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-50 bg-gray-50 text-gray-500'}`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </section>
                      <section>
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Время на посещение</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {['до 30 мин', '30-60 мин', '1-2 часа', 'более 2 ч'].map(t => (
                             <button
                                key={t}
                                onClick={() => setVisitTime(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}
                                className={`px-4 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${visitTime.includes(t) ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-50 bg-gray-50 text-gray-500'}`}
                             >
                               {t}
                             </button>
                          ))}
                        </div>
                      </section>
                    </>
                  )}

                  {activeCategory === 'excursions' && (
                    <>
                      <section>
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Тип экскурсии</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {['Пешеходная', 'Автобусная', 'Индивидуальная', 'Групповая'].map(t => (
                            <button
                              key={t}
                              onClick={() => setSelectedTourTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}
                              className={`px-4 py-3 rounded-xl text-xs font-bold border-2 transition-all ${selectedTourTypes.includes(t) ? 'border-purple-600 bg-purple-50 text-purple-600' : 'border-gray-50 bg-gray-50 text-gray-500'}`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </section>
                      <section>
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Язык</h3>
                        <div className="flex gap-2">
                          {['Русский', 'English'].map(l => (
                            <button
                              key={l}
                              onClick={() => setTourLanguages(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l])}
                              className={`flex-1 py-3 rounded-xl text-xs font-bold border-2 transition-all ${tourLanguages.includes(l) ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-50 bg-gray-50 text-gray-500'}`}
                            >
                              {l}
                            </button>
                          ))}
                        </div>
                      </section>
                    </>
                  )}

                  {activeCategory === 'restaurants' && (
                    <>
                      <section>
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Кухня</h3>
                        <div className="flex flex-wrap gap-2">
                          {['Русская', 'Европейская', 'Азиатская', 'Итальянская', 'Веган'].map(c => (
                            <button
                              key={c}
                              onClick={() => setSelectedCuisines(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])}
                              className={`px-4 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${selectedCuisines.includes(c) ? 'border-red-600 bg-red-50 text-red-600' : 'border-gray-50 bg-gray-50 text-gray-500'}`}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      </section>
                      <section>
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Особенности</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {['Wi-Fi', 'Веранда', 'Панорамный вид', 'Живая музыка'].map(f => (
                            <button
                              key={f}
                              onClick={() => setFeatures(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])}
                              className={`px-3 py-2.5 rounded-xl text-[10px] font-bold border-2 transition-all ${features.includes(f) ? 'border-yellow-600 bg-yellow-50 text-yellow-700' : 'border-gray-50 bg-gray-50 text-gray-500'}`}
                            >
                              {f}
                            </button>
                          ))}
                        </div>
                      </section>
                    </>
                  )}
                  
                  <section>
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Рейтинг</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {[3.5, 4.0, 4.5].map(r => (
                        <button
                          key={r}
                          onClick={() => setMinRating(prev => prev === r ? 0 : r)}
                          className={`py-3 rounded-xl text-xs font-bold border-2 transition-all ${minRating === r ? 'border-yellow-500 bg-yellow-50 text-yellow-700' : 'border-gray-50 bg-gray-50 text-gray-400'}`}
                        >
                          {r}+ ★
                        </button>
                      ))}
                    </div>
                  </section>
                </div>
              </div>

              <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-100 flex gap-4">
                <button 
                  onClick={() => {
                    setSelectedDistricts([]);
                    setPriceRangeType('all');
                    setMinRating(0);
                    setSuitableFor([]);
                    setSelectedThemes([]);
                    setSelectedTourTypes([]);
                    setSelectedCuisines([]);
                    setFeatures([]);
                  }}
                  className="px-8 py-5 text-gray-500 font-bold hover:text-gray-900 transition-all"
                >
                  Сбросить
                </button>
                <button 
                  onClick={() => setIsFilterOpen(false)}
                  className="flex-1 py-5 bg-blue-600 text-white rounded-[2rem] font-black text-lg shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
                >
                  Показать ({filteredItems.length})
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}



