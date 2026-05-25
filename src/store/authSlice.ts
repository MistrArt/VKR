import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { mockItems, MockItem } from '../data/mockData';
import { clearAuthTokens, getAccessToken, setAuthTokens as persistAuthTokens } from '../api/authToken';
import { pushPartnerInbox } from '../utils/partnerNotifications';

export type UserRole = 'tourist' | 'partner' | 'admin';

export interface CustomRoute {
  id: string;
  title: string;
  startPoint: string;
  endPoint: string;
  startCoords?: [number, number];
  endCoords?: [number, number];
  waypoints: string[];
  createdAt: string;
  /** Отмечен туристом как пройденный. */
  completedAt?: string;
}

/** Посещённая локация из пройденного маршрута (только турист). */
export interface VisitedPlace {
  id: string;
  itemId: string;
  visitedAt: string;
  routeId?: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'declined';

export type NotificationType = 'booking' | 'system';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export interface Booking {
  id: string;
  itemId: string;
  itemTitle: string;
  touristId: string;
  touristName: string;
  partnerId: string;
  status: BookingStatus;
  date: string;
  createdAt: string;
  touristPhone?: string;
  touristEmail?: string;
  /** Кто инициировал отказ (только при status === 'declined'). */
  declinedBy?: 'tourist' | 'partner';
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  birthDate?: string;
  /** male | female | other */
  gender?: string;
  passport?: string;
  diplomas?: string;
  favorites: string[];
  /** История посещений (ваши приключения). */
  visitedPlaces?: VisitedPlace[];
  routes?: CustomRoute[];
  bookings?: Booking[];
  notifications?: AppNotification[];
  partnerType?: 'individual' | 'company';
  certificates?: { id: string; title: string; fileUrl: string; uploadDate: string }[];
}

const MOCK_CATALOG_VERSION = '5';

const getStoredItems = (): MockItem[] => {
  const storedVersion = localStorage.getItem('uraltour_items_version');
  if (storedVersion !== MOCK_CATALOG_VERSION) {
    localStorage.removeItem('uraltour_items');
    localStorage.setItem('uraltour_items_version', MOCK_CATALOG_VERSION);
    return mockItems;
  }

  const stored = localStorage.getItem('uraltour_items');
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as MockItem[];
      return parsed.filter((item) => item.id !== '6' && item.title !== 'Красная линия');
    } catch (e) {
      console.error(e);
    }
  }
  return mockItems;
};

const getStoredBookings = (): Booking[] => {
  const stored = localStorage.getItem('uraltour_bookings');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
  }
  return [
    {
      id: "b1",
      itemId: "ex1",
      itemTitle: "Тайны старого Екатеринбурга",
      touristId: "tourist-1",
      touristName: "Анна Петрова",
      partnerId: "partner-1",
      status: "pending",
      date: "25.05.2026",
      createdAt: new Date().toISOString(),
      touristPhone: "+7 (912) 654-32-10",
      touristEmail: "anna.petrova@mail.ru"
    },
    {
      id: "b2",
      itemId: "ex2",
      itemTitle: "Слет уральских мастеров",
      touristId: "tourist-2",
      touristName: "Дмитрий Смирнов",
      partnerId: "partner-1",
      status: "confirmed",
      date: "28.05.2026",
      createdAt: new Date().toISOString(),
      touristPhone: "+7 (922) 111-22-33",
      touristEmail: "dima.smirnov@gmail.com"
    }
  ];
};

const getStoredRoutes = (): CustomRoute[] => {
  const stored = localStorage.getItem('uraltour_routes');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
  }
  const storedUser = localStorage.getItem('uraltour_user');
  if (storedUser) {
    try {
      const parsed = JSON.parse(storedUser);
      if (parsed && parsed.routes) {
        return parsed.routes;
      }
    } catch (e) {}
  }
  return [];
};

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  items: MockItem[];
  bookings: Booking[];
  routes: CustomRoute[];
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  accessToken: getAccessToken(),
  refreshToken: null,
  items: getStoredItems(),
  bookings: getStoredBookings(),
  routes: getStoredRoutes(),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      if (action.payload) {
        state.user = {
          ...action.payload,
          favorites: action.payload.favorites ?? [],
          visitedPlaces: action.payload.visitedPlaces ?? [],
        };
      } else {
        state.user = null;
      }
      state.isAuthenticated = !!action.payload;
      state.isLoading = false;
      if (action.payload) {
        localStorage.setItem('uraltour_user', JSON.stringify(state.user));
      } else {
        localStorage.removeItem('uraltour_user');
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setAuthTokens: (
      state,
      action: PayloadAction<{ accessToken?: string; refreshToken?: string }>,
    ) => {
      if (action.payload.accessToken !== undefined) {
        state.accessToken = action.payload.accessToken;
      }
      if (action.payload.refreshToken !== undefined) {
        state.refreshToken = action.payload.refreshToken;
      }
      persistAuthTokens(state.accessToken ?? undefined, state.refreshToken ?? undefined);
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem('uraltour_user', JSON.stringify(state.user));
      }
    },
    toggleFavorite: (state, action: PayloadAction<string>) => {
      if (state.user) {
        const index = state.user.favorites.indexOf(action.payload);
        if (index >= 0) {
          state.user.favorites.splice(index, 1);
        } else {
          state.user.favorites.push(action.payload);
        }
        localStorage.setItem('uraltour_user', JSON.stringify(state.user));
      }
    },
    addRoute: (state, action: PayloadAction<CustomRoute>) => {
      // 1. Update global routes state
      if (!state.routes) state.routes = [];
      state.routes.push(action.payload);
      localStorage.setItem('uraltour_routes', JSON.stringify(state.routes));

      // 2. Also update current user if exists
      if (state.user) {
        if (!state.user.routes) state.user.routes = [];
        state.user.routes.push(action.payload);
        localStorage.setItem('uraltour_user', JSON.stringify(state.user));
      }
    },
    updateRouteTitle: (state, action: PayloadAction<{ id: string; title: string }>) => {
      // 1. Update in global routes
      if (state.routes) {
        const route = state.routes.find(r => r.id === action.payload.id);
        if (route) {
          route.title = action.payload.title;
          localStorage.setItem('uraltour_routes', JSON.stringify(state.routes));
        }
      }

      // 2. Update in user routes
      if (state.user && state.user.routes) {
        const route = state.user.routes.find(r => r.id === action.payload.id);
        if (route) {
          route.title = action.payload.title;
          localStorage.setItem('uraltour_user', JSON.stringify(state.user));
        }
      }
    },
    updateRouteWaypoints: (state, action: PayloadAction<{ id: string; waypoints: string[] }>) => {
      // 1. Update in global routes
      if (state.routes) {
        const route = state.routes.find(r => r.id === action.payload.id);
        if (route) {
          route.waypoints = action.payload.waypoints;
          localStorage.setItem('uraltour_routes', JSON.stringify(state.routes));
        }
      }

      // 2. Update in user routes
      if (state.user && state.user.routes) {
        const route = state.user.routes.find(r => r.id === action.payload.id);
        if (route) {
          route.waypoints = action.payload.waypoints;
          localStorage.setItem('uraltour_user', JSON.stringify(state.user));
        }
      }
    },
    completeRoute: (state, action: PayloadAction<string>) => {
      if (state.user?.role !== 'tourist') return;

      const routeId = action.payload;
      const route =
        state.routes?.find((r) => r.id === routeId) ??
        state.user.routes?.find((r) => r.id === routeId);
      if (!route || route.completedAt) return;

      const now = new Date().toISOString();
      route.completedAt = now;

      const syncRoute = (r: CustomRoute) => {
        if (r.id === routeId) r.completedAt = now;
      };
      state.routes?.forEach(syncRoute);
      state.user.routes?.forEach(syncRoute);
      localStorage.setItem('uraltour_routes', JSON.stringify(state.routes ?? []));

      if (!state.user.visitedPlaces) state.user.visitedPlaces = [];
      const existingIds = new Set(state.user.visitedPlaces.map((v) => v.itemId));

      for (const itemId of route.waypoints) {
        if (existingIds.has(itemId)) continue;
        const visit: VisitedPlace = {
          id: `${Date.now()}-${itemId}`,
          itemId,
          visitedAt: now,
          routeId,
        };
        state.user.visitedPlaces.unshift(visit);
        existingIds.add(itemId);
      }

      localStorage.setItem('uraltour_user', JSON.stringify(state.user));
    },
    removeVisitedPlace: (state, action: PayloadAction<string>) => {
      if (!state.user?.visitedPlaces) return;
      state.user.visitedPlaces = state.user.visitedPlaces.filter(
        (v) => v.id !== action.payload,
      );
      localStorage.setItem('uraltour_user', JSON.stringify(state.user));
    },
    deleteRoute: (state, action: PayloadAction<string>) => {
      // 1. Update in global routes
      if (state.routes) {
        state.routes = state.routes.filter(r => r.id !== action.payload);
        localStorage.setItem('uraltour_routes', JSON.stringify(state.routes));
      }

      // 2. Update in user routes
      if (state.user && state.user.routes) {
        state.user.routes = state.user.routes.filter(r => r.id !== action.payload);
        localStorage.setItem('uraltour_user', JSON.stringify(state.user));
      }
    },
    addBooking: (state, action: PayloadAction<Booking>) => {
      // 1. Log to global bookings state
      state.bookings.unshift(action.payload);
      localStorage.setItem('uraltour_bookings', JSON.stringify(state.bookings));

      const partnerId = action.payload.partnerId;
      if (partnerId) {
        pushPartnerInbox(partnerId, {
          id: `partner-bk-${action.payload.id}`,
          type: 'booking',
          title: 'Новая заявка на экскурсию',
          message: `${action.payload.touristName} подал(а) заявку на «${action.payload.itemTitle}» (${action.payload.date}).`,
          isRead: false,
          createdAt: new Date().toISOString(),
          link: '/profile',
        });
      }

      // 2. Also log to current user if exists
      if (state.user) {
        if (!state.user.bookings) state.user.bookings = [];
        state.user.bookings.unshift(action.payload);

        if (state.user.role === 'tourist') {
          if (!state.user.notifications) state.user.notifications = [];
          state.user.notifications.unshift({
            id: Math.random().toString(36).substr(2, 9),
            type: 'booking',
            title: 'Новая заявка отправлена',
            message: `Вы успешно отправили заявку на «${action.payload.itemTitle}». Ожидайте подтверждения.`,
            isRead: false,
            createdAt: new Date().toISOString(),
            link: '/profile',
          });
        }

        if (state.user.role === 'partner' && state.user.id === partnerId) {
          if (!state.user.notifications) state.user.notifications = [];
          state.user.notifications.unshift({
            id: `partner-bk-live-${action.payload.id}`,
            type: 'booking',
            title: 'Новая заявка на экскурсию',
            message: `${action.payload.touristName} подал(а) заявку на «${action.payload.itemTitle}».`,
            isRead: false,
            createdAt: new Date().toISOString(),
            link: '/profile',
          });
        }

        localStorage.setItem('uraltour_user', JSON.stringify(state.user));
      }
    },
    updateBookingStatus: (
      state,
      action: PayloadAction<{
        id: string;
        status: BookingStatus;
        actor?: 'tourist' | 'partner';
      }>,
    ) => {
      const { id, status, actor = 'partner' } = action.payload;

      // 1. Update in global bookings
      const globalBk = state.bookings.find((b) => b.id === id);
      if (globalBk) {
        globalBk.status = status;
        if (status === 'declined') {
          globalBk.declinedBy = actor;
        } else {
          delete globalBk.declinedBy;
        }
        localStorage.setItem('uraltour_bookings', JSON.stringify(state.bookings));
      }

      if (status === 'declined' && globalBk) {
        if (actor === 'tourist' && globalBk.partnerId) {
          pushPartnerInbox(globalBk.partnerId, {
            id: `partner-cancel-${id}-${Date.now()}`,
            type: 'booking',
            title: 'Отказ от экскурсии',
            message: `${globalBk.touristName} отказался(ась) от участия в «${globalBk.itemTitle}» (${globalBk.date}).`,
            isRead: false,
            createdAt: new Date().toISOString(),
            link: '/profile',
          });
        }
      }

      // 2. Update in user bookings if match
      if (state.user?.bookings) {
        const userBk = state.user.bookings.find((b) => b.id === id);
        if (userBk) {
          userBk.status = status;
          if (status === 'declined') {
            userBk.declinedBy = actor;
          } else {
            delete userBk.declinedBy;
          }
        }
      }

      if (!state.user) return;

      if (!state.user.notifications) state.user.notifications = [];

      if (status === 'confirmed' && state.user.role === 'tourist' && globalBk?.touristId === state.user.id) {
        state.user.notifications.unshift({
          id: Math.random().toString(36).substr(2, 9),
          type: 'booking',
          title: 'Бронирование подтверждено!',
          message: `Заявка на «${globalBk.itemTitle}» подтверждена организатором.`,
          isRead: false,
          createdAt: new Date().toISOString(),
          link: '/profile',
        });
      } else if (status === 'declined') {
        if (actor === 'partner' && globalBk?.touristId === state.user.id) {
          state.user.notifications.unshift({
            id: Math.random().toString(36).substr(2, 9),
            type: 'booking',
            title: 'Бронирование отклонено',
            message: `Заявка на «${globalBk.itemTitle}» отклонена организатором.`,
            isRead: false,
            createdAt: new Date().toISOString(),
            link: '/profile',
          });
        } else if (actor === 'tourist' && state.user.role === 'partner' && globalBk?.partnerId === state.user.id) {
          state.user.notifications.unshift({
            id: `partner-cancel-live-${id}`,
            type: 'booking',
            title: 'Отказ от экскурсии',
            message: `${globalBk.touristName} отказался(ась) от «${globalBk.itemTitle}».`,
            isRead: false,
            createdAt: new Date().toISOString(),
            link: '/profile',
          });
        }
      }

      localStorage.setItem('uraltour_user', JSON.stringify(state.user));
    },
    addNotification: (state, action: PayloadAction<AppNotification>) => {
      if (state.user) {
        if (!state.user.notifications) state.user.notifications = [];
        state.user.notifications.unshift(action.payload);
        localStorage.setItem('uraltour_user', JSON.stringify(state.user));
      }
    },
    markNotificationAsRead: (state, action: PayloadAction<string>) => {
      if (state.user && state.user.notifications) {
        const notification = state.user.notifications.find(n => n.id === action.payload);
        if (notification) {
          notification.isRead = true;
          localStorage.setItem('uraltour_user', JSON.stringify(state.user));
        }
      }
    },
    clearNotifications: (state) => {
      if (state.user) {
        state.user.notifications = [];
        localStorage.setItem('uraltour_user', JSON.stringify(state.user));
      }
    },
    addMockItem: (state, action: PayloadAction<MockItem>) => {
      state.items.unshift(action.payload);
      localStorage.setItem('uraltour_items', JSON.stringify(state.items));
    },
    updateMockItem: (state, action: PayloadAction<MockItem>) => {
      const idx = state.items.findIndex(item => item.id === action.payload.id);
      if (idx >= 0) {
        state.items[idx] = action.payload;
        localStorage.setItem('uraltour_items', JSON.stringify(state.items));
      }
    },
    deleteMockItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
      localStorage.setItem('uraltour_items', JSON.stringify(state.items));
    },
    setCatalogItems: (state, action: PayloadAction<MockItem[]>) => {
      state.items = action.payload;
      localStorage.setItem('uraltour_items', JSON.stringify(state.items));
    },
    setUserFavorites: (state, action: PayloadAction<string[]>) => {
      if (state.user) {
        state.user.favorites = action.payload;
        localStorage.setItem('uraltour_user', JSON.stringify(state.user));
      }
    },
    setUserBookings: (state, action: PayloadAction<Booking[]>) => {
      state.bookings = action.payload;
      localStorage.setItem('uraltour_bookings', JSON.stringify(state.bookings));
      if (state.user) {
        state.user.bookings = action.payload;
        localStorage.setItem('uraltour_user', JSON.stringify(state.user));
      }
    },
    setUserNotifications: (state, action: PayloadAction<AppNotification[]>) => {
      if (state.user) {
        state.user.notifications = action.payload;
        localStorage.setItem('uraltour_user', JSON.stringify(state.user));
      }
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.accessToken = null;
      state.refreshToken = null;
      localStorage.removeItem('uraltour_user');
      clearAuthTokens();
    },
  },
});

export const {
  setUser,
  setLoading,
  setAuthTokens: setAuthTokensAction,
  updateUser, 
  toggleFavorite, 
  addRoute, 
  updateRouteTitle, 
  updateRouteWaypoints, 
  deleteRoute,
  completeRoute,
  removeVisitedPlace,
  addBooking,
  updateBookingStatus,
  addNotification,
  markNotificationAsRead,
  clearNotifications,
  addMockItem,
  updateMockItem,
  deleteMockItem,
  setCatalogItems,
  setUserFavorites,
  setUserBookings,
  setUserNotifications,
  logout 
} = authSlice.actions;
export default authSlice.reducer;
