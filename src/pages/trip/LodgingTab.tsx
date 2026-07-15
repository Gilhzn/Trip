import { useMemo, useState } from 'react';
import { Bed } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useTrip } from '@/pages/TripPage';
import { PoiCard } from '@/components/poi/PoiCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { DistanceFilterBar, isCityOnly, TIME_MIN } from '@/components/explore/DistanceFilterBar';
import { useRadiusPois, type RadiusMode } from '@/hooks/useRadiusPois';

export function LodgingTab() {
  const { t } = useI18n();
  const { trip, pois } = useTrip();
  const [mode, setMode] = useState<RadiusMode>('time');
  const [value, setValue] = useState(TIME_MIN);

  const curated = useMemo(() => (pois ?? []).filter((p) => p.category === 'hotel'), [pois]);
  const base = { lat: trip!.params.lat, lon: trip!.params.lon };
  const { items, loading, error } = useRadiusPois({
    base,
    categories: ['hotel'],
    curated,
    mode,
    value,
    cityOnly: isCityOnly(mode, value),
  });

  const hotels = useMemo(
    () => [...items].sort((a, b) => a.straightKm - b.straightKm || (b.poi.popularity ?? 0) - (a.poi.popularity ?? 0)),
    [items],
  );

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold">{t('lodging.title')}</h2>
        <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{t('lodging.priceIndication')}</p>
      </div>

      <DistanceFilterBar mode={mode} value={value} onMode={setMode} onValue={setValue} loading={loading} />

      {error && <p className="text-xs text-amber-600 dark:text-amber-400">{t('filter.error')}</p>}

      {hotels.length === 0 ? (
        <EmptyState icon={<Bed />} title={t('errors.poisLimited')} />
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {hotels.map((r) => (
            <PoiCard key={r.poi.id} poi={r.poi} travel={isCityOnly(mode, value) ? undefined : r.travel} />
          ))}
        </div>
      )}
    </div>
  );
}
