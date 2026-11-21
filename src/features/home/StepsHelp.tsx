import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, CircleAlert, LifeBuoy } from 'lucide-react';
import { Button, Card, Sheet, Skeleton } from '../../components/ui';
import { batteryOptimised, enablePhoneSteps, openBatterySettings, phoneStepsStatus, syncPhoneSteps } from '../../data/steps';
import { healthAppName, healthStatus, openHealthSettings, syncHealth } from '../../data/healthSync';
import { openSystemSettings } from '../../data/permissions';
import { useFormat } from '../../lib/hooks';
import { cn } from '../../components/ui/cn';

interface Check {
  id: 'motion' | 'health' | 'battery' | 'sync';
  ok: boolean;
  /** Plain-language explanation of what is wrong (or right). */
  text: string;
  fix?: { label: string; run: () => Promise<unknown> };
}

/**
 * "Steps not updating?" — checks, in order: physical activity permission, Health Connect / Apple Health, battery
 * optimisation and the last sync, and fixes or explains each one.
 */
export function StepsHelp({ className, lastSyncDate }: { className?: string; lastSyncDate: string | null }) {
  const { t } = useTranslation();
  const { dateTime } = useFormat();
  const [open, setOpen] = useState(false);
  const [checks, setChecks] = useState<Check[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const app = t(`devices.${healthAppName()}`);

  const run = async () => {
    const [phone, health, battery] = await Promise.all([phoneStepsStatus().catch(() => null), healthStatus().catch(() => null), batteryOptimised()]);
    const list: Check[] = [];
    const motionOk = !!phone?.supported && phone.permission === 'granted' && phone.enabled;
    list.push({
      id: 'motion',
      ok: motionOk,
      text: !phone?.supported ? t('stepsHelp.motionUnsupported') : phone.permission === 'granted' ? (phone.enabled ? t('stepsHelp.motionOk') : t('stepsHelp.motionOff')) : t('stepsHelp.motionDenied'),
      fix: motionOk || !phone?.supported ? undefined : phone.permission === 'denied' ? { label: t('permissions.openSettings'), run: openSystemSettings } : { label: t('steps.phoneOn'), run: enablePhoneSteps },
    });
    const hOk = health?.availability === 'ready' && health.connected;
    list.push({
      id: 'health',
      ok: hOk || health?.availability !== 'ready',
      text: health?.availability === 'missing' ? t(healthAppName() === 'healthConnect' ? 'stepsHelp.healthMissing' : 'stepsHelp.healthKitMissing') : hOk ? t('stepsHelp.healthOk', { app }) : t('stepsHelp.healthOff', { app }),
      fix: hOk ? undefined : { label: health?.availability === 'missing' ? t('devices.openHealthConnect') : t('stepsHelp.openHealth', { app }), run: openHealthSettings },
    });
    if (battery !== null)
      list.push({
        id: 'battery',
        ok: !battery,
        text: battery ? t('stepsHelp.batteryOn') : t('stepsHelp.batteryOk'),
        fix: battery ? { label: t('stepsHelp.batteryFix'), run: openBatterySettings } : undefined,
      });
    const last = Math.max(phone?.lastSyncAt ?? 0, health?.lastSyncAt ?? 0);
    const stale = !last || Date.now() - last > 6 * 3600_000;
    list.push({
      id: 'sync',
      ok: !stale,
      text: last ? t('stepsHelp.lastSync', { when: dateTime(last) }) : t('stepsHelp.neverSynced'),
      fix: {
        label: t('devices.syncNow'),
        run: async () => {
          if (motionOk) await syncPhoneSteps(7);
          if (hOk) await syncHealth(7);
        },
      },
    });
    setChecks(list);
  };

  return (
    <Card className={cn('flex items-center gap-3', className)} id="steps-help">
      <LifeBuoy className="h-5 w-5 shrink-0 text-primary-text" strokeWidth={1.75} />
      <div className="min-w-0 flex-1">
        <p className="text-body font-medium text-ink">{t('stepsHelp.title')}</p>
        <p className="text-small text-muted">{lastSyncDate ? t('stepsHelp.subtitle') : t('stepsHelp.subtitleNone')}</p>
      </div>
      <Button
        size="sm"
        variant="secondary"
        id="steps-help-open"
        onClick={() => {
          setOpen(true);
          setChecks(null);
          void run();
        }}
      >
        {t('stepsHelp.check')}
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)} closeLabel={t('common.close')} title={t('stepsHelp.title')}>
        {!checks ? (
          <Skeleton className="h-40" />
        ) : (
          <ol className="flex flex-col gap-3" id="steps-help-checks">
            {checks.map((c, i) => (
              <li key={c.id} className="flex items-start gap-3 rounded-input border border-line p-3">
                <span className={cn('mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full', c.ok ? 'bg-primary-subtle text-primary-text' : 'bg-raised text-accent')}>
                  {c.ok ? <Check className="h-4 w-4" strokeWidth={2} /> : <CircleAlert className="h-4 w-4" strokeWidth={2} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-small font-semibold text-ink">
                    {i + 1}. {t(`stepsHelp.checks.${c.id}`)}
                  </p>
                  <p className="text-small text-ink">{c.text}</p>
                  {c.fix && !c.ok && (
                    <Button
                      size="sm"
                      className="mt-2"
                      loading={busy === c.id}
                      onClick={async () => {
                        setBusy(c.id);
                        try {
                          await c.fix!.run();
                        } finally {
                          setBusy(null);
                          void run();
                        }
                      }}
                    >
                      {c.fix.label}
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </Sheet>
    </Card>
  );
}
