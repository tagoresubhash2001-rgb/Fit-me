import type { TFunction } from 'i18next';
import { createRecord, softDelete } from '../../data/records';
import { toast } from '../../components/ui';
import { formatVolume, type UnitSystem } from '../../domain/units';

export async function addWater(ml: number, t: TFunction, lang: string, units: UnitSystem) {
  const id = await createRecord('waterLogs', { ml: Math.round(ml) });
  toast(t('water.addedToast', { amount: formatVolume(ml, units, lang) }), 'success', {
    label: t('common.undo'),
    onClick: () => void softDelete('waterLogs', id),
  });
}
