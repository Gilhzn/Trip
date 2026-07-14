import type { CurrencyCode } from '@/state/SettingsContext';

export interface CurrencyMeta {
  code: CurrencyCode;
  symbol: string;
  nameHe: string;
  nameEn: string;
}

export const CURRENCIES: CurrencyMeta[] = [
  { code: 'EUR', symbol: '€', nameHe: 'יורו', nameEn: 'Euro' },
  { code: 'ILS', symbol: '₪', nameHe: 'שקל חדש', nameEn: 'Israeli Shekel' },
  { code: 'USD', symbol: '$', nameHe: 'דולר אמריקאי', nameEn: 'US Dollar' },
  { code: 'GBP', symbol: '£', nameHe: 'לירה שטרלינג', nameEn: 'British Pound' },
  { code: 'CHF', symbol: 'CHF', nameHe: 'פרנק שוויצרי', nameEn: 'Swiss Franc' },
  { code: 'CZK', symbol: 'Kč', nameHe: 'כתר צ׳כי', nameEn: 'Czech Koruna' },
  { code: 'HUF', symbol: 'Ft', nameHe: 'פורינט הונגרי', nameEn: 'Hungarian Forint' },
];

/**
 * Bundled fallback rates (EUR base) used only when both rate APIs fail.
 * Snapshot: mid-2026; UI shows a staleness notice when these are used.
 */
export const FALLBACK_RATES: Record<CurrencyCode, number> = {
  EUR: 1,
  ILS: 3.9,
  USD: 1.09,
  GBP: 0.85,
  CHF: 0.94,
  CZK: 25.2,
  HUF: 395,
};
