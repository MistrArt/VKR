import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import CatalogMap from '../maps/components/CatalogMap';
import { MapPin, Compass, Utensils, ArrowRight, Star } from 'lucide-react';
import { Category, MockItem } from '../data/mockData';
import { getMapCatalogItems, MAP_CATALOG_CATEGORIES, type MapCatalogCategory } from '../data/catalogMap';
import MapCategoryLegend from '../maps/components/MapCategoryLegend';
import { enrichItem } from '../data/enrichedItems';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import TourCard from '../components/TourCard';
import CatalogItemDetailModal from '../components/CatalogItemDetailModal';
import ExpandableMap from '../components/ExpandableMap';
import { motion } from 'motion/react';
import { useGetAllPlacesQuery } from '../api';
import { placeToMockItem } from '../api/mappers';

const categories = [
  { id: 'places', name: 'Места', icon: MapPin, color: 'bg-blue-600', path: '/search?category=places' },
  { id: 'excursions', name: 'Экскурсии', icon: Compass, color: 'bg-green-600', path: '/search?category=excursions' },
  { id: 'restaurants', name: 'Рестораны', icon: Utensils, color: 'bg-orange-600', path: '/search?category=restaurants' },
];

export default function Home() {
  const [searchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState<Category>('places');
  const [mapCategory, setMapCategory] = useState<MapCatalogCategory>('places');
  const [selectedItem, setSelectedItem] = useState<MockItem | null>(null);
  //const catalogItems = useSelector((state: RootState) => state.auth.items);
  const {data: catalogItems} = useGetAllPlacesQuery({limit: 200, offset: 0});

  const enrichedCatalog = useMemo(
    () => catalogItems?.items?.map((item) => enrichItem(placeToMockItem(item))) ?? [],
    [catalogItems],
  );

  const filteredItems = enrichedCatalog.filter((item) => item.category === activeCategory);
  const displayedItems = filteredItems.slice(0, 5);

  const mapItems = useMemo(
    () => getMapCatalogItems(enrichedCatalog).filter((item) => item.category === mapCategory),
    [enrichedCatalog, mapCategory],
  );

  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (
      categoryParam &&
      MAP_CATALOG_CATEGORIES.includes(categoryParam as MapCatalogCategory)
    ) {
      setMapCategory(categoryParam as MapCatalogCategory);
    }

    const highlightId = searchParams.get('highlight');
    if (highlightId) {
      const item = enrichedCatalog.find((i) => i.id === highlightId);
      if (item) setSelectedItem(item);
    }

    if (window.location.hash === '#map' || searchParams.has('highlight')) {
      requestAnimationFrame(() => {
        document.getElementById('city-map')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, [searchParams, enrichedCatalog]);

  return (
    <div className="space-y-16 pb-20">
      {/* 0. Hero Section */}
      <section className="relative h-[700px] -mt-8 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1590559063897-40017bcc695e?auto=format&fit=crop&q=80&w=2000" 
            alt="Yekaterinburg" 
            className="w-full h-full object-cover scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-gray-50/10 backdrop-blur-[2px]"></div>
          <div className="absolute inset-0 bg-blue-900/10 mix-blend-overlay"></div>
        </div>
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white text-sm font-bold tracking-wide"
          >
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            Лучший гид по Среднему Уралу
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl font-black text-white mb-8 tracking-tighter leading-[0.9]"
          >
            Откройте магию <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">Урала</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl md:text-2xl text-gray-100 mb-12 font-medium max-w-2xl mx-auto drop-shadow-lg"
          >
            Места, события и вкусы в самом сердце России. <br />
            Ваше путешествие начинается здесь.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/search" className="w-full sm:w-auto px-10 py-5 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700 transition-all shadow-[0_20px_50px_rgba(37,99,235,0.3)] hover:shadow-blue-500/40 hover:-translate-y-1">
              Начать поиск
            </Link>
            <Link to="/plans" className="w-full sm:w-auto px-10 py-5 bg-white/20 backdrop-blur-xl text-white border border-white/30 rounded-2xl font-black text-lg hover:bg-white/30 transition-all hover:-translate-y-1">
              Мои планы
            </Link>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        {/* 1. Категории */}
        <section>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <h2 className="text-4xl font-black text-gray-900 tracking-tight">Каталог впечатлений</h2>
              <p className="text-gray-500 mt-2 font-medium">Выберите то, что вам по душе</p>
            </div>
            <Link to="/search" className="text-blue-600 font-bold flex items-center gap-2 hover:gap-3 transition-all">
              Посмотреть всё <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = activeCategory === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id as Category)}
                  className={`flex flex-col items-center justify-center p-8 rounded-[2rem] shadow-sm border transition-all group relative overflow-hidden ${
                    isActive 
                      ? 'border-blue-500 bg-blue-50 ring-4 ring-blue-50' 
                      : 'border-gray-100 bg-white hover:shadow-xl hover:border-transparent'
                  }`}
                >
                  <div className={`p-4 rounded-2xl text-white mb-4 ${category.color} ${!isActive && 'group-hover:scale-110 group-hover:rotate-6'} transition-transform shadow-lg`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className={`font-black text-lg ${isActive ? 'text-blue-700' : 'text-gray-900'}`}>
                    {category.name}
                  </h3>
                  {isActive && (
                    <motion.div layoutId="active" className="absolute bottom-0 left-0 right-0 h-1.5 bg-blue-600" />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* 2. Объекты выбранной категории */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayedItems.map((item) => (
              <TourCard key={item.id} item={item} onOpen={() => setSelectedItem(item)} />
            ))}
            
            {/* Catalog Card */}
            <Link 
              to={`/search?category=${activeCategory}`}
              className="group relative flex flex-col items-center justify-center p-8 bg-blue-600 rounded-[2.5rem] text-white overflow-hidden shadow-2xl hover:shadow-blue-500/40 transition-all hover:-translate-y-2 min-h-[400px]"
            >
              <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-4 -translate-y-4">
                <Compass className="w-48 h-48" />
              </div>
              <div className="relative z-10 text-center">
                <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm group-hover:scale-110 transition-transform">
                  <ArrowRight className="w-10 h-10" />
                </div>
                <h3 className="text-3xl font-black mb-4">Перейти в каталог</h3>
                <p className="text-blue-100 font-medium">Смотреть все объекты в категории {categories.find(c => c.id === activeCategory)?.name}</p>
              </div>
            </Link>
          </div>
        </section>

        {/* 3. Карта */}
        <section
          id="city-map"
          className="bg-white rounded-[3rem] p-4 sm:p-12 shadow-xl border border-gray-100 scroll-mt-24"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
            <div>
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">Интерактивная карта</h2>
              <p className="text-gray-500 mt-2 font-medium">Места и рестораны на карте города</p>
            </div>
          </div>
          
          <ExpandableMap
            height="500px"
            overlay={
              <div className="absolute bottom-6 left-6 right-6 z-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 pointer-events-none">
                <MapCategoryLegend
                  activeCategory={mapCategory}
                  onCategoryChange={(cat) => setMapCategory(cat as MapCatalogCategory)}
                  categories={[...MAP_CATALOG_CATEGORIES]}
                  className="bg-white/70 backdrop-blur-xl rounded-2xl p-2 border border-white/50 shadow-lg"
                />
                <p className="text-xs font-bold text-gray-600 bg-white/70 backdrop-blur-xl px-3 py-2 rounded-xl border border-white/50 shadow-lg tabular-nums shrink-0">
                  На карте: {mapItems.length}
                </p>
              </div>
            }
          >
            <CatalogMap
              height="100%"
              items={mapItems}
              selectedId={selectedItem?.id}
              fitBoundsOnItemsChange
              onSelect={(id) => {
                const item = enrichedCatalog.find((i) => i.id === id);
                if (item) setSelectedItem(item);
              }}
              mapOptions={{ yandexMapDisablePoiInteractivity: true }}
            />
          </ExpandableMap>
        </section>
      </div>

      <CatalogItemDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        catalogItems={enrichedCatalog}
        onSelectItem={setSelectedItem}
      />
    </div>
  );
}
