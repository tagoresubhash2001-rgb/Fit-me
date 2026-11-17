import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, Choice, Input, ProgressBar, Select, toast } from '../../components/ui';
import { TimeField } from './BodyFields';
import { LanguagePicker } from '../settings/LanguagePicker';
import { DobPicker, MeasureInput, dobError, dobToIso, type DobValue } from '../common/fields';
import { CountryField, RegionField } from '../common/location';
import { GoalPicker } from '../common/goals';
import { AllergyField, RestrictionField } from '../common/diet';
import { useSession } from '../../data/session';
import { saveProfile } from '../../data/auth';
import { detectDeviceLocale, currencyForCountry, unitsForCountry, weekStartForCountry, type Language } from '../../domain/locale';
import { calculateTargets, bmi as bmiOf, bmiBand, type ActivityLevel } from '../../domain/calculators';
import { calorieGoalFor, type GoalId } from '../../domain/goals';
import { ageOn } from '../../domain/dob';
import { localDate } from '../../domain/dates';
import { defaultUnitPrefs, formatVolumePref, type HeightUnit, type WeightUnit } from '../../domain/units';
import type { UserProfile } from '../../domain/models';
import { useThemeStore } from '../../stores/theme.store';
import i18n from '../../lib/i18n';

const ACTIVITIES: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'very', 'extra'];
const DIETS = ['vegetarian', 'non_vegetarian', 'eggetarian', 'vegan', 'pescatarian'] as const;
const TOTAL = 7;

export default function Onboarding() {
  const { t } = useTranslation();
  const user = useSession((s) => s.user);
  const device = useMemo(() => detectDeviceLocale(), []);
  const todayIso = useMemo(() => localDate(Date.now(), device.timezone), [device.timezone]);
  const initialUnits = defaultUnitPrefs(device.country);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const [f, setF] = useState({
    language: (i18n.language as Language) || device.language,
    name: user?.displayName ?? '',
    dob: { y: '', m: '', d: '' } as DobValue,
    sex: 'female' as 'male' | 'female',
    heightUnit: initialUnits.height as HeightUnit,
    weightUnit: initialUnits.weight as WeightUnit,
    heightCm: '' as number | '',
    weightKg: '' as number | '',
    targetWeightKg: '' as number | '',
    goals: [] as GoalId[],
    primaryGoal: null as GoalId | null,
    activity: 'light' as ActivityLevel,
    dietType: 'vegetarian' as (typeof DIETS)[number],
    allergies: [] as string[],
    restrictions: [] as string[],
    fixedHours: true,
    workStart: 9 * 60,
    workEnd: 18 * 60,
    sleepStart: 22 * 60 + 30,
    wake: 6 * 60 + 30,
    equipment: 'none' as UserProfile['equipment'],
    experience: 'beginner' as UserProfile['experience'],
    country: device.country,
    region: null as { name: string; code: string } | null,
    city: '',
    coach: 'jaya' as 'jai' | 'jaya',
    consent: false,
  });
  const up = (patch: Partial<typeof f>) => setF((s) => ({ ...s, ...patch }));

  const dobIso = dobToIso(f.dob);
  const age = dobIso && !dobError(f.dob, todayIso) ? ageOn(dobIso, todayIso) : null;
  const bmiNow = typeof f.heightCm === 'number' && typeof f.weightKg === 'number' && f.heightCm >= 100 && f.weightKg >= 25 ? bmiOf(f.weightKg, f.heightCm) : null;

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (step === 2) {
      if (!f.name.trim()) e.name = t('onboarding.errors.name');
      if (dobError(f.dob, todayIso)) e.dob = 'dob';
      if (!(typeof f.heightCm === 'number' && f.heightCm >= 100 && f.heightCm <= 250)) e.height = t('onboarding.errors.height');
      if (!(typeof f.weightKg === 'number' && f.weightKg >= 25 && f.weightKg <= 350)) e.weight = t('onboarding.errors.weight');
    }
    if (step === 3) {
      if (!f.goals.length) e.goals = t('goalPicker.required');
      const target = f.targetWeightKg === '' ? f.weightKg : f.targetWeightKg;
      if (!(typeof target === 'number' && target >= 25 && target <= 350)) e.targetWeight = t('onboarding.errors.targetWeight');
    }
    if (step === 6 && !f.consent) e.consent = t('onboarding.consentRequired');
    return e;
  }, [step, f, t, todayIso]);
  const valid = Object.keys(errors).length === 0;

  const targets = useMemo(() => {
    if (age === null || typeof f.heightCm !== 'number' || typeof f.weightKg !== 'number' || !f.primaryGoal) return null;
    try {
      return calculateTargets({ sex: f.sex, ageYears: age, heightCm: f.heightCm, weightKg: f.weightKg, activity: f.activity, goal: calorieGoalFor(f.primaryGoal) });
    } catch {
      return null;
    }
  }, [age, f.heightCm, f.weightKg, f.sex, f.activity, f.primaryGoal]);

  const next = () => {
    if (!valid) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    if (step === 3 && f.targetWeightKg === '') up({ targetWeightKg: f.weightKg });
    setStep((s) => Math.min(TOTAL, s + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const changeCountry = (country: string) => {
    const u = defaultUnitPrefs(country);
    up({ country, region: null, heightUnit: u.height, weightUnit: u.weight });
  };

  const finish = async () => {
    if (!targets || !user || !dobIso || !f.primaryGoal) return;
    setSaving(true);
    const prefs = defaultUnitPrefs(f.country);
    const profile: UserProfile = {
      uid: user.uid,
      name: f.name.trim(),
      birthDate: dobIso,
      birthYear: Number(dobIso.slice(0, 4)),
      sex: f.sex,
      heightCm: f.heightCm as number,
      weightKg: f.weightKg as number,
      targetWeightKg: (f.targetWeightKg || f.weightKg) as number,
      activity: f.activity,
      goal: calorieGoalFor(f.primaryGoal),
      goals: f.goals,
      primaryGoal: f.primaryGoal,
      dietType: f.dietType,
      allergies: f.allergies.slice(0, 30),
      restrictions: f.restrictions.slice(0, 10),
      equipment: f.equipment,
      experience: f.experience,
      workStartMinutes: f.fixedHours ? f.workStart : null,
      workEndMinutes: f.fixedHours ? f.workEnd : null,
      sleepStartMinutes: f.sleepStart,
      wakeMinutes: f.wake,
      country: f.country,
      region: f.region?.name || undefined,
      regionCode: f.region?.code || undefined,
      city: f.city.trim() || undefined,
      language: f.language,
      currency: currencyForCountry(f.country),
      units: unitsForCountry(f.country),
      heightUnit: f.heightUnit,
      weightUnit: f.weightUnit,
      volumeUnit: prefs.volume,
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
    } catch {
      toast(t('onboarding.saveFailed'), 'error');
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
  const err = (k: string) => (showErrors ? errors[k] : undefined);

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

        <div key={step} className="page-enter">
          <h1 className="text-display text-ink">{title[step][0]}</h1>
          {title[step][1] && <p className="mt-1 mb-5 text-body text-muted">{title[step][1]}</p>}

          <Card static className="flex flex-col gap-5">
            {step === 1 && <LanguagePicker onChange={(l) => up({ language: l })} />}

            {step === 2 && (
              <>
                <Input label={t('onboarding.name')} autoComplete="given-name" value={f.name} error={err('name')} onChange={(e) => up({ name: e.target.value })} />
                <DobPicker value={f.dob} onChange={(dob) => up({ dob })} todayIso={todayIso} showError={showErrors} />
                <div className="flex flex-col gap-2">
                  <span className="text-small font-medium text-ink">{t('onboarding.sex')}</span>
                  <div role="radiogroup" className="grid grid-cols-2 gap-2">
                    <Choice selected={f.sex === 'female'} onSelect={() => up({ sex: 'female' })} title={t('onboarding.female')} />
                    <Choice selected={f.sex === 'male'} onSelect={() => up({ sex: 'male' })} title={t('onboarding.male')} />
                  </div>
                  <span className="text-caption text-muted">{t('onboarding.sexHint')}</span>
                </div>
                <MeasureInput kind="height" label={t('onboarding.height')} valueMetric={f.heightCm} unit={f.heightUnit} onUnitChange={(u) => up({ heightUnit: u as HeightUnit })} onChange={(v) => up({ heightCm: v })} error={err('height')} />
                <MeasureInput kind="weight" label={t('onboarding.weight')} valueMetric={f.weightKg} unit={f.weightUnit} onUnitChange={(u) => up({ weightUnit: u as WeightUnit })} onChange={(v) => up({ weightKg: v })} error={err('weight')} />
                {bmiNow !== null && (
                  <p className="rounded-input bg-sage px-3 py-2 text-small text-ink">
                    {t('onboarding.bmi')} {bmiNow} · {t(`onboarding.bmiBand.${bmiBand(bmiNow)}`)}
                  </p>
                )}
              </>
            )}

            {step === 3 && (
              <>
                <GoalPicker selected={f.goals} primary={f.primaryGoal} onChange={(goals, primaryGoal) => up({ goals, primaryGoal })} bmi={bmiNow} age={age} activity={f.activity} />
                {err('goals') && <p role="alert" className="text-small text-danger">{err('goals')}</p>}
                <MeasureInput kind="weight" label={t('onboarding.targetWeight')} valueMetric={f.targetWeightKg === '' ? f.weightKg : f.targetWeightKg} unit={f.weightUnit} onUnitChange={(u) => up({ weightUnit: u as WeightUnit })} onChange={(v) => up({ targetWeightKg: v })} error={err('targetWeight')} />
                <h2 className="pt-1 text-title text-ink">{t('onboarding.activityTitle')}</h2>
                <div role="radiogroup" className="flex flex-col gap-2">
                  {ACTIVITIES.map((a) => (
                    <Choice key={a} selected={f.activity === a} onSelect={() => up({ activity: a })} title={t(`activity.${a}`)} description={t(`activity.${a}Hint`)} />
                  ))}
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <Select label={t('onboarding.diet')} value={f.dietType} onChange={(e) => up({ dietType: e.target.value as (typeof DIETS)[number] })}>
                  {DIETS.map((d) => (
                    <option key={d} value={d}>
                      {t(`diet.${d}`)}
                    </option>
                  ))}
                </Select>
                <AllergyField values={f.allergies} onChange={(allergies) => up({ allergies })} />
                <RestrictionField values={f.restrictions} onChange={(restrictions) => up({ restrictions })} />
              </>
            )}

            {step === 5 && (
              <>
                <Choice multi selected={!f.fixedHours} onSelect={() => up({ fixedHours: !f.fixedHours })} title={t('onboarding.noFixedHours')} />
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
                <Select label={t('onboarding.equipment')} value={f.equipment} onChange={(e) => up({ equipment: e.target.value as UserProfile['equipment'] })}>
                  {(['none', 'home_basic', 'gym'] as const).map((x) => (
                    <option key={x} value={x}>
                      {t(`equipment.${x}`)}
                    </option>
                  ))}
                </Select>
                <Select label={t('onboarding.experience')} value={f.experience} onChange={(e) => up({ experience: e.target.value as UserProfile['experience'] })}>
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
                <CountryField value={f.country} onChange={changeCountry} />
                <RegionField country={f.country} value={f.region} onChange={(region) => up({ region })} />
                <Input label={`${t('location.city')} (${t('common.optional')})`} autoComplete="address-level2" value={f.city} maxLength={80} onChange={(e) => up({ city: e.target.value })} />
                <div className="flex flex-col gap-2">
                  <span className="text-small font-medium text-ink">{t('onboarding.coach')}</span>
                  <Choice selected={f.coach === 'jai'} onSelect={() => up({ coach: 'jai' })} title={t('coach.jai')} description={t('onboarding.coachJai')} />
                  <Choice selected={f.coach === 'jaya'} onSelect={() => up({ coach: 'jaya' })} title={t('coach.jaya')} description={t('onboarding.coachJaya')} />
                </div>
                <div className="flex flex-col gap-2 border-t border-line pt-4">
                  <span className="text-small font-medium text-ink">{t('onboarding.consentTitle')}</span>
                  <Choice multi selected={f.consent} onSelect={() => up({ consent: !f.consent })} title={t('onboarding.consentHealth')} />
                  {err('consent') && <p role="alert" className="text-caption text-danger">{err('consent')}</p>}
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
                  {f.primaryGoal && <p className="text-caption text-muted">{t('goalPicker.basedOn', { goal: t(`goals.${f.primaryGoal}`) })}</p>}
                </div>
                <dl className="grid grid-cols-2 gap-2">
                  {(
                    [
                      ['protein', `${targets.proteinG} ${t('common.g')}`],
                      ['carbs', `${targets.carbsG} ${t('common.g')}`],
                      ['fat', `${targets.fatG} ${t('common.g')}`],
                      ['fiber', `${targets.fiberG} ${t('common.g')}`],
                      ['water', formatVolumePref(targets.waterMl, defaultUnitPrefs(f.country).volume, i18n.language)],
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
                <Button id="onboarding-next" onClick={next} aria-disabled={!valid} className={!valid ? 'opacity-60' : undefined}>
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
    </div>
  );
}
