import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, onSnapshot, orderBy, query, limit } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { Send, Lock, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, EmptyState, IconButton, Sheet, Tabs, cn } from '../../components/ui';
import { COACH_MAX, COACH_MIN, useUi } from '../../stores/ui.store';
import { db, functions } from '../../lib/firebase';
import { useCanUse, useSession } from '../../data/session';

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
/** One conversation, two containers: a sheet on phones and tablets, a docked side panel on desktop. */
function CoachConversation({ open, onClose }: { open: boolean; onClose: () => void }) {
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
  const isPro = useCanUse('coachChat');
  const navigate = useNavigate();

  useEffect(() => {
    if (!open || !user || !isPro) return;
    const q = query(collection(db(), `users/${user.uid}/aiThreads/${coach}/messages`), orderBy('createdAt'), limit(100));
    return onSnapshot(q, (s) => setMsgs(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Msg, 'id'>) }))));
  }, [open, user, coach, isPro]);
  // Braces matter: scrollIntoView returns a Promise in recent browsers, and an effect may only return a cleanup function.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [msgs.length, sending]);

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
    <div className="flex min-h-[50dvh] flex-col gap-3 xl:min-h-full">
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
          action={
            <Button
              onClick={() => {
                onClose();
                navigate('/plans?highlight=pro');
              }}
            >
              {t('plans.seePlans')}
            </Button>
          }
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
            {sending && <div className="self-start rounded-card bg-raised px-3.5 py-2.5 text-small text-muted">{t('coach.thinking')}</div>}
            <div ref={endRef} />
          </div>
          {error && (
            <p role="alert" className="text-small text-danger-text">
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
              onKeyDown={(e) => {
                // Enter sends on keyboards; Shift+Enter adds a new line.
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  if (text.trim() && !sending) void send();
                }
              }}
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
  );
}

export function CoachSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  return (
    <Sheet open={open} onClose={onClose} closeLabel={t('coach.closeChat')} title={t('coach.title')}>
      <CoachConversation open={open} onClose={onClose} />
    </Sheet>
  );
}

/** Desktop: docked, resizable right panel that can stay open while the user moves around the app. */
export function CoachDock() {
  const { t } = useTranslation();
  const open = useUi((s) => s.coachOpen);
  const setOpen = useUi((s) => s.setCoachOpen);
  const width = useUi((s) => s.coachWidth);
  const setWidth = useUi((s) => s.setCoachWidth);
  if (!open) return null;
  const startDrag = (e: React.PointerEvent) => {
    e.preventDefault();
    const rtl = document.documentElement.dir === 'rtl';
    const x0 = e.clientX;
    const w0 = width;
    const move = (ev: PointerEvent) => setWidth(w0 + (rtl ? ev.clientX - x0 : x0 - ev.clientX));
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return (
    <aside
      id="coach-dock"
      aria-label={t('coach.title')}
      style={{ width }}
      className="glass sticky top-0 hidden h-dvh shrink-0 flex-col border-s shadow-float animate-[fade-in_200ms_ease-out] xl:flex"
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          setOpen(false);
          document.getElementById('coach-button')?.focus();
        }
      }}
    >
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label={t('coach.resize')}
        aria-valuemin={COACH_MIN}
        aria-valuemax={COACH_MAX}
        aria-valuenow={width}
        tabIndex={0}
        onPointerDown={startDrag}
        onKeyDown={(e) => {
          const step = e.key === 'ArrowLeft' ? 20 : e.key === 'ArrowRight' ? -20 : 0;
          if (step) setWidth(width + (document.documentElement.dir === 'rtl' ? -step : step));
        }}
        className="absolute inset-y-0 -start-1 z-10 w-2 cursor-col-resize hover:bg-primary/20 focus-visible:bg-primary/30"
      />
      <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-2">
        <h2 className="text-title text-ink">{t('coach.title')}</h2>
        <IconButton label={t('coach.closeChat')} onClick={() => setOpen(false)}>
          <X className="h-5 w-5" strokeWidth={1.75} />
        </IconButton>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-4">
        <CoachConversation open={open} onClose={() => setOpen(false)} />
      </div>
    </aside>
  );
}
