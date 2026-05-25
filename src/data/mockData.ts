export type { Category, MockItem } from './mockTypes';
import { mockDataCore } from './mockDataCore';
import { mockCatalogEkbExtra } from './mockCatalogEkbExtra';
import { mockModerationTours } from './mockModerationTours';
import { applyMockItemAddress } from './mockItemAddresses';

export const mockItems = [...mockDataCore, ...mockCatalogEkbExtra, ...mockModerationTours].map(
  applyMockItemAddress,
);

export type MockUserRole = 'tourist' | 'partner' | 'admin';
export type MockPartnerType = 'individual' | 'company';

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: MockUserRole;
  status: 'active' | 'blocked';
  createdAt: string;
  /** Только для role === 'partner': частный гид или туркомпания */
  partnerType?: MockPartnerType;
  /** Название компании (если partnerType === 'company') */
  companyName?: string;
  phone?: string;
}

export const mockUsers: MockUser[] = [
  { id: '1', name: 'Иван Иванов', email: 'ivan@example.com', role: 'tourist', status: 'active', createdAt: '2024-01-15' },
  { id: '2', name: 'Мария Петрова', email: 'maria@partner.com', role: 'partner', status: 'active', createdAt: '2024-02-20', partnerType: 'individual', phone: '+7 (912) 111-22-33' },
  { id: '3', name: 'Сергей Сидоров', email: 'sergey@example.com', role: 'tourist', status: 'blocked', createdAt: '2024-03-05' },
  { id: '4', name: 'Анна Кузнецова', email: 'anna@admin.com', role: 'admin', status: 'active', createdAt: '2023-12-01' },
  {
    id: '5',
    name: 'Дмитрий Волков',
    email: 'volkov@partner.com',
    role: 'partner',
    status: 'active',
    createdAt: '2024-04-10',
    partnerType: 'company',
    companyName: 'УралТур Оператор',
    phone: '+7 (343) 555-66-77',
  },
];
