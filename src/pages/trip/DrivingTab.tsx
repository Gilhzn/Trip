import { Car, CircleParking, ExternalLink, ReceiptText, TrafficCone } from 'lucide-react';
import { useI18n, useLocalized } from '@/i18n/I18nContext';
import { useTrip } from '@/pages/TripPage';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Bilingual } from '@/types/poi';
import type { ReactNode } from 'react';

function TipList({ icon, title, items }: { icon: ReactNode; title: string; items: Bilingual[] }) {
  const localized = useLocalized();
  if (items.length === 0) return null;
  return (
    <Card className="p-5">
      <h3 className="mb-2 flex items-center gap-2 font-semibold">
        <span className="text-primary-600 dark:text-primary-400 [&_svg]:size-4.5">{icon}</span>
        {title}
      </h3>
      <ul className="list-inside list-disc space-y-1.5 text-sm text-zinc-700 dark:text-zinc-300">
        {items.map((item, i) => (
          <li key={i}>{localized(item)}</li>
        ))}
      </ul>
    </Card>
  );
}

export function DrivingTab() {
  const { t } = useI18n();
  const localized = useLocalized();
  const { trip, pack } = useTrip();
  if (!trip) return null;

  return (
    <div className="space-y-4 animate-fade-in">
      <h2 className="text-xl font-bold">{t('driving.title')}</h2>

      {!pack ? (
        <EmptyState icon={<Car />} title={t('errors.poisLimited')} description={t('trip.dataMode.overpass')} />
      ) : (
        <>
          <TipList icon={<TrafficCone />} title={t('driving.rulesTitle')} items={pack.driving.rules} />

          {pack.driving.vignette && (
            <Card className="border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/50">
              <h3 className="mb-1.5 flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-200">
                <ReceiptText className="size-4.5" />
                {t('driving.vignetteTitle')}
              </h3>
              <p className="text-sm text-amber-900/90 dark:text-amber-200/90">{localized(pack.driving.vignette)}</p>
            </Card>
          )}

          <TipList icon={<CircleParking />} title={t('driving.parkingTitle')} items={pack.driving.parking} />
          <TipList icon={<ReceiptText />} title={t('driving.finesTitle')} items={pack.driving.finesAvoidance} />

          {pack.rentalCompanies.length > 0 && (
            <Card className="p-5">
              <h3 className="mb-1 flex items-center gap-2 font-semibold">
                <Car className="size-4.5 text-primary-600 dark:text-primary-400" />
                {t('driving.rentalsTitle')}
              </h3>
              <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">{t('driving.rentalNote')}</p>
              <div className="space-y-2">
                {pack.rentalCompanies.map((company) => (
                  <a
                    key={company.name}
                    href={company.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-3 rounded-xl border border-zinc-100 px-3.5 py-2.5 hover:border-primary-300 hover:bg-primary-50/50 dark:border-zinc-800 dark:hover:bg-primary-950/40"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{company.name}</span>
                      {company.note && <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">{localized(company.note)}</span>}
                    </span>
                    <ExternalLink className="size-4 shrink-0 text-zinc-400" />
                  </a>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
