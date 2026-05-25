import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Heart, 
  Map as MapIcon, 
  Route, 
  MapPin, 
  Footprints, 
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
  Zap,
  GripVertical,
  Download,
  Share2,
  Trash2,
  Compass,
  Plus,
  RefreshCw,
} from 'lucide-react';
import CatalogItemDetailModal from '../components/CatalogItemDetailModal';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import {
  addRoute,
  updateRouteTitle,
  deleteRoute,
  updateRouteWaypoints,
  completeRoute,
} from '../store/authSlice';
import { MockItem } from '../data/mockData';
import TourCard from '../components/TourCard';
import ExpandableMap from '../components/ExpandableMap';
import RouteMap from '../maps/components/RouteMap';
import CatalogMap from '../maps/components/CatalogMap';
import AddressSuggestInput from '../maps/components/AddressSuggestInput';
import { getMapCatalogItems, resolveHasCoordinates } from '../data/catalogMap';
import { enrichItem } from '../data/enrichedItems';
import { geocodeAddress, GeocodeError } from '../maps/api/geocode';
import {
  AUTO_ROUTE_UI_THEMES,
  buildAutoRoute,
  buildAutoRouteTitle,
  CATEGORY_LABELS,
  filterAutoRouteCandidates,
  getTargetWaypointCount,
  type ActivityLevel,
  type AutoRoutePrefs,
  type TimePreference,
} from '../utils/buildAutoRoute';
import {
  buildSegmentTransitLegs,
  formatRouteDuration,
  formatRouteDistance,
  getRouteModeTotals,
} from '../maps/api/route';
import { useDualRoutes } from '../maps/hooks/useDualRoutes';
import type { RouteDisplayMode } from '../maps/components/RouteMap';
import { optimizeWaypointOrder } from '../maps/utils/optimizeWaypoints';
import { EKATERINBURG_CENTER } from '../maps/constants';
import { motion, Reorder } from 'motion/react';

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

  useEffect(() => {
    if (idParam) {
      setSelectedRouteId(idParam);
      setActiveTab('my-routes');
    }
  }, [idParam]);

  const handleTabChange = (tabId: 'favorites' | 'constructor' | 'my-routes') => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  const isTourist = user?.role === 'tourist';

  const enrichedCatalogItems = useMemo(
    () => catalogItems.map(enrichItem),
    [catalogItems],
  );

  const favoriteItems = useMemo(
    () => enrichedCatalogItems.filter((item) => user?.favorites?.includes(item.id)),
    [enrichedCatalogItems, user?.favorites],
  );
  const favoritePlaces = useMemo(
    () => favoriteItems.filter((item) => item.category === 'places' || item.category === 'restaurants'),
    [favoriteItems],
  );
  const favoriteExcursions = useMemo(
    () => favoriteItems.filter((item) => item.category === 'excursions'),
    [favoriteItems],
  );

  type FavoritesFilter = 'all' | 'places' | 'excursions';
  const [favoritesFilter, setFavoritesFilter] = useState<FavoritesFilter>('all');

  const filteredFavoriteItems = useMemo(() => {
    if (favoritesFilter === 'places') return favoritePlaces;
    if (favoritesFilter === 'excursions') return favoriteExcursions;
    return favoriteItems;
  }, [favoritesFilter, favoriteItems, favoritePlaces, favoriteExcursions]);

  const myRoutes = useSelector((state: RootState) => state.auth.routes) || [];

  // Constructor state
  const [startPoint, setStartPoint] = useState('');
  const [endPoint, setEndPoint] = useState('');
  const [selectedWaypoints, setSelectedWaypoints] = useState<string[]>([]);
  const [startCoords, setStartCoords] = useState<[number, number] | null>(null);
  const [endCoords, setEndCoords] = useState<[number, number] | null>(null);
  const [isGeocodingPreview, setIsGeocodingPreview] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [constructorMode, setConstructorMode] = useState<'manual' | 'auto'>('manual');
  const [autoPreviewWaypoints, setAutoPreviewWaypoints] = useState<string[]>([]);
  const [autoSuggestMessage, setAutoSuggestMessage] = useState<string | null>(null);
  const [detailModalItem, setDetailModalItem] = useState<MockItem | null>(null);

  const [prefs, setPrefs] = useState<AutoRoutePrefs>({
    themes: [],
    activity: 'medium',
    time: 'full',
  });

  // Route Details state
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(idParam || null);
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState('');
  const [routeDisplayMode, setRouteDisplayMode] = useState<RouteDisplayMode>('driving');
  const [isOptimizing, setIsOptimizing] = useState(false);

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

  const constructorMapItems = useMemo(
    () => getMapCatalogItems(favoriteItems),
    [favoriteItems],
  );

  const geocodeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);


  const openCatalogDetail = (id: string) => {
    const item = enrichedCatalogItems.find((i) => i.id === id);
    if (item) setDetailModalItem(item);
  };

  useEffect(() => {
    if (geocodeDebounceRef.current) clearTimeout(geocodeDebounceRef.current);

    if (!startPoint.trim() && !endPoint.trim()) {
      setStartCoords(null);
      setEndCoords(null);
      setIsGeocodingPreview(false);
      return;
    }

    geocodeDebounceRef.current = setTimeout(async () => {
      setIsGeocodingPreview(true);
      try {
        if (startPoint.trim()) {
          setStartCoords(await geocodeAddress(startPoint));
        } else {
          setStartCoords(null);
        }
        if (endPoint.trim()) {
          setEndCoords(await geocodeAddress(endPoint));
        } else {
          setEndCoords(null);
        }
      } catch {
        /* превью без маркеров старта/финиша */
      } finally {
        setIsGeocodingPreview(false);
      }
    }, 600);

    return () => {
      if (geocodeDebounceRef.current) clearTimeout(geocodeDebounceRef.current);
    };
  }, [startPoint, endPoint]);

  const geocodeStartEnd = async (): Promise<{
    start: [number, number];
    end: [number, number];
  } | null> => {
    try {
      const start = startCoords ?? (await geocodeAddress(startPoint));
      const end = endCoords ?? (await geocodeAddress(endPoint));
      setStartCoords(start);
      setEndCoords(end);
      return { start, end };
    } catch (e) {
      const msg =
        e instanceof GeocodeError
          ? e.message
          : 'Не удалось определить координаты адреса. Проверьте адрес и ключ API.';
      alert(msg);
      return null;
    }
  };

  const optimizePreviewWaypoints = async (
    ids: string[],
    start: [number, number],
  ): Promise<string[]> => {
    const nodes = ids
      .map((id) => {
        const item = enrichedCatalogItems.find((i) => i.id === id);
        return item && resolveHasCoordinates(item)
          ? { id, lat: item.lat, lng: item.lng }
          : null;
      })
      .filter(Boolean) as { id: string; lat: number; lng: number }[];
    if (nodes.length === 0) return [];
    return optimizeWaypointOrder(start, nodes, 'driving');
  };

  const handleSuggestAutoRoute = async (options?: { excludeIds?: string[]; replace?: boolean }) => {
    if (!startPoint.trim() || !endPoint.trim()) return;

    setIsSuggesting(true);
    setAutoSuggestMessage(null);

    const coords = await geocodeStartEnd();
    if (!coords) {
      setIsSuggesting(false);
      return;
    }

    const targetCount = getTargetWaypointCount(prefs);
    const candidates = filterAutoRouteCandidates(enrichedCatalogItems, prefs);

    if (candidates.length === 0) {
      setAutoSuggestMessage(
        'По выбранным категориям и фильтрам не найдено подходящих мест. Измените параметры.',
      );
      setAutoPreviewWaypoints([]);
      setIsSuggesting(false);
      return;
    }

    const appendTo = options?.replace ? [] : autoPreviewWaypoints;
    const { waypointIds, candidatesCount } = buildAutoRoute(
      enrichedCatalogItems,
      prefs,
      coords.start,
      { excludeIds: options?.excludeIds, appendTo },
    );

    const newIds = options?.replace
      ? waypointIds
      : [...appendTo, ...waypointIds.filter((id) => !appendTo.includes(id))];

    if (newIds.length === 0) {
      setAutoSuggestMessage(
        `По выбранным категориям найдено ${candidatesCount} ${candidatesCount === 1 ? 'место' : candidatesCount < 5 ? 'места' : 'мест'}, но не удалось набрать маршрут. Ослабьте фильтры или добавьте категории.`,
      );
      setIsSuggesting(false);
      return;
    }

    const optimized = await optimizePreviewWaypoints(newIds.slice(0, targetCount), coords.start);

    if (optimized.length === 0) {
      setAutoSuggestMessage(
        `По выбранным категориям найдено ${candidatesCount} ${candidatesCount === 1 ? 'место' : candidatesCount < 5 ? 'места' : 'мест'}, измените фильтры.`,
      );
      setIsSuggesting(false);
      return;
    }

    if (optimized.length < targetCount && candidatesCount >= targetCount) {
      setAutoSuggestMessage(
        `Подобрано ${optimized.length} из ${targetCount} точек. Доступно ${candidatesCount} мест по фильтрам.`,
      );
    } else if (optimized.length < targetCount) {
      setAutoSuggestMessage(
        `По выбранным категориям найдено ${candidatesCount} ${candidatesCount === 1 ? 'место' : candidatesCount < 5 ? 'места' : 'мест'}, подобрано ${optimized.length}. Измените фильтры для большего маршрута.`,
      );
    }

    setAutoPreviewWaypoints(optimized);
    setIsSuggesting(false);
  };

  const handleRegenerateAutoRoute = () => {
    void handleSuggestAutoRoute({ excludeIds: autoPreviewWaypoints, replace: true });
  };

  const handleSaveAutoRoute = async () => {
    if (!startPoint.trim() || !endPoint.trim() || autoPreviewWaypoints.length === 0) return;

    setIsGenerating(true);
    const coords = await geocodeStartEnd();
    if (!coords) {
      setIsGenerating(false);
      return;
    }

    const optimized = await optimizePreviewWaypoints(autoPreviewWaypoints, coords.start);

    const newRoute = {
      id: Date.now().toString(),
      title: buildAutoRouteTitle(prefs, startPoint),
      startPoint,
      endPoint,
      startCoords: coords.start,
      endCoords: coords.end,
      waypoints: optimized,
      createdAt: new Date().toISOString(),
    };

    dispatch(addRoute(newRoute));
    setStartPoint('');
    setEndPoint('');
    setStartCoords(null);
    setEndCoords(null);
    setAutoPreviewWaypoints([]);
    setAutoSuggestMessage(null);
    setIsGenerating(false);
    setActiveTab('my-routes');
    setSearchParams({ tab: 'my-routes' });
  };

  const handleCreateRoute = async () => {
    if (!startPoint || !endPoint || selectedWaypoints.length === 0) return;

    setIsGenerating(true);
    const coords = await geocodeStartEnd();
    if (!coords) {
      setIsGenerating(false);
      return;
    }

    const nodes = selectedWaypoints
      .map((id) => {
        const item = catalogItems.find((i) => i.id === id);
        return item ? { id, lat: item.lat, lng: item.lng } : null;
      })
      .filter(Boolean) as { id: string; lat: number; lng: number }[];

    const optimized = await optimizeWaypointOrder(coords.start, nodes, 'driving');

    const newRoute = {
      id: Date.now().toString(),
      title: `Маршрут от ${startPoint}`,
      startPoint,
      endPoint,
      startCoords: coords.start,
      endCoords: coords.end,
      waypoints: optimized,
      createdAt: new Date().toISOString(),
    };

    dispatch(addRoute(newRoute));

    setStartPoint('');
    setEndPoint('');
    setStartCoords(null);
    setEndCoords(null);
    setSelectedWaypoints([]);
    setIsGenerating(false);
    setActiveTab('my-routes');
    setSearchParams({ tab: 'my-routes' });
  };

  const handleOptimizeRoute = async (routeId: string) => {
    const route = myRoutes.find(r => r.id === routeId);
    if (!route) return;

    setIsOptimizing(true);

    const start = route.startCoords ?? EKATERINBURG_CENTER;
    const nodes = route.waypoints
      .map((id) => {
        const item = catalogItems.find((i) => i.id === id);
        return item ? { id, lat: item.lat, lng: item.lng } : null;
      })
      .filter(Boolean) as { id: string; lat: number; lng: number }[];

    const optimizeMode = routeDisplayMode === 'walking' ? 'walking' : 'driving';
    const optimized = await optimizeWaypointOrder(start, nodes, optimizeMode);
    dispatch(updateRouteWaypoints({ id: routeId, waypoints: optimized }));
    setIsOptimizing(false);
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

  const selectedRouteForMap = useMemo(() => {
    if (!selectedRouteId) return null;
    const route = myRoutes.find((r) => r.id === selectedRouteId);
    if (!route?.startCoords || !route?.endCoords) return null;

    const waypointsCoords = route.waypoints
      .map((wpId) => {
        const item = catalogItems.find((i) => i.id === wpId);
        return item ? ([item.lat, item.lng] as [number, number]) : null;
      })
      .filter(Boolean) as [number, number][];

    return {
      route,
      allCoords: [route.startCoords!, ...waypointsCoords, route.endCoords!] as [number, number][],
    };
  }, [selectedRouteId, myRoutes, catalogItems]);

  const dualRoutes = useDualRoutes(
    selectedRouteForMap?.allCoords ?? null,
    activeTab === 'my-routes' && Boolean(selectedRouteForMap),
  );

  const constructorPreviewCoords = useMemo(() => {
    if (activeTab !== 'constructor' || constructorMode !== 'manual') return null;
    const wpCoords = selectedWaypoints
      .map((id) => {
        const item = catalogItems.find((i) => i.id === id);
        return item ? ([item.lat, item.lng] as [number, number]) : null;
      })
      .filter(Boolean) as [number, number][];
    const coords: [number, number][] = [];
    if (startCoords) coords.push(startCoords);
    coords.push(...wpCoords);
    if (endCoords) coords.push(endCoords);
    return coords.length >= 2 ? coords : null;
  }, [activeTab, constructorMode, selectedWaypoints, startCoords, endCoords, catalogItems]);

  const constructorRoutes = useDualRoutes(
    constructorPreviewCoords,
    activeTab === 'constructor' && constructorMode === 'manual',
  );

  const autoPreviewItems = useMemo(
    () =>
      autoPreviewWaypoints
        .map((id) => enrichedCatalogItems.find((i) => i.id === id))
        .filter((i): i is NonNullable<typeof i> => Boolean(i && resolveHasCoordinates(i))),
    [autoPreviewWaypoints, enrichedCatalogItems],
  );

  const autoPreviewCoords = useMemo(() => {
    if (activeTab !== 'constructor' || constructorMode !== 'auto') return null;
    const wpCoords = autoPreviewItems.map((i) => [i.lat, i.lng] as [number, number]);
    const coords: [number, number][] = [];
    if (startCoords) coords.push(startCoords);
    coords.push(...wpCoords);
    if (endCoords) coords.push(endCoords);
    return coords.length >= 2 ? coords : null;
  }, [activeTab, constructorMode, autoPreviewItems, startCoords, endCoords]);

  const autoRoutes = useDualRoutes(
    autoPreviewCoords,
    activeTab === 'constructor' && constructorMode === 'auto',
  );

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

    const mapCenter = selectedRouteForMap?.allCoords[0] ?? EKATERINBURG_CENTER;
    const segmentLegs =
      selectedRouteForMap && dualRoutes.driving && dualRoutes.walking
        ? buildSegmentTransitLegs(
            selectedRouteForMap.allCoords,
            dualRoutes.driving,
            dualRoutes.walking,
          )
        : [];

    const routeModeTotals =
      selectedRouteForMap && dualRoutes.driving && dualRoutes.walking && !dualRoutes.loading
        ? getRouteModeTotals(
            selectedRouteForMap.allCoords,
            dualRoutes.driving,
            dualRoutes.walking,
            routeDisplayMode,
          )
        : null;

    const SegmentTransit = ({ legIndex }: { legIndex: number }) => {
      const leg = segmentLegs[legIndex];
      if (!leg) return null;

      if (dualRoutes.loading) {
        return (
          <div className="relative pl-16 py-2">
            <div className="ml-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 text-gray-400 text-[11px] font-bold border border-gray-100">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Расчёт переезда...
            </div>
          </div>
        );
      }

      const showDriving = leg.drivingSec > 0;
      const showWalking = leg.walkingSec > 0;

      if (!showDriving && !showWalking) return null;

      return (
        <div className="relative pl-16 py-2">
          <div className="absolute left-[2.75rem] top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 to-emerald-200" aria-hidden />
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-2">
            До следующей точки
          </p>
          <div className="ml-2 flex flex-wrap gap-2">
            {showDriving && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-100">
                <Car className="w-3.5 h-3.5" />
                {formatRouteDuration(leg.drivingSec)}
                <span className="text-blue-400 font-semibold">· {formatRouteDistance(leg.drivingDist)}</span>
              </span>
            )}
            {showWalking && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-100">
                <Footprints className="w-3.5 h-3.5" />
                {formatRouteDuration(leg.walkingSec)}
                <span className="text-emerald-400 font-semibold">· {formatRouteDistance(leg.walkingDist)}</span>
              </span>
            )}
          </div>
        </div>
      );
    };

    return (
      <>
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

                <SegmentTransit legIndex={0} />

                {/* Waypoints - Reorderable */}
                <Reorder.Group axis="y" values={route.waypoints} onReorder={(newOrder) => dispatch(updateRouteWaypoints({ id: route.id, waypoints: newOrder }))} className="space-y-6">
                  {route.waypoints.map((wpId, index) => {
                    const item = enrichedCatalogItems.find((i) => i.id === wpId);
                    
                    return (
                      <Reorder.Item key={wpId} value={wpId} className="relative pl-16">
                         <div className="absolute left-0 top-0 bg-blue-500 p-3 rounded-2xl shadow-lg ring-4 ring-white z-10 group cursor-grab active:cursor-grabbing">
                          <MapPin className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                        </div>
                        
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => openCatalogDetail(wpId)}
                          onKeyDown={(e) => e.key === 'Enter' && openCatalogDetail(wpId)}
                          className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all flex gap-4 items-center group cursor-pointer"
                        >
                          <div
                            className="p-2 text-gray-300 group-hover:text-gray-400"
                            onClick={(e) => e.stopPropagation()}
                            onPointerDown={(e) => e.stopPropagation()}
                          >
                            <GripVertical className="w-5 h-5" />
                          </div>
                          {item?.image && <img src={item.image} alt={item.title} className="w-20 h-20 rounded-2xl object-cover" />}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-black text-gray-900 text-lg group-hover:text-blue-600 transition-colors">{item?.title}</h4>
                            <p className="text-sm text-gray-500 font-medium line-clamp-1">{item?.description}</p>
                            {item && (
                              <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest mt-1">
                                {CATEGORY_LABELS[item.category]} · открыть
                              </p>
                            )}
                          </div>
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const newWaypoints = route.waypoints.filter(id => id !== wpId);
                              dispatch(updateRouteWaypoints({ id: route.id, waypoints: newWaypoints }));
                            }}
                            className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                        <SegmentTransit legIndex={index + 1} />
                      </Reorder.Item>
                    );
                  })}
                </Reorder.Group>

                <SegmentTransit legIndex={route.waypoints.length + 1} />

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
            <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-wrap bg-gray-50 p-1 rounded-2xl gap-1">
                <button 
                  onClick={() => setRouteDisplayMode('driving')} 
                  className={`px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold transition-all ${routeDisplayMode === 'driving' ? 'bg-white text-blue-600 shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Car className="w-4 h-4" /> На машине
                </button>
                <button 
                  onClick={() => setRouteDisplayMode('walking')} 
                  className={`px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold transition-all ${routeDisplayMode === 'walking' ? 'bg-white text-blue-600 shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Footprints className="w-4 h-4" /> Пешком
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm font-bold">
                {dualRoutes.loading || isOptimizing ? (
                  <span className="flex items-center gap-2 text-blue-600 bg-blue-50 px-4 py-2.5 rounded-xl">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Расчёт маршрута...
                  </span>
                ) : routeDisplayMode === 'driving' ? (
                  <span className="flex items-center gap-2 text-blue-700 bg-blue-50 px-3 py-2 rounded-xl border border-blue-100">
                    <Car className="w-4 h-4" />
                    {formatRouteDuration(routeModeTotals?.durationSec ?? 0)}
                    <span className="text-blue-400 font-semibold">
                      {formatRouteDistance(routeModeTotals?.distanceM ?? 0)}
                    </span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100">
                    <Footprints className="w-4 h-4" />
                    {formatRouteDuration(routeModeTotals?.durationSec ?? 0)}
                    <span className="text-emerald-400 font-semibold">
                      {formatRouteDistance(routeModeTotals?.distanceM ?? 0)}
                    </span>
                  </span>
                )}
              </div>
            </div>

            {dualRoutes.error && (
              <p className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2">
                {dualRoutes.error}
              </p>
            )}
            {dualRoutes.hint && !dualRoutes.error && (
              <p className="text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2">
                {dualRoutes.hint}
              </p>
            )}

            <ExpandableMap
              height="600px"
              roundedClassName="rounded-[2.5rem]"
              className="bg-white p-2 shadow-2xl border-gray-100"
              overlay={
                dualRoutes.loading ? (
                  <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-sm flex items-center justify-center rounded-xl pointer-events-none">
                    <div className="flex flex-col items-center gap-2 text-blue-600">
                      <Loader2 className="w-8 h-8 animate-spin" />
                      <span className="font-medium">Построение маршрутов по дорогам...</span>
                    </div>
                  </div>
                ) : undefined
              }
            >
              <RouteMap
                height="100%"
                center={mapCenter as [number, number]}
                startCoords={route.startCoords ?? undefined}
                endCoords={route.endCoords ?? undefined}
                waypoints={route.waypoints
                  .map((wpId) => {
                    const wpItem = catalogItems.find((i) => i.id === wpId);
                    return wpItem
                      ? { lat: wpItem.lat, lng: wpItem.lng, label: wpItem.title }
                      : null;
                  })
                  .filter((wp): wp is { lat: number; lng: number; label: string } => wp !== null)}
                drivingPath={dualRoutes.driving?.geometry}
                walkingPath={dualRoutes.walking?.geometry}
                displayMode={routeDisplayMode}
                transportMode={routeDisplayMode}
              />
            </ExpandableMap>
          </div>
        </div>
      </div>

      <CatalogItemDetailModal
        item={detailModalItem}
        onClose={() => setDetailModalItem(null)}
        catalogItems={enrichedCatalogItems}
      />
      </>
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
            <div className="space-y-8">
              <div className="flex flex-wrap gap-2 p-1.5 bg-gray-100 rounded-2xl w-fit border border-gray-200/50">
                {(
                  [
                    { id: 'all' as const, label: 'Все', count: favoriteItems.length },
                    { id: 'places' as const, label: 'Места', count: favoritePlaces.length },
                    { id: 'excursions' as const, label: 'Экскурсии', count: favoriteExcursions.length },
                  ] as const
                ).map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setFavoritesFilter(filter.id)}
                    disabled={filter.count === 0 && filter.id !== 'all'}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                      favoritesFilter === filter.id
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed'
                    }`}
                  >
                    {filter.label}
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-lg ${
                        favoritesFilter === filter.id ? 'bg-blue-50 text-blue-600' : 'bg-gray-200/80 text-gray-500'
                      }`}
                    >
                      {filter.count}
                    </span>
                  </button>
                ))}
              </div>

              {filteredFavoriteItems.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-[2.5rem] border border-gray-100">
                  <p className="text-gray-500 font-bold">
                    {favoritesFilter === 'places'
                      ? 'В избранном пока нет мест и ресторанов'
                      : favoritesFilter === 'excursions'
                        ? 'В избранном пока нет экскурсий'
                        : 'Нет объектов в этой категории'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setFavoritesFilter('all')}
                    className="mt-4 text-blue-600 font-bold text-sm hover:underline"
                  >
                    Показать всё избранное
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredFavoriteItems.map((item) => (
                    <TourCard
                      key={item.id}
                      item={item}
                      onOpen={() => setDetailModalItem(item)}
                    />
                  ))}
                </div>
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
                  onClick={() => {
                    setConstructorMode('auto');
                    setSelectedWaypoints([]);
                  }}
                  className={`flex-1 py-4 px-6 rounded-[1.5rem] font-black text-sm flex items-center justify-center gap-2 transition-all ${constructorMode === 'auto' ? 'bg-white text-blue-600 shadow-xl' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Wand2 className="w-5 h-5" /> Автоматический
                </button>
                <button 
                  onClick={() => {
                    setConstructorMode('manual');
                    setAutoPreviewWaypoints([]);
                    setAutoSuggestMessage(null);
                  }}
                  className={`flex-1 py-4 px-6 rounded-[1.5rem] font-black text-sm flex items-center justify-center gap-2 transition-all ${constructorMode === 'manual' ? 'bg-white text-blue-600 shadow-xl' : 'text-gray-400 hover:text-gray-600'}`}
                >
                   <MapIcon className="w-5 h-5" /> Ручной режим
                </button>
              </div>

              <div className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <AddressSuggestInput
                    label="Точка старта"
                    value={startPoint}
                    onChange={setStartPoint}
                    placeholder="Отель, улица..."
                    suggestKey="plans-start"
                    icon={<Home className="w-5 h-5" />}
                    disabled={isGenerating || isSuggesting}
                  />
                  <AddressSuggestInput
                    label="Точка финиша"
                    value={endPoint}
                    onChange={setEndPoint}
                    placeholder="Музей, площадь..."
                    suggestKey="plans-end"
                    icon={<Flag className="w-5 h-5" />}
                    disabled={isGenerating || isSuggesting}
                  />
                </div>

                {constructorMode === 'auto' ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-blue-50/50 p-8 rounded-[2.5rem] border border-blue-100 space-y-8"
                  >
                    <div>
                      <label className="block text-xs font-black text-blue-600 uppercase tracking-widest mb-4">Тематика маршрута</label>
                      <p className="text-xs text-gray-500 font-medium mb-3">
                        Подбор по местам и ресторанам города (без экскурсий)
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {AUTO_ROUTE_UI_THEMES.map((t) => {
                          const isActive = prefs.themes.includes(t);
                          return (
                            <button 
                              key={t}
                              type="button"
                              onClick={() => {
                                setPrefs((p) => ({
                                  ...p,
                                  themes: isActive
                                    ? p.themes.filter((x) => x !== t)
                                    : [...p.themes, t],
                                }));
                                setAutoPreviewWaypoints([]);
                                setAutoSuggestMessage(null);
                              }}
                              className={`px-5 py-2.5 rounded-2xl font-bold text-sm transition-all ${isActive ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-500 hover:border-blue-200 border border-blue-50'}`}
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
                          onChange={(e) => {
                            setPrefs((p) => ({ ...p, activity: e.target.value as ActivityLevel }));
                            setAutoPreviewWaypoints([]);
                            setAutoSuggestMessage(null);
                          }}
                          className="w-full px-6 py-4 bg-white rounded-2xl border border-blue-50 font-bold text-gray-700 outline-none focus:ring-4 focus:ring-blue-100"
                        >
                          <option value="low">Спокойный</option>
                          <option value="medium">Умеренный</option>
                          <option value="high">Интенсивный</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-black text-blue-600 uppercase tracking-widest mb-4">Время</label>
                         <select 
                          value={prefs.time}
                          onChange={(e) => {
                            setPrefs((p) => ({ ...p, time: e.target.value as TimePreference }));
                            setAutoPreviewWaypoints([]);
                            setAutoSuggestMessage(null);
                          }}
                          className="w-full px-6 py-4 bg-white rounded-2xl border border-blue-50 font-bold text-gray-700 outline-none focus:ring-4 focus:ring-blue-100"
                        >
                          <option value="morning">Только день</option>
                          <option value="evening">Вечерний</option>
                          <option value="full">Целый день</option>
                        </select>
                      </div>
                    </div>

                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                      Цель: {getTargetWaypointCount(prefs)} точек
                    </p>

                    {autoSuggestMessage && (
                      <p className="text-sm font-bold text-amber-800 bg-amber-50 border border-amber-100 rounded-2xl px-5 py-3">
                        {autoSuggestMessage}
                      </p>
                    )}

                    {autoPreviewWaypoints.length > 0 && (
                      <div className="space-y-6">
                        {autoPreviewItems.length > 0 && (
                          <div className="relative">
                            <ExpandableMap
                              height="360px"
                              roundedClassName="rounded-[2rem]"
                              className="bg-white border border-blue-100"
                              overlay={
                                isGeocodingPreview || autoRoutes.loading ? (
                                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/40 backdrop-blur-[2px] rounded-[2rem] pointer-events-none">
                                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                                  </div>
                                ) : undefined
                              }
                            >
                              <CatalogMap
                                height="100%"
                                items={autoPreviewItems}
                                selectedIds={autoPreviewWaypoints}
                                startCoords={startCoords}
                                endCoords={endCoords}
                                onSelect={openCatalogDetail}
                                fitBoundsOnItemsChange
                                drivingPath={autoRoutes.driving?.geometry}
                                routeDisplayMode="driving"
                              />
                            </ExpandableMap>
                            {autoPreviewCoords && (
                              <div className="flex flex-wrap gap-2 mt-2 text-[10px] font-bold">
                                {autoRoutes.loading ? (
                                  <span className="text-blue-600 flex items-center gap-1">
                                    <Loader2 className="w-3 h-3 animate-spin" /> Маршруты...
                                  </span>
                                ) : (
                                  <>
                                    <span className="text-blue-600 flex items-center gap-1">
                                      <Car className="w-3 h-3" />
                                      {formatRouteDuration(autoRoutes.driving?.durationSec ?? 0)}
                                      <span className="text-blue-400 font-semibold">
                                        · {formatRouteDistance(autoRoutes.driving?.distanceM ?? 0)}
                                      </span>
                                    </span>
                                    <span className="text-emerald-600 flex items-center gap-1">
                                      <Footprints className="w-3 h-3" />
                                      {formatRouteDuration(autoRoutes.walking?.durationSec ?? 0)}
                                    </span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <label className="text-xs font-black text-blue-600 uppercase tracking-widest">
                            Подобрано: {autoPreviewWaypoints.length} точек
                          </label>
                          <button
                            type="button"
                            onClick={handleRegenerateAutoRoute}
                            disabled={isSuggesting}
                            className="text-blue-600 text-xs font-black uppercase tracking-widest hover:underline flex items-center gap-1 disabled:opacity-40"
                          >
                            <RefreshCw className="w-3 h-3" /> Перегенерировать
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {autoPreviewWaypoints.map((wpId) => {
                            const item = enrichedCatalogItems.find((i) => i.id === wpId);
                            if (!item) return null;
                            return (
                              <div
                                key={wpId}
                                role="button"
                                tabIndex={0}
                                onClick={() => openCatalogDetail(wpId)}
                                onKeyDown={(e) => e.key === 'Enter' && openCatalogDetail(wpId)}
                                className="p-4 bg-white border-2 border-blue-100 rounded-[1.75rem] flex items-center gap-4 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all"
                              >
                                {item.image && (
                                  <img src={item.image} alt={item.title} className="w-16 h-16 rounded-2xl object-cover" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-black text-sm text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors">
                                    {item.title}
                                  </h4>
                                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">
                                    {CATEGORY_LABELS[item.category]} · подробнее
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAutoPreviewWaypoints((prev) => prev.filter((id) => id !== wpId));
                                  }}
                                  className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                                  title="Убрать из маршрута"
                                >
                                  <X className="w-5 h-5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
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
                      <>
                      {constructorMapItems.length > 0 && (
                        <div className="relative">
                          <ExpandableMap
                            height="360px"
                            roundedClassName="rounded-[2rem]"
                            className="bg-gray-50 border border-gray-100"
                            overlay={
                              isGeocodingPreview ? (
                                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/40 backdrop-blur-[2px] rounded-[2rem] pointer-events-none">
                                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                                </div>
                              ) : undefined
                            }
                          >
                            <CatalogMap
                              height="100%"
                              items={constructorMapItems}
                              selectedIds={selectedWaypoints}
                              startCoords={startCoords}
                              endCoords={endCoords}
                              onSelect={toggleWaypoint}
                              fitBoundsOnItemsChange
                              drivingPath={constructorRoutes.driving?.geometry}
                              routeDisplayMode="driving"
                            />
                          </ExpandableMap>
                          <div className="flex flex-wrap items-center justify-between gap-2 mt-2 ml-2">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                              Нажмите на маркер, чтобы добавить или убрать точку маршрута
                            </p>
                            {constructorPreviewCoords && (
                              <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                                {constructorRoutes.loading ? (
                                  <span className="text-blue-600 flex items-center gap-1">
                                    <Loader2 className="w-3 h-3 animate-spin" /> Маршруты...
                                  </span>
                                ) : (
                                  <>
                                    <span className="text-blue-600 flex items-center gap-1">
                                      <Car className="w-3 h-3" />
                                      {formatRouteDuration(constructorRoutes.driving?.durationSec ?? 0)}
                                    </span>
                                    <span className="text-emerald-600 flex items-center gap-1">
                                      <Footprints className="w-3 h-3" />
                                      {formatRouteDuration(constructorRoutes.walking?.durationSec ?? 0)}
                                    </span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                          {constructorPreviewCoords && (
                            <p className="text-[10px] text-gray-500 font-semibold mt-1 ml-2">
                              На карте — маршрут на машине; полное время пешком — в «Мои маршруты».
                            </p>
                          )}
                        </div>
                      )}
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
                      </>
                    )}
                  </motion.div>
                )}

                <div className="pt-10 flex flex-col items-center gap-4">
                  {constructorMode === 'auto' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => void handleSuggestAutoRoute({ replace: true })}
                        disabled={
                          !startPoint.trim() ||
                          !endPoint.trim() ||
                          isSuggesting ||
                          isGenerating
                        }
                        className="w-full py-6 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-[2rem] font-black text-xl shadow-[0_20px_50px_rgba(37,99,235,0.3)] hover:shadow-blue-500/40 disabled:bg-gray-200 disabled:cursor-not-allowed disabled:shadow-none transition-all flex justify-center items-center gap-3 active:scale-[0.98]"
                      >
                        {isSuggesting ? (
                          <>
                            <Loader2 className="w-6 h-6 animate-spin" />
                            Подбираем маршрут...
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-6 h-6" />
                            Подобрать маршрут
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleSaveAutoRoute()}
                        disabled={
                          !startPoint.trim() ||
                          !endPoint.trim() ||
                          autoPreviewWaypoints.length === 0 ||
                          isGenerating ||
                          isSuggesting
                        }
                        className="w-full py-5 px-4 bg-white border-2 border-blue-600 text-blue-600 rounded-[2rem] font-black text-lg hover:bg-blue-50 disabled:border-gray-200 disabled:text-gray-300 disabled:cursor-not-allowed transition-all flex justify-center items-center gap-3 active:scale-[0.98]"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Сохранение...
                          </>
                        ) : (
                          <>
                            <Route className="w-5 h-5" />
                            Сохранить маршрут
                          </>
                        )}
                      </button>
                      <p className="text-gray-400 text-xs font-bold">
                        Сначала подберите маршрут, при необходимости уберите точки, затем сохраните
                      </p>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => void handleCreateRoute()}
                        disabled={
                          !startPoint.trim() ||
                          !endPoint.trim() ||
                          selectedWaypoints.length === 0 ||
                          isGenerating
                        }
                        className="w-full py-6 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-[2rem] font-black text-xl shadow-[0_20px_50px_rgba(37,99,235,0.3)] hover:shadow-blue-500/40 disabled:bg-gray-200 disabled:cursor-not-allowed disabled:shadow-none transition-all flex justify-center items-center gap-3 active:scale-[0.98]"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-6 h-6 animate-spin" />
                            Создаём маршрут...
                          </>
                        ) : (
                          <>
                            <Route className="w-6 h-6" />
                            Создать мой маршрут
                          </>
                        )}
                      </button>
                      <p className="text-gray-400 text-xs font-bold mt-2">
                        Порядок точек будет оптимизирован по времени в пути
                      </p>
                    </>
                  )}
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

                  <div className="space-y-3">
                    <button 
                      type="button"
                      onClick={() => setSelectedRouteId(route.id)}
                      className="w-full py-4 px-4 bg-white border-2 border-blue-600 rounded-2xl text-sm font-black text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-lg hover:shadow-blue-500/20 active:scale-[0.98]"
                    >
                      Открыть план
                    </button>
                    {isTourist && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (route.completedAt || route.waypoints.length === 0) return;
                          dispatch(completeRoute(route.id));
                        }}
                        disabled={Boolean(route.completedAt) || route.waypoints.length === 0}
                        className="w-full py-3.5 px-4 rounded-2xl text-sm font-black transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 bg-emerald-50 border-2 border-emerald-200 text-emerald-700 hover:bg-emerald-100 disabled:bg-gray-50 disabled:border-gray-100 disabled:text-gray-400"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        {route.completedAt ? 'Маршрут пройден' : 'Прошёл маршрут'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      <CatalogItemDetailModal
        item={detailModalItem}
        onClose={() => setDetailModalItem(null)}
        catalogItems={enrichedCatalogItems}
        onSelectItem={(item) => setDetailModalItem(item)}
      />
    </div>
  );
}
