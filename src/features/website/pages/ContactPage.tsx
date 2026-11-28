import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { AlertCircle, CheckCircle2, Loader2, Mail, Send } from 'lucide-react';
import { db } from '../../../lib/firebase';
import { useAppSettings } from '../../../data/appConfig';
import { WebsiteLayout } from '../WebsiteLayout';
import { Container, Reveal } from '../ui';
import { Field, emailValid, fieldCls } from '../form';

const LIMIT_KEY = 'fitme_contact_sent';
const MAX_PER_HOUR = 3;

/** Messages this browser sent in the last hour (a convenience limit; the rules enforce the shape and size). */
function recentSends(): number[] {
  try {
    const list = JSON.parse(sessionStorage.getItem(LIMIT_KEY) ?? '[]') as number[];
    return list.filter((t) => Date.now() - t < 3_600_000);
  } catch {
    return [];
  }
}

/** Website contact form -> contact_messages (public create-only, read in Admin -> Support). */
export function ContactPage() {
  const { t, i18n } = useTranslation();
  const { supportEmail } = useAppSettings();
  const openedAt = useRef(Date.now());
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '', website: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState('');
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    // Bots fill the hidden field: pretend success, save nothing.
    if (form.website.trim()) {
      setSentTo(form.email.trim());
      setStatus('sent');
      return;
    }
    if (!form.name.trim() || !emailValid(form.email) || form.message.trim().length < 10) return setError(t('site.contact.errorRequired'));
    if (Date.now() - openedAt.current < 3000) return setError(t('site.contact.errorTooFast'));
    const sends = recentSends();
    if (sends.length >= MAX_PER_HOUR) return setError(t('site.contact.errorLimit'));
    setStatus('sending');
    try {
      await addDoc(collection(db(), 'contact_messages'), {
        name: form.name.trim().slice(0, 120),
        email: form.email.trim(),
        subject: form.subject.trim().slice(0, 160),
        message: form.message.trim().slice(0, 5000),
        createdAt: serverTimestamp(),
        status: 'new',
        source: 'website',
        locale: (i18n.language || 'en').slice(0, 12),
      });
      try {
        sessionStorage.setItem(LIMIT_KEY, JSON.stringify([...sends, Date.now()]));
      } catch {
        /* storage blocked: fine */
      }
      setSentTo(form.email.trim());
      setForm({ name: '', email: '', subject: '', message: '', website: '' });
      setStatus('sent');
    } catch {
      setStatus('error');
      setError(t('site.contact.errorSend'));
    }
  };

  return (
    <WebsiteLayout metaKey="contact" path="/contact">
      <section className="site-mesh -mt-20 pt-32 pb-10 sm:-mt-24 sm:pt-40">
        <Container className="flex flex-col items-center gap-3 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">{t('site.contact.title')}</h1>
          <p className="max-w-xl text-lg text-muted">{t('site.contact.subtitle')}</p>
        </Container>
      </section>
      <Container className="max-w-2xl py-10">
        <Reveal className="rounded-[2rem] border border-line bg-surface p-6 shadow-soft sm:p-8">
          {status === 'sent' ? (
            <div role="status" id="contact-success" className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle2 className="h-12 w-12 text-brand" strokeWidth={1.75} aria-hidden />
              <h2 className="text-2xl font-bold text-ink">{t('site.contact.successTitle')}</h2>
              <p className="text-body text-muted">{t('site.contact.successBody', { email: sentTo })}</p>
              <button type="button" onClick={() => setStatus('idle')} className="mt-2 min-h-11 rounded-full px-4 font-semibold text-primary-text hover:underline focus-visible:outline-2 focus-visible:outline-brand">
                {t('site.contact.sendAnother')}
              </button>
            </div>
          ) : (
            <form noValidate onSubmit={submit} className="grid gap-4 sm:grid-cols-2" aria-describedby={error ? 'contact-error' : undefined}>
              <Field id="contact-name" label={t('site.contact.name')}>
                <input id="contact-name" className={fieldCls} value={form.name} onChange={set('name')} autoComplete="name" required maxLength={120} />
              </Field>
              <Field id="contact-email" label={t('site.contact.email')}>
                <input id="contact-email" type="email" className={fieldCls} value={form.email} onChange={set('email')} autoComplete="email" required maxLength={254} />
              </Field>
              <Field id="contact-subject" label={t('site.contact.subject')} className="sm:col-span-2">
                <input id="contact-subject" className={fieldCls} value={form.subject} onChange={set('subject')} maxLength={160} />
              </Field>
              <Field id="contact-message" label={t('site.contact.message')} hint={t('site.contact.messageHint')} className="sm:col-span-2">
                <textarea id="contact-message" className={`${fieldCls} min-h-36 resize-y`} value={form.message} onChange={set('message')} required minLength={10} maxLength={5000} aria-describedby="contact-message-hint" />
              </Field>
              {/* Honeypot: hidden from people and screen readers */}
              <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
                <label htmlFor="contact-website">{t('site.contact.honeypot')}</label>
                <input id="contact-website" tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} />
              </div>
              {error && (
                <p id="contact-error" role="alert" className="flex items-start gap-2 rounded-2xl bg-danger-subtle px-4 py-3 text-small text-danger-text sm:col-span-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                  {error}
                </p>
              )}
              <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="submit"
                  id="contact-send"
                  disabled={status === 'sending'}
                  className="site-press inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 font-semibold text-on-primary shadow-float hover:bg-primary-pressed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-70"
                >
                  {status === 'sending' ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <Send className="h-5 w-5" strokeWidth={1.9} aria-hidden />}
                  {status === 'sending' ? t('site.contact.sending') : t('site.contact.send')}
                </button>
                {supportEmail && (
                  <p className="flex items-center gap-2 text-small text-muted">
                    <Mail className="h-4 w-4" strokeWidth={1.9} aria-hidden />
                    {t('site.contact.orEmail', { email: supportEmail })}
                  </p>
                )}
              </div>
            </form>
          )}
        </Reveal>
      </Container>
    </WebsiteLayout>
  );
}
