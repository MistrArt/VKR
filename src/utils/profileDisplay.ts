export type UserGender = 'male' | 'female' | 'other' | '';

export function formatGender(gender?: string): string {
  if (gender === 'male') return 'Мужской';
  if (gender === 'female') return 'Женский';
  if (gender === 'other') return 'Другой';
  return '—';
}

export function formatBirthDateRu(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
