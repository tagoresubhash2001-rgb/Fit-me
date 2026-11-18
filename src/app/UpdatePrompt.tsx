import React from 'react';
import { useTranslation } from 'react-i18next';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';
import { Button, IconButton } from '../components/ui';
import { isNative } from '../lib/platform';

/** Web only: tells the user a new version is ready and switches to it when they tap Refresh. */
export function UpdatePrompt() {
  if (!import.meta.env.PROD || isNative()) return null;
  return <Prompt />;
}

function Prompt() {
  const { t } = useTranslation();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    // React mounts after the window load event, so register right away instead of waiting for it.
    immediate: true,
    // Check for a new release every hour while the app stays open.
    onRegisterError(e) {
      console.warn('Service worker registration failed', e);
    },
    onRegisteredSW(_url, reg) {
      if (reg) setInterval(() => void reg.update(), 60 * 60 * 1000);
    },
  });
  if (!needRefresh) return null;
  return (
    <div role="status" aria-live="polite" id="update-prompt" className="glass fixed inset-x-3 top-[max(12px,env(safe-area-inset-top))] z-[110] mx-auto flex max-w-md items-center gap-3 rounded-card border p-3 shadow-float animate-[pop-in_200ms_ease-out]">
      <RefreshCw className="h-5 w-5 shrink-0 text-primary-text" strokeWidth={1.75} />
      <p className="min-w-0 flex-1 text-small text-ink">{t('pwa.updateAvailable')}</p>
      <Button size="sm" onClick={() => void updateServiceWorker(true)}>
        {t('pwa.refresh')}
      </Button>
      <IconButton label={t('common.close')} onClick={() => setNeedRefresh(false)}>
        <X className="h-4 w-4" strokeWidth={1.75} />
      </IconButton>
    </div>
  );
}
