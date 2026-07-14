import { CloudSun, ShieldCheck, UtensilsCrossed, Users } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { TripWizard } from '@/components/wizard/TripWizard';

const FEATURES = [
  { icon: CloudSun, titleKey: 'home.features.weather.title', descKey: 'home.features.weather.desc' },
  { icon: UtensilsCrossed, titleKey: 'home.features.kosher.title', descKey: 'home.features.kosher.desc' },
  { icon: Users, titleKey: 'home.features.family.title', descKey: 'home.features.family.desc' },
  { icon: ShieldCheck, titleKey: 'home.features.safety.title', descKey: 'home.features.safety.desc' },
] as const;

export function HomePage() {
  const { t } = useI18n();

  return (
    <div className="animate-fade-in py-6 md:py-10">
      <section className="mb-8 text-center md:mb-12">
        <h1 className="mx-auto max-w-2xl bg-gradient-to-l from-primary-600 to-sky-600 bg-clip-text text-3xl font-extrabold text-transparent md:text-5xl ltr:bg-gradient-to-r">
          {t('home.heroTitle')}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-zinc-500 md:text-lg dark:text-zinc-400">{t('home.heroSubtitle')}</p>
      </section>

      <div className="mx-auto max-w-2xl">
        <TripWizard />
      </div>

      <section className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 md:mt-14">
        {FEATURES.map(({ icon: Icon, titleKey, descKey }) => (
          <div key={titleKey} className="flex gap-4 rounded-2xl border border-zinc-100 bg-white/60 p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400">
              <Icon className="size-6" />
            </div>
            <div>
              <h3 className="font-semibold">{t(titleKey)}</h3>
              <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{t(descKey)}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
