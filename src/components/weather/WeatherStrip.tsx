import { Droplets } from 'lucide-react';
import type { WeatherDay } from '@/types/weather';
import { DAY_PARTS } from '@/types/weather';
import { useI18n, Ltr } from '@/i18n/I18nContext';
import { WeatherIcon } from './WeatherIcon';
import { ClimateBadge } from './ClimateBadge';

const PART_LABEL_KEYS = {
  morning: 'itinerary.morning',
  noon: 'itinerary.noon',
  evening: 'itinerary.evening',
  night: 'itinerary.night',
} as const;

/** Four-part (morning/noon/evening/night) weather summary for one day. */
export function WeatherStrip({ day }: { day: WeatherDay }) {
  const { t } = useI18n();
  return (
    <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-3 dark:border-sky-950 dark:bg-sky-950/30">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-xs font-semibold text-sky-800 dark:text-sky-300">
          {t('weather.title')} · <Ltr>{`${day.tMinC}°–${day.tMaxC}°`}</Ltr>
        </span>
        <ClimateBadge source={day.source} />
      </div>
      <div className="grid grid-cols-4 gap-1">
        {DAY_PARTS.map((part) => {
          const w = day.parts[part];
          return (
            <div key={part} className="flex flex-col items-center gap-0.5 rounded-xl py-1.5">
              <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">{t(PART_LABEL_KEYS[part])}</span>
              <WeatherIcon code={w.weatherCode} className="size-6" />
              <span className="text-sm font-bold">
                <Ltr>{`${Math.round(w.tempC)}°`}</Ltr>
              </span>
              {w.precipProbability >= 20 && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-sky-600 dark:text-sky-400">
                  <Droplets className="size-3" />
                  <Ltr>{`${w.precipProbability}%`}</Ltr>
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
