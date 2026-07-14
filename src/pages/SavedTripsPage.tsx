import { useI18n } from '@/i18n/I18nContext';

export function SavedTripsPage() {
  const { t } = useI18n();
  return (
    <div className="py-10">
      <h1 className="text-2xl font-bold">{t('saved.title')}</h1>
    </div>
  );
}
