import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useFavoriteActions } from '../hooks/useFavoriteActions';
import CatalogItemDetailModal from '../components/CatalogItemDetailModal';
import ExpandableMap from '../components/ExpandableMap';
import ItemAddressLine from '../components/ItemAddressLine';
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
import { isMapCatalogItem } from '../data/catalogMap';
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
  const navigate = useNavigate();
  const location = useLocation();
  const { toggle: toggleFavoriteItem, isFavorite } = useFavoriteActions();
  const categories = [
    { id: 'all', name: 'Все объекты' },
    { id: 'places', name: 'Места' },
    { id: 'excursions', name: 'Экскурсии' },
    { id: 'restaurants', name: 'Рестораны' },
  ];

  const pageTitle = useMemo(() => {
    switch (activeCategory) {
      case 'places': return 'Места';
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

      const matchesFavorites = !showOnlyFavorites || isFavorite(item.id);
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
  }, [activeCategory, searchQuery, showOnlyFavorites, isFavorite, priceRangeType, priceRangeValue, minRating, sortBy, selectedDistricts, enrichedMockItems]);

  const handleToggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!user) {
      navigate('/auth', { state: { from: location } });
      return;
    }
    void toggleFavoriteItem(id);
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
            const isFav = isFavorite(item.id);

            // CATEGORY 1: Places (Достопримечательность)
            if (item.category === 'places') {
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
                      <h3 className="text-xl font-bold text-gray-900 mb-1 leading-tight group-hover:text-blue-600 transition-colors line-clamp-1">
                        {item.title}
                      </h3>
                      <ItemAddressLine item={item} className="mb-2" />
                      <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed min-h-[2.75rem] mb-2 font-medium">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="p-7 pt-0">
                    <div className="pt-4 border-t border-gray-100 mt-auto">
                      <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Посещение</span>
                      <span className="font-bold text-gray-900 text-sm">
                        {item.price === 0 ? 'Бесплатно' : `от ${item.price} ₽`}
                      </span>
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
                      <h3 className="text-xl font-bold text-gray-900 mb-1 leading-tight group-hover:text-blue-600 transition-colors line-clamp-1">
                        {item.title}
                      </h3>
                      <ItemAddressLine item={item} className="mb-2" />
                      <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed min-h-[2.75rem] mb-2 font-medium">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="p-7 pt-0">
                    <div className="pt-4 border-t border-gray-100 mt-auto">
                      <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Средний чек</span>
                      <span className="font-bold text-gray-900 text-sm">
                        ~ {item.averageCheck || item.price || 1500} ₽
                      </span>
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
                    <ItemAddressLine item={item} className="mb-2" />
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
                  <div className="pt-4 border-t border-gray-100 mt-auto">
                    <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5 font-sans">Стоимость</span>
                    <span className="font-bold text-gray-900 text-sm">
                      от {item.price} ₽
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <ExpandableMap
          height="70vh"
          roundedClassName="rounded-[3rem]"
          className="bg-gray-100 border-gray-200 shadow-inner"
          overlay={
            <div className="absolute top-8 left-8 z-10 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-gray-100 pointer-events-none">
              <p className="text-sm font-bold text-gray-900">
                Найдено на карте: <span className="text-blue-600">{filteredItems.length}</span>
              </p>
            </div>
          }
          renderMap={() => (
            <YMaps>
              <Map
                defaultState={{ center: [56.8389, 60.6057], zoom: 12 }}
                width="100%"
                height="100%"
                options={{
                  suppressMapOpenBlock: true,
                  yandexMapDisablePoiInteractivity: false,
                }}
              >
                {filteredItems.filter(isMapCatalogItem).map((item) => (
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
                    `,
                    }}
                    options={{
                      preset: item.category === 'places' ? 'islands#greenParkIcon' : 'islands#orangeFoodIcon',
                    }}
                    onClick={() => setSelectedItem(item)}
                  />
                ))}
              </Map>
            </YMaps>
          )}
        />
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


      <CatalogItemDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        catalogItems={enrichedMockItems}
        onSelectItem={setSelectedItem}
      />


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



