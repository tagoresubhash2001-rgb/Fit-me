import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { registerPlugin } from '@capacitor/core';
import { BatteryCharging, ExternalLink, X } from 'lucide-react';
import { isNative, platform } from '../../lib/platform';
import { Button, IconButton } from '../../components/ui';

interface DeviceDetails {
  manufacturer: string;
  brand: string;
  model: string;
  sdkInt: number;
}
interface FitMeStepsPlugin {
  batteryStatus(): Promise<{ optimised: boolean }>;
  openBatterySettings(): Promise<void>;
  openManufacturerBatterySettings(): Promise<void>;
  getDeviceDetails(): Promise<DeviceDetails>;
}
const Native = registerPlugin<FitMeStepsPlugin>('FitMeSteps');
const SEEN = 'fitme_battery_opt_seen';

/** Brand-specific battery guide (Android phones that stop background step counting). */
export function batteryAdviceKey(manufacturer: string): 'xiaomi' | 'samsung' | 'oppo' | 'vivo' | 'other' {
  const m = manufacturer.toLowerCase();
  if (/xiaomi|redmi|poco/.test(m)) return 'xiaomi';
  if (m.includes('samsung')) return 'samsung';
  if (/oppo|realme|oneplus/.test(m)) return 'oppo';
  if (m.includes('vivo') || m.includes('iqoo')) return 'vivo';
  return 'other';
}

/** Android only, once: if FitMe is battery-optimised, explain how to keep background steps working. */
export function BatteryOptimizationPrompt() {
  const { t } = useTranslation();
  const [details, setDetails] = useState<DeviceDetails | null>(null);
  useEffect(() => {
    if (!isNative() || platform() !== 'android') return;
    try {
      if (localStorage.getItem(SEEN) === 'true') return;
    } catch {
      /* storage blocked: show it */
    }
    void Promise.all([Native.batteryStatus().catch(() => ({ optimised: false })), Native.getDeviceDetails().catch(() => ({ manufacturer: '', brand: '', model: '', sdkInt: 0 }))]).then(([s, d]) => s.optimised && setDetails(d));
  }, []);
  if (!details) return null;
  const dismiss = () => {
    try {
      localStorage.setItem(SEEN, 'true');
    } catch {
      /* ignore */
    }
    setDetails(null);
  };
  return (
    <div role="dialog" aria-labelledby="battery-title" className="glass glass-strong fixed inset-x-4 bottom-24 z-40 mx-auto max-w-lg rounded-card border p-5 shadow-float">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-subtle text-primary-text">
            <BatteryCharging className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </span>
          <div>
            <h2 id="battery-title" className="text-body font-semibold text-ink">
              {t('battery.title')}
            </h2>
            {details.brand && <p className="text-caption text-muted">{t('battery.forBrand', { brand: details.brand })}</p>}
          </div>
        </div>
        <IconButton label={t('common.close')} onClick={dismiss}>
          <X className="h-4 w-4" strokeWidth={1.75} />
        </IconButton>
      </div>
      <p className="mt-3 text-small text-muted">{t(`battery.advice.${batteryAdviceKey(details.manufacturer)}`)}</p>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={dismiss}>
          {t('battery.later')}
        </Button>
        <Button
          size="sm"
          icon={<ExternalLink className="h-4 w-4" />}
          onClick={() => {
            void Native.openManufacturerBatterySettings().catch(() => Native.openBatterySettings().catch(() => undefined));
            dismiss();
          }}
        >
          {t('battery.open')}
        </Button>
      </div>
    </div>
  );
}
