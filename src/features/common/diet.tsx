import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChipInput } from '../../components/ui';
import { COMMON_ALLERGENS, MORE_ALLERGENS, RESTRICTIONS } from '../../domain/allergens';

/** Known ids get translated labels; custom entries show as typed. */
function useLabel(ns: 'allergen' | 'restriction') {
  const { t, i18n } = useTranslation();
  return (v: string) => (i18n.exists(`${ns}.${v}`) ? t(`${ns}.${v}`) : v);
}

export function AllergyField({ values, onChange }: { values: string[]; onChange: (v: string[]) => void }) {
  const { t } = useTranslation();
  const labelFor = useLabel('allergen');
  return (
    <ChipInput
      label={t('diet.allergiesLabel')}
      values={values}
      onChange={onChange}
      suggestions={[...COMMON_ALLERGENS]}
      moreOptions={[...MORE_ALLERGENS]}
      labelFor={labelFor}
      addLabel={t('common.add')}
      inputPlaceholder={t('diet.customAllergy')}
      searchLabel={t('diet.moreAllergens')}
      searchPlaceholder={t('diet.searchAllergens')}
      emptyText={t('location.noMatch')}
      removeLabel={(v) => t('diet.remove', { item: v })}
    />
  );
}

export function RestrictionField({ values, onChange }: { values: string[]; onChange: (v: string[]) => void }) {
  const { t } = useTranslation();
  const labelFor = useLabel('restriction');
  return (
    <ChipInput
      label={t('diet.restrictionsLabel')}
      values={values}
      onChange={onChange}
      suggestions={[...RESTRICTIONS]}
      moreOptions={[]}
      labelFor={labelFor}
      addLabel={t('common.add')}
      inputPlaceholder={t('diet.customRestriction')}
      searchLabel={t('diet.searchRestrictionsLabel')}
      searchPlaceholder={t('diet.searchRestrictions')}
      emptyText={t('location.noMatch')}
      removeLabel={(v) => t('diet.remove', { item: v })}
    />
  );
}
