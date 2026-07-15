import { Coffee, Lightbulb, Moon, Sun, Sunrise, Sunset, UtensilsCrossed } from 'lucide-react';
import type { DayPlan, ScheduledItem } from '@/types/trip';
import type { Poi } from '@/types/poi';
import type { TranslationKey } from '@/i18n/he';
import { useI18n, useLocalized } from '@/i18n/I18nContext';
import { PoiCard } from '@/components/poi/PoiCard';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';

const SLOT_ICONS = { morning: Sunrise, noon: Sun, evening: Sunset, night: Moon } as const;

interface TimelineEntry {
  slotKey: TranslationKey;
  icon: typeof Sun;
  poi: Poi;
  reasonKey?: TranslationKey;
  isMeal?: boolean;
}

export function DayTimeline({ day, poiById }: { day: DayPlan; poiById: Map<string, Poi> }) {
  const { t } = useI18n();
  const localized = useLocalized();

  const entries: TimelineEntry[] = [];
  const pushItem = (item: ScheduledItem) => {
    const poi = poiById.get(item.poiId);
    if (!poi) return;
    entries.push({
      slotKey: `itinerary.${item.dayPart}` as TranslationKey,
      icon: SLOT_ICONS[item.dayPart],
      poi,
      reasonKey: `itinerary.reason.${item.reason}` as TranslationKey,
    });
  };

  const morningItems = day.items.filter((i) => i.dayPart === 'morning');
  const noonItems = day.items.filter((i) => i.dayPart === 'noon');
  const eveningItems = day.items.filter((i) => i.dayPart === 'evening');
  const nightItems = day.items.filter((i) => i.dayPart === 'night');

  const breakfast = day.breakfastPoiId ? poiById.get(day.breakfastPoiId) : undefined;
  if (breakfast) entries.push({ slotKey: 'itinerary.breakfast', icon: Coffee, poi: breakfast, isMeal: true });
  morningItems.forEach(pushItem);
  const lunch = day.lunchPoiId ? poiById.get(day.lunchPoiId) : undefined;
  if (lunch) entries.push({ slotKey: 'itinerary.lunch', icon: UtensilsCrossed, poi: lunch, isMeal: true });
  noonItems.forEach(pushItem);
  eveningItems.forEach(pushItem);
  const dinner = day.dinnerPoiId ? poiById.get(day.dinnerPoiId) : undefined;
  if (dinner) entries.push({ slotKey: 'itinerary.dinner', icon: Moon, poi: dinner, isMeal: true });
  nightItems.forEach(pushItem);

  return (
    <div className="space-y-4">
      {day.noteKey && (
        <div className="flex items-start gap-2.5 rounded-2xl bg-amber-50 p-3.5 text-sm text-amber-900 dark:bg-amber-950/60 dark:text-amber-200">
          <Lightbulb className="mt-0.5 size-4.5 shrink-0" />
          <div>
            <p className="font-medium">{t(day.noteKey as TranslationKey)}</p>
            {day.tip && <p className="mt-1 text-amber-800/90 dark:text-amber-300/90">{localized(day.tip)}</p>}
          </div>
        </div>
      )}

      {entries.length === 0 && !day.tip && <EmptyState title={t('itinerary.emptyDay')} />}

      <ol className="relative space-y-4 before:absolute before:inset-y-2 before:start-[15px] before:w-0.5 before:bg-primary-100 dark:before:bg-primary-950">
        {entries.map((entry, i) => {
          const Icon = entry.icon;
          return (
            <li key={`${entry.poi.id}-${i}`} className="relative ps-11">
              <span className="absolute start-0 top-4 grid size-8 place-items-center rounded-full border-2 border-primary-200 bg-white text-primary-600 dark:border-primary-900 dark:bg-zinc-900 dark:text-primary-400">
                <Icon className="size-4" />
              </span>
              <div className="mb-1.5 flex items-center gap-2">
                <span className="text-sm font-semibold text-primary-700 dark:text-primary-300">{t(entry.slotKey)}</span>
                {entry.reasonKey && !entry.isMeal && <Chip tone="sky">{t(entry.reasonKey)}</Chip>}
              </div>
              <PoiCard poi={entry.poi} compact={entry.isMeal} />
            </li>
          );
        })}
      </ol>
    </div>
  );
}
