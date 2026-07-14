import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Loader2, Minus, Plus, Sparkles, Users } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useSettings, type OriginCountry } from '@/state/SettingsContext';
import { useTrips } from '@/state/TripContext';
import { generateTrip, type GenerationStage } from '@/services/tripGenerator';
import { listDates } from '@/services/weatherService';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DestinationSearch, metaToChoice, type DestinationChoice } from './DestinationSearch';
import { DESTINATIONS } from '@/data/destinations';
import { useLocalized } from '@/i18n/I18nContext';

const MAX_TRIP_DAYS = 21;
const ORIGIN_OPTIONS: OriginCountry[] = ['IL', 'US', 'UK', 'other'];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function plusDays(iso: string, days: number): string {
  const d = new Date(iso + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function TripWizard() {
  const { t, lang } = useI18n();
  const localized = useLocalized();
  const settings = useSettings();
  const { saveTrip } = useTrips();
  const navigate = useNavigate();

  const [destination, setDestination] = useState<DestinationChoice | undefined>();
  const [startDate, setStartDate] = useState(() => plusDays(todayIso(), 7));
  const [endDate, setEndDate] = useState(() => plusDays(todayIso(), 12));
  const [ages, setAges] = useState<number[]>([30, 30]);
  const [origin, setOrigin] = useState<OriginCountry>(settings.originCountry);
  const [stage, setStage] = useState<GenerationStage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const nights = useMemo(() => Math.max(listDates(startDate, endDate).length - 1, 0), [startDate, endDate]);
  const dateInvalid = endDate < startDate;
  const tooLong = listDates(startDate, endDate).length > MAX_TRIP_DAYS;
  const canGenerate = Boolean(destination) && !dateInvalid && !tooLong && !stage;

  const setAge = (index: number, age: number) => {
    setAges((prev) => prev.map((a, i) => (i === index ? Math.max(0, Math.min(99, age)) : a)));
  };

  const generate = async () => {
    if (!destination) return;
    setError(null);
    setStage('weather');
    settings.update({ originCountry: origin });
    try {
      const trip = await generateTrip(
        {
          destinationSlug: destination.slug,
          destinationName: destination.name,
          countryCode: destination.countryCode,
          lat: destination.lat,
          lon: destination.lon,
          timezone: destination.timezone,
          startDate,
          endDate,
          travelers: ages.map((age) => ({ age })),
          originCountry: origin,
        },
        settings.kosherOnly,
        setStage,
      );
      saveTrip(trip);
      navigate(`/trip/${trip.id}`);
    } catch {
      setError(t('errors.poisFailed'));
    } finally {
      setStage(null);
    }
  };

  if (stage) {
    const stageText =
      stage === 'weather' ? t('wizard.generating.weather') : stage === 'pois' ? t('wizard.generating.pois') : t('wizard.generating.plan');
    return (
      <Card className="flex flex-col items-center gap-4 p-10 text-center animate-fade-in">
        <Loader2 className="size-10 animate-spin text-primary-600" />
        <p className="text-lg font-semibold">{t('wizard.generating')}</p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{stageText}</p>
      </Card>
    );
  }

  return (
    <Card className="p-5 md:p-7">
      <div className="space-y-6">
        {/* Destination */}
        <section>
          <label className="mb-2 flex items-center gap-2 font-semibold">
            <Sparkles className="size-4 text-primary-600" />
            {t('wizard.destination.label')}
          </label>
          <DestinationSearch value={destination} onSelect={setDestination} />
          <div className="mt-3 flex flex-wrap gap-2">
            {DESTINATIONS.map((meta) => (
              <button
                key={meta.slug}
                onClick={() => setDestination(metaToChoice(meta, lang))}
                className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors ${
                  destination?.slug === meta.slug
                    ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300'
                    : 'border-zinc-200 text-zinc-600 hover:border-primary-300 hover:text-primary-700 dark:border-zinc-700 dark:text-zinc-300'
                }`}
              >
                <span>{meta.emoji}</span>
                {localized(meta.name)}
              </button>
            ))}
          </div>
        </section>

        {/* Dates */}
        <section>
          <label className="mb-2 flex items-center gap-2 font-semibold">
            <CalendarDays className="size-4 text-primary-600" />
            {t('wizard.dates.label')}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="mb-1 block text-xs font-medium text-zinc-500">{t('wizard.dates.from')}</span>
              <input
                type="date"
                value={startDate}
                min={todayIso()}
                onChange={(e) => {
                  const v = e.target.value;
                  setStartDate(v);
                  if (endDate < v) setEndDate(v);
                }}
                className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
            <div>
              <span className="mb-1 block text-xs font-medium text-zinc-500">{t('wizard.dates.to')}</span>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
          </div>
          <div className="mt-1.5 min-h-5 text-sm">
            {dateInvalid ? (
              <span className="text-red-600 dark:text-red-400">{t('wizard.dates.invalid')}</span>
            ) : tooLong ? (
              <span className="text-red-600 dark:text-red-400">{t('wizard.dates.tooLong')}</span>
            ) : nights > 0 ? (
              <span className="font-medium text-primary-700 dark:text-primary-300">{t('wizard.dates.nights', { n: nights })}</span>
            ) : null}
          </div>
        </section>

        {/* Party */}
        <section>
          <label className="mb-2 flex items-center gap-2 font-semibold">
            <Users className="size-4 text-primary-600" />
            {t('wizard.party.label')}
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {ages.map((age, i) => (
              <div key={i} className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-900">
                <span className="ps-2 text-xs text-zinc-500">{t('wizard.party.age')}</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={99}
                  value={age}
                  onChange={(e) => setAge(i, Number(e.target.value))}
                  className="h-9 w-13 rounded-lg bg-transparent text-center text-sm font-semibold outline-none"
                  aria-label={`${t('wizard.party.age')} ${i + 1}`}
                />
                {ages.length > 1 && (
                  <button
                    onClick={() => setAges((prev) => prev.filter((_, j) => j !== i))}
                    className="grid size-8 place-items-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-red-500 dark:hover:bg-zinc-800"
                    aria-label={t('common.delete')}
                  >
                    <Minus className="size-4" />
                  </button>
                )}
              </div>
            ))}
            {ages.length < 10 && (
              <button
                onClick={() => setAges((prev) => [...prev, 8])}
                className="inline-flex h-11 items-center gap-1 rounded-xl border border-dashed border-zinc-300 px-3 text-sm font-medium text-zinc-500 hover:border-primary-400 hover:text-primary-600 dark:border-zinc-600"
              >
                <Plus className="size-4" />
                {t('wizard.party.addTraveler')}
              </button>
            )}
          </div>

          <div className="mt-4">
            <span className="mb-1 block text-sm font-medium">{t('wizard.party.origin.label')}</span>
            <div className="flex flex-wrap gap-2">
              {ORIGIN_OPTIONS.map((code) => (
                <button
                  key={code}
                  onClick={() => setOrigin(code)}
                  className={`h-10 rounded-xl border px-4 text-sm font-medium transition-colors ${
                    origin === code
                      ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300'
                      : 'border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {t(`country.${code}`)}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">{t('wizard.party.origin.helper')}</p>
          </div>
        </section>

        {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>}

        <Button size="lg" className="w-full" disabled={!canGenerate} onClick={generate}>
          <Sparkles className="size-5" />
          {t('wizard.generate')}
        </Button>
      </div>
    </Card>
  );
}
