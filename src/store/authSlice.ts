import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { mockItems, MockItem } from '../data/mockData';

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
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  birthDate?: string;
  passport?: string;
  diplomas?: string;
  favorites: string[];
  routes?: CustomRoute[];
  bookings?: Booking[];
  notifications?: AppNotification[];
  partnerType?: 'individual' | 'company';
  certificates?: { id: string; title: string; fileUrl: string; uploadDate: string }[];
}

const getStoredItems = (): MockItem[] => {
  const stored = localStorage.getItem('uraltour_items');
  if (stored) {
    try {
      return JSON.parse(stored);
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
  items: MockItem[];
  bookings: Booking[];
  routes: CustomRoute[];
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  items: getStoredItems(),
  bookings: getStoredBookings(),
  routes: getStoredRoutes(),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      state.isLoading = false;
      if (action.payload) {
        localStorage.setItem('uraltour_user', JSON.stringify(action.payload));
      } else {
        localStorage.removeItem('uraltour_user');
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
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

      // 2. Also log to current user if exists
      if (state.user) {
        if (!state.user.bookings) state.user.bookings = [];
        state.user.bookings.unshift(action.payload);
        
        // Add notification for the user
        if (!state.user.notifications) state.user.notifications = [];
        state.user.notifications.unshift({
          id: Math.random().toString(36).substr(2, 9),
          type: 'booking',
          title: 'Новая заявка отправлена',
          message: `Вы успешно отправили заявку на "${action.payload.itemTitle}". Ожидайте подтверждения.`,
          isRead: false,
          createdAt: new Date().toISOString(),
          link: '/profile'
        });

        localStorage.setItem('uraltour_user', JSON.stringify(state.user));
      }
    },
    updateBookingStatus: (state, action: PayloadAction<{ id: string; status: BookingStatus }>) => {
      // 1. Update in global bookings
      const globalBk = state.bookings.find(b => b.id === action.payload.id);
      if (globalBk) {
        globalBk.status = action.payload.status;
        localStorage.setItem('uraltour_bookings', JSON.stringify(state.bookings));
      }

      // 2. Update in user bookings if match
      if (state.user && state.user.bookings) {
        const userBk = state.user.bookings.find(b => b.id === action.payload.id);
        if (userBk) {
          userBk.status = action.payload.status;
        }

        // Add real notification to user state
        if (!state.user.notifications) state.user.notifications = [];
        state.user.notifications.unshift({
          id: Math.random().toString(36).substr(2, 9),
          type: 'booking',
          title: action.payload.status === 'confirmed' ? 'Бронирование подтверждено!' : 'Бронирование отклонено',
          message: `Заявка на "${globalBk?.itemTitle || 'выбранный тур'}" была ${action.payload.status === 'confirmed' ? 'подтверждена' : 'отклонена'} оператором.`,
          isRead: false,
          createdAt: new Date().toISOString(),
          link: '/profile'
        });

        localStorage.setItem('uraltour_user', JSON.stringify(state.user));
      }
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
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem('uraltour_user');
    },
  },
});

export const { 
  setUser, 
  setLoading, 
  updateUser, 
  toggleFavorite, 
  addRoute, 
  updateRouteTitle, 
  updateRouteWaypoints, 
  deleteRoute, 
  addBooking,
  updateBookingStatus,
  addNotification,
  markNotificationAsRead,
  clearNotifications,
  addMockItem,
  updateMockItem,
  deleteMockItem,
  logout 
} = authSlice.actions;
export default authSlice.reducer;
