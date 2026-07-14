import { useEffect, useState } from 'react';
import { getRates, type Rates } from '@/services/currencyService';
import { FALLBACK_RATES } from '@/data/currencies';

let ratesPromise: Promise<Rates> | null = null;

export function useRates(): Rates {
  const [rates, setRates] = useState<Rates>({ byCode: FALLBACK_RATES, stale: true });

  useEffect(() => {
    ratesPromise ??= getRates();
    let cancelled = false;
    ratesPromise.then((r) => {
      if (!cancelled) setRates(r);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return rates;
}
