import { CalendarClock } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

/** Flags seasonal-average data so users don't mistake it for a real forecast. */
export function ClimateBadge({ source }: { source: 'forecast' | 'climate' }) {
  const { t } = useI18n();
  if (source === 'forecast') {
    return <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500">{t('weather.forecastBadge')}</span>;
  }
  return (
    <span
      title={t('weather.climateTooltip')}
      className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300"
    >
      <CalendarClock className="size-3" />
      {t('weather.climateBadge')}
    </span>
  );
}
