import { useMemo, useState } from 'react';
import { Landmark } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useTrip } from '@/pages/TripPage';
import { PoiCard } from '@/components/poi/PoiCard';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { EmptyState } from '@/components/ui/EmptyState';

type Filter = 'all' | 'indoor' | 'outdoor' | 'kids';

export function AttractionsTab() {
  const { t } = useI18n();
  const { pois } = useTrip();
  const [filter, setFilter] = useState<Filter>('all');

  const attractions = useMemo(() => {
    let list = (pois ?? []).filter((p) => p.category === 'attraction');
    if (filter === 'indoor') list = list.filter((p) => p.indoorOutdoor === 'indoor');
    if (filter === 'outdoor') list = list.filter((p) => p.indoorOutdoor === 'outdoor');
    if (filter === 'kids') list = list.filter((p) => (p.kidFriendly ?? 0) >= 2);
    return [...list].sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
  }, [pois, filter]);

  return (
    <div className="space-y-4 animate-fade-in">
      <h2 className="text-xl font-bold">{t('attractions.title')}</h2>
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
      {attractions.length === 0 ? (
        <EmptyState icon={<Landmark />} title={t('errors.poisLimited')} />
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {attractions.map((poi) => (
            <PoiCard key={poi.id} poi={poi} />
          ))}
        </div>
      )}
    </div>
  );
}
