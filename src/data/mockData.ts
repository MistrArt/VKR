export type Category = 'places' | 'excursions' | 'routes' | 'restaurants';

export interface MockItem {
  id: string;
  title: string;
  description: string;
  category: Category;
  lat: number;
  lng: number;
  image: string;
  rating: number;
  price: number; 
  partnerId?: string; // ID of the partner who owns this item
  status?: 'active' | 'pending' | 'rejected' | 'archived';
  createdAt?: string;

  // Enriched catalog & detail fields
  location?: string;
  district?: string;
  reviewsCount?: number;
  shortDescription?: string;
  isOpenNow?: boolean;
  images?: string[];
  fullDescription?: string;
  workingHours?: string;
  contacts?: {
    phone: string;
    website: string;
    social?: string;
  };
  suitableFor?: string[];

  // Places (Достопримечательность) specific
  theme?: string[];
  recommendTime?: string;

  // Restaurant/Cafe specific
  cuisines?: string[];
  averageCheck?: number;
  menu?: { name: string; price: number }[];
  features?: string[];

  // Excursion/Tour specific
  tourOperator?: string;
  duration?: string;
  dates?: string[];
  freeSlots?: number;
  routePoints?: string[];
  itinerary?: string[];
  routeId?: string;
  included?: string[];
  language?: string;
  limitations?: string;

  // Reviews content
  reviews?: {
    author: string;
    rating: number;
    text: string;
    date: string;
    avatar?: string;
  }[];
}

export const mockItems: MockItem[] = [
  {
    id: '1',
    title: 'Плотинка',
    description: 'Исторический сквер и сердце Екатеринбурга, традиционное место встреч и прогулок.',
    category: 'places',
    lat: 56.8389,
    lng: 60.6057,
    image: 'https://images.unsplash.com/photo-1546436836-07a91091f11c?q=80&w=800&auto=format&fit=crop',
    rating: 4.9,
    price: 0,
    partnerId: 'admin-id',
    status: 'active'
  },
  {
    id: '2',
    title: 'Ельцин Центр',
    description: 'Современный общественный, культурный и образовательный центр с интерактивным музеем.',
    category: 'places',
    lat: 56.8445,
    lng: 60.5898,
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop',
    rating: 4.7,
    price: 300,
    partnerId: 'quick-partner',
    status: 'active'
  },
  {
    id: '3',
    title: 'Храм на Крови',
    description: 'Один из крупнейших православных храмов России, построенный на месте дома Ипатьева.',
    category: 'places',
    lat: 56.8444,
    lng: 60.6097,
    image: 'https://images.unsplash.com/photo-1548625361-ec68504eb671?q=80&w=800&auto=format&fit=crop',
    rating: 4.8,
    price: 0,
    partnerId: 'admin-id',
    status: 'active'
  },
  {
    id: '4',
    title: 'Обзорная экскурсия',
    description: 'Познакомьтесь с главными достопримечательностями столицы Урала за 2 часа с опытным гидом.',
    category: 'excursions',
    lat: 56.8380,
    lng: 60.6050,
    image: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=800&auto=format&fit=crop',
    rating: 4.9,
    price: 1500,
    partnerId: 'quick-partner',
    status: 'pending'
  },
  {
    id: '5',
    title: 'Стрит-арт Екатеринбурга',
    description: 'Уникальная экскурсия по объектам фестиваля Stenograffia и неформальному искусству.',
    category: 'excursions',
    lat: 56.8333,
    lng: 60.6000,
    image: 'https://images.unsplash.com/photo-1499781350541-7783f6ce6a6b?q=80&w=800&auto=format&fit=crop',
    rating: 5.0,
    price: 1200,
    partnerId: 'quick-partner'
  },
  {
    id: '6',
    title: 'Красная линия',
    description: 'Пешеходный туристический маршрут по историческому центру города длиной 6.5 км.',
    category: 'routes',
    lat: 56.8385,
    lng: 60.6050,
    image: 'https://images.unsplash.com/photo-1513622470522-26c314a85b43?q=80&w=800&auto=format&fit=crop',
    rating: 4.8,
    price: 0,
    partnerId: 'admin-id'
  },
  {
    id: '7',
    title: 'Ресторан "Паштет"',
    description: 'Уютный ресторан с домашней кухней, светлым интерьером и настоящими котиками.',
    category: 'restaurants',
    lat: 56.8356,
    lng: 60.6080,
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop',
    rating: 4.9,
    price: 2000,
    partnerId: 'admin-id'
  },
  {
    id: '8',
    title: 'Хмели Сунели',
    description: 'Современная грузинская кухня в самом центре города с панорамными окнами.',
    category: 'restaurants',
    lat: 56.8380,
    lng: 60.6120,
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=800&auto=format&fit=crop',
    rating: 4.8,
    price: 1800
  },
  {
    id: '9',
    title: 'БЦ Высоцкий',
    description: 'Небоскреб со смотровой площадкой на высоте 186 метров, откуда открывается потрясающий вид на город.',
    category: 'places',
    lat: 56.8361,
    lng: 60.6146,
    image: 'https://images.unsplash.com/photo-1554469384-e58fac16e23a?q=80&w=800&auto=format&fit=crop',
    rating: 4.9,
    price: 600
  },
  {
    id: '10',
    title: 'Екатеринбургский цирк',
    description: 'Здание с уникальным ажурным куполом, одно из самых узнаваемых в городе.',
    category: 'places',
    lat: 56.8261,
    lng: 60.6022,
    image: 'https://images.unsplash.com/photo-1514539079130-25950c84af65?q=80&w=800&auto=format&fit=crop',
    rating: 4.6,
    price: 700
  },
  {
    id: '11',
    title: 'Харитоновский сад',
    description: 'Английский парк в центре города с искусственным озером, ротондой и старинной усадьбой.',
    category: 'places',
    lat: 56.8456,
    lng: 60.6133,
    image: 'https://images.unsplash.com/photo-1585938389612-a552a28d6914?q=80&w=800&auto=format&fit=crop',
    rating: 4.8,
    price: 0
  },
  {
    id: '12',
    title: 'УрФУ (Главный корпус)',
    description: 'Крупнейший университет Урала, здание в стиле сталинского ампира на площади Кирова.',
    category: 'places',
    lat: 56.8439,
    lng: 60.6536,
    image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=800&auto=format&fit=crop',
    rating: 4.7,
    price: 0
  },
  {
    id: '13',
    title: 'ТРЦ Гринвич',
    description: 'Один из крупнейших торгово-развлекательных центров в России с множеством магазинов и ресторанов.',
    category: 'places',
    lat: 56.8294,
    lng: 60.5989,
    image: 'https://images.unsplash.com/photo-1519567281799-97160553665b?q=80&w=800&auto=format&fit=crop',
    rating: 4.5,
    price: 0
  },
  {
    id: '14',
    title: 'Улица Вайнера',
    description: 'Главная пешеходная улица города, которую часто называют "Уральским Арбатом".',
    category: 'places',
    lat: 56.8335,
    lng: 60.5960,
    image: 'https://images.unsplash.com/photo-1513622470522-26c314a85b43?q=80&w=800&auto=format&fit=crop',
    rating: 4.8,
    price: 0
  },
  {
    id: '15',
    title: 'Шигирская кладовая',
    description: 'Музей, где хранится Большой Шигирский идол — древнейшая в мире деревянная скульптура.',
    category: 'places',
    lat: 56.8385,
    lng: 60.6045,
    image: 'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?q=80&w=800&auto=format&fit=crop',
    rating: 4.9,
    price: 200
  },
  {
    id: '16',
    title: 'Каменные палатки',
    description: 'Гранитые скалы-останцы в черте города, природный и исторический памятник.',
    category: 'places',
    lat: 56.8405,
    lng: 60.6789,
    image: 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?q=80&w=800&auto=format&fit=crop',
    rating: 4.7,
    price: 0
  },
  {
    id: '17',
    title: 'Ресторан "Троекуровъ"',
    description: 'Ресторан русской дворянской кухни в историческом особняке.',
    category: 'restaurants',
    lat: 56.8390,
    lng: 60.6085,
    image: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=800&auto=format&fit=crop',
    rating: 4.9,
    price: 3000
  },
  {
    id: '18',
    title: 'Музей ИЗО',
    description: 'Екатеринбургский музей изобразительных искусств с уникальной коллекцией каслинского литья.',
    category: 'places',
    lat: 56.8375,
    lng: 60.6040,
    image: 'https://images.unsplash.com/photo-1518998053401-a4149019a8f2?q=80&w=800&auto=format&fit=crop',
    rating: 4.8,
    price: 250
  }
];

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: 'tourist' | 'partner' | 'admin';
  status: 'active' | 'blocked';
  createdAt: string;
}

export const mockUsers: MockUser[] = [
  { id: '1', name: 'Иван Иванов', email: 'ivan@example.com', role: 'tourist', status: 'active', createdAt: '2024-01-15' },
  { id: '2', name: 'Мария Петрова', email: 'maria@partner.com', role: 'partner', status: 'active', createdAt: '2024-02-20' },
  { id: '3', name: 'Сергей Сидоров', email: 'sergey@example.com', role: 'tourist', status: 'blocked', createdAt: '2024-03-05' },
  { id: '4', name: 'Анна Кузнецова', email: 'anna@admin.com', role: 'admin', status: 'active', createdAt: '2023-12-01' },
  { id: '5', name: 'Дмитрий Волков', email: 'volkov@partner.com', role: 'partner', status: 'active', createdAt: '2024-04-10' }
];
