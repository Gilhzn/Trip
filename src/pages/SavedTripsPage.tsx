import { Link } from 'react-router-dom';
import { Briefcase, CalendarDays, ChevronLeft, Trash2 } from 'lucide-react';
import { useI18n, Ltr } from '@/i18n/I18nContext';
import { useTrips } from '@/state/TripContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

export function SavedTripsPage() {
  const { t, lang } = useI18n();
  const { trips, deleteTrip } = useTrips();
  const fmt = new Intl.DateTimeFormat(lang === 'he' ? 'he-IL' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="py-6 md:py-10">
      <h1 className="mb-6 text-2xl font-bold md:text-3xl">{t('saved.title')}</h1>

      {trips.length === 0 ? (
        <EmptyState
          icon={<Briefcase />}
          title={t('saved.empty.title')}
          description={t('saved.empty.desc')}
          action={
            <Link to="/">
              <Button>{t('saved.planNew')}</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {trips.map((trip) => (
            <Card key={trip.id} interactive className="relative">
              <Link to={`/trip/${trip.id}`} className="flex items-center gap-4 p-5">
                <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400">
                  <CalendarDays className="size-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-semibold">{trip.params.destinationName}</h2>
                  <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                    <Ltr>
                      {fmt.format(new Date(trip.params.startDate))} – {fmt.format(new Date(trip.params.endDate))}
                    </Ltr>
                    {' · '}
                    {t('trip.daysCount', { n: trip.days.length })}
                  </p>
                </div>
                <ChevronLeft className="size-5 shrink-0 text-zinc-300 ltr:rotate-180" />
              </Link>
              <button
                onClick={() => {
                  if (window.confirm(t('saved.deleteConfirm'))) deleteTrip(trip.id);
                }}
                aria-label={t('common.delete')}
                className="absolute top-3 end-3 grid size-9 place-items-center rounded-full text-zinc-300 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950"
              >
                <Trash2 className="size-4.5" />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
