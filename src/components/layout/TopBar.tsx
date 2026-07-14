import { Link } from 'react-router-dom';
import { MapPin, Settings } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

export function TopBar() {
  const { t } = useI18n();
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/85 backdrop-blur-md md:hidden dark:border-zinc-800 dark:bg-zinc-950/85">
      <div className="flex h-14 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-primary-700 dark:text-primary-400">
          <span className="grid size-8 place-items-center rounded-lg bg-primary-600 text-white">
            <MapPin className="size-5" />
          </span>
          <span className="text-lg">{t('common.appName')}</span>
        </Link>
        <Link
          to="/settings"
          aria-label={t('nav.settings')}
          className="grid size-10 place-items-center rounded-full text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          <Settings className="size-5" />
        </Link>
      </div>
    </header>
  );
}
