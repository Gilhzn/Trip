import { useMemo, useState } from 'react';
import { Landmark } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useTrip } from '@/pages/TripPage';
import { PoiCard } from '@/components/poi/PoiCard';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { EmptyState } from '@/components/ui/EmptyState';
import { DistanceFilterBar, isCityOnly, TIME_MIN } from '@/components/explore/DistanceFilterBar';
import { useRadiusPois, type RadiusMode } from '@/hooks/useRadiusPois';

type Filter = 'all' | 'indoor' | 'outdoor' | 'kids';

export function AttractionsTab() {
  const { t } = useI18n();
  const { trip, pois } = useTrip();
  const [filter, setFilter] = useState<Filter>('all');
  const [mode, setMode] = useState<RadiusMode>('time');
  const [value, setValue] = useState(TIME_MIN);

  const curated = useMemo(() => (pois ?? []).filter((p) => p.category === 'attraction'), [pois]);
  const base = { lat: trip!.params.lat, lon: trip!.params.lon };
  const { items, loading, error } = useRadiusPois({
    base,
    categories: ['attraction'],
    curated,
    mode,
    value,
    cityOnly: isCityOnly(mode, value),
  });

  const attractions = useMemo(() => {
    let list = items;
    if (filter === 'indoor') list = list.filter((r) => r.poi.indoorOutdoor === 'indoor');
    if (filter === 'outdoor') list = list.filter((r) => r.poi.indoorOutdoor === 'outdoor');
    if (filter === 'kids') list = list.filter((r) => (r.poi.kidFriendly ?? 0) >= 2);
    // Nearest first; notable/popular breaks ties.
    return [...list].sort((a, b) => a.straightKm - b.straightKm || (b.poi.popularity ?? 0) - (a.poi.popularity ?? 0));
  }, [items, filter]);

  return (
    <div className="space-y-4 animate-fade-in">
      <h2 className="text-xl font-bold">{t('attractions.title')}</h2>

      <DistanceFilterBar mode={mode} value={value} onMode={setMode} onValue={setValue} loading={loading} />

      <SegmentedControl<Filter>
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: t('attractions.filter.all') },
          { value: 'indoor', label: t('attractions.filter.indoor') },
          { value: 'outdoor', label: t('attractions.filter.outdoor') },
          { value: 'kids', label: t('attractions.filter.kids') },
        ]}
      />

      {error && <p className="text-xs text-amber-600 dark:text-amber-400">{t('filter.error')}</p>}

      {attractions.length === 0 ? (
        <EmptyState icon={<Landmark />} title={t('errors.poisLimited')} />
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {attractions.map((r) => (
            <PoiCard key={r.poi.id} poi={r.poi} travel={isCityOnly(mode, value) ? undefined : r.travel} />
          ))}
        </div>
      )}
    </div>
  );
}
