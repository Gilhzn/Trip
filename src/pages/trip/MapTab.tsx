import { useMemo, useState } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import { useTrip } from '@/pages/TripPage';
import { TripMap } from '@/components/map/TripMap';
import { CATEGORY_COLORS } from '@/lib/leaflet-setup';
import type { TranslationKey } from '@/i18n/he';

const LEGEND: { category: keyof typeof CATEGORY_COLORS; labelKey: TranslationKey }[] = [
  { category: 'attraction', labelKey: 'map.category.attraction' },
  { category: 'restaurant', labelKey: 'map.category.restaurant' },
  { category: 'hotel', labelKey: 'map.category.hotel' },
  { category: 'parking', labelKey: 'map.category.parking' },
];

export function MapTab() {
  const { t } = useI18n();
  const { trip, pois } = useTrip();
  const [dayFilter, setDayFilter] = useState<number | 'all'>('all');

  const visiblePois = useMemo(() => {
    const all = pois ?? [];
    if (dayFilter === 'all' || !trip) return all;
    const day = trip.days[dayFilter];
    if (!day) return all;
    const dayIds = new Set([...day.items.map((i) => i.poiId), day.lunchPoiId, day.dinnerPoiId].filter(Boolean));
    return all.filter((p) => dayIds.has(p.id));
  }, [pois, trip, dayFilter]);

  const routeIds = useMemo(() => {
    if (dayFilter === 'all' || !trip) return [];
    const day = trip.days[dayFilter];
    if (!day) return [];
    return [...day.items.map((i) => i.poiId), ...(day.lunchPoiId ? [day.lunchPoiId] : [])];
  }, [trip, dayFilter]);

  if (!trip) return null;

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">{t('map.title')}</h2>
        <select
          value={String(dayFilter)}
          onChange={(e) => setDayFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium dark:border-zinc-700 dark:bg-zinc-900"
          aria-label={t('map.filterByDay')}
        >
          <option value="all">{t('map.allDays')}</option>
          {trip.days.map((day, i) => (
            <option key={day.date} value={i}>
              {t('itinerary.dayN', { n: i + 1 })}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {LEGEND.map(({ category, labelKey }) => (
          <span key={category} className="inline-flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300">
            <span className="size-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[category] }} />
            {t(labelKey)}
          </span>
        ))}
      </div>

      <div className="h-[60dvh] min-h-80 md:h-[65dvh]">
        <TripMap center={{ lat: trip.params.lat, lon: trip.params.lon }} pois={visiblePois} routePoiIds={routeIds} />
      </div>
    </div>
  );
}
