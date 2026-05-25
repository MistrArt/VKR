import type { AppNotification } from '../store/authSlice';

const MAX_INBOX = 50;

function inboxKey(partnerId: string): string {
  return `uraltour_partner_inbox_${partnerId}`;
}

export function pushPartnerInbox(partnerId: string, notification: AppNotification): void {
  if (!partnerId) return;
  try {
    const raw = localStorage.getItem(inboxKey(partnerId));
    const list: AppNotification[] = raw ? JSON.parse(raw) : [];
    if (list.some((n) => n.id === notification.id)) return;
    list.unshift(notification);
    localStorage.setItem(inboxKey(partnerId), JSON.stringify(list.slice(0, MAX_INBOX)));
  } catch {
    /* ignore */
  }
}

export function pullPartnerInbox(partnerId: string): AppNotification[] {
  try {
    const raw = localStorage.getItem(inboxKey(partnerId));
    return raw ? (JSON.parse(raw) as AppNotification[]) : [];
  } catch {
    return [];
  }
}

export function clearPartnerInbox(partnerId: string): void {
  localStorage.removeItem(inboxKey(partnerId));
}

/** Объединяет входящие уведомления партнёра с уже показанными в профиле. */
export function mergePartnerNotifications(
  partnerId: string,
  current: AppNotification[] = [],
): AppNotification[] {
  const inbox = pullPartnerInbox(partnerId);
  if (inbox.length === 0) return current;

  const seen = new Set(current.map((n) => n.id));
  const merged = [...inbox.filter((n) => !seen.has(n.id)), ...current];
  clearPartnerInbox(partnerId);
  return merged.slice(0, MAX_INBOX);
}
