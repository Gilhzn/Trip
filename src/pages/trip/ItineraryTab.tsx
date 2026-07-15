import { useState } from 'react';
import { ChevronDown, Compass } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useTrip } from '@/pages/TripPage';
import { DayTabs } from '@/components/itinerary/DayTabs';
import { DayTimeline } from '@/components/itinerary/DayTimeline';
import { WeatherStrip } from '@/components/weather/WeatherStrip';
import { NearbyExplorer } from '@/components/explore/NearbyExplorer';

export function ItineraryTab() {
  const { t } = useI18n();
  const { trip, poiById } = useTrip();
  const [selected, setSelected] = useState(0);
  const [nearbyOpen, setNearbyOpen] = useState(false);
  if (!trip) return null;
  const day = trip.days[Math.min(selected, trip.days.length - 1)];

  return (
    <div className="space-y-4 animate-fade-in">
      <DayTabs days={trip.days} selected={selected} onSelect={setSelected} />
      <WeatherStrip day={day.weather} />
      <DayTimeline day={day} poiById={poiById} />

      {/* Day-trip / nearby discovery within a travel-time or distance radius */}
      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setNearbyOpen((v) => !v)}
          className="flex w-full items-center gap-3 p-4 text-start"
          aria-expanded={nearbyOpen}
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400">
            <Compass className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">{t('itinerary.nearby.title')}</span>
            <span className="block text-xs text-zinc-500 dark:text-zinc-400">{t('itinerary.nearby.subtitle')}</span>
          </span>
          <ChevronDown className={`size-5 shrink-0 text-zinc-400 transition-transform ${nearbyOpen ? 'rotate-180' : ''}`} />
        </button>

        {nearbyOpen && (
          <div className="border-t border-zinc-100 p-4 dark:border-zinc-800">
            <NearbyExplorer
              base={{ lat: trip.params.lat, lon: trip.params.lon }}
              maxMinutes={120}
              maxKm={150}
              defaultCategories={['attraction']}
            />
          </div>
        )}
      </section>
    </div>
  );
}
