import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { logout } from '../store/authSlice';
import { 
  Settings, Users, MapPin, Activity, Search, Filter, UserX, 
  CheckCircle, Eye, AlertTriangle, BarChart3, Bell, Trash2, 
  Edit2, Check, LogOut, LayoutDashboard, ShieldAlert, FileText, 
  Menu, X, Compass, ChevronRight, Plus, Globe, Shield, RefreshCw 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { mockItems, mockUsers, MockUser, MockItem } from '../data/mockData';

type AdminTab = 'users' | 'tours' | 'points' | 'complaints';

interface AdminDashboardProps {
  onLogout?: () => void;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Local state for demo purposes
  const [users, setUsers] = useState<MockUser[]>(mockUsers);
  const [items, setItems] = useState<MockItem[]>(mockItems);
  const [editingUser, setEditingUser] = useState<MockUser | null>(null);
  const [editingItem, setEditingItem] = useState<MockItem | null>(null);

  if (user?.role !== 'admin') return <div className="p-8">Доступ запрещен</div>;

  const handleToggleUserStatus = (userId: string) => {
    setUsers(prev => prev.map(u => 
      u.id === userId ? { ...u, status: u.status === 'active' ? 'blocked' : 'active' } : u
    ));
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      setUsers(prev => prev.map(u => u.id === editingUser.id ? editingUser : u));
      setEditingUser(null);
    }
  };

  const handleModerateItem = (itemId: string, status: MockItem['status']) => {
    setItems(prev => prev.map(item => item.id === itemId ? { ...item, status } : item));
  };

  const handleDeleteItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleInternalLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      dispatch(logout());
    }
  };

  const navItems = [
    { id: 'users' as const, label: 'Пользователи', icon: Users },
    { id: 'tours' as const, label: 'Модерация туров', icon: MapPin },
    { id: 'points' as const, label: 'Каталог мест', icon: Globe },
    { id: 'complaints' as const, label: 'Жалобы', icon: ShieldAlert },
  ];

  return (
    <div className="fixed inset-0 bg-slate-50 flex overflow-hidden font-sans z-[999]">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }} 
        className="bg-slate-900 text-slate-400 flex flex-col z-50 shadow-2xl transition-all duration-300"
      >
        <div className="p-6 flex items-center justify-between border-b border-slate-800">
          {isSidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                <Compass className="w-5 h-5" />
              </div>
              <span className="font-black text-white uppercase tracking-tighter text-lg">Admin<span className="text-blue-500">Ural</span></span>
            </div>
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="p-2 hover:bg-slate-800 rounded-xl transition-colors"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id)} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                  : 'hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {isSidebarOpen && <span className="font-bold text-sm tracking-tight">{item.label}</span>}
              {isSidebarOpen && activeTab === item.id && (
                <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2">
          {isSidebarOpen && (
            <div className="flex items-center gap-3 px-4 py-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-black text-white uppercase">AD</div>
              <div className="overflow-hidden">
                <p className="text-xs font-black text-white truncate">{user.name}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Root Admin</p>
              </div>
            </div>
          )}
          <button 
            onClick={handleInternalLogout} 
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all font-bold text-sm"
          >
            <LogOut className="w-5 h-5" />
            {isSidebarOpen && <span>Выйти</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {navItems.find(i => i.id === activeTab)?.label}
            </h2>
          </div>
        </header>

        {/* Dynamic Body */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
          <AnimatePresence mode="wait">
            {activeTab === 'users' && (
              <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                {/* Stats Panel */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between group hover:shadow-lg transition-all">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Всего партнеров (туроператоров)</p>
                      <p className="text-3xl font-black text-slate-900 tracking-tight">
                        {users.filter(u => u.role === 'partner').length}
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
                      <Users className="w-6 h-6" />
                    </div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between group hover:shadow-lg transition-all">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Всего туристов (путешественников)</p>
                      <p className="text-3xl font-black text-slate-900 tracking-tight">
                        {users.filter(u => u.role === 'tourist').length}
                      </p>
                    </div>
                    <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Users className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Поиск по имени, почте, телефону..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-blue-50 outline-none transition-all shadow-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button className="px-5 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20">
                      <Plus className="w-4 h-4" /> Добавить пользователя
                    </button>
                    <button className="px-5 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all">
                      <Filter className="w-4 h-4" /> Фильтры
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-500 tracking-widest">Профиль</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-500 tracking-widest">Информация</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-500 tracking-widest">Статус</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-500 tracking-widest">Регистрация</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-500 tracking-widest text-right">Управление</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {users.filter(u => u.role !== 'admin' && (u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()))).map(u => (
                          <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center font-black text-sm uppercase">
                                  {u.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-sm font-black text-slate-900">{u.name}</p>
                                  <p className="text-[11px] font-bold text-slate-400 lowercase">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg border ${
                                u.role === 'admin' ? 'bg-red-50 text-red-600 border-red-100' :
                                u.role === 'partner' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                'bg-blue-50 text-blue-600 border-blue-100'
                              }`}>
                                {u.role === 'admin' ? 'Админ' : u.role === 'partner' ? 'Туроператор' : 'Турист'}
                              </span>
                            </td>
                            <td className="px-8 py-5">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black ${u.status === 'active' ? 'text-emerald-600' : 'text-red-500'}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 'bg-red-500'}`} />
                                {u.status === 'active' ? 'Активен' : 'Бан'}
                              </span>
                            </td>
                            <td className="px-8 py-5 font-bold text-xs text-slate-400 tracking-tighter">
                              {u.createdAt}
                            </td>
                            <td className="px-8 py-5 text-right">
                              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => handleToggleUserStatus(u.id)} 
                                  className={`p-2 rounded-xl transition-all ${u.status === 'active' ? 'text-slate-400 hover:bg-red-50 hover:text-red-600' : 'text-red-500 hover:bg-emerald-50 hover:text-emerald-600'}`}
                                  title={u.status === 'active' ? 'Заблокировать' : 'Разблокировать'}
                                >
                                  {u.status === 'active' ? <UserX size={20} /> : <CheckCircle size={20} />}
                                </button>
                                <button 
                                  onClick={() => setEditingUser(u)}
                                  className="p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all"
                                >
                                  <Edit2 size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'tours' && (
              <motion.div key="tours" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Модерация опубликованных туров</h3>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Объекты от туроператоров, ожидающие проверки</p>
                  </div>
                  <div className="flex bg-slate-200 p-1 rounded-2xl">
                     <button className="px-6 py-2 bg-white text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">Все (8)</button>
                     <button className="px-6 py-2 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-slate-700 transition-colors">Только новые (2)</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {items.filter(item => item.status === 'pending' || item.id === '4').map(item => (
                    <div key={item.id} className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden flex flex-col group hover:shadow-2xl transition-all duration-500">
                      <div className="relative aspect-[16/10] overflow-hidden">
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                        <div className="absolute top-6 left-6">
                          <span className="px-3 py-1.5 bg-yellow-400 text-xs font-black uppercase tracking-widest rounded-lg shadow-xl shadow-yellow-400/20">На модерации</span>
                        </div>
                      </div>
                      <div className="p-8 flex flex-col flex-1">
                        <h4 className="text-lg font-black text-slate-900 mb-2 truncate group-hover:text-blue-600 transition-colors">{item.title}</h4>
                        <p className="text-xs text-slate-500 font-medium mb-6 line-clamp-3 leading-relaxed italic italic">"{item.description}"</p>
                        
                        <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleModerateItem(item.id, 'active')} 
                              className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                              title="Опубликовать"
                            >
                              <Check className="w-6 h-6" />
                            </button>
                            <button 
                              onClick={() => handleModerateItem(item.id, 'rejected')} 
                              className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm"
                              title="Отклонить"
                            >
                              <X className="w-6 h-6" />
                            </button>
                          </div>
                          <button className="flex items-center gap-1.5 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:bg-blue-50 px-4 py-2 rounded-xl transition-all">
                             <Eye size={12} /> Полный предпросмотр
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'points' && (
              <motion.div key="points" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="flex items-center justify-between bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white">
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter">Управление каталогом достопримечательностей</h3>
                    <p className="text-slate-400 text-sm mt-1">Добавление, редактирование и удаление локаций из публичного доступа</p>
                  </div>
                  <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-blue-600/30">
                    <Plus size={16} /> Новое место
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {items.filter(i => i.status === 'active').slice(0, 8).map(point => (
                    <div key={point.id} className="bg-white p-4 rounded-[2rem] border border-slate-200 group hover:border-blue-500 transition-all shadow-sm">
                      <div className="relative aspect-square overflow-hidden rounded-[1.5rem] mb-4">
                        <img src={point.image} alt={point.title} className="w-full h-full object-cover" />
                        <div className="absolute top-3 right-3 flex gap-1 transform translate-x-12 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                          <button onClick={() => setEditingItem(point)} className="w-8 h-8 bg-white/90 backdrop-blur-md rounded-lg flex items-center justify-center text-slate-700 hover:bg-blue-600 hover:text-white transition-colors">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDeleteItem(point.id)} className="w-8 h-8 bg-white/90 backdrop-blur-md rounded-lg flex items-center justify-center text-red-500 hover:bg-red-600 hover:text-white transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <h5 className="font-black text-slate-900 text-sm mb-1 truncate">{point.title}</h5>
                      <div className="flex items-center justify-between">
                         <span className="text-[10px] font-bold text-slate-400">{point.price} ₽</span>
                         <span className="text-[9px] font-black text-emerald-600 uppercase">Опубликовано</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'complaints' && (
              <motion.div key="complaints" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="bg-red-50 border border-red-100 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8 mb-8 shadow-sm">
                  <div className="w-20 h-20 bg-red-500 text-white rounded-[2rem] flex items-center justify-center shadow-xl shadow-red-500/30">
                    <ShieldAlert size={40} />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-xl font-black text-red-900 uppercase">Центр контроля безопасности и жалоб</h3>
                    <p className="text-red-700/70 font-medium text-sm mt-1">Здесь обрабатываются претензии пользователей к контенту или организаторам платформы.</p>
                  </div>
                  <div className="text-center md:text-right">
                     <p className="text-5xl font-black text-red-900 tracking-tighter">2</p>
                     <p className="text-[10px] text-red-800/50 font-black uppercase tracking-widest">Активные жалобы</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { id: '1', user: 'Иван Иванов', target: 'Обзорная экскурсия', reason: 'Недостоверная информация', date: '6 ч. назад', status: 'new' },
                    { id: '2', user: 'Мария Петрова', target: 'Туроператор "УралГид"', reason: 'Недостойное поведение', date: '1 день назад', status: 'processing' },
                  ].map((complaint) => (
                    <div key={complaint.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-8 group hover:border-red-200 hover:shadow-xl transition-all duration-500">
                      <div className="flex gap-6">
                        <div className="w-16 h-16 bg-slate-50 text-red-500 rounded-3xl flex items-center justify-center shrink-0 group-hover:bg-red-50 transition-colors shadow-inner">
                          <AlertTriangle className="w-8 h-8" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                             <h4 className="text-xl font-black text-slate-900 tracking-tight">{complaint.reason}</h4>
                             <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                              complaint.status === 'new' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'bg-blue-100 text-blue-600'
                            }`}>
                              {complaint.status === 'new' ? 'Критично' : 'В работе'}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-slate-500">
                            От: <span className="font-black text-slate-900">{complaint.user}</span> на 
                            <span className="font-black text-slate-900 ml-1 underline decoration-blue-500 underline-offset-4">{complaint.target}</span>
                          </p>
                          <p className="text-[10px] text-slate-400 font-black mt-2 tracking-widest uppercase">{complaint.date}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all">Принять меры</button>
                        <button className="px-6 py-3 bg-white border border-slate-200 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">Игнорировать</button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* Edit User Modal */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl">
              <div className="p-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-900">Редактирование пользователя</h3>
                <button onClick={() => setEditingUser(null)} className="p-2 hover:bg-slate-200 rounded-xl transition-all"><X size={20} /></button>
              </div>
              <form onSubmit={handleSaveUser} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 ml-1">Имя пользователя</label>
                    <input type="text" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 font-bold transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 ml-1">Email</label>
                    <input type="email" value={editingUser.email} onChange={e => setEditingUser({...editingUser, email: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 font-bold transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 ml-1">Роль</label>
                    <select value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value as any})} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 font-bold transition-all appearance-none cursor-pointer">
                      <option value="tourist">Турист</option>
                      <option value="partner">Туроператор</option>
                      <option value="admin">Администратор</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                   <button type="submit" className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all">Сохранить</button>
                   <button type="button" onClick={() => setEditingUser(null)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Отмена</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
}
