import { useMemo, useState } from 'react';
import { UtensilsCrossed } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useSettings } from '@/state/SettingsContext';
import { useTrip } from '@/pages/TripPage';
import { PoiCard } from '@/components/poi/PoiCard';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Toggle } from '@/components/ui/Toggle';
import { EmptyState } from '@/components/ui/EmptyState';

type SortKey = 'rating' | 'popularity' | 'price';

export function FoodTab() {
  const { t } = useI18n();
  const settings = useSettings();
  const { pois } = useTrip();
  const [kosherOnly, setKosherOnly] = useState(settings.kosherOnly);
  const [sort, setSort] = useState<SortKey>('rating');

  const restaurants = useMemo(() => {
    let list = (pois ?? []).filter((p) => p.category === 'restaurant');
    if (kosherOnly) list = list.filter((p) => p.kosher === 'yes' || p.kosher === 'only');
    return [...list].sort((a, b) => {
      if (sort === 'rating') return (b.rating ?? 0) - (a.rating ?? 0);
      if (sort === 'popularity') return (b.popularity ?? 0) - (a.popularity ?? 0);
      return (a.priceLevel ?? 5) - (b.priceLevel ?? 5);
    });
  }, [pois, kosherOnly, sort]);

  return (
    <div className="space-y-4 animate-fade-in">
      <h2 className="text-xl font-bold">{t('food.title')}</h2>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2.5 text-sm font-medium">
          <Toggle checked={kosherOnly} onChange={setKosherOnly} label={t('food.kosherOnly')} />
          {t('food.kosherOnly')}
        </label>
        <SegmentedControl<SortKey>
          value={sort}
          onChange={setSort}
          options={[
            { value: 'rating', label: t('food.sort.rating') },
            { value: 'popularity', label: t('food.sort.popularity') },
            { value: 'price', label: t('food.sort.price') },
          ]}
        />
      </div>

      {restaurants.length === 0 ? (
        <EmptyState
          icon={<UtensilsCrossed />}
          title={kosherOnly ? t('food.kosherEmpty.title') : t('errors.poisLimited')}
          description={kosherOnly ? t('food.kosherEmpty.desc') : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {restaurants.map((poi) => (
            <PoiCard key={poi.id} poi={poi} />
          ))}
        </div>
      )}
    </div>
  );
}
