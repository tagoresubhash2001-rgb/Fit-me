import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card, CardHeader, PageHeader, Skeleton, toast } from '../../components/ui';
import { FEATURE_TIERS, GATED_FEATURES, type AccessPolicy, type FeatureOverride, type GatedFeature, type Tier } from '../../domain/policy';
import { act, errorCode, useAction } from './api';
import { Confirm, Field, inputCls, Table, Td } from './ui';
import { PlansCard } from './PricingPage';

const parseCountries = (v: string) => v.toUpperCase().split(/[^A-Z]+/).filter((c) => c.length === 2);

/** Free Launch Mode: every feature free for everyone, or only in chosen countries. Plans and prices stay. */
function FreeLaunchCard({ policy, onSaved }: { policy: AccessPolicy; onSaved: () => void }) {
  const { t } = useTranslation();
  const [countries, setCountries] = useState(policy.freeLaunch.countries.join(', '));
  const [confirm, setConfirm] = useState<boolean | null>(null);
  const on = policy.freeLaunch.enabled;
  return (
    <Card className="flex flex-col gap-4" id="free-launch">
      <CardHeader title={t('admin.plans.freeLaunchTitle')} subtitle={t('admin.plans.freeLaunchBody')} />
      <div className="flex flex-wrap items-center gap-3">
        <Badge tone={on ? 'primary' : 'neutral'}>{on ? t('admin.plans.freeLaunchOn') : t('admin.plans.freeLaunchOff')}</Badge>
        {on && <span className="text-small text-muted">{policy.freeLaunch.countries.length ? policy.freeLaunch.countries.join(', ') : t('admin.plans.allCountries')}</span>}
      </div>
      <Field label={t('admin.plans.countriesOptional')} hint={t('admin.plans.countriesHint')}>
        <input className={inputCls} value={countries} onChange={(e) => setCountries(e.target.value)} placeholder="IN, US" id="free-launch-countries" />
      </Field>
      <div className="flex flex-wrap gap-2">
        <Button id="free-launch-on" onClick={() => setConfirm(true)}>
          {on ? t('admin.plans.freeLaunchUpdate') : t('admin.plans.freeLaunchTurnOn')}
        </Button>
        {on && (
          <Button id="free-launch-off" variant="secondary" onClick={() => setConfirm(false)}>
            {t('admin.plans.freeLaunchTurnOff')}
          </Button>
        )}
      </div>
      <Confirm
        open={confirm !== null}
        title={confirm ? t('admin.plans.freeLaunchConfirmOn') : t('admin.plans.freeLaunchConfirmOff')}
        body={confirm ? t('admin.plans.freeLaunchConfirmOnBody') : t('admin.plans.freeLaunchConfirmOffBody')}
        confirmLabel={t('admin.save')}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          try {
            const r = await act<{ version: number }>('policy.freeLaunch', { enabled: !!confirm, countries: parseCountries(countries) });
            toast(t('admin.savedVersion', { version: r.version }), 'success');
            onSaved();
          } catch (e) {
            toast(errorCode(e), 'error');
          }
        }}
      />
    </Card>
  );
}

/** Which tier each feature needs, globally and per country (e.g. photo scan free in India). */
function FeatureTiersCard({ policy, onSaved }: { policy: AccessPolicy; onSaved: () => void }) {
  const { t } = useTranslation();
  const [rows, setRows] = useState<FeatureOverride[]>(policy.overrides);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<{ feature: GatedFeature; tier: Tier; countries: string }>({ feature: 'foodPhotoScan', tier: 'free', countries: '' });
  const tierLabel = (x: Tier) => t(`plans.${x}`);
  return (
    <Card className="flex flex-col gap-4" id="feature-tiers">
      <CardHeader title={t('admin.plans.tiersTitle')} subtitle={t('admin.plans.tiersBody')} />
      <Table head={[t('admin.plans.feature'), t('admin.plans.defaultTier'), t('admin.plans.overrides')]} label={t('admin.plans.tiersTitle')}>
        {GATED_FEATURES.map((f) => (
          <tr key={f}>
            <Td>{t(`admin.plans.features.${f}`)}</Td>
            <Td>{tierLabel(FEATURE_TIERS[f])}</Td>
            <Td>
              <div className="flex flex-wrap gap-1.5">
                {rows
                  .map((o, i) => ({ o, i }))
                  .filter(({ o }) => o.feature === f)
                  .map(({ o, i }) => (
                    <button key={i} type="button" className="rounded-full border border-line px-2 py-0.5 text-caption text-ink hover:bg-raised" onClick={() => setRows(rows.filter((_, j) => j !== i))} aria-label={t('admin.plans.removeOverride')}>
                      {tierLabel(o.tier)} · {o.countries.length ? o.countries.join(', ') : t('admin.plans.allCountries')} ×
                    </button>
                  ))}
              </div>
            </Td>
          </tr>
        ))}
      </Table>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
        <Field label={t('admin.plans.feature')}>
          <select className={inputCls} value={draft.feature} onChange={(e) => setDraft({ ...draft, feature: e.target.value as GatedFeature })} id="override-feature">
            {GATED_FEATURES.map((f) => (
              <option key={f} value={f}>
                {t(`admin.plans.features.${f}`)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('admin.plans.tier')}>
          <select className={inputCls} value={draft.tier} onChange={(e) => setDraft({ ...draft, tier: e.target.value as Tier })} id="override-tier">
            {(['free', 'premium', 'pro'] as const).map((x) => (
              <option key={x} value={x}>
                {tierLabel(x)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('admin.plans.countriesOptional')}>
          <input className={inputCls} value={draft.countries} onChange={(e) => setDraft({ ...draft, countries: e.target.value })} placeholder="IN" id="override-countries" />
        </Field>
        <Button variant="secondary" className="self-end" id="override-add" onClick={() => setRows([...rows, { feature: draft.feature, tier: draft.tier, countries: parseCountries(draft.countries) }])}>
          {t('admin.plans.addOverride')}
        </Button>
      </div>
      <div>
        <Button
          id="save-tiers"
          loading={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const r = await act<{ version: number }>('policy.overrides', { overrides: rows });
              toast(t('admin.savedVersion', { version: r.version }), 'success');
              onSaved();
            } catch (e) {
              toast(errorCode(e), 'error');
            } finally {
              setBusy(false);
            }
          }}
        >
          {t('admin.save')}
        </Button>
      </div>
    </Card>
  );
}

export default function PlansAccessPage() {
  const { t } = useTranslation();
  const p = useAction<AccessPolicy>('policy.get', {});
  const [key, setKey] = useState(0);
  useEffect(() => {
    setKey((k) => k + 1);
  }, [p.data]);
  return (
    <div className="flex flex-col gap-4" id="admin-plans">
      <PageHeader title={t('admin.nav.plans')} />
      {!p.data ? (
        p.error ? <p className="text-small text-danger-text">{p.error}</p> : <Skeleton className="h-48" />
      ) : (
        <React.Fragment key={key}>
          <FreeLaunchCard policy={p.data} onSaved={p.reload} />
          <FeatureTiersCard policy={p.data} onSaved={p.reload} />
        </React.Fragment>
      )}
      <PlansCard />
    </div>
  );
}
