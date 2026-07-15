import { useRouteError } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { Button } from '@/components/ui/Button';

export function RouteError() {
  const { t } = useI18n();
  const error = useRouteError();
  // eslint-disable-next-line no-console
  console.error('Route error:', error);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-xl font-bold">{t('common.error')}</h1>
      <Button onClick={() => window.location.reload()}>
        <RefreshCw className="size-5" />
        {t('common.retry')}
      </Button>
    </div>
  );
}
