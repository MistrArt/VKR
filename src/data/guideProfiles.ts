import type { MockItem } from './mockData';
import type { User } from '../store/authSlice';

export interface GuideProfile {
  id: string;
  displayName: string;
  companyName?: string;
  bio: string;
  phone: string;
  email?: string;
  avatar?: string;
  rating: number;
  experience: string;
  toursCount: number;
  languages: string[];
  partnerType: 'individual' | 'company';
  certificates: { title: string; uploadDate: string }[];
}

export const guideProfilesByPartnerId: Record<string, GuideProfile> = {
  'quick-partner': {
    id: 'quick-partner',
    displayName: 'Анна Козлова',
    companyName: 'Урал-Арт Студия',
    bio: 'Сертифицированный гид по уличному искусству и современной культуре Екатеринбурга. Провожу авторские пешие маршруты для семей и молодёжи.',
    phone: '+7 (922) 800-44-33',
    email: 'anna.kozlova@ural-art.ru',
    rating: 5.0,
    experience: '7+ лет',
    toursCount: 12,
    languages: ['Русский', 'Английский'],
    partnerType: 'individual',
    certificates: [
      {
        title: 'Аттестат экскурсовода (гида) Свердловской области №044-У',
        uploadDate: '12.03.2025',
      },
      {
        title: 'Курс «Современное искусство Урала» — УрФУ',
        uploadDate: '10.11.2024',
      },
    ],
  },
  'admin-id': {
    id: 'admin-id',
    displayName: 'Алексей Морозов',
    companyName: 'Екатеринбургское бюро экскурсий',
    bio: 'Краевед и организатор обзорных туров по историческому центру. Специализация — промышленное наследие и архитектура XX века.',
    phone: '+7 (343) 293-15-40',
    email: 'info@ekb-excursions.ru',
    rating: 4.9,
    experience: '10+ лет',
    toursCount: 24,
    languages: ['Русский'],
    partnerType: 'company',
    certificates: [
      {
        title: 'Диплом о профессиональной переподготовке «Краеведение и туризм Урала»',
        uploadDate: '10.11.2024',
      },
    ],
  },
  'partner-1': {
    id: 'partner-1',
    displayName: 'Игорь Вяткин',
    companyName: 'УралТур Оператор',
    bio: 'Сертифицированный организатор экскурсий и этно-туров по Среднему Уралу. Работаю с группами и индивидуальными туристами.',
    phone: '+7 (912) 555-12-34',
    email: 'igor@uraltour.ru',
    rating: 4.9,
    experience: '5+ лет',
    toursCount: 8,
    languages: ['Русский', 'Немецкий'],
    partnerType: 'company',
    certificates: [
      {
        title: 'Аттестат экскурсовода (гида) Свердловской области №012-У',
        uploadDate: '05.01.2025',
      },
    ],
  },
};

function profileFromTourOperator(tourOperator?: string): Pick<GuideProfile, 'displayName' | 'companyName'> {
  if (!tourOperator) {
    return { displayName: 'Экскурсовод', companyName: 'Екатеринбург Тур Груп' };
  }
  const parenMatch = tourOperator.match(/\(([^)]+)\)/);
  if (parenMatch) {
    const before = tourOperator.split('(')[0].trim();
    return {
      displayName: parenMatch[1].replace(/^гид\s+/i, '').trim(),
      companyName: before || undefined,
    };
  }
  return { displayName: tourOperator, companyName: undefined };
}

export function userToGuideProfile(user: User): GuideProfile {
  const existing = guideProfilesByPartnerId[user.id];
  if (existing) return { ...existing, phone: user.phone || existing.phone, email: user.email };

  return {
    id: user.id,
    displayName: user.name,
    companyName: user.passport || undefined,
    bio: user.diplomas || 'Сертифицированный экскурсовод платформы УралТур.',
    phone: user.phone || '+7 (343) 000-00-00',
    email: user.email,
    avatar: user.avatar,
    rating: 4.9,
    experience: '3+ года',
    toursCount: 3,
    languages: ['Русский'],
    partnerType: user.partnerType || 'individual',
    certificates: user.certificates?.map((c) => ({ title: c.title, uploadDate: c.uploadDate })) || [],
  };
}

export function getGuideProfileForExcursion(item: MockItem, partnerUser?: User | null): GuideProfile {
  if (partnerUser && partnerUser.role === 'partner' && item.partnerId === partnerUser.id) {
    return userToGuideProfile(partnerUser);
  }

  const partnerId = item.partnerId || 'default';
  const stored = guideProfilesByPartnerId[partnerId];
  if (stored) return stored;

  const fromOperator = profileFromTourOperator(item.tourOperator);
  return {
    id: partnerId,
    displayName: fromOperator.displayName,
    companyName: fromOperator.companyName,
    bio: 'Профессиональный гид-экскурсовод. Подробности уточняйте при бронировании.',
    phone: item.contacts?.phone || '+7 (343) 293-00-00',
    rating: item.rating || 4.8,
    experience: '3+ года',
    toursCount: 5,
    languages: item.language ? item.language.split(/,\s*/) : ['Русский'],
    partnerType: 'individual',
    certificates: [],
  };
}
