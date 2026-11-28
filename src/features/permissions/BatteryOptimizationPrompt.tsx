import React, { useEffect, useState } from 'react';
import { registerPlugin } from '@capacitor/core';
import { isNative, platform } from '../../lib/platform';
import { BatteryCharging, ExternalLink, X } from 'lucide-react';

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

export function BatteryOptimizationPrompt() {
  const [show, setShow] = useState(false);
  const [details, setDetails] = useState<DeviceDetails | null>(null);

  useEffect(() => {
    if (!isNative() || platform() !== 'android') return;

    const seen = localStorage.getItem('fitme_battery_opt_seen');
    if (seen === 'true') return;

    Promise.all([
      Native.batteryStatus().catch(() => ({ optimised: false })),
      Native.getDeviceDetails().catch(() => ({ manufacturer: '', brand: '', model: '', sdkInt: 0 })),
    ]).then(([status, dev]) => {
      if (status.optimised) {
        setDetails(dev);
        setShow(true);
      }
    });
  }, []);

  if (!show) return null;

  const dismiss = () => {
    localStorage.setItem('fitme_battery_opt_seen', 'true');
    setShow(false);
  };

  const openSettings = async () => {
    await Native.openManufacturerBatterySettings().catch(() => Native.openBatterySettings().catch(() => undefined));
    dismiss();
  };

  const manufacturer = (details?.manufacturer || '').toLowerCase();
  let brandAdvice = 'Allow background activity and disable battery optimization so step counts and health telemetry stay synchronized.';

  if (manufacturer.includes('xiaomi') || manufacturer.includes('redmi') || manufacturer.includes('poco')) {
    brandAdvice = 'MIUI / HyperOS aggressively freezes background apps. Enable "Autostart" and set Battery Saver to "No restrictions".';
  } else if (manufacturer.includes('samsung')) {
    brandAdvice = 'One UI pauses inactive apps. In App info → Battery, select "Unrestricted" so steps count reliably while walking.';
  } else if (manufacturer.includes('oppo') || manufacturer.includes('realme')) {
    brandAdvice = 'ColorOS / Realme UI restricts background tasks. Enable "Allow background activity" in App Battery Management.';
  } else if (manufacturer.includes('vivo')) {
    brandAdvice = 'FuntouchOS requires background power permission. In Battery settings, choose "High background power consumption".';
  }

  return (
    <div className="fixed bottom-4 inset-x-4 z-40 mx-auto max-w-lg rounded-2xl border border-emerald-500/40 bg-[#0C1220]/95 p-5 shadow-2xl backdrop-blur-md animate-[slide-up_200ms_ease-out] text-left">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
            <BatteryCharging className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Keep Background Steps Accurate</h4>
            <span className="text-[11px] text-emerald-400 font-medium">Recommended for {details?.brand || 'your phone'}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <p className="mt-2.5 text-xs text-slate-300 leading-relaxed">
        {brandAdvice}
      </p>

      <div className="mt-4 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={dismiss}
          className="h-8 rounded-lg px-3 text-xs font-semibold text-slate-400 hover:text-white"
        >
          Remind Later
        </button>
        <button
          type="button"
          onClick={openSettings}
          className="flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#1FA45B] px-4 text-xs font-semibold text-white transition hover:bg-emerald-600"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          <span>Adjust Settings</span>
        </button>
      </div>
    </div>
  );
}
