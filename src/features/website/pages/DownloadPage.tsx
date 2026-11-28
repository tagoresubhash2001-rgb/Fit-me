import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import qrcode from 'qrcode-generator';
import { Apple, Download, Globe, Loader2, QrCode, Smartphone, Sparkles } from 'lucide-react';
import { WebsiteLayout } from '../WebsiteLayout';
import { Container, Reveal, SiteButton } from '../ui';
import { list } from '../i18n';
import { currentDevice, isApple, type Device } from '../device';
import { iosMode, useAndroidRelease, useIosRelease } from '../release';
import { SITE_ORIGIN } from '../meta';
import { cn } from '../../../components/ui/cn';

function Steps({ items }: { items: string[] }) {
  return (
    <ol className="flex flex-col gap-3">
      {items.map((s, i) => (
        <li key={s} className="flex items-start gap-3 text-body text-ink">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-small font-bold text-primary-text tabular-nums">{i + 1}</span>
          <span className="pt-0.5">{s}</span>
        </li>
      ))}
    </ol>
  );
}

function OptionCard({ id, recommended, icon, title, children }: { id: string; recommended: boolean; icon: React.ReactNode; title: string; children: React.ReactNode }) {
  const { t } = useTranslation();
  return (
    <Reveal
      as="section"
      className={cn('relative flex flex-col gap-5 rounded-[2rem] border bg-surface p-6 shadow-soft sm:p-8', recommended ? 'border-brand ring-4 ring-[color:var(--mesh-1)]' : 'border-line')}
    >
      <div id={id} className="absolute -top-28" aria-hidden />
      {recommended && (
        <p className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-caption font-semibold text-on-primary" data-recommended={id}>
          <Sparkles className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          {t('site.download.recommended')}
        </p>
      )}
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-raised text-ink">{icon}</span>
        <h2 className="text-2xl font-bold tracking-tight text-ink">{title}</h2>
      </div>
      {children}
    </Reveal>
  );
}

function AndroidOption({ recommended }: { recommended: boolean }) {
  const { t } = useTranslation();
  const { loading, value: r } = useAndroidRelease();
  const facts = [
    r?.version ? t('site.download.android.version', { version: r.version }) : null,
    r?.sizeMB ? t('site.download.android.size', { size: r.sizeMB }) : null,
    r?.releaseDate ? t('site.download.android.released', { date: r.releaseDate }) : null,
  ].filter((f): f is string => !!f);
  return (
    <OptionCard id="android" recommended={recommended} icon={<Smartphone className="h-6 w-6" strokeWidth={1.9} aria-hidden />} title={t('site.download.android.title')}>
      <p className="text-body text-muted">{t('site.download.android.body')}</p>
      <div className="flex min-h-7 flex-wrap items-center gap-2" aria-live="polite">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted" aria-hidden />
        ) : (
          <>
            <span className="rounded-full bg-primary-subtle px-3 py-1 text-caption font-semibold text-primary-text">{t('site.download.android.latest')}</span>
            {facts.map((f) => (
              <span key={f} className="rounded-full bg-raised px-3 py-1 text-caption font-medium text-muted tabular-nums">
                {f}
              </span>
            ))}
          </>
        )}
      </div>
      <SiteButton to="/download/android" download id="download-android" icon={<Download className="h-5 w-5" strokeWidth={1.9} aria-hidden />} className="self-start">
        {t('site.download.android.button')}
      </SiteButton>
      <div className="rounded-3xl bg-raised p-5">
        <h3 className="mb-3 text-body font-bold text-ink">{t('site.download.android.guideTitle')}</h3>
        <Steps items={list<string>(t, 'site.download.android.guide')} />
      </div>
      {r?.releaseNotes && (
        <div>
          <h3 className="mb-1 text-body font-bold text-ink">{t('site.download.android.notesTitle')}</h3>
          <p className="text-small whitespace-pre-line text-muted">{r.releaseNotes}</p>
        </div>
      )}
    </OptionCard>
  );
}

function IosOption({ recommended }: { recommended: boolean }) {
  const { t } = useTranslation();
  const { loading, value: r } = useIosRelease();
  const mode = iosMode(r);
  return (
    <OptionCard id="ios" recommended={recommended} icon={<Apple className="h-6 w-6" strokeWidth={1.9} aria-hidden />} title={t('site.download.ios.title')}>
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted" aria-label={t('common.loading')} />
      ) : mode === 'appstore' && r?.appStoreUrl ? (
        <div className="flex flex-col gap-4" data-ios-mode="appstore">
          <p className="text-body text-muted">{t('site.download.ios.storeBody')}</p>
          <a id="download-appstore" href={r.appStoreUrl} target="_blank" rel="noopener noreferrer" className="self-start rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
            <img src="/badges/app-store.svg" alt={t('site.download.ios.storeBadge')} width={160} height={53} className="h-14 w-auto" />
          </a>
          {r.version && <p className="text-caption text-muted">{t('site.download.ios.version', { version: r.version })}</p>}
        </div>
      ) : mode === 'testflight' && r?.testflightUrl ? (
        <div className="flex flex-col gap-4" data-ios-mode="testflight">
          <p className="text-body text-muted">{t('site.download.ios.testflightBody')}</p>
          <SiteButton to={r.testflightUrl} external variant="dark" id="download-testflight" icon={<Apple className="h-5 w-5" strokeWidth={1.9} aria-hidden />} className="self-start">
            {t('site.download.ios.testflightButton')}
          </SiteButton>
          <div className="rounded-3xl bg-raised p-5">
            <Steps items={list<string>(t, 'site.download.ios.testflightGuide')} />
          </div>
          {r.version && <p className="text-caption text-muted">{t('site.download.ios.version', { version: r.version })}</p>}
        </div>
      ) : (
        <div className="flex flex-col gap-4" data-ios-mode="browser">
          <h3 className="text-lg font-bold text-ink">{t('site.download.ios.browserTitle')}</h3>
          <p className="text-body text-muted">{t('site.download.ios.browserBody')}</p>
          <SiteButton to="/app/" variant="dark" id="download-ios-browser" icon={<Globe className="h-5 w-5" strokeWidth={1.9} aria-hidden />} className="self-start">
            {t('site.cta.browser')}
          </SiteButton>
          <div className="rounded-3xl bg-raised p-5">
            <Steps items={list<string>(t, 'site.download.ios.browserGuide')} />
          </div>
        </div>
      )}
    </OptionCard>
  );
}

function BrowserOption({ recommended }: { recommended: boolean }) {
  const { t } = useTranslation();
  return (
    <OptionCard id="browser" recommended={recommended} icon={<Globe className="h-6 w-6" strokeWidth={1.9} aria-hidden />} title={t('site.download.browser.title')}>
      <p className="text-body text-muted">{t('site.download.browser.body')}</p>
      <SiteButton to="/app/" variant={recommended ? 'primary' : 'ghost'} id="download-browser" icon={<Globe className="h-5 w-5" strokeWidth={1.9} aria-hidden />} className="self-start">
        {t('site.download.browser.button')}
      </SiteButton>
      <p className="text-small text-muted">{t('site.download.browser.note')}</p>
    </OptionCard>
  );
}

/** QR code for the download page, generated in the browser (no third-party service). */
function DownloadQr() {
  const { t } = useTranslation();
  const svg = useMemo(() => {
    const qr = qrcode(0, 'M');
    qr.addData(`${SITE_ORIGIN}/download`);
    qr.make();
    return qr.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
  }, []);
  return (
    <Reveal className="glass-card flex flex-col items-center gap-5 rounded-[2rem] p-6 sm:flex-row sm:p-8">
      <div id="download-qr" role="img" aria-label={t('site.download.qrAlt')} className="h-40 w-40 shrink-0 rounded-2xl bg-white p-2 [&_svg]:h-full [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
      <div className="flex flex-col gap-2 text-center sm:text-start">
        <h2 className="flex items-center justify-center gap-2 text-xl font-bold text-ink sm:justify-start">
          <QrCode className="h-5 w-5 text-brand" strokeWidth={1.9} aria-hidden />
          {t('site.download.qrTitle')}
        </h2>
        <p className="text-body text-muted">{t('site.download.qrBody')}</p>
      </div>
    </Reveal>
  );
}

export function DownloadPage() {
  const { t } = useTranslation();
  const [device] = useState<Device>(() => currentDevice());
  const recommended = device === 'android' ? 'android' : isApple(device) ? 'ios' : 'browser';
  const order: ('android' | 'ios' | 'browser')[] = device === 'android' ? ['android', 'ios', 'browser'] : isApple(device) ? ['ios', 'browser', 'android'] : ['browser', 'android', 'ios'];
  return (
    <WebsiteLayout metaKey="download" path="/download">
      <section className="site-mesh -mt-20 pt-32 pb-10 sm:-mt-24 sm:pt-40">
        <Container className="flex flex-col items-center gap-3 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">{t('site.download.title')}</h1>
          <p className="max-w-xl text-lg text-muted">{t('site.download.subtitle')}</p>
        </Container>
      </section>
      <Container className="flex flex-col gap-10 py-10">
        <div data-device={device} className="hidden" />
        {device === 'desktop' && <DownloadQr />}
        <div className="grid items-start gap-10 lg:grid-cols-2">
          {order.map((o) =>
            o === 'android' ? <AndroidOption key={o} recommended={recommended === 'android'} /> : o === 'ios' ? <IosOption key={o} recommended={recommended === 'ios'} /> : <BrowserOption key={o} recommended={recommended === 'browser'} />,
          )}
        </div>
      </Container>
    </WebsiteLayout>
  );
}
