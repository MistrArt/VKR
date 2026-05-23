import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { AppNotification, markNotificationAsRead, clearNotifications } from '../store/authSlice';
import { Bell, X, Check, Clock, Calendar, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();
  const notifications = user?.notifications || [];

  const handleMarkAsRead = (id: string) => {
    dispatch(markNotificationAsRead(id));
  };

  const handleClearAll = () => {
    dispatch(clearNotifications());
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (!user) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div 
            className="fixed inset-0 z-[60] bg-black/10 backdrop-blur-[2px] md:hidden" 
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-full md:w-[400px] bg-white rounded-3xl shadow-2xl border border-gray-100 z-[70] overflow-hidden overflow-y-auto max-h-[80vh] md:max-h-[600px]"
          >
            <div className="p-6 border-b border-gray-50 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
              <div>
                <h3 className="font-black text-gray-900 flex items-center gap-2">
                  Уведомления
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Центр обновлений</p>
              </div>
              <div className="flex gap-2">
                {notifications.length > 0 && (
                  <button 
                    onClick={handleClearAll}
                    className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:blue-700"
                  >
                    Очистить
                  </button>
                )}
                <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="py-2">
              {notifications.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-8 h-8 text-gray-200" />
                  </div>
                  <p className="text-gray-400 font-bold text-sm">У вас пока нет уведомлений</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      onClick={() => handleMarkAsRead(notif.id)}
                      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer flex gap-4 ${!notif.isRead ? 'bg-blue-50/30' : ''}`}
                    >
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                        notif.type === 'booking' ? 'bg-blue-100 text-blue-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {notif.type === 'booking' ? <Calendar className="w-5 h-5" /> :
                         <Bell className="w-5 h-5" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="text-sm font-black text-gray-900 line-clamp-1">{notif.title}</h4>
                          <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap ml-2">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 font-medium leading-relaxed line-clamp-2">
                          {notif.message}
                        </p>
                        {notif.link && (
                          <Link 
                            to={notif.link} 
                            onClick={onClose}
                            className="inline-flex items-center gap-1 mt-2 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                          >
                            Посмотреть <ChevronRight className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                      {!notif.isRead && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 shrink-0"></div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {notifications.length > 0 && (
              <div className="p-4 border-t border-gray-50 bg-gray-50/50">
                <Link 
                  to="/profile" 
                  onClick={onClose}
                  className="w-full py-3 bg-white border border-gray-100 text-gray-900 rounded-2xl text-xs font-black uppercase tracking-widest text-center hover:bg-gray-50 block transition-colors"
                >
                  Все уведомления
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationCenter;
