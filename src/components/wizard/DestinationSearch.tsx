import { useEffect, useRef, useState } from 'react';
import { Loader2, MapPin, Search, Sparkles } from 'lucide-react';
import { useI18n, useLocalized } from '@/i18n/I18nContext';
import { searchCities, type GeoResult } from '@/services/geocodingService';
import { DESTINATIONS, type DestinationMeta } from '@/data/destinations';
import { Chip } from '@/components/ui/Chip';

export interface DestinationChoice {
  slug?: string;
  name: string;
  countryCode?: string;
  lat: number;
  lon: number;
  timezone: string;
}

export function metaToChoice(meta: DestinationMeta, lang: 'he' | 'en'): DestinationChoice {
  return {
    slug: meta.slug,
    name: meta.name[lang],
    countryCode: meta.countryCode,
    lat: meta.lat,
    lon: meta.lon,
    timezone: meta.timezone,
  };
}

export function DestinationSearch({ value, onSelect }: { value?: DestinationChoice; onSelect: (choice: DestinationChoice) => void }) {
  const { t, lang } = useI18n();
  const localized = useLocalized();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const found = await searchCities(q, lang);
        setResults(found);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, lang]);

  const q = query.trim().toLowerCase();
  const curatedMatches = q.length
    ? DESTINATIONS.filter((d) => d.name.en.toLowerCase().includes(q) || d.name.he.includes(query.trim()))
    : [];
  // Hide geocoding rows that duplicate a curated match
  const geoResults = results.filter((r) => !curatedMatches.some((c) => c.name.en.toLowerCase() === r.name.toLowerCase()));
  const showDropdown = open && (curatedMatches.length > 0 || geoResults.length > 0 || searching || q.length >= 2);

  const select = (choice: DestinationChoice) => {
    onSelect(choice);
    setQuery('');
    setOpen(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 start-4 size-5 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={value ? value.name : t('wizard.destination.placeholder')}
          className={`h-14 w-full rounded-2xl border bg-white ps-12 pe-4 text-base shadow-card outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:bg-zinc-900 dark:focus:ring-primary-900 ${
            value ? 'border-primary-300 placeholder:font-semibold placeholder:text-primary-700 dark:border-primary-800 dark:placeholder:text-primary-300' : 'border-zinc-200 dark:border-zinc-700'
          }`}
        />
        {searching && <Loader2 className="absolute top-1/2 end-4 size-5 -translate-y-1/2 animate-spin text-zinc-400" />}
      </div>

      {showDropdown && (
        <div className="absolute z-30 mt-2 max-h-80 w-full overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          {curatedMatches.map((meta) => (
            <button
              key={meta.slug}
              onClick={() => select(metaToChoice(meta, lang))}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start hover:bg-primary-50 dark:hover:bg-primary-950"
            >
              <span className="text-xl">{meta.emoji}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{localized(meta.name)}</span>
                <span className="block truncate text-xs text-zinc-500">{localized(meta.country)}</span>
              </span>
              <Chip tone="primary">
                <Sparkles className="size-3" />
                {t('wizard.destination.curatedBadge')}
              </Chip>
            </button>
          ))}
          {geoResults.map((r) => (
            <button
              key={r.id}
              onClick={() =>
                select({ name: r.name, countryCode: r.countryCode, lat: r.lat, lon: r.lon, timezone: r.timezone })
              }
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              <MapPin className="size-5 shrink-0 text-zinc-400" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{r.name}</span>
                <span className="block truncate text-xs text-zinc-500">
                  {[r.admin1, r.country].filter(Boolean).join(', ')}
                </span>
              </span>
            </button>
          ))}
          {!searching && curatedMatches.length === 0 && geoResults.length === 0 && q.length >= 2 && (
            <p className="px-3 py-4 text-center text-sm text-zinc-500">{t('wizard.destination.noResults')}</p>
          )}
        </div>
      )}
    </div>
  );
}
