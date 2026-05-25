import type { MockPartnerType } from '../data/mockData';

/** Подпись роли партнёра для админки и профилей */
export function getPartnerRoleLabel(partnerType?: MockPartnerType): string {
  if (partnerType === 'company') return 'Гид — туркомпания';
  return 'Гид — частный гид';
}
