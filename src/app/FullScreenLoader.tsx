import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

/** Same look as the static splash in index.html, so the hand-over from HTML to React does not flash. */
export function FullScreenLoader() {
  const { t } = useTranslation();
  // Never a stuck spinner: after 12 s offer a retry (slow network, blocked storage, offline first visit).
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setSlow(true), 12000);
    return () => clearTimeout(id);
  }, []);
  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-canvas p-6 text-center"
      role="status"
      aria-label={t('common.loading')}
    >
      <img src="/favicon.svg" alt="" width={72} height={72} className="h-[72px] w-[72px] motion-safe:animate-pulse" />
      <p className="text-[34px] leading-tight font-semibold text-ink">FitMe</p>
      <p className="max-w-md text-body text-muted">{slow ? t('errors.slowBody') : t('app.tagline')}</p>
      {slow && (
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="h-12 rounded-button bg-primary px-5 text-body font-semibold text-on-primary"
        >
          {t('common.retry')}
        </button>
      )}
    </div>
  );
}
