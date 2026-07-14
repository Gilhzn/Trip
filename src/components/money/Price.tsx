import { useI18n, Ltr } from '@/i18n/I18nContext';
import { useSettings } from '@/state/SettingsContext';
import { useRates } from '@/hooks/useRates';
import { convertFromEur, formatMoney } from '@/services/currencyService';

interface PriceProps {
  amountEur: number;
  /** appended context, e.g. "per night" */
  suffix?: string;
  className?: string;
}

/** Renders an EUR amount converted to the user-selected currency. 0 → "free". */
export function Price({ amountEur, suffix, className = '' }: PriceProps) {
  const { t, lang } = useI18n();
  const { currency } = useSettings();
  const rates = useRates();

  if (amountEur === 0) {
    return <span className={`font-semibold text-emerald-600 dark:text-emerald-400 ${className}`}>{t('common.free')}</span>;
  }

  const amount = convertFromEur(amountEur, currency, rates);
  return (
    <span className={`font-semibold ${className}`}>
      <Ltr>{formatMoney(amount, currency, lang)}</Ltr>
      {suffix && <span className="ms-1 text-xs font-normal text-zinc-500 dark:text-zinc-400">{suffix}</span>}
    </span>
  );
}
