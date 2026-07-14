import { useI18n } from '@/i18n/I18nContext';
import { useSettings, type CurrencyCode, type Theme } from '@/state/SettingsContext';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Toggle } from '@/components/ui/Toggle';
import { Card } from '@/components/ui/Card';
import { CURRENCIES } from '@/data/currencies';

export function SettingsPage() {
  const { t, lang, setLang } = useI18n();
  const settings = useSettings();

  return (
    <div className="mx-auto max-w-2xl py-6 md:py-10">
      <h1 className="mb-6 text-2xl font-bold md:text-3xl">{t('settings.title')}</h1>

      <div className="space-y-4">
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-medium">{t('settings.language')}</span>
            <SegmentedControl
              value={lang}
              onChange={setLang}
              options={[
                { value: 'he', label: t('settings.language.he') },
                { value: 'en', label: t('settings.language.en') },
              ]}
            />
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-medium">{t('settings.currency')}</span>
            <select
              value={settings.currency}
              onChange={(e) => settings.update({ currency: e.target.value as CurrencyCode })}
              className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm font-medium dark:border-zinc-700 dark:bg-zinc-800"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.symbol} {c.code} — {lang === 'he' ? c.nameHe : c.nameEn}
                </option>
              ))}
            </select>
          </div>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{t('settings.ratesNote')}</p>
        </Card>

        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-medium">{t('settings.theme')}</span>
            <SegmentedControl<Theme>
              value={settings.theme}
              onChange={(theme) => settings.update({ theme })}
              options={[
                { value: 'system', label: t('settings.theme.system') },
                { value: 'light', label: t('settings.theme.light') },
                { value: 'dark', label: t('settings.theme.dark') },
              ]}
            />
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium">{t('settings.kosherDefault')}</span>
            <Toggle
              checked={settings.kosherOnly}
              onChange={(kosherOnly) => settings.update({ kosherOnly })}
              label={t('settings.kosherDefault')}
            />
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-1 font-medium">{t('settings.about')}</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('settings.aboutText')}</p>
        </Card>
      </div>
    </div>
  );
}
