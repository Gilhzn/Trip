import { useI18n, Ltr } from '@/i18n/I18nContext';
import type { DayPlan } from '@/types/trip';
import { WeatherIcon } from '@/components/weather/WeatherIcon';

export function DayTabs({ days, selected, onSelect }: { days: DayPlan[]; selected: number; onSelect: (index: number) => void }) {
  const { t, lang } = useI18n();
  const fmt = new Intl.DateTimeFormat(lang === 'he' ? 'he-IL' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'numeric' });

  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
      {days.map((day, i) => (
        <button
          key={day.date}
          onClick={() => onSelect(i)}
          className={`flex shrink-0 flex-col items-center gap-0.5 rounded-2xl border px-4 py-2 transition-colors ${
            selected === i
              ? 'border-primary-500 bg-primary-600 text-white shadow-sm'
              : 'border-zinc-200 bg-white text-zinc-600 hover:border-primary-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300'
          }`}
        >
          <span className="text-sm font-bold">{t('itinerary.dayN', { n: i + 1 })}</span>
          <span className={`flex items-center gap-1.5 text-xs ${selected === i ? 'text-white/85' : 'text-zinc-500 dark:text-zinc-400'}`}>
            <Ltr>{fmt.format(new Date(day.date + 'T12:00:00'))}</Ltr>
            <WeatherIcon code={day.weather.parts.noon.weatherCode} className={`size-4 ${selected === i ? '!text-white/90' : ''}`} />
          </span>
        </button>
      ))}
    </div>
  );
}
