import { useState } from 'react';
import { Car, ChevronDown, ExternalLink, Navigation } from 'lucide-react';
import type { Poi } from '@/types/poi';
import { useI18n, useLocalized, Ltr } from '@/i18n/I18nContext';
import { wazeUrl, googleMapsUrl } from '@/services/navigation';
import { formatDriveTime, formatKm } from '@/lib/travel';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Rating } from '@/components/ui/Rating';
import { PriceLevel } from '@/components/ui/PriceLevel';
import { Price } from '@/components/money/Price';

const KOSHER_TONE = { yes: 'green', only: 'green', no: 'red', unknown: 'neutral' } as const;

export interface TravelInfo {
  km: number;
  minutes: number;
}

export function PoiCard({ poi, compact = false, travel }: { poi: Poi; compact?: boolean; travel?: TravelInfo }) {
  const { t, lang } = useI18n();
  const localized = useLocalized();
  const [expanded, setExpanded] = useState(false);
  const hasDetails = Boolean(poi.description);

  return (
    <Card className="overflow-hidden">
      <div
        className={`flex items-start gap-3 p-4 ${hasDetails ? 'cursor-pointer' : ''}`}
        onClick={hasDetails ? () => setExpanded((v) => !v) : undefined}
      >
        <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary-50 text-2xl dark:bg-primary-950">
          {poi.emoji ?? '📍'}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold leading-snug">{localized(poi.name)}</h3>
            {hasDetails && (
              <ChevronDown className={`mt-1 size-4 shrink-0 text-zinc-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            )}
          </div>

          {travel && (
            <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-semibold text-primary-700 dark:bg-primary-950 dark:text-primary-300">
              <Car className="size-3.5" />
              <span>
                ~<Ltr>{formatDriveTime(travel.minutes, lang)}</Ltr>
                {' · '}
                <Ltr>{formatKm(travel.km, lang)}</Ltr>
              </span>
            </div>
          )}

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <Rating value={poi.rating} />
            <PriceLevel level={poi.priceLevel} />
            {poi.entryFeeEur !== undefined && (
              <span className="text-sm text-zinc-600 dark:text-zinc-300">
                {t('attractions.entryFee')}: <Price amountEur={poi.entryFeeEur} />
              </span>
            )}
            {poi.pricePerNightEur !== undefined && (
              <span className="text-sm text-zinc-600 dark:text-zinc-300">
                {t('common.from')}
                <Price amountEur={poi.pricePerNightEur} suffix={t('common.perNight')} />
              </span>
            )}
          </div>

          {!compact && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {poi.kosher && poi.kosher !== 'unknown' && (
                <Chip tone={KOSHER_TONE[poi.kosher]}>{t(`food.kosher.${poi.kosher}`)}</Chip>
              )}
              {(poi.glutenFree === 'yes' || poi.glutenFree === 'only') && (
                <Chip tone="green">{t(`food.gluten.${poi.glutenFree}`)}</Chip>
              )}
              {poi.cuisine?.slice(0, 2).map((c) => (
                <Chip key={c}>{c}</Chip>
              ))}
              {poi.indoorOutdoor && poi.category === 'attraction' && (
                <Chip tone="sky">{t(`attractions.${poi.indoorOutdoor}`)}</Chip>
              )}
              {(poi.kidFriendly ?? 0) >= 2 && <Chip tone="accent">{t('attractions.kidFriendly')}</Chip>}
              {poi.visitDurationMin && (
                <Chip>{t('itinerary.visitDuration', { n: poi.visitDurationMin })}</Chip>
              )}
            </div>
          )}
        </div>
      </div>

      {expanded && poi.description && (
        <p className="border-t border-zinc-100 px-4 py-3 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
          {localized(poi.description)}
        </p>
      )}

      <div className="flex items-center gap-2 border-t border-zinc-100 px-4 py-2.5 dark:border-zinc-800">
        <a
          href={wazeUrl(poi.lat, poi.lon)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#33ccff]/15 px-3 text-sm font-semibold text-[#0f7396] hover:bg-[#33ccff]/25 dark:text-[#6fd6f5]"
        >
          <Navigation className="size-4" />
          {t('common.openInWaze')}
        </a>
        <a
          href={googleMapsUrl(poi.lat, poi.lon)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          {t('common.openInGoogleMaps')}
        </a>
        {poi.website && (
          <a
            href={poi.website}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="ms-auto inline-flex h-9 items-center gap-1 rounded-lg px-2.5 text-sm text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            aria-label={t('common.website')}
          >
            <ExternalLink className="size-4" />
          </a>
        )}
      </div>
    </Card>
  );
}
