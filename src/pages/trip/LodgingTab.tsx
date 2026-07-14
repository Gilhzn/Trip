import { useMemo } from 'react';
import { Bed } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useTrip } from '@/pages/TripPage';
import { PoiCard } from '@/components/poi/PoiCard';
import { EmptyState } from '@/components/ui/EmptyState';

export function LodgingTab() {
  const { t } = useI18n();
  const { pois } = useTrip();

  const hotels = useMemo(
    () =>
      (pois ?? [])
        .filter((p) => p.category === 'hotel')
        .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0) || (b.rating ?? 0) - (a.rating ?? 0)),
    [pois],
  );

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold">{t('lodging.title')}</h2>
        <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{t('lodging.priceIndication')}</p>
      </div>
      {hotels.length === 0 ? (
        <EmptyState icon={<Bed />} title={t('errors.poisLimited')} />
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {hotels.map((poi) => (
            <PoiCard key={poi.id} poi={poi} />
          ))}
        </div>
      )}
    </div>
  );
}
