import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, CheckCircle2, Loader2, Smartphone, Trash2 } from 'lucide-react';
import { siteDb } from '../website/data';
import { WebsiteLayout } from '../website/WebsiteLayout';
import { Container, Reveal } from '../website/ui';
import { list } from '../website/i18n';
import { Field, emailValid, fieldCls } from '../website/form';

/** Public account deletion page (Google Play requirement): in-app steps, or a request -> deletion_requests. */
export default function DeleteAccountPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [sentFor, setSentFor] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!emailValid(email)) return setError(t('site.legal.delete.invalid'));
    setStatus('sending');
    try {
      const { db, fs } = await siteDb();
      await fs.addDoc(fs.collection(db, 'deletion_requests'), { email: email.trim().toLowerCase(), reason: reason.trim().slice(0, 1000), requestedAt: fs.serverTimestamp(), status: 'pending' });
      setSentFor(email.trim().toLowerCase());
      setStatus('done');
    } catch {
      setStatus('idle');
      setError(t('site.legal.delete.error'));
    }
  };

  return (
    <WebsiteLayout metaKey="deleteAccount" path="/delete-account">
      <section className="site-mesh -mt-20 pt-32 pb-8 sm:-mt-24 sm:pt-40">
        <Container className="flex max-w-3xl flex-col gap-3">
          <h1 className="text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">{t('site.legal.delete.title')}</h1>
          <p className="text-lg text-muted">{t('site.legal.delete.intro')}</p>
        </Container>
      </section>
      <Container className="grid max-w-3xl gap-4 py-8">
        <Reveal as="section" className="rounded-3xl border border-line bg-surface p-6 shadow-soft sm:p-8">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-ink">
            <Smartphone className="h-5 w-5 text-brand" strokeWidth={1.9} aria-hidden />
            {t('site.legal.delete.inAppTitle')}
          </h2>
          <ol className="flex flex-col gap-3">
            {list<string>(t, 'site.legal.delete.inAppSteps').map((s, i) => (
              <li key={s} className="flex items-start gap-3 text-body text-ink">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-small font-bold text-primary-text">{i + 1}</span>
                <span className="pt-0.5">{s}</span>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-small text-muted">{t('site.legal.delete.inAppNote')}</p>
        </Reveal>
        <Reveal as="section" delay={0.06} className="rounded-3xl border border-line bg-surface p-6 shadow-soft sm:p-8">
          <h2 className="mb-2 flex items-center gap-2 text-xl font-bold text-ink">
            <Trash2 className="h-5 w-5 text-danger-text" strokeWidth={1.9} aria-hidden />
            {t('site.legal.delete.requestTitle')}
          </h2>
          {status === 'done' ? (
            <div role="status" id="delete-done" className="flex items-start gap-3 rounded-2xl bg-primary-subtle p-4">
              <CheckCircle2 className="h-6 w-6 shrink-0 text-primary-text" strokeWidth={1.9} aria-hidden />
              <div>
                <p className="font-semibold text-ink">{t('site.legal.delete.doneTitle')}</p>
                <p className="text-small text-muted">{t('site.legal.delete.doneBody', { email: sentFor })}</p>
              </div>
            </div>
          ) : (
            <form noValidate onSubmit={submit} className="flex flex-col gap-4">
              <p className="text-body text-muted">{t('site.legal.delete.requestBody')}</p>
              <Field id="delete-email" label={t('site.legal.delete.email')}>
                <input id="delete-email" type="email" autoComplete="email" className={fieldCls} value={email} onChange={(e) => setEmail(e.target.value)} required />
              </Field>
              <Field id="delete-reason" label={t('site.legal.delete.reason')}>
                <textarea id="delete-reason" className={`${fieldCls} min-h-24`} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} />
              </Field>
              {error && (
                <p role="alert" className="flex items-start gap-2 rounded-2xl bg-danger-subtle px-4 py-3 text-small text-danger-text">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                  {error}
                </p>
              )}
              <button
                type="submit"
                id="delete-submit"
                disabled={status === 'sending'}
                className="site-press inline-flex min-h-12 items-center justify-center gap-2 self-start rounded-full bg-danger px-6 font-semibold text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-70"
              >
                {status === 'sending' && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
                {status === 'sending' ? t('site.legal.delete.submitting') : t('site.legal.delete.submit')}
              </button>
            </form>
          )}
        </Reveal>
      </Container>
    </WebsiteLayout>
  );
}
