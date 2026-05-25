/** Приводит строку даты из заявки к ISO (YYYY-MM-DD) для сопоставления с календарём. */
export function normalizeBookingDateIso(dateStr: string): string | null {
  if (!dateStr?.trim()) return null;

  const isoMatch = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return isoMatch[0];

  const ruShort = dateStr.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (ruShort) {
    const [, d, m, y] = ruShort;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  const months: Record<string, string> = {
    января: '01',
    февраля: '02',
    марта: '03',
    апреля: '04',
    мая: '05',
    июня: '06',
    июля: '07',
    августа: '08',
    сентября: '09',
    октября: '10',
    ноября: '11',
    декабря: '12',
  };

  const longRu = dateStr.toLowerCase().match(/(\d{1,2})\s+([а-яё]+)\s+(\d{4})/);
  if (longRu) {
    const [, d, monthName, y] = longRu;
    const m = months[monthName];
    if (m) return `${y}-${m}-${d.padStart(2, '0')}`;
  }

  return null;
}
