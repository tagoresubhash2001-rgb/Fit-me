import { useEffect } from 'react';
import { create } from 'zustand';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DEFAULT_PRICING, PricingConfig } from '../domain/billing';

/**
 * Live pricing from appConfig/pricing (server-write only). Until the document loads (or if it is missing
 * or invalid) the shared seed values are used, so the Plans screen never shows an empty price.
 */
const usePricingStore = create<{ config: PricingConfig; live: boolean; started: boolean }>(() => ({ config: DEFAULT_PRICING, live: false, started: false }));

export function usePricing() {
  useEffect(() => {
    if (usePricingStore.getState().started) return;
    usePricingStore.setState({ started: true });
    return onSnapshot(
      doc(db(), 'appConfig/pricing'),
      (snap) => {
        const parsed = snap.exists() ? PricingConfig.safeParse(snap.data()) : null;
        if (parsed?.success) usePricingStore.setState({ config: parsed.data, live: true });
      },
      () => undefined,
    );
  }, []);
  return usePricingStore((s) => s.config);
}
