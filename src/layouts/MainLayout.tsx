import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { 
  Map, 
  Search, 
  Calendar, 
  User, 
  LogIn, 
  LayoutDashboard, 
  Settings, 
  Bell, 
  MessageSquare, 
  Bookmark, 
  ChevronDown, 
  Route as RouteIcon,
  MapPin,
  Compass,
  Utensils,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import NotificationCenter from '../components/NotificationCenter';

export default function MainLayout() {
  const { isAuthenticated, user, items: storeItems } = useSelector((state: RootState) => state.auth);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const catalogRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const unreadNotifications = user?.notifications?.filter(n => !n.isRead).length || 0;

  const [globalSearch, setGlobalSearch] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);

  const handleGlobalSearchChange = (val: string) => {
    setGlobalSearch(val);
    if (val.trim()) {
      const filtered = storeItems.filter(item => 
        item.title.toLowerCase().includes(val.toLowerCase()) ||
        item.description.toLowerCase().includes(val.toLowerCase())
      ).slice(0, 5);
      setSearchSuggestions(filtered);
      setShowSearchSuggestions(true);
    } else {
      setSearchSuggestions([]);
      setShowSearchSuggestions(false);
    }
  };

  const handleSuggestionSelect = (item: any) => {
    navigate(`/search?q=${encodeURIComponent(item.title)}`);
    setGlobalSearch('');
    setShowSearchSuggestions(false);
  };

  const handleBlurSuggestions = () => {
    // delay to make sure clicked item selects before suggestions close
    setTimeout(() => setShowSearchSuggestions(false), 200);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (catalogRef.current && !catalogRef.current.contains(event.target as Node)) {
        setIsCatalogOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menus on navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsCatalogOpen(false);
  }, [location]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin' && location.pathname !== '/profile') {
      navigate('/profile', { replace: true });
    }
  }, [isAuthenticated, user, location.pathname, navigate]);

  const catalogItems = [
    { name: 'Места', icon: MapPin, path: '/search?category=places', color: 'text-blue-600' },
    { name: 'Экскурсии', icon: Compass, path: '/search?category=excursions', color: 'text-green-600' },
    { name: 'Рестораны', icon: Utensils, path: '/search?category=restaurants', color: 'text-orange-600' },
  ];

  if (isAuthenticated && user?.role === 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 font-sans">
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex-shrink-0 flex items-center gap-3 group">
                <div className="bg-blue-600 p-2 rounded-xl group-hover:rotate-6 transition-transform">
                  <Map className="h-6 w-6 text-white" />
                </div>
                <span className="font-bold text-2xl text-gray-900 hidden lg:block tracking-tight">UralTour</span>
              </Link>
              
              <nav className="hidden md:flex items-center space-x-1">
                {/* Catalog Dropdown */}
                <div className="relative" ref={catalogRef}>
                  <button 
                    onClick={() => setIsCatalogOpen(!isCatalogOpen)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      isCatalogOpen ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Каталог <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isCatalogOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  <AnimatePresence>
                    {isCatalogOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute left-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 overflow-hidden ring-4 ring-black ring-opacity-5"
                      >
                        {catalogItems.map((item) => (
                          <Link
                            key={item.name}
                            to={item.path}
                            className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          >
                            <item.icon className={`w-5 h-5 ${item.color}`} />
                            {item.name}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Link to={isAuthenticated ? "/plans?tab=favorites" : "/auth"} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">
                  <Bookmark className="w-4 h-4" /> Избранное
                </Link>
                
                <Link to={isAuthenticated ? "/plans?tab=constructor" : "/auth"} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">
                  <RouteIcon className="w-4 h-4" /> Конструктор
                </Link>

                <Link to={isAuthenticated ? "/plans?tab=my-routes" : "/auth"} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">
                  <Calendar className="w-4 h-4" /> Мои маршруты
                </Link>
              </nav>
            </div>

             <div className="flex items-center gap-2 lg:gap-4 flex-1 justify-end">
              <div className="relative group hidden lg:block w-full max-w-[240px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Поиск..."
                  value={globalSearch}
                  onChange={(e) => handleGlobalSearchChange(e.target.value)}
                  onFocus={() => globalSearch.trim() && setShowSearchSuggestions(true)}
                  onBlur={handleBlurSuggestions}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && globalSearch.trim()) {
                      const params = new URLSearchParams();
                      params.set('q', globalSearch.trim());
                      navigate(`/search?${params.toString()}`);
                      setGlobalSearch('');
                      setShowSearchSuggestions(false);
                    }
                  }}
                  className="w-full pl-11 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-200 transition-all font-medium"
                />
                <AnimatePresence>
                  {showSearchSuggestions && searchSuggestions.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden max-h-80 overflow-y-auto"
                    >
                      {searchSuggestions.map((item) => (
                        <div 
                          key={item.id}
                          onClick={() => handleSuggestionSelect(item)}
                          className="flex items-center gap-3 p-3 hover:bg-blue-50/50 cursor-pointer transition-colors border-b border-gray-50 last:border-0"
                        >
                          {item.image && <img src={item.image} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-gray-900 truncate">{item.title}</p>
                            <p className="text-[9px] text-gray-400 font-extrabold uppercase">{item.category === 'places' ? 'Место' : 'Экскурсия'}</p>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {isAuthenticated ? (
                <>
                  <div className="hidden sm:flex items-center gap-1">
                    <div className="relative" ref={notificationsRef}>
                      <button 
                        onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                        className={`p-2.5 rounded-xl transition-all relative ${isNotificationsOpen ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`} 
                        title="Уведомления"
                      >
                        <Bell className="w-5 h-5" />
                        {unreadNotifications > 0 && (
                          <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-white text-[10px] font-black rounded-full border-2 border-white flex items-center justify-center">
                            {unreadNotifications}
                          </span>
                        )}
                      </button>
                      <NotificationCenter 
                        isOpen={isNotificationsOpen} 
                        onClose={() => setIsNotificationsOpen(false)} 
                      />
                    </div>
                  </div>

                  <div className="h-8 w-px bg-gray-100 mx-2 hidden sm:block"></div>

                  <Link to="/profile" className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-2xl hover:bg-gray-50 transition-colors group">
                    <div className="hidden sm:block text-right">
                      <p className="text-sm font-bold text-gray-900 leading-none group-hover:text-blue-600 transition-colors">{user?.name}</p>
                      <p className="text-[10px] uppercase tracking-wider font-extrabold text-gray-400 mt-1">
                        {user?.role === 'admin' ? 'Админ' : user?.role === 'partner' ? 'Партнер' : 'Турист'}
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100 ring-2 ring-transparent group-hover:ring-blue-100 transition-all overflow-hidden">
                      {user?.avatar ? (
                        <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-5 w-5" />
                      )}
                    </div>
                  </Link>
                </>
              ) : (
                <Link to="/auth" className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-blue-200 hover:-translate-y-0.5">
                  <LogIn className="h-4 w-4" />
                  <span>Войти</span>
                </Link>
              )}
              
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-gray-100 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-4">
              <div>
                <p className="text-[10px] uppercase font-black text-gray-400 px-4 mb-2 tracking-widest">Каталог</p>
                <div className="grid grid-cols-2 gap-2">
                  {catalogItems.map(item => (
                    <Link key={item.name} to={item.path} className="flex items-center gap-2 p-4 bg-gray-50 rounded-2xl font-bold text-sm text-gray-700">
                      <item.icon className={`w-5 h-5 ${item.color}`} /> {item.name}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <Link to={isAuthenticated ? "/plans?tab=favorites" : "/auth"} className="flex items-center gap-3 p-4 hover:bg-gray-50 rounded-2xl font-bold text-gray-700">
                  <Bookmark className="w-5 h-5 text-gray-400" /> Избранное
                </Link>
                <Link to={isAuthenticated ? "/plans?tab=constructor" : "/auth"} className="flex items-center gap-3 p-4 hover:bg-gray-50 rounded-2xl font-bold text-gray-700">
                  <RouteIcon className="w-5 h-5 text-gray-400" /> Конструктор
                </Link>
                <Link to={isAuthenticated ? "/plans?tab=my-routes" : "/auth"} className="flex items-center gap-3 p-4 hover:bg-gray-50 rounded-2xl font-bold text-gray-700">
                  <Calendar className="w-5 h-5 text-gray-400" /> Мои маршруты
                </Link>
                {isAuthenticated && (
                  <>
                    <Link to="/profile" className="flex items-center gap-3 p-4 hover:bg-gray-50 rounded-2xl font-bold text-gray-700">
                      <Bell className="w-5 h-5 text-gray-400" /> Уведомления
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
              <Link to="/" className="flex items-center gap-3 mb-6">
                <div className="bg-blue-600 p-2 rounded-xl">
                  <Map className="h-6 w-6 text-white" />
                </div>
                <span className="font-bold text-2xl text-gray-900 tracking-tight">UralTour</span>
              </Link>
              <p className="text-gray-500 text-sm leading-relaxed">
                Ваш персональный гид по самым интересным местам Екатеринбурга и Среднего Урала.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-6">Сервис</h4>
              <ul className="space-y-4 text-sm font-medium text-gray-500">
                <li><Link to="/search" className="hover:text-blue-600 transition-colors">Каталог мест</Link></li>
                <li><Link to="/search?category=excursions" className="hover:text-blue-600 transition-colors">Экскурсии</Link></li>
                <li><Link to="/plans?tab=constructor" className="hover:text-blue-600 transition-colors">Конструктор маршрутов</Link></li>
                <li><Link to="/plans?tab=favorites" className="hover:text-blue-600 transition-colors">Избранное</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-6">О проекте</h4>
              <ul className="space-y-4 text-sm font-medium text-gray-500">
                <li className="hover:text-blue-600 transition-colors cursor-pointer">О нас</li>
                <li className="hover:text-blue-600 transition-colors cursor-pointer">Контакты</li>
                <li className="hover:text-blue-600 transition-colors cursor-pointer">Для партнеров</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-6">Поддержка</h4>
              <ul className="space-y-4 text-sm font-medium text-gray-500">
                <li className="hover:text-blue-600 transition-colors cursor-pointer">Помощь</li>
                <li className="hover:text-blue-600 transition-colors cursor-pointer">Политика конфиденциальности</li>
                <li className="hover:text-blue-600 transition-colors cursor-pointer">Условия использования</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm font-bold text-gray-400">&copy; {new Date().getFullYear()} UralTour. Made with ❤️ for Ural.</p>
            <div className="flex gap-6">
              {/* Social icons placeholder */}
              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-all cursor-pointer">VK</div>
              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-all cursor-pointer">TG</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

