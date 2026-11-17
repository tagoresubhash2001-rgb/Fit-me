import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { doc, onSnapshot, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { ShoppingBag, BellRing, Check } from 'lucide-react';
import { Button, Card, EmptyState, Skeleton, toast } from '../../components/ui';
import { db } from '../../lib/firebase';
import { useSession } from '../../data/session';

/** Store "Coming soon" with a "Notify me" waitlist (PRD section 10). No products are shown at launch. */
export default function StoreScreen() {
  const { t } = useTranslation();
  const user = useSession((s) => s.user)!;
  const profile = useSession((s) => s.profile)!;
  const [joined, setJoined] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(
    () =>
      onSnapshot(
        doc(db(), `storeWaitlist/${user.uid}`),
        (s) => setJoined(s.exists()),
        () => setJoined(false),
      ),
    [user.uid],
  );

  const toggle = async () => {
    setBusy(true);
    try {
      const ref = doc(db(), `storeWaitlist/${user.uid}`);
      if (joined) await deleteDoc(ref);
      else {
        await setDoc(ref, { uid: user.uid, createdAt: serverTimestamp(), country: profile.country, language: profile.language });
        toast(t('store.notified'));
      }
    } catch {
      toast(t('common.error'), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stagger mx-auto flex w-full max-w-3xl flex-col gap-4">
      <h1 className="text-display text-ink">{t('store.title')}</h1>
      <Card>
        <EmptyState
          icon={<ShoppingBag className="h-6 w-6" strokeWidth={1.75} />}
          title={t('store.comingTitle')}
          description={t('store.comingBody')}
        />
        {joined === null ? (
          <Skeleton className="mx-auto h-12 w-48" />
        ) : joined ? (
          <div className="flex flex-col items-center gap-2">
            <p className="flex items-center gap-2 text-center text-small text-primary">
              <Check className="h-4 w-4" strokeWidth={2} />
              {t('store.notified')}
            </p>
            <Button variant="ghost" size="sm" loading={busy} onClick={() => void toggle()}>
              {t('store.leave')}
            </Button>
          </div>
        ) : (
          <div className="flex justify-center">
            <Button
              id="store-notify"
              loading={busy}
              icon={<BellRing className="h-[18px] w-[18px]" strokeWidth={1.75} />}
              onClick={() => void toggle()}
            >
              {t('store.notify')}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
