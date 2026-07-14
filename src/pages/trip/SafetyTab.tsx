import { ExternalLink, Phone, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useI18n, useLocalized, Ltr } from '@/i18n/I18nContext';
import { useTrip } from '@/pages/TripPage';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import type { TranslationKey } from '@/i18n/he';

const LEVEL_STYLES: Record<number, string> = {
  1: 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/50 dark:border-emerald-900 dark:text-emerald-200',
  2: 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/50 dark:border-amber-900 dark:text-amber-200',
  3: 'bg-orange-50 border-orange-200 text-orange-900 dark:bg-orange-950/50 dark:border-orange-900 dark:text-orange-200',
  4: 'bg-red-50 border-red-200 text-red-900 dark:bg-red-950/50 dark:border-red-900 dark:text-red-200',
};

export function SafetyTab() {
  const { t } = useI18n();
  const localized = useLocalized();
  const { trip, pack } = useTrip();
  if (!trip) return null;

  const origin = trip.params.originCountry;
  const advisory =
    pack?.advisories.find((a) => a.originCountry === origin) ??
    pack?.advisories.find((a) => a.originCountry === 'generic');

  return (
    <div className="space-y-4 animate-fade-in">
      <h2 className="text-xl font-bold">{t('safety.title')}</h2>

      {!pack ? (
        <EmptyState icon={<ShieldCheck />} title={t('errors.poisLimited')} description={t('trip.dataMode.overpass')} />
      ) : (
        <>
          {advisory && (
            <Card className={`border p-5 ${LEVEL_STYLES[advisory.level]}`}>
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 size-6 shrink-0" />
                <div className="min-w-0">
                  <h3 className="font-bold">{t('safety.advisoryTitle')}</h3>
                  {advisory.originCountry !== 'generic' && (
                    <p className="text-sm opacity-80">
                      {t('safety.advisoryFor', { country: t(`country.${advisory.originCountry}` as TranslationKey) })}
                    </p>
                  )}
                  <p className="mt-2 text-sm font-semibold">{t(`safety.level.${advisory.level}` as TranslationKey)}</p>
                  <p className="mt-1.5 text-sm">{localized(advisory.summary)}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <a
                      href={advisory.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold underline underline-offset-2"
                    >
                      {t('safety.officialSource')}
                      <ExternalLink className="size-3.5" />
                    </a>
                    <span className="opacity-70">{t('safety.updatedAt', { date: advisory.updatedAt })}</span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {advisory && advisory.tips.length > 0 && (
            <Card className="p-5">
              <h3 className="mb-2 font-semibold">{t('safety.tipsTitle')}</h3>
              <ul className="list-inside list-disc space-y-1.5 text-sm text-zinc-700 dark:text-zinc-300">
                {advisory.tips.map((tip, i) => (
                  <li key={i}>{localized(tip)}</li>
                ))}
              </ul>
            </Card>
          )}

          <Card className="p-5">
            <h3 className="mb-3 flex items-center gap-2 font-semibold">
              <Phone className="size-4.5 text-primary-600" />
              {t('safety.emergencyTitle')}
            </h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: t('safety.emergency.general'), number: pack.emergency.general },
                { label: t('safety.emergency.police'), number: pack.emergency.police },
                { label: t('safety.emergency.ambulance'), number: pack.emergency.ambulance },
              ]
                .filter((e) => e.number)
                .map((e) => (
                  <a
                    key={e.label}
                    href={`tel:${e.number}`}
                    className="rounded-xl bg-zinc-50 py-3 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                  >
                    <span className="block text-xl font-extrabold text-red-600 dark:text-red-400">
                      <Ltr>{e.number}</Ltr>
                    </span>
                    <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">{e.label}</span>
                  </a>
                ))}
            </div>
          </Card>

          <p className="px-1 text-xs leading-relaxed text-zinc-400 dark:text-zinc-500">{t('safety.disclaimer')}</p>
        </>
      )}
    </div>
  );
}
