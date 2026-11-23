import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { Badge, Button, Card, EmptyState, PageHeader, Sheet, Skeleton, Tabs, toast } from '../../components/ui';
import { db, storage } from '../../lib/firebase';
import { call, errorCode, fmtDate } from './api';
import { Field, inputCls } from './ui';

type Status = 'pending' | 'approved' | 'rejected' | 'changes_requested' | 'withdrawn' | 'unpublished';
interface T {
  id: string;
  uid: string;
  status: Status;
  displayName: string;
  testimonial: string;
  experience: string;
  journey?: string;
  details?: Record<string, unknown>;
  beforePath: string | null;
  afterPath: string | null;
  adminNote?: string | null;
  consent: boolean;
  updatedAt?: { toMillis(): number };
}

function PrivatePhoto({ path, label }: { path: string | null; label: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!path) return;
    let live = true;
    void (async () => {
      const { ref, getDownloadURL } = await import('firebase/storage');
      const u = await getDownloadURL(ref(await storage(), path)).catch(() => null);
      if (live) setUrl(u);
    })();
    return () => {
      live = false;
    };
  }, [path]);
  if (!path) return null;
  return (
    <figure className="flex min-w-0 flex-1 flex-col gap-1">
      {url ? <img src={url} alt={label} className="aspect-[3/4] w-full rounded-input object-cover" /> : <Skeleton className="aspect-[3/4] w-full" />}
      <figcaption className="text-caption text-muted">{label}</figcaption>
    </figure>
  );
}

function Review({ item, onClose }: { item: T; onClose: () => void }) {
  const { t } = useTranslation();
  const [note, setNote] = useState(item.adminNote ?? '');
  const [name, setName] = useState(item.displayName);
  const [quote, setQuote] = useState(item.testimonial);
  const [featured, setFeatured] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const decide = async (decision: 'approve' | 'reject' | 'request_changes' | 'unpublish') => {
    setBusy(decision);
    try {
      const edits = decision === 'approve' ? { ...(name !== item.displayName ? { displayName: name } : {}), ...(quote !== item.testimonial ? { testimonial: quote } : {}) } : undefined;
      await call('reviewTestimonial', { id: item.id, decision, note: note.trim() || undefined, edits: edits && Object.keys(edits).length ? edits : undefined, featured });
      toast(t(`admin.testimonials.done.${decision}`), 'success');
      onClose();
    } catch (e) {
      toast(errorCode(e), 'error');
    } finally {
      setBusy(null);
    }
  };
  const area = 'w-full rounded-input border border-line bg-surface px-3 py-2 text-body text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';
  const reviewable = ['pending', 'approved', 'unpublished'].includes(item.status);
  return (
    <Sheet mobileFull size="lg" className="admin-touch" open onClose={onClose} closeLabel={t('common.close')} title={t('admin.testimonials.review')}>
      <div className="flex flex-col gap-4" id="admin-review">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{t(`stories.status.${item.status}`)}</Badge>
          <Badge tone={item.consent ? 'primary' : 'accent'}>{item.consent ? t('admin.testimonials.consentYes') : t('admin.testimonials.consentNo')}</Badge>
        </div>
        <div className="flex gap-2">
          <PrivatePhoto path={item.beforePath} label={t('stories.before')} />
          <PrivatePhoto path={item.afterPath} label={t('stories.after')} />
        </div>
        <Field label={t('stories.displayName')}>
          <input className={inputCls} value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label={t('stories.fields.testimonial')}>
          <textarea rows={3} className={area} value={quote} maxLength={600} onChange={(e) => setQuote(e.target.value)} />
        </Field>
        <div>
          <p className="text-small font-medium text-ink">{t('stories.fields.experience')}</p>
          <p className="text-small whitespace-pre-line text-ink">{item.experience}</p>
        </div>
        {item.journey && (
          <div>
            <p className="text-small font-medium text-ink">{t('stories.fields.journey')}</p>
            <p className="text-small whitespace-pre-line text-ink">{item.journey}</p>
          </div>
        )}
        {item.details && Object.keys(item.details).length > 0 && <pre className="rounded-input bg-raised p-2 text-caption whitespace-pre-wrap text-ink">{JSON.stringify(item.details, null, 2)}</pre>}
        <Field label={t('admin.testimonials.note')} hint={t('admin.testimonials.noteHint')}>
          <textarea rows={3} className={area} value={note} maxLength={1000} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <label className="flex items-center gap-3 text-small text-ink">
          <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="h-5 w-5 accent-[var(--primary)]" />
          {t('admin.testimonials.featured')}
        </label>
        {reviewable ? (
          <div className="flex flex-wrap gap-2">
            <Button id="t-approve" loading={busy === 'approve'} disabled={!item.consent} onClick={() => void decide('approve')}>
              {item.status === 'approved' ? t('admin.testimonials.saveEdits') : t('admin.testimonials.approve')}
            </Button>
            <Button id="t-changes" variant="secondary" loading={busy === 'request_changes'} disabled={!note.trim()} onClick={() => void decide('request_changes')}>
              {t('admin.testimonials.requestChanges')}
            </Button>
            <Button id="t-reject" variant="destructive" loading={busy === 'reject'} onClick={() => void decide('reject')}>
              {t('admin.testimonials.reject')}
            </Button>
            {item.status === 'approved' && (
              <Button id="t-unpublish" variant="ghost" loading={busy === 'unpublish'} onClick={() => void decide('unpublish')}>
                {t('admin.testimonials.unpublish')}
              </Button>
            )}
          </div>
        ) : (
          <p className="text-small text-muted">{t('admin.testimonials.notReviewable')}</p>
        )}
      </div>
    </Sheet>
  );
}

const STATUSES = ['pending', 'changes_requested', 'approved', 'rejected', 'all'] as const;

export default function TestimonialsPage() {
  const { t, i18n } = useTranslation();
  const [status, setStatus] = useState<Status | 'all'>('pending');
  const [rows, setRows] = useState<T[] | null>(null);
  const [open, setOpen] = useState<T | null>(null);
  useEffect(() => {
    setRows(null);
    const base = collection(db(), 'testimonials');
    const q = status === 'all' ? query(base, orderBy('updatedAt', 'desc'), limit(100)) : query(base, where('status', '==', status), orderBy('updatedAt', 'desc'), limit(100));
    return onSnapshot(
      q,
      (s) => setRows(s.docs.map((d) => d.data() as T)),
      () => setRows([]),
    );
  }, [status]);
  return (
    <div className="flex flex-col gap-4" id="admin-testimonials">
      <PageHeader title={t('admin.nav.testimonials')} />
      {/* Five statuses do not fit side by side on a phone: a select there, tabs from 768 px. */}
      <div className="hidden md:block">
        <Tabs value={status} onChange={setStatus} items={STATUSES.map((s) => ({ id: s, label: s === 'all' ? t('admin.logs.all') : t(`stories.status.${s}`) }))} />
      </div>
      <select aria-label={t('admin.finance.status')} className={`${inputCls} md:hidden`} value={status} onChange={(e) => setStatus(e.target.value as typeof status)} id="testimonial-status">
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s === 'all' ? t('admin.logs.all') : t(`stories.status.${s}`)}
          </option>
        ))}
      </select>
      {!rows ? (
        <Skeleton className="h-40" />
      ) : !rows.length ? (
        <EmptyState title={t('admin.testimonials.empty')} />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {rows.map((r) => (
            <Card key={r.id} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <p className="min-w-0 flex-1 truncate text-body font-semibold text-ink">{r.displayName}</p>
                <Badge>{t(`stories.status.${r.status}`)}</Badge>
              </div>
              <p className="line-clamp-3 text-small text-ink">{r.testimonial}</p>
              <p className="text-caption text-muted">{fmtDate(r.updatedAt?.toMillis?.() ?? null, i18n.language)}</p>
              <div>
                <Button size="sm" variant="secondary" onClick={() => setOpen(r)}>
                  {t('admin.testimonials.review')}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      {open && <Review item={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
