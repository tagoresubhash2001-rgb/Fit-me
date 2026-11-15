import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Flame, Scale, Dumbbell, Activity, HeartPulse, Salad, TrendingUp } from 'lucide-react';
import { Button, Card, Choice, Input, ProgressBar, Select } from '../../components/ui';
import { HeightField, WeightField, UnitsToggle, TimeField } from './BodyFields';
import { LanguagePicker } from '../settings/LanguagePicker';
import { useSession } from '../../data/session';
import { saveProfile } from '../../data/auth';
import { detectDeviceLocale, currencyForCountry, unitsForCountry, weekStartForCountry, type Language } from '../../domain/locale';
import { calculateTargets, ageFromBirthYear, bmiBand, type ActivityLevel, type Goal } from '../../domain/calculators';
import { COUNTRIES } from '../../domain/countries';
import type { UserProfile } from '../../domain/models';
import { useThemeStore } from '../../stores/theme.store';
import { formatVolume } from '../../domain/units';
import i18n from '../../lib/i18n';

const GOALS: Array<{ id: Goal; icon: React.ReactNode }> = [
  { id: 'lose', icon: <Flame className="h-5 w-5" strokeWidth={1.75} /> },
  { id: 'gain', icon: <TrendingUp className="h-5 w-5" strokeWidth={1.75} /> },
  { id: 'maintain', icon: <Scale className="h-5 w-5" strokeWidth={1.75} /> },
  { id: 'build_muscle', icon: <Dumbbell className="h-5 w-5" strokeWidth={1.75} /> },
  { id: 'improve_fitness', icon: <Activity className="h-5 w-5" strokeWidth={1.75} /> },
  { id: 'wellness', icon: <HeartPulse className="h-5 w-5" strokeWidth={1.75} /> },
  { id: 'eating_habits', icon: <Salad className="h-5 w-5" strokeWidth={1.75} /> },
];
const ACTIVITIES: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'very', 'extra'];
const DIETS = ['vegetarian', 'non_vegetarian', 'eggetarian', 'vegan', 'pescatarian'] as const;
const TOTAL = 7;
const MAX_BIRTH_YEAR = new Date().getFullYear() - 13;

export default function Onboarding() {
  const { t } = useTranslation();
  const user = useSession((s) => s.user);
  const device = useMemo(() => detectDeviceLocale(), []);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [f, setF] = useState({
    language: (i18n.language as Language) || device.language,
    name: user?.displayName ?? '',
    birthYear: '' as number | '',
    sex: 'female' as 'male' | 'female',
    units: device.units,
    heightCm: '' as number | '',
    weightKg: '' as number | '',
    targetWeightKg: '' as number | '',
    goal: 'lose' as Goal,
    activity: 'light' as ActivityLevel,
    dietType: 'vegetarian' as (typeof DIETS)[number],
    allergies: '',
    fixedHours: true,
    workStart: 9 * 60,
    workEnd: 18 * 60,
    sleepStart: 22 * 60 + 30,
    wake: 6 * 60 + 30,
    equipment: 'none' as UserProfile['equipment'],
    experience: 'beginner' as UserProfile['experience'],
    country: device.country,
    region: '',
    coach: 'jaya' as 'jai' | 'jaya',
    consent: false,
  });
  const up = (patch: Partial<typeof f>) => setF((s) => ({ ...s, ...patch }));

  const validate = (s: number): boolean => {
    const e: Record<string, string> = {};
    if (s === 2) {
      if (!f.name.trim()) e.name = t('onboarding.errors.name');
      if (!(typeof f.birthYear === 'number' && f.birthYear >= 1920 && f.birthYear <= MAX_BIRTH_YEAR))
        e.birthYear = t('onboarding.errors.birthYear', { max: MAX_BIRTH_YEAR });
      if (!(typeof f.heightCm === 'number' && f.heightCm >= 100 && f.heightCm <= 250)) e.height = t('onboarding.errors.height');
      if (!(typeof f.weightKg === 'number' && f.weightKg >= 25 && f.weightKg <= 350)) e.weight = t('onboarding.errors.weight');
    }
    if (s === 3 && !(typeof f.targetWeightKg === 'number' && f.targetWeightKg >= 25 && f.targetWeightKg <= 350))
      e.targetWeight = t('onboarding.errors.targetWeight');
    if (s === 6 && !f.consent) e.consent = t('onboarding.consentRequired');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const targets = useMemo(() => {
    if (typeof f.birthYear !== 'number' || typeof f.heightCm !== 'number' || typeof f.weightKg !== 'number') return null;
    try {
      return calculateTargets({
        sex: f.sex,
        ageYears: ageFromBirthYear(f.birthYear),
        heightCm: f.heightCm,
        weightKg: f.weightKg,
        activity: f.activity,
        goal: f.goal,
      });
    } catch {
      return null;
    }
  }, [f.birthYear, f.heightCm, f.weightKg, f.sex, f.activity, f.goal]);

  const next = () => {
    if (!validate(step)) return;
    if (step === 3 && f.targetWeightKg === '') up({ targetWeightKg: f.weightKg });
    setStep((s) => Math.min(TOTAL, s + 1));
    window.scrollTo(0, 0);
  };

  const finish = async () => {
    if (!targets || !user) return;
    setSaving(true);
    const profile: UserProfile = {
      uid: user.uid,
      name: f.name.trim(),
      birthYear: f.birthYear as number,
      sex: f.sex,
      heightCm: f.heightCm as number,
      weightKg: f.weightKg as number,
      targetWeightKg: (f.targetWeightKg || f.weightKg) as number,
      activity: f.activity,
      goal: f.goal,
      dietType: f.dietType,
      allergies: f.allergies
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean)
        .slice(0, 20),
      equipment: f.equipment,
      experience: f.experience,
      workStartMinutes: f.fixedHours ? f.workStart : null,
      workEndMinutes: f.fixedHours ? f.workEnd : null,
      sleepStartMinutes: f.sleepStart,
      wakeMinutes: f.wake,
      country: f.country,
      region: f.region.trim() || undefined,
      language: f.language,
      currency: currencyForCountry(f.country),
      units: f.units,
      timezone: device.timezone,
      weekStart: weekStartForCountry(f.country),
      coach: f.coach,
      waterTargetMl: targets.waterMl,
      stepTarget: 8000,
      targets,
    };
    try {
      await saveProfile(profile, true);
      useThemeStore.getState().applyTheme();
    } finally {
      setSaving(false);
    }
  };

  const title: Record<number, [string, string?]> = {
    1: [t('onboarding.languageTitle'), t('onboarding.languageBody')],
    2: [t('onboarding.aboutTitle'), t('onboarding.aboutBody')],
    3: [t('onboarding.goalTitle'), t('onboarding.goalBody')],
    4: [t('onboarding.foodTitle'), t('onboarding.foodBody')],
    5: [t('onboarding.routineTitle'), t('onboarding.routineBody')],
    6: [t('onboarding.regionTitle'), t('onboarding.regionBody')],
    7: [t('onboarding.targetsTitle'), t('onboarding.targetsBody')],
  };

  return (
    <div className="min-h-dvh bg-canvas px-4 pb-10 pt-[max(20px,env(safe-area-inset-top))]">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-title font-semibold text-ink">
            FIT ME <span className="text-primary">AI</span>
          </span>
          <span className="text-caption text-muted">{t('onboarding.stepOf', { step, total: TOTAL })}</span>
        </div>
        <ProgressBar value={step} max={TOTAL} label={t('onboarding.stepOf', { step, total: TOTAL })} className="mb-6" />

        <h1 className="text-display text-ink">{title[step][0]}</h1>
        {title[step][1] && <p className="mt-1 mb-5 text-body text-muted">{title[step][1]}</p>}

        <Card className="flex flex-col gap-4">
          {step === 1 && <LanguagePicker onChange={(l) => up({ language: l })} />}

          {step === 2 && (
            <>
              <Input
                label={t('onboarding.name')}
                autoComplete="given-name"
                value={f.name}
                error={errors.name}
                onChange={(e) => up({ name: e.target.value })}
              />
              <Input
                label={t('onboarding.birthYear')}
                inputMode="numeric"
                maxLength={4}
                value={f.birthYear}
                error={errors.birthYear}
                onChange={(e) => up({ birthYear: e.target.value === '' ? '' : Number(e.target.value) })}
              />
              <div className="flex flex-col gap-2">
                <span className="text-small font-medium text-ink">{t('onboarding.sex')}</span>
                <div role="radiogroup" className="grid grid-cols-2 gap-2">
                  <Choice selected={f.sex === 'female'} onSelect={() => up({ sex: 'female' })} title={t('onboarding.female')} />
                  <Choice selected={f.sex === 'male'} onSelect={() => up({ sex: 'male' })} title={t('onboarding.male')} />
                </div>
                <span className="text-caption text-muted">{t('onboarding.sexHint')}</span>
              </div>
              <UnitsToggle units={f.units} onChange={(u) => up({ units: u })} />
              <HeightField cm={f.heightCm} units={f.units} error={errors.height} onChange={(v) => up({ heightCm: v })} />
              <WeightField
                label={t('onboarding.weight')}
                kg={f.weightKg}
                units={f.units}
                error={errors.weight}
                onChange={(v) => up({ weightKg: v })}
              />
            </>
          )}

          {step === 3 && (
            <>
              <div role="radiogroup" className="flex flex-col gap-2">
                {GOALS.map((g) => (
                  <Choice
                    key={g.id}
                    selected={f.goal === g.id}
                    onSelect={() => up({ goal: g.id })}
                    title={t(`goals.${g.id}`)}
                    icon={g.icon}
                  />
                ))}
              </div>
              <WeightField
                label={t('onboarding.targetWeight')}
                kg={f.targetWeightKg === '' ? f.weightKg : f.targetWeightKg}
                units={f.units}
                error={errors.targetWeight}
                onChange={(v) => up({ targetWeightKg: v })}
              />
              <h2 className="pt-2 text-title text-ink">{t('onboarding.activityTitle')}</h2>
              <div role="radiogroup" className="flex flex-col gap-2">
                {ACTIVITIES.map((a) => (
                  <Choice
                    key={a}
                    selected={f.activity === a}
                    onSelect={() => up({ activity: a })}
                    title={t(`activity.${a}`)}
                    description={t(`activity.${a}Hint`)}
                  />
                ))}
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div role="radiogroup" aria-label={t('onboarding.diet')} className="flex flex-col gap-2">
                {DIETS.map((d) => (
                  <Choice key={d} selected={f.dietType === d} onSelect={() => up({ dietType: d })} title={t(`diet.${d}`)} />
                ))}
              </div>
              <Input
                label={t('onboarding.allergies')}
                hint={t('onboarding.allergiesHint')}
                value={f.allergies}
                onChange={(e) => up({ allergies: e.target.value })}
              />
            </>
          )}

          {step === 5 && (
            <>
              <Choice
                multi
                selected={!f.fixedHours}
                onSelect={() => up({ fixedHours: !f.fixedHours })}
                title={t('onboarding.noFixedHours')}
              />
              {f.fixedHours && (
                <div className="grid grid-cols-2 gap-2">
                  <TimeField label={t('onboarding.workStart')} minutes={f.workStart} onChange={(m) => up({ workStart: m })} />
                  <TimeField label={t('onboarding.workEnd')} minutes={f.workEnd} onChange={(m) => up({ workEnd: m })} />
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <TimeField label={t('onboarding.sleep')} minutes={f.sleepStart} onChange={(m) => up({ sleepStart: m })} />
                <TimeField label={t('onboarding.wake')} minutes={f.wake} onChange={(m) => up({ wake: m })} />
              </div>
              <Select
                label={t('onboarding.equipment')}
                value={f.equipment}
                onChange={(e) => up({ equipment: e.target.value as UserProfile['equipment'] })}
              >
                {(['none', 'home_basic', 'gym'] as const).map((x) => (
                  <option key={x} value={x}>
                    {t(`equipment.${x}`)}
                  </option>
                ))}
              </Select>
              <Select
                label={t('onboarding.experience')}
                value={f.experience}
                onChange={(e) => up({ experience: e.target.value as UserProfile['experience'] })}
              >
                {(['beginner', 'intermediate', 'advanced'] as const).map((x) => (
                  <option key={x} value={x}>
                    {t(`experience.${x}`)}
                  </option>
                ))}
              </Select>
            </>
          )}

          {step === 6 && (
            <>
              <Select
                label={t('onboarding.country')}
                value={f.country}
                onChange={(e) =>
                  up({ country: e.target.value, units: unitsForCountry(e.target.value) === 'imperial' ? 'imperial' : f.units })
                }
              >
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {new Intl.DisplayNames([i18n.language], { type: 'region' }).of(c) ?? c}
                  </option>
                ))}
              </Select>
              <Input
                label={`${t('onboarding.region')} (${t('common.optional')})`}
                value={f.region}
                onChange={(e) => up({ region: e.target.value })}
              />
              <div className="flex flex-col gap-2">
                <span className="text-small font-medium text-ink">{t('onboarding.coach')}</span>
                <Choice
                  selected={f.coach === 'jai'}
                  onSelect={() => up({ coach: 'jai' })}
                  title={t('coach.jai')}
                  description={t('onboarding.coachJai')}
                />
                <Choice
                  selected={f.coach === 'jaya'}
                  onSelect={() => up({ coach: 'jaya' })}
                  title={t('coach.jaya')}
                  description={t('onboarding.coachJaya')}
                />
              </div>
              <div className="flex flex-col gap-2 border-t border-line pt-4">
                <span className="text-small font-medium text-ink">{t('onboarding.consentTitle')}</span>
                <Choice multi selected={f.consent} onSelect={() => up({ consent: !f.consent })} title={t('onboarding.consentHealth')} />
                {errors.consent && <p className="text-caption text-danger">{errors.consent}</p>}
                <p className="text-caption text-muted">{t('common.disclaimer')}</p>
              </div>
            </>
          )}

          {step === 7 && targets && (
            <>
              <div className="rounded-input bg-sage p-4">
                <p className="text-small text-muted">{t('onboarding.calories')}</p>
                <p className="text-display text-ink tabular-nums">
                  {targets.calories} <span className="text-body text-muted">{t('common.kcal')}</span>
                </p>
              </div>
              <dl className="grid grid-cols-2 gap-2">
                {(
                  [
                    ['protein', `${targets.proteinG} ${t('common.g')}`],
                    ['carbs', `${targets.carbsG} ${t('common.g')}`],
                    ['fat', `${targets.fatG} ${t('common.g')}`],
                    ['fiber', `${targets.fiberG} ${t('common.g')}`],
                    ['water', formatVolume(targets.waterMl, f.units, i18n.language)],
                    ['bmi', `${targets.bmi}`],
                    ['bmr', `${targets.bmr} ${t('common.kcal')}`],
                    ['tdee', `${targets.tdee} ${t('common.kcal')}`],
                  ] as const
                ).map(([k, v]) => (
                  <div key={k} className="rounded-input border border-line p-3">
                    <dt className="text-caption text-muted">{t(`onboarding.${k}`)}</dt>
                    <dd className="text-body font-semibold text-ink tabular-nums">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="text-small text-muted">{t(`onboarding.bmiBand.${bmiBand(targets.bmi)}`)}</p>
            </>
          )}

          <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
            {step > 1 ? (
              <Button variant="secondary" onClick={() => setStep((s) => s - 1)}>
                {t('common.back')}
              </Button>
            ) : (
              <span />
            )}
            {step < TOTAL ? (
              <Button id="onboarding-next" onClick={next}>
                {t('common.continue')}
              </Button>
            ) : (
              <Button id="onboarding-finish" loading={saving} disabled={!targets} onClick={finish}>
                {t('onboarding.startPlan')}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
