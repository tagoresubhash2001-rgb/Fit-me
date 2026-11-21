import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, doc, getDocs, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { ImagePlus, Quote, X } from 'lucide-react';
import { Avatar, Badge, Button, Card, EmptyState, Input, PageHeader, Skeleton, Tabs, toast } from '../../components/ui';
import { db, functions, storage } from '../../lib/firebase';
import { useSession } from '../../data/session';
import { useContent } from '../../data/appConfig';
import { localized } from '../../domain/appConfig';
import { ImageInputError, prepareImage } from '../../lib/image';

type Status = 'pending' | 'approved' | 'rejected' | 'changes_requested' | 'withdrawn' | 'unpublished';
interface Details {
  durationWeeks?: number;
  weightChangeKg?: number;
  goal?: string;
  age?: number;
  location?: string;
}
interface Mine {
  id: string;
  status: Status;
  displayName: string;
  testimonial: string;
  experience: string;
  journey?: string;
  details?: Details;
  beforePath: string | null;
  afterPath: string | null;
  adminNote?: string | null;
}
interface Published {
  id: string;
  displayName: string;
  testimonial: string;
  experience: string;
  journey?: string;
  details?: Details;
  userPhotoURL?: string | null;
  beforeURL?: string | null;
  afterURL?: string | null;
}

/** Download URL for a Storage path the rules let this user read (public copies, or their own photos). */
function useStorageUrl(path: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    setUrl(null);
    if (!path) return;
    void (async () => {
      const { ref, getDownloadURL } = await import('firebase/storage');
      const u = await getDownloadURL(ref(await storage(), path)).catch(() => null);
      if (live) setUrl(u);
    })();
    return () => {
      live = false;
    };
  }, [path]);
  return url;
}

function Photo({ path, label }: { path?: string | null; label: string }) {
  const url = useStorageUrl(path);
  if (!path) return null;
  return (
    <figure className="flex min-w-0 flex-1 flex-col gap-1">
      {url ? <img src={url} alt={label} loading="lazy" className="aspect-[3/4] w-full rounded-input object-cover" /> : <Skeleton className="aspect-[3/4] w-full" />}
      <figcaption className="text-caption text-muted">{label}</figcaption>
    </figure>
  );
}

function DetailChips({ d }: { d?: Details }) {
  const { t } = useTranslation();
  if (!d) return null;
  const chips = [
    d.durationWeeks ? t('stories.weeks', { count: d.durationWeeks }) : null,
    d.weightChangeKg ? t('stories.kgChange', { kg: d.weightChangeKg > 0 ? `+${d.weightChangeKg}` : d.weightChangeKg }) : null,
    d.goal || null,
    d.age ? t('stories.age', { age: d.age }) : null,
    d.location || null,
  ].filter(Boolean) as string[];
  if (!chips.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((c) => (
        <Badge key={c}>{c}</Badge>
      ))}
    </div>
  );
}

function StoryCard({ s }: { s: Published }) {
  const { t } = useTranslation();
  const [more, setMore] = useState(false);
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Avatar name={s.displayName} photoURL={s.userPhotoURL} size={44} />
        <p className="min-w-0 flex-1 truncate text-body font-semibold text-ink">{s.displayName}</p>
      </div>
      {(s.beforeURL || s.afterURL) && (
        <div className="flex gap-2">
          <Photo path={s.beforeURL} label={t('stories.before')} />
          <Photo path={s.afterURL} label={t('stories.after')} />
        </div>
      )}
      <blockquote className="flex gap-2 text-body text-ink">
        <Quote className="mt-1 h-4 w-4 shrink-0 text-primary-text" strokeWidth={2} aria-hidden />
        <span>{s.testimonial}</span>
      </blockquote>
      <DetailChips d={s.details} />
      {more && (
        <div className="flex flex-col gap-2 text-small text-ink">
          <p className="whitespace-pre-line">{s.experience}</p>
          {s.journey && <p className="whitespace-pre-line text-muted">{s.journey}</p>}
        </div>
      )}
      <button type="button" aria-expanded={more} onClick={() => setMore((m) => !m)} className="self-start text-small font-semibold text-primary-text hover:underline">
        {more ? t('stories.less') : t('stories.more')}
      </button>
    </Card>
  );
}

function Stories() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<Published[] | null>(null);
  useEffect(() => {
    getDocs(query(collection(db(), 'publicTestimonials'), orderBy('featured', 'desc'), orderBy('approvedAt', 'desc'), limit(50)))
      .then((s) => setRows(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Published, 'id'>) }))))
      .catch(() => setRows([]));
  }, []);
  if (!rows) return <Skeleton className="h-48" />;
  if (!rows.length) return <EmptyState title={t('stories.emptyTitle')} description={t('stories.emptyBody')} />;
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {rows.map((s) => (
        <StoryCard key={s.id} s={s} />
      ))}
    </div>
  );
}

function PhotoPicker({ label, value, existing, onChange }: { label: string; value: Blob | null; existing: string | null; onChange: (b: Blob | null) => void }) {
  const { t } = useTranslation();
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const existingUrl = useStorageUrl(value ? null : existing);
  useEffect(() => {
    if (!value) return setPreview(null);
    const u = URL.createObjectURL(value);
    setPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [value]);
  const shown = preview ?? existingUrl;
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <span className="text-small font-medium text-ink">{label}</span>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        className="hidden"
        aria-hidden
        tabIndex={-1}
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (!f) return;
          try {
            onChange((await prepareImage(f, { maxSide: 1280, quality: 0.82 })).blob);
          } catch (err) {
            toast(t(err instanceof ImageInputError ? `photo.errors.${err.code}` : 'photo.errors.decode_failed'), 'error');
          }
        }}
      />
      {shown ? (
        <div className="relative">
          <img src={shown} alt={label} className="aspect-[3/4] w-full rounded-input object-cover" />
          {value && (
            <button type="button" aria-label={t('stories.removePhoto', { label })} onClick={() => onChange(null)} className="absolute end-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-surface/90 text-ink shadow-card">
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          )}
        </div>
      ) : (
        <button type="button" onClick={() => input.current?.click()} className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-2 rounded-input border border-dashed border-line bg-raised text-small text-muted hover:text-ink">
          <ImagePlus className="h-6 w-6" strokeWidth={1.5} />
          {t('stories.addPhoto')}
        </button>
      )}
      {shown && (
        <Button size="sm" variant="ghost" onClick={() => input.current?.click()}>
          {t('stories.replacePhoto')}
        </Button>
      )}
    </div>
  );
}

const num = (v: string) => (v.trim() === '' ? undefined : Number(v));

function ShareForm({ editing, onDone }: { editing: Mine | null; onDone: () => void }) {
  const { t } = useTranslation();
  const profile = useSession((s) => s.profile);
  const user = useSession((s) => s.user);
  const [v, setV] = useState(() => ({
    displayName: editing?.displayName ?? profile?.name ?? '',
    testimonial: editing?.testimonial ?? '',
    experience: editing?.experience ?? '',
    journey: editing?.journey ?? '',
    durationWeeks: editing?.details?.durationWeeks?.toString() ?? '',
    weightChangeKg: editing?.details?.weightChangeKg?.toString() ?? '',
    goal: editing?.details?.goal ?? '',
    age: editing?.details?.age?.toString() ?? '',
    location: editing?.details?.location ?? '',
  }));
  const [before, setBefore] = useState<Blob | null>(null);
  const [after, setAfter] = useState<Blob | null>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const up = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV((s) => ({ ...s, [k]: e.target.value }));

  const validate = () => {
    const out: string[] = [];
    if (!v.displayName.trim()) out.push('displayName');
    if (v.testimonial.trim().length < 20) out.push('testimonial');
    if (v.experience.trim().length < 20) out.push('experience');
    for (const k of ['durationWeeks', 'weightChangeKg', 'age'] as const) if (v[k].trim() && !Number.isFinite(Number(v[k]))) out.push(k);
    if (!consent) out.push('consent');
    setErrors(out);
    return out.length === 0;
  };

  const submit = async () => {
    if (!user || !validate()) return;
    setBusy(true);
    try {
      const id = editing?.id ?? doc(collection(db(), 'testimonials')).id;
      const { ref, uploadBytes } = await import('firebase/storage');
      const s = await storage();
      for (const [which, blob] of [
        ['before', before],
        ['after', after],
      ] as const)
        if (blob) await uploadBytes(ref(s, `testimonials/${user.uid}/${id}/${which}.jpg`), blob, { contentType: 'image/jpeg' });
      const details = Object.fromEntries(
        Object.entries({ durationWeeks: num(v.durationWeeks), weightChangeKg: num(v.weightChangeKg), age: num(v.age), goal: v.goal.trim() || undefined, location: v.location.trim() || undefined }).filter(([, x]) => x !== undefined),
      );
      await httpsCallable(functions(), 'submitTestimonial')({
        id,
        displayName: v.displayName.trim(),
        testimonial: v.testimonial.trim(),
        experience: v.experience.trim(),
        journey: v.journey.trim(),
        details,
        hasBefore: !!before || !!editing?.beforePath,
        hasAfter: !!after || !!editing?.afterPath,
        consent: true,
      });
      toast(t('stories.submitted'), 'success');
      onDone();
    } catch (e) {
      const msg = String((e as Error)?.message ?? '');
      toast(t(msg.includes('too_many_open') ? 'stories.errors.tooMany' : msg.includes('invalid') ? 'stories.errors.invalid' : 'stories.errors.failed'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const err = (k: string) => (errors.includes(k) ? t(`stories.errors.${k}`) : undefined);
  const area = 'w-full rounded-input border border-line bg-surface px-3 py-2.5 text-body text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';
  return (
    <Card className="flex flex-col gap-4" id="testimonial-form">
      <p className="rounded-input bg-raised px-3 py-2 text-small text-ink">{t('stories.reviewNotice')}</p>
      {editing?.adminNote && (
        <p className="rounded-input border border-accent px-3 py-2 text-small text-ink">
          <span className="font-semibold">{t('stories.adminFeedback')}</span> {editing.adminNote}
        </p>
      )}
      <Input label={t('stories.displayName')} value={v.displayName} maxLength={60} onChange={up('displayName')} error={err('displayName')} />
      {(['testimonial', 'experience', 'journey'] as const).map((k) => (
        <label key={k} className="flex flex-col gap-1.5">
          <span className="text-small font-medium text-ink">{t(`stories.fields.${k}`)}</span>
          <textarea id={`t-${k}`} rows={k === 'testimonial' ? 3 : 5} maxLength={k === 'testimonial' ? 600 : k === 'experience' ? 1500 : 2000} value={v[k]} onChange={up(k)} placeholder={t(`stories.placeholders.${k}`)} className={area} aria-invalid={!!err(k)} />
          {err(k) && <span className="text-caption text-danger-text">{err(k)}</span>}
        </label>
      ))}
      <fieldset className="grid grid-cols-2 gap-2 md:grid-cols-3">
        <legend className="mb-2 text-small font-medium text-ink">{t('stories.detailsTitle')}</legend>
        <Input label={t('stories.fields.durationWeeks')} inputMode="numeric" value={v.durationWeeks} onChange={up('durationWeeks')} error={err('durationWeeks')} />
        <Input label={t('stories.fields.weightChangeKg')} inputMode="decimal" value={v.weightChangeKg} onChange={up('weightChangeKg')} error={err('weightChangeKg')} />
        <Input label={t('stories.fields.goal')} value={v.goal} maxLength={120} onChange={up('goal')} />
        <Input label={t('stories.fields.age')} inputMode="numeric" value={v.age} onChange={up('age')} error={err('age')} />
        <Input label={t('stories.fields.location')} value={v.location} maxLength={80} onChange={up('location')} />
      </fieldset>
      <div className="flex gap-3">
        <PhotoPicker label={t('stories.before')} value={before} existing={editing?.beforePath ?? null} onChange={setBefore} />
        <PhotoPicker label={t('stories.after')} value={after} existing={editing?.afterPath ?? null} onChange={setAfter} />
      </div>
      <label className="flex items-start gap-3 text-small text-ink">
        <input id="t-consent" type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--primary)]" />
        <span>{t('stories.consent')}</span>
      </label>
      {err('consent') && <p className="text-caption text-danger-text">{err('consent')}</p>}
      <div className="flex flex-wrap gap-2">
        <Button id="t-submit" loading={busy} onClick={() => void submit()}>
          {editing ? t('stories.resubmit') : t('stories.submit')}
        </Button>
        {editing && (
          <Button variant="ghost" onClick={onDone}>
            {t('common.cancel')}
          </Button>
        )}
      </div>
    </Card>
  );
}

function MySubmissions({ onEdit }: { onEdit: (m: Mine) => void }) {
  const { t } = useTranslation();
  const uid = useSession((s) => s.user?.uid);
  const [rows, setRows] = useState<Mine[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  useEffect(() => {
    if (!uid) return;
    return onSnapshot(
      query(collection(db(), 'testimonials'), where('uid', '==', uid), orderBy('updatedAt', 'desc'), limit(20)),
      (s) => setRows(s.docs.map((d) => d.data() as Mine)),
      () => setRows([]),
    );
  }, [uid]);
  if (!rows) return <Skeleton className="h-20" />;
  if (!rows.length) return null;
  return (
    <Card className="flex flex-col gap-3" id="my-testimonials">
      <h2 className="text-body font-semibold text-ink">{t('stories.mine')}</h2>
      <ul className="flex flex-col divide-y divide-line">
        {rows.map((m) => (
          <li key={m.id} className="flex flex-col gap-2 py-3">
            <div className="flex items-center gap-2">
              <p className="min-w-0 flex-1 truncate text-body text-ink">{m.testimonial}</p>
              <Badge tone={m.status === 'approved' ? 'primary' : m.status === 'changes_requested' ? 'accent' : 'neutral'}>{t(`stories.status.${m.status}`)}</Badge>
            </div>
            {m.adminNote && (
              <p className="text-small text-muted">
                {t('stories.adminFeedback')} {m.adminNote}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {(m.status === 'changes_requested' || m.status === 'pending') && (
                <Button size="sm" variant="secondary" onClick={() => onEdit(m)}>
                  {t('stories.edit')}
                </Button>
              )}
              {m.status !== 'withdrawn' && m.status !== 'rejected' && (
                <Button
                  size="sm"
                  variant="ghost"
                  loading={busy === m.id}
                  onClick={() => {
                    setBusy(m.id);
                    httpsCallable(functions(), 'withdrawTestimonial')({ id: m.id })
                      .then(() => toast(t('stories.withdrawn')))
                      .catch(() => toast(t('stories.errors.failed'), 'error'))
                      .finally(() => setBusy(null));
                  }}
                >
                  {t('stories.withdraw')}
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default function TestimonialsScreen() {
  const { t, i18n } = useTranslation();
  const content = useContent();
  const [tab, setTab] = useState<'stories' | 'share'>('stories');
  const [editing, setEditing] = useState<Mine | null>(null);
  const [formKey, setFormKey] = useState(0);
  const title = localized(content.testimonialsTitle, i18n.language) ?? t('stories.title');
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={title} />
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { id: 'stories', label: t('stories.tabStories') },
          { id: 'share', label: t('stories.tabShare') },
        ]}
      />
      {tab === 'stories' ? (
        content.testimonialsVisible ? (
          <Stories />
        ) : (
          <EmptyState title={t('stories.hiddenTitle')} />
        )
      ) : (
        <>
          <ShareForm
            key={`${editing?.id ?? 'new'}-${formKey}`}
            editing={editing}
            onDone={() => {
              setEditing(null);
              setFormKey((k) => k + 1);
            }}
          />
          <MySubmissions
            onEdit={(m) => {
              setEditing(m);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </>
      )}
    </div>
  );
}
