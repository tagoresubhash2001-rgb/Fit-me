import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Minus, Plus } from 'lucide-react';
import {
  BarChart,
  Button,
  Card,
  CardHeader,
  CountUp,
  EmptyState,
  ProgressRing,
  Sheet,
  Skeleton,
  Stepper,
  SwipeRow,
  cn,
  haptic,
  toast,
} from '../../components/ui';
import { useSession } from '../../data/session';
import { useRecords } from '../../data/useRecords';
import { createRecord, restore, softDelete, updateRecord } from '../../data/records';
import { updateProfileFields } from '../../data/auth';
import { useToday, useFormat } from '../../lib/hooks';
import { formatMinutes } from '../../domain/dates';
import { rangeStart, seriesFor } from '../../domain/series';
import { useBucketLabel, useHealthRange } from './RangeFilter';
import { mlToVolume, volumeToMl, type VolumeUnit } from '../../domain/units';
import type { WaterLog } from '../../domain/models';
import { VolumeInput } from '../common/fields';
import { useUnits } from '../common/useUnits';
import { TimeField } from '../onboarding/BodyFields';

type Entry = WaterLog & { timeMinutes?: number };
const PRESETS: Array<{ ml: number; key: string }> = [
  { ml: 100, key: 'small' },
  { ml: 250, key: 'glass' },
  { ml: 500, key: 'bottle' },
  { ml: 750, key: 'large' },
  { ml: 1000, key: 'litre' },
];
const STEP_ML = 250;

/** Water (owner correction 9): big − / +, presets, custom amount with units, editable history. */
export function WaterPanel() {
  const { t } = useTranslation();
  const { lang } = useFormat();
  const { prefs, vol } = useUnits();
  const profile = useSession((s) => s.profile)!;
  const today = useToday();
  const [range] = useHealthRange();
  const bucketLabel = useBucketLabel();
  const from = rangeStart(range, today);
  const logs = useRecords<Entry>('waterLogs', from, today);
  const [customMl, setCustomMl] = useState<number | ''>('');
  const [customUnit, setCustomUnit] = useState<VolumeUnit>(prefs.volume);
  const [editing, setEditing] = useState<Entry | null>(null);
  const [editTarget, setEditTarget] = useState(false);
  const goal = profile.waterTargetMl ?? profile.targets.waterMl;
  const todayLogs = logs.rows.filter((l) => l.date === today).sort((a, b) => (b.timeMinutes ?? 0) - (a.timeMinutes ?? 0));
  const total = todayLogs.reduce((a, l) => a + l.ml, 0);

  const add = (ml: number) => {
    haptic();
    void createRecord('waterLogs', { ml: Math.round(ml) }).then((id) =>
      toast(t('water.addedToast', { amount: vol(ml) }), 'success', {
        label: t('common.undo'),
        onClick: () => void softDelete('waterLogs', id),
      }),
    );
  };
  const remove = (l: Entry) => {
    void softDelete('waterLogs', l.id);
    toast(t('water.removedToast', { amount: vol(l.ml) }), 'info', {
      label: t('common.undo'),
      onClick: () => void restore('waterLogs', l.id),
    });
  };
  /** − takes one glass off the most recent entry (or removes it), with undo. */
  const decrease = () => {
    const last = todayLogs[0];
    if (!last) return;
    haptic();
    if (last.ml > STEP_ML) {
      const before = last.ml;
      void updateRecord('waterLogs', last.id, { ml: before - STEP_ML });
      toast(t('water.reducedToast', { amount: vol(STEP_ML) }), 'info', {
        label: t('common.undo'),
        onClick: () => void updateRecord('waterLogs', last.id, { ml: before }),
      });
    } else remove(last);
  };

  return (
    <>
      <Card style={{ viewTransitionName: 'tile-water' }} className="flex flex-col items-center gap-4">
        {logs.loading ? (
          <Skeleton className="h-44 w-full" />
        ) : (
          <div className="flex w-full items-center justify-center gap-4">
            <button
              type="button"
              id="water-minus"
              aria-label={t('water.decrease', { amount: vol(STEP_ML) })}
              disabled={!todayLogs.length}
              onClick={decrease}
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink shadow-card transition-transform duration-150 active:scale-90 disabled:opacity-40"
            >
              <Minus className="h-6 w-6" strokeWidth={1.75} />
            </button>
            <ProgressRing value={total} max={goal} size={168} stroke={13} colorClass="stroke-water" label={t('water.title')}>
              <span className="text-title text-ink">
                <CountUp value={total} format={(v) => vol(v)} />
              </span>
              <span className="text-caption text-muted">
                {t('common.of')} {vol(goal)}
              </span>
            </ProgressRing>
            <button
              type="button"
              id="water-plus"
              aria-label={t('water.add', { amount: vol(STEP_ML) })}
              onClick={() => add(STEP_ML)}
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary shadow-card transition-transform duration-150 hover:bg-primary-pressed active:scale-90"
            >
              <Plus className="h-6 w-6" strokeWidth={1.75} />
            </button>
          </div>
        )}
        <div className="flex w-full flex-wrap justify-center gap-2" role="group" aria-label={t('water.presets')}>
          {PRESETS.map((p) => (
            <button
              key={p.ml}
              type="button"
              onClick={() => add(p.ml)}
              className="flex h-10 items-center gap-1 rounded-full border border-line bg-surface px-3.5 text-small text-ink transition-[background-color,transform] duration-150 hover:bg-raised active:scale-95"
            >
              <span className="font-semibold">{vol(p.ml)}</span>
              {p.key !== 'small' && p.key !== 'litre' && p.key !== 'large' && <span className="text-muted">· {t(`water.${p.key}`)}</span>}
            </button>
          ))}
        </div>
        <form
          className="flex w-full items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (typeof customMl === 'number' && customMl > 0 && customMl <= 5000) {
              add(customMl);
              setCustomMl('');
            }
          }}
        >
          <div className="min-w-0 flex-1">
            <VolumeInput label={t('water.custom')} ml={customMl} unit={customUnit} onUnitChange={setCustomUnit} onChange={setCustomMl} />
          </div>
          <Button type="submit" disabled={typeof customMl !== 'number' || customMl <= 0 || customMl > 5000}>
            {t('common.add')}
          </Button>
        </form>
        <div className="flex w-full items-center justify-between gap-2 border-t border-line pt-3">
          <span className="text-small text-muted">
            {t('water.target')}: {vol(goal)}
          </span>
          <Button size="sm" variant="ghost" onClick={() => setEditTarget(true)}>
            {t('water.editTarget')}
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader title={t('water.today')} />
        {logs.loading ? (
          <Skeleton className="h-16" />
        ) : todayLogs.length === 0 ? (
          <EmptyState title={t('water.empty')} description={t('water.emptyHint')} />
        ) : (
          <ul className="-mx-2 flex flex-col divide-y divide-line">
            {todayLogs.map((l) => (
              <SwipeRow
                key={l.id}
                className="px-2"
                onEdit={() => setEditing(l)}
                onDelete={() => remove(l)}
                editLabel={t('common.edit')}
                deleteLabel={t('common.delete')}
                menuLabel={t('common.moreActions')}
              >
                <div className="flex items-center justify-between gap-3 py-2.5">
                  <span className="text-body font-medium text-ink tabular-nums">{vol(l.ml)}</span>
                  {l.timeMinutes !== undefined && <span className="text-small text-muted">{formatMinutes(l.timeMinutes, lang)}</span>}
                </div>
              </SwipeRow>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader title={t('water.history')} />
        <BarChart
          ariaLabel={t('water.history')}
          target={goal}
          targetLabel={`${t('water.target')}: ${vol(goal)}`}
          colorClass="fill-water"
          points={seriesFor(range, today, (d) => logs.rows.filter((l) => l.date === d).reduce((a, l) => a + l.ml, 0)).map((b) => ({
            label: bucketLabel(b, range),
            value: b.value,
          }))}
          formatValue={vol}
        />
      </Card>

      <EditWaterSheet key={editing?.id ?? 'none'} entry={editing} onClose={() => setEditing(null)} unit={prefs.volume} />
      <WaterTargetSheet
        open={editTarget}
        onClose={() => setEditTarget(false)}
        goalMl={goal}
        unit={prefs.volume}
        suggestedMl={profile.targets.waterMl}
      />
    </>
  );
}

function EditWaterSheet({ entry, onClose, unit }: { entry: Entry | null; onClose: () => void; unit: VolumeUnit }) {
  const { t } = useTranslation();
  // Keyed by entry id at the call site: state starts from the entry, no late initialising effect.
  const [ml, setMl] = useState<number | ''>(() => entry?.ml ?? '');
  const [u, setU] = useState<VolumeUnit>(unit);
  const [time, setTime] = useState(() => entry?.timeMinutes ?? 12 * 60);
  if (!entry) return null;
  const valid = typeof ml === 'number' && ml >= 1 && ml <= 5000;
  return (
    <Sheet
      open
      onClose={onClose}
      closeLabel={t('common.close')}
      title={t('water.editEntry')}
      footer={
        <Button
          fullWidth
          disabled={!valid}
          onClick={() => {
            void updateRecord('waterLogs', entry.id, { ml: Math.round(ml as number), timeMinutes: time });
            toast(t('common.saved'));
            onClose();
          }}
        >
          {t('common.save')}
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <VolumeInput label={t('water.amount')} ml={ml} unit={u} onUnitChange={setU} onChange={setMl} />
        {!valid && ml !== '' && <p className="text-caption text-danger-text">{t('errors.number', { min: 1, max: 5000 })}</p>}
        <TimeField label={t('common.time')} minutes={time} onChange={setTime} />
      </div>
    </Sheet>
  );
}

function WaterTargetSheet({
  open,
  onClose,
  goalMl,
  unit,
  suggestedMl,
}: {
  open: boolean;
  onClose: () => void;
  goalMl: number;
  unit: VolumeUnit;
  suggestedMl: number;
}) {
  const { t } = useTranslation();
  const { vol } = useUnits();
  const [v, setV] = useState<number | ''>(Math.round(mlToVolume(goalMl, unit) * 10) / 10);
  React.useEffect(() => {
    if (open) setV(Math.round(mlToVolume(goalMl, unit) * 10) / 10);
  }, [open, goalMl, unit]);
  const ml = typeof v === 'number' ? Math.round(volumeToMl(v, unit)) : 0;
  const valid = ml >= 500 && ml <= 8000;
  const step = unit === 'ml' ? 250 : unit === 'l' ? 0.25 : unit === 'floz' ? 8 : 1;
  return (
    <Sheet
      open={open}
      onClose={onClose}
      closeLabel={t('common.close')}
      title={t('water.editTarget')}
      footer={
        <Button
          fullWidth
          disabled={!valid}
          onClick={() => {
            void updateProfileFields({ waterTargetMl: ml });
            toast(t('settings.targetsUpdated'));
            onClose();
          }}
        >
          {t('common.save')}
        </Button>
      }
    >
      <div className="flex flex-col gap-3">
        <Stepper
          label={`${t('water.target')} (${t(`units.${unit}`)})`}
          value={v}
          onChange={setV}
          step={step}
          min={0}
          max={unit === 'ml' ? 8000 : 300}
          decreaseLabel={t('common.decrease')}
          increaseLabel={t('common.increase')}
          error={!valid && v !== '' ? t('water.targetRange', { min: vol(500), max: vol(8000) }) : undefined}
        />
        <button
          type="button"
          onClick={() => setV(Math.round(mlToVolume(suggestedMl, unit) * 10) / 10)}
          className={cn('self-start rounded-full border border-line px-3 py-1.5 text-small text-ink hover:bg-raised')}
        >
          {t('water.useSuggested', { amount: vol(suggestedMl) })}
        </button>
      </div>
    </Sheet>
  );
}
