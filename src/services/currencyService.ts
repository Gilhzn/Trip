import type { CurrencyCode } from '@/state/SettingsContext';
import { CURRENCIES, FALLBACK_RATES } from '@/data/currencies';
import { fetchJson } from './http';
import { cached, TTL } from './cache';

export interface Rates {
  /** EUR-based conversion rates */
  byCode: Record<CurrencyCode, number>;
  /** true when live APIs failed and the bundled snapshot is shown */
  stale: boolean;
}

interface ErApiResponse {
  result: string;
  rates: Record<string, number>;
}

interface FrankfurterResponse {
  rates: Record<string, number>;
}

const CODES = CURRENCIES.map((c) => c.code);

function pickRates(all: Record<string, number>): Record<CurrencyCode, number> | null {
  const byCode = { EUR: 1 } as Record<CurrencyCode, number>;
  for (const code of CODES) {
    if (code === 'EUR') continue;
    const rate = all[code];
    if (typeof rate !== 'number' || rate <= 0) return null;
    byCode[code] = rate;
  }
  return byCode;
}

/**
 * EUR-based rates. er-api first (covers ILS reliably), frankfurter (ECB) as
 * backup, bundled snapshot as a stale last resort.
 */
export async function getRates(): Promise<Rates> {
  return cached('rates:eur', TTL.rates, async () => {
    try {
      const data = await fetchJson<ErApiResponse>('https://open.er-api.com/v6/latest/EUR');
      const byCode = data.result === 'success' ? pickRates(data.rates) : null;
      if (byCode) return { byCode, stale: false };
    } catch {
      // fall through
    }
    try {
      const symbols = CODES.filter((c) => c !== 'EUR').join(',');
      const data = await fetchJson<FrankfurterResponse>(`https://api.frankfurter.dev/v1/latest?base=EUR&symbols=${symbols}`);
      const byCode = pickRates(data.rates);
      if (byCode) return { byCode, stale: false };
    } catch {
      // fall through
    }
    return { byCode: FALLBACK_RATES, stale: true };
  });
}

export function convertFromEur(amountEur: number, code: CurrencyCode, rates: Rates): number {
  return amountEur * (rates.byCode[code] ?? 1);
}

export function formatMoney(amount: number, code: CurrencyCode, lang: 'he' | 'en'): string {
  const locale = lang === 'he' ? 'he-IL' : 'en-GB';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: code,
    maximumFractionDigits: amount >= 100 ? 0 : amount >= 10 ? 1 : 2,
  }).format(amount);
}
