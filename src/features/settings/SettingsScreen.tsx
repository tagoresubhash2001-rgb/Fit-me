import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, LogOut, Trash2, User, Bell, ShieldCheck } from 'lucide-react';
import { ConnectedDevices } from './ConnectedDevices';
import { SupportCards } from './SupportCards';
import { ProfilePhoto } from './ProfilePhoto';
import { PermissionsSettings } from '../permissions/PermissionsSettings';
import { AccessStageCard } from '../plans/PlanPrompts';
import { useFeatures } from '../../data/appConfig';
import { Badge, Button, Card, CardHeader, Choice, Input, Select, Sheet, Tabs, cn, toast } from '../../components/ui';
import { useSession } from '../../data/session';
import { deleteAccount, exportData, signOut, updateProfileFields, authErrorKey, isServerUnavailable } from '../../data/auth';
import { useThemeStore, type VisualTheme } from '../../stores/theme.store';
import { LanguagePicker } from './LanguagePicker';
import { DobPicker, MeasureInput, dobError, dobFromIso, dobToIso } from '../common/fields';
import { CountryField, RegionField } from '../common/location';
import { GoalPicker } from '../common/goals';
import { AllergyField, RestrictionField } from '../common/diet';
import { unitPrefsOf } from '../../domain/prefs';
import { defaultUnitPrefs, type HeightUnit, type WeightUnit } from '../../domain/units';
import { calorieGoalFor, type GoalId } from '../../domain/goals';
import { ageOn } from '../../domain/dob';
import { localDate } from '../../domain/dates';
import { useLocation, useNavigate } from 'react-router-dom';
import { currencyForCountry, weekStartForCountry } from '../../domain/locale';
import { calculateTargets, bmi as bmiOf, type ActivityLevel } from '../../domain/calculators';
import type { UserProfile } from '../../domain/models';

const ACTIVITIES: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'very', 'extra'];

export default function SettingsScreen() {
  const { t } = useTranslation();
  const user = useSession((s) => s.user)!;
  const profile = useSession((s) => s.profile)!;
  const plan = useSession((s) => s.plan);
  const navigate = useNavigate();
  const features = useFeatures();
  const { hash } = useLocation();
  const prefs = unitPrefsOf(profile);
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
    } catch (e) {
      toast(t(isServerUnavailable(e) ? 'common.serverUnavailable' : 'common.error'), 'error');
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

  const sections = [
    ['profile', t('nav.profile')],
    ['preferences', t('settings.preferences')],
    ['devices', t('devices.title')],
    ['permissions', t('permissions.title')],
    ['reminders', t('settings.notifications')],
    ['privacy', t('settings.privacy')],
    ['about', t('settings.about')],
  ] as const;
  // Deep links such as /settings#profile from the sidebar and avatar menu.
  React.useEffect(() => {
    if (!hash) return;
    document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [hash]);
  return (
    <div className="xl:grid xl:grid-cols-[minmax(180px,240px)_minmax(0,1fr)] xl:items-start xl:gap-8">
      {/* Desktop: section menu */}
      <nav aria-label={t('settings.title')} className="sticky top-24 hidden flex-col gap-1 xl:flex">
        <h1 className="mb-3 text-display text-ink">{t('settings.title')}</h1>
        {sections.map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            className={cn(
              'flex min-h-11 items-center rounded-button px-3 text-body transition-colors hover:bg-raised',
              hash === `#${id}` ? 'bg-primary-subtle font-semibold text-primary-text' : 'text-ink',
            )}
          >
            {label}
          </a>
        ))}
      </nav>
      <div className="stagger flex max-w-3xl flex-col gap-4 scroll-mt-24">
        <h1 className="text-display text-ink xl:hidden">{t('settings.title')}</h1>

        <Card id="profile" className="flex scroll-mt-24 items-center gap-3">
          <ProfilePhoto />
          <div className="min-w-0 flex-1">
            <p className="truncate text-body font-semibold text-ink">{profile.name}</p>
            <p className="truncate text-small text-muted">{t('settings.signedInAs', { who: user.email ?? user.phoneNumber ?? '' })}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge tone={plan === 'free' ? 'neutral' : 'primary'}>{t('plans.currentPlan', { plan: t(`plans.${plan}`) })}</Badge>
              {plan !== 'pro' && (
                <Button id="settings-upgrade" size="sm" onClick={() => navigate('/plans')}>
                  {t('plans.upgrade')}
                </Button>
              )}
              {plan !== 'free' && (
                <Button id="settings-manage-plan" size="sm" variant="secondary" onClick={() => navigate('/plans')}>
                  {t('plans.manage')}
                </Button>
              )}
              <Button size="sm" variant="secondary" icon={<User className="h-4 w-4" strokeWidth={1.75} />} onClick={() => setEditing(true)}>
                {t('settings.editProfile')}
              </Button>
            </div>
          </div>
        </Card>

        <AccessStageCard />

        {features.deviceSync && <ConnectedDevices />}

        <PermissionsSettings />

        <Card id="preferences" className="flex scroll-mt-24 flex-col gap-4">
          <CardHeader title={t('settings.preferences')} />
          <LanguagePicker onChange={(l) => void updateProfileFields({ language: l })} />
          <fieldset className="flex flex-col gap-1.5">
            <legend className="mb-1.5 text-small font-medium text-ink">{t('settings.units')}</legend>
            <div className="grid grid-cols-3 gap-2">
              <Select
                aria-label={t('settings.heightUnit')}
                label={t('settings.heightUnit')}
                value={prefs.height}
                onChange={(e) => void updateProfileFields({ heightUnit: e.target.value as UserProfile['heightUnit'] })}
              >
                {(['cm', 'ftin'] as const).map((u) => (
                  <option key={u} value={u}>
                    {t(`units.${u}`)}
                  </option>
                ))}
              </Select>
              <Select
                aria-label={t('settings.weightUnit')}
                label={t('settings.weightUnit')}
                value={prefs.weight}
                onChange={(e) => void updateProfileFields({ weightUnit: e.target.value as UserProfile['weightUnit'] })}
              >
                {(['kg', 'lb', 'stlb'] as const).map((u) => (
                  <option key={u} value={u}>
                    {t(`units.${u}`)}
                  </option>
                ))}
              </Select>
              <Select
                aria-label={t('settings.volumeUnit')}
                label={t('settings.volumeUnit')}
                value={prefs.volume}
                onChange={(e) => void updateProfileFields({ volumeUnit: e.target.value as UserProfile['volumeUnit'] })}
              >
                {(['ml', 'l', 'floz', 'cup'] as const).map((u) => (
                  <option key={u} value={u}>
                    {t(`units.${u}`)}
                  </option>
                ))}
              </Select>
            </div>
          </fieldset>
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
          <CountryField
            value={profile.country}
            onChange={(c) => {
              const u = defaultUnitPrefs(c);
              void updateProfileFields({
                country: c,
                currency: currencyForCountry(c),
                weekStart: weekStartForCountry(c),
                region: '',
                regionCode: '',
                heightUnit: u.height,
                weightUnit: u.weight,
                volumeUnit: u.volume,
              });
              toast(t('settings.countryChanged'));
            }}
          />
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

        {features.reminders && (
          <Card id="reminders" className="flex scroll-mt-24 items-start gap-3">
            <Bell className="mt-0.5 h-5 w-5 shrink-0 text-primary-text" strokeWidth={1.75} />
            <div>
              <p className="text-body font-medium text-ink">{t('settings.notifications')}</p>
              <p className="text-small text-muted">{t('settings.notificationsBody')}</p>
            </div>
          </Card>
        )}

        <Card id="privacy" className="flex scroll-mt-24 flex-col gap-3">
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

        {features.testimonials && (
          <Card id="stories-entry" className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-body font-semibold text-ink">{t('stories.entryTitle')}</p>
              <p className="text-small text-muted">{t('stories.entryBody')}</p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => navigate('/stories')}>
              {t('stories.open')}
            </Button>
          </Card>
        )}

        <SupportCards />

        <Card id="about" tone="subtle" className="scroll-mt-24">
          <p className="text-small text-ink">{t('common.disclaimer')}</p>
          <p className="mt-2 text-caption text-muted">{t('settings.version', { v: import.meta.env.VITE_APP_VERSION ?? '0.1.0' })}</p>
          <a
            href="/privacy.html"
            className="mt-2 inline-flex min-h-11 items-center text-small font-semibold text-primary-text hover:underline"
          >
            {t('settings.privacyPage')}
          </a>
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
              <p role="alert" className="text-small text-danger-text">
                {deleteError}
              </p>
            )}
          </div>
        </Sheet>

        {editing && <EditProfileSheet profile={profile} onClose={() => setEditing(false)} />}
      </div>
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
  const prefs = unitPrefsOf(profile);
  const todayIso = localDate(Date.now(), profile.timezone);
  const [f, setF] = useState({
    name: profile.name,
    dob: dobFromIso(profile.birthDate ?? `${profile.birthYear}-01-01`),
    sex: profile.sex,
    heightCm: profile.heightCm as number | '',
    weightKg: profile.weightKg as number | '',
    targetWeightKg: profile.targetWeightKg as number | '',
    heightUnit: prefs.height,
    weightUnit: prefs.weight,
    goals: (profile.goals as GoalId[] | undefined) ?? [legacyGoal(profile.goal)],
    primaryGoal: ((profile.primaryGoal as GoalId | undefined) ?? legacyGoal(profile.goal)) as GoalId | null,
    activity: profile.activity,
    dietType: profile.dietType,
    allergies: profile.allergies ?? [],
    restrictions: profile.restrictions ?? [],
    region: profile.region ? { name: profile.region, code: profile.regionCode ?? '' } : null,
    city: profile.city ?? '',
  });
  const up = (p: Partial<typeof f>) => setF((s) => ({ ...s, ...p }));
  const dobIso = dobToIso(f.dob);
  const dobErr = dobError(f.dob, todayIso);
  let targets: UserProfile['targets'] | null = null;
  if (!dobErr && dobIso && typeof f.heightCm === 'number' && typeof f.weightKg === 'number' && f.primaryGoal) {
    try {
      targets = calculateTargets({
        sex: f.sex,
        ageYears: ageOn(dobIso, todayIso),
        heightCm: f.heightCm,
        weightKg: f.weightKg,
        activity: f.activity,
        goal: calorieGoalFor(f.primaryGoal),
      });
    } catch {
      targets = null;
    }
  }
  const bmiNow =
    typeof f.heightCm === 'number' && typeof f.weightKg === 'number' && f.heightCm >= 100 && f.weightKg >= 25
      ? bmiOf(f.weightKg, f.heightCm)
      : null;
  const target = f.targetWeightKg === '' ? f.weightKg : f.targetWeightKg;
  const valid = !!targets && f.name.trim().length > 0 && typeof target === 'number' && target >= 25 && target <= 350 && f.goals.length > 0;
  return (
    <Sheet
      open
      onClose={onClose}
      closeLabel={t('common.close')}
      title={t('settings.editProfile')}
      footer={
        <Button
          id="profile-save"
          fullWidth
          disabled={!valid}
          onClick={() => {
            if (!targets || !dobIso || !f.primaryGoal) return;
            void updateProfileFields({
              name: f.name.trim(),
              birthDate: dobIso,
              birthYear: Number(dobIso.slice(0, 4)),
              sex: f.sex,
              heightCm: f.heightCm as number,
              weightKg: f.weightKg as number,
              targetWeightKg: target as number,
              heightUnit: f.heightUnit,
              weightUnit: f.weightUnit,
              goals: f.goals,
              primaryGoal: f.primaryGoal,
              goal: calorieGoalFor(f.primaryGoal),
              activity: f.activity,
              dietType: f.dietType,
              allergies: f.allergies,
              restrictions: f.restrictions,
              region: f.region?.name ?? '',
              regionCode: f.region?.code ?? '',
              city: f.city.trim(),
              targets,
              waterTargetMl: targets.waterMl,
            });
            toast(t('settings.targetsUpdated'));
            onClose();
          }}
        >
          {targets ? t('settings.saveWithTargets', { kcal: targets.calories }) : t('common.save')}
        </Button>
      }
    >
      <div className="flex flex-col gap-5">
        <Input
          label={t('onboarding.name')}
          value={f.name}
          error={!f.name.trim() ? t('onboarding.errors.name') : undefined}
          onChange={(e) => up({ name: e.target.value })}
        />
        <DobPicker value={f.dob} onChange={(dob) => up({ dob })} todayIso={todayIso} showError />
        <div className="grid grid-cols-2 gap-2">
          <Choice selected={f.sex === 'female'} onSelect={() => up({ sex: 'female' })} title={t('onboarding.female')} />
          <Choice selected={f.sex === 'male'} onSelect={() => up({ sex: 'male' })} title={t('onboarding.male')} />
        </div>
        <MeasureInput
          kind="height"
          label={t('onboarding.height')}
          valueMetric={f.heightCm}
          unit={f.heightUnit}
          onUnitChange={(u) => up({ heightUnit: u as HeightUnit })}
          onChange={(v) => up({ heightCm: v })}
          error={typeof f.heightCm !== 'number' || f.heightCm < 100 || f.heightCm > 250 ? t('onboarding.errors.height') : undefined}
        />
        <MeasureInput
          kind="weight"
          label={t('onboarding.weight')}
          valueMetric={f.weightKg}
          unit={f.weightUnit}
          onUnitChange={(u) => up({ weightUnit: u as WeightUnit })}
          onChange={(v) => up({ weightKg: v })}
          error={typeof f.weightKg !== 'number' || f.weightKg < 25 || f.weightKg > 350 ? t('onboarding.errors.weight') : undefined}
        />
        <h3 className="text-title text-ink">{t('onboarding.goalTitle')}</h3>
        <GoalPicker
          selected={f.goals}
          primary={f.primaryGoal}
          onChange={(goals, primaryGoal) => up({ goals, primaryGoal })}
          bmi={bmiNow}
          age={dobIso && !dobErr ? ageOn(dobIso, todayIso) : null}
          activity={f.activity}
        />
        <MeasureInput
          kind="weight"
          label={t('onboarding.targetWeight')}
          valueMetric={target}
          unit={f.weightUnit}
          onUnitChange={(u) => up({ weightUnit: u as WeightUnit })}
          onChange={(v) => up({ targetWeightKg: v })}
        />
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
        <AllergyField values={f.allergies} onChange={(allergies) => up({ allergies })} />
        <RestrictionField values={f.restrictions} onChange={(restrictions) => up({ restrictions })} />
        <RegionField country={profile.country} value={f.region} onChange={(region) => up({ region })} />
        <Input
          label={`${t('location.city')} (${t('common.optional')})`}
          value={f.city}
          maxLength={80}
          onChange={(e) => up({ city: e.target.value })}
        />
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

/** Older profiles stored one calculator goal; map it to the new goal ids. */
function legacyGoal(g: UserProfile['goal']): GoalId {
  if (g === 'wellness') return 'improve_energy';
  if (g === 'eating_habits') return 'eat_healthier';
  return g as GoalId;
}
