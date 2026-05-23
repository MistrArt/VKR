import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Heart, 
  Map as MapIcon, 
  Route, 
  MapPin, 
  Footprints, 
  Bus, 
  Car, 
  ArrowLeft, 
  Home, 
  Flag, 
  CheckCircle2, 
  Circle, 
  Pencil, 
  Check, 
  X, 
  Loader2,
  Wand2,
  Settings2,
  Clock,
  Zap,
  GripVertical,
  Download,
  Share2,
  Trash2,
  Compass,
  Plus
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { addRoute, updateRouteTitle, deleteRoute, updateRouteWaypoints } from '../store/authSlice';
import { Category } from '../data/mockData';
import TourCard from '../components/TourCard';
import ExpandableMap from '../components/ExpandableMap';
import { YMaps, Map, Placemark, Polyline as YPolyline } from '@pbe/react-yandex-maps';
import { motion, Reorder, AnimatePresence } from 'motion/react';

const geocode = async (query: string): Promise<[number, number]> => {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=Екатеринбург, ${encodeURIComponent(query)}`);
    const data = await res.json();
    if (data && data.length > 0) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
  } catch (e) {
    console.error(e);
  }
  return [56.8389 + (Math.random() - 0.5) * 0.05, 60.6057 + (Math.random() - 0.5) * 0.05];
};

const fetchRoute = async (coords: [number, number][], mode: 'driving' | 'walking') => {
  if (coords.length < 2) return coords;
  const profile = mode === 'walking' ? 'foot' : 'driving';
  const coordString = coords.map(c => `${c[1]},${c[0]}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/${profile}/${coordString}?overview=full&geometries=geojson`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.routes && data.routes.length > 0) {
      return data.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
    }
  } catch (e) {
    console.error("Routing error", e);
  }
  return coords;
};

const URAL_ADDRESSES = [
  "проспект Ленина, д. 24А (Площадь 1905 года, Екатеринбург)",
  "улица Вайнера, д. 16 (Уральский Арбат, Екатеринбург)",
  "улица Малышева, д. 51 (Бизнес-центр Высоцкий, Екатеринбург)",
  "улица Бориса Ельцина, д. 3 (Ельцин Центр, Екатеринбург)",
  "улица Карла Либкнехта, д. 22 (Храм на Крови, Екатеринбург)",
  "проспект Ленина, д. 51 (Оперный театр, Екатеринбург)",
  "улица Горького, д. 4А (Плотинка, Екатеринбург)",
  "улица 8 Марта, д. 46 (ТЦ Гринвич, Екатеринбург)",
  "улица Куйбышева, д. 44 (Атриум Палас Отель, Екатеринбург)",
  "улица Челюскинцев, д. 29 (Железнодорожный вокзал, Екатеринбург)",
  "улица Хохрякова, д. 10 (Тенет Отель, Екатеринбург)",
  "улица Розы Люксембург, д. 4 (Отель Онегин, Екатеринбург)",
  "улица Красноармейская, д. 10 (Харитоновский сад, Екатеринбург)",
  "улица Кировградская, д. 11 (Парк Победы, Екатеринбург)",
  "улица Репина, д. 5 (Екатеринбург Арена, Екатеринбург)",
  "бульвар Экспо, д. 2 (Екатеринбург-Экспо, Екатеринбург)",
  "улица Белинского, д. 86 (Екатеринбург)",
  "Шарташские каменные палатки (улица Высоцкого, д. 11, Екатеринбург)",
  "улица Металлургов, д. 87 (ТЦ Мега, Екатеринбург)",
  "Аэропорт Кольцово (площадь Бахчиванджи, д. 1, Екатеринбург)",
  "улица Свердлова, д. 11 (Екатеринбург)",
  "улица Первомайская, д. 77 (Екатеринбург)"
];

export default function Plans() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as 'favorites' | 'constructor' | 'my-routes';
  const idParam = searchParams.get('id');
  
  const [activeTab, setActiveTab] = useState<'favorites' | 'constructor' | 'my-routes'>(tabParam || 'favorites');
  const user = useSelector((state: RootState) => state.auth.user);
  const catalogItems = useSelector((state: RootState) => state.auth.items);
  const dispatch = useDispatch();

  useEffect(() => {
    if (tabParam && ['favorites', 'constructor', 'my-routes'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tabId: 'favorites' | 'constructor' | 'my-routes') => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  const favoriteItems = catalogItems.filter((item) => user?.favorites?.includes(item.id));
  const favoritePlaces = favoriteItems.filter(
    (item) => item.category === 'places' || item.category === 'restaurants',
  );
  const favoriteExcursions = favoriteItems.filter((item) => item.category === 'excursions');
  const myRoutes = useSelector((state: RootState) => state.auth.routes) || [];

  // Constructor state
  const [startPoint, setStartPoint] = useState('');
  const [endPoint, setEndPoint] = useState('');
  const [startSuggestions, setStartSuggestions] = useState<string[]>([]);
  const [endSuggestions, setEndSuggestions] = useState<string[]>([]);
  const [showStartSugs, setShowStartSugs] = useState(false);
  const [showEndSugs, setShowEndSugs] = useState(false);

  const handleStartChange = (val: string) => {
    setStartPoint(val);
    if (val.trim()) {
      const filtered = URAL_ADDRESSES.filter(addr => 
        addr.toLowerCase().includes(val.toLowerCase())
      ).slice(0, 5);
      setStartSuggestions(filtered);
      setShowStartSugs(true);
    } else {
      setStartSuggestions([]);
      setShowStartSugs(false);
    }
  };

  const handleEndChange = (val: string) => {
    setEndPoint(val);
    if (val.trim()) {
      const filtered = URAL_ADDRESSES.filter(addr => 
        addr.toLowerCase().includes(val.toLowerCase())
      ).slice(0, 5);
      setEndSuggestions(filtered);
      setShowEndSugs(true);
    } else {
      setEndSuggestions([]);
      setShowEndSugs(false);
    }
  };

  const [selectedWaypoints, setSelectedWaypoints] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [constructorMode, setConstructorMode] = useState<'manual' | 'auto'>('manual');
  
  // Auto mode preferences
  const [prefs, setPrefs] = useState({
    days: 1,
    themes: [] as string[],
    activity: 'medium' as 'low' | 'medium' | 'high',
    time: 'full' as 'morning' | 'evening' | 'full'
  });

  // Route Details state
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(idParam || null);
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState('');
  const [transportMode, setTransportMode] = useState<'driving' | 'walking'>('driving');
  const [routePath, setRoutePath] = useState<[number, number][]>([]);
  const [isRouteLoading, setIsRouteLoading] = useState(false);

  const tabs = [
    { id: 'favorites', name: 'Избранное', icon: Heart },
    { id: 'constructor', name: 'Конструктор', icon: MapIcon },
    { id: 'my-routes', name: 'Мои маршруты', icon: Route },
  ] as const;

  const toggleWaypoint = (id: string) => {
    setSelectedWaypoints(prev => 
      prev.includes(id) ? prev.filter(wp => wp !== id) : [...prev, id]
    );
  };

  const handleCreateRoute = async () => {
    if (!startPoint || !endPoint || (constructorMode === 'manual' && selectedWaypoints.length === 0)) return;
    
    setIsGenerating(true);
    let finalWaypoints = [...selectedWaypoints];

    if (constructorMode === 'auto') {
      // Logic for automatic generation based on preferences
      const filtered = catalogItems.filter(item => {
        const matchesTheme = prefs.themes.length === 0 || prefs.themes.some(t => item.description.toLowerCase().includes(t.toLowerCase()));
        return matchesTheme;
      });
      // Pick 3-5 random items from filtered
      finalWaypoints = filtered
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.min(filtered.length, 5))
        .map(i => i.id);
    }

    const startCoords = await geocode(startPoint);
    const endCoords = await geocode(endPoint);

    const newRoute = {
      id: Date.now().toString(),
      title: `Маршрут от ${startPoint}`,
      startPoint,
      endPoint,
      startCoords,
      endCoords,
      waypoints: finalWaypoints,
      createdAt: new Date().toISOString(),
    };

    dispatch(addRoute(newRoute));
    
    // Reset form and switch tab
    setStartPoint('');
    setEndPoint('');
    setSelectedWaypoints([]);
    setIsGenerating(false);
    setActiveTab('my-routes');
  };

  const handleOptimizeRoute = async (routeId: string) => {
    const route = myRoutes.find(r => r.id === routeId);
    if (!route) return;

    setIsRouteLoading(true);
    
    const start = route.startCoords || [56.8389, 60.6057];
    const waypoints = route.waypoints.map(id => {
      const item = catalogItems.find(i => i.id === id);
      return item ? { id, lat: item.lat, lng: item.lng } : null;
    }).filter(Boolean) as { id: string, lat: number, lng: number }[];

    // Simple Greedy TSP
    const optimized: string[] = [];
    let currentPos = start;
    const remaining = [...waypoints];

    while (remaining.length > 0) {
      let closestIdx = 0;
      let minDocs = Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const d = Math.sqrt(Math.pow(remaining[i].lat - currentPos[0], 2) + Math.pow(remaining[i].lng - currentPos[1], 2));
        if (d < minDocs) {
          minDocs = d;
          closestIdx = i;
        }
      }

      const best = remaining.splice(closestIdx, 1)[0];
      optimized.push(best.id);
      currentPos = [best.lat, best.lng];
    }

    dispatch(updateRouteWaypoints({ id: routeId, waypoints: optimized }));
    setIsRouteLoading(false);
  };

  const handleExportRoute = (route: any) => {
    const data = JSON.stringify(route, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${route.title}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getTransportOptions = (index: number) => {
    const walkTime = 10 + (index * 5) % 20;
    const busTime = Math.max(3, walkTime - 10);
    const taxiTime = Math.max(2, busTime - 2);
    const busNumbers = ['№48', '№054', '№28', '№50', '№012', '№57', '№81'];
    const busNum = busNumbers[index % busNumbers.length];
    
    return [
      { icon: Footprints, time: `${walkTime} мин`, label: 'Пешком' },
      { icon: Bus, time: `${busTime} мин`, label: `Автобус ${busNum}` },
      { icon: Car, time: `${taxiTime} мин`, label: 'Такси' },
    ];
  };

  // Effect to load real route path
  useEffect(() => {
    if (activeTab === 'my-routes' && selectedRouteId) {
      const route = myRoutes.find(r => r.id === selectedRouteId);
      if (route) {
        const loadRoute = async () => {
          setIsRouteLoading(true);
          const waypointsCoords = route.waypoints.map(wpId => {
            const item = catalogItems.find(i => i.id === wpId);
            return item ? [item.lat, item.lng] as [number, number] : null;
          }).filter(Boolean) as [number, number][];

          const allCoords = [
            route.startCoords || [56.8389, 60.6057],
            ...waypointsCoords,
            route.endCoords || [56.8389, 60.6057]
          ];

          const path = await fetchRoute(allCoords, transportMode);
          setRoutePath(path);
          setIsRouteLoading(false);
        };
        loadRoute();
      }
    }
  }, [selectedRouteId, transportMode, activeTab, myRoutes]);

  const getPageIdentity = () => {
    switch (activeTab) {
      case 'favorites': return { title: 'Избранное', subtitle: 'Ваши сохраненные места и экскурсии' };
      case 'constructor': return { title: 'Конструктор маршрутов', subtitle: 'Создайте идеальный план путешествия' };
      case 'my-routes': return { title: 'Мои маршруты', subtitle: 'Ваши спланированные приключения' };
      default: return { title: 'Планы', subtitle: 'Управляйте своим путешествием' };
    }
  };

  const identity = getPageIdentity();

  // Render Route Details
  if (activeTab === 'my-routes' && selectedRouteId) {
    const route = myRoutes.find(r => r.id === selectedRouteId);
    if (!route) return null;

    const handleSaveTitle = () => {
      if (editTitleValue.trim()) {
        dispatch(updateRouteTitle({ id: route.id, title: editTitleValue.trim() }));
      }
      setEditingRouteId(null);
    };

    const waypointsCoords = route.waypoints.map(wpId => {
      const item = catalogItems.find(i => i.id === wpId);
      return item ? [item.lat, item.lng] as [number, number] : null;
    }).filter(Boolean) as [number, number][];

    const allCoords = [
      route.startCoords || [56.8389, 60.6057],
      ...waypointsCoords,
      route.endCoords || [56.8389, 60.6057]
    ];

    const mapCenter = allCoords[0];

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSelectedRouteId(null)}
              className="p-3 bg-white hover:bg-gray-50 border border-gray-100 rounded-2xl shadow-sm transition-all flex-shrink-0"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            
            {editingRouteId === route.id ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={editTitleValue}
                  onChange={(e) => setEditTitleValue(e.target.value)}
                  className="px-4 py-2 bg-white border-2 border-blue-500 rounded-xl focus:outline-none w-full max-w-md text-xl font-black"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                />
                <button onClick={handleSaveTitle} className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"><Check className="w-5 h-5"/></button>
                <button onClick={() => setEditingRouteId(null)} className="p-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"><X className="w-5 h-5"/></button>
              </div>
            ) : (
              <div className="flex items-center gap-3 flex-1">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">{route.title}</h1>
                <button
                  onClick={() => {
                    setEditTitleValue(route.title);
                    setEditingRouteId(route.id);
                  }}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                  title="Редактировать название"
                >
                  <Pencil className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => handleOptimizeRoute(route.id)}
              className="px-4 py-2.5 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-blue-100 transition-all"
            >
              <Zap className="w-4 h-4" /> Оптимизировать
            </button>
            <button 
              onClick={() => handleExportRoute(route)}
              className="p-2.5 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-all"
              title="Экспорт"
            >
              <Download className="w-5 h-5" />
            </button>
            <button 
              className="p-2.5 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-all"
              title="Поделиться"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Timeline with Reorder */}
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 relative">
              <div className="absolute left-12 top-24 bottom-24 w-0.5 bg-blue-100"></div>
              
              <div className="space-y-8 relative">
                {/* Start Point */}
                <div className="relative pl-16">
                  <div className="absolute left-0 top-0 bg-blue-600 p-3 rounded-2xl shadow-xl shadow-blue-500/20 ring-4 ring-white z-10">
                    <Home className="w-6 h-6 text-white" />
                  </div>
                  <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                    <span className="text-[10px] uppercase font-black text-blue-600 tracking-widest mb-2 block">Точка отправления</span>
                    <h4 className="font-black text-gray-900 text-xl">{route.startPoint}</h4>
                  </div>
                </div>

                {/* Waypoints - Reorderable */}
                <Reorder.Group axis="y" values={route.waypoints} onReorder={(newOrder) => dispatch(updateRouteWaypoints({ id: route.id, waypoints: newOrder }))} className="space-y-6">
                  {route.waypoints.map((wpId, index) => {
                    const item = catalogItems.find(i => i.id === wpId);
                    const transport = getTransportOptions(index);
                    
                    return (
                      <Reorder.Item key={wpId} value={wpId} className="relative pl-16">
                         <div className="absolute left-0 top-0 bg-blue-500 p-3 rounded-2xl shadow-lg ring-4 ring-white z-10 group cursor-grab active:cursor-grabbing">
                          <MapPin className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                        </div>
                        
                        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-transparent transition-all flex gap-4 items-center group">
                          <div className="p-2 text-gray-300 group-hover:text-gray-400">
                            <GripVertical className="w-5 h-5" />
                          </div>
                          {item?.image && <img src={item.image} alt={item.title} className="w-20 h-20 rounded-2xl object-cover" />}
                          <div className="flex-1">
                            <h4 className="font-black text-gray-900 text-lg group-hover:text-blue-600 transition-colors">{item?.title}</h4>
                            <p className="text-sm text-gray-500 font-medium line-clamp-1">{item?.description}</p>
                          </div>
                          <button 
                            onClick={() => {
                              const newWaypoints = route.waypoints.filter(id => id !== wpId);
                              dispatch(updateRouteWaypoints({ id: route.id, waypoints: newWaypoints }));
                            }}
                            className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </Reorder.Item>
                    );
                  })}
                </Reorder.Group>

                {/* End Point */}
                <div className="relative pl-16">
                  <div className="absolute left-0 top-0 bg-green-600 p-3 rounded-2xl shadow-xl shadow-green-500/20 ring-4 ring-white z-10">
                    <Flag className="w-6 h-6 text-white" />
                  </div>
                  <div className="bg-green-50 p-6 rounded-3xl border border-green-100">
                    <span className="text-[10px] uppercase font-black text-green-600 tracking-widest mb-2 block">Конечная точка</span>
                    <h4 className="font-black text-gray-900 text-xl">{route.endPoint}</h4>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-gray-100 flex items-center justify-between">
              <div className="flex bg-gray-50 p-1 rounded-2xl">
                <button 
                  onClick={() => setTransportMode('driving')} 
                  className={`px-6 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold transition-all ${transportMode === 'driving' ? 'bg-white text-blue-600 shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Car className="w-4 h-4" /> Авто
                </button>
                <button 
                  onClick={() => setTransportMode('walking')} 
                  className={`px-6 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold transition-all ${transportMode === 'walking' ? 'bg-white text-blue-600 shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Footprints className="w-4 h-4" /> Пешком
                </button>
              </div>
              <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-4 py-2.5 rounded-xl font-bold text-sm">
                <Clock className="w-4 h-4" /> ~1.5 часа
              </div>
            </div>

            <ExpandableMap
              height="600px"
              roundedClassName="rounded-[2.5rem]"
              className="bg-white p-2 shadow-2xl border-gray-100"
              overlay={
                isRouteLoading ? (
                  <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-sm flex items-center justify-center rounded-xl pointer-events-none">
                    <div className="flex flex-col items-center gap-2 text-blue-600">
                      <Loader2 className="w-8 h-8 animate-spin" />
                      <span className="font-medium">Построение маршрута...</span>
                    </div>
                  </div>
                ) : undefined
              }
              renderMap={() => (
                <YMaps query={{ lang: 'ru_RU' }}>
                  <Map
                    state={{ center: mapCenter as [number, number], zoom: 13 }}
                    width="100%"
                    height="100%"
                    className="w-full h-full rounded-xl z-0 overflow-hidden"
                  >
                    {route.startCoords && (
                      <Placemark
                        geometry={route.startCoords}
                        properties={{ balloonContent: `Старт: ${route.startPoint}` }}
                        options={{ preset: 'islands#blueDotIcon' }}
                      />
                    )}

                    {route.waypoints.map((wpId, idx) => {
                      const wpItem = catalogItems.find((i) => i.id === wpId);
                      if (!wpItem) return null;
                      return (
                        <Placemark
                          key={wpId}
                          geometry={[wpItem.lat, wpItem.lng]}
                          properties={{ balloonContent: `${idx + 1}. ${wpItem.title}` }}
                          options={{ preset: 'islands#blueIcon' }}
                        />
                      );
                    })}

                    {route.endCoords && (
                      <Placemark
                        geometry={route.endCoords}
                        properties={{ balloonContent: `Финиш: ${route.endPoint}` }}
                        options={{ preset: 'islands#greenDotIcon' }}
                      />
                    )}

                    {routePath.length > 1 && (
                      <YPolyline
                        geometry={routePath}
                        options={{
                          strokeColor: transportMode === 'driving' ? '#3b82f6' : '#10b981',
                          strokeWidth: 5,
                          strokeOpacity: 0.8,
                        }}
                      />
                    )}
                  </Map>
                </YMaps>
              )}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">{identity.title}</h1>
        <p className="text-gray-500 mt-3 font-medium text-lg">{identity.subtitle}</p>
      </div>

      <div className="py-2">
        {activeTab === 'favorites' && (
          favoriteItems.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-[3rem] border border-gray-100 shadow-sm">
              <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8">
                <Heart className="h-10 w-10 text-red-500 fill-red-500" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">Здесь пока пусто</h3>
              <p className="text-gray-500 max-w-sm mx-auto font-medium">
                Добавляйте места и экскурсии в избранное, чтобы спланировать путешествие.
              </p>
              <button onClick={() => window.location.href='/search'} className="mt-8 px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-blue-500/20 transition-all">В каталог</button>
            </div>
          ) : (
            <div className="space-y-12">
              {favoritePlaces.length > 0 && (
                <section className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-gray-900">Избранные места</h3>
                      <p className="text-sm text-gray-500 font-medium">
                        {favoritePlaces.length}{' '}
                        {favoritePlaces.length === 1 ? 'объект' : favoritePlaces.length < 5 ? 'объекта' : 'объектов'}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {favoritePlaces.map((item) => (
                      <TourCard key={item.id} item={item} />
                    ))}
                  </div>
                </section>
              )}

              {favoriteExcursions.length > 0 && (
                <section className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                      <Compass className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-gray-900">Избранные экскурсии</h3>
                      <p className="text-sm text-gray-500 font-medium">
                        {favoriteExcursions.length}{' '}
                        {favoriteExcursions.length === 1 ? 'экскурсия' : favoriteExcursions.length < 5 ? 'экскурсии' : 'экскурсий'}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {favoriteExcursions.map((item) => (
                      <TourCard key={item.id} item={item} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )
        )}

        {activeTab === 'constructor' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white p-6 sm:p-12 rounded-[3.5rem] shadow-2xl shadow-blue-500/5 border border-gray-100">
              <div className="mb-12 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-blue-600 text-xs font-black uppercase tracking-widest mb-6">
                  <Settings2 className="w-4 h-4" /> Конструктор
                </div>
                <h3 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Ваше приключение начинается</h3>
                <p className="text-gray-500 text-lg font-medium max-w-xl mx-auto">Выберите способ создания маршрута: доверьтесь алгоритмам или соберите сами.</p>
              </div>

              {/* Mode Toggle */}
              <div className="flex bg-gray-50 p-1.5 rounded-[2rem] border border-gray-100 mb-12">
                <button 
                  onClick={() => setConstructorMode('auto')}
                  className={`flex-1 py-4 px-6 rounded-[1.5rem] font-black text-sm flex items-center justify-center gap-2 transition-all ${constructorMode === 'auto' ? 'bg-white text-blue-600 shadow-xl' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Wand2 className="w-5 h-5" /> Автоматический
                </button>
                <button 
                  onClick={() => setConstructorMode('manual')}
                  className={`flex-1 py-4 px-6 rounded-[1.5rem] font-black text-sm flex items-center justify-center gap-2 transition-all ${constructorMode === 'manual' ? 'bg-white text-blue-600 shadow-xl' : 'text-gray-400 hover:text-gray-600'}`}
                >
                   <MapIcon className="w-5 h-5" /> Ручной режим
                </button>
              </div>

              <div className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="relative">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">Точка старта</label>
                    <div className="relative group">
                      <Home className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-600 transition-colors" />
                      <input 
                        type="text" 
                        value={startPoint}
                        onChange={(e) => handleStartChange(e.target.value)}
                        onFocus={() => startPoint.trim() && setShowStartSugs(true)}
                        onBlur={() => setTimeout(() => setShowStartSugs(false), 200)}
                        className="w-full pl-16 pr-6 py-5 bg-gray-50 border-transparent rounded-[2rem] focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all font-bold text-gray-900 border" 
                        placeholder="Отель, улица..." 
                      />
                    </div>
                    <AnimatePresence>
                      {showStartSugs && startSuggestions.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden max-h-60 overflow-y-auto"
                        >
                          {startSuggestions.map((addr, idx) => (
                            <div 
                              key={idx}
                              onClick={() => {
                                setStartPoint(addr);
                                setShowStartSugs(false);
                              }}
                              className="flex items-center gap-3 p-4 hover:bg-blue-50/50 cursor-pointer transition-colors border-b border-gray-50 last:border-0"
                            >
                              <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
                              <span className="text-sm text-gray-700 font-medium">{addr}</span>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="relative">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">Точка финиша</label>
                    <div className="relative group">
                      <Flag className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-600 transition-colors" />
                      <input 
                        type="text" 
                        value={endPoint}
                        onChange={(e) => handleEndChange(e.target.value)}
                        onFocus={() => endPoint.trim() && setShowEndSugs(true)}
                        onBlur={() => setTimeout(() => setShowEndSugs(false), 200)}
                        className="w-full pl-16 pr-6 py-5 bg-gray-50 border-transparent rounded-[2rem] focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all font-bold text-gray-900 border" 
                        placeholder="Музей, площадь..." 
                      />
                    </div>
                    <AnimatePresence>
                      {showEndSugs && endSuggestions.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden max-h-60 overflow-y-auto"
                        >
                          {endSuggestions.map((addr, idx) => (
                            <div 
                              key={idx}
                              onClick={() => {
                                setEndPoint(addr);
                                setShowEndSugs(false);
                              }}
                              className="flex items-center gap-3 p-4 hover:bg-blue-50/50 cursor-pointer transition-colors border-b border-gray-50 last:border-0"
                            >
                              <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
                              <span className="text-sm text-gray-700 font-medium">{addr}</span>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {constructorMode === 'auto' ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-blue-50/50 p-8 rounded-[2.5rem] border border-blue-100 space-y-8"
                  >
                    <div>
                      <label className="block text-xs font-black text-blue-600 uppercase tracking-widest mb-4">На сколько дней?</label>
                      <div className="flex gap-3">
                        {[1, 2, 3, 5].map(d => (
                          <button 
                            key={d} 
                            onClick={() => setPrefs(p => ({...p, days: d}))}
                            className={`w-14 h-14 rounded-2xl font-black text-lg transition-all ${prefs.days === d ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white text-gray-400 hover:bg-blue-100 hover:text-blue-600 border border-blue-50'}`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-blue-600 uppercase tracking-widest mb-4">Тематика маршрута</label>
                      <div className="flex flex-wrap gap-2">
                        {['История', 'Гастрономия', 'Искусство', 'Природа', 'Активный отдых'].map(t => {
                          const isActive = prefs.themes.includes(t);
                          return (
                            <button 
                              key={t}
                              onClick={() => setPrefs(p => ({
                                ...p, 
                                themes: isActive ? p.themes.filter(x => x !== t) : [...p.themes, t]
                              }))}
                              className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all ${isActive ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-500 hover:border-blue-200 border border-blue-50'}`}
                            >
                              {t}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <label className="block text-xs font-black text-blue-600 uppercase tracking-widest mb-4">Темп</label>
                        <select 
                          value={prefs.activity}
                          onChange={(e) => setPrefs(p => ({...p, activity: e.target.value as any}))}
                          className="w-full px-6 py-4 bg-white rounded-2xl border border-blue-50 font-bold text-gray-700 outline-none focus:ring-4 focus:ring-blue-100"
                        >
                          <option value="low">Спокойный</option>
                          <option value="medium" selected>Умеренный</option>
                          <option value="high">Интенсивный</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-black text-blue-600 uppercase tracking-widest mb-4">Время</label>
                         <select 
                          value={prefs.time}
                          onChange={(e) => setPrefs(p => ({...p, time: e.target.value as any}))}
                          className="w-full px-6 py-4 bg-white rounded-2xl border border-blue-50 font-bold text-gray-700 outline-none focus:ring-4 focus:ring-blue-100"
                        >
                          <option value="morning">Только день</option>
                          <option value="evening">Вечерний</option>
                          <option value="full">Целый день</option>
                        </select>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                   >
                    <div className="flex items-center justify-between ml-2">
                       <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Что хотим посетить?</label>
                       <Link to="/search" className="text-blue-600 text-xs font-black uppercase tracking-widest hover:underline flex items-center gap-1">
                         <Plus className="w-3 h-3" /> Добавить из каталога
                       </Link>
                    </div>
                    
                    {favoriteItems.length === 0 ? (
                      <div className="p-12 bg-gray-50 rounded-[2.5rem] border border-dashed border-gray-200 text-center">
                        <Heart className="w-10 h-10 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-400 font-bold">Сначала добавьте места в избранное</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {favoriteItems.map(item => {
                          const isSelected = selectedWaypoints.includes(item.id);
                          return (
                            <div 
                              key={item.id}
                              onClick={() => toggleWaypoint(item.id)} 
                              className={`p-4 bg-white border-2 rounded-[1.75rem] flex items-center gap-4 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${
                                isSelected ? 'border-blue-500 shadow-xl shadow-blue-500/10' : 'border-gray-50 hover:border-blue-100'
                              }`}
                            >
                              <img src={item.image} alt={item.title} className="w-16 h-16 rounded-2xl object-cover" />
                              <div className="flex-1">
                                <h4 className={`font-black text-sm line-clamp-2 ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>
                                  {item.title}
                                </h4>
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">{item.category === 'places' ? 'Место' : 'Экскурсия'}</p>
                              </div>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-300'}`}>
                                {isSelected ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}

                <div className="pt-10 flex flex-col items-center">
                  <button 
                    onClick={handleCreateRoute}
                    disabled={!startPoint || !endPoint || (constructorMode === 'manual' && selectedWaypoints.length === 0) || isGenerating}
                    className="w-full py-6 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-[2rem] font-black text-xl shadow-[0_20px_50px_rgba(37,99,235,0.3)] hover:shadow-blue-500/40 disabled:bg-gray-200 disabled:cursor-not-allowed disabled:shadow-none transition-all flex justify-center items-center gap-3 active:scale-[0.98]"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        Алгоритмы работают...
                      </>
                    ) : (
                      <>
                        {constructorMode === 'auto' ? <Wand2 className="w-6 h-6" /> : <Route className="w-6 h-6" />}
                        {constructorMode === 'auto' ? 'Сгенерировать магию' : 'Создать мой маршрут'}
                      </>
                    )}
                  </button>
                  <p className="text-gray-400 text-xs font-bold mt-6">Маршрут будет автоматически оптимизирован по времени и логистике</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'my-routes' && (
          myRoutes.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-[3rem] border border-gray-100 shadow-sm">
              <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-8">
                <Route className="h-10 w-10 text-blue-500" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">Маршрутов пока нет</h3>
              <p className="text-gray-500 max-w-sm mx-auto font-medium">Создайте свой первый план путешествия в конструкторе.</p>
              <button onClick={() => handleTabChange('constructor')} className="mt-8 px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold transition-all">К конструктору</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {myRoutes.map(route => (
                <div key={route.id} className="group bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-2xl hover:border-transparent transition-all flex flex-col hover:-translate-y-2">
                  <div className="flex items-start justify-between mb-8">
                    <div className="flex items-start gap-4">
                      <div className="p-4 bg-blue-50 rounded-2xl text-blue-600 group-hover:rotate-6 transition-transform">
                        <Route className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-black text-gray-900 text-xl line-clamp-1 mb-1">{route.title}</h4>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date(route.createdAt).toLocaleDateString('ru-RU')}</p>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatch(deleteRoute(route.id));
                      }}
                      className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-4 mb-10 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                      <span className="text-gray-500 font-bold text-sm line-clamp-1">{route.startPoint}</span>
                    </div>
                    <div className="flex items-center gap-3 py-1">
                      <div className="h-4 w-0.5 bg-gray-100 ml-[3px]"></div>
                      <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{route.waypoints.length} мест</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-400"></div>
                      <span className="text-gray-500 font-bold text-sm line-clamp-1">{route.endPoint}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => setSelectedRouteId(route.id)}
                    className="w-full py-4 px-4 bg-white border-2 border-blue-600 rounded-2xl text-sm font-black text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-lg hover:shadow-blue-500/20 active:scale-[0.98]"
                  >
                    Открыть план
                  </button>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
