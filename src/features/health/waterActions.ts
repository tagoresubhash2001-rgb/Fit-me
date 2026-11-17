import type { TFunction } from 'i18next';
import { createRecord, softDelete } from '../../data/records';
import { toast, haptic } from '../../components/ui';

/** Adds a water entry and shows an undo toast. `vol` formats millilitres in the user's unit. */
export async function addWater(ml: number, t: TFunction, vol: (ml: number) => string) {
  haptic();
  const id = await createRecord('waterLogs', { ml: Math.round(ml) });
  toast(t('water.addedToast', { amount: vol(ml) }), 'success', { label: t('common.undo'), onClick: () => void softDelete('waterLogs', id) });
}
