import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, LogOut, Trash2, User, Bell, ShieldCheck } from 'lucide-react';
import { Badge, Button, Card, CardHeader, Choice, Input, Select, Sheet, Tabs, toast } from '../../components/ui';
import { useSession } from '../../data/session';
import { deleteAccount, exportData, signOut, updateProfileFields, authErrorKey } from '../../data/auth';
import { useThemeStore, type VisualTheme } from '../../stores/theme.store';
import { LanguagePicker } from './LanguagePicker';
import { HeightField, WeightField, UnitsToggle } from '../onboarding/BodyFields';
import { COUNTRIES } from '../../domain/countries';
import { currencyForCountry, weekStartForCountry } from '../../domain/locale';
import { calculateTargets, ageFromBirthYear, type ActivityLevel, type Goal } from '../../domain/calculators';
import type { UserProfile } from '../../domain/models';
import i18n from '../../lib/i18n';

const GOALS: Goal[] = ['lose', 'gain', 'maintain', 'build_muscle', 'improve_fitness', 'wellness', 'eating_habits'];
const ACTIVITIES: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'very', 'extra'];

export default function SettingsScreen() {
  const { t } = useTranslation();
  const user = useSession((s) => s.user)!;
  const profile = useSession((s) => s.profile)!;
  const plan = useSession((s) => s.plan);
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const [editing, setEditing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const doExport = async () => {
    setExporting(true);
    try {
      const blob = await exportData();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fitmeai-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast(t('settings.exported'));
    } catch {
      toast(t('common.error'), 'error');
    } finally {
      setExporting(false);
    }
  };

  const doDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount();
      toast(t('settings.deleted'));
    } catch (e) {
      setDeleteError(t(authErrorKey(e)));
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-display text-ink">{t('settings.title')}</h1>

      <Card className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-title text-on-primary">
          {profile.name[0]?.toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-body font-semibold text-ink">{profile.name}</p>
          <p className="truncate text-small text-muted">{t('settings.signedInAs', { who: user.email ?? user.phoneNumber ?? '' })}</p>
          <Badge tone={plan === 'free' ? 'neutral' : 'primary'} className="mt-1">
            {t('plans.currentPlan', { plan: t(`plans.${plan}`) })}
          </Badge>
        </div>
        <Button size="sm" variant="secondary" icon={<User className="h-4 w-4" strokeWidth={1.75} />} onClick={() => setEditing(true)}>
          {t('settings.editProfile')}
        </Button>
      </Card>

      <Card className="flex flex-col gap-4">
        <CardHeader title={t('settings.preferences')} />
        <LanguagePicker onChange={(l) => void updateProfileFields({ language: l })} />
        <div className="flex flex-col gap-1.5">
          <span className="text-small font-medium text-ink">{t('settings.units')}</span>
          <UnitsToggle units={profile.units} onChange={(u) => void updateProfileFields({ units: u })} />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-small font-medium text-ink">{t('settings.theme')}</span>
          <Tabs<VisualTheme>
            value={theme}
            onChange={setTheme}
            items={[
              { id: 'light', label: t('settings.themeLight') },
              { id: 'dark', label: t('settings.themeDark') },
              { id: 'system', label: t('settings.themeSystem') },
            ]}
          />
        </div>
        <Select
          label={t('settings.country')}
          value={profile.country}
          onChange={(e) =>
            void updateProfileFields({
              country: e.target.value,
              currency: currencyForCountry(e.target.value),
              weekStart: weekStartForCountry(e.target.value),
            })
          }
        >
          {COUNTRIES.map((c) => (
            <option key={c} value={c}>
              {new Intl.DisplayNames([i18n.language], { type: 'region' }).of(c) ?? c}
            </option>
          ))}
        </Select>
        <dl className="grid grid-cols-2 gap-2 text-small">
          <div>
            <dt className="text-muted">{t('settings.currency')}</dt>
            <dd className="text-ink">{profile.currency}</dd>
          </div>
          <div>
            <dt className="text-muted">{t('settings.timezone')}</dt>
            <dd className="truncate text-ink">{profile.timezone}</dd>
          </div>
        </dl>
        <StepTargetField profile={profile} />
      </Card>

      <Card className="flex items-start gap-3">
        <Bell className="mt-0.5 h-5 w-5 shrink-0 text-primary" strokeWidth={1.75} />
        <div>
          <p className="text-body font-medium text-ink">{t('settings.notifications')}</p>
          <p className="text-small text-muted">{t('settings.notificationsBody')}</p>
        </div>
      </Card>

      <Card className="flex flex-col gap-3">
        <CardHeader title={t('settings.privacy')} icon={<ShieldCheck className="h-5 w-5" strokeWidth={1.75} />} />
        <Button
          variant="secondary"
          loading={exporting}
          icon={<Download className="h-[18px] w-[18px]" strokeWidth={1.75} />}
          onClick={() => void doExport()}
        >
          {exporting ? t('settings.exporting') : t('settings.export')}
        </Button>
        <Button
          variant="destructive"
          icon={<Trash2 className="h-[18px] w-[18px]" strokeWidth={1.75} />}
          onClick={() => setConfirmOpen(true)}
        >
          {t('settings.deleteAccount')}
        </Button>
      </Card>

      <Button
        variant="secondary"
        icon={<LogOut className="h-[18px] w-[18px] rtl:-scale-x-100" strokeWidth={1.75} />}
        onClick={() => void signOut()}
      >
        {t('settings.signOut')}
      </Button>

      <Card tone="subtle">
        <p className="text-small text-ink">{t('common.disclaimer')}</p>
        <p className="mt-2 text-caption text-muted">{t('settings.version', { v: import.meta.env.VITE_APP_VERSION ?? '0.1.0' })}</p>
      </Card>

      <Sheet
        open={confirmOpen}
        onClose={() => !deleting && setConfirmOpen(false)}
        closeLabel={t('common.close')}
        title={t('settings.deleteTitle')}
        footer={
          <Button
            variant="destructive"
            fullWidth
            loading={deleting}
            disabled={confirmText.trim().toUpperCase() !== t('settings.deleteConfirmWord').toUpperCase()}
            onClick={() => void doDelete()}
          >
            {deleting ? t('settings.deleting') : t('settings.deleteAccount')}
          </Button>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="text-body text-ink">{t('settings.deleteBody')}</p>
          <Input
            label={t('settings.deleteConfirmLabel')}
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            autoComplete="off"
          />
          {deleteError && (
            <p role="alert" className="text-small text-danger">
              {deleteError}
            </p>
          )}
        </div>
      </Sheet>

      {editing && <EditProfileSheet profile={profile} onClose={() => setEditing(false)} />}
    </div>
  );
}

function StepTargetField({ profile }: { profile: UserProfile }) {
  const { t } = useTranslation();
  const [v, setV] = useState<number | ''>(profile.stepTarget ?? 8000);
  return (
    <form
      className="grid grid-cols-[1fr_auto] items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (typeof v !== 'number' || v < 1000 || v > 50000) return;
        void updateProfileFields({ stepTarget: Math.round(v) });
        toast(t('settings.targetsUpdated'));
      }}
    >
      <Input
        label={t('settings.stepTarget')}
        inputMode="numeric"
        value={v}
        error={typeof v === 'number' && (v < 1000 || v > 50000) ? t('errors.number', { min: 1000, max: 50000 }) : undefined}
        onChange={(e) => setV(e.target.value === '' ? '' : Number(e.target.value))}
      />
      <Button type="submit" variant="secondary">
        {t('common.save')}
      </Button>
    </form>
  );
}

function EditProfileSheet({ profile, onClose }: { profile: UserProfile; onClose: () => void }) {
  const { t } = useTranslation();
  const [f, setF] = useState({ ...profile });
  const up = (p: Partial<UserProfile>) => setF((s) => ({ ...s, ...p }));
  let targets: UserProfile['targets'] | null = null;
  try {
    targets = calculateTargets({
      sex: f.sex,
      ageYears: ageFromBirthYear(f.birthYear),
      heightCm: f.heightCm,
      weightKg: f.weightKg,
      activity: f.activity,
      goal: f.goal,
    });
  } catch {
    targets = null;
  }
  return (
    <Sheet
      open
      onClose={onClose}
      closeLabel={t('common.close')}
      title={t('settings.editProfile')}
      footer={
        <Button
          fullWidth
          disabled={!targets || !f.name.trim()}
          onClick={() => {
            if (!targets) return;
            const { onboardedAt: _o, ...rest } = f;
            void updateProfileFields({ ...rest, name: f.name.trim(), targets, waterTargetMl: targets.waterMl });
            toast(t('settings.targetsUpdated'));
            onClose();
          }}
        >
          {t('settings.recalculate')}
        </Button>
      }
    >
      <div className="flex flex-col gap-3">
        <Input label={t('onboarding.name')} value={f.name} onChange={(e) => up({ name: e.target.value })} />
        <Input
          label={t('onboarding.birthYear')}
          inputMode="numeric"
          value={f.birthYear}
          onChange={(e) => up({ birthYear: Number(e.target.value) || 0 })}
        />
        <div className="grid grid-cols-2 gap-2">
          <Choice selected={f.sex === 'female'} onSelect={() => up({ sex: 'female' })} title={t('onboarding.female')} />
          <Choice selected={f.sex === 'male'} onSelect={() => up({ sex: 'male' })} title={t('onboarding.male')} />
        </div>
        <UnitsToggle units={f.units} onChange={(u) => up({ units: u })} />
        <HeightField cm={f.heightCm} units={f.units} onChange={(v) => up({ heightCm: Number(v) || 0 })} />
        <WeightField label={t('onboarding.weight')} kg={f.weightKg} units={f.units} onChange={(v) => up({ weightKg: Number(v) || 0 })} />
        <WeightField
          label={t('onboarding.targetWeight')}
          kg={f.targetWeightKg}
          units={f.units}
          onChange={(v) => up({ targetWeightKg: Number(v) || 0 })}
        />
        <Select label={t('onboarding.goalTitle')} value={f.goal} onChange={(e) => up({ goal: e.target.value as Goal })}>
          {GOALS.map((g) => (
            <option key={g} value={g}>
              {t(`goals.${g}`)}
            </option>
          ))}
        </Select>
        <Select
          label={t('onboarding.activityTitle')}
          value={f.activity}
          onChange={(e) => up({ activity: e.target.value as ActivityLevel })}
        >
          {ACTIVITIES.map((a) => (
            <option key={a} value={a}>
              {t(`activity.${a}`)}
            </option>
          ))}
        </Select>
        <Select
          label={t('onboarding.diet')}
          value={f.dietType}
          onChange={(e) => up({ dietType: e.target.value as UserProfile['dietType'] })}
        >
          {(['vegetarian', 'non_vegetarian', 'eggetarian', 'vegan', 'pescatarian'] as const).map((d) => (
            <option key={d} value={d}>
              {t(`diet.${d}`)}
            </option>
          ))}
        </Select>
        {targets && (
          <p className="rounded-input bg-sage p-3 text-small text-ink tabular-nums">
            {targets.calories} {t('common.kcal')} · {t('onboarding.protein')} {targets.proteinG} {t('common.g')} · {t('onboarding.carbs')}{' '}
            {targets.carbsG} {t('common.g')} · {t('onboarding.fat')} {targets.fatG} {t('common.g')}
          </p>
        )}
      </div>
    </Sheet>
  );
}
