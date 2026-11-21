import React, { useEffect, useState } from 'react';
import { Tabs } from '../../components/ui';
import { HOME_SECTIONS, type Ribbon } from '../../domain/appConfig';
import { MediaPicker } from './MediaLibrary';
import { useTranslation } from 'react-i18next';
import { doc, getDoc } from 'firebase/firestore';
import { Button, Card, CardHeader, PageHeader, Skeleton, toast } from '../../components/ui';
import { db } from '../../lib/firebase';
import { ContentConfig, DEFAULT_CONTENT, type Banner } from '../../domain/appConfig';
import { SUPPORTED_LANGUAGES } from '../../domain/locale';
import { call, errorCode } from './api';
import { Field, inputCls } from './ui';

const langs = [...SUPPORTED_LANGUAGES];
const newBanner = (): Banner => ({ id: `b${Date.now().toString(36)}`, active: false, title: {}, body: {}, linkUrl: null, linkLabel: {}, imageUrl: null, startsAt: null, endsAt: null, countries: [] });
const newRibbon = (): Ribbon => ({ id: `r${Date.now().toString(36)}`, active: false, text: {}, linkUrl: null, startsAt: null, endsAt: null, countries: [] });
const codes = (v: string) => v.toUpperCase().split(/[^A-Z]+/).filter((c) => c.length === 2);
const StringsEditor = React.lazy(() => import('./StringsEditor'));
const PagesEditor = React.lazy(() => import('./PagesEditor'));
const MediaLibraryPage = React.lazy(() => import('./MediaLibrary'));

/** Tagline, home banners and the stories section (per language; empty fields fall back to the app's text). */
function HomeContent() {
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
              <Field label={t('admin.content.startsAt')}>
                <input type="date" className={inputCls} value={b.startsAt?.slice(0, 10) ?? ''} onChange={(e) => upBanner(i, { startsAt: e.target.value ? new Date(`${e.target.value}T00:00:00Z`).toISOString() : null })} />
              </Field>
              <Field label={t('admin.content.countries')} hint={t('admin.coupons.emptyAll')}>
                <input className={inputCls} defaultValue={b.countries.join(', ')} onBlur={(e) => upBanner(i, { countries: codes(e.target.value) })} />
              </Field>
            </div>
            <MediaPicker label={t('admin.content.image')} value={b.imageUrl} onChange={(url) => upBanner(i, { imageUrl: url })} />
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
      <Card className="flex flex-col gap-3" id="content-ribbons">
        <CardHeader title={t('admin.content.ribbons')} subtitle={t('admin.content.ribbonsHint')} />
        {cfg.ribbons.map((r, i) => {
          const up = (patch: Partial<Ribbon>) => setCfg({ ...cfg, ribbons: cfg.ribbons.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
          return (
            <fieldset key={r.id} className="flex flex-col gap-3 rounded-input border border-line p-3">
              <label className="flex items-center gap-3 text-small text-ink">
                <input type="checkbox" checked={r.active} onChange={(e) => up({ active: e.target.checked })} className="h-5 w-5 accent-[var(--primary)]" />
                {t('admin.content.active')}
              </label>
              <Field label={t('admin.content.ribbonText')}>
                <input className={inputCls} maxLength={120} value={r.text[lang] ?? ''} onChange={(e) => up({ text: { ...r.text, [lang]: e.target.value } })} />
              </Field>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <Field label={t('admin.content.link')}>
                  <input className={inputCls} value={r.linkUrl ?? ''} onChange={(e) => up({ linkUrl: e.target.value.trim() || null })} />
                </Field>
                <Field label={t('admin.content.startsAt')}>
                  <input type="date" className={inputCls} value={r.startsAt?.slice(0, 10) ?? ''} onChange={(e) => up({ startsAt: e.target.value ? new Date(`${e.target.value}T00:00:00Z`).toISOString() : null })} />
                </Field>
                <Field label={t('admin.content.endsAt')}>
                  <input type="date" className={inputCls} value={r.endsAt?.slice(0, 10) ?? ''} onChange={(e) => up({ endsAt: e.target.value ? new Date(`${e.target.value}T23:59:59Z`).toISOString() : null })} />
                </Field>
                <Field label={t('admin.content.countries')}>
                  <input className={inputCls} defaultValue={r.countries.join(', ')} onBlur={(e) => up({ countries: codes(e.target.value) })} />
                </Field>
              </div>
              <div>
                <Button size="sm" variant="ghost" onClick={() => setCfg({ ...cfg, ribbons: cfg.ribbons.filter((_, j) => j !== i) })}>
                  {t('admin.remove')}
                </Button>
              </div>
            </fieldset>
          );
        })}
        <div>
          <Button size="sm" variant="secondary" disabled={cfg.ribbons.length >= 10} onClick={() => setCfg({ ...cfg, ribbons: [...cfg.ribbons, newRibbon()] })}>
            {t('admin.content.addRibbon')}
          </Button>
        </div>
      </Card>
      <Card className="flex flex-col gap-3" id="content-home-sections">
        <CardHeader title={t('admin.content.homeSections')} subtitle={t('admin.content.homeSectionsHint')} />
        {(() => {
          const order = [...cfg.homeSections.map((x) => x.id), ...HOME_SECTIONS.filter((id) => !cfg.homeSections.some((x) => x.id === id))];
          const vis = (id: string) => cfg.homeSections.find((x) => x.id === id)?.visible ?? true;
          const write = (ids: string[], visible: (id: string) => boolean) => setCfg({ ...cfg, homeSections: ids.map((id) => ({ id: id as (typeof HOME_SECTIONS)[number], visible: visible(id) })) });
          return (
            <ol className="flex flex-col divide-y divide-line">
              {order.map((id, i) => (
                <li key={id} className="flex min-h-12 items-center gap-2 py-1.5">
                  <span className="w-6 text-caption text-muted tabular-nums">{i + 1}</span>
                  <span className="min-w-0 flex-1 text-small text-ink">{t(`admin.content.sections.${id}`)}</span>
                  <label className="flex items-center gap-1.5 text-caption text-ink">
                    <input type="checkbox" checked={vis(id)} onChange={(e) => write(order, (x) => (x === id ? e.target.checked : vis(x)))} />
                    {t('admin.content.visible')}
                  </label>
                  <Button size="sm" variant="ghost" disabled={i === 0} aria-label={t('admin.content.moveUp')} onClick={() => write(order.map((x, j) => (j === i - 1 ? id : j === i ? order[i - 1] : x)), vis)}>
                    ↑
                  </Button>
                  <Button size="sm" variant="ghost" disabled={i === order.length - 1} aria-label={t('admin.content.moveDown')} onClick={() => write(order.map((x, j) => (j === i + 1 ? id : j === i ? order[i + 1] : x)), vis)}>
                    ↓
                  </Button>
                </li>
              ))}
            </ol>
          );
        })()}
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

export default function ContentPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'home' | 'texts' | 'pages' | 'media'>('home');
  return (
    <div className="flex flex-col gap-4">
      <Tabs
        value={tab}
        onChange={setTab}
        ariaLabel={t('admin.nav.content')}
        items={[
          { id: 'home', label: t('admin.content.tabHome') },
          { id: 'texts', label: t('admin.content.tabTexts') },
          { id: 'pages', label: t('admin.content.tabPages') },
          { id: 'media', label: t('admin.content.tabMedia') },
        ]}
      />
      <React.Suspense fallback={<Skeleton className="h-40" />}>
        {tab === 'home' && <HomeContent />}
        {tab === 'texts' && <StringsEditor />}
        {tab === 'pages' && <PagesEditor />}
        {tab === 'media' && <MediaLibraryPage />}
      </React.Suspense>
    </div>
  );
}
