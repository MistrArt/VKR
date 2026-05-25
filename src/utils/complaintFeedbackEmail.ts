import type { AdminComplaint } from './adminComplaints';

export function sendComplaintFeedbackEmail(
  complaint: AdminComplaint,
  adminResponse: string,
): void {
  const subject = encodeURIComponent(
    `[UralTour] Ответ на ваше обращение — ${complaint.typeLabel}`,
  );
  const targetLine = complaint.relatedItemTitle
    ? `Объект: «${complaint.relatedItemTitle}»\n`
    : '';
  const body = encodeURIComponent(
    `Здравствуйте, ${complaint.authorName}!\n\n` +
      `По вашему обращению (${complaint.typeLabel}) направляем ответ администрации платформы.\n\n` +
      targetLine +
      `Ваше сообщение:\n${complaint.message}\n\n` +
      `Ответ:\n${adminResponse.trim()}\n\n` +
      `— Команда UralTour`,
  );
  const mailto = `mailto:${encodeURIComponent(complaint.authorEmail)}?subject=${subject}&body=${body}`;
  const link = document.createElement('a');
  link.href = mailto;
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  link.remove();
}
