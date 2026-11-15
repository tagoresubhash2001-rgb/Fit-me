import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, onSnapshot, orderBy, query, limit } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { Send, Lock } from 'lucide-react';
import { Button, EmptyState, Sheet, Tabs, cn } from '../../components/ui';
import { db, functions } from '../../lib/firebase';
import { useSession } from '../../data/session';
import { planAllows } from '../../domain/plans';

interface Msg {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  status?: string;
}

/**
 * Jai & Jaya chat (Pro). Messages are written by the coachChat Cloud Function and read live from
 * users/{uid}/aiThreads/{coach}/messages. The plan is checked on the server; the lock here is only UI.
 */
export function CoachSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const user = useSession((s) => s.user);
  const profile = useSession((s) => s.profile);
  const plan = useSession((s) => s.plan);
  const [coach, setCoach] = useState<'jai' | 'jaya'>(profile?.coach ?? 'jaya');
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const isPro = planAllows(plan, 'pro');

  useEffect(() => {
    if (!open || !user || !isPro) return;
    const q = query(collection(db(), `users/${user.uid}/aiThreads/${coach}/messages`), orderBy('createdAt'), limit(100));
    return onSnapshot(q, (s) => setMsgs(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Msg, 'id'>) }))));
  }, [open, user, coach, isPro]);
  useEffect(() => endRef.current?.scrollIntoView({ block: 'end' }), [msgs.length, sending]);

  const send = async () => {
    const m = text.trim();
    if (!m) return;
    setSending(true);
    setError(null);
    setText('');
    try {
      await httpsCallable(functions(), 'coachChat')({ threadId: coach, coach, message: m });
    } catch (e) {
      const code = (e as { code?: string }).code;
      setError(code === 'functions/resource-exhausted' ? t('coach.limit') : t('coach.unavailable'));
      setText(m);
    } finally {
      setSending(false);
    }
  };

  const name = t(`coach.${coach}`);
  return (
    <Sheet open={open} onClose={onClose} closeLabel={t('coach.closeChat')} title={t('coach.title')} className="sm:max-w-md">
      <div className="flex min-h-[50dvh] flex-col gap-3">
        <Tabs
          value={coach}
          onChange={setCoach}
          items={[
            { id: 'jai', label: t('coach.jai') },
            { id: 'jaya', label: t('coach.jaya') },
          ]}
        />
        <p className="text-small text-muted">{coach === 'jai' ? t('coach.jaiRole') : t('coach.jayaRole')}</p>
        {!isPro ? (
          <EmptyState
            icon={<Lock className="h-6 w-6" strokeWidth={1.75} />}
            title={t('coach.lockedTitle')}
            description={t('coach.lockedBody')}
            action={<p className="text-caption text-muted">{t('plans.paywallSoon')}</p>}
          />
        ) : (
          <>
            <div className="flex flex-1 flex-col gap-2" aria-live="polite">
              {msgs.length === 0 && !sending && <EmptyState title={t('coach.empty', { name })} />}
              {msgs.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    'max-w-[85%] whitespace-pre-wrap rounded-card px-3.5 py-2.5 text-body',
                    m.role === 'user'
                      ? 'self-end bg-primary text-on-primary'
                      : m.status === 'urgent'
                        ? 'self-start border border-danger/40 bg-danger-subtle text-ink'
                        : 'self-start bg-raised text-ink',
                  )}
                >
                  {m.text}
                </div>
              ))}
              {sending && (
                <div className="self-start rounded-card bg-raised px-3.5 py-2.5 text-small text-muted">{t('coach.thinking')}</div>
              )}
              <div ref={endRef} />
            </div>
            {error && (
              <p role="alert" className="text-small text-danger">
                {error}
              </p>
            )}
            <p className="text-caption text-muted">{t('common.disclaimer')}</p>
            <form
              className="sticky bottom-0 flex items-end gap-2 bg-surface pt-1"
              onSubmit={(e) => {
                e.preventDefault();
                void send();
              }}
            >
              <textarea
                rows={1}
                aria-label={t('coach.placeholder')}
                placeholder={t('coach.placeholder')}
                value={text}
                maxLength={2000}
                onChange={(e) => setText(e.target.value)}
                className="min-h-12 flex-1 resize-none rounded-input border border-line bg-surface px-3.5 py-3 text-body text-ink placeholder:text-muted focus:border-primary focus:outline-none"
              />
              <Button
                type="submit"
                aria-label={t('coach.send')}
                loading={sending}
                disabled={!text.trim()}
                icon={<Send className="h-[18px] w-[18px] rtl:-scale-x-100" strokeWidth={1.75} />}
              />
            </form>
          </>
        )}
      </div>
    </Sheet>
  );
}
