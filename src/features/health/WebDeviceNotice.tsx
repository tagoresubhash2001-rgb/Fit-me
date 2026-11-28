import React from 'react';
import { useTranslation } from 'react-i18next';
import { Smartphone } from 'lucide-react';
import { isNative } from '../../lib/platform';

/** Web app only: automatic steps and heart rate come from the phone; manual entry works here. */
export function WebDeviceNotice() {
  const { t } = useTranslation();
  if (isNative()) return null;
  return (
    <p id="web-device-notice" className="card-enter flex items-start gap-2 rounded-input bg-primary-subtle px-3 py-2 text-small text-ink">
      <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-primary-text" strokeWidth={1.75} aria-hidden />
      <span>
        {t('health.webNotice')}{' '}
        <a href="/download" className="font-semibold text-primary-text underline-offset-2 hover:underline">
          {t('health.webNoticeLink')}
        </a>
      </span>
    </p>
  );
}
