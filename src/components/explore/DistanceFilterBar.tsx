import { Loader2 } from 'lucide-react';
import { useI18n, Ltr } from '@/i18n/I18nContext';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { AVG_SPEED_KMH, formatDriveTime, formatKm } from '@/lib/travel';
import type { RadiusMode } from '@/hooks/useRadiusPois';

export const TIME_MIN = 15;
export const TIME_MAX = 240;
export const TIME_STEP = 15;
export const KM_MIN = 5;
export const KM_MAX = 250;
export const KM_STEP = 5;

export function isCityOnly(mode: RadiusMode, value: number): boolean {
  return mode === 'time' ? value <= TIME_MIN : value <= KM_MIN;
}

/**
 * Compact "how far from the destination" control that sits at the top of the
 * Food / Attractions / Lodging tabs. Sliding it live-loads farther places.
 */
export function DistanceFilterBar({
  mode,
  value,
  onMode,
  onValue,
  loading,
}: {
  mode: RadiusMode;
  value: number;
  onMode: (mode: RadiusMode) => void;
  onValue: (value: number) => void;
  loading: boolean;
}) {
  const { t, lang } = useI18n();
  const cityOnly = isCityOnly(mode, value);

  const equivKm = Math.round((value / 60) * AVG_SPEED_KMH);
  const equivMinutes = Math.round((value / AVG_SPEED_KMH) * 60);

  return (
    <div className="sticky top-14 z-20 -mx-4 border-b border-zinc-200 bg-white/90 px-4 py-3 backdrop-blur-md md:top-0 md:mx-0 md:rounded-2xl md:border md:px-4 dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-sm font-medium">
          {t('filter.travelFromBase')}
          {loading && <Loader2 className="size-3.5 animate-spin text-primary-600" />}
        </span>
        <SegmentedControl<RadiusMode>
          value={mode}
          onChange={onMode}
          options={[
            { value: 'time', label: t('explore.mode.time') },
            { value: 'km', label: t('explore.mode.km') },
          ]}
        />
      </div>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={mode === 'time' ? TIME_MIN : KM_MIN}
          max={mode === 'time' ? TIME_MAX : KM_MAX}
          step={mode === 'time' ? TIME_STEP : KM_STEP}
          value={value}
          onChange={(e) => onValue(Number(e.target.value))}
          className="h-2 flex-1 cursor-pointer accent-primary-600"
          aria-label={t('filter.travelFromBase')}
        />
        <div className="min-w-24 text-end">
          {cityOnly ? (
            <span className="text-sm font-bold text-primary-700 dark:text-primary-300">{t('filter.inArea')}</span>
          ) : (
            <>
              <div className="text-sm font-bold text-primary-700 dark:text-primary-300">
                <Ltr>{mode === 'time' ? formatDriveTime(value, lang) : formatKm(value, lang)}</Ltr>
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                <Ltr>{mode === 'time' ? `≈ ${formatKm(equivKm, lang)}` : `≈ ${formatDriveTime(equivMinutes, lang)}`}</Ltr>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
