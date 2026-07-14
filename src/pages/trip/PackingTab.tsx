import { useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { useI18n, useLocalized } from '@/i18n/I18nContext';
import { useTrip } from '@/pages/TripPage';
import { loadState, saveState } from '@/state/storage';
import { Card } from '@/components/ui/Card';
import type { PackingItem } from '@/types/trip';
import type { TranslationKey } from '@/i18n/he';

const CATEGORY_ORDER: PackingItem['category'][] = ['documents', 'clothing', 'health', 'electronics', 'gear', 'kids'];

export function PackingTab() {
  const { t } = useI18n();
  const localized = useLocalized();
  const { trip } = useTrip();
  const storageKey = `packing.${trip?.id}`;
  const [checked, setChecked] = useState<string[]>(() => loadState<string[]>(storageKey, []));

  const groups = useMemo(() => {
    const byCategory = new Map<PackingItem['category'], PackingItem[]>();
    for (const item of trip?.packingList ?? []) {
      const list = byCategory.get(item.category) ?? [];
      list.push(item);
      byCategory.set(item.category, list);
    }
    return CATEGORY_ORDER.filter((c) => byCategory.has(c)).map((c) => ({ category: c, items: byCategory.get(c)! }));
  }, [trip]);

  if (!trip) return null;

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      saveState(storageKey, next);
      return next;
    });
  };

  const total = trip.packingList.length;
  const done = checked.filter((id) => trip.packingList.some((i) => i.id === id)).length;

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold">{t('packing.title')}</h2>
        <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{t('packing.subtitle')}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-primary-500 transition-all"
            style={{ width: total ? `${(done / total) * 100}%` : '0%' }}
          />
        </div>
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
          {t('packing.progress', { done, total })}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {groups.map(({ category, items }) => (
          <Card key={category} className="p-4">
            <h3 className="mb-2 font-semibold text-primary-700 dark:text-primary-300">
              {t(`packing.category.${category}` as TranslationKey)}
            </h3>
            <ul className="space-y-1">
              {items.map((item) => {
                const isChecked = checked.includes(item.id);
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => toggle(item.id)}
                      className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-start hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    >
                      <span
                        className={`grid size-5.5 shrink-0 place-items-center rounded-md border-2 transition-colors ${
                          isChecked
                            ? 'border-primary-500 bg-primary-500 text-white'
                            : 'border-zinc-300 dark:border-zinc-600'
                        }`}
                      >
                        {isChecked && <Check className="size-3.5" strokeWidth={3} />}
                      </span>
                      <span className={`text-sm ${isChecked ? 'text-zinc-400 line-through dark:text-zinc-500' : ''}`}>
                        {localized(item.label)}
                        {item.qtyHint && (
                          <span className="ms-2 text-xs text-zinc-400 dark:text-zinc-500">({localized(item.qtyHint)})</span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
