import { Star } from 'lucide-react';
import { Ltr } from '@/i18n/I18nContext';

export function Rating({ value }: { value?: number }) {
  if (value === undefined) return null;
  return (
    <span className="inline-flex items-center gap-1 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
      <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden />
      <Ltr>{value.toFixed(1)}</Ltr>
    </span>
  );
}
