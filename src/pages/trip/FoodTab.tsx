import { useMemo, useState } from 'react';
import { UtensilsCrossed } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useSettings } from '@/state/SettingsContext';
import { useTrip } from '@/pages/TripPage';
import { PoiCard } from '@/components/poi/PoiCard';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Toggle } from '@/components/ui/Toggle';
import { EmptyState } from '@/components/ui/EmptyState';
import { DistanceFilterBar, isCityOnly, TIME_MIN } from '@/components/explore/DistanceFilterBar';
import { useRadiusPois, type RadiusMode } from '@/hooks/useRadiusPois';

type SortKey = 'distance' | 'rating' | 'popularity' | 'price';

export function FoodTab() {
  const { t } = useI18n();
  const settings = useSettings();
  const { trip, pois } = useTrip();
  const [kosherOnly, setKosherOnly] = useState(settings.kosherOnly);
  const [sort, setSort] = useState<SortKey>('distance');
  const [mode, setMode] = useState<RadiusMode>('time');
  const [value, setValue] = useState(TIME_MIN);

  const curated = useMemo(() => (pois ?? []).filter((p) => p.category === 'restaurant'), [pois]);
  const base = { lat: trip!.params.lat, lon: trip!.params.lon };
  const { items, loading, error } = useRadiusPois({
    base,
    categories: ['restaurant'],
    curated,
    mode,
    value,
    cityOnly: isCityOnly(mode, value),
  });

  const restaurants = useMemo(() => {
    let list = items;
    if (kosherOnly) list = list.filter((r) => r.poi.kosher === 'yes' || r.poi.kosher === 'only');
    return [...list].sort((a, b) => {
      if (sort === 'distance') return a.straightKm - b.straightKm;
      if (sort === 'rating') return (b.poi.rating ?? 0) - (a.poi.rating ?? 0);
      if (sort === 'popularity') return (b.poi.popularity ?? 0) - (a.poi.popularity ?? 0);
      return (a.poi.priceLevel ?? 5) - (b.poi.priceLevel ?? 5);
    });
  }, [items, kosherOnly, sort]);

  return (
    <div className="space-y-4 animate-fade-in">
      <h2 className="text-xl font-bold">{t('food.title')}</h2>

      <DistanceFilterBar mode={mode} value={value} onMode={setMode} onValue={setValue} loading={loading} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2.5 text-sm font-medium">
          <Toggle checked={kosherOnly} onChange={setKosherOnly} label={t('food.kosherOnly')} />
          {t('food.kosherOnly')}
        </label>
        <SegmentedControl<SortKey>
          value={sort}
          onChange={setSort}
          options={[
            { value: 'distance', label: t('food.sort.distance') },
            { value: 'rating', label: t('food.sort.rating') },
            { value: 'price', label: t('food.sort.price') },
          ]}
        />
      </div>

      {error && <p className="text-xs text-amber-600 dark:text-amber-400">{t('filter.error')}</p>}

      {restaurants.length === 0 ? (
        <EmptyState
          icon={<UtensilsCrossed />}
          title={kosherOnly ? t('food.kosherEmpty.title') : t('errors.poisLimited')}
          description={kosherOnly ? t('food.kosherEmpty.desc') : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {restaurants.map((r) => (
            <PoiCard key={r.poi.id} poi={r.poi} travel={isCityOnly(mode, value) ? undefined : r.travel} />
          ))}
        </div>
      )}
    </div>
  );
}
