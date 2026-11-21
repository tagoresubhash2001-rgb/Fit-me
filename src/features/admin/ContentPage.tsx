import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { doc, getDoc } from 'firebase/firestore';
import { Button, Card, CardHeader, PageHeader, Skeleton, toast } from '../../components/ui';
import { db } from '../../lib/firebase';
import { ContentConfig, DEFAULT_CONTENT, type Banner } from '../../domain/appConfig';
import { SUPPORTED_LANGUAGES } from '../../domain/locale';
import { call, errorCode } from './api';
import { Field, inputCls } from './ui';

const langs = [...SUPPORTED_LANGUAGES];
const newBanner = (): Banner => ({ id: `b${Date.now().toString(36)}`, active: false, title: {}, body: {}, linkUrl: null, linkLabel: {}, endsAt: null });

/** Tagline, home banners and the stories section (per language; empty fields fall back to the app's text). */
export default function ContentPage() {
  const { t } = useTranslation();
  const [cfg, setCfg] = useState<ContentConfig | null>(null);
  const [lang, setLang] = useState('en');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    getDoc(doc(db(), 'appConfig/content'))
      .then((s) => setCfg(ContentConfig.safeParse(s.data() ?? {}).data ?? DEFAULT_CONTENT))
      .catch(() => setCfg(DEFAULT_CONTENT));
  }, []);
  if (!cfg) return <Skeleton className="h-64" />;
  const setMap = (key: 'tagline' | 'testimonialsTitle', v: string) => setCfg({ ...cfg, [key]: { ...cfg[key], [lang]: v } });
  const upBanner = (i: number, patch: Partial<Banner>) => setCfg({ ...cfg, banners: cfg.banners.map((b, j) => (j === i ? { ...b, ...patch } : b)) });
  const valid = ContentConfig.safeParse(cfg);
  return (
    <div className="flex flex-col gap-4" id="admin-content">
      <PageHeader
        title={t('admin.nav.content')}
        actions={
          <select aria-label={t('admin.content.language')} className={inputCls} value={lang} onChange={(e) => setLang(e.target.value)}>
            {langs.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        }
      />
      <Card className="flex flex-col gap-3">
        <CardHeader title={t('admin.content.texts')} subtitle={t('admin.content.textsHint')} />
        <Field label={t('admin.content.tagline')} hint={t('admin.content.default', { text: t('app.tagline') })}>
          <input id="content-tagline" className={inputCls} maxLength={80} value={cfg.tagline[lang] ?? ''} onChange={(e) => setMap('tagline', e.target.value)} />
        </Field>
        <Field label={t('admin.content.storiesTitle')} hint={t('admin.content.default', { text: t('stories.title') })}>
          <input className={inputCls} maxLength={80} value={cfg.testimonialsTitle[lang] ?? ''} onChange={(e) => setMap('testimonialsTitle', e.target.value)} />
        </Field>
        <label className="flex items-center gap-3 text-small text-ink">
          <input type="checkbox" checked={cfg.testimonialsVisible} onChange={(e) => setCfg({ ...cfg, testimonialsVisible: e.target.checked })} className="h-5 w-5 accent-[var(--primary)]" />
          {t('admin.content.showStories')}
        </label>
      </Card>
      <Card className="flex flex-col gap-3">
        <CardHeader title={t('admin.content.banners')} subtitle={t('admin.content.bannersHint')} />
        {cfg.banners.map((b, i) => (
          <fieldset key={b.id} className="flex flex-col gap-3 rounded-input border border-line p-3">
            <legend className="px-1 text-small font-semibold text-ink">{b.title.en || b.id}</legend>
            <label className="flex items-center gap-3 text-small text-ink">
              <input type="checkbox" checked={b.active} onChange={(e) => upBanner(i, { active: e.target.checked })} className="h-5 w-5 accent-[var(--primary)]" />
              {t('admin.content.active')}
            </label>
            <Field label={t('admin.content.bannerTitle')}>
              <input className={inputCls} maxLength={80} value={b.title[lang] ?? ''} onChange={(e) => upBanner(i, { title: { ...b.title, [lang]: e.target.value } })} />
            </Field>
            <Field label={t('admin.content.bannerBody')}>
              <input className={inputCls} maxLength={240} value={b.body[lang] ?? ''} onChange={(e) => upBanner(i, { body: { ...b.body, [lang]: e.target.value } })} />
            </Field>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Field label={t('admin.content.link')} hint={t('admin.content.linkHint')}>
                <input className={inputCls} maxLength={200} value={b.linkUrl ?? ''} onChange={(e) => upBanner(i, { linkUrl: e.target.value.trim() || null })} />
              </Field>
              <Field label={t('admin.content.linkLabel')}>
                <input className={inputCls} maxLength={40} value={b.linkLabel[lang] ?? ''} onChange={(e) => upBanner(i, { linkLabel: { ...b.linkLabel, [lang]: e.target.value } })} />
              </Field>
              <Field label={t('admin.content.endsAt')}>
                <input type="date" className={inputCls} value={b.endsAt?.slice(0, 10) ?? ''} onChange={(e) => upBanner(i, { endsAt: e.target.value ? new Date(`${e.target.value}T23:59:59Z`).toISOString() : null })} />
              </Field>
            </div>
            <div>
              <Button size="sm" variant="ghost" onClick={() => setCfg({ ...cfg, banners: cfg.banners.filter((_, j) => j !== i) })}>
                {t('admin.content.removeBanner')}
              </Button>
            </div>
          </fieldset>
        ))}
        <div>
          <Button size="sm" variant="secondary" disabled={cfg.banners.length >= 10} onClick={() => setCfg({ ...cfg, banners: [...cfg.banners, newBanner()] })}>
            {t('admin.content.addBanner')}
          </Button>
        </div>
      </Card>
      {!valid.success && <p className="text-small text-danger-text">{t('admin.content.invalid')}</p>}
      <div>
        <Button
          id="save-content"
          loading={busy}
          disabled={!valid.success}
          onClick={async () => {
            setBusy(true);
            try {
              const r = await call<{ version: number }>('adminSaveContent', { config: cfg });
              toast(t('admin.savedVersion', { version: r.version }), 'success');
            } catch (e) {
              toast(errorCode(e), 'error');
            } finally {
              setBusy(false);
            }
          }}
        >
          {t('admin.save')}
        </Button>
      </div>
    </div>
  );
}
