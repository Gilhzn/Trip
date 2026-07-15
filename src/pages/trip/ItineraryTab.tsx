import { useMemo, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useSettings } from '@/state/SettingsContext';
import { loadState, saveState } from '@/state/storage';
import { useTrip } from '@/pages/TripPage';
import { DayTabs } from '@/components/itinerary/DayTabs';
import { DayTimeline } from '@/components/itinerary/DayTimeline';
import { WeatherStrip } from '@/components/weather/WeatherStrip';
import {
  generateItinerary,
  MAX_ACTIVITIES_PER_DAY,
  MIN_ACTIVITIES_PER_DAY,
} from '@/engine/itinerary';
import { buildPartyProfile } from '@/engine/scoring';

export function ItineraryTab() {
  const { t } = useI18n();
  const settings = useSettings();
  const { trip, poiById, pois, pack } = useTrip();
  const [selected, setSelected] = useState(0);

  const defaultDensity = useMemo(() => {
    const ages = trip && trip.params.travelers.length > 0 ? trip.params.travelers.map((tr) => tr.age) : [30];
    return buildPartyProfile(ages).slotBudget;
  }, [trip]);

  const [density, setDensity] = useState<number>(() =>
    trip ? loadState<number>(`density.${trip.id}`, defaultDensity) : defaultDensity,
  );

  // Re-run the (cheap, deterministic, offline) engine when the density changes,
  // reusing the trip's stored weather + POIs — no network call.
  const days = useMemo(() => {
    if (!trip) return [];
    return generateItinerary({
      params: trip.params,
      pois: pois ?? [],
      weather: trip.days.map((d) => d.weather),
      kosherOnly: settings.kosherOnly,
      localTips: pack?.localTips ?? [],
      activitiesPerDay: density,
    });
  }, [trip, pois, pack, density, settings.kosherOnly]);

  if (!trip) return null;

  const changeDensity = (value: number) => {
    setDensity(value);
    saveState(`density.${trip.id}`, value);
  };

  const day = days[Math.min(selected, days.length - 1)];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Content density: "a little" ↔ "a lot" */}
      <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <SlidersHorizontal className="size-4 text-primary-600" />
            {t('itinerary.density.label')}
          </span>
          <span className="text-sm font-bold text-primary-700 dark:text-primary-300">
            {t('itinerary.density.perDay', { n: density })}
          </span>
        </div>
        <input
          type="range"
          min={MIN_ACTIVITIES_PER_DAY}
          max={MAX_ACTIVITIES_PER_DAY}
          step={1}
          value={density}
          onChange={(e) => changeDensity(Number(e.target.value))}
          className="h-2 w-full cursor-pointer accent-primary-600"
          aria-label={t('itinerary.density.label')}
        />
        <div className="mt-1 flex justify-between text-xs text-zinc-400 dark:text-zinc-500">
          <span>{t('itinerary.density.few')}</span>
          <span>{t('itinerary.density.many')}</span>
        </div>
      </div>

      <DayTabs days={days} selected={selected} onSelect={setSelected} />
      {day && (
        <>
          <WeatherStrip day={day.weather} />
          <DayTimeline day={day} poiById={poiById} />
        </>
      )}
    </div>
  );
}
