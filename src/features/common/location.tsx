import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Combobox, Flag, Input, type ComboOption } from '../../components/ui';
import { COUNTRIES } from '../../domain/countries';

type Regions = Record<string, Array<[string, string]>>;
let regionsCache: Regions | null = null;
/** ISO 3166-2 regions, loaded on demand (separate chunk). */
export async function loadRegions(): Promise<Regions> {
  if (!regionsCache) regionsCache = (await import('../../data/regions.json')).default as unknown as Regions;
  return regionsCache;
}

export function countryName(code: string, language: string): string {
  try {
    return new Intl.DisplayNames([language], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}

export function CountryField({ value, onChange, error }: { value: string; onChange: (code: string) => void; error?: string }) {
  const { t, i18n } = useTranslation();
  const options: ComboOption[] = useMemo(
    () =>
      COUNTRIES.map((c) => ({ value: c, label: countryName(c, i18n.language), icon: <Flag code={c} />, keywords: `${countryName(c, 'en')} ${c}` })).sort((a, b) => a.label.localeCompare(b.label, i18n.language)),
    [i18n.language],
  );
  return (
    <Combobox
      id="country"
      label={t('location.country')}
      value={value}
      options={options}
      onChange={onChange}
      searchPlaceholder={t('location.searchCountry')}
      emptyText={t('location.noMatch')}
      error={error}
    />
  );
}

export function RegionField({ country, value, onChange }: { country: string; value: { name: string; code: string } | null; onChange: (v: { name: string; code: string } | null) => void }) {
  const { t } = useTranslation();
  const [regions, setRegions] = useState<Array<[string, string]> | null>(null);
  useEffect(() => {
    let alive = true;
    setRegions(null);
    void loadRegions().then((r) => alive && setRegions(r[country] ?? []));
    return () => {
      alive = false;
    };
  }, [country]);
  if (regions === null) return <Input label={t('location.region')} disabled value={t('common.loading')} readOnly />;
  if (!regions.length) {
    return <Input label={`${t('location.region')} (${t('common.optional')})`} value={value?.name ?? ''} onChange={(e) => onChange(e.target.value ? { name: e.target.value, code: '' } : null)} />;
  }
  return (
    <Combobox
      id="region"
      label={`${t('location.region')} (${t('common.optional')})`}
      value={value?.code ? `${value.code}` : (value?.name ?? null)}
      options={regions.map(([name, code]) => ({ value: code, label: name }))}
      onChange={(code) => {
        const r = regions.find(([, c]) => c === code);
        onChange(r ? { name: r[0], code: r[1] } : { name: code, code: '' });
      }}
      placeholder={t('location.chooseRegion')}
      searchPlaceholder={t('location.searchRegion')}
      emptyText={t('location.noMatch')}
      allowCustom
      addCustomLabel={(q) => t('location.useTyped', { value: q })}
    />
  );
}
