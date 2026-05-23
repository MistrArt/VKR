export type { Category, MockItem } from './mockTypes';
import { mockDataCore } from './mockDataCore';
import { mockCatalogEkbExtra } from './mockCatalogEkbExtra';
import { applyMockItemAddress } from './mockItemAddresses';

export const mockItems = [...mockDataCore, ...mockCatalogEkbExtra].map(applyMockItemAddress);

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
  { id: '5', name: 'Дмитрий Волков', email: 'volkov@partner.com', role: 'partner', status: 'active', createdAt: '2024-04-10' },
];
