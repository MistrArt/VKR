import type { MockItem } from '../data/mockData';
import type { MockUser } from '../data/mockData';
import type { AppNotification } from '../store/authSlice';
import { pushPartnerInbox } from './partnerNotifications';

export type ModerationAction = 'publish' | 'revision' | 'reject';

export function resolvePartnerEmail(
  tour: MockItem,
  users: MockUser[],
): string {
  const partner = users.find((u) => u.id === tour.partnerId);
  if (partner?.email) return partner.email;
  if (tour.contacts?.website?.includes('@')) return tour.contacts.website;
  return 'partner@demo-ural.ru';
}

export function buildModerationMailSubject(
  tour: MockItem,
  action: ModerationAction,
): string {
  const actionLabel =
    action === 'publish'
      ? 'Одобрение публикации'
      : action === 'revision'
        ? 'Требуется доработка'
        : 'Отклонение тура';
  return `[UralTour] ${actionLabel}: «${tour.title}»`;
}

export function buildModerationMailBody(
  tour: MockItem,
  action: ModerationAction,
  comment: string,
): string {
  const intro =
    action === 'publish'
      ? 'Ваша экскурсия прошла модерацию и опубликована в каталоге.'
      : action === 'revision'
        ? 'Экскурсия отправлена на доработку. Пожалуйста, внесите правки и отправьте повторно на модерацию.'
        : 'К сожалению, экскурсия отклонена модератором.';

  const commentBlock = comment.trim()
    ? `\n\nКомментарий модератора:\n${comment.trim()}`
    : '';

  return (
    `Здравствуйте!\n\n` +
    `${intro}\n\n` +
    `Тур: «${tour.title}» (ID: ${tour.id})\n` +
    `Оператор: ${tour.tourOperator || '—'}${commentBlock}\n\n` +
    `— Команда UralTour`
  );
}

/** Открывает почтовый клиент и сохраняет уведомление партнёру (демо). */
export function sendModerationEmailToPartner(params: {
  tour: MockItem;
  partnerEmail: string;
  action: ModerationAction;
  comment: string;
}): boolean {
  const { tour, partnerEmail, action, comment } = params;
  const subject = encodeURIComponent(buildModerationMailSubject(tour, action));
  const body = encodeURIComponent(buildModerationMailBody(tour, action, comment));
  const mailto = `mailto:${encodeURIComponent(partnerEmail)}?subject=${subject}&body=${body}`;

  if (tour.partnerId) {
    const title =
      action === 'publish'
        ? 'Тур опубликован'
        : action === 'revision'
          ? 'Тур на доработке'
          : 'Тур отклонён';
    const notification: AppNotification = {
      id: `mod-${tour.id}-${action}-${Date.now()}`,
      type: 'system',
      title,
      message:
        comment.trim() ||
        (buildModerationMailBody(tour, action, '').split('\n\n')[1] ?? title),
      isRead: false,
      createdAt: new Date().toISOString(),
      link: '/partner',
    };
    pushPartnerInbox(tour.partnerId, notification);
  }

  const link = document.createElement('a');
  link.href = mailto;
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  link.remove();
  return true;
}

export function applyModerationToTour(
  tour: MockItem,
  action: ModerationAction,
  comment: string,
): MockItem {
  const now = new Date().toISOString();
  const trimmed = comment.trim();

  if (action === 'publish') {
    return {
      ...tour,
      status: 'active',
      moderationComment: trimmed || undefined,
      moderationCommentAt: trimmed ? now : tour.moderationCommentAt,
      moderationEmailSentAt: trimmed ? now : tour.moderationEmailSentAt,
    };
  }
  if (action === 'revision') {
    return {
      ...tour,
      status: 'revision',
      moderationComment: trimmed,
      moderationCommentAt: now,
      moderationEmailSentAt: now,
    };
  }
  return {
    ...tour,
    status: 'rejected',
    moderationComment: trimmed || tour.moderationComment,
    moderationCommentAt: now,
    moderationEmailSentAt: trimmed ? now : tour.moderationEmailSentAt,
  };
}
