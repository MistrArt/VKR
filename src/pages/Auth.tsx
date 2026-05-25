import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useLoginMutation, useRegisterMutation } from '../api';
import { clearAuthTokens } from '../api/authToken';
import { useRefreshSession } from '../components/AuthProvider';
import { setAuthTokensAction, setUser, UserRole, User } from '../store/authSlice';
import { Map, AlertCircle, Loader2, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function getAuthErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: { message?: string } }).data;
    if (data?.message) return data.message;
  }
  if (typeof error === 'object' && error !== null && 'error' in error) {
    const message = (error as { error?: string }).error;
    if (message) return message;
  }
  return 'Произошла ошибка при аутентификации. Проверьте email, пароль и доступность сервера.';
}

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isResetMode, setIsResetMode] = useState(false);
  const [role, setRole] = useState<UserRole>('tourist');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [inn, setInn] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isRequestSent, setIsRequestSent] = useState(false);
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const authState = location.state as {
    from?: { pathname?: string };
    supportReport?: {
      itemId: string;
      itemTitle: string;
      type: string;
      message: string;
      category?: string;
    };
  } | null;
  const from = authState?.from?.pathname || "/";
  const [login] = useLoginMutation();
  const [register] = useRegisterMutation();
  const refreshSession = useRefreshSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    setLoading(true);

    try {
      if (isResetMode) {
        setInfoMessage('Восстановление пароля через API пока не реализовано на сервере.');
        setIsResetMode(false);
      } else if (isLogin) {
        await login({ email, password }).unwrap();
        const loggedInUser = await refreshSession();
        if (authState?.supportReport) {
          const report = authState.supportReport;
          const target =
            loggedInUser?.role === 'partner'
              ? { pathname: '/partner', state: { openSupport: true, supportReport: report } }
              : { pathname: '/profile', state: { activeTab: 'support', supportReport: report } };
          navigate(target, { replace: true });
        } else {
          navigate(from, { replace: true });
        }
      } else {
        if (role === 'partner' && !name) {
          setIsRequestSent(true);
          setInfoMessage('Заявка на партнёрство отправлена (локальная симуляция).');
        } else if (role !== 'tourist') {
          setError('Регистрация партнёра и администратора через API недоступна. Используйте демо-вход.');
        } else {
          const nameParts = name.trim().split(/\s+/);
          const firstName = nameParts[0] || email.split('@')[0] || 'User';
          const lastName = nameParts.slice(1).join(' ') || 'User';

          await register({ email, password, firstName, lastName }).unwrap();
          await refreshSession();
          if (authState?.supportReport) {
            navigate(
              {
                pathname: '/profile',
                state: { activeTab: 'support', supportReport: authState.supportReport },
              },
              { replace: true },
            );
          } else {
            navigate(from, { replace: true });
          }
        }
      }
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (selectedRole: UserRole) => {
    clearAuthTokens();
    dispatch(setAuthTokensAction({ accessToken: null, refreshToken: null }));

    const mockUser: User = {
      id: `quick-${selectedRole}`,
      name:
        selectedRole === 'admin'
          ? 'Иванов Иван Иванович'
          : selectedRole === 'partner'
            ? 'Петрова Анна Сергеевна'
            : 'Сидоров Алексей Дмитриевич',
      email: `${selectedRole}@demo.uraltour.ru`,
      role: selectedRole,
      phone: '+7 (922) 800-44-33',
      birthDate: '1990-05-15',
      gender: selectedRole === 'partner' ? 'female' : 'male',
      favorites: [],
      visitedPlaces: [],
      routes: [],
      ...(selectedRole === 'partner'
        ? {
            partnerType: 'company' as const,
            passport: 'Уральский Экскурсионный Клуб',
          }
        : {}),
    };
    localStorage.setItem('uraltour_user', JSON.stringify(mockUser));
    dispatch(setUser(mockUser));
    navigate(from, { replace: true });
  };

  if (isRequestSent) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md mx-auto bg-white p-10 rounded-3xl shadow-xl border border-gray-100"
        >
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Заявка отправлена!</h2>
          <p className="text-gray-600 mb-8">
            Мы получили ваши данные. Ожидайте ответа администратора.
          </p>
          <Link to="/" className="inline-block w-full py-4 px-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all">
            Вернуться на главную
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sm:mx-auto sm:w-full sm:max-w-md"
      >
        <Link to="/" className="flex justify-center items-center gap-2 group">
          <div className="bg-blue-600 p-2 rounded-xl group-hover:scale-110 transition-transform">
            <Map className="h-8 w-8 text-white" />
          </div>
          <span className="font-bold text-3xl text-gray-900 tracking-tight">UralTour</span>
        </Link>
        <h2 className="mt-8 text-center text-3xl font-extrabold text-gray-900">
          {isResetMode ? 'Восстановление пароля' : (isLogin ? 'С возвращением!' : 'Стать участником')}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isResetMode ? 'Введите ваш email для получения ссылки' : 
            (isLogin ? 'Введите данные для входа' : (role === 'partner' ? 'Регистрация партнера (Юрлица/ИП)' : 'Присоединяйтесь к сообществу путешественников'))}
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-white py-10 px-6 shadow-xl sm:rounded-3xl border border-gray-100 backdrop-blur-lg">
          <AnimatePresence mode="wait">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <motion.div 
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 text-sm"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  {error}
                </motion.div>
              )}

              {infoMessage && (
                <motion.div 
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="bg-green-50 border border-green-100 text-green-600 px-4 py-3 rounded-xl flex items-center gap-3 text-sm"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  {infoMessage}
                </motion.div>
              )}

              {!isResetMode && !isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-6 mb-6"
                >
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-gray-700">Тип аккаунта</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['tourist', 'partner'] as const).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => {
                            setRole(r);
                            setError(null);
                          }}
                          className={`py-3 px-1 border-2 rounded-xl text-xs font-bold transition-all ${
                            role === r
                              ? 'border-blue-600 bg-blue-50 text-blue-600 ring-2 ring-blue-50'
                              : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
                          }`}
                        >
                          {r === 'tourist' ? 'Турист' : 'Партнёр'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {role === 'partner' && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4 pt-2 border-t border-gray-50"
                    >
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          ИНН юрлица, ИП или самозанятого
                        </label>
                        <input
                          type="text"
                          required
                          value={inn}
                          onChange={(e) => setInn(e.target.value)}
                          placeholder="1234567890"
                          className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Название компании (необязательно)
                        </label>
                        <input
                          type="text"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="ООО 'УралТурСервис'"
                          className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                        />
                      </div>
                    </motion.div>
                  )}

                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1">
                      {role === 'partner' ? 'ФИО представителя' : 'Ваше имя'}
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Александр Пушкин"
                      className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    />
                  </div>
                </motion.div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                />
              </div>

              {!isResetMode && (isLogin || role === 'tourist') && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                      Пароль
                    </label>
                    {isLogin && (
                      <button
                        type="button"
                        onClick={() => setIsResetMode(true)}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-500"
                      >
                        Забыли пароль?
                      </button>
                    )}
                  </div>
                  <input
                    id="password"
                    type="password"
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    required={isLogin || role === 'tourist'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  />
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl shadow-lg text-base font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    isResetMode ? 'Сбросить пароль' : (isLogin ? 'Войти' : (role === 'partner' ? 'Отправить заявку' : 'Создать аккаунт'))
                  )}
                </button>
              </div>

              {isResetMode && (
                <button
                  type="button"
                  onClick={() => setIsResetMode(false)}
                  className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-700"
                >
                  <ChevronLeft className="w-4 h-4" /> Вернуться назад
                </button>
              )}
            </form>
          </AnimatePresence>

          {!isResetMode && (
            <div className="mt-8 pt-8 border-t border-gray-100 text-center">
              <div className="bg-gray-50 p-4 rounded-2xl mb-6">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Быстрый вход для теста</p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleQuickLogin('tourist')}
                    className="flex-1 py-2 px-1 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    Турист
                  </button>
                  <button 
                    onClick={() => handleQuickLogin('partner')}
                    className="flex-1 py-2 px-1 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    Партнер
                  </button>
                  <button 
                    onClick={() => handleQuickLogin('admin')}
                    className="flex-1 py-2 px-1 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    Админ
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                {isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setRole('tourist');
                    setError(null);
                    setName('');
                    setInn('');
                    setCompanyName('');
                  }}
                  className="ml-2 font-bold text-blue-600 hover:text-blue-500 transition-colors"
                >
                  {isLogin ? 'Зарегистрироваться' : 'Войти'}
                </button>
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
