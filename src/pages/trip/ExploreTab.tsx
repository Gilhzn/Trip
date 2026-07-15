import { useI18n } from '@/i18n/I18nContext';
import { useTrip } from '@/pages/TripPage';
import { NearbyExplorer } from '@/components/explore/NearbyExplorer';

export function ExploreTab() {
  const { t } = useI18n();
  const { trip } = useTrip();
  if (!trip) return null;

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold">{t('explore.title')}</h2>
        <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{t('explore.subtitle')}</p>
      </div>

      <NearbyExplorer
        base={{ lat: trip.params.lat, lon: trip.params.lon }}
        enableGeolocation
        maxMinutes={300}
        maxKm={400}
      />
    </div>
  );
}
