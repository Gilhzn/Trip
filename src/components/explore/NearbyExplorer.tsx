import { useMemo, useState } from 'react';
import { Bed, CircleParking, Compass, Landmark, LocateFixed, Loader2, MapPin, UtensilsCrossed } from 'lucide-react';
import type { Poi } from '@/types/poi';
import { useI18n, Ltr } from '@/i18n/I18nContext';
import { exploreAround, type ExploreCategory } from '@/services/exploreService';
import { haversineMeters } from '@/engine/clustering';
import {
  AVG_SPEED_KMH,
  driveMinutesFromStraightKm,
  formatDriveTime,
  formatKm,
  roadKmFromStraight,
  straightRadiusKmForMinutes,
  straightRadiusKmForRoadKm,
} from '@/lib/travel';
import { PoiCard, type TravelInfo } from '@/components/poi/PoiCard';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/Skeleton';
import type { TranslationKey } from '@/i18n/he';

type Mode = 'time' | 'km';
type CenterMode = 'base' | 'myLocation';
type Status = 'idle' | 'loading' | 'error' | 'done';
type LocStatus = 'idle' | 'locating' | 'denied' | 'error' | 'unsupported';

const CATEGORY_META: { key: ExploreCategory; icon: typeof Landmark; labelKey: TranslationKey }[] = [
  { key: 'attraction', icon: Landmark, labelKey: 'map.category.attraction' },
  { key: 'restaurant', icon: UtensilsCrossed, labelKey: 'map.category.restaurant' },
  { key: 'hotel', icon: Bed, labelKey: 'map.category.hotel' },
  { key: 'parking', icon: CircleParking, labelKey: 'map.category.parking' },
];

interface Result {
  poi: Poi;
  travel: TravelInfo;
  straightKm: number;
}

export interface NearbyExplorerProps {
  base: { lat: number; lon: number };
  /** show the "detect my location" center toggle (Explore tab only) */
  enableGeolocation?: boolean;
  /** slider ceiling in minutes (time mode) */
  maxMinutes?: number;
  /** slider ceiling in km (km mode) */
  maxKm?: number;
  defaultCategories?: ExploreCategory[];
}

export function NearbyExplorer({
  base,
  enableGeolocation = false,
  maxMinutes = 300,
  maxKm = 400,
  defaultCategories = ['attraction', 'restaurant'],
}: NearbyExplorerProps) {
  const { t, lang } = useI18n();

  const [centerMode, setCenterMode] = useState<CenterMode>('base');
  const [myLoc, setMyLoc] = useState<{ lat: number; lon: number } | null>(null);
  const [locStatus, setLocStatus] = useState<LocStatus>('idle');

  const [mode, setMode] = useState<Mode>('time');
  const [minutes, setMinutes] = useState(Math.min(90, maxMinutes));
  const [km, setKm] = useState(Math.min(100, maxKm));
  const [categories, setCategories] = useState<Set<ExploreCategory>>(new Set(defaultCategories));

  const [results, setResults] = useState<Result[] | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [resultFilter, setResultFilter] = useState<ExploreCategory | 'all'>('all');

  const center = enableGeolocation && centerMode === 'myLocation' && myLoc ? myLoc : base;

  const equivKm = Math.round((minutes / 60) * AVG_SPEED_KMH);
  const equivMinutes = Math.round((km / AVG_SPEED_KMH) * 60);

  const detectLocation = () => {
    if (!('geolocation' in navigator)) {
      setLocStatus('unsupported');
      return;
    }
    setLocStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMyLoc({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLocStatus('idle');
        setCenterMode('myLocation');
      },
      (err) => setLocStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'error'),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  };

  const toggleCategory = (key: ExploreCategory) => {
    setCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const runSearch = async () => {
    if (categories.size === 0) return;
    setStatus('loading');
    setResults(null);
    const radiusStraightKm =
      mode === 'time' ? straightRadiusKmForMinutes(minutes) : straightRadiusKmForRoadKm(km);
    try {
      const pois = await exploreAround(center, radiusStraightKm, [...categories]);
      const mapped: Result[] = pois
        .map((poi) => {
          const straightKm = haversineMeters(center.lat, center.lon, poi.lat, poi.lon) / 1000;
          return {
            poi,
            straightKm,
            travel: { km: roadKmFromStraight(straightKm), minutes: driveMinutesFromStraightKm(straightKm) },
          };
        })
        .filter((r) => (mode === 'time' ? r.travel.minutes <= minutes : r.travel.km <= km))
        .sort((a, b) => a.straightKm - b.straightKm);
      setResults(mapped);
      setResultFilter('all');
      setStatus('done');
    } catch {
      setStatus('error');
    }
  };

  const visibleResults = useMemo(() => {
    if (!results) return [];
    return resultFilter === 'all' ? results : results.filter((r) => r.poi.category === resultFilter);
  }, [results, resultFilter]);

  const resultCategories = useMemo(() => {
    if (!results) return [];
    const present = new Set(results.map((r) => r.poi.category));
    return CATEGORY_META.filter((c) => present.has(c.key));
  }, [results]);

  return (
    <div className="space-y-4">
      {/* Search center (Explore tab only) */}
      {enableGeolocation && (
        <div>
          <span className="mb-1.5 block text-sm font-medium">{t('explore.center.label')}</span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setCenterMode('base')}
              className={`inline-flex h-10 items-center gap-1.5 rounded-xl border px-3.5 text-sm font-medium transition-colors ${
                centerMode === 'base'
                  ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300'
                  : 'border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300'
              }`}
            >
              <MapPin className="size-4" />
              {t('explore.center.base')}
            </button>
            <button
              onClick={() => (myLoc ? setCenterMode('myLocation') : detectLocation())}
              disabled={locStatus === 'locating'}
              className={`inline-flex h-10 items-center gap-1.5 rounded-xl border px-3.5 text-sm font-medium transition-colors disabled:opacity-70 ${
                centerMode === 'myLocation' && myLoc
                  ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300'
                  : 'border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300'
              }`}
            >
              {locStatus === 'locating' ? <Loader2 className="size-4 animate-spin" /> : <LocateFixed className="size-4" />}
              {locStatus === 'locating' ? t('explore.locating') : myLoc ? t('explore.center.myLocation') : t('explore.locate')}
            </button>
          </div>
          {(locStatus === 'denied' || locStatus === 'error' || locStatus === 'unsupported') && (
            <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
              {t(`explore.location${locStatus === 'denied' ? 'Denied' : locStatus === 'unsupported' ? 'Unsupported' : 'Error'}` as TranslationKey)}
            </p>
          )}
        </div>
      )}

      {/* Radius slider */}
      <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="mb-3 flex items-center justify-between">
          <SegmentedControl<Mode>
            value={mode}
            onChange={setMode}
            options={[
              { value: 'time', label: t('explore.mode.time') },
              { value: 'km', label: t('explore.mode.km') },
            ]}
          />
          <div className="text-end">
            <div className="text-lg font-bold text-primary-700 dark:text-primary-300">
              <Ltr>{mode === 'time' ? formatDriveTime(minutes, lang) : formatKm(km, lang)}</Ltr>
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {mode === 'time'
                ? t('explore.radius.equivKm', { value: formatKm(equivKm, lang) })
                : t('explore.radius.equivTime', { value: formatDriveTime(equivMinutes, lang) })}
            </div>
          </div>
        </div>
        {mode === 'time' ? (
          <input
            type="range"
            min={30}
            max={maxMinutes}
            step={30}
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
            className="h-2 w-full cursor-pointer accent-primary-600"
            aria-label={t('explore.mode.time')}
          />
        ) : (
          <input
            type="range"
            min={10}
            max={maxKm}
            step={10}
            value={km}
            onChange={(e) => setKm(Number(e.target.value))}
            className="h-2 w-full cursor-pointer accent-primary-600"
            aria-label={t('explore.mode.km')}
          />
        )}
        <div className="mt-1 flex justify-between text-xs text-zinc-400 dark:text-zinc-500">
          <Ltr>{mode === 'time' ? formatDriveTime(30, lang) : formatKm(10, lang)}</Ltr>
          <Ltr>{mode === 'time' ? formatDriveTime(maxMinutes, lang) : formatKm(maxKm, lang)}</Ltr>
        </div>
      </div>

      {/* Categories */}
      <div>
        <span className="mb-1.5 block text-sm font-medium">{t('explore.categories')}</span>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_META.map(({ key, icon: Icon, labelKey }) => {
            const active = categories.has(key);
            return (
              <button
                key={key}
                onClick={() => toggleCategory(key)}
                aria-pressed={active}
                className={`inline-flex h-10 items-center gap-1.5 rounded-xl border px-3.5 text-sm font-medium transition-colors ${
                  active
                    ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300'
                    : 'border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300'
                }`}
              >
                <Icon className="size-4" />
                {t(labelKey)}
              </button>
            );
          })}
        </div>
      </div>

      <Button size="lg" className="w-full" disabled={categories.size === 0 || status === 'loading'} onClick={runSearch}>
        {status === 'loading' ? <Loader2 className="size-5 animate-spin" /> : <Compass className="size-5" />}
        {results ? t('explore.searchAgain') : t('explore.search')}
      </Button>

      {/* Results */}
      {status === 'loading' && (
        <div className="space-y-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      )}

      {status === 'error' && <EmptyState icon={<Compass />} title={t('explore.error')} />}

      {status === 'idle' && <EmptyState icon={<Compass />} title={t('explore.idle')} />}

      {status === 'done' && results && (
        <>
          {results.length === 0 ? (
            <EmptyState icon={<Compass />} title={t('explore.empty.title')} description={t('explore.empty.desc')} />
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {t('explore.resultsCount', { n: results.length })}
                </span>
                {resultCategories.length > 1 && (
                  <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
                    <button
                      onClick={() => setResultFilter('all')}
                      className={`h-8 shrink-0 rounded-lg px-3 text-xs font-medium ${
                        resultFilter === 'all'
                          ? 'bg-primary-600 text-white'
                          : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
                      }`}
                    >
                      {t('common.all')}
                    </button>
                    {resultCategories.map(({ key, labelKey }) => (
                      <button
                        key={key}
                        onClick={() => setResultFilter(key)}
                        className={`h-8 shrink-0 rounded-lg px-3 text-xs font-medium ${
                          resultFilter === key
                            ? 'bg-primary-600 text-white'
                            : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
                        }`}
                      >
                        {t(labelKey)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {visibleResults.map((r) => (
                  <PoiCard key={r.poi.id} poi={r.poi} travel={r.travel} />
                ))}
              </div>

              <p className="px-1 text-xs text-zinc-400 dark:text-zinc-500">{t('explore.capNote')}</p>
              <p className="px-1 text-xs text-zinc-400 dark:text-zinc-500">{t('explore.dataSource')}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
