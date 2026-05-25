import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { logout, updateMockItem, deleteMockItem, addMockItem } from '../store/authSlice';
import AdminTourModerationModal from '../components/AdminTourModerationModal';
import AdminPlaceFormModal from '../components/AdminPlaceFormModal';
import {
  authorRoleLabel,
  formatComplaintDate,
  getOpenComplaints,
  type AdminComplaint,
} from '../utils/adminComplaints';
import { 
  Settings, Users, MapPin, Activity, Search, UserX, 
  CheckCircle, Eye, AlertTriangle, BarChart3, Bell, Trash2, 
  Edit2, Check, LogOut, LayoutDashboard, ShieldAlert, FileText, 
  Menu, X, Compass, ChevronRight, Plus, Globe, Shield, RefreshCw, Mail, Copy,
} from 'lucide-react';
import {
  generateRandomPassword,
  sendPartnerInviteEmail,
} from '../utils/adminUserInvite';
import { getPartnerRoleLabel } from '../utils/partnerRoleLabels';
import { motion, AnimatePresence } from 'motion/react';
import { mockUsers, MockUser, MockItem, MockPartnerType } from '../data/mockData';

type AdminTab = 'users' | 'tours' | 'points' | 'complaints';
type UserListRole = 'tourist' | 'partner';
type TourModerationFilter = 'all' | 'pending';
type ComplaintListFilter = 'all' | 'tourist' | 'partner';

const EDITABLE_ROLES = ['tourist', 'partner'] as const;

function formatTodayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function matchesUserSearch(u: MockUser, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    u.name.toLowerCase().includes(q) ||
    u.email.toLowerCase().includes(q) ||
    (u.phone?.toLowerCase().includes(q) ?? false)
  );
}

function filterUsersList(
  users: MockUser[],
  searchQuery: string,
  listRole: UserListRole,
): MockUser[] {
  return users.filter((u) => {
    if (u.role === 'admin') return false;
    if (u.role !== listRole) return false;
    return matchesUserSearch(u, searchQuery);
  });
}

function displayPartnerName(u: MockUser): string {
  if (u.partnerType === 'company' && u.companyName) {
    return `${u.name} · ${u.companyName}`;
  }
  return u.name;
}

interface NewGuideForm {
  fullName: string;
  companyName: string;
  email: string;
  phone: string;
  partnerType: MockPartnerType;
}

const emptyGuideForm = (): NewGuideForm => ({
  fullName: '',
  companyName: '',
  email: '',
  phone: '',
  partnerType: 'individual',
});

interface AdminDashboardProps {
  onLogout?: () => void;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const user = useSelector((state: RootState) => state.auth.user);
  const items = useSelector((state: RootState) => state.auth.items);
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userListRole, setUserListRole] = useState<UserListRole>('partner');
  const [addingGuide, setAddingGuide] = useState(false);
  const [newGuideForm, setNewGuideForm] = useState<NewGuideForm>(emptyGuideForm);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [inviteFeedback, setInviteFeedback] = useState<string | null>(null);
  const [tourModerationFilter, setTourModerationFilter] = useState<TourModerationFilter>('pending');
  const [moderationTour, setModerationTour] = useState<MockItem | null>(null);
  const [complaints, setComplaints] = useState<AdminComplaint[]>(() => getOpenComplaints());
  const [complaintFilter, setComplaintFilter] = useState<ComplaintListFilter>('all');
  const [placeFormOpen, setPlaceFormOpen] = useState(false);
  const [placeFormItem, setPlaceFormItem] = useState<MockItem | null>(null);

  const [users, setUsers] = useState<MockUser[]>(mockUsers);
  const [editingUser, setEditingUser] = useState<MockUser | null>(null);

  const catalogPlaces = useMemo(
    () => items.filter((i) => i.category === 'places'),
    [items],
  );

  const filteredUsers = filterUsersList(users, searchQuery, userListRole);

  const openAddGuideModal = () => {
    setNewGuideForm(emptyGuideForm());
    setGeneratedPassword(generateRandomPassword());
    setInviteFeedback(null);
    setAddingGuide(true);
  };

  const moderationQueue = items.filter(
    (i) =>
      i.category === 'excursions' &&
      (i.status === 'pending' || i.status === 'revision'),
  );
  const displayedModerationTours =
    tourModerationFilter === 'pending'
      ? moderationQueue.filter((i) => i.status === 'pending')
      : moderationQueue;

  const refreshComplaints = () => setComplaints(getOpenComplaints());

  const filteredComplaints = complaints.filter((c) => {
    if (complaintFilter === 'all') return true;
    return c.authorRole === complaintFilter;
  });

  useEffect(() => {
    if (activeTab === 'complaints') {
      refreshComplaints();
    }
  }, [activeTab]);

  if (user?.role !== 'admin') return <div className="p-8">Доступ запрещен</div>;

  const handleToggleUserStatus = (userId: string) => {
    setUsers(prev => prev.map(u => 
      u.id === userId ? { ...u, status: u.status === 'active' ? 'blocked' : 'active' } : u
    ));
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || editingUser.role === 'admin') return;
    const role = EDITABLE_ROLES.includes(editingUser.role as (typeof EDITABLE_ROLES)[number])
      ? editingUser.role
      : 'tourist';
    const saved: MockUser = {
      ...editingUser,
      role,
      partnerType: role === 'partner' ? editingUser.partnerType ?? 'individual' : undefined,
      companyName:
        role === 'partner' && editingUser.partnerType === 'company'
          ? editingUser.companyName?.trim() || undefined
          : undefined,
    };
    setUsers((prev) => prev.map((u) => (u.id === saved.id ? saved : u)));
    setEditingUser(null);
  };

  const handleAddGuide = (e: React.FormEvent) => {
    e.preventDefault();
    const fullName = newGuideForm.fullName.trim();
    const email = newGuideForm.email.trim();
    const phone = newGuideForm.phone.trim();
    const companyName = newGuideForm.companyName.trim();

    if (!fullName || !email || !phone) {
      setInviteFeedback('Заполните ФИО, email и телефон.');
      return;
    }
    if (newGuideForm.partnerType === 'company' && !companyName) {
      setInviteFeedback('Укажите название компании.');
      return;
    }

    const password = generatedPassword || generateRandomPassword();
    const newUser: MockUser = {
      id: `partner-${Date.now()}`,
      name: fullName,
      email,
      phone,
      role: 'partner',
      partnerType: newGuideForm.partnerType,
      companyName: newGuideForm.partnerType === 'company' ? companyName : undefined,
      status: 'active',
      createdAt: formatTodayIso(),
    };

    sendPartnerInviteEmail({
      email,
      fullName,
      password,
      partnerType: newGuideForm.partnerType,
      companyName: newGuideForm.partnerType === 'company' ? companyName : undefined,
      phone,
    });

    setUsers((prev) => [...prev, newUser]);
    setInviteFeedback(`Гид создан. Пароль отправлен на ${email} (откроется почтовый клиент).`);
    setTimeout(() => {
      setAddingGuide(false);
      setNewGuideForm(emptyGuideForm());
      setGeneratedPassword('');
      setInviteFeedback(null);
      setUserListRole('partner');
    }, 2200);
  };

  const openEditUser = (u: MockUser) => {
    if (u.role === 'admin') return;
    setEditingUser({ ...u });
  };

  const handleApplyModerationTour = (updated: MockItem) => {
    dispatch(updateMockItem(updated));
    setModerationTour(null);
  };

  const handleDeletePlace = (itemId: string) => {
    dispatch(deleteMockItem(itemId));
  };

  const handleSavePlace = (item: MockItem) => {
    const exists = items.some((i) => i.id === item.id);
    if (exists) {
      dispatch(updateMockItem(item));
    } else {
      dispatch(addMockItem(item));
    }
  };

  const handleResolveComplaint = (id: string) => {
    resolveComplaint(id, '');
    refreshComplaints();
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
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Всего гидов</p>
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

                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex bg-slate-200 p-1 rounded-2xl self-start">
                    <button
                      type="button"
                      onClick={() => setUserListRole('tourist')}
                      className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        userListRole === 'tourist'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Туристы
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserListRole('partner')}
                      className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        userListRole === 'partner'
                          ? 'bg-white text-purple-600 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Гиды
                    </button>
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
                  {userListRole === 'partner' && (
                    <button
                      type="button"
                      onClick={openAddGuideModal}
                      className="px-5 py-3 bg-purple-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-purple-700 transition-all shadow-lg shadow-purple-600/20 shrink-0"
                    >
                      <Plus className="w-4 h-4" /> Добавить гида
                    </button>
                  )}
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
                        {filteredUsers.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-8 py-12 text-center text-sm font-bold text-slate-400">
                              Пользователи не найдены
                            </td>
                          </tr>
                        )}
                        {filteredUsers.map(u => (
                          <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center font-black text-sm uppercase">
                                  {u.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-sm font-black text-slate-900">
                                    {u.role === 'partner' ? displayPartnerName(u) : u.name}
                                  </p>
                                  <p className="text-[11px] font-bold text-slate-400 lowercase">{u.email}</p>
                                  {u.phone && (
                                    <p className="text-[10px] font-bold text-slate-400">{u.phone}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg border ${
                                u.role === 'partner'
                                  ? 'bg-purple-50 text-purple-600 border-purple-100'
                                  : 'bg-blue-50 text-blue-600 border-blue-100'
                              }`}>
                                {u.role === 'partner' ? getPartnerRoleLabel(u.partnerType) : 'Турист'}
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
                                  onClick={() => openEditUser(u)}
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Модерация туров</h3>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">
                      Карточки экскурсий от гидов
                    </p>
                  </div>
                  <div className="flex bg-slate-200 p-1 rounded-2xl self-start">
                    <button
                      type="button"
                      onClick={() => setTourModerationFilter('all')}
                      className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        tourModerationFilter === 'all'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Все ({moderationQueue.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTourModerationFilter('pending')}
                      className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        tourModerationFilter === 'pending'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Только новые ({moderationQueue.filter((i) => i.status === 'pending').length})
                    </button>
                  </div>
                </div>

                {displayedModerationTours.length === 0 ? (
                  <div className="bg-white rounded-[2rem] border border-slate-200 p-12 text-center">
                    <p className="text-sm font-bold text-slate-400">Нет туров в очереди модерации</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {displayedModerationTours.map((item) => {
                      const partner = users.find((u) => u.id === item.partnerId);
                      return (
                        <div
                          key={item.id}
                          className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden flex flex-col group hover:shadow-2xl transition-all duration-500"
                        >
                          <div className="relative aspect-[16/10] overflow-hidden">
                            <img
                              src={item.image}
                              alt={item.title}
                              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                            />
                            <div className="absolute top-6 left-6">
                              <span
                                className={`px-3 py-1.5 text-xs font-black uppercase tracking-widest rounded-lg shadow-xl ${
                                  item.status === 'revision'
                                    ? 'bg-amber-400 text-black shadow-amber-400/20'
                                    : 'bg-yellow-400 text-black shadow-yellow-400/20'
                                }`}
                              >
                                {item.status === 'revision' ? 'Повторная проверка' : 'На модерации'}
                              </span>
                            </div>
                          </div>
                          <div className="p-8 flex flex-col flex-1">
                            <h4 className="text-lg font-black text-slate-900 mb-1 truncate group-hover:text-blue-600 transition-colors">
                              {item.title}
                            </h4>
                            {partner && (
                              <p className="text-[10px] font-bold text-purple-600 mb-2 truncate">{partner.name}</p>
                            )}
                            <p className="text-xs text-slate-500 font-medium mb-4 line-clamp-3 leading-relaxed">
                              {item.description}
                            </p>
                            <div className="mt-auto pt-6 border-t border-slate-50">
                              <button
                                type="button"
                                onClick={() => setModerationTour(item)}
                                className="w-full flex items-center justify-center gap-2 text-[10px] font-black text-white uppercase tracking-widest bg-blue-600 hover:bg-blue-700 px-4 py-3.5 rounded-2xl transition-all shadow-lg shadow-blue-600/20"
                              >
                                <Eye size={14} />
                                Проверить и решить
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'points' && (
              <motion.div key="points" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="flex items-center justify-between bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white">
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter">Управление каталогом достопримечательностей</h3>
                    <p className="text-slate-400 text-sm mt-1">Добавление, редактирование и удаление локаций из публичного доступа</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPlaceFormItem(null);
                      setPlaceFormOpen(true);
                    }}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-blue-600/30"
                  >
                    <Plus size={16} /> Новое место
                  </button>
                </div>

                {catalogPlaces.length === 0 ? (
                  <div className="bg-white rounded-[2rem] border border-slate-200 p-12 text-center">
                    <p className="text-sm font-bold text-slate-400">В каталоге пока нет мест</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {catalogPlaces.map((point) => (
                      <div
                        key={point.id}
                        className="bg-white p-4 rounded-[2rem] border border-slate-200 group hover:border-blue-500 transition-all shadow-sm"
                      >
                        <div className="relative aspect-square overflow-hidden rounded-[1.5rem] mb-4">
                          <img src={point.image} alt={point.title} className="w-full h-full object-cover" />
                          <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => {
                                setPlaceFormItem(point);
                                setPlaceFormOpen(true);
                              }}
                              className="w-8 h-8 bg-white/90 backdrop-blur-md rounded-lg flex items-center justify-center text-slate-700 hover:bg-blue-600 hover:text-white transition-colors"
                              title="Редактировать"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Удалить «${point.title}» из сервиса?`)) {
                                  handleDeletePlace(point.id);
                                }
                              }}
                              className="w-8 h-8 bg-white/90 backdrop-blur-md rounded-lg flex items-center justify-center text-red-500 hover:bg-red-600 hover:text-white transition-colors"
                              title="Удалить"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        <h5 className="font-black text-slate-900 text-sm mb-1 truncate">{point.title}</h5>
                        <p className="text-[10px] font-bold text-slate-400 truncate mb-2">
                          {point.district || '—'}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400">
                            {point.price > 0 ? `${point.price} ₽` : 'Бесплатно'}
                          </span>
                          <span className="text-[9px] font-black text-emerald-600 uppercase">
                            В каталоге
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'complaints' && (
              <motion.div key="complaints" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <p className="text-sm font-bold text-slate-500">
                    Активных жалоб: <span className="text-slate-900">{filteredComplaints.length}</span>
                  </p>
                  <div className="flex bg-slate-200 p-1 rounded-2xl">
                    {([
                      { id: 'all' as const, label: 'Все' },
                      { id: 'tourist' as const, label: 'Туристы' },
                      { id: 'partner' as const, label: 'Гиды' },
                    ]).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setComplaintFilter(opt.id)}
                        className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          complaintFilter === opt.id
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredComplaints.length === 0 ? (
                  <div className="bg-white rounded-[2rem] border border-slate-200 p-12 text-center">
                    <p className="text-sm font-bold text-slate-400">Нет активных жалоб</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredComplaints.map((complaint) => (
                      <div
                        key={complaint.id}
                        className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:border-red-200 hover:shadow-lg transition-all"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                          <div className="flex gap-4 min-w-0">
                            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center shrink-0">
                              <AlertTriangle className="w-7 h-7" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h4 className="text-lg font-black text-slate-900">{complaint.typeLabel}</h4>
                                <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600">
                                  {authorRoleLabel(complaint.authorRole)}
                                </span>
                              </div>
                              <p className="text-sm font-medium text-slate-500">
                                <span className="font-black text-slate-800">{complaint.authorName}</span>
                                {' · '}
                                {complaint.authorEmail}
                              </p>
                              {complaint.relatedItemTitle && (
                                <p className="text-sm font-bold text-slate-700 mt-1 truncate">
                                  {complaint.relatedItemTitle}
                                </p>
                              )}
                              <p className="text-sm text-slate-600 mt-2 line-clamp-2">{complaint.message}</p>
                              <p className="text-[10px] text-slate-400 font-black mt-2 tracking-widest uppercase">
                                {formatComplaintDate(complaint.createdAt)}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleResolveComplaint(complaint.id)}
                            className="shrink-0 px-6 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all"
                          >
                            Рассмотрел
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* Добавление гида */}
      <AnimatePresence>
        {addingGuide && (
          <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl max-h-[92vh] overflow-y-auto"
            >
              <div className="p-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
                <h3 className="text-lg font-black text-slate-900">Новый гид</h3>
                <button
                  type="button"
                  onClick={() => {
                    setAddingGuide(false);
                    setNewGuideForm(emptyGuideForm());
                    setGeneratedPassword('');
                    setInviteFeedback(null);
                  }}
                  className="p-2 hover:bg-slate-200 rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleAddGuide} className="p-8 space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 ml-1">
                    Тип гида
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setNewGuideForm({ ...newGuideForm, partnerType: 'individual', companyName: '' })
                      }
                      className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                        newGuideForm.partnerType === 'individual'
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      Гид — частный гид
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewGuideForm({ ...newGuideForm, partnerType: 'company' })}
                      className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                        newGuideForm.partnerType === 'company'
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      Гид — туркомпания
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 ml-1">
                    ФИО
                  </label>
                  <input
                    type="text"
                    required
                    value={newGuideForm.fullName}
                    onChange={(e) => setNewGuideForm({ ...newGuideForm, fullName: e.target.value })}
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 font-bold transition-all"
                    placeholder="Иванов Иван Иванович"
                  />
                </div>

                {newGuideForm.partnerType === 'company' && (
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 ml-1">
                      Название компании
                    </label>
                    <input
                      type="text"
                      required
                      value={newGuideForm.companyName}
                      onChange={(e) => setNewGuideForm({ ...newGuideForm, companyName: e.target.value })}
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 font-bold transition-all"
                      placeholder="Уральский Экскурсионный Клуб"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 ml-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={newGuideForm.email}
                    onChange={(e) => setNewGuideForm({ ...newGuideForm, email: e.target.value })}
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 font-bold transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 ml-1">
                    Телефон
                  </label>
                  <input
                    type="tel"
                    required
                    value={newGuideForm.phone}
                    onChange={(e) => setNewGuideForm({ ...newGuideForm, phone: e.target.value })}
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 font-bold transition-all"
                    placeholder="+7 (___) ___-__-__"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 ml-1">
                    Пароль для входа
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedPassword}
                      className="flex-1 px-5 py-3 bg-slate-100 border border-slate-200 rounded-2xl font-mono text-sm font-bold text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => setGeneratedPassword(generateRandomPassword())}
                      className="px-4 py-3 bg-slate-200 hover:bg-slate-300 rounded-2xl transition-colors"
                      title="Сгенерировать заново"
                    >
                      <RefreshCw className="w-4 h-4 text-slate-700" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (generatedPassword) navigator.clipboard?.writeText(generatedPassword);
                      }}
                      className="px-4 py-3 bg-slate-200 hover:bg-slate-300 rounded-2xl transition-colors"
                      title="Копировать"
                    >
                      <Copy className="w-4 h-4 text-slate-700" />
                    </button>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 mt-2 ml-1 flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    При создании пароль уйдёт на указанный email
                  </p>
                </div>

                {inviteFeedback && (
                  <p className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                    {inviteFeedback}
                  </p>
                )}

                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all"
                  >
                    Создать и отправить на почту
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAddingGuide(false);
                      setNewGuideForm(emptyGuideForm());
                      setGeneratedPassword('');
                      setInviteFeedback(null);
                    }}
                    className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                  >
                    Отмена
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit User Modal */}
      <AnimatePresence>
        {editingUser && editingUser.role !== 'admin' && (
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
                    <select
                      value={editingUser.role === 'partner' ? 'partner' : 'tourist'}
                      onChange={(e) => {
                        const role = e.target.value as 'tourist' | 'partner';
                        setEditingUser({
                          ...editingUser,
                          role,
                          partnerType: role === 'partner' ? (editingUser.partnerType ?? 'individual') : undefined,
                        });
                      }}
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 font-bold transition-all appearance-none cursor-pointer"
                    >
                      <option value="tourist">Турист</option>
                      <option value="partner">Гид</option>
                    </select>
                    <p className="text-[10px] text-slate-400 font-bold mt-2 ml-1">
                      Роль администратора нельзя назначать через панель управления.
                    </p>
                  </div>
                  {editingUser.role === 'partner' && (
                    <>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 ml-1">Тип</label>
                        <select
                          value={editingUser.partnerType ?? 'individual'}
                          onChange={(e) =>
                            setEditingUser({
                              ...editingUser,
                              partnerType: e.target.value as MockPartnerType,
                              companyName:
                                e.target.value === 'company' ? editingUser.companyName : undefined,
                            })
                          }
                          className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 font-bold transition-all appearance-none cursor-pointer"
                        >
                          <option value="individual">Гид — частный гид</option>
                          <option value="company">Гид — туркомпания</option>
                        </select>
                      </div>
                      {editingUser.partnerType === 'company' && (
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 ml-1">
                            Название компании
                          </label>
                          <input
                            type="text"
                            value={editingUser.companyName ?? ''}
                            onChange={(e) =>
                              setEditingUser({ ...editingUser, companyName: e.target.value })
                            }
                            className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 font-bold transition-all"
                          />
                        </div>
                      )}
                    </>
                  )}
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

      <AdminTourModerationModal
        tour={moderationTour}
        users={users}
        onClose={() => setModerationTour(null)}
        onApply={handleApplyModerationTour}
      />

      <AdminPlaceFormModal
        open={placeFormOpen}
        item={placeFormItem}
        onClose={() => {
          setPlaceFormOpen(false);
          setPlaceFormItem(null);
        }}
        onSave={handleSavePlace}
        onDelete={handleDeletePlace}
      />

      <style>{`
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
}
