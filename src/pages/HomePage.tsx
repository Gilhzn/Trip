import { useI18n } from '@/i18n/I18nContext';

export function HomePage() {
  const { t } = useI18n();
  return (
    <div className="py-10">
      <h1 className="text-3xl font-bold">{t('home.heroTitle')}</h1>
      <p className="mt-2 text-zinc-500">{t('home.heroSubtitle')}</p>
    </div>
  );
}
