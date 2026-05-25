import type { MockPartnerType } from '../data/mockData';

const PASSWORD_CHARS = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%';

/** Случайный пароль для нового гида (демо, 12 символов). */
export function generateRandomPassword(length = 12): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => PASSWORD_CHARS[b % PASSWORD_CHARS.length]).join('');
}

export function buildPartnerInviteMailSubject(displayName: string): string {
  return encodeURIComponent(`[UralTour] Доступ в личный кабинет гида — ${displayName}`);
}

export function buildPartnerInviteMailBody(params: {
  fullName: string;
  email: string;
  password: string;
  partnerType: MockPartnerType;
  companyName?: string;
  phone?: string;
}): string {
  const { fullName, email, password, partnerType, companyName, phone } = params;
  const orgLine =
    partnerType === 'company' && companyName
      ? `Организация: ${companyName}\n`
      : 'Тип аккаунта: частный гид\n';

  return encodeURIComponent(
    `Здравствуйте, ${fullName}!\n\n` +
      `Для вас создан аккаунт партнёра на платформе UralTour.\n\n` +
      orgLine +
      (phone ? `Телефон в системе: ${phone}\n` : '') +
      `\nЛогин (email): ${email}\n` +
      `Пароль: ${password}\n\n` +
      `Рекомендуем сменить пароль после первого входа.\n` +
      `Вход: ${typeof window !== 'undefined' ? window.location.origin : ''}/auth\n\n` +
      `— Администрация UralTour`,
  );
}

export function sendPartnerInviteEmail(params: {
  email: string;
  fullName: string;
  password: string;
  partnerType: MockPartnerType;
  companyName?: string;
  phone?: string;
}): void {
  const subject = buildPartnerInviteMailSubject(params.fullName);
  const body = buildPartnerInviteMailBody(params);
  const mailto = `mailto:${encodeURIComponent(params.email)}?subject=${subject}&body=${body}`;
  const link = document.createElement('a');
  link.href = mailto;
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  link.remove();
}
