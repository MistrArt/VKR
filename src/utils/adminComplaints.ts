import type { SupportType } from './supportReport';
import { PARTNER_SUPPORT_TYPES, TOURIST_SUPPORT_TYPES } from './supportReport';

export type ComplaintAuthorRole = 'tourist' | 'partner';
export type ComplaintStatus = 'open' | 'resolved';

export interface AdminComplaint {
  id: string;
  authorRole: ComplaintAuthorRole;
  authorName: string;
  authorEmail: string;
  type: SupportType;
  typeLabel: string;
  message: string;
  relatedItemId?: string;
  relatedItemTitle?: string;
  createdAt: string;
  status: ComplaintStatus;
  adminResponse?: string;
  resolvedAt?: string;
}

const STORAGE_KEY = 'uraltour_admin_complaints';

const SEED_COMPLAINTS: AdminComplaint[] = [
  {
    id: 'cmp-seed-1',
    authorRole: 'tourist',
    authorName: 'Иван Иванов',
    authorEmail: 'ivan@example.com',
    type: 'complaint_excursion',
    typeLabel: 'Жалоба на экскурсию',
    message: 'В описании экскурсии указано неверное время сбора группы.',
    relatedItemId: '4',
    relatedItemTitle: 'Обзорная экскурсия',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    status: 'open',
  },
  {
    id: 'cmp-seed-2',
    authorRole: 'partner',
    authorName: 'Мария Петрова',
    authorEmail: 'maria@partner.com',
    type: 'complaint_platform',
    typeLabel: 'Проблема с сервисом',
    message: 'Карточка конкурента в каталоге содержит оскорбительные формулировки.',
    relatedItemTitle: 'Туроператор «УралГид»',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    status: 'open',
  },
];

function readAll(): AdminComplaint[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_COMPLAINTS));
      return [...SEED_COMPLAINTS];
    }
    const parsed = JSON.parse(raw) as AdminComplaint[];
    return Array.isArray(parsed) ? parsed : [...SEED_COMPLAINTS];
  } catch {
    return [...SEED_COMPLAINTS];
  }
}

function writeAll(list: AdminComplaint[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function typeLabel(type: SupportType, authorRole: ComplaintAuthorRole): string {
  const options = authorRole === 'partner' ? PARTNER_SUPPORT_TYPES : TOURIST_SUPPORT_TYPES;
  return options.find((o) => o.id === type)?.label ?? type;
}

export function getOpenComplaints(): AdminComplaint[] {
  return readAll()
    .filter((c) => c.status === 'open')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function submitUserComplaint(input: {
  authorRole: ComplaintAuthorRole;
  authorName: string;
  authorEmail: string;
  type: SupportType;
  message: string;
  relatedItemId?: string;
  relatedItemTitle?: string;
}): AdminComplaint {
  const complaint: AdminComplaint = {
    id: `cmp-${Date.now()}`,
    authorRole: input.authorRole,
    authorName: input.authorName.trim() || 'Пользователь',
    authorEmail: input.authorEmail.trim(),
    type: input.type,
    typeLabel: typeLabel(input.type, input.authorRole),
    message: input.message.trim(),
    relatedItemId: input.relatedItemId,
    relatedItemTitle: input.relatedItemTitle,
    createdAt: new Date().toISOString(),
    status: 'open',
  };
  const all = readAll();
  all.unshift(complaint);
  writeAll(all);
  return complaint;
}

export function resolveComplaint(id: string, adminResponse: string): AdminComplaint | null {
  const all = readAll();
  const idx = all.findIndex((c) => c.id === id);
  if (idx < 0) return null;
  const updated: AdminComplaint = {
    ...all[idx],
    status: 'resolved',
    adminResponse: adminResponse.trim(),
    resolvedAt: new Date().toISOString(),
  };
  all[idx] = updated;
  writeAll(all);
  return updated;
}

export function formatComplaintDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / (60 * 60 * 1000));
  if (hours < 1) return 'только что';
  if (hours < 24) return `${hours} ч. назад`;
  const days = Math.floor(hours / 24);
  if (days === 1) return '1 день назад';
  if (days < 5) return `${days} дня назад`;
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function authorRoleLabel(role: ComplaintAuthorRole): string {
  return role === 'partner' ? 'Гид / туроператор' : 'Турист';
}
