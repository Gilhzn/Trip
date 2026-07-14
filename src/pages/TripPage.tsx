import { Link, Outlet, useOutletContext, useParams } from 'react-router-dom';
import { CalendarDays, Database, MapPin, Users } from 'lucide-react';
import { useI18n, Ltr } from '@/i18n/I18nContext';
import { useTripData, type TripData } from '@/hooks/useTripData';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/Skeleton';

export function useTrip(): TripData {
  return useOutletContext<TripData>();
}

function formatRange(start: string, end: string, lang: string): string {
  const fmt = new Intl.DateTimeFormat(lang === 'he' ? 'he-IL' : 'en-GB', { day: 'numeric', month: 'short' });
  return `${fmt.format(new Date(start))} – ${fmt.format(new Date(end))}`;
}

export function TripPage() {
  const { id } = useParams();
  const { t, lang } = useI18n();
  const data = useTripData(id);

  if (!data.trip) {
    return (
      <div className="py-16">
        <EmptyState
          icon={<MapPin />}
          title={t('trip.notFound')}
          description={t('trip.notFound.desc')}
          action={
            <Link to="/">
              <Button>{t('saved.planNew')}</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const { trip } = data;

  return (
    <div className="py-5 md:py-8">
      <header className="mb-5">
        <h1 className="text-2xl font-bold md:text-3xl">{trip.params.destinationName}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Chip tone="primary">
            <CalendarDays className="size-3.5" />
            <Ltr>{formatRange(trip.params.startDate, trip.params.endDate, lang)}</Ltr>
          </Chip>
          <Chip>{t('trip.daysCount', { n: trip.days.length })}</Chip>
          {trip.params.travelers.length > 0 && (
            <Chip>
              <Users className="size-3.5" />
              {t('trip.travelersCount', { n: trip.params.travelers.length })}
            </Chip>
          )}
          {trip.dataMode === 'overpass' && (
            <Chip tone="orange">
              <Database className="size-3.5" />
              {t('trip.dataMode.overpass')}
            </Chip>
          )}
        </div>
      </header>

      {data.loading && !data.pois ? (
        <div className="space-y-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <Outlet context={data} />
      )}
    </div>
  );
}
